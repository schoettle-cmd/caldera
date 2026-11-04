import { test } from "node:test";
import assert from "node:assert/strict";
import { placeStorefronts, scrubSignHosts, cityData, publicCity, applyPrivateMode, CITY_JS } from "./city.build.mjs";
import { parseListingLine, toListing, withListingsPublic, withListingsPrivate } from "./listings.build.mjs";

// the renderer's building height (city): 16 + 34*log2(1+commits/8), capped
const bh = r => r.kind ? 46 : 16 + Math.min(230, Math.round(34 * Math.log2(1 + r.commits / 8)));
const repo = (name, commits, extra = {}) => ({ name, project: "P", public: true, language: "TypeScript", commits, weeks: [], week: 0, today: 0, ...extra });
const shop = (name, extra = {}) => ({ name, project: "P", public: true, language: "Web", commits: 0, weeks: [], week: 0, today: 0, kind: "site", url: "https://" + name.toLowerCase() + ".com/", meta: {}, ...extra });
const city = () => [{ name: "P", notes: 0, repos: [repo("giant", 4000), repo("tower", 300), repo("mid", 40), repo("low", 2), shop("Alpha"), shop("Beta"), shop("Gamma"), shop("Delta")] },
  { name: "Q", notes: 0, repos: [repo("q-tall", 40), shop("Echo", { meta: { on: "q-tall" } })] }];

test("signs: placement is deterministic (same data, same signs, whatever order the listings come in)", () => {
  const key = p => p.map(x => `${x.r.name}>${x.host.name}:${x.v}:${x.side}`).join(",");
  const a = key(placeStorefronts(city(), false, bh)), b = key(placeStorefronts(city(), false, bh));
  assert.equal(a, b);
  const shuffled = city(); shuffled[0].repos.reverse();
  assert.equal(key(placeStorefronts(shuffled, false, bh)).split(",").sort().join(","), a.split(",").sort().join(","));
});

test("signs: rules (blade only on tall towers, roofs only with room, one sign per face, a mix of kinds)", () => {
  const ds = city(), pl = placeStorefronts(ds, false, bh);
  assert.equal(pl.length, 5, "every listing gets a sign");
  for (const p of pl) {
    if (p.v === "blade") assert.ok(bh(p.host) >= 72, "blade on a tall building: " + p.host.name);
    if (p.v === "roof") assert.notEqual(p.host.name, "giant", "the tallest tower keeps its beacon");
    if (p.v === "wall") assert.ok(bh(p.host) >= 40);
  }
  const faces = pl.filter(p => p.v !== "roof").map(p => p.host.name + p.side), roofs = pl.filter(p => p.v === "roof").map(p => p.host.name);
  assert.equal(new Set(faces).size, faces.length, "one sign per face");
  assert.equal(new Set(roofs).size, roofs.length, "one billboard per roof");
  assert.ok(new Set(pl.map(p => p.v)).size >= 3, "a city gets variety: " + pl.map(p => p.v));
  assert.ok(pl.every(p => p.host !== p.r), "all hang on real buildings here");
});

test("signs: a listing tied to a repo hangs a rooftop billboard on that repo's building", () => {
  const e = placeStorefronts(city(), false, bh).find(p => p.r.name === "Echo");
  assert.deepEqual([e.host.name, e.v], ["q-tall", "roof"]);
  // a crane on the roof (built this week) leaves no room: it still hangs on its own repo, on a face
  const ds = city(); ds[1].repos[0].week = 3;
  const e2 = placeStorefronts(ds, false, bh).find(p => p.r.name === "Echo");
  assert.equal(e2.host.name, "q-tall"); assert.notEqual(e2.v, "roof");
});

test("signs: padlocked buildings never host; a listing with nowhere to hang keeps a shop of its own", () => {
  const ds = [{ name: "Apps & sites", notes: 0, repos: [shop("Solo")] }, { name: "Z", notes: 0, repos: [repo("", 50, { public: false, locked: true, language: "Private" }), shop("Near")] }];
  const pl = placeStorefronts(ds, false, bh);
  for (const p of pl) { assert.equal(p.host, p.r, p.r.name + " stands alone"); assert.ok(["roof", "wall", "fascia"].includes(p.v)); }
  // more listings than faces and roofs: the rest keep their own shop
  const many = [{ name: "M", notes: 0, repos: [repo("one", 10), ...["a", "b", "c", "d", "e"].map(n => shop(n))] }, { name: "N", notes: 0, repos: [repo("taller", 500)] }];
  const pm = placeStorefronts(many, false, bh);
  assert.equal(pm.filter(p => p.host.name === "one").length, 3, "two faces + a roof");
  assert.equal(pm.filter(p => p.host === p.r).length, 2);
});

