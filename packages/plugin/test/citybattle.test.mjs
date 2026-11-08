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
  return new Function("PAL", "mk", "DATA", "FakeDate", "CLOCK", pre + HIFI_JS + BATTLE_DRAW_JS + `; return {api:window.CALDERA_BATTLE_API,over:battleOver,plan:function(){return bPlan(Date.now())},S:bS,now:bNow,dmg:function(i,j){return bBld(null,i,j)},reb:bRebuild,draws:function(){return draws},bp:function(){return BP.length},cranes:cranes,bcam:bCam,camera:cam,rep:function(){return BREP},ribbons:function(){return BTR.length},dbg:function(){return {H:JSON.stringify(Object.keys(BHITB).map(function(k){return [k,Object.keys(BHITB[k])]})),B:Object.keys(BBAT).join(' '),sh:BPLAN.shots.map(function(s){return [s.a,s.d,s.lot,s.f,!!s.b,s.b&&s.b.idx,bImpactAt(bS(),s)-bS().salvo]}),S:[bS().salvo,bS().hold,bS().end,bNow()]}},
    art:{padHi:padHi,stackHi:stackHi,chuteHi:chuteHi,chuteDownHi:chuteDownHi,launcherHi:launcherHi,badgeHi:badgeHi,countdownHi:countdownHi,missileHi:missileHi,ruinHi:ruinHi,bTraj:bTraj,bImpactFx:bImpactFx,bStep:bStep,bDrawParticles:bDrawParticles,bLaunchFx:bLaunchFx,bShieldFx:bShieldFx,bLandFx:bLandFx,bSchedule:bSchedule,bSegment:bSegment,bSlot:bSlot,bBeats:bBeats,bRepCam:bRepCam,bPadZoom:bPadZoom,bWideFrame:bWideFrame,bRibbonFill:bRibbonFill,bDrawRibbons:bDrawRibbons,bLaunchFxBig:bLaunchFxBig},setLOD:function(v){LODN=v},card:battleCard}`)(PAL, stubCtx, data, F, clock);
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

test("cinematic replay: one strike beat per city, most missiles first, raiders from the sea last; each beat under 4 s, 20 to 40 s in all; the camera zooms to the pad, follows the lead missile into the hit, then the wide shot, the cranes, and the map is handed back", () => {
  const clock = { t: at(16), p: 10000 }, d = data(); d.shots.push(["~raiders", "@a", "cannon", 1, at(2, 9), 0, 0, 0]);
  const Wd = world("day", clock, d); Wd.api.view(true); Wd.over(); const home = { x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z };
  assert.equal(Wd.api.replay(), 9); const R = Wd.rep().R, S = Wd.S(); assert.equal(S.live, false);
  assert.deepEqual(R.beats.map((b) => b.a), ["@a", "@b", "~raiders"], "most missiles first, raiders last"); assert.deepEqual(R.beats.map((b) => b.n), [6, 2, 1]);
  R.beats.forEach((b, i) => { assert.ok(b.end - b.t0 <= (i ? 3850 : 4200), `beat ${i} under 4 s (the first has the fly-in from the wide shot)`); assert.ok(b.launch > b.t0 && b.launch - b.t0 <= (i ? 950 : 1300)); b.shots.forEach((s) => { assert.ok(s.rf >= b.launch && s.ri <= b.end, "every missile of the beat lands inside it"); }); if (i) assert.equal(b.t0, R.beats[i - 1].end, "beats run back to back"); });
  assert.ok(R.total >= 20000 && R.total <= 40000, `total ${R.total}`); assert.equal(S.end + 800, R.total, "the tail is the flight home");
  // the camera: pre-roll at home, the pad filling the view at launch, following the lead missile, the hit, then the wide shot
  const b1 = R.beats[0], lead = b1.lead, at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); return Wd.api.phase(); };
  at0(100); assert.deepEqual([Wd.camera.x, Wd.camera.z], [home.x, home.z], "pre-roll: the camera has not moved");
  let ph = at0(b1.launch); assert.equal(Wd.camera.z, Wd.art.bPadZoom(900), "the pad fills the view"); assert.ok(Math.abs(Wd.camera.x - (450 - (lead.pad.x + Math.min(12, (lead.to.x - lead.pad.x) * .1)) * 2.6)) < 1, "centred on the pad"); assert.equal(ph.beat, 1); assert.equal(ph.beats, 3); assert.equal(ph.stage, "beat"); assert.equal(ph.label, "@a \u2192 @b \u00b7 6 missiles", "attacker, target, count"); assert.ok(R.beats.every((b) => b.shots.every((s) => s.a !== s.d)), "no self-hits");
  const mid = at0(lead.rf + lead.fl / 2); const cx1 = (450 - Wd.camera.x) / Wd.camera.z; assert.ok(Math.abs(cx1 - (lead.from.x + lead.to.x) / 2) < Math.abs(lead.to.x - lead.from.x) * .35, "mid-flight the camera is between pad and target, with the missile"); assert.ok(Wd.camera.z < 2.6, "zoomed out a little on the way");
  at0(b1.end - 100); assert.ok(Math.abs((450 - Wd.camera.x) / Wd.camera.z - lead.to.x) < 1, "holding on the hit"); assert.equal(Wd.dmg(12, 9), 1, "the tower is hit"); assert.ok(Wd.ribbons() >= 6, "a smoke ribbon per missile");
  ph = at0(R.beats[1].t0 + 50); assert.equal(ph.beat, 2); assert.ok(ph.label.startsWith("@b \u2192 @a"));
  ph = at0(R.beats[2].launch); assert.equal(ph.label, "Raiders \u2192 @a \u00b7 1 missile"); assert.ok(R.beats[2].lead.pad === R.beats[2].lead.from && R.beats[2].lead.from.y < R.beats[2].lead.to.y - 100, "raiders launch from the sea point, not a pad");
  ph = at0(S.wide + 1500); assert.equal(ph.stage, "wide"); assert.equal(Wd.camera.z, Wd.art.bWideFrame(R.shots, 900, 600).z, "the wide shot"); assert.equal(Wd.dmg(12, 9), 1, "every hit still showing"); assert.ok(Wd.ribbons() >= 9, "every ribbon kept");
  ph = at0(S.hold + (S.end - S.hold) / 2); assert.equal(ph.stage, "rebuild"); assert.ok(Wd.reb() > .45 && Wd.reb() < .55, "cranes half way"); assert.equal(ph.seg, "rebuild");
  ph = at0(S.end + 10); assert.equal(ph.replay, false, "the replay ended on its own"); assert.equal(Wd.dmg(12, 9), 0, "back to the original state"); assert.equal(Wd.ribbons(), 0); assert.equal(ph.seg, "loading", "the live afternoon again");
  Wd.api.replay(); Wd.api.stop(); assert.equal(Wd.api.phase().replay, false);
});

