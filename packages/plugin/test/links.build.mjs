// src/links.ts
var QUICK_LINKS = [
  { label: "GitHub", ph: "your GitHub username", hosts: /(^|\.)github\.com$/i, url: (v) => `https://github.com/${v.replace(/^@/, "")}` },
  { label: "Website", ph: "yoursite.com", hosts: /^$/, url: (v) => `https://${v}` },
  { label: "X", ph: "@handle", hosts: /(^|\.)(x|twitter)\.com$/i, url: (v) => `https://x.com/${v.replace(/^@/, "")}` },
  { label: "LinkedIn", ph: "linkedin.com/in/you", hosts: /(^|\.)linkedin\.com$/i, url: (v) => `https://www.linkedin.com/in/${v.replace(/^@/, "").replace(/^in\//, "")}` }
];
function quickLinkUrl(i, raw) {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/^http:\/\//i, "https://");
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v) && QUICK_LINKS[i].label !== "Website") return "https://" + v.replace(/^www\./, "www.");
  return QUICK_LINKS[i].url(v);
}
var hostOf = (u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};
function quickLinkIndex(label, url) {
  const l = label.trim().toLowerCase(), h = hostOf(url);
  return QUICK_LINKS.findIndex((q) => q.label.toLowerCase() === l || q.label === "X" && l === "twitter" || !!h && q.hosts.source !== "^$" && q.hosts.test(h));
}
export {
  QUICK_LINKS,
  quickLinkIndex,
  quickLinkUrl
};
