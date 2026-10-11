// Builds the search + AI-answer layer of caldera.social from scripts/seo-pages.mjs:
//   <slug>.html pages (answer-first, FAQ, JSON-LD), learn.html, sitemap.xml, robots.txt, llms.txt, llms-full.txt,
//   canonical/og tags on every page, and SoftwareApplication/Organization/FAQPage JSON-LD on the homepage.
import fs from "node:fs";
import { pages, UPDATED } from "./seo-pages.mjs";

const SITE = "https://caldera.social";
const dir = new URL("../packages/site/", import.meta.url);
const read = f => fs.readFileSync(new URL(f, dir), "utf8");
const write = (f, s) => fs.writeFileSync(new URL(f, dir), s);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const ORG = { "@type": "Organization", "@id": `${SITE}/#org`, name: "mjonesone, LLC", url: SITE, email: "hello@caldera.social" };

// shared chrome from guide.html (head up to </head>, the header, the footer)
const guide = read("guide.html");
const headTpl = guide.slice(0, guide.indexOf("</head>"))    // inherited per-page tags must not leak into other pages
  .replace(/<link rel="canonical"[^>]*>\s*/g, "").replace(/<meta (property|name)="(og|twitter):[^>]*>\s*/g, "")
  .replace(/<meta name="robots"[^>]*>\s*/g, "").replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, "");
const header = guide.slice(guide.indexOf('<header class="nav">'), guide.indexOf("</header>") + 9).replace(/ aria-current="page"/g, "");
const footer = guide.slice(guide.indexOf('<footer class="footer">'), guide.indexOf("</footer>") + 9)
  .replace('<a href="guide.html">Guide</a>', '<a href="/learn">Learn</a> &middot; <a href="guide.html">Guide</a>');

function head(title, description, slug, extra = "") {
  const url = slug ? `${SITE}/${slug}` : `${SITE}/`;
  return headTpl.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
    + `<link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="article"><meta property="og:image" content="${SITE}/og.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">${extra}\n</head>`;
}

const bySlug = Object.fromEntries(pages.map(p => [p.slug, p]));
for (const p of pages) {
  const url = `${SITE}/${p.slug}`;
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "TechArticle", headline: p.h1, description: p.description, url, dateModified: UPDATED, datePublished: "2026-10-11", author: { "@id": `${SITE}/#org` }, publisher: { "@id": `${SITE}/#org` }, about: { "@type": "SoftwareApplication", name: "Caldera", url: SITE }, image: `${SITE}/og.jpg` },
    { "@type": "FAQPage", mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Caldera", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE}/learn` }, { "@type": "ListItem", position: 3, name: p.h1, item: url }] },
    ORG ] };
  const body = `<main class="legal guide learn-page">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Caldera</a> / <a href="/learn">Learn</a></nav>
  <h1>${esc(p.h1)}</h1>
  <p class="answer">${esc(p.answer)}</p>
  <p class="fine">Updated ${UPDATED} &middot; by mjonesone, LLC</p>
${p.sections.map(s => `  <h2>${esc(s.h2)}</h2>\n  ${s.html}`).join("\n")}
  <div class="cta-box"><b>Try it free.</b> One prompt in Claude Code, Codex or Cursor installs Obsidian (if needed) and Caldera. <a class="btn small" href="/#install">Install Caldera</a></div>
  <h2>Questions</h2>
  <div class="faq-list">${p.faq.map(([q, a]) => `<details open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  <h2>Related</h2>
  <ul>${p.related.map(r => `<li><a href="/${r}">${esc(bySlug[r].h1)}</a></li>`).join("")}</ul>
