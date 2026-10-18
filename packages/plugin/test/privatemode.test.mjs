import { test } from "node:test";
import assert from "node:assert/strict";
import { cityData, publicCity, applyPrivateMode, rewriteCityPage, renderCity, citySnapshot, privateCluster } from "./city.build.mjs";

// a city with a public project that also has private repos, and a project that is private only
const repo = (name, project, pub, commits, week) => ({ name, project, public: pub, language: pub ? "TypeScript" : "Rust", commits, weeks: [1, 2, week], week, today: week ? 1 : 0 });
const priv = cityData([
  repo("app", "Shop", true, 300, 4), repo("shop-secret", "Shop", false, 900, 7),
  repo("lab-1", "Secret Lab", false, 120, 3), repo("lab-2", "Secret Lab", false, 40, 0), repo("lab-3", "Secret Lab", false, 10, 0),
  repo("lab-4", "Secret Lab", false, 5, 0), repo("lab-5", "Secret Lab", false, 5, 0), repo("lab-6", "Secret Lab", false, 5, 0),
], () => ({ n: 2, paths: [] }), "2026-10-18T00:00:00Z");
const names = (c) => JSON.stringify(c);

test("show: today's padlocked buildings in place (no names), activity coarse", () => {
  const c = publicCity(priv, ["Shop"], "show");
  assert.ok(!/shop-secret|lab-\d|Secret Lab/.test(names(c)), "no private names or private project names");
  const shop = c.districts.find(d => d.name === "Shop");
  assert.equal(shop.repos.filter(r => r.locked).length, 1, "the private repo of a public project stands inside it");
});

test("anonymous: one separate district, identical padlocks, bucketed count, no activity, totals public-only", () => {
  const c = publicCity(priv, ["Shop"], "anonymous");
  assert.ok(!/shop-secret|lab-\d|Secret Lab/.test(names(c)));
  const shop = c.districts.find(d => d.name === "Shop");
  assert.equal(shop.repos.length, 1); assert.ok(shop.repos.every(r => !r.locked), "no padlock beside a named project");
  const p = c.districts.filter(d => d.apart);
  assert.equal(p.length, 1, "exactly one private district"); assert.equal(p[0].name, "Private");
  assert.equal(p[0].repos.length, privateCluster(7), "7 private repos show as the 6-20 cluster, not the count");
  assert.equal(new Set(p[0].repos.map(r => r.commits)).size, 1, "identical sizes");
  assert.ok(p[0].repos.every(r => r.week === 0 && r.today === 0 && r.weeks.length === 0 && r.locked && !r.name), "no activity");
  assert.equal(p[0].notes, 0);
  assert.deepEqual(c.totals, { commits: 300, active: 1 }, "totals count public repos only");
  assert.equal(c.districts[c.districts.length - 1].apart, true, "laid out last, on its own row");
  assert.deepEqual([1, 5, 6, 20, 21, 500].map(privateCluster), [3, 3, 8, 8, 15, 15]);
});

test("hidden: no private trace at all", () => {
  const c = publicCity(priv, ["Shop"], "hidden");
  assert.ok(c.districts.every(d => d.repos.every(r => !r.locked && r.public)), "only public buildings");
  assert.ok(!c.districts.some(d => d.apart || /^(private|vault)$/i.test(d.name)));
  assert.deepEqual(c.totals, { commits: 300, active: 1 });
});

test("owner's private city is never projected", () => {
  assert.equal(applyPrivateMode(priv, "hidden"), priv);
});

test("serve-time rewrite of a published (padlocked) city page: data, stats, table and lede follow the setting", () => {
  const html = renderCity({ name: "Rae", handle: "rae" }, publicCity(priv, ["Shop"], "show"));
  assert.ok(html.includes("Glass buildings with a padlock"));
  const hid = rewriteCityPage(html, "hidden");
  const data = JSON.parse(hid.match(/id="city-data">([\s\S]*?)<\/script>/)[1]);
  assert.ok(data.districts.every(d => d.repos.every(r => !r.locked)));
  assert.ok(!hid.includes("Glass buildings with a padlock") && !hid.includes("&#128274; Private</span>"), "no padlock text or legend");
  assert.ok(!/<td>Private<\/td>/.test(hid), "no Private row in the table");
  assert.ok(hid.includes("<b>1</b><span>public buildings</span>") && hid.includes("<b>300</b>"), "stats show public numbers only");
  const anon = rewriteCityPage(html, "anonymous");
  assert.ok(anon.includes("Private work, kept anonymous") && anon.includes("kept anonymous: no names, sizes"));
  assert.ok(!anon.includes("<b>900</b>") && !/<td>Private<\/td><td>\d/.test(anon), "no private sizes or commits");
  assert.equal(rewriteCityPage(html, "show"), html);
});

test("city preview: anonymous caption says private work, never a count of it", () => {
  const svg = citySnapshot(publicCity(priv, ["Shop"], "anonymous"), { name: "Rae" });
  assert.ok(svg.includes("1 building + private work"));
  assert.ok(!svg.includes("1,200") && !svg.includes("9 buildings"));
});
