/**
 * Caldera/profile.md - the public profile fields as an ordinary note, so the owner (or their AI agent) can edit
 * the page by editing a file. Settings keep the identity and handle; everything public lives here and wins over
 * the matching settings when present. Saving the file republishes the page (see main.ts).
 */
import { App, TFile } from "obsidian";
import type { CalderaSettings } from "./settings";
import { gardenEnabled } from "@caldera/core";

export const PROFILE_FILE = "Caldera/profile.md";

const pair = (v: unknown): [string, string] | null => {
  const [a, ...b] = String(v ?? "").split("|");
  const k = a.trim(), val = b.join("|").trim();
  return k && val ? [k, val] : null;
};
const pairs = (v: unknown) => (Array.isArray(v) ? v.map(pair).filter(Boolean) as [string, string][] : null);

/** Settings with Caldera/profile.md applied on top. */
export function effectiveSettings(app: App, s: CalderaSettings): CalderaSettings {
  const f = app.vault.getAbstractFileByPath(PROFILE_FILE);
  const fm = f instanceof TFile ? app.metadataCache.getFileCache(f)?.frontmatter : null;
  if (!fm) return s;
  const e: CalderaSettings = { ...s, sections: { ...s.sections } };
  if (typeof fm.name === "string" && fm.name.trim()) e.name = fm.name.trim();
  if (typeof fm.headline === "string") e.headline = fm.headline.trim();
  if (typeof fm.photo === "string") e.avatarPath = fm.photo.trim();
  if (typeof fm.banner === "string") e.bannerPath = fm.banner.trim();
  e.links = pairs(fm.links) ?? e.links;
  e.properties = pairs(fm.properties) ?? e.properties;
  const topics = pairs(fm.topics); if (topics) e.publicTopics = topics.map(([tag, label]) => [tag.replace(/^#/, ""), label]);
  if (fm.sections && typeof fm.sections === "object") for (const [k, v] of Object.entries(fm.sections)) e.sections[k] = v !== false;
  if (typeof fm.listed === "boolean") e.listed = fm.listed;
  if (typeof fm.autoConnectRepos === "boolean") e.autoConnectRepos = fm.autoConnectRepos;
  if (typeof fm.autoConnectGithub === "boolean") e.autoConnectRepos = fm.autoConnectGithub;   // same setting, newer name
  const list = (v: unknown) => Array.isArray(v) ? v.map(x => String(x ?? "").trim()).filter(Boolean) : typeof v === "string" ? v.split(",").map(x => x.trim()).filter(Boolean) : null;
  { const t = list(fm.tags); if (t) (e as any).tags = t.slice(0, 12); const h = list(fm.hideTags); if (h) (e as any).hideTags = h.slice(0, 40); const hr = list(fm.hideRepos); if (hr) (e as any).hideRepos = hr.slice(0, 200); }
  { const hs = Array.isArray(fm.hideStorefronts) ? fm.hideStorefronts.map((x: unknown) => String(x ?? "").trim()).filter(Boolean) : typeof fm.hideStorefronts === "string" ? fm.hideStorefronts.split(",").map((x: string) => x.trim()).filter(Boolean) : null; if (hs) e.hideStorefronts = hs.slice(0, 300); }
  if (typeof fm.autoTags === "boolean") (e as any).autoTags = fm.autoTags;
  if (["show", "anonymous", "hidden", "named"].includes(String(fm.privateRepos))) e.privateRepos = fm.privateRepos as CalderaSettings["privateRepos"];
  if (Array.isArray(fm.sidebar)) e.tree = fm.sidebar.map((x: unknown) => { const [g = "", items = "", folder = ""] = String(x ?? "").split("|").map(v => v.trim()); return [g, items, folder || undefined] as [string, string, string?]; }).filter(([g]) => g);
  if (Array.isArray(fm.graph)) e.graph = fm.graph.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 20);
  e.backlinks = pairs(fm.backlinks) ?? e.backlinks;
  if (typeof fm.summary === "string") e.summary = fm.summary.trim();
  if (Array.isArray(fm.now)) e.now = fm.now.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 8);
  if (String(fm.now ?? "").trim().toLowerCase() === "auto") { e.now = []; e.nowAuto = true; }   // "now: auto": written from the last week of the journal
  e.timeline = pairs(fm.timeline) ?? e.timeline;
  e.projects = pairs(fm.projects) ?? e.projects;
  e.knows = pairs(fm.knows) ?? e.knows;
  if (typeof fm.garden === "string") e.gardenFolder = fm.garden.trim().replace(/^\/+|\/+$/g, "");
  if (typeof fm.garden_journal === "boolean") e.gardenJournal = fm.garden_journal;
  if (typeof fm.garden_url === "string") e.gardenUrl = /^https:\/\//.test(fm.garden_url.trim()) ? fm.garden_url.trim() : "";
  // apps / websites: "link" or "link | repo-name", one per line (validated again when the page is built)
  for (const k of ["apps", "websites"] as const) { const v = fm[k]; if (Array.isArray(v)) e[k] = v.map((x: unknown) => String(x ?? "").trim()).filter(Boolean).slice(0, 24); else if (typeof v === "string") e[k] = v.split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 24); }
  if (Array.isArray(fm.tabs)) e.tabs = fm.tabs.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 5);
  return e;
}

