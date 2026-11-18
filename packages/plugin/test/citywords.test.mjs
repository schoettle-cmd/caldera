import { test } from "node:test";
import assert from "node:assert/strict";
import { BATTLE_DRAW_JS, CITY_JS } from "./city.build.mjs";

// The Armory's replay word cloud (armory-design B, Mike 11-17): a custom bomb's word rises over its hit as a cloud of letters.
function ctx(log) {
  return new Proxy({}, {
    get(t, k) { if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} });
      if (k === "measureText") return s => ({ width: String(s).length * 40 });
      if (k === "getImageData") return (x, y, w, h) => { const d = new Uint8ClampedArray(w * h * 4); for (let j = Math.floor(h * .3); j < Math.floor(h * .7); j++) for (let i = Math.floor(w * .2); i < Math.floor(w * .8); i++) d[(j * w + i) * 4 + 3] = 255; return { data: d }; };
      return (...a) => { for (const v of a) if (typeof v === "number") assert.ok(Number.isFinite(v), `finite ${String(k)}`); log && log.push(k); }; },
    set(t, k, v) { t[k] = v; return true } });
}
function load(o = {}) {
  const i = BATTLE_DRAW_JS.indexOf("var BBK="), j = BATTLE_DRAW_JS.indexOf("function battleOver(");
  assert.ok(i > 0 && j > i);
  const pre = `var vw=${o.vw || 1200},vh=700,cam={x:0,y:0,z:${o.z || 1}},LODN=1,reduce=${!!o.reduce},BREP={},BCUR=null,BTILE=64,BFXN={flash:[18,30,60,140]},EM=[],made=0;
    var document={createElement:function(){made++;return {width:0,height:0,getContext:function(){return MK()}}},fonts:null};var window={};
    function hn(){return false}function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    var SPR={};function bSpr(k,w,h,p){if(!SPR[k]){SPR[k]={width:w,height:h};p(MK(),w,h)}return SPR[k]}function bRad(g,x,y,r,s){return {}}function spPuff(c){return bSpr('p'+c,48,48,function(){})}function spFire(){return bSpr('f',64,64,function(){})}
    function bEmit(p){EM.push(p)}function bGround(s){return {x:s.to.x,y:s.to.y+4}}function bFlash(){}`;
  return new Function("MK", pre + BATTLE_DRAW_JS.slice(i, j) + `;return {BBK:BBK,BWSP:BWSP,BWL:BWL,spWord:spWord,bWordK:bWordK,bWordAdd:bWordAdd,bBombFx:bBombFx,bDrawWords:bDrawWords,EM:EM,cam:cam,made:function(){return made}}`)(() => ctx());
}
const shot = (k, word, x = 100, o = {}) => ({ to: { x, y: 200 }, b: { p: { x, y: 200 } }, blocked: 0, x: { bk: k, word, bid: 1 }, ...o });

test("words: four bomb types with tokens; one sprite per word and type (LRU 16)", () => {
  const W = load();
  assert.deepEqual(Object.keys(W.BBK), ["sparkler", "thunderbolt", "inferno", "nova"]);
  const a = W.spWord("SHIPIT", "inferno"); assert.equal(W.spWord("SHIPIT", "inferno"), a, "cached");
  assert.ok(a.edge.length > 0 && a.edge.length <= 220 && a.w > a.tw && a.h > a.th);
  for (let n = 0; n < 40; n++) W.spWord("W" + n, "nova");
  assert.equal(W.BWSP.size, 16);
});

test("words: at most 8 live; a word stacks above a near one; only in the replay", () => {
  const W = load();
  for (let n = 0; n < 12; n++) W.bWordAdd(shot("sparkler", "W" + n, 100 + n), 1000 + n * 10);
  assert.ok(W.BWL.length <= 9 && W.BWL.length >= 8);
  assert.ok(W.BWL[W.BWL.length - 1].slot > 0, "stacked over its neighbour");
  W.BBK; W.bDrawWords(ctx(), null); assert.equal(W.BWL.length, 0, "outside the replay, words clear");
});

test("words: readable at every zoom (min 18-28 css px), never more than 96 px or 80% of the view", () => {
  for (const z of [.05, .2, 1, 4, 12]) {
    const W = load({ z });
    for (const k of Object.keys(W.BBK)) {
      const S = W.spWord("LGTM", k), e = { k, sw: S.w, sh: S.th, z: -1, w: -1, K: 1 }, K = W.bWordK(e), px = W.BBK[k].H * K * z;
      assert.ok(px >= W.BBK[k].mn - .01 || S.w / S.th * px >= 1200 * .8 - 1, `${k} at z ${z}: ${px.toFixed(1)} px`);
      assert.ok(px <= 96.01, `${k} at z ${z}: at most 96 px`);
    }
  }
});

test("words: hidden in the delay, drawn while live, gone after its life; each type draws finite geometry, reduced motion too", () => {
  for (const reduce of [false, true]) for (const k of ["sparkler", "thunderbolt", "inferno", "nova"]) {
    const W = load({ reduce }), B = W.BBK[k];
    W.bBombFx(shot(k, "GG"), 1000, 1000);
    assert.equal(W.BWL.length, 1);
    const log = []; W.bDrawWords(ctx(log), 1000 + B.delay - 10); assert.ok(!log.includes("drawImage") || k === "thunderbolt", `${k}: nothing but the bolts before the delay`);
    for (const t of [100, 500, 1500, B.life - 1000, B.life - 10]) { const l2 = []; W.bDrawWords(ctx(l2), 1000 + B.delay + t); assert.ok(l2.includes("drawImage"), `${k} reduce=${reduce} at ${t}`); }
    W.bDrawWords(ctx(), 1000 + B.delay + B.life + 1); assert.equal(W.BWL.length, 0);
    if (!reduce && k === "sparkler") assert.ok(W.EM.filter(p => p.k === "spark").length >= 18, "the gold fountain");
    if (reduce) assert.ok(!W.EM.some(p => p.k === "spark"), "reduced motion: no sparks");
  }
});

test("words: wired into the replay (impact, draw after particles, cleared on start, end and jump) and Nova tints its blast", () => {
  assert.match(BATTLE_DRAW_JS, /if\(BBKCUR&&fx\)bBombFx\(s,iA,now\);BBKCUR=null;/);
  assert.match(BATTLE_DRAW_JS, /bDrawParticles\(c\);bDrawWords\(c,rep\?now:null\);/);
  assert.equal((BATTLE_DRAW_JS.match(/BWL\.length=0;/g) || []).length >= 3, true);
  assert.match(BATTLE_DRAW_JS, /p\.tint\?spGlowC\(p\.tint\):spGlow\(\)/);
  assert.match(BATTLE_DRAW_JS, /if\(BBKCUR==='nova'\)\{lit='196,176,255';shd='92,70,160'\}/);
  assert.ok(CITY_JS.includes(BATTLE_DRAW_JS));
});
