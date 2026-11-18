import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, STREET_JS } from "./city.build.mjs";

// Street people and vehicles in 3D (Mike 11-18: "increase fidelity of humans and cars moving on caldera, make them
// directional, 3d and better"). The module runs standalone here with a recording canvas.
function ctx(log) {
  const st = { canvas: {} };
  return new Proxy(st, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
      return (...a) => { for (const v of a) if (typeof v === "number") assert.ok(Number.isFinite(v), `finite ${String(k)}`); log && log.push([k, ...a.filter(x => typeof x === "number")]); };
    },
    set(t, k, v) { t[k] = v; if (log && k === "fillStyle") log.push(["fill", v]); return true; },
  });
}
function load(o = {}) {
  let made = 0;
  const pre = `var sky='${o.sky || "day"}',dpr=${o.dpr || 2},cam={x:0,y:0,z:${o.z || 1}},reduce=false,GHOSTCOL='#A9C2D8',MINI=false;
    var document={createElement:function(){MADE();return {width:0,height:0,getContext:function(){return MK()}}}};`;
  const S = new Function("MK", "MADE", pre + STREET_JS + `;return {set:function(k,v){if(k==='sky')sky=v;if(k==='z')cam.z=v;if(k==='dpr')dpr=v},S3:S3,s3Ax:s3Ax,s3P:s3P,s3Box:s3Box,s3Face:s3Face,s3CarLook:s3CarLook,s3Look:s3Look,s3Dir:s3Dir,
      s3Head:s3Head,s3Lane:s3Lane,s3CarLod:s3CarLod,s3PedLod:s3PedLod,s3Boost:s3Boost,s3Bucket:s3Bucket,s3Vehicle:s3Vehicle,s3Person:s3Person,s3Cone:s3Cone,s3Cap:s3Cap,s3DrawCar:s3DrawCar,s3DrawBus:s3DrawBus,
      s3DrawScooter:s3DrawScooter,s3DrawPerson:s3DrawPerson,S3LOOKS:S3LOOKS,S3GHOST:S3GHOST,S3CREW:S3CREW,S3PAL:S3PAL,PERSON_H:PERSON_H,CAR_K:CAR_K}`)(() => ctx(), () => made++);
  S.made = () => made;
  return S;
}

test("street: embedded in the city script after the living city", () => {
  assert.ok(CITY_JS.includes(STREET_JS));
  assert.ok(CITY_JS.indexOf(STREET_JS) > CITY_JS.indexOf("function drawLife("));
});

test("street: headings follow the road (+i SE, +j SW, -i NW, -j NE) and a turn shows an in-between frame for 140 ms", () => {
  const S = load();
  const car = (i, j, ti, tj) => ({ i, j, ti, tj });
  assert.equal(S.s3Head(car(0, 0, 1, 0), 0), 0);
  assert.equal(S.s3Head(car(0, 0, 0, 1), 0), 2);
  assert.equal(S.s3Head(car(1, 0, 0, 0), 0), 4);
  assert.equal(S.s3Head(car(0, 1, 0, 0), 0), 6);
  const c = car(0, 0, 1, 0); S.s3Head(c, 1000); c.i = 1; c.ti = 1; c.tj = 1;   // now heading SW: a 90 degree turn
  assert.equal(S.s3Head(c, 1010), 1, "the 45 degree frame first");
  assert.equal(S.s3Head(c, 1200), 2, "then the new axis");
  const u = car(0, 0, 1, 0); S.s3Head(u, 0); u.i = 1; u.ti = 0;   // a U-turn
  assert.equal(S.s3Head(u, 50), 1); assert.equal(S.s3Head(u, 200), 3); assert.equal(S.s3Head(u, 300), 4);   // timed from when the turn is seen (50)
  // screen axes: forward along the iso road axis, the cross axis is the other iso axis (not the old sheared normal)
  const A = S.s3Ax(0, 1); assert.ok(Math.abs(A.ux - .894) < 1e-9 && Math.abs(A.uy - .447) < 1e-9 && Math.abs(A.vx + .894) < 1e-9 && Math.abs(A.vy - .447) < 1e-9);
  const ln = S.s3Lane(0); assert.ok(Math.abs(Math.hypot(ln[0], ln[1]) - 8) < .01, "8 px to the right of the centre line");
});

test("street: the camera sees the front of SE and SW cars, the rear of NW and NE; left faces lit, right faces dark, in every sky", () => {
  const S = load();
  const seen = h => { const v = S.s3Box(ctx(), S.s3Ax(h, 1), "day", "#D9483B", -9, 9, -4, 4, 1, 4); return v.map(f => f.id).sort().join(""); };
  assert.equal(seen(0), "Rf"); assert.equal(seen(2), "Lf"); assert.equal(seen(4), "Lr"); assert.equal(seen(6), "Rr");
  const lum = s => { const m = s.match(/\d+/g).map(Number); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; };
  for (const sk of ["day", "dusk", "night"]) {
    const top = lum(S.s3Face("#AEB6C2", sk, 0, 0, "top")), left = lum(S.s3Face("#AEB6C2", sk, 0, 1)), right = lum(S.s3Face("#AEB6C2", sk, 1, 0));
    assert.ok(top > left && left > right, `${sk}: top ${top} > left ${left} > right ${right}`);
    assert.ok((left - right) / left >= .18, `${sk}: at least 18% between neighbouring faces`);
  }
});