const q = (v: string) => JSON.stringify(v);

/** The note written on first run (and by the "Open my profile file" command when it's missing). */
export function profileFileText(s: CalderaSettings, hubUrl: string): string {
  const list = (rows: string[]) => rows.length ? rows.map(r => `  - ${q(r)}`).join("\n") : "  []";
  return `---
name: ${q(s.name)}
headline: ${q(s.headline)}
photo: ${q(s.avatarPath)}
banner: ${q(s.bannerPath)}
links:
${list(s.links.map(([a, b]) => `${a} | ${b}`))}
properties:
${list(s.properties.map(([a, b]) => `${a} | ${b}`))}
topics:
${list(s.publicTopics.map(([a, b]) => `${a} | ${b}`))}
sections:
${Object.entries(s.sections).map(([k, v]) => `  ${k}: ${v}`).join("\n")}
listed: ${s.listed !== false}
summary: ${q(s.summary || "")}
now:${s.nowAuto ? " auto" : "\n" + list(s.now || [])}
timeline:
${list((s.timeline || []).map(([a, b]) => `${a} | ${b}`))}
projects:
${list((s.projects || []).map(([a, b]) => `${a} | ${b}`))}
apps:
${list(s.apps || [])}
websites:
${list(s.websites || [])}
hideStorefronts:
${list(s.hideStorefronts || [])}
knows:
${list((s.knows || []).map(([a, b]) => `${a} | ${b}`))}
tabs:
${list(s.tabs || [])}
${gardenEnabled() ? `garden: ${q(s.gardenFolder ?? "Garden")}
garden_url: ${q(s.gardenUrl || "")}
garden_journal: ${s.gardenJournal !== false}
` : ""}sidebar:
${list((s.tree || []).map(([a, b, c]) => `${a} | ${b}${c ? ` | ${c}` : ""}`))}
graph:
${list(s.graph || [])}
backlinks:
${list((s.backlinks || []).map(([a, b]) => `${a} | ${b}`))}
---
# My Caldera profile

This note controls your public page at ${hubUrl.replace(/\/$/, "")}/@${s.handle}/ . Edit the properties above, or ask your AI agent to, and the page republishes itself about a minute after you save. **Everything above is public.**

- **name, headline** - shown at the top of your page.
- **photo, banner** - paths to images in this vault, e.g. \`Attachments/me.jpg\`.
- **links** - \`Label | https://...\`, one per line.
- **properties** - short facts, \`Label | value\` (e.g. \`Based in | Lisbon\`).
- **topics** - which of your tags may be counted publicly, \`tag | Label\`. Tags not listed are never shown.
- **sections** - switch parts of the page on or off: ${Object.keys(s.sections).join(", ")}.
- **listed** - \`true\` shows your card on the People page; \`false\` keeps the page link-only.
- **autoConnectGithub** (or autoConnectRepos) - \`false\` stops Caldera making you friends with members you follow, who follow you, or who work on the same public GitHub repos (on by default).
- **tags** - what you're building, shown as chips on your page and searchable in People (e.g. \`[Social features, Next.js]\`). **hideTags** hides tags Caldera worked out from your public GitHub; **autoTags** \`false\` turns those off entirely.
- **privateRepos** - how private repos show on your public city: \`named\` (like your private view: names, language colours and activity in their real projects, but no links or code), \`show\` (padlocked buildings in place: no names, but size, activity and the project they sit beside are visible), \`anonymous\` (one separate padlocked district, no sizes, activity or projects) or \`hidden\` (no trace). Your private view always shows everything. **hideRepos** - with \`named\`, private repos to keep as nameless padlocks anyway (e.g. \`[client-project, secret-launch]\`).
- **summary** - a short intro box. Links: \`[[Label|https://...]]\`, bold: \`**text**\`.
- **now** - what you're doing now, one line each. Or \`now: auto\` (and when there's no list): your last week of journal wins, updated on every publish.
- **timeline** - \`Year | what happened | optional one-line detail\`. Start a chapter with \`era | Name | 1995-2006\`.
- **projects** - \`Name | status | https://link\`.
- **apps** - your apps in the App Store or Google Play, one store link each (e.g. \`https://apps.apple.com/us/app/name/id123456789\`). Add \` | repo-name\` to stand the app beside that repo in your city; a private repo's name is never shown. Name, icon, category and rating come from the store. Up to 12.
- **websites** - sites you run, one link each (http or https). Add \` | repo-name\` to tie a site to the repo that builds it, so its live visitors walk into that building. Title, icon and description come from the site. Up to 12.
- **Storefronts** - every app and website you list stands as a storefront building in your city (its profile card shows either way). Turn one off with a third field: \`link | repo-name | no-storefront\` (no repo: \`link | | no-storefront\`). A website with its storefront off, tied to a repo shown by name, lights up that repo's building instead.
- **hideStorefronts** - repos whose apps and websites get no storefront, e.g. \`[old-site, client-work]\`. Those repos' own websites (GitHub homepage or city.json) are also left off your public city.
- **knows** - \`Label | vault folder\`; shows how many notes are in each folder (counts only).
- **tabs** - extra tab labels in the top bar, like \`Now.md\`.
${gardenEnabled() ? `- **garden** - a folder whose notes are published as full pages (your digital garden). Default \`Garden\`. Any note can also opt in with \`caldera: garden\`; \`caldera: private\` keeps a note out. In a garden note, \`stage: seedling | budding | evergreen\` and \`license: all-rights | cc-by | cc-by-nc | cc0 | ai-licensable\`. Email addresses and phone numbers are removed automatically. Link a friend's note with \`[[@handle/Their note]]\`.
- **garden_journal** - \`true\` (default) grows garden pages from your daily journal: one per public project it keeps mentioning and one per recurring theme. Only journal text that is already public is used. \`false\` turns it off.
- **garden_url** - an existing garden elsewhere (Quartz, Obsidian Publish...), linked from your page.
` : ""}- **sidebar** - the left column, \`Group | item, item | folder\` (e.g. \`Projects | Caldera, Newsletter | Projects\`). Items that match a project, public note or section on your page become links. The optional folder shows how many notes it holds (a count only). Empty: your topics and public notes.
- **graph** - note names for the graph on the right, sized by how many of your notes link to each (only the count is published). Empty: your topics.
- **backlinks** - the list under the graph, \`Title | short context\`. Empty: your public notes.
- **Your own sections (modules)** - add a note to \`Caldera/modules/\` (e.g. \`Caldera/modules/Reading list.md\`) and it becomes a section on your page, titled with the file name. Write ordinary Markdown: lists, tables, quotes, links, images from the vault. Optional frontmatter: \`place: side\` (right-hand column), \`order: 10\`, \`publish: false\` (draft). Or ask your AI agent: "add a Talks module with my last five talks".

Your handle and identity key live in Settings -> Caldera, never here. Guide: ${hubUrl.replace(/\/$/, "")}/guide.html
`;
}

export async function ensureProfileFile(app: App, s: CalderaSettings, hubUrl: string): Promise<TFile> {
  const existing = app.vault.getAbstractFileByPath(PROFILE_FILE);
  if (existing instanceof TFile) return existing;
  if (!app.vault.getAbstractFileByPath("Caldera")) await app.vault.createFolder("Caldera").catch(() => {});
  return app.vault.create(PROFILE_FILE, profileFileText(s, hubUrl));
}