</main>`;
  write(`${p.slug}.html`, `${head(p.title, p.description, p.slug, ld(graph))}\n<body>\n${header}\n${body}\n${footer}\n<script src="assets/site.js"></script>\n</body>\n</html>\n`);
}

// /learn index
write("learn.html", `${head("Learn Caldera: Obsidian profiles, sharing and AI agents", "Guides to Obsidian public profiles, private note sharing, AI agents, daily journals, activity tracking and Obsidian Publish alternatives.", "learn", ld({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Learn Caldera", url: `${SITE}/learn`, hasPart: pages.map(p => ({ "@type": "TechArticle", headline: p.h1, url: `${SITE}/${p.slug}` })) }))}
<body>
${header}
<main class="legal guide learn-page">
  <p class="eyebrow">Learn</p>
  <h1>Obsidian profiles, sharing and AI agents</h1>
  <p class="lead-in">Short, practical answers about turning an Obsidian vault into a living profile, sharing notes privately, and letting AI agents help.</p>
  <div class="learn-list">${pages.map(p => `<a class="learn-item" href="/${p.slug}"><b>${esc(p.h1)}</b><span>${esc(p.description)}</span></a>`).join("")}</div>
</main>
${footer}
<script src="assets/site.js"></script>
</body>
</html>
`);

// canonical + og on existing pages; homepage JSON-LD
const core = [["index.html", ""], ["people.html", "people"], ["guide.html", "guide"], ["changelog.html", "changelog"], ["privacy.html", "privacy"], ["terms.html", "terms"]];
for (const [f, slug] of core) {
  let s = read(f).replace(/<link rel="canonical"[^>]*>/g, "");
  s = s.replace("</head>", `<link rel="canonical" href="${SITE}/${slug}">\n</head>`);
  s = s.replace(/<a href="guide\.html">Guide<\/a> &middot; <a href="changelog\.html">/, '<a href="/learn">Learn</a> &middot; <a href="guide.html">Guide</a> &middot; <a href="changelog.html">');
  if (f === "index.html") {
    const faq = [...s.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map(m => ({ "@type": "Question", name: strip(m[1]), acceptedAnswer: { "@type": "Answer", text: strip(m[2]) } }));
    const app = { "@context": "https://schema.org", "@graph": [
      { "@type": "SoftwareApplication", name: "Caldera", applicationCategory: "ProductivityApplication", operatingSystem: "Windows, macOS, Linux, iOS, Android (Obsidian plugin)", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, url: SITE, downloadUrl: `${SITE}/download/caldera-latest.zip`, softwareVersion: "0.3", license: "https://opensource.org/licenses/MIT", codeRepository: "https://github.com/schoettle-cmd/caldera", description: "Caldera is the social layer for Obsidian: a living public profile built from your vault, friends between vaults, end-to-end encrypted shared notes, asks, offers and gravity. Private by default.", publisher: { "@id": `${SITE}/#org` }, image: `${SITE}/og.jpg` },
      { "@type": "WebSite", name: "Caldera", url: SITE, publisher: { "@id": `${SITE}/#org` } },
      { "@type": "FAQPage", mainEntity: faq }, ORG ] };
    s = s.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "").replace("</head>", `${ld(app)}\n</head>`);
    if (!s.includes('href="/learn"')) s = s.replace('<span><a href="PROTOCOL.md">', '<span><a href="/learn">Learn</a> &middot; <a href="PROTOCOL.md">');
  }
  write(f, s);
}

// sitemap, robots, llms
const urls = [["", "weekly", "1.0"], ["learn", "weekly", "0.9"], ...pages.map(p => [p.slug, "monthly", "0.8"]), ["people", "daily", "0.7"], ["guide", "monthly", "0.7"], ["changelog", "weekly", "0.6"], ["privacy", "yearly", "0.3"], ["terms", "yearly", "0.3"]];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, f, pr]) => `  <url><loc>${SITE}/${u}</loc><lastmod>${UPDATED}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join("\n")}\n</urlset>\n`);
const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Googlebot", "Bingbot", "Applebot", "Applebot-Extended", "DuckAssistBot", "Meta-ExternalAgent", "MistralAI-User", "CCBot"];
write("robots.txt", `# caldera.social - search engines and AI assistants are welcome to read and cite the public site.\n# Profile pages carry noindex (owners' choice); the API is not for crawling.\n${bots.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /v1/\n`).join("\n")}\nUser-agent: *\nAllow: /\nDisallow: /v1/\n\nSitemap: ${SITE}/sitemap.xml\n`);
write("llms.txt", `# Caldera

> Caldera is a free, open-source Obsidian plugin and open protocol: the social layer for Obsidian. It turns a notes vault into a living public profile that updates itself, and lets vaults befriend each other, share end-to-end encrypted notes, post asks and offers for help, and give positive-only gravity. Private by default. Made by mjonesone, LLC.

- Install: copy one prompt into Claude Code, Codex or Cursor (it installs Obsidian if needed, then Caldera): ${SITE}/#install
- Example profile: ${SITE}/@mike/
- Directory of people: ${SITE}/people
- Source (MIT plugin, AGPL hub): https://github.com/schoettle-cmd/caldera

## Guides
${pages.map(p => `- [${p.h1}](${SITE}/${p.slug}): ${p.description}`).join("\n")}

## Reference
- [Guide: change your page, commands, keys](${SITE}/guide)
- [Release notes](${SITE}/changelog)
- [Protocol spec](${SITE}/PROTOCOL.md)
- [Privacy policy](${SITE}/privacy)
- [Full text for language models](${SITE}/llms-full.txt)
`);
write("llms-full.txt", `# Caldera - full text\n\n${pages.map(p => `## ${p.h1}\nURL: ${SITE}/${p.slug}\n\n${p.answer}\n\n${p.sections.map(s => `### ${s.h2}\n${strip(s.html)}`).join("\n\n")}\n\n### Questions\n${p.faq.map(([q, a]) => `Q: ${q}\nA: ${a}`).join("\n")}\n`).join("\n")}`);
console.log(`seo built: ${pages.length} pages + learn, sitemap (${urls.length} urls), robots, llms.txt`);
