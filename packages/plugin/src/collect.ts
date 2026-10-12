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
import { slug, type DailyEntry, type ProfileData } from "./render";
import type { CalderaSettings } from "./settings";
import { publicTextFilter } from "@caldera/core";
import { aiUsage, githubCode, vaultKinds } from "./auto";

const DAY = 86_400_000;
const fmtN = (n: number) => n.toLocaleString("en-US");
// the owner's local calendar day (UTC would roll 'today' over hours early for anyone west of Greenwich)
const iso = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

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
    links += (cache?.links?.length || 0) + (cache?.embeds?.length || 0) + (cache?.frontmatterLinks?.length || 0);   // links in properties live in frontmatterLinks
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
  let extra: any = {};   // optional extras from the owner's tools: knows, inbox, code, projects (commit counts), numbers
  const actFile = app.vault.getAbstractFileByPath(s.activityFile);
  if (actFile instanceof TFile) {
    try { extra = JSON.parse(await app.vault.cachedRead(actFile)) || {}; for (const d of extra.days || []) external.set(d.date, d); } catch { /* ignore malformed */ }
  }
  // sections every install gets on its own (owner tools in activity.json win): AI usage, Code
  if (s.sections.ai !== false && !(extra.ai && typeof extra.ai.total === "number")) {
    const base = (app.vault.adapter as any).getBasePath?.();
    const ai = base ? await aiUsage(`${base}/${app.vault.configDir}/plugins/caldera/ai-cache.json`).catch(() => undefined) : undefined;
    if (ai) {
      extra.ai = ai;
      for (const [d, n] of Object.entries(ai.days)) { const e = external.get(d) || { date: d }; if (!e.tokens) e.tokens = n; external.set(d, e); }
    }
  }
  if (s.sections.code !== false && !(extra.code && typeof extra.code.commits === "number")) {
    const code = await githubCode(s.links || []).catch(() => undefined);
    if (code) extra.code = code;
  }

  const today = Date.now();
  const daily: DailyEntry[] = [];
  // Journal text is the riskiest public text (often AI-written, daily, about real days). Every line passes the privacy
  // filter: lines naming people, places, meetings/times, secret work, money, legal/health/family matters are dropped.
  // Only words the owner already chose to publish count as safe names.
  const ownerPublic = [s.name, s.headline, ...(s.links || []).map(l => l[0]), ...(s.properties || []).map(p => p[1]), ...(s.publicTopics || []).map(t => t[1]),
    ...(s.projects || []).map(p => p[0]), ...(s.tree || []).flatMap(t => [t[0], ...t[1].split(",")]), ...(s.graph || []), ...(s.backlinks || []).map(b => b[0]), ...(s.tabs || [])].filter(Boolean).map(x => String(x).trim());
  const safe = publicTextFilter(ownerPublic);
  const clean = (xs: string[]) => xs.filter(x => safe(x));
  for (let i = s.historyDays - 1; i >= 0; i--) {
    const date = iso(today - i * DAY);
    const ext = external.get(date) || {};
    const j = journal.get(date) || {};
    daily.push({
      date,
      counts: { notes: Math.max(created.get(date) || 0, changed.get(date) || 0), meetings: ext.meetings, emails: ext.emails, prompts: ext.prompts, commits: ext.commits, docs: ext.docs },
      tokens: Number(ext.tokens) || undefined,
      headline: [j.headline || ext.headline].filter(h => h && safe(String(h)))[0], focus: clean(j.focus?.length ? j.focus : asList(ext.focus)), wins: clean(j.wins?.length ? j.wins : asList(ext.wins)),
      themes: clean(j.themes?.length ? j.themes : asList(ext.themes)),
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

  // how many notes link to a note with this name (a count only; titles of linking notes never leave the vault)
  const inbound = new Map<string, number>();
  const bump = (k: string) => inbound.set(k, (inbound.get(k) || 0) + 1);
  for (const targets of Object.values(app.metadataCache.resolvedLinks)) for (const t of Object.keys(targets)) bump(t.split("/").pop()!.replace(/\.md$/i, "").toLowerCase());
  for (const targets of Object.values(app.metadataCache.unresolvedLinks)) for (const t of Object.keys(targets)) bump(t.split("|")[0].split("/").pop()!.replace(/\.md$/i, "").toLowerCase());
  const linkCount = (name: string) => inbound.get(name.toLowerCase()) || 0;

  const topTopics = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const kinds = vaultKinds(app, md);   // generic note categories: the graph / sidebar fallback when there are no public topics
  const notesSorted = publicNotes.sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 12);
  // left sidebar: owner-chosen groups. Items become links when they match a project (its URL), a public note or a page
  // section; a group's optional folder shows a note count (count only, file names never leave the vault).
  const tree: NonNullable<ProfileData["tree"]> = [{ name: "People", child: false }, { name: s.name || "Me", child: true, current: true, href: "#top" }];
  const projUrl = new Map((s.projects || []).map(([n, rest]) => [n.toLowerCase(), (rest.split("|")[1] || "").trim()]));
  const noteIds = new Set(notesSorted.map(n => n.title.toLowerCase()));
  const hrefFor = (it: string): string | undefined => {
    const k = it.toLowerCase(), u = projUrl.get(k);
    if (u !== undefined) return /^https?:\/\//.test(u) ? u : "#projects";
    if (noteIds.has(k)) return "#" + slug("note-" + it);
    if (topTopics.some(t => t[0].toLowerCase() === k)) return "#topics";
    return undefined;
  };
  const folderCount = (folder?: string) => { if (!folder) return undefined; const pre = folder.replace(/^\/+|\/+$/g, "") + "/"; const n = md.filter(f => f.path.startsWith(pre)).length; return n || undefined; };
  const groups: [string, string[], string?][] = s.tree?.length ? s.tree.map(([g, items, folder]) => [g, items.split(",").map(x => x.trim()).filter(Boolean), folder])
    : [["Topics", topTopics.slice(0, 5).map(t => t[0])], ["Notes", notesSorted.slice(0, 5).map(n => n.title)]];
  if (!s.tree?.length && !topTopics.length && !notesSorted.length)
    for (const [label, n] of kinds) tree.push({ name: label, child: false, count: n });
  for (const [g, items, folder] of groups) {
    const count = folderCount(folder);
    if (!items.length && !count) continue;              // an empty group is noise
    tree.push({ name: g, child: false, count });
    for (const it of items) tree.push({ name: it, child: true, href: hrefFor(it) });
  }
  const graph = (s.graph?.length ? s.graph.map(n => ({ t: n, n: linkCount(n) })) : (topTopics.length ? topTopics : kinds).slice(0, 12).map(([t, n]) => ({ t, n }))).slice(0, 16);
  const backlinks: [string, string][] = s.backlinks?.length ? s.backlinks : notesSorted.slice(0, 6).map(n => [n.title, n.excerpt.slice(0, 70)]);

  // 26-week activity (notes created + changed per day, plus outside counts) and cumulative growth
  const DAYMS = 86_400_000, todayD = new Date(); todayD.setHours(12, 0, 0, 0);
  const startD = new Date(todayD.getTime() - (((todayD.getDay() + 6) % 7) + 7 * 25) * DAYMS);
  const heat: NonNullable<ProfileData["heat"]> = [];
  for (let t = startD.getTime(); t <= todayD.getTime(); t += DAYMS) {
    const d = iso(t), e = external.get(d) || {};
    heat.push({ date: d, n: (created.get(d) || 0) + (changed.get(d) || 0) + (Number(e.docs) || 0) });
  }
  const createdDays = [...created.keys()].sort();
  const growth: NonNullable<ProfileData["growth"]> = [];
  if (createdDays.length) {
    const first = new Date(createdDays[0] + "T12:00:00"); first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    let total = 0;
    for (let w = first.getTime(); w <= todayD.getTime(); w += 7 * DAYMS) {
      for (let k = 0; k < 7; k++) total += created.get(iso(w + k * DAYMS)) || 0;
      growth.push({ week: iso(w), total });
    }
  }
  const knows: [string, number][] = s.knows?.length
    ? s.knows.map(([label, folder]) => { const pre = folder.replace(/^\/+|\/+$/g, "") + "/"; return [label, md.filter(f => f.path.startsWith(pre)).length]; })
    : (Array.isArray(extra.knows) ? extra.knows.filter((k: any) => Array.isArray(k) && typeof k[1] === "number").map((k: any) => [String(k[0]), k[1]]) : kinds);
  const pc = extra.projects && typeof extra.projects === "object" ? extra.projects : {};
  const projects = (s.projects || []).map(([name, rest]) => { const [status = "", url = ""] = rest.split("|").map(x => x.trim()); return { name, status, url, commits: Number(pc[name]) || undefined }; });

  // browser-tab icon: the avatar cut to a circle, zoomed to the upper middle where a portrait's face usually is
  const avatarPath = await img(s.avatarPath, "avatar");
  let icon: string | undefined;
  if (avatarPath) try {
    const bmp = await createImageBitmap(new Blob([files[avatarPath]]));
    const N = 128, side = Math.min(bmp.width, bmp.height) * 0.75, sx = (bmp.width - side) / 2, sy = (bmp.height - side) * 0.12;   // zoom toward the face: tabs are 16-32px
    const cv = new OffscreenCanvas(N, N), cx = cv.getContext("2d")!;
    cx.beginPath(); cx.arc(N / 2, N / 2, N / 2, 0, Math.PI * 2); cx.clip();
    cx.drawImage(bmp, sx, sy, side, side, 0, 0, N, N);
    files["img/icon.png"] = await (await cv.convertToBlob({ type: "image/png" })).arrayBuffer(); icon = "img/icon.png";
  } catch { /* the renderer falls back to the Caldera logo */ }

  const data: ProfileData = {
    name: s.name || "Untitled", handle: s.handle || undefined, headline: s.headline, theme: s.theme,
    avatar: avatarPath, icon, banner: await img(s.bannerPath, "banner"),
    links: s.links.filter(l => l[0] && l[1]), properties: s.properties.filter(p => p[0] && p[1]),
    sections: s.sections,
    stats: { notes: md.length, words, links, activeDays },
    topics: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18),
    daily, publicNotes: notesSorted,
    tabs: s.tabs?.length ? s.tabs : undefined,
    summary: s.summary || undefined, now: s.now, timeline: s.timeline, projects, heat, growth, knows,
    inbox: extra.inbox && Array.isArray(extra.inbox.kinds) ? extra.inbox : undefined,
    code: extra.code && typeof extra.code.commits === "number" ? extra.code : undefined,
    ai: extra.ai && typeof extra.ai.total === "number" && Array.isArray(extra.ai.models) ? extra.ai : undefined,
    extraNumbers: Array.isArray(extra.numbers) ? extra.numbers.filter((x: any) => Array.isArray(x)).map((x: any) => [String(x[0]), String(x[1])]) : undefined,
    tree, graph, graphLabel: s.graph?.length ? "Local graph / sized by linked notes" : topTopics.length ? "Topics / sized by notes" : "The vault / sized by notes",
    backlinks, backlinkLabel: s.backlinks?.length ? `Backlinks / ${fmtN(linkCount(s.name || ""))} notes link here` : "Public notes",
    asks: s.asks, offers: s.offers, social, updated: new Date().toISOString(),
  };
  return { data, files };
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, 3);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

