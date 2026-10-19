/**
 * Sections every install gets without extra tools (they used to need the owner's own scripts):
 *   AI usage      - token counts from local Claude Code + Codex logs (desktop only; counts only, never prompts)
 *   Code          - public GitHub contribution graph, when the profile links a github.com/<user> account
 *   What it knows - note counts by note type / folder, using GENERIC labels only (a private folder name never shows)
 * Anything the owner's tools put in Caldera/activity.json wins over these.
 */
import { App, Platform, TFile, requestUrl } from "obsidian";

type AI = { total: number; window_days: number; days: Record<string, number>; models: [string, number][]; providers: [string, number][]; note: string };

const isoLocal = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function prettyModel(model: string): string {
  const m = model.trim().replace(/-\d{8}$/, "").split("/").pop()!.replace(/\./g, "-");
  const c = m.match(/^claude-([a-z]+)-(\d+)(?:-(\d+))?/);
  if (c) return `Claude ${c[1][0].toUpperCase()}${c[1].slice(1)} ${c[2]}${c[3] ? "." + c[3] : ""}`;
  const g = m.match(/^gpt-(\d+)(?:-(\d+))?(.*)$/);
  if (g) return `GPT-${g[1]}${g[2] ? "." + g[2] : ""}${g[3] ? " " + g[3].replace(/^-/, "").replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase()) : ""}`;
  return m;
}
export function providerOf(name: string): string {
  const m = name.toLowerCase();
  if (m.includes("claude")) return "Anthropic";
  if (/^(gpt|o\d|codex)/.test(m)) return "OpenAI";
  if (m.includes("gemini")) return "Google";
  if (m.includes("deepseek")) return "DeepSeek";
  if (m.includes("grok")) return "xAI";
  if (m.includes("llama")) return "Meta";
  if (m.includes("mistral")) return "Mistral";
  return "Other";
}

/** Per-file cache so later publishes only re-read logs that changed. Lives next to the plugin, never published. */
type FileTally = { m: number; s: number; t: Record<string, Record<string, number>> };   // t[day][model] = tokens

export async function aiUsage(cachePath: string, windowDays = 45): Promise<AI | undefined> {
  if (!Platform.isDesktopApp) return undefined;
  let fs: any, path: any, os: any;
  try { fs = (window as any).require("fs"); path = (window as any).require("path"); os = (window as any).require("os"); } catch { return undefined; }
  const home = os.homedir(), since = Date.now() - (windowDays + 2) * 86_400_000;
  let cache: Record<string, FileTally> = {};
  try { cache = JSON.parse(await fs.promises.readFile(cachePath, "utf8")); } catch { /* first run */ }
  const files: [string, "claude" | "codex"][] = [];
  const walk = async (dir: string, kind: "claude" | "codex", depth: number) => {
    let ents: any[] = []; try { ents = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && depth > 0) await walk(p, kind, depth - 1);
      else if (e.isFile() && e.name.endsWith(".jsonl")) files.push([p, kind]);
    }
  };
  await walk(path.join(home, ".claude", "projects"), "claude", 2);
  await walk(path.join(home, ".codex", "sessions"), "codex", 4);
  if (!files.length) return undefined;
  const next: Record<string, FileTally> = {};
  for (const [p, kind] of files) {
    let st: any; try { st = await fs.promises.stat(p); } catch { continue; }
    if (st.mtimeMs < since) continue;
    const c = cache[p];
    if (c && c.m === st.mtimeMs && c.s === st.size) { next[p] = c; continue; }
    const t: FileTally["t"] = {}, seen = new Set<string>();
    let text = ""; try { text = await fs.promises.readFile(p, "utf8"); } catch { continue; }
    let model = "gpt-5";
    for (const line of text.split("\n")) {
      if (kind === "claude") {
        if (!line.includes('"usage"') || !line.includes('"assistant"')) continue;
        try {
          const o = JSON.parse(line), msg = o.message || {}, u = msg.usage;
          if (!u || !msg.model || String(msg.model).startsWith("<") || !o.timestamp || seen.has(msg.id)) continue;
          seen.add(msg.id);
          const n = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
          const d = isoLocal(Date.parse(o.timestamp)); (t[d] ||= {})[msg.model] = (t[d][msg.model] || 0) + n;
        } catch { /* skip */ }
      } else {
        if (!line.includes('"turn_context"') && !line.includes('"token_count"')) continue;
        try {
          const o = JSON.parse(line), pl = o.payload || {};
          if (o.type === "turn_context" && pl.model) model = pl.model;
          else if (pl.type === "token_count" && o.timestamp) {
            const n = pl.info?.last_token_usage?.total_tokens || 0;
            if (n) { const d = isoLocal(Date.parse(o.timestamp)); (t[d] ||= {})[model] = (t[d][model] || 0) + n; }
          }
        } catch { /* skip */ }
      }
    }
    next[p] = { m: st.mtimeMs, s: st.size, t };
    await new Promise(r => window.setTimeout(r, 0));   // keep Obsidian responsive on big log folders
  }
  try { await fs.promises.writeFile(cachePath, JSON.stringify(next)); } catch { /* cache is optional */ }
  const first = isoLocal(Date.now() - (windowDays - 1) * 86_400_000);
  const days: Record<string, number> = {}, models = new Map<string, number>();
  for (const f of Object.values(next)) for (const [d, ms] of Object.entries(f.t)) {
    if (d < first) continue;
    for (const [m, n] of Object.entries(ms)) { days[d] = (days[d] || 0) + n; const k = prettyModel(m); models.set(k, (models.get(k) || 0) + n); }
  }
  const total = Object.values(days).reduce((a, b) => a + b, 0);
  if (!total) return undefined;
  const prov = new Map<string, number>();
  for (const [m, n] of models) prov.set(providerOf(m), (prov.get(providerOf(m)) || 0) + n);
  return { total, window_days: windowDays, days, models: [...models].sort((a, b) => b[1] - a[1]).slice(0, 8), providers: [...prov].sort((a, b) => b[1] - a[1]),
    note: "Tokens processed by my AI coding agents (Claude Code, Codex) on this computer, including cached context. Counts only." };
}

