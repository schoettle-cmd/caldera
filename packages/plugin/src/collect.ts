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
import { publicTextFilter, gardenEnabled } from "@caldera/core";
import { requestUrl } from "obsidian";
import { parseListings, toListing, withListingsPrivate, withListingsPublic, type Listing, type ListingMeta, type ListingRef } from "./listings";
import { aiUsage, localGitLines, forgeOf, forgeSource, forgejoCity, forgejoCode, githubCity, githubCode, githubRepoSig, vaultKinds } from "./auto";
import { cityData, parseCityRepos, publicCity, underground, vaultRepos, type CityData } from "./city";
import { collectModules, type ModuleReport } from "./modules";
import { excerptOf, journalGarden, normLicense, normStage, parseXLink, redact, type GardenNote, type JournalDay } from "./garden";

const DAY = 86_400_000;
const fmtN = (n: number) => n.toLocaleString("en-US");
// the owner's local calendar day (UTC would roll 'today' over hours early for anyone west of Greenwich)
const iso = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export async function collectProfile(app: App, s: CalderaSettings, social?: ProfileData["social"]): Promise<{ data: ProfileData; files: Record<string, ArrayBuffer>; gardenReport: GardenReport[]; modulesReport: ModuleReport[]; cityPrivate?: CityData }> {
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

  // the garden is paused (core flags.ts): nothing is collected, so nothing is published, listed or linked
  const { garden, gardenImages, gardenFiles, gardenReport } = gardenEnabled() ? await collectGarden(app, s, md) : { garden: [] as GardenNote[], gardenImages: {} as Record<string, string>, gardenFiles: {} as Record<string, ArrayBuffer>, gardenReport: [] as GardenReport[] };

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
    const fg = forgeOf(s.links || []);
    const code = await (fg?.kind === "forgejo" ? forgejoCode(fg) : githubCode(s.links || [])).catch(() => undefined);
    if (code) extra.code = code;
  }

  // lines of code added/removed per day from this computer's git repos (counts only; not part of the score). An owner
  // tool's linesAdded/linesRemoved in activity.json wins; days we can't know stay empty (never a made-up 0).
  const gitDays = s.gitLines === false ? undefined : await localGitLines(14, String(s.gitFolders || "").split(/[\n,]+/).map(x => x.trim()).filter(Boolean)).catch(() => undefined);
  const gitFrom = iso(Date.now() - 13 * DAY);
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
      counts: { notes: Math.max(created.get(date) || 0, changed.get(date) || 0), meetings: ext.meetings, emails: ext.emails, prompts: ext.prompts, commits: ext.commits, docs: ext.docs,
        ...(typeof ext.linesAdded === "number" ? { linesAdded: ext.linesAdded, linesRemoved: Number(ext.linesRemoved) || 0 }
          : gitDays && date >= gitFrom ? { linesAdded: gitDays[date]?.added || 0, linesRemoved: gitDays[date]?.removed || 0 } : {}) },
      tokens: Number(ext.tokens) || undefined,
      headline: [j.headline || ext.headline].filter(h => h && safe(String(h)))[0], focus: clean(j.focus?.length ? j.focus : asList(ext.focus)), wins: clean(j.wins?.length ? j.wins : asList(ext.wins)),
      themes: clean(j.themes?.length ? j.themes : asList(ext.themes)),
    });
  }
  // the garden also grows on its own from the public journal (text above already passed the privacy filter)
  // while paused the journal history is still kept (so pages can grow again later), but nothing is planted
  if (s.gardenJournal !== false && s.sections.garden !== false) await growGardenFromJournal(app, s, daily, gardenEnabled() ? garden : [], gardenEnabled() ? gardenReport : []);

  let activeDays = 0;
  for (let i = 0; i < 182; i++) { const d = iso(today - i * DAY); if ((created.get(d) || 0) + (changed.get(d) || 0) > 0) activeDays++; }

  const files: Record<string, ArrayBuffer> = {};
  const img = async (vaultPath: string, name: string) => {
    const f = vaultPath && app.vault.getAbstractFileByPath(vaultPath);
    // images only, and not huge: a mistyped path can't publish a note, a PDF or a key file as your "photo"
    if (f instanceof TFile && /^(png|jpe?g|gif|webp|avif|svg)$/i.test(f.extension) && f.stat.size <= 8 * 1024 * 1024) {
      const out = `img/${name}.${f.extension.toLowerCase()}`; files[out] = await app.vault.readBinary(f); return out; }
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
  // names linked in the timeline ([[Name|https://...]]) are public already: the sidebar links them the same way
  for (const [, t] of s.timeline || []) for (const m of String(t).matchAll(/\[\[([^|\]]+)\|(https?:\/\/[^\]\s]+)\]\]/g)) if (!projUrl.has(m[1].trim().toLowerCase())) projUrl.set(m[1].trim().toLowerCase(), m[2]);
  const noteIds = new Set(notesSorted.map(n => n.title.toLowerCase()));
  const hrefFor = (it: string): string | undefined => {
    const k = it.toLowerCase(), u = projUrl.get(k);
    if (u !== undefined) return /^https?:\/\//.test(u) ? u : "#projects";
    const g = garden.find(n => n.title.toLowerCase() === k); if (g) return `n/${g.slug}.html`;
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
    const count = items.length || folderCount(folder);   // a hand-picked list counts its own items, not every note in the folder
    if (!items.length && !count) continue;              // an empty group is noise
    tree.push({ name: g, child: false, count });
    for (const it of items) tree.push({ name: it, child: true, href: hrefFor(it) });
  }
  if (garden.length && s.sections.garden !== false && !tree.some(t => !t.child && t.name.toLowerCase() === "garden")) {
    tree.push({ name: "Garden", child: false, count: garden.length, href: "garden.html" });
    for (const n of [...garden].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6)) tree.push({ name: n.title, child: true, href: `n/${n.slug}.html` });
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
    // never "Untitled": the handle until they set a name
    name: s.name || s.handle || "Your name", handle: s.handle || undefined, headline: s.headline, theme: s.theme,
    avatar: avatarPath, icon, banner: await img(s.bannerPath, "banner"),
    links: s.links.filter(l => l[0] && l[1]), properties: s.properties.filter(p => p[0] && p[1]),
    sections: s.sections,
    stats: { notes: md.length, words, links, activeDays },
    topics: [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18),
    daily, publicNotes: notesSorted,
    tabs: s.tabs?.length ? s.tabs : undefined,
    summary: s.summary || undefined, ...nowOf(s, daily), timeline: s.timeline, projects, heat, growth, knows,
    inbox: extra.inbox && Array.isArray(extra.inbox.kinds) ? extra.inbox : undefined,
    code: extra.code && typeof extra.code.commits === "number" ? extra.code : undefined,
    ai: extra.ai && typeof extra.ai.total === "number" && Array.isArray(extra.ai.models) ? extra.ai : undefined,
    extraNumbers: Array.isArray(extra.numbers) ? extra.numbers.filter((x: any) => Array.isArray(x)).map((x: any) => [String(x[0]), String(x[1])]) : undefined,
    tree, graph, graphLabel: s.graph?.length ? "Local graph / sized by linked notes" : topTopics.length ? "Topics / sized by notes" : "The vault / sized by notes",
    backlinks, backlinkLabel: s.backlinks?.length ? `Backlinks / ${fmtN(linkCount(s.name || ""))} notes link here` : "Public notes",
    asks: s.asks, offers: s.offers, social, updated: new Date().toISOString(),
    garden: garden.length ? garden : undefined, gardenExternal: gardenEnabled() ? s.gardenUrl || undefined : undefined, gardenImages,
  };
  Object.assign(files, gardenFiles);
  // custom modules: Caldera/modules/*.md, one section each (the owner's or their agent's own Markdown)
  let modulesReport: ModuleReport[] = [];
  if (s.sections.modules !== false) { const mo = await collectModules(app, s.hubUrl || "https://caldera.social"); if (mo.modules.length) data.modules = mo.modules; Object.assign(files, mo.files); modulesReport = mo.report; }
  // Caldera City: Caldera/city.json (repos + commit counts, written by the owner's tools). Houses = notes linking to the project's note.
  let cityPrivate: CityData | undefined, cityPublicBase: CityData | undefined;
  if (s.sections.city !== false) {
    try {
      const path = "Caldera/city.json";
      // no tools of your own writing city.json: build it from the GitHub in your Links (refreshed every 6 hours)
      const fg = forgeOf(s.links || []), src = fg && forgeSource(fg);
      let cur: any; try { if (await app.vault.adapter.exists(path)) cur = JSON.parse(await app.vault.adapter.read(path)); } catch { /* rebuilt below */ }
      const ours = !cur || /^caldera (github|forgejo) /.test(String(cur.source || ""));
      // a new or removed repo rebuilds now; otherwise the numbers refresh every 6 hours
      const sig = fg && ours && fg.kind === "github" ? await githubRepoSig(fg.user).catch(() => undefined) : undefined;
      if (fg && ours && (cur?.source !== src || (sig && cur?.sig !== sig) || Date.now() - Date.parse(cur?.generated || 0) > 6 * 3600_000)) {
        const prev = cur?.source === src ? cur : undefined;
        const fresh = await (fg.kind === "github" ? githubCity(fg.user, prev) : forgejoCity(fg, prev)).catch(() => undefined);
        if (fresh && sig) fresh.sig = sig;
        if (fresh) { if (!(await app.vault.adapter.exists("Caldera"))) await app.vault.createFolder("Caldera"); await app.vault.adapter.write(path, JSON.stringify(fresh, null, 1)); }
      }
      const priv = new Set(md.filter(f => app.metadataCache.getFileCache(f)?.frontmatter?.caldera === "private").map(f => f.path));
      const inVault = (f: TFile) => !f.path.startsWith("Caldera/") && !/(^|\/)(templates?|\.trash)\//i.test(f.path) && !priv.has(f.path);
      const raw = (await app.vault.adapter.exists(path)) ? JSON.parse(await app.vault.adapter.read(path)) : undefined;
      // no GitHub and no city.json of your own: the city is built from the vault's folders, every building locked
      const fromVault = !raw && !fg;
      if (raw || fromVault) {
        const fromGithub = !!raw && /^caldera (github|forgejo) /.test(String(raw.source || ""));   // built from public repos
        const repos = raw ? parseCityRepos(raw) : vaultRepos(md.filter(inVault).map(f => ({ path: f.path, mtime: f.stat.mtime })));
        if (repos.length) {
          const byName = new Map(md.map(f => [f.basename.toLowerCase(), f.path] as const));
          const resolved = app.metadataCache.resolvedLinks;
          const notes = (project: string) => {
            const target = byName.get(project.toLowerCase()); if (!target) return { n: 0, paths: [] as string[] };
            const src = md.filter(f => resolved[f.path]?.[target]).sort((a, b) => b.stat.mtime - a.stat.mtime);
            return { n: src.length, paths: [target, ...src.slice(0, 5).map(f => f.path)] };
          };
          cityPrivate = cityData(repos, notes, typeof raw?.generated === "string" ? raw.generated : new Date().toISOString());
          if (fromVault) cityPrivate.kind = "vault";
          // the Underground: the vault itself, under the city
          // a note's real age: the earliest date it carries (created / date / notion_edited / ingested, or a date in its
          // name), else the file's own; imported and synced files often have fresh file dates
          const bornAt = (f: TFile) => {
            const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
            const ts = [fm.created, fm.date, fm.notion_created, fm.notion_edited, fm.ingested, f.basename.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1]]
              .map(v => typeof v === "string" || typeof v === "number" ? Date.parse(String(v)) : NaN).filter(t => t > 946684800000 && t < Date.now() + 864e5);
            return Math.min(f.stat.ctime, f.stat.mtime, ...ts);
          };
          const hubs: Record<string, string> = {};
          for (const d of cityPrivate.districts) { const h = byName.get(d.name.toLowerCase()); if (h) hubs[d.name] = h; }
          const gslug = new Map(garden.map(g => [g.title.toLowerCase(), g.slug] as const));
          const vault = md.filter(inVault)
            .map(f => ({ path: f.path, title: f.basename, ctime: bornAt(f), mtime: f.stat.mtime, out: Object.keys(resolved[f.path] || {}) }));
          cityPrivate.under = underground(vault, hubs, t => gslug.get(t.toLowerCase()));
          const pub = publicCity(cityPrivate, fromGithub ? cityPrivate.districts.map(d => d.name) : fromVault ? [] : (s.projects || []).map(p => p[0]), s.privateRepos || "show", (s as any).hideRepos || []);
          cityPublicBase = pub;   // unset: the hub applies Caldera's default when it serves the page   // public repos only: every district is public
          if (pub.districts.length) data.city = pub;
        }
      }
    } catch (e) { console.warn("Caldera city.json unreadable:", e); }
  }
  // apps and websites the owner listed: details from the hub (which caches them), cards on the page, storefronts in the city
  const listed = await collectListings(s);
  if (listed.length) {
    data.apps = listed.filter(l => l.kind === "app"); data.websites = listed.filter(l => l.kind === "site");
    if (!data.apps.length) delete data.apps; if (!data.websites.length) delete data.websites;
  }
  if (s.sections.city !== false && (listed.length || s.hideStorefronts?.length)) {
    const hs = s.hideStorefronts || [];
    const pub = withListingsPublic(cityPublicBase || (cityPrivate ? undefined : { districts: [], private: false }), cityPrivate, listed, s.privateRepos || "show", (s as any).hideRepos || [], hs);
    if (pub?.districts.length) data.city = pub;
    cityPrivate = withListingsPrivate(cityPrivate, listed, hs);
  }
  return { data, files, gardenReport, modulesReport, cityPrivate };
}

