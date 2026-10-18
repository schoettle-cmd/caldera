import { test } from "node:test";
import assert from "node:assert/strict";
import { mdToHtml, renderGarden, redact, parseXLink, excerptOf, gardenManifest, normStage, normLicense, journalGarden } from "./garden.build.mjs";
import { renderProfile } from "./render.build.mjs";
import * as C from "@caldera/core";

// the garden is paused (core flags.ts); these tests cover it switched back on
C.FLAGS.garden = true;

const note = (title, markdown, extra = {}) => ({ slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title, stage: "seedling", license: "all-rights",
  created: "2026-10-01T00:00:00.000Z", updated: "2026-10-12T00:00:00.000Z", markdown, sha256: "f".repeat(64), words: 10, excerpt: excerptOf(markdown), out: [], xlinks: [], tags: [], ...extra });

test("markdown is escaped; only safe links survive", () => {
  const html = mdToHtml("# Hi <script>x</script>\n\nA [bad](javascript:alert(1)) and [good](https://a.com) **bold** `co<de>`\n\n- one\n- [x] two\n\n> [!note] quoted\n\n```\n<b>raw</b>\n```\n\n%% private comment %%\nend", () => null);
  assert.ok(!html.includes("<script>") && html.includes("&lt;script&gt;"));
  assert.ok(!html.includes('href="javascript') && html.includes('href="https://a.com"'));
  assert.ok(html.includes("<strong>bold</strong>") && html.includes("<code>co&lt;de&gt;</code>") && html.includes("<ul>") && html.includes("checked"));
  assert.ok(html.includes("<blockquote>") && html.includes("&lt;b&gt;raw&lt;/b&gt;") && !html.includes("private comment"));
});

test("wiki links: garden notes link, private notes become plain text, @friend links go to their garden", () => {
  const html = mdToHtml("See [[Public idea]], [[Secret plan|the plan]] and [[@ana/Tools for thought]].", t => t === "Public idea" ? "public-idea.html" : parseXLink(t) ? "https://hub/@ana/n/tools-for-thought.html" : null);
  assert.ok(html.includes('href="public-idea.html"') && html.includes('<span class="unlinked">the plan</span>') && !html.includes("Secret plan"));
  assert.ok(html.includes('href="https://hub/@ana/n/tools-for-thought.html"') && html.includes("@ana"));
  assert.deepEqual(parseXLink("@Ana/Tools for thought"), { handle: "ana", title: "Tools for thought", slug: "tools-for-thought" });
});

test("contact details are redacted; dates and numbers are not", () => {
  const r = redact("Mail me at a.b@example.com or +1 (310) 555-1234. Founded 2011, 1,388,138 words, 2026-10-12.");
  assert.equal(r.removed, 2);
  assert.ok(r.text.includes("[email removed] or") && !r.text.includes("example.com") && !r.text.includes("555-1234") && r.text.includes("2011") && r.text.includes("1,388,138") && r.text.includes("2026-10-12"));
});

test("garden pages: index, note pages with backlinks, source, license, provenance, manifest", () => {
  const a = note("Gardens", "Gardens beat streams. See [[Streams]].", { out: ["streams"], stage: "evergreen", license: "cc-by", xlinks: [{ handle: "ana", title: "X", slug: "x" }] });
  const b = note("Streams", "The stream is about now.");
  const files = renderGarden({ name: "Mike", handle: "mike", hub: "https://caldera.social", id: "cal:abc" }, [a, b]);
  for (const k of ["garden.html", "garden.json", "n/gardens.html", "n/gardens.md", "n/streams.html", "assets/garden.css"]) assert.ok(files[k], k);
  assert.ok(files["n/streams.html"].includes("Links to this note") && files["n/streams.html"].includes('href="gardens.html"'));
  assert.ok(files["n/gardens.html"].includes("CC BY 4.0") && files["n/gardens.html"].includes("<!--caldera:xlinks-->") && files["n/gardens.html"].includes("sha256"));
  assert.ok(files["n/streams.html"].includes('content="noai, noimageai"') && !files["n/gardens.html"].includes("noai"), "AI opt-out follows the license");
  assert.equal(JSON.parse(files["garden.json"]).notes.length, 2);
  assert.deepEqual(gardenManifest([a])[0].xlinks, ["ana/x"]);
  assert.equal(normStage("Evergreen"), "evergreen"); assert.equal(normStage("nope"), "seedling"); assert.equal(normLicense("MIT"), "all-rights");
});

