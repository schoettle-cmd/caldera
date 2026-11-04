/**
 * Lines of code added and removed per day, from the git repositories on this computer (desktop only).
 *
 * - Only counts leave the device (lines added / removed per day, summed over every repo): never repo names, paths,
 *   file names or code. They ride in the daily counts as linesAdded / linesRemoved, which are NOT part of the score.
 * - Which repos: folders right under your home folder and under the usual code folders (~/code, ~/src, ~/projects ...),
 *   plus any folders you list in Settings > Caldera. Protected macOS folders (Documents, Desktop, Downloads ...) are
 *   never touched, so Obsidian never asks for access. Only repos touched in the window are read.
 * - Whose lines: each repo's own git user.email (your commits, not your teammates'). Merges, lockfiles, build output,
 *   vendored and minified files don't count, nor data and prose files (JSON, CSV, text, Markdown, SVG, notebooks), nor
 *   single-file changes over 5,000 lines (generated or imported code). A repo checked out twice counts once.
 *
 * Pure apart from the Node modules passed in, so it runs under Node in tests.
 */
import type { CityData } from "./city";
const DAY = 86_400_000;
const isoDay = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export interface NodeMods { fs: any; path: any; os: any; cp: any }
export type DayLines = Record<string, { added: number; removed: number }>;

const PROTECTED = new Set(["Library", "Desktop", "Documents", "Downloads", "Pictures", "Movies", "Music", "Public", "Applications", "Dropbox", "Google Drive", "OneDrive", "Creative Cloud Files", "node_modules"]);
const CODE_DIRS = ["code", "Code", "src", "dev", "Dev", "projects", "Projects", "repos", "git", "GitHub", "github", "work", "Developer", "Sites", "workspace"];
const GENERATED = /(^|\/)(node_modules|dist|build|out|vendor|third_party|\.next|coverage|__pycache__)\/|(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|Pipfile\.lock|uv\.lock|Gemfile\.lock|composer\.lock|go\.sum)$|\.min\.(js|css)$|\.(map|snap)$/;
// data and prose, not code: JSON/CSV/text dumps, notes and docs (a vault kept in git would otherwise count as code)
const NOT_CODE = /\.(json|jsonl|ndjson|geojson|csv|tsv|txt|log|md|mdx|markdown|rst|svg|ipynb)$/i;
const MAX_FILE_LINES = 5000, MAX_REPOS = 80;

/** `git log --numstat` output (records start with \x1e, header "date\x1femail") -> lines per day. */
export function parseNumstat(out: string, into: DayLines = {}): DayLines {
  for (const rec of out.split("\x1e")) {
    const lines = rec.split("\n"), head = (lines[0] || "").split("\x1f"), day = (head[0] || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    for (const l of lines.slice(1)) {
      const m = /^(\d+)\t(\d+)\t(.+)$/.exec(l.trim()); if (!m) continue;   // "-\t-\tfile" = binary: skipped
      const a = Number(m[1]), d = Number(m[2]), file = m[3]!.replace(/^.*=> /, "").replace(/[{}]/g, "");
      if (GENERATED.test(file) || NOT_CODE.test(file) || a > MAX_FILE_LINES || d > MAX_FILE_LINES) continue;
      const e = into[day] || (into[day] = { added: 0, removed: 0 }); e.added += a; e.removed += d;
    }
  }
  return into;
}

const run = (m: NodeMods, args: string[], cwd: string) => new Promise<string>((res, rej) =>
  m.cp.execFile("git", args, { cwd, timeout: 15_000, maxBuffer: 32 * 1024 * 1024, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: "0", LC_ALL: "C" } }, (err: any, stdout: string) => err ? rej(err) : res(String(stdout))));

/** Git repos touched in the last `days` days, in the usual places (and `extra` folders), at most MAX_REPOS. */
export async function findRepos(m: NodeMods, days: number, extra: string[] = []): Promise<string[]> {
  const { fs, path, os } = m, home = os.homedir(), since = Date.now() - (days + 1) * 86_400_000;
  const kids = async (dir: string) => { try { return (await fs.promises.readdir(dir, { withFileTypes: true })).filter((e: any) => e.isDirectory() && !e.name.startsWith(".") && !PROTECTED.has(e.name)).map((e: any) => path.join(dir, e.name)); } catch { return []; } };
  const roots = [home, ...CODE_DIRS.map(d => path.join(home, d)), ...extra.map(x => x.trim().replace(/^~(?=$|\/)/, home)).filter(Boolean)];
  const cand: string[] = [];
  for (const r of roots) { if (r !== home) cand.push(r); cand.push(...await kids(r)); }
  const out: string[] = [], seen = new Set<string>();
  for (const c of cand) {
    if (out.length >= MAX_REPOS) break;
    try {
      const g = path.join(c, ".git"); const st = await fs.promises.stat(g);
      // recently used: the index (or, for a .git file / worktree, the folder itself) changed inside the window
      let t = st.mtimeMs; if (st.isDirectory()) { try { t = Math.max(t, (await fs.promises.stat(path.join(g, "index"))).mtimeMs, (await fs.promises.stat(path.join(g, "logs", "HEAD"))).mtimeMs); } catch { /* fresh repo */ } }
      if (t < since) continue;
      const real = await fs.promises.realpath(c); if (seen.has(real)) continue; seen.add(real); out.push(c);
    } catch { /* not a repo */ }
  }
  return out;
}

