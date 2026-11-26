import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// Mike 11-19 (Duo landscape): the toolbar wrapped into tall circles over the map. One row always; what doesn't fit goes
// into a More menu, least used first; Full screen never moves; the CSS rides in the script for published pages.
test("toolbar: one row, overflow into More, least used first", () => {
  const i = CITY_JS.indexOf("function toolsFit()"); assert.ok(i > 0);
  const code = CITY_JS.slice(i, i + 9000);
  assert.match(CITY_JS, /MORDER=\['t-legend','t-topics','t-orph','t-sky','t-wx','t-sf','t-under','\*','t-pop','t-snd','t-reset','t-fr','t-stores','t-labels'\]/);
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

test("Mike 11-20: on a phone the replay camera keeps every missile in the air on screen, zooming out if it must", () => {
  const grab = (name) => { const i = CITY_JS.indexOf("function " + name + "("); assert.ok(i > 0, name); let d = 0, k = CITY_JS.indexOf("{", i);
    for (; k < CITY_JS.length; k++) { if (CITY_JS[k] === "{") d++; else if (CITY_JS[k] === "}" && --d === 0) break; } return CITY_JS.slice(i, k + 1); };
  const bKeep = new Function("FITZ", grab("bKeep") + "; return bKeep;")(0.3);
  const on = (fr, p, vw, vh) => { const sx = (p.x - fr.x) * fr.z + vw / 2, sy = (p.y - fr.y) * fr.z + vh / 2; return sx >= 0 && sx <= vw && sy >= 0 && sy <= vh * 0.66 + 1; };
  const fr = { x: 0, y: 0, z: 1.2 }, pts = [{ x: 400, y: -500 }, { x: 380, y: -460 }];
  const k = bKeep(fr, pts, 390, 844); pts.forEach(p => assert.ok(on(k, p, 390, 844), JSON.stringify(k)));
  const wide = [{ x: -2000, y: 0 }, { x: 2000, y: -300 }]; const k2 = bKeep(fr, wide, 390, 844); assert.ok(k2.z < fr.z && k2.z >= 0.24 - 1e-9);
  assert.deepEqual(bKeep(fr, [], 390, 844), fr);
  assert.match(CITY_JS, /live=bKeep\(fly,bFlying\(b,now\),vw,vh\);return now<e0\?live:bCamMix5\(live,hit,/, "in the air the live frame keeps the missiles; from 55% of the flight it eases to the settled hit frame (11-26)");
});

test("Mike 11-20: zoomed out, a hit tower is cut to its stump and charred like close up (no whole block)", () => {
  assert.match(CITY_JS, /else\{var th=dm\?Math\.min\(t\[1\],Math\.max\(0,stand-v0\)\):t\[1\];/);
  assert.match(CITY_JS, /prismHi\(c,x,top,t\[0\],th,dm\?mix\(tc,Math\.min\(\.65,\.2\+\.5\*dm\.d\),'#3A3D47'\):tc,\{floors:false\}\);if\(th<t\[1\]\)\{cut=true;top-=th;return\}/);
});

test("Mike 11-20: the top attackers (saved picture, results board) link to the member's Caldera profile with their avatar; raiders stay plain", () => {
  assert.match(CITY_JS, /function bcLink\(h\)\{if\(!h\|\|h\.charAt\(0\)!=='@'\|\|bcRaid\(h\)\)return null;/);
  assert.match(CITY_JS, /r\.a===cur&&up>0\?up:0,r\.a\]:null\)\}return o\}/);
  // BATTLE.md (Fable 11-24): the strip left the map callout; it stays in the saved picture and on the results board, with the links
  assert.ok(!CITY_JS.includes('<div class="sc-lb">'), "no Top attackers strip on the map");
  assert.match(CITY_JS, /c\.fillText\('ATTACKERS',M\+18,sy\+66\)/, "the saved picture keeps the strip");
  assert.match(CITY_JS, /bcLink\(r\.a\)/, "the board links members to their profile");
});

test("Mike 11-21: a plot with no missiles shows no missile pill; the pill shows only above 0", () => {
  assert.match(CITY_JS, /badges\.forEach\(function\(b\)\{if\(b\[5\]&&b\[2\]>0\)badgeHi\(/);
});
