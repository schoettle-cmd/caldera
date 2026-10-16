import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCityRepos, cityData, publicCity, renderCity } from "./city.build.mjs";
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

test("city: public view hides private repo names and unlisted projects", () => {
  const c = cityData(parseCityRepos(raw), () => ({ n: 3, paths: ["secret/note.md"] }));
  const pub = publicCity(c, ["Caldera", "Human Architecture"]);
  const names = pub.districts.flatMap(d => d.repos.map(r => r.name));
  assert.ok(names.includes("caldera") && names.includes("Human Architecture"), "private repos of a listed project fold into one tower named after it");
  assert.ok(!names.includes("ha-secret-backend") && !names.includes("grid-live") && !pub.districts.some(d => d.name === "Quant"));
  assert.equal(pub.districts.find(d => d.name === "Human Architecture").repos[0].commits, 600);
  const html = renderCity({ name: "Mike", handle: "mike" }, pub);
  for (const bad of ["ha-secret-backend", "grid-live", "Quant", "secret/note.md", "<script>alert(1)</script>"]) assert.ok(!html.includes(bad), bad);
  assert.ok(html.includes("\\u003cscript>alert(1)\\u003c/script>"), "names are escaped inside the data block");
});

test("city: a published profile ships city.html and a City link only when there is a public city", () => {
  const base = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [], publicNotes: [], asks: [], offers: [], updated: new Date().toISOString() };
  assert.ok(!renderProfile(base)["city.html"]);
  const pub = publicCity(cityData(parseCityRepos(raw), () => ({ n: 0, paths: [] })), ["Caldera"]);
  const f = renderProfile({ ...base, city: pub });
  assert.ok(f["city.html"] && f["index.html"].includes('href="city.html">City</a>') && !f["city.html"].includes("grid-live"));
  assert.ok(!renderProfile({ ...base, city: pub, sections: { notes: true, city: false } })["city.html"]);
});
