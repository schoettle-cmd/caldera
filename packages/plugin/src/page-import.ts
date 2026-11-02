/** Attach Obsidian to a page made on the website: only fills what the vault has empty, so nothing already in the vault changes and a publish doesn't wipe the page. */
export interface ImportedPage { name?: string; headline?: string; summary?: string; now?: string[]; links?: [string, string][]; timeline?: [string, string][]; projects?: [string, string][]; photoExt?: string }
export function fillFromPage<T extends Record<string, any>>(s: T, page: ImportedPage | null | undefined): T {
  if (!page) return s;
  const out: any = { ...s };
  for (const k of ["name", "headline", "summary"] as const) if (!String(out[k] ?? "").trim() && page[k]) out[k] = page[k];
  for (const k of ["now", "links", "timeline", "projects"] as const) if (!(out[k] && out[k].length) && page[k]?.length) out[k] = page[k];
  return out;
}
/** Where the page's photo is fetched from and saved to, or null when there's none, the vault has its own, or the extension isn't one we serve. */
export function photoPlan(avatarPath: unknown, hubUrl: string, handle: string, ext: unknown): { from: string; to: string } | null {
  if (String(avatarPath ?? "").trim() || !["jpg", "png", "webp"].includes(String(ext)) || !/^[a-z0-9-]+$/.test(handle)) return null;
  return { from: `${hubUrl.replace(/\/$/, "")}/@${handle}/img/photo.${ext}`, to: `Caldera/photo.${ext}` };
}
/** Settings hold a code until the hub has confirmed: the hub keeps hosting until then, so a dropped reply can be retried. */
export const isPageCode = (code: string) => /^CAL-P-[\w-]{10,}$/.test(code);