test("cinematic replay: beats from 1 to 8 cities each stay under 4 s and the whole replay inside 20 to 40 s; skip, pause and the demo", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); Wd.api.view(true);
  for (let n = 1; n <= 8; n++) { const shots = []; for (let i = 0; i < n; i++) for (let k = 0; k <= i; k++) shots.push({ a: "@c" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 300 + i * 40, y: -60 }, dist: 300 + i * 40 });
    const R = Wd.art.bBeats(shots, 0, false); assert.equal(R.beats.length, n); assert.deepEqual(R.beats.map((b) => b.n), R.beats.map((b) => b.n).slice().sort((p, q) => q - p), "descending by missiles");
    R.beats.forEach((b) => assert.ok(b.end - b.t0 <= (b.i ? 3850 : 4200) && b.end - b.t0 > 3000)); assert.ok(R.total >= 20000 && R.total <= 40000, `${n} beats: ${R.total} ms`);
    const Rr = Wd.art.bBeats(shots, 0, true); Rr.beats.forEach((b) => assert.ok(b.launch - b.t0 <= 400, "reduced motion: a cut, then the launch"));
    const big = []; for (let i = 0; i < 8; i++) for (let k = 0; k < 14; k++) big.push({ a: "@d" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 5000, y: 0 }, dist: 5000 }); const Rb = Wd.art.bBeats(big, 0, false); assert.ok(Rb.total <= 40000, `eight long-arc volleys still inside 40 s: ${Rb.total}`); }
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
  assert.ok(CITY_JS.includes("if(!BON)drawWalks()"), "no people on foot in the Battle view");
  assert.ok(CITY_JS.includes("if(t.t==='h'&&!BON)") && CITY_JS.includes("if(cd===4){if(!BON)"), "no little houses in the Battle view");
  assert.ok(CITY_JS.includes("hc===0&&!BON") && CITY_JS.includes("!gWin()&&!BON") && CITY_JS.includes("if(!BON)for(var k=0;k<7;k++)") && CITY_JS.includes("if(!BON)drawFx()"), "no growth crews, parades or effects walkers in the Battle view");
  assert.ok(CITY_JS.includes("bBld(t,i,j)") && CITY_JS.includes("ruinHi(c,p.x,top") && CITY_JS.includes("cranes.push({x:p.x+4,y:top,seed:seed,col:col})"), "hit towers lose floors, show a ruin and get a crane");
  new Function(CITY_JS);
});
