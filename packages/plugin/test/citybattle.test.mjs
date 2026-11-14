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
function world(sky, clock, data, reduce = false, store = memStore()) {
  const pre = `var TW=64,TH=32,P=PAL.${sky},sky='${sky}',night=${sky === "night"},T=1234,reduce=${reduce},FITZ=.5,maxH=60,cam={x:300,y:200,z:1},dpr=2,vw=900,vh=600,palKey='${sky}',W=24,H=24,dirty=false,draws=0,cranes=[];
    var Date=FakeDate,performance={now:function(){return CLOCK.p}};function draw(){draws++;dirty=true}function e(s){return String(s)}var window={CALDERA_BATTLE:DATA,matchMedia:null,localStorage:STORE};
    function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
    function mix(h,f,t){var c=rgb(h);if(t){var q=rgb(t);return hex(c.map(function(v,i){return v+(q[i]-v)*f}))}return hex(c.map(function(v){return f>=1?v+(255-v)*(f-1):v*f}))}
    function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}
    function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}function water(){return false}var document={createElement:function(){return {width:0,height:0,getContext:function(){return mk()}}}};
    function gXY(i){var r=Math.floor(Math.sqrt(i)),o=i-r*r;return o<r?[r,o]:o===r?[r,r]:[o-r-1,r]}
    var DA={name:'a-d',repos:[]},DB={name:'b-d',repos:[]},RA1={name:'a1',commits:40},RA2={name:'a2',commits:20},RB1={name:'b1',commits:60},RB2={name:'b2',commits:30};
    var GM={'@a':{b:{x:2,y:2,k:5},cs:{side:3,codes:[5,5,5,6,5,5,5,5,5]},lang:'#3178C6',n:{ds:[DA]}},'@b':{b:{x:12,y:2,k:5},cs:{side:3,codes:[5,5,6,5,5,5,5,5,5]},lang:'#E85D75',n:{ds:[DB]}},'@c':{cs:{side:1,codes:[5]},lang:'#888888',n:{ds:[]}}};
    var tiles={};for(var j=0;j<=H;j++)for(var i=0;i<=W;i++)tiles[i+','+j]={t:'g'};tiles['2,9']={t:'b',d:DA,r:RA1};tiles['4,9']={t:'b',d:DA,r:RA2};tiles['12,9']={t:'b',d:DB,r:RB1};tiles['14,9']={t:'b',d:DB,r:RB2};
    function bh(r){return r.commits}function gState(g){return g.cs}function gLang(g){return g.lang}var cx=mk();`;
  const F = class extends Date { static now() { return clock.t; } };
  return new Function("PAL", "mk", "DATA", "FakeDate", "CLOCK", "STORE", pre + HIFI_JS + BATTLE_DRAW_JS + `; return {api:window.CALDERA_BATTLE_API,stateLoad:bStateLoad,sync:function(){bStateSync(bPlan(Date.now()),Date.now())},rebOf:bRebuildOf,over:battleOver,plan:function(){return bPlan(Date.now())},S:bS,now:bNow,dmg:function(i,j){return bBld(null,i,j)},reb:bRebuild,draws:function(){return draws},bp:function(){return BP.length},vox:function(){return BP.filter(function(p){return p.k==='vox'}).length},voxDown:function(){return BP.filter(function(p){return p.k==='vox'&&p.down}).length},cranes:cranes,bcam:bCam,camera:cam,rep:function(){return BREP},ribbons:function(){return BTR.length},dbg:function(){return {H:JSON.stringify(Object.keys(BHITB).map(function(k){return [k,Object.keys(BHITB[k])]})),B:Object.keys(BBAT).join(' '),sh:BPLAN.shots.map(function(s){return [s.a,s.d,s.lot,s.f,!!s.b,s.b&&s.b.idx,bImpactAt(bS(),s)-bS().salvo]}),S:[bS().salvo,bS().hold,bS().end,bNow()]}},
    art:{padHi:padHi,stackHi:stackHi,chuteHi:chuteHi,chuteDownHi:chuteDownHi,launcherHi:launcherHi,badgeHi:badgeHi,countdownHi:countdownHi,missileHi:missileHi,ruinHi:ruinHi,bTraj:bTraj,bImpactFx:bImpactFx,bStep:bStep,bDrawParticles:bDrawParticles,bLaunchFx:bLaunchFx,bShieldFx:bShieldFx,bLandFx:bLandFx,bSchedule:bSchedule,bSegment:bSegment,bSlot:bSlot,bBeats:bBeats,bDrawCollapse:bDrawCollapse,bRubblePiles:bRubblePiles,collapses:function(){return BCOL.length},bld:function(){return BBLD},bRepCam:bRepCam,bPadZoom:bPadZoom,bWideFrame:bWideFrame,bRibbonFill:bRibbonFill,bDrawRibbons:bDrawRibbons,bLaunchFxBig:bLaunchFxBig,BRT:BRT,BSPEEDS:BSPEEDS,bSpeedOf:bSpeedOf,bSpeedNext:bSpeedNext,bRealMs:bRealMs,bVirt:bVirt,bClampZoom:bClampZoom,bClampCam:bClampCam,bMapBounds:bMapBounds,bFitCam:bFitCam,bCamLim:bCamLim,bHitsNow:bHitsNow,bHitLabels:bHitLabels,bRepFlight:bRepFlight,bPadFrame:bPadFrame,bHitFrame:bHitFrame,fx:function(){return BFXT},userCam:bUserCam},setLOD:function(v){LODN=v},card:battleCard}`)(PAL, stubCtx, data, F, clock, store);
}
/** a localStorage stand-in (a broken one throws on every call) */
function memStore(broken = false) { const m = new Map(); return { getItem: k => { if (broken) throw new Error("quota"); return m.has(k) ? m.get(k) : null }, setItem: (k, v) => { if (broken) throw new Error("quota"); m.set(k, String(v)) }, removeItem: k => m.delete(k), get size() { return m.size }, raw: k => m.get(k) }; }
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
  assert.equal(Wd.dmg(2, 9), Math.ceil(.25 * 24) / 24, "a quarter of the damage left at 09:00 on a's tower 0");
  const d0 = Wd.draws(); clock.t = at(10, 30); Wd.over(); assert.ok(Wd.draws() > d0, "a new sixth: the buildings redraw");
  const d1 = Wd.draws(); clock.t = at(10, 31); Wd.over(); assert.equal(Wd.draws(), d1, "same sixth: no redraw");
  clock.t = at(11, 59, 59); Wd.over(); assert.equal(Wd.dmg(2, 9), 0, "whole by noon");
  const early = data(); early.t0 -= 864e5; early.prev.t0 -= 864e5;   // the hub has not run yet: "last night" is still yesterday's
  const W2 = world("night", { t: at(1), p: 1 }, early); W2.api.view(true); assert.equal(W2.plan().night, "2026-11-07"); assert.equal(W2.api.phase().seg, "rebuild");
  const W3 = world("day", { t: at(13), p: 1 }, early); W3.api.view(true); assert.equal(W3.plan().n, 0, "a night already fired yesterday never fires twice");
});