test("signs: the World map uses its own (shorter) thresholds", () => {
  const wbh = r => r.kind ? 30 : 14 + Math.min(110, Math.round(20 * Math.log2(1 + r.commits / 8)));
  const pl = placeStorefronts([{ name: "@a/P", nb: "@a", notes: 0, repos: [repo("t", 2000), repo("u", 600), shop("S1"), shop("S2"), shop("S3")] }], true, wbh);
  for (const p of pl) if (p.v === "blade") assert.ok(wbh(p.host) >= 56);
  assert.equal(pl.length, 3);
});

test("signs: the renderer embeds the same placement and draws signs after every building", () => {
  assert.ok(CITY_JS.includes("function sfPlace(ds,world,bh,dormant)"));
  assert.ok(/drawDust\(c\);drawSigns\(\)/.test(CITY_JS), "signs are drawn last, so a tower in front never hides one");
  assert.ok(CITY_JS.includes("SFA.get(t.r)"), "the store directory lists signs hanging on buildings");
});

// ---- privacy of meta.on (the tied repo's name, so the sign can hang on it)
const HUB = "https://caldera.social";
const L = (line, kind) => toListing(parseListingLine(line, kind), { key: "k", name: "Thing" }, HUB);
const repos = [
  { name: "web", project: "Acme", public: true, language: "TypeScript", commits: 40, weeks: [], week: 1, today: 0, url: "https://github.com/me/web" },
  { name: "secret-app", project: "Acme", public: false, language: "Swift", commits: 90, weeks: [], week: 2, today: 0 },
];
const priv = () => cityData(structuredClone(repos), () => ({ n: 0, paths: [] }), "2026-10-23T00:00:00Z");
const listing = c => c.districts.flatMap(d => d.repos).find(r => r.kind);

test("signs privacy: meta.on names a repo only where the page already shows it by name", () => {
  const pubTie = L("https://web.example.org | web", "site"), privTie = L("https://apps.apple.com/app/id1234567 | secret-app", "app");
  for (const mode of ["show", "anonymous", "hidden", "named"]) {
    const p = priv();
    const a = withListingsPublic(publicCity(p, ["Acme"], mode), p, [pubTie], mode);
    assert.equal(listing(applyPrivateMode(a, mode)).meta.on, "web", mode + ": a public repo is shown by name");
    const b = applyPrivateMode(withListingsPublic(publicCity(p, ["Acme"], mode), p, [privTie], mode), mode);
    assert.equal(listing(b).meta.on, mode === "named" ? "secret-app" : undefined, mode);
    if (mode !== "named") assert.ok(!JSON.stringify(b).includes("secret-app"), mode);
  }
  // named with the repo hidden by name: no meta.on
  const p = priv(), h = withListingsPublic(publicCity(p, ["Acme"], "named", ["secret-app"]), p, [privTie], "named", ["secret-app"]);
  assert.equal(listing(h).meta.on, undefined);
  assert.ok(!JSON.stringify(h).includes("secret-app"));
  // the owner's private view always names it
  assert.equal(listing(withListingsPrivate(priv(), [privTie])).meta.on, "secret-app");
});

test("signs privacy: switching a named city to anonymous at serve time drops meta.on", () => {
  const p = priv(), named = withListingsPublic(publicCity(p, ["Acme"], "named"), p, [L("https://apps.apple.com/app/id1234567 | secret-app", "app")], "named");
  assert.equal(listing(named).meta.on, "secret-app");
  const anon = applyPrivateMode(named, "anonymous");
  assert.equal(listing(anon).meta.on, undefined);
  assert.ok(!JSON.stringify(anon).includes("secret-app"));
  const ds = scrubSignHosts([{ name: "X", notes: 0, repos: [shop("S", { meta: { on: "ghost" } }), repo("real", 5)] }]);
  assert.equal(ds[0].repos[0].meta.on, undefined);
});
