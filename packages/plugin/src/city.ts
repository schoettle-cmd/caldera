/**
 * Caldera City (the Obsidian Visualizer): your GitHub as a little isometric city, your Obsidian notes as the
 * houses around it. Districts = projects, towers = repos (height = commits this year), lit windows = this week's
 * commits, cranes = being built right now, cars = commit traffic, houses = notes that link to the project.
 *
 * Pure: repos + notes -> data -> one self-contained page (inline canvas renderer, no network).
 * Privacy: publicCity() keeps public repos by name and folds private repos of a public project into one
 * unnamed tower per district; projects that aren't on the public profile are left out entirely.
 */

import { GROWTH_LAYOUT_JS, GROWTH_DRAW_JS } from "./citygrowth";
import { BATTLE_DRAW_JS } from "./citybattle";
import { HIFI_JS } from "./cityhifi";
export { HIFI_JS, BATTLE_DRAW_JS };
export interface CityRepo {
  name: string; project: string; public: boolean; language: string;
  commits: number; weeks: number[]; week: number; today: number;
  pushed?: string; created?: string; size?: number; url?: string; description?: string;
  locked?: boolean;                                   // a private repo on the public page: shape only, no details
  priv?: boolean;                                     // a private repo shown by name ("named" mode): name, language and activity, never code, links or descriptions
  sites?: string[];                                   // the websites this repo runs (hostnames), so live visitors stand in its building
  kind?: "app" | "site";                              // not a repo: an app or website the owner listed (a storefront; see listings.ts)
  meta?: { store?: "apple" | "play"; icon?: string; genre?: string; rating?: number; ratings?: number; desc?: string; host?: string; on?: string };   // on: the repo it is built from, only when that repo stands in the same district by name (its sign hangs there)
  pv?: boolean;                                       // a listing placed beside a private repo: moves to "Apps & sites" if private work turns anonymous
}
/** Hostnames from a homepage URL, a host, or a list of them: "https://www.kitse.co/x" -> "kitse.co". At most 6. */
export function cleanSites(v: unknown): string[] | undefined {
  const out: string[] = [];
  for (const x of (Array.isArray(v) ? v : [v])) {
    let h = String(x ?? "").trim().toLowerCase(); if (!h) continue;
    try { h = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(h) ? h : "https://" + h).hostname; } catch { continue; }
    h = h.replace(/^www\./, "");
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && h.length <= 253 && h !== "github.com" && h !== "github.io" && !out.includes(h)) out.push(h);   // a github.io page is a real site; the repo page is not
    if (out.length >= 6) break;
  }
  return out.length ? out : undefined;
}
export interface CityDistrict { name: string; notes: number; notePaths?: string[]; repos: CityRepo[]; apart?: boolean }   // apart: the anonymous private district, laid out on its own
export interface CityData { generated?: string; kind?: "vault"; districts: CityDistrict[]; private: boolean; totals?: { commits: number; active: number }; under?: Underground; privateMode?: PrivateMode }

/** How a member's private repos show on their PUBLIC city (their own private view always shows everything):
 *  show = padlocked buildings in place (size and activity coarse, never names); anonymous = one separate "Private" district
 *  of identical padlocks, the count only as a small/medium/large cluster, no activity, no project, no commits;
 *  hidden = private repos leave no trace at all; named = private repos stand in their real districts with their names,
 *  language colours and activity, exactly like the private view, but with no links, descriptions or code. */
export type PrivateMode = "show" | "anonymous" | "hidden" | "named";
export const PRIVATE_MODES: PrivateMode[] = ["show", "anonymous", "hidden", "named"];
export const privateModeOf = (v: unknown): PrivateMode | undefined => PRIVATE_MODES.includes(v as PrivateMode) ? v as PrivateMode : undefined;
/** anonymous: how many identical padlocks stand for N private repos (1-5, 6-20, more), never the real count */
export const privateCluster = (n: number) => n <= 0 ? 0 : n <= 5 ? 3 : n <= 20 ? 8 : 15;

/** The Underground: the Obsidian vault under the city. Notes are nodes (size = notes linking in), links are tunnels,
 *  depth = age, and notes about a project sit under its district with light roots up into the buildings. */
export type NoteKind = "concept" | "entity" | "source" | "day" | "garden" | "note";
export interface UNode { t?: string; p?: string; k: NoteKind; n: number; o: number; a: number; m: number; d?: string; g?: string }
export interface Underground { nodes: UNode[]; edges: [number, number][]; total: number; links: number; orphans: number; sediment: Partial<Record<NoteKind, number>>; editedToday: number }
export interface VaultNote { path: string; title: string; ctime: number; mtime: number; out: string[] }