test("cinematic replay: one strike beat per city, most missiles first, raiders from the sea last; each beat under 9.7 s (2.5x slower than before), 20 to 100 s in all; the camera zooms to the pad, follows the lead missile into the hit, then the wide shot, the cranes, and the map is handed back", () => {
  const clock = { t: at(16), p: 10000 }, d = data(); d.shots.push(["~raiders", "@a", "cannon", 1, at(2, 9), 0, 0, 0]);
  const Wd = world("day", clock, d); Wd.api.view(true); Wd.over(); const home = { x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z };
  assert.equal(Wd.api.replay(), 9); const R = Wd.rep().R, S = Wd.S(); assert.equal(S.live, false);
  assert.deepEqual(R.beats.map((b) => b.a), ["@a", "@b", "~raiders"], "most missiles first, raiders last"); assert.deepEqual(R.beats.map((b) => b.n), [6, 2, 1]);
  R.beats.forEach((b, i) => { assert.ok(b.end - b.t0 <= (i ? 9625 : 10500), `beat ${i} under 9.7 s (the first has the fly-in from the wide shot)`); assert.ok(b.launch > b.t0 && b.launch - b.t0 <= (i ? 2375 : 3250) + 1e-6, `beat ${i}: launch-t0 ${b.launch - b.t0}`); b.shots.forEach((s) => { assert.ok(s.rf >= b.launch && s.ri <= b.end, "every missile of the beat lands inside it"); }); if (i) assert.equal(b.t0, R.beats[i - 1].end, "beats run back to back"); });
  assert.ok(R.total >= 20000 && R.total <= 100000, `total ${R.total}`); assert.equal(S.end + 1600, R.total, "the tail is the flight home");
  // the camera: pre-roll at home, the pad filling the view at launch, following the lead missile, the hit, then the wide shot
  const b1 = R.beats[0], lead = b1.lead, at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); return Wd.api.phase(); };
  at0(100); assert.deepEqual([Wd.camera.x, Wd.camera.z], [home.x, home.z], "pre-roll: the camera has not moved");
  let ph = at0(b1.launch); assert.equal(Wd.camera.z, Wd.art.bPadZoom(900), "the pad fills the view"); assert.ok(Math.abs(Wd.camera.x - (450 - (lead.pad.x + Math.min(12, (lead.to.x - lead.pad.x) * .1)) * 2.6)) < 1, "centred on the pad"); assert.equal(ph.beat, 1); assert.equal(ph.beats, 3); assert.equal(ph.stage, "beat"); assert.equal(ph.label, "@a \u2192 @b \u00b7 6 missiles", "attacker, target, count"); assert.ok(R.beats.every((b) => b.shots.every((s) => s.a !== s.d)), "no self-hits"); assert.ok(R.beats.every((b) => b.lead.f > 0 && b.lead.b), "the camera follows a missile that lands");
  const mid = at0(lead.rf + lead.fl / 2); const cx1 = (450 - Wd.camera.x) / Wd.camera.z; assert.ok(Math.abs(cx1 - (lead.from.x + lead.to.x) / 2) < Math.abs(lead.to.x - lead.from.x) * .35, "mid-flight the camera is between pad and target, with the missile"); assert.ok(Wd.camera.z < 2.6, "zoomed out a little on the way");
  at0(b1.end - 100); assert.ok(Math.abs((450 - Wd.camera.x) / Wd.camera.z - lead.to.x) < 1, "holding on the hit"); assert.equal(Wd.dmg(12, 9), 1, "the tower is hit"); assert.ok(Wd.ribbons() >= 6, "a smoke ribbon per missile");
  ph = at0(R.beats[1].t0 + 50); assert.equal(ph.beat, 2); assert.ok(ph.label.startsWith("@b \u2192 @a"));
  ph = at0(R.beats[2].launch); assert.equal(ph.label, "Raiders \u2192 @a \u00b7 1 missile"); assert.ok(R.beats[2].lead.pad === R.beats[2].lead.from && R.beats[2].lead.from.y < R.beats[2].lead.to.y - 100, "raiders launch from the sea point, not a pad");
  ph = at0(S.wide + 3000); assert.equal(ph.stage, "wide"); assert.equal(Wd.camera.z, Wd.art.bWideFrame(R.shots, 900, 600).z, "the wide shot"); assert.equal(Wd.dmg(12, 9), 1, "every hit still showing"); assert.ok(Wd.ribbons() >= 9, "every ribbon kept");
  ph = at0(S.hold + (S.end - S.hold) / 2); assert.equal(ph.stage, "rebuild"); assert.ok(Wd.reb() > .45 && Wd.reb() < .55, "cranes half way"); assert.equal(ph.seg, "rebuild");
  ph = at0(S.end + 10); assert.equal(ph.replay, false, "the replay ended on its own"); assert.equal(Wd.dmg(12, 9), 0, "back to the original state"); assert.equal(Wd.ribbons(), 0); assert.equal(ph.seg, "loading", "the live afternoon again");
  Wd.api.replay(); Wd.api.stop(); assert.equal(Wd.api.phase().replay, false);
});

