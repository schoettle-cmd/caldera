/**
 * Inbox Hero headless sync (Mike 2026-11-06: "is it being used or not in a regular daily sync structure?").
 *
 * Runs the plugin's own IhSyncEngine (src/ihsync.ts) from Node, without Obsidian, so the daily sync does not depend on
 * Obsidian being open (or responsive). launchd starts it every 5 minutes (headless/install.sh):
 *   1. GET /api/obsidian/poll: is a "Sync now" from the Inbox Hero app waiting?
 *   2. sync when asked, or once a day after the scheduled time (default 04:30 America/Los_Angeles; a Mac asleep at
 *      4:30 syncs at the next check after it wakes), then POST /api/obsidian/report with counts and the schedule.
 *
 * - Read-only on the vault: it lists and reads .md files. It never writes inside the vault, data.json included.
 * - The token, API and folder scope come from the plugin's data.json (ihSync), read each run, so a re-pair in Obsidian
 *   carries over. The token is never written to this runner's state, never logged.
 * - Its own state (~/.ih-obsidian-sync/state.json): what Inbox Hero already has (path -> hash), so only changes go up.
 *   First run seeds it from the plugin's own list.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { IhSyncEngine, IhSyncState, CacheLike, ihApiOk, IH_API_DEFAULT, scopeOf, scopeEmpty } from "../src/ihsync";

export interface Schedule { daily: string; tz: string }
export interface RunnerState { sent?: Record<string, string>; lastSync?: number; lastScheduledDay?: string; lastResult?: { sent: number; removed: number; unchanged: number; skipped: number; at: string; why: string }; lastError?: string }

// ---- frontmatter, links and tags the way Obsidian's metadataCache gives them (enough for titles, aliases, tags and
// private: true; the upload hash is of the body only, so it matches the plugin's whatever this parser makes of YAML) ----
function scalar(v: string): unknown {
  const t = v.trim();
  if (/^(["']).*\1$/.test(t)) return t.slice(1, -1);
  if (/^(true|false)$/i.test(t)) return /^true$/i.test(t);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (/^\[.*\]$/.test(t)) return t.slice(1, -1).split(",").map(x => scalar(x)).filter(x => x !== "");
  if (t === "" || t === "~" || t === "null") return null;
  return t;
}
export function parseFrontmatter(text: string): Record<string, unknown> {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text); if (!m) return {};
  const out: Record<string, unknown> = {}; let key = "";
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s+-\s*(.*)$/.exec(line) || (key ? /^-\s+(.*)$/.exec(line) : null);
    if (item && key) { const cur = out[key]; out[key] = [...(Array.isArray(cur) ? cur : []), scalar(item[1])]; continue; }
    const kv = /^([A-Za-z0-9_][\w .-]*?)\s*:\s*(.*)$/.exec(line);
    if (kv) { key = kv[1]; out[key] = kv[2].trim() === "" ? [] : scalar(kv[2]); }
  }
  for (const k of Object.keys(out)) if (Array.isArray(out[k]) && !(out[k] as unknown[]).length && !/^(tags?|aliases?)$/i.test(k)) out[k] = null;
  return out;
}
export function cacheFromText(text: string): CacheLike {
  const body = text.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "").replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const links = [...body.matchAll(/!?\[\[([^\]\n]+?)\]\]/g)].map(m => ({ link: m[1].split("|")[0].trim() }));
  const tags = [...body.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]*[\p{L}_/-][\p{L}\p{N}_/-]*)/gu)].map(m => ({ tag: "#" + m[1] }));
  return { frontmatter: parseFrontmatter(text), links, tags };
}

// ---- the vault on disk, read-only (hidden folders like .obsidian and .trash are not part of the vault, as in Obsidian) ----
/** Obsidian's normalizePath for a vault path: NFC (macOS stores names decomposed) and plain spaces for non-breaking ones. */
export const obsPath = (p: string) => p.replace(/\u00A0|\u202F/g, " ").normalize("NFC");
export function diskVault(root: string) {
  const memo = new Map<string, string>(), real = new Map<string, string>();   // vault path -> path on disk
  const read = (p: string) => { let t = memo.get(p); if (t === undefined) { t = fs.readFileSync(path.join(root, real.get(p) ?? p), "utf8"); memo.set(p, t); } return t; };
  return {
    getMarkdownFiles() {
      const out: { path: string; stat: { mtime: number; size: number } }[] = [];
      const walk = (rel: string) => {
        for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
          if (e.name.startsWith(".")) continue;
          const p = rel ? rel + "/" + e.name : e.name;
          if (e.isDirectory()) walk(p);
          else if (e.isFile() && /\.md$/i.test(e.name)) { const st = fs.statSync(path.join(root, p)), vp = obsPath(p); real.set(vp, p); out.push({ path: vp, stat: { mtime: st.mtimeMs, size: st.size } }); }
        }
      };
      walk(""); return out;
    },
    cachedRead: async (f: { path: string }) => read(f.path),
    cacheOf: (p: string): CacheLike | null => { try { return cacheFromText(read(p)); } catch { return null; } },
  };
}

