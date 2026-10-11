/**
 * Caldera/profile.md - the public profile fields as an ordinary note, so the owner (or their AI agent) can edit
 * the page by editing a file. Settings keep the identity and handle; everything public lives here and wins over
 * the matching settings when present. Saving the file republishes the page (see main.ts).
 */
import { App, TFile } from "obsidian";
import type { CalderaSettings } from "./settings";

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
  if (Array.isArray(fm.sidebar)) e.tree = fm.sidebar.map((x: unknown) => { const [g = "", items = "", folder = ""] = String(x ?? "").split("|").map(v => v.trim()); return [g, items, folder || undefined] as [string, string, string?]; }).filter(([g]) => g);
  if (Array.isArray(fm.graph)) e.graph = fm.graph.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 20);
  e.backlinks = pairs(fm.backlinks) ?? e.backlinks;
  if (typeof fm.summary === "string") e.summary = fm.summary.trim();
  if (Array.isArray(fm.now)) e.now = fm.now.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 8);
  e.timeline = pairs(fm.timeline) ?? e.timeline;
  e.projects = pairs(fm.projects) ?? e.projects;
  e.knows = pairs(fm.knows) ?? e.knows;
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
now:
${list(s.now || [])}
timeline:
${list((s.timeline || []).map(([a, b]) => `${a} | ${b}`))}
projects:
${list((s.projects || []).map(([a, b]) => `${a} | ${b}`))}
knows:
${list((s.knows || []).map(([a, b]) => `${a} | ${b}`))}
tabs:
${list(s.tabs || [])}
sidebar:
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
- **summary** - a short intro box. Links: \`[[Label|https://...]]\`, bold: \`**text**\`.
- **now** - what you're doing now, one line each.
- **timeline** - \`Year | what happened | optional one-line detail\`. Start a chapter with \`era | Name | 1995-2006\`.
- **projects** - \`Name | status | https://link\`.
- **knows** - \`Label | vault folder\`; shows how many notes are in each folder (counts only).
- **tabs** - extra tab labels in the top bar, like \`Now.md\`.
- **sidebar** - the left column, \`Group | item, item | folder\` (e.g. \`Projects | Garden app, Newsletter | Projects\`). Items that match a project, public note or section on your page become links. The optional folder shows how many notes it holds (a count only). Empty: your topics and public notes.
- **graph** - note names for the graph on the right, sized by how many of your notes link to each (only the count is published). Empty: your topics.
- **backlinks** - the list under the graph, \`Title | short context\`. Empty: your public notes.

Your handle and identity key live in Settings -> Caldera, never here. Guide: ${hubUrl.replace(/\/$/, "")}/guide.html
`;
}

export async function ensureProfileFile(app: App, s: CalderaSettings, hubUrl: string): Promise<TFile> {
  const existing = app.vault.getAbstractFileByPath(PROFILE_FILE);
  if (existing instanceof TFile) return existing;
  if (!app.vault.getAbstractFileByPath("Caldera")) await app.vault.createFolder("Caldera").catch(() => {});
  return app.vault.create(PROFILE_FILE, profileFileText(s, hubUrl));
}