test("cinematic replay: beats from 1 to 8 cities each stay under 9.7 s and the whole replay inside 20 to 100 s; skip, pause and the demo", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); Wd.api.view(true);
  for (let n = 1; n <= 8; n++) { const shots = []; for (let i = 0; i < n; i++) for (let k = 0; k <= i; k++) shots.push({ a: "@c" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 300 + i * 40, y: -60 }, dist: 300 + i * 40 });
    const R = Wd.art.bBeats(shots, 0, false); assert.equal(R.beats.length, n); assert.deepEqual(R.beats.map((b) => b.n), R.beats.map((b) => b.n).slice().sort((p, q) => q - p), "descending by missiles");
    R.beats.forEach((b) => assert.ok(b.end - b.t0 <= (b.i ? 9625 : 10500) && b.end - b.t0 > 5500, `beat ${b.i} of ${n}: ${b.end - b.t0}`)); assert.ok(R.total >= 20000 && R.total <= 100000, `${n} beats: ${R.total} ms`);
    const Rr = Wd.art.bBeats(shots, 0, true); Rr.beats.forEach((b) => assert.ok(b.launch - b.t0 <= 400, "reduced motion: a cut, then the launch"));
    const big = []; for (let i = 0; i < 8; i++) for (let k = 0; k < 14; k++) big.push({ a: "@d" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 5000, y: 0 }, dist: 5000 }); const Rb = Wd.art.bBeats(big, 0, false); assert.ok(Rb.total <= 100000, `eight long-arc volleys still inside 100 s: ${Rb.total}`); }
  // skip: a tap jumps to the next beat and fills in the ribbons of the flights it skipped; pause freezes the virtual clock
  const clock = { t: at(16), p: 10000 }, W2 = world("day", clock, data()); W2.api.view(true); W2.over(); W2.api.replay(); const R = W2.rep().R;
  clock.p = 10000 + R.beats[0].launch + 200; W2.bcam(); W2.over(); assert.equal(W2.api.phase().beat, 1);
  assert.equal(W2.api.skip(), true); let ph = W2.api.phase(); assert.equal(ph.beat, 2); assert.ok(Math.abs(ph.t - R.beats[1].t0) < 1, "at the start of beat 2"); assert.ok(W2.ribbons() >= 6, "the skipped flights left their ribbons"); assert.equal(W2.dmg(12, 9), 1, "and their hits");
  assert.equal(W2.api.pause(), true); const t1 = W2.api.phase().t; clock.p += 3000; W2.bcam(); W2.over(); assert.equal(W2.api.phase().t, t1, "paused: the clock stands still"); assert.equal(W2.api.phase().paused, true);
  assert.equal(W2.api.pause(), false); clock.p += 500; assert.ok(Math.abs(W2.api.phase().t - (t1 + 500)) < 1, "resumed where it was");
  W2.api.skip(); assert.equal(W2.api.phase().stage, "wide"); W2.api.skip(); assert.equal(W2.api.phase().stage, "rebuild"); W2.api.skip(); clock.p += 1; W2.bcam(); W2.over(); assert.equal(W2.api.phase().replay, false, "skipping the cranes ends the replay");
  // the demo: a sample battle between the biggest cities on the map, raiders last, labelled demo; the live plan is untouched
  assert.equal(W2.api.replay("demo"), 11); ph = W2.api.phase(); assert.equal(ph.demo, true); assert.equal(ph.beats, 3); assert.deepEqual(W2.rep().R.beats.map((b) => b.a), ["@a", "@b", "~raiders"]); assert.equal(W2.rep().R.beats[0].n, 5);
  W2.api.stop(); assert.equal(W2.plan().n, 8, "today's plan is still today's"); assert.equal(W2.api.phase().demo, undefined);
  W2.api.replay(); W2.api.seek(R.beats[1].launch + 100); assert.equal(W2.api.phase().beat, 2, "seek lands in beat 2"); W2.api.seek(200); assert.equal(W2.api.phase().stage, "pre", "and back"); assert.equal(W2.ribbons() === 0 || W2.rep().P.shots.every((s) => !s.tr || !s.tr.pts.length), true, "seeking back clears the ribbons ahead"); W2.api.stop();
  const c = stubCtx(); W2.api.replay(); clock.p += R.beats[0].launch + 600; W2.bcam(); W2.over(); clock.p += 120; W2.over(); W2.art.bDrawRibbons(c, W2.now()); W2.art.bLaunchFxBig(0, 0, -1); assert.ok(c.__n.ops > 4, "ribbons stroke");
});

