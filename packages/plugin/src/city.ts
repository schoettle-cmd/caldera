/**
 * Caldera City (the Obsidian Visualizer): your GitHub as a little isometric city, your Obsidian notes as the
 * houses around it. Districts = projects, towers = repos (height = commits this year), lit windows = this week's
 * commits, cranes = being built right now, cars = commit traffic, houses = notes that link to the project.
 *
 * Pure: repos + notes -> data -> one self-contained page (inline canvas renderer, no network).
 * Privacy: publicCity() keeps public repos by name and folds private repos of a public project into one
 * unnamed tower per district; projects that aren't on the public profile are left out entirely.
 */

export interface CityRepo {
  name: string; project: string; public: boolean; language: string;
  commits: number; weeks: number[]; week: number; today: number;
  pushed?: string; created?: string; size?: number; url?: string; description?: string;
  locked?: boolean;                                   // a private repo on the public page: shape only, no details
}
export interface CityDistrict { name: string; notes: number; notePaths?: string[]; repos: CityRepo[] }
export interface CityData { generated?: string; districts: CityDistrict[]; private: boolean; totals?: { commits: number; active: number }; under?: Underground }

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
  }));
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
export function publicCity(c: CityData, publicProjects: string[]): CityData {
  const pub = new Set(publicProjects.map(p => p.toLowerCase()));
  const districts: CityDistrict[] = [], hidden: CityRepo[] = [];
  for (const d of c.districts) {
    const listed = pub.has(d.name.toLowerCase()) || d.repos.some(r => r.public);   // a public repo already names its project
    if (!listed) { hidden.push(...d.repos.map(r => locked(r, "Private"))); continue; }
    districts.push({ name: d.name, notes: pub.has(d.name.toLowerCase()) ? d.notes : 0, repos: d.repos.map(r => r.public ? r : locked(r, d.name)) });
  }
  if (hidden.length) districts.push({ name: "Private", notes: 0, repos: hidden.sort((a, b) => b.commits - a.commits) });
  const all = c.districts.flatMap(d => d.repos);
  return { generated: c.generated, districts, private: false, totals: { commits: all.reduce((s, r) => s + r.commits, 0), active: all.filter(r => r.week > 0).length },
    under: c.under ? publicUnderground(c.under, districts.map(d => d.name)) : undefined };
}

export interface CitySite { name: string; handle?: string; theme?: "dark" | "light"; icon?: string; nav?: (depth: number, current: string) => string; openBase?: string }

