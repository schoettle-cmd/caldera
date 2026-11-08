import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, HIFI_JS, BATTLE_DRAW_JS } from "./city.build.mjs";

// a 2D context that accepts every call and refuses non-finite geometry
function stubCtx() {
  const n = { ops: 0 }, grad = { addColorStop() {} }, target = { canvas: { width: 10, height: 10 } };
  return new Proxy(target, {
    get(t, k) { if (k === "__n") return n; if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return (...a) => { for (const v of a) if (!Number.isFinite(v)) throw new Error(`non-finite gradient arg in ${String(k)}`); return grad; };
      if (k === "measureText") return () => ({ width: 10 });
      return (...a) => { n.ops++; for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`non-finite arg to ${String(k)}`); }; },
    set(t, k, v) { t[k] = v; return true } });
}
const PAL = { day: { light: 1, lamp: 0, lit: .45, glass: ["#C9E3F6", "#6D9FCF"], ao: "rgba(20,30,50,.28)" }, night: { light: .5, lamp: 1, lit: 1, glass: ["#1E2C4A", "#101828"], ao: "rgba(0,0,0,.4)" } };
const at = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
/** a world with two cities in the battles: @a (side 3) fires six shots at @b's lots, @b fires two back; resolved at 02:00 today */
function world(sky, clock, data) {
  const pre = `var TW=64,TH=32,P=PAL.${sky},sky='${sky}',night=${sky === "night"},T=1234,reduce=false,cam={x:300,y:200,z:1},dpr=2,vw=900,vh=600,palKey='${sky}',W=20,H=20,dirty=false,draws=0;
    var Date=FakeDate;function draw(){draws++;dirty=true}function e(s){return String(s)}var window={CALDERA_BATTLE:DATA,matchMedia:null};var performance=globalThis.performance;
    function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
    function mix(h,f,t){var c=rgb(h);if(t){var q=rgb(t);return hex(c.map(function(v,i){return v+(q[i]-v)*f}))}return hex(c.map(function(v){return f>=1?v+(255-v)*(f-1):v*f}))}
    function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}
    function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}function water(){return false}var document={createElement:function(){return {width:0,height:0,getContext:function(){return mk()}}}};
    function gXY(i){var r=Math.floor(Math.sqrt(i)),o=i-r*r;return o<r?[r,o]:o===r?[r,r]:[o-r-1,r]}
    var GM={'@a':{b:{x:2,y:2,k:5},cs:{side:3,codes:[4,4,5,6,4,4,4,4,4]},lang:'#3178C6'},'@b':{b:{x:12,y:2,k:5},cs:{side:3,codes:[4,5,6,4,4,4,4,4,4]},lang:'#E85D75'}};
    function gState(g){return g.cs}function gLang(g){return g.lang}var cx=mk();`;
  const F = class extends Date { static now() { return clock.t; } };
  return new Function("PAL", "mk", "DATA", "FakeDate", pre + HIFI_JS + BATTLE_DRAW_JS + `; return {api:window.CALDERA_BATTLE_API,over:battleOver,plan:function(){return bPlan(Date.now())},dmg:bDmg,draws:function(){return draws},bp:function(){return BP.length},fl:function(){return BFL.length},
    art:{launcherHi:launcherHi,badgeHi:badgeHi,missileHi:missileHi,workerHi:workerHi,vanHi:vanHi,lumberHi:lumberHi,bTraj:bTraj,bImpactFx:bImpactFx,bStep:bStep,bDrawParticles:bDrawParticles,bLaunchFx:bLaunchFx,bShieldFx:bShieldFx},setLOD:function(v){LODN=v},card:battleCard}`)(PAL, stubCtx, data, F);
}
const data = () => ({ at: "x", night: "2026-11-07", t0: at(2), next: at(2) + 864e5, members: { "@a": { sh: .2, beg: 0, ammo: 20, best: "cannon", shots: 4, hits: [], reb: 100 }, "@b": { sh: 0, beg: 0, ammo: 5, best: "catapult", shots: 2, hits: [], reb: 100 } },
  shots: [["@a", "@b", "cannon", 1, at(2, 1), 0, 0, 0], ["@a", "@b", "cannon", 1, at(2, 2), 1, 0, 0], ["@a", "@b", "cannon", 0, at(2, 3), -1, 1, 0], ["@a", "@b", "cannon", .5, at(2, 4), 0, 0, 0], ["@a", "@b", "cannon", 1, at(2, 5), 2, 0, 0], ["@a", "@b", "cannon", 1, at(2, 6), 1, 0, 0],
    ["@b", "@a", "catapult", 1, at(2, 7), 3, 0, 0], ["@b", "~raiders", "catapult", .4, at(2, 8), -1, 0, 0]],
  prev: { night: "2026-11-06", t0: at(2) - 864e5, shots: [["@b", "@a", "catapult", 1, at(2, 7) - 864e5, 0, 0, 0]] } });

