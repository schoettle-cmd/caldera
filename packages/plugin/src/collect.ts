/**
 * Reads the vault (locally) and builds ProfileData. Only counts, public-marked notes and
 * explicit public journal fields ever leave the device.
 *
 * Conventions (all optional):
 *   frontmatter `caldera: public`            -> note listed on the public profile (title + first paragraph)
 *   frontmatter `caldera: friends`           -> note can be shared as a card with friends
 *   daily notes (any folder you choose) may carry public journal fields:
 *     caldera_headline: "..."  caldera_focus: [..]  caldera_wins: [..]  caldera_themes: [..]
 *   Caldera/activity.json                     -> extra daily counts from outside tools (calendar, email, git, ...):
 *     { "days": [ { "date": "2026-10-09", "meetings": 11, "emails": 60, "prompts": 144, "commits": 37,
 *                   "docs": 6, "headline": "...", "focus": [], "wins": [], "themes": [] } ] }
 */
import { App, TFile, getAllTags } from "obsidian";
import type { DailyEntry, ProfileData } from "./render";
import type { CalderaSettings } from "./settings";

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

export async function collectProfile(app: App, s: CalderaSettings, social?: ProfileData["social"]): Promise<{ data: ProfileData; files: Record<string, ArrayBuffer> }> {
  const md = app.vault.getMarkdownFiles();
  let words = 0, links = 0;
  const created = new Map<string, number>(), changed = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const allow = new Map(s.publicTopics.map(([tag, label]) => [tag.toLowerCase().replace(/^#/, ""), label]));
  const publicNotes: ProfileData["publicNotes"] = [];
  const journal = new Map<string, Partial<DailyEntry>>();

  for (const f of md) {
    created.set(iso(f.stat.ctime), (created.get(iso(f.stat.ctime)) || 0) + 1);
    changed.set(iso(f.stat.mtime), (changed.get(iso(f.stat.mtime)) || 0) + 1);
    const cache = app.metadataCache.getFileCache(f);
    links += (cache?.links?.length || 0) + (cache?.embeds?.length || 0);
    words += Math.round(f.stat.size / 6);                // fast estimate; avoids reading every file
    for (const t of (cache ? getAllTags(cache) || [] : [])) {
      const k = t.replace(/^#/, "").toLowerCase();
      if (allow.has(k)) tagCounts.set(allow.get(k)!, (tagCounts.get(allow.get(k)!) || 0) + 1);
    }
    const fm = cache?.frontmatter || {};
    if (String(fm.caldera || "").toLowerCase() === "public") {
      const text = await app.vault.cachedRead(f);
      const body = text.replace(/^---[\s\S]*?---\s*/, "");
      const para = body.split(/\n\s*\n/).map(x => x.replace(/^#+\s.*$/gm, "").trim()).find(x => x.length > 20) || "";
      publicNotes.push({ title: f.basename, excerpt: para.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1").slice(0, 280), updated: new Date(f.stat.mtime).toISOString() });
    }
    const dm = f.basename.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dm && (fm.caldera_headline || fm.caldera_focus || fm.caldera_wins)) {
      journal.set(dm[1], { headline: fm.caldera_headline, focus: asList(fm.caldera_focus), wins: asList(fm.caldera_wins), themes: asList(fm.caldera_themes) });
    }
  }

  // outside activity (calendar, email, git, AI sessions ...) written by your own scripts
  const external = new Map<string, any>();
  const actFile = app.vault.getAbstractFileByPath(s.activityFile);
  if (actFile instanceof TFile) {
    try { for (const d of JSON.parse(await app.vault.cachedRead(actFile)).days || []) external.set(d.date, d); } catch { /* ignore malformed */ }
  }

  const today = Date.now();
  const daily: DailyEntry[] = [];
  for (let i = s.historyDays - 1; i >= 0; i--) {
    const date = iso(today - i * DAY);
    const ext = external.get(date) || {};
    const j = journal.get(date) || {};
    daily.push({
      date,
      counts: { notes: Math.max(created.get(date) || 0, changed.get(date) || 0), meetings: ext.meetings, emails: ext.emails, prompts: ext.prompts, commits: ext.commits, docs: ext.docs },
      headline: j.headline || ext.headline, focus: j.focus?.length ? j.focus : asList(ext.focus), wins: j.wins?.length ? j.wins : asList(ext.wins),
      themes: j.themes?.length ? j.themes : asList(ext.themes),
    });
  }
  let activeDays = 0;
  for (let i = 0; i < 182; i++) { const d = iso(today - i * DAY); if ((created.get(d) || 0) + (changed.get(d) || 0) > 0) activeDays++; }

  const files: Record<string, ArrayBuffer> = {};
  const img = async (vaultPath: string, name: string) => {
    const f = vaultPath && app.vault.getAbstractFileByPath(vaultPath);
    if (f instanceof TFile) { const out = `img/${name}.${f.extension}`; files[out] = await app.vault.readBinary(f); return out; }
    return undefined;
  };

  const data: ProfileData = {
    name: s.name || "Untitled", handle: s.handle || undefined, headline: s.headline, theme: s.theme,
    avatar: await img(s.avatarPath, "avatar"), banner: await img(s.bannerPath, "banner"),
    links: s.links.filter(l => l[0] && l[1]), properties: s.properties.filter(p => p[0] && p[1]),
    sections: s.sections,
    stats: { notes: md.length, words, links, activeDays },
    topics: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18),
    daily, publicNotes: publicNotes.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 12),
    asks: s.asks, offers: s.offers, social, updated: new Date().toISOString(),
  };
  return { data, files };
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, 3);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}
