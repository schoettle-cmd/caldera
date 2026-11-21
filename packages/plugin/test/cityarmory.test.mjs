// The Armory yard on the growth plot (cityarmory.ts, Fable's ARMORY.md 2026-11-21): which lots it takes, how counts become
// pallets, and its state from the clock against the 10:00 UTC battle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, ARMORY_RULES_JS } from "./city.build.mjs";

const R = new Function(ARMORY_RULES_JS + "; return {yLotI:yLotI,yOrder:yOrder,yLay:yLay,yPlan:yPlan,yPhase:yPhase,yDrain:yDrain,yArs:yArs,yFired:yFired,yState:yState,yTexts:yTexts,ySum:ySum,YCAP:YCAP};")();
const H = 36e5, B = Date.UTC(2026, 10, 21, 10), utc = (h, m = 0, d = 21) => Date.UTC(2026, 10, d, h, m);
const glyphs = p => p.pallets.reduce((t, x) => t + x.g, 0);

test("armory: counts to pallets: one size per pallet at its capacity, heaviest (nearest the launcher) first", () => {
  const p = R.yPlan({ shell: 1, rocket: 2, tactical: 1, cruise: 5 }, 6);
  assert.equal(p.u, 1, "one drawn missile is one real missile while it fits");
  assert.deepEqual(p.pallets, [{ k: "cruise", g: 2 }, { k: "cruise", g: 2 }, { k: "cruise", g: 1 }, { k: "tactical", g: 1 }, { k: "rocket", g: 2 }, { k: "shell", g: 1 }]);
  assert.deepEqual(R.YCAP, { cruise: 2, tactical: 3, rocket: 6, shell: 9 });
  assert.deepEqual(R.yPlan({ shell: 20 }, 6).pallets, [{ k: "shell", g: 9 }, { k: "shell", g: 9 }, { k: "shell", g: 2 }]);
  assert.deepEqual(R.yPlan({ tactical: 7, rocket: 6 }, 6).pallets.map(x => x.k), ["tactical", "tactical", "tactical", "rocket"]);
  for (const n of [{ cruise: 3, shell: 40 }, { rocket: 13, tactical: 4 }, { shell: 1, cruise: 1 }]) {
    const P = R.yPlan(n, 6), order = ["cruise", "tactical", "rocket", "shell"];
    for (const x of P.pallets) assert.ok(x.g >= 1 && x.g <= R.YCAP[x.k], "never over a pallet's capacity");
    for (let i = 1; i < P.pallets.length; i++) assert.ok(order.indexOf(P.pallets[i - 1].k) <= order.indexOf(P.pallets[i].k), "heaviest first");
  }
});

test("armory: huge days scale by 2, 5, 10, 25, 50, 100 (the first step that fits); past 100 the first Y pallets", () => {
  const cases = [[54, 1], [100, 2], [200, 5], [500, 10], [1000, 25], [2000, 50], [5000, 100]];
  for (const [n, u] of cases) { const p = R.yPlan({ shell: n }, 6); assert.equal(p.u, u, `${n} shells: one glyph = ${u}`); assert.ok(p.pallets.length <= 6); assert.equal(glyphs(p), Math.ceil(n / u)); }
  assert.equal(R.yPlan({ rocket: 40 }, 6).u, 2, "40 rockets need 7 pallets at 1, 4 at 2");
  const big = R.yPlan({ shell: 10000 }, 6); assert.equal(big.u, 100); assert.equal(big.pallets.length, 6, "keeps the first Y pallets"); assert.equal(glyphs(big), 54);
  assert.equal(R.yPlan({ cruise: 3, shell: 3 }, 2).u, 2, "fewer pallet lots: scales sooner");
});

