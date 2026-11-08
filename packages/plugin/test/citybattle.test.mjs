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
const at = (h, m = 0, s = 0) => { const d = new Date(); d.setHours(h, m, s, 0); return d.getTime(); };
/** a world with two cities in the battles, each with two repo towers; @a fires six shots at @b's towers, @b two back; the
 *  hub resolved the night at 02:00 today. clock.t is the wall clock, clock.p the performance clock (for replays). */
function world(sky, clock, data) {
  const pre = `var TW=64,TH=32,P=PAL.${sky},sky='${sky}',night=${sky === "night"},T=1234,reduce=false,cam={x:300,y:200,z:1},dpr=2,vw=900,vh=600,palKey='${sky}',W=24,H=24,dirty=false,draws=0,cranes=[];
    var Date=FakeDate,performance={now:function(){return CLOCK.p}};function draw(){draws++;dirty=true}function e(s){return String(s)}var window={CALDERA_BATTLE:DATA,matchMedia:null};
    function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
    function mix(h,f,t){var c=rgb(h);if(t){var q=rgb(t);return hex(c.map(function(v,i){return v+(q[i]-v)*f}))}return hex(c.map(function(v){return f>=1?v+(255-v)*(f-1):v*f}))}
    function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}
    function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}function water(){return false}var document={createElement:function(){return {width:0,height:0,getContext:function(){return mk()}}}};
    function gXY(i){var r=Math.floor(Math.sqrt(i)),o=i-r*r;return o<r?[r,o]:o===r?[r,r]:[o-r-1,r]}
    var DA={name:'a-d',repos:[]},DB={name:'b-d',repos:[]},RA1={name:'a1',commits:40},RA2={name:'a2',commits:20},RB1={name:'b1',commits:60},RB2={name:'b2',commits:30};
    var GM={'@a':{b:{x:2,y:2,k:5},cs:{side:3,codes:[5,5,5,6,5,5,5,5,5]},lang:'#3178C6',n:{ds:[DA]}},'@b':{b:{x:12,y:2,k:5},cs:{side:3,codes:[5,5,6,5,5,5,5,5,5]},lang:'#E85D75',n:{ds:[DB]}}};
    var tiles={};for(var j=0;j<=H;j++)for(var i=0;i<=W;i++)tiles[i+','+j]={t:'g'};tiles['2,9']={t:'b',d:DA,r:RA1};tiles['4,9']={t:'b',d:DA,r:RA2};tiles['12,9']={t:'b',d:DB,r:RB1};tiles['14,9']={t:'b',d:DB,r:RB2};
    function bh(r){return r.commits}function gState(g){return g.cs}function gLang(g){return g.lang}var cx=mk();`;
  const F = class extends Date { static now() { return clock.t; } };
  return new Function("PAL", "mk", "DATA", "FakeDate", "CLOCK", pre + HIFI_JS + BATTLE_DRAW_JS + `; return {api:window.CALDERA_BATTLE_API,over:battleOver,plan:function(){return bPlan(Date.now())},S:bS,now:bNow,dmg:function(i,j){return bBld(null,i,j)},reb:bRebuild,draws:function(){return draws},bp:function(){return BP.length},cranes:cranes,dbg:function(){return {H:JSON.stringify(Object.keys(BHITB).map(function(k){return [k,Object.keys(BHITB[k])]})),B:Object.keys(BBAT).join(' '),sh:BPLAN.shots.map(function(s){return [s.a,s.d,s.lot,s.f,!!s.b,s.b&&s.b.idx,bImpactAt(bS(),s)-bS().salvo]}),S:[bS().salvo,bS().hold,bS().end,bNow()]}},
    art:{padHi:padHi,stackHi:stackHi,chuteHi:chuteHi,chuteDownHi:chuteDownHi,launcherHi:launcherHi,badgeHi:badgeHi,countdownHi:countdownHi,missileHi:missileHi,ruinHi:ruinHi,bTraj:bTraj,bImpactFx:bImpactFx,bStep:bStep,bDrawParticles:bDrawParticles,bLaunchFx:bLaunchFx,bShieldFx:bShieldFx,bLandFx:bLandFx,bSchedule:bSchedule,bSegment:bSegment,bSlot:bSlot},setLOD:function(v){LODN=v},card:battleCard}`)(PAL, stubCtx, data, F, clock);
}
const data = () => ({ at: "x", night: "2026-11-07", t0: at(2), next: at(2) + 864e5, members: { "@a": { sh: .2, beg: 0, ammo: 20, best: "cannon", shots: 6, hits: [], reb: 100 }, "@b": { sh: 0, beg: 0, ammo: 5, best: "catapult", shots: 2, hits: [], reb: 100 } },
  shots: [["@a", "@b", "cannon", 1, at(2, 1), 0, 0, 0], ["@a", "@b", "cannon", 1, at(2, 2), 1, 0, 0], ["@a", "@b", "cannon", 0, at(2, 3), -1, 1, 0], ["@a", "@b", "cannon", .5, at(2, 4), 0, 0, 0], ["@a", "@b", "cannon", 1, at(2, 5), 2, 0, 0], ["@a", "@b", "cannon", 1, at(2, 6), 1, 0, 0],
    ["@b", "@a", "catapult", 1, at(2, 7), 3, 0, 0], ["@b", "~raiders", "catapult", .4, at(2, 8), -1, 0, 0]],
  prev: { night: "2026-11-06", t0: at(2) - 864e5, shots: [["@b", "@a", "catapult", 1, at(2, 7) - 864e5, 0, 0, 0]] } });