test("replay pace: 2.5x slower than before, a shot reads launch, flight, hit; the camera holds 350 to 500 ms on each hit; the clock runs at 0.5x, 1x or 2x and never jumps when the speed changes", () => {
  const W0 = world("day", { t: at(16), p: 1 }, data()); W0.api.view(true); const A = W0.art;
  // the speed math: only 0.5, 1 and 2 exist (anything else is 1x), the control cycles through them, timings scale per speed
  assert.deepEqual(A.BSPEEDS, [0.5, 1, 2]); assert.deepEqual([0.5, 1, 2, 3, 0, -1, "2", "x", null, NaN].map(A.bSpeedOf), [0.5, 1, 2, 1, 1, 1, 2, 1, 1, 1]);
  assert.deepEqual([0.5, 1, 2, 2].map(A.bSpeedNext), [1, 2, 0.5, 0.5], "0.5x -> 1x -> 2x -> 0.5x");
  assert.equal(A.bRealMs(4000, 1), 4000); assert.equal(A.bRealMs(4000, 2), 2000, "twice as fast: half the time"); assert.equal(A.bRealMs(4000, 0.5), 8000, "half speed: twice the time"); assert.equal(A.bRealMs(4000, 7), 4000, "a bad speed is 1x");
  assert.equal(A.bVirt(1000, 50, 1, 150), 1100); assert.equal(A.bVirt(1000, 50, 2, 150), 1200); assert.equal(A.bVirt(1000, 50, 0.5, 150), 1050);
  // the pace itself: a flight is 3.25 to 5 s (it was 1.3 to 2 s), every other beat timing 2.5x, the hold on a hit 350 to 500 ms
  const OLD = (d) => 1300 + Math.min(700, d * .55); for (const d of [100, 300, 800, 2000]) assert.ok(Math.abs(A.bRepFlight(d) / OLD(d) - 2.5) < 1e-9, `flight at ${d} px is 2.5x the old one`);
  assert.equal(A.BRT.flMin, 3250); assert.equal(A.BRT.flCap, 5000); assert.ok(A.BRT.hold >= 350 && A.BRT.hold <= 500, `hold ${A.BRT.hold}`);
  assert.equal(A.BRT.approach, 950 * 2.5); assert.equal(A.BRT.beatMax, 3850 * 2.5); assert.equal(A.BRT.pre, 500 * 2.5);
  const shots = []; for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) shots.push({ a: "@c" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 300 + 90 * i, y: -60 }, dist: 300 + 90 * i });
  const R = A.bBeats(shots, 0, false); R.beats.forEach((b) => { b.shots.forEach((q) => { assert.ok(q.rf >= b.launch, "launch"); assert.ok(q.ri - q.rf >= 3250 && q.ri - q.rf <= 5000, "flight"); assert.ok(q.ri <= b.end, "hit"); }); assert.ok(Math.abs(b.end - b.hit - A.BRT.hold) < 1e-6, "the camera holds on the last hit for the hold, then moves on"); });
  assert.equal(R.beats[0].shots[1].rf - R.beats[0].shots[0].rf, 175, "launches are 175 ms apart, one after another");
  // the clock in a replay: 1x, 2x and 0.5x, a change of speed re-anchors (no jump), pause keeps it, seek keeps the speed
  const clock = { t: at(16), p: 5000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); assert.equal(Wd.api.speed(), 1, "1x unless the page says otherwise"); Wd.api.replay(); const ph0 = () => Wd.api.phase();
  clock.p += 1000; assert.equal(Math.round(ph0().t), 1000); assert.equal(ph0().speed, 1);
  assert.equal(Wd.api.speed(2), 2); assert.equal(Math.round(ph0().t), 1000, "changing speed does not jump"); clock.p += 1000; assert.equal(Math.round(ph0().t), 3000, "2x: two virtual seconds per second");
  assert.equal(Wd.api.speed(0.5), 0.5); assert.equal(Math.round(ph0().t), 3000); clock.p += 1000; assert.equal(Math.round(ph0().t), 3500, "0.5x");
  assert.equal(Wd.api.speed(9), 1, "an unknown speed is 1x"); Wd.api.speed(2); Wd.api.pause(true); const tp = ph0().t; clock.p += 5000; assert.equal(ph0().t, tp, "paused at 2x"); Wd.api.speed(0.5); assert.equal(ph0().t, tp, "speed changes while paused keep the time"); Wd.api.pause(false); clock.p += 1000; assert.equal(Math.round(ph0().t - tp), 500, "play again at 0.5x");
  Wd.api.speed(2); Wd.api.seek(1000); assert.equal(Math.round(ph0().t), 1000); clock.p += 500; assert.equal(Math.round(ph0().t), 2000, "seek keeps the speed"); assert.equal(Wd.api.prev(), true); assert.ok(ph0().t < 2000, "prev steps back");
  assert.equal(ph0().until - clock.t <= (ph0().dur - ph0().t) / 2 + 1, true, "time left is in wall-clock time at 2x (the page's clock is the stubbed one, so the test passes at any hour, also on CI mornings)");
  Wd.api.stop(); assert.equal(Wd.api.replay("demo", { speed: 0.5 }) > 0, true); assert.equal(ph0().speed, 0.5, "a replay can start at the viewer's remembered speed"); Wd.api.stop(); Wd.api.replay(); assert.equal(ph0().speed, 0.5, "the speed is kept for the next replay"); Wd.api.stop();
  // the effects clock (the collapse of a hit tower, the particles) follows the speed and stops while paused
  const W2 = world("day", clock, data()); W2.api.view(true); W2.over(); W2.api.replay(); const f0 = () => W2.art.fx(); W2.api.speed(2); clock.p += 40; W2.over(); const a1 = f0(); clock.p += 40; W2.over(); assert.equal(Math.round(f0() - a1), 80, "2x: effects at double rate");
  W2.api.speed(0.5); clock.p += 40; W2.over(); const a2 = f0(); clock.p += 40; W2.over(); assert.equal(Math.round(f0() - a2), 20, "0.5x"); W2.api.pause(true); const a3 = f0(); clock.p += 400; W2.over(); assert.equal(f0(), a3, "paused: effects stand still"); W2.api.stop();
});

test("damage readout: a pill with the dollars and a standing bar over the hit tower for 2.6 s, or Shield held; phase() carries it for the controls", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, S = R.S, P = Wd.rep().P;
  const shield = P.shots.find((s) => !(s.f > 0 && s.b)), hitShot = R.beats[0].lead, step = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); };
  step(hitShot.ri - 50); assert.equal(Wd.api.phase().hit, null, "nothing before the hit");
  step(hitShot.ri + 100); let h = Wd.api.phase().hit; assert.ok(h && h.d === "@b" && h.shield === false && h.of === 100, "a hit on @b"); assert.ok(h.from > h.to, `the tower drops from ${h.from}% to ${h.to}% standing`); assert.ok(h.to >= 0 && h.from <= 100); assert.equal(h.usd, 5e6, "a night from before 11-13: one facade is $5M");
  const now = hitShot.ri + 100, L = Wd.art.bHitsNow(P, S, now); assert.ok(L.length >= 1 && L.every((o) => o.age >= 0 && o.age < 2600)); assert.ok(L.some((o) => o.hit && o.t1 > o.t0));
  const c = stubCtx(); Wd.art.bHitLabels(c, P, S, now); assert.ok(c.__n.ops > 4, "the pill draws, finite geometry");
  step(hitShot.ri + 2700); assert.ok(Wd.art.bHitsNow(P, S, hitShot.ri + 2700).every((o) => o.s !== hitShot), "gone after 2.6 s");
  if (shield) { const ia = shield.ri, L2 = Wd.art.bHitsNow(P, S, ia + 100).filter((o) => o.s === shield); assert.ok(L2.length === 1 && L2[0].hit === false, "the shield-held shot reads Shield held"); }
  const R0 = world("day", { t: at(16), p: 1 }, data(), true); R0.api.view(true); R0.api.replay(); R0.over(); R0.art.bHitLabels(stubCtx(), R0.rep().P, R0.rep().R.S, R0.rep().R.beats[0].lead.ri + 10); Wd.api.stop();
});

