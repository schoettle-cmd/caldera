/**
 * Every link that leaves Caldera opens in a new window. Used by the plugin on every page it builds and by the hub on
 * every HTML page it serves, so pages built by older plugin versions are covered too.
 */
const A_TAG = /<a\b([^>]*)>/gi;
const attr = (attrs: string, name: string): string | null => {
  const m = attrs.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
};
const setAttr = (attrs: string, name: string, value: string): string => {
  const re = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s"'>]+)`, "i");
  return re.test(attrs) ? attrs.replace(re, ` ${name}="${value}"`) : `${attrs.replace(/\s*\/?$/, "")} ${name}="${value}"`;
};

/** True when `href` is an absolute http(s) URL on a host that isn't one of ours. */
export function isExternalHref(href: string, ownHosts: string[]): boolean {
  const h = href.trim();
  if (!/^https?:\/\//i.test(h) && !h.startsWith("//")) return false;
  try {
    const host = new URL(h.startsWith("//") ? "https:" + h : h).host.toLowerCase();
    return !ownHosts.some(o => o && host === o.toLowerCase());
  } catch { return false; }
}

/** Add target="_blank" rel="noopener noreferrer" to every off-site <a href>, merging with any rel/target already there. */
export function externalLinksNewWindow(html: string, ownHosts: string[]): string {
  return html.replace(A_TAG, (whole, attrs: string) => {
    const href = attr(attrs, "href");
    if (href == null || !isExternalHref(href, ownHosts)) return whole;
    const rel = new Set(String(attr(attrs, "rel") || "").split(/\s+/).filter(Boolean).map(x => x.toLowerCase()));
    rel.add("noopener"); rel.add("noreferrer");
    let a = setAttr(attrs, "target", "_blank");
    a = setAttr(a, "rel", [...rel].join(" "));
    return `<a${a}>`;
  });
}
