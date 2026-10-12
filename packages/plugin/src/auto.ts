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