export function noteKind(path: string, garden: boolean): NoteKind {
  if (garden) return "garden";
  const p = path.toLowerCase();
  if (/(^|\/)(daily|digest|journal|daily-digest)|(^|\/)\d{4}-\d{2}-\d{2}/.test(p)) return "day";
  if (/(^|\/)concepts?\//.test(p)) return "concept";
  if (/(^|\/)(entities|people|companies|orgs?|contacts)\//.test(p)) return "entity";
  if (/(^|\/)(sources?|raw|clippings?|emails?|inbox|transcripts?|meetings?)\//.test(p)) return "source";
  return "note";
}

/** Pure: vault notes + project hub notes -> the Underground (top ~320 notes, links among them, the rest as sediment). */
const PLUMBING = /^(_?index|hot|log|logs?|readme|home|start here|moc|maps? of content|toc|table of contents|inbox|dashboard|overview)$/i;   // vault plumbing, not knowledge
export function underground(all: VaultNote[], hubs: Record<string, string>, gardenSlug: (title: string) => string | undefined, now = Date.now(), max = 320): Underground {
  const notes = all.filter(n => !PLUMBING.test(n.title.trim()));
  const byPath = new Map(notes.map(n => [n.path, n]));
  const inb = new Map<string, number>(), DAY = 86_400_000;
  let links = 0;
  for (const n of notes) for (const t of new Set(n.out)) if (byPath.has(t) && t !== n.path) { inb.set(t, (inb.get(t) || 0) + 1); links++; }
  // a note belongs under a district when it links to (or is linked from) that project's hub note
  const anchor = new Map<string, string>(), hubOf = new Map(Object.entries(hubs).map(([proj, path]) => [path, proj]));
  for (const [proj, hp] of Object.entries(hubs)) anchor.set(hp, proj);
  // strongest: the note links to exactly one project's note. Weaker: a minor note (<= 3 links in) that one project links to.
  for (const n of notes) if (!anchor.has(n.path)) { const hs = [...new Set(n.out.filter(t => hubOf.has(t)))]; if (hs.length === 1 && (inb.get(n.path) || 0) <= 40) anchor.set(n.path, hubOf.get(hs[0])!); }
  for (const [proj, hp] of Object.entries(hubs)) for (const t of byPath.get(hp)?.out || []) if (byPath.has(t) && !anchor.has(t) && (inb.get(t) || 0) <= 3) anchor.set(t, proj);
  const outN = (n: VaultNote) => new Set(n.out.filter(t => byPath.has(t) && t !== n.path)).size;
  const score = (n: VaultNote) => (inb.get(n.path) || 0) * 2 + outN(n) * 0.5 + (anchor.has(n.path) ? 3 : 0) + (hubOf.has(n.path) ? 1000 : 0) + (now - n.mtime < 2 * DAY ? 4 : 0);
  const picked = [...notes].sort((a, b) => score(b) - score(a)).slice(0, max);
  const idx = new Map(picked.map((n, i) => [n.path, i]));
  const nodes: UNode[] = picked.map(n => {
    const g = gardenSlug(n.title);
    return { t: n.title, p: n.path, k: noteKind(n.path, !!g), n: inb.get(n.path) || 0, o: outN(n), a: Math.max(0, Math.round((now - n.ctime) / DAY)), m: Math.max(0, Math.round((now - n.mtime) / DAY)), d: anchor.get(n.path), g };
  });
  const seen = new Set<string>(), edges: [number, number][] = [];
  const deg = (i: number) => nodes[i].n + nodes[i].o;
  const cand: [number, number][] = [];
  for (const n of picked) for (const t of n.out) { const a = idx.get(n.path)!, b = idx.get(t); if (b === undefined || a === b) continue; const k = a < b ? a + ":" + b : b + ":" + a; if (!seen.has(k)) { seen.add(k); cand.push([a, b]); } }
  cand.sort((x, y) => deg(y[0]) + deg(y[1]) - deg(x[0]) - deg(x[1]));
  edges.push(...cand.slice(0, 1600));
  const sediment: Partial<Record<NoteKind, number>> = {};
  for (const n of notes) if (!idx.has(n.path)) { const k = noteKind(n.path, false); sediment[k] = (sediment[k] || 0) + 1; }
  const orphans = notes.filter(n => !inb.get(n.path) && !outN(n)).length;
  return { nodes, edges, total: notes.length, links, orphans, sediment, editedToday: notes.filter(n => now - n.mtime < DAY).length };
}

/** Public projection: the shape only. Titles and paths go, except notes already published to the garden; notes under
 *  projects that aren't public move under "Private" (or nowhere). */
export function publicUnderground(u: Underground, publicDistricts: string[]): Underground {
  const pub = new Set(publicDistricts);
  return { ...u, nodes: u.nodes.map(n => ({ k: n.g ? "garden" : n.k, n: n.n, o: n.o, a: n.a, m: n.m, d: n.d ? (pub.has(n.d) ? n.d : pub.has("Private") ? "Private" : undefined) : undefined, ...(n.g ? { t: n.t, g: n.g } : {}) })) };
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const num = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));

/** Validate city.json rows (written by the owner's tools) into clean repos. */
export function parseCityRepos(raw: unknown): CityRepo[] {
  const rows = Array.isArray((raw as any)?.repos) ? (raw as any).repos : [];
  return rows.filter((r: any) => r && typeof r.name === "string" && r.name.trim()).slice(0, 300).map((r: any): CityRepo => ({
    name: String(r.name).slice(0, 80), project: String(r.project || "Other").slice(0, 60), public: r.public === true,
    language: String(r.language || "Other").slice(0, 30), commits: num(r.commits), week: num(r.week), today: num(r.today),
    weeks: (Array.isArray(r.weeks) ? r.weeks : []).slice(-12).map(num),
    pushed: typeof r.pushed === "string" ? r.pushed.slice(0, 40) : undefined, created: typeof r.created === "string" ? r.created.slice(0, 40) : undefined,
    size: num(r.size), url: r.public === true && /^https:\/\//.test(String(r.url || "")) ? String(r.url) : undefined,
    description: r.public === true && r.description ? String(r.description).slice(0, 200) : undefined,
    sites: cleanSites(r.sites ?? r.homepage),
  }));
}

/** No GitHub and no city.json: build the city from the vault itself. Top folders are districts, their subfolders
 *  buildings; height = notes edited this year, lit windows = notes edited this week. */
export function vaultRepos(notes: { path: string; mtime: number }[], now = Date.now()): CityRepo[] {
  const by = new Map<string, CityRepo>(), DAY = 864e5;
  for (const n of notes) {
    const parts = n.path.split("/"); if (parts.length < 2) parts.unshift("Notes");
    const key = parts.slice(0, Math.min(2, parts.length - 1)).join("/");
    const r: CityRepo = by.get(key) || { name: key, project: parts[0], public: false, language: "Notes", commits: 0, weeks: Array(12).fill(0), week: 0, today: 0 };
    const age = (now - n.mtime) / DAY;
    if (age < 365) r.commits++;
    if (age < 84) r.weeks[11 - Math.floor(age / 7)]++;
    if (age < 7) r.week++;
    if (age < 1) r.today++;
    r.size = (r.size || 0) + 1;
    by.set(key, r);
  }
  // every folder stands, even a quiet one: give it at least one floor
  return [...by.values()].map(r => ({ ...r, commits: Math.max(1, r.commits) })).sort((a, b) => b.commits - a.commits).slice(0, 120);
}

/** Group repos into districts; notes(name) = how many vault notes link to the project's note. */
export function cityData(repos: CityRepo[], notes: (project: string) => { n: number; paths: string[] }, generated?: string): CityData {
  const by = new Map<string, CityRepo[]>();
  for (const r of repos) by.set(r.project, [...(by.get(r.project) || []), r]);
  const districts = [...by.entries()].map(([name, rs]) => { const nn = notes(name); return { name, notes: nn.n, notePaths: nn.paths.slice(0, 6), repos: rs.sort((a, b) => b.commits - a.commits) }; })
    .sort((a, b) => b.repos.reduce((s, r) => s + r.commits, 0) - a.repos.reduce((s, r) => s + r.commits, 0));
  return { generated, districts, private: true };
}

/** What visitors may see: the whole city, but private repos are locked buildings (no name, language, history, link
 * or exact numbers: commits are rounded to a coarse step, activity to busy / not busy). Projects that aren't on the
 * public profile lose their names: their repos move into one district called "Private". */
const LOCKED_STEPS = [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const coarse = (n: number) => n <= 0 ? 0 : LOCKED_STEPS.reduce((b, s) => n >= s ? s : b, 1);
const locked = (r: CityRepo, project: string): CityRepo => ({ name: "", project, public: false, locked: true, language: "Private", commits: coarse(r.commits), weeks: [], week: r.week > 0 ? 1 : 0, today: 0 });

/** Apply a member's private-repos setting to an already PUBLIC city (works on any build: anything locked or not marked
 *  public counts as private). "show" returns it as it is. Totals are recomputed from public repos only. */
/** A listing's meta.on (the repo its sign hangs on) stays only while a building of that name stands, unlocked and named,
 *  in the same district; anything else is dropped so a page never carries a repo name it doesn't already show. */
export function scrubSignHosts(districts: CityDistrict[]): CityDistrict[] {
  return districts.map(d => {
    const names = new Set(d.repos.filter(r => !r.kind && !r.locked && r.name).map(r => r.name.toLowerCase()));
    if (!d.repos.some(r => r.kind && r.meta?.on && !names.has(String(r.meta.on).toLowerCase()))) return d;
    return { ...d, repos: d.repos.map(r => r.kind && r.meta?.on && !names.has(String(r.meta.on).toLowerCase()) ? { ...r, meta: { ...r.meta, on: undefined } } : r) };
  });
}
export function applyPrivateMode(c: CityData, mode: PrivateMode | undefined): CityData {
  if (!mode || mode === "show" || mode === "named" || c.private) return c;
  const isPriv = (r: CityRepo) => !!r.locked || r.public !== true || !r.name;
  let n = 0;
  const districts: CityDistrict[] = [], moved: CityRepo[] = [];
  for (const d of c.districts) {
    if (d.apart) { n += d.repos.length; continue; }
    // a listing that stood beside private work would give away where that work is: it moves to "Apps & sites"
    const go = d.name === "Apps & sites" ? [] : d.repos.filter(r => r.kind && r.pv); moved.push(...go);
    const pub = d.repos.filter(r => !isPriv(r) && !go.includes(r)); n += d.repos.filter(isPriv).length;
    if (pub.length || (d.notes > 0 && !/^(private|vault)$/i.test(d.name))) districts.push({ ...d, repos: pub });   // a named project keeps its notes; private repos leave it
  }
  if (moved.length) { let g = districts.find(x => x.name === "Apps & sites"); if (!g) { g = { name: "Apps & sites", notes: 0, repos: [] }; districts.push(g); }
    g.repos.push(...moved.map(r => ({ ...r, project: "Apps & sites", pv: undefined }))); }
  const label = c.kind === "vault" ? "Vault" : "Private";
  if (mode === "anonymous" && n > 0)
    districts.push({ name: label, notes: 0, apart: true, repos: Array.from({ length: privateCluster(n) }, () => ({ name: "", project: label, public: false, locked: true, language: "Private", commits: 25, weeks: [], week: 0, today: 0 })) });
  const pub = districts.flatMap(d => d.repos).filter(r => !r.locked);
  return { ...c, districts: scrubSignHosts(districts), privateMode: mode, totals: { commits: pub.reduce((s, r) => s + (Number(r.commits) || 0), 0), active: pub.filter(r => r.week > 0).length },
    under: c.under ? publicUnderground(c.under, districts.filter(d => !d.apart).map(d => d.name)) : undefined };
}
export function publicCity(c: CityData, publicProjects: string[], mode: PrivateMode = "show", hideRepos: string[] = []): CityData {
  if (mode === "named") return publicCityNamed(c, hideRepos);
  return applyPrivateMode(publicCityShow(c, publicProjects), mode);
}
/** named: every district and repo as in the private view; private repos keep name, language and activity, lose links and text */
function publicCityNamed(c: CityData, hideRepos: string[] = []): CityData {
  const hide = new Set(hideRepos.map(h => h.trim().toLowerCase()).filter(Boolean));   // still a nameless padlock, in place
  const named = (r: CityRepo): CityRepo => r.public ? r : hide.has(r.name.toLowerCase()) ? locked(r, r.project) : { name: r.name, project: r.project, public: false, priv: true, language: r.language || "Other",
    commits: r.commits, weeks: (r.weeks || []).slice(-12), week: r.week, today: r.today, pushed: r.pushed, created: r.created, size: r.size, ...(r.sites ? { sites: r.sites } : {}) };
  const districts = c.districts.map(d => ({ name: d.name, notes: d.notes, repos: d.repos.map(named) }));
  const all = c.districts.flatMap(d => d.repos);
  return { generated: c.generated, kind: c.kind, districts, private: false, privateMode: "named", totals: { commits: all.reduce((s, r) => s + r.commits, 0), active: all.filter(r => r.week > 0).length },
    under: c.under ? publicUnderground(c.under, districts.map(d => d.name)) : undefined };
}
function publicCityShow(c: CityData, publicProjects: string[]): CityData {
  const pub = new Set(publicProjects.map(p => p.toLowerCase()));
  const districts: CityDistrict[] = [], hidden: CityRepo[] = [];
  for (const d of c.districts) {
    const listed = pub.has(d.name.toLowerCase()) || d.repos.some(r => r.public);   // a public repo already names its project
    if (!listed) { hidden.push(...d.repos.map(r => locked(r, c.kind === "vault" ? "Vault" : "Private"))); continue; }
    districts.push({ name: d.name, notes: pub.has(d.name.toLowerCase()) ? d.notes : 0, repos: d.repos.map(r => r.public ? r : locked(r, d.name)) });
  }
  if (hidden.length) districts.push({ name: c.kind === "vault" ? "Vault" : "Private", notes: 0, repos: hidden.sort((a, b) => b.commits - a.commits) });
  const all = c.districts.flatMap(d => d.repos);
  return { generated: c.generated, kind: c.kind, districts, private: false, totals: { commits: all.reduce((s, r) => s + r.commits, 0), active: all.filter(r => r.week > 0).length },
    under: c.under ? publicUnderground(c.under, districts.map(d => d.name)) : undefined };
}

export interface CitySite { name: string; handle?: string; github?: string; theme?: "dark" | "light"; icon?: string; nav?: (depth: number, current: string) => string; openBase?: string }


const PADLOCK_LEGEND = '<span><i style="background:#5C6B86"></i>&#128274; Private</span>';
const PADLOCK_SHOW = " Glass buildings with a padlock are private repos: you can see the city grow, not what's inside.";
const PADLOCK_ANON = " The padlocked district holds private work, kept anonymous: no names, sizes, projects or activity.";
function cityPadlockNote(city: CityData): string {
  const lockedAny = city.districts.some(d => d.repos.some(r => r.locked));
  return city.kind === "vault" || city.private || !lockedAny ? "" : city.privateMode === "anonymous" ? PADLOCK_ANON : PADLOCK_SHOW;
}
function cityRows(city: CityData): string {
  return city.districts.map(d => d.apart ? `<tr><td>${esc(d.name)} &#128274;</td><td colspan="4">Private work, kept anonymous</td></tr>` : `<tr><td>${esc(d.name)}</td><td>${d.repos.length}</td><td>${d.repos.reduce((s, r) => s + r.commits, 0).toLocaleString("en-US")}</td><td>${d.repos.reduce((s, r) => s + r.week, 0)}</td><td>${d.notes}</td></tr>`).join("");
}
function cityStats(city: CityData): string {
  const repos = city.districts.flatMap(d => d.repos), notes = city.districts.reduce((s, d) => s + d.notes, 0);
  const total = city.totals?.commits ?? repos.reduce((s, r) => s + r.commits, 0), active = city.totals?.active ?? repos.filter(r => r.week > 0).length;
  const anon = !!city.privateMode && city.privateMode !== "show", nb = anon ? repos.filter(r => !r.locked).length : repos.length;
  return `<div class="c-stats"><div><b>${nb}</b><span>${anon ? "public buildings" : "buildings"}</span></div><div><b>${total.toLocaleString("en-US")}</b><span>${city.kind === "vault" ? "notes edited this year" : "commits this year"}</span></div><div><b>${active}</b><span>busy this week</span></div><div><b>${(city.kind === "vault" ? city.under?.total ?? notes : notes).toLocaleString("en-US")}</b><span>${city.kind === "vault" ? "notes in the vault" : "notes in town"}</span></div></div>`;
}

/** Serve-time: swap the renderer in an already published city.html for this build's CITY_JS, so hosted cities get
 *  renderer changes (like the LEGO build intro) without a republish. Only pages from the current page generation
 *  (their script already has fitLabels, so the DOM it expects matches); older pages update when they are rebuilt or republished. */
export function upgradeCityScript(html: string): string {
  const head = "<script>(function(){\nvar D=JSON.parse(document.getElementById('city-data')";
  const a = html.indexOf(head); if (a < 0) return html;
  const b = html.indexOf("})();</script>", a); if (b < 0) return html;
  const old = html.slice(a + 8, b + 5);
  if (old === CITY_JS || !old.includes("function fitLabels(")) return html;
  const out = html.slice(0, a + 8) + CITY_JS + html.slice(b + 5);
  return out.includes(".c-sfk{") ? out : out.replace(/<\/head>/i, () => `<style>${STORE_CSS}</style></head>`);
}

/** Serve-time: apply a private-repos setting to an already published PUBLIC city.html (any plugin version). Rebuilds
 *  the embedded data and every place the page states numbers about the city; the canvas draws from the data. */
export function rewriteCityPage(html: string, mode: PrivateMode | undefined): string {
  if (!mode || mode === "show") return html;
  const m = html.match(/<script type="application\/json" id="city-data">([\s\S]*?)<\/script>/); if (!m) return html;
  let data: any; try { data = JSON.parse(m[1]); } catch { return html; }
  if (!data || !Array.isArray(data.districts) || data.private) return html;
  const city = applyPrivateMode(data as CityData, mode);
  let out = html.replace(m[0], () => `<script type="application/json" id="city-data">${JSON.stringify(city).replace(/</g, "\\u003c")}</script>`);
  out = out.replace(/<div class="c-stats">(?:<div>[\s\S]*?<\/div>){4}<\/div>/, () => cityStats(city));
  out = out.replace(/(<table class="c-table">[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/, (_a, x, y) => x + cityRows(city) + y);
  out = out.split(PADLOCK_SHOW).join(cityPadlockNote(city));
  if (!city.districts.some(d => d.repos.some(r => r.locked))) out = out.split(PADLOCK_LEGEND).join("");
  return out;
}

export function renderCity(site: CitySite, city: CityData): string {
  const repos = city.districts.flatMap(d => d.repos);
  const total = city.totals?.commits ?? repos.reduce((s, r) => s + r.commits, 0), active = city.totals?.active ?? repos.filter(r => r.week > 0).length, notes = city.districts.reduce((s, d) => s + d.notes, 0);
  const json = JSON.stringify({ ...city, openBase: site.openBase || "" }).replace(/</g, "\\u003c");
  const icon = site.icon ? `<link rel="icon" href="${esc(site.icon)}" type="image/png">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`;
  const rows = cityRows(city);
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(site.name)}'s city</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css"><style>${CITY_CSS}</style></head><body>
<div class="tabs"><a class="tab" href="index.html">${esc(site.name)}.md</a><span class="tab is-active">City</span><span class="spacer"></span></div>
<div class="shell">${site.nav ? site.nav(0, "city.html") : ""}<main class="note"><div class="c-main">
<div class="g-crumbs c-crumbs"><a href="index.html">${esc(site.handle ? "@" + site.handle : site.name)}</a> / City${site.github && /^https:\/\/github\.com\/[\w.-]+\/?$/.test(site.github) ? ` &middot; <a class="c-gh" href="${esc(site.github)}" target="_blank" rel="noopener">GitHub &#8599;</a>` : ""}</div>
<h1 class="c-title">${esc(site.name)}'s city</h1>
<p class="c-lede">${city.kind === "vault" ? `Built from ${esc(site.name)}'s Obsidian vault: every folder is a building, taller means more notes written this year, lit windows mean notes written this week. Folder names stay private.${city.under ? " Go underground to see the notes and the links between them." : ""}` : `Every project is a district and every repo a building: taller means more commits this year, lit windows mean commits this week, a crane means it's being built right now. The houses around each district are the Obsidian notes about that project.${city.private ? " <b>Private view:</b> every repo, including private ones." : cityPadlockNote(city)}`}</p>
${cityStats(city)}
<div class="c-stage" id="stage"><canvas id="city" aria-label="Isometric city of ${repos.length} projects"></canvas>
<div class="c-tools"><button id="t-labels" aria-pressed="true" title="Labels">&#x1F3F7;&#xFE0F;<span class="t-txt"> Labels</span></button><button id="t-sky">Auto</button><button id="t-wx" title="Weather">Weather</button>${city.under ? '<button id="t-under" aria-pressed="false">&#x2B07;<span class="t-txt"> Underground</span></button>' : ""}<button id="t-snd" aria-pressed="false" title="Sound for arrivals, signups and sales (off)">&#x1F507;</button><button id="t-reset" title="Reset the view">&#x21BA;<span class="t-txt"> Reset</span></button><button id="t-pop" aria-label="Pop out a small window" title="Pop out a small window">&#x29C9;<span class="t-txt"> Pop out</span></button><button id="t-full" aria-label="Full screen" title="Full screen">&#x26F6;<span class="t-txt"> Full screen</span></button></div>
<div class="c-toasts" aria-live="polite"></div><div class="c-mininame" aria-hidden="true"><i></i>${esc(site.name)}</div>
<div class="c-card" id="card" hidden></div><div class="c-hint">Drag to move &middot; scroll or pinch to zoom &middot; tap a building</div></div>
<div class="c-legend"><span><i style="background:#3178C6"></i>TypeScript</span><span><i style="background:#E8C547"></i>JavaScript</span><span><i style="background:#4FB89A"></i>Python</span><span><i style="background:#E07A4F"></i>HTML</span><span><i style="background:#F05138"></i>Swift</span><span><i style="background:#8A8A93"></i>Other</span>${repos.some(r => r.locked) ? PADLOCK_LEGEND : ""}${repos.some(r => r.kind) ? '<span><i style="background:#6C63FF"></i>Apps</span><span><i style="background:#1FA39A"></i>Websites</span>' : ""}<span>&#127959; built this week</span><span>&#127968; notes about the project</span></div>
<div class="c-table-wrap"><table class="c-table"><thead><tr><th>District</th><th>Buildings</th><th>Commits this year</th><th>This week</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
${city.generated ? `<p class="c-foot">GitHub counts from ${esc(new Date(city.generated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}.</p>` : ""}
</div></main></div>
<script type="application/json" id="city-data">${json}</script>
<script>${CITY_JS}</script></body></html>`;
}

/** A small, still isometric picture of the city for the top of the profile: same packing, colors and heights as
 * the live city, drawn as inline SVG (no script, no scroll capture), linking through to city.html. */
export function citySnapshot(city: CityData, o: { name: string; href?: string }): string {
  const LANG: Record<string, string> = { TypeScript: "#3178C6", JavaScript: "#E8C547", Python: "#4FB89A", HTML: "#E07A4F", Swift: "#F05138", CSS: "#6E5BD0", Shell: "#7FB24A", Go: "#2FB5D6", Rust: "#C9744A", App: "#6C63FF", Web: "#1FA39A" };
  const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(Math.min(255, v * f))); return `rgb(${c.join(",")})`; };
  const TW = 64, TH = 32, ds = city.districts.slice(0, 14);
  const area = ds.reduce((a, d) => { const k = Math.max(2, Math.ceil(Math.sqrt(Math.min(d.repos.length, 36)))); return a + (k + 1) * (k + 1); }, 0);
  const maxW = Math.max(8, Math.ceil(Math.sqrt(area) * 1.25));
  type T = { x: number; y: number; r: CityRepo };
  const ts: T[] = [], blocks: { x: number; y: number; k: number }[] = [];
  let x = 1, y = 1, rowH = 0;
  for (const d of ds) {
    const rs = d.repos.slice(0, 36), k = Math.max(2, Math.ceil(Math.sqrt(rs.length)));
    if (d.apart && (x > 1 || y > 1)) { if (x > 1) { x = 1; y += rowH + 1; rowH = 0; } y += 2; }   // the anonymous private district stands apart, never beside a project
    else if (x + k > maxW && x > 1) { x = 1; y += rowH + 1; rowH = 0; }
    blocks.push({ x, y, k });
    const cells: [number, number][] = []; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) cells.push([x + i, y + j]);
    cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    rs.forEach((r, i) => ts.push({ x: cells[i][0], y: cells[i][1], r }));
    x += k + 1; rowH = Math.max(rowH, k);
  }
  const iso = (gx: number, gy: number) => [(gx - gy) * TW / 2, (gx + gy) * TH / 2];
  const ht = (r: CityRepo) => Math.min(150, 10 + 14 * Math.log2(1 + Math.max(0, r.commits)));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grow = (px: number, py: number) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); };
  const f = (n: number) => n.toFixed(1), out: string[] = [];
  for (const b of blocks) {   // district pads
    const p = [iso(b.x - .15, b.y - .15), iso(b.x + b.k - .85, b.y - .15), iso(b.x + b.k - .85, b.y + b.k - .85), iso(b.x - .15, b.y + b.k - .85)].map(([px, py]) => [px, py + TH / 2]);
    p.forEach(([px, py]) => grow(px, py));
    out.push(`<polygon class="cp-pad" points="${p.map(q => q.map(f).join(",")).join(" ")}"/>`);
  }
  ts.sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x);
  let win = 0;
  for (const t of ts) {
    const [cx, c0] = iso(t.x, t.y), cy = c0 + TH / 2, a = TW / 2 * .62, b = TH / 2 * .62, h = ht(t.r);
    const col = t.r.locked ? "#5C6B86" : LANG[t.r.language] || "#8A8A93";
    const P = (pts: number[][]) => pts.map(q => q.map(f).join(",")).join(" ");
    grow(cx - a, cy - h - b); grow(cx + a, cy + b);
    out.push(`<polygon fill="${shade(col, .62)}" points="${P([[cx - a, cy - h], [cx, cy + b - h], [cx, cy + b], [cx - a, cy]])}"/>`
      + `<polygon fill="${shade(col, .82)}" points="${P([[cx + a, cy - h], [cx, cy + b - h], [cx, cy + b], [cx + a, cy]])}"/>`
      + `<polygon fill="${shade(col, 1.08)}" points="${P([[cx, cy - b - h], [cx + a, cy - h], [cx, cy + b - h], [cx - a, cy - h]])}"/>`);
    const busy = t.r.week > 0, rows = Math.min(8, Math.floor((h - 6) / 9));
    for (let k = 0; k < rows; k++) for (const u of [.3, .7]) {   // windows on the right face, lit when the repo had commits this week
      const wx = cx + a * u, wy = cy + b * (1 - u) - 6 - k * 9;
      const lit = busy && ((t.x * 7 + t.y * 3 + k + (u > .5 ? 1 : 0)) % 3 !== 0);
      out.push(`<polygon class="${lit ? `cp-w cp-on${win++ % 5}${t.r.locked ? " cp-cool" : ""}` : "cp-w"}" points="${P([[wx - 2.5, wy + 1.2], [wx + 2.5, wy - 1.2], [wx + 2.5, wy - 4.8], [wx - 2.5, wy - 2.4]])}"/>`);
    }
  }
  const pad = 18, vb = `${f(minX - pad)} ${f(minY - pad)} ${f(maxX - minX + pad * 2)} ${f(maxY - minY + pad * 2)}`;
  const repos = city.districts.flatMap(d => d.repos), total = city.totals?.commits ?? repos.reduce((a, r) => a + r.commits, 0), busy = city.totals?.active ?? repos.filter(r => r.week > 0).length;
  const nb = city.privateMode && city.privateMode !== "show" ? repos.filter(r => !r.locked).length : repos.length;   // the anonymous cluster size is not a count
  const e = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  return `<style>.city-peek{display:block;position:relative;margin:18px 0 26px;border-radius:12px;overflow:hidden;text-decoration:none;color:#E8EEF8;background:radial-gradient(ellipse at 50% 120%,#1d2b4a 0%,#0c1222 60%,#080b14 100%);border:1px solid rgba(140,170,220,.18);transition:border-color .2s,transform .2s}
.city-peek:hover{border-color:rgba(140,190,255,.5);transform:translateY(-1px)}.city-peek svg{display:block;width:100%;height:auto;max-height:300px}
.cp-pad{fill:rgba(120,150,210,.10);stroke:rgba(140,170,230,.22);stroke-width:1}.cp-w{fill:rgba(10,16,30,.55)}[class*=cp-on]{fill:#FFD98A;animation:cpw 4s ease-in-out infinite}
.cp-on1{animation-delay:-.8s}.cp-on2{animation-delay:-1.6s}.cp-on3{animation-delay:-2.4s}.cp-on4{animation-delay:-3.2s}@keyframes cpw{0%,100%{opacity:1}50%{opacity:.35}}
.cp-cool{fill:#BFD8FF}@media (prefers-reduced-motion:reduce){[class*=cp-on]{animation:none}}
.cp-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;padding:28px 16px 12px;background:linear-gradient(transparent,rgba(6,9,18,.88));font:500 13px/1.3 "IBM Plex Sans",system-ui,sans-serif}
.cp-bar b{font-size:15px}.cp-bar .cp-go{color:#9CC4FF;white-space:nowrap}.cp-bar .cp-n{opacity:.75}
.city-peek.sky-dawn{background:linear-gradient(#3A4A7E,#E0899A 62%,#FFCB8E)}.city-peek.sky-day{background:linear-gradient(#7FB8EA,#CFE6F7 66%,#EAF4FB)}
.city-peek.sky-dusk{background:linear-gradient(#3E3A6E,#C8607A 60%,#F4B26B)}.city-peek.sky-evening{background:linear-gradient(#0B0E2A,#23285A 60%,#4A3F7A)}
.city-peek.sky-day .cp-pad,.city-peek.sky-dawn .cp-pad{fill:rgba(70,110,70,.22);stroke:rgba(50,90,60,.35)}
.city-peek.sky-day [class*=cp-on]{fill:rgba(205,228,250,.95);animation:none}.city-peek.sky-day .cp-w{fill:rgba(40,60,90,.45)}.city-peek.sky-dawn [class*=cp-on]{fill:#FFE2A8}</style>
<a class="city-peek" href="${e(o.href || "city.html")}" aria-label="Open ${e(o.name)}'s city"><svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">${out.join("")}</svg>
<span class="cp-bar"><span><b>${e(o.name)}'s city</b> <span class="cp-n">&middot; ${nb} building${nb === 1 ? "" : "s"}${city.privateMode === "anonymous" && repos.some(r => r.locked) ? " + private work" : ""} &middot; ${total.toLocaleString("en-US")} ${city.kind === "vault" ? `note${total === 1 ? "" : "s"} edited` : `commit${total === 1 ? "" : "s"}`} this year${busy ? ` &middot; ${busy} busy this week` : ""}</span></span><span class="cp-go">Explore the city &rarr;</span></span></a><script>(function(a){var d=new Date(),m=d.getHours()*60+d.getMinutes(),k=m<345?'':m<450?'dawn':m<1042?'day':m<1140?'dusk':m<1237?'evening':'';if(a&&k)a.classList.add('sky-'+k)})(document.currentScript&&document.currentScript.previousElementSibling)</script>`;
}

/** The store panel and markers. Published pages keep the CSS they were built with while the hub upgrades their script (upgradeCityScript), so the upgrade adds this block too. */
const STORE_CSS = `.c-card.is-dir{left:var(--c-l,10px);top:var(--c-t,58px);width:min(340px,calc(100% - 20px));max-height:var(--c-mh,calc(100% - 110px));padding:12px 12px 8px;touch-action:pan-y;overscroll-behavior:contain;z-index:6}.c-card.is-dir .d-head{padding-right:40px;margin-bottom:8px;min-height:28px}.c-card.is-dir .d-head b{font-size:15px;color:#fff}.c-card.is-dir .x{top:0;right:0;width:44px;height:44px;font-size:20px}.c-card.is-dir .x:focus-visible{outline:2px solid #B9A6FF;outline-offset:-4px;border-radius:10px}
.c-card.is-dir.is-sheet{position:fixed;left:var(--c-sl,0);right:var(--c-sr,0);bottom:var(--c-sb,0);top:auto;width:auto;max-height:min(62vh,420px);border-radius:14px 14px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.45);padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:65}
.c-card .d-li{display:flex;align-items:center;gap:4px}
.c-card .d-row{flex:1;min-width:0;display:flex;gap:10px;align-items:center;text-align:left;text-decoration:none;background:none;border:1px solid transparent;border-radius:8px;padding:6px;color:#E8E8EE;font:inherit;min-height:44px;box-sizing:border-box}
.c-card a.d-row{cursor:pointer}.c-card a.d-row:hover{background:rgba(255,255,255,.06)}.c-card a.d-row:focus-visible,.c-card .d-loc:focus-visible{outline:2px solid #B9A6FF;outline-offset:1px}.c-card .d-row.is-on{background:rgba(139,108,246,.2);border-color:rgba(139,108,246,.55)}
.c-card .d-go{flex:none;margin-left:auto;display:block;color:#B9A6FF}
.c-card .d-loc{flex:none;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:none;border:1px solid transparent;color:#9A9AA6;cursor:pointer}.c-card .d-loc:hover{background:rgba(255,255,255,.06);color:#fff}
.c-sfk{position:absolute;left:0;top:0;width:0;height:0;z-index:1}.c-sfk button{position:absolute;left:0;top:0;width:44px;height:44px;margin:0;padding:0;border:0;border-radius:10px;background:none;color:transparent;font-size:1px;overflow:hidden;pointer-events:none;-webkit-appearance:none;appearance:none}.c-sfk button:focus-visible{outline:3px solid #B9A6FF;outline-offset:1px}.c-stage.c-dig .c-sfk{display:none}html.c-mini .c-sfk{display:none}`;
export const CITY_CSS = `
.c-main{max-width:1100px;margin:0 auto;padding:28px 20px 64px}
.c-crumbs{font-size:var(--text-sm);color:var(--text-muted);margin-bottom:6px}.c-crumbs a{color:var(--text-muted)}.c-crumbs a.c-gh{color:var(--accent-text,#B9A6FF)}
.c-title{font-family:var(--font-serif,'Source Serif 4',Georgia,serif);font-size:2.1rem;margin:0 0 8px;color:var(--text-strong)}
.c-lede{color:var(--text-muted);max-width:70ch;margin:0 0 16px}
.c-stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.c-stats div{flex:1 1 120px;background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:10px 14px;display:flex;flex-direction:column}
.c-stats b{font-size:1.5rem;font-variant-numeric:tabular-nums;color:var(--text-strong)}.c-stats span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.c-stage{position:relative;height:min(72vh,720px);min-height:420px;border-radius:var(--radius-md,10px);overflow:hidden;border:1px solid rgba(61,242,255,.35);box-shadow:0 0 24px rgba(61,242,255,.12);background:#010207;touch-action:none}
.c-heli{position:absolute;left:10px;bottom:76px;z-index:4;pointer-events:none;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#FFD9A0;background:rgba(2,6,12,.86);border:1px solid rgba(255,190,90,.5);border-radius:999px;padding:6px 11px;white-space:nowrap;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}.c-heli[hidden]{display:none}
.c-stage canvas{width:100%;height:100%;display:block;cursor:grab}.c-stage canvas.c-link{cursor:pointer}.c-stage canvas.drag{cursor:grabbing}
.c-tools{position:absolute;top:10px;right:10px;display:flex;gap:6px}
.c-tools .t-sw{display:inline-block;width:10px;height:10px;border-radius:50%;vertical-align:-1px;background:conic-gradient(#A78BFA 0 25%,#2DD4BF 0 50%,#FBBF24 0 75%,#FB7185 0)}
.w-topics{position:absolute;left:10px;top:10px;z-index:3;display:flex;flex-direction:column;gap:4px;max-width:min(240px,calc(100% - 20px));padding:8px 11px;border-radius:10px;background:rgba(2,6,12,.84);border:1px solid rgba(61,242,255,.3);color:#E6F6FF;font:500 12px/1.35 'IBM Plex Sans',Arial,sans-serif;pointer-events:none}
.w-topics b{font-weight:600;color:#BFF8FF;margin-bottom:2px}.w-topics span{display:flex;align-items:center;gap:7px}.w-topics i{display:inline-block;width:10px;min-width:10px;height:10px;border-radius:3px;flex:0 0 10px}.w-topics[hidden]{display:none}
@media (max-width:600px){.w-topics{top:52px;gap:3px;padding:7px 9px;font-size:11px;max-width:min(200px,calc(100% - 20px))}}
.c-tools button{font:500 12px var(--font-mono,'IBM Plex Mono',monospace);padding:5px 10px;border-radius:999px;border:1px solid rgba(61,242,255,.45);background:rgba(2,6,12,.8);color:#BFF8FF;cursor:pointer}
.c-tools button[aria-pressed="false"]{opacity:.6}
.c-under{position:absolute;left:10px;bottom:10px;width:min(300px,calc(100% - 20px));background:rgba(2,6,12,.86);border:1px solid rgba(181,140,255,.45);border-radius:10px;padding:8px 10px;color:#E3DAFF;font:12px/1.45 var(--font-mono,'IBM Plex Mono',monospace)}
.c-under b{color:#fff}.c-under{cursor:pointer}.c-under.c-min>:not(.uh){display:none}.c-under.c-min,.c-live.c-min{width:auto}.c-under .chev,.c-live .chev{float:right;opacity:.7;margin-left:8px}.c-under .lg{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:4px;color:#A99BD0}.c-under .lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:0}
.c-stage.c-dig .c-hint{display:none}
.c-stage.c-full{position:fixed;inset:0;z-index:9999;height:100%;min-height:0;border-radius:0;border:0}
.c-stage:fullscreen{height:100%;border-radius:0;border:0}
/* arrivals: toasts for signups and sales */
.c-gift{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;gap:5px}.c-gift-b{all:unset;cursor:pointer;align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:linear-gradient(90deg,#FFD98A,#FFB65C);color:#2A1A00;font:700 12.5px var(--font-body,'IBM Plex Sans',Arial,sans-serif);text-decoration:none}.c-gift-b:hover{filter:brightness(1.06)}.c-gift-b:disabled{opacity:.6;cursor:default}.c-gift-b:focus-visible{outline:2px solid #FFD98A;outline-offset:2px}
.c-toasts{position:absolute;left:10px;top:48px;z-index:3;display:flex;flex-direction:column;gap:6px;pointer-events:none;max-width:calc(100% - 20px)}
.c-toast{font:600 12px/1.3 var(--font-mono,'IBM Plex Mono',monospace);padding:6px 11px;border-radius:9px;background:rgba(2,6,12,.9);color:#fff;border:1px solid #FF4FD8;box-shadow:0 0 14px rgba(255,79,216,.45);animation:ctin .35s ease-out,ctout .6s ease-in 4.6s forwards;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c-toast.buy{border-color:#FFD23F;box-shadow:0 0 14px rgba(255,210,63,.5)}
@keyframes ctin{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:none}}@keyframes ctout{to{opacity:0;transform:translateY(-6px)}}
html.c-mini .c-toasts{left:6px;top:6px}html.c-mini .c-toast{font-size:10.5px;padding:4px 8px}
/* mini: the pop-out window (city.html#mini, the watch page, or a picture-in-picture window): just the city, filling the window */
.c-mininame{display:none}
html.c-mini,html.c-mini body{height:100%;overflow:hidden;background:#010207}
html.c-mini .c-stage{position:fixed;inset:0;z-index:2147483000;height:100%;min-height:0;border:0;border-radius:0;box-shadow:none}
html.c-mini .c-hint,html.c-mini #t-pop,html.c-mini #t-full{display:none}
html.c-mini .c-tools{top:6px;right:6px;opacity:0;transition:opacity .2s}html.c-mini .c-stage:hover .c-tools{opacity:1}html.c-mini .c-tools .t-txt{display:none}
html.c-mini .c-tools button{padding:3px 8px;font-size:11px}
.c-today{position:absolute;left:10px;bottom:10px;z-index:2;padding:4px 10px;border-radius:999px;background:rgba(8,12,22,.72);color:#E6F6FF;font:500 12px/1.3 'IBM Plex Mono',ui-monospace,monospace;pointer-events:none;backdrop-filter:blur(4px)}
html.c-mini .c-today{display:none}
.c-today.c-today-in{position:static;display:block;padding:0 0 6px;margin:0 0 6px;border-radius:0;background:none;backdrop-filter:none;border-bottom:1px solid rgba(61,242,255,.25);font-size:11px;color:#CFEFFF}
.c-stage:not(.c-dig) .c-hint~.c-today{bottom:42px}@media (max-width:600px){.c-stage:not(.c-dig) .c-hint~.c-today{bottom:10px}}
.c-setup{position:relative;margin:10px 0 4px;padding:10px 40px 10px 14px;border:1px solid var(--line,#2A2A2F);border-radius:var(--radius-md,10px);background:var(--bg-raised,#18181B);font-size:var(--text-sm,14px);color:var(--text,#E6E6EA)}
.c-su-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:3px 0}.c-su-row span{flex:1 1 260px;color:var(--text-muted,#9A9AA6)}
.c-setup button{cursor:pointer;font:inherit;font-size:13px;border-radius:999px;border:1px solid var(--line,#2A2A2F);background:transparent;color:var(--accent-text,#B9A6FF);padding:3px 12px}
.c-setup .c-su-go{border-color:var(--accent,#8B6CF6)}.c-setup .c-su-x{position:absolute;top:6px;right:8px;border:0;color:var(--text-muted,#9A9AA6);font-size:18px;padding:0 6px}
.c-su-panel{margin-top:8px;padding-top:8px;border-top:1px solid var(--line,#2A2A2F)}.c-su-panel p{margin:0 0 8px;color:var(--text-muted,#9A9AA6)}
.c-su-site{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:6px 0}.c-su-site b{min-width:120px}.c-su-site code{flex:1 1 280px;font:12px/1.4 'IBM Plex Mono',ui-monospace,monospace;background:var(--bg-sunken,#0E0E11);border-radius:6px;padding:5px 8px;overflow-x:auto;white-space:nowrap}
.c-setup .c-su-ai{margin-top:4px;background:var(--accent,#8B6CF6);color:#fff;border-color:transparent}
html.c-mini .c-live{right:6px;bottom:6px;font-size:10.5px;padding:5px 8px}
html.c-mini .c-mininame{display:flex;align-items:center;gap:6px;position:absolute;left:8px;bottom:7px;font:500 11px var(--font-mono,'IBM Plex Mono',monospace);color:rgba(191,248,255,.78);letter-spacing:.04em;pointer-events:none;text-shadow:0 1px 3px #000}
html.c-mini .c-mininame i{width:6px;height:6px;border-radius:50%;background:#3DF2FF;box-shadow:0 0 6px #3DF2FF}
.c-hint{position:absolute;left:10px;bottom:10px;font:12px var(--font-sans,sans-serif);color:rgba(232,232,238,.75);background:rgba(14,19,32,.6);padding:4px 8px;border-radius:6px;pointer-events:none}
.c-card{position:absolute;left:10px;top:10px;width:min(300px,calc(100% - 20px));max-height:calc(100% - 60px);overflow:auto;background:rgba(18,22,34,.94);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;color:#E8E8EE;font:13px/1.45 var(--font-sans,'IBM Plex Sans',sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.c-card h3{margin:0 0 2px;font-size:15px;color:#fff}.c-card .k{color:#9A9AA6;font-size:12px}.c-card a{color:#B9A6FF}
.c-card .row{display:flex;justify-content:space-between;gap:8px;margin-top:4px}.c-card .c-grow{margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:4px}.c-card .c-grow b{text-align:right}.c-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#9A9AA6;font-size:16px;cursor:pointer}
.c-card .sp{display:flex;align-items:flex-end;gap:2px;height:28px;margin:8px 0 2px}.c-card .sp i{flex:1;background:#8B6CF6;border-radius:2px 2px 0 0;min-height:2px}
.c-card .d-sel{padding:10px;margin:0 0 8px;border-radius:9px;background:rgba(139,108,246,.14);border:1px solid rgba(139,108,246,.45)}.c-card .d-visit{font-weight:600}
.c-card .d-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
${STORE_CSS}
.c-card .d-txt{display:flex;flex-direction:column;min-width:0}.c-card .d-name{font-weight:600;color:#fff;overflow-wrap:anywhere}.c-card .d-meta{font-size:12px;color:#9A9AA6;overflow-wrap:anywhere}
.c-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 18px;font-size:var(--text-sm);color:var(--text-muted)}
.c-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.c-table-wrap{overflow-x:auto}.c-table{width:100%;border-collapse:collapse;font-size:var(--text-sm);font-variant-numeric:tabular-nums}
.c-table th,.c-table td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line)}.c-table th{color:var(--text-muted);font-weight:500}
.c-foot{font-size:var(--text-xs,12px);color:var(--text-muted);margin-top:12px}
.c-live{position:absolute;right:10px;bottom:10px;width:min(260px,calc(100% - 20px));max-height:62%;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;scrollbar-width:thin;scrollbar-color:rgba(61,242,255,.4) transparent;background:rgba(2,6,12,.86);border:1px solid rgba(61,242,255,.4);border-radius:10px;padding:8px 10px;color:#CFEFFF;font:12px/1.4 var(--font-mono,'IBM Plex Mono',monospace);box-shadow:0 0 18px rgba(61,242,255,.12)}
.c-live .h{display:flex;align-items:center;gap:6px;color:#fff;font-weight:600;letter-spacing:.06em;margin-bottom:4px}.c-live .dot{width:7px;height:7px;border-radius:50%;background:#FF3B5C;box-shadow:0 0 8px #FF3B5C;animation:clive 1.6s infinite}
.c-live .r{display:flex;justify-content:space-between;gap:8px;padding:2px 0;border-top:1px solid rgba(61,242,255,.12)}.c-live .r span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c-live .r b{color:#fff;font-weight:600;white-space:nowrap}
.c-live .m{color:#7FA6B8}.c-live .s{font-size:11px;padding-bottom:2px}.c-live .bar{display:inline-block;height:6px;border-radius:3px;background:#3DF2FF;box-shadow:0 0 6px #3DF2FF;vertical-align:1px}.c-live .lg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 4px 0 8px;vertical-align:0}.c-live .lg i:first-child{margin-left:0}
@keyframes clive{50%{opacity:.35}}
.c-live .h{cursor:pointer}.c-live.c-min>:not(.h){display:none}.c-live.c-min .h{margin:0}
.c-live .q{font-size:11px;padding-top:3px;border-top:1px solid rgba(61,242,255,.12)}
@media (max-width:600px){.c-live{max-height:55%;font-size:11px}.c-hint{display:none}.c-tools .t-txt{display:none}
.c-tools{left:6px;right:6px;flex-wrap:nowrap;justify-content:flex-end;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.c-tools::-webkit-scrollbar{display:none}
.c-tools button{flex:none;white-space:nowrap;min-width:32px;padding:4px 9px;line-height:1.2}}
@media (max-width:600px){.c-main{padding:20px 16px 48px}.c-title{font-size:1.7rem}.c-stage{height:50vh;height:min(50svh,460px);min-height:300px}}
`;

/** Storefront signs: which building each listed app or website's sign floats above. Plain ES5 (it runs inside CITY_JS too).
 *  Rules, the same for every viewer and stable across loads (only the city's data decides):
 *  - a listing tied to a repo ("| repo-name") floats above that repo's building;
 *  - otherwise above a building of its own district, one sign per building first (the building with the fewest signs,
 *    ties broken by a hash of the listing's name), so signs spread out instead of piling on one tower;
 *  - padlocked (private) buildings never carry a sign; a listing with no building to float above keeps a small shop
 *    building of its own.
 *  Returns [{r: listing, host: the repo it floats above (or the listing itself)}]. */
const SF_PLACE_JS = String.raw`function sfPlace(ds){
  function hs(t){var h=0;t=String(t||'');for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
  function rr(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
  var out=[];
  ds.forEach(function(d){
    var ls=(d.repos||[]).filter(function(r){return r.kind}).sort(function(a,b){return String(a.name).localeCompare(String(b.name))||String(a.url||'').localeCompare(String(b.url||''))});
    if(!ls.length)return;
    var hosts=d.apart?[]:(d.repos||[]).filter(function(r){return !r.kind&&!r.locked&&r.name}).map(function(r){return {r:r,n:0}}).sort(function(a,b){return String(a.r.name).localeCompare(String(b.r.name))});
    ls.forEach(function(l){var sd=hs(l.name+'|'+(d.nb||'')+'|'+d.name),on=String((l.meta||{}).on||'').toLowerCase(),H=null,best=1e9;
      if(on)hosts.forEach(function(x){if(String(x.r.name).toLowerCase()===on)H=x});
      if(!H)hosts.forEach(function(x,hi){var s=x.n*10+rr(sd+hi*13.7)*5;if(s<best){best=s;H=x}});
      if(!H){out.push({r:l,host:l});return}
      H.n++;out.push({r:l,host:H.r})})});
  return out}`;
/** Test hook: the renderer's placement, run in Node. */
export function placeStorefronts(districts: CityDistrict[]): { r: CityRepo; host: CityRepo }[] {
  return (new Function(SF_PLACE_JS + ";return sfPlace") as () => (...a: unknown[]) => never)()(districts);
}

// The renderer (plain ES5-ish so it runs everywhere, including inside Obsidian's sandboxed tab).
export const CITY_JS = String.raw`(function(){
var D=JSON.parse(document.getElementById('city-data').textContent);
var cv=document.getElementById('city'),st=document.getElementById('stage'),cx=cv.getContext('2d'),card=document.getElementById('card');
var TW=64,TH=32,LANG={TypeScript:'#3178C6',JavaScript:'#E8C547',Python:'#4FB89A',HTML:'#E07A4F',Swift:'#F05138',CSS:'#6E5BD0',Shell:'#7FB24A',Go:'#2FB5D6',Rust:'#C9744A',App:'#6C63FF',Web:'#1FA39A'};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var hr=new Date().getHours(),night=hr<6||hr>=19,labels=true;
var MINI=/[#&]mini\b/.test(location.hash)||window.CALDERA_MINI===1;if(MINI){document.documentElement.classList.add('c-mini');labels=false}
function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
function hash(t){var h=0;for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;r=Math.round(Math.min(255,r*f));g=Math.round(Math.min(255,g*f));b=Math.round(Math.min(255,b*f));return 'rgb('+r+','+g+','+b+')'}
var now=Date.now(),DAY=864e5;
// ---- layout: districts are square blocks packed in rows with 1-tile roads between them
var blocks=[],tiles={},W=0,H=0,x=1,y=1,rowH=0;
function placeDistrict(d,x,y,k,houses){if(d.estate)return placeEstate(d,x,y,k);
  var b={d:d,x:x,y:y,k:k};blocks.push(b);
  var cells=[];for(var j=0;j<k;j++)for(var i=0;i<k;i++)cells.push([x+i,y+j]);
  cells.sort(function(a,c){return (a[0]+a[1])-(c[0]+c[1])});   // biggest towers at the back
  d.repos.forEach(function(r,i){var c=cells[i];tiles[c[0]+','+c[1]]={t:'b',r:r,d:d}});
  var hi=d.repos.length,left=houses;
  while(left>0&&hi<cells.length){var c=cells[hi++];var n=Math.min(4,left);left-=n;tiles[c[0]+','+c[1]]={t:'h',n:n,d:d}}
  for(;hi<cells.length;hi++){var c2=cells[hi];tiles[c2[0]+','+c2[1]]={t:'p',d:d}}
  return b}
// ---- storefront signs (see sfPlace): a listing's sign floats above a building and the listing stops taking a plot of its own
${SF_PLACE_JS}
var SFA=new Map();(function(){var pl=sfPlace(D.districts),gone=new Set();
  pl.forEach(function(p){var L=SFA.get(p.host);if(!L){L=[];SFA.set(p.host,L)}L.push({r:p.r});if(p.host!==p.r)gone.add(p.r)});
  if(gone.size)D.districts.forEach(function(d){d.repos=d.repos.filter(function(r){return !gone.has(r)})})})();
var NBS=[],NBM={},AVX={},AVY={};
if(D.world){
  // the world: each member is a neighborhood (their own districts packed together), neighborhoods sit on a loose grid
  // with wide grass margins and an avenue on every grid line, so nothing overlaps and one tall member can't wall off the rest
  D.districts.forEach(function(d){var key=d.nb||d.name;if(!NBM[key]){NBM[key]={key:key,ds:[]};NBS.push(NBM[key])}NBM[key].ds.push(d)});
${GROWTH_LAYOUT_JS}
  NBS.forEach(function(n){var ar=0;n.ds.forEach(function(d){d._h=Math.min(d.notes||0,16);var need=d.repos.length+Math.ceil(d._h/4);d._k=d.estate?d.K:Math.max(2,Math.ceil(Math.sqrt(need)));ar+=(d._k+1)*(d._k+1)});
    var mw=Math.max(3,Math.ceil(Math.sqrt(ar)*1.1)),lx=0,ly=0,rh=0,w=0,h=0;
    n.ds.forEach(function(d){if(d.apart&&(lx>0||ly>0)){if(lx>0){lx=0;ly+=rh+1;rh=0}ly+=2}else if(lx+d._k>mw&&lx>0){lx=0;ly+=rh+1;rh=0}d._lx=lx;d._ly=ly;lx+=d._k+1;rh=Math.max(rh,d._k);w=Math.max(w,lx-1);h=Math.max(h,ly+rh)});n.w=w;n.h=h});
  var GAP=5,cols=Math.max(1,Math.ceil(Math.sqrt(NBS.length*1.3))),rows=Math.max(1,Math.ceil(NBS.length/cols)),CWs=[],CHs=[],X0=[1],Y0=[1];
  NBS.forEach(function(n,ix){n.cx=ix%cols;n.cy=Math.floor(ix/cols);CWs[n.cx]=Math.max(CWs[n.cx]||0,n.w);CHs[n.cy]=Math.max(CHs[n.cy]||0,n.h)});   // each column/row only as wide as its biggest member
  for(var ci=0;ci<cols;ci++)X0.push(X0[ci]+(CWs[ci]||0)+GAP);for(var rj=0;rj<rows;rj++)Y0.push(Y0[rj]+(CHs[rj]||0)+GAP);
  NBS.forEach(function(n){n.ax=X0[n.cx];n.ay=Y0[n.cy];n.ox=n.ax+Math.ceil(GAP/2)+Math.floor((CWs[n.cx]-n.w)/2);n.oy=n.ay+Math.ceil(GAP/2)+Math.floor((CHs[n.cy]-n.h)/2);
    n.blocks=n.ds.map(function(d){return placeDistrict(d,n.ox+d._lx,n.oy+d._ly,d._k,d._h)});
    var big=n.blocks.slice().sort(function(a,b){return b.d.repos.length-a.d.repos.length})[0];big.rep=true;n.rep=big;big.nbo=n});
  W=X0[cols]+1;H=Y0[rows]+1;
  X0.forEach(function(v){AVX[v]=1});Y0.forEach(function(v){AVY[v]=1});
  for(var aj=1;aj<H;aj++)for(var ai=1;ai<W;ai++)if(AVX[ai]||AVY[aj])tiles[ai+','+aj]={t:'r',av:1};
  // a short street from each neighborhood's ring road out to the avenue on its left and above, so cars can reach every member
  NBS.forEach(function(n){var my=n.oy+Math.floor(n.h/2),mx=n.ox+Math.floor(n.w/2);
    for(var si=n.ax;si<n.ox-1;si++)tiles[si+','+my]={t:'r'};for(var sj=n.ay;sj<n.oy-1;sj++)tiles[mx+','+sj]={t:'r'}});
}else{
var area=D.districts.reduce(function(s,d){var n=d.repos.length+Math.ceil(Math.min(d.notes,40)/4);var k=Math.max(2,Math.ceil(Math.sqrt(n)));return s+(k+1)*(k+1)},0);
var maxW=Math.max(8,Math.ceil(Math.sqrt(area)*1.25));
D.districts.forEach(function(d){
  var houses=Math.min(d.notes,40),need=d.repos.length+Math.ceil(houses/4),k=Math.max(2,Math.ceil(Math.sqrt(need)));
  if(d.apart&&(x>1||y>1)){if(x>1){x=1;y+=rowH+1;rowH=0}y+=2}else if(x+k>maxW&&x>1){x=1;y+=rowH+1;rowH=0}   // the anonymous private district stands apart
  placeDistrict(d,x,y,k,houses);
  x+=k+1;rowH=Math.max(rowH,k);W=Math.max(W,x);H=Math.max(H,y+rowH+1);
});
W=Math.max(W,maxW)+1;H+=1;
}
function near(i,j){for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++){var n=tiles[(i+a)+','+(j+b)];if(n&&(n.t==='b'||n.t==='h'||n.t==='p'||n.t==='L'))return true}return false}
for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var key=i+','+j;if(!tiles[key])tiles[key]={t:(i===0||j===0||i===W||j===H)?'g':near(i,j)?'r':'g'}}
// ---- free tools (window.CALDERA_TOOLS, set by the hub): a Workshop beside a road in the maker's city, or on the World
// map one Market plaza (2x2) near the middle with a stall per tool. Click it for the list; nothing is hosted here.
var TOOLS=Array.isArray(window.CALDERA_TOOLS)?window.CALDERA_TOOLS.filter(function(t){return t&&t.id&&t.name}).slice(0,24):[],SHOP=null;
(function(){if(!TOOLS.length)return;var best=null,bd=1e9,g=function(i,j){var t=tiles[i+','+j];return t&&t.t==='g'&&!water(i,j)&&i>0&&j>0&&i<W&&j<H},
  rd=function(i,j){return isRoad(i-1,j)||isRoad(i+1,j)||isRoad(i,j-1)||isRoad(i,j+1)};
  for(var j=1;j<H;j++)for(var i=1;i<W;i++){if(!g(i,j)||(!D.world&&Math.hypot(i-W,j-H)<4))continue;   // a city's front corner is the drones' sky base
    var ok=D.world?[0,1,2].every(function(a){return [0,1,2].every(function(b2){return g(i+a,j+b2)})})&&[0,1,2].some(function(a){return rd(i+a,j)||rd(i,j+a)||rd(i+2,j+a)||rd(i+a,j+2)}):rd(i,j);if(!ok)continue;
    var bt=function(a,b){var t=tiles[a+','+b];return t&&(t.t==='b')},clear=D.world?!(bt(i+2,j)||bt(i,j+2)||bt(i+2,j+1)||bt(i+1,j+2)||bt(i+2,j+2)):!(bt(i+1,j)||bt(i,j+1)||bt(i+1,j+1)||bt(i+2,j+1)||bt(i+1,j+2));
    // World: the open middle, nothing tall in front. A city: the front edge, nearest the viewer, so no tower can hide it
    var d=D.world?Math.hypot(i-W/2,j-H/2)-(clear?1000:0):-(i+j)+.6*Math.abs(i-j)-(clear?1000:0);if(d<bd){bd=d;best=[i,j]}}
  if(!best)return;SHOP={i:best[0],j:best[1],big:!!D.world};tiles[best[0]+','+best[1]]={t:'w'};
  if(D.world)for(var a=0;a<3;a++)for(var b2=0;b2<3;b2++)if(a||b2)tiles[(best[0]+a)+','+(best[1]+b2)]={t:'wp'}})();
// ---- buildings
var maxC=1;D.districts.forEach(function(d){d.repos.forEach(function(r){maxC=Math.max(maxC,r.commits)})});
function bh(r){if(r.kind)return D.world?30:46;return D.world?14+Math.min(110,Math.round(20*Math.log2(1+r.commits/8))):16+Math.min(230,Math.round(34*Math.log2(1+r.commits/8)))}
var maxH=0,ranked=[];D.districts.forEach(function(d){d.repos.forEach(function(r){maxH=Math.max(maxH,bh(r));ranked.push(r)})});
ranked.sort(function(a,b){return (b.week*20+b.commits)-(a.week*20+a.commits)});var topSet=ranked.slice(0,12);
function dormant(r){return r.pushed&&now-Date.parse(r.pushed)>60*DAY&&!r.week}
// ---- view
var dpr=1,vw=0,vh=0,cam={x:0,y:0,z:1};
function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}
var FITZ=0;   // the zoom that fits the whole map: world labels loosen their budget as you zoom past it
function fit(){COBT=0;var r=st.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,MINI?1.5:3);vw=r.width;vh=r.height;cv.width=vw*dpr;cv.height=vh*dpr;
  var spanX=(W+H)*TW/2+TW,spanY=(W+H)*TH/2+maxH+40;cam.z=Math.min(1.6,Math.max(D.world?.08:.3,Math.min(vw/spanX,vh/spanY)*.98));
  var c=iso(W/2,H/2);cam.x=vw/2-c.x*cam.z;cam.y=vh/2-c.y*cam.z+(maxH/2)*cam.z;
  if(under){var y0=iso(0,0).y-maxH*.6,y1=iso(W,H).y+DROP+DSPAN+20;cam.z=Math.min(1.4,Math.max(.25,Math.min(vw/spanX,vh/(y1-y0))*.96));cam.x=vw/2-c.x*cam.z;cam.y=vh/2-((y0+y1)/2)*cam.z}
  FITZ=cam.z;dirty=true;UDIRTY=true}
// ---- cars wander the roads
var roads=[];for(var k in tiles)if(tiles[k].t==='r'){var p=k.split(',');roads.push([+p[0],+p[1]])}
var traffic=D.districts.reduce(function(s,d){return s+d.repos.reduce(function(a,r){return a+r.week},0)},0);
var cars=[];for(var c=0;c<Math.min(70,4+Math.round(traffic/6))&&roads.length;c++){var s=roads[Math.floor(rnd(c+1)*roads.length)];cars.push({i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][c%5]})}
// ---- live traffic on the owner's own sites (polled from the hub, or posted in by Obsidian): every visitor rides out of
// their district as a light (white), signups pulse pink, purchases fire a gold beam. Public pages get activity levels only.
var LV={d:{},seen:'',mode:''},vis=[],pulses=[],VCOL='#FFFFFF',SCOL='#FF4FD8',BCOL='#FFD23F';
var byName={};blocks.forEach(function(b){byName[b.d.name]=b});if(D.world)NBS.forEach(function(n){byName[n.key]=n.rep});
function exits(b){if(b.ex)return b.ex;b.ex=[];for(var j=b.y-1;j<=b.y+b.k;j++)for(var i=b.x-1;i<=b.x+b.k;i++)if(isRoad(i,j))b.ex.push([i,j]);return b.ex}
function spawn(b,col,fast){var ex=exits(b);if(!ex.length||vis.length>160)return;var s=ex[Math.floor(Math.random()*ex.length)];
  var v={i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:col,b:b,born:performance.now(),life:14000+Math.random()*9000,sp:fast?.06:.045};step(v);vis.push(v)}
function pulse(b,col,big){var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5);pulses.push({x:p.x,y:p.y,col:col,born:performance.now(),big:big})}
function onLive(data){if(D.world&&data&&data.lit&&typeof data.lit==='object')LIT=data.lit;if(data&&data.districts&&typeof data.districts==='object'){var gt={},gs={};for(var gk in data.districts){var gd=data.districts[gk]||{},gv=+gd.glow;if(gv>0)gt[gk]=Math.min(1,gv);if(gd.sites&&typeof gd.sites==='object'){var sm={},sn=0;for(var sk in gd.sites){var sv=+gd.sites[sk];if(sv>0&&sn<24){sm[String(sk).slice(0,40)]=Math.min(1,sv);sn++}}if(sn)gs[gk]=sm}}GT=gt;GS=gs}if(D.world&&data&&typeof data.members==='number'&&typeof worldGrew==='function')worldGrew(data.members);if(!data||typeof data!=='object'||!data.districts||typeof data.districts!=='object')return;LV.mode=data.private?'private':'public';LV.d=data.districts;
  if(!LV.on&&Object.keys(LV.d).length){LV.on=true;cars.length=0}   // live data replaces the ambient traffic: from now on every car is a real visitor
  if(LV.on)reconcile();
  if(Array.isArray(data.agents))agentsIn(data.agents);
  if(Array.isArray(data.events)){var first=!LV.seen,fresh=data.events.filter(function(ev){return ev&&ev.ts>LV.seen&&(ev.k!=='view'||ev.n)}).reverse();
    var nv=0,nc=0;if(!first)fresh.slice(-40).forEach(function(ev){if(ev.k==='kudos')return void setTimeout(function(){kudosBurst(ev)},(nc++)*900);var b=byName[ev.d]||byName.Private;if(!b)return;
      if(ev.k==='view')return void setTimeout(function(){arrive(b,'view')},(nv++)*350);
      setTimeout(function(){spawn(b,ev.k==='buy'?BCOL:SCOL,true);pulse(b,ev.k==='buy'?BCOL:SCOL,ev.k==='buy');celebrate(b,ev.k,ev.d);arrive(b,ev.k)},(nc++)*900)});
    data.events.forEach(function(ev){if(ev&&ev.ts>LV.seen)LV.seen=ev.ts});if(!LV.seen)LV.seen=String(data.at||'0')}
  if(data.arrivals&&typeof data.arrivals==='object'&&LV.at)Object.keys(data.arrivals).forEach(function(k){var a=data.arrivals[k]||{},b=byName[k]||byName.Private;if(!b)return;   // public: counts only
    for(var i=0;i<Math.min(+a.v||0,40);i++)(function(i){setTimeout(function(){arrive(b,'view')},i*350)})(i);
    for(var j=0;j<Math.min(+a.s||0,5);j++)(function(j){setTimeout(function(){pulse(b,SCOL,false);celebrate(b,'signup',k);arrive(b,'signup')},j*900)})(j);
    for(var m2=0;m2<Math.min(+a.b||0,5);m2++)(function(m2){setTimeout(function(){pulse(b,BCOL,true);celebrate(b,'buy',k)},m2*900+400)})(m2)});
  onDay(data);liveConnected();
  if(data.at)LV.at=String(data.at);
  hud();draw()}
// ---- arrivals: every new visitor drops in from the sky onto its district (parachute, landing ring, walks to a building);
// a signup is a beam of light, confetti and a toast; a sale is a gold coin burst. Capped and queued when it floods.
var FX={drops:[],queue:[],parts:[],beams:[],more:{}},MAXDROP=MINI?5:8,toasts=document.querySelector('.c-toasts'),sound=false,AC=null;
try{sound=localStorage.getItem('caldera-sound')==='1'}catch(err){}
function arrive(b,kind){if(!b)return;if(FX.drops.length>=MAXDROP){if(FX.queue.length<24)FX.queue.push(b);else{var mo=FX.more[b.d.name]||(FX.more[b.d.name]={n:0,b:b});mo.n++;mo.until=performance.now()+5000}return}
  var path=arrivalPath(b);if(!path)return;var p=path[0];
  FX.drops.push({x:p.x,y:p.y,path:path,col:kind==='signup'?SCOL:kind==='buy'?BCOL:null,born:performance.now(),sw:Math.random()*6.28});tone([880,1320],.05)}
function toast(kind,district){if(!toasts)return;var t=document.createElement('div');t.className='c-toast'+(kind==='buy'?' buy':'');
  var priv=LV.mode!=='private'&&district==='Private';   // public pages never name a private project
  t.textContent=kind==='buy'?(priv?'\u{1F4B0} A sale':'\u{1F4B0} New sale · '+district):(priv?'✨ Someone joined':'✨ New signup · '+district);
  toasts.insertBefore(t,toasts.firstChild);while(toasts.children.length>3)toasts.removeChild(toasts.lastChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},5200)}
// kudos: the emoji rises over the city from a random district, with a toast naming who sent it (private feed only)
var KEMO={heart:'\u2764\uFE0F',up:'\u{1F44D}',fire:'\u{1F525}',sparkle:'\u2728'};
function kudosBurst(ev){var ks=Object.keys(byName),b=byName[ks[Math.floor(Math.random()*ks.length)]];var em=KEMO[ev.e]||KEMO.heart;
  if(toasts){var t=document.createElement('div');t.className='c-toast';t.textContent=em+' '+(typeof ev.from==='string'&&/^[a-z0-9-]{1,40}$/.test(ev.from)?'@'+ev.from:'Someone')+' sent you kudos';toasts.insertBefore(t,toasts.firstChild);while(toasts.children.length>3)toasts.removeChild(toasts.lastChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},5200)}
  if(!b)return;var c0=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),tn=performance.now();
  for(var i=0;i<(MINI?10:18);i++){var a=-Math.PI/2+(Math.random()-.5)*1.4,v=50+Math.random()*60;FX.parts.push({x:c0.x,y:c0.y-60,vx:Math.cos(a)*v,vy:Math.sin(a)*v-140,emo:em,born:tn+i*70,life:2600+Math.random()*700,rot:0})}
  tone([659,880,1175],.07)}
function celebrate(b,kind,district){if(!b)return;toast(kind,district||(D.world?b.d.nb:b.d.name)||b.d.name);var c0=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),tn=performance.now(),buy=kind==='buy';
  FX.beams.push({x:c0.x,y:c0.y,col:buy?BCOL:SCOL,born:tn});
  var CONF=['#FF4FD8','#3DF2FF','#FFD23F','#7CFF6B','#FF7A45','#B58CFF'];
  for(var i=0;i<(MINI?26:48);i++){var a=Math.random()*6.28,v=40+Math.random()*(buy?70:110);FX.parts.push({x:c0.x,y:c0.y-(buy?40:130)*Math.max(1,.9/cam.z),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-(buy?120:60),col:buy?(i%3?'#FFD23F':'#FFF1A8'):CONF[i%CONF.length],born:tn+Math.random()*120,life:1800+Math.random()*900,coin:buy,rot:Math.random()*6})}
  tone(buy?[784,988,1319,1568]:[523,659,784,1047],.09)}
function tone(fs,len){if(!sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t0=AC.currentTime;fs.forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0,t0+i*len);g.gain.linearRampToValueAtTime(.06,t0+i*len+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+i*len+len*2.2);o.connect(g);g.connect(AC.destination);o.start(t0+i*len);o.stop(t0+i*len+len*2.4)})}catch(err){}}
function person(c,x,y,col,s){c.fillStyle=col;c.strokeStyle=sky==='day'||sky==='dusk'?'rgba(10,14,30,.75)':'rgba(0,0,0,.55)';c.lineWidth=.8;
  c.beginPath();c.arc(x,y-9*s,2.2*s,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x-1.6*s,y-6.5*s);c.lineTo(x+1.6*s,y-6.5*s);c.lineTo(x+1.2*s,y-2*s);c.lineTo(x-1.2*s,y-2*s);c.closePath();c.fill();c.stroke();
  c.strokeStyle=col;c.lineWidth=1.2*s;c.beginPath();c.moveTo(x-.8*s,y-2*s);c.lineTo(x-1.4*s,y);c.moveTo(x+.8*s,y-2*s);c.lineTo(x+1.4*s,y);c.stroke()}
function drawFx(){var tn=performance.now(),more=Object.keys(FX.more);if(!FX.drops.length&&!FX.parts.length&&!FX.beams.length&&!more.length)return;
  var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var day=sky==='day',col=day?'#1E6FD9':'#7FE7FF',K=Math.max(1.25,1.1/cam.z);   // effects keep a readable size when zoomed out
  FX.beams=FX.beams.filter(function(b){return tn-b.born<2400});FX.beams.forEach(function(b){var pr=(tn-b.born)/2400,a=pr<.15?pr/.15:1-(pr-.15)/.85;c.save();if(!day)c.globalCompositeOperation='lighter';
    var g=c.createLinearGradient(0,b.y-420*K,0,b.y);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,b.col);c.globalAlpha=a*.85;c.fillStyle=g;var w=(10+8*Math.sin(pr*9))*K;c.fillRect(b.x-w/2,b.y-420*K,w,420*K);
    c.globalAlpha=a*.6;c.fillRect(b.x-1.5*K,b.y-420*K,3*K,420*K);c.restore()});
  FX.drops=FX.drops.filter(function(d){var t=tn-d.born;if(t<1950)return true;if(FX.queue.length)setTimeout(function(){arrive(FX.queue.shift(),'view')},60);return false});
  FX.drops.forEach(function(d){var t=tn-d.born,x=d.x,y=d.y,FALL=1300,S=PS,R=Math.max(1,.9/cam.z);   // the person and parachute are street scale; only the trail and landing ring stay readable when zoomed out
    if(t<FALL){var f=t/FALL,e2=f*f*(3-2*f),sw=Math.sin(t/180+d.sw)*3*S*(1-f);x+=sw;y=d.y-200*(1-e2);
      c.save();var g=c.createLinearGradient(0,y-60*R,0,y-6*S);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,day?'rgba(30,111,217,.4)':'rgba(127,231,255,.55)');c.strokeStyle=g;c.lineWidth=1.2*R;c.beginPath();c.moveTo(x-sw*.6,y-60*R);c.lineTo(x,y-13*S);c.stroke();
      c.fillStyle=day?'#FF6B4A':'#FF4FD8';c.beginPath();c.arc(x,y-19*S,7.5*S,Math.PI,0);c.closePath();c.fill();c.strokeStyle=day?'rgba(0,0,0,.45)':'rgba(255,255,255,.55)';c.lineWidth=.45;c.beginPath();c.moveTo(x-7.5*S,y-19*S);c.lineTo(x-1.4*S,y-8*S);c.moveTo(x+7.5*S,y-19*S);c.lineTo(x+1.4*S,y-8*S);c.stroke();c.restore();
      walkerFig(c,x,y,d.col||col,S,1,0,0)}
    else{if(!d.walk){d.walk=true;walker(d.path,false,d.col)}var t2=t-FALL;if(t2<650){var pr=t2/650;c.save();c.strokeStyle=d.col||col;c.globalAlpha=1-pr;c.lineWidth=1.1;c.beginPath();c.ellipse(d.x,d.y,(3+pr*12)*R,(3+pr*12)*.5*R,0,0,7);c.stroke();
      c.fillStyle=day?'rgba(120,100,80,.35)':'rgba(200,230,255,.25)';for(var k=0;k<5;k++){var a2=k*1.256+d.sw;c.beginPath();c.arc(d.x+Math.cos(a2)*(2+pr*7),d.y+Math.sin(a2)*(1+pr*3.5)-pr*2,.8*(1-pr),0,7);c.fill()}c.restore()}}});
  FX.parts=FX.parts.filter(function(p){return tn-p.born<p.life});FX.parts.forEach(function(p){var t=Math.max(0,tn-p.born)/1000,x=p.x+p.vx*K*t,y=p.y+(p.vy*t+140*t*t)*K,a=1-(tn-p.born)/p.life;if(t<=0)return;
    if(p.emo){c.save();c.globalAlpha=Math.max(0,a);c.font=Math.round(15*K)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';c.textAlign='center';c.fillText(p.emo,p.x+p.vx*K*t,p.y+(p.vy*t+40*t*t)*K);c.restore();return}
    c.save();c.globalAlpha=Math.max(0,a);c.fillStyle=p.col;if(p.coin){c.beginPath();c.ellipse(x,y,(3.2*Math.abs(Math.cos(t*8+p.rot))+.6)*K,3.2*K,0,0,7);c.fill();c.strokeStyle='#B8860B';c.lineWidth=.6;c.stroke()}
    else{c.translate(x,y);c.rotate(t*6+p.rot);c.fillRect(-2*K,-1*K,4*K,2*K)}c.restore()});
  more.forEach(function(k){var m=FX.more[k];if(tn>m.until){delete FX.more[k];return}var p2=iso(m.b.x+m.b.k/2-.5,m.b.y-.5);tronPill(c,p2.x,p2.y-40,'+'+m.n+' arriving',day?'#1E6FD9':'#7FE7FF','600 10.5px ui-monospace,monospace')})}
var HND=(location.pathname.match(/\/@([a-z0-9-]+)\//)||[])[1]||'';
// ---- people on foot: arrivals land at street scale (the size of the cars) and walk to a building's door; people who
// left walk back out as faint ghosts; worn paths show where the day's visitors went. All drawn under the buildings
// layer so a building in front hides whoever is behind it.
var WID=0,PS=.55,WALKS=[],WMAX=MINI?16:40,WQ=[],GHOSTCOL='#A9C2D8',DEPSEEN={},DEPFIRST=true,TRACES=[],TODAY=null,lastWT=0;
function roadPath(a,b,max){if(a[0]===b[0]&&a[1]===b[1])return [a];var key=function(t){return t[0]+','+t[1]},prev={},q=[a],seen={};seen[key(a)]=1;
  while(q.length){var t=q.shift();if(t[0]===b[0]&&t[1]===b[1]){var out=[t],k=key(t);while(prev[k]){out.unshift(prev[k]);k=key(prev[k])}return out}
    if(max&&q.length>4000)break;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var n=[t[0]+d[0],t[1]+d[1]],kn=key(n);if(!seen[kn]&&isRoad(n[0],n[1])){seen[kn]=1;prev[kn]=t;q.push(n)}})}return null}
function adjRoads(i,j){return [[i+1,j],[i-1,j],[i,j+1],[i,j-1]].filter(function(n){return isRoad(n[0],n[1])})}
// a building with a street outside its door (falls back to any building in the district)
// how much a tile is hidden from the viewer by tall buildings standing in front of it
function hiddenBy(i,j){var h=0;for(var d=0;d<=9;d++)[[d+1,d],[d,d+1],[d+1,d+1]].forEach(function(o){var t=tiles[(i+o[0])+','+(j+o[1])];if(t&&t.t==='b'&&bh(t.r)>(o[0]+o[1]-1)*TH/2)h+=1});return h}   // a tower in front (same screen column, nearer) covers the street behind it
function doorFor(b){var bl=BDIST[b.d.name]||[],ex=exits(b);if(!bl.length||!ex.length)return null;var cands=[];
  bl.forEach(function(o){ex.forEach(function(E){var d=Math.abs(E[0]-o.i)+Math.abs(E[1]-o.j);if(d<1||d>2)return;
    var mid=d===2?[Math.round((E[0]+o.i)/2),Math.round((E[1]+o.j)/2)]:null;if(mid){var mt=tiles[mid[0]+','+mid[1]];if(!mt||(mt.t!=='p'&&mt.t!=='r'))return}   // across an open plaza only, never through a building or the houses
    cands.push({o:o,E:E,d:d,h:hiddenBy(E[0],E[1])+(mid?hiddenBy(mid[0],mid[1]):0)+(d-1)*.5+(E[0]+E[1]<o.i+o.j?.25:0)})})});
  if(!cands.length)return null;cands.sort(function(p,q){return p.h-q.h});var best=cands.filter(function(x){return x.h<=cands[0].h+.01});return best[Math.floor(Math.random()*best.length)]}   // doors the viewer can see: walking in should be visible
function wpts(tl){var pts=[];for(var k=0;k<tl.length;k++){var a=tl[k],b=tl[k+1]||tl[k-1]||a,p=iso(a[0],a[1]),q=iso(b[0],b[1]),dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy)||1,s=k+1<tl.length?1:-1;
    pts.push({x:p.x-(-dy/l)*7*s,y:p.y-(dx/l*.5)*7*s})}return pts}
function lerpPt(a,b,f){return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}}
function walker(pts,ghost,col,delay){var len=0,seg=[];for(var k=1;k<pts.length;k++){var l=Math.hypot(pts[k].x-pts[k-1].x,pts[k].y-pts[k-1].y);seg.push(l);len+=l}
  var w={pts:pts,seg:seg,len:Math.max(1,len),d:0,sp:ghost?14:18,ghost:ghost,col:col,id:++WID,born:performance.now()+(delay||0)};
  if(WALKS.length>=WMAX){if(WQ.length<40)WQ.push(w);return}WALKS.push(w)}
function walkAt(w){var d=w.d;for(var k=0;k<w.seg.length;k++){if(d<=w.seg[k]){var f=d/(w.seg[k]||1),a=w.pts[k],b=w.pts[k+1];return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,ux:(b.x-a.x)/(w.seg[k]||1),uy:(b.y-a.y)/(w.seg[k]||1)}}d-=w.seg[k]}
  var z=w.pts[w.pts.length-1];return {x:z.x,y:z.y,ux:0,uy:0}}
// arrival: the street path from where the parachute lands to the door (the last stretch goes in through it)
function arrivalPath(b){var df=doorFor(b);if(!df)return null;var ex=exits(b).filter(function(t){var d=Math.abs(t[0]-df.E[0])+Math.abs(t[1]-df.E[1]);return d>=2&&d<=4}).sort(function(p,q){return hiddenBy(p[0],p[1])-hiddenBy(q[0],q[1])}),L=ex.length?ex[Math.floor(Math.random()*Math.ceil(ex.length/2))]:df.E;
  var tl=roadPath(L,df.E,1)||[df.E],pts=wpts(tl),door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]);pts.push(lerpPt(Ec,door,1-.58/df.d),lerpPt(Ec,door,1-.42/df.d));return pts}
function departurePath(b){var df=doorFor(b);if(!df)return null;var ex=exits(b),best=df.E,bd=-1;ex.forEach(function(t){var d=Math.abs(t[0]-df.E[0])+Math.abs(t[1]-df.E[1]);if(d<=6&&d>bd&&Math.random()<.7){bd=d;best=t}});
  var door=iso(df.o.i,df.o.j),Ec=iso(df.E[0],df.E[1]),tl=roadPath(df.E,best,1)||[df.E];return [lerpPt(Ec,door,1-.45/df.d),lerpPt(Ec,door,1-.6/df.d)].concat(wpts(tl))}
function ghostOut(b,delay){if(!b)return;var p=departurePath(b);if(p)walker(p,true,GHOSTCOL,delay)}
function stepWalks(tn){var dt=lastWT?Math.min(100,tn-lastWT):0;lastWT=tn;
  WALKS=WALKS.filter(function(w){if(tn<w.born)return true;w.d+=w.sp*dt/1000;return w.d<w.len});
  while(WALKS.length<WMAX&&WQ.length){var w=WQ.shift();w.born=Math.max(w.born,tn);WALKS.push(w)}}
// a person at street scale: head, body and two legs that stride (3 frames) along the direction of travel
function walkerFig(c,x,y,col,s,wf,ux,uy){var st=[-1,0,1,0][wf]*1.5*s;c.fillStyle=col;c.beginPath();c.arc(x,y-9*s,2.2*s,0,7);c.fill();
  c.beginPath();c.moveTo(x-1.6*s,y-6.5*s);c.lineTo(x+1.6*s,y-6.5*s);c.lineTo(x+1.2*s,y-2*s);c.lineTo(x-1.2*s,y-2*s);c.closePath();c.fill();
  c.strokeStyle=col;c.lineWidth=1.25*s;c.lineCap='round';c.beginPath();c.moveTo(x-.6*s,y-2*s);c.lineTo(x-.9*s+ux*st,y+uy*st*.5);c.moveTo(x+.6*s,y-2*s);c.lineTo(x+.9*s-ux*st,y-uy*st*.5);c.stroke();
  c.beginPath();c.moveTo(x-1.5*s,y-6*s);c.lineTo(x-1.9*s-ux*st*.6,y-3.4*s);c.moveTo(x+1.5*s,y-6*s);c.lineTo(x+1.9*s+ux*st*.6,y-3.4*s);c.stroke()}
function drawWalks(){if(INTRO)return;if(!WALKS.length)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var day=sky==='day',live=day?'#1E5FBF':'#BFF3FF',shade=day?'rgba(0,0,0,.22)':'rgba(0,0,0,.35)';
  WALKS.slice().sort(function(a,b){return walkAt(a).y-walkAt(b).y}).forEach(function(w){if(tn<w.born)return;var p=walkAt(w),f=w.d/w.len,a;
    if(w.ghost)a=.42*Math.min(1,w.d/8)*(f>.7?Math.max(0,1-(f-.7)/.3):1);else a=f>.86?Math.max(0,1-(f-.86)/.14):1;   // arrivals fade into the doorway, ghosts fade at the district edge
    if(a<=0)return;var wf=Math.floor(w.d/2.4)%4;c.save();c.globalAlpha=a;
    c.fillStyle=shade;c.beginPath();c.ellipse(p.x+1,p.y+.6,2.4*PS,1*PS,0,0,7);c.fill();
    walkerFig(c,p.x,p.y,w.ghost?GHOSTCOL:(w.col||live),PS,wf,p.ux,p.uy);c.restore()})}
// worn paths: footprints between the street and each busy building's door, brighter with more visitors today (log
// scale), newer visits counting more; they reset at the viewer's local midnight
function buildTraces(){TRACES=[];if(!TODAY)return;var mid=new Date();mid.setHours(0,0,0,0);var m0=mid.getTime(),Q15=9e5,wmax=0,W={};
  Object.keys(TODAY).forEach(function(k){var x=TODAY[k],t0=Date.parse(x.t0)||0,w=0;(x.q||[]).forEach(function(n,i){var ts=t0+i*Q15;if(ts<m0||!n)return;w+=n*(.35+.65*Math.max(0,Math.min(1,(ts-m0)/(Date.now()-m0||1))))});W[k]=w;wmax=Math.max(wmax,w)});
  if(!wmax)return;Object.keys(W).forEach(function(k){var b=byName[k];if(!b||!W[k])return;var br=Math.log(1+W[k])/Math.log(1+wmax);
    var bl=(BDIST[b.d.name]||[]).filter(function(o){return adjRoads(o.i,o.j).length}).sort(function(p,q){return ((q.r.week||0)*20+(q.r.commits||0))-((p.r.week||0)*20+(p.r.commits||0))}).slice(0,3);
    bl.forEach(function(o,ix){var E=adjRoads(o.i,o.j).sort(function(p,q){return (q[0]+q[1])-(p[0]+p[1])})[0],Ec=iso(E[0],E[1]),door=iso(o.i,o.j),pts=[];
      var nb=adjRoads(E[0],E[1]).filter(function(n){return !(n[0]===o.i&&n[1]===o.j)})[0];if(nb){var q=iso(nb[0],nb[1]);pts.push(lerpPt(q,Ec,.35))}pts.push(Ec,lerpPt(Ec,door,.42));
      TRACES.push({pts:pts,a:br*(1-ix*.25),seed:o.i*31+o.j*7})})})}
function drawTraces(){if(!TRACES.length||sky==='grid')return;var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);var k=wxKind(),day=sky==='day'||sky==='dusk';
  var wet=k==='rain'||k==='storm'||k==='drizzle',col=k==='snow'?(day?'60,85,125':'170,190,220'):!day?(wet?'170,200,240':'200,214,236'):wet?'12,20,34':'70,52,36';   // wet prints at night catch the street light
  TRACES.forEach(function(t){for(var s=0;s<t.pts.length-1;s++){var a=t.pts[s],b=t.pts[s+1],l=Math.hypot(b.x-a.x,b.y-a.y),n=Math.floor(l/3.2),ux=(b.x-a.x)/(l||1),uy=(b.y-a.y)/(l||1);
    for(var i=0;i<n;i++){var f=(i+.5)/n,side=i%2?1:-1,x=a.x+(b.x-a.x)*f-uy*side*1.3,y=a.y+(b.y-a.y)*f+ux*side*.65,al=(.1+.5*t.a)*(day?1:.85)*(.75+.25*rnd(t.seed+i*3.1+s));
      c.fillStyle='rgba('+col+','+al.toFixed(3)+')';c.beginPath();c.ellipse(x,y,1.15,.6,Math.atan2(uy,ux),0,7);c.fill();
      if(k==='rain'||k==='storm'){c.fillStyle='rgba(200,225,255,'+(al*.5).toFixed(3)+')';c.fillRect(x-.3,y-.4,.6,.3)}}}})}
// ---- weather: the viewer's real local weather (hub lookup, or Obsidian passing it in), or what they pick
var WX=null,WXMODES=['auto','clear','rain','snow','fog'],WXMODE='auto',WXN={auto:'Auto',clear:'Clear',partly:'Partly cloudy',overcast:'Overcast',drizzle:'Drizzle',rain:'Rain',storm:'Storm',snow:'Snow',fog:'Fog'};
try{var wv=localStorage.getItem('caldera-weather');if(wv&&WXMODES.indexOf(wv)>=0)WXMODE=wv}catch(err){}
var hw0=location.hash.match(/[#&]wx=([a-z]+)/);if(hw0)WXMODE=hw0[1];   // #wx=storm etc. for checking
function wxKind(){if(WXMODE!=='auto')return WXMODE;return WX&&WX.c?WX.c:'clear'}
function wxCloud(){var k=wxKind();if(WXMODE==='auto'&&WX&&WX.c)return Math.max(+WX.cloud||0,{rain:80,storm:95,drizzle:70,snow:80,fog:60,overcast:90}[k]||0);return {clear:8,partly:40,overcast:92,fog:65,drizzle:75,rain:88,storm:98,snow:85}[k]||10}
function wxWind(){var w=WXMODE==='auto'&&WX?+WX.wind||0:12,d=WXMODE==='auto'&&WX?(+WX.dir||270):250;return {vx:-Math.sin(d*Math.PI/180)*w,w:w}}   // meteorological: the direction it blows FROM
var CLOUDS=[],CLW=0,CLH=0,lastCT=0;
function cloudColor(){var k=wxKind(),dark=k==='storm'?.55:k==='rain'||k==='overcast'||k==='snow'?.3:k==='drizzle'||k==='fog'?.2:0;
  if(sky==='night')return 'rgba('+Math.round(52-dark*20)+','+Math.round(60-dark*20)+','+Math.round(82-dark*20)+',.62)';
  if(sky==='dusk')return 'rgba('+Math.round(255-dark*120)+','+Math.round(200-dark*90)+','+Math.round(190-dark*70)+',.6)';
  var g=Math.round(255-dark*110);return 'rgba('+g+','+(g+2>255?255:g+2)+','+(g+6>255?255:g+6)+','+(.82+dark*.15).toFixed(2)+')'}
function newCloud(edge){var s=.6+Math.random()*.9,ww=60*s+40;return {x:edge==null?Math.random()*(vw+2*ww)-ww:edge<0?-ww-Math.random()*40:vw+ww+Math.random()*40,y:(.04+Math.random()*.3)*vh,s:s,v:.7+Math.random()*.6,w:ww,p:Math.floor(Math.random()*3),gone:false}}
// clouds keep their own positions frame to frame: they drift with the wind, wrap only once fully off screen, and are
// never re-randomized by a resize, a phase change or a live update
function stepClouds(tn){if(!vw)return;var dt=lastCT?Math.min(200,tn-lastCT)/1000:0;lastCT=tn;
  if(CLW&&(CLW!==vw||CLH!==vh)){var fx=vw/CLW,fy=vh/CLH;CLOUDS.forEach(function(c){c.x*=fx;c.y*=fy})}CLW=vw;CLH=vh;
  var want=Math.round(1+wxCloud()/100*(MINI?6:10)),wd=wxWind(),dir=wd.vx<0?-1:1,sp=6+Math.min(40,Math.abs(wd.vx))*.9;
  if(!CLOUDS.length)for(var i=0;i<want;i++)CLOUDS.push(newCloud(null));
  var live=CLOUDS.filter(function(c){return !c.gone}).length;
  if(live>want){for(var j=0;j<CLOUDS.length&&live>want;j++)if(!CLOUDS[j].gone){CLOUDS[j].gone=true;live--}}   // retire extras: they drift off, never vanish
  while(live<want){CLOUDS.push(newCloud(-dir));live++}
  CLOUDS.forEach(function(c){c.x+=dir*sp*c.v*dt});
  CLOUDS=CLOUDS.filter(function(c){var off=dir>0?c.x-c.w>vw:c.x+c.w<0;if(!off)return true;if(c.gone)return false;var n=newCloud(-dir);c.x=n.x;c.y=n.y;c.s=n.s;c.w=n.w;return true})}
function drawClouds(c){var col=cloudColor();c.fillStyle=col;CLOUDS.forEach(function(k){var s=k.s;[[0,0,22],[18,4,16],[-18,5,15],[8,-8,15],[-6,-6,13],[30,6,11]].slice(0,5+k.p%2).forEach(function(b){c.beginPath();c.arc(k.x+b[0]*s,k.y+b[1]*s,b[2]*s,0,7);c.fill()})})}
var PRECIP=[],flash=0,nextBolt=0;
function stepPrecip(dt){var k=wxKind(),n=k==='storm'?(MINI?110:220):k==='rain'?(MINI?80:160):k==='drizzle'?(MINI?40:80):k==='snow'?(MINI?60:130):0;
  if(WXMODE==='auto'&&WX&&(k==='rain'||k==='storm'))n=Math.round(n*Math.min(1.4,.6+(+WX.precip||0)/4));
  while(PRECIP.length<n)PRECIP.push({x:Math.random()*vw,y:Math.random()*vh,z:.6+Math.random()*.6,snow:k==='snow'});
  if(PRECIP.length>n)PRECIP.length=n;var wd=wxWind(),slant=Math.max(-.6,Math.min(.6,wd.vx/45));
  PRECIP.forEach(function(p){p.snow=k==='snow';var vy=p.snow?28*p.z:(k==='drizzle'?260:520)*p.z;p.y+=vy*dt;p.x+=(p.snow?(slant*30+Math.sin((p.y+p.z*99)/30)*12):slant*vy)*dt;
    if(p.y>vh){p.y=-10;p.x=Math.random()*(vw+80)-40}if(p.x<-40)p.x+=vw+80;if(p.x>vw+40)p.x-=vw+80})}
function drawWeather(){var k=wxKind();if(sky==='grid')return;var c=cx;c.setTransform(dpr,0,0,dpr,0,0);var night=sky==='night',tn=performance.now();
  var gloom=k==='storm'?.24:k==='rain'?.14:k==='drizzle'?.08:k==='overcast'?.06:k==='snow'?.04:0;if(gloom){c.fillStyle='rgba(12,18,30,'+gloom+')';c.fillRect(0,0,vw,vh)}
  if(k==='snow'){c.fillStyle='rgba(235,242,250,'+(night?.08:.16)+')';c.fillRect(0,0,vw,vh)}
  if(k==='fog'){var g=c.createLinearGradient(0,vh*.15,0,vh);g.addColorStop(0,night?'rgba(70,78,96,.18)':'rgba(214,220,226,.28)');g.addColorStop(1,night?'rgba(70,78,96,.5)':'rgba(214,220,226,.6)');c.fillStyle=g;c.fillRect(0,0,vw,vh);
    c.fillStyle=night?'rgba(90,100,120,.12)':'rgba(240,244,248,.18)';for(var b=0;b<3;b++){var y=vh*(.45+b*.17)+Math.sin(tn/4000+b)*8,x=((tn/90+b*300)%(vw+400))-200;c.beginPath();c.ellipse(x,y,260,30,0,0,7);c.fill()}}
  if(PRECIP.length){var wd=wxWind(),slant=Math.max(-.6,Math.min(.6,wd.vx/45));
    if(k==='snow'){c.fillStyle=night?'rgba(220,230,245,.8)':'rgba(255,255,255,.95)';PRECIP.forEach(function(p){c.beginPath();c.arc(p.x,p.y,1.1+p.z*.9,0,7);c.fill()})}
    else{c.strokeStyle=night?'rgba(170,195,230,.45)':'rgba(70,95,130,.42)';c.lineWidth=1;c.beginPath();PRECIP.forEach(function(p){var l=(k==='drizzle'?5:11)*p.z;c.moveTo(p.x,p.y);c.lineTo(p.x-slant*l,p.y-l)});c.stroke()}}
  if(k==='storm'){if(tn>nextBolt){flash=tn;nextBolt=tn+6000+Math.random()*9000}var fa2=tn-flash;if(fa2<520){var a=fa2<90?.5:fa2<160?.08:fa2<240?.35:Math.max(0,.35*(1-(fa2-240)/280));c.fillStyle='rgba(230,236,255,'+a.toFixed(3)+')';c.fillRect(0,0,vw,vh)}}}
// sunrise and sunset from the viewer's real location drive Auto's day (falls back to fixed hours)
function sunKeys(){if(!WX||!WX.sunrise||!WX.sunset)return null;var r=new Date(WX.sunrise),s=new Date(WX.sunset),sr=r.getHours()*60+r.getMinutes(),ss=s.getHours()*60+s.getMinutes();
  if(!(sr>120&&ss>sr+240&&ss<1430))return null;var k=[[0,'night'],[sr-75,'night'],[sr+15,'dawn'],[sr+120,'day'],[ss-110,'day'],[ss-10,'dusk'],[ss+60,'evening'],[Math.min(1439,ss+150),'night'],[1440,'night']];
  for(var i=1;i<k.length;i++)if(k[i][0]<=k[i-1][0])k[i][0]=k[i-1][0]+1;return k}
function applyWeather(){var k=sunKeys();if(k)DAYKEYS=k;applySky();if(typeof skyLabel==='function')skyLabel();if(typeof wxLabel==='function')wxLabel();dirty=true}
// ---- today: "142 site visits today · 9 people on the sites now", from the live feed
var todayEl=null;function todayLine(){if(!TODAY||MINI)return;var v=0;Object.keys(TODAY).forEach(function(k){v+=+TODAY[k].v||0});
  var here=LV.mode==='private'?Object.keys(LV.d).reduce(function(s,k){return s+(+LV.d[k].now||0)},0):null,any=Object.keys(LV.d).some(function(k){return LV.d[k].level>0});
  if(!todayEl){todayEl=document.createElement('div');todayEl.className='c-today';st.appendChild(todayEl)}
  var lvp=st.querySelector('.c-live'),inLive=!!lvp&&st.clientWidth<600;   // phones: no room for two overlays at the bottom
  if(inLive&&todayEl.parentNode!==lvp){lvp.insertBefore(todayEl,lvp.firstChild);todayEl.classList.add('c-today-in')}else if(!inLive&&todayEl.parentNode!==st){st.appendChild(todayEl);todayEl.classList.remove('c-today-in')}
  todayEl.textContent=v.toLocaleString('en-US')+(v===1?' site visit':' site visits')+' today'+(here!=null?' · '+here+(here===1?' person':' people')+' on the sites now':any?' · live now':'');todayEl.title='Visits to the sites in this city in the last 24 hours, and people on them right now'}
function onDay(data){if(data.today&&typeof data.today==='object'){TODAY=data.today;buildTraces();todayLine()}
  var plan=[];
  if(Array.isArray(data.departures))data.departures.forEach(function(x){var id=x.v+'|'+x.ts;if(DEPSEEN[id]||!x.d)return;DEPSEEN[id]=1;plan.push(byName[x.d]||byName.Private)});
  if(data.left&&typeof data.left==='object')Object.keys(data.left).forEach(function(k){for(var i=0;i<Math.min(+data.left[k]||0,30);i++)plan.push(byName[k]||byName.Private)});
  plan=plan.filter(Boolean);
  if(DEPFIRST){DEPFIRST=false;plan=plan.slice(-20);plan.forEach(function(b,i){ghostOut(b,600+i*(19000/Math.max(1,plan.length)))});return}   // replay the last half hour in the first ~20 s
  plan.slice(-12).forEach(function(b,i){ghostOut(b,i*450)})}
// ---- owner only: turn on live visitors / agent drones (never shown to visitors: the hub sends it only to the owner)
var setupEl=null,SETUP=null;
function copyText(t,btn){var done=function(){var o=btn.textContent;btn.textContent='Copied';setTimeout(function(){btn.textContent=o},1600)};
  try{navigator.clipboard.writeText(t).then(done,function(){fallbackCopy(t)&&done()})}catch(err){fallbackCopy(t)&&done()}}
function fallbackCopy(t){try{var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);return ok}catch(err){return false}}
function setupDismissed(){try{return localStorage.getItem('caldera-setup-dismissed')==='1'}catch(err){return false}}
function ownerSetup(o){SETUP=o;if(MINI||!o||setupDismissed()||o.dismissed)return;var needLive=o.liveOff&&o.sites&&o.sites.length,needAg=o.agentsOff&&o.agentPrompt;if(!needLive&&!needAg){if(setupEl)setupEl.remove();return}
  if(!setupEl){setupEl=document.createElement('div');setupEl.className='c-setup';st.parentNode.insertBefore(setupEl,st.nextSibling)}
  var snip=function(s){return '<script async src="'+o.hub+(o.sri?'/t/1.js" integrity="'+o.sri+'" crossorigin="anonymous':'/t.js')+'" data-site="'+s.key+'"></'+'script>'};
  var aiLive='Add Caldera live traffic to my websites, so visits show up as people arriving in my Caldera city.\n\nFor each site below, find the repo that builds that site, add the tag to the shared layout so it loads on every page (in <head>), deploy it, then open the live site and confirm a visit appears in my city at '+o.hub+(HND?'/@'+HND+'/city.html':'')+' (it shows within about 10 seconds).\n\nOn the signup success step call window.caldera && caldera(\'signup\'), and after a purchase caldera(\'buy\').\n\n'+(o.sites||[]).map(function(s){return '- '+s.project+':\n  '+snip(s)}).join('\n');
  setupEl.innerHTML=(needLive?'<div class="c-su-row"><span>Live visitors are off. See people arrive in your city as they visit your sites.</span><button type="button" class="c-su-go" data-p="live">Set up &rarr;</button></div>':'')
    +(needAg?'<div class="c-su-row"><span>Watch your AI agents work in your city.</span><button type="button" class="c-su-go" data-p="agents">Set up &rarr;</button></div>':'')
    +'<button type="button" class="c-su-x" aria-label="Dismiss" title="Hide this">&times;</button>'
    +(needLive?'<div class="c-su-panel" data-panel="live" hidden><p>Paste each district\'s line into that site\'s pages (in the shared layout\'s &lt;head&gt;). Every visit then drops into that district live. Mark conversions with <code>caldera(\'signup\')</code> and <code>caldera(\'buy\')</code>.</p>'
      +(o.sites||[]).map(function(s,i){return '<div class="c-su-site"><b>'+e(s.project)+'</b><code id="su-s'+i+'">'+e(snip(s))+'</code><button type="button" data-copy="su-s'+i+'">Copy</button></div>'}).join('')
      +'<button type="button" class="c-su-ai" data-ai="live">Copy prompt for my AI</button></div>':'')
    +(needAg?'<div class="c-su-panel" data-panel="agents" hidden><p>Paste this into Claude Code on each computer you use. Each agent then flies as a drone over the repo it is working in.</p><button type="button" class="c-su-ai" data-ai="agents">Copy prompt for my AI</button></div>':'');
  setupEl.querySelectorAll('.c-su-go').forEach(function(bt){bt.onclick=function(){var p=setupEl.querySelector('[data-panel="'+bt.getAttribute('data-p')+'"]');if(p)p.hidden=!p.hidden}});
  setupEl.querySelectorAll('[data-copy]').forEach(function(bt){bt.onclick=function(){copyText(document.getElementById(bt.getAttribute('data-copy')).textContent,bt)}});
  setupEl.querySelectorAll('.c-su-ai').forEach(function(bt){bt.onclick=function(){copyText(bt.getAttribute('data-ai')==='live'?aiLive:o.agentPrompt,bt)}});
  setupEl.querySelector('.c-su-x').onclick=function(){try{localStorage.setItem('caldera-setup-dismissed','1')}catch(err){}if(window.parent!==window)parent.postMessage({caldera:'setup-dismiss'},'*');setupEl.remove();setupEl=null}}
function liveConnected(){if(!setupEl||!SETUP||!SETUP.liveOff)return;var any=Object.keys(LV.d).some(function(k){return (+LV.d[k].views||0)>0||(+LV.d[k].level||0)>0});if(!any)return;
  SETUP.liveOff=false;ownerSetup(SETUP);var seen=false;try{seen=localStorage.getItem('caldera-live-connected')==='1';localStorage.setItem('caldera-live-connected','1')}catch(err){}
  if(!seen&&toasts){var t=document.createElement('div');t.className='c-toast';t.textContent='✅ Live visitors connected';toasts.insertBefore(t,toasts.firstChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},6000)}}
// extras from the hub (weather endpoint, owner setup) or from Obsidian (postMessage)
var EX=window.CALDERA_EXTRAS||null;
function fetchWx(){if(!EX||!EX.weather||document.hidden)return;fetch(EX.weather,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(w){if(w&&w.c){WX=w;applyWeather()}}).catch(function(){})}
if(EX){if(EX.weather){setTimeout(fetchWx,300);setInterval(fetchWx,15*60000)}if(EX.owner)setTimeout(function(){ownerSetup(EX.owner)},50)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source!==parent||!m||m.caldera!=='extras'||!m.data)return;if(m.data.weather&&m.data.weather.c){WX=m.data.weather;applyWeather()}if(m.data.owner)ownerSetup(m.data.owner)});

// ---- agents: a drone over the building each AI agent is working in. Working = beam into the roof, thinking = circling,
// waiting for you = parked on the sky base, blinking amber. The sky base is a small deck hovering over the city's front
// corner (in the world: each neighborhood's front corner, where nothing stands in front of it), tethered to the ground by
// a thread of light; idle agents park on it as small drones and working ones lift off it to fly to their building. Public pages only get district + state, never what it's doing.
var AG={},AGC={working:'#3DF2FF',thinking:'#B58CFF',waiting:'#FFB020',idle:'#6F7C8F',done:'#6F7C8F'},BREPO={},BDIST={};
for(var bk in tiles){var tb=tiles[bk];if(tb.t!=='b')continue;var bij=bk.split(','),bo={i:+bij[0],j:+bij[1],r:tb.r};if(tb.r.name)BREPO[tb.r.name.toLowerCase()]=bo;(BDIST[tb.d.name]=BDIST[tb.d.name]||[]).push(bo)}
if(D.world)NBS.forEach(function(n){BDIST[n.key]=[];n.ds.forEach(function(d){BDIST[n.key]=BDIST[n.key].concat(BDIST[d.name]||[])})});   // a member's drones only ever fly to their own buildings
var HQI=1.3,HQJ=H-1.3,HQP=iso(HQI,HQJ),HQS=.36;   // Agent HQ: a parking grid on the island's west corner, laid out along the streets
function hqAt(a){var n=D.world&&a&&NBM[a.d];return n?{i:n.ox+n.w+.15,j:n.oy+n.h+.15}:{i:W-.55,j:H-.55}}
var LIFT=46,DOCKMAX=24;   // how high the sky base hovers (px), and how many drones it shows parked before it reads "+n"
function dockAt(a){var hq=hqAt(a);return iso(hq.i,hq.j)}   // the ground point under the sky base
function deckOf(n){return Math.min(36,13+Math.sqrt(Math.min(n,DOCKMAX))*5)}   // deck radius grows with the drones parked on it
function bob(tn){return Math.sin(tn/1600)*1.6}
function hqDims(n){var cols=Math.max(1,Math.ceil(Math.sqrt(n)));return {cols:cols,rows:Math.max(1,Math.ceil(n/cols))}}
function agentsIn(list){var tn=performance.now(),seen={};list.slice(0,80).forEach(function(a){if(!a||!a.id)return;seen[a.id]=1;var g=AG[a.id];
    if(!g){var h0=dockAt(a);g=AG[a.id]={x:h0.x,y:h0.y-40,born:tn,seed:hash(String(a.id))}}g.a=a;g.gone=0});
  for(var id in AG)if(!seen[id]&&!AG[id].gone)AG[id].gone=tn;if(D.world)dirty=true}
function agentSpot(g,tn,slot,nslot){var a=g.a,b=null;
  if(a.state==='working'||a.state==='thinking'){b=(a.repo&&BREPO[String(a.repo).toLowerCase()])||null;if(!b&&a.d&&BDIST[a.d]){var l=BDIST[a.d];b=l[g.seed%l.length]}}
  if(!b){var dk=dockAt(a),n=Math.min(nslot,DOCKMAX),r=deckOf(nslot)*.8,ang=slot*2.39996,rad=r*Math.sqrt((Math.min(slot,DOCKMAX-1)+.5)/n);
    return {x:dk.x+Math.cos(ang)*rad,y:dk.y-LIFT+bob(tn)+Math.sin(ang)*rad*.5-3,roof:null,hq:true,hidden:slot>=DOCKMAX}}
  var p=iso(b.i,b.j),h=bh(b.r),y=p.y-h-24;
  if(a.state==='thinking')return {x:p.x+Math.cos(tn/900+g.seed)*14,y:y+Math.sin(tn/900+g.seed)*7,roof:null};
  return {x:p.x+Math.sin(tn/1300+g.seed)*3,y:y+Math.sin(tn/500+g.seed)*2,roof:p.y-h}}
function drawAgents(c,tn){var ids=Object.keys(AG);if(!ids.length)return;var parked=ids.filter(function(id){var s=AG[id].a.state;return !(s==='working'||s==='thinking')}),k=0;
  // the sky base: one per city (in the world, per neighborhood); its label goes through the world label pass
  var groups={};ids.forEach(function(id){var key=D.world?(AG[id].a.d||''):'';(groups[key]=groups[key]||[]).push(id)});
  Object.keys(groups).forEach(function(key){var gp=groups[key].filter(function(id){return parked.indexOf(id)>=0});if(!gp.length&&D.world)return;
    var g0=dockAt(AG[groups[key][0]].a),r=deckOf(gp.length),cx0=g0.x,cy0=g0.y-LIFT+bob(tn);
    c.save();c.lineCap='round';
    c.fillStyle='rgba(61,242,255,.10)';c.beginPath();c.ellipse(g0.x,g0.y,r*.55,r*.27,0,0,7);c.fill();   // its light on the ground
    c.setLineDash([2,4]);c.strokeStyle='rgba(143,180,232,.45)';c.lineWidth=1;c.beginPath();c.moveTo(g0.x,g0.y);c.lineTo(cx0,cy0+7);c.stroke();c.setLineDash([]);   // tether
    var ug=c.createRadialGradient(cx0,cy0+8,0,cx0,cy0+8,r*1.1);ug.addColorStop(0,'rgba(61,242,255,.28)');ug.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=ug;c.beginPath();c.ellipse(cx0,cy0+8,r*1.1,r*.6,0,0,7);c.fill();   // underglow
    c.fillStyle='#1B2233';c.beginPath();c.ellipse(cx0,cy0+4,r,r*.5,0,0,7);c.fill();c.fillRect(cx0-r,cy0,r*2,4);   // deck edge (the slab's thickness)
    var dg=c.createLinearGradient(cx0,cy0-r*.5,cx0,cy0+r*.5);dg.addColorStop(0,'#3A4560');dg.addColorStop(1,'#283147');c.fillStyle=dg;c.strokeStyle='rgba(143,180,232,.85)';c.lineWidth=1.2;c.beginPath();c.ellipse(cx0,cy0,r,r*.5,0,0,7);c.fill();c.stroke();   // deck
    c.strokeStyle='rgba(143,180,232,.25)';c.beginPath();c.ellipse(cx0,cy0,r*.62,r*.31,0,0,7);c.stroke();   // landing ring
    c.globalCompositeOperation='lighter';for(var li=0;li<10;li++){var la=li/10*6.283,on=(Math.floor(tn/400)+li)%2===0,lx=cx0+Math.cos(la)*r,ly=cy0+Math.sin(la)*r*.5;c.fillStyle=on?'rgba(61,242,255,.95)':'rgba(61,242,255,.25)';c.beginPath();c.arc(lx,ly,1.3,0,7);c.fill()}   // rim lights
    c.restore();
    if(D.world||!labels)return;
    var nw=gp.filter(function(id){return AG[id].a.state==='waiting'}).length,ni=gp.length-nw;tronPill(c,g0.x,g0.y+16,'SKY BASE'+(ni?' · '+ni+' parked':'')+(nw?' · '+nw+' waiting on you':'')+(gp.length>DOCKMAX?' · +'+(gp.length-DOCKMAX)+' more':''),'#9FC3FF','600 9px ui-monospace,monospace')});
  var slotOf={};Object.keys(groups).forEach(function(key){groups[key].filter(function(id){return parked.indexOf(id)>=0}).forEach(function(id,ix,arr){slotOf[id]=[ix,arr.length]})});
  ids.forEach(function(id){var g=AG[id],a=g.a,sp=agentSpot(g,tn,slotOf[id]?slotOf[id][0]:0,slotOf[id]?slotOf[id][1]:1);
    g.x+=(sp.x-g.x)*.05;g.y+=(sp.y-g.y)*.05;var f=g.gone?Math.max(0,1-(tn-g.gone)/1500):Math.min(1,(tn-g.born)/600);if(f<=0){delete AG[id];return}
    var col=AGC[a.state]||AGC.working,blink=a.state==='waiting'?(.55+.45*Math.abs(Math.sin(tn/380))):(a.state==='idle'||a.state==='done')?.45:1;
    c.save();c.globalAlpha=f;c.globalCompositeOperation='lighter';
    if(sp.roof!=null&&Math.abs(g.x-sp.x)<6){var gb=c.createLinearGradient(0,g.y,0,sp.roof);gb.addColorStop(0,col);gb.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=gb;c.globalAlpha=f*(.55+.25*Math.sin(tn/160));c.beginPath();c.moveTo(g.x-2,g.y);c.lineTo(g.x+2,g.y);c.lineTo(g.x+9,sp.roof);c.lineTo(g.x-9,sp.roof);c.closePath();c.fill();c.globalAlpha=f}
    if(sp.hq){if(!sp.hidden){var pc=a.state==='waiting'?'#FFB020':'#8FB4E8';c.globalAlpha=f*(a.state==='waiting'?blink:.95);c.strokeStyle=pc;c.lineWidth=1.1;c.shadowColor=pc;c.shadowBlur=a.state==='waiting'?10:3;
      c.beginPath();c.ellipse(g.x,g.y,5,2.2,0,0,7);c.stroke();c.shadowBlur=0;c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-3.2);c.lineTo(g.x+2.6,g.y);c.lineTo(g.x,g.y+1.8);c.lineTo(g.x-2.6,g.y);c.closePath();c.fill()}
      c.restore();g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;return}
    var sc=1,gl=c.createRadialGradient(g.x,g.y,0,g.x,g.y,22*sc);gl.addColorStop(0,col);gl.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=f*.6*blink;c.fillStyle=gl;c.beginPath();c.arc(g.x,g.y,22*sc,0,7);c.fill();c.globalAlpha=f*blink;
    c.strokeStyle=col;c.lineWidth=1.4;c.shadowColor=col;c.shadowBlur=8;c.setLineDash([4,3]);c.lineDashOffset=-tn/40;c.beginPath();c.ellipse(g.x,g.y,11*sc,5.5*sc,0,0,7);c.stroke();c.setLineDash([]);
    c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-6*sc);c.lineTo(g.x+5*sc,g.y);c.lineTo(g.x,g.y+3.5*sc);c.lineTo(g.x-5*sc,g.y);c.closePath();c.fill();c.restore();
    g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;
    if(labels&&a.label&&!sp.hq&&(cam.z>.55||ids.length<=8))tronPill(c,g.x,g.y-15,a.label,col,'600 9px ui-monospace,monospace')})}
// ---- visitor helicopters: the people looking at this member's profile right now. One helicopter per current viewer
// (at most 3 in the air): it flies in when they arrive, circles slowly, and flies off when they leave (the hub counts a
// viewer for 90 s after their last page view or heartbeat). Nobody else viewing, no helicopters. In the world, the same
// for each member whose profile someone is viewing. Reduced motion: no helicopters, only the "viewing now" count.
// Counts only: who is viewing is never sent.
var HELIS=[],HPILL=null,HCAP=3;
function heliCenter(key){if(D.world){var n=NBM[key];if(!n)return null;var p=iso(n.ox+n.w/2,n.oy+n.h/2);return {x:p.x,y:p.y-70,r:Math.max(50,(n.w+n.h)*TW/6)}}
  var p0=iso(W/2,H/2);return {x:p0.x,y:p0.y-150,r:Math.max(90,Math.min(320,(W+H)*TW/7))}}
function heliAdd(key,id){var seed=hash(key+'#'+id)%100000,c=heliCenter(key);if(!c)return;var side=rnd(seed+1)<.5?-1:1,far=c.r*2.5+520;
  HELIS.push({id:key+'#'+id,c:c,born:performance.now(),seed:seed,side:side,ang:rnd(seed)*6.283,sp:(.00005+rnd(seed+2)*.00004)*(rnd(seed+3)<.5?-1:1),
    fx:c.x+side*far,fy:c.y-c.r-200,rr:c.r*(.6+rnd(seed+4)*.4),alt:rnd(seed+5)*30,leave:0,face:-side})}
function heliLeave(h,tn){if(h.leave)return;var p=heliPos(h,tn)||{x:h.fx,y:h.fy};h.leave=tn;h.lx=p.x;h.ly=p.y;var far=h.c.r*2.5+520;h.ex=h.c.x-h.side*far;h.ey=h.c.y-h.c.r-200}   // out the other side
function heliScale(){return D.world?Math.min(14,Math.max(1,24/(18.6*cam.z))):Math.min(12,Math.max(1.5,(vw<600?28:38)/(18.6*cam.z)))}   // a helicopter is never smaller than ~38 px on screen (28 on phones, 24 on the World map): few of them, so each one is easy to see
function heliPos(h,tn){var age=tn-h.born;if(age<0)return null;var k=Math.min(1,age/6000),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,ang=h.ang+h.sp*age,ox=h.c.x+Math.cos(ang)*h.rr,oy=h.c.y-h.alt+Math.sin(ang)*h.rr*.45;
  var x=h.fx+(ox-h.fx)*e,y=h.fy+(oy-h.fy)*e,f=Math.min(1,age/900),done=false;
  if(h.leave){var g=Math.min(1,(tn-h.leave)/6000),ge=g*g*(3-2*g);x=h.lx+(h.ex-h.lx)*ge;y=h.ly+(h.ey-h.ly)*ge;f=g>.8?Math.max(0,(1-g)/.2):1;done=g>=1}
  if(h.px!=null&&Math.abs(x-h.px)>.04)h.face=x>h.px?1:-1;h.px=x;
  return {x:x,y:y,f:f,face:h.face,done:done}}
var HLIV=[['#F3E9D6','#C8B996','#E8A33D'],['#1F2A44','#141C30','#F2C14E'],['#E9EEF4','#B8C2CF','#D9433B'],['#2B2B2E','#18181A','#E8B44A'],['#F4F1EA','#C9C2B2','#2F7DD1']];   // body, belly, stripe
// A helicopter in 3/4 side view, drawn in local units (about 30 wide) and scaled: shaped fuselage with shading and a
// livery stripe, glossy canopy, engine housing, tapered tail with fin, stabilizer and tail-rotor disc, four-blade main
// rotor with a motion-blur disc, skids on struts, nav lights + strobe + beacon, a soft shadow and (some) a searchlight.
// Speed: everything static (body, shading, rotor disc, nav lights, shadow) is painted once per livery and size bucket
// into an offscreen sprite; each frame only blits the sprite and strokes the moving parts (blades, beacon, strobe).
// No gradients or shadowBlur per frame, off-screen helicopters are skipped, tiny ones skip the moving parts.
var HSPR={},HSPRN=0,HX0=-25,HY0=-14,HW=49,HH=66;   // sprite bounds in local units
function heliBody(c,L){c.lineJoin='round';c.lineCap='round';
  c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(0,46,13,3.2,0,0,7);c.fill();   // soft shadow below
  c.fillStyle=L[1];c.beginPath();c.moveTo(-6,-2.6);c.lineTo(-21,-3.4);c.lineTo(-21,-1.6);c.lineTo(-6,1.6);c.closePath();c.fill();
  c.fillStyle=L[0];c.beginPath();c.moveTo(-6,-2.6);c.lineTo(-21,-3.4);c.lineTo(-21,-2.6);c.lineTo(-6,-.6);c.closePath();c.fill();
  c.fillStyle=L[2];c.beginPath();c.moveTo(-18.5,-3.2);c.lineTo(-22.5,-8.6);c.lineTo(-20.6,-8.6);c.lineTo(-17,-3.1);c.closePath();c.fill();   // vertical fin
  c.fillStyle=L[1];c.beginPath();c.moveTo(-17,-1.9);c.lineTo(-19.5,.6);c.lineTo(-18.4,.6);c.lineTo(-15.6,-1.9);c.closePath();c.fill();   // stabilizer
  var fg=c.createLinearGradient(0,-6,0,6);fg.addColorStop(0,L[0]);fg.addColorStop(.55,L[0]);fg.addColorStop(1,L[1]);c.fillStyle=fg;c.strokeStyle='rgba(20,16,10,.65)';c.lineWidth=.7;
  c.beginPath();c.moveTo(-7,-2.8);c.bezierCurveTo(-5,-6.4,4,-6.6,8.5,-3.4);c.bezierCurveTo(11.6,-1.2,11.4,2.6,8.2,4.2);c.bezierCurveTo(4,5.8,-3,5.6,-7,2.2);c.closePath();c.fill();c.stroke();
  c.fillStyle=L[2];c.beginPath();c.moveTo(-6.6,.8);c.bezierCurveTo(-2,2.2,4,2.2,10.2,1.2);c.lineTo(10,2.3);c.bezierCurveTo(4,3.3,-2,3.3,-6.8,1.9);c.closePath();c.fill();   // livery stripe
  c.fillStyle=L[1];c.beginPath();c.moveTo(-4,-5.2);c.bezierCurveTo(-2,-7.4,3,-7.4,4.6,-5.6);c.lineTo(-4,-5.2);c.fill();   // engine housing
  c.fillStyle='#2A2F38';c.beginPath();c.ellipse(-4.6,-5.4,.9,.6,0,0,7);c.fill();   // exhaust
  var cg=c.createLinearGradient(5,-5,11,1);cg.addColorStop(0,'#BFE6FF');cg.addColorStop(.5,'#4E8FC4');cg.addColorStop(1,'#1D3A5A');c.fillStyle=cg;
  c.beginPath();c.moveTo(4.2,-4.6);c.bezierCurveTo(7.6,-4.4,10.4,-2.4,10.6,.4);c.lineTo(5.6,.4);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.moveTo(5.2,-4);c.bezierCurveTo(7,-3.8,8.4,-3,9,-2);c.lineTo(8.2,-1.8);c.bezierCurveTo(7.6,-2.6,6.6,-3.2,5.2,-3.4);c.closePath();c.fill();   // glint
  c.fillStyle='#24486B';c.beginPath();c.roundRect?c.roundRect(-.6,-3.6,4,2.6,.8):c.rect(-.6,-3.6,4,2.6);c.fill();   // side window
  c.strokeStyle='rgba(20,16,10,.5)';c.lineWidth=.45;c.beginPath();c.moveTo(4.4,-4.4);c.lineTo(4.6,3.8);c.stroke();   // door seam
  c.strokeStyle='#2A2F38';c.lineWidth=.9;c.beginPath();c.moveTo(-3.4,4.6);c.lineTo(-4.2,7.4);c.moveTo(4,4.6);c.lineTo(4.6,7.4);c.stroke();   // skids
  c.lineWidth=1.1;c.beginPath();c.moveTo(-7,7.4);c.lineTo(8,7.4);c.quadraticCurveTo(9.6,7.4,10,6.2);c.stroke();
  c.strokeStyle='#2A2F38';c.lineWidth=1;c.beginPath();c.moveTo(0,-6.6);c.lineTo(0,-8.6);c.stroke();   // mast
  c.globalCompositeOperation='lighter';c.shadowBlur=5;c.shadowColor='#FF3B30';c.fillStyle='#FF5A50';c.beginPath();c.arc(-.5,4.6,.6,0,7);c.fill();   // nav lights
  c.shadowColor='#38E07B';c.fillStyle='#4CF08D';c.beginPath();c.arc(2.6,4.4,.6,0,7);c.fill()}
function heliSprite(li,R){var key=li+':'+R,s=HSPR[key];if(s)return s;if(HSPRN>60){HSPR={};HSPRN=0}
  s=document.createElement('canvas');s.width=Math.ceil(HW*R);s.height=Math.ceil(HH*R);var g=s.getContext('2d');g.scale(R,R);g.translate(-HX0,-HY0);heliBody(g,HLIV[li]);HSPR[key]=s;HSPRN++;return s}
var HGLOW=null;function heliGlow(){if(HGLOW)return HGLOW;HGLOW=document.createElement('canvas');HGLOW.width=HGLOW.height=32;var g=HGLOW.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return HGLOW}
function drawHeli(c,x,y,s,tn,seed,face,ps){var li=seed%HLIV.length,k=.62,R=Math.min(8,Math.max(.5,Math.pow(2,Math.round(Math.log2(ps)*3)/3))),spr=heliSprite(li,R),big=ps*30>22;
  c.save();c.translate(x,y);
  c.scale(s*k*face,s*k);c.rotate(.05+Math.sin(tn/2400+seed)*.012);   // slight nose-down tilt, slow gentle bob
  c.drawImage(spr,HX0,HY0,HW,HH);
  if(!big){c.restore();return}
  var ra=tn/160+seed;c.lineCap='round';
  c.strokeStyle='rgba(250,252,255,.85)';c.lineWidth=.9;c.beginPath();for(var b=0;b<4;b++){var a=ra+b*1.5708;c.moveTo(0,-8.8);c.lineTo(Math.cos(a)*21,-8.8+Math.sin(a)*3.6)}c.stroke();   // main rotor
  c.fillStyle='#3A3F48';c.fillRect(-1.4,-9.5,2.8,1.4);   // hub
  if(Math.floor(tn/1400+seed)%2===0){var G=heliGlow();c.globalCompositeOperation='lighter';c.fillStyle='#FF463C';c.fillRect(-1.6,-7.5,1.2,1.2);c.globalAlpha*=.6;c.drawImage(G,-4.5,-10.4,7,7);c.globalAlpha/=.6}   // slow beacon
  c.restore()}
function drawHelis(c,tn){if(!HELIS.length)return;var s=heliScale(),ps=s*.62*cam.z*dpr,m=40*s*cam.z,x0=-cam.x/cam.z-m/cam.z,y0=-cam.y/cam.z-m/cam.z,x1=(vw-cam.x)/cam.z+m/cam.z,y1=(vh-cam.y)/cam.z+m/cam.z;
  HELIS=HELIS.filter(function(h){var p=heliPos(h,tn);if(!p)return true;if(p.done)return false;if(p.f<=0)return true;
    if(p.x<x0||p.x>x1||p.y<y0||p.y>y1)return true;   // off screen
    c.globalAlpha=p.f;drawHeli(c,p.x,p.y,s,tn,h.seed,p.face,ps);return true});c.globalAlpha=1}
function heliPill(t){if(!labels||MINI||!st)return;if(!HPILL){HPILL=document.createElement('div');HPILL.className='c-heli';HPILL.style.cssText='position:absolute;left:10px;bottom:'+(vw<600?62:76)+'px;z-index:4;pointer-events:none;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#FFD9A0;background:rgba(2,6,12,.86);border:1px solid rgba(255,190,90,.5);border-radius:999px;padding:6px 11px;white-space:nowrap;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis';HPILL.setAttribute('role','status');HPILL.setAttribute('aria-live','polite');st.appendChild(HPILL)}HPILL.textContent=t;HPILL.style.display=t?'':'none'}
// the hub's answer -> helicopters: new viewers fly in, viewers who left fly out (at most HCAP in the air)
function heliSync(j){var want=[],tot=0,tn=performance.now();
  if(D.world){var m=j&&j.m&&typeof j.m==='object'?j.m:{},ks=Object.keys(m).filter(function(k){return NBM[k]&&+m[k]>0}).sort(function(a,b){return (+m[b])-(+m[a])||(a<b?-1:1)});
    ks.forEach(function(k){tot+=+m[k]});for(var r=0;want.length<HCAP&&r<HCAP;r++)ks.forEach(function(k){if(want.length<HCAP&&+m[k]>r)want.push({key:k,id:String(r)})})}
  else{var ids=(j&&Array.isArray(j.ids)?j.ids:[]).map(String).filter(function(x){return /^[a-f0-9]{6,16}$/.test(x)}).sort();tot=Math.max(ids.length,+(j&&j.n)||0);ids.slice(0,HCAP).forEach(function(x){want.push({key:'',id:x})})}
  var W2={};want.forEach(function(w){W2[w.key+'#'+w.id]=w});
  HELIS.forEach(function(h){if(!W2[h.id])heliLeave(h,tn)});
  if(!reduce)want.forEach(function(w){if(!HELIS.some(function(h){return h.id===w.key+'#'+w.id&&!h.leave}))heliAdd(w.key,w.id)});
  heliPill(tot?'\u{1F681} '+(D.world?tot+(tot===1?' person':' people')+' viewing profiles now':(tot===1?'1 other person':tot+' other people')+' viewing now'):'');
  if(reduce)frame()}
(function(){var u=D.world?'/v1/viewing':(HND?'/v1/viewing/'+HND:'');if(!u||!window.fetch||MINI)return;
  var go=function(){if(document.visibilityState==='hidden')return;fetch(u,{method:D.world?'GET':'POST',cache:'no-store',credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j)heliSync(j)}).catch(function(){})};
  setTimeout(go,1200);setInterval(go,D.world?30000:20000);   // the city's call is also this viewer's heartbeat
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')go()})})();
// ---- the Underground: the vault under the city. Notes = nodes (size = notes linking in), links = tunnels,
// depth = age, notes about a project sit under its district with roots up into it. Toggle with the Underground button.
var U=D.under||null,under=false,UL=document.createElement('canvas'),uc=UL.getContext('2d'),UP=[],upulse=[],UDIRTY=true;
var UK={concept:'#3DF2FF',entity:'#B58CFF',source:'#4F7BFF',day:'#FF9E3D',garden:'#4FF2A0',note:'#9FB4FF'},UKN={concept:'Concepts',entity:'People & companies',source:'Sources',day:'Daily notes',garden:'Garden (public)',note:'Notes'};
var DROP=0,DSPAN=0;
if(U){DROP=Math.max(140,maxH*.7+70);DSPAN=Math.max(160,(W+H)*TH/2*.45);
  var KA={concept:[.5,.5],entity:[.25,.75],source:[.8,.8],note:[.75,.25],garden:[.5,.18]};
  U.nodes.forEach(function(n,ix){var h1=rnd(hash((n.p||'')+ix)+1),h2=rnd(hash((n.p||'')+ix)+7),b=n.d&&byName[n.d],i,j;
    if(b){i=b.x-.3+h1*(b.k+.6);j=b.y-.3+h2*(b.k+.6)}
    else if(n.k==='day'){var t=1-Math.min(1,n.a/365);i=1+t*(W-2)+(h1-.5)*1.5;j=1+t*(H-2)+(h2-.5)*1.5}
    else{var ka=KA[n.k]||KA.note,ang=h1*6.283,rad=Math.sqrt(h2)*Math.min(W,H)*.2;i=ka[0]*W+Math.cos(ang)*rad;j=ka[1]*H+Math.sin(ang)*rad}
    var age=Math.min(1,Math.log(1+n.a)/Math.log(731)),q=iso(i,j);UP[ix]={x:q.x,y:q.y+DROP+age*DSPAN,r:Math.min(12,1.6+Math.sqrt(n.n)*.9),c:UK[n.k]||UK.note}});
  U.adj=U.nodes.map(function(){return []});U.edges.forEach(function(e){if(U.adj[e[0]]&&U.adj[e[1]]){U.adj[e[0]].push(e[1]);U.adj[e[1]].push(e[0])}});
  U.byPath={};U.nodes.forEach(function(n,ix){if(n.p)U.byPath[n.p]=ix})}
function ustrata(c){var lv=[[7,'this week'],[30,'this month'],[365,'this year'],[2000,'older']];
  lv.forEach(function(l){var age=Math.min(1,Math.log(1+l[0])/Math.log(731)),dy=DROP+age*DSPAN,a=iso(0,0),b=iso(W,0),d=iso(W,H),e2=iso(0,H);
    c.strokeStyle='rgba(181,140,255,.13)';c.lineWidth=1;c.setLineDash([3,6]);c.beginPath();c.moveTo(a.x,a.y+dy);c.lineTo(b.x,b.y+dy);c.lineTo(d.x,d.y+dy);c.lineTo(e2.x,e2.y+dy);c.closePath();c.stroke();c.setLineDash([]);
    c.font='600 9px ui-monospace,monospace';c.fillStyle='rgba(181,140,255,.55)';c.textAlign='right';c.fillText(l[1].toUpperCase(),e2.x-8,e2.y+dy+3);c.textAlign='left'})}
function drawUnder(){var c=uc;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,UL.width,UL.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  ustrata(c);
  // sediment: the notes not drawn one by one
  var sed=0;for(var sk in U.sediment)sed+=U.sediment[sk];var ns=Math.min(500,Math.round(sed/3)),kinds=Object.keys(U.sediment),acc=0,cum=kinds.map(function(k){acc+=U.sediment[k];return acc});
  for(var z=0;z<ns;z++){var r1=rnd(z*3+1),r2=rnd(z*7+2),r3=rnd(z*11+3),q=iso(r1*W,r2*H),kk=kinds[cum.findIndex(function(v){return v>=r3*acc})]||'note';c.fillStyle=UK[kk]||UK.note;c.globalAlpha=.16;c.fillRect(q.x,q.y+DROP+DSPAN*(.55+r3*.45),1.4,1.4)}
  c.globalAlpha=1;c.globalCompositeOperation='lighter';
  // roots: each district's notes hang from the middle of its block
  blocks.forEach(function(b){var top=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),kids=[];U.nodes.forEach(function(n,ix){if(n.d===b.d.name)kids.push(ix)});if(!kids.length)return;
    kids.sort(function(a,b2){return U.nodes[b2].n-U.nodes[a].n}).slice(0,14).forEach(function(ix){var p=UP[ix],g=c.createLinearGradient(0,top.y,0,p.y);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(181,140,255,.05)');
      c.strokeStyle=g;c.lineWidth=1.1;c.beginPath();c.moveTo(top.x,top.y);c.bezierCurveTo(top.x,top.y+(p.y-top.y)*.5,p.x,p.y-(p.y-top.y)*.4,p.x,p.y);c.stroke()});
    c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.ellipse(top.x,top.y,6,3,0,0,7);c.fill()});
  // tunnels
  c.lineWidth=.8;U.edges.forEach(function(e){var a=UP[e[0]],b=UP[e[1]];if(!a||!b)return;var hi=usel!=null&&(e[0]===usel||e[1]===usel);
    c.strokeStyle=hi?'#FFFFFF':a.c;c.globalAlpha=hi?.85:.14;c.lineWidth=hi?1.4:.8;c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+14,b.x,b.y);c.stroke()});
  c.globalAlpha=1;
  U.nodes.forEach(function(n,ix){var p=UP[ix];if(p.r>3.5){var g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.6);g.addColorStop(0,p.c);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.55;c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,p.r*2.6,0,7);c.fill()}
    c.globalAlpha=1;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r*.55,0,7);c.fill();if(ix===usel){c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,p.r+3,0,7);c.stroke()}});
  c.globalCompositeOperation='source-over';
  if(labels){var top=U.nodes.map(function(n,ix){return ix}).filter(function(ix){return U.nodes[ix].t}).sort(function(a,b){return U.nodes[b].n-U.nodes[a].n}).slice(0,cam.z>1.1?40:16);
    var placed=[];c.font='600 9px ui-monospace,monospace';
    top.forEach(function(ix){var n=U.nodes[ix],p=UP[ix],tx=n.t.length>22?n.t.slice(0,21)+'\u2026':n.t,w=c.measureText(tx).width+16,y=p.y-p.r-6,bx=[p.x-w/2,y-18,p.x+w/2,y+2];
      if(placed.some(function(q){return bx[0]<q[2]&&bx[2]>q[0]&&bx[1]<q[3]&&bx[3]>q[1]}))return;placed.push(bx);tronPill(c,p.x,y,tx,UK[n.k]||UK.note,'600 9px ui-monospace,monospace')})}}
var usel=null;
function upulseFrom(ix){if(ix==null||!UP[ix])return;var tn=performance.now();upulse.push({ring:ix,born:tn});(U.adj[ix]||[]).slice(0,10).forEach(function(j,k){upulse.push({a:ix,b:j,born:tn+k*90})})}
function drawUnderLive(c,tn){c.save();c.globalCompositeOperation='lighter';
  U.nodes.forEach(function(n,ix){if(n.m>1)return;var p=UP[ix],pr=((tn/1600)+ix*.13)%1;c.strokeStyle=p.c;c.globalAlpha=(1-pr)*.7;c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y,p.r+2+pr*10,0,7);c.stroke()});
  upulse=upulse.filter(function(u){return tn-u.born<1800});upulse.forEach(function(u){var t=(tn-u.born)/1400;if(t<0)return;
    if(u.ring!=null){var p=UP[u.ring];c.strokeStyle='#FFFFFF';c.globalAlpha=Math.max(0,1-t);c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,p.r+4+t*26,0,7);c.stroke();return}
    var a=UP[u.a],b=UP[u.b];if(t>1)return;var mx=(a.x+b.x)/2,my=(a.y+b.y)/2+14,x=(1-t)*(1-t)*a.x+2*(1-t)*t*mx+t*t*b.x,y=(1-t)*(1-t)*a.y+2*(1-t)*t*my+t*t*b.y;
    c.globalAlpha=1;c.fillStyle='#FFFFFF';c.beginPath();c.arc(x,y,2,0,7);c.fill()});c.restore()}
var underEl=null;function underPanel(){if(!underEl){underEl=document.createElement('div');underEl.className='c-under'+(st.clientWidth<600?' c-min':'');underEl.setAttribute('role','button');underEl.title='Tap to fold or unfold';st.appendChild(underEl);
    underEl.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('a'))return;underEl.classList.toggle('c-min');var c=underEl.querySelector('.chev');if(c)c.textContent=underEl.classList.contains('c-min')?'\u25B4':'\u25BE'})}underEl.hidden=!under;if(!under)return;
  var ks=['concept','entity','source','day','garden','note'].filter(function(k){return U.nodes.some(function(n){return n.k===k})});
  underEl.innerHTML='<div class="uh"><b>THE UNDERGROUND</b><span class="chev">'+(underEl.classList.contains('c-min')?'\u25B4':'\u25BE')+'</span></div><div>'+U.total.toLocaleString('en-US')+' notes &middot; '+U.links.toLocaleString('en-US')+' links &middot; '+U.orphans+' unconnected'+(U.editedToday?' &middot; '+U.editedToday+' edited today':'')+'</div>'
    +'<div class="lg">'+ks.map(function(k){return '<span><i style="background:'+UK[k]+'"></i>'+UKN[k]+'</span>'}).join('')+'</div><div style="margin-top:4px;color:#A99BD0">Bigger = more notes link to it. Deeper = older. Roots go up to the project the notes are about.</div>'}
function noteCard(ix){var n=U.nodes[ix];usel=ix;UDIRTY=true;var open='';
  if(n.p)open=D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(n.p))+'" target="_blank" rel="noopener">Open in Obsidian &#8599;</a>':'<a href="#" data-open="'+e(n.p)+'">Open note</a>';
  else if(n.g)open='<a href="n/'+e(n.g)+'.html">Read it in the garden &#8599;</a>';
  var ago=function(d){return d<=0?'today':d===1?'yesterday':d<60?d+' days ago':Math.round(d/30)+' months ago'};
  card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+(n.t?e(n.t):'A note')+'</h3><div class="k" style="color:'+(UK[n.k]||UK.note)+'">'+e(UKN[n.k]||'Note')+(n.d?' &middot; under '+e(n.d):'')+'</div>'
    +'<div class="row"><span>Notes linking here</span><b>'+n.n+'</b></div><div class="row"><span>Links out</span><b>'+n.o+'</b></div>'
    +'<div class="row"><span>Created</span><b>'+ago(n.a)+'</b></div><div class="row"><span>Last edited</span><b>'+ago(n.m)+'</b></div>'
    +(n.t?'':'<p style="margin:6px 0 0">What this note says is private.</p>')+(open?'<p style="margin:8px 0 0">'+open+'</p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){usel=null;UDIRTY=true;card.hidden=true};upulseFrom(ix)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source===parent&&m&&m.caldera==='note'&&U&&typeof m.p==='string'){var ix=U.byPath[m.p];if(ix!=null){U.nodes[ix].m=0;upulseFrom(ix)}}});
// one car per person on the site right now (private: exact count from the last 5 minutes; public: a coarse level)
function reconcile(){var tn=performance.now(),total=0;blocks.forEach(function(b){var x=LV.d[D.world?(b.rep?b.d.nb:''):b.d.name],want=!x?0:LV.mode==='private'?Math.min(30,+x.now||0):([0,2,4,7,11][+x.level||0]||0);
  if(total+want>120)want=Math.max(0,120-total);total+=want;
  var mine=cars.filter(function(c){return c.b===b&&!c.gone});
  for(var n=mine.length;n<want;n++){var ex=exits(b);if(!ex.length)break;var s0=ex[Math.floor(Math.random()*ex.length)],c={i:s0[0],j:s0[1],ti:s0[0],tj:s0[1],t:1,b:b,born:tn,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][Math.floor(Math.random()*5)]};step(c);cars.push(c)}
  mine.slice(want).forEach(function(c){c.gone=tn})})}
function fa(c,tn){return c.gone?Math.max(0,1-(tn-c.gone)/1500):c.born?Math.min(1,(tn-c.born)/800):1}
function agentLine(){var n={},ids=Object.keys(AG).filter(function(id){return !AG[id].gone});if(!ids.length)return '';ids.forEach(function(id){var s=AG[id].a.state;n[s]=(n[s]||0)+1});
  return '<div class="q"><span style="color:#fff">AI agents</span> '+['working','thinking','waiting','idle'].filter(function(s){return n[s]}).map(function(s){return '<span style="color:'+AGC[s]+'">'+n[s]+' '+(s==='waiting'?'waiting on you':s)+'</span>'}).join(' &middot; ')+'</div>'}
var liveEl=null;function hud(){if(!liveEl){liveEl=document.createElement('div');liveEl.className='c-live'+(st.clientWidth<600?' c-min':'');liveEl.setAttribute('aria-live','polite');st.appendChild(liveEl);if(typeof todayLine==='function')setTimeout(todayLine,0);
    liveEl.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('.h'))liveEl.classList.toggle('c-min')})}
  var ks=Object.keys(LV.d).filter(function(k){return byName[k]});
  if(LV.mode==='private'){ks.sort(function(a,b){return (LV.d[b].now-LV.d[a].now)||(LV.d[b].views-LV.d[a].views)});var tot=ks.reduce(function(s,k){return s+(+LV.d[k].now||0)},0);
    // busy districts get a row (at most 5); the rest share one quiet line so the panel never needs to scroll
    var busy=ks.filter(function(k){return LV.d[k].now>0||LV.d[k].signups>0||LV.d[k].buys>0}).slice(0,5),quiet=ks.filter(function(k){return busy.indexOf(k)<0});
    liveEl.innerHTML='<div class="h"><i class="dot"></i>LIVE &middot; '+tot+' on your sites now</div>'
     +(ks.length?'':'<div class="s m">No visits yet. Paste a district\'s snippet from Caldera settings &gt; Live traffic on your city into that site.</div>')
     +busy.map(function(k){var x=LV.d[k];return '<div class="r"><span>'+e(k)+'</span><b>'+(+x.now||0)+' now</b></div><div class="s m">'+(+x.views||0).toLocaleString('en-US')+' views'+(x.signups?' &middot; '+x.signups+' signups':'')+(x.buys?' &middot; '+x.buys+' sales':'')+' in 24h</div>'}).join('')
     +agentLine()+(quiet.length?'<div class="q m">Quiet now: '+quiet.map(function(k){return e(k)+' '+(+LV.d[k].views||0)}).join(' &middot; ')+' views in 24h</div>':'')
     +'<div class="lg m" style="margin-top:4px">Each car is someone on that site now.<br><i style="background:'+SCOL+'"></i>signup<i style="background:'+BCOL+'"></i>sale</div>'}
  else{var any=ks.some(function(k){return LV.d[k].level>0});ks.sort(function(a,b){return LV.d[b].level-LV.d[a].level});
    liveEl.innerHTML='<div class="h"><i class="dot"></i>LIVE &middot; '+(any?'people on these sites right now':'quiet right now')+'</div>'+agentLine()
     +ks.filter(function(k){return LV.d[k].level>0}).map(function(k){return '<div class="r"><span>'+e(k)+'</span><b><i class="bar" style="width:'+(LV.d[k].level*14)+'px"></i></b></div>'}).join('')}}
var CL=window.CALDERA_LIVE;function poll(){if(document.hidden)return;fetch(CL.url+(LV.at?(CL.url.indexOf('?')<0?'?':'&')+'since='+encodeURIComponent(LV.at):''),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(onLive).catch(function(){})}
if(CL&&typeof CL.url==='string'){setTimeout(poll,600);setInterval(poll,10000)}
window.addEventListener('message',function(ev){var m=ev.data;if((ev.source===parent||window.CALDERA_MINI===1)&&m&&m.caldera==='live')onLive(m.data)});
function step(car){var o=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [car.ti+d[0],car.tj+d[1]]}).filter(function(n){var t=tiles[n[0]+','+n[1]];return t&&t.t==='r'&&!(n[0]===car.i&&n[1]===car.j)});
  if(!o.length)o=[[car.i,car.j]];var n=o[Math.floor(Math.random()*o.length)];car.i=car.ti;car.j=car.tj;car.ti=n[0];car.tj=n[1];car.t=0}
// ---- palettes: the lighting follows the viewer's clock (Auto: night, dawn, day, dusk, evening, blended), or a phase they pick
var sky='night';night=true;
var PAL={
 day:{sky:['#7FB8EA','#CFE6F7','#EAF4FB'],grass:'#7DBB6E',grass2:'#8CC77C',park:'#6FB262',walk:'#D9D6CE',walkSide:'#B7B2A6',plaza:'#E6E2D8',road:'#5A606B',road2:'#626873',line:'rgba(255,255,255,.75)',water:['#4C9BD6','#3A82BD'],earth:['#8A6A4A','#6E5238'],light:1,win:'rgba(196,224,248,.85)',winOff:'rgba(60,82,110,.55)',lamp:0,shadow:'rgba(30,40,60,.22)',lit:.45,grass3:'#74B366',glass:['#C9E3F6','#6D9FCF'],curb:'rgba(255,255,255,.45)',joint:'rgba(0,0,0,.08)',ao:'rgba(20,30,50,.28)'},
 dusk:{sky:['#3E3A6E','#C8607A','#F4B26B'],grass:'#5E8F5A',grass2:'#6A9A62',park:'#55854F',walk:'#B9AFA6',walkSide:'#968A80',plaza:'#C7BCB0',road:'#454752',road2:'#4C4E59',line:'rgba(255,226,170,.6)',water:['#5A6FA8','#46568C'],earth:['#6E5040','#55402F'],light:.82,win:'rgba(255,214,140,.92)',winOff:'rgba(48,52,78,.6)',lamp:.6,shadow:'rgba(40,20,50,.28)',lit:.9},
 night:{sky:['#04060E','#0B1020','#18203A'],grass:'#1D3326',grass2:'#21392A',park:'#1A2F22',walk:'#3A3D47',walkSide:'#2A2D35',plaza:'#41444E',road:'#1E222B',road2:'#23272F',line:'rgba(242,200,90,.45)',water:['#13233F','#0D1A30'],earth:['#2B2219','#201912'],light:.5,win:'rgba(255,208,120,.95)',winOff:'rgba(16,20,34,.75)',lamp:1,shadow:'rgba(0,0,0,.35)',lit:1,grass3:'#1A2E22',glass:['#1E2C4A','#101828'],curb:'rgba(255,255,255,.16)',joint:'rgba(0,0,0,.18)',ao:'rgba(0,0,0,.4)'},
  dawn:{sky:['#3A4A7E','#E0899A','#FFCB8E'],grass:'#5F8F62',grass2:'#6B9A6A',park:'#578A58',walk:'#C2B8B0',walkSide:'#9C9088',plaza:'#CFC4B8',road:'#4A4D58',road2:'#51545F',line:'rgba(255,236,200,.6)',water:['#6A80B8','#56689C'],earth:['#73554A','#5A4236'],light:.88,win:'rgba(255,222,165,.85)',winOff:'rgba(70,80,110,.55)',lamp:.3,shadow:'rgba(60,40,80,.32)',lit:.5},
  evening:{sky:['#0B0E2A','#23285A','#4A3F7A'],grass:'#2A4532',grass2:'#304C37',park:'#27412D',walk:'#555463',walkSide:'#3E3E4B',plaza:'#5C5B69',road:'#2A2C38',road2:'#30323E',line:'rgba(250,210,120,.5)',water:['#24335E','#1B284C'],earth:['#3E3028','#2E241D'],light:.62,win:'rgba(255,210,130,.95)',winOff:'rgba(22,26,44,.7)',lamp:.9,shadow:'rgba(0,0,0,.32)',lit:1}};
// the high-detail tokens (grass3, glass, curb, joint, ao): dawn, dusk and evening sit between day and night
(function(){var F={dawn:.35,dusk:.45,evening:.8};for(var k in F)['glass','curb','joint','ao'].forEach(function(t){var a=PAL.day[t],b=PAL.night[t];PAL[k][t]=Array.isArray(a)?a.map(function(v,i){return lerpCol(v,b[i],F[k])}):lerpCol(a,b,F[k])});
  for(var k2 in F)PAL[k2].grass3=lerpCol(PAL[k2].grass,'#000000',.06)})();
PAL.grid=PAL.night;var P=PAL.night,phase='night',palKey='';
// Auto: keyframes over the day (minutes after midnight), smoothly blended; the drawing details follow the nearest phase
var DAYKEYS=[[0,'night'],[300,'night'],[390,'dawn'],[510,'day'],[990,'day'],[1095,'dusk'],[1185,'evening'],[1290,'night'],[1440,'night']];
var BASE={night:'night',evening:'night',dawn:'dusk',dusk:'dusk',day:'day'};
var MODES=['auto','grid','dawn','day','dusk','evening','night'],SKYMODE='auto';
try{var sv=localStorage.getItem('caldera-sky');if(sv&&MODES.indexOf(sv)>=0)SKYMODE=sv}catch(err){}
var hm0=location.hash.match(/[#&]sky=([a-z]+)/);if(hm0&&MODES.indexOf(hm0[1])>=0)SKYMODE=hm0[1];
var at0=location.hash.match(/[#&]at=(\d{1,2}):(\d{2})/);   // #at=18:40 shows Auto at that time (for checking the phases)
function rgba(c){if(c.charAt(0)==='#'){var n=parseInt(c.slice(1),16);return [n>>16,n>>8&255,n&255,1]}var m=c.match(/[\d.]+/g)||[0,0,0,1];return [+m[0],+m[1],+m[2],m[3]==null?1:+m[3]]}
function hex2(v){var x=Math.max(0,Math.min(255,Math.round(v))).toString(16);return x.length<2?'0'+x:x}
function lerpCol(a,b,f){var A=rgba(a),B=rgba(b),o=[0,1,2,3].map(function(k){return A[k]+(B[k]-A[k])*f});return o[3]>=.999?'#'+hex2(o[0])+hex2(o[1])+hex2(o[2]):'rgba('+Math.round(o[0])+','+Math.round(o[1])+','+Math.round(o[2])+','+o[3].toFixed(3)+')'}
function blendPal(a,b,f){var o={};for(var k in a){var x=a[k],y=b[k];o[k]=typeof x==='number'?x+(y-x)*f:Array.isArray(x)?x.map(function(v,i){return lerpCol(v,y[i],f)}):lerpCol(x,y,f)}return o}
function phaseNow(){var d=new Date(),m=at0?(+at0[1])*60+(+at0[2]):d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  for(var i=0;i<DAYKEYS.length-1;i++){var a=DAYKEYS[i],b=DAYKEYS[i+1];if(m>=a[0]&&m<=b[0]){var f=(m-a[0])/((b[0]-a[0])||1);return {a:a[1],b:b[1],f:f*f*(3-2*f)}}}return {a:'night',b:'night',f:0}}
function applySky(){var was=sky,k0=palKey;
  if(SKYMODE==='auto'){var ph=phaseNow();P=ph.a===ph.b?PAL[ph.a]:blendPal(PAL[ph.a],PAL[ph.b],ph.f);phase=ph.f<.5?ph.a:ph.b;sky=BASE[phase];palKey=ph.a+ph.b+Math.round(ph.f*40)}
  else if(SKYMODE==='grid'){sky='grid';P=PAL.night;phase='grid';palKey='grid'}
  else{sky=BASE[SKYMODE];P=PAL[SKYMODE];phase=SKYMODE;palKey=SKYMODE}
  night=sky==='night'||sky==='grid';if(sky!==was&&cars)cars.forEach(function(c){c.trail=[]});if(palKey!==k0){dirty=true;UDIRTY=true}}
applySky();
// ---- Tron mode: black glass, neon edges, a glowing grid floor and light cycles
var NEON={TypeScript:'#3AA8FF',JavaScript:'#FFD23A',Python:'#2BFFC0',HTML:'#FF8A2B',Swift:'#FF3D7F',CSS:'#B07CFF',Shell:'#9BFF4A',Go:'#3DF2FF',Rust:'#FF9F5A',Private:'#CFEFFF'};
var CYAN='#3DF2FF',ORANGE='#FF8A2B',DNEON=['#3DF2FF','#FF8A2B','#C77DFF','#FFD23A','#2BFFC0','#FF3D7F'];
function neon(r){return NEON[r.language]||'#9FB4FF'}
function glowLine(c,pts,col,w,blur,close){c.save();c.strokeStyle=col;c.lineWidth=w;c.shadowColor=col;c.shadowBlur=blur;c.lineJoin='round';c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++)c.lineTo(pts[k][0],pts[k][1]);if(close)c.closePath();c.stroke();c.restore()}
function tronGround(){var c=c1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L1.width,L1.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var A=corner(-.5,-.5),B=corner(W+.5,-.5),C=corner(W+.5,H+.5),Dd=corner(-.5,H+.5),th=22;
  poly(c,[Dd,C,[C[0],C[1]+th],[Dd[0],Dd[1]+th]],'#03060B');poly(c,[C,B,[B[0],B[1]+th],[C[0],C[1]+th]],'#020409');poly(c,[A,B,C,Dd],'#05080F');
  // floor grid: one line per tile edge, every fourth brighter
  c.save();c.lineWidth=.6;for(var pass=0;pass<2;pass++){c.beginPath();for(var i=0;i<=W+1;i++){if((i%4===0)!==(pass===1))continue;var a=corner(i-.5,-.5),b=corner(i-.5,H+.5);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}
    for(var j=0;j<=H+1;j++){if((j%4===0)!==(pass===1))continue;var a2=corner(-.5,j-.5),b2=corner(W+.5,j-.5);c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1])}
    c.strokeStyle=pass?'rgba(61,242,255,.45)':'rgba(61,242,255,.14)';c.shadowColor=CYAN;c.shadowBlur=pass?6:0;c.stroke()}c.restore();
  for(var j3=0;j3<=H;j3++)for(var i3=0;i3<=W;i3++){var tt=tiles[i3+','+j3];
    if(water(i3,j3)){poly(c,dia(i3,j3,1.02),'#020D16');var q=iso(i3,j3);c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(61,242,255,.35)';c.lineWidth=1;for(var w=0;w<2;w++){var ox=(rnd(i3*13+j3*7+w)-.5)*TW*.5,oy=(rnd(i3*5+j3*11+w)-.5)*TH*.4;c.beginPath();c.moveTo(q.x+ox-7,q.y+oy);c.lineTo(q.x+ox+7,q.y+oy);c.stroke()}c.restore();continue}
    if(tt.t==='r'){poly(c,dia(i3,j3,1.02),'#070A12');var ri=isRoad(i3-1,j3)||isRoad(i3+1,j3),rj=isRoad(i3,j3-1)||isRoad(i3,j3+1),q2=iso(i3,j3);
      if(ri&&!rj)glowLine(c,[[q2.x-TW*.5,q2.y-TH*.5],[q2.x+TW*.5,q2.y+TH*.5]],'rgba(61,242,255,.75)',1,5);
      else if(rj&&!ri)glowLine(c,[[q2.x+TW*.5,q2.y-TH*.5],[q2.x-TW*.5,q2.y+TH*.5]],'rgba(61,242,255,.75)',1,5);
      else if(ri&&rj){c.fillStyle='rgba(61,242,255,.08)';poly(c,dia(i3,j3,.7));c.fill()}}}
  // the island rim
  glowLine(c,[A,B,C,Dd],'rgba(61,242,255,.9)',1.4,10,true);glowLine(c,[[Dd[0],Dd[1]+th],[C[0],C[1]+th],[B[0],B[1]+th]],'rgba(61,242,255,.35)',1,6);
  // district pads with neon rims in the district's color
  blocks.forEach(function(b,bi){var col=(b.d.label||b.d.name)==='Private'?'#CFEFFF':DNEON[bi%DNEON.length],x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1);
    poly(c,[a,bb,cc,dd],'#0A1120');glowLine(c,[a,bb,cc,dd],col,1.2,9,true);b.neon=col});
  for(var key in tiles){var t2=tiles[key];if(t2.t!=='h'&&t2.t!=='p')continue;var ij=key.split(','),q3=iso(+ij[0],+ij[1]);c.fillStyle=t2.t==='h'?'#0B1626':'#061510';poly(c,dia(+ij[0],+ij[1],.86));c.fill()}
  // glossy floor: each tower's glow reflected under it
  c.save();c.globalCompositeOperation='lighter';for(var k2 in tiles){var t3=tiles[k2];if(t3.t!=='b')continue;var ij2=k2.split(','),pp=iso(+ij2[0],+ij2[1]),col=t3.r.locked?'#CFEFFF':neon(t3.r);
    var g=c.createRadialGradient(pp.x,pp.y+6,1,pp.x,pp.y+6,TW*.7);g.addColorStop(0,col+'40');g.addColorStop(1,col+'00');c.fillStyle=g;c.beginPath();c.ellipse(pp.x,pp.y+6,TW*.7,TH*.6,0,0,7);c.fill()}c.restore();
}
function tronPrism(c,px,py,w,h,col,litp,seed,locked){var hw=TW/2*w,hh=TH/2*w,L=[[px-hw,py],[px,py+hh],[px,py+hh-h],[px-hw,py-h]],R=[[px,py+hh],[px+hw,py],[px+hw,py-h],[px,py+hh-h]],Tp=[[px,py-hh-h],[px+hw,py-h],[px,py+hh-h],[px-hw,py-h]];
  var g=c.createLinearGradient(0,py-h,0,py+hh);g.addColorStop(0,'#101A2C');g.addColorStop(1,'#060A12');poly(c,L,g);var g2=c.createLinearGradient(0,py-h,0,py+hh);g2.addColorStop(0,'#0A1220');g2.addColorStop(1,'#04070D');poly(c,R,g2);poly(c,Tp,'#0E1A2E');
  // window light strips, floor by floor
  var rows=Math.max(0,Math.floor((h-8)/7));for(var side=0;side<2;side++){var ax=side?px:px-hw,ay=side?py+hh:py,bx=side?px+hw:px,by=side?py:py+hh;
    for(var r=0;r<rows;r++){var on=rnd(seed+r*7.3+side*31.7)<litp,v=6+r*7,u0=.14+rnd(seed+r)*.1,u1=.86-rnd(seed+r*3)*.1;
      c.strokeStyle=on?col:'rgba(160,200,255,.07)';c.globalAlpha=on?(side?.75:.95):1;c.lineWidth=1.3;c.beginPath();c.moveTo(ax+(bx-ax)*u0,ay+(by-ay)*u0-v);c.lineTo(ax+(bx-ax)*u1,ay+(by-ay)*u1-v);c.stroke();c.globalAlpha=1}}
  // neon edges
  glowLine(c,[[px-hw,py],[px,py+hh],[px+hw,py]],col,1,6);glowLine(c,[[px,py+hh],[px,py+hh-h]],col,1.4,10);glowLine(c,[[px-hw,py],[px-hw,py-h]],col,.8,5);glowLine(c,[[px+hw,py],[px+hw,py-h]],col,.8,5);
  glowLine(c,Tp,col,1.2,10,true)}
function tronObjects(){SIGNS=[];CLAB=[];var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];tagHits=[];lamps=[];cranes=[];beacons=[];var tags=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if((t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<.22)||t.t==='p'){// data crystals
      var n=t.t==='p'?3:1;for(var q=0;q<n;q++){var cx0=p.x+(rnd(i*3+q)-.5)*24,cy0=p.y+(rnd(j*5+q)-.5)*10,s=.6+rnd(i+j+q)*.5,col=rnd(i*7+j+q)<.5?'#2BFFC0':CYAN;
        c.fillStyle='rgba(10,30,40,.9)';poly(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]]);c.fill();glowLine(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]],col,.8,6,true)}}
    if(t.t==='h'&&(!BUILDING||buildF(t,i,j)>=1)){var spots=[[-11,-3],[11,-3],[0,-9],[0,4]],blk=null;blocks.forEach(function(b){if(b.d===t.d)blk=b});var hc=blk&&blk.neon||CYAN;
      for(var q2=0;q2<t.n;q2++){var hx=p.x+spots[q2][0],hy=p.y+spots[q2][1],hw=TW/2*.24,hh=TH/2*.24;c.fillStyle='#0A1220';poly(c,[[hx-hw,hy],[hx,hy+hh],[hx+hw,hy],[hx+hw,hy-6],[hx,hy-14],[hx-hw,hy-6]]);c.fill();
        glowLine(c,[[hx-hw,hy-6],[hx,hy-14],[hx+hw,hy-6]],hc,1,6);c.fillStyle=hc;c.globalAlpha=.8;c.fillRect(hx-1,hy-4,2,2);c.globalAlpha=1}}
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),seed=hash(r.name||(i+'_'+j)),col=r.kind?(LCOL[r.kind]||'#9FB4FF'):r.locked?'#CFEFFF':dm?'#5A6A80':neon(r);
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=dm?.03:r.locked?(t.d&&t.d.apart?0:r.week?.45:.12):Math.min(.95,.25+(r.week/Math.max(wk,1))*.7);
      var tiers=h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]],base=p.y+4,top=base;
      for(var k=0;k<tiers.length;k++){tronPrism(c,p.x,top,tiers[k][0],tiers[k][1],col,litp,seed+k*101,r.locked);top-=tiers[k][1]}
      if(r.locked){glowLine(c,[[p.x-3,top-6],[p.x-3,top-8],[p.x,top-11],[p.x+3,top-8],[p.x+3,top-6]],col,1.2,6);c.fillStyle=col;c.fillRect(p.x-4,top-6,8,6)}
      if(r===tallest){c.save();c.globalCompositeOperation='lighter';var g=c.createLinearGradient(0,top-260,0,top);g.addColorStop(0,col+'00');g.addColorStop(1,col+'90');c.fillStyle=g;c.fillRect(p.x-2.5,top-260,5,260);c.restore();beacons.push({x:p.x,y:top-4})}
      if(r.week>0&&!dm)cranes.push({x:p.x+4,y:top,seed:seed,col:col});
      var SLt=SFA.get(r);if(SLt&&(!BUILDING||buildF(t,i,j)>=1))SIGNS.push({c:c,x:p.x,base:base,top:top,list:SLt,d:t.d,tron:true,LOD:false,lift:r.week>0&&!dm?30:r===tallest?20:4});
      if(sel===r){var hw2=TW/2*.78,hh2=TH/2*.78;glowLine(c,[[p.x-hw2,base],[p.x,base+hh2],[p.x+hw2,base],[p.x+hw2,top],[p.x,top-TH/2*.46],[p.x-hw2,top]],'#FFFFFF',2/cam.z+.6,16,true)}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&!r.locked&&!r.kind&&(cam.z>1.05||sel===r||(!WORLD&&topSet.indexOf(r)>=0))&&!(t.d&&sel!==r&&String(t.d.name).toLowerCase().replace(/[^a-z0-9]/g,'')===String(r.name).toLowerCase().replace(/[^a-z0-9]/g,'')))tags.push({x:p.x,y:top-(r===tallest?12:8),text:r.name.length>18?r.name.slice(0,17)+'\u2026':r.name,col:col,url:repoUrl(r),r:r})}}
  if(SHOPLBL){pill(c,SHOPLBL.x,SHOPLBL.y,SHOPLBL.text,SHOPLBL.bg,'#fff','700 11px IBM Plex Sans,Arial,sans-serif');hits.push({shop:1,x0:SHOPLBL.x-80,x1:SHOPLBL.x+80,y0:SHOPLBL.y-12,y1:SHOPLBL.y+8});SHOPLBL=null}
  if(WORLD){worldLabels(tags);drawSigns();return}   // storefront signs go over every building and label
  if(labels){var fT='600 10.5px IBM Plex Mono,monospace',fB='700 10.5px IBM Plex Mono,monospace';fitLabels(c,tags,fT,function(b){return {x:b.x,y:b.y,text:b.d.name.toUpperCase()}},fB,
    function(g){tronPill(c,g.x,g.y,g.text,g.col,fT);tagHit(c,g,fT);c.font=fT;CLAB.push([g.x,g.y,c.measureText(g.text).width+14])},function(b,q){tronPill(c,q.x,q.y,q.text,b.neon||CYAN,fB);c.font=fB;CLAB.push([q.x,q.y,c.measureText(q.text).width+14])})}
  drawSigns()}
// labels never sit on top of each other: district names and the live counts are placed first, then the selected repo,
// then repo names by size; a repo name that would overlap one already placed waits until you zoom in far enough to fit
function fitLabels(c,tags,fT,blk,fB,drawTag,drawBlk){var placed=[],box=function(x,y,t,f){c.font=f;var w=c.measureText(t).width+14;return [x-w/2-2,y-19,x+w/2+2,y+5]},
  hit=function(q){for(var i=0;i<placed.length;i++){var o=placed[i];if(q[0]<o[2]&&q[2]>o[0]&&q[1]<o[3]&&q[3]>o[1])return true}return false};
  if(LV.mode==='private')Object.keys(LV.d).forEach(function(k){var b=byName[k],x=LV.d[k];if(b&&x&&x.now>0){var f=iso(b.x+b.k,b.y+b.k);placed.push(box(f.x,f.y+18,'\u25CF '+x.now+' live','600 10px ui-monospace,monospace'))}});
  blocks.forEach(function(b){var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05),q=blk({x:p2[0],y:p2[1]+22,d:b.d});placed.push(box(q.x,q.y,q.text,fB));drawBlk(b,q)});
  tags.slice().sort(function(a,b){return (b.r===sel)-(a.r===sel)||((b.r&&+b.r.commits)||0)-((a.r&&+a.r.commits)||0)}).forEach(function(g){var q=box(g.x,g.y,g.text,fT);if(g.r!==sel&&hit(q))return;placed.push(q);drawTag(g)})}
function tronPill(c,x,y,text,col,font){c.font=font;var tw=c.measureText(text).width,w=tw+14,h=17;c.fillStyle='rgba(2,6,12,.88)';poly(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]]);c.fill();
  glowLine(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]],col,1,6,true);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
function rgb(hex){var n=parseInt(hex.slice(1),16);return [n>>16,n>>8&255,n&255]}
function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
function mix(h,f,toward){var c=rgb(h);if(toward){var t=rgb(toward);return hex(c.map(function(v,i){return v+(t[i]-v)*f}))}
  if(f>=1)return hex(c.map(function(v){return v+(255-v)*(f-1)}));return hex(c.map(function(v){return v*f}))}
function lit(hex,f){return mix(hex,f*P.light+(f>=1?0:0))}
var tallest=null,second=null;(function(){var all=[];D.districts.forEach(function(d){d.repos.forEach(function(r){all.push(r)})});all.sort(function(a,b){return bh(b)-bh(a)});tallest=all[0];second=all[1]})();
// ---- layers: ground (L1) and objects (L2) are cached; cars, cranes and lights animate on top
var L1=document.createElement('canvas'),L2=document.createElement('canvas'),L3=document.createElement('canvas'),L4=document.createElement('canvas'),c1=L1.getContext('2d'),c2=L2.getContext('2d'),c3=L3.getContext('2d'),c4=L4.getContext('2d'),dirty=true,hits=[],sel=null,T=0;
function isRoad(i,j){var t=tiles[i+','+j];return t&&t.t==='r'}
function poly(ctx,pts,fill){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++)ctx.lineTo(pts[k][0],pts[k][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}}
function dia(i,j,s){var p=iso(i,j),hw=TW/2*s,hh=TH/2*s;return [[p.x,p.y-hh],[p.x+hw,p.y],[p.x,p.y+hh],[p.x-hw,p.y]]}
function corner(i,j){var p=iso(i,j);return [p.x,p.y]}
function water(i,j){return i===W||j===H}
function drawGround(){var c=c1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L1.width,L1.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  LODN=WORLD&&cam.z<.5?0:cam.z<1.1?1:2;var n=night,det=LODN>0,v=hView(TH);c.lineJoin='round';
  // the island: a diorama slab with earth sides (a gradient and a few strata lines)
  var A=corner(-.5,-.5),B=corner(W+.5,-.5),C=corner(W+.5,H+.5),Dd=corner(-.5,H+.5),th=22;
  var eg=c.createLinearGradient(0,Dd[1],0,Dd[1]+th);eg.addColorStop(0,P.earth[0]);eg.addColorStop(1,lerpCol(P.earth[0],'#000000',.3));poly(c,[Dd,C,[C[0],C[1]+th],[Dd[0],Dd[1]+th]],eg);
  var eg2=c.createLinearGradient(0,C[1],0,C[1]+th);eg2.addColorStop(0,P.earth[1]);eg2.addColorStop(1,lerpCol(P.earth[1],'#000000',.3));poly(c,[C,B,[B[0],B[1]+th],[C[0],C[1]+th]],eg2);
  c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=.6;c.beginPath();for(var s0=0;s0<6;s0++){var yy=th*(.25+s0*.12),wv=rnd(s0+.5)*3;c.moveTo(Dd[0],Dd[1]+yy);c.lineTo(C[0],C[1]+yy+wv);c.lineTo(B[0],B[1]+yy)}c.stroke();
  poly(c,[A,B,C,Dd],P.grass);
  var gt=[P.grass,P.grass2,P.grass3||P.grass2];
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var t=tiles[i+','+j];if(t.t==='L')continue;var q=iso(i,j);if(q.x<v[0]||q.x>v[1]||q.y<v[2]||q.y>v[3])continue;
    if(water(i,j)){var g=c.createLinearGradient(0,q.y-TH/2,0,q.y+TH/2);g.addColorStop(0,P.water[0]);g.addColorStop(1,P.water[1]);poly(c,dia(i,j,1.02),g);   // ripples move to the live layer (waterHi)
      if(det){var d2=dia(i,j,1.02),dry=function(a,b){return a>=0&&b>=0&&a<=W&&b<=H&&!water(a,b)};c.strokeStyle=n?'rgba(170,200,240,.25)':'rgba(255,255,255,.55)';c.lineWidth=1.1;
        if(dry(i,j-1))hline(c,d2[3][0],d2[3][1],d2[0][0],d2[0][1]);if(dry(i-1,j))hline(c,d2[0][0],d2[0][1],d2[1][0],d2[1][1]);if(dry(i+1,j))hline(c,d2[1][0],d2[1][1],d2[2][0],d2[2][1]);if(dry(i,j+1))hline(c,d2[2][0],d2[2][1],d2[3][0],d2[3][1])}continue}
    if(t.t==='w'||t.t==='wp'){poly(c,dia(i,j,1.02),sky==='night'||sky==='evening'?'#6E6556':'#D9CBB0');poly(c,dia(i,j,.8),sky==='night'||sky==='evening'?'#7A7060':'#E6DAC2');continue}
    if(t.t==='g'){var tone=(i*7+j*3)%3;if(tone)poly(c,dia(i,j,1.02),gt[tone]);if(!det)continue;
      if((i+j)%2===0)poly(c,dia(i,j,1.02),'rgba(255,255,255,'+(n?.015:.035)+')');   // mown stripes
      c.fillStyle=n?'rgba(120,180,120,.12)':'rgba(190,235,150,.5)';c.beginPath();for(var f2=0;f2<4;f2++){var fx=q.x+(rnd(i*31+j*17+f2)-.5)*TW*.7,fy=q.y+(rnd(i*13+j*23+f2)-.5)*TH*.7;c.moveTo(fx+.7,fy);c.arc(fx,fy,.7,0,7)}c.fill();
      if(!n&&rnd(i*5+j*9+.5)<.12){c.fillStyle=rnd(i+j+.3)<.5?'#F2D24A':'#F8F2FF';c.beginPath();c.arc(q.x+(rnd(i*3+.2)-.5)*20,q.y+(rnd(j*3+.7)-.5)*10,.8,0,7);c.fill()}continue}
    if(t.t==='r'){poly(c,dia(i,j,1.02),(i+j)%2?P.road:P.road2);
      var ri=isRoad(i-1,j)||isRoad(i+1,j),rj=isRoad(i,j-1)||isRoad(i,j+1);
      if(det){c.fillStyle='rgba(255,255,255,'+(n?.035:.07)+')';c.beginPath();for(var gr=0;gr<10;gr++){var gx=q.x+(rnd(i*41+j*7+gr)-.5)*TW*.8,gy=q.y+(rnd(i*11+j*29+gr)-.5)*TH*.8;c.moveTo(gx+.6,gy);c.arc(gx,gy,.6,0,7)}c.fill();   // grain
        var dd=dia(i,j,1);c.strokeStyle=P.curb||'rgba(255,255,255,.4)';c.lineWidth=.8;c.beginPath();   // curbs where the road meets anything that isn't road
        if(!isRoad(i,j-1)){c.moveTo(dd[3][0],dd[3][1]);c.lineTo(dd[0][0],dd[0][1])}if(!isRoad(i-1,j)){c.moveTo(dd[0][0],dd[0][1]);c.lineTo(dd[1][0],dd[1][1])}if(!isRoad(i+1,j)){c.moveTo(dd[1][0],dd[1][1]);c.lineTo(dd[2][0],dd[2][1])}if(!isRoad(i,j+1)){c.moveTo(dd[2][0],dd[2][1]);c.lineTo(dd[3][0],dd[3][1])}c.stroke()}
      c.strokeStyle=P.line;c.lineWidth=1.1;c.setLineDash([5,5]);
      if(ri&&!rj){c.beginPath();c.moveTo(q.x-TW*.25,q.y-TH*.25);c.lineTo(q.x+TW*.25,q.y+TH*.25);c.stroke()}
      else if(rj&&!ri){c.beginPath();c.moveTo(q.x+TW*.25,q.y-TH*.25);c.lineTo(q.x-TW*.25,q.y+TH*.25);c.stroke()}
      c.setLineDash([]);
      if(ri&&rj&&det){c.fillStyle=n?'rgba(255,255,255,.14)':'rgba(255,255,255,.55)';c.beginPath();   // zebra crossings on all four approaches, drawn as paths
        var zr=function(x,y,w,h){var P0=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];c.moveTo(q.x+P0[0][0]-P0[0][1],q.y+(P0[0][0]+P0[0][1])*.5);for(var m=1;m<4;m++)c.lineTo(q.x+P0[m][0]-P0[m][1],q.y+(P0[m][0]+P0[m][1])*.5);c.closePath()};
        for(var z=-2;z<=2;z++){zr(-1+z*4,-15,2,5);zr(-1+z*4,10,2,5);zr(-15,-1+z*4,5,2);zr(10,-1+z*4,5,2)}c.fill()}
      else if(det&&rnd(i*19+j*23+.5)<.25){c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(q.x+6,q.y+3,2.6,1.3,0,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=.4;c.beginPath();c.ellipse(q.x+6,q.y+3,2.6,1.3,0,Math.PI,0);c.stroke()}}   // a manhole
  }
  // blocks: raised sidewalk slabs with paving joints and a lit top edge, then lots
  blocks.forEach(function(b){if(b.estate)return;var x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1),h=3;
    poly(c,[dd,cc,[cc[0],cc[1]+h],[dd[0],dd[1]+h]],P.walkSide);poly(c,[cc,bb,[bb[0],bb[1]+h],[cc[0],cc[1]+h]],mix(P.walkSide.charAt(0)==='#'?P.walkSide:'#999999',.85));poly(c,[a,bb,cc,dd],P.walk);
    if(det){c.save();poly(c,[a,bb,cc,dd]);c.clip();c.strokeStyle=P.joint||'rgba(0,0,0,.1)';c.lineWidth=.5;c.beginPath();for(var u=x0;u<=x1+.01;u+=.25){var p0=corner(u,y0),p1=corner(u,y1);c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1])}for(var w2=y0;w2<=y1+.01;w2+=.25){var p2=corner(x0,w2),p3=corner(x1,w2);c.moveTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1])}c.stroke();c.restore();
      c.strokeStyle='rgba(255,255,255,'+(n?.1:.5)+')';c.lineWidth=.8;c.beginPath();c.moveTo(dd[0],dd[1]);c.lineTo(cc[0],cc[1]);c.lineTo(bb[0],bb[1]);c.stroke()}});
  for(var key in tiles){var t2=tiles[key];if(t2.t!=='b'&&t2.t!=='h'&&t2.t!=='p')continue;var ij=key.split(','),ii=+ij[0],jj=+ij[1];
    if(t2.t==='b')poly(c,dia(ii,jj,.9),P.plaza);
    else if(t2.t==='h'){poly(c,dia(ii,jj,.92),P.grass2);}
    else{poly(c,dia(ii,jj,.9),P.park);var q3=iso(ii,jj);c.strokeStyle=sky==='night'?'rgba(200,190,170,.18)':'rgba(240,232,210,.8)';c.lineWidth=2;c.beginPath();c.moveTo(q3.x-TW*.3,q3.y);c.quadraticCurveTo(q3.x,q3.y-4,q3.x+TW*.3,q3.y);c.stroke()}}
  growGround(c);
  // soft cast shadows, unioned into one path so overlaps don't double-darken (sun from the upper left), then an AO pool per footprint
  var foot=[];for(var k2 in tiles){var t3=tiles[k2],ij2=k2.split(','),pp=iso(+ij2[0],+ij2[1]);if(pp.x<v[0]-200||pp.x>v[1]||pp.y<v[2]||pp.y>v[3]+40)continue;
    if(t3.t==='b')foot.push([pp.x,pp.y,.78,bh(t3.r)]);else if(t3.t==='h'&&det){[[0,-9],[-11,-2],[9,-3]].slice(0,Math.min(3,t3.n||3)).forEach(function(o){foot.push([pp.x+o[0],pp.y+o[1],.3,13])})}
    else if(t3.t==='L'&&typeof gShadow==='function'){var gs=gShadow(t3);if(gs)foot.push([pp.x,pp.y,gs[0],gs[1]])}}
  c.beginPath();foot.forEach(function(f){var hw=TW/2*f[2],hh=TH/2*f[2],vx=f[3]*.62,vy=f[3]*.3,x=f[0],y=f[1]+4;
    c.moveTo(x-hw,y);c.lineTo(x,y-hh);c.lineTo(x+vx,y-hh+vy);c.lineTo(x+hw+vx,y+vy);c.lineTo(x+vx,y+hh+vy);c.lineTo(x,y+hh);c.closePath()});
  c.fillStyle=P.shadow;c.fill('nonzero');
  if(det)foot.forEach(function(f){aoHi(c,f[0],f[1]+4,f[2])});
}
// ---- world mode (caldera.social/world): every member is a neighborhood; friendships are highways between them
var WORLD=D.world||null,WFOCUS=null,WHOVER=null;
function blockMid(b){var n=b.nbo;return n?iso(n.ox+n.w/2-.5,n.oy+n.h/2-.5):iso(b.x+b.k/2-.5,b.y+b.k/2-.5)}
function worldCard(b){var key=b.d.nb||b.d.name,m=WORLD.m[key]||{},nn=NBM[key],nrep=nn?nn.ds.reduce(function(s,d){return s+d.repos.length},0):b.d.repos.length;sel=null;
  card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+e(m.name||key)+'</h3><div class="k">'+e(key)+(m.isNew?' &middot; new this week':'')+(m.groups&&m.groups.length?' &middot; '+m.groups.map(function(g){return e(g)}).join(', '):'')+'</div>'
    +(m.headline?'<p style="margin:6px 0 0">'+e(m.headline)+'</p>':'')
    +'<div class="row"><span>Buildings</span><b>'+nrep+'</b></div>'+(nn&&nn.ds.length>1?'<div class="row"><span>Districts</span><b>'+nn.ds.length+'</b></div>':'')+(m.friends?'<div class="row"><span>Friends</span><b>'+m.friends+'</b></div>':'')
    +growCard(key)+battleCard(key)+'<p style="margin:8px 0 0"><a href="'+e(m.city||'#')+'">Walk into their city &rarr;</a> &middot; <a href="'+e(m.page||'#')+'">Profile</a></p><div class="k" style="margin-top:4px">Click the name again to go in.</div>'+giftHtml(key,'');
  card.hidden=false;card.querySelector('.x').onclick=function(){WFOCUS=null;show(null)};giftWire(function(){worldCard(b)})}
${GROWTH_DRAW_JS}
${BATTLE_DRAW_JS}
// ---- light-ups: one gift a day to celebrate someone's city (or one of its public repos). It shines on the world map for 24
// hours as searchlights from the gifted building; every extra gift adds a beam, so friends rally to light each other up.
var GC=window.CALDERA_GIFTS||null,GME=null,LIT={};
if(D.world&&GC){fetch(GC.url+'/me',{credentials:'same-origin',cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){GME=j}).catch(function(){});
  fetch(GC.url+'/lit',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j&&j.lit)LIT=j.lit}).catch(function(){})}
function giftHtml(key,repo){if(!D.world||!GC)return'';var L=LIT[key],h=key.replace(/^@/,''),out='<div class="c-gift">';
  if(L&&L.n)out+='<div class="k">&#10022; Lit up today by '+L.by.slice(0,4).map(function(x){return '@'+e(x)}).join(', ')+(L.n>4?' and '+(L.n-4)+' more':'')+'</div>';
  if(!GME)out+='';else if(!GME.member)out+='<a class="c-gift-b" href="/auth/github?back=%2Fworld">&#10022; Sign in to light up '+(repo?'this repo':'their city')+'</a>';
  else if(!GME.listed)out+='<div class="k">List your page in People to light up cities.</div>';
  else if(GME.handle===h)out+=L&&L.n?'':'<div class="k">Friends can light up your city. It glows here for 24 hours.</div>';
  else if((GME.today||[]).indexOf(h)>=0)out+='<div class="k">&#10022; You lit this city up today.</div>';
  else if(GME.left<=0)out+='<div class="k">You\u2019ve given today\u2019s gift'+(GME.max>1?'s':'')+'. New '+(GME.max>1?'ones':'one')+' at midnight Pacific.</div>';
  else out+='<button type="button" class="c-gift-b" data-gift="'+e(key)+'" data-repo="'+e(repo||'')+'">&#10022; Light up '+(repo?'this repo':'their city')+'</button><div class="k">'+GME.left+' gift'+(GME.left===1?'':'s')+' left today &middot; it glows for 24 hours</div>';
  return out+'</div>'}
function giftWire(again){var bt=card.querySelector('[data-gift]');if(!bt)return;bt.onclick=function(){bt.disabled=true;var key=bt.getAttribute('data-gift'),repo=bt.getAttribute('data-repo');
  fetch(GC.url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({to:key.replace(/^@/,''),repo:repo})}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})},function(){return{ok:false,j:{error:'Could not reach Caldera.'}}}).then(function(x){
    if(!x.ok){bt.disabled=false;giftToast(x.j.error||'Could not light it up.');return}GME=x.j;LIT[key]=x.j.lit;giftToast('\u2726 You lit up '+key+'\u2019s city'+(repo?' for '+repo:'')+'. It glows for 24 hours.');again();dirty=true;draw()})}}
function giftToast(m){if(!toasts)return;var t=document.createElement('div');t.className='c-toast';t.textContent=m;toasts.insertBefore(t,toasts.firstChild);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},5200)}
/** searchlights: one per gift, up to 3, from the gifted buildings (else the tallest), sweeping and crossing */
function drawLit(){if(!D.world)return;var ks=Object.keys(LIT);if(!ks.length)return;var c=cx,tn=performance.now(),amb={day:.55,dawn:.75,dusk:.85,evening:1,night:1.1,grid:1}[sky]||.9;
  c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';
  ks.forEach(function(key){var L=LIT[key],list=BDIST[key];if(!L||!L.n||!list||!list.length)return;var src=[];Object.keys(L.repos||{}).forEach(function(nm){var b=list.filter(function(o){return o.r.name===nm})[0];if(b)src.push(b)});
    if(!src.length)src.push(list.slice().sort(function(a,b2){return bh(b2.r)-bh(a.r)})[0]);var nb=Math.min(3,L.n),sd=hash(key)%97;
    for(var k=0;k<nb;k++){var b=src[k%src.length],p=iso(b.i,b.j),top=p.y-bh(b.r),ang=Math.sin(tn/2600+k*2.1+sd)*.3+(k-(nb-1)/2)*.22,len=340,tx=p.x+Math.sin(ang)*len,ty=top-Math.cos(ang)*len,w=34,nx=Math.cos(ang)*w,ny=Math.sin(ang)*w;
      var g=c.createLinearGradient(p.x,top,tx,ty);g.addColorStop(0,'rgba(255,238,196,'+(.5*amb)+')');g.addColorStop(.6,'rgba(255,226,170,'+(.16*amb)+')');g.addColorStop(1,'rgba(255,226,170,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(p.x-2.5,top);c.lineTo(p.x+2.5,top);c.lineTo(tx+nx,ty+ny);c.lineTo(tx-nx,ty-ny);c.closePath();c.fill();
      var hs=c.createRadialGradient(p.x,top,0,p.x,top,10);hs.addColorStop(0,'rgba(255,248,225,'+(.9*amb)+')');hs.addColorStop(1,'rgba(255,238,196,0)');c.fillStyle=hs;c.beginPath();c.arc(p.x,top,10,0,7);c.fill()}});
  c.restore()}
function worldFocus(b){b=(b.d.nb&&byName[b.d.nb])||b;var m=WORLD.m[b.d.nb||b.d.name]||{};if(WFOCUS===b&&m.city){location.href=m.city;return}WFOCUS=b;
  var c=blockMid(b),z0=cam.z,z1=Math.max(cam.z,Math.min(1.5,vw<600?.75:.9)),x0=cam.x,y0=cam.y,x1=vw/2-c.x*z1,y1=vh/2-c.y*z1+40*z1,t0=performance.now();
  (function anim(){var f=Math.min(1,(performance.now()-t0)/450),k=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;cam.z=z0+(z1-z0)*k;cam.x=x0+(x1-x0)*k;cam.y=y0+(y1-y0)*k;draw();if(f<1)requestAnimationFrame(anim)})();
  worldCard(b)}
// ---- new lands: members who joined since this browser last looked at the world get their city built in front of you.
// The camera flies to each new neighborhood and its buildings rise one by one from a foundation, in scaffolding with a
// crane, then light up. Joining while you watch: the live poll sees the member count go up and reloads in place (same
// camera), and the newcomer is built. First visit: this week's newcomers are built so there's always something to see.
var BUILD={},BUILDING=false,BTIMERS=[];
function buildF(t,i,j){var B=BUILD[t.d&&(t.d.nb||t.d.name)];if(!B)return 1;var k=i+','+j,d=B.st[k]||0,du=(B.du&&B.du[k])||1900,f=(T-B.t0-d)/du;return f<=0?0:f>=1?1:f}
// a build is only redrawn every frame while something is actually moving (pending lands sit still as baseplates)
function bActive(){if(INTRO&&T>INTRO)introFinish(false);if(INTRO||SHIM||DUST.length)return true;for(var k in BUILD){var B=BUILD[k];if(T>=B.t0&&T<=B.t0+B.end+600)return true}return false}
// ---- LEGO build: buildings assemble brick by brick (stud-topped bricks drop in with a bounce, dust puffs, a click if
// sound is on), then windows click on and the roof piece snaps on. Used for the first-load city intro and for new lands
// on the world map. Bricks are drawn procedurally; a building is capped at LEGO_MAX courses (big cities use fewer,
// taller courses) so a phone stays smooth.
var INTRO=false,GINTRO=null,SHIM=null,DUST=[],LEGOST={},FOREMAN={},LEGO_MAX=14,lastTick=0;
function ease3(x){return 1-Math.pow(1-x,3)}
function gf(i,j){if(!GINTRO)return 1;var f=(T-GINTRO.t0-(i+j)*GINTRO.step)/260;return f<=0?0:f>=1?1:f}
function gpop(i,j){if(!GINTRO)return 1;var f=(T-GINTRO.t0-(i+j)*GINTRO.step-240)/260;return f<=0?0:f>=1?1:f}
// the island starts as a bare studded baseplate; plates snap down along a diagonal sweep and the roads draw on under them
function groundIntro(c){if(!GINTRO)return;var pc=sky==='night'||sky==='evening'?'#2E5A3A':'#4FA35E';
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){if(water(i,j))continue;var f=gf(i,j);if(f>=1)continue;var p=iso(i,j),e=ease3(f),dy=f>0?-(1-e)*9:0,a=f>0?1-e:1;
    c.save();c.globalAlpha=a;poly(c,dia(i,j,1.02),pc);c.translate(0,dy);poly(c,dia(i,j,.96),mix(pc,1.08));studs(c,p.x,p.y,.9,pc);c.restore()}}
function bounce(x){var n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375}
function backOut(x){var c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}
function legoN(h){return Math.max(3,Math.min(LEGO_MAX,Math.round(h/7)))}
function clickTick(){var tn=performance.now();if(!sound||tn-lastTick<70)return;lastTick=tn;tone([1700+Math.random()*500],.012)}
function studs(c,px,y,w,col,a){var hw=TW/2*w,hh=TH/2*w,g=w>.66?[-.6,0,.6]:[-.45,.45],rs=hw*(w>.66?.13:.17),sh=Math.max(1.3,rs*.7),top=mix(col,1.25*P.light+(P.light<1?.12:0)),side=mix(col,.8);
  c.save();if(a!=null)c.globalAlpha=a;for(var m=0;m<g.length;m++)for(var n=0;n<g.length;n++){var x=px+(g[m]-g[n])*hw/2,yy=y+(g[m]+g[n])*hh/2;
    c.fillStyle=side;c.beginPath();c.ellipse(x,yy,rs,rs*.5,0,0,Math.PI);c.lineTo(x-rs,yy-sh);c.ellipse(x,yy-sh,rs,rs*.5,0,Math.PI,0,true);c.closePath();c.fill();
    c.fillStyle=top;c.beginPath();c.ellipse(x,yy-sh,rs,rs*.5,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x-rs*.3,yy-sh-rs*.12,rs*.35,rs*.18,0,0,7);c.fill()}c.restore()}
function seams(c,px,top,w,h,bh,h0){var hw=TW/2*w,hh=TH/2*w;c.save();c.lineWidth=.7;
  for(var b=Math.ceil((h0+.01)/bh);b*bh<h0+h-.01;b++){var y=top-(b*bh-h0);c.strokeStyle='rgba(0,0,0,.22)';c.beginPath();c.moveTo(px-hw,y);c.lineTo(px,y+hh);c.lineTo(px+hw,y);c.stroke();
    c.strokeStyle='rgba(255,255,255,.13)';c.beginPath();c.moveTo(px-hw,y-.8);c.lineTo(px,y+hh-.8);c.lineTo(px+hw,y-.8);c.stroke()}
  c.strokeStyle='rgba(0,0,0,.16)';for(var b2=Math.floor(h0/bh);b2*bh<h0+h;b2++){var y0=top-Math.max(0,b2*bh-h0),y1=top-Math.min(h,(b2+1)*bh-h0);if(y0-y1<1.5)continue;var u=b2%2?.5:.25,u2=b2%2?null:.75;
    [u,u2].forEach(function(uu){if(uu==null)return;c.beginPath();c.moveTo(px-hw+hw*uu,y0+hh*uu);c.lineTo(px-hw+hw*uu,y1+hh*uu);c.moveTo(px+hw*uu,y0+hh-hh*uu);c.lineTo(px+hw*uu,y1+hh-hh*uu);c.stroke()})}c.restore()}
function plate(c,px,y,w,col,a){var hw=TW/2*w,hh=TH/2*w;c.save();c.globalAlpha=a==null?1:a;poly(c,[[px,y-hh],[px+hw,y],[px,y+hh],[px-hw,y]],mix(col,.55,P.grass||'#5a7'));studs(c,px,y,w,mix(col,.55,P.grass||'#5a7'));c.restore()}
function minifig(c,x,y,col,seed){figHi(c,x,y,col,seed,1)}   // crews, parades and the intro foreman: the high-detail worker
function drawDust(c){if(!DUST.length)return;var tn=performance.now();DUST=DUST.filter(function(d){return tn-d.born<480});c.save();
  DUST.forEach(function(d){var f=(tn-d.born)/480;c.fillStyle='rgba(235,228,212,'+(.55*(1-f))+')';for(var k=0;k<5;k++){var a=k*1.26+d.s,r=d.w*(.5+f*.9);c.beginPath();c.arc(d.x+Math.cos(a)*r,d.y+Math.sin(a)*r*.5-f*3,1.2+f*2.2,0,7);c.fill()}});c.restore()}
// draws a building that is mid-build and returns the y of its current top
function lego(c,px,base,tiers,h,col,glass,litp,seed,r,f,key,dkey,LOD){var w0=tiers[0][0];
  if(f<=0){plate(c,px,base,w0,col,.9);return base}
  var n=legoN(h),bh=h/n,bf=Math.min(1,f/.8),pl=bf*n,placed=Math.min(n,Math.floor(pl)),q=pl-placed,hc=placed*bh,top=base,acc=0,curW=w0,wf=f<.8?0:Math.min(1,(f-.8)/.14);
  if(!placed)plate(c,px,base,w0,col,1);
  for(var k=0;k<tiers.length;k++){var tw=tiers[k][0],full=tiers[k][1],th=Math.min(full,hc-acc);if(th<=.01)break;prism(c,px,top,tw,th,col);
    if(!LOD){seams(c,px,top,tw,th,bh,acc);if(wf>0)facadeWindows(c,px,top,tw,th,glass,litp*wf,seed+k*101,base,0)}top-=th;acc+=th;curW=tw;if(th<full-.01)break}
  var nw=tiers[tiers.length-1][0],a2=0;for(var k2=0;k2<tiers.length;k2++){if(hc<a2+tiers[k2][1]-.01){nw=tiers[k2][0];break}a2+=tiers[k2][1]}
  if(placed<n){if(!LOD)studs(c,px,top,curW,col);
    var e=bounce(Math.min(1,q*1.15)),dy=-(1-e)*42,sq=q>.55&&q<.8?1-.18*Math.sin((q-.55)/.25*Math.PI):1,hw=TW/2*nw,hh=TH/2*nw;
    c.save();c.fillStyle='rgba(0,0,0,'+(.22*Math.min(1,q*1.4))+')';c.beginPath();c.ellipse(px,top,hw*.85*(.6+.4*q),hh*.85*(.6+.4*q),0,0,7);c.fill();c.restore();
    prism(c,px,top+dy,nw,bh*sq,col);if(!LOD)studs(c,px,top+dy-bh*sq,nw,col)}
  else if(f<.94&&!LOD)studs(c,px,top,curW,col,1-wf*.9);
  var st=LEGOST[key]||(LEGOST[key]={n:0});if(placed>st.n){st.n=placed;if(!LOD&&DUST.length<60)DUST.push({x:px,y:top,born:performance.now(),w:TW/2*nw*.9,s:seed%6});clickTick()}
  if(!LOD&&f<.8&&!FOREMAN[dkey]){FOREMAN[dkey]=1;minifig(c,px-TW/2*w0-5,base+TH/2*w0*.55,col,seed)}
  if(!LOD&&wf>0&&wf<1){var sx=px+((seed%7)/7-.5)*TW/2*nw,sy=top+(base-top)*(.2+((seed>>3)%5)/8),tw2=Math.sin(wf*Math.PI);c.save();c.globalAlpha=tw2;c.fillStyle='#FFF6C8';c.beginPath();c.moveTo(sx,sy-5);c.lineTo(sx+1.2,sy-1.2);c.lineTo(sx+5,sy);c.lineTo(sx+1.2,sy+1.2);c.lineTo(sx,sy+5);c.lineTo(sx-1.2,sy+1.2);c.lineTo(sx-5,sy);c.lineTo(sx-1.2,sy-1.2);c.closePath();c.fill();c.restore()}
  if(!LOD&&f>=.94){var rf=Math.min(1,(f-.94)/.06);c.save();c.translate(0,-(1-backOut(rf))*12);roofProps(c,px,top,curW,r,seed);c.restore()}
  return top}
function scaffold(c,x,base,top,tw,f){var hw=TW/2*tw*.92,hh=TH/2*tw*.92;c.save();c.globalAlpha=Math.min(1,(1-f)*3);c.strokeStyle='rgba(255,196,92,.9)';c.lineWidth=1.1/Math.max(cam.z,.3);
  c.beginPath();for(var y=base;y>top-6;y-=9){c.moveTo(x-hw,y);c.lineTo(x,y+hh);c.lineTo(x+hw,y)}c.moveTo(x-hw,base);c.lineTo(x-hw,top-6);c.moveTo(x+hw,base);c.lineTo(x+hw,top-6);c.moveTo(x,base+hh);c.lineTo(x,top+hh-6);c.stroke();
  c.fillStyle='rgba(255,236,170,'+(.9*(1-f))+')';for(var k=0;k<3;k++){var a=(T/180+k*2.1)%6.28;c.beginPath();c.arc(x+Math.cos(a)*hw*.8,top-4+Math.sin(a*1.3)*3,1.6,0,7);c.fill()}c.restore()}
function nbTiles(key){var out=[];for(var k in tiles){var t=tiles[k];if((t.t==='b'||t.t==='h')&&t.d&&(t.d.nb||t.d.name)===key)out.push(k)}return out}
function legoDur(t){return t&&t.t==='b'&&t.r&&!t.r.kind?Math.min(1500,620+legoN(bh(t.r))*62):700}
function buildStart(key,now){var ks=nbTiles(key),mn=1e9;ks.forEach(function(k){var a=k.split(',');mn=Math.min(mn,+a[0]+ +a[1])});var st={},du={},end=0;
  ks.forEach(function(k,n){var a=k.split(','),d=400+(+a[0]+ +a[1]-mn)*200+rnd(n*7+3)*220,u=legoDur(tiles[k]);st[k]=d;du[k]=u;end=Math.max(end,d+u)});LEGOST={};BUILD[key]={t0:now,st:st,du:du,end:end};BUILDING=true;draw();return end}
// first load of a city page: baseplate, then every district assembles brick by brick (busiest district first), windows
// click on, roofs snap on, a shimmer sweeps the skyline. About 3.5-4.5s; any click, drag, scroll or key skips it.
function cityIntro(){if(reduce||D.world||sky==='grid'||!blocks.length)return;var t0=performance.now()+150,nb=0;
  for(var k in tiles)if(tiles[k].t==='b')nb++;LEGO_MAX=nb>80?5:nb>45?7:nb>25?10:14;
  GINTRO={t0:t0,step:Math.min(28,620/Math.max(1,W+H))};var gEnd=620+260;
  var ds=blocks.map(function(b){var sc=0;(b.d.repos||[]).forEach(function(r){sc+=(+r.week||0)*20+(+r.commits||0)});return {key:b.d.nb||b.d.name,sc:sc}}).sort(function(a,b){return b.sc-a.sc});
  var stag=Math.min(300,1300/Math.max(1,ds.length)),plan=[],raw=0;
  ds.forEach(function(x,di){var ks=nbTiles(x.key).filter(function(k){return tiles[k].t==='b'});ks.sort(function(a,b){var p=a.split(','),q=b.split(',');return (+p[0]+ +p[1])-(+q[0]+ +q[1])});
    var gap=Math.min(150,900/Math.max(1,ks.length)),pl={key:x.key,st:{},du:{}};ks.forEach(function(k,n){var d=di*stag+n*gap,u=legoDur(tiles[k]);pl.st[k]=d;pl.du[k]=u;raw=Math.max(raw,d+u)});plan.push(pl)});
  var sc=Math.min(1,3300/Math.max(1,raw)),bStart=t0+gEnd-200,endAll=0;
  plan.forEach(function(pl){var end=0;for(var k in pl.st){pl.st[k]*=sc;pl.du[k]=Math.max(420,pl.du[k]*Math.max(sc,.6));end=Math.max(end,pl.st[k]+pl.du[k])}BUILD[pl.key]={t0:bStart,st:pl.st,du:pl.du,end:end};endAll=Math.max(endAll,end)});
  INTRO=bStart+endAll+80;BUILDING=true;LEGOST={}}
function introFinish(skipped){if(!INTRO)return;INTRO=false;GINTRO=null;LEGO_MAX=14;BTIMERS.forEach(clearTimeout);BTIMERS=[];BUILD={};BUILDING=false;LEGOST={};DUST=[];if(!skipped)SHIM={t0:performance.now()};dirty=true;draw()}
['pointerdown','wheel','keydown'].forEach(function(ev){(ev==='keydown'?window:cv).addEventListener(ev,function(){if(INTRO)introFinish(true)},{passive:true})});
function drawShimmer(){if(!SHIM)return;var f=(performance.now()-SHIM.t0)/900;if(f>=1){SHIM=null;return}var w=cv.width,h=cv.height;
  c3.setTransform(1,0,0,1,0,0);c3.globalCompositeOperation='source-over';c3.clearRect(0,0,w,h);c3.drawImage(L2,0,0);c3.globalCompositeOperation='source-atop';
  var x=(f*1.5-.25)*w,g=c3.createLinearGradient(x-w*.07,h*.1,x+w*.07,h*.3);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,250,225,.6)');g.addColorStop(1,'rgba(255,255,255,0)');
  c3.fillStyle=g;c3.fillRect(0,0,w,h);c3.globalCompositeOperation='source-over';cx.save();cx.setTransform(1,0,0,1,0,0);cx.globalCompositeOperation='lighter';cx.globalAlpha=.32*Math.sin(f*Math.PI);cx.drawImage(L3,0,0);cx.restore()}
var FLYG=0;function flyStop(){FLYG++}   // a replay taking the camera cancels any flight in progress
function flyTo(x1,y1,z1,ms,done){var z0=cam.z,x0=cam.x,y0=cam.y,t0=performance.now(),g=++FLYG;(function anim(){if(g!==FLYG)return;var f=Math.min(1,(performance.now()-t0)/ms),k=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;
  cam.z=z0+(z1-z0)*k;cam.x=x0+(x1-x0)*k;cam.y=y0+(y1-y0)*k;draw();if(f<1)requestAnimationFrame(anim);else if(done)done()})()}
var buildBar=null;function buildNote(html){if(!buildBar){buildBar=document.createElement('div');buildBar.setAttribute('role','status');
  buildBar.style.cssText='position:absolute;left:50%;'+(vw<600?'top:52px;width:calc(100% - 24px);justify-content:space-between;':'bottom:18px;')+'transform:translateX(-50%);z-index:6;display:flex;gap:10px;align-items:center;max-width:calc(100% - 24px);padding:9px 10px 9px 14px;border-radius:12px;background:rgba(10,12,22,.9);border:1px solid #8B6CF6;box-shadow:0 0 22px rgba(139,108,246,.45);color:#fff;font:600 12.5px/1.35 IBM Plex Sans,Arial,sans-serif';
  st.appendChild(buildBar)}buildBar.innerHTML=html;var sk=buildBar.querySelector('button');if(sk)sk.onclick=buildSkip}
function buildDone(){BTIMERS.forEach(clearTimeout);BTIMERS=[];for(var k in BUILD)BUILD[k].t0=-1e9;BUILDING=false;BUILD={};LEGOST={};DUST=[];draw();if(buildBar){buildBar.remove();buildBar=null}}
function buildSkip(){var h=BHOME;buildDone();if(h)flyTo(h.x,h.y,h.z,500)}
var BHOME=null;
function buildLands(keys){keys=keys.filter(function(k){return byName[k]&&nbTiles(k).length});if(!keys.length)return;
  if(reduce){keys.forEach(function(k){var b=byName[k];if(b)pulse(b,SCOL,true)});return}
  BHOME={x:cam.x,y:cam.y,z:cam.z};var n=keys.length,i=0,e=function(v){return String(v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  function next(){if(i>=n){var h=BHOME;BTIMERS.push(setTimeout(function(){buildDone();if(h)flyTo(h.x,h.y,h.z,900)},600));return}
    var k=keys[i++],b=byName[k],m=WORLD.m[k]||{},c=blockMid(b),z=Math.min(1.4,vw<600?.85:1.05);
    buildNote('<span style="color:#C4B5FF">✦</span><span>'+(n>1?(vw<600?'New land '+i+'/'+n+': ':'New land '+i+' of '+n+': '):'New land: ')+'<b>'+e(m.name||k)+'</b> joined. Building their city…</span><button type="button" style="all:unset;cursor:pointer;padding:4px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.25);font-weight:600">Skip</button>');
    flyTo(vw/2-c.x*z,vh/2-c.y*z+40*z,z,1100,function(){var dur=buildStart(k,performance.now());pulse(b,'#8B6CF6',true);
      BTIMERS.push(setTimeout(function(){pulse(b,SCOL,true);BTIMERS.push(setTimeout(next,900))},dur))})}
  next()}
(function(){if(!WORLD)return;var KEY='caldera.world.seen',all=Object.keys(WORLD.m),seen=null;
  try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Array.isArray(v.k))seen=v.k}catch(e){}
  var fresh=seen?all.filter(function(k){return seen.indexOf(k)<0}):all.filter(function(k){return WORLD.m[k].isNew}).slice(-6);
  try{localStorage.setItem(KEY,JSON.stringify({k:all,at:Date.now()}))}catch(e){}
  if(!reduce)fresh.slice(-12).forEach(function(k){if(byName[k]&&nbTiles(k).length){BUILD[k]={t0:Infinity,st:{},du:{},end:0};BUILDING=true}});
  var cam0=null;try{cam0=JSON.parse(sessionStorage.getItem('caldera.world.cam')||'null');sessionStorage.removeItem('caldera.world.cam')}catch(e){}
  setTimeout(function(){if(cam0&&isFinite(cam0.z)){cam.x=cam0.x;cam.y=cam0.y;cam.z=cam0.z;draw()}if(fresh.length)setTimeout(function(){buildLands(fresh.slice(-12))},cam0?300:1400)},60)})();
// someone joined while you're watching: reload in place (same camera) so their land is built (at most once a minute)
function worldGrew(n){if(!WORLD||!(n>Object.keys(WORLD.m).length)||BUILDING)return;try{var last=+sessionStorage.getItem('caldera.world.reload')||0;if(Date.now()-last<60000)return;
  sessionStorage.setItem('caldera.world.reload',String(Date.now()));sessionStorage.setItem('caldera.world.cam',JSON.stringify(cam))}catch(e){return}location.reload()}
// world labels: drawn last, in screen space, so they stay readable at any zoom. Level of detail, not "everything at once":
// every candidate gets a rank (the focused or hovered neighborhood, then you, then your friends, then the liveliest:
// lit today, agents working, commits this week, new), and labels are placed greedily by rank. One that would overlap a
// placed label is dropped (only the focused/hovered/your own name may slide a little to find room), and "smart" mode
// caps the count by stage area, so a phone shows a handful and zooming in reveals more as neighborhoods spread apart.
// Districts, agent pads and repo names join from mid zoom and compete for the same budget.
var LMODES=['smart','all','off'],LMODE='smart';try{var lm0=localStorage.getItem('caldera-world-labels');if(LMODES.indexOf(lm0)>=0)LMODE=lm0}catch(err){}
if(WORLD&&!MINI)labels=LMODE!=='off';
var WME=null,WFR=null,WSCORE=null,WSCORE_T=0;
function worldMe(){if(WME!==null)return WME;WME='';try{var a=document.querySelector('#caldera-bar .ch-acct');var m=a&&/@([a-z0-9-]+)/i.exec(a.getAttribute('aria-label')||'');if(m)WME='@'+m[1].toLowerCase()}catch(err){}return WME}
function worldFriends(){if(WFR)return WFR;WFR={};var me=worldMe();if(me)(WORLD.links||[]).forEach(function(l){if(l[2]===1||l[2]===4)return;if(l[0]===me)WFR[l[1]]=1;else if(l[1]===me)WFR[l[0]]=1});return WFR}
// liveliness, recomputed at most every 5s (light-ups and agents change while the page is open)
function worldScores(){var t=performance.now();if(WSCORE&&t-WSCORE_T<5000)return WSCORE;WSCORE_T=t;WSCORE={};var ag={};
  Object.keys(AG).forEach(function(id){var a=AG[id].a;if(a&&a.d&&!AG[id].gone&&(a.state==='working'||a.state==='thinking'))ag[a.d]=(ag[a.d]||0)+1});
  NBS.forEach(function(n){var wk=0,cm=0;n.ds.forEach(function(d){(d.repos||[]).forEach(function(r){wk+=+r.week||0;cm+=+r.commits||0})});var wm=WORLD.m[n.key]||{};
    WSCORE[n.key]=(LIT[n.key]&&LIT[n.key].n?40+5*LIT[n.key].n:0)+(ag[n.key]?30+5*ag[n.key]:0)+Math.min(30,6*Math.log(1+wk))+Math.min(10,Math.log(1+cm))+(wm.isNew?8:0)+Math.min(6,+wm.friends||0)});return WSCORE}
function nbTop(n){if(n._ty==null){var ty=Infinity;n.ds.forEach(function(d){(BDIST[d.name]||[]).forEach(function(o){ty=Math.min(ty,iso(o.i,o.j).y-bh(o.r))})});
  var m=iso(n.ox+n.w/2-.5,n.oy+n.h/2-.5);n._tx=m.x;n._ty=isFinite(ty)?ty-10:iso(n.ox-.5,n.oy-.5).y-10}return {x:n._tx,y:n._ty}}
function worldLabels(tags){var c=c3;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L3.width,L3.height);if(!labels){WLAB=[];return}c.setTransform(dpr,0,0,dpr,0,0);
  var z=cam.z,S=function(x,y){return [x*z+cam.x,y*z+cam.y]},foc=WFOCUS?(WFOCUS.d.nb||WFOCUS.d.name):null,cand=[],placed=[],me=worldMe(),fr=worldFriends(),sc=worldScores(),phone=vw<600;
  NBS.forEach(function(n){var wm=WORLD.m[n.key]||{},t=nbTop(n),sp=S(t.x,t.y),k=n.key,pr=k===foc?0:k===WHOVER?.3:k===me?.6:fr[k]?.8:1;
    cand.push({pr:pr,sc:sc[k]||0,x:sp[0],y:sp[1],text:(phone&&k.length>22?k.slice(0,21)+'…':k)+(wm.isNew?(phone?' ✦':' ✦ new'):'')+(LIT[k]&&LIT[k].n?'  ✦ lit'+(LIT[k].n>1?' ×'+LIT[k].n:''):''),bg:wm.isNew?'rgba(46,170,120,.95)':k===me?'rgba(109,74,232,.98)':'rgba(139,108,246,.96)',fg:'#fff',font:phone?'700 11.5px IBM Plex Sans,Arial,sans-serif':'700 13px IBM Plex Sans,Arial,sans-serif',block:n.rep})});
  if(z>=.55)blocks.forEach(function(b){if(b.estate)return;var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05),sp=S(p2[0],p2[1]);cand.push({pr:(b.d.nb===foc?1.5:2),sc:0,x:sp[0],y:sp[1]+20,text:b.d.label||b.d.name,bg:'rgba(26,22,44,.9)',fg:'#E6DEFF',font:'600 11px IBM Plex Sans,Arial,sans-serif',block:byName[b.d.nb]||b})});
  if(z>=.55){var per={};Object.keys(AG).forEach(function(id){var a=AG[id].a;if(!a||!a.d||AG[id].gone)return;var q=per[a.d]=per[a.d]||{w:0,p:0};if(a.state==='working'||a.state==='thinking')q.w++;else q.p++});
    Object.keys(per).forEach(function(k){if(!NBM[k])return;var hb=dockAt({d:k}),sp=S(hb.x,hb.y),q=per[k];
      cand.push({pr:1.9,sc:0,x:sp[0],y:sp[1]+18,text:k+'’s agents'+(q.w?' · '+q.w+' working':'')+(q.p?' · '+q.p+' parked':''),bg:'rgba(48,34,6,.9)',fg:'#FFC24A',font:'600 10px IBM Plex Mono,ui-monospace,monospace'})})}
  if(SHOP&&SHOP.big){var mq=iso(SHOP.i+1,SHOP.j+1),msp=S(mq.x,mq.y-30);cand.push({pr:.5,sc:0,x:msp[0],y:msp[1],text:'\u2726 Free tools market \u00b7 '+TOOLS.length,bg:'rgba(201,139,78,.97)',fg:'#fff',font:phone?'700 11.5px IBM Plex Sans,Arial,sans-serif':'700 13px IBM Plex Sans,Arial,sans-serif',shop:1})}
  tags.forEach(function(g){var sp=S(g.x,g.y);cand.push({pr:3,sc:0,x:sp[0],y:sp[1],text:g.text,bg:'rgba(17,20,32,.88)',fg:'#F2F2F5',font:'600 10.5px IBM Plex Sans,Arial,sans-serif',url:g.url})});
  cand.sort(function(a,b){return a.pr-b.pr||b.sc-a.sc});WLAB=placed;
  // budget: one label per ~40,000px² of stage in smart mode (about 6 on a phone, 20 on a laptop); the must-shows never count
  // zooming in spreads neighborhoods apart, so the budget grows with zoom (up to 4x) and collisions decide the rest
  var cap=LMODE==='all'?Infinity:Math.round(Math.max(4,vw*vh/40000)*Math.max(1,Math.min(4,FITZ?z/FITZ:1))),used=0,M=5;
  var hitAny=function(q){for(var i=0;i<placed.length;i++){var o=placed[i];if(q.x0<o.x1+M&&q.x1+M>o.x0&&q.y0<o.y1+M&&q.y1+M>o.y0)return true}return false};
  cand.forEach(function(g){var must=g.pr<.7;if(!must&&used>=cap)return;c.font=g.font;var w=c.measureText(g.text).width+12,bx={x0:g.x-w/2-3,x1:g.x+w/2+3,y0:g.y-20,y1:g.y+5};
    if(bx.x1<0||bx.x0>vw||bx.y1<0||bx.y0>vh)return;
    {var sh=Math.max(0,6-bx.x0)-Math.max(0,bx.x1-(vw-6));if(sh){bx.x0+=sh;bx.x1+=sh;g.x+=sh}}   // a name near the edge slides in instead of vanishing
    if(hitAny(bx)){if(!must)return;var offs=[],ok=false;[26,52].forEach(function(dy){[0,-.5,.5].forEach(function(fx){offs.push([w*fx,-dy]);offs.push([w*fx,dy])})});
      for(var oi=0;oi<offs.length&&!ok;oi++){var ox=offs[oi][0],q={x0:bx.x0+ox,x1:bx.x1+ox,y0:bx.y0+offs[oi][1],y1:bx.y1+offs[oi][1]};var s2=Math.max(0,6-q.x0)-Math.max(0,q.x1-(vw-6));q.x0+=s2;q.x1+=s2;ox+=s2;   // stay inside the stage
        if(q.y0<4||q.y1>vh-4)continue;if(!hitAny(q)){bx=q;g.x+=ox;g.y+=offs[oi][1];ok=true}}if(!ok)return}
    if(!must)used++;bx.text=g.text;bx.pr=g.pr;placed.push(bx);
    pill(c,g.x,g.y,g.text,g.bg,g.fg,g.font);
    if(g.url||g.block||g.shop)tagHits.push({x0:(bx.x0-cam.x)/z,x1:(bx.x1-cam.x)/z,y0:(bx.y0-cam.y)/z,y1:(bx.y1-cam.y)/z,url:g.url,block:g.block,shop:g.shop})})}
// friendships as rays of light: soft glowing arcs in the sky between two neighborhoods, light motes travelling along
// them. Real friendships glow warm violet, people who work on the same repo glow code-teal, GitHub follows sky-blue; the
// founder's welcome links are faint and thin. Dimmer by day. Links are [a, b, kind, why]: 0 request/invite, 1 founder,
// 2 shared repo, 3 GitHub follow, 4 same stack (not a friendship: dashed coral, their public repos share uncommon packages).
var WLAB=[],RAYS=true;try{RAYS=localStorage.getItem('caldera-world-rays')!=='0'}catch(err){}
// Color by topic: tint each neighborhood's ground by its member's top "what they're building" tag; the legend names every
// color, so the tint is never the only cue
var TOPICS=false,TCOL={};try{TOPICS=localStorage.getItem('caldera-world-topics')==='1'}catch(err){}
if(WORLD)(WORLD.topics||[]).forEach(function(x){TCOL[x.t]=x.c});
function drawTopics(){if(!WORLD||!TOPICS)return;var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  NBS.forEach(function(n){var m=WORLD.m[n.key]||{},col=m.tag?(TCOL[m.tag]||'#94A3B8'):null;if(!col)return;
    var a=iso(n.ox-.9,n.oy-.9),b=iso(n.ox+n.w+.1,n.oy-.9),d=iso(n.ox+n.w+.1,n.oy+n.h+.1),e=iso(n.ox-.9,n.oy+n.h+.1);
    c.beginPath();c.moveTo(a.x,a.y+TH/2);c.lineTo(b.x,b.y+TH/2);c.lineTo(d.x,d.y+TH/2);c.lineTo(e.x,e.y+TH/2);c.closePath();
    c.globalAlpha=.32;c.fillStyle=col;c.fill();c.globalAlpha=.85;c.lineWidth=2/cam.z;c.strokeStyle=col;c.stroke();c.globalAlpha=1})}
function topicLegend(){var L=document.getElementById('w-topics');if(!WORLD)return;if(!L){L=document.createElement('div');L.id='w-topics';L.className='w-topics';L.setAttribute('role','note');L.setAttribute('aria-label','Color by topic');st.appendChild(L)}
  L.hidden=!TOPICS;if(!TOPICS)return;var ts=WORLD.topics||[];L.innerHTML='';var h=document.createElement('b');h.textContent=ts.length?'What they\u2019re building':'No topics yet';L.appendChild(h);
  ts.forEach(function(x){var r=document.createElement('span');var sw=document.createElement('i');sw.style.background=x.c;r.appendChild(sw);r.appendChild(document.createTextNode(x.t+' \u00b7 '+x.n));L.appendChild(r)});
  var o=document.createElement('span');var so=document.createElement('i');so.style.background='#94A3B8';o.appendChild(so);o.appendChild(document.createTextNode('Other'));if(ts.length)L.appendChild(o)}
function drawRays(){if(!WORLD||!RAYS)return;var ls=WORLD.links||[];if(!ls.length)return;var c=cx,tn=performance.now(),foc=WFOCUS?(WFOCUS.d.nb||WFOCUS.d.name):WHOVER;
  var amb={day:.5,dawn:.75,dusk:.8,evening:1,night:1.1,grid:1}[sky]||.9;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
  ls.forEach(function(l,ix){var na=NBM[l[0]],nb=NBM[l[1]];if(!na||!nb)return;var p=nbTop(na),q=nbTop(nb),d=Math.hypot(q.x-p.x,q.y-p.y),mx=(p.x+q.x)/2,my=Math.min(p.y,q.y)-40-d*.28;
    var fd=l[2]===1,rp=l[2]===2,gf=l[2]===3,sk=l[2]===4,hit=foc&&(l[0]===foc||l[1]===foc),k=amb*(foc?(hit?1.7:.22):1)*(fd?.35:1);if(k<=.02)return;
    var col=fd?'159,180,255':rp?'90,230,200':gf?'110,180,255':sk?'255,122,150':'200,160,255',col2=fd?'159,180,255':rp?'150,255,220':gf?'170,215,255':sk?'255,170,185':'255,196,107';
    var path=function(){c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(mx,my,q.x,q.y)};
    var gr=c.createLinearGradient(p.x,p.y,q.x,q.y);gr.addColorStop(0,'rgba('+col+','+(.16*k)+')');gr.addColorStop(.5,'rgba('+col2+','+(.2*k)+')');gr.addColorStop(1,'rgba('+col+','+(.16*k)+')');
    path();c.strokeStyle=gr;c.lineWidth=fd?5:sk?6:11;c.stroke();
    if(sk)c.setLineDash([5,7]);path();c.strokeStyle='rgba('+col2+','+Math.min(.9,.55*k)+')';c.lineWidth=fd?.8:sk?1.3:1.6;c.stroke();if(sk)c.setLineDash([]);
    var nm=fd||sk?1:3;for(var m=0;m<nm;m++){var t=((tn/(fd?5200:2600))+m/nm+rnd(ix+1))%1,u=1-t,x=u*u*p.x+2*u*t*mx+t*t*q.x,y=u*u*p.y+2*u*t*my+t*t*q.y,rr=fd?3:5,g=c.createRadialGradient(x,y,0,x,y,rr);
      g.addColorStop(0,'rgba(255,245,225,'+Math.min(1,.9*k)+')');g.addColorStop(1,'rgba('+col2+',0)');c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,7);c.fill()}});
  c.restore()}
// ---- objects
var GLASS={TypeScript:1,Swift:1,Go:1,Rust:1,Private:1};
function face(c,pts,col,f,y0,y1){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,mix(col,f*P.light*1.04));g.addColorStop(1,mix(col,f*P.light*.78));poly(c,pts,g)}
function awning(c,x,y,w,cols){var hw=TW/2*w,hh=TH/2*w,n=6;for(var k=0;k<n;k++){var a=k/n,b=(k+1)/n;c.fillStyle=cols[k%2];c.beginPath();
  c.moveTo(x-hw+hw*a,y+hh*a);c.lineTo(x-hw+hw*b,y+hh*b);c.lineTo(x-hw+hw*b-3,y+hh*b+5);c.lineTo(x-hw+hw*a-3,y+hh*a+5);c.closePath();c.fill()}}
// ---- listings: apps and websites the owner listed float a sign above a building of the city (sfPlace picks which):
// the listing's real icon and short name on a card in a lit frame, glowing in the listing's colour.
var LCOL={app:'#6C63FF',site:'#1FA39A'},LIMG={},LTEX={},SHOPC=['#D9C7AE','#C7CED6','#E0CDB5','#BFC9B8','#D6BFB4'];
function limg(u){if(!u||!/^https?:\/\/[^\s"<>]+\/v1\/listings\/img\/[A-Za-z0-9._%-]+$/.test(u))return null;var im=LIMG[u];if(im)return im.complete&&im.naturalWidth?im:null;
  im=new Image();im.onload=function(){draw()};im.src=u;LIMG[u]=im;return null}
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
// the icon as a texture: drawn once per icon onto a 128px white tile with rounded corners (no per-frame clipping)
function ltex(r){var m=r.meta||{},im=limg(m.icon),app=r.kind==='app',k=(im?m.icon:'#'+(r.name||'?').charAt(0))+'|'+(app?'a':'s')+'|'+r.kind,t=LTEX[k];if(t)return t;
  t=document.createElement('canvas');t.width=t.height=128;var g=t.getContext('2d');g.fillStyle='#FFFFFF';rrect(g,0,0,128,128,app?28:24);g.fill();
  if(im){var pad=app?0:14;g.save();rrect(g,pad,pad,128-pad*2,128-pad*2,app?28:14);g.clip();g.drawImage(im,pad,pad,128-pad*2,128-pad*2);g.restore()}
  else{g.fillStyle=LCOL[r.kind]||'#8A8A93';g.font='700 76px IBM Plex Sans,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(r.name||'?').charAt(0).toUpperCase(),64,68)}
  if(im)LTEX[k]=t;else if(!m.icon||!/^https?:/.test(m.icon))LTEX[k]=t;return t}   // a letter tile for a loading icon isn't kept
var SIGNS=[],SHITS=[],SHOVER=null;
// Store markers (Mike 2026-11-06: "we need a different system for the store front links"): one marker per person in the
// World, per district in a city, showing the top store's icon and a "+N" count. A tap opens one panel (bottom sheet at
// phone and folded sizes) with every store as a real link. Each marker takes a 44 px square on screen, so targets never
// overlap: it stands above its place when that spot is free, otherwise on a free spot close by (clear of other markers,
// name labels and the map's controls, with a short line back), and when there is none it joins the nearest marker, whose
// count and panel then cover both; zooming in splits them again. Own layer (L4), composited last, in screen pixels, tested first.
var SGR=null,SKEYS=null,SFK=null,SBTN={},COBS=[],COBT=0,CLAB=[];
function storeGroups(){if(SGR)return SGR;SGR={};SKEYS=[];storeList(null).forEach(function(s){var k=(s.d&&(s.d.nb||s.d.name))||'?',G=SGR[k];if(!G){G=SGR[k]={key:k,all:[]};SKEYS.push(k)}G.all.push(s)});
  SKEYS.forEach(function(k){var G=SGR[k],rank=function(s){var m=s.r.meta||{};return (m.icon?1e9:0)+(+m.ratings||0)};G.all.sort(function(a,b){return rank(b)-rank(a)||String(a.r.name).localeCompare(String(b.r.name),undefined,{sensitivity:'base'})});G.top=G.all[0].r;G.n=G.all.length;
    var y=Infinity,ax=0;G.all.forEach(function(s){var q=iso(s.i,s.j),ty=q.y-bh(s.h||s.r);if(ty<y){y=ty;ax=q.x}});G.ax=ax;G.ay=y});
  SKEYS.sort(function(a,b){return SGR[b].n-SGR[a].n||(a<b?-1:1)});return SGR}
function controlRects(){var t=performance.now();if(t-COBT<300)return COBS;COBT=t;COBS=[];var b=st.getBoundingClientRect();st.querySelectorAll('.c-tools button,.c-live,.c-today,.c-hint,.c-heli,.w-topics').forEach(function(el){var r=el.getBoundingClientRect();if(!r.width||!r.height)return;COBS.push({x0:r.left-b.left,x1:r.right-b.left,y0:r.top-b.top,y1:r.bottom-b.top})});return COBS}
var SOFF=(function(){var o=[[0,0]];[[46,8],[92,12]].forEach(function(q){for(var i=0;i<q[1];i++){var a=-Math.PI/2+(i%2?1:-1)*Math.ceil(i/2)*2*Math.PI/q[1];o.push([Math.round(Math.cos(a)*q[0]),Math.round(Math.sin(a)*q[0])])}});return o})();
function drawSigns(){var c=c4,z=cam.z;SHITS=[];c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L4.width,L4.height);c.setTransform(dpr,0,0,dpr,0,0);SIGNS=[];
  var GR=storeGroups(),S=vw<600?30:34,B=44,obs=[],me=D.world?worldMe():'',foc=WFOCUS?(WFOCUS.d.nb||WFOCUS.d.name):null,dark=sky==='grid'||sky==='night'||sky==='evening',tron=sky==='grid',seen={},P=[];
  if(!MINI)controlRects().forEach(function(q){obs.push(q)});
  if(D.world&&WLAB)WLAB.forEach(function(q){obs.push(q)});
  CLAB.forEach(function(l){var x=l[0]*z+cam.x,y=l[1]*z+cam.y;obs.push({x0:x-l[2]*z/2,x1:x+l[2]*z/2,y0:y-18*z,y1:y+4*z})});   // city labels are drawn in world units, so they scale with the zoom
  var hitsAny=function(x0,y0){for(var q=0;q<obs.length;q++){var o=obs[q];if(x0<o.x1+2&&x0+B>o.x0-2&&y0<o.y1+2&&y0+B>o.y0-2)return true}return false};
  var order=SKEYS.slice();if(me||foc)order.sort(function(a,b){return (b===foc?2:b===me?1:0)-(a===foc?2:a===me?1:0)});
  order.forEach(function(k){var G=GR[k],n=D.world&&NBM[k],t=n?nbTop(n):null,ax=(t?t.x:G.ax)*z+cam.x,ay=(t?t.y:G.ay)*z+cam.y;
    if(ax<-30||ax>vw+30||ay<-30||ay>vh+30)return;   // its place is off the stage
    var fx=null,fy=null;for(var i=0;i<SOFF.length;i++){var x0=ax+SOFF[i][0]-B/2,y0=ay-44+SOFF[i][1]-B/2;if(x0<2||y0<2||x0+B>vw-2||y0+B>vh-2||hitsAny(x0,y0))continue;fx=x0;fy=y0;break}
    if(fx==null){var best=null,bd=1e9;P.forEach(function(q){var d=Math.hypot(q.ax-ax,q.ay-ay);if(d<bd){bd=d;best=q}});if(best){best.keys.push(k);best.n+=G.n}return}
    obs.push({x0:fx,x1:fx+B,y0:fy,y1:fy+B});seen[k]=1;P.push({k:k,G:G,ax:ax,ay:ay,fx:fx,fy:fy,keys:[k],n:G.n})});
  c.strokeStyle=dark?'rgba(205,214,235,.85)':'rgba(40,46,62,.8)';c.lineWidth=1.5;c.beginPath();P.forEach(function(p){c.moveTo(p.ax,p.ay);c.lineTo(p.fx+B/2,p.fy+B/2)});c.stroke();   // the short lines back to each place, under every tile
  P.forEach(function(p){var G=p.G,k=p.k,fx=p.fx,fy=p.fy,r=G.top,col=LCOL[r.kind]||'#8A8A93',hov=SHOVER===k,tx=fx+(B-S)/2,ty=fy+(B-S)/2-(hov?2:0),on=sel&&p.keys.some(function(q){return GR[q].all.some(function(s){return s.r===sel})});
    c.save();c.shadowColor=col;c.shadowBlur=(hov?24:dark?16:8)*dpr;c.fillStyle=dark?'#0E1220':'#FFFFFF';rrect(c,tx,ty,S,S,8);c.fill();c.restore();
    c.strokeStyle=hov?mix(col,1.25):col;c.lineWidth=hov?2.6:2;rrect(c,tx,ty,S,S,8);c.stroke();
    var is=S-8;c.drawImage(ltex(r),tx+4,ty+4,is,is);
    if(p.n>1){var bt='+'+Math.min(99,p.n-1);c.font='700 11px IBM Plex Sans,Arial,sans-serif';var bw=Math.max(18,c.measureText(bt).width+8),bh2=16,bx=Math.min(fx+B-bw,tx+S-bw+6),by=fy+(hov?-2:0);
      c.fillStyle='#6D4AE8';c.strokeStyle=dark?'#0E1220':'#FFFFFF';c.lineWidth=1.5;rrect(c,bx,by,bw,bh2,8);c.fill();c.stroke();c.fillStyle='#FFFFFF';c.textAlign='center';c.textBaseline='middle';c.fillText(bt,bx+bw/2,by+bh2/2+.5);c.textBaseline='alphabetic'}
    if(on){c.save();c.strokeStyle=tron?'#FFFFFF':'#C4B5FF';c.lineWidth=2.4;c.shadowColor='#8B6CF6';c.shadowBlur=14;rrect(c,tx-4,ty-4,S+8,S+8,11);c.stroke();c.restore()}
    SHITS.push({r:r,d:G.all[0].d,sign:1,group:k,keys:p.keys,count:p.n,url:'',x0:fx,x1:fx+B,y0:fy,y1:fy+B,card:[tx,ty,tx+S,ty+S]})});
  storeKeys(seen)}
// the markers for the keyboard and screen readers: real buttons over the canvas (taps stay on the canvas so a drag can start on one)
function storeKeys(seen){if(MINI)return;if(!SFK){SFK=document.createElement('div');SFK.className='c-sfk';SFK.setAttribute('role','group');SFK.setAttribute('aria-label','Store markers');st.appendChild(SFK)}
  SHITS.forEach(function(h){var b=SBTN[h.group];if(!b){b=SBTN[h.group]=document.createElement('button');b.type='button';b.onclick=(function(g,el){return function(){var q=SHITS.filter(function(x){return x.group===g})[0];storeDir(q&&q.count===1?q.r:null,q?q.keys:[g],true,el)}})(h.group,b);SFK.appendChild(b)}
    var lb=(h.keys.length>1?h.count+' stores near '+h.group:(h.group==='?'?'':h.group+': ')+h.count+(h.count===1?' store':' stores'));if(b._l!==lb){b._l=lb;b.textContent=lb}
    var tr='translate('+Math.round(h.x0)+'px,'+Math.round(h.y0)+'px)';if(b._t!==tr){b._t=tr;b.style.transform=tr}if(b.hidden)b.hidden=false});
  for(var k in SBTN)if(!seen[k]&&!SBTN[k].hidden&&document.activeElement!==SBTN[k])SBTN[k].hidden=true}
// ---- the store directory: tapping any storefront (or "Stores" in the toolbar) lists every storefront in that city in one menu
function storeList(key){var out=[];for(var k in tiles){var t=tiles[k];if(t.t!=='b'||!t.r||!(!key||(t.d&&(t.d.nb||t.d.name))===key))continue;var L=SFA.get(t.r);if(!L)continue;var a=k.split(',');
    L.forEach(function(s){out.push({r:s.r,h:t.r,d:t.d,i:+a[0],j:+a[1]})})}
  out.sort(function(a,b){return String(a.r.name).localeCompare(String(b.r.name),undefined,{sensitivity:'base'})||placeOf(a).localeCompare(placeOf(b))});return out}
function placeOf(s){if(!s.d)return '';if(D.world){var key=s.d.nb||s.d.name,m=WORLD&&WORLD.m&&WORLD.m[key]||{};return m.name||key}return s.d.name||''}
function storeAddr(r){var m=r.meta||{},s=r.sites&&r.sites[0];return typeof s==='string'&&s.indexOf(m.host||'\u0000')===0?s:(m.host||'')}
function storeKind(r){return r.kind==='app'?((r.meta||{}).store==='play'?'App · Google Play':'App · App Store'):'Website'+(storeAddr(r)?' · '+storeAddr(r):'')}
function storeIcon(r,px){var m=r.meta||{},col=LCOL[r.kind]||'#8A8A93';limg(m.icon);var im=m.icon&&LIMG[m.icon];return im?'<img src="'+e(m.icon)+'" alt="" width="'+px+'" height="'+px+'" style="width:'+px+'px;height:'+px+'px;border-radius:'+(r.kind==='app'?Math.round(px*.22):Math.round(px*.18))+'px;flex:none;object-fit:cover;background:#fff">'
  :'<span aria-hidden="true" style="width:'+px+'px;height:'+px+'px;flex:none;border-radius:'+Math.round(px*.22)+'px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;background:#fff;color:'+col+';box-shadow:0 0 0 2px '+col+'">'+e(String(r.name||'?').charAt(0).toUpperCase())+'</span>'}
function flyToStore(s){var q=iso(s.i,s.j),z=Math.max(cam.z,D.world?.9:1.05),sheet=vw<600,ty=sheet?vh*.24:vh/2,tx=sheet?vw/2:Math.min(vw-60,(vw+Math.min(card.offsetWidth+20,vw*.5))/2);flyTo(tx-q.x*z,ty-(q.y-40)*z,z,reduce?1:450)}
var DIRKEY=null,DIRFROM=null,EXTSVG='<svg class="d-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',LOCSVG='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>';
// One panel, two shapes: beside the marker (or under the Stores button) on wide stages; a sheet at the stage's width just above the phone's tab bar at phone and folded sizes (fixed, because the stage can run past the fold).
function placeDir(from){var sheet=innerWidth<=600||document.documentElement.classList.contains('ch-duof')||vw<420,b=st.getBoundingClientRect();card.classList.toggle('is-sheet',sheet);
  var nav=document.getElementById('drRail'),bot=0;if(nav&&!st.classList.contains('c-full')&&getComputedStyle(nav).display!=='none'){var n=nav.getBoundingClientRect();if(n.width>n.height)bot=Math.max(0,innerHeight-n.top)}
  if(sheet){
    card.style.setProperty('--c-sl',Math.max(0,b.left)+'px');card.style.setProperty('--c-sr',Math.max(0,document.documentElement.clientWidth-b.right)+'px');card.style.setProperty('--c-sb',bot+'px');return}
  var tb=st.querySelector('.c-tools'),min=(tb&&!MINI?tb.getBoundingClientRect().bottom-b.top:0)+8,w=card.offsetWidth,gap=10,fr=from?from.getBoundingClientRect():null,room=Math.min(vh,innerHeight-bot-b.top),mh=Math.max(160,room-min-10),l=10,t=min;
  if(from&&from.id==='t-stores')l=fr.right-b.left-w;else if(fr){var mx=fr.left-b.left;l=mx+fr.width+gap+w<=vw-10?mx+fr.width+gap:mx-gap-w}
  card.style.setProperty('--c-mh',mh+'px');var h=Math.min(card.offsetHeight,mh);if(fr&&from.id!=='t-stores')t=fr.top-b.top-16;
  card.style.setProperty('--c-l',Math.max(10,Math.min(vw-w-10,l))+'px');card.style.setProperty('--c-t',Math.max(min,Math.min(room-h-10,t))+'px')}
function storeDir(r0,key,focus,from){var keys=Array.isArray(key)?key:key?[key]:null,many=!!keys&&keys.length>1,all=null,cur=null;key=keys?keys[0]:null;
  if(keys){var GS=storeGroups();all=[];keys.forEach(function(k){if(GS[k])all=all.concat(GS[k].all)})}if(!all||!all.length)all=storeList(keys&&!many?key:null);
  all.forEach(function(s){if(s.r===r0)cur=s});DIRKEY=key;DIRFROM=from||null;sel=cur?cur.r:null;var person=key&&D.world&&!many;
  var where=many?'near '+e(key):person?'from '+e(key):key?'in '+e(key):D.world?'in the world':'in this city',title='Stores '+where;
  function render(){var r=cur&&cur.r,m=r&&r.meta||{},u=r?repoUrl(r):'',app=r&&r.kind==='app';
    var top=r?'<div class="d-sel">'+'<div style="display:flex;gap:10px;align-items:center">'+storeIcon(r,44)+'<div style="min-width:0"><h3 style="margin:0">'+e(r.name)+'</h3><div class="k">'+e(storeKind(r))+(placeOf(cur)?' &middot; '+e(placeOf(cur))+(D.world?'':' district'):'')+'</div></div></div>'
      +(m.desc?'<p style="margin:8px 0 0">'+e(m.desc)+'</p>':'')
      +(m.genre?'<div class="row"><span>Category</span><b>'+e(m.genre)+'</b></div>':'')
      +(+m.rating>0?'<div class="row"><span>Rating</span><b>&#9733; '+(+m.rating).toFixed(1)+(+m.ratings>0?' ('+(+m.ratings).toLocaleString('en-US')+')':'')+'</b></div>':'')+'</div>':'';
    card.innerHTML='<button class="x" type="button" aria-label="Close">&times;</button><div class="d-head"><b>Stores</b> <span class="k">'+all.length+' '+where+'</span></div>'+top
      +'<ul class="d-list" role="list">'+all.map(function(s,ix){var on=s===cur,su=repoUrl(s.r),app2=s.r.kind==='app',lbl=su?'Open '+s.r.name+(app2?((s.r.meta||{}).store==='play'?' on Google Play':' on the App Store'):'')+' in a new tab':'',inner=storeIcon(s.r,28)+'<span class="d-txt"><span class="d-name">'+e(s.r.name)+'</span><span class="d-meta">'+e(storeKind(s.r))+(!person&&placeOf(s)?' &middot; '+e(placeOf(s)):'')+'</span></span>';
        return '<li class="d-li">'+(su?'<a class="d-row'+(on?' is-on':'')+'" href="'+e(su)+'" target="_blank" rel="noopener" aria-label="'+e(lbl)+'">'+inner+EXTSVG+'</a>':'<div class="d-row'+(on?' is-on':'')+'">'+inner+'</div>')+(key?'':'<button type="button" class="d-loc" data-ix="'+ix+'" aria-label="Show '+e(s.r.name)+' on the map" title="Show on the map">'+LOCSVG+'</button>')+'</li>'}).join('')+'</ul>';
    card.querySelector('.x').onclick=function(){closeDir()};
    card.querySelectorAll('.d-loc').forEach(function(b){b.onclick=function(){var ix=b.getAttribute('data-ix'),s=all[+ix];cur=s;sel=s.r;render();flyToStore(s);var nb=card.querySelector('.d-loc[data-ix="'+ix+'"]');if(nb)nb.focus({preventScroll:true});card.scrollTop=0}});
    draw()}
  card.classList.add('is-dir');card.setAttribute('role','dialog');card.setAttribute('aria-label',title.replace(/&amp;/g,'&'));render();card.hidden=false;placeDir(DIRFROM);
  if(focus){var f=card.querySelector('.d-row[href]')||card.querySelector('.x');if(f)f.focus({preventScroll:true})}}
function closeDir(){var from=DIRFROM;show(null);DIRFROM=null;var b=from&&from.isConnected&&!from.hidden?from:document.getElementById('t-stores');if(b)b.focus({preventScroll:true})}
function listingCard(h){var key=D.world&&h.d?(h.d.nb||h.d.name):null;storeDir(h.r,key,false,null)}
var SHOPLBL=null;
function drawShop(c,p,LOD){if(!SHOP)return;var x=p.x,y=p.y+4,night=sky==='night'||sky==='evening';
  if(SHOP.big){var q=iso(SHOP.i+1,SHOP.j+1);x=q.x;y=q.y+4;var n=Math.min(8,Math.max(4,TOOLS.length)),pal=[['#E85D75','#FFF4E8'],['#4FB89A','#FFF4E8'],['#7AA7FF','#FFF4E8'],['#E8C547','#FFF4E8'],['#8B6CF6','#FFF4E8'],['#F28C38','#FFF4E8']];
    for(var k=0;k<n;k++){var a=k/n*Math.PI*2,sx=x+Math.cos(a)*TW*.95,sy=y+Math.sin(a)*TH*.95;prism(c,sx,sy,.42,10,'#B98A5A');awning(c,sx,sy-10,.5,pal[k%pal.length])}
    prism(c,x,y,.22,22,'#A07850');c.save();if(night){c.shadowColor='#FFD98A';c.shadowBlur=14}c.fillStyle=night?'#FFE6A8':'#FFF6DE';c.beginPath();c.arc(x,y-27,5,0,7);c.fill();c.restore();
    hits.push({shop:1,x0:x-TW*1.4,x1:x+TW*1.4,y0:y-40,y1:y+TH*1.4});return}
  prism(c,x,y,.8,24,'#C98B4E');prism(c,x,y-24,.56,6,'#A86F3C');awning(c,x,y-19,.88,['#E85D75','#FFF4E8']);
  c.save();if(night){c.shadowColor='#FFD98A';c.shadowBlur=12}c.fillStyle=night?'#FFE6A8':'#FFF2D6';c.fillRect(x-9,y-36,18,7);c.restore();
  SHOPLBL={x:x,y:y-48,text:'\u2726 Workshop \u00b7 '+TOOLS.length+' free tool'+(TOOLS.length===1?'':'s'),bg:'rgba(201,139,78,.97)'};
  hits.push({shop:1,x0:x-TW*.5,x1:x+TW*.5,y0:y-58,y1:y+TH*.45})}
function shopCard(){var base=(window.CALDERA_TOOLS_HUB||'').replace(/\/$/,'');sel=null;
  card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+(D.world?'Free tools market':'Workshop')+'</h3><div class="k">'+(D.world?'Free software made by Caldera members':'Free software this person made')+'</div>'
   +TOOLS.slice(0,8).map(function(t){return '<div style="margin-top:10px"><b>'+e(t.name)+'</b>'+(D.world&&t.handle?' <a href="#" data-maker="'+e(t.handle)+'" style="font-size:12px">@'+e(t.handle)+'</a>':'')+'<div style="font-size:12.5px;opacity:.85">'+e(t.pitch||'')+'</div>'
     +'<div style="font-size:12px;margin-top:3px"><a href="'+e(base+'/tools/go/'+t.id)+'" target="_blank" rel="noopener nofollow">Get it \u2197</a>'+(t.platform?' &middot; '+e(t.platform):'')+(t.repo?' &middot; open source':'')+'</div></div>'}).join('')
   +'<div class="row" style="margin-top:12px"><a href="'+e(base+'/tools')+'" target="_blank" rel="noopener">All free tools \u2192</a></div>';
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};
  card.querySelectorAll('[data-maker]').forEach(function(a){a.onclick=function(ev){ev.preventDefault();var b=byName['@'+a.getAttribute('data-maker')];if(b&&typeof worldFocus==='function')worldFocus(b)}});draw()}
// buildings and the rest use the high-detail set (cityhifi.ts); these names stay for the intro, growth and battle code
function prism(c,px,py,w,h,col,o){return prismHi(c,px,py,w,h,col,o||{parapet:w>.3})}
// windows: glass curtain walls or punched windows; the street floor only on a building's first tier
function facadeWindows(c,px,py,w,h,glass,litp,seed,base,people){facadeHi(c,px,py,w,h,glass?'glass':'punched',litp,seed,{people:people||0,ground:base==null||Math.abs(py-base)<1})}
function roofKind(r,seed){if(r.locked)return 'lock';if(r===tallest)return 'tall';if(r===second)return 'heli';var s=rnd(seed),g=GLASS[r.language];return g?(s<.4?'g0':s<.75?'g1':'g2'):(s<.3?'s0':s<.55?'s1':s<.85?'s2':'s3')}
function roofProps(c,px,ty,w,r,seed){var hw=TW/2*w,hh=TH/2*w,k=roofKind(r||{},seed);
  if(k==='lock'){c.fillStyle=sky==='night'?'#AFC0E0':'#E8EDF6';c.strokeStyle=c.fillStyle;c.lineWidth=1.6;c.beginPath();c.arc(px,ty-6,3,Math.PI,0);c.stroke();c.fillRect(px-4,ty-6,8,6);c.fillStyle='#5C6B86';c.fillRect(px-.7,ty-4.5,1.4,2.5);return}
  if(k==='tall'){roofHi(c,px,ty,w,[['hvac',-.5,.4],['hvac',.4,.5]]);c.strokeStyle='#B8BCC6';c.lineWidth=1.2;c.beginPath();c.moveTo(px,ty);c.lineTo(px,ty-26);c.stroke();c.lineWidth=.6;c.beginPath();c.moveTo(px-3,ty-16);c.lineTo(px+3,ty-16);c.moveTo(px-2,ty-21);c.lineTo(px+2,ty-21);c.stroke();return}
  if(k==='heli'&&w>.5)return roofHi(c,px,ty,w,[['helipad'],['mast',-.7,-.7,14]]);
  roofHi(c,px,ty,w,{g0:[['crown',0,0,'#9AA1AD']],g1:[['solar',-.1,-.2,3,4.5],['hvac',.55,.5]],g2:[['garden']],s0:[['tank',.25,-.25],['hvac',-.4,.4]],s1:[['hvac',-.35,.3],['hvac',.2,.45],['hvac',.35,-.3],['stack',-.5,-.5]],s2:[['garden']],s3:[['skylight',-.3,-.3],['hvac',.4,.4],['dish',.5,-.5]],heli:[['hvac',0,0]]}[k])}
function tree2(c,px,py,s,seed){treeHi(c,px,py,s,seed||px*.37+py)}
function pine(c,px,py,s){pineHi(c,px,py,s)}
function houseAt(c,px,py,col,seed){houseHi(c,px,py,seed%3,col,seed)}
function lamp(c,px,py){lampHi(c,px,py)}
${HIFI_JS}
// a public repo's name label is a link to it (private and locked buildings never link)
var tagHits=[];function repoUrl(r){return !r.locked&&r.public!==false&&(/^https:\/\/[^\s"<>]+$/.test(r.url||'')||(r.kind==='site'&&/^http:\/\/[^\s"<>]+$/.test(r.url||'')))?r.url:''}
function tagHit(c,g,font){if(!g.url)return;c.font=font;var w=c.measureText(g.text).width+12;tagHits.push({x0:g.x-w/2,x1:g.x+w/2,y0:g.y-17,y1:g.y+2,url:g.url})}
var LASTOPEN={u:'',t:0};function openRepo(u){if(!u)return;var t=Date.now();if(u===LASTOPEN.u&&t-LASTOPEN.t<1200)return;LASTOPEN={u:u,t:t};window.open(u,'_blank','noopener')}   // a double click opens one tab
function pill(c,x,y,text,bg,fg,font){c.font=font;var tw=c.measureText(text).width,w=tw+12,h=17,r=8.5;c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=6;c.shadowOffsetY=2;c.fillStyle=bg;c.beginPath();
  c.moveTo(x-w/2+r,y-h);c.arcTo(x+w/2,y-h,x+w/2,y,r);c.arcTo(x+w/2,y,x-w/2,y,r);c.lineTo(x+3,y);c.lineTo(x,y+4);c.lineTo(x-3,y);c.arcTo(x-w/2,y,x-w/2,y-h,r);c.arcTo(x-w/2,y-h,x+w/2,y-h,r);c.closePath();c.fill();c.restore();
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
var lamps=[],cranes=[],beacons=[];
// level of detail (BUILD-NOTE 4): 0 below zoom .5 on the World (shapes only), 1 up to 1.1 (sprites from the atlas), 2 walked in (vectors)
function drawObjects(){SIGNS=[];CLAB=[];var LOD=WORLD&&cam.z<.5;LODN=LOD?0:cam.z<1.1?1:2;atlFrame();var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.lineJoin='round';hits=[];tagHits=[];lamps=[];cranes=[];beacons=[];var tags=[],vv=hView(maxH+60),nObj=0;
  FOREMAN={};for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if((p.x<vv[0]||p.x>vv[1]||p.y<vv[2]||p.y>vv[3])&&!(t.t==='b'&&SFA.get(t.r)))continue;   // off screen: nothing to draw (signs still place themselves)
    var gp=gpop(i,j);if(gp<=0&&t.t!=='b')continue;if(gp<1&&t.t!=='b'){c.save();var gk=backOut(gp);c.translate(p.x,p.y);c.scale(gk,gk);c.translate(-p.x,-p.y)}
    var hf=t.t==='h'&&BUILDING?buildF(t,i,j):1;if(hf<.55){if(gp<1&&t.t!=='b')c.restore();continue}if(hf<1){c.save();var hk=backOut(Math.min(1,(hf-.55)/.45));c.translate(p.x,p.y);c.scale(hk,hk);c.translate(-p.x,-p.y)}
    if(t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<(i===0||j===0?.55:.8)){var s=Math.round((.7+rnd(i+j*3)*.5)*10)/10,tv=(i*7+j*13)%4;
      if(rnd(i*3+j)<.5)hiDraw(c,'tr|'+s+'|'+tv,36,34,15,28,p.x+(rnd(i)-.5)*20,p.y+(rnd(j)-.5)*8,function(cc){treeHi(cc,0,0,s,tv*3.1)});
      else hiDraw(c,'pn|'+s,36,34,15,28,p.x+(rnd(j)-.5)*20,p.y+(rnd(i)-.5)*8,function(cc){pineHi(cc,0,0,s)})}
    if(t.t==='r'&&(isRoad(i-1,j)||isRoad(i+1,j))&&(isRoad(i,j-1)||isRoad(i,j+1))&&(i+j)%2===0&&LODN>0){var lp={x:p.x-TW*.32,y:p.y};hiDraw(c,'lamp',15,28,4,24,lp.x,lp.y,function(cc){lampHi(cc,0,0)});lamps.push(lp)}
    if(t.t==='w')drawShop(c,p,LOD);
    if(t.t==='L'){growObject(c,t,i,j,p,LOD);nObj++}
    if(t.t==='p')hiDraw(c,'park|'+((i+j)%3),70,50,35,36,p.x,p.y,function(cc){treeHi(cc,-10,1,.9,i%3);pineHi(cc,11,-2,.8);treeHi(cc,2,7,.6,(i+j)%3+1);if(LODN>0)benchHi(cc,-20,8)});
    if(t.t==='h'&&!BON){var sd=(hash(t.d.name)+i*3+j*5)%24,hn0=Math.min(3,t.n);hiDraw(c,'hl|'+sd+'|'+hn0,72,54,33,37,p.x,p.y,function(cc){houseLotHi(cc,0,0,{seed:sd,n:hn0})});nObj++}
    if(hf<1)c.restore();if(gp<1&&t.t!=='b')c.restore();
    if(t.t==='b'){var r=t.r,SL=SFA.get(r),h=bh(r),bdm=typeof bBld==='function'?bBld(t,i,j):0,dm=dormant(r),seed=hash(r.name||(i+'_'+j)),glass=!!GLASS[r.language]||r.locked,bf=BUILDING?buildF(t,i,j):1;
      var col=r.kind?SHOPC[seed%SHOPC.length]:r.locked?'#5F6F8E':dm?mix(LANG[r.language]||'#8A8A93',.55,'#8A8E96'):(LANG[r.language]||'#8A8A93');
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=r.kind?.6:dm?0:r.locked?(t.d&&t.d.apart?0:r.week?.4:.08):Math.min(.95,.15+(r.week/Math.max(wk,1))*.8);
      litp=Math.min(litp,P.lit==null?1:P.lit);   // fewer lit windows by day, more as evening comes
      var gw=glowOf(t.d),sg=gw>0?siteGlowOf(t):0,lw=Math.max(sg,gw*.3);if(lw>0)litp=Math.max(litp,Math.min(.97,lw*(.55+.45*(P.lit==null?1:P.lit))));   // people on the site right now light up its building (the rest of the district a little)
      if(bdm>0){h=Math.max(10,Math.round(h*(1-.5*bdm)));litp=0}   // a hit tower has lost its top floors and its lights (citybattle.ts), back floor by floor as the cranes work
      var tiers=towerTiers(LODN===1&&bf>=1?Math.round(h/3)*3:h),base=p.y+4,top=base;nObj++;   // at LOD 1 heights snap to 3 px so towers share sprites
      if(bf<1){top=lego(c,p.x,base,tiers,h,col,glass,litp,seed,r,bf,i+','+j,t.d&&(t.d.nb||t.d.name),LOD);if(bf>0&&bf<.8&&!LOD)cranes.push({x:p.x+4,y:top,seed:seed})}
      else{var hs=0;tiers.forEach(function(q){hs+=q[1]});top=base-hs;   // the tower (variant by glass and seed), roof plant and yard; through the atlas at LOD 1
        var tv2=glass?(seed%3===2?2:0):(seed%3===2?2:1),lq=Math.round(litp*4)/4,pq=sg>0?Math.round(Math.min(.55,sg*.75)*4)/4:0,rk=roofKind(r,seed),sk=seed%2,tc=col,ttw=tiers[tiers.length-1][0],hb=Math.ceil(hs)+84;
        hiDraw(c,bdm>0?null:'tw|'+tv2+'|'+Math.round(hs)+'|'+tc+'|'+lq+'|'+pq+'|'+rk+'|'+sk,116,hb,58,hb-34,p.x,p.y,function(cc){var tp=towerHi(cc,0,0,{variant:tv2,col:tc,seed:sk*131+7,tiers:tiers,litp:lq,people:pq,roof:false});if(LODN>0)roofProps(cc,0,tp,ttw,r,seed)})}
      if(bdm>0&&bf>=1){var rb0=bRebuild();scorchHi(c,p.x,base,bdm);bRubblePiles(c,p.x,base,col,bdm);ruinHi(c,p.x,top,tiers[tiers.length-1][0],col,bdm,rb0);if(rb0>0){scaffoldHi(c,p.x,base,tiers[0][0],base-top,1);cranes.push({x:p.x+4,y:top,seed:seed,col:col})}}
      if(r===tallest)beacons.push({x:p.x,y:top-26});
      if(r.week>0&&!dm&&bf>=1)cranes.push({x:p.x+4,y:top,seed:seed});
      if(SL&&bf>=1)SIGNS.push({c:c,x:p.x,base:base,top:top,list:SL,d:t.d,tron:false,LOD:LOD,lift:r.week>0&&!dm?30:r===tallest?28:4});   // above the crane or the beacon
      if(sel===r){c.save();c.strokeStyle='#C4B5FF';c.lineWidth=2.4/cam.z;c.shadowColor='#8B6CF6';c.shadowBlur=12;var hw=TW/2*.78,hh=TH/2*.78;c.beginPath();c.moveTo(p.x-hw,base);c.lineTo(p.x,base+hh);c.lineTo(p.x+hw,base);c.lineTo(p.x+hw,top+ (base-top>0?0:0));c.lineTo(p.x,top-TH/2*.46);c.lineTo(p.x-hw,top);c.closePath();c.stroke();c.restore()}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&bf>=1&&!INTRO&&!r.locked&&!r.kind&&(cam.z>1.05||sel===r||(!WORLD&&topSet.indexOf(r)>=0))&&!(t.d&&sel!==r&&String(t.d.name).toLowerCase().replace(/[^a-z0-9]/g,'')===String(r.name).toLowerCase().replace(/[^a-z0-9]/g,'')))tags.push({x:p.x,y:top-(r===tallest?32:8),text:r.name.length>18?r.name.slice(0,17)+'…':r.name,url:repoUrl(r),r:r})}}
  if(window.CALDERA_PERF)window.CALDERA_LAST={plots:nObj,lod:LODN,sprites:ATL.size,atlasMB:+(ATLB/1048576).toFixed(1),hit:ATLN.hit,made:ATLN.made,direct:ATLN.direct,why:JSON.stringify(ATLN)};
  drawDust(c);
  if(SHOPLBL){pill(c,SHOPLBL.x,SHOPLBL.y,SHOPLBL.text,SHOPLBL.bg,'#fff','700 11px IBM Plex Sans,Arial,sans-serif');hits.push({shop:1,x0:SHOPLBL.x-80,x1:SHOPLBL.x+80,y0:SHOPLBL.y-12,y1:SHOPLBL.y+8});SHOPLBL=null}
  if(WORLD){worldLabels(tags);drawSigns();return}   // storefront signs go over every building and label
  if(labels&&!INTRO){var fT='600 10.5px IBM Plex Sans,Arial,sans-serif',fB='700 11.5px IBM Plex Sans,Arial,sans-serif';fitLabels(c,tags,fT,function(b){return {x:b.x,y:b.y,text:b.d.name}},fB,
    function(g){pill(c,g.x,g.y,g.text,'rgba(17,20,32,.86)','#F2F2F5',fT);tagHit(c,g,fT);c.font=fT;CLAB.push([g.x,g.y,c.measureText(g.text).width+14])},function(b,q){pill(c,q.x,q.y,q.text,'rgba(139,108,246,.95)','#fff',fB);c.font=fB;CLAB.push([q.x,q.y,c.measureText(q.text).width+14])})}
  drawSigns()}
function drawSky(){var c=cx;c.setTransform(dpr,0,0,dpr,0,0);
  if(sky==='grid'){c.fillStyle='#010207';c.fillRect(0,0,vw,vh);var g0=c.createRadialGradient(vw/2,vh*.38,10,vw/2,vh*.38,Math.max(vw,vh)*.7);g0.addColorStop(0,'rgba(30,70,140,.45)');g0.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g0;c.fillRect(0,0,vw,vh);
    c.strokeStyle='rgba(61,242,255,.07)';c.lineWidth=1;for(var y=vh*.12;y<vh;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(vw,y);c.stroke()}return}var g=c.createLinearGradient(0,0,0,vh);g.addColorStop(0,P.sky[0]);g.addColorStop(.6,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,vw,vh);
  var cc=wxCloud(),wk=wxKind(),tint={partly:.06,overcast:.4,fog:.42,drizzle:.32,rain:.46,storm:.62,snow:.36}[wk]||0;
  if(tint){c.fillStyle=sky==='night'?'rgba(18,22,32,'+tint+')':sky==='dusk'?'rgba(110,100,120,'+tint+')':'rgba(140,148,160,'+tint+')';c.fillRect(0,0,vw,vh)}
  if(sky==='night'&&cc<60){c.globalAlpha=1-cc/60;for(var s=0;s<90;s++){c.fillStyle='rgba(255,255,255,'+(.25+rnd(s)*.6)+')';var sz=rnd(s*5)<.1?1.8:1.1;c.fillRect(rnd(s*3)*vw,rnd(s*7)*vh*.5,sz,sz)}
    c.fillStyle='#F4F1E4';c.beginPath();c.arc(vw*.86,vh*.13,13,0,7);c.fill();c.fillStyle=P.sky[0];c.beginPath();c.arc(vw*.86+5,vh*.13-3,12,0,7);c.fill();c.globalAlpha=1}
  drawClouds(c)}
function carPos(car){var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;return {x:a.x+dx*car.t+nx*4,y:a.y+dy*car.t+ny*4,ux:ux,uy:uy}}
function drawCycles(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  var tn=performance.now();cars.forEach(function(car,k){var f=fa(car,tn),col=k%2?ORANGE:CYAN,tr=car.trail||[];if(tr.length>1){c.strokeStyle=col;c.globalAlpha=.35*f;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();
      c.globalAlpha=.95*f;c.lineWidth=1.3;c.stroke();c.strokeStyle='#FFFFFF';c.globalAlpha=.6*f;c.lineWidth=.5;c.stroke()}
    c.globalAlpha=f;var p=carPos(car);c.fillStyle=col;c.beginPath();c.arc(p.x,p.y-1,2.2,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x+p.ux*1.5,p.y+p.uy*1.5-1,1,0,7);c.fill()});c.restore()}
function drawVis(){if(INTRO)return;if(!vis.length)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  vis.forEach(function(v){var age=tn-v.born,a=Math.min(1,age/600,(v.life-age)/1500);if(a<=0)return;var tr=v.trail||[];
    if(tr.length>1){c.strokeStyle=v.col;c.globalAlpha=.3*a;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();c.globalAlpha=.9*a;c.lineWidth=1.2;c.stroke()}
    var p=carPos(v);c.globalAlpha=a;var g=c.createRadialGradient(p.x,p.y-1,0,p.x,p.y-1,7);g.addColorStop(0,v.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y-1,7,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x,p.y-1,1.6,0,7);c.fill()});
  c.restore()}
function drawCars(){if(INTRO)return;if(sky==='grid')return drawCycles();var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now(),v=hView(TH),sc=LODN===0?1.25:1;cars.forEach(function(car){var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;
    var px=a.x+dx*car.t+nx*4,py=a.y+dy*car.t+ny*4;if(px<v[0]||px>v[1]||py<v[2]||py>v[3])return;c.globalAlpha=fa(car,tn);carHi(c,px,py,ux,uy,car.col,sc)});c.globalAlpha=1}
/** the live ground: water ripples, and the lamps' warm pools once they are on (only what is in view) */
function hiLive(){if(sky==='grid'||INTRO)return;var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);waterHi(c);
  if(P.lamp>0&&lamps.length){c.save();c.globalCompositeOperation='lighter';lamps.forEach(function(l){lampPoolHi(c,l.x,l.y)});c.restore()}}
function drawLive(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now();pulses=pulses.filter(function(p){return tn-p.born<3200});
  if(pulses.length){c.save();c.globalCompositeOperation='lighter';pulses.forEach(function(p){var pr=(tn-p.born)/3200,r=12+pr*(p.big?90:60);c.strokeStyle=p.col;c.globalAlpha=1-pr;c.lineWidth=2.5;c.shadowColor=p.col;c.shadowBlur=12;c.beginPath();c.ellipse(p.x,p.y,r,r*.5,0,0,7);c.stroke();
    if(p.big){var g=c.createLinearGradient(0,p.y-260,0,p.y);g.addColorStop(0,'rgba(255,210,63,0)');g.addColorStop(1,'rgba(255,210,63,.85)');c.fillStyle=g;c.globalAlpha=(1-pr)*.9;c.fillRect(p.x-3,p.y-260,6,260)}});c.restore()}
  Object.keys(LV.d).forEach(function(k){var b=byName[k],x=LV.d[k];if(!b||!(x.level>0))return;var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),pr=(tn%2000)/2000;
    c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,255,255,'+(.35*(1-pr))+')';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,(b.k*TW/2)*(.6+pr*.5),(b.k*TH/2)*(.6+pr*.5),0,0,7);c.stroke();c.restore();
    if(LV.mode==='private'&&x.now>0){var f=iso(b.x+b.k,b.y+b.k);tronPill(c,f.x,f.y+18,'\u25CF '+x.now+' live','#FFFFFF','600 10px ui-monospace,monospace')}});
  // cranes slew, trolley and hook move, the load swings (craneHi); at most 24 in view
  var cv0=hView(TH*2),nCr=0;cranes.forEach(function(k){if(k.x<cv0[0]||k.x>cv0[1]||k.y<cv0[2]-60||k.y>cv0[3]+60||nCr>=24)return;nCr++;craneHi(c,k)});
  if(sky==='grid'){c.globalCompositeOperation='lighter';beacons.forEach(function(b){var pr=(T%2400)/2400,g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,30*pr+4);g.addColorStop(0,'rgba(255,255,255,.0)');g.addColorStop(.8,'rgba(61,242,255,'+(.5*(1-pr))+')');g.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=g;c.beginPath();c.ellipse(b.x,b.y,30*pr+4,(30*pr+4)*.5,0,0,7);c.fill()});c.globalCompositeOperation='source-over';return}
  beacons.forEach(function(b){if(Math.floor(T/900)%2){c.fillStyle='#FF3B30';c.beginPath();c.arc(b.x,b.y,2,0,7);c.fill();if(sky!=='day'){c.globalCompositeOperation='lighter';var g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,10);g.addColorStop(0,'rgba(255,60,48,.6)');g.addColorStop(1,'rgba(255,60,48,0)');c.fillStyle=g;c.beginPath();c.arc(b.x,b.y,10,0,7);c.fill();c.globalCompositeOperation='source-over'}}})}
// ---- window glow from live visitors: the hub sends each district's glow (visitors in the last 30 minutes, each fading
// over 30 minutes), and lit windows ease toward it: a busy site lights up, then dims to dark as people leave
var GT={},GL={},GS={},glowAt=0,glowDraw=0;
  // which building a visit belongs to. The hub sends each district's visited sites (hostnames). A repo that lists the site
  // (its website on GitHub, or "sites" in city.json) owns it; otherwise the one repo named like the site ("relay" for
  // relay.example.com). A site no repo owns puts nobody anywhere: people only ever stand where the visitors really are.
  function sNorm(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  // a site is a host ("kitse.co", also owning its subdomains) or a page ("mjonesone.com/dictate", owning only visits the hub
  // reports for that path). A path site never takes a whole host's visitors: nobody stands where they weren't.
  function sHostOwns(sites,h){if(!sites||!h||h.indexOf('.')<0)return false;var hh=h.split('/')[0];for(var i=0;i<sites.length;i++){var s=String(sites[i]);
    if(s.indexOf('/')>=0){if(h===s||h.indexOf(s+'/')===0)return true;continue}if(hh===s||hh.slice(-s.length-1)==='.'+s)return true}return false}
  function sWord(h){var l=String(h).split('.');while(l.length>2&&/^(www|app|m|my|go|get|beta|staging)$/.test(l[0]))l.shift();return sNorm(l[0])}
  var SBK=null,SBT=null,SBG=null,SBAt=0;
  // a building's sites, plus those of the websites whose signs hang on it (their visitors walk into this building)
  function tSites(t){var L=SFA.get(t.r);if(!L)return t.r.sites;if(t._st)return t._st;var o=(t.r.sites||[]).slice();L.forEach(function(s){if(s.r!==t.r)(s.r.sites||[]).forEach(function(x){if(o.indexOf(x)<0)o.push(x)})});return t._st=o}
  function siteBook(){if(SBK&&SBT===tiles&&SBG===GS&&(!BUILDING||T-SBAt<1000))return SBK;SBT=tiles;SBG=GS;SBAt=T;SBK=new Map();var by={},k,dn;   // rebuilt when the layout or the live data changes
    var stores=[];for(k in tiles){var t=tiles[k];if(!t||t.t!=='b'||!t.d||!t.r||!t.r.name)continue;(by[t.d.name]||(by[t.d.name]=[])).push(t);if((SFA.get(t.r)||[]).some(function(s){return s.r.kind==='site'}))stores.push(t)}
    for(dn in by){var ts=by[dn],d=ts[0].d,ds=GS[d.name]||(d.nb&&GS[d.nb])||null;if(!ds)continue;var mx=0;for(k in ds)mx=Math.max(mx,ds[k]);
      for(k in ds){var share=ds[k]/(mx||1),own=ts.filter(function(t){return sHostOwns(tSites(t),k)}),kk=k;
        var pth=own.filter(function(t){return (tSites(t)||[]).some(function(x){x=String(x);return x.indexOf('/')>=0&&(kk===x||kk.indexOf(x+'/')===0)})});if(pth.length)own=pth;   // a page (host/path) beats its bare host
        if(!own.length){var w=k.indexOf('.')<0?sNorm(k):sWord(k),best=null,bs=0;
          if(w.length>=3)ts.forEach(function(t){var rn=sNorm(t.r.name),sc=rn===w?1000:(w.length>=4&&rn.indexOf(w)>=0)||(rn.length>=4&&w.indexOf(rn)>=0)?100-Math.abs(rn.length-w.length):0;
            if(sc>bs&&!(tSites(t)&&tSites(t).length&&sc<1000)){bs=sc;best=t}});   // a repo that names its own sites isn't guessed into another
          if(best)own=[best];else own=stores.filter(function(t){return t.d!==d&&sHostOwns(tSites(t),k)})}   // a listed website standing in another district
        own.forEach(function(t){SBK.set(t.r,Math.max(SBK.get(t.r)||0,share))})}}
    return SBK}
  function siteGlowOf(t){var gw=glowOf(t.d);if(!(gw>0)||!t.r)return 0;return gw*(siteBook().get(t.r)||0)}
function stepGlow(tn){var dt=Math.min(1000,tn-(glowAt||tn));glowAt=tn;var moving=false,ks={},k;for(k in GT)ks[k]=1;for(k in GL)ks[k]=1;
  for(k in ks){var g=GL[k]||0,t=GT[k]||0;if(Math.abs(t-g)<.003){if(t)GL[k]=t;else delete GL[k];continue}GL[k]=g+(t-g)*Math.min(1,dt/2200);moving=true}
  if(moving&&tn-glowDraw>220){glowDraw=tn;dirty=true}}
function glowOf(d){return d?(GL[d.name]||(d.nb&&GL[d.nb])||0):0}
var lastPT=0;function frame(){T=performance.now();bCam();if(BUILDING&&bActive())dirty=true;stepGlow(T);if(L1.width!==cv.width||L1.height!==cv.height){L1.width=L2.width=L3.width=L4.width=cv.width;L1.height=L2.height=L3.height=L4.height=cv.height;dirty=true}
  if(under){if(UL.width!==cv.width||UL.height!==cv.height){UL.width=cv.width;UL.height=cv.height;UDIRTY=true}
    if(dirty){if(sky==='grid'){tronGround();tronObjects()}else{drawGround();drawObjects()}dirty=false;UDIRTY=true}if(UDIRTY){drawUnder();UDIRTY=false}
    cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#03020A';cx.fillRect(0,0,cv.width,cv.height);
    cx.globalAlpha=.32;cx.drawImage(L1,0,0);cx.globalAlpha=.22;cx.drawImage(L2,0,0);cx.globalAlpha=1;cx.drawImage(UL,0,0);
    cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawUnderLive(cx,performance.now());return}
  if(dirty){var rd0=performance.now();if(sky==='grid'){tronGround();tronObjects()}else{drawGround();groundIntro(c1);var rd1=performance.now();drawObjects();if(window.CALDERA_LAST)CALDERA_LAST.groundMs=+(rd1-rd0).toFixed(1)}dirty=false;if(window.CALDERA_PERF&&CALDERA_PERF.push)CALDERA_PERF.push(performance.now()-rd0)}   // redraw timings for the perf check (off unless a page sets the array)
  var tn0=performance.now(),dts=lastPT?Math.min(200,tn0-lastPT)/1000:0;lastPT=tn0;if(sky!=='grid'){stepClouds(tn0);stepPrecip(dts)}stepWalks(tn0);
  drawSky();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L1,0,0);hiLive();growUnder();drawTopics();drawTraces();drawCars();if(!BON)drawWalks();drawVis();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L2,0,0);drawShimmer();drawRays();drawLit();drawWeather();drawLive();if(!BON)drawFx();growOver();battleOver();cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawAgents(cx,performance.now());drawHelis(cx,performance.now());if(WORLD){cx.setTransform(1,0,0,1,0,0);cx.drawImage(L3,0,0)}
  cx.setTransform(dpr,0,0,dpr,0,0);var v=cx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.35,vw/2,vh/2,Math.max(vw,vh)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+(sky==='day'?.12:sky==='grid'?.5:.3)+')');cx.fillStyle=v;cx.fillRect(0,0,vw,vh);
  cx.setTransform(1,0,0,1,0,0);cx.drawImage(L4,0,0);
  if(!SENT_READY&&!LOST){SENT_READY=true;postState('ready')}}   // storefront signs over everything: cranes, helicopters, agents, labels
function draw(){dirty=true;UDIRTY=true;if(reduce)frame()}
var last=0,FPS_MS=MINI?50:30,ONSCREEN=true;function tick(ts){if(!document.hidden&&ONSCREEN&&!LOST&&ts-last>FPS_MS){last=ts;cars.forEach(function(c){c.t+=sky==='grid'?0.035:0.02;if(c.t>=1)step(c);var p=carPos(c);(c.trail=c.trail||[]).push([p.x,p.y-1]);if(c.trail.length>34)c.trail.shift()});
  if(LV.on){var tg=performance.now();cars=cars.filter(function(c){return !c.gone||tg-c.gone<1500})}
  if(vis.length){var tn=performance.now();vis=vis.filter(function(v){return tn-v.born<v.life});vis.forEach(function(v){v.t+=v.sp;if(v.t>=1)step(v);var p=carPos(v);(v.trail=v.trail||[]).push([p.x,p.y-1]);if(v.trail.length>26)v.trail.shift()})}frame()}requestAnimationFrame(tick)}
// ---- interaction
function ago(iso){if(!iso)return '';var d=Math.round((now-Date.parse(iso))/DAY);return d<=0?'today':d===1?'yesterday':d+' days ago'}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function agentCard(id){var g=AG[id];if(!g)return show(null);var a=g.a,st={working:'working',thinking:'thinking',waiting:'waiting for you',idle:'idle',done:'done'}[a.state]||a.state;sel={agent:id};
  var where=a.d?e(a.d)+' district':'not in a district';
  card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button>'+(a.label||a.task!=null?'<h3>'+e(a.label||'Agent')+'</h3><div class="k">'+e(a.machine||'')+(a.machine?' &middot; ':'')+st+(a.ago!=null?' &middot; '+(a.ago<60?a.ago+'s':Math.round(a.ago/60)+' min')+' ago':'')+'</div>'
     +(a.task?'<p style="margin:6px 0 0">'+e(a.task)+'</p>':'')+(a.did?'<div class="row"><span>Last step</span><b style="text-align:right">'+e(a.did)+'</b></div>':'')
     +'<div class="row"><span>Where</span><b>'+(a.repo?e(a.repo)+' &middot; ':'')+where+'</b></div>'+(a.tokens?'<div class="row"><span>Tokens today</span><b>'+(+a.tokens).toLocaleString('en-US')+'</b></div>':'')
    :'<h3>AI agent</h3><p style="margin:6px 0 0">An agent is '+st+(a.d?' in the '+where:'')+'. What it is working on is private.</p>');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function show(h){if(h&&h.note!=null)return noteCard(h.note);if(under&&!h){usel=null;UDIRTY=true;card.hidden=true;return}if(h&&h.agent)return agentCard(h.agent);sel=h?h.r:null;if(!h){card.hidden=true;draw();return}if(h.r&&h.r.kind)return listingCard(h);var r=h.r,d=h.d,mx=Math.max.apply(null,(r.weeks||[0]).concat([1]));
  var notes=(d.notePaths||[]).map(function(p){var n=p.split('/').pop().replace(/\.md$/,'');return D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(p))+'" target="_blank" rel="noopener">'+e(n)+'</a>':'<a href="#" data-open="'+e(p)+'">'+e(n)+'</a>'}).join(', ');
  if(r.locked){card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>&#128274; Private '+(D.kind==='vault'?'folder':'repo')+'</h3><div class="k">'+e(d.name)+' district</div><p style="margin:8px 0 0">'+(d.apart?'This person keeps private work anonymous: these padlocks don\'t show how many repos there are, how big they are, which projects they belong to or when they were busy.':'The details of this building are private. Its size and lights show roughly how much work goes on inside.')+'</p>';card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw();return}
  card.classList.remove('is-dir');card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+e(r.name)+'</h3><div class="k">'+e(d.name)+' district &middot; '+e(r.language)+(r.public?' &middot; public':r.priv?' &middot; &#128274; private repo, code not shared':'')+'</div>'
   +(r.description?'<p style="margin:6px 0 0">'+e(r.description)+'</p>':'')
   +'<div class="sp" title="Commits, last 12 weeks">'+(r.weeks||[]).map(function(w){return '<i style="height:'+Math.max(4,Math.round(w/mx*100))+'%"></i>'}).join('')+'</div><div class="k">Commits, last 12 weeks</div>'
   +'<div class="row"><span>Commits this year</span><b>'+r.commits.toLocaleString('en-US')+'</b></div><div class="row"><span>This week</span><b>'+r.week+'</b></div>'
   +(r.pushed?'<div class="row"><span>Last push</span><b>'+ago(r.pushed)+'</b></div>':'')
   +'<div class="row"><span>Notes about '+e(d.name)+'</span><b>'+d.notes+'</b></div>'+(notes?'<div class="k" style="margin-top:6px">'+notes+'</div>':'')
   +(r.url?'<p style="margin:8px 0 0"><a href="'+e(r.url)+'" target="_blank" rel="noopener">Open on GitHub &#8599;</a></p>':'')
   +(D.world&&d.nb&&r.public&&!r.locked?giftHtml(d.nb,r.name):'');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};giftWire(function(){show(h)});draw()}
function at(px,py){if(under){var wx0=(px-cam.x)/cam.z,wy0=(py-cam.y)/cam.z,best=null,bd=1e9;UP.forEach(function(p,ix){var d=Math.hypot(p.x-wx0,p.y-wy0);if(d<Math.max(p.r+3,7/cam.z)&&d<bd){bd=d;best=ix}});return best==null?null:{note:best}}
  for(var si=SHITS.length-1;si>=0;si--){var sh=SHITS[si];if(px>=sh.x0&&px<=sh.x1&&py>=sh.y0&&py<=sh.y1)return sh}   // markers sit on top of everything and their 44 px squares never overlap (screen pixels)
  if(labels){var tx=(px-cam.x)/cam.z,ty=(py-cam.y)/cam.z;for(var ti=tagHits.length-1;ti>=0;ti--){var th=tagHits[ti];if(tx>=th.x0&&tx<=th.x1&&ty>=th.y0&&ty<=th.y1)return th.shop?{shop:1}:th.block?{block:th.block}:{url:th.url}}}
  for(var aid in AG){var g=AG[aid];if(!g.gone&&g.sx!=null&&Math.hypot(px-g.sx,py-g.sy)<Math.max(12,14*cam.z))return {agent:aid}}var wx=(px-cam.x)/cam.z,wy=(py-cam.y)/cam.z;for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(wx>=h.x0&&wx<=h.x1&&wy>=h.y0&&wy<=h.y1)return h}return null}
var ptr={},moved=false,pinch=0;
cv.addEventListener('pointerdown',function(ev){cv.setPointerCapture(ev.pointerId);ptr[ev.pointerId]={x:ev.clientX,y:ev.clientY};moved=false;cv.classList.add('drag');var ks=Object.keys(ptr);if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
cv.addEventListener('pointermove',function(ev){var p=ptr[ev.pointerId];if(!p)return;var ks=Object.keys(ptr);
  if(ks.length===2){var o=ptr[ks[0]===String(ev.pointerId)?ks[1]:ks[0]];var dist=Math.hypot(ev.clientX-o.x,ev.clientY-o.y);if(pinch){var r=st.getBoundingClientRect();zoom(dist/pinch,(ev.clientX+o.x)/2-r.left,(ev.clientY+o.y)/2-r.top)}pinch=dist;moved=true}
  else{var dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;cam.x+=dx;cam.y+=dy}
  p.x=ev.clientX;p.y=ev.clientY;draw()});
function up(ev){var was=ptr[ev.pointerId];delete ptr[ev.pointerId];cv.classList.remove('drag');pinch=0;if(was&&!moved){if(BON&&BREP){bSkip();return}   // a tap during a battle replay: next strike
  var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);
  if(h&&h.shop)return shopCard();
  if(h&&h.group){if(MINI)return openRepo(repoUrl(h.r));return storeDir(h.count===1?h.r:null,h.keys,false,SBTN[h.group])}   // a store marker: the panel lists every store there (the pop-out has no room: the top store)
  if(h&&h.block)return worldFocus(h.block);
  if(h&&h.url)return openRepo(h.url);
  if(MINI&&h&&h.r)return openRepo(repoUrl(h.r));   // the pop-out has no room for cards: a public building opens its repo
  show(h)}}
if(/[#&]test\b/.test(location.hash))window.calderaTest={   // #test: hit boxes in page coordinates, for automated checks
  signs:function(){var b=st.getBoundingClientRect();return SHITS.map(function(h){var k=h.card;return {name:h.r.name,group:h.group,keys:h.keys,count:h.count,box:[b.left+h.x0,b.top+h.y0,b.left+h.x1,b.top+h.y1],x:b.left+(h.x0+h.x1)/2,y:b.top+(h.y0+h.y1)/2,w:h.x1-h.x0,h:h.y1-h.y0,card:[b.left+k[0],b.top+k[1],b.left+k[2],b.top+k[3]]}})},
  signCounts:function(){storeGroups();return {groups:SKEYS.length,shown:SHITS.length,stores:storeList(null).length,counted:SHITS.reduce(function(a,h){return a+h.count},0)}},
  cranes:function(){var b=st.getBoundingClientRect();return cranes.map(function(k){return {x:b.left+cam.x+k.x*cam.z,y:b.top+cam.y+(k.y-30)*cam.z}})},
  buildings:function(){var b=st.getBoundingClientRect();return hits.filter(function(h){return h.r}).map(function(h){return {name:h.r.locked?'':h.r.name,locked:!!h.r.locked,url:repoUrl(h.r),x:b.left+cam.x+(h.x0+h.x1)/2*cam.z,y:b.top+cam.y+(h.y0*.35+h.y1*.65)*cam.z}})},
  world:function(){return WLAB.map(function(l){return {text:l.text,pr:l.pr,x0:l.x0,x1:l.x1,y0:l.y0,y1:l.y1}})},
  zoomTo:function(k,z){var n=NBM[k];if(!n)return false;var c=iso(n.ox+n.w/2-.5,n.oy+n.h/2-.5);cam.z=z;cam.x=vw/2-c.x*z;cam.y=vh/2-c.y*z;draw();return true},
  rays:function(on){RAYS=on;return RAYS},
  wlabels:function(){var b=st.getBoundingClientRect();return (WLAB||[]).map(function(q){return {text:q.text,pr:q.pr,x0:b.left+q.x0,x1:b.left+q.x1,y0:b.top+q.y0,y1:b.top+q.y1}})},   // world labels as placed (screen rects)
  labels:function(){var b=st.getBoundingClientRect();return tagHits.map(function(t){return {url:t.url,b:t.block?t.block.d.name:'',x:b.left+cam.x+(t.x0+t.x1)/2*cam.z,y:b.top+cam.y+(t.y0+t.y1)/2*cam.z}})},
  walks:function(){var b=st.getBoundingClientRect(),tn=performance.now();return WALKS.filter(function(w){return tn>=w.born}).map(function(w){var p=walkAt(w);return {id:w.id,ghost:w.ghost,f:w.d/w.len,x:b.left+cam.x+p.x*cam.z,y:b.top+cam.y+p.y*cam.z}})},
  traces:function(){var r=st.getBoundingClientRect();return TRACES.map(function(t){var m=t.pts[Math.floor(t.pts.length/2)];return {a:t.a,x:r.left+cam.x+m.x*cam.z,y:r.top+cam.y+m.y*cam.z}})},
  clouds:function(){return CLOUDS.map(function(c){return {x:c.x,y:c.y,gone:c.gone}})},
  weather:function(){return {kind:wxKind(),mode:WXMODE,wx:WX,phase:phase,keys:DAYKEYS}},
  fx:function(){return {drops:FX.drops.length,queue:FX.queue.length,parts:FX.parts.length,beams:FX.beams.length,more:Object.keys(FX.more).length,z:cam.z}},
  point:function(locked){var b=st.getBoundingClientRect();for(var i=0;i<hits.length;i++){var h=hits[i];if(!h.r||!!h.r.locked!==locked||(!locked&&!repoUrl(h.r)))continue;
    for(var fy=.2;fy<.95;fy+=.1)for(var fx=.2;fx<.85;fx+=.15){var wx=h.x0+(h.x1-h.x0)*fx,wy=h.y0+(h.y1-h.y0)*fy,sx=cam.x+wx*cam.z,sy=cam.y+wy*cam.z,g=at(sx,sy);
      if(g&&g.r===h.r)return {x:b.left+sx,y:b.top+sy,url:repoUrl(h.r)}}}return null}};
cv.addEventListener('dblclick',function(ev){var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);if(h&&h.r&&!h.sign&&!MINI)openRepo(repoUrl(h.r))});
cv.addEventListener('pointermove',function(ev){if(Object.keys(ptr).length)return;var r=st.getBoundingClientRect(),h=at(ev.clientX-r.left,ev.clientY-r.top);
  cv.classList.toggle('c-link',!!(h&&(h.url||h.sign||h.block||(h.r&&repoUrl(h.r)))));
  var hv=h&&h.sign?h.group:null;if(hv!==SHOVER){SHOVER=hv;cv.title=hv?(h.count>1?h.count+' stores':h.r.name):'';draw();if(reduce)frame()}
  if(WORLD&&!(h&&h.sign)){var hk=h&&h.block?(h.block.d.nb||h.block.d.name):h&&h.d?(h.d.nb||h.d.name):null;if(hk!==WHOVER){WHOVER=hk;cv.title=hk?rayWhy(hk):'';if(reduce)frame()}}});
cv.addEventListener('pointerleave',function(){if(SHOVER){SHOVER=null;cv.title='';draw()}if(WHOVER){WHOVER=null;cv.title='';if(reduce)frame()}});
// /world?focus=<handle> (the World link on a profile): fly straight to that person's neighborhood
if(D.world){try{var FQ=(new URLSearchParams(location.search).get('focus')||'').toLowerCase().replace(/^@/,'');if(FQ&&byName['@'+FQ])setTimeout(function(){worldFocus(byName['@'+FQ])},700)}catch(err){}}
function rayWhy(k){var out=[];((WORLD&&WORLD.links)||[]).forEach(function(l){if(l[0]!==k&&l[1]!==k)return;var o=l[0]===k?l[1]:l[0];out.push(o+(l[2]===2&&l[3]?': both work on '+l[3]:l[2]===3&&l[3]?': '+l[3]:l[2]===4?': similar stack'+(l[3]?' ('+l[3]+')':''):l[2]===1?': welcome link':': friends'))});return out.length?k+' is connected to '+out.slice(0,8).join(', ')+(out.length>8?' and '+(out.length-8)+' more':''):''}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
function zoom(f,ox,oy){var z=Math.min(3,Math.max(D.world?.08:.25,cam.z*f));f=z/cam.z;cam.x=ox-(ox-cam.x)*f;cam.y=oy-(oy-cam.y)*f;cam.z=z;draw()}
cv.addEventListener('wheel',function(ev){ev.preventDefault();var r=st.getBoundingClientRect();zoom(Math.exp(-ev.deltaY*0.0015),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
var bl=document.getElementById('t-labels'),bs=document.getElementById('t-sky');
var btp=document.getElementById('t-topics');if(btp){btp.setAttribute('aria-pressed',String(TOPICS));topicLegend();btp.onclick=function(){TOPICS=!TOPICS;btp.setAttribute('aria-pressed',String(TOPICS));try{localStorage.setItem('caldera-world-topics',TOPICS?'1':'0')}catch(err){}topicLegend();if(reduce)frame()}}
var bfr=document.getElementById('t-fr');if(bfr){bfr.setAttribute('aria-pressed',String(RAYS));bfr.onclick=function(){RAYS=!RAYS;bfr.setAttribute('aria-pressed',String(RAYS));try{localStorage.setItem('caldera-world-rays',RAYS?'1':'0')}catch(err){}if(reduce)frame()}}
var LTXT={smart:'Labels',all:'All labels',off:'Labels off'},LTIP={smart:'Labels: the most relevant names that fit. Zoom in for more. Tap for all',all:'All labels that fit. Tap to hide labels',off:'Labels hidden. Tap for smart labels'};
function lblBtn(){bl.setAttribute('aria-pressed',String(labels));if(WORLD&&!MINI){bl.textContent=LTXT[LMODE];bl.title=LTIP[LMODE]}}
lblBtn();bl.onclick=function(){if(WORLD&&!MINI){LMODE=LMODES[(LMODES.indexOf(LMODE)+1)%LMODES.length];labels=LMODE!=='off';try{localStorage.setItem('caldera-world-labels',LMODE)}catch(err){}}else labels=!labels;lblBtn();draw()};
var MN={auto:'Auto',grid:'Grid',dawn:'Dawn',day:'Day',dusk:'Dusk',evening:'Evening',night:'Night'};
var SKYIC={auto:'',grid:'\u25A6',dawn:'\uD83C\uDF05',day:'\u2600\uFE0F',dusk:'\uD83C\uDF07',evening:'\uD83C\uDF06',night:'\uD83C\uDF19'};
function skyLabel(){var m=SKYMODE==='auto'?phase:SKYMODE;bs.innerHTML=(SKYIC[m]||'')+'<span class="t-txt"> '+(SKYMODE==='auto'?'Auto \u00b7 '+MN[phase]:MN[SKYMODE])+'</span>';bs.title='Lighting: '+(SKYMODE==='auto'?'follows your clock (now '+MN[phase].toLowerCase()+')':MN[SKYMODE].toLowerCase())+'. Click for the next one.'}
skyLabel();bs.onclick=function(){SKYMODE=MODES[(MODES.indexOf(SKYMODE)+1)%MODES.length];try{localStorage.setItem('caldera-sky',SKYMODE)}catch(err){}applySky();skyLabel();draw()};
setInterval(function(){if(SKYMODE!=='auto')return;var k=palKey;applySky();skyLabel();if(palKey!==k)draw()},60000);
setInterval(function(){if(TODAY){buildTraces();todayLine()}},5*60000);   // footprints fade through the day and reset at local midnight
var bw=document.getElementById('t-wx');function wxLabel(){if(!bw)return;var k=wxKind(),ic={clear:'\u2600\uFE0F',partly:'\u26C5',overcast:'\u2601\uFE0F',fog:'\uD83C\uDF2B\uFE0F',drizzle:'\uD83C\uDF26\uFE0F',rain:'\uD83C\uDF27\uFE0F',storm:'\u26C8\uFE0F',snow:'\uD83C\uDF28\uFE0F'}[k]||'';
  bw.innerHTML=ic+'<span class="t-txt"> '+(WXMODE==='auto'?'Auto':WXN[WXMODE]||k)+'</span>';bw.title='Weather: '+(WXMODE==='auto'?(WX&&WX.c?'your local weather'+(WX.place?' in '+WX.place:'')+' ('+k+')':'clear (no local weather yet)'):WXN[WXMODE]||k)+'. Click for the next one.'}
if(bw){wxLabel();bw.onclick=function(){WXMODE=WXMODES[(WXMODES.indexOf(WXMODE)+1)%WXMODES.length];try{localStorage.setItem('caldera-weather',WXMODE)}catch(err){}PRECIP.length=0;wxLabel();draw()}}   // an all-day window drifts through the day
document.getElementById('t-reset').onclick=function(){WFOCUS=null;fit();show(null)};
var bsnd=document.getElementById('t-snd');function sndLabel(){bsnd.innerHTML=sound?'&#x1F50A;':'&#x1F507;';bsnd.setAttribute('aria-pressed',String(sound));bsnd.title='Sound for arrivals, signups and sales ('+(sound?'on':'off')+')'}
if(bsnd){sndLabel();bsnd.onclick=function(){sound=!sound;try{localStorage.setItem('caldera-sound',sound?'1':'0')}catch(err){}sndLabel();if(sound)tone([660,880],.06)}}
var bu=document.getElementById('t-under');if(bu)bu.onclick=function(){under=!under;bu.setAttribute('aria-pressed',String(under));bu.innerHTML=under?'&#x2B06;<span class="t-txt"> City</span>':'&#x2B07;<span class="t-txt"> Underground</span>';
  st.classList.toggle('c-dig',under);if(liveEl)liveEl.hidden=under;usel=null;card.hidden=true;underPanel();fit();draw()};
if(U&&/[#&]underground\b/.test(location.hash))setTimeout(function(){bu&&bu.onclick()},50);
// full screen: the real Fullscreen API where the page is allowed it, otherwise the stage fills the window (Esc exits)
var bf=document.getElementById('t-full');function fsLabel(){var on=!!document.fullscreenElement||st.classList.contains('c-full');bf.innerHTML=on?'&#x2715;<span class="t-txt"> Exit</span>':'&#x26F6;<span class="t-txt"> Full screen</span>';bf.setAttribute('aria-label',on?'Exit full screen':'Full screen')}
function cssFull(on){st.classList.toggle('c-full',on);document.body.style.overflow=on?'hidden':'';setTimeout(function(){fit();draw()},30);fsLabel()}
bf.onclick=function(){if(document.fullscreenElement){document.exitFullscreen();return}if(st.classList.contains('c-full'))return cssFull(false);
  var r=st.requestFullscreen&&document.fullscreenEnabled?st.requestFullscreen():null;if(r&&r.catch)r.catch(function(){cssFull(true)});else cssFull(true)};
// pop out: inside Obsidian the plugin opens an always-on-top window; on the web a small window opens the watch page
// (the hub's own page, which can float the city on top in Chrome/Edge); elsewhere this page in mini mode
var bp=document.getElementById('t-pop');if(bp){if(MINI)bp.hidden=true;bp.onclick=function(){
  if(window.parent!==window){parent.postMessage({caldera:'popout'},'*');return}
  var m=location.pathname.match(/^\/@([a-z0-9-]+)\//),u=m?'/watch/@'+m[1]+location.search:location.href.split('#')[0]+'#mini';
  var w=window.open(u,'caldera-city','popup,width=440,height=290');if(!w)location.href=u}}
document.addEventListener('fullscreenchange',function(){setTimeout(function(){fit();draw()},30);fsLabel()});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&st.classList.contains('c-full'))cssFull(false)});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&!card.hidden&&card.classList.contains('is-dir')){ev.preventDefault();closeDir()}});
(function(){var n=storeList(null).length,tb=st.querySelector('.c-tools');if(!n||!tb||MINI)return;var b=document.createElement('button');b.id='t-stores';b.type='button';b.title='Every storefront in this '+(D.world?'world':'city');
  b.innerHTML='&#x1F3EA;<span class="t-txt"> Stores ('+n+')</span>';b.setAttribute('aria-label','Stores ('+n+')');b.onclick=function(){if(!card.hidden&&card.classList.contains('is-dir')&&!DIRKEY){closeDir();return}storeDir(null,null,true,b)};
  var ref=tb.querySelector('#t-reset');tb.insertBefore(b,ref||null)})();
// ---- the canvas going black (2026-11-05, Mike on the Hades card: "often caldera does not load in this view"). iOS drops
// canvas backing stores on background/resume, on re-layout (the Duo folding) and under memory pressure, and can lose
// the 2D context outright. So: on contextlost stop drawing and tell the parent; on contextrestored rebuild the layers
// and redraw; not back within 2 s, reload. On every return to the page (and every 5 s in the mini frame) check the
// canvas still holds a picture and redraw from scratch if it doesn't. The parent (Hades) gets {type:'caldera-city',
// state:'ready'|'lost'} and can ping with {type:'caldera-city-ping'}.
var LOST=false,SENT_READY=false,lostT=0;
function postState(s){try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'caldera-city',state:s},'*')}catch(e){}}
function rebuildLayers(){L1=document.createElement('canvas');L2=document.createElement('canvas');L3=document.createElement('canvas');L4=document.createElement('canvas');
  c1=L1.getContext('2d');c2=L2.getContext('2d');c3=L3.getContext('2d');c4=L4.getContext('2d');UL=document.createElement('canvas');uc=UL.getContext('2d');
  L1.width=L2.width=L3.width=L4.width=UL.width=cv.width;L1.height=L2.height=L3.height=L4.height=UL.height=cv.height;dirty=true;UDIRTY=true}
function ctxLost(){try{return !!(cx.isContextLost&&cx.isContextLost())}catch(e){return false}}
function blank(){try{if(!cv.width||!cv.height)return false;var x=Math.floor(cv.width/2),y=Math.floor(cv.height/3),d=cx.getImageData(x,y,1,1).data;return d[3]===0}catch(e){return false}}   // nothing drawn at all (a dropped backing store reads back empty)
function lose(){if(LOST)return;LOST=true;SENT_READY=false;postState('lost');clearTimeout(lostT);lostT=setTimeout(function(){if(LOST)location.reload()},2000)}
function recover(){LOST=false;clearTimeout(lostT);cx=cv.getContext('2d');rebuildLayers();fit();SENT_READY=false;if(reduce)frame()}
function healthCheck(){if(ctxLost())return lose();if(blank()){rebuildLayers();fit();frame();if(blank()||ctxLost())lose();return}if(!LOST&&SENT_READY)postState('ready')}
cv.addEventListener('contextlost',function(e){e.preventDefault();lose()});
cv.addEventListener('contextrestored',function(){recover()});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'){rebuildLayers();fit();setTimeout(healthCheck,300)}});
window.addEventListener('pageshow',function(e){if(e.persisted){rebuildLayers();fit();setTimeout(healthCheck,300)}});
window.addEventListener('message',function(e){var m=e.data;if(m&&m.type==='caldera-city-ping'){healthCheck();if(!LOST)postState(SENT_READY?'ready':'loading')}});
if(MINI){setInterval(function(){if(!document.hidden&&ONSCREEN)healthCheck()},5000);
  if(window.IntersectionObserver)new IntersectionObserver(function(es){var on=es[0]&&es[0].isIntersecting;if(on&&!ONSCREEN){ONSCREEN=true;rebuildLayers();fit();setTimeout(healthCheck,300)}else ONSCREEN=on}).observe(cv)}
window.addEventListener('resize',function(){fit();draw()});
fit();
if(reduce)frame();else{cityIntro();requestAnimationFrame(tick)}
})();`;