test("armory: zero missiles keep the bunker, the flat launcher and two empty pallets", () => {
  assert.deepEqual(R.yPlan({}, 6), { u: 1, pallets: [] }); assert.deepEqual(R.yPlan(null, 6), { u: 1, pallets: [] });
  const lay = R.yLay(4, "1111110000000000".split("").map(Number));
  for (const D of [null, { members: {} }, { at: new Date(utc(15)).toISOString(), next: B + 864e5, members: { "@a": { n: { shell: 0, rocket: 0, tactical: 0, cruise: 0 } } } }]) {
    const st = R.yState(lay, D, "@a", utc(15));
    assert.equal(st.N, 0); assert.equal(st.np, 2, "two pallet lots stay paved"); assert.deepEqual(st.pallets, []); assert.equal(st.heavy, null);
    assert.ok(lay.la && lay.ar, "launcher and armory always there");
    assert.deepEqual(R.yTexts(st, "02:00"), { chip: "Armory", tip: "Armory · empty. Ship today to build missiles for 02:00." });
  }
});

test("armory: the yard takes only empty lots (code 0), front corner first; a full plot moves it outside the road", () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let t = 0; t < 400; t++) {
    const S = 2 + Math.floor(rnd() * 7), codes = Array.from({ length: S * S }, () => rnd() < .45 ? 0 : 1 + Math.floor(rnd() * 7)), lay = R.yLay(S, codes);
    const lots = [lay.la, lay.ar, ...lay.pal], free = codes.filter(c => c === 0).length;
    assert.equal(new Set(lots.map(String)).size, lots.length, "no lot used twice");
    if (lay.out) { assert.ok(free < 4); for (const [a, b] of lots) assert.equal(Math.max(a, b), S + 1, "outside the plot road"); assert.equal(lay.Y, 3); }
    else { assert.ok(free >= 4); for (const [a, b] of lots) { assert.ok(a < S && b < S); assert.equal(codes[R.yLotI(a, b)], 0, "a built lot is never used"); } assert.equal(lay.Y, Math.min(6, free - 2)); }
  }
  const all0 = R.yLay(3, Array(9).fill(0));
  assert.deepEqual(all0.la, [2, 2], "launcher on the front corner"); assert.deepEqual(all0.ar, [2, 1]); assert.deepEqual(all0.pal, [[1, 2], [1, 1], [2, 0], [0, 2], [1, 0], [0, 1]]); assert.equal(all0.Y, 6);
  assert.deepEqual(R.yLay(2, [1, 1, 1, 0]), { out: true, la: [3, 3], ar: [3, 2], pal: [[2, 3], [3, 1], [1, 3]], Y: 3 });
  // a lot index matches citygrowth.ts gLot/gXY
  const gXY = i => { const r = Math.floor(Math.sqrt(i)), o = i - r * r; return o < r ? [r, o] : o === r ? [r, r] : [o - r - 1, r]; };
  for (let i = 0; i < 64; i++) assert.equal(R.yLotI(...gXY(i)), i);
});

