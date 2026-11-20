import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, BATTLE_DRAW_JS } from "./city.build.mjs";

// Owner decisions D3 to D7 of the 11-20 map audit (Mike: yes to all). Controls, defaults and visibility only; no map art.

test("D3: the replay plays in the theater: Fullscreen API on the stage, CSS full screen where refused, out again at the end", () => {
  const th = CITY_JS.slice(CITY_JS.indexOf("function theater(on)"), CITY_JS.indexOf("function thStop()"));
  assert.ok(th.length > 100);
  assert.match(th, /st\.requestFullscreen&&document\.fullscreenEnabled\?st\.requestFullscreen\(\):null/);
  assert.match(th, /r\.catch\(function\(\)\{if\(THEA==='fs'\)\{THEA='css';cssFull\(true\)\}\}\)/, "refused (iOS Safari): the CSS full screen");
  assert.match(th, /else\{THEA='css';cssFull\(true\)\}/, "no Fullscreen API at all: the CSS full screen");
  assert.match(th, /if\(m==='fs'&&document\.fullscreenElement\)\{try\{document\.exitFullscreen\(\)\}/, "the end of the replay leaves full screen");
  assert.match(th, /if\(THEA\|\|document\.fullscreenElement\|\|st\.classList\.contains\('c-full'\)\)return false/, "already full: left as it is");
  assert.match(CITY_JS, /function thStop\(\)\{st\.classList\.remove\('c-theater'\);if\(typeof BREP!=='undefined'&&BREP&&typeof bReplayEnd==='function'\)bReplayEnd\(true\)\}/);
  assert.match(CITY_JS, /'fullscreenchange',function\(\)\{if\(!document\.fullscreenElement&&THEA==='fs'\)\{THEA='';thStop\(\)\}/, "Esc out of full screen ends the replay");
  assert.match(CITY_JS, /if\(ev\.key==='Escape'&&THEA==='fs'&&document\.fullscreenElement\)\{try\{document\.exitFullscreen\(\)\}/, "Esc in the theater leaves full screen");
  assert.match(CITY_JS, /if\(!on&&THEA==='css'\)\{THEA='';thStop\(\)\}/, "Esc or Exit out of the CSS full screen ends the replay");
  assert.match(BATTLE_DRAW_JS, /bSndStop\(\);if\(full&&typeof theater==='function'\)\{theater\(false\);setTimeout\(go,60\)\}else go\(\)\}/);
});

test("D5: friendship rays off by default; a saved choice wins (topic colours were already off)", () => {
  assert.match(CITY_JS, /RAYS=false;try\{RAYS=localStorage\.getItem\('caldera-world-rays'\)==='1'\}catch\(err\)\{\}/);
  assert.match(CITY_JS, /var TOPICS=false,TCOL=\{\};try\{TOPICS=localStorage\.getItem\('caldera-world-topics'\)==='1'\}/);
  assert.match(CITY_JS, /localStorage\.setItem\('caldera-world-rays',RAYS\?'1':'0'\)/, "the switch still saves the choice");
});

test("D6: battle sound on for a pressed replay, silent for a link on load, mute remembered, storage wrapped", () => {
  assert.match(BATTLE_DRAW_JS, /theater\(true\);bSndStart\(!noFull\)/);
  assert.match(BATTLE_DRAW_JS, /function bSndPref\(\)\{try\{return localStorage\.getItem\(BSKEY\)!=='0'\}catch\(err\)\{return true\}\}/, "on unless the viewer muted it");
  assert.match(BATTLE_DRAW_JS, /function bSndSet\(on\)\{BSON=!!on;try\{localStorage\.setItem\(BSKEY,BSON\?'1':'0'\)\}catch\(err\)\{\}/);
  assert.match(BATTLE_DRAW_JS, /BSKEY='caldera\.battle\.sound'/);
  assert.match(BATTLE_DRAW_JS, /sound:function\(on\)\{return on==null\?BSON:bSndSet\(on\)\}/);
  assert.match(BATTLE_DRAW_JS, /if\(rep\)\{bLaunchFxBig\(mm\[0\],mm\[1\],aim\);bSfx\('launch'/, "launch cue in the replay only");
  assert.match(BATTLE_DRAW_JS, /if\(bBetween\(iA,last,now\)\)\{if\(rep\)bSfx\(/, "impact or shield cue in the replay only");
  assert.match(BATTLE_DRAW_JS, /if\(BVO\.length>=4\)/, "at most 4 voices");
  // the sound code runs without a browser: no AudioContext means no sound and no error
  const fn = new Function("window", "vw", BATTLE_DRAW_JS.slice(BATTLE_DRAW_JS.indexOf("var BSKEY="), BATTLE_DRAW_JS.indexOf("window.CALDERA_BATTLE_API={")) + ";bSndStart(true);bSfx('L',10);return BSON;");
  assert.equal(fn({}, 400), true);
});

test("D7: no store bubbles at world zoom except the viewer's own city; the market stays a label", () => {
  const fn = CITY_JS.slice(CITY_JS.indexOf("function drawSigns(){"), CITY_JS.indexOf("// the markers for the keyboard"));
  assert.match(fn, /if\(D\.world&&FITZ&&z\/FITZ<1\.8\)order=order\.filter\(function\(k\)\{return k===me\}\)/);
  assert.match(CITY_JS, /text:'\\u2726 Free tools market \\u00b7 '\+TOOLS\.length/, "the landmark tag is unchanged");
});

test("D4: the world page's own Layers rows (Time) go into the Layers panel before Sky", () => {
  const i = CITY_JS.indexOf("function toolsFit()"), code = CITY_JS.slice(i, i + 9000);
  assert.match(code, /tb\.querySelectorAll\('\.c-lrow'\)\)\.forEach\(function\(r\)\{var sk=document\.getElementById\('t-sky'\);MOREP\.insertBefore\(r,sk&&sk\.parentNode===MOREP\?sk:null\)\}\)/);
});
