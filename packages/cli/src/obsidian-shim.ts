/** Minimal stand-in for the Obsidian API, enough for collect.ts to read a vault folder from disk. */
import fs from "node:fs";
import path from "node:path";

export class TFile {
  constructor(public path: string, public abs: string) {}
  get basename() { return path.basename(this.path).replace(/\.[^.]+$/, ""); }
  get extension() { return path.extname(this.path).slice(1); }
  get stat() { const s = fs.statSync(this.abs); return { ctime: s.birthtimeMs || s.ctimeMs, mtime: s.mtimeMs, size: s.size }; }
}

function parseFrontmatter(text: string): Record<string, any> {
  const m = text.match(/^---\n([\s\S]*?)\n---/); if (!m) return {};
  const out: Record<string, any> = {}; let key = "";
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      key = kv[1]; let v: any = kv[2].trim();
      if (v.startsWith("[") && v.endsWith("]")) v = v.slice(1, -1).split(",").map((x: string) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      else if (v === "") v = [];
      else v = v.replace(/^["']|["']$/g, "");
      out[key] = v;
    } else { const li = line.match(/^\s*-\s+(.*)$/); if (li && key && Array.isArray(out[key])) out[key].push(li[1].trim().replace(/^["']|["']$/g, "")); }
  }
  return out;
}

export function getAllTags(cache: any): string[] { return cache?.tags || []; }

export class App {
  vault: any; metadataCache: any;
  constructor(root: string) {
    const files: TFile[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith(".") || e.name === "node_modules") continue;
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) walk(abs); else files.push(new TFile(path.relative(root, abs).split(path.sep).join("/"), abs));
      }
    };
    walk(root);
    const byPath = new Map(files.map(f => [f.path, f]));
    const cache = new Map<string, any>();
    this.vault = {
      adapter: { getBasePath: () => root }, configDir: ".obsidian",
      getMarkdownFiles: () => files.filter(f => f.extension === "md"),
      getAbstractFileByPath: (p: string) => byPath.get(p) || null,
      cachedRead: async (f: TFile) => fs.readFileSync(f.abs, "utf8"),
      readBinary: async (f: TFile) => { const b = fs.readFileSync(f.abs); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); },
    };
    const byBase = new Map(files.flatMap(f => [[f.basename.toLowerCase(), f], [path.basename(f.path).toLowerCase(), f]] as [string, TFile][]));
    this.metadataCache = {
      resolvedLinks: {}, unresolvedLinks: {},
      getFirstLinkpathDest: (link: string) => byPath.get(link) || byBase.get(link.split("/").pop()!.toLowerCase()) || byBase.get(link.split("/").pop()!.replace(/\.md$/i, "").toLowerCase()) || null,
      getFileCache: (f: TFile) => {
        if (cache.has(f.path)) return cache.get(f.path);
        const text = fs.readFileSync(f.abs, "utf8");
        const fm = parseFrontmatter(text);
        const fmTags = ([] as string[]).concat(fm.tags || []).map(t => "#" + String(t).replace(/^#/, ""));
        const inline = [...text.replace(/^---[\s\S]*?---/, "").matchAll(/(?:^|\s)#([A-Za-z][\w/-]*)/g)].map(m => "#" + m[1]);
        const c = { frontmatter: fm, links: [...text.matchAll(/\[\[[^\]]+\]\]/g)], embeds: [], tags: [...fmTags, ...inline] };
        cache.set(f.path, c); return c;
      },
    };
  }
}

export const Platform = { isDesktop: true, isDesktopApp: true, isMobile: false, isMobileApp: false, isMacOS: process.platform === "darwin" };

/** Obsidian's requestUrl, on Node's fetch (enough for collect.ts / auto.ts). */
export async function requestUrl(o: { url: string; method?: string; headers?: Record<string, string>; body?: string; throw?: boolean }) {
  const r = await fetch(o.url, { method: o.method || "GET", headers: o.headers, body: o.body });
  const text = await r.text();
  if (o.throw !== false && r.status >= 400) throw new Error(`request failed ${r.status}`);
  let json: any; try { json = JSON.parse(text); } catch { json = undefined; }
  return { status: r.status, text, json, headers: Object.fromEntries(r.headers) };
}