export function renderCity(site: CitySite, city: CityData): string {
  const repos = city.districts.flatMap(d => d.repos);
  const total = city.totals?.commits ?? repos.reduce((s, r) => s + r.commits, 0), active = city.totals?.active ?? repos.filter(r => r.week > 0).length, notes = city.districts.reduce((s, d) => s + d.notes, 0);
  const json = JSON.stringify({ ...city, openBase: site.openBase || "" }).replace(/</g, "\\u003c");
  const icon = site.icon ? `<link rel="icon" href="${esc(site.icon)}" type="image/png">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`;
  const rows = city.districts.map(d => `<tr><td>${esc(d.name)}</td><td>${d.repos.length}</td><td>${d.repos.reduce((s, r) => s + r.commits, 0).toLocaleString("en-US")}</td><td>${d.repos.reduce((s, r) => s + r.week, 0)}</td><td>${d.notes}</td></tr>`).join("");
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(site.name)}'s city</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css"><style>${CITY_CSS}</style></head><body>
<div class="tabs"><a class="tab" href="index.html">${esc(site.name)}.md</a><span class="tab is-active">City</span><span class="spacer"></span></div>
<div class="shell">${site.nav ? site.nav(0, "city.html") : ""}<main class="note"><div class="c-main">
<div class="g-crumbs c-crumbs"><a href="index.html">${esc(site.handle ? "@" + site.handle : site.name)}</a> / City</div>
<h1 class="c-title">${esc(site.name)}'s city</h1>
<p class="c-lede">Every project is a district and every GitHub repo a building: taller means more commits this year, lit windows mean commits this week, a crane means it's being built right now. The houses around each district are the Obsidian notes about that project.${city.private ? " <b>Private view:</b> every repo, including private ones." : repos.some(r => r.locked) ? " Glass buildings with a padlock are private repos: you can see the city grow, not what's inside." : ""}</p>
<div class="c-stats"><div><b>${repos.length}</b><span>buildings</span></div><div><b>${total.toLocaleString("en-US")}</b><span>commits this year</span></div><div><b>${active}</b><span>busy this week</span></div><div><b>${notes.toLocaleString("en-US")}</b><span>notes in town</span></div></div>
<div class="c-stage" id="stage"><canvas id="city" aria-label="Isometric city of ${repos.length} projects"></canvas>
<div class="c-tools"><button id="t-labels" aria-pressed="true">Labels</button><button id="t-sky">Day</button>${city.under ? '<button id="t-under" aria-pressed="false">&#x2B07;<span class="t-txt"> Underground</span></button>' : ""}<button id="t-reset">Reset</button><button id="t-full" aria-label="Full screen" title="Full screen">&#x26F6;<span class="t-txt"> Full screen</span></button></div>
<div class="c-card" id="card" hidden></div><div class="c-hint">Drag to move &middot; scroll or pinch to zoom &middot; tap a building</div></div>
<div class="c-legend"><span><i style="background:#3178C6"></i>TypeScript</span><span><i style="background:#E8C547"></i>JavaScript</span><span><i style="background:#4FB89A"></i>Python</span><span><i style="background:#E07A4F"></i>HTML</span><span><i style="background:#F05138"></i>Swift</span><span><i style="background:#8A8A93"></i>Other</span>${repos.some(r => r.locked) ? '<span><i style="background:#5C6B86"></i>&#128274; Private</span>' : ""}<span>&#127959; built this week</span><span>&#127968; notes about the project</span></div>
<div class="c-table-wrap"><table class="c-table"><thead><tr><th>District</th><th>Buildings</th><th>Commits this year</th><th>This week</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
${city.generated ? `<p class="c-foot">GitHub counts from ${esc(new Date(city.generated).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}.</p>` : ""}
</div></main></div>
<script type="application/json" id="city-data">${json}</script>
<script>${CITY_JS}</script></body></html>`;
}

/** A small, still isometric picture of the city for the top of the profile: same packing, colors and heights as
 * the live city, drawn as inline SVG (no script, no scroll capture), linking through to city.html. */
export function citySnapshot(city: CityData, o: { name: string; href?: string }): string {
  const LANG: Record<string, string> = { TypeScript: "#3178C6", JavaScript: "#E8C547", Python: "#4FB89A", HTML: "#E07A4F", Swift: "#F05138", CSS: "#6E5BD0", Shell: "#7FB24A", Go: "#2FB5D6", Rust: "#C9744A" };
  const shade = (hex: string, f: number) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(Math.min(255, v * f))); return `rgb(${c.join(",")})`; };
  const TW = 64, TH = 32, ds = city.districts.slice(0, 14);
  const area = ds.reduce((a, d) => { const k = Math.max(2, Math.ceil(Math.sqrt(Math.min(d.repos.length, 36)))); return a + (k + 1) * (k + 1); }, 0);
  const maxW = Math.max(8, Math.ceil(Math.sqrt(area) * 1.25));
  type T = { x: number; y: number; r: CityRepo };
  const ts: T[] = [], blocks: { x: number; y: number; k: number }[] = [];
  let x = 1, y = 1, rowH = 0;
  for (const d of ds) {
    const rs = d.repos.slice(0, 36), k = Math.max(2, Math.ceil(Math.sqrt(rs.length)));
    if (x + k > maxW && x > 1) { x = 1; y += rowH + 1; rowH = 0; }
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
  const repos = city.districts.flatMap(d => d.repos), total = repos.reduce((a, r) => a + r.commits, 0), busy = repos.filter(r => r.week > 0).length;
  const e = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  return `<style>.city-peek{display:block;position:relative;margin:18px 0 26px;border-radius:12px;overflow:hidden;text-decoration:none;color:#E8EEF8;background:radial-gradient(ellipse at 50% 120%,#1d2b4a 0%,#0c1222 60%,#080b14 100%);border:1px solid rgba(140,170,220,.18);transition:border-color .2s,transform .2s}
.city-peek:hover{border-color:rgba(140,190,255,.5);transform:translateY(-1px)}.city-peek svg{display:block;width:100%;height:auto;max-height:300px}
.cp-pad{fill:rgba(120,150,210,.10);stroke:rgba(140,170,230,.22);stroke-width:1}.cp-w{fill:rgba(10,16,30,.55)}[class*=cp-on]{fill:#FFD98A;animation:cpw 4s ease-in-out infinite}
.cp-on1{animation-delay:-.8s}.cp-on2{animation-delay:-1.6s}.cp-on3{animation-delay:-2.4s}.cp-on4{animation-delay:-3.2s}@keyframes cpw{0%,100%{opacity:1}50%{opacity:.35}}
.cp-cool{fill:#BFD8FF}@media (prefers-reduced-motion:reduce){[class*=cp-on]{animation:none}}
.cp-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;padding:28px 16px 12px;background:linear-gradient(transparent,rgba(6,9,18,.88));font:500 13px/1.3 "IBM Plex Sans",system-ui,sans-serif}
.cp-bar b{font-size:15px}.cp-bar .cp-go{color:#9CC4FF;white-space:nowrap}.cp-bar .cp-n{opacity:.75}</style>
<a class="city-peek" href="${e(o.href || "city.html")}" aria-label="Open ${e(o.name)}'s city"><svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">${out.join("")}</svg>
<span class="cp-bar"><span><b>${e(o.name)}'s city</b> <span class="cp-n">&middot; ${repos.length} building${repos.length === 1 ? "" : "s"} &middot; ${total.toLocaleString("en-US")} commit${total === 1 ? "" : "s"} this year${busy ? ` &middot; ${busy} busy this week` : ""}</span></span><span class="cp-go">Explore the city &rarr;</span></span></a>`;
}

const CITY_CSS = `
.c-main{max-width:1100px;margin:0 auto;padding:28px 20px 64px}
.c-crumbs{font-size:var(--text-sm);color:var(--text-muted);margin-bottom:6px}.c-crumbs a{color:var(--text-muted)}
.c-title{font-family:var(--font-serif,'Source Serif 4',Georgia,serif);font-size:2.1rem;margin:0 0 8px;color:var(--text-strong)}
.c-lede{color:var(--text-muted);max-width:70ch;margin:0 0 16px}
.c-stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.c-stats div{flex:1 1 120px;background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:10px 14px;display:flex;flex-direction:column}
.c-stats b{font-size:1.5rem;font-variant-numeric:tabular-nums;color:var(--text-strong)}.c-stats span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.c-stage{position:relative;height:min(72vh,720px);min-height:420px;border-radius:var(--radius-md,10px);overflow:hidden;border:1px solid rgba(61,242,255,.35);box-shadow:0 0 24px rgba(61,242,255,.12);background:#010207;touch-action:none}
.c-stage canvas{width:100%;height:100%;display:block;cursor:grab}.c-stage canvas.drag{cursor:grabbing}
.c-tools{position:absolute;top:10px;right:10px;display:flex;gap:6px}
.c-tools button{font:500 12px var(--font-mono,'IBM Plex Mono',monospace);padding:5px 10px;border-radius:999px;border:1px solid rgba(61,242,255,.45);background:rgba(2,6,12,.8);color:#BFF8FF;cursor:pointer}
.c-tools button[aria-pressed="false"]{opacity:.6}
.c-under{position:absolute;left:10px;bottom:10px;width:min(300px,calc(100% - 20px));background:rgba(2,6,12,.86);border:1px solid rgba(181,140,255,.45);border-radius:10px;padding:8px 10px;color:#E3DAFF;font:12px/1.45 var(--font-mono,'IBM Plex Mono',monospace)}
.c-under b{color:#fff}.c-under{cursor:pointer}.c-under.c-min>:not(.uh){display:none}.c-under.c-min,.c-live.c-min{width:auto}.c-under .chev,.c-live .chev{float:right;opacity:.7;margin-left:8px}.c-under .lg{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:4px;color:#A99BD0}.c-under .lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;vertical-align:0}
.c-stage.c-dig .c-hint{display:none}
.c-stage.c-full{position:fixed;inset:0;z-index:9999;height:100%;min-height:0;border-radius:0;border:0}
.c-stage:fullscreen{height:100%;border-radius:0;border:0}
.c-hint{position:absolute;left:10px;bottom:10px;font:12px var(--font-sans,sans-serif);color:rgba(232,232,238,.75);background:rgba(14,19,32,.6);padding:4px 8px;border-radius:6px;pointer-events:none}
.c-card{position:absolute;left:10px;top:10px;width:min(300px,calc(100% - 20px));max-height:calc(100% - 60px);overflow:auto;background:rgba(18,22,34,.94);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px 14px;color:#E8E8EE;font:13px/1.45 var(--font-sans,'IBM Plex Sans',sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.c-card h3{margin:0 0 2px;font-size:15px;color:#fff}.c-card .k{color:#9A9AA6;font-size:12px}.c-card a{color:#B9A6FF}
.c-card .row{display:flex;justify-content:space-between;gap:8px;margin-top:4px}.c-card .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#9A9AA6;font-size:16px;cursor:pointer}
.c-card .sp{display:flex;align-items:flex-end;gap:2px;height:28px;margin:8px 0 2px}.c-card .sp i{flex:1;background:#8B6CF6;border-radius:2px 2px 0 0;min-height:2px}
.c-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:10px 0 18px;font-size:var(--text-sm);color:var(--text-muted)}
.c-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.c-table-wrap{overflow-x:auto}.c-table{width:100%;border-collapse:collapse;font-size:var(--text-sm);font-variant-numeric:tabular-nums}
.c-table th,.c-table td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line)}.c-table th{color:var(--text-muted);font-weight:500}
.c-foot{font-size:var(--text-xs,12px);color:var(--text-muted);margin-top:12px}
.c-live{position:absolute;right:10px;bottom:10px;width:min(260px,calc(100% - 20px));max-height:46%;overflow:hidden;background:rgba(2,6,12,.86);border:1px solid rgba(61,242,255,.4);border-radius:10px;padding:8px 10px;color:#CFEFFF;font:12px/1.4 var(--font-mono,'IBM Plex Mono',monospace);box-shadow:0 0 18px rgba(61,242,255,.12)}
.c-live .h{display:flex;align-items:center;gap:6px;color:#fff;font-weight:600;letter-spacing:.06em;margin-bottom:4px}.c-live .dot{width:7px;height:7px;border-radius:50%;background:#FF3B5C;box-shadow:0 0 8px #FF3B5C;animation:clive 1.6s infinite}
.c-live .r{display:flex;justify-content:space-between;gap:8px;padding:2px 0;border-top:1px solid rgba(61,242,255,.12)}.c-live .r span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c-live .r b{color:#fff;font-weight:600;white-space:nowrap}
.c-live .m{color:#7FA6B8}.c-live .s{font-size:11px;padding-bottom:2px}.c-live .bar{display:inline-block;height:6px;border-radius:3px;background:#3DF2FF;box-shadow:0 0 6px #3DF2FF;vertical-align:1px}.c-live .lg i{display:inline-block;width:7px;height:7px;border-radius:50%;margin:0 4px 0 8px;vertical-align:0}.c-live .lg i:first-child{margin-left:0}
@keyframes clive{50%{opacity:.35}}
.c-live .h{cursor:pointer}.c-live.c-min>:not(.h){display:none}.c-live.c-min .h{margin:0}
.c-live .q{font-size:11px;padding-top:3px;border-top:1px solid rgba(61,242,255,.12)}
@media (max-width:600px){.c-live{max-height:none;font-size:11px}.c-hint{display:none}.c-tools .t-txt{display:none}}
@media (max-width:600px){.c-main{padding:20px 16px 48px}.c-title{font-size:1.7rem}.c-stage{height:62vh;min-height:360px}}
`;

// The renderer (plain ES5-ish so it runs everywhere, including inside Obsidian's sandboxed tab).
const CITY_JS = String.raw`(function(){
var D=JSON.parse(document.getElementById('city-data').textContent);
var cv=document.getElementById('city'),st=document.getElementById('stage'),cx=cv.getContext('2d'),card=document.getElementById('card');
var TW=64,TH=32,LANG={TypeScript:'#3178C6',JavaScript:'#E8C547',Python:'#4FB89A',HTML:'#E07A4F',Swift:'#F05138',CSS:'#6E5BD0',Shell:'#7FB24A',Go:'#2FB5D6',Rust:'#C9744A'};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var hr=new Date().getHours(),night=hr<6||hr>=19,labels=true;
function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}
function hash(t){var h=0;for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
function shade(hex,f){var n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;r=Math.round(Math.min(255,r*f));g=Math.round(Math.min(255,g*f));b=Math.round(Math.min(255,b*f));return 'rgb('+r+','+g+','+b+')'}
var now=Date.now(),DAY=864e5;
// ---- layout: districts are square blocks packed in rows with 1-tile roads between them
var blocks=[],tiles={},W=0,H=0,x=1,y=1,rowH=0;
var area=D.districts.reduce(function(s,d){var n=d.repos.length+Math.ceil(Math.min(d.notes,40)/4);var k=Math.max(2,Math.ceil(Math.sqrt(n)));return s+(k+1)*(k+1)},0);
var maxW=Math.max(8,Math.ceil(Math.sqrt(area)*1.25));
D.districts.forEach(function(d){
  var houses=Math.min(d.notes,40),need=d.repos.length+Math.ceil(houses/4),k=Math.max(2,Math.ceil(Math.sqrt(need)));
  if(x+k>maxW&&x>1){x=1;y+=rowH+1;rowH=0}
  var b={d:d,x:x,y:y,k:k};blocks.push(b);
  var cells=[];for(var j=0;j<k;j++)for(var i=0;i<k;i++)cells.push([x+i,y+j]);
  cells.sort(function(a,c){return (a[0]+a[1])-(c[0]+c[1])});   // biggest towers at the back
  d.repos.forEach(function(r,i){var c=cells[i];tiles[c[0]+','+c[1]]={t:'b',r:r,d:d}});
  var hi=d.repos.length,left=houses;
  while(left>0&&hi<cells.length){var c=cells[hi++];var n=Math.min(4,left);left-=n;tiles[c[0]+','+c[1]]={t:'h',n:n,d:d}}
  for(;hi<cells.length;hi++){var c2=cells[hi];tiles[c2[0]+','+c2[1]]={t:'p',d:d}}
  x+=k+1;rowH=Math.max(rowH,k);W=Math.max(W,x);H=Math.max(H,y+rowH+1);
});
W=Math.max(W,maxW)+1;H+=1;
function near(i,j){for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++){var n=tiles[(i+a)+','+(j+b)];if(n&&(n.t==='b'||n.t==='h'||n.t==='p'))return true}return false}
for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var key=i+','+j;if(!tiles[key])tiles[key]={t:(i===0||j===0||i===W||j===H)?'g':near(i,j)?'r':'g'}}
// ---- buildings
var maxC=1;D.districts.forEach(function(d){d.repos.forEach(function(r){maxC=Math.max(maxC,r.commits)})});
function bh(r){return 16+Math.min(230,Math.round(34*Math.log2(1+r.commits/8)))}
var maxH=0,ranked=[];D.districts.forEach(function(d){d.repos.forEach(function(r){maxH=Math.max(maxH,bh(r));ranked.push(r)})});
ranked.sort(function(a,b){return (b.week*20+b.commits)-(a.week*20+a.commits)});var topSet=ranked.slice(0,12);
function dormant(r){return r.pushed&&now-Date.parse(r.pushed)>60*DAY&&!r.week}
// ---- view
var dpr=1,vw=0,vh=0,cam={x:0,y:0,z:1};
function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}
function fit(){var r=st.getBoundingClientRect();dpr=window.devicePixelRatio||1;vw=r.width;vh=r.height;cv.width=vw*dpr;cv.height=vh*dpr;
  var spanX=(W+H)*TW/2+TW,spanY=(W+H)*TH/2+maxH+40;cam.z=Math.min(1.6,Math.max(.3,Math.min(vw/spanX,vh/spanY)*.98));
  var c=iso(W/2,H/2);cam.x=vw/2-c.x*cam.z;cam.y=vh/2-c.y*cam.z+(maxH/2)*cam.z;
  if(under){var y0=iso(0,0).y-maxH*.6,y1=iso(W,H).y+DROP+DSPAN+20;cam.z=Math.min(1.4,Math.max(.25,Math.min(vw/spanX,vh/(y1-y0))*.96));cam.x=vw/2-c.x*cam.z;cam.y=vh/2-((y0+y1)/2)*cam.z}
  dirty=true;UDIRTY=true}
// ---- cars wander the roads
var roads=[];for(var k in tiles)if(tiles[k].t==='r'){var p=k.split(',');roads.push([+p[0],+p[1]])}
var traffic=D.districts.reduce(function(s,d){return s+d.repos.reduce(function(a,r){return a+r.week},0)},0);
var cars=[];for(var c=0;c<Math.min(70,4+Math.round(traffic/6))&&roads.length;c++){var s=roads[Math.floor(rnd(c+1)*roads.length)];cars.push({i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][c%5]})}
// ---- live traffic on the owner's own sites (polled from the hub, or posted in by Obsidian): every visitor rides out of
// their district as a light (white), signups pulse pink, purchases fire a gold beam. Public pages get activity levels only.
var LV={d:{},seen:'',mode:''},vis=[],pulses=[],VCOL='#FFFFFF',SCOL='#FF4FD8',BCOL='#FFD23F';
var byName={};blocks.forEach(function(b){byName[b.d.name]=b});
function exits(b){if(b.ex)return b.ex;b.ex=[];for(var j=b.y-1;j<=b.y+b.k;j++)for(var i=b.x-1;i<=b.x+b.k;i++)if(isRoad(i,j))b.ex.push([i,j]);return b.ex}
function spawn(b,col,fast){var ex=exits(b);if(!ex.length||vis.length>160)return;var s=ex[Math.floor(Math.random()*ex.length)];
  var v={i:s[0],j:s[1],ti:s[0],tj:s[1],t:1,col:col,b:b,born:performance.now(),life:14000+Math.random()*9000,sp:fast?.06:.045};step(v);vis.push(v)}
function pulse(b,col,big){var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5);pulses.push({x:p.x,y:p.y,col:col,born:performance.now(),big:big})}
function onLive(data){if(!data||typeof data!=='object'||!data.districts||typeof data.districts!=='object')return;LV.mode=data.private?'private':'public';LV.d=data.districts;
  if(!LV.on&&Object.keys(LV.d).length){LV.on=true;cars.length=0}   // live data replaces the ambient traffic: from now on every car is a real visitor
  if(LV.on)reconcile();
  if(Array.isArray(data.agents))agentsIn(data.agents);
  if(Array.isArray(data.events)){var first=!LV.seen,fresh=data.events.filter(function(ev){return ev&&ev.ts>LV.seen&&ev.k!=='view'}).reverse();
    if(!first)fresh.slice(-30).forEach(function(ev,n){var b=byName[ev.d]||byName.Private;if(!b)return;setTimeout(function(){spawn(b,ev.k==='buy'?BCOL:SCOL,true);pulse(b,ev.k==='buy'?BCOL:SCOL,ev.k==='buy')},n*600)});
    data.events.forEach(function(ev){if(ev&&ev.ts>LV.seen)LV.seen=ev.ts});if(!LV.seen)LV.seen=String(data.at||'0')}
  hud();draw()}
// ---- agents: a drone over the building each AI agent is working in. Working = beam into the roof, thinking = circling,
// waiting for you = parked at the HQ pad, blinking amber. Public pages only get district + state, never what it's doing.
var AG={},AGC={working:'#3DF2FF',thinking:'#B58CFF',waiting:'#FFB020',idle:'#6F7C8F',done:'#6F7C8F'},BREPO={},BDIST={};
for(var bk in tiles){var tb=tiles[bk];if(tb.t!=='b')continue;var bij=bk.split(','),bo={i:+bij[0],j:+bij[1],r:tb.r};if(tb.r.name)BREPO[tb.r.name.toLowerCase()]=bo;(BDIST[tb.d.name]=BDIST[tb.d.name]||[]).push(bo)}
var HQI=1.3,HQJ=H-1.3,HQP=iso(HQI,HQJ),HQS=.36;   // Agent HQ: a parking grid on the island's west corner, laid out along the streets
function hqDims(n){var cols=Math.max(1,Math.ceil(Math.sqrt(n)));return {cols:cols,rows:Math.max(1,Math.ceil(n/cols))}}
function agentsIn(list){var tn=performance.now(),seen={};list.slice(0,80).forEach(function(a){if(!a||!a.id)return;seen[a.id]=1;var g=AG[a.id];
    if(!g){var h0=HQP;g=AG[a.id]={x:h0.x,y:h0.y-40,born:tn,seed:hash(String(a.id))}}g.a=a;g.gone=0});
  for(var id in AG)if(!seen[id]&&!AG[id].gone)AG[id].gone=tn}
function agentSpot(g,tn,slot,nslot){var a=g.a,b=null;
  if(a.state==='working'||a.state==='thinking'){b=(a.repo&&BREPO[String(a.repo).toLowerCase()])||null;if(!b&&a.d&&BDIST[a.d]){var l=BDIST[a.d];b=l[g.seed%l.length]}}
  if(!b){var hd=hqDims(nslot),gi=slot%hd.cols,gj=Math.floor(slot/hd.cols),q=iso(HQI+(gi-(hd.cols-1)/2)*HQS,HQJ+(gj-(hd.rows-1)/2)*HQS);return {x:q.x,y:q.y-9+Math.sin(tn/700+g.seed)*1,roof:null,hq:true}}
  var p=iso(b.i,b.j),h=bh(b.r),y=p.y-h-24;
  if(a.state==='thinking')return {x:p.x+Math.cos(tn/900+g.seed)*14,y:y+Math.sin(tn/900+g.seed)*7,roof:null};
  return {x:p.x+Math.sin(tn/1300+g.seed)*3,y:y+Math.sin(tn/500+g.seed)*2,roof:p.y-h}}
function drawAgents(c,tn){var ids=Object.keys(AG);if(!ids.length)return;var parked=ids.filter(function(id){var s=AG[id].a.state;return !(s==='working'||s==='thinking')}),k=0;
  // HQ pad
  c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,176,32,.55)';c.lineWidth=1.5;c.shadowColor='#FFB020';c.shadowBlur=8;var hd=hqDims(parked.length),ri=(hd.cols-1)/2*HQS+.3,rj=(hd.rows-1)/2*HQS+.3,k1=iso(HQI-ri,HQJ-rj),k2=iso(HQI+ri,HQJ-rj),k3=iso(HQI+ri,HQJ+rj),k4=iso(HQI-ri,HQJ+rj);c.fillStyle='rgba(255,176,32,.07)';c.beginPath();c.moveTo(k1.x,k1.y);c.lineTo(k2.x,k2.y);c.lineTo(k3.x,k3.y);c.lineTo(k4.x,k4.y);c.closePath();c.fill();c.stroke();c.restore();
  var nw=parked.filter(function(id){return AG[id].a.state==='waiting'}).length;var ni=parked.length-nw;var hb=iso(HQI+(hd.cols-1)/2*HQS+.3,HQJ+(hd.rows-1)/2*HQS+.3);if(labels)tronPill(c,hb.x,hb.y+18,'AGENT HQ'+(ni?' \u00b7 '+ni+' parked':'')+(nw?' \u00b7 '+nw+' waiting on you':''),'#FFB020','600 9px ui-monospace,monospace');
  ids.forEach(function(id){var g=AG[id],a=g.a,sp=agentSpot(g,tn,parked.indexOf(id)<0?0:parked.indexOf(id),parked.length);
    g.x+=(sp.x-g.x)*.05;g.y+=(sp.y-g.y)*.05;var f=g.gone?Math.max(0,1-(tn-g.gone)/1500):Math.min(1,(tn-g.born)/600);if(f<=0){delete AG[id];return}
    var col=AGC[a.state]||AGC.working,blink=a.state==='waiting'?(.55+.45*Math.abs(Math.sin(tn/380))):(a.state==='idle'||a.state==='done')?.45:1;
    c.save();c.globalAlpha=f;c.globalCompositeOperation='lighter';
    if(sp.roof!=null&&Math.abs(g.x-sp.x)<6){var gb=c.createLinearGradient(0,g.y,0,sp.roof);gb.addColorStop(0,col);gb.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=gb;c.globalAlpha=f*(.55+.25*Math.sin(tn/160));c.beginPath();c.moveTo(g.x-2,g.y);c.lineTo(g.x+2,g.y);c.lineTo(g.x+9,sp.roof);c.lineTo(g.x-9,sp.roof);c.closePath();c.fill();c.globalAlpha=f}
    var sc=sp.hq?.6:1,gl=c.createRadialGradient(g.x,g.y,0,g.x,g.y,22*sc);gl.addColorStop(0,col);gl.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=f*.6*blink;c.fillStyle=gl;c.beginPath();c.arc(g.x,g.y,22*sc,0,7);c.fill();c.globalAlpha=f*blink;
    c.strokeStyle=col;c.lineWidth=1.4;c.shadowColor=col;c.shadowBlur=8;c.setLineDash([4,3]);c.lineDashOffset=-tn/40;c.beginPath();c.ellipse(g.x,g.y,11*sc,5.5*sc,0,0,7);c.stroke();c.setLineDash([]);
    c.fillStyle='#FFFFFF';c.beginPath();c.moveTo(g.x,g.y-6*sc);c.lineTo(g.x+5*sc,g.y);c.lineTo(g.x,g.y+3.5*sc);c.lineTo(g.x-5*sc,g.y);c.closePath();c.fill();c.restore();
    g.sx=g.x*cam.z+cam.x;g.sy=g.y*cam.z+cam.y;
    if(labels&&a.label&&!sp.hq&&(cam.z>.55||ids.length<=8))tronPill(c,g.x,g.y-15,a.label,col,'600 9px ui-monospace,monospace')})}
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
  card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+(n.t?e(n.t):'A note')+'</h3><div class="k" style="color:'+(UK[n.k]||UK.note)+'">'+e(UKN[n.k]||'Note')+(n.d?' &middot; under '+e(n.d):'')+'</div>'
    +'<div class="row"><span>Notes linking here</span><b>'+n.n+'</b></div><div class="row"><span>Links out</span><b>'+n.o+'</b></div>'
    +'<div class="row"><span>Created</span><b>'+ago(n.a)+'</b></div><div class="row"><span>Last edited</span><b>'+ago(n.m)+'</b></div>'
    +(n.t?'':'<p style="margin:6px 0 0">What this note says is private.</p>')+(open?'<p style="margin:8px 0 0">'+open+'</p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){usel=null;UDIRTY=true;card.hidden=true};upulseFrom(ix)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source===parent&&m&&m.caldera==='note'&&U&&typeof m.p==='string'){var ix=U.byPath[m.p];if(ix!=null){U.nodes[ix].m=0;upulseFrom(ix)}}});
// one car per person on the site right now (private: exact count from the last 5 minutes; public: a coarse level)
function reconcile(){var tn=performance.now(),total=0;blocks.forEach(function(b){var x=LV.d[b.d.name],want=!x?0:LV.mode==='private'?Math.min(30,+x.now||0):([0,2,4,7,11][+x.level||0]||0);
  if(total+want>120)want=Math.max(0,120-total);total+=want;
  var mine=cars.filter(function(c){return c.b===b&&!c.gone});
  for(var n=mine.length;n<want;n++){var ex=exits(b);if(!ex.length)break;var s0=ex[Math.floor(Math.random()*ex.length)],c={i:s0[0],j:s0[1],ti:s0[0],tj:s0[1],t:1,b:b,born:tn,col:['#F2F2F5','#E85D75','#4FB89A','#E8C547','#7AA7FF'][Math.floor(Math.random()*5)]};step(c);cars.push(c)}
  mine.slice(want).forEach(function(c){c.gone=tn})})}
function fa(c,tn){return c.gone?Math.max(0,1-(tn-c.gone)/1500):c.born?Math.min(1,(tn-c.born)/800):1}
function agentLine(){var n={},ids=Object.keys(AG).filter(function(id){return !AG[id].gone});if(!ids.length)return '';ids.forEach(function(id){var s=AG[id].a.state;n[s]=(n[s]||0)+1});
  return '<div class="q"><span style="color:#fff">AI agents</span> '+['working','thinking','waiting','idle'].filter(function(s){return n[s]}).map(function(s){return '<span style="color:'+AGC[s]+'">'+n[s]+' '+(s==='waiting'?'waiting on you':s)+'</span>'}).join(' &middot; ')+'</div>'}
var liveEl=null;function hud(){if(!liveEl){liveEl=document.createElement('div');liveEl.className='c-live'+(st.clientWidth<600?' c-min':'');liveEl.setAttribute('aria-live','polite');st.appendChild(liveEl);
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
var CL=window.CALDERA_LIVE;function poll(){if(document.hidden)return;fetch(CL.url,{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(onLive).catch(function(){})}
if(CL&&typeof CL.url==='string'){setTimeout(poll,600);setInterval(poll,10000)}
window.addEventListener('message',function(ev){var m=ev.data;if(ev.source===parent&&m&&m.caldera==='live')onLive(m.data)});
function step(car){var o=[[1,0],[-1,0],[0,1],[0,-1]].map(function(d){return [car.ti+d[0],car.tj+d[1]]}).filter(function(n){var t=tiles[n[0]+','+n[1]];return t&&t.t==='r'&&!(n[0]===car.i&&n[1]===car.j)});
  if(!o.length)o=[[car.i,car.j]];var n=o[Math.floor(Math.random()*o.length)];car.i=car.ti;car.j=car.tj;car.ti=n[0];car.tj=n[1];car.t=0}
// ---- palettes (sky mode follows the viewer's clock: day, dusk, night)
var sky='grid';night=false;
var PAL={
 day:{sky:['#7FB8EA','#CFE6F7','#EAF4FB'],grass:'#7DBB6E',grass2:'#8CC77C',park:'#6FB262',walk:'#D9D6CE',walkSide:'#B7B2A6',plaza:'#E6E2D8',road:'#5A606B',road2:'#626873',line:'rgba(255,255,255,.75)',water:['#4C9BD6','#3A82BD'],earth:['#8A6A4A','#6E5238'],light:1,win:'rgba(196,224,248,.85)',winOff:'rgba(60,82,110,.55)',lamp:0,shadow:'rgba(30,40,60,.22)'},
 dusk:{sky:['#3E3A6E','#C8607A','#F4B26B'],grass:'#5E8F5A',grass2:'#6A9A62',park:'#55854F',walk:'#B9AFA6',walkSide:'#968A80',plaza:'#C7BCB0',road:'#454752',road2:'#4C4E59',line:'rgba(255,226,170,.6)',water:['#5A6FA8','#46568C'],earth:['#6E5040','#55402F'],light:.82,win:'rgba(255,214,140,.92)',winOff:'rgba(48,52,78,.6)',lamp:.6,shadow:'rgba(40,20,50,.28)'},
 night:{sky:['#04060E','#0B1020','#18203A'],grass:'#1D3326',grass2:'#21392A',park:'#1A2F22',walk:'#3A3D47',walkSide:'#2A2D35',plaza:'#41444E',road:'#1E222B',road2:'#23272F',line:'rgba(242,200,90,.45)',water:['#13233F','#0D1A30'],earth:['#2B2219','#201912'],light:.5,win:'rgba(255,208,120,.95)',winOff:'rgba(16,20,34,.75)',lamp:1,shadow:'rgba(0,0,0,.35)'}};
PAL.grid=PAL.night;var P=PAL[sky];
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
  blocks.forEach(function(b,bi){var col=b.d.name==='Private'?'#CFEFFF':DNEON[bi%DNEON.length],x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1);
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
function tronObjects(){var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];lamps=[];cranes=[];beacons=[];var tags=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if((t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<.22)||t.t==='p'){// data crystals
      var n=t.t==='p'?3:1;for(var q=0;q<n;q++){var cx0=p.x+(rnd(i*3+q)-.5)*24,cy0=p.y+(rnd(j*5+q)-.5)*10,s=.6+rnd(i+j+q)*.5,col=rnd(i*7+j+q)<.5?'#2BFFC0':CYAN;
        c.fillStyle='rgba(10,30,40,.9)';poly(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]]);c.fill();glowLine(c,[[cx0,cy0-14*s],[cx0+4*s,cy0-4*s],[cx0,cy0],[cx0-4*s,cy0-4*s]],col,.8,6,true)}}
    if(t.t==='h'){var spots=[[-11,-3],[11,-3],[0,-9],[0,4]],blk=null;blocks.forEach(function(b){if(b.d===t.d)blk=b});var hc=blk&&blk.neon||CYAN;
      for(var q2=0;q2<t.n;q2++){var hx=p.x+spots[q2][0],hy=p.y+spots[q2][1],hw=TW/2*.24,hh=TH/2*.24;c.fillStyle='#0A1220';poly(c,[[hx-hw,hy],[hx,hy+hh],[hx+hw,hy],[hx+hw,hy-6],[hx,hy-14],[hx-hw,hy-6]]);c.fill();
        glowLine(c,[[hx-hw,hy-6],[hx,hy-14],[hx+hw,hy-6]],hc,1,6);c.fillStyle=hc;c.globalAlpha=.8;c.fillRect(hx-1,hy-4,2,2);c.globalAlpha=1}}
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),seed=hash(r.name||(i+'_'+j)),col=r.locked?'#CFEFFF':dm?'#5A6A80':neon(r);
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=dm?.03:r.locked?(r.week?.45:.12):Math.min(.95,.25+(r.week/Math.max(wk,1))*.7);
      var tiers=h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]],base=p.y+4,top=base;
      for(var k=0;k<tiers.length;k++){tronPrism(c,p.x,top,tiers[k][0],tiers[k][1],col,litp,seed+k*101,r.locked);top-=tiers[k][1]}
      if(r.locked){glowLine(c,[[p.x-3,top-6],[p.x-3,top-8],[p.x,top-11],[p.x+3,top-8],[p.x+3,top-6]],col,1.2,6);c.fillStyle=col;c.fillRect(p.x-4,top-6,8,6)}
      if(r===tallest){c.save();c.globalCompositeOperation='lighter';var g=c.createLinearGradient(0,top-260,0,top);g.addColorStop(0,col+'00');g.addColorStop(1,col+'90');c.fillStyle=g;c.fillRect(p.x-2.5,top-260,5,260);c.restore();beacons.push({x:p.x,y:top-4})}
      if(r.week>0&&!dm)cranes.push({x:p.x+4,y:top,seed:seed,col:col});
      if(sel===r){var hw2=TW/2*.78,hh2=TH/2*.78;glowLine(c,[[p.x-hw2,base],[p.x,base+hh2],[p.x+hw2,base],[p.x+hw2,top],[p.x,top-TH/2*.46],[p.x-hw2,top]],'#FFFFFF',2/cam.z+.6,16,true)}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&!r.locked&&(cam.z>1.05||sel===r||topSet.indexOf(r)>=0))tags.push({x:p.x,y:top-(r===tallest?12:8),text:r.name.length>18?r.name.slice(0,17)+'\u2026':r.name,col:col})}}
  if(labels){tags.forEach(function(g){tronPill(c,g.x,g.y,g.text,g.col,'600 10.5px IBM Plex Mono,monospace')});blocks.forEach(function(b){var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05);tronPill(c,p2[0],p2[1]+22,b.d.name.toUpperCase(),b.neon||CYAN,'700 10.5px IBM Plex Mono,monospace')})}}
function tronPill(c,x,y,text,col,font){c.font=font;var tw=c.measureText(text).width,w=tw+14,h=17;c.fillStyle='rgba(2,6,12,.88)';poly(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]]);c.fill();
  glowLine(c,[[x-w/2,y-h],[x+w/2,y-h],[x+w/2,y],[x+3,y],[x,y+4],[x-3,y],[x-w/2,y]],col,1,6,true);c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
function rgb(hex){var n=parseInt(hex.slice(1),16);return [n>>16,n>>8&255,n&255]}
function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
function mix(h,f,toward){var c=rgb(h);if(toward){var t=rgb(toward);return hex(c.map(function(v,i){return v+(t[i]-v)*f}))}
  if(f>=1)return hex(c.map(function(v){return v+(255-v)*(f-1)}));return hex(c.map(function(v){return v*f}))}
function lit(hex,f){return mix(hex,f*P.light+(f>=1?0:0))}
var tallest=null,second=null;(function(){var all=[];D.districts.forEach(function(d){d.repos.forEach(function(r){all.push(r)})});all.sort(function(a,b){return bh(b)-bh(a)});tallest=all[0];second=all[1]})();
// ---- layers: ground (L1) and objects (L2) are cached; cars, cranes and lights animate on top
var L1=document.createElement('canvas'),L2=document.createElement('canvas'),c1=L1.getContext('2d'),c2=L2.getContext('2d'),dirty=true,hits=[],sel=null,T=0;
function isRoad(i,j){var t=tiles[i+','+j];return t&&t.t==='r'}
function poly(ctx,pts,fill){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var k=1;k<pts.length;k++)ctx.lineTo(pts[k][0],pts[k][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}}
function dia(i,j,s){var p=iso(i,j),hw=TW/2*s,hh=TH/2*s;return [[p.x,p.y-hh],[p.x+hw,p.y],[p.x,p.y+hh],[p.x-hw,p.y]]}
function corner(i,j){var p=iso(i,j);return [p.x,p.y]}
function water(i,j){return i===W||j===H}
function drawGround(){var c=c1;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L1.width,L1.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  // the island: a diorama slab with earth sides
  var A=corner(-.5,-.5),B=corner(W+.5,-.5),C=corner(W+.5,H+.5),Dd=corner(-.5,H+.5),th=22;
  poly(c,[Dd,C,[C[0],C[1]+th],[Dd[0],Dd[1]+th]],P.earth[0]);poly(c,[C,B,[B[0],B[1]+th],[C[0],C[1]+th]],P.earth[1]);
  poly(c,[A,B,C,Dd],P.grass);
  for(var j=0;j<=H;j++)for(var i=0;i<=W;i++){var t=tiles[i+','+j];
    if(water(i,j)){var g=c.createLinearGradient(0,iso(i,j).y-TH/2,0,iso(i,j).y+TH/2);g.addColorStop(0,P.water[0]);g.addColorStop(1,P.water[1]);poly(c,dia(i,j,1.02),g);
      var q=iso(i,j);c.strokeStyle=sky==='night'?'rgba(140,170,230,.25)':'rgba(255,255,255,.35)';c.lineWidth=1;for(var w=0;w<2;w++){var ox=(rnd(i*13+j*7+w)-.5)*TW*.5,oy=(rnd(i*5+j*11+w)-.5)*TH*.4;c.beginPath();c.moveTo(q.x+ox-6,q.y+oy);c.quadraticCurveTo(q.x+ox,q.y+oy-2,q.x+ox+6,q.y+oy);c.stroke()}continue}
    if(t.t==='g'){if((i*7+j*3)%5===0)poly(c,dia(i,j,.9),P.grass2);continue}
    if(t.t==='r'){poly(c,dia(i,j,1.02),(i+j)%2?P.road:P.road2);
      var ri=isRoad(i-1,j)||isRoad(i+1,j),rj=isRoad(i,j-1)||isRoad(i,j+1),q2=iso(i,j);c.strokeStyle=P.line;c.lineWidth=1.2;c.setLineDash([5,5]);
      if(ri&&!rj){c.beginPath();c.moveTo(q2.x-TW*.25,q2.y-TH*.25);c.lineTo(q2.x+TW*.25,q2.y+TH*.25);c.stroke()}
      else if(rj&&!ri){c.beginPath();c.moveTo(q2.x+TW*.25,q2.y-TH*.25);c.lineTo(q2.x-TW*.25,q2.y+TH*.25);c.stroke()}
      c.setLineDash([]);
      if(ri&&rj){c.fillStyle=sky==='night'?'rgba(255,255,255,.12)':'rgba(255,255,255,.5)';for(var z=-2;z<=2;z++){c.save();c.translate(q2.x,q2.y);c.transform(1,.5,-1,.5,0,0);c.fillRect(-10+z*4,-12,2,5);c.fillRect(-10+z*4,7,2,5);c.restore()}}}
  }
  // blocks: raised sidewalk slabs, then lots
  blocks.forEach(function(b){var x0=b.x-.5-.08,y0=b.y-.5-.08,x1=b.x+b.k-.5+.08,y1=b.y+b.k-.5+.08,a=corner(x0,y0),bb=corner(x1,y0),cc=corner(x1,y1),dd=corner(x0,y1),h=3;
    poly(c,[dd,cc,[cc[0],cc[1]+h],[dd[0],dd[1]+h]],P.walkSide);poly(c,[cc,bb,[bb[0],bb[1]+h],[cc[0],cc[1]+h]],mix(P.walkSide.charAt(0)==='#'?P.walkSide:'#999999',.85));poly(c,[a,bb,cc,dd],P.walk)});
  for(var key in tiles){var t2=tiles[key];if(t2.t!=='b'&&t2.t!=='h'&&t2.t!=='p')continue;var ij=key.split(','),ii=+ij[0],jj=+ij[1];
    if(t2.t==='b')poly(c,dia(ii,jj,.9),P.plaza);
    else if(t2.t==='h'){poly(c,dia(ii,jj,.9),P.grass2);}
    else{poly(c,dia(ii,jj,.9),P.park);var q3=iso(ii,jj);c.strokeStyle=sky==='night'?'rgba(200,190,170,.18)':'rgba(240,232,210,.8)';c.lineWidth=2;c.beginPath();c.moveTo(q3.x-TW*.3,q3.y);c.quadraticCurveTo(q3.x,q3.y-4,q3.x+TW*.3,q3.y);c.stroke()}}
  // soft building shadows, unioned into one path so overlaps don't double-darken (sun from the upper left)
  c.beginPath();for(var k2 in tiles){var t3=tiles[k2];if(t3.t!=='b')continue;var ij2=k2.split(','),pp=iso(+ij2[0],+ij2[1]),hgt=bh(t3.r),hw=TW/2*.78,hh=TH/2*.78,vx=hgt*.62,vy=hgt*.3;
    var pts=[[pp.x-hw,pp.y+4],[pp.x,pp.y+4-hh],[pp.x+vx,pp.y+4-hh+vy],[pp.x+hw+vx,pp.y+4+vy],[pp.x+vx,pp.y+4+hh+vy],[pp.x,pp.y+4+hh]];c.moveTo(pts[0][0],pts[0][1]);for(var m=1;m<pts.length;m++)c.lineTo(pts[m][0],pts[m][1]);c.closePath()}
  c.fillStyle=P.shadow;c.fill('nonzero');
}
// ---- objects
var GLASS={TypeScript:1,Swift:1,Go:1,Rust:1,Private:1};
function face(c,pts,col,f,y0,y1){var g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,mix(col,f*P.light*1.04));g.addColorStop(1,mix(col,f*P.light*.78));poly(c,pts,g)}
function prism(c,px,py,w,h,col){var hw=TW/2*w,hh=TH/2*w;
  face(c,[[px-hw,py],[px,py+hh],[px,py+hh-h],[px-hw,py-h]],col,.98,py-h,py+hh);
  face(c,[[px,py+hh],[px+hw,py],[px+hw,py-h],[px,py+hh-h]],col,.72,py-h,py+hh);
  poly(c,[[px,py-hh-h],[px+hw,py-h],[px,py+hh-h],[px-hw,py-h]],mix(col,1.12*P.light+(P.light<1?.1:0)));
  c.strokeStyle='rgba(255,255,255,'+(sky==='night'?.06:.16)+')';c.lineWidth=.8;c.beginPath();c.moveTo(px,py+hh);c.lineTo(px,py+hh-h);c.stroke();
  c.strokeStyle='rgba(0,0,0,.22)';c.beginPath();c.moveTo(px-hw,py-h);c.lineTo(px,py+hh-h);c.lineTo(px+hw,py-h);c.stroke();return {hw:hw,hh:hh}}
// windows: parallelograms that follow each face; u runs along the face, v up from the base
function facadeWindows(c,px,py,w,h,glass,litp,seed,base){var hw=TW/2*w,hh=TH/2*w,cols=w>.6?4:3,rows=Math.max(0,Math.floor((h-9)/(glass?7:8)));
  for(var side=0;side<2;side++){var ax=side?px:px-hw,ay=side?py+hh:py,bx=side?px+hw:px,by=side?py:py+hh;
    if(glass){c.strokeStyle='rgba(255,255,255,'+(sky==='night'?.05:.18)+')';c.lineWidth=.7;for(var m=1;m<cols+1;m++){var u=m/(cols+1);c.beginPath();c.moveTo(ax+(bx-ax)*u,ay+(by-ay)*u-3);c.lineTo(ax+(bx-ax)*u,ay+(by-ay)*u-h+2);c.stroke()}
      if(!side&&sky!=='night'){c.save();poly(c,[[ax,ay],[bx,by],[bx,by-h],[ax,ay-h]]);c.clip();var gx=c.createLinearGradient(ax,ay-h,bx,by);gx.addColorStop(.3,'rgba(255,255,255,0)');gx.addColorStop(.45,'rgba(255,255,255,.22)');gx.addColorStop(.55,'rgba(255,255,255,0)');c.fillStyle=gx;c.fillRect(ax-2,ay-h-hh-2,hw+4,h+hh*2+4);c.restore()}}
    for(var r=0;r<rows;r++)for(var k=0;k<cols;k++){var on=rnd(seed+r*7.3+k*13.1+side*31.7)<litp;if(glass&&!on&&sky!=='night')continue;
      var u0=(k+.22)/cols,u1=(k+.78)/cols,v0=6+r*(glass?7:8),v1=v0+(glass?4:5);
      c.fillStyle=on?P.win:P.winOff;poly(c,[[ax+(bx-ax)*u0,ay+(by-ay)*u0-v0],[ax+(bx-ax)*u1,ay+(by-ay)*u1-v0],[ax+(bx-ax)*u1,ay+(by-ay)*u1-v1],[ax+(bx-ax)*u0,ay+(by-ay)*u0-v1]]);c.fill()}
    // ground floor: storefront band
    c.fillStyle=sky==='night'?'rgba(255,200,120,.35)':'rgba(30,36,48,.35)';poly(c,[[ax,ay-1],[bx,by-1],[bx,by-5],[ax,ay-5]]);c.fill()}}
function roofProps(c,px,ty,w,r,seed){var hw=TW/2*w,hh=TH/2*w,s=rnd(seed);
  if(r.locked){c.fillStyle=sky==='night'?'#AFC0E0':'#E8EDF6';c.strokeStyle=c.fillStyle;c.lineWidth=1.6;c.beginPath();c.arc(px,ty-6,3,Math.PI,0);c.stroke();c.fillRect(px-4,ty-6,8,6);c.fillStyle='#5C6B86';c.fillRect(px-.7,ty-4.5,1.4,2.5);return}
  if(r===tallest){c.strokeStyle='#B8BCC6';c.lineWidth=1.2;c.beginPath();c.moveTo(px,ty);c.lineTo(px,ty-26);c.stroke();return}
  if(r===second&&w>.5){c.fillStyle='rgba(40,44,56,.85)';c.beginPath();c.ellipse(px,ty,hw*.55,hh*.55,0,0,7);c.fill();c.fillStyle='#F2D24A';c.font='bold 7px sans-serif';c.textAlign='center';c.fillText('H',px,ty+2.5);return}
  if(s<.3&&!GLASS[r.language]){// water tower
    c.fillStyle='#6B5137';c.fillRect(px-5,ty-8,1.2,8);c.fillRect(px+4,ty-8,1.2,8);c.fillStyle='#8B6A48';c.fillRect(px-6,ty-17,12,9);c.beginPath();c.moveTo(px-7,ty-17);c.lineTo(px,ty-22);c.lineTo(px+7,ty-17);c.closePath();c.fillStyle='#5E4630';c.fill();return}
  if(s<.55){// AC units
    for(var q=0;q<3;q++){var ox=(rnd(seed+q)-.5)*hw*.9,oy=(rnd(seed+q*3)-.5)*hh*.7;prism(c,px+ox,ty+oy,.12,4,'#9AA1AD')}return}
  if(s<.72&&GLASS[r.language]){// solar panels
    c.fillStyle=sky==='night'?'#18233E':'#2B4C86';for(var q2=-1;q2<=1;q2++){poly(c,[[px-8+q2*5,ty-1+q2*2.5],[px-2+q2*5,ty-4+q2*2.5],[px+2+q2*5,ty-2+q2*2.5],[px-4+q2*5,ty+1+q2*2.5]]);c.fill()}return}
  if(s<.85){// roof garden
    poly(c,[[px,ty-hh*.8],[px+hw*.8,ty],[px,ty+hh*.8],[px-hw*.8,ty]],sky==='night'?'#1F3A28':'#5DA14E');tree2(c,px-4,ty+1,.55);tree2(c,px+5,ty-1,.45)}}
function tree2(c,px,py,s){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+4*s,py+1,7*s,3*s,0,0,7);c.fill();c.fillStyle='#6B4B2E';c.fillRect(px-.8*s,py-6*s,1.6*s,6*s);
  var g=c.createRadialGradient(px-2*s,py-13*s,1,px,py-10*s,9*s);g.addColorStop(0,sky==='night'?'#2E5A3C':'#8CCF6E');g.addColorStop(1,sky==='night'?'#15301F':'#3F8A47');c.fillStyle=g;c.beginPath();c.arc(px,py-10*s,7.5*s,0,7);c.fill()}
function pine(c,px,py,s){c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(px+3*s,py+1,6*s,2.5*s,0,0,7);c.fill();c.fillStyle=sky==='night'?'#173126':'#2F7A4A';for(var k=0;k<3;k++){c.beginPath();c.moveTo(px,py-18*s+k*4*s);c.lineTo(px+6*s-k*.5,py-6*s+k*2*s);c.lineTo(px-6*s+k*.5,py-6*s+k*2*s);c.closePath();c.fill()}}
function houseAt(c,px,py,col,seed){var w=.26,hw=TW/2*w,hh=TH/2*w,h=8;prism(c,px,py,w,h,col);
  var rt=py-h,rc=sky==='night'?'#4A2A2A':['#B4554F','#8E5A3C','#5B6B8A','#A0503A'][seed%4];
  poly(c,[[px-hw,rt],[px-hw*.15,rt-9],[px+hw*.85,rt-9+hh*.9],[px,rt+hh]],mix(rc,1));poly(c,[[px,rt+hh],[px+hw*.85,rt-9+hh*.9],[px+hw,rt],],mix(rc,.7));
  poly(c,[[px-hw*.15,rt-9],[px+hw,rt],[px+hw*.85,rt-9+hh*.9]],mix(rc,.85));
  c.fillStyle=mix('#8A7A6A',.9);c.fillRect(px+hw*.3,rt-10,2.2,5);
  c.fillStyle=sky==='night'?'rgba(255,208,120,.95)':'rgba(70,90,120,.7)';poly(c,[[px-hw*.6,py-3+hh*.4-3],[px-hw*.3,py-3+hh*.7-3],[px-hw*.3,py-3+hh*.7-6],[px-hw*.6,py-3+hh*.4-6]]);c.fill()}
function lamp(c,px,py){c.strokeStyle=sky==='night'?'#555B66':'#4A4F58';c.lineWidth=1;c.beginPath();c.moveTo(px,py);c.lineTo(px,py-14);c.lineTo(px+3,py-15);c.stroke();c.fillStyle=sky==='night'?'#FFE3A0':'#C9CDD4';c.fillRect(px+2,py-16,3,2)}
function pill(c,x,y,text,bg,fg,font){c.font=font;var tw=c.measureText(text).width,w=tw+12,h=17,r=8.5;c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=6;c.shadowOffsetY=2;c.fillStyle=bg;c.beginPath();
  c.moveTo(x-w/2+r,y-h);c.arcTo(x+w/2,y-h,x+w/2,y,r);c.arcTo(x+w/2,y,x-w/2,y,r);c.lineTo(x+3,y);c.lineTo(x,y+4);c.lineTo(x-3,y);c.arcTo(x-w/2,y,x-w/2,y-h,r);c.arcTo(x-w/2,y-h,x+w/2,y-h,r);c.closePath();c.fill();c.restore();
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-h/2+.5);c.textBaseline='alphabetic'}
var lamps=[],cranes=[],beacons=[];
function drawObjects(){var c=c2;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,L2.width,L2.height);c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);hits=[];lamps=[];cranes=[];beacons=[];var tags=[];
  for(var sum=0;sum<=W+H;sum++)for(var i=0;i<=W;i++){var j=sum-i;if(j<0||j>H)continue;var t=tiles[i+','+j],p=iso(i,j);
    if(t.t==='g'&&!water(i,j)&&rnd(i*17+j*29)<(i===0||j===0?.55:.8)){var s=.7+rnd(i+j*3)*.5;if(rnd(i*3+j)<.5)tree2(c,p.x+(rnd(i)-.5)*20,p.y+(rnd(j)-.5)*8,s);else pine(c,p.x+(rnd(j)-.5)*20,p.y+(rnd(i)-.5)*8,s)}
    if(t.t==='r'&&(isRoad(i-1,j)||isRoad(i+1,j))&&(isRoad(i,j-1)||isRoad(i,j+1))&&(i+j)%2===0){var lp={x:p.x-TW*.32,y:p.y};lamp(c,lp.x,lp.y);lamps.push(lp)}
    if(t.t==='p'){tree2(c,p.x-10,p.y+1,.9);pine(c,p.x+11,p.y-2,.8);tree2(c,p.x+2,p.y+7,.6)}
    if(t.t==='h'){var spots=[[-11,-3],[11,-3],[0,-9],[0,4]],sd=hash(t.d.name);for(var q=0;q<t.n;q++)houseAt(c,p.x+spots[q][0],p.y+spots[q][1],['#E8DCC8','#CFD8E6','#EAD2B8','#D2E0CC'][(sd+q)%4],sd+q)}
    if(t.t==='b'){var r=t.r,h=bh(r),dm=dormant(r),seed=hash(r.name||(i+'_'+j)),glass=!!GLASS[r.language]||r.locked;
      var col=r.locked?'#5F6F8E':dm?mix(LANG[r.language]||'#8A8A93',.55,'#8A8E96'):(LANG[r.language]||'#8A8A93');
      var wk=r.weeks&&r.weeks.length?Math.max.apply(null,r.weeks):0,litp=dm?0:r.locked?(r.week?.4:.08):Math.min(.95,.15+(r.week/Math.max(wk,1))*.8);
      if(sky==='day')litp=Math.min(litp,.5);
      var tiers=h>110?[[.78,h*.6],[.62,h*.26],[.46,h*.14]]:h>70?[[.78,h*.72],[.6,h*.28]]:[[.78,h]],base=p.y+4,top=base;
      for(var k=0;k<tiers.length;k++){var tw=tiers[k][0],th=tiers[k][1];var sh=prism(c,p.x,top,tw,th,col);facadeWindows(c,p.x,top,tw,th,glass,litp,seed+k*101,base);top-=th}
      roofProps(c,p.x,top,tiers[tiers.length-1][0],r,seed);
      if(r===tallest)beacons.push({x:p.x,y:top-26});
      if(r.week>0&&!dm)cranes.push({x:p.x+4,y:top,seed:seed});
      if(sel===r){c.save();c.strokeStyle='#C4B5FF';c.lineWidth=2.4/cam.z;c.shadowColor='#8B6CF6';c.shadowBlur=12;var hw=TW/2*.78,hh=TH/2*.78;c.beginPath();c.moveTo(p.x-hw,base);c.lineTo(p.x,base+hh);c.lineTo(p.x+hw,base);c.lineTo(p.x+hw,top+ (base-top>0?0:0));c.lineTo(p.x,top-TH/2*.46);c.lineTo(p.x-hw,top);c.closePath();c.stroke();c.restore()}
      hits.push({r:r,d:t.d,x0:p.x-TW*.42,x1:p.x+TW*.42,y0:top-14,y1:p.y+TH*.45});
      if(labels&&!r.locked&&(cam.z>1.05||sel===r||topSet.indexOf(r)>=0))tags.push({x:p.x,y:top-(r===tallest?32:8),text:r.name.length>18?r.name.slice(0,17)+'…':r.name})}}
  if(labels){tags.forEach(function(g){pill(c,g.x,g.y,g.text,'rgba(17,20,32,.86)','#F2F2F5','600 10.5px IBM Plex Sans,Arial,sans-serif')});
    blocks.forEach(function(b){var p2=corner(b.x+b.k-.5+.05,b.y+b.k-.5+.05);pill(c,p2[0],p2[1]+22,b.d.name,'rgba(139,108,246,.95)','#fff','700 11.5px IBM Plex Sans,Arial,sans-serif')})}
}
function drawSky(){var c=cx;c.setTransform(dpr,0,0,dpr,0,0);
  if(sky==='grid'){c.fillStyle='#010207';c.fillRect(0,0,vw,vh);var g0=c.createRadialGradient(vw/2,vh*.38,10,vw/2,vh*.38,Math.max(vw,vh)*.7);g0.addColorStop(0,'rgba(30,70,140,.45)');g0.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g0;c.fillRect(0,0,vw,vh);
    c.strokeStyle='rgba(61,242,255,.07)';c.lineWidth=1;for(var y=vh*.12;y<vh;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(vw,y);c.stroke()}return}var g=c.createLinearGradient(0,0,0,vh);g.addColorStop(0,P.sky[0]);g.addColorStop(.6,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,vw,vh);
  if(sky==='night'){for(var s=0;s<90;s++){c.fillStyle='rgba(255,255,255,'+(.25+rnd(s)*.6)+')';var sz=rnd(s*5)<.1?1.8:1.1;c.fillRect(rnd(s*3)*vw,rnd(s*7)*vh*.5,sz,sz)}
    c.fillStyle='#F4F1E4';c.beginPath();c.arc(vw*.86,vh*.13,13,0,7);c.fill();c.fillStyle=P.sky[0];c.beginPath();c.arc(vw*.86+5,vh*.13-3,12,0,7);c.fill()}
  else{var drift=(T/60000)%1;for(var k=0;k<6;k++){var x=((rnd(k*9)+drift*(.4+rnd(k)*.4))%1.2-.1)*vw,y=(.06+rnd(k*4)*.3)*vh,s2=.7+rnd(k*2)*.8;c.fillStyle=sky==='dusk'?'rgba(255,200,190,.55)':'rgba(255,255,255,.85)';
    [[0,0,22],[18,4,16],[-18,5,15],[8,-8,15],[-6,-6,13]].forEach(function(b){c.beginPath();c.arc(x+b[0]*s2,y+b[1]*s2,b[2]*s2,0,7);c.fill()})}}}
function carPos(car){var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;return {x:a.x+dx*car.t+nx*4,y:a.y+dy*car.t+ny*4,ux:ux,uy:uy}}
function drawCycles(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  var tn=performance.now();cars.forEach(function(car,k){var f=fa(car,tn),col=k%2?ORANGE:CYAN,tr=car.trail||[];if(tr.length>1){c.strokeStyle=col;c.globalAlpha=.35*f;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();
      c.globalAlpha=.95*f;c.lineWidth=1.3;c.stroke();c.strokeStyle='#FFFFFF';c.globalAlpha=.6*f;c.lineWidth=.5;c.stroke()}
    c.globalAlpha=f;var p=carPos(car);c.fillStyle=col;c.beginPath();c.arc(p.x,p.y-1,2.2,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x+p.ux*1.5,p.y+p.uy*1.5-1,1,0,7);c.fill()});c.restore()}
function drawVis(){if(!vis.length)return;var c=cx,tn=performance.now();c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);c.save();c.globalCompositeOperation='lighter';c.lineCap='round';c.lineJoin='round';
  vis.forEach(function(v){var age=tn-v.born,a=Math.min(1,age/600,(v.life-age)/1500);if(a<=0)return;var tr=v.trail||[];
    if(tr.length>1){c.strokeStyle=v.col;c.globalAlpha=.3*a;c.lineWidth=4;c.beginPath();c.moveTo(tr[0][0],tr[0][1]);for(var m=1;m<tr.length;m++)c.lineTo(tr[m][0],tr[m][1]);c.stroke();c.globalAlpha=.9*a;c.lineWidth=1.2;c.stroke()}
    var p=carPos(v);c.globalAlpha=a;var g=c.createRadialGradient(p.x,p.y-1,0,p.x,p.y-1,7);g.addColorStop(0,v.col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y-1,7,0,7);c.fill();c.fillStyle='#FFFFFF';c.beginPath();c.arc(p.x,p.y-1,1.6,0,7);c.fill()});
  c.restore()}
function drawCars(){if(sky==='grid')return drawCycles();var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now();cars.forEach(function(car){c.globalAlpha=fa(car,tn);var a=iso(car.i,car.j),b=iso(car.ti,car.tj),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux*.5;
    var px=a.x+dx*car.t+nx*4,py=a.y+dy*car.t+ny*4;
    if(sky!=='day'){var g=c.createRadialGradient(px+ux*10,py+uy*10,0,px+ux*10,py+uy*10,14);g.addColorStop(0,'rgba(255,240,190,.55)');g.addColorStop(1,'rgba(255,240,190,0)');c.fillStyle=g;c.beginPath();c.arc(px+ux*10,py+uy*10,14,0,7);c.fill()}
    c.fillStyle='rgba(0,0,0,.25)';poly(c,[[px-ux*5-nx*2.5+1,py-uy*5-ny*2.5+1.5],[px+ux*5-nx*2.5+1,py+uy*5-ny*2.5+1.5],[px+ux*5+nx*2.5+1,py+uy*5+ny*2.5+1.5],[px-ux*5+nx*2.5+1,py-uy*5+ny*2.5+1.5]]);c.fill();
    poly(c,[[px-ux*5-nx*2.5,py-uy*5-ny*2.5-2],[px+ux*5-nx*2.5,py+uy*5-ny*2.5-2],[px+ux*5+nx*2.5,py+uy*5+ny*2.5-2],[px-ux*5+nx*2.5,py-uy*5+ny*2.5-2]],mix(car.col,P.light<1?.75:1));
    poly(c,[[px-ux*2-nx*2,py-uy*2-ny*2-4],[px+ux*2.5-nx*2,py+uy*2.5-ny*2-4],[px+ux*2.5+nx*2,py+uy*2.5+ny*2-4],[px-ux*2+nx*2,py-uy*2+ny*2-4]],mix(car.col,1.15));
    if(sky!=='day'){c.fillStyle='#FF4A4A';c.fillRect(px-ux*5-1,py-uy*5-3,2,1.5)}});c.globalAlpha=1}
function drawLive(){var c=cx;c.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);
  var tn=performance.now();pulses=pulses.filter(function(p){return tn-p.born<3200});
  if(pulses.length){c.save();c.globalCompositeOperation='lighter';pulses.forEach(function(p){var pr=(tn-p.born)/3200,r=12+pr*(p.big?90:60);c.strokeStyle=p.col;c.globalAlpha=1-pr;c.lineWidth=2.5;c.shadowColor=p.col;c.shadowBlur=12;c.beginPath();c.ellipse(p.x,p.y,r,r*.5,0,0,7);c.stroke();
    if(p.big){var g=c.createLinearGradient(0,p.y-260,0,p.y);g.addColorStop(0,'rgba(255,210,63,0)');g.addColorStop(1,'rgba(255,210,63,.85)');c.fillStyle=g;c.globalAlpha=(1-pr)*.9;c.fillRect(p.x-3,p.y-260,6,260)}});c.restore()}
  Object.keys(LV.d).forEach(function(k){var b=byName[k],x=LV.d[k];if(!b||!(x.level>0))return;var p=iso(b.x+b.k/2-.5,b.y+b.k/2-.5),pr=(tn%2000)/2000;
    c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,255,255,'+(.35*(1-pr))+')';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,(b.k*TW/2)*(.6+pr*.5),(b.k*TH/2)*(.6+pr*.5),0,0,7);c.stroke();c.restore();
    if(LV.mode==='private'&&x.now>0){var f=iso(b.x+b.k,b.y+b.k);tronPill(c,f.x,f.y+18,'\u25CF '+x.now+' live','#FFFFFF','600 10px ui-monospace,monospace')}});
  // cranes slowly rotate their jibs
  cranes.forEach(function(k){var mx=k.x,my=k.y,mh=30,a=T/2400+k.seed%6;if(sky==='grid'){c.save();c.shadowColor=k.col;c.shadowBlur=6}c.strokeStyle=sky==='grid'?k.col:'#E9A92C';c.lineWidth=1.2;c.beginPath();c.moveTo(mx-1.5,my);c.lineTo(mx-1.5,my-mh);c.moveTo(mx+1.5,my);c.lineTo(mx+1.5,my-mh);for(var z=0;z<mh;z+=5){c.moveTo(mx-1.5,my-z);c.lineTo(mx+1.5,my-z-5)}c.stroke();
    var jx=Math.cos(a)*30,jy=Math.sin(a)*15;c.lineWidth=1.6;c.beginPath();c.moveTo(mx-jx*.35,my-mh-jy*.35);c.lineTo(mx+jx,my-mh+jy);c.stroke();c.fillStyle='#7A7F8A';c.fillRect(mx-jx*.35-2,my-mh-jy*.35-1,4,4);
    var hx=mx+jx*.7,hy=my-mh+jy*.7;c.strokeStyle='rgba(60,60,60,.8)';c.lineWidth=.6;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx,hy+12+Math.sin(T/700+k.seed)*3);c.stroke();c.fillStyle=sky==='grid'?k.col:'#E9A92C';c.fillRect(hx-2,hy+12+Math.sin(T/700+k.seed)*3,4,3);
    if((sky==='night'||sky==='grid')&&Math.floor(T/700+k.seed)%2){c.fillStyle='#FF5040';c.beginPath();c.arc(mx,my-mh-2,1.6,0,7);c.fill()}if(sky==='grid')c.restore()});
  if(P.lamp){c.globalCompositeOperation='lighter';lamps.forEach(function(l){var g=c.createRadialGradient(l.x+3,l.y-15,0,l.x+3,l.y-6,26);g.addColorStop(0,'rgba(255,214,140,'+(.35*P.lamp)+')');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.beginPath();c.arc(l.x+3,l.y-8,26,0,7);c.fill()});c.globalCompositeOperation='source-over'}
  if(sky==='grid'){c.globalCompositeOperation='lighter';beacons.forEach(function(b){var pr=(T%2400)/2400,g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,30*pr+4);g.addColorStop(0,'rgba(255,255,255,.0)');g.addColorStop(.8,'rgba(61,242,255,'+(.5*(1-pr))+')');g.addColorStop(1,'rgba(61,242,255,0)');c.fillStyle=g;c.beginPath();c.ellipse(b.x,b.y,30*pr+4,(30*pr+4)*.5,0,0,7);c.fill()});c.globalCompositeOperation='source-over';return}
  beacons.forEach(function(b){if(Math.floor(T/900)%2){c.fillStyle='#FF3B30';c.beginPath();c.arc(b.x,b.y,2,0,7);c.fill();if(sky!=='day'){c.globalCompositeOperation='lighter';var g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,10);g.addColorStop(0,'rgba(255,60,48,.6)');g.addColorStop(1,'rgba(255,60,48,0)');c.fillStyle=g;c.beginPath();c.arc(b.x,b.y,10,0,7);c.fill();c.globalCompositeOperation='source-over'}}})}
function frame(){T=performance.now();if(L1.width!==cv.width||L1.height!==cv.height){L1.width=L2.width=cv.width;L1.height=L2.height=cv.height;dirty=true}
  if(under){if(UL.width!==cv.width||UL.height!==cv.height){UL.width=cv.width;UL.height=cv.height;UDIRTY=true}
    if(dirty){if(sky==='grid'){tronGround();tronObjects()}else{drawGround();drawObjects()}dirty=false;UDIRTY=true}if(UDIRTY){drawUnder();UDIRTY=false}
    cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#03020A';cx.fillRect(0,0,cv.width,cv.height);
    cx.globalAlpha=.32;cx.drawImage(L1,0,0);cx.globalAlpha=.22;cx.drawImage(L2,0,0);cx.globalAlpha=1;cx.drawImage(UL,0,0);
    cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawUnderLive(cx,performance.now());return}
  if(dirty){if(sky==='grid'){tronGround();tronObjects()}else{drawGround();drawObjects()}dirty=false}
  drawSky();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L1,0,0);drawCars();drawVis();cx.setTransform(1,0,0,1,0,0);cx.drawImage(L2,0,0);drawLive();cx.setTransform(dpr*cam.z,0,0,dpr*cam.z,dpr*cam.x,dpr*cam.y);drawAgents(cx,performance.now());
  cx.setTransform(dpr,0,0,dpr,0,0);var v=cx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.35,vw/2,vh/2,Math.max(vw,vh)*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+(sky==='day'?.12:sky==='grid'?.5:.3)+')');cx.fillStyle=v;cx.fillRect(0,0,vw,vh)}
function draw(){dirty=true;UDIRTY=true;if(reduce)frame()}
var last=0;function tick(ts){if(!document.hidden&&ts-last>30){last=ts;cars.forEach(function(c){c.t+=sky==='grid'?0.035:0.02;if(c.t>=1)step(c);var p=carPos(c);(c.trail=c.trail||[]).push([p.x,p.y-1]);if(c.trail.length>34)c.trail.shift()});
  if(LV.on){var tg=performance.now();cars=cars.filter(function(c){return !c.gone||tg-c.gone<1500})}
  if(vis.length){var tn=performance.now();vis=vis.filter(function(v){return tn-v.born<v.life});vis.forEach(function(v){v.t+=v.sp;if(v.t>=1)step(v);var p=carPos(v);(v.trail=v.trail||[]).push([p.x,p.y-1]);if(v.trail.length>26)v.trail.shift()})}frame()}requestAnimationFrame(tick)}
// ---- interaction
function ago(iso){if(!iso)return '';var d=Math.round((now-Date.parse(iso))/DAY);return d<=0?'today':d===1?'yesterday':d+' days ago'}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function agentCard(id){var g=AG[id];if(!g)return show(null);var a=g.a,st={working:'working',thinking:'thinking',waiting:'waiting for you',idle:'idle',done:'done'}[a.state]||a.state;sel={agent:id};
  var where=a.d?e(a.d)+' district':'not in a district';
  card.innerHTML='<button class="x" aria-label="Close">&times;</button>'+(a.label||a.task!=null?'<h3>'+e(a.label||'Agent')+'</h3><div class="k">'+e(a.machine||'')+(a.machine?' &middot; ':'')+st+(a.ago!=null?' &middot; '+(a.ago<60?a.ago+'s':Math.round(a.ago/60)+' min')+' ago':'')+'</div>'
     +(a.task?'<p style="margin:6px 0 0">'+e(a.task)+'</p>':'')+(a.did?'<div class="row"><span>Last step</span><b style="text-align:right">'+e(a.did)+'</b></div>':'')
     +'<div class="row"><span>Where</span><b>'+(a.repo?e(a.repo)+' &middot; ':'')+where+'</b></div>'+(a.tokens?'<div class="row"><span>Tokens today</span><b>'+(+a.tokens).toLocaleString('en-US')+'</b></div>':'')
    :'<h3>AI agent</h3><p style="margin:6px 0 0">An agent is '+st+(a.d?' in the '+where:'')+'. What it is working on is private.</p>');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function show(h){if(h&&h.note!=null)return noteCard(h.note);if(under&&!h){usel=null;UDIRTY=true;card.hidden=true;return}if(h&&h.agent)return agentCard(h.agent);sel=h?h.r:null;if(!h){card.hidden=true;draw();return}var r=h.r,d=h.d,mx=Math.max.apply(null,(r.weeks||[0]).concat([1]));
  var notes=(d.notePaths||[]).map(function(p){var n=p.split('/').pop().replace(/\.md$/,'');return D.openBase?'<a href="'+e(D.openBase+encodeURIComponent(p))+'" target="_blank" rel="noopener">'+e(n)+'</a>':'<a href="#" data-open="'+e(p)+'">'+e(n)+'</a>'}).join(', ');
  if(r.locked){card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>&#128274; Private repo</h3><div class="k">'+e(d.name)+' district</div><p style="margin:8px 0 0">The details of this building are private. Its size and lights show roughly how much work goes on inside.</p>';card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw();return}
  card.innerHTML='<button class="x" aria-label="Close">&times;</button><h3>'+e(r.name)+'</h3><div class="k">'+e(d.name)+' district &middot; '+e(r.language)+(r.public?' &middot; public':'')+'</div>'
   +(r.description?'<p style="margin:6px 0 0">'+e(r.description)+'</p>':'')
   +'<div class="sp" title="Commits, last 12 weeks">'+(r.weeks||[]).map(function(w){return '<i style="height:'+Math.max(4,Math.round(w/mx*100))+'%"></i>'}).join('')+'</div><div class="k">Commits, last 12 weeks</div>'
   +'<div class="row"><span>Commits this year</span><b>'+r.commits.toLocaleString('en-US')+'</b></div><div class="row"><span>This week</span><b>'+r.week+'</b></div>'
   +(r.pushed?'<div class="row"><span>Last push</span><b>'+ago(r.pushed)+'</b></div>':'')
   +'<div class="row"><span>Notes about '+e(d.name)+'</span><b>'+d.notes+'</b></div>'+(notes?'<div class="k" style="margin-top:6px">'+notes+'</div>':'')
   +(r.url?'<p style="margin:8px 0 0"><a href="'+e(r.url)+'" target="_blank" rel="noopener">Open on GitHub &#8599;</a></p>':'');
  card.hidden=false;card.querySelector('.x').onclick=function(){show(null)};draw()}
function at(px,py){if(under){var wx0=(px-cam.x)/cam.z,wy0=(py-cam.y)/cam.z,best=null,bd=1e9;UP.forEach(function(p,ix){var d=Math.hypot(p.x-wx0,p.y-wy0);if(d<Math.max(p.r+3,7/cam.z)&&d<bd){bd=d;best=ix}});return best==null?null:{note:best}}
  for(var aid in AG){var g=AG[aid];if(!g.gone&&g.sx!=null&&Math.hypot(px-g.sx,py-g.sy)<Math.max(12,14*cam.z))return {agent:aid}}var wx=(px-cam.x)/cam.z,wy=(py-cam.y)/cam.z;for(var i=hits.length-1;i>=0;i--){var h=hits[i];if(wx>=h.x0&&wx<=h.x1&&wy>=h.y0&&wy<=h.y1)return h}return null}
var ptr={},moved=false,pinch=0;
cv.addEventListener('pointerdown',function(ev){cv.setPointerCapture(ev.pointerId);ptr[ev.pointerId]={x:ev.clientX,y:ev.clientY};moved=false;cv.classList.add('drag');var ks=Object.keys(ptr);if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
cv.addEventListener('pointermove',function(ev){var p=ptr[ev.pointerId];if(!p)return;var ks=Object.keys(ptr);
  if(ks.length===2){var o=ptr[ks[0]===String(ev.pointerId)?ks[1]:ks[0]];var dist=Math.hypot(ev.clientX-o.x,ev.clientY-o.y);if(pinch){var r=st.getBoundingClientRect();zoom(dist/pinch,(ev.clientX+o.x)/2-r.left,(ev.clientY+o.y)/2-r.top)}pinch=dist;moved=true}
  else{var dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;cam.x+=dx;cam.y+=dy}
  p.x=ev.clientX;p.y=ev.clientY;draw()});
function up(ev){var was=ptr[ev.pointerId];delete ptr[ev.pointerId];cv.classList.remove('drag');pinch=0;if(was&&!moved){var r=st.getBoundingClientRect();show(at(ev.clientX-r.left,ev.clientY-r.top))}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
function zoom(f,ox,oy){var z=Math.min(3,Math.max(.25,cam.z*f));f=z/cam.z;cam.x=ox-(ox-cam.x)*f;cam.y=oy-(oy-cam.y)*f;cam.z=z;draw()}
cv.addEventListener('wheel',function(ev){ev.preventDefault();var r=st.getBoundingClientRect();zoom(Math.exp(-ev.deltaY*0.0015),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
var bl=document.getElementById('t-labels'),bs=document.getElementById('t-sky');
bl.onclick=function(){labels=!labels;bl.setAttribute('aria-pressed',String(labels));draw()};
var SKIES=['grid','day','dusk','night'],NAMES={grid:'Grid',day:'Day',dusk:'Dusk',night:'Night'};function skyLabel(){bs.textContent=NAMES[SKIES[(SKIES.indexOf(sky)+1)%4]]}skyLabel();bs.onclick=function(){sky=SKIES[(SKIES.indexOf(sky)+1)%4];P=PAL[sky];night=sky==='night'||sky==='grid';skyLabel();cars.forEach(function(c){c.trail=[]});draw()};
document.getElementById('t-reset').onclick=function(){fit();show(null)};
var bu=document.getElementById('t-under');if(bu)bu.onclick=function(){under=!under;bu.setAttribute('aria-pressed',String(under));bu.innerHTML=under?'&#x2B06;<span class="t-txt"> City</span>':'&#x2B07;<span class="t-txt"> Underground</span>';
  st.classList.toggle('c-dig',under);if(liveEl)liveEl.hidden=under;usel=null;card.hidden=true;underPanel();fit();draw()};
if(U&&/[#&]underground\b/.test(location.hash))setTimeout(function(){bu&&bu.onclick()},50);
// full screen: the real Fullscreen API where the page is allowed it, otherwise the stage fills the window (Esc exits)
var bf=document.getElementById('t-full');function fsLabel(){var on=!!document.fullscreenElement||st.classList.contains('c-full');bf.innerHTML=on?'&#x2715;<span class="t-txt"> Exit</span>':'&#x26F6;<span class="t-txt"> Full screen</span>';bf.setAttribute('aria-label',on?'Exit full screen':'Full screen')}
function cssFull(on){st.classList.toggle('c-full',on);document.body.style.overflow=on?'hidden':'';setTimeout(function(){fit();draw()},30);fsLabel()}
bf.onclick=function(){if(document.fullscreenElement){document.exitFullscreen();return}if(st.classList.contains('c-full'))return cssFull(false);
  var r=st.requestFullscreen&&document.fullscreenEnabled?st.requestFullscreen():null;if(r&&r.catch)r.catch(function(){cssFull(true)});else cssFull(true)};
document.addEventListener('fullscreenchange',function(){setTimeout(function(){fit();draw()},30);fsLabel()});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&st.classList.contains('c-full'))cssFull(false)});
window.addEventListener('resize',function(){fit();draw()});
fit();if(reduce)frame();else requestAnimationFrame(tick);
})();`;
