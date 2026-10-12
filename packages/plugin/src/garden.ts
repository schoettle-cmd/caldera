/**
 * Digital garden: full public notes, opted in note by note, rendered as static pages next to the profile.
 * Pure (no Obsidian imports) so it is unit-testable in Node and reusable by self-hosters.
 *
 * A note joins the garden when it lives in the garden folder (default "Garden/") or has `caldera: garden`.
 * `caldera: private` always keeps a note out, even inside the folder.
 *   stage:   seedling | budding | evergreen        how finished the thinking is (default seedling)
 *   license: all-rights | cc-by | cc-by-nc | cc0 | ai-licensable   (default all-rights: no AI training without permission)
 * Links: [[Note]] to another garden note becomes a link; to a private note it becomes plain text (the title is already
 * in your sentence, nothing else leaks). [[@friend/Their Note]] links into a friend's garden on the hub.
 */
import { slug } from "./render";

export const STAGES = ["seedling", "budding", "evergreen"] as const;
export type Stage = (typeof STAGES)[number];
export const LICENSES: Record<string, { label: string; short: string; ai: boolean; url?: string }> = {
  "all-rights": { label: "All rights reserved. Not licensed for AI training.", short: "All rights reserved", ai: false },
  "cc-by": { label: "Creative Commons Attribution 4.0. Reuse with credit.", short: "CC BY 4.0", ai: true, url: "https://creativecommons.org/licenses/by/4.0/" },
  "cc-by-nc": { label: "Creative Commons Attribution-NonCommercial 4.0. Reuse with credit, not commercially.", short: "CC BY-NC 4.0", ai: false, url: "https://creativecommons.org/licenses/by-nc/4.0/" },
  "cc0": { label: "Public domain (CC0). No rights reserved.", short: "CC0", ai: true, url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "ai-licensable": { label: "Available to license for AI training, with the author's permission and payment. Not free to use.", short: "AI-licensable", ai: false },
};
const STAGE_ICON: Record<Stage, string> = { seedling: "&#127793;", budding: "&#127807;", evergreen: "&#127795;" };
const STAGE_TIP: Record<Stage, string> = { seedling: "Seedling: a rough, early idea", budding: "Budding: taking shape", evergreen: "Evergreen: worked through and stable" };

export interface XLink { handle: string; title: string; slug: string }
export interface GardenNote {
  slug: string; title: string; stage: Stage; license: string;
  created: string; updated: string;                 // ISO
  markdown: string;                                 // published text (after redaction), frontmatter removed
  sha256: string;                                   // hex hash of `markdown` - listed in the signed manifest
  words: number; excerpt: string;
  out: string[];                                    // slugs of garden notes this note links to
  xlinks: XLink[];                                  // links into other people's gardens
  tags: string[];
}
export interface GardenSite {
  name: string; handle?: string; hub?: string; icon?: string; theme?: "dark" | "light"; id?: string;
  external?: string;                                // an existing garden elsewhere (Quartz, Obsidian Publish...)
}

export const normStage = (v: unknown): Stage => { const s = String(v ?? "").toLowerCase().trim(); return (STAGES as readonly string[]).includes(s) ? s as Stage : "seedling"; };
export const normLicense = (v: unknown): string => { const s = String(v ?? "").toLowerCase().trim(); return LICENSES[s] ? s : "all-rights"; };

/** Contact details never go public, even inside an opted-in note. */
export function redact(md: string): { text: string; removed: number } {
  let removed = 0;
  const text = md
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, () => { removed++; return "[email removed]"; })
    .replace(/(?<![\w/.=-])(\+?\d[\d .()-]{8,}\d)(?![\w/])/g, m => { if ((m.match(/\d/g) || []).length < 10) return m; removed++; return "[phone removed]"; });
  return { text, removed };
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Cross-garden link target: [[@handle/Title]] or [[@handle/Title|label]]. */
export function parseXLink(target: string): XLink | null {
  const m = target.match(/^@([a-z0-9][a-z0-9-]{1,30})\/(.+)$/i);
  return m ? { handle: m[1].toLowerCase(), title: m[2].trim(), slug: slug(m[2]) } : null;
}

/**
 * Small, safe Markdown -> HTML. Everything is escaped first; only http(s)/mailto links survive.
 * `link(target)` returns an href for a [[wiki link]] or null (rendered as plain text).
 * `image(target)` returns a bundle path for an embedded image or null (dropped).
 */
export function mdToHtml(md: string, link: (target: string) => string | null, image: (target: string) => string | null = () => null): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = []; let para: string[] = []; let list: { tag: string; items: string[] } | null = null; let quote: string[] = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inl(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map(i => `<li>${i}</li>`).join("")}</${list.tag}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${mdToHtml(quote.join("\n"), link, image)}</blockquote>`); quote = []; } };
  const flush = () => { flushPara(); flushList(); flushQuote(); };

  function inl(t: string): string {
    const tokens: string[] = [];
    const keep = (html: string) => { tokens.push(html); return `\u0000${tokens.length - 1}\u0000`; };
    t = t.replace(/`([^`]+)`/g, (_m, c) => keep(`<code>${esc(c)}</code>`));
    t = t.replace(/!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, (_m, tgt) => { const src = image(tgt.trim()); return src ? keep(`<img src="${esc(src)}" alt="${esc(tgt.trim())}" loading="lazy">`) : ""; });
    t = t.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(\|([^\]]+))?\]\]/g, (_m, tgt, _h, _p, label) => {
      const text = (label || tgt).trim(), x = parseXLink(tgt.trim());
      const href = link(tgt.trim());
      if (href) return keep(`<a class="${x ? "xlink" : "internal"}" href="${esc(href)}">${esc(text.replace(/^@[^/]+\//, ""))}${x ? `<span class="xl-who">@${esc(x.handle)}</span>` : ""}</a>`);
      return keep(`<span class="unlinked">${esc(text)}</span>`);
    });
    // hosted pages may only load their own images, so outside images become links
    t = t.replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, (_m, alt, u) => keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(alt || "image")}</a>`));
    t = t.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, (_m, label, u) => keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(label)}</a>`));
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, (_m, pre, u) => pre + keep(`<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(u)}</a>`));
    let h = esc(t);
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>").replace(/(^|[^_\w])_([^_\s][^_]*)_/g, "$1<em>$2</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>").replace(/==([^=]+)==/g, "<mark>$1</mark>");
    return h.replace(/\u0000(\d+)\u0000/g, (_m, i) => tokens[Number(i)]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*(```|~~~)(.*)$/);
    if (fence) {
      flush(); const body: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(fence[1]); i++) body.push(lines[i]);
      out.push(`<pre><code>${esc(body.join("\n"))}</code></pre>`); continue;
    }
    if (/^\s*%%/.test(line)) {   // Obsidian comments (%% ... %%) stay private
      flush();
      if (!/%%.*%%/.test(line)) for (i++; i < lines.length && !lines[i].includes("%%"); i++);
      continue;
    }
    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1].replace(/^\[!(\w+)\][+-]?\s*/, (_m, k) => `**${k.charAt(0).toUpperCase() + k.slice(1)}:** `)); continue; } else flushQuote();
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flush(); const lvl = Math.min(6, h[1].length + 1); out.push(`<h${lvl}>${inl(h[2])}</h${lvl}>`); continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); out.push("<hr>"); continue; }
    const li = line.match(/^\s*([-*+]|\d+[.)])\s+(\[( |x|X)\]\s+)?(.*)$/);
    if (li) {
      flushPara(); const tag = /\d/.test(li[1]) ? "ol" : "ul";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      const box = li[2] ? `<input type="checkbox" disabled${/x/i.test(li[3]) ? " checked" : ""}> ` : "";
      list.items.push(box + inl(li[4])); continue;
    }
    if (!line.trim()) { flush(); continue; }
    flushList(); para.push(line.trim());
  }
  flush();
  return out.join("\n");
}

/** First readable paragraph, as plain text. */
export function excerptOf(md: string, n = 200): string {
  const para = md.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n/).map(x => x.replace(/^#+\s.*$/gm, "").replace(/^\s*>\s?/gm, "").trim()).find(x => x.length > 20) || "";
  return clip(para.replace(/!\[\[[^\]]*\]\]/g, "").replace(/\[\[(?:@[^/\]]+\/)?([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, t, _p, l) => l || t).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`=~]/g, "").replace(/\s+/g, " ").trim(), n);
}