test("battle: by day the plan spreads each city's shots over noon to midnight and the clock decides what has fired", () => {
  const clock = { t: at(16) }, Wd = world("day", clock, data());
  Wd.api.view(true);
  const P = Wd.plan(); assert.equal(P.fire, true); assert.equal(P.shots.length, 8);
  const a = P.byA["@a"]; assert.equal(a.length, 6);
  for (let i = 0; i < a.length; i++) { assert.ok(a[i].t >= at(12) && a[i].t < at(24), "inside the window"); if (i) assert.ok(a[i].t > a[i - 1].t, "in order"); }
  assert.ok(Math.abs(a[2].t - (at(12) + 432e5 * 2.5 / 6)) < 8 * 60000, "the third of six goes near 17:00, with jitter");
  Wd.over();   // first frame: everything already due landed silently, no replay
  const ph = Wd.api.phase(); assert.equal(ph.fire, true); assert.ok(ph.fired >= 2 && ph.fired <= 4, `by 16:00 a third of the day has fired (${ph.fired})`); assert.equal(ph.landed, ph.fired); assert.equal(Wd.fl(), 0, "no flights for the past");
  assert.equal(ph.until, at(24));
  const landedOn0 = a.filter(s => s.lot === 0 && s.t <= clock.t).reduce((t, s) => t + s.f, 0);
  assert.equal(Wd.dmg("@b", 0), Math.round(landedOn0 * 6) / 6, "damage on @b's lot 0 is what has landed so far, in sixths");
  const b = P.byA["@b"]; assert.equal(b.length, 2); assert.ok(b[0].t < at(16) && b[1].t > at(20), "@b's two shots go about 15:00 and 21:00");
  assert.equal(Wd.dmg("@a", 3), 1, "@b's first catapult has landed on @a's lot 3");
  // the clock reaches the next launch: a live flight starts, then lands with a redraw
  const next = a.find(s => s.t > clock.t); clock.t = next.t + 1000; const d0 = Wd.draws(); Wd.over(); Wd.over(); assert.equal(Wd.fl(), 1, "one missile in the air"); assert.ok(Wd.bp() > 0, "its launch puff");
  assert.equal(Wd.dmg("@b", next.lot), Math.round(a.filter(s => s.lot === next.lot && s.land != null && s.land <= clock.t).reduce((t, s) => t + s.f, 0) * 6) / 6, "not yet landed, not yet counted");
  assert.ok(Wd.card("@a").includes("missile"), "the card counts missiles");
});

