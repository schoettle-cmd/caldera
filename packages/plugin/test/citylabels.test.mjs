import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// MB 11-18: building labels and agent tags must hide when they would sit under the toolbar chips or past the frame edge.
function load(cam, mini = false) {
  const i = CITY_JS.indexOf("var UIDRAWN="), j = CITY_JS.indexOf("function fitLabels(");
  assert.ok(i > 0 && j > i, "uiBlocked sits just before fitLabels");
  const R = [{ x0: 900, x1: 1000, y0: 10, y1: 36 }];   // one toolbar chip, top right
  return new Function("cam", "R", `var st={},vw=1200,vh=700,MINI=${mini};function controlRects(){return R}` + CITY_JS.slice(i, j) + ";return uiBlocked")(cam, R);
}

test("labels: a label under a toolbar chip or past the frame edge is hidden; one in open sky is drawn", () => {
  const ub = load({ x: 0, y: 0, z: 1 });
  assert.equal(ub([400, 300, 480, 324]), false, "open map");
  assert.equal(ub([920, 20, 980, 44]), true, "under the chip");
  assert.equal(ub([1150, 300, 1230, 324]), true, "cut by the right edge");
  assert.equal(ub([-20, 300, 40, 324]), true, "cut by the left edge");
  assert.equal(ub([400, -10, 480, 14]), true, "cut by the top edge");
  // world px go through the camera: at zoom 2 with a pan, a label at world (460,10) lands on screen (920,20)
  const z2 = load({ x: 0, y: 0, z: 2 });
  assert.equal(z2([460, 10, 490, 22]), true);
  assert.equal(z2([100, 100, 130, 112]), false);
});

test("labels: the mini embed hides its toolbar, so only the frame edge counts there", () => {
  const ub = load({ x: 0, y: 0, z: 1 }, true);
  assert.equal(ub([920, 20, 980, 44]), false);
  assert.equal(ub([1150, 300, 1230, 324]), true);
});

test("labels: the agent tags use the same check, and the test hook reports what was drawn", () => {
  assert.match(CITY_JS, /uiBlocked\(\[p\.x-w\/2,p\.y-13,p\.x\+w\/2,p\.y\]\)\)return;/);
  assert.match(CITY_JS, /uiBoxes:function\(\)/);
});