/** Public GitHub contribution graph -> commits per week for the last year. No token, no private data. */
export async function githubCode(links: [string, string][]): Promise<{ commits: number; repos: number; weekly: number[]; url: string; start: string } | undefined> {
  const gh = links.map(l => l[1]).map(u => u.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/)).find(Boolean);
  if (!gh) return undefined;
  const user = gh[1];
  try {
    const r = await requestUrl({ url: `https://github.com/users/${user}/contributions`, throw: false });
    if (r.status !== 200) return undefined;
    const html = r.text, byId = new Map<string, string>(), counts = new Map<string, number>();
    for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"|id="([^"]+)"[^>]*data-date="(\d{4}-\d{2}-\d{2})"/g)) byId.set(m[2] || m[3], m[1] || m[4]);
    for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*(No|\d[\d,]*) contributions?/g)) {
      const d = byId.get(m[1]); if (d) counts.set(d, m[2] === "No" ? 0 : Number(m[2].replace(/,/g, "")));
    }
    if (!counts.size) return undefined;
    const dates = [...counts.keys()].sort(), weekly: number[] = [];
    for (let i = 0; i < dates.length; i += 7) weekly.push(dates.slice(i, i + 7).reduce((a, d) => a + (counts.get(d) || 0), 0));
    const commits = [...counts.values()].reduce((a, b) => a + b, 0);
    let repos = 0;
    try { const u = await requestUrl({ url: `https://api.github.com/users/${user}`, throw: false }); repos = u.json?.public_repos || 0; } catch { /* optional */ }
    const start = new Date(dates[0] + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return commits ? { commits, repos, weekly, url: `https://github.com/${user}`, start } : undefined;
  } catch { return undefined; }
}

/** The owner's GitHub handle from their Links (GitHub | https://github.com/user), if any. */
export function githubUser(links: [string, string][]): string | undefined {
  return links.map(l => l[1]).map(u => u.match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/)).find(Boolean)?.[1];
}

/** A cheap fingerprint of a GitHub account's public repos (2 unauthenticated calls): the newest repo and how many there
 * are. When it changes (a new repo, one deleted, renamed or made public) the city is rebuilt and the page republished,
 * instead of waiting for the 6-hour refresh. undefined when GitHub can't be reached or the rate limit is spent. */
export async function githubRepoSig(user: string): Promise<string | undefined> {
  const u = await requestUrl({ url: `https://api.github.com/users/${user}`, throw: false });
  const r = await requestUrl({ url: `https://api.github.com/users/${user}/repos?type=owner&sort=created&direction=desc&per_page=1`, throw: false });
  if (u.status !== 200 || r.status !== 200 || !Array.isArray(r.json)) return undefined;
  return `${u.json?.public_repos ?? "?"}|${r.json[0]?.full_name || ""}`;
}