test("profile gets a Garden section and ships the garden pages", () => {
  const p = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [],
    publicNotes: [], asks: [], offers: [], updated: new Date().toISOString(), garden: [note("Gardens", "Gardens beat streams, every time.")] };
  const files = renderProfile(p);
  assert.ok(files["index.html"].includes("<h2 id=\"garden\">Garden</h2>") && files["index.html"].includes('href="n/gardens.html"') && files["index.html"].includes("assets/garden.css"));
  assert.ok(files["garden.html"] && files["n/gardens.html"]);
  p.sections.garden = false; const off = renderProfile(p);
  assert.ok(!off["index.html"].includes("Garden</h2>") && !off["garden.html"]);
});

test("journal garden: project and theme pages grow from public journal lines, newest first, stage by frequency", () => {
  const day = (i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
  const days = Array.from({ length: 6 }, (_, i) => ({ date: day(i), headline: i % 2 ? `Shipped Caldera gardens part ${i}` : `Quiet day ${i}`,
    focus: [`Testing Inbox Hero with Caldera ${i}`], wins: i === 5 ? ["Inbox Hero passed review"] : [], themes: ["Building"] }));
  const pages = journalGarden(days, ["Caldera", "Inbox Hero", "Kitse"]);
  const byT = Object.fromEntries(pages.map(p => [p.title, p]));
  assert.ok(byT["Caldera"] && byT["Inbox Hero"] && byT["Building"] && !byT["Kitse"], "projects that come up 2+ days and themes 5+ days");
  assert.equal(byT["Caldera"].days, 6); assert.equal(byT["Caldera"].stage, "budding"); assert.equal(byT["Inbox Hero"].days, 6);
  const md = byT["Inbox Hero"].markdown;
  assert.ok(md.indexOf("Oct 6") > -1 && md.indexOf("Oct 6") < md.indexOf("Oct 1") && md.indexOf("passed review") < md.indexOf("Testing Inbox Hero with [[Caldera]] 0"), "newest first");
  assert.ok(md.includes("[[Caldera]]") && !md.includes("[[Inbox Hero]]"), "other projects become links, not itself");
  assert.equal(byT["Caldera"].updated.slice(0, 10), day(5)); assert.equal(byT["Caldera"].created.slice(0, 10), day(0));
  assert.equal(journalGarden(days.slice(0, 1), ["Caldera"]).length, 0, "one mention is not a page yet");
});

test("journal garden: themes on nearly every day, or copies of another theme, get no page", () => {
  const day = (i) => new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10);
  const days = Array.from({ length: 20 }, (_, i) => ({ date: day(i), headline: `Day ${i}`, themes: ["Building", "AI", ...(i < 6 ? ["Hiring"] : []), ...(i < 6 ? ["Recruiting"] : []), ...(i >= 10 && i < 16 ? ["Design"] : [])] }));
  const titles = journalGarden(days, []).map(p => p.title).sort();
  assert.deepEqual(titles, ["Design", "Hiring"]);
});

test("navigation standard: profile, garden home and every note share one left nav, links rebased per page", () => {
  const p = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [],
    publicNotes: [], asks: [], offers: [], updated: new Date().toISOString(), garden: [note("Gardens", "Gardens beat streams, every time.")],
    tree: [{ name: "People", child: false }, { name: "Mike", child: true, current: true, href: "#top" }, { name: "Garden", child: false, count: 1, href: "garden.html" }, { name: "Gardens", child: true, href: "n/gardens.html" }] };
  const f = renderProfile(p);
  for (const [k, up] of [["index.html", ""], ["garden.html", ""], ["n/gardens.html", "../"]]) {
    const h = f[k];
    assert.ok(h.includes('class="sidebar tree"') && h.includes('class="toc pages"'), k + " has the nav");
    assert.ok(h.includes(`href="${up}garden.html">Garden home</a>`) || h.includes(`href="${up}garden.html" aria-current`) || h.includes('aria-current="page">Garden home'), k + " links garden home");
    assert.ok(h.includes(`class="g-name g-link" href="${up}garden.html"`), k + " Garden group is clickable");
    assert.ok(h.includes('data-caldera-friend="mike"') && h.includes('/kudos/mike"'), k + " add-friend (inline on the hub, kudos page as fallback)");
  }
  assert.ok(f["garden.html"].includes('href="index.html#top"') && f["n/gardens.html"].includes('href="../index.html#top"'));
  assert.ok(f["n/gardens.html"].includes('href="../n/gardens.html"') && f["n/gardens.html"].includes('aria-current="page"'));
  assert.ok(f["garden.html"].includes('page-row is-active" href="garden.html"'));
});
