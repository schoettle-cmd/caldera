// Inbox Hero headless sync (headless/ih-sync.ts): frontmatter/tags/links parsing, the daily schedule, and one run against
// a temp vault and a fake Inbox Hero: polls first, syncs only when due or asked, reports counts, never writes the vault,
// never saves the token.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { parseFrontmatter, cacheFromText, dailyDue, localDay, runOnce, diskVault, obsPath } from "./ihheadless.build.mjs";

const TOKEN = "iho_" + "A".repeat(20) + "b1_-" + "x".repeat(19);
const SCH = { daily: "04:30", tz: "America/Los_Angeles" };

test("frontmatter: scalars, inline and block lists, private flag", () => {
  const fm = parseFrontmatter("---\ntitle: \"Hi there\"\nprivate: true\ntags: [a, b]\naliases:\n  - Jo\n  - J. A.\nn: 3\n---\nbody");
  assert.deepEqual(fm, { title: "Hi there", private: true, tags: ["a", "b"], aliases: ["Jo", "J. A."], n: 3 });
  assert.deepEqual(parseFrontmatter("no frontmatter"), {});
});
test("links and tags: wikilinks and embeds, inline tags outside code", () => {
  const c = cacheFromText("---\na: 1\n---\nSee [[Jordan Avery|Jordan]] and ![[pic.png]] #work #2026x\n`#nottag` ```\n#incode\n``` end #private");
  assert.deepEqual(c.links.map(l => l.link), ["Jordan Avery", "pic.png"]);
  assert.deepEqual(c.tags.map(t => t.tag), ["#work", "#2026x", "#private"]);
});
test("daily: due after 4:30 Pacific once per Pacific day", () => {
  const before = Date.parse("2026-11-07T12:29:00Z"), after = Date.parse("2026-11-07T12:31:00Z");
  assert.equal(localDay(after, SCH.tz).day, "2026-11-07");
  assert.equal(dailyDue(SCH, {}, before), false);
  assert.equal(dailyDue(SCH, {}, after), true);
  assert.equal(dailyDue(SCH, { lastScheduledDay: "2026-11-07" }, after), false);
  assert.equal(dailyDue(SCH, { lastScheduledDay: "2026-11-06" }, Date.parse("2026-11-07T23:00:00Z")), true, "a Mac asleep at 4:30 catches up later that day");
});

function vault(files, ih) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ihh-"));
  for (const [p, t] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), t); }
  fs.mkdirSync(path.join(dir, ".obsidian/plugins/caldera"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".obsidian/plugins/caldera/data.json"), JSON.stringify({ other: 1, ihSync: ih }));
  return dir;
}
function fakeIh(opts = {}) {
  const calls = [], store = new Map();
  const f = async (url, init = {}) => {
    const u = new URL(url), body = init.body ? JSON.parse(init.body) : null; calls.push({ path: u.pathname, method: init.method || "GET", body, auth: init.headers?.authorization });
    const res = (status, json) => ({ status, ok: status < 300, json: async () => json });
    if (init.headers?.authorization !== "Bearer " + TOKEN) return res(401, { error: "revoked" });
    if (u.pathname === "/api/obsidian/poll") return res(200, { ok: true, syncRequested: !!opts.requested });
    if (u.pathname === "/api/obsidian/limits") return res(200, { maxNoteBytes: 2e6, maxTotalBytes: 5e7, maxNotes: 10000, maxBatchNotes: 100, maxBatchBytes: 4e6, folder: "wiki", notes: store.size });
    if (u.pathname === "/api/obsidian/notes") { for (const n of body.notes) store.set(n.path, n); return res(200, { ok: true, accepted: body.notes.length, unchanged: 0, rejected: [] }); }
    if (u.pathname === "/api/obsidian/notes/delete") { body.paths.forEach(p => store.delete(p)); return res(200, { ok: true }); }
    if (u.pathname === "/api/obsidian/report") return res(200, { ok: true });
    return res(404, {});
  };
  return { f, calls, store };
}
const IH = { token: TOKEN, api: "https://joininboxhero.com", scope: { mode: "folders", include: ["wiki"], skipPrivate: true }, folder: "wiki", sent: {} };
const snap = dir => { const o = {}; const w = r => { for (const e of fs.readdirSync(path.join(dir, r), { withFileTypes: true })) { const p = r ? r + "/" + e.name : e.name; if (e.isDirectory()) w(p); else o[p] = fs.readFileSync(path.join(dir, p), "utf8"); } }; w(""); return o; };

