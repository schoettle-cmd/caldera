// Fills the static site from single sources:
//   @caldera/core prompts  -> index.html (setup + richer) and guide.html (edit)
//   site/releases.json     -> changelog.html (rendered at rest) and releases.xml (RSS)
import fs from "node:fs";
import { agentPrompt, richerPrompt, editPrompt } from "../packages/core/dist/index.js";

const site = new URL("../packages/site/", import.meta.url);
const HUB = "https://caldera.social";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fill = (html, marker, content) => html.replace(new RegExp(`<!-- ${marker}_START -->[\\s\\S]*?<!-- ${marker}_END -->`), `<!-- ${marker}_START -->${content}<!-- ${marker}_END -->`);
const update = (file, fn) => { const p = new URL(file, site); fs.writeFileSync(p, fn(fs.readFileSync(p, "utf8"))); };

update("index.html", h => fill(fill(h, "AGENT_PROMPT", esc(agentPrompt({ hubUrl: HUB }))), "RICHER_PROMPT", esc(richerPrompt({ hubUrl: HUB }))));
update("guide.html", h => fill(h, "EDIT_PROMPT", esc(editPrompt({ hubUrl: HUB }))));

const { releases } = JSON.parse(fs.readFileSync(new URL("releases.json", site), "utf8"));
const rendered = releases.map((r, i) => `
  <article class="release" id="v${esc(r.version)}">
    <div class="release-meta"><span class="tag">${esc(r.version)}</span><time datetime="${esc(r.date)}">${esc(r.date)}</time>${i === 0 ? "<span>latest</span>" : ""}</div>
    <h2>${esc(r.title)}</h2>
    <ul>${r.items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${r.howto ? `\n    <p class="howto">${esc(r.howto)}</p>` : ""}
  </article>`).join("");
update("changelog.html", h => fill(h, "RELEASES", rendered + "\n  "));

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Caldera - what's new</title><link>${HUB}/changelog.html</link><description>Caldera release notes</description>
${releases.map(r => `<item><title>${esc(r.version + ": " + r.title)}</title><link>${HUB}/changelog.html#v${esc(r.version)}</link><guid>${HUB}/changelog.html#v${esc(r.version)}</guid><pubDate>${new Date(r.date + "T17:00:00Z").toUTCString()}</pubDate><description>${esc(r.items.join(" "))}</description></item>`).join("\n")}
</channel></rss>
`;
fs.writeFileSync(new URL("releases.xml", site), rss);
console.log(`site built: 3 prompts, ${releases.length} releases`);