/** The owner's listed apps and websites, with their public details from the hub. Only the store or site links are sent;
 *  if the hub can't be reached the page still shows them, named from the link. */
export async function collectListings(s: CalderaSettings): Promise<Listing[]> {
  const refs: ListingRef[] = [...parseListings(s.apps || [], "app"), ...parseListings(s.websites || [], "site")];
  if (!refs.length) return [];
  const hub = (s.hubUrl || "https://caldera.social").replace(/\/$/, "");
  let meta: Record<string, ListingMeta> = {};
  try {
    const r: any = await Promise.race([requestUrl({ url: `${hub}/v1/listings/resolve`, method: "POST", contentType: "application/json", body: JSON.stringify({ items: refs.map(x => ({ kind: x.kind, url: x.url })) }), throw: false }),
      new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 20_000))]);
    if (r?.status === 200 && Array.isArray(r.json?.items)) for (const m of r.json.items) if (m && typeof m.key === "string") meta[m.key] = m;
  } catch { meta = {}; }
  return refs.map(x => toListing(x, meta[x.key], hub));
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean).slice(0, 3);
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}


export interface GardenReport { path: string; title: string; slug: string; stage: string; license: string; words: number; removed: number; flags: { line: string; why: string }[] }

const IMG_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
const IMG_MAX = 2_000_000, IMG_TOTAL = 6_000_000;

