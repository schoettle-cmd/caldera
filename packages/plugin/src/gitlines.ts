/**
 * Lines of code added and removed per day, from the git repositories on this computer (desktop only).
 *
 * - Only counts leave the device (lines added / removed per day, summed over every repo): never repo names, paths,
 *   file names or code. They ride in the daily counts as linesAdded / linesRemoved, which are NOT part of the score.
 * - Which repos: folders right under your home folder and under the usual code folders (~/code, ~/src, ~/projects ...),
 *   plus any folders you list in Settings > Caldera. Protected macOS folders (Documents, Desktop, Downloads ...) are
 *   never touched, so Obsidian never asks for access. Only repos touched in the window are read.
 * - Whose lines: each repo's own git user.email (your commits, not your teammates'). Merges, lockfiles, build output,
 *   vendored and minified files don't count, nor do single-file changes over 5,000 lines (generated or imported code).
 *
 * Pure apart from the Node modules passed in, so it runs under Node in tests.
 */
export interface NodeMods { fs: any; path: any; os: any; cp: any }
export type DayLines = Record<string, { added: number; removed: number }>;

const PROTECTED = new Set(["Library", "Desktop", "Documents", "Downloads", "Pictures", "Movies", "Music", "Public", "Applications", "Dropbox", "Google Drive", "OneDrive", "Creative Cloud Files", "node_modules"]);
const CODE_DIRS = ["code", "Code", "src", "dev", "Dev", "projects", "Projects", "repos", "git", "GitHub", "github", "work", "Developer", "Sites", "workspace"];
const GENERATED = /(^|\/)(node_modules|dist|build|out|vendor|third_party|\.next|coverage|__pycache__)\/|(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|poetry\.lock|Pipfile\.lock|uv\.lock|Gemfile\.lock|composer\.lock|go\.sum)$|\.min\.(js|css)$|\.(map|snap)$/;
const MAX_FILE_LINES = 5000, MAX_REPOS = 80;

/** `git log --numstat` output (records start with \x1e, header "date\x1femail") -> lines per day. */
export function parseNumstat(out: string, into: DayLines = {}): DayLines {
  for (const rec of out.split("\x1e")) {
    const lines = rec.split("\n"), head = (lines[0] || "").split("\x1f"), day = (head[0] || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    for (const l of lines.slice(1)) {
      const m = /^(\d+)\t(\d+)\t(.+)$/.exec(l.trim()); if (!m) continue;   // "-\t-\tfile" = binary: skipped
      const a = Number(m[1]), d = Number(m[2]), file = m[3]!.replace(/^.*=> /, "").replace(/[{}]/g, "");
      if (GENERATED.test(file) || a > MAX_FILE_LINES || d > MAX_FILE_LINES) continue;
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

let memo: { key: string; at: number; v: DayLines | undefined } | null = null;
/** Lines added/removed per day (the owner's local calendar day) over the last `days` days; undefined when there are no
 *  repos to read (unknown, not zero). Memoized for 15 minutes: publishing runs often. */
export async function gitLines(m: NodeMods, days = 14, extra: string[] = []): Promise<DayLines | undefined> {
  const key = days + "|" + extra.join(","); if (memo && memo.key === key && memo.at > Date.now() - 15 * 60_000) return memo.v;
  const repos = await findRepos(m, days, extra);
  let v: DayLines | undefined;
  if (repos.length) {
    v = {};
    const one = async (r: string) => {
      let email = ""; try { email = (await run(m, ["config", "user.email"], r)).trim(); } catch { /* no identity: count every author */ }
      try {
        const out = await run(m, ["log", `--since=${days}.days`, "--no-merges", "--numstat", "--date=format-local:%Y-%m-%d", "--pretty=format:%x1e%ad%x1f%ae", ...(email ? [`--author=<${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}>`] : [])], r);
        parseNumstat(out, v!);
      } catch { /* not readable: skip */ }
    };
    for (let i = 0; i < repos.length; i += 4) await Promise.all(repos.slice(i, i + 4).map(one));   // 4 at a time
  }
  memo = { key, at: Date.now(), v };
  return v;
}
