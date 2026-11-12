import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, LIFE_JS } from "./city.build.mjs";

// the pure mapping, with the module's globals stubbed
function life(mini = false, vw = 1400) {
  const pre = `var MINI=${mini},vw=${vw},LANG={TypeScript:'#3178C6',Python:'#4FB89A'},D={districts:[{name:'A',repos:[{week:12,commits:300,language:'TypeScript'}]},{name:'B',repos:[{week:4,commits:40,language:'Python'}]},{name:'Z',repos:[{week:0,commits:0}]}]},LV={d:{},mode:'private'},AG={};`;
  return new Function(pre + LIFE_JS + `; return {targets:lifeTargets,week:LIFE_WEEK,dby:LIFE_DBY,caps:lifeCaps(),counts:function(){return lifeCounts()},retarget:lifeRetarget,LV:LV,PED:LIFE_PED,VEH:VEH}`)();
}
const DBY = { A: { week: 12, commits: 300 }, B: { week: 4, commits: 40 }, Z: { week: 0, commits: 0 } };

test("life: private feed, one walker per person on the sites now, strollers from visitors, cars from views and commits, vans for sales, scooters for signups, a bus for real daily traffic", () => {
  const L = life(); assert.equal(L.week, 16, "commits this week summed over the districts");
  assert.deepEqual(L.caps, { p: 160, v: 60, van: 12, sc: 16 }); assert.equal(L.dby.A.col, "#3178C6", "the district's colour is its biggest repo's language");
  const t = L.targets({ A: { now: 12, visitors: 2300, views: 1680, buys: 3, signups: 5 }, B: { now: 0, visitors: 90, views: 90 }, C: { now: 3, visitors: 5400, views: 12000 } }, DBY, L.caps, "private");
  assert.equal(t.by.A, 12, "12 now = 12 walking"); assert.equal(t.by.B, undefined, "nobody on B, nobody on its streets"); assert.equal(t.by.C, 3); assert.equal(t.p, 15);
  assert.equal(t.sby.A, 10, "2300 visitors / 200 = 11, capped at 10"); assert.equal(t.sby.B, undefined, "90 visitors: no stroller"); assert.equal(t.sby.C, 10);
  assert.equal(t.cars.A, Math.round(1680 / 400) + Math.round(12 / 5), "views / 400 plus commits this week / 5"); assert.equal(t.cars.B, 0 + 1, "a district with commits keeps at least one ambient car"); assert.equal(t.cars.C, 30, "12000 views / 400, no repos in the data for C");
  assert.equal(t.cars.Z, undefined, "no commits this year, no ambient car");
  assert.equal(t.vans.A, 3); assert.equal(t.scoots.A, 5); assert.equal(t.vn, 3); assert.equal(t.sn, 5);
  assert.equal(t.bus.A, 1, "500+ visitors: one bus"); assert.equal(t.bus.C, 2, "5000+: two"); assert.equal(t.bus.B, undefined); assert.equal(t.bn, 3);
  assert.deepEqual(t.raw, { walk: 15, stroll: 20, cars: 4 + 2 + 1 + 30, vans: 3, scoots: 5, bus: 3 }, "raw = the data before any cap, for the legend");
  const quiet = L.targets({}, DBY, L.caps, "private"); assert.equal(quiet.p, 0); assert.equal(quiet.v, 3, "ambient cars from commits even with nothing live (2 for A, 1 for B)");
});

