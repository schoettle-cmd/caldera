import { test } from "node:test";
import assert from "node:assert/strict";
import { placeStorefronts, scrubSignHosts, cityData, publicCity, applyPrivateMode, CITY_JS } from "./city.build.mjs";
import { parseListingLine, toListing, withListingsPublic, withListingsPrivate } from "./listings.build.mjs";

const repo = (name, commits, extra = {}) => ({ name, project: "P", public: true, language: "TypeScript", commits, weeks: [], week: 0, today: 0, ...extra });
const shop = (name, extra = {}) => ({ name, project: "P", public: true, language: "Web", commits: 0, weeks: [], week: 0, today: 0, kind: "site", url: "https://" + name.toLowerCase() + ".com/", meta: {}, ...extra });
const city = () => [{ name: "P", notes: 0, repos: [repo("giant", 4000), repo("tower", 300), repo("mid", 40), repo("low", 2), shop("Alpha"), shop("Beta"), shop("Gamma"), shop("Delta")] },
  { name: "Q", notes: 0, repos: [repo("q-tall", 40), shop("Echo", { meta: { on: "q-tall" } })] }];

test("signs: placement is deterministic (same data, same signs, whatever order the repos come in)", () => {
  const key = p => p.map(x => `${x.r.name}>${x.host.name}`).sort().join(",");
  const a = key(placeStorefronts(city())), b = key(placeStorefronts(city()));
  assert.equal(a, b);
  const shuffled = city(); shuffled[0].repos.reverse();
  assert.equal(key(placeStorefronts(shuffled)), a);
});

test("signs: one sign per building first, so they spread out", () => {
  const pl = placeStorefronts(city());
  assert.equal(pl.length, 5, "every listing gets a sign");
  const p = pl.filter(x => x.r.name !== "Echo").map(x => x.host.name);
  assert.equal(new Set(p).size, 4, "four listings, four different buildings: " + p);
  assert.ok(pl.every(x => x.host !== x.r && !x.host.kind));
});

test("signs: a listing tied to a repo floats above that repo's building, even when it already has one", () => {
  const ds = city(); ds[1].repos.push(shop("Foxtrot", { meta: { on: "q-tall" } }));
  const pl = placeStorefronts(ds);
  assert.equal(pl.find(p => p.r.name === "Echo").host.name, "q-tall");
  assert.equal(pl.find(p => p.r.name === "Foxtrot").host.name, "q-tall");
});

test("signs: padlocked buildings never carry a sign; a listing with nowhere to float keeps a shop of its own", () => {
  const ds = [{ name: "Apps & sites", notes: 0, repos: [shop("Solo")] }, { name: "Z", notes: 0, repos: [repo("", 50, { public: false, locked: true, language: "Private" }), shop("Near")] }];
  for (const p of placeStorefronts(ds)) assert.equal(p.host, p.r, p.r.name + " stands alone");
});

test("signs: the renderer embeds the same placement and draws signs after every building, readable at any zoom", () => {
  assert.ok(CITY_JS.includes("function sfPlace(ds)"));
  assert.ok(/fB\)\}\)\}\n  drawSigns\(\)\}/.test(CITY_JS), "signs are drawn last (after buildings and labels), so nothing hides one");
  assert.ok(CITY_JS.includes("SFA.get(t.r)"), "the store directory lists signs floating above buildings");
  assert.ok(CITY_JS.includes("(vw<600?24:32))/z"), "a minimum on-screen size");
});