test("street: every car type, the bus and the scooter draw finite geometry in 8 headings, 3 skies, every level of detail, lamps on and off", () => {
  const S = load();
  for (const sk of ["day", "dusk", "night"]) for (let h = 0; h < 8; h++) for (const lod of [0, 1, 2]) for (const lamps of [false, true]) {
    for (const type of ["sedan", "hatch", "suv", "van", "pickup", "taxi"]) S.s3DrawCar(ctx(), { type, col: "#3F7FD9", h, lod, lamps, sky: sk, open: type === "van" && lamps });
    S.s3DrawBus(ctx(), { col: "#F2A33A", h, lod, lamps, sky: sk });
    S.s3DrawScooter(ctx(), { col: "#FF8A3D", h, lod, lamps, sky: sk });
  }
});

test("street: a car's type and colour are stable per seed; taxis are always yellow and no other car is", () => {
  const S = load(), seen = {};
  for (let s = 0; s < 400; s++) {
    const a = S.s3CarLook(s), b = S.s3CarLook(s); assert.deepEqual(a, b);
    seen[a.type] = (seen[a.type] || 0) + 1;
    if (a.type === "taxi") assert.equal(a.col, "#F2C14E"); else assert.notEqual(a.col, "#F2C14E");
  }
  for (const t of ["sedan", "hatch", "suv", "pickup", "taxi"]) assert.ok(seen[t] > 0, `${t} appears`);
  assert.ok(!seen.van, "plain traffic has no vans: a van means a sale");
});

test("street: people face their walking direction, walk frames follow distance, 24 looks with ghosts and crews kept apart", () => {
  const S = load();
  assert.equal(S.s3Dir(.894, .447), 0); assert.equal(S.s3Dir(-.894, .447), 1); assert.equal(S.s3Dir(-.894, -.447), 2); assert.equal(S.s3Dir(.894, -.447), 3);
  assert.equal(S.S3LOOKS.length, 24);
  assert.equal(S.s3Look(5).id, S.s3Look(5).id, "stable per seed");
  assert.equal(S.s3Look(5, "#123456").top, "#123456", "a walker's own colour is the top");
  for (const sk of ["day", "dusk", "night"]) for (const lod of [1, 2]) for (let d = 0; d < 4; d++) for (let f = 0; f < 6; f++)
    for (const L of [S.S3LOOKS[0], S.S3LOOKS[7], S.S3GHOST, S.S3CREW]) S.s3DrawPerson(ctx(), L, sk, lod, d, f);
  // a ghost is drawn only in the ghost colour (and its shadow)
  const log = []; S.s3DrawPerson(ctx(log), S.S3GHOST, "night", 2, 0, 0);
  for (const [k, v] of log) if (k === "fill" && typeof v === "string" && !v.startsWith("rgba(0,0,0")) assert.match(v, /^rgb\((169|139),(194|159),(216|177)\)$/, "ghost tone " + v);
});

test("street: detail by on-screen size, a zoom-out boost, buckets for the device, sprites built once with a budget and an LRU cap", () => {
  const S = load({ z: 2, dpr: 2 });
  assert.equal(S.s3CarLod(1), 2); assert.equal(S.s3PedLod(1), 2);
  S.set("z", 1); assert.equal(S.s3CarLod(1), 1); assert.equal(S.s3PedLod(1), 1);
  S.set("z", .4); const b = S.s3Boost(1.6); assert.ok(b > 1 && b <= 1.6); assert.equal(S.s3CarLod(b), 0);
  S.set("z", .1); assert.equal(S.s3CarLod(S.s3Boost(1.6)), -1, "micro dash far out"); assert.equal(S.s3PedLod(S.s3Boost(1.5)), -1);
  S.set("z", 1); assert.equal(S.s3Bucket(1), 2); S.set("z", 4); assert.equal(S.s3Bucket(1), 8); S.set("z", .3); assert.equal(S.s3Bucket(1), 1);
  // cache: the same car again is not rebuilt; at most 4 builds per frame; never more than 256 sprites
  S.set("z", 2);
  const c = ctx(), v = { kind: "car", type: "sedan", col: "#D9483B", h: 0, lamps: false };
  const m0 = S.made(); S.s3Vehicle(c, 0, 0, v, 1); S.s3Vehicle(c, 0, 0, v, 1); assert.equal(S.made() - m0, 1, "built once");
  S.S3.t = 1e15; S.S3.n = 0;   // one frame: the window never rolls over mid-test on a slow machine
  const m1 = S.made(); for (let h = 0; h < 8; h++) S.s3Vehicle(c, 0, 0, { ...v, col: "#3F7FD9", h }, 1);
  assert.ok(S.made() - m1 <= 4, "build budget per frame");
  for (let i = 0; i < 400; i++) { S.S3.t = -1e9; S.s3Vehicle(c, 0, 0, { ...v, col: "#" + (100000 + i), h: i % 8 }, 1); }
  assert.ok(S.S3.m.size <= 256, "LRU cap");
  // people come from one atlas per look; every frame of the atlas is the same canvas
  S.S3.t = -1e9; const m2 = S.made(); for (let d = 0; d < 4; d++) for (let f = 0; f < 5; f++) S.s3Person(c, 0, 0, S.S3LOOKS[3], d, f, 1, 1); assert.equal(S.made() - m2, 1);
});

test("street: draw caps keep the same picks frame to frame", () => {
  const S = load(), L = Array.from({ length: 200 }, (_, i) => ({ s: i }));
  const a = S.s3Cap(L, 48, x => x.s).map(x => x.s), b = S.s3Cap(L.slice().reverse(), 48, x => x.s).map(x => x.s);
  assert.equal(a.length, 48); assert.deepEqual(a.slice().sort((x, y) => x - y), b.slice().sort((x, y) => x - y));
  assert.equal(S.s3Cap(L.slice(0, 10), 48, x => x.s).length, 10);
});