test("viewer camera: zoom never goes past fit-all or beyond 3x, the map can't be dragged out of view, Fit all frames the battlefield", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); Wd.api.view(true); const A = Wd.art, fit = 0.5;
  assert.equal(A.bClampZoom(0.01, fit, 3), fit, "no farther out than the whole battlefield"); assert.equal(A.bClampZoom(99, fit, 3), 3, "no closer than the maximum"); assert.equal(A.bClampZoom(1.2, fit, 3), 1.2); assert.equal(A.bClampZoom(fit, fit, 3), fit); assert.equal(A.bClampZoom(3, fit, 3), 3);
  assert.equal(A.bClampZoom(NaN, fit, 3), fit); assert.equal(A.bClampZoom(-4, fit, 3), fit); assert.equal(A.bClampZoom(1, 0, 3), 1, "no fit zoom known: a sane floor"); assert.ok(A.bClampZoom(0.001, 0, 3) > 0); assert.equal(A.bClampZoom(5, 7, 3), 3, "a fit zoom above the maximum cannot trap the zoom");
  let z = 1; for (let i = 0; i < 200; i++) { z = A.bClampZoom(z * 0.8, fit, 3); assert.ok(z >= fit); } assert.equal(z, fit, "zooming out for ever stops at fit-all"); for (let i = 0; i < 200; i++) { z = A.bClampZoom(z * 1.25, fit, 3); assert.ok(z <= 3); } assert.equal(z, 3, "zooming in for ever stops at the maximum");
  const l = Wd.api.camera(); assert.equal(l.minZ, 0.5); assert.equal(l.maxZ, 3);
  // pan: the world point under the middle of the screen is always inside the map
  const bd = A.bMapBounds(), vw = 900, vh = 600; assert.ok(bd.x0 < bd.x1 && bd.y0 < bd.y1);
  for (const c of [{ x: 1e6, y: 0, z: 1 }, { x: -1e6, y: 1e6, z: 2 }, { x: 0, y: -1e6, z: 0.5 }, { x: 300, y: 200, z: 1 }]) { const o = A.bClampCam(c, vw, vh, bd), cx = (vw / 2 - o.x) / o.z, cy = (vh / 2 - o.y) / o.z; assert.ok(cx >= bd.x0 - 1e-6 && cx <= bd.x1 + 1e-6 && cy >= bd.y0 - 1e-6 && cy <= bd.y1 + 1e-6, "map centre-line inside the map"); assert.equal(o.z, c.z, "pan never changes zoom"); }
  const ok = { x: 300, y: 200, z: 1 }, same = A.bClampCam(ok, vw, vh, bd); assert.deepEqual(same, ok, "a camera that is already fine is left alone");
  // fit all: the fit zoom, the map centred; it works while following (and hands the camera to the viewer)
  const F = A.bFitCam(); assert.equal(F.z, 0.5); const c0 = (vw / 2 - F.x) / F.z; assert.ok(Math.abs(c0 - 0) < 1, "centred on the middle of the map (iso x of the centre tile is 0)");
  Wd.over(); Wd.api.replay(); Wd.camera.x = 9999; Wd.camera.z = 2.2; assert.equal(Wd.api.fit(), true); assert.equal(Wd.camera.z, 0.5); assert.ok(Math.abs(Wd.camera.x - F.x) < 1e-6 && Math.abs(Wd.camera.y - F.y) < 1e-6); assert.equal(Wd.api.phase().follow, false); Wd.api.stop();
  // the renderer applies them to every wheel, pinch and drag in the Battle view
  assert.ok(CITY_JS.includes("var lim=BON?bCamLim():null,z=lim?bClampZoom(cam.z*f,lim.min,lim.max):"), "zoom() uses the clamp in the Battle view");
  assert.ok(CITY_JS.includes("if(BON){bClampPan();if(moved)bUserCam()}"), "a drag is clamped and takes the camera");
  assert.ok(CITY_JS.includes("if(BON){bClampPan();bUserCam()}draw()}"), "a zoom (wheel or pinch) is clamped and takes the camera");
  assert.ok(CITY_JS.includes("ev.ctrlKey?0.01:0.0015"), "a trackpad pinch (ctrl+wheel) zooms at a usable rate"); assert.ok(/addEventListener\('pointerdown',function\(ev\)\{if\(BON\)flyStop\(\)/.test(CITY_JS), "touching the map stops a camera flight");
});