test("helicopters: tied to current viewers, capped, none when nobody is viewing", () => {
  assert.ok(CITY_JS.includes("'/v1/viewing/'+HND") && CITY_JS.includes("HCAP=3"));
  assert.ok(!CITY_JS.includes("/v1/visits"), "no more replay of the last days' visitors");
  assert.ok(/if\(!reduce\)want\.forEach/.test(CITY_JS), "reduced motion: the count only");
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

// ---- Mike 2026-11-04: "make sure they're in front of the construction cranes and clickable to their destination"
const frame = CITY_JS.slice(CITY_JS.indexOf("function frame(){"), CITY_JS.indexOf("function draw(){"));
test("signs: drawn after cranes, helicopters, agents and labels (their own layer, composited last)", () => {
  const at = k => { const i = frame.indexOf(k); assert.ok(i >= 0, k); return i; };
  const signs = at("cx.drawImage(L4,0,0)");
  for (const k of ["drawLive()", "drawFx()", "drawAgents(cx", "drawHelis(cx", "cx.drawImage(L3,0,0)", "cx.drawImage(L2,0,0)"]) assert.ok(at(k) < signs, k + " comes before the signs");
  assert.ok(/cranes\.forEach/.test(CITY_JS.slice(CITY_JS.indexOf("function drawLive("), CITY_JS.indexOf("function drawLive(") + 4000)), "cranes are drawn in drawLive");
  assert.ok(CITY_JS.includes("function drawSigns(){var z=cam.z,placed=[],items=[],c=c4;"), "signs paint onto L4, not the buildings layer");
  assert.ok(!/\.c-heli\{[^}]*top:70px/.test(CITY_JS) && !CITY_JS.includes("left:50%;top:70px"), "the viewing pill no longer sits over the top sign");
});

test("signs: a click opens the listing's store or website, never the building or crane under it", () => {
  const atFn = CITY_JS.slice(CITY_JS.indexOf("function at(px,py){"), CITY_JS.indexOf("var ptr={}"));
  const iSign = atFn.indexOf("SHITS"), iTag = atFn.indexOf("tagHits"), iAgent = atFn.indexOf("for(var aid in AG)"), iHits = atFn.indexOf("hits.length-1");
  assert.ok(iSign > 0 && iSign < iTag && iSign < iAgent && iSign < iHits, "signs are hit-tested before labels, agents and buildings");
  assert.ok(CITY_JS.includes("SHITS.push({r:r,d:g.d,sign:1,url:repoUrl(r),"), "a sign's target is its listing's URL");
  assert.ok(/if\(h&&h\.url\)return openRepo\(h\.url\)/.test(CITY_JS), "a tap with a URL opens it in a new tab");
  assert.ok(CITY_JS.includes("window.open(u,'_blank','noopener')"));
  assert.ok(CITY_JS.includes("var m=44/z"), "the whole card is a 44 px target");
  assert.ok(CITY_JS.includes("h.url||h.sign||"), "pointer cursor over a sign");
  assert.ok(CITY_JS.includes("if(h&&h.r&&!h.sign&&!MINI)openRepo"), "a double click doesn't open a second tab");
});

test("city canvas recovery (Mike 2026-11-05, black city on the Hades card): context loss, health checks, parent messages, mini DPR cap", () => {
  assert.ok(CITY_JS.includes("cv.addEventListener('contextlost',function(e){e.preventDefault();lose()})"), "contextlost: stop and tell the parent");
  assert.ok(CITY_JS.includes("cv.addEventListener('contextrestored',function(){recover()})"), "contextrestored: rebuild and redraw");
  assert.ok(/lostT=setTimeout\(function\(\)\{if\(LOST\)location\.reload\(\)\},2000\)/.test(CITY_JS), "not back in 2 s: reload");
  assert.ok(CITY_JS.includes("postMessage({type:'caldera-city',state:s},'*')") && CITY_JS.includes("postState('ready')"), "ready after the first real frame");
  assert.ok(CITY_JS.includes("dpr=Math.min(window.devicePixelRatio||1,MINI?1.5:3)"), "mini frame DPR capped at 1.5");
  assert.ok(CITY_JS.includes("new IntersectionObserver(") && CITY_JS.includes("ONSCREEN&&!LOST&&"), "mini pauses off screen");
  assert.ok(CITY_JS.includes("m.type==='caldera-city-ping'"), "answers the parent's ping");
});