/** Is this note in the public garden? Folder or `caldera: garden`; `caldera: private` always wins; Caldera's own files never. */
export function inGarden(path: string, fm: Record<string, unknown>, folder: string): boolean {
  const flag = String(fm?.caldera ?? "").toLowerCase().trim();
  if (flag === "private" || flag === "friends") return false;
  if (path.startsWith("Caldera/")) return false;
  if (flag === "garden") return true;
  const pre = (folder || "").replace(/^\/+|\/+$/g, "");
  return !!pre && path.startsWith(pre + "/");
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Full garden notes (opted in note by note), their embedded images, and a privacy report for the owner's preview. */
export async function collectGarden(app: App, s: CalderaSettings, md: TFile[]) {
  const picked = md.filter(f => inGarden(f.path, app.metadataCache.getFileCache(f)?.frontmatter || {}, s.gardenFolder ?? "Garden"));
  const garden: GardenNote[] = [], gardenReport: GardenReport[] = [];
  const gardenFiles: Record<string, ArrayBuffer> = {}, gardenImages: Record<string, string> = {};
  if (!picked.length) return { garden, gardenImages, gardenFiles, gardenReport };
  const titles = new Map(picked.map(f => [f.basename.toLowerCase(), f]));
  const used = new Set<string>(), slugOf = new Map<TFile, string>();
  for (const f of picked) { let sl = slug(f.basename), k = 2; while (used.has(sl)) sl = `${slug(f.basename)}-${k++}`; used.add(sl); slugOf.set(f, sl); }
  const ownerPublic = [s.name, ...(s.links || []).map(l => l[0]), ...(s.publicTopics || []).map(t => t[1]), ...(s.projects || []).map(p => p[0]), ...picked.map(f => f.basename)].filter(Boolean).map(String);
  const check = publicTextFilter(ownerPublic);
  let imgTotal = 0;
  for (const f of picked) {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter || {};
    const raw = (await app.vault.cachedRead(f)).replace(/^---[\s\S]*?\n---\s*/, "").replace(/%%[\s\S]*?%%/g, "").trim();
    const { text, removed } = redact(raw);
    const out = new Set<string>(); const xlinks = new Map<string, { handle: string; title: string; slug: string }>();
    for (const m of text.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) {
      const t = m[1].trim(), x = parseXLink(t);
      if (x) { xlinks.set(`${x.handle}/${x.slug}`, x); continue; }
      const hit = titles.get(t.split("/").pop()!.replace(/\.md$/i, "").toLowerCase()); if (hit && hit !== f) out.add(slugOf.get(hit)!);
    }
    for (const m of text.matchAll(/!\[\[([^\]|#]+)/g)) {
      const t = m[1].trim(); if (gardenImages[t]) continue;
      const dest = (app.metadataCache as any).getFirstLinkpathDest?.(t, f.path) as TFile | null
        ?? (app.vault.getAbstractFileByPath(t) as TFile | null);
      if (!(dest instanceof TFile) || !IMG_EXT.has(dest.extension.toLowerCase()) || dest.stat.size > IMG_MAX || imgTotal + dest.stat.size > IMG_TOTAL) continue;
      const outPath = `n/img/${slug(dest.basename)}-${slug(String(dest.stat.size))}.${dest.extension.toLowerCase()}`;
      gardenFiles[outPath] = await app.vault.readBinary(dest); imgTotal += dest.stat.size; gardenImages[t] = outPath;
    }
    const created = Date.parse(String(fm.created || fm.date || "")) || f.stat.ctime;
    const note: GardenNote = {
      slug: slugOf.get(f)!, title: f.basename, stage: normStage(fm.stage ?? fm.status), license: normLicense(fm.license),
      created: new Date(Math.min(created, f.stat.mtime)).toISOString(), updated: new Date(f.stat.mtime).toISOString(),
      markdown: text, sha256: await sha256hex(text), words: (text.match(/\S+/g) || []).length, excerpt: excerptOf(text),
      out: [...out], xlinks: [...xlinks.values()], tags: asList(fm.tags).map(t => t.replace(/^#/, "")),
    };
    garden.push(note);
    const flags = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("```")).map(line => ({ line: line.slice(0, 160), why: check.why(line) || "" })).filter(x => x.why && x.why !== "name").slice(0, 12);
    gardenReport.push({ path: f.path, title: f.basename, slug: note.slug, stage: note.stage, license: note.license, words: note.words, removed, flags });
  }
  return { garden, gardenImages, gardenFiles, gardenReport };
}

/** Journal entries are kept in the plugin's data folder so journal-grown garden pages keep growing past the history window. */
async function growGardenFromJournal(app: App, s: CalderaSettings, daily: DailyEntry[], garden: GardenNote[], report: GardenReport[]) {
  const fresh: JournalDay[] = daily.filter(d => d.headline || d.focus?.length || d.wins?.length)
    .map(d => ({ date: d.date, headline: d.headline, focus: d.focus, wins: d.wins, themes: d.themes }));
  const path = `${app.vault.configDir}/plugins/caldera/journal-garden.json`;
  let kept: Record<string, JournalDay> = {};
  try { if (await app.vault.adapter.exists(path)) kept = JSON.parse(await app.vault.adapter.read(path)).days || {}; } catch { kept = {}; }
  for (const d of fresh) kept[d.date] = d;
  const dates = Object.keys(kept).sort().slice(-3650);
  kept = Object.fromEntries(dates.map(k => [k, kept[k]]));
  try { await app.vault.adapter.write(path, JSON.stringify({ days: kept })); } catch { /* read-only vault: pages still build from this run */ }

  const pages = journalGarden(Object.values(kept), (s.projects || []).map(p => p[0]));
  const used = new Set(garden.map(n => n.slug));
  for (const pg of pages) {
    const planted = garden.find(n => n.title.toLowerCase() === pg.title.toLowerCase());
    if (planted) {   // a note you wrote yourself keeps your words on top; the journal log goes underneath
      planted.markdown += `\n\n## From my journal\n\n${pg.markdown.replace(/^\*[^\n]*\*\n\n/, "").replace(/^## /gm, "### ")}`;
      planted.sha256 = await sha256hex(planted.markdown); planted.words = (planted.markdown.match(/\S+/g) || []).length;
      if (pg.updated > planted.updated) planted.updated = pg.updated;
      continue;
    }
    let sl = slug(pg.title), k = 2; while (used.has(sl)) sl = `${slug(pg.title)}-${k++}`; used.add(sl);
    const note: GardenNote = { slug: sl, title: pg.title, stage: pg.stage, license: "all-rights", created: pg.created, updated: pg.updated,
      markdown: pg.markdown, sha256: await sha256hex(pg.markdown), words: (pg.markdown.match(/\S+/g) || []).length,
      excerpt: excerptOf(pg.markdown.replace(/^\*[^\n]*\*\n\n/, "").replace(/^## .*$/gm, "")), out: [], xlinks: [], tags: ["journal"] };
    garden.push(note);
    report.push({ path: "(grown from your journal)", title: note.title, slug: note.slug, stage: note.stage, license: note.license, words: note.words, removed: 0, flags: [] });
  }
  // links between garden notes, now that journal pages exist
  const byTitle = new Map(garden.map(n => [n.title.toLowerCase(), n.slug]));
  for (const n of garden) {
    const out = new Set(n.out);
    for (const m of n.markdown.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) { const t = m[1].trim(); if (parseXLink(t)) continue; const sl = byTitle.get(t.split("/").pop()!.replace(/\.md$/i, "").toLowerCase()); if (sl && sl !== n.slug) out.add(sl); }
    n.out = [...out];
  }
}

/** Now: the owner's own list from the profile note, unless it says "now: auto" or has none, and then the last 7 days of
 *  journal wins (already through the privacy filter): newest day first, one per day, then seconds, near-duplicates
 *  dropped, 4 at most. Nothing in the journal: no Now section. */
export function nowOf(s: { now?: string[]; nowAuto?: boolean }, daily: { date: string; wins?: string[]; focus?: string[] }[]): { now?: string[]; nowAuto?: boolean } {
  if (!s.nowAuto && s.now?.length) return { now: s.now };
  const week = daily.slice(-8).reverse().map(d => (d.wins?.length ? d.wins : d.focus || []).map(x => String(x).trim()).filter(x => x.length > 12));
  const words = (t: string) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 3));
  const near = (a: string, b: string) => { const A = words(a), B = words(b); let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.max(1, Math.min(A.size, B.size)) > 0.5; };
  const out: string[] = [];
  for (let k = 0; k < 3 && out.length < 4; k++) for (const day of week) { const t = day[k]; if (t && out.length < 4 && !out.some(o => near(o, t))) out.push(t.replace(/\.?$/, ".")); }
  return out.length ? { now: out, nowAuto: true } : {};
}