/** Caldera/city.json for owners without their own tools: public, non-fork repos grouped by language, with commit
 * activity for the 20 most recently pushed. No token (60 GitHub calls an hour), so the caller refreshes it rarely
 * and keeps the last good numbers when GitHub is still computing them. */
export async function githubCity(user: string, prev?: any): Promise<any | undefined> {
  const own: any[] = [];
  for (let pg = 1; pg <= 2; pg++) {
    const r = await requestUrl({ url: `https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=100&page=${pg}`, throw: false });
    if (r.status !== 200 || !Array.isArray(r.json)) return undefined;
    own.push(...r.json); if (r.json.length < 100) break;
  }
  const old = new Map<string, any>((Array.isArray(prev?.repos) ? prev.repos : []).map((r: any) => [r.name, r]));
  const repos = own.filter(r => !r.fork && !r.private && !r.archived).slice(0, 120).map(r => {
    const o = old.get(r.name);
    return { name: r.name, project: r.language || "Other", public: true, language: r.language || "Other", size: r.size, pushed: r.pushed_at, created: r.created_at,
      url: r.html_url, description: (r.description || "").slice(0, 200), commits: o?.commits || (r.size ? 1 : 0), weeks: o?.weeks || [], week: o?.week || 0, today: 0 };
  });
  for (const r of repos.slice(0, 20)) {
    try {
      const w = await requestUrl({ url: `https://api.github.com/repos/${user}/${r.name}/stats/commit_activity`, throw: false });
      if (w.status === 200 && Array.isArray(w.json) && w.json.length) { const t = w.json.slice(-52).map((x: any) => x.total || 0); r.weeks = t.slice(-12); r.commits = Math.max(1, t.reduce((a: number, b: number) => a + b, 0)); r.week = t[t.length - 1]; }
    } catch { /* keep the last numbers */ }
  }
  return repos.length ? { generated: new Date().toISOString(), source: `caldera github ${user}`, repos } : undefined;
}

/** Where the owner's code lives, from their Links: GitHub (github.com/user) or a Forgejo / Gitea server such as
 * Codeberg (codeberg.org/user, or any https://host/user line labelled Forgejo, Gitea or Codeberg). */
export type Forge = { kind: "github" | "forgejo"; host: string; user: string; url: string };
export function forgeOf(links: [string, string][]): Forge | undefined {
  const gh = githubUser(links); if (gh) return { kind: "github", host: "github.com", user: gh, url: `https://github.com/${gh}` };
  for (const [label, url] of links) {
    const m = url.match(/^(https?:\/\/[^/\s]+)\/([A-Za-z0-9._-]{1,40})\/?$/);
    if (m && (/forgejo|gitea|codeberg/i.test(label) || /^https?:\/\/(www\.)?codeberg\.org$/i.test(m[1]))) return { kind: "forgejo", host: m[1].replace(/^http:/, "https:"), user: m[2], url: `${m[1]}/${m[2]}` };
  }
  return undefined;
}
export const forgeSource = (f: Forge) => f.kind === "github" ? `caldera github ${f.user}` : `caldera forgejo ${f.url}`;

const fj = async (f: Forge, path: string) => {
  const r = await requestUrl({ url: `${f.host}/api/v1${path}`, headers: { Accept: "application/json" }, throw: false });
  return r.status === 200 ? r : undefined;
};

/** Forgejo / Gitea contribution heatmap -> commits per week for the last year. Public data, no token. */
export async function forgejoCode(f: Forge): Promise<{ commits: number; repos: number; weekly: number[]; url: string; start: string } | undefined> {
  try {
    const h = await fj(f, `/users/${encodeURIComponent(f.user)}/heatmap`);
    if (!h || !Array.isArray(h.json)) return undefined;
    const now = Date.now(), WEEK = 7 * 864e5, weekly = Array(53).fill(0);
    for (const x of h.json) { const age = now - Number(x.timestamp) * 1000; if (age >= 0 && age < 53 * WEEK) weekly[52 - Math.floor(age / WEEK)] += Number(x.contributions) || 0; }
    const commits = weekly.reduce((a, b) => a + b, 0); if (!commits) return undefined;
    const u = await fj(f, `/users/${encodeURIComponent(f.user)}/repos?limit=50`);
    const repos = Array.isArray(u?.json) ? u!.json.filter((r: any) => !r.fork && !r.private).length : 0;
    const start = new Date(now - 52 * WEEK).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { commits, repos, weekly, url: f.url, start };
  } catch { return undefined; }
}