test("armory: the state from the clock vs the 10:00 UTC battle (Stock, Load from 02:00, Ready from 09:30, Fired to 14:00)", () => {
  const P = t => R.yPhase(t, 10 * H);
  assert.deepEqual(P(utc(1, 59)), { ph: "stock", B, last: B - 864e5, f: 0 });
  assert.equal(P(utc(2)).ph, "load"); assert.equal(P(utc(2)).f, 0); assert.equal(P(utc(2)).B, B);
  assert.equal(P(utc(5, 45)).f, .5); assert.equal(P(utc(9, 29)).ph, "load");
  assert.equal(P(utc(9, 30)).ph, "ready"); assert.equal(P(B - 1).ph, "ready");
  assert.deepEqual(P(B), { ph: "fired", B: B + 864e5, last: B, f: 0 }); assert.equal(P(utc(13, 59)).ph, "fired");
  assert.deepEqual(P(utc(14)), { ph: "stock", B: B + 864e5, last: B, f: 0 }); assert.equal(P(utc(23, 59)).ph, "stock");
  assert.equal(R.yPhase(utc(2)).ph, "load", "10:00 UTC when the data has no time");
  // the launcher and the bunker in each state
  const A = new Function("var GROW=null,reduce=false,sky='day',TW=64,TH=32,window={};function mix(h){return h}" + CITY_JS.slice(CITY_JS.indexOf("var YCAP="), CITY_JS.indexOf("// ---- the hooks")) + ";return {yLaunch:yLaunch}")();
  const st = (ph, f = 0, gone = 0) => ({ ph, f, gone, heavy: "cruise" });
  let L = A.yLaunch(st("stock"), null, false); assert.equal(L.angle, 0); assert.equal(L.k, null);
  L = A.yLaunch(st("load", .5, 0), null, false); assert.equal(L.angle, 0); assert.equal(L.k, null, "nothing on the rail until the first missile moves"); assert.equal(L.lampCol, "#FFB347"); assert.equal(L.lamps, 2);
  L = A.yLaunch(st("load", .5, 3), null, true); assert.equal(L.k, "cruise"); assert.equal(L.beacon, null, "the blinking beacon is drawn live, not in the sprite");
  L = A.yLaunch(st("ready", 1, 9), null, false); assert.equal(L.angle, 1.01); assert.equal(L.k, "cruise"); assert.equal(L.lamps, 3); assert.equal(L.lampCol, "#5BE08A");
  assert.equal(A.yLaunch(st("ready", 1, 9), .5, false).angle, 1.01 * .5, "the arm's tween");
  L = A.yLaunch(st("fired"), null, false); assert.equal(L.angle, 1.01); assert.equal(L.k, null); assert.ok(L.fired);
});

test("armory: Load drains the stacks (the first glyph of pallet 0 onto the rail, then from the last pallet back); Ready is empty", () => {
  const pl = R.yPlan({ shell: 1, rocket: 2, tactical: 1, cruise: 5 }, 6).pallets;
  assert.deepEqual(R.yDrain(pl, "stock", 0), { gl: [2, 2, 1, 1, 2, 1], G: 9, gone: 0 });
  assert.deepEqual(R.yDrain(pl, "load", .56), { gl: [1, 2, 1, 0, 0, 0], G: 9, gone: 5 });
  assert.deepEqual(R.yDrain(pl, "ready", 1), { gl: [0, 0, 0, 0, 0, 0], G: 9, gone: 9 });
  assert.deepEqual(R.yDrain(pl, "fired", 0).gone, 0, "after the battle: the new day's stacks");
});

test("armory: which arsenal shows (nx before the day's battle, n after), the true counts, and the labels", () => {
  const D = { at: new Date(utc(3)).toISOString(), next: B, t0: B - 864e5, members: { "@a": { n: { shell: 2 }, nx: { cruise: 1, rocket: 3 } } }, shots: [["@a", "@b", "cruise", 1], ["@a", "@c", "rocket", 1], ["@b", "@a", "shell", 1]] };
  assert.deepEqual(R.yArs(D, "@a", B), { cruise: 1, rocket: 3 }, "00:00 to 10:00 UTC: the arsenal that fires at 10:00");
  assert.deepEqual(R.yArs({ ...D, members: { "@a": { n: { shell: 2 } } } }, "@a", B), { shell: 2 }, "an older hub without nx: today's");
  const D2 = { ...D, at: new Date(utc(15)).toISOString(), next: B + 864e5, t0: B, members: { "@a": { n: { shell: 2 } }, "@b": { n: {} } } };   // after its day's battle the hub sends no nx
  assert.deepEqual(R.yArs(D2, "@a", B + 864e5), { shell: 2 }, "after the battle: today's arsenal fires tomorrow");
  assert.deepEqual(R.yArs({ ...D, at: new Date(utc(23, 0, 20)).toISOString(), next: B, members: { "@a": { n: { shell: 2 } } } }, "@a", B), { shell: 2 }, "a page open since yesterday evening: yesterday's n fires at 10:00");
  assert.equal(R.yArs(D, "@zz", B), null); assert.equal(R.yArs(D, "@a", B + 3 * 864e5), null, "stale data shows nothing rather than a wrong count");
  assert.equal(R.yFired(D2, "@a", B), 2, "fired last night: the night's shots"); assert.equal(R.yFired(D2, "@b", B), 1);
  const lay = R.yLay(4, Array(16).fill(0));
  let st = R.yState(lay, D, "@a", utc(3)); assert.equal(st.ph, "load"); assert.equal(st.N, 4); assert.equal(st.heavy, "cruise");
  assert.deepEqual(R.yTexts(st, "02:00"), { chip: "Armory · loading 4", tip: "Armory · loading 4 for 02:00." });
  st = R.yState(lay, D, "@a", utc(9, 40)); assert.deepEqual(R.yTexts(st, "02:00"), { chip: "Armory · 4 ready", tip: "Armory · 4 ready for 02:00." });
  st = R.yState(lay, D, "@a", utc(1)); assert.deepEqual(R.yTexts(st, "02:00"), { chip: "Armory · 4", tip: "Armory · 4 missiles for tonight, 02:00." });
  st = R.yState(lay, D2, "@a", utc(11)); assert.equal(st.ph, "fired"); assert.equal(st.N, 2, "the new day's stacks"); assert.deepEqual(R.yTexts(st, "02:00"), { chip: "Armory · fired 2", tip: "Armory · fired 2 last night." });
  st = R.yState(lay, { ...D2, members: { "@a": { n: { shell: 1 } } } }, "@a", utc(15)); assert.equal(R.yTexts(st, "02:00").tip, "Armory · 1 missile for tonight, 02:00.");
});

