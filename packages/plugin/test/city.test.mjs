import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCityRepos, cityData, publicCity, renderCity, underground, publicUnderground } from "./city.build.mjs";
import { renderProfile } from "./render.build.mjs";

const raw = { generated: "2026-10-16T10:00:00Z", repos: [
  { name: "caldera", project: "Caldera", public: true, language: "TypeScript", commits: 400, weeks: [1, 2, 3], week: 9, today: 2, url: "https://github.com/x/caldera", description: "social layer" },
  { name: "caldera-hub", project: "Caldera", public: true, language: "HTML", commits: 90, weeks: [], week: 0, today: 0 },
  { name: "ha-secret-backend", project: "Human Architecture", public: false, language: "JavaScript", commits: 600, weeks: [5, 5], week: 4, today: 0, url: "https://github.com/x/private", description: "internal" },
  { name: "grid-live", project: "Quant", public: false, language: "Python", commits: 1200, weeks: [9], week: 30, today: 3 },
  { name: "<script>alert(1)</script>", project: "Caldera", public: true, language: "Other", commits: 1, weeks: [], week: 0, today: 0 },
  { project: "nameless" },
] };

test("city: parse, district grouping, notes per project", () => {
  const repos = parseCityRepos(raw);
  assert.equal(repos.length, 5);
  assert.equal(repos.find(r => r.name === "ha-secret-backend").url, undefined, "private repos never keep a URL or description");
  const c = cityData(repos, p => ({ n: p === "Caldera" ? 12 : 0, paths: [] }));
  assert.deepEqual(c.districts.map(d => d.name), ["Quant", "Human Architecture", "Caldera"]);
  assert.equal(c.districts.find(d => d.name === "Caldera").notes, 12);
});

test("city: public view shows every building but locks private repos (no names, details or exact numbers)", () => {
  const c = cityData(parseCityRepos(raw), () => ({ n: 3, paths: ["secret/note.md"] }));
  const pub = publicCity(c, ["Caldera", "Human Architecture"]);
  const all = pub.districts.flatMap(d => d.repos);
  assert.equal(all.length, 5, "every repo is a building");
  assert.deepEqual(pub.districts.map(d => d.name).sort(), ["Caldera", "Human Architecture", "Private"], "unlisted projects (Quant) lose their name");
  const lockedOnes = all.filter(r => r.locked);
  assert.equal(lockedOnes.length, 2);
  for (const r of lockedOnes) { assert.equal(r.name, ""); assert.equal(r.language, "Private"); assert.deepEqual(r.weeks, []); assert.ok(!r.url && !r.description && !r.pushed); }
  assert.equal(lockedOnes.find(r => r.project === "Private").commits, 1000, "1200 commits round down to a coarse step");
  assert.equal(pub.totals.commits, 2291);
  const html = renderCity({ name: "Mike", handle: "mike" }, pub);
  for (const bad of ["ha-secret-backend", "grid-live", "Quant", "secret/note.md", "internal", "<script>alert(1)</script>", '"1200"', ":1200"]) assert.ok(!html.includes(bad), bad);
  assert.ok(html.includes("\\u003cscript>alert(1)\\u003c/script>"), "names are escaped inside the data block");
  assert.ok(html.includes("padlock are private repos"));
});

test("city: a published profile ships city.html and a City link only when there is a public city", () => {
  const base = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [], publicNotes: [], asks: [], offers: [], updated: new Date().toISOString() };
  assert.ok(!renderProfile(base)["city.html"]);
  const pub = publicCity(cityData(parseCityRepos(raw), () => ({ n: 0, paths: [] })), ["Caldera"]);
  const f = renderProfile({ ...base, city: pub });
  assert.ok(f["city.html"] && f["index.html"].includes('href="city.html">City</a>') && !f["city.html"].includes("grid-live"));
  assert.ok(!renderProfile({ ...base, city: pub, sections: { notes: true, city: false } })["city.html"]);
});

test("underground: notes under their project, plumbing left out, public keeps only the shape (and garden titles)", () => {
  const now = Date.parse("2026-10-16T12:00:00Z"), d = 864e5;
  const N = (path, out, age = 10) => ({ path, title: path.split("/").pop().replace(/\.md$/, ""), ctime: now - age * d, mtime: now - d, out });
  const notes = [N("wiki/Shop.md", ["wiki/entities/Ann.md"]), N("wiki/entities/Ann.md", ["wiki/Shop.md"]), N("wiki/concepts/Pricing.md", ["wiki/Shop.md", "wiki/Lab.md"], 400),
    N("wiki/Lab.md", []), N("wiki/entities/Secret Fund.md", ["wiki/Lab.md"]), N("wiki/hot.md", ["wiki/Shop.md", "wiki/Lab.md", "wiki/entities/Ann.md"]), N("wiki/Essay.md", ["wiki/Shop.md"]), N("raw/orphan.md", [])];
  const u = underground(notes, { Shop: "wiki/Shop.md", Lab: "wiki/Lab.md" }, t => t === "Essay" ? "essay" : undefined, now);
  const by = Object.fromEntries(u.nodes.map(n => [n.t, n]));
  assert.equal(by.hot, undefined, "index pages are plumbing");
  assert.equal(by.Ann.d, "Shop"); assert.equal(by["Secret Fund"].d, "Lab"); assert.equal(by.Pricing.d, undefined, "links to two projects: stays central");
  assert.equal(by.Ann.k, "entity"); assert.equal(by.Pricing.k, "concept"); assert.equal(by.Essay.k, "garden"); assert.equal(by.Pricing.a, 400);
  assert.ok(u.orphans >= 1 && u.total === 7 && u.edges.length > 0);
  const pub = publicUnderground(u, ["Shop"]);
  const s = JSON.stringify(pub);
  for (const w of ["Ann", "Secret Fund", "Pricing", "wiki/", "Lab"]) assert.ok(!s.includes(w), "public leaks " + w);
  assert.ok(pub.nodes.some(n => n.t === "Essay" && n.g === "essay"), "garden notes keep their title");
  assert.equal(pub.nodes.find(n => n.k === "entity" && n.d === "Shop") !== undefined, true);
});

test("city: pop-out button and mini mode (the corner window)", () => {
  const html = renderCity({ name: "Mike <J>", handle: "mike" }, publicCity(cityData(parseCityRepos(raw), () => ({ n: 0, paths: [] }), "2026-10-16T10:00:00Z"), ["Caldera"]));
  assert.match(html, /<button id="t-pop"[^>]*>/);
  assert.match(html, /<div class="c-mininame" aria-hidden="true"><i><\/i>Mike &lt;J&gt;<\/div>/, "name overlay, escaped");
  assert.match(html, /CALDERA_MINI===1/); assert.match(html, /\[#&\]mini\\b/);
  assert.match(html, /html\.c-mini \.c-stage\{position:fixed;inset:0/);
  assert.match(html, /'\/watch\/@'\+m\[1\]/, "on the web it opens the hub's watch page");
  assert.match(html, /FPS_MS=MINI\?50:30/, "mini mode draws at about 20 fps");
});
