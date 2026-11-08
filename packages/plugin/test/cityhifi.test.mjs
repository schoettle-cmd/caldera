import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, HIFI_JS } from "./city.build.mjs";

// a 2D context that accepts every call and records how many draw ops ran
function stubCtx() {
  const n = { ops: 0 };
  const grad = { addColorStop() {} };
  const target = { canvas: { width: 10, height: 10 } };
  const ctx = new Proxy(target, {
    get(t, k) { if (k === "__n") return n; if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => grad;
      if (k === "measureText") return () => ({ width: 10 });
      return (...a) => { n.ops++; for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`non-finite arg to ${String(k)}`); }; },
    set(t, k, v) { t[k] = v; return true } });
  return ctx;
}
const PAL = {
  day: { light: 1, lamp: 0, lit: .45, glass: ["#C9E3F6", "#6D9FCF"], ao: "rgba(20,30,50,.28)", curb: "rgba(255,255,255,.45)", joint: "rgba(0,0,0,.08)" },
  night: { light: .5, lamp: 1, lit: 1, glass: ["#1E2C4A", "#101828"], ao: "rgba(0,0,0,.4)", curb: "rgba(255,255,255,.16)", joint: "rgba(0,0,0,.18)" } };
function load(sky) {
  const pre = `var TW=64,TH=32,P=PAL.${sky},sky='${sky}',night=${sky === "night"},T=1234,reduce=false,cam={x:0,y:0,z:1},dpr=3,vw=390,vh=844,palKey='${sky}',W=4,H=4;
    function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
    function mix(h,f,t){var c=rgb(h);if(t){var q=rgb(t);return hex(c.map(function(v,i){return v+(q[i]-v)*f}))}return hex(c.map(function(v){return f>=1?v+(255-v)*(f-1):v*f}))}
    function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}
    function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}function dia(i,j,s){var p=iso(i,j),hw=TW/2*s,hh=TH/2*s;return [[p.x,p.y-hh],[p.x+hw,p.y],[p.x,p.y+hh],[p.x-hw,p.y]]}
    function water(i,j){return i===W||j===H}var document={createElement:function(){return {width:0,height:0,getContext:function(){return mk()}}}};`;
  return new Function("PAL", "mk", pre + HIFI_JS + "; return {prismHi,facadeHi,roofHi,treeHi,pineHi,lampHi,lampPoolHi,aoHi,houseHi,houseLotHi,lotHi,midHi,towerHi,campusHi,craneHi,scaffoldHi,figHi,carHi,waterHi,scorchHi,rubbleHi,smokeHi,tarpHi,tapeHi,hiDraw,atlFrame,setLOD:function(v){LODN=v},atl:function(){return {n:ATL.size,b:ATLB,N:ATLN}}}")(PAL, stubCtx);
}

test("hifi: every tier draws three variants, day and night, at every level of detail, with finite geometry", () => {
  for (const sky of ["day", "night"]) {
    const H = load(sky);
    for (const lod of [0, 1, 2]) { H.setLOD(lod);
      for (let v = 0; v < 3; v++) { const c = stubCtx(), o = { variant: v, col: "#3178C6", seed: 17 + v, litp: .6, stage: v + 1, h: 96, people: .3 };
        assert.ok(H.towerHi(c, 0, 0, o) < 0, "a tower has a top above its base");
        assert.ok(H.midHi(c, 0, 0, o) < 0); assert.ok(H.campusHi(c, 0, 0, o) < 4);
        H.lotHi(c, 0, 0, o); H.houseLotHi(c, 0, 0, { seed: v * 5, n: 3 }); H.houseHi(c, 0, 0, v, "#E8DCC8", v);
        assert.ok(c.__n.ops > 50, `${sky} lod ${lod} variant ${v} draws something`); }
      const c = stubCtx(); H.craneHi(c, { x: 0, y: 0, seed: 3, col: "#3178C6" }); H.scaffoldHi(c, 0, 0, .64, 30); H.scaffoldHi(c, 0, 0, .64, 30, 1);
      [0, 1, 2].forEach(m => H.figHi(c, 0, 0, "#E9A92C", 1, m)); H.carHi(c, 0, 0, .894, .447, "#E85D75", 1); H.waterHi(c);
      H.scorchHi(c, 0, 0, 1); H.rubbleHi(c, 0, 0, "#3178C6"); H.smokeHi(c, 0, 0, true); H.tarpHi(c, 0, -30, .64); H.tapeHi(c, [[0, 0], [10, 5]]);
      H.treeHi(c, 0, 0, 1, 2); H.pineHi(c, 0, 0, 1); H.lampHi(c, 0, 0); H.lampPoolHi(c, 0, 0); H.aoHi(c, 0, 0, .78);
      H.roofHi(c, 0, -40, .64, [["hvac"], ["tank"], ["solar"], ["mast"], ["garden"], ["skylight"], ["helipad"], ["stack"], ["dish"], ["crown"]]);
    }
  }
});

test("hifi: the atlas reuses a sprite, stays inside its budget and falls back to vectors when full", () => {
  const H = load("day"); H.setLOD(1); H.atlFrame();
  const c = stubCtx(); let calls = 0; const fn = () => { calls++ };
  H.hiDraw(c, "a", 116, 200, 58, 166, 0, 0, fn); H.hiDraw(c, "a", 116, 200, 58, 166, 10, 0, fn);
  assert.equal(calls, 1, "the second draw comes from the sprite"); assert.equal(H.atl().n, 1);
  H.atlFrame(); for (let k = 0; k < 200; k++) H.hiDraw(c, "k" + k, 116, 200, 58, 166, 0, 0, fn);
  assert.ok(H.atl().b <= 24 * 1048576, "never over 24 MB at 3x"); assert.ok(H.atl().N.direct > 0, "past the budget it draws vectors");
  H.setLOD(2); H.atlFrame(); const before = calls; H.hiDraw(c, "a", 116, 200, 58, 166, 0, 0, fn); assert.equal(calls, before + 1, "walked in: vectors, no sprite");
});

test("hifi: wired into the renderer (DPR canvas, LOD, live layer, no crosswalk fillRect under a skew)", () => {
  assert.ok(CITY_JS.includes(HIFI_JS), "the drawing set is inside CITY_JS");
  assert.ok(CITY_JS.includes("dpr=Math.min(window.devicePixelRatio||1,MINI?1.5:3)"));
  assert.ok(CITY_JS.includes("LODN=LOD?0:cam.z<1.1?1:2;atlFrame()"));
  assert.ok(/cx\.drawImage\(L1,0,0\);hiLive\(\)/.test(CITY_JS), "ripples and lamp pools on the live layer");
  assert.ok(!CITY_JS.includes("c.transform(1,.5,-1,.5,0,0);c.fillRect"), "crosswalks are paths");
  assert.ok(CITY_JS.includes("craneHi(c,k)") && CITY_JS.includes("smokeHi(") && CITY_JS.includes("rubbleHi(") && CITY_JS.includes("tarpHi("));
  for (const k of ["grass3", "glass:", "curb:", "joint:", "ao:"]) assert.ok(CITY_JS.includes(k), `palette token ${k}`);
  new Function(CITY_JS);
});