function page(site: GardenSite, title: string, body: string, depth: number, extraHead = ""): string {
  const up = depth ? "../".repeat(depth) : "";
  const icon = site.icon ? `<link rel="icon" href="${up}${esc(site.icon)}" type="image/png">` : `<link rel="icon" href="${up}assets/favicon.svg" type="image/svg+xml">`;
  return `<!doctype html><html lang="en"${site.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">${extraHead}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${icon}<link rel="stylesheet" href="${up}assets/theme.css"><link rel="stylesheet" href="${up}assets/profile.css"><link rel="stylesheet" href="${up}assets/garden.css"></head><body>
${body}</body></html>`;
}

/** Shorten on a word boundary with an ellipsis. */
export const clip = (t: string, n: number) => t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "").replace(/[,;:.\s]+$/, "") + "\u2026";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const stageBadge = (s: Stage) => `<span class="g-stage g-${s}" title="${STAGE_TIP[s]}">${STAGE_ICON[s]} ${s}</span>`;
const licenseLine = (key: string) => { const L = LICENSES[key] || LICENSES["all-rights"]; return L.url ? `<a href="${L.url}" rel="license noopener" target="_blank">${esc(L.short)}</a>` : esc(L.short); };

/** Static garden pages: garden.html (index), n/<slug>.html per note, n/<slug>.md (the signed source), garden.json. */
export function renderGarden(site: GardenSite, notes: GardenNote[], images: Record<string, string> = {}): Record<string, string> {
  if (!notes.length) return {};
  const hub = (site.hub || "https://caldera.social").replace(/\/$/, "");
  const bySlug = new Map(notes.map(n => [n.slug, n]));
  const byTitle = new Map(notes.map(n => [n.title.toLowerCase(), n]));
  const back = new Map<string, GardenNote[]>();
  for (const n of notes) for (const o of n.out) if (o !== n.slug && bySlug.has(o)) back.set(o, [...(back.get(o) || []), n]);
  const who = site.handle ? `@${site.handle}` : site.name;
  const files: Record<string, string> = {};
  const tabs = (active: string) => `<div class="tabs"><a class="tab" href="${active === "index" ? "" : "../"}index.html">${esc(site.name)}.md</a><a class="tab${active === "garden" ? " is-active" : ""}" href="${active === "note" ? "../" : ""}garden.html">Garden</a>${active === "note" ? `<span class="tab is-active">%%TITLE%%</span>` : ""}<span class="spacer"></span></div>`;

  for (const n of notes) {
    const link = (target: string) => {
      const x = parseXLink(target);
      if (x) return `${hub}/@${x.handle}/n/${x.slug}.html`;
      const hit = byTitle.get(target.split("/").pop()!.replace(/\.md$/i, "").toLowerCase());
      return hit ? `${hit.slug}.html` : null;
    };
    const img = (target: string) => images[target] ? `../${images[target]}` : null;
    const body = mdToHtml(n.markdown, link, img);
    const bl = back.get(n.slug) || [];
    const L = LICENSES[n.license] || LICENSES["all-rights"];
    const html = `${tabs("note").replace("%%TITLE%%", esc(n.title))}
<main class="g-main"><article class="g-note">
<div class="g-crumbs"><a href="../index.html">${esc(who)}</a> / <a href="../garden.html">Garden</a></div>
<h1 class="g-title">${esc(n.title)}</h1>
<div class="g-meta">${stageBadge(n.stage)}<span>Planted ${fmtDate(n.created)}</span><span>Tended ${fmtDate(n.updated)}</span><span>${n.words.toLocaleString("en-US")} words</span></div>
<div class="g-body">${body}</div>
${bl.length ? `<section class="g-links"><h2>Links to this note</h2>${bl.map(b => `<a class="g-card" href="${b.slug}.html"><span class="g-card-t">${esc(b.title)}</span><span class="g-card-x">${esc(clip(b.excerpt, 120))}</span></a>`).join("")}</section>` : ""}
<!--caldera:xlinks-->
<footer class="g-foot"><div><b>License:</b> ${licenseLine(n.license)}. ${esc(L.label)}</div>
<div class="g-prov"><b>Provenance:</b> sha256 <code title="${n.sha256}">${n.sha256.slice(0, 16)}</code> of <a href="${n.slug}.md">the published text</a>, listed in <a href="../caldera.json">${esc(who)}'s signed manifest</a>${site.id ? ` (key <code>${esc(site.id.slice(0, 14))}&hellip;</code>)` : ""}. Anyone can check the author and date.</div></footer>
</article></main>`;
    files[`n/${n.slug}.html`] = page(site, `${n.title} - ${site.name}`, html, 1,
      `\n<meta name="description" content="${esc(n.excerpt)}">${L.ai ? "" : `\n<meta name="robots" content="noai, noimageai">`}${L.url ? `\n<link rel="license" href="${L.url}">` : ""}`);
    files[`n/${n.slug}.md`] = n.markdown;
  }

  const counts = STAGES.map(s => [s, notes.filter(n => n.stage === s).length] as const);
  const sorted = [...notes].sort((a, b) => b.updated.localeCompare(a.updated));
  const idx = `${tabs("garden")}
<main class="g-main"><div class="g-index">
<div class="g-crumbs"><a href="index.html">${esc(who)}</a> / Garden</div>
<h1 class="g-title">${esc(site.name)}'s garden</h1>
<p class="g-lede">Notes grown in public from an Obsidian vault. Some are seedlings, some are evergreen; all of them keep changing.${site.external ? ` More at <a href="${esc(site.external)}" rel="noopener" target="_blank">${esc(site.external.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>.` : ""}</p>
<div class="g-filter" role="toolbar" aria-label="Filter by stage"><button class="is-on" data-stage="all">All <span>${notes.length}</span></button>${counts.filter(([, c]) => c).map(([s, c]) => `<button data-stage="${s}">${STAGE_ICON[s]} ${s} <span>${c}</span></button>`).join("")}</div>
<div class="g-list">${sorted.map(n => `<a class="g-card" data-stage="${n.stage}" href="n/${n.slug}.html"><span class="g-card-t">${esc(n.title)}</span><span class="g-card-x">${esc(n.excerpt)}</span><span class="g-card-m">${stageBadge(n.stage)}<span>Tended ${fmtDate(n.updated)}</span>${n.xlinks.length ? `<span>${n.xlinks.length} link${n.xlinks.length === 1 ? "" : "s"} to other gardens</span>` : ""}</span></a>`).join("")}</div>
</div></main>
<script>(function(){var b=[].slice.call(document.querySelectorAll('.g-filter button')),c=[].slice.call(document.querySelectorAll('.g-list .g-card'));b.forEach(function(x){x.onclick=function(){b.forEach(function(y){y.classList.toggle('is-on',y===x)});var s=x.getAttribute('data-stage');c.forEach(function(k){k.hidden=s!=='all'&&k.getAttribute('data-stage')!==s})}})})();</script>`;
  files["garden.html"] = page(site, `${site.name}'s garden`, idx, 0);
  files["garden.json"] = JSON.stringify({ name: site.name, handle: site.handle, external: site.external,
    notes: sorted.map(n => ({ slug: n.slug, title: n.title, stage: n.stage, license: n.license, created: n.created, updated: n.updated, sha256: n.sha256, words: n.words, xlinks: n.xlinks })) }, null, 1);
  files["assets/garden.css"] = GARDEN_CSS;
  return files;
}

/** Manifest entries (signed with the profile): what is in the garden, its license and a hash of every note. */
export function gardenManifest(notes: GardenNote[]) {
  return notes.map(n => ({ slug: n.slug, title: n.title, stage: n.stage, license: n.license, created: n.created, updated: n.updated,
    sha256: n.sha256, words: n.words, excerpt: n.excerpt.slice(0, 200), xlinks: n.xlinks.map(x => `${x.handle}/${x.slug}`) }));
}

/** Profile section: latest garden notes + stage counts, linking to the note pages. */
export function gardenSection(notes: GardenNote[], external?: string): string {
  if (!notes.length && !external) return "";
  const sorted = [...notes].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 6);
  const counts = STAGES.map(s => [s, notes.filter(n => n.stage === s).length] as const).filter(([, c]) => c);
  return `<h2>Garden</h2><p class="small">${notes.length ? `${notes.length} note${notes.length === 1 ? "" : "s"} grown in public: ${counts.map(([s, c]) => `${STAGE_ICON[s]} ${c} ${s}`).join(" &middot; ")}. ` : ""}${notes.length ? `<a href="garden.html">Walk the garden &rarr;</a>` : ""}${external ? ` ${notes.length ? "Also at" : "My garden:"} <a href="${esc(external)}" rel="noopener" target="_blank">${esc(external.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</p>${sorted.length ? `<div class="g-list g-list-profile">${sorted.map(n => `<a class="g-card" href="n/${n.slug}.html"><span class="g-card-t">${esc(n.title)}</span><span class="g-card-x">${esc(clip(n.excerpt, 140))}</span><span class="g-card-m">${stageBadge(n.stage)}<span>Tended ${fmtDate(n.updated)}</span></span></a>`).join("")}</div>` : ""}`;
}

export const GARDEN_CSS = `/* Caldera garden: note pages + index. Tokens come from theme.css. */
.tabs a.tab { color: var(--text-muted); text-decoration: none; }
.tabs a.tab:hover { color: var(--text); }
.g-main { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
.g-crumbs { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: 10px; }
.g-crumbs a { color: var(--text-muted); }
.g-title { font-family: var(--font-display); font-size: 2.1rem; line-height: 1.15; font-weight: 600; margin: 0 0 12px; color: var(--text-strong); }
.g-lede { color: var(--text-muted); margin: 0 0 18px; }
.g-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; font-size: var(--text-sm); color: var(--text-muted); padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 22px; }
.g-stage { display: inline-flex; align-items: center; gap: 5px; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--line-strong); font-size: var(--text-xs); text-transform: capitalize; color: var(--text); background: var(--bg-raised); white-space: nowrap; }
.g-evergreen { border-color: var(--accent); }
.g-body { font-family: var(--font-display); font-size: 1.12rem; line-height: 1.7; color: var(--text); overflow-wrap: anywhere; }
.g-body h2, .g-body h3, .g-body h4 { font-family: var(--font-display); color: var(--text-strong); margin: 1.6em 0 .5em; line-height: 1.25; }
.g-body p, .g-body ul, .g-body ol, .g-body blockquote, .g-body pre { margin: 0 0 1em; }
.g-body ul, .g-body ol { padding-left: 1.3em; }
.g-body blockquote { border-left: 3px solid var(--accent); padding: 2px 0 2px 16px; color: var(--text-muted); }
.g-body code { font-family: var(--font-mono); font-size: .85em; background: var(--bg-sunken); padding: 1px 5px; border-radius: 4px; }
.g-body pre { background: var(--bg-sunken); padding: 14px; border-radius: var(--radius-md); overflow-x: auto; }
.g-body pre code { background: none; padding: 0; }
.g-body img { max-width: 100%; height: auto; border-radius: var(--radius-md); }
.g-body a.internal { border-bottom: 1px dashed var(--accent-text); text-decoration: none; }
.g-body a.xlink { border-bottom: 1px dashed var(--accent-text); text-decoration: none; }
.g-body .xl-who { font-family: var(--font-body); font-size: .7em; margin-left: 4px; padding: 0 6px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-text); vertical-align: 2px; }
.g-body .unlinked { color: var(--text); }
.g-body mark { background: var(--accent-soft); color: inherit; }
.g-body hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }
.g-links, .g-xlinks { margin-top: 36px; }
.g-links h2, .g-xlinks h2 { font-size: var(--text-sm); text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); font-weight: 600; margin: 0 0 10px; }
.g-list { display: grid; gap: 10px; }
.g-list-profile { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); margin-bottom: 8px; }
.g-card { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--bg-raised); color: var(--text); text-decoration: none; }
.g-card:hover { border-color: var(--accent); text-decoration: none; }
.g-card-t { font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--text-strong); }
.g-card-x { font-size: var(--text-sm); color: var(--text-muted); line-height: 1.5; }
.g-card-m { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; font-size: var(--text-xs); color: var(--text-muted); }
.g-card .g-who { color: var(--accent-text); }
.g-filter { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; }
.g-filter button { font: inherit; font-size: var(--text-sm); color: var(--text-muted); background: var(--bg-raised); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; cursor: pointer; text-transform: capitalize; }
.g-filter button span { opacity: .7; margin-left: 2px; }
.g-filter button.is-on { color: var(--text); border-color: var(--accent); }
.g-foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--line); font-size: var(--text-xs); color: var(--text-muted); display: grid; gap: 6px; line-height: 1.5; }
.g-foot code { font-family: var(--font-mono); }
@media (max-width: 600px) { .g-main { padding: 22px 16px 48px; } .g-title { font-size: 1.7rem; } .g-body { font-size: 1.04rem; } }
`;
