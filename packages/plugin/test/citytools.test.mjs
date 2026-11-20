import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// Mike 11-19 (Duo landscape): the toolbar wrapped into tall circles over the map. One row always; what doesn't fit goes
// into a More menu, least used first; Full screen never moves; the CSS rides in the script for published pages.
test("toolbar: one row, overflow into More, least used first", () => {
  const i = CITY_JS.indexOf("function toolsFit()"); assert.ok(i > 0);
  const code = CITY_JS.slice(i, i + 9000);
  assert.match(CITY_JS, /MORDER=\['t-legend','t-topics','t-sky','t-wx','t-sf','t-under','\*','t-pop','t-snd','t-reset','t-fr','t-stores','t-labels'\]/);
  assert.match(code, /flex-wrap:nowrap!important;overflow:visible!important;z-index:20/);
  assert.match(code, /b\.id!=='t-full'/, "Full screen never goes into the menu");
  assert.match(code, /if\(used\(\)<=avail\)\{moreOpen\(false\);return\}/);
  assert.match(code, /tb\.classList\.add\('tight'\)/);
  assert.match(CITY_JS, /legendInit\(\);toolsFit\(\);setTimeout\(toolsFit,600\);window\.addEventListener\('resize',function\(\)\{toolsFit\(\)\}\)/);
  assert.match(CITY_JS, /e\.key==='Escape'&&MOREP&&!MOREP\.hidden/);
});

test("world map (Mike 11-20, map-audit item 3): three icon buttons, Layers, Overview, Full screen; every other setting in Layers", () => {
  const i = CITY_JS.indexOf("function toolsFit()"), code = CITY_JS.slice(i, i + 9000);
  assert.match(code, /if\(D\.world&&!MINI\)\{/);
  assert.match(code, /MORE\.setAttribute\('aria-label','Layers'\)/);
  assert.match(code, /rs\.setAttribute\('aria-label','Overview'\)/);
  assert.match(code, /TORD\.forEach\(function\(b\)\{if\(b!==rs2&&b!==fl&&b!==MORE\)MOREP\.appendChild\(b\)\}\)/);
  assert.match(code, /:is\(#t-more,#t-reset,#t-full\)\{width:36px;height:36px/);
});

test("Mike 11-20: the shield covers the member's buildings, not the plot; the plot is only as big as its used lots", () => {
  assert.match(CITY_JS, /function gUsed\(m\)\{var c=String\(m\.l\|\|''\),last=-1;/);
  assert.match(CITY_JS, /Math\.min\(m\.k\|0,gUsed\(m\)\)/);
  const gUsed = new Function("m", CITY_JS.match(/function gUsed\(m\)\{([^\n]*?)\}\n/)[1]);
  assert.equal(gUsed({ l: "0000" }), 2); assert.equal(gUsed({ l: "4400000000000000" }), 2); assert.equal(gUsed({ l: "4440400000000000" }), 3); assert.equal(gUsed({ l: "0000000000000004" }), 4);
  assert.match(CITY_JS, /cb=bCityBox\(k\)\|\|\[ctr,sd\*TW\*\.42\+20\];bShieldDome\(c,cb\[0\]\.x,cb\[0\]\.y\+8,cb\[1\],/);
  assert.match(CITY_JS, /if\(b\.estate\|\|!b\.d\|\|b\.d\.nb!==key\|\|b\.d\.uc\)return;/);
});