test("follow mode: the auto camera is the default, any pan or zoom turns it off, Follow turns it back on and eases back; reduced motion cuts", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, b1 = R.beats[0];
  const at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); }; assert.equal(Wd.api.phase().follow, true, "follow is the default"); assert.equal(Wd.api.camera().follow, true);
  at0(b1.launch); const padZ = Wd.camera.z, padX = Wd.camera.x; assert.equal(padZ, Wd.art.bPadZoom(900));
  // the viewer pans: follow goes off, and the auto camera leaves the camera where the viewer put it, however long the replay runs
  Wd.camera.x += 321; Wd.camera.y -= 77; Wd.art.userCam(); assert.equal(Wd.api.phase().follow, false); const held = { x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z };
  for (const ms of [b1.launch + 500, b1.hit + 100, R.beats[1].launch, R.S.wide + 2000]) { at0(ms); assert.deepEqual({ x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z }, held, `the auto camera stays off at ${Math.round(ms)}`); }
  assert.equal(Wd.api.phase().follow, false, "still off"); Wd.art.userCam(); assert.equal(Wd.api.phase().follow, false, "a second gesture is harmless");
  // Follow: on again, and the camera eases to where the auto camera is over 450 ms (it does not snap)
  at0(b1.launch + 200); Wd.api.follow(true); Wd.bcam(); assert.equal(Wd.api.phase().follow, true); assert.equal(Wd.api.camera().follow, true);
  const e0 = Wd.camera.x; assert.ok(Math.abs(e0 - held.x) < 1, "the first frame is where the viewer left it"); clock.p += 200; Wd.bcam(); const e1 = Wd.camera.x; clock.p += 400; Wd.bcam(); const e2 = Wd.camera.x; clock.p += 100; Wd.bcam(); const e3 = Wd.camera.x;
  assert.ok(e1 !== e0, "it moves"); assert.ok(Math.abs(e3 - e2) < Math.abs(e0 - e2) || e3 === e2, "and settles on the auto camera"); Wd.bcam(); assert.ok(Math.abs(Wd.camera.x - e3) < 400);
  // a real gesture in the renderer: pan, wheel and pinch all go through bUserCam; the tap that skips a strike does not
  assert.ok(CITY_JS.includes("if(BON&&BREP){bSkip();return}"), "a tap still skips"); assert.ok((CITY_JS.match(/bUserCam\(\)/g) || []).length >= 2);
  Wd.api.follow(false); assert.equal(Wd.api.phase().follow, false, "follow(false) takes the camera too"); Wd.api.stop(); assert.equal(Wd.api.follow(true), false, "no replay: nothing to follow"); assert.equal(Wd.api.camera().follow, false); Wd.art.userCam();
  // a new replay starts with the auto camera again
  Wd.api.replay(); assert.equal(Wd.api.phase().follow, true, "each replay starts following"); Wd.api.stop();
  // reduced motion: no easing, an instant cut per event
  const c2 = { t: at(16), p: 10000 }, Wr = world("day", c2, data(), true); Wr.api.view(true); Wr.over(); Wr.api.replay(); const Rr = Wr.rep().R, br = Rr.beats[0], step = (ms) => { c2.p = 10000 + ms; Wr.bcam(); Wr.over(); };
  const pad = Wr.art.bPadFrame(br, 900), hit = Wr.art.bHitFrame(br, 900), px = 450 - pad.x * pad.z;
  for (const ms of [br.t0 + 10, br.launch, br.lead.rf + br.lead.fl * 0.2, br.lead.rf + br.lead.fl * 0.45]) { step(ms); assert.ok(Math.abs(Wr.camera.x - px) < 0.5 && Math.abs(Wr.camera.z - pad.z) < 1e-6, "reduced motion: the pad, no tween"); }
  for (const ms of [br.lead.rf + br.lead.fl * 0.6, br.lead.ri, br.lead.ri + 100]) { step(ms); assert.ok(Math.abs(Wr.camera.z - hit.z) < 1e-6 && Math.abs(Wr.camera.x - (450 - hit.x * hit.z)) < 0.5, "then a cut to the hit"); }
  Wr.camera.x += 500; Wr.art.userCam(); const kept = Wr.camera.x; step(br.end + 100); assert.equal(Wr.camera.x, kept); Wr.api.follow(true); Wr.bcam(); assert.ok(Math.abs(Wr.camera.x - kept) > 1, "reduced motion: Follow cuts straight to the auto camera"); step(br.end + 200);
  const target2 = Wr.art.bRepCam(Wr.rep().R, c2.p - 10000, Wr.rep().home, 900, 600, true); assert.ok(Math.abs(Wr.camera.x - (450 - target2.x * target2.z)) < 0.5 && Math.abs(Wr.camera.z - target2.z) < 1e-6, "on the auto camera at once"); Wr.api.stop();
});

test("aim points: every shot lands on the roof of one of the defender's repo towers (tallest first, lot = tower index), never on grass, roads or the plot; a city with no towers gets no shots", () => {
  for (const night of ["2026-11-07", "2026-11-08", "2026-11-09"]) for (let seed = 0; seed < 6; seed++) {
    const d = data(); d.night = night; d.shots = []; const who = ["@a", "@b"]; for (let i = 0; i < 14; i++) { const a = who[(i + seed) % 2], df = who[(i + seed + 1) % 2]; d.shots.push([a, df, "cannon", i % 5 === 3 ? 0 : 1, at(2, i), (i * 7 + seed) % 5 - 1, 0, 0]); }
    d.shots.push(["@a", "@c", "cannon", 1, at(2, 20), 0, 0, 0], ["@c", "@a", "cannon", 1, at(2, 21), 0, 0, 0], ["~raiders", "@b", "cannon", 1, at(2, 22), -1, 0, 0]);
    const Wd = world("day", { t: at(16), p: 1 }, d); Wd.api.view(true); const P = Wd.plan(), B = Wd.art.bld();
    assert.deepEqual(B["@a"].map((b) => b.r.name), ["a1", "a2"]); assert.deepEqual(B["@b"].map((b) => b.r.name), ["b1", "b2"], "tallest first");
    assert.equal(P.n, 15, "the shot at @c (no towers) is dropped, @c's own pad does not exist: dropped too"); assert.equal(P.dropped, 2);
    for (const s of P.shots) { assert.ok(s.b && s.to, "a target tower"); assert.ok(s.d.charAt(0) === "@" ? s.b.r && B[s.d].includes(s.b) : true, "one of the defender's own");
      const top = s.b.p.y + 4 - s.b.h; assert.ok(Math.abs(s.to.x - s.b.p.x) <= 64 * .11 && Math.abs(s.to.y - top) <= 32 * .11, `inside the roof diamond (${s.to.x - s.b.p.x}, ${s.to.y - top})`);
      assert.notEqual(s.a, s.d, "never itself"); if (s.a === "~raiders") assert.ok(s.from.y < s.to.y - 100 && s.pad === s.from, "raiders fire from the sea point"); }
  }
  // the impact plays on the building: fireball and chunks at the roof, the lost floors collapse into the stump, rubble piles up
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, lead = R.beats[0].lead;
  for (let ms = lead.ri - 300; ms <= lead.ri + 60; ms += 30) { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); }
  // Mike 11-11: the lost floors shatter into masses of pixels in the tower's colours (capped per LOD), fall, bounce and settle, then fade
  assert.ok(Wd.vox() >= 50 && Wd.vox() <= 600, "the hit floors burst into voxels: " + Wd.vox()); assert.ok(Wd.bp() > 70, "fireball, chunks, dust and voxels");
  const c = stubCtx(); Wd.art.bDrawParticles(c); Wd.art.bRubblePiles(c, 0, 0, "#3178C6", 1); assert.ok(c.__n.ops > 60, "every voxel is drawn");
  for (let k = 0; k < 20; k++) { clock.p += 100; Wd.bcam(); Wd.over(); } assert.ok(Wd.voxDown() > 0, "voxels have landed around the footprint after 2 s");
  Wd.api.stop(); for (let k = 0; k < 90; k++) { clock.p += 50; Wd.over(); } assert.equal(Wd.vox(), 0, "all gone within 4.5 s of no new hits (the cached heap holds the rubble)");
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
  assert.ok(CITY_JS.includes("function frame(){T=performance.now();bCam();"), "the replay camera is set before the frame is drawn");
  assert.ok(CITY_JS.includes("function flyStop(){FLYG++}") && CITY_JS.includes("if(g!==FLYG)return;"), "a replay cancels a flight in progress");
  assert.ok(CITY_JS.includes("if(BON&&BREP){bSkip();return}"), "a tap on the map during a replay skips to the next strike");
  assert.ok(CITY_JS.includes("if(!BON){drawWalks();drawLife()}"), "no people on foot in the Battle view");
  assert.ok(CITY_JS.includes("if(t.t==='h'&&!BON)") && CITY_JS.includes("if(cd===4){if(!BON)"), "no little houses in the Battle view");
  assert.ok(CITY_JS.includes("hc===0&&!BON") && CITY_JS.includes("!gWin()&&!BON") && CITY_JS.includes("if(!BON)for(var k=0;k<7;k++)") && CITY_JS.includes("if(!BON)drawFx()"), "no growth crews, parades or effects walkers in the Battle view");
  assert.ok(CITY_JS.includes("litp*=Math.max(0,1-bdh*.85)") && CITY_JS.includes("pxHeap(c,p.x,base,tiers[0][0],col,bdh,rb0,seed)"), "a hit tower goes dark and a heap of its own pixels piles up around it");
  assert.ok(CITY_JS.includes("bBld(t,i,j)") && CITY_JS.includes("dmg:bdm>0?{d:bdh,f:rb0,seed:seed}:null") && CITY_JS.includes("cranes.push({x:p.x+4,y:top,seed:seed,col:col})"), "hit towers lose floors through the pixel mask and get a crane while the build line rises");
  new Function(CITY_JS);
});