// ---- schedule ----
/** "YYYY-MM-DD" and minutes after midnight for instant t in zone tz */
export function localDay(t: number, tz: string): { day: string; minutes: number } {
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t))) p[x.type] = x.value;
  return { day: `${p.year}-${p.month}-${p.day}`, minutes: (+p.hour % 24) * 60 + +p.minute };
}
/** Is the daily run due: past today's time and not yet run today (by the zone's calendar)? */
export function dailyDue(sch: Schedule, st: RunnerState, t = Date.now()): boolean {
  const m = /^(\d\d):(\d\d)$/.exec(sch.daily); if (!m) return false;
  const { day, minutes } = localDay(t, sch.tz);
  return minutes >= +m[1] * 60 + +m[2] && st.lastScheduledDay !== day;
}

// ---- one check ----
export interface RunOpts {
  vault: string; stateFile: string; schedule: Schedule; force?: boolean; runner?: string;
  fetchImpl?: typeof fetch; now?: () => number; log?: (s: string) => void;
}
export async function runOnce(o: RunOpts): Promise<{ ran: boolean; why: string; result?: RunnerState["lastResult"]; error?: string }> {
  const log = o.log || (() => {}), now = o.now || Date.now, f = o.fetchImpl || fetch;
  const dataFile = path.join(o.vault, ".obsidian", "plugins", "caldera", "data.json");
  const plugin = JSON.parse(fs.readFileSync(dataFile, "utf8"))?.ihSync as IhSyncState | undefined;
  if (!plugin?.token) return { ran: false, why: "not paired" };
  const api = ihApiOk(plugin.api || IH_API_DEFAULT); if (!api) return { ran: false, why: "bad api" };
  if (scopeEmpty(scopeOf(plugin))) return { ran: false, why: "no folders chosen" };
  let st: RunnerState = {}; try { st = JSON.parse(fs.readFileSync(o.stateFile, "utf8")); } catch { /* first run */ }
  if (!st.sent) st.sent = { ...(plugin.sent || {}) };   // seed from what the plugin already sent
  const auth = { authorization: "Bearer " + plugin.token, "content-type": "application/json" };

  let requested = false;
  try { const r = await f(api + "/api/obsidian/poll", { headers: auth }); if (r.status === 401) return save(o, st, { ran: false, why: "token refused (401)", error: "Inbox Hero refused the token: re-pair in Obsidian" }); if (r.ok) requested = !!(await r.json())?.syncRequested; }
  catch (e: any) { /* offline: the daily run still tries below and fails loudly */ }
  const due = dailyDue(o.schedule, st, now());
  const why = o.force ? "manual" : requested ? "sync now" : due ? "daily" : "";
  if (!why) return { ran: false, why: "not due" };

  const v = diskVault(o.vault);
  // the engine's state: the plugin's token/scope, this runner's own sent list (the token is never saved by us)
  const es: IhSyncState = { token: plugin.token, api, scope: plugin.scope, folder: plugin.folder, sent: st.sent };
  const req = async (r: { url: string; method: string; headers: Record<string, string>; body?: string }) => {
    const res = await f(r.url, { method: r.method, headers: r.headers, body: r.body }); let json: any = null; try { json = await res.json(); } catch { /* not JSON */ }
    return { status: res.status, json };
  };
  const eng = new IhSyncEngine(es, v, p => v.cacheOf(p), req, path.basename(o.vault));
  try {
    const r = await eng.sync(false);
    st.sent = es.sent; st.lastSync = now(); st.lastError = undefined;
    if (why === "daily" || due) st.lastScheduledDay = localDay(now(), o.schedule.tz).day;
    st.lastResult = { sent: r.sent, removed: r.removed, unchanged: r.unchanged, skipped: r.skipped.length, at: new Date(now()).toISOString(), why };
    try { await f(api + "/api/obsidian/report", { method: "POST", headers: auth, body: JSON.stringify({ source: o.runner || "tron", sent: r.sent, removed: r.removed, unchanged: r.unchanged, skipped: r.skipped.length, schedule: { ...o.schedule, runner: "tron-launchd" } }) }); }
    catch (e: any) { log("report failed: " + e.message); }
    log(`synced (${why}): ${r.sent} sent, ${r.removed} removed, ${r.unchanged} unchanged, ${r.skipped.length} skipped`);
    return save(o, st, { ran: true, why, result: st.lastResult });
  } catch (e: any) {
    st.sent = es.sent;   // progress so far is kept, as in the plugin
    return save(o, st, { ran: false, why, error: String(e?.message || e) });
  }
}
function save<T extends { error?: string }>(o: RunOpts, st: RunnerState, out: T): T {
  if (out.error) st.lastError = out.error;
  fs.mkdirSync(path.dirname(o.stateFile), { recursive: true, mode: 0o700 });
  const tmp = o.stateFile + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(st), { mode: 0o600 }); fs.renameSync(tmp, o.stateFile);
  return out;
}

