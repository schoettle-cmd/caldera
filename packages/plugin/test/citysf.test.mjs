import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, CITY_CSS } from "./city.build.mjs";

// Mike 11-19: "on caldera map allow turning OFF the storefronts on website and on this pop out". A viewer switch, saved
// per viewer, default on; off hides every storefront sign and shop building. The listing's own Storefront setting is separate.
test("storefronts switch: saved per viewer, default on, in mini and full views", () => {
  assert.match(CITY_JS, /var SFON=true;try\{SFON=localStorage\.getItem\('caldera\.sf'\)!=='0'\}/);
  const i = CITY_JS.indexOf("var SFB=null;"), j = CITY_JS.indexOf("b.id='t-stores'");
  assert.ok(i > 0 && j > i);
  const code = CITY_JS.slice(i, j);
  const iife = code.split("\n").find(l => l.includes("SFB=document.createElement"));
  assert.ok(iife && !/MINI/.test(iife), "the switch also shows in the mini panel and pop-out");
  assert.match(code, /SFB\.id='t-sf'/);
  assert.match(code, /if\(!tb\|\|!storeList\(null\)\.length\)return/, "no switch in a city without storefronts");
  assert.match(code, /localStorage\.removeItem\('caldera\.sf'\)/);
  assert.match(code, /'Hide storefronts':'Show storefronts'/);
});

test("storefronts off: no signs, no marker buttons, no shop buildings; the Stores list says so", () => {
  assert.match(CITY_JS, /SIGNS=\[\];if\(PURE\)return;if\(!SFON\)\{storeKeys\(\{\}\);return\}/);
  assert.match(CITY_JS, /function sfShow\(t\)\{return SFON\|\|!t\.r\|\|!t\.r\.kind\}/);
  assert.match(CITY_JS, /if\(t\.t==='b'&&!sfShow\(t\)\)continue;/);
  assert.match(CITY_JS, /if\(t\.t==='b'&&sfShow\(t\)\)\{/);
  assert.match(CITY_JS, /Storefronts are hidden on the map\./);
  assert.match(CITY_CSS ?? CITY_JS, /#t-sf\[aria-pressed="false"\]::after/);
});
