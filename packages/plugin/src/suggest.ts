/**
 * Suggestions that fill a page from what's already there, always for the owner to approve: topics from the tags the
 * vault actually uses (the default allow-list rarely matches anyone's tags, so most pages showed none), and a headline
 * from the owner's public GitHub bio. Nothing here publishes on its own.
 */
import { App, getAllTags, requestUrl } from "obsidian";

/** structural tags (what a note IS, not what it's about) and deal paperwork: entity, pdf, email-attachment, daily-digest... */
const STRUCTURAL = /^(entity|entities|company|companies|org|orgs|organization|concept|concepts|note|notes|index|moc|hub|stub|other|misc|reference|references|ref|file|files|image|images|img|pdf|doc|docs|document|documents|attachment|attachments|email|emails|mail|report|reports|contract|contracts|proposal|proposals|nda|invoice|invoices|receipt|receipts|data-room|dataroom|deck|decks|pitch-deck|startup-deck|transcript|transcripts|summary|summaries|digest|clip|web-clip|article|articles|bookmark|bookmarks|highlight|highlights|book-notes|imported|import|sync|auto|generated|ai-generated|wiki)$|(^|-)(pdf|email|attachment|digest|deck|transcript|import|imported)(-|$)/i;
/** tags that are workflow or private by nature: never suggested (the owner can still add them by hand) */
const SKIP = /^(private|personal|secret|todo|to-do|task|tasks|done|doing|wip|draft|inbox|archive|archived|daily|weekly|monthly|journal|diary|meeting|meetings|1on1|one-on-one|people|person|contact|contacts|family|health|medical|therapy|money|finance|finances|bank|tax|taxes|legal|client|clients|password|passwords|template|templates|excalidraw|status|type|source|sources|clippings|clipping|review|readwise|untagged|todo-later|idea-status)$|^(status|type|source|area|people|person|project-status|log)\//i;

export interface TagSuggestion { tag: string; count: number; label: string }

const ACRONYMS: Record<string, string> = { ai: "AI", ml: "ML", llm: "LLM", llms: "LLMs", ux: "UX", ui: "UI", vc: "VC", saas: "SaaS", api: "API", nlp: "NLP", seo: "SEO", cpg: "CPG", b2b: "B2B", b2c: "B2C", ios: "iOS", pkm: "PKM", gtd: "GTD", dao: "DAO", nft: "NFT", vr: "VR", ar: "AR", iot: "IoT", devops: "DevOps", js: "JS", ts: "TS" };

/** "#tools-for-thought" -> "Tools for thought", "ai" -> "AI", "dev/rust" -> "Rust" */
export function labelOf(tag: string): string {
  const last = tag.replace(/^#/, "").split("/").pop() || tag;
  const words = last.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().split(/\s+/);
  return words.map((w, i) => ACRONYMS[w.toLowerCase()] || (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(" ").slice(0, 40);
}

/** The vault's own tags, most used first: at least 2 notes each, workflow/private tags and dates left out. */
function tagCounts(app: App): Map<string, number> {
  const counts = new Map<string, number>();
  for (const f of app.vault.getMarkdownFiles()) {
    if (f.path.startsWith("Caldera/")) continue;
    const cache = app.metadataCache.getFileCache(f); if (!cache) continue;
    for (const t of new Set((getAllTags(cache) || []).map(x => x.replace(/^#/, "").toLowerCase()))) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}
export function vaultTags(app: App, limit = 30): TagSuggestion[] {
  return [...tagCounts(app).entries()]
    .filter(([t, n]) => n >= 2 && t.length >= 2 && t.length <= 40 && !SKIP.test(t) && !STRUCTURAL.test(t) && !/^\d/.test(t) && !/\d{4}/.test(t))
    .sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([tag, count]) => ({ tag, count, label: labelOf(tag) }));
}

/** How many of the current public topics the vault actually uses (0 = the page shows no topics). */
export function topicsInUse(app: App, publicTopics: [string, string][]): number {
  const used = tagCounts(app);   // any tag in use counts, even one we'd never suggest
  return publicTopics.filter(([t]) => used.has(t.replace(/^#/, "").toLowerCase())).length;
}

/** The GitHub login in the owner's links, if any. */
export function githubLogin(links: [string, string][]): string | null {
  for (const [, u] of links) { const m = String(u).match(/^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/?$/); if (m) return m[1]!; }
  return null;
}

/** The public GitHub bio, as a headline suggestion (one line, trimmed). */
export async function githubBio(login: string): Promise<string | null> {
  try {
    const r = await requestUrl({ url: `https://api.github.com/users/${encodeURIComponent(login)}`, headers: { accept: "application/vnd.github+json" }, throw: false });
    const bio = r.status === 200 ? String(r.json?.bio || "").replace(/\s+/g, " ").trim() : "";
    return bio ? bio.slice(0, 160) : null;
  } catch { return null; }
}