/** "github.com/owner/repo" from a remote URL (https or ssh); "" for anything else. */
export function remoteSlug(url: string): string {
  const m = /github\.com[:/]+([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/.exec(String(url || "").trim());
  return m ? `${m[1]}/${m[2]}`.toLowerCase() : "";
}
export interface RepoLines { slug: string; days: DayLines }
export interface GitLinesDetail { days: DayLines; repos: RepoLines[] }

let memo: { key: string; at: number; v: GitLinesDetail | undefined } | null = null;
/** Lines added/removed per day (the owner's local calendar day) over the last `days` days, in total and per repo (with
 *  the repo's GitHub "owner/name" when it has one, so the page can name PUBLIC repos only); undefined when there are no
 *  repos to read (unknown, not zero). Memoized for 15 minutes: publishing runs often. */
export async function gitLinesDetail(m: NodeMods, days = 14, extra: string[] = []): Promise<GitLinesDetail | undefined> {
  const key = days + "|" + extra.join(","); if (memo && memo.key === key && memo.at > Date.now() - 15 * 60_000) return memo.v;
  const repos = await findRepos(m, days, extra);
  let v: GitLinesDetail | undefined;
  if (repos.length) {
    v = { days: {}, repos: [] }; const seenCommon = new Set<string>();
    const one = async (r: string) => {
      let email = ""; try { email = (await run(m, ["config", "user.email"], r)).trim(); } catch { /* no identity: count every author */ }
      let slug = "", common = ""; try { slug = remoteSlug((await run(m, ["remote", "get-url", "origin"], r)).trim()); } catch { /* no remote */ }
      try { const c = (await run(m, ["rev-parse", "--git-common-dir"], r)).trim(); common = c ? (m.path.isAbsolute?.(c) ? c : m.path.join(r, c)) : ""; } catch { /* old git */ }
      if (common) { if (seenCommon.has(common)) return; seenCommon.add(common); }   // a worktree of a repo already read
      try {
        const out = await run(m, ["log", `--since=${days}.days`, "--no-merges", "--numstat", "--date=format-local:%Y-%m-%d", "--pretty=format:%x1e%ad%x1f%ae", ...(email ? [`--author=<${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>`] : [])], r);
        const mine = parseNumstat(out); if (!Object.keys(mine).length) return;
        if (slug && v!.repos.some(x => x.slug === slug)) return;   // the same repo checked out twice (a worktree, a second clone) counts once
        v!.repos.push({ slug, days: mine });
        for (const [d, x] of Object.entries(mine)) { const e = v!.days[d] || (v!.days[d] = { added: 0, removed: 0 }); e.added += x.added; e.removed += x.removed; }
      } catch { /* not readable: skip */ }
    };
    for (let i = 0; i < repos.length; i += 4) await Promise.all(repos.slice(i, i + 4).map(one));   // 4 at a time
  }
  memo = { key, at: Date.now(), v };
  return v;
}
/** Totals only (the daily counts). */
export async function gitLines(m: NodeMods, days = 14, extra: string[] = []): Promise<DayLines | undefined> {
  return (await gitLinesDetail(m, days, extra))?.days;
}

/** The "Lines of code" section: 90 days of lines added/removed (every repo on this computer, private ones included in
 *  the totals only), and a 30-day breakdown for the repos the public page already names (public repos, and private ones
 *  in "named" mode that aren't hidden): a repo the public city doesn't name is never named here either. An owner tool's
 *  linesAdded/linesRemoved in activity.json wins for its days. */
export function linesOfCode(g: { days: Record<string, { added: number; removed: number }>; repos: { slug: string; days: Record<string, { added: number; removed: number }> }[] },
  city: CityData | undefined, external?: Map<string, any>, now = Date.now()): { days: [string, number, number][]; repos: [string, string, number, number][] } {
  const days: [string, number, number][] = [];
  for (let i = 89; i >= 0; i--) { const d = isoDay(now - i * DAY), x = external?.get(d), y = g.days[d];
    days.push(typeof x?.linesAdded === "number" ? [d, Math.max(0, Math.round(x.linesAdded)), Math.max(0, Math.round(Number(x.linesRemoved) || 0))] : [d, y?.added || 0, y?.removed || 0]); }
  const named = new Map<string, { name: string; url?: string }>();   // owner/name or name -> how the page shows it
  for (const dist of city?.districts || []) for (const r of dist.repos) {
    if (r.kind || r.locked || !r.name) continue;
    const m = /^https:\/\/github\.com\/([^/]+\/[^/]+?)\/?$/.exec(r.url || "");
    if (m && r.public) named.set(m[1].toLowerCase(), { name: r.name, url: r.url });
    else named.set("~" + r.name.toLowerCase(), { name: r.name });   // a private repo the page shows by name: matched by name, never linked
  }
  const from = isoDay(now - 29 * DAY), repos: [string, string, number, number][] = [];
  for (const r of g.repos) {
    if (!r.slug) continue;
    const hit = named.get(r.slug) || named.get("~" + r.slug.split("/")[1]); if (!hit) continue;
    let a = 0, rm = 0; for (const [d, x] of Object.entries(r.days)) if (d >= from) { a += x.added; rm += x.removed; }
    if (a + rm > 0) repos.push([hit.name, hit.url || "", a, rm]);
  }
  repos.sort((x, y) => (y[2] + y[3]) - (x[2] + x[3]));
  return { days, repos: repos.slice(0, 12) };
}