// ---- CLI (launchd): node ih-sync.mjs [--now] [--vault DIR] [--state FILE] [--daily HH:MM] [--tz ZONE] ----
async function main() {
  const a = process.argv.slice(2), arg = (k: string, d: string) => { const i = a.indexOf(k); return i >= 0 && a[i + 1] ? a[i + 1] : d; };
  const home = os.homedir(), dir = path.join(home, ".ih-obsidian-sync");
  const opts: RunOpts = { vault: arg("--vault", path.join(home, "claude-obsidian")), stateFile: arg("--state", path.join(dir, "state.json")),
    schedule: { daily: arg("--daily", "04:30"), tz: arg("--tz", "America/Los_Angeles") }, force: a.includes("--now"),
    log: s => console.log(new Date().toISOString() + " " + s) };
  // one run at a time (a big first sync can outlast the 5-minute interval)
  const lock = path.join(dir, "run.lock"); fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { const st = fs.statSync(lock); if (Date.now() - st.mtimeMs < 30 * 60e3) { opts.log!("another run is in progress"); return; } fs.unlinkSync(lock); } catch { /* no lock */ }
  fs.writeFileSync(lock, String(process.pid), { flag: "wx" });
  try {
    const r = await runOnce(opts);
    if (r.error) { opts.log!(`sync failed (${r.why}): ${r.error}`); process.exitCode = 1; }
    else if (!r.ran && r.why !== "not due") opts.log!("skipped: " + r.why);
  } finally { try { fs.unlinkSync(lock); } catch { /* gone */ } }
}
if (process.argv[1] && /ih-sync\.mjs$/.test(process.argv[1])) void main();
