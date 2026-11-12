import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, LIFE_JS } from "./city.build.mjs";

// the pure mapping, with the module's globals stubbed
function life(mini = false) {
  const pre = `var MINI=${mini},D={districts:[{repos:[{week:12}]},{repos:[{week:4}]}]},LV={d:{},mode:'private'};`;
  return new Function(pre + LIFE_JS + `; return {targets:lifeTargets,week:LIFE_WEEK,caps:LIFE.caps}`)();
}

test("life: private feed, one figure per person on the sites now plus a small floor from the day's visitors; vehicles from commits and views", () => {
  const L = life(); assert.equal(L.week, 16, "commits this week summed over the districts");
  const t = L.targets({ A: { now: 12, visitors: 40, views: 90 }, B: { now: 0, visitors: 0, views: 0 }, C: { now: 3, visitors: 400, views: 1200 } }, 16, L.caps, "private");
  assert.equal(t.by.A, 15, "12 now + floor 3"); assert.equal(t.by.B, undefined, "nobody on B, nobody on its streets"); assert.equal(t.by.C, 3 + 4);
  assert.equal(t.p, 22);
  assert.equal(t.v, Math.round(2 + 16 / 8) + Math.round(Math.log(1 + 1290) * 1.6), "base from the week + a log term for views");
  const quiet = L.targets({}, 0, L.caps, "private"); assert.equal(quiet.p, 0); assert.equal(quiet.v, 2, "two cars even with nothing going on");
});

test("life: public feed maps activity levels to a small crowd and caps hold on a phone", () => {
  const L = life(true); assert.deepEqual(L.caps, { p: 60, v: 24 });
  const t = L.targets({ A: { level: 4 }, B: { level: 2 }, C: { level: 0 } }, 100, L.caps, "public");
  assert.equal(t.by.A, 16); assert.equal(t.by.B, 5); assert.equal(t.by.C, undefined); assert.equal(t.p, 21);
  assert.ok(t.v <= 24);
  const big = {}; for (let i = 0; i < 20; i++) big["d" + i] = { now: 30, visitors: 0 };
  const c = L.targets(big, 0, L.caps, "private"); assert.ok(c.p <= 60 + 20, "scaled to the cap (rounding up to 1 per district)"); assert.ok(Object.keys(c.by).length === 20, "every busy district keeps at least one");
});

test("life: the city script embeds the module and draws it under the buildings layer", () => {
  assert.ok(CITY_JS.includes("function lifeTargets") && CITY_JS.includes("drawLife()"));
  assert.ok(CITY_JS.indexOf("drawLife()") < CITY_JS.indexOf("cx.drawImage(L2,0,0);drawShimmer"), "people walk under the buildings in front of them");
  assert.ok(!CITY_JS.includes("LV.on=true;cars.length=0"), "ambient traffic survives live mode");
});