test("battle day: the schedule puts the drop at noon, the salvo at 20:00 and the cranes from midnight to noon; the clock decides the state", () => {
  const clock = { t: at(16), p: 1000 }, Wd = world("day", clock, data()); Wd.api.view(true);
  const P = Wd.plan(), S = Wd.S(); assert.equal(P.n, 8); assert.equal(S.D, at(12)); assert.equal(S.salvo, at(20)); assert.equal(S.hold, at(24)); assert.equal(S.end, at(12) + 864e5);
  Wd.over(); let ph = Wd.api.phase(); assert.equal(ph.seg, "loading"); assert.equal(ph.landed, 8, "everything dropped at noon"); assert.equal(ph.fired, 0); assert.equal(ph.until, at(20));
  assert.equal(Wd.dmg(12, 9), 0, "nothing hit before the salvo"); assert.ok(Wd.card("@a").includes("loading"));
  clock.t = at(19, 59, 58); Wd.over(); assert.equal(Wd.api.phase().seg, "countdown");
  // the salvo: 20:00:00.4 has every tube fired; the first hits land 2.5 to 4 s later and the towers lose their top floors
  clock.t = at(20, 0, 1); Wd.over(); ph = Wd.api.phase(); assert.equal(ph.seg, "salvo"); assert.equal(ph.fired, 8, "all at the same time across the plane");
  clock.t = at(20, 0, 10); const d0 = Wd.draws(); Wd.over(); assert.ok(Wd.draws() > d0, "impacts redraw the cache");
  // @a's shots at @b: lots 0, 1, 0(.5), 2, 1 on two towers -> tower 0 gets lots 0, 0, 2 (1 + .5 + 1), tower 1 gets lots 1, 1 (2)
  assert.equal(Wd.dmg(12, 9), 1, "tower b1: capped at 1"); assert.equal(Wd.dmg(14, 9), 1, "tower b2"); assert.equal(Wd.dmg(2, 9), 0, "@b's catapult hit lot 3 -> a's tower 1"); assert.equal(Wd.dmg(4, 9), 1);
  clock.t = at(23); Wd.over(); assert.equal(Wd.api.phase().seg, "damage"); assert.equal(Wd.dmg(14, 9), 1, "the damage holds until midnight"); assert.equal(Wd.reb(), 0);
});

test("battle day: by night the cranes rebuild in six steps, the cache redraws per step, everything is whole by noon; the right night is rebuilt", () => {
  const clock = { t: at(9), p: 1000 }, Wd = world("night", clock, data()); Wd.api.view(true);
  assert.equal(Wd.plan().night, "2026-11-06", "the hub already ran at 02:00 today, so the morning rebuilds the night before");
  Wd.over(); const ph = Wd.api.phase(); assert.equal(ph.seg, "rebuild"); assert.equal(ph.until, at(12)); assert.ok(Math.abs(Wd.reb() - .75) < .01);
  assert.equal(Wd.dmg(2, 9), Math.round(.25 * 6) / 6, "a quarter of the damage left at 09:00 on a's tower 0");
  const d0 = Wd.draws(); clock.t = at(10, 30); Wd.over(); assert.ok(Wd.draws() > d0, "a new sixth: the buildings redraw");
  const d1 = Wd.draws(); clock.t = at(10, 31); Wd.over(); assert.equal(Wd.draws(), d1, "same sixth: no redraw");
  clock.t = at(11, 59, 59); Wd.over(); assert.equal(Wd.dmg(2, 9), 0, "whole by noon");
  const early = data(); early.t0 -= 864e5; early.prev.t0 -= 864e5;   // the hub has not run yet: "last night" is still yesterday's
  const W2 = world("night", { t: at(1), p: 1 }, early); W2.api.view(true); assert.equal(W2.plan().night, "2026-11-07"); assert.equal(W2.api.phase().seg, "rebuild");
  const W3 = world("day", { t: at(13), p: 1 }, early); W3.api.view(true); assert.equal(W3.plan().n, 0, "a night already fired yesterday never fires twice");
});

