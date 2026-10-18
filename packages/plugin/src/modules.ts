/**
 * Custom profile modules: one Markdown note per section in Caldera/modules/, written by the owner or their AI agent.
 * Frontmatter: title (default: the file name), place (main | side), order (lower first, default 50), publish (false = draft).
 * The body is ordinary Markdown (headings, lists, tables, quotes, links, images from the vault). It renders through the
 * same safe Markdown as the rest of the page: no HTML, no scripts, no embeds; email addresses and phone numbers are removed.
 */
import { TFile, type App } from "obsidian";
import { moduleHtml, redact } from "./garden";
import { slug } from "./render";

export const MODULES_FOLDER = "Caldera/modules";
export const MODULE_LIMITS = { count: 12, chars: 20_000, imgMax: 2_000_000, imgTotal: 6_000_000 };
const IMG_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export interface ProfileModule { title: string; slug: string; place: "main" | "side"; order: number; html: string }
export interface ModuleReport { path: string; title: string; place: string; published: boolean; removed: number; why?: string }

export async function collectModules(app: App, hub: string): Promise<{ modules: ProfileModule[]; files: Record<string, ArrayBuffer>; report: ModuleReport[] }> {
  const pre = MODULES_FOLDER + "/";
  const picked = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(pre) && !f.path.slice(pre.length).includes("/") && !/^_|^README$/i.test(f.basename))
    .sort((a, b) => a.basename.localeCompare(b.basename));
  const modules: ProfileModule[] = [], files: Record<string, ArrayBuffer> = {}, report: ModuleReport[] = [];
  const used = new Set<string>(); let imgTotal = 0;
  for (const f of picked) {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    const title = String(fm.title || f.basename).replace(/\s+/g, " ").trim().slice(0, 80) || f.basename;
    const place: "main" | "side" = /^(side|sidebar|rail|right)$/i.test(String(fm.place || "")) ? "side" : "main";
    const r: ModuleReport = { path: f.path, title, place, published: false, removed: 0 };
    report.push(r);
    if (fm.publish === false || String(fm.publish).toLowerCase() === "false") { r.why = "draft (publish: false)"; continue; }
    if (modules.length >= MODULE_LIMITS.count) { r.why = `only ${MODULE_LIMITS.count} modules show`; continue; }
    const raw = (await app.vault.cachedRead(f)).replace(/^---[\s\S]*?\n---\s*/, "").replace(/%%[\s\S]*?%%/g, "").trim();
    if (!raw) { r.why = "empty"; continue; }
    const { text, removed } = redact(raw.slice(0, MODULE_LIMITS.chars)); r.removed = removed;
    let sl = "m-" + slug(title), k = 2; while (used.has(sl)) sl = `m-${slug(title)}-${k++}`; used.add(sl);
    const images: Record<string, string> = {};
    for (const m of text.matchAll(/!\[\[([^\]|#]+)/g)) {
      const t = m[1].trim(); if (images[t]) continue;
      const dest = ((app.metadataCache as any).getFirstLinkpathDest?.(t, f.path) as TFile | null) ?? (app.vault.getAbstractFileByPath(t) as TFile | null);
      if (!(dest instanceof TFile) || !IMG_EXT.has(dest.extension.toLowerCase()) || dest.stat.size > MODULE_LIMITS.imgMax || imgTotal + dest.stat.size > MODULE_LIMITS.imgTotal) continue;
      const out = `m/img/${slug(dest.basename)}-${dest.stat.size}.${dest.extension.toLowerCase()}`;
      files[out] = await app.vault.readBinary(dest); imgTotal += dest.stat.size; images[t] = out;
    }
    const order = Number.isFinite(Number(fm.order)) ? Number(fm.order) : 50;
    modules.push({ title, slug: sl, place, order, html: moduleHtml(text, hub, t => images[t] || null) });
    r.published = true;
  }
  modules.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return { modules, files, report };
}