test("saved battle state: v1 round-trips, the pre-11-11 shape migrates, corrupt and unknown records load fresh, nothing throws", () => {
  const W = world("day", { t: at(9), p: 1000 }, data());
  assert.deepEqual(W.stateLoad(null), { v: 1, night: "", at: 0, bld: {} });
  assert.deepEqual(W.stateLoad("{not json"), { v: 1, night: "", at: 0, bld: {} });
  assert.deepEqual(W.stateLoad({ v: 7, night: "x", bld: { a: { d: 1, f: 1 } } }), { v: 1, night: "", at: 0, bld: {} }, "an unknown version is not trusted");
  const v1 = { v: 1, night: "2026-11-06", at: 5, bld: { "@a|0": { d: .5, f: .25 }, "@b|1": { d: 1, f: 0 }, junk: null, zero: { d: 0, f: .5 }, over: { d: 3, f: 9 } } };
  assert.deepEqual(W.stateLoad(JSON.stringify(v1)), { v: 1, night: "2026-11-06", at: 5, bld: { "@a|0": { d: .5, f: .25 }, "@b|1": { d: 1, f: 0 }, over: { d: 1, f: 1 } } }, "v1: clamped, junk dropped");
  // the old save (the shape the first battle build wrote): one rebuild fraction for the whole night and damage per key
  assert.deepEqual(W.stateLoad({ night: "2026-11-05", reb: .5, dmg: { "@a|0": .5, "@a|1": 0 } }), { v: 1, night: "2026-11-05", at: 0, bld: { "@a|0": { d: .5, f: .5 } } }, "an old save still loads");
});

test("saved battle state: the morning rebuild writes caldera.battle.state, a reload picks up the saved progress (never backwards), a new night starts fresh, a broken store is harmless", () => {
  const store = memStore(), clock = { t: at(9), p: 1000 }, W = world("night", clock, data(), false, store); W.api.view(true); W.over();
  const saved = JSON.parse(store.raw("caldera.battle.state")); assert.equal(saved.v, 1); assert.equal(saved.night, "2026-11-06"); assert.ok(saved.bld["@a|0"], "a's hit tower is on record: " + JSON.stringify(saved.bld));
  assert.ok(Math.abs(saved.bld["@a|0"].f - .75) < .01 && saved.bld["@a|0"].d === 1, "75% rebuilt at 09:00, full damage held");
  // the same page reloads with the clock an hour earlier (a timezone change, a wrong clock): the tower keeps its 75%, the schedule says 66%
  const clock2 = { t: at(8), p: 1000 }, W2 = world("night", clock2, data(), false, store); W2.api.view(true); W2.over();
  assert.ok(Math.abs(W2.reb() - 2 / 3) < .01, "the schedule alone would say 66%"); assert.ok(Math.abs(W2.rebOf(2, 9) - .75) < .01, "the saved record wins: never backwards");
  assert.equal(W2.rebOf(12, 9), W2.reb(), "a tower without a record follows the schedule");
  // a different night in the store: ignored, replaced by tonight's record on the next write
  store.setItem("caldera.battle.state", JSON.stringify({ v: 1, night: "2026-10-01", at: 1, bld: { "@a|0": { d: 1, f: 1 } } }));
  const W3 = world("night", { t: at(8), p: 1000 }, data(), false, store); W3.api.view(true); W3.over(); assert.ok(Math.abs(W3.rebOf(2, 9) - 2 / 3) < .01, "another night's record does not apply");
  assert.equal(JSON.parse(store.raw("caldera.battle.state")).night, "2026-11-06", "tonight's record replaced it");
  const W4 = world("night", { t: at(8), p: 1000 }, data(), false, memStore(true)); W4.api.view(true); W4.over(); assert.ok(Math.abs(W4.rebOf(2, 9) - 2 / 3) < .01, "a store that throws leaves the schedule in charge");
});

