import { test } from "node:test";
import assert from "node:assert/strict";
import { mdToHtml, renderGarden, redact, parseXLink, excerptOf, gardenManifest, normStage, normLicense } from "./garden.build.mjs";
import { renderProfile } from "./render.build.mjs";

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