/** Caldera/city.json from a Forgejo / Gitea server: same shape as githubCity. Commit counts come from each repo's
 * commit list, counted by author date over the last year. */
export async function forgejoCity(f: Forge, prev?: any): Promise<any | undefined> {
  const own: any[] = [];
  for (let pg = 1; pg <= 4; pg++) {
    const r = await fj(f, `/users/${encodeURIComponent(f.user)}/repos?limit=50&page=${pg}`);
    if (!r || !Array.isArray(r.json)) { if (pg === 1) return undefined; break; }
    own.push(...r.json); if (r.json.length < 50) break;
  }
  const old = new Map<string, any>((Array.isArray(prev?.repos) ? prev.repos : []).map((r: any) => [r.name, r]));
  const live = own.filter(r => !r.fork && !r.private && !r.archived && !r.mirror).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const repos = live.slice(0, 120).map(r => {
    const o = old.get(r.name);
    return { name: r.name, owner: r.owner?.login || f.user, project: r.language || "Other", public: true, language: r.language || "Other", size: r.size, pushed: r.updated_at, created: r.created_at,
      url: r.html_url, description: (r.description || "").slice(0, 200), commits: o?.commits || (r.size ? 1 : 0), weeks: o?.weeks || [], week: o?.week || 0, today: 0 };
  });
  // Commit lists come newest first and Forgejo ignores "since" here, so page back until a year ago (up to 500).
  const now = Date.now(), WEEK = 7 * 864e5, YEAR = 365 * 864e5, q = "&stat=false&verification=false&files=false";
  for (const r of repos.slice(0, 20)) {
    try {
      const base = `/repos/${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}/commits?limit=50${q}`;
      const weeks = Array(12).fill(0); let year = 0, ok = false;
      for (let pg = 1; pg <= 10; pg++) {
        const w = await fj(f, `${base}&page=${pg}`);
        if (!w || !Array.isArray(w.json)) break;
        ok = true; let older = false;
        for (const c of w.json) {
          const age = now - Date.parse(c.commit?.author?.date || c.created);
          if (!(age >= 0)) continue; if (age >= YEAR) { older = true; continue; }
          year++; if (age < 12 * WEEK) weeks[11 - Math.floor(age / WEEK)]++;
        }
        if (older || w.json.length < 50) break;
      }
      if (!ok) continue;
      r.weeks = weeks; r.week = weeks[11]; r.commits = Math.max(1, year);
    } catch { /* keep the last numbers */ }
  }
  for (const r of repos) delete (r as any).owner;
  return repos.length ? { generated: new Date().toISOString(), source: forgeSource(f), repos } : undefined;
}

/** Generic categories only. Labels come from this list, never from the vault, so nothing private can leak. */
const KINDS: [RegExp, string][] = [
  [/^(person|people|contact|contacts)$/, "People"], [/^(company|companies|organization|organisation|org|orgs|organizations)$/, "Companies"],
  [/^(project|projects)$/, "Projects"], [/^(source|sources|article|articles|clipping|clippings|paper|papers|reference|references)$/, "Sources"],
  [/^(concept|concepts|idea|ideas|zettel|zettelkasten|permanent)$/, "Ideas & concepts"], [/^(book|books|reading)$/, "Books"],
  [/^(meeting|meetings)$/, "Meetings"], [/^(daily|dailies|journal|journals|daily-notes|daily notes|daily-digest|diary)$/, "Daily notes"],
  [/^(recipe|recipes)$/, "Recipes"], [/^(research)$/, "Research"], [/^(course|courses|class|classes|lecture|lectures)$/, "Learning"],
  [/^(podcast|podcasts|video|videos)$/, "Media notes"], [/^(tool|tools|software)$/, "Tools"], [/^(place|places|travel)$/, "Places"],
];
const kindOf = (v: unknown) => { const k = String(v ?? "").trim().toLowerCase(); return (KINDS.find(([rx]) => rx.test(k)) || [])[1]; };

export function vaultKinds(app: App, md: TFile[]): [string, number][] {
  const n = new Map<string, number>();
  for (const f of md) {
    if (f.path.startsWith("Caldera/")) continue;
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    const label = kindOf(fm.type) || kindOf(fm.category)
      || (/^\d{4}-\d{2}-\d{2}$/.test(f.basename) ? "Daily notes" : undefined)
      || f.path.split("/").slice(0, -1).map(kindOf).find(Boolean);
    if (label) n.set(label, (n.get(label) || 0) + 1);
  }
  return [...n].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 7);
}
