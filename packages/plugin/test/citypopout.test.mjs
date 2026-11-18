import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, BATTLE_DRAW_JS } from "./city.build.mjs";

// Mike 11-17 "Opened hades and it shows this full screen": an app's web view loads window.open of its own site in place of
// the app's page. The city must never put its mini view in place of the page, and full screen only starts from a tap.
test("pop-out: no window on phones or app web views, never navigates this page to the mini view", () => {
  const i = CITY_JS.indexOf("var NOPOP="), j = CITY_JS.indexOf("document.addEventListener('fullscreenchange'");
  assert.ok(i > 0 && j > i);
  const code = CITY_JS.slice(i, j);
  assert.match(code, /native-ios/); assert.match(code, /pointer:coarse/);
  assert.match(code, /if\(MINI\|\|NOPOP\)bp\.hidden=true/);
  assert.match(code, /if\(NOPOP\)return;/);
  assert.ok(!/location\.href=u/.test(code), "no fallback that turns this page into the mini view");
  assert.match(code, /if\(MINI&&window\.parent===window&&!window\.opener&&NOPOP\)/, "a mini view that took over an app page goes back");
});

test("battle replay: a ?replay link plays without full screen; only a tap enlarges the map", () => {
  assert.match(BATTLE_DRAW_JS, /function bReplayStart\(mode,sp,noFull\)/);
  assert.match(BATTLE_DRAW_JS, /var full=!noFull&&vw<700/);
  assert.match(BATTLE_DRAW_JS, /bReplayStart\(mode,o&&o\.speed,o&&o\.auto\)/);
  const own = CITY_JS.replace(BATTLE_DRAW_JS, "");
  assert.equal((own.match(/cssFull\(true\)/g) || []).length, 2, "in the city itself only the Full screen button (and its fallback) call cssFull(true)");
});
