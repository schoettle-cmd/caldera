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

test("battle replay (Mike 11-21): no replay forces full screen; the viewer's own Full screen tap does, and leaving it keeps the replay", () => {
  assert.match(BATTLE_DRAW_JS, /function bReplayStart\(mode,sp,noFull,only\)/);
  assert.match(BATTLE_DRAW_JS, /var full=false;bSndStart\(!noFull\);/, "Mike 11-21: a pressed replay starts in the page");
  assert.doesNotMatch(BATTLE_DRAW_JS, /theater\(true\)/);
  assert.match(BATTLE_DRAW_JS, /full:function\(on\)\{return typeof stageFull==='function'\?stageFull\(on\):false\}/);
  assert.match(BATTLE_DRAW_JS, /bReplayStart\(mode,o&&o\.speed,o&&o\.auto,o&&o\.only\)/);
  const own = CITY_JS.replace(BATTLE_DRAW_JS, "");
  assert.equal((own.match(/cssFull\(true\)/g) || []).length, 6, "in the city itself only the Full screen button, the viewer's stageFull and the old theater (each with its fallback) call cssFull(true)");
  const sf = own.slice(own.indexOf("function stageFull(on)"), own.indexOf("function thStop()"));
  assert.doesNotMatch(sf, /thStop|bReplayEnd|THEA=/, "leaving the viewer's full screen never ends the replay");
  const th = own.slice(own.indexOf("function theater(on)"), own.indexOf("function stageFull(on)"));
  assert.equal((th.match(/cssFull\(true\)/g) || []).length, 2);
});