test("battle: by night nothing fires, damage shrinks in sixths and the cache redraws per step; the right night is repaired", () => {
  const clock = { t: at(9) }, Wd = world("night", clock, data());
  Wd.api.view(true); const P = Wd.plan(); assert.equal(P.fire, false); assert.equal(P.night, "2026-11-06", "the hub already ran at 02:00 today, so the morning repairs the night before");
  Wd.over(); assert.equal(Wd.api.phase().until, at(12));
  assert.equal(Wd.dmg("@a", 0), Math.round(1 * (1 - 9 / 12) * 6) / 6, "a quarter of the night left at 09:00");
  const d0 = Wd.draws(); clock.t = at(10, 30); Wd.over(); assert.ok(Wd.draws() > d0, "a new sixth: the buildings redraw");
  const d1 = Wd.draws(); clock.t = at(10, 31); Wd.over(); assert.equal(Wd.draws(), d1, "same sixth: no redraw");
  clock.t = at(11, 59, 0); Wd.over(); assert.equal(Wd.dmg("@a", 0), 0, "whole by noon");
  assert.ok(Wd.api.phase().total === 1 && Wd.api.phase().fired === 1);
  // before the hub has run (01:00), the night being repaired is last night's data, and the badge counts tonight's arsenal
  const early = data(); early.t0 -= 864e5; early.prev.t0 -= 864e5;   // the hub has not run yet: "last night" is still yesterday's
  const c2 = { t: at(1) }, W2 = world("night", c2, early); W2.api.view(true); assert.equal(W2.plan().night, "2026-11-07"); assert.equal(W2.plan().fire, false);
  const c3 = { t: at(13) }, W3 = world("day", c3, early); W3.api.view(true); assert.equal(W3.plan().shots.length, 0, "a night already fired yesterday never fires twice");
});

test("battle: a throttled tab catches up with quick flights, replay plays today's launches again, nothing is drawn with non-finite geometry", () => {
  const clock = { t: at(12, 30) }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over();
  clock.t = at(21); Wd.over(); const ph = Wd.api.phase(); assert.ok(Wd.fl() > 0 && Wd.fl() <= 14, `catch-up flights (${Wd.fl()})`);
  const n = Wd.api.replay(); assert.ok(n >= 5, "replays what fired so far"); assert.equal(Wd.fl(), n);
  for (const sky of ["day", "night"]) { const W = world(sky, { t: at(15) }, data()); W.api.view(true);
    for (const lod of [0, 1, 2]) { W.setLOD(lod); const c = stubCtx();
      const tip = W.art.launcherHi(c, 0, 0, { col: "#3178C6", seed: 3, n: 5, aim: -1, recoil: .5, t: 800, lod }); assert.ok(tip.y < 0, "the rail tip is above the pad");
      W.art.badgeHi(c, 100, 100, 12, "#3178C6", .5); W.art.badgeHi(c, 100, 100, 0, "#3178C6", 0);
      for (let f = 0; f <= 1; f += .1) { const tr = W.art.bTraj(0, 0, 300, -40, f); W.art.missileHi(c, tr.x, tr.y, tr.a, 1.3, "#E85D75", tr.boost); }
      ["walk", "carry", "hammer", "climb", "drill", "stand"].forEach((m, i) => W.art.workerHi(c, 10, 10, { t: 1234 + i * 97, mode: m, dir: i % 2 ? 1 : -1, col: "#C9A96E", seed: i }));
      W.art.vanHi(c, 0, 0, "#3178C6"); W.art.lumberHi(c, 0, 0, "#3178C6");
      W.art.bImpactFx(0, 0, "#3178C6", 1.2); W.art.bLaunchFx(0, 0, -1); W.art.bShieldFx(0, 0, "#3DF2FF"); for (let k = 0; k < 40; k++) W.art.bStep(.05); W.art.bDrawParticles(c);
      assert.ok(c.__n.ops > 100, `${sky} lod ${lod} draws`); }
    W.over(); }
});

test("battle: wired into the renderer; the arcs, flags, discs, raider ships and rooftop fire trucks are gone", () => {
  assert.ok(CITY_JS.includes(BATTLE_DRAW_JS), "the battle set is inside CITY_JS");
  for (const old of ["bArc(", "bBeam(", "bRaiderShip(", "truckHi(", "BREP.reb", "setLineDash([5,4])"]) assert.ok(!CITY_JS.includes(old), `${old} removed`);
  assert.ok(/growOver\(\);battleOver\(\)/.test(CITY_JS), "the battle layer draws over the map every frame");
  assert.ok(CITY_JS.includes("bDmg(t.key,li)"), "lots take their damage from the battle clock");
  new Function(CITY_JS);
});
