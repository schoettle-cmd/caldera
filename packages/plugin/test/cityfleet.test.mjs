import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// The Orpheus fleet on the world map (FLEET.md piece 1, Fable 11-24): a pin per member who runs Orpheus, gold for the
// Founding Fleet, drawn after every other label; the toggle shows only the fleet (?fleet=orpheus).
function fakeCtx(log) {
  const c = { font: "", fillStyle: "", strokeStyle: "", lineWidth: 1, shadowColor: "", shadowBlur: 0, shadowOffsetY: 0, textAlign: "", textBaseline: "", globalAlpha: 1, globalCompositeOperation: "source-over" };
  for (const k of ["setTransform", "clearRect", "save", "restore", "beginPath", "moveTo", "lineTo", "arcTo", "arc", "closePath", "fill", "stroke", "fillRect", "rect"]) c[k] = () => {};
  c.measureText = t => ({ width: String(t).length * 7 });
  c.createLinearGradient = () => ({ addColorStop: (_, col) => log.push(["stop", col]) });
  c.fillText = (t) => log.push(["text", t, c.fillStyle]);
  return c;
}
function load({ m, fleetUrl = false, focus = null }) {
  const i = CITY_JS.indexOf("function worldLabels("), j = CITY_JS.indexOf("// friendships as rays of light");
  assert.ok(i > 0 && j > i, "worldLabels and the fleet code sit before the rays");
  const log = [], drawn = [];
  const NBS = Object.keys(m).map((k, n) => ({ key: k, rep: { d: { nb: k } }, ox: n * 12, oy: 0, w: 4, h: 4 }));
  const env = {
    c3: fakeCtx(log), L3: { width: 1200, height: 700 }, dpr: 1, cam: { x: 0, y: 0, z: 1 }, vw: 1200, vh: 700, TH: 16, PURE: false, NBS, WORLD: { m },
    WFOCUS: focus ? { d: { nb: focus } } : null, WHOVER: null, LIT: {}, blocks: [], AG: {}, SHOP: null, LMODE: "smart", FITZ: 1, tagHits: [], NBM: {},
    LBL: () => true, worldMe: () => null, worldFriends: () => ({}), worldScores: () => ({}),
    nbTop: n => ({ x: 100 + n.ox * 20, y: 300 }), iso: (a, b) => ({ x: a, y: b }), corner: (a, b) => [a, b], dockAt: () => ({ x: 0, y: 0 }),
    pill: (c, x, y, text) => drawn.push(["pill", text]), ucPill: () => {}, yChip: () => {}, e: s => String(s),
    location: { search: fleetUrl ? "?fleet=orpheus" : "", href: "http://hub.test/world" + (fleetUrl ? "?fleet=orpheus" : "") },
    history: { state: null, replaceState: (_, __, u) => log.push(["url", u]) }, document: { getElementById: () => null }, st: null,
    byName: Object.fromEntries(NBS.map(n => [n.key, n.rep])), worldFocus: () => {}, draw: () => {}, window: {},
  };
  const names = Object.keys(env);
  const body = `var WLAB,late;` + CITY_JS.slice(i, j).replace(/function fleetPill\(c,x,y,text,gold,font\)\{/, "function fleetPill(c,x,y,text,gold,font){__pins.push([text,gold]);")
    + `;return {worldLabels:worldLabels,orphLine:orphLine,fleetSet:fleetSet,get FLEET(){return FLEET},fleetPill:fleetPill}`;
  const pins = [];
  const api = new Function(...names, "__pins", body)(...names.map(k => env[k]), pins);
  return { api, log, drawn, pins, env };
}

test("fleet pin: members who run Orpheus get a pin, gold for the Founding Fleet, drawn after every other label", () => {
  const { api, drawn, pins } = load({ m: { "@ada": { orph: 2 }, "@bo": { orph: 1 }, "@cy": {} } });
  api.worldLabels([]);
  assert.deepEqual(pins.map(p => p[0]).sort(), ["@ada", "@bo"]);
  assert.deepEqual(pins.find(p => p[0] === "@ada")[1], true, "Founding Fleet = gold");
  assert.deepEqual(pins.find(p => p[0] === "@bo")[1], false);
  assert.deepEqual(drawn.map(d => d[1]), ["@cy"], "an unlinked member keeps the plain pill");
});

test("fleet pin: the pin is drawn with the design's colors (gold and violet-white)", () => {
  const g = load({ m: {} }); g.api.fleetPill(g.env.c3, 100, 100, "@ada", true, "700 13px X");
  assert.deepEqual(g.log.filter(x => x[0] === "stop").map(x => x[1]), ["#FFE7A6", "#E9AE3B"]);
  assert.deepEqual(g.log.find(x => x[0] === "text").slice(1), ["@ada", "#2A1B00"]);
  const n = load({ m: {} }); n.api.fleetPill(n.env.c3, 100, 100, "@bo", false, "700 13px X");
  assert.deepEqual(n.log.filter(x => x[0] === "stop").map(x => x[1]), ["#FFFFFF", "#E6DEFF"]);
  assert.deepEqual(n.log.find(x => x[0] === "text").slice(1), ["@bo", "#1A1330"]);
});

test("fleet pin: a must-show (priority under .7), above friends and others", () => {
  assert.match(CITY_JS, /pr=k===foc\?0:k===WHOVER\?\.3:k===me\?\.6:of\?\.65:fr\[k\]\?\.8:1/);
  assert.match(CITY_JS, /if\(g\.orph\)late\.push\(g\);else/);
  assert.match(CITY_JS, /late\.forEach\(function\(g\)\{fleetPill\(c,g\.x,g\.y,g\.text,g\.orph===2,g\.font\)\}\)/);
});

test("fleet toggle: ?fleet=orpheus shows only the fleet; the focused city keeps its label", () => {
  const a = load({ m: { "@ada": { orph: 1 }, "@cy": {}, "@di": {} }, fleetUrl: true, focus: "@di" });
  assert.equal(a.api.FLEET, true);
  a.api.worldLabels([]);
  assert.deepEqual(a.pins.map(p => p[0]), ["@ada"]);
  assert.deepEqual(a.drawn.map(d => d[1]), ["@di"], "@cy hidden, the focused @di kept");
  // switching off: all labels, and the URL loses ?fleet
  a.api.fleetSet(false);
  assert.equal(a.api.FLEET, false);
  assert.deepEqual(a.log.filter(x => x[0] === "url").at(-1), ["url", "/world"]);
  a.api.fleetSet(true);
  assert.deepEqual(a.log.filter(x => x[0] === "url").at(-1), ["url", "/world?fleet=orpheus"]);
});

test("fleet toggle: no linked member = no toggle (the URL flag does nothing)", () => {
  const a = load({ m: { "@cy": {} }, fleetUrl: true });
  assert.equal(a.api.FLEET, false);
  assert.equal(a.api.fleetSet(true), false);
  assert.match(CITY_JS, /if\(WORLD&&!FLEETN\)\{if\(bto\)bto\.remove\(\);var ofr=document\.getElementById\('of-row'\);if\(ofr\)ofr\.remove\(\)\}/);
  assert.match(CITY_JS, /MORDER=\['t-legend','t-topics','t-orph','t-sky'/);
});

test("world card: Runs on Orpheus line (gold: Founding Fleet), map link with ref; nothing for unlinked", () => {
  const { api } = load({ m: { "@ada": { orph: 2 }, "@bo": { orph: 1 }, "@cy": {} } });
  const g = api.orphLine("@ada"), n = api.orphLine("@bo");
  assert.match(g, /class="k k-orph gold"/); assert.match(g, /Founding Fleet &middot; Runs on Orpheus/);
  assert.match(n, /class="k k-orph"/); assert.match(n, />Runs on Orpheus <span/);
  assert.match(n, /href="https:\/\/useorpheus\.com\/\?utm_source=caldera&utm_medium=map&utm_campaign=tie&ref=bo"/);
  assert.equal(api.orphLine("@cy"), "");
});

test("Founding Fleet pins carry Orpheus's official gold pin (Orpheus Dev 11-24); normal pins keep the drawn mark", () => {
  assert.ok(CITY_JS.includes("new Path2D('M12 22s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12z')"));
  assert.ok(CITY_JS.includes("c.fillStyle='#e2c064'") && CITY_JS.includes("c.fillStyle='#1c1608'"));
  assert.ok(/if\(gold&&typeof Path2D!=='undefined'\)\{[\s\S]*?\}\s*else\{c\.strokeStyle=ink/.test(CITY_JS));
});