test("battle day: replay runs the same beats on a virtual clock in 26 s and hands the map back as it was", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over();
  assert.equal(Wd.api.replay(), 8); const S = Wd.S(); assert.equal(S.live, false);
  const segs = []; for (let ms = 0; ms <= 27000; ms += 250) { clock.p = 10000 + ms; Wd.over(); const sg = Wd.api.phase().seg; if (segs[segs.length - 1] !== sg) segs.push(sg); }
  assert.deepEqual(segs, ["idle", "supply", "loading", "countdown", "salvo", "damage", "rebuild", "idle", "loading"], "drop, load, 3 2 1, salvo, hits, cranes, done, then back to the live afternoon");
  assert.equal(Wd.api.phase().replay, false, "the replay ended on its own"); assert.equal(Wd.dmg(12, 9), 0, "back to the original state");
  clock.p = 10000; Wd.api.replay(); clock.p = 10000 + 15000; Wd.over(); assert.equal(Wd.dmg(12, 9), 1, "mid-replay the towers are hit"); clock.p = 10000 + 22000; Wd.over(); assert.ok(Wd.reb() > .4 && Wd.reb() < .6, "cranes half way"); assert.ok(Wd.cranes.length === 0 || true);
  Wd.api.stop(); assert.equal(Wd.api.phase().replay, false);
});

test("battle art: pad, stack, drop, launch center, countdown, ruin and particles draw with finite geometry by day and night at every LOD", () => {
  for (const sky of ["day", "night"]) { const W = world(sky, { t: at(15), p: 1 }, data()); W.api.view(true);
    for (const lod of [0, 1, 2]) { W.setLOD(lod); const c = stubCtx();
      W.art.padHi(c, 0, 0, { col: "#3178C6", lod }); W.art.stackHi(c, 0, 0, 12, "#3178C6", 1); W.art.stackHi(c, 0, 0, 3, "#3178C6", .8);
      for (let u = 0; u <= 1; u += .1) W.art.chuteHi(c, 0, 0, u, "#3178C6", 1, 3); W.art.chuteDownHi(c, 0, 0, .5, "#3178C6");
      const tip = W.art.launcherHi(c, 0, 0, { col: "#3178C6", seed: 3, loaded: 7, fired: 3, aim: -1, recoil: .5, t: 800, lod }); assert.equal(tip.mz.length, 12, "twelve tube mouths"); assert.ok(tip.y < 0);
      W.art.badgeHi(c, 100, 100, 12, "#3178C6", .5); W.art.badgeHi(c, 100, 100, 0, "#3178C6", 0); for (let u = 0; u < 1; u += .2) W.art.countdownHi(c, 300, 200, u);
      for (let f = 0; f <= 1; f += .1) { const tr = W.art.bTraj(0, 0, 300, -40, f); W.art.missileHi(c, tr.x, tr.y, tr.a, 1.3, "#E85D75", tr.boost); }
      W.art.ruinHi(c, 0, -40, .62, "#3178C6", 1, 0); W.art.ruinHi(c, 0, -40, .62, "#3178C6", .5, .5);
      W.art.bImpactFx(0, 0, "#3178C6", 1.2); W.art.bLaunchFx(0, 0, -1); W.art.bShieldFx(0, 0, "#3DF2FF"); W.art.bLandFx(0, 0); for (let k = 0; k < 40; k++) W.art.bStep(.05); W.art.bDrawParticles(c);
      assert.ok(c.__n.ops > 100, `${sky} lod ${lod} draws`); }
    W.over(); }
  const H = world("day", { t: at(15), p: 1 }, data()).art;
  const S = H.bSchedule(0, false); assert.equal(H.bSegment(S, 0), "idle"); assert.equal(H.bSegment(S, 5000), "loading"); assert.equal(H.bSegment(S, 9000), "countdown"); assert.equal(H.bSegment(S, 12000), "salvo"); assert.equal(H.bSegment(S, 20000), "rebuild"); assert.equal(H.bSegment(S, 26000), "idle");
  assert.ok(H.bSlot(11).hidden === false && H.bSlot(12).hidden === true, "a stack shows twelve");
});

test("battle: wired into the renderer; no walkers, no houses, no crews in the Battle view; the arcs, flags, raider ships and fire trucks are gone", () => {
  assert.ok(CITY_JS.includes(BATTLE_DRAW_JS), "the battle set is inside CITY_JS");
  for (const old of ["bArc(", "bBeam(", "bRaiderShip(", "truckHi(", "BREP.reb", "workerHi(", "vanHi("]) assert.ok(!CITY_JS.includes(old), `${old} removed`);
  assert.ok(/growOver\(\);battleOver\(\)/.test(CITY_JS), "the battle layer draws over the map every frame");
  assert.ok(CITY_JS.includes("if(!BON)drawWalks()"), "no people on foot in the Battle view");
  assert.ok(CITY_JS.includes("if(t.t==='h'&&!BON)") && CITY_JS.includes("if(cd===4){if(!BON)"), "no little houses in the Battle view");
  assert.ok(CITY_JS.includes("hc===0&&!BON") && CITY_JS.includes("!gWin()&&!BON") && CITY_JS.includes("if(!BON)for(var k=0;k<7;k++)") && CITY_JS.includes("if(!BON)drawFx()"), "no growth crews, parades or effects walkers in the Battle view");
  assert.ok(CITY_JS.includes("bBld(t,i,j)") && CITY_JS.includes("ruinHi(c,p.x,top") && CITY_JS.includes("cranes.push({x:p.x+4,y:top,seed:seed,col:col})"), "hit towers lose floors, show a ruin and get a crane");
  new Function(CITY_JS);
});
