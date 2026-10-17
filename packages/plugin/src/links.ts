/** Quick link fields on the setup form (GitHub, Website, X, LinkedIn): a bare handle or a URL becomes a "Label | url" link. */
/** Quick links on the setup form: label on the page, how a bare handle becomes a URL, and which hosts count as "theirs". */
export const QUICK_LINKS: { label: string; ph: string; hosts: RegExp; url: (v: string) => string }[] = [
  { label: "GitHub", ph: "your GitHub username", hosts: /(^|\.)github\.com$/i, url: v => `https://github.com/${v.replace(/^@/, "")}` },
  { label: "Website", ph: "yoursite.com", hosts: /^$/, url: v => `https://${v}` },
  { label: "X", ph: "@handle", hosts: /(^|\.)(x|twitter)\.com$/i, url: v => `https://x.com/${v.replace(/^@/, "")}` },
  { label: "LinkedIn", ph: "linkedin.com/in/you", hosts: /(^|\.)linkedin\.com$/i, url: v => `https://www.linkedin.com/in/${v.replace(/^@/, "").replace(/^in\//, "")}` },
];
export function quickLinkUrl(i: number, raw: string): string {
  const v = raw.trim(); if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:\/\//i, "https://");
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && QUICK_LINKS[i]!.label !== "Website") return "https://" + v.replace(/^www\./, "www.");
  return QUICK_LINKS[i]!.url(v);
}
const hostOf = (u: string) => { try { return new URL(u).hostname; } catch { return ""; } };
/** Which quick field an existing "Label | url" link fills, if any. */
export function quickLinkIndex(label: string, url: string): number {
  const l = label.trim().toLowerCase(), h = hostOf(url);
  return QUICK_LINKS.findIndex(q => q.label.toLowerCase() === l || (q.label === "X" && l === "twitter") || (!!h && q.hosts.source !== "^$" && q.hosts.test(h)));
}