test("run: not due and not asked = one poll and nothing else", async () => {
  const dir = vault({ "wiki/a.md": "A" }, IH), ih = fakeIh(), stateFile = path.join(dir, "..", path.basename(dir) + ".state.json");
  const r = await runOnce({ vault: dir, stateFile, schedule: SCH, fetchImpl: ih.f, now: () => Date.parse("2026-11-07T12:00:00Z") });
  assert.equal(r.ran, false); assert.deepEqual(ih.calls.map(c => c.path), ["/api/obsidian/poll"]);
});
test("run: Sync now from the app syncs the folder only, skips private and secret notes, reports, leaves the vault alone", async () => {
  const dir = vault({ "wiki/a.md": "---\ntags: [x]\n---\nAlpha [[b]]", "wiki/sub/b.md": "Beta", "wiki/p.md": "---\nprivate: true\n---\nsecret life", "wiki/k.md": "aws AKIAABCDEFGHIJKLMNOP", "other/c.md": "out of scope" }, IH);
  const before = snap(dir), ih = fakeIh({ requested: true }), stateFile = dir + ".state.json";
  const r = await runOnce({ vault: dir, stateFile, schedule: SCH, fetchImpl: ih.f, now: () => Date.parse("2026-11-07T12:00:00Z") });
  assert.equal(r.ran, true); assert.equal(r.why, "sync now");
  assert.deepEqual([...ih.store.keys()].sort(), ["wiki/a.md", "wiki/sub/b.md"]);
  assert.deepEqual(ih.store.get("wiki/a.md").tags, ["x"]); assert.deepEqual(ih.store.get("wiki/a.md").wikilinks, ["b"]);
  const rep = ih.calls.find(c => c.path === "/api/obsidian/report");
  assert.equal(rep.body.sent, 2); assert.equal(rep.body.source, "tron"); assert.equal(rep.body.schedule.daily, "04:30");
  assert.deepEqual(snap(dir), before, "vault and data.json untouched");
  const saved = fs.readFileSync(stateFile, "utf8"); assert.ok(!saved.includes(TOKEN), "token never saved"); assert.ok(!saved.includes("iho_"));
  // next daily run with nothing changed sends nothing new
  const ih2 = fakeIh();
  const r2 = await runOnce({ vault: dir, stateFile, schedule: SCH, fetchImpl: ih2.f, now: () => Date.parse("2026-11-07T13:00:00Z") });
  assert.equal(r2.why, "daily"); assert.equal(r2.result.sent, 0); assert.equal(r2.result.unchanged, 2);
  assert.equal(JSON.parse(fs.readFileSync(stateFile, "utf8")).lastScheduledDay, "2026-11-07");
});
test("run: seeds from the plugin's sent list, and a 401 is reported, not retried", async () => {
  const dir = vault({ "wiki/a.md": "A" }, { ...IH, token: "iho_" + "Z".repeat(43) }), ih = fakeIh();
  const r = await runOnce({ vault: dir, stateFile: dir + ".s.json", schedule: SCH, force: true, fetchImpl: ih.f });
  assert.equal(r.ran, false); assert.match(r.error, /refused the token/); assert.equal(ih.calls.length, 1);
});
test("paths as Obsidian names them: NFC and plain spaces, read from the real file on disk", async () => {
  const nfd = "wiki/Oce\u0301ane\u00A0trip.md", dir = vault({ [nfd]: "hello" }, IH), v = diskVault(dir);
  const files = v.getMarkdownFiles(); assert.equal(files.length, 1);
  assert.equal(files[0].path, "wiki/Oc\u00e9ane trip.md"); assert.equal(obsPath(nfd), files[0].path);
  assert.equal(await v.cachedRead(files[0]), "hello");
});
