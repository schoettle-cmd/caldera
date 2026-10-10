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
  if (fm.sections && typeof fm.sections === "object") for (const k of Object.keys(e.sections)) if (k in fm.sections) e.sections[k] = fm.sections[k] !== false;
  if (typeof fm.listed === "boolean") e.listed = fm.listed;
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

Your handle and identity key live in Settings -> Caldera, never here. Guide: ${hubUrl.replace(/\/$/, "")}/guide.html
`;
}

export async function ensureProfileFile(app: App, s: CalderaSettings, hubUrl: string): Promise<TFile> {
  const existing = app.vault.getAbstractFileByPath(PROFILE_FILE);
  if (existing instanceof TFile) return existing;
  if (!app.vault.getAbstractFileByPath("Caldera")) await app.vault.createFolder("Caldera").catch(() => {});
  return app.vault.create(PROFILE_FILE, profileFileText(s, hubUrl));
}