// ---------------------------------------------------------------- 11-13: sizes, physics rows, fire and smoke
/** one night under the 11-13 rules: @a fires one of each size at @b (a shell that barely scratches, a rocket that misses into the
 *  street, a tactical missile whose fire spreads, a cruise missile on a full shield); x is the hub's physics for the shot */
const X = (o) => ({ u: 0, fi: 0, fu: 0, sp: 0, m: 2, cep: 10, r: 8, kpa: 500, c: 1, fl: 15, v: 18e6, sh: 0, cd: 1, st: 1, pc: 1, raw: 0, ...o });
const data13 = () => ({ at: "x", night: "2026-11-07", t0: at(2), next: at(2) + 864e5, members: { "@a": { sh: 0, beg: 0, ammo: 70, best: "cruise", shots: 4, hits: [], reb: 100 }, "@b": { sh: 0, beg: 0, ammo: 0, best: "shell", shots: 0, hits: [], reb: 100 } },
  shots: [["@a", "@b", "shell", .001, at(2, 1), 0, 0, 0, X({ u: 18000, fi: .0002, fu: 3600 })], ["@a", "@b", "rocket", .004, at(2, 2), 1, 0, 0, X({ u: 72000, fi: .0006, fu: 10800, m: 22 })],
    ["@a", "@b", "tactical", .2, at(2, 3), 1, 0, 0, X({ u: 3.6e6, fi: .16, fu: 2.88e6, sp: 1 })], ["@a", "@b", "cruise", 0, at(2, 4), 0, 1, 0, X({ sh: 1, pot: 9e6 })]], prev: null });

test("11-13: every missile that lands shows on its tower, however small; a miss comes down in the street; sizes look different; labels are in dollars", () => {
  const clock = { t: at(16), p: 1000 }, Wd = world("day", clock, data13()); Wd.api.view(true); const P = Wd.plan();
  assert.equal(P.n, 4); assert.deepEqual(P.shots.map((s) => s.sz), [.75, .95, 1.15, 1.4], "shell < rocket < tactical < cruise on the map");
  assert.deepEqual(P.shots.map((s) => s.usd), [21600, 82800, 6.48e6, 0]); assert.equal(P.shots[3].pot, 9e6);
  assert.ok(P.shots[1].to.miss && Math.abs(P.shots[1].to.y - (P.shots[1].b.p.y + 4)) <= 16 + 8 && Math.abs(P.shots[1].to.x - P.shots[1].b.p.x) <= 64 * .72 + 1, "22 m off: the rocket lands in the street next to its tower");
  assert.ok(!P.shots[0].to.miss && !P.shots[2].to.miss, "inside 10 m: on the roof");
  clock.t = at(20, 0, 10); Wd.over();
  assert.equal(Wd.dmg(12, 9), 1 / 24, "a $18k shell hit (0.1% of the tower) still takes the smallest step off it: no zero-damage hits");
  assert.ok(Wd.dmg(14, 9) >= 5 / 24 && Wd.dmg(14, 9) <= 6 / 24, "the rocket and the tactical missile on b2: " + Wd.dmg(14, 9));
  assert.ok(Wd.card("@b").includes("$6.6M of damage"), Wd.card("@b")); assert.ok(Wd.card("@a").includes("up to cruise missiles"));
  // sizes draw differently: a shell has no motor flame, a cruise missile has wings (more path points)
  const ops = (sz) => { const c = stubCtx(); Wd.art.missileHi(c, 0, 0, 0, sz, "#3178C6", 1); return c.__n.ops; };
  assert.ok(ops(.75) < ops(.95) && ops(.95) < ops(1.4), "shell, rocket and cruise are three different drawings");
});

test("11-13: a hit tower burns: the fire adds damage as fi x (1 - e^(-t/1h)), flames die down, smoke thins, the cache redraws as it burns, and the morning only smoulders", () => {
  const clock = { t: at(20, 0, 10), p: 1000 }, Wd = world("night", clock, data13()); Wd.api.view(true); Wd.over();
  const a0 = Wd.dmg(14, 9); clock.t = at(21, 30); const d0 = Wd.draws(); Wd.over(); const a1 = Wd.dmg(14, 9);
  assert.ok(a1 > a0, `the fire keeps eating the tower: ${a0} -> ${a1}`); assert.ok(Wd.draws() > d0, "the burn redraws the buildings");
  const want = .004 + .0006 * (1 - Math.exp(-1.5)) + .2 + .16 * (1 - Math.exp(-1.5)); assert.ok(Math.abs(a1 - Math.ceil(want * 24) / 24) < 1e-9, "blast + fire so far, in 24ths: " + a1);
  clock.t = at(23, 59); Wd.over(); assert.ok(Math.abs(Wd.dmg(14, 9) - Math.ceil((.204 + .1606 * (1 - Math.exp(-4))) * 24) / 24) < 1e-9, "burnt out by midnight: about 98% of the fire damage is in");
  // the plume and the flames are drawn while it burns; in the morning (cranes at work) smoke only, then nothing
  const rep = world("night", { t: at(16), p: 10000 }, data13()); rep.api.view(true); rep.over(); assert.equal(rep.api.replay(), 4);
  const R = rep.rep().R, tac = rep.rep().P.shots.find((s) => s.w === "tactical"); assert.equal(tac.burn, 1); assert.equal(rep.rep().P.shots[0].burn, .45, "a contained fire burns smaller");
  const h = rep.api.phase(); assert.ok(h.replay);
  const lab = rep.art.bHitsNow(rep.rep().P, R.S, tac.ri + 100).find((o) => o.s === tac); assert.ok(lab && lab.hit && lab.t1 > lab.t0);
  const held = rep.rep().P.shots[3], l2 = rep.art.bHitsNow(rep.rep().P, R.S, held.ri + 100).find((o) => o.s === held); assert.ok(l2 && !l2.hit, "the shielded cruise missile reads Shield held (and what it would have cost)");
  rep.api.stop();
});