test("life: caps hold per element on a phone and the undrawn remainder stays in raw", () => {
  const L = life(true); assert.deepEqual(L.caps, { p: 60, v: 24, van: 6, sc: 8 });
  const t = L.targets({ A: { now: 300, visitors: 0, views: 40000, buys: 40, signups: 30 } }, DBY, L.caps, "private");
  assert.equal(t.by.A, 42, "walkers: at most 70 % of the pedestrian cap"); assert.equal(t.raw.walk, 300);
  assert.ok(t.v <= 24, "cars capped"); assert.equal(t.raw.cars, 100 + 2 + 1); assert.equal(t.vn, 6); assert.equal(t.raw.vans, 40); assert.equal(t.sn, 8); assert.equal(t.raw.scoots, 30);
  const big = {}; for (let i = 0; i < 20; i++) big["d" + i] = { now: 30, visitors: 0 };
  const c = L.targets(big, {}, L.caps, "private"); assert.ok(c.p <= 60, "scaled to the cap"); assert.equal(Object.keys(c.by).length, 20, "every busy district keeps at least one");
  const P = life(false, 390); assert.deepEqual(P.caps, { p: 60, v: 24, van: 6, sc: 8 }, "a narrow stage counts as a phone");
});

test("life: the public feed maps activity levels to a small crowd and a few cars, never vans, scooters or a bus", () => {
  const L = life();
  const t = L.targets({ A: { level: 4 }, B: { level: 2 }, C: { level: 0 } }, DBY, L.caps, "public");
  assert.equal(t.by.A, 20); assert.equal(t.by.B, 8); assert.equal(t.by.C, undefined); assert.equal(t.p, 28);
  assert.equal(t.cars.A, 5 + 2); assert.equal(t.cars.B, 2 + 1); assert.equal(t.s, 0); assert.equal(t.vn, 0); assert.equal(t.sn, 0); assert.equal(t.bn, 0);
});

test("life: lifeCounts carries drawn and raw per element, the drones by state and the steaming roofs", () => {
  const L = life(); L.LV.d = { A: { now: 12, visitors: 2300, views: 1680, buys: 3, signups: 5 } }; L.retarget();
  const c = L.counts(); assert.deepEqual(c.walk, { n: 12, raw: 12 }); assert.deepEqual(c.vans, { n: 3, raw: 3 }); assert.deepEqual(c.scoots, { n: 5, raw: 5 }); assert.equal(c.steam, 0); assert.equal(c.mode, "private");
});

test("life: the sprites are the design's grids (4x8 people, 12x6 car, 14x7 van, 6x4 scooter, 20x8 bus) and the city embeds the module", () => {
  const L = life();
  for (const k of ["a", "b", "crew", "crewb"]) { assert.equal(L.PED[k].length, 8); L.PED[k].forEach(r => assert.equal(r.length, 4)); }
  assert.equal(L.VEH.car.length, 6); L.VEH.car.forEach(r => assert.equal(r.length, 12));
  assert.equal(L.VEH.van.length, 7); L.VEH.van.forEach(r => assert.equal(r.length, 14));
  assert.equal(L.VEH.scooter.length, 4); L.VEH.scooter.forEach(r => assert.equal(r.length, 6));
  assert.equal(L.VEH.bus.length, 8); L.VEH.bus.forEach(r => assert.equal(r.length, 20));
  assert.ok(CITY_JS.includes("function lifeTargets") && CITY_JS.includes("drawLife()") && CITY_JS.includes("drawVehicles()"));
  assert.ok(CITY_JS.indexOf("drawLife()") < CITY_JS.indexOf("cx.drawImage(L2,0,0);drawShimmer"), "people walk under the buildings in front of them");
  assert.ok(CITY_JS.indexOf("drawSteam(cx") > CITY_JS.indexOf("cx.drawImage(L2,0,0);drawShimmer") && CITY_JS.indexOf("drawSteam(cx") < CITY_JS.indexOf("drawAgents(cx"), "steam rises over the buildings, under the drones");
  assert.ok(!CITY_JS.includes("function reconcile("), "the per-visitor cars are gone: people are walkers, views are cars");
  assert.ok(CITY_JS.includes("STEAM.push({") && CITY_JS.includes("CREWS.push({"), "the objects layer lists the steaming roofs and the crews");
  assert.ok(CITY_JS.includes("fit();lifeRetarget();lifeCars();legendInit();"), "the population, the traffic and the legend start once every module exists");
});