test("armory: wired into the growth plot, the labels, the tap and the parade banner; the kit draws without errors", () => {
  for (const s of ["if(yardObject(c,g,t.a,t.b,p))return;if(t.a>=S||t.b>=S)return;", "if(YD)yardGround(c,g,YD)", "yardOver(c,tn);", "yardLabels(cand,S)", "yChip(c,g.x,g.y,g.text,g.dots,g.font)", "window.CALDERA_ARMORY_OPEN(h.armory", "+yardRow(key)", "function gBanner("])
    assert.ok(CITY_JS.includes(s), s);
  assert.ok(!/pill\(c,sx,sy,banner/.test(CITY_JS), "the parade's purple pill is gone");
  new Function(CITY_JS);
  const ops = { n: 0 }, ctx = new Proxy({}, { get(t, k) { if (k in t) return t[k]; if (k === "measureText") return () => ({ width: 30 }); return (...a) => { ops.n++; for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite " + String(k)); }; }, set(t, k, v) { t[k] = v; return true; } });
  for (const sky of ["day", "evening", "night"]) {
    const K = new Function(`var GROW=null,reduce=false,sky='${sky}',TW=64,TH=32,window={};function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function mix(h,f,t){var a=rgb(h),b=rgb(t);return 'rgb('+a.map(function(v,i){return Math.round(v+(b[i]-v)*f)}).join(',')+')'}function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}`
      + CITY_JS.slice(CITY_JS.indexOf("var YCAP="), CITY_JS.indexOf("// ---- the hooks")) + ";return {yArmory:yArmory,yLauncher:yLauncher,yStack:yStack,yCart:yCart,yLaunch:yLaunch}")();
    for (const far of [false, true]) {
      K.yArmory(ctx, { door: "open", lamp: "#FFB347", flag: "#3178C6" }, far); K.yArmory(ctx, { door: "shut", lamp: "", flag: "#3178C6" }, far);
      for (const ph of ["stock", "load", "ready", "fired"]) K.yLauncher(ctx, K.yLaunch({ ph, f: .5, gone: 2, heavy: "tactical" }, null, false), far);
      for (const k of ["cruise", "tactical", "rocket", "shell", null]) for (const g of [0, 1, 9]) K.yStack(ctx, k, g, far);
      K.yCart(ctx, "rocket");
    }
  }
  assert.ok(ops.n > 1000);
});
