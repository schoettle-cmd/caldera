import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, CITY_CSS, HIFI_JS, BATTLE_DRAW_JS, STREET_JS } from "./city.build.mjs";

// a 2D context that accepts every call and refuses non-finite geometry
function stubCtx() {
  const n = { ops: 0 }, grad = { addColorStop() {} }, target = { canvas: { width: 10, height: 10 } };
  return new Proxy(target, {
    get(t, k) { if (k === "__n") return n; if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return (...a) => { for (const v of a) if (!Number.isFinite(v)) throw new Error(`non-finite gradient arg in ${String(k)}`); return grad; };
      if (k === "measureText") return () => ({ width: 10 });
      return (...a) => { n.ops++; if (k === "fillText") n.text = (n.text || 0) + 1; for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`non-finite arg to ${String(k)}`); }; },
    set(t, k, v) { t[k] = v; return true } });
}
const PAL = { day: { light: 1, lamp: 0, lit: .45, glass: ["#C9E3F6", "#6D9FCF"], ao: "rgba(20,30,50,.28)" }, night: { light: .5, lamp: 1, lit: 1, glass: ["#1E2C4A", "#101828"], ao: "rgba(0,0,0,.4)" } };
const at = (h, m = 0, s = 0) => { const d = new Date(); d.setHours(h, m, s, 0); return d.getTime(); };
/** a world with two cities in the battles, each with two repo towers; @a fires six shots at @b's towers, @b two back; the
 *  hub resolved the night at 02:00 today. clock.t is the wall clock, clock.p the performance clock (for replays). */
function world(sky, clock, data, reduce = false, store = memStore(), b2h = 30) {
  const pre = `var TW=64,TH=32,P=PAL.${sky},sky='${sky}',night=${sky === "night"},T=1234,reduce=${reduce},FITZ=.5,maxH=60,cam={x:300,y:200,z:1},dpr=2,vw=900,vh=600,palKey='${sky}',W=24,H=24,dirty=false,draws=0,cranes=[];
    var Date=FakeDate,performance={now:function(){return CLOCK.p}};function draw(){draws++;dirty=true}function e(s){return String(s)}var window={CALDERA_BATTLE:DATA,matchMedia:null,localStorage:STORE};
    function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function hex(c){return '#'+c.map(function(v){v=Math.max(0,Math.min(255,Math.round(v)));return (v<16?'0':'')+v.toString(16)}).join('')}
    function mix(h,f,t){var c=rgb(h);if(t){var q=rgb(t);return hex(c.map(function(v,i){return v+(q[i]-v)*f}))}return hex(c.map(function(v){return f>=1?v+(255-v)*(f-1):v*f}))}
    function poly(c,p,f){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(var k=1;k<p.length;k++)c.lineTo(p[k][0],p[k][1]);c.closePath();if(f){c.fillStyle=f;c.fill()}}
    function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}function water(){return false}var document={createElement:function(){return {width:0,height:0,getContext:function(){return mk()}}}};
    function gXY(i){var r=Math.floor(Math.sqrt(i)),o=i-r*r;return o<r?[r,o]:o===r?[r,r]:[o-r-1,r]}
    var DA={name:'a-d',repos:[]},DB={name:'b-d',repos:[]},RA1={name:'a1',commits:40},RA2={name:'a2',commits:20},RB1={name:'b1',commits:${Math.max(60, b2h * 2)}},RB2={name:'b2',commits:${b2h}};
    var GM={'@a':{b:{x:2,y:2,k:5},cs:{side:3,codes:[5,5,5,6,5,5,5,5,5]},lang:'#3178C6',n:{ds:[DA]}},'@b':{b:{x:12,y:2,k:5},cs:{side:3,codes:[5,5,6,5,5,5,5,5,5]},lang:'#E85D75',n:{ds:[DB]}},'@c':{cs:{side:1,codes:[5]},lang:'#888888',n:{ds:[]}}};
    var tiles={};for(var j=0;j<=H;j++)for(var i=0;i<=W;i++)tiles[i+','+j]={t:'g'};tiles['2,9']={t:'b',d:DA,r:RA1};tiles['4,9']={t:'b',d:DA,r:RA2};tiles['12,9']={t:'b',d:DB,r:RB1};tiles['14,9']={t:'b',d:DB,r:RB2};
    function bh(r){return r.commits}function gState(g){return g.cs}function gLang(g){return g.lang}var cx=mk();var PURE=false;`;
  const F = class extends Date { static now() { return clock.t; } };
  return new Function("PAL", "mk", "DATA", "FakeDate", "CLOCK", "STORE", pre + HIFI_JS + STREET_JS + BATTLE_DRAW_JS + `; return {api:window.CALDERA_BATTLE_API,stateLoad:bStateLoad,sync:function(){bStateSync(bPlan(Date.now()),Date.now())},rebOf:bRebuildOf,over:battleOver,plan:function(){return bPlan(Date.now())},S:bS,now:bNow,dmg:function(i,j){return bBld(null,i,j)},reb:bRebuild,draws:function(){return draws},bp:function(){return BP.length},vox:function(){return BP.filter(function(p){return p.k==='vox'}).length},voxDown:function(){return BP.filter(function(p){return p.k==='vox'&&p.down}).length},cranes:cranes,bcam:bCam,camera:cam,rep:function(){return BREP},ribbons:function(){return BTR.length},dbg:function(){return {H:JSON.stringify(Object.keys(BHITB).map(function(k){return [k,Object.keys(BHITB[k])]})),B:Object.keys(BBAT).join(' '),sh:BPLAN.shots.map(function(s){return [s.a,s.d,s.lot,s.f,!!s.b,s.b&&s.b.idx,bImpactAt(bS(),s)-bS().salvo]}),S:[bS().salvo,bS().hold,bS().end,bNow()]}},
    art:{bBlK:bBlK,bBlast:bBlast,bMissileFly:bMissileFly,bBigFx:bBigFx,spScorch:spScorch,spPuff:spPuff,setZ:function(z){cam.z=z},pool:function(){return BP},padHi:padHi,stackHi:stackHi,chuteHi:chuteHi,chuteDownHi:chuteDownHi,launcherHi:launcherHi,badgeHi:badgeHi,countdownHi:countdownHi,missileHi:missileHi,ruinHi:ruinHi,bTraj:bTraj,bImpactFx:bImpactFx,bStep:bStep,bDrawParticles:bDrawParticles,bLaunchFx:bLaunchFx,bShieldFx:bShieldFx,bLandFx:bLandFx,bSchedule:bSchedule,bSegment:bSegment,bSlot:bSlot,bBeats:bBeats,bDrawCollapse:bDrawCollapse,bRubblePiles:bRubblePiles,collapses:function(){return BCOL.length},bld:function(){return BBLD},bRepCam:bRepCam,bPadZoom:bPadZoom,bWideFrame:bWideFrame,bRibbonFill:bRibbonFill,bDrawRibbons:bDrawRibbons,bLaunchFxBig:bLaunchFxBig,BRT:BRT,BSPEEDS:BSPEEDS,bSpeedOf:bSpeedOf,bSpeedNext:bSpeedNext,bRealMs:bRealMs,bVirt:bVirt,bClampZoom:bClampZoom,bClampCam:bClampCam,bMapBounds:bMapBounds,bFitCam:bFitCam,bCamLim:bCamLim,bHitsNow:bHitsNow,bHitLabels:bHitLabels,bRepFlight:bRepFlight,bPadFrame:bPadFrame,bHitFrame:bHitFrame,bHitK:bHitK,bSettleAt:bSettleAt,bFlying:bFlying,bTwoFrame:bTwoFrame,fx:function(){return BFXT},userCam:bUserCam,bVis:bVis,bFallOf:bFallOf,bFallFrame:bFallFrame,bRaze:bRaze,bRazeLot:bRazeLot,bHitsOn:bHitsOn,under:battleUnder,bBigFx:bBigFx,bNukeFx:bNukeFx,bRezFx:bRezFx,bRezHeap:bRezHeap,bFleetHi:bFleetHi,bShakeAt:bShakeAt,BFL:BFL,bCardState:bCardState,bCardRanks:bCardRanks,bCardSpeed:bCardSpeed,bCardPlan:bCardPlan,bCardStandOf:bCardStandOf,bCardModel:bCardModel,bCardTimes:bCardTimes,bCardAt:bCardAt,bCardClear:bCardClear,bFlyModel:bFlyModel,bcRank:bcRank,bCardLive:bCardLive,bcCityLine:bcCityLine,bCardHTML:bCardHTML,bFlyHTML:bFlyHTML,bcMoney:bcMoney,bCardPick:bCardPick,bUsd:bUsd,bImpactOf:bImpactOf,lb:{model:bLbModel,tally:bLbTally,html:bLbHTML,buttons:bLbButtons,draw:bLbDraw,XL:BLXL,file:bLbFile,h:bLbH,css:BLCSS,canSave:bCardCanSave,N:BLN},BVMIN:BVMIN,BDES:BDES,pool:function(){return BP}},setLOD:function(v){LODN=v},card:battleCard,pu:{isTap:puIsTap,pool:function(){return PUP},plume:puPlume,crane:puCrane,target:puTarget,draw:puDraw,max:puMax,setVw:function(v){vw=v}},setPure:function(v){PURE=!!v},text:function(){var n=cx.__n.text||0;cx.__n.text=0;return n}}`)(PAL, stubCtx, data, F, clock, store);
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

test("cinematic replay: one strike beat per city, most missiles first, raiders from the sea last; each beat under 14.5 s (Mike 11-20: slower; + the 2 s strike card), 20 to 120 s in all; the camera eases to a two-shot of pad and target, keeps the missile in frame into the hit, then the wide shot, the cranes, and the map is handed back", () => {
  const clock = { t: at(16), p: 10000 }, d = data(); d.shots.push(["~raiders", "@a", "cannon", 1, at(2, 9), 0, 0, 0]);
  const Wd = world("day", clock, d); Wd.api.view(true); Wd.over(); const home = { x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z };
  assert.equal(Wd.api.replay(), 9); const R = Wd.rep().R, S = Wd.S(); assert.equal(S.live, false);
  assert.deepEqual(R.beats.map((b) => b.a), ["@a", "@b", "~raiders"], "most missiles first, raiders last"); assert.deepEqual(R.beats.map((b) => b.n), [6, 2, 1]);
  R.beats.forEach((b, i) => { assert.ok(b.end - b.t0 <= (i ? 14500 : 15375), `beat ${i} under 14.5 s: 12.5 s + the 2 s strike card (the first has the fly-in from the wide shot)`); assert.ok(b.launch > b.t0 && b.launch - b.t0 <= (i ? 2300 : 3175) + 1e-6, `beat ${i}: launch-t0 ${b.launch - b.t0}`); b.shots.forEach((s) => { assert.ok(s.rf >= b.launch && s.ri <= b.end, "every missile of the beat lands inside it"); }); if (i) assert.equal(b.t0, R.beats[i - 1].end, "beats run back to back"); });
  assert.ok(R.total >= 20000 && R.total <= 120000, `total ${R.total}`); assert.equal(S.end + 1600, R.total, "the tail is the flight home");
  // the camera: pre-roll at home, the pad filling the view at launch, following the lead missile, the hit, then the wide shot
  const b1 = R.beats[0], lead = b1.lead, at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); return Wd.api.phase(); };
  at0(100); assert.deepEqual([Wd.camera.x, Wd.camera.z], [home.x, home.z], "pre-roll: the camera has not moved");
  let ph = at0(b1.launch); const two = Wd.art.bTwoFrame(b1, 900, 600); assert.ok(Math.abs(Wd.camera.z - two.z) < 1e-6, "the two-shot: pad and target in one frame"); assert.ok(two.z <= Wd.art.bPadZoom(900) * .7 + 1e-9); assert.ok(Math.abs(Wd.camera.x - (450 - two.x * two.z)) < 1, "centred between pad and target"); assert.equal(ph.beat, 1); assert.equal(ph.beats, 3); assert.equal(ph.stage, "beat"); assert.equal(ph.label, "@a \u2192 @b \u00b7 6 missiles", "attacker, target, count"); assert.ok(R.beats.every((b) => b.shots.every((s) => s.a !== s.d)), "no self-hits"); assert.ok(R.beats.every((b) => b.lead.f > 0 && b.lead.b), "the camera follows a missile that lands");
  const mid = at0(lead.rf + lead.fl / 2); const cx1 = (450 - Wd.camera.x) / Wd.camera.z; assert.ok(Math.abs(cx1 - (lead.from.x + lead.to.x) / 2) < Math.abs(lead.to.x - lead.from.x) * .35, "mid-flight the camera is between pad and target, with the missile"); assert.ok(Wd.camera.z < 2.6, "zoomed out a little on the way");
  at0(b1.end - 100); assert.ok(Math.abs((450 - Wd.camera.x) / Wd.camera.z - lead.to.x) < 1, "holding on the hit"); assert.equal(Wd.dmg(12, 9), 1, "the tower is hit"); assert.ok(Wd.ribbons() >= 6, "a smoke ribbon per missile");
  ph = at0(R.beats[1].t0 + 50); assert.equal(ph.beat, 2); assert.ok(ph.label.startsWith("@b \u2192 @a"));
  ph = at0(R.beats[2].launch); assert.equal(ph.label, "Raiders \u2192 @a \u00b7 1 missile"); assert.ok(R.beats[2].lead.pad === R.beats[2].lead.from && R.beats[2].lead.from.y < R.beats[2].lead.to.y - 100, "raiders launch from the sea point, not a pad");
  ph = at0(S.wide + 3000); assert.equal(ph.stage, "wide"); assert.equal(Wd.camera.z, Wd.art.bWideFrame(R.shots, 900, 600).z, "the wide shot"); assert.equal(Wd.dmg(12, 9), 1, "every hit still showing"); assert.ok(Wd.ribbons() >= 9, "every ribbon kept");
  ph = at0(S.hold + (S.end - S.hold) / 2); assert.equal(ph.stage, "rebuild"); assert.ok(Wd.reb() > .45 && Wd.reb() < .55, "cranes half way"); assert.equal(ph.seg, "rebuild");
  // LEADERBOARD.md (Mike 11-21): at the end the clock holds at S.end and the results board goes up in place of an exit; Exit ends it
  ph = at0(S.end + 10); assert.equal(ph.replay, true, "the replay holds at its end"); assert.equal(ph.board, true, "the board is up"); assert.equal(ph.stage, "done"); assert.equal(ph.t, S.end, "the clock stands at S.end");
  clock.p += 5000; Wd.over(); assert.equal(Wd.api.phase().t, S.end, "no timer: it stays until the viewer picks a button"); assert.ok(Wd.api.board(), "board()"); assert.equal(Wd.dmg(12, 9), 0, "the map stands whole behind it");
  assert.equal(Wd.api.boardAct("exit"), true); ph = Wd.api.phase(); assert.equal(ph.replay, false, "Exit ends the replay"); assert.equal(Wd.api.board(), null); assert.equal(Wd.dmg(12, 9), 0, "back to the original state"); assert.equal(Wd.ribbons(), 0); assert.equal(ph.seg, "loading", "the live afternoon again");
  Wd.api.replay(); Wd.api.stop(); assert.equal(Wd.api.phase().replay, false);
});

test("cinematic replay: beats from 1 to 8 cities, at most 6 full strikes (the rest one montage), each under 14.5 s with its strike card, the whole replay inside 20 to 120 s; skip, pause and the demo", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); Wd.api.view(true);
  for (let n = 1; n <= 8; n++) { const shots = []; for (let i = 0; i < n; i++) for (let k = 0; k <= i; k++) shots.push({ a: "@c" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 300 + i * 40, y: -60 }, dist: 300 + i * 40 });
    const R = Wd.art.bBeats(shots, 0, false); assert.equal(R.beats.length, Math.min(n, 6) + (n > 6 ? 1 : 0)); const full = R.beats.filter((b) => !b.montage); assert.deepEqual(full.map((b) => b.n), full.map((b) => b.n).slice().sort((p, q) => q - p), "descending by missiles");
    if (n > 6) { const M = R.beats[6]; assert.equal(M.montage, true); assert.equal(M.n, shots.length - full.reduce((a, b) => a + b.n, 0), "the montage carries every other strike"); assert.ok(M.end - M.t0 <= 9000, "montage about 6 s, + the 2 s strike card"); }
    full.forEach((b) => assert.ok(b.end - b.t0 <= (b.i ? 14500 : 15375) && b.end - b.t0 > 9000, `beat ${b.i} of ${n}: ${b.end - b.t0}`)); assert.ok(R.total >= 20000 && R.total <= 120000, `${n} beats: ${R.total} ms`);
    const Rr = Wd.art.bBeats(shots, 0, true); Rr.beats.forEach((b) => assert.ok(b.launch - b.t0 <= 400, "reduced motion: a cut, then the launch"));
    const big = []; for (let i = 0; i < 8; i++) for (let k = 0; k < 14; k++) big.push({ a: "@d" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 5000, y: 0 }, dist: 5000 }); const Rb = Wd.art.bBeats(big, 0, false); assert.ok(Rb.total <= 120000, `eight long-arc volleys still inside 120 s: ${Rb.total}`); }
  // skip: a tap jumps to the next beat and fills in the ribbons of the flights it skipped; pause freezes the virtual clock
  const clock = { t: at(16), p: 10000 }, W2 = world("day", clock, data()); W2.api.view(true); W2.over(); W2.api.replay(); const R = W2.rep().R;
  clock.p = 10000 + R.beats[0].launch + 200; W2.bcam(); W2.over(); assert.equal(W2.api.phase().beat, 1);
  assert.equal(W2.api.skip(), true); let ph = W2.api.phase(); assert.equal(ph.beat, 2); assert.ok(Math.abs(ph.t - R.beats[1].t0) < 1, "at the start of beat 2"); assert.ok(W2.ribbons() >= 6, "the skipped flights left their ribbons"); assert.equal(W2.dmg(12, 9), 1, "and their hits");
  assert.equal(W2.api.pause(), true); const t1 = W2.api.phase().t; clock.p += 3000; W2.bcam(); W2.over(); assert.equal(W2.api.phase().t, t1, "paused: the clock stands still"); assert.equal(W2.api.phase().paused, true);
  assert.equal(W2.api.pause(), false); clock.p += 500; assert.ok(Math.abs(W2.api.phase().t - (t1 + 500)) < 1, "resumed where it was");
  W2.api.skip(); ph = W2.api.phase(); assert.equal(ph.stage, "fall", "after the last strike: the fall"); assert.equal(ph.label, "@b falls", "the city that took the most falls"); assert.equal(ph.seg, "damage");
  W2.api.skip(); assert.equal(W2.api.phase().stage, "wide"); W2.api.skip(); assert.equal(W2.api.phase().stage, "rebuild"); W2.api.skip(); clock.p += 1; W2.bcam(); W2.over(); assert.equal(W2.api.phase().board, true, "skipping the cranes goes to the results board"); W2.api.boardAct("exit"); assert.equal(W2.api.phase().replay, false, "and Exit ends the replay");
  // the demo: a sample battle between the biggest cities on the map, raiders last, labelled demo; the live plan is untouched
  assert.equal(W2.api.replay("demo"), 11); ph = W2.api.phase(); assert.equal(ph.demo, true); assert.equal(ph.beats, 3); assert.deepEqual(W2.rep().R.beats.map((b) => b.a), ["@a", "@b", "~raiders"]); assert.equal(W2.rep().R.beats[0].n, 5);
  W2.api.stop(); assert.equal(W2.plan().n, 8, "today's plan is still today's"); assert.equal(W2.api.phase().demo, undefined);
  W2.api.replay(); W2.api.seek(R.beats[1].launch + 100); assert.equal(W2.api.phase().beat, 2, "seek lands in beat 2"); W2.api.seek(200); assert.equal(W2.api.phase().stage, "pre", "and back"); assert.equal(W2.ribbons() === 0 || W2.rep().P.shots.every((s) => !s.tr || !s.tr.pts.length), true, "seeking back clears the ribbons ahead"); W2.api.stop();
  const c = stubCtx(); W2.api.replay(); clock.p += R.beats[0].launch + 600; W2.bcam(); W2.over(); clock.p += 120; W2.over(); W2.art.bDrawRibbons(c, W2.now()); W2.art.bLaunchFxBig(0, 0, -1); assert.ok(c.__n.ops > 4, "ribbons stroke");
});

test("replay pace (Mike 11-20, map-audit item 1): flights 4.2 to 6.5 s, hits 350 ms apart, an 1.8 s hold on each hit; the clock runs at 0.5x, 1x or 2x and never jumps when the speed changes", () => {
  const W0 = world("day", { t: at(16), p: 1 }, data()); W0.api.view(true); const A = W0.art;
  // the speed math: only 0.5, 1 and 2 exist (anything else is 1x), the control cycles through them, timings scale per speed
  assert.deepEqual(A.BSPEEDS, [0.5, 1, 2]); assert.deepEqual([0.5, 1, 2, 3, 0, -1, "2", "x", null, NaN].map(A.bSpeedOf), [0.5, 1, 2, 1, 1, 1, 2, 1, 1, 1]);
  assert.deepEqual([0.5, 1, 2, 2].map(A.bSpeedNext), [1, 2, 0.5, 0.5], "0.5x -> 1x -> 2x -> 0.5x");
  assert.equal(A.bRealMs(4000, 1), 4000); assert.equal(A.bRealMs(4000, 2), 2000, "twice as fast: half the time"); assert.equal(A.bRealMs(4000, 0.5), 8000, "half speed: twice the time"); assert.equal(A.bRealMs(4000, 7), 4000, "a bad speed is 1x");
  assert.equal(A.bVirt(1000, 50, 1, 150), 1100); assert.equal(A.bVirt(1000, 50, 2, 150), 1200); assert.equal(A.bVirt(1000, 50, 0.5, 150), 1050);
  // the pace itself: a flight is 4.2 + 1.5 ms per px, capped at 6.5 s; the hold on a hit 1.8 s; establish 1.6 s + ready 0.7 s
  for (const d of [100, 300, 800, 2000]) assert.equal(A.bRepFlight(d), 4200 + Math.min(2300, d * 1.5), `flight at ${d} px`);
  assert.equal(A.BRT.flMin, 4200); assert.equal(A.BRT.flCap, 6500); assert.equal(A.BRT.hold, 1800); assert.equal(A.BRT.step, 350);
  assert.equal(A.BRT.approach, 1600 + 700); assert.equal(A.BRT.establish, 1600); assert.equal(A.BRT.beatMax, 12500); assert.equal(A.BRT.pre, 1200); assert.equal(A.BRT.maxBeats, 6);
  const shots = []; for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) shots.push({ a: "@c" + i, d: "@x", from: { x: 0, y: 0 }, to: { x: 300 + 90 * i, y: -60 }, dist: 300 + 90 * i });
  const R = A.bBeats(shots, 0, false); R.beats.forEach((b) => { b.shots.forEach((q) => { assert.ok(q.rf >= b.launch, "launch"); assert.ok(q.ri - q.rf >= 4200 && q.ri - q.rf <= 6500, "flight"); assert.ok(q.ri <= b.end, "hit"); }); assert.ok(Math.abs(b.end - b.hit - A.BRT.hold - A.BRT.card) < 1e-6, "the camera holds on the last hit for the hold and the strike card, then moves on"); assert.equal(b.c0, b.hit + A.BRT.hold - 500, "the card comes in during the last 500 ms of the hold"); });
  assert.equal(R.beats[0].shots[1].rf - R.beats[0].shots[0].rf, 350, "launches are 350 ms apart, one after another");
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

test("strike card (STRIKECARD.md, Mike and Orion 11-20): a card after every beat, the fall and the last card; state, numbers, ranks, the 2 s hold and its 1.2 s floor at 2x", () => {
  const clock = { t: at(16), p: 10000 }, d = data(); d.shots.push(["~raiders", "@a", "cannon", 1, at(2, 9), 0, 0, 0]);
  const Wd = world("day", clock, d); Wd.api.view(true); Wd.over(); const A = Wd.art;
  // the pure parts: which card, how much of a city stands, the running top three, the hold's floor
  const st = (o) => A.bCardState(Object.assign({ montage: false, targets: 1, n: 3, blocked: 0, dmg: 1e6, after: .5, p: 25 }, o));
  assert.equal(st({}), "hit"); assert.equal(st({ p: 0 }), "small", "damage that rounds to 0%"); assert.equal(st({ p: null }), "small", "a city with no towers"); assert.equal(st({ after: 0, p: 50 }), "fall");
  assert.equal(st({ blocked: 3, dmg: 0 }), "shield", "every missile blocked"); assert.equal(st({ dmg: 0, p: 0 }), "miss"); assert.equal(st({ targets: 3 }), "multi"); assert.equal(st({ montage: true, targets: 3 }), "montage");
  const blds = [{ idx: 0, h: 30 }, { idx: 1, h: 10 }], hits = { 0: [{ v: .5, t: 5 }], 1: [{ v: 2, t: 9 }] }, imp = (q) => q.t;
  assert.equal(A.bCardStandOf(blds, hits, imp, 1), 1); assert.equal(A.bCardStandOf(blds, hits, imp, 6), .625, "by tower height"); assert.equal(A.bCardStandOf(blds, hits, imp, 10), .375, "a tower never loses more than all of it"); assert.equal(A.bCardStandOf([], hits, imp, 10), null);
  const rb = [{ shots: [{ a: "@x", f: 1, usd: 5 }] }, { shots: [{ a: "@y", f: 1, usd: 5 }, { a: "@w", f: 1, blocked: 1, usd: 99 }] }, { shots: [{ a: "@z", f: 1, usd: 9 }, { a: "@x", f: 0, usd: 3 }] }];
  assert.deepEqual(A.bCardRanks(rb, 1).map((r) => r.a), ["@x", "@y"], "a tie goes to the earlier beat; blocked dollars do not count"); assert.deepEqual(A.bCardRanks(rb, 2).map((r) => [r.a, r.usd]), [["@z", 9], ["@x", 5], ["@y", 5]]);
  assert.deepEqual(A.bCardTimes("beat", false), { i: 500, h: 2000, o: 200, len: 2700 }); assert.deepEqual(A.bCardTimes("last", false), { i: 500, h: 3000, o: 200, len: 3700 }); assert.deepEqual(A.bCardTimes("beat", true), { i: 150, h: 2600, o: 150, len: 2900 }, "reduced motion: fade, 2.6 s, fade");
  const T = A.bCardTimes("beat", false); assert.equal(A.bCardSpeed(1, T), 1); assert.equal(A.bCardSpeed(.5, T), .5, "4 s at 0.5x"); assert.ok(Math.abs(T.h / A.bCardSpeed(2, T) - 1200) < 1e-6, "at 2x the hold is 1.2 s of real time, not 1 s");
  // the replay: a card per beat, then the fall, then the last card in the wide shot
  Wd.api.replay(); const R = Wd.rep().R, S = Wd.S(), cards = Wd.api.cards(); assert.deepEqual(cards.map((c) => c.k), ["beat", "beat", "beat", "fall", "last"]);
  R.beats.forEach((b, i) => { assert.equal(cards[i].c0, b.c0); assert.equal(b.c0 + 500 + 2000, b.end, "the card holds 2 s, then the camera moves on"); });
  assert.equal(cards[3].c0 + cards[3].len, S.wide, "the fall's card leaves as the wide shot starts"); assert.equal(cards[4].c0, S.wide); assert.ok(cards[4].c0 + cards[4].len <= S.hold, "the last card fits the wide shot");
  const go = (ms) => { Wd.api.seek(ms); Wd.bcam(); Wd.over(); return Wd.api.card(); };
  const k0 = cards[0]; assert.equal(go(R.beats[0].launch - 10), null, "nothing before the launch"); assert.equal(go(k0.f0 + 10).kind, "fly", "BATTLE.md U5: the fly line from the launch"); assert.equal(go(k0.s0 - 10).kind, "fly", "to the first impact");
  assert.equal(go(k0.s0 + 10).kind, "beat", "U4: the callout mounts at the first impact"); assert.ok(k0.s0 < k0.settle || k0.s0 === k0.settle); assert.ok(k0.s0 < k0.c0, "earlier than the 11-20 card"); assert.equal(k0.x1, k0.c0 + k0.len, "and leaves at the same time"); assert.equal(A.bCardClear(k0.s0 - 10), 1);
  let c = go(R.beats[0].c0 + 1500), m = c.m; assert.equal(c.kind, "beat"); assert.ok(["hit", "small", "fall"].includes(m.state), m.state); assert.equal(m.l1[0][0], "A"); assert.equal(m.l1[0][1], "atk");
  assert.deepEqual(m.facts[m.state === "small" ? 0 : 1].slice(0, 2), ["5 of 6", "missiles hit"], "the shot the shield held whole does not count");
  if (m.state === "hit") { assert.ok(m.facts[0][0].startsWith("−$"), "damage first"); assert.equal(m.big, m.p + "%"); assert.equal(m.bar[1] - m.bar[2], m.p, "the bar and the big number agree"); assert.deepEqual(m.tail.map((p) => p[0]).join(""), "OF B’S CITY"); }
  assert.deepEqual(m.lb[0].slice(0, 3), ["A", m.lb[0][1], "cur"]); assert.equal(m.lb[1], null, "empty ranks"); assert.equal(m.file, "caldera-a-vs-b-2026-11-07.png"); assert.equal(m.date, "NOV 7");
  assert.ok(/^A (destroys|hits B\u2019s city|finishes B\u2019s city) /.test(m.say), m.say); if (m.state === "fall") { assert.equal(m.big, "CITY DOWN"); assert.equal(m.bar[2], 0); }
  assert.equal(A.bCardClear(k0.s0 + 60), .5, "the hit labels clear in 120 ms"); assert.equal(A.bCardClear(k0.s0 + 200), 0);
  // the viewer's own city reads YOUR on screen; the picture never says you
  Wd.api.viewer("b"); c = go(R.beats[0].c0 + 1600); m = c.m; assert.ok(m.l1.concat(m.tail).some((p) => p[0] === "YOUR" && p[1] === "you") || m.bar[0] === "YOUR CITY", "YOUR on screen");
  const pic = A.bCardModel(Wd.rep().cards[0], { R, P: Wd.rep().P, S, V: null }); assert.ok(!JSON.stringify([pic.l1, pic.tail, pic.bar]).includes("YOU"), "a saved picture shows names"); Wd.api.viewer(null);
  // Next takes the card away at once and goes to the next beat
  go(R.beats[0].c0 + 1500); assert.ok(Wd.api.card()); Wd.api.skip(); assert.equal(Wd.api.card(), null); assert.equal(go(R.beats[0].end + 50), null, "no card in its exit after Next"); assert.equal(Wd.api.phase().beat, 2);
  // 2 cities at once, the raiders, the fall, the last card
  m = go(R.beats[1].c0 + 1500).m; assert.equal(m.state, "multi"); assert.equal(m.l1.map((p) => p[0]).join(""), "B HITS 2 CITIES"); assert.equal(m.rows.length, 2); assert.equal(m.lb[0][0], "A"); assert.equal(m.lb[1][0], "B"); assert.equal(m.lb[1][2], "cur");
  m = go(R.beats[2].c0 + 1500).m; assert.equal(m.l1[0][0], "SEA RAIDERS"); assert.equal(m.l1[0][1], "raid"); assert.equal(m.ac, "raid"); assert.ok(/^ (DESTROY|HIT|FINISH) ?$/.test(m.l1[1][0]), m.l1[1][0]);
  c = go(cards[3].c0 + 1500); assert.equal(c.kind, "fall"); assert.equal(c.m.d, Wd.rep().P.fall.key); assert.equal(c.m.big, Wd.rep().P.fall.key.charAt(0) === "@" ? "CITY DOWN" : "SUNK", "a city goes down, the raiders' fleet sinks"); assert.equal(c.m.tone, "red"); assert.equal(c.m.facts[2][0], "0%");
  c = go(S.wide + 1500); assert.equal(c.kind, "last"); assert.equal(c.m.l1[0][0], "TOP ATTACKER · NOV 7"); assert.equal(c.m.big, "A"); assert.deepEqual(c.m.facts.map((f) => f[1]), ["cities hit", "missiles hit", "damage in all"]); assert.equal(c.m.file, "caldera-battle-2026-11-07.png");
  assert.equal(go(S.hold + 100), null, "gone in the rebuild");
  // the floor: at 2x the clock runs at 1.67x while a card holds, so the hold takes 1.2 s; outside the hold, 2x again
  Wd.api.speed(2); go(R.beats[1].c0 + 600); const t0 = Wd.api.phase().t; clock.p += 600; assert.ok(Math.abs(Wd.api.phase().t - t0 - 1000) < 2, `${Wd.api.phase().t - t0}`);
  go(R.beats[2].t0 + 100); const t1 = Wd.api.phase().t; clock.p += 500; assert.ok(Math.abs(Wd.api.phase().t - t1 - 1000) < 2, "2x outside the card"); Wd.api.stop(); assert.equal(Wd.api.card(), null);
  // reduced motion: the card fades in over 150 ms and holds 2.6 s
  const Wr = world("day", { t: at(16), p: 1 }, data(), true); Wr.api.view(true); Wr.over(); Wr.api.replay(); Wr.rep().R.beats.forEach((b) => assert.equal(b.end - b.c0, 150 + 2600)); Wr.api.stop();
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
  at0(b1.launch); const padZ = Wd.camera.z, padX = Wd.camera.x; assert.ok(Math.abs(padZ - Wd.art.bTwoFrame(b1, 900, 600).z) < 1e-6);
  // the viewer pans: follow goes off, and the auto camera leaves the camera where the viewer put it, however long the replay runs
  Wd.camera.x += 321; Wd.camera.y -= 77; Wd.art.userCam(); assert.equal(Wd.api.phase().follow, false); const held = { x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z };
  for (const ms of [b1.launch + 500, b1.hit + 100, R.beats[1].launch, R.S.wide + 2000]) { at0(ms); assert.deepEqual({ x: Wd.camera.x, y: Wd.camera.y, z: Wd.camera.z }, held, `the auto camera stays off at ${Math.round(ms)}`); }
  assert.equal(Wd.api.phase().follow, false, "still off"); Wd.art.userCam(); assert.equal(Wd.api.phase().follow, false, "a second gesture is harmless");
  // Follow: on again, and the camera eases to where the auto camera is over 450 ms (it does not snap)
  at0(b1.launch + 200); Wd.api.follow(true); Wd.bcam(); assert.equal(Wd.api.phase().follow, true); assert.equal(Wd.api.camera().follow, true);
  const e0 = Wd.camera.x; assert.ok(Math.abs(e0 - held.x) < 1, "the first frame is where the viewer left it"); clock.p += 200; Wd.bcam(); const e1 = Wd.camera.x; clock.p += 400; Wd.bcam(); const e2 = Wd.camera.x; clock.p += 100; Wd.bcam(); const e3 = Wd.camera.x;
  assert.ok(e1 !== e0, "it moves"); assert.ok(Math.abs(e3 - e2) < Math.abs(e0 - e2) || e3 === e2, "and settles on the auto camera"); Wd.bcam(); assert.ok(Math.abs(Wd.camera.x - e3) < 400);
  // a real gesture in the renderer: pan, wheel and pinch all go through bUserCam; a tap during a replay does nothing (Mike 11-20)
  assert.ok(/if\(was&&BON&&BREP\)\{[^\n]*CALDERA_BATTLE_TAP[^\n]*\}return\}\n  if\(was&&!moved\)\{/.test(CITY_JS) && !/if\(was&&BON&&BREP\)\{[^\n]*bSkip/.test(CITY_JS), "a tap no longer skips"); assert.ok((CITY_JS.match(/bUserCam\(\)/g) || []).length >= 2);
  Wd.api.follow(false); assert.equal(Wd.api.phase().follow, false, "follow(false) takes the camera too"); Wd.api.stop(); assert.equal(Wd.api.follow(true), false, "no replay: nothing to follow"); assert.equal(Wd.api.camera().follow, false); Wd.art.userCam();
  // a new replay starts with the auto camera again
  Wd.api.replay(); assert.equal(Wd.api.phase().follow, true, "each replay starts following"); Wd.api.stop();
  // reduced motion: no easing, an instant cut per event
  const c2 = { t: at(16), p: 10000 }, Wr = world("day", c2, data(), true); Wr.api.view(true); Wr.over(); Wr.api.replay(); const Rr = Wr.rep().R, br = Rr.beats[0], step = (ms) => { c2.p = 10000 + ms; Wr.bcam(); Wr.over(); };
  const pad = Wr.art.bTwoFrame(br, 900, 600), hit = Wr.art.bHitK(br, 900, 600), px = 450 - pad.x * pad.z;
  for (const ms of [br.t0 + 10, br.launch, br.lead.rf + br.lead.fl * 0.2, br.lead.rf + br.lead.fl * 0.45]) { step(ms); assert.ok(Math.abs(Wr.camera.x - px) < 0.5 && Math.abs(Wr.camera.z - pad.z) < 1e-6, "reduced motion: the two-shot, no tween"); }
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
  assert.ok(Wd.vox() >= 40 && Wd.vox() <= 600, "the hit floors burst into voxels (11-14 spec: M 120 walked in, x.4 at street zoom): " + Wd.vox()); assert.ok(Wd.bp() > 70, "fireball, chunks, dust and voxels");
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
  assert.ok(/if\(was&&BON&&BREP\)\{[^\n]*CALDERA_BATTLE_TAP[^\n]*\}return\}\n  if\(was&&!moved\)\{/.test(CITY_JS) && !/if\(was&&BON&&BREP\)\{[^\n]*bSkip/.test(CITY_JS), "a tap on the map during a replay does nothing; Next or the right arrow skips");
  assert.ok(CITY_JS.includes("if(!BON){drawWalks();drawLife()}"), "no people on foot in the Battle view");
  assert.ok(CITY_JS.includes("if(t.t==='h'&&!BON)") && CITY_JS.includes("if(cd===4){if(!BON)"), "no little houses in the Battle view");
  assert.ok(CITY_JS.includes("hc===0&&!BON") && CITY_JS.includes("!gWin()&&!BON") && CITY_JS.includes("if(!BON)for(var k=0;k<7;k++)") && CITY_JS.includes("if(!BON)drawFx()"), "no growth crews, parades or effects walkers in the Battle view");
  assert.ok(CITY_JS.includes("litp*=Math.max(0,1-Math.max(bdh,rz)*.85)") && CITY_JS.includes("pxHeap(c,p.x,base,tiers[0][0],col,Math.max(bdh,rz),rb0,seed)"), "a hit tower goes dark and a heap of its own pixels piles up around it");
  assert.ok(CITY_JS.includes("bBld(t,i,j)") && CITY_JS.includes("dmg:bdm>0?{d:bdh,f:rb0,seed:seed,r:rz,n:nh}:null") && CITY_JS.includes("growUnder();if(typeof battleUnder==='function')battleUnder();") && CITY_JS.includes("cranes.push({x:p.x+4,y:top,seed:seed,col:col})"), "hit towers lose floors through the pixel mask and get a crane while the build line rises");
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
  assert.ok(Wd.dmg(12, 9) >= Math.ceil(4 / (.58 * 60) * 24) / 24, "11-14: a $18k shell hit (0.1% of the 60 px tower) still takes 4 px off it, the shell's minimum (more once the tactical missile's 2.2-tile blast reaches it): " + Wd.dmg(12, 9));
  assert.equal(Wd.dmg(14, 9), 1, "a rocket (8 px) and a tactical missile (14 px) take the 30 px b2 down to its stump: " + Wd.dmg(14, 9));
  assert.ok(Wd.card("@b").includes("$6.6M of damage"), Wd.card("@b")); assert.ok(Wd.card("@a").includes("up to cruise missiles"));
  // sizes draw differently: a shell has no motor flame, a cruise missile has wings (more path points)
  const ops = (sz) => { const c = stubCtx(); Wd.art.missileHi(c, 0, 0, 0, sz, "#3178C6", 1); return c.__n.ops; };
  assert.ok(ops(.75) < ops(.95) && ops(.95) < ops(1.4), "shell, rocket and cruise are three different drawings");
});

test("11-13: a hit tower burns: the fire adds damage as fi x (1 - e^(-t/1h)), flames die down, smoke thins, the cache redraws as it burns, and the morning only smoulders", () => {
  const clock = { t: at(20, 0, 10), p: 1000 }, Wd = world("night", clock, data13(), false, memStore(), 300); Wd.api.view(true); Wd.over();   // b2 300 px tall (b1 600, still the taller) so the blasts (11-14 minimums: rocket 10%, tactical 22% of the height) leave room for the fire
  const a0 = Wd.dmg(14, 9); clock.t = at(21, 30); const d0 = Wd.draws(); Wd.over(); const a1 = Wd.dmg(14, 9);
  assert.ok(a1 > a0, `the fire keeps eating the tower: ${a0} -> ${a1}`); assert.ok(Wd.draws() > d0, "the burn redraws the buildings");
  const vr = 30 / (.58 * 300), vt = 66 / (.58 * 300), want = vr + .0006 * (1 - Math.exp(-1.5)) + vt + .16 * (1 - Math.exp(-1.5)); assert.ok(Math.abs(a1 - Math.ceil(want * 24) / 24) < 1e-9, "blast + fire so far, in 24ths: " + a1);
  clock.t = at(23, 59); Wd.over(); assert.ok(Math.abs(Wd.dmg(14, 9) - Math.ceil((vr + vt + .1606 * (1 - Math.exp(-4))) * 24) / 24) < 1e-9, "burnt out by midnight: about 98% of the fire damage is in");
  // the plume and the flames are drawn while it burns; in the morning (cranes at work) smoke only, then nothing
  const rep = world("night", { t: at(16), p: 10000 }, data13()); rep.api.view(true); rep.over(); assert.equal(rep.api.replay(), 4);
  const R = rep.rep().R, tac = rep.rep().P.shots.find((s) => s.w === "tactical"); assert.equal(tac.burn, 1); assert.equal(rep.rep().P.shots[0].burn, .45, "a contained fire burns smaller");
  const h = rep.api.phase(); assert.ok(h.replay);
  const lab = rep.art.bHitsNow(rep.rep().P, R.S, tac.ri + 100).find((o) => o.s === tac); assert.ok(lab && lab.hit && lab.t1 > lab.t0);
  const held = rep.rep().P.shots[3], l2 = rep.art.bHitsNow(rep.rep().P, R.S, held.ri + 100).find((o) => o.s === held); assert.ok(l2 && !l2.hit, "the shielded cruise missile reads Shield held (and what it would have cost)");
  rep.api.stop();
});

test("11-13 pure city: while the replay plays (PURE) the battle layer draws no text: no pad counts, no dollar pills, no countdown; missiles, hits and fire still draw", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("night", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, hitShot = R.beats[0].lead;
  const step = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); };
  step(hitShot.ri + 100); Wd.text(); step(hitShot.ri + 150); assert.ok(Wd.text() > 0, "outside the pure city the pad counts and the dollar pill are words on the map");
  Wd.setPure(true); step(hitShot.ri + 200); assert.equal(Wd.text(), 0, "the pure city: no text at all on the canvas");
  assert.ok(Wd.api.phase().hit, "the replay itself carries on (the control bar still reads the last hit)");
  Wd.setPure(false); step(hitShot.ri + 250); assert.ok(Wd.text() > 0, "the words come back when the replay ends"); Wd.api.stop();
  // the live countdown before the salvo is a numeral on the map too
  const c2 = { t: at(19, 59, 58), p: 1000 }, Wc = world("night", c2, data()); Wc.api.view(true); Wc.over(); assert.equal(Wc.api.phase().seg, "countdown"); assert.ok(Wc.text() > 0, "the countdown draws");
  Wc.setPure(true); Wc.over(); assert.equal(Wc.text(), 0, "no countdown numeral or counts in the pure city");
});

test("11-13 pure city: city.ts keys one flag (PURE) on html.w-replay; labels, rays, store markers and agent pills read it; the saved Labels and Friendships choices are never written", () => {
  for (const s of ["var PURE=false;function LBL(){return labels&&!PURE}", "function drawRays(){if(!WORLD||!RAYS||PURE)return;", "c.clearRect(0,0,L3.width,L3.height);fleetVeil(c);if(!LBL()){WLAB=[];return}", "function fleetVeil(c){if(!FLEET||PURE||!WORLD)return;", "SIGNS=[];if(PURE)return;",
    "function pxPill(c,x,y,text,col){if(typeof PURE!=='undefined'&&PURE)return;", "function heliPill(t){if(!LBL()", "if(LBL()&&bf>=1&&!INTRO", "if(LBL()&&!INTRO){var fT=", "pureSync"])
    assert.ok(CITY_JS.includes(s), s);
  assert.ok(CITY_CSS.includes("html.w-replay .c-live,html.w-replay .c-today,html.w-replay .c-hint,html.w-replay .c-heli,html.w-replay .c-sfk{display:none!important}"), "the live panel, visit count, hint, helicopter line and store keys hide too");
  // the flag block on its own, with a stand-in document: the class decides, every change redraws once, nothing is stored
  const block = CITY_JS.slice(CITY_JS.indexOf("var PURE=false;"), CITY_JS.indexOf("pureSync();", CITY_JS.indexOf("var PURE=false;")) + "pureSync();".length);
  assert.ok(!/localStorage/.test(block), "the replay never touches the viewer's saved toggles");
  const cls = new Set(), obs = [], store = { w: 0 };
  const run = new Function("document", "MutationObserver", "labels", "draw", block + ";return {pure:function(){return PURE},lbl:LBL,sync:pureSync,set:function(v){labels=v}}");
  let draws = 0; const doc = { documentElement: { classList: { contains: (c) => cls.has(c) } } };
  const W = run(doc, class { constructor(f) { obs.push(f) } observe(el, o) { assert.deepEqual(o.attributeFilter, ["class"]) } }, true, () => draws++);
  assert.equal(obs.length, 1, "watches the html class"); assert.equal(W.pure(), false); assert.equal(W.lbl(), true); assert.equal(draws, 0, "no redraw at start");
  cls.add("w-replay"); obs[0](); assert.equal(W.pure(), true); assert.equal(W.lbl(), false, "labels hidden while the replay plays"); assert.equal(draws, 1);
  obs[0](); assert.equal(draws, 1, "an unrelated class change does not redraw");
  cls.delete("w-replay"); obs[0](); assert.equal(W.lbl(), true, "labels back after the replay, as the viewer left them"); assert.equal(draws, 2);
  W.set(false); assert.equal(W.lbl(), false, "Labels off stays off"); assert.equal(store.w, 0);
  // no MutationObserver (old browsers, the Obsidian test harness): still loads
  assert.doesNotThrow(() => run(doc, undefined, true, () => {}));
});

// ---------------------------------------------------------------- 11-15: a shield cuts a hit, it never cancels it (Mike 11-14)
/** @a fires at @b, a beginner (99% dome): a cruise missile on the roof, a rocket into the street, a shell; the hub's x carries
 *  the share the shield took (sh), what the shot would have done (pot) and what the shield held (held); one shot on an open city */
const data15 = () => ({ at: "x", night: "2026-11-15", t0: at(2), next: at(2) + 864e5, members: { "@a": { sh: .56, beg: 0, ammo: 70, best: "cruise", shots: 3, hits: [], reb: 100 }, "@b": { sh: .99, beg: 1, ammo: 0, best: "shell", shots: 1, hits: [], reb: 100 } },
  shots: [["@a", "@b", "cruise", .01, at(2, 1), 0, 0, 0, X({ u: 180000, fi: .004, fu: 72000, sp: 1, sh: .99, pot: 18e6, held: 17.82e6, raw: 1 })], ["@a", "@b", "rocket", .0004, at(2, 2), 1, 0, 0, X({ u: 7200, fi: .00006, fu: 1080, m: 22, sh: .99, pot: 720000, held: 712800 })],
    ["@a", "@b", "shell", .00001, at(2, 3), 1, 0, 0, X({ u: 180, fi: .000002, fu: 36, sh: .99, pot: 18000, held: 17820 })], ["@b", "@a", "rocket", .02, at(2, 4), 0, 0, 0, X({ u: 360000, fi: .003, fu: 54000, sp: 1, sh: 0 })]], prev: null });

test("11-15: every shielded shot lands: a step off its tower, a dome flash then a smaller impact, fire and smoke scaled to what got through; the replay bar reads the shield's cut; the pure city stays pure", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data15()); Wd.api.view(true); const P = Wd.plan();
  assert.equal(P.n, 4); assert.ok(P.shots.every((s) => s.f > 0 && s.b && s.usd > 0), "every missile lands on a building and costs dollars");
  const [cr, rk, sl, open] = P.shots;
  assert.ok(Math.abs(cr.cut - (.4 + .6 * Math.sqrt(.01))) < 1e-9 && open.cut === 1, "through the 99% dome a hit looks about half size; an open hit full size");
  assert.ok(cr.burn > 0 && cr.burn < open.burn && Math.abs(cr.burn - cr.cut) < 1e-9, "a spreading fire through the dome burns smaller than one on an open city");
  assert.ok(rk.to.miss, "a shielded near miss still comes down in the street beside the tower");
  clock.t = at(20, 0, 10); Wd.over();
  assert.ok(Wd.dmg(12, 9) >= 1 / 24, "the dome-cut cruise hit takes a visible step off b1"); assert.ok(Wd.dmg(14, 9) >= 1 / 24, "so does a $180 shell through the dome");
  // the replay: the bar reads the cut, never 'shield held'
  Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, step = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); };
  const lead = R.beats.find((b) => b.a === "@a").lead; step(lead.ri - 50); const p0 = Wd.bp(); step(lead.ri + 100);
  const h = Wd.api.phase().hit; assert.ok(h && h.d === "@b" && h.shield === false && h.sh === .99 && h.usd > 0, JSON.stringify(h));
  // the impact under the dome: a shield flash plus a smaller impact than the same weapon on an open city
  assert.ok(Wd.bp() > p0, "the dome flash and the impact emit particles: " + p0 + " -> " + Wd.bp());
  // the pure city: no words on the map while the replay plays
  Wd.setPure(true); Wd.text(); step(lead.ri + 200); assert.equal(Wd.text(), 0, "no text in the pure city"); Wd.setPure(false); Wd.api.stop();
});

// ---------------------------------------------------------------- 11-14: shrapnel, damage on every hit, desolation, the fall (Mike 11-14)
test("11-14: every hit takes at least its size's minimum off the tower; L and XL blasts break the buildings around them as the ring reaches them", () => {
  const Wd = world("day", { t: at(16), p: 1000 }, data13()); Wd.api.view(true); const P = Wd.plan(), A = Wd.art;
  [["shell", 4], ["rocket", 6], ["tactical", .22 * 60], ["cruise", .43 * 60]].forEach(([w, px]) => { const v = A.bVis({ b: { h: 60 }, w, f: .0001, cut: 1 }); assert.ok(Math.abs(v - px / (.58 * 60)) < 1e-9, `${w}: ${px} px of 60 (spec: max(px, % of the height))`); });
  assert.ok(Math.abs(A.bVis({ b: { h: 40 }, w: "shell", f: 0, cut: .1 }) - 3 / (.58 * 40)) < 1e-9, "through a 99% dome: never under 3 px");
  assert.ok(A.BVMIN.shell < A.BVMIN.rocket && A.BVMIN.rocket < A.BVMIN.tactical && A.BVMIN.tactical < A.BVMIN.cruise, "bigger sizes take more");
  assert.equal(A.bVis({ b: { h: 60 }, w: "cruise", f: .9, cut: 1 }), .9, "the physics wins when it did more");
  assert.ok(A.bVis({ b: { h: 60 }, w: "cruise", f: 0, cut: .46 }) < A.bVis({ b: { h: 60 }, w: "cruise", f: 0, cut: 1 }), "what a shield let through looks smaller");
  assert.ok(!Object.values(P.hit["@b"] || {}).flat().some((q) => q.blocked), "a shot the dome held whole breaks on the dome, not the tower");
  // collateral: an open cruise hit on b2 reaches b1 two lots away after the ring's travel time
  const d = data13(); d.shots = [["@a", "@b", "cruise", .3, at(2, 4), 1, 0, 0]]; const clock = { t: at(16), p: 1000 }, W2 = world("day", clock, d); W2.api.view(true); const P2 = W2.plan();
  const v = P2.virt.find((o) => o.b && o.b.i === 12); assert.ok(v && v.v > .1 && v.dl > 0, "b1 is inside the cruise blast: " + (v && v.v));
  const ia = P2.shots[0], S = W2.S(); clock.t = at(20, 0, 10); W2.over(); assert.ok(W2.dmg(12, 9) > 0, "b1 is broken too"); assert.ok(W2.dmg(14, 9) >= .3);
  const c = stubCtx(); A.bBigFx(0, 0, 10, "cruise", "#3178C6"); A.bNukeFx(0, -40, 0, 120); A.bDrawParticles(c); assert.ok(c.__n.ops > 50, "fireball, rings, dust skirt and mushroom draw with finite geometry");
  assert.ok(W2.art.pool().length <= 2400, "inside the pool");
});

test("11-14: the fall: the city that took the most falls after the last strike, derezzes tower by tower and stays a grid to the end of the replay; live, the cranes bring it back by noon", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("night", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, P = Wd.rep().P, S = R.S, A = Wd.art;
  assert.equal(P.fall.key, "@b", "@a's six cannon hits on @b are the most dollars"); assert.equal(P.fall.items.filter((it) => it.t === "b").length, 2);
  const last = Math.max(...P.shots.map((s) => s.ri)); assert.ok(S.zf0 > last && S.zf > S.zf0 && S.wide > S.zf, "after every strike, before the wide shot");
  const step = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); };
  step(S.zf0 + 200); assert.equal(Wd.api.phase().stage, "fall"); assert.equal(Wd.api.phase().label, "@b falls"); assert.equal(A.bRaze(12, 9), 0, "standing until the blast");
  const p0 = A.pool().length; step(S.zf + 30); assert.ok(A.pool().length > p0, "the blast fills the air");
  const far = Math.max(...P.fall.items.map((it) => it.dl)); step(S.zf + far + A.BFL.flash + A.BFL.rez + 50); assert.equal(A.bRaze(12, 9), 1); assert.equal(A.bRaze(14, 9), 1, "every tower of @b derezzed"); assert.equal(A.bRaze(2, 9), 0, "@a stands");
  step(S.zf + 400); assert.doesNotThrow(() => { A.under(); Wd.over(); }, "the scorch, the grid and the derezz draw");
  step(S.hold + (S.end - S.hold) * .9); assert.equal(Wd.api.phase().stage, "rebuild"); assert.equal(Wd.rebOf(12, 9), 0, "the cranes leave the fallen city a grid"); assert.ok(Wd.rebOf(2, 9) > .5, "the rest rebuilds"); assert.equal(A.bRaze(12, 9), 1);
  Wd.api.stop();
  // the hub's pick wins when it is on the map; the raiders fall as a fleet
  const d2 = data(); d2.fallen = d2.prev.fallen = "@a"; const W2 = world("day", { t: at(16), p: 1 }, d2); W2.api.view(true); W2.api.replay(); assert.equal(W2.rep().P.fall.key, "@a"); W2.api.stop();
  const d3 = data(); d3.fallen = d3.prev.fallen = "~raiders"; const W3 = world("day", { t: at(16), p: 1 }, d3); W3.api.view(true); W3.api.replay(); const F3 = W3.rep().P.fall; assert.ok(F3.raid && F3.items.length === 3 && F3.items.every((it) => it.t === "s"), "three ships"); const c3 = stubCtx(); A.bFleetHi(c3, 0, 0, 1, 0); assert.ok(c3.__n.ops > 3); W3.api.stop();
  // the camera frames the whole city, never past the pad zoom
  const fr = A.bFallFrame(P.fall, 900, 600); assert.ok(fr.z >= .45 && fr.z <= A.bPadZoom(900) * .9 + 1e-9 && Number.isFinite(fr.x) && Number.isFinite(fr.y));
  // reduced motion: still a fall, a cut to it
  const Rr = A.bBeats(P.shots, 0, true, A.bFallFrame(P.fall, 900, 600)); assert.ok(Rr.S.zf - Rr.S.zf0 <= 400 && Rr.S.wide > Rr.S.zf);
  // live: the fall comes after the salvo's last hit, holds through the night, and the cranes bring the lots back by noon
  const lc = { t: at(16), p: 1 }, L = world("day", lc, data()); L.api.view(true); const LP = L.plan(); assert.equal(LP.fall.key, "@b");
  lc.t = LP.S.zf + 6000; L.over(); assert.equal(L.art.bRaze(12, 9), 1, "live: @b falls tonight"); lc.t = at(23, 50); L.over(); assert.ok(L.dmg(12, 9) > 0);
  lc.t = at(12) + 864e5 - 60e3; L.over(); assert.ok(L.rebOf(12, 9) > .9, "nearly whole by noon"); lc.t = at(12) + 864e5 + 1000; L.over(); assert.equal(L.art.bRaze(12, 9), 0, "and whole after");
});

/** a context that records what it is asked to draw (stroke widths, drawImage alphas, fillRect widths) */
function recCtx() {
  const rec = { strokes: [], images: [], rects: [] }, st = { canvas: { width: 10, height: 10 }, globalAlpha: 1, lineWidth: 1, globalCompositeOperation: "source-over" }, grad = { addColorStop() {} };
  const ctx = new Proxy(st, { get(t, k) { if (k === "rec") return rec; if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return () => grad;
      if (k === "stroke") return () => rec.strokes.push(t.lineWidth);
      if (k === "drawImage") return (img, x, y, w, h) => { for (const v of [x, y, w, h]) assert.ok(Number.isFinite(v), "finite drawImage"); rec.images.push({ a: t.globalAlpha, w, op: t.globalCompositeOperation }); };
      if (k === "fillRect") return (x, y, w, h) => rec.rects.push(Math.abs(w));
      return (...a) => { for (const v of a) if (typeof v === "number") assert.ok(Number.isFinite(v), `finite ${String(k)}`); }; },
    set(t, k, v) { t[k] = v; return true } });
  return ctx;
}

test("FX pass 11-17: a blast is never smaller than its readable size on screen and never swamps a close view", () => {
  const W = world("day", { t: at(15), p: 1 }, data()).art, MIN = [14, 18, 24, 32], R0 = [10, 14, 22, 34];
  for (const z of [.1, .3, .6, 1, 1.6, 3]) { W.setZ(z);
    for (let k = 0; k < 4; k++) { const K = W.bBlK(W.bBlast(0, 0, k)), rs = R0[k] * z * K;
      assert.ok(rs >= MIN[k] - 1e-6, `class ${k} at zoom ${z}: radius ${rs.toFixed(1)} px >= ${MIN[k]}`);
      assert.ok(rs <= Math.max(MIN[k], k === 3 ? 600 * .075 : 120) + 1e-6, `class ${k} at zoom ${z}: radius ${rs.toFixed(1)} px under the cap`); } }
});

test("FX pass 11-17: a missile is at least 16 css px long at full zoom-out, with a glow, by day and night", () => {
  for (const sky of ["day", "night"]) { const W = world(sky, { t: at(15), p: 1 }, data()).art;
    for (const z of [.1, .3, 1, 3]) { W.setZ(z); const c = recCtx();
      for (let f = 0; f <= 1; f += .25) W.bMissileFly(c, W.bTraj(0, 0, 400, -40, f), 1, "#E85D75", 1000);
      assert.ok(c.rec.images.some(i => i.op === "lighter"), `${sky} ${z}: the motor glows`);
      if (z <= .3) assert.ok(Math.max(...c.rec.rects) * z >= 16 - 1e-6, `${sky} ${z}: body ${(Math.max(...c.rec.rects) * z).toFixed(1)} px long`); } }
});

test("FX pass 11-17: smoke trails keep a readable width zoomed out; the XL mushroom is a thin ring of puffs, not an opaque disc", () => {
  const W = world("day", { t: at(15), p: 1 }, data()), A = W.art;
  for (const z of [.1, 1]) { A.setZ(z); const s = { from: { x: 0, y: 0 }, to: { x: 400, y: -40 }, rf: 0, fl: 3000, a: "@a", sz: 1, dist: 400 };
    A.bRibbonFill(s, 2800, 1); const c = recCtx(); A.bDrawRibbons(c, 3000, false);
    assert.ok(c.rec.strokes.length > 0, "the ribbon draws"); for (const lw of c.rec.strokes) assert.ok(lw * z >= 1.5 - 1e-6, `zoom ${z}: stroke ${(lw * z).toFixed(2)} px`); }
  W.setLOD(2); A.setZ(1); A.pool().length = 0; A.bBigFx(0, -40, 0, "cruise", "#3178C6", null);
  const smoke = A.pool().filter(p => p.k === "smoke"); assert.ok(smoke.length <= 45, `${smoke.length} smoke puffs (was ~100)`); assert.ok(smoke.every(p => (p.acap || p.al) <= .34), "puff alpha capped");
  A.bStep(1.2); const c2 = recCtx(); A.bDrawParticles(c2); assert.ok(c2.rec.images.filter(i => i.op !== "lighter").every(i => i.a <= .95), "painted layers stay translucent");
  const sc = A.spScorch(1, 0); assert.equal(sc.width, 256, "the desolation is a cached sprite"); assert.equal(A.spScorch(1, 0), sc, "built once");
});

test("clouds 11-18: one cached merged sprite per shape and sky, depth makes far clouds smaller and fainter, finite draws", () => {
  const a = CITY_JS.indexOf("function newCloud(edge)"), b = CITY_JS.indexOf("\n", a), c0 = CITY_JS.indexOf("var CLSPR="), c1 = CITY_JS.indexOf("\nvar PRECIP=", c0);
  assert.ok(a > 0 && c0 > 0 && c1 > c0, "cloud code found");
  const mk = () => { const st = { canvas: {} }; return new Proxy(st, { get(t, k) { if (k in t) return t[k]; if (k === "createLinearGradient" || k === "createRadialGradient") return () => ({ addColorStop() {} }); return (...x) => { for (const v of x) if (typeof v === "number") assert.ok(Number.isFinite(v), `finite ${String(k)}`); }; }, set(t, k, v) { t[k] = v; return true } }); };
  const doc = { createElement: () => ({ width: 0, height: 0, getContext: mk }) };
  const K = new Function("document", "var sky='day',vw=900,vh=600,CLOUDS=[];function wxKind(){return 'partly'}\n" + CITY_JS.slice(a, b) + "\n" + CITY_JS.slice(c0, c1) +
    "\nreturn {cloudSprite:cloudSprite,drawClouds:drawClouds,newCloud:newCloud,list:function(){return CLOUDS},setSky:function(v){sky=v},spr:function(){return CLSPR}}")(doc);
  for (const sky of ["day", "dusk", "night"]) { K.setSky(sky);
    for (let v = 0; v < 4; v++) { const s1 = K.cloudSprite(v, 0); assert.equal(K.cloudSprite(v, 0), s1, "built once"); assert.ok(s1.width > 0 && s1.height > 0); } }
  assert.equal(Object.keys(K.spr()).length, 12, "4 shapes x 3 skies");
  const L = K.list(); for (let i = 0; i < 6; i++) L.push(K.newCloud(null)); L[0].d = 0; L[1].d = 1; L[0].vr = L[1].vr = 0;
  const c = recCtx(); K.drawClouds(c);
  assert.equal(c.rec.images.length, 6, "one image per cloud, no per-lobe arcs"); assert.ok(c.rec.images[0].a < c.rec.images[5].a, "far clouds are fainter and drawn first");
  for (let i = 0; i < 40; i++) { const n = K.newCloud(null); assert.ok(n.s > 0 && n.w > 0 && n.vr >= 0 && n.vr < 4 && n.d >= 0 && n.d <= 1); }
});

// ---- viewer power-ups v1 (citypowerup.ts, map-audit DESIGN.md item 10; Mike D1 11-20: cosmetic, free, local to the viewer)
import { POWERUP_JS } from "../src/citypowerup.ts";
test("power-ups 11-21: a tap is under 180 ms and 8 px (a drag still pans); drop() snaps to a roof within 60 css px, else the ground and the nearest city", () => {
  const clock = { t: at(16), p: 5000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over();
  const P = Wd.pu; assert.equal(typeof Wd.api.drop, "function", "CALDERA_BATTLE_API.drop");
  assert.deepEqual([[0, 0], [179, 7.9], [180, 0], [100, 8], [-1, 0], [50, 30]].map(([ms, d]) => P.isTap(ms, d)), [true, true, false, false, false, false]);
  const r1 = Wd.api.drop("heal", 400, 500); assert.equal(r1.ok, true); assert.equal(r1.handle, "@b"); assert.equal(r1.snap, true, "a tap on tower b1 snaps to it");
  assert.ok(Math.abs(r1.x - 396) < 1 && Math.abs(r1.y - 480) < 1, `lands on the roof (${r1.x},${r1.y})`);
  const r2 = Wd.api.drop("cheer", 800, 100); assert.equal(r2.ok, true); assert.equal(r2.snap, false, "nothing within 60 px: the ground"); assert.equal(r2.handle, "@b", "the nearest city");
  assert.ok(Math.abs(r2.x - 800) < 1e-6 && Math.abs(r2.y - 100) < 1e-6, "lands under the tap");
  assert.equal(Wd.api.drop("nuke", 400, 500).ok, false, "only the three kinds"); assert.equal(Wd.api.drop("fw", NaN, 1).ok, false);
  const kinds = P.pool().map(p => p.k); assert.ok(kinds.includes("crate") && kinds.includes("rings") && kinds.includes("cf"));
  assert.equal(P.pool().filter(p => p.k === "cf").length, 34, "34 confetti pieces at L");
});

test("power-ups 11-21: their own pool (80; phone 50), never the battle pool; drawn in real time with finite geometry; the crate's building smokes at half for 6 s", () => {
  const clock = { t: at(16), p: 5000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.api.replay(); Wd.over();
  const P = Wd.pu, bp0 = Wd.bp();
  for (let i = 0; i < 6; i++) Wd.api.drop(["heal", "fw", "cheer"][i % 3], 400, 500);
  assert.ok(P.pool().length <= 80, `${P.pool().length} pieces`); assert.equal(Wd.bp(), bp0, "the battle pool is untouched");
  P.setVw(390); for (let i = 0; i < 4; i++) Wd.api.drop("cheer", 400, 500); assert.ok(P.pool().length <= 50, "phone: 50"); assert.equal(P.max(), 50);
  assert.ok(P.pool().filter(p => p.k === "cf").length >= 20); P.setVw(900);
  P.pool().length = 0; Wd.api.drop("heal", 400, 500);
  for (let t = 0; t <= 3000; t += 50) { clock.p = 5000 + t; Wd.over(); }   // stub ctx throws on non-finite numbers
  assert.deepEqual(Wd.api.powerups().repaired, ["12,9"], "the crate's building is repaired"); assert.equal(P.plume(12, 9), .5, "its plume at half");
  assert.equal(P.plume(14, 9), 1); const k = { x: 96, y: 336 }; P.crane(k); clock.p += 50; P.crane(k); assert.equal(k.ex, 100, "a crane next to it runs at 3x (2 x 50 ms extra)");
  clock.p += 6000; assert.equal(P.plume(12, 9), 1, "after 6 s the plume is back");
  assert.equal(P.pool().length, 0, "every piece is gone after its life");
  for (const kd of ["fw", "cheer"]) { Wd.api.drop(kd, 400, 500); for (let t = 0; t <= 2500; t += 40) { clock.p += 40; Wd.over(); } assert.equal(P.pool().length, 0, `${kd} done`); }
  const paused = Wd.api.pause(true); assert.equal(paused, true); const ph = Wd.api.phase(); Wd.api.drop("fw", 400, 500); assert.equal(Wd.api.phase().paused, true); assert.equal(Wd.api.phase().t, ph.t, "a drop never moves or pauses the replay clock");
});

test("power-ups 11-21: prefers-reduced-motion is a 300 ms fade-in of the end state (no fall, no burst); no network call and no storage", () => {
  const clock = { t: at(16), p: 5000 }, store = memStore(), Wd = world("day", clock, data(), true, store); Wd.api.view(true); Wd.over();
  const n0 = store.size; Wd.api.drop("heal", 400, 500); Wd.api.drop("fw", 400, 500); Wd.api.drop("cheer", 400, 500);
  assert.ok(Wd.pu.pool().every(p => p.rm), "every piece takes the reduced path");
  for (let t = 0; t <= 2000; t += 100) { clock.p = 5000 + t; Wd.over(); } assert.equal(Wd.pu.pool().length, 0);
  assert.equal(store.size, n0, "nothing stored");
  assert.ok(/puRmA\(age,life\)/.test(POWERUP_JS) && /age\/300/.test(POWERUP_JS), "the 300 ms fade");
  for (const bad of ["fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage", "indexedDB", "document.cookie", "WebSocket"]) assert.ok(!POWERUP_JS.includes(bad), `no ${bad} in the power-up code`);
  assert.ok(BATTLE_DRAW_JS.includes(POWERUP_JS), "shipped with the battle renderer");
  assert.ok(CITY_JS.includes("window.CALDERA_BATTLE_TAP(ev.clientX,ev.clientY)") && CITY_JS.includes("puIsTap(performance.now()-(was.t0||0)"), "city.ts hands a replay tap to the hub's tray");
});

// ---- the leaderboard at the end of the replay (LEADERBOARD.md, Fable design 11-21; Mike 11-21)
/** a 2D context that records text, boxes and the translate offset (house rule 11: where things land on the picture) */
function lbRecCtx() {
  const T = [], B = [], F = [], st = [], o = { tx: 0, ty: 0, textAlign: "left", font: "" }, grad = { addColorStop() {} };
  const ctx = { T, B, F, save() { st.push([o.tx, o.ty, o.textAlign]); }, restore() { const p = st.pop() || [0, 0, "left"]; o.tx = p[0]; o.ty = p[1]; o.textAlign = p[2]; }, translate(x, y) { o.tx += x; o.ty += y; },
    transform() {}, rotate() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, arc() {}, clip() {}, fill() {}, stroke() {}, drawImage() {},
    createLinearGradient: () => grad, measureText: (t) => ({ width: String(t).length * 10 }),
    fillText(t, x, y) { for (const v of [x, y]) if (!Number.isFinite(v)) throw new Error("non-finite text"); T.push({ t: String(t), x: x + o.tx, y: y + o.ty, align: ctx.textAlign, local: o.tx !== 0 || o.ty !== 0 }); },
    strokeRect(x, y, w, h) { B.push({ x: x + o.tx, y: y + o.ty, w, h }); }, fillRect(x, y, w, h) { F.push({ x: x + o.tx, y: y + o.ty, w, h }); } };
  Object.defineProperty(ctx, "textAlign", { get: () => o.textAlign, set: (v) => { o.textAlign = v; } }); return ctx;
}
const lbShots = (list) => list.map(([a, d, usd, extra]) => Object.assign({ a, d, f: usd > 0 ? 1 : 0, usd, blocked: 0, sh: 0, pot: 0 }, extra || {}));
const lbX = (beats, o = {}) => { const shots = beats.flat(); return { R: { beats: beats.map((b) => ({ shots: b })), F: !!o.F }, P: { shots, night: o.night || "2026-11-20", demo: !!o.demo, hit: {}, fall: o.fall || null }, S: { wide: 0 }, V: o.V || null }; };

test("leaderboard: the top 5 by damage (the strike card's order); a viewer at rank 6 or lower is pinned with the real rank; SEA RAIDERS rank with no link; $0 has no row", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); const L = Wd.art.lb;
  const b1 = lbShots([["@orion", "@mike", 64.4e6], ["@lars", "@mike", 21.9e6], ["@lars", "@mike", 0], ["~raiders", "@lin", 14.2e6], ["@lin", "@orion", 9.8e6]]);
  const b2 = lbShots([["@bart", "@lin", 4.6e6], ["@kes", "@lin", 2.4e6], ["@novak", "@orion", 9e5], ["@mike", "@orion", 6.4e5], ["@zero", "@orion", 0], ["@mike", "@lin", 0, { blocked: 1, pot: 5e6 }]]);
  let M = L.model(lbX([b1, b2]), false);
  assert.equal(L.N, 5); assert.deepEqual(M.rows.map((r) => r.a), ["@orion", "@lars", "~raiders", "@lin", "@bart"], "top 5 by landed dollars");
  assert.deepEqual(M.rows.map((r) => r.rank), [1, 2, 3, 4, 5]); assert.equal(M.rows[0].s, 1); assert.ok(Math.abs(M.rows[1].s - 21.9 / 64.4) < 1e-9, "bar share of rank 1");
  assert.deepEqual([M.rows[1].land, M.rows[1].fired], [1, 2], "Lars: 1 of 2 missiles hit"); assert.equal(M.rows[2].name, "SEA RAIDERS"); assert.ok(/\braid\b/.test(M.rows[2].cls)); assert.ok(/\btop\b/.test(M.rows[0].cls));
  assert.equal(M.pin, null, "no viewer, no pin"); assert.ok(!M.rows.some((r) => r.a === "@zero"), "$0 damage: no rank, no row");
  // the viewer at rank 2: the row reads YOU on screen, the handle in the picture; at rank 5 no pin; at rank 8 pinned with rank 8
  M = L.model(lbX([b1, b2], { V: "@lars" }), false); assert.equal(M.rows[1].name, "YOU"); assert.ok(/\bme\b/.test(M.rows[1].cls)); assert.equal(M.pin, null); assert.equal(M.you, null, "ranked, no city on the map: no viewer line");
  const pic = L.model(lbX([b1, b2], { V: "@lars" }), true); assert.equal(pic.rows[1].name, "LARS", "the picture: the handle, never YOU"); assert.ok(/\bme\b/.test(pic.rows[1].cls), "and still the purple row"); assert.ok(!JSON.stringify(pic).includes("YOU"));
  assert.equal(L.model(lbX([b1, b2], { V: "@bart" }), false).pin, null, "rank 5: in the top 5, no pin");
  M = L.model(lbX([b1, b2], { V: "@mike" }), false); assert.equal(M.rows.length, 5); assert.ok(M.pin, "rank 8: pinned"); assert.equal(M.pin.rank, 8, "with the real rank"); assert.equal(M.pin.name, "YOU"); assert.deepEqual([M.pin.land, M.pin.fired], [1, 2]);
  assert.equal(L.model(lbX([b1, b2], { V: "@mike" }), true).pin.name, "MIKE", "the pinned row stays in the picture, with the handle");
  // ties go to the earlier beat; fewer than 5 attackers: only the rows that exist
  M = L.model(lbX([lbShots([["@x", "@y", 5]]), lbShots([["@w", "@y", 5]])]), false); assert.deepEqual(M.rows.map((r) => r.a), ["@x", "@w"]);
  // the markup: an ordered list with values, a member links to the profile, the raiders do not; the pin under a dotted line
  M = L.model(lbX([b1, b2], { V: "@mike" }), false); const h = L.html(M, "l", { save: true, share: false, signedIn: true });
  assert.ok(h.startsWith('<div class="blb sz-l" role="dialog" aria-modal="true" aria-labelledby="lb-t">')); assert.ok(h.includes('<h2 class="lb-title" id="lb-t">Battle results</h2>'));
  assert.ok(h.includes('<li class="top" value="1" style="--s:1.000;--d:4">'), "rank 1 lands last (--d = rows - 1)"); assert.ok(h.includes('value="5" style="--s:0.071;--d:0"'), "rank 5 first");
  assert.ok(h.includes('<li class="me pin" value="8" style="--s:0.020;--d:7">'), "the pinned row: min share .02, --d rows + 2");
  assert.ok(h.includes('href="https://caldera.social/@orion/" target="_top" rel="noopener">ORION</a>'), "a member links to the Caldera profile");
  const raid = h.slice(h.indexOf('<li class="raid"'), h.indexOf("</li>", h.indexOf('<li class="raid"'))); assert.ok(raid.includes('class="av r"') && raid.includes('<span class="n">SEA RAIDERS</span>') && !raid.includes("<a "), "raiders: a white diamond, no link");
  assert.ok(h.includes("TOP ATTACKER · 1 of 1 missiles hit") && h.includes("1 of 2 missiles hit"), "the line under the name");
  assert.ok(L.html(M, "s", { save: true }).includes("1 of 2 hit</span>"), "phone: the short line"); assert.ok(h.includes('<span class="lb-sr"> damage</span>'));
  assert.ok(h.includes('<p class="lb-eye"><span>Last night · NOV 20</span><em>caldera.social</em></p>'));
  // no damage at all: one line, no Save
  M = L.model(lbX([lbShots([["@x", "@y", 0]])]), false); assert.equal(M.rows.length, 0); const h0 = L.html(M, "m", { save: true, signedIn: true });
  assert.ok(h0.includes('<li class="none">No missile hit a city.</li>')); assert.ok(!h0.includes('data-lb="save"'), "no Save without rows"); assert.ok(h0.includes('data-lb="again"') && h0.includes('data-lb="exit"'));
});

test("leaderboard: viewer lines, callouts (a fall beats hardest hit; best shield ties by what it held), totals, demo and file names", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); const L = Wd.art.lb;
  const b = lbShots([["@a", "@b", 5e6], ["@v", "@b", 0], ["@v", "@b", 0], ["@v", "@a", 0], ["@c", "@a", 0, { blocked: 1, pot: 2e6 }], ["@c", "@b", 0, { blocked: 1, pot: 1e6 }], ["@a", "@b", 0, { blocked: 1, pot: 9e6 }]]);
  assert.equal(L.model(lbX([b], { V: "@v" }), false).you, "You fired 3 missiles. No hit.");
  assert.equal(L.model(lbX([lbShots([["@v", "@b", 0]])], { V: "@v" }), false).you, "You fired 1 missile. No hit.");
  assert.equal(L.model(lbX([b], { V: "@nobody" }), false).you, "You fired no missiles."); assert.equal(L.model(lbX([b], { V: "@v" }), true).you, null, "no viewer line in the picture");
  let M = L.model(lbX([b]), false); assert.deepEqual(M.call, [["Best shield", "B · 2 blocked", "cyan"]], "two blocked each: B held more");
  const T = L.tally(lbX([b]).P); assert.deepEqual(T.A["@v"], { fired: 3, land: 0 }); assert.deepEqual([T.D["@b"].blocked, T.D["@b"].held, T.D["@a"].held], [2, 1e7, 2e6]);
  assert.deepEqual(M.facts, [["1", "cities hit", ""], ["1", "missiles hit", ""], ["$5M", "damage in all", "gold"]], "the last card's three totals");
  M = L.model(lbX([b], { fall: { key: "@b" }, F: true }), false); assert.deepEqual(M.call[0], ["City down", "B", "red"], "a fall comes first"); assert.equal(M.call.length, 2);
  assert.deepEqual(L.model(lbX([b], { fall: { key: "~raiders" }, F: true }), false).call[0], ["Fleet sunk", "SEA RAIDERS", "red"]);
  // file names: story adds -story; the demo names say demo
  M = L.model(lbX([b]), false); assert.equal(L.file(M, "p"), "caldera-leaderboard-2026-11-20.png"); assert.equal(L.file(M, "s"), "caldera-leaderboard-2026-11-20-story.png");
  const D = L.model(lbX([b], { demo: true, night: "demo" }), false); assert.equal(D.demo, true); assert.equal(L.file(D, "s"), "caldera-leaderboard-demo-story.png"); assert.equal(L.file(D, "p"), "caldera-leaderboard-demo.png");
  assert.ok(L.html(D, "l", { save: true, signedIn: true }).includes('<b class="demo">DEMO</b>Sample battle'));
  // the real replay: hardest hit when nothing fell (a defender with towers that lost 1 point or more), a fall when one did
  const clock = { t: at(16), p: 10000 }, W2 = world("day", clock, data()); W2.api.view(true); W2.over(); W2.api.replay(); const R = W2.rep().R, P = W2.rep().P, S = W2.S();
  const real = W2.art.lb.model({ R, P, S, V: null }, false); assert.ok(real.rows.length >= 2); assert.deepEqual(real.rows.map((r) => r.a), W2.art.bCardRanks(R.beats, R.beats.length - 1).slice(0, 5).map((r) => r.a), "the same order as the strike card's strip");
  if (P.fall && R.F) assert.equal(real.call[0][2], "red");
  const nofall = W2.art.lb.model({ R: Object.assign({}, R, { F: false }), P: Object.assign({}, P, { fall: null }), S, V: null }, false); assert.equal(nofall.call[0][0], "Hardest hit"); assert.ok(/^[AB] −\d+%$/.test(nofall.call[0][1]), nofall.call[0][1]); W2.api.stop();
});

test("leaderboard: the buttons (Share / Save first; demo signed out: Add your city first; sandboxed: no Save, Replay again first); the board replaces the end of the replay", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); const L = Wd.art.lb, real = { demo: false, rows: [1] }, demo = { demo: true, rows: [1] };
  assert.deepEqual(L.buttons(real, { save: true, share: false, signedIn: true }), { list: ["save", "again", "exit", "post"], pri: "save", n3: false, jn: false }, "desktop: Save picture (story), then a small Post size link");
  assert.deepEqual(L.buttons(real, { save: true, share: true, signedIn: true }).list, ["save", "again", "exit"], "phone: one Share button, no Post size");
  assert.deepEqual(L.buttons(real, { save: true, share: false, signedIn: false }), { list: ["join", "save", "again", "exit", "post"], pri: "join", n3: true, jn: true }, "signed out on a real night (11-27): the join button first and primary, no Add your city link");
  const hj = L.html(L.model(lbX([lbShots([["@a", "@b", 5e6]])]), false), "l", { save: true, share: false, signedIn: false, join: "/join?tp=replay_end" });
  assert.ok(hj.includes('<div class="lb-act n3 jn"><div class="lb-join"><a class="lb-btn pri" data-lb="add" data-jn="board" href="/join?tp=replay_end"') && hj.includes("Put your city in tonight\u2019s battle") && hj.includes('id="lb-js">Free. Your GitHub becomes a city'), "the join button, primary, with its line");
  assert.ok(!hj.includes(">Add your city<") && (hj.match(/class="lb-btn pri"/g) || []).length === 1, "one primary, no old link");
  assert.ok(!L.html(L.model(lbX([lbShots([["@a", "@b", 5e6]])]), false), "l", { save: true, signedIn: true }).includes("lb-join"), "members: no join button");
  assert.deepEqual(L.buttons(demo, { save: true, share: true, signedIn: false }), { list: ["add", "save", "again", "exit"], pri: "add", n3: true, jn: false }, "demo, signed out: Add your city first, Share second");
  assert.deepEqual(L.buttons(demo, { save: true, share: false, signedIn: true }).pri, "save");
  assert.deepEqual(L.buttons(real, { save: false, signedIn: true }), { list: ["again", "exit"], pri: "again", n3: false, jn: false }, "sandboxed page: no Share, Save or Post size");
  assert.deepEqual(L.buttons({ demo: false, rows: [] }, { save: true, signedIn: true }).list, ["again", "exit"], "no rows: no Save");
  const Mx = L.model(lbX([lbShots([["@a", "@b", 5e6]])], { demo: true, night: "demo" }), false), hd = L.html(Mx, "s", { save: true, share: true, signedIn: false, add: "/#start" });
  assert.ok(hd.includes('<div class="lb-act n3"><a class="lb-btn pri" data-lb="add" href="/#start"'), "Add your city is the primary"); assert.ok(hd.includes('class="lb-btn" data-lb="save" data-fmt="s" aria-label="Share the results as a picture"') && hd.includes("<span>Share</span>"));
  const hs = L.html(Mx, "l", { save: false, signedIn: true }); assert.ok(!hs.includes('data-lb="save"'), "sandboxed: no Save"); assert.ok(hs.includes('class="lb-btn pri" data-lb="again"')); assert.ok(/data-lb="again"><svg[^>]*><path[^>]*\/><\/svg><span>Replay again<\/span>/.test(hs), "BATTLE.md U2: Replay again, with the play icon"); assert.ok(!hs.includes("Watch again"));
  const hdk = L.html(L.model(lbX([lbShots([["@a", "@b", 5e6]])]), false), "l", { save: true, share: false, signedIn: true }); assert.ok(hdk.includes('class="lb-btn pri" data-lb="save" data-fmt="s" aria-label="Save the results as a picture"') && hdk.includes("<span>Save picture</span>") && hdk.includes('data-fmt="p">Post size (4:5)</button>'));
  // Save hides where it cannot save: the harness has no canvas; a sandboxed hosted city page has an opaque origin
  assert.equal(L.canSave(), false); const src = BATTLE_DRAW_JS.slice(BATTLE_DRAW_JS.indexOf("function bCardCanSave(){"), BATTLE_DRAW_JS.indexOf("\n", BATTLE_DRAW_JS.indexOf("function bCardCanSave(){")));
  const can = (win, loc) => new Function("window", "location", "document", "HTMLCanvasElement", src + ";return bCardCanSave()")(win, loc, win.document, { prototype: { toBlob() {} } });
  const doc = { createElement() {} }; assert.equal(can({ document: doc, origin: "https://caldera.social", localStorage: {} }, { origin: "https://caldera.social" }), true, "a normal page saves");
  assert.equal(can({ document: doc, origin: "null" }, { origin: "null" }), false, "a sandboxed page does not");
  assert.equal(can(Object.defineProperty({ document: doc, origin: "x" }, "localStorage", { get() { throw new Error("blocked"); } }), { origin: "x" }), false, "storage blocked: no Save");
  // the height classes; the CSS rides with the strike card's style element (CITY_JS); the board marks html.w-board for the hub
  assert.deepEqual([L.h(700), L.h(600), L.h(500)], ["", "h-s", "h-xs"]); assert.ok(BATTLE_DRAW_JS.includes("s.textContent=BCCSS+BLCSS;")); assert.ok(L.css.includes(".blb{position:absolute;inset:0;z-index:8;"));
  const fn = (n) => { const a = BATTLE_DRAW_JS.indexOf("function " + n + "("); return BATTLE_DRAW_JS.slice(a, BATTLE_DRAW_JS.indexOf("\nfunction ", a + 1)); };
  assert.ok(fn("bLbMount").includes("classList.add('w-board')") && fn("bLbOff").includes("classList.remove('w-board')"), "html.w-board while the board shows (the hub hides its bar and tray on it)");
  assert.ok(/function bClock\(now\)\{var S=bS\(\);if\(!S\)return;if\(BREP&&now>=S\.end\)\{bLbHold\(S\);return\}/.test(BATTLE_DRAW_JS), "the end holds and mounts the board in place of bReplayEnd");
  // in a replay: the board at the end, Watch again restarts the same mode, Exit ends it (the hub's hooks when given)
  const clock = { t: at(16), p: 10000 }, W2 = world("day", clock, data()); W2.api.view(true); W2.over(); W2.api.replay("demo"); const S = W2.S();
  clock.p = 10000 + S.end + 50; W2.over(); const bd = W2.api.board(); assert.ok(bd && bd.m.demo, "the demo's board"); assert.equal(W2.api.card(), null, "no strike card under it");
  assert.equal(W2.api.boardAct("again"), true); assert.equal(W2.api.board(), null); assert.equal(W2.api.phase().replay, true); assert.equal(W2.api.phase().demo, true, "Watch again: the same mode"); assert.ok(W2.api.phase().t < 1000, "from the start");
  const calls = []; W2.api.boardHooks({ again: (d) => calls.push(["again", d]), exit: () => calls.push(["exit"]) });
  clock.p += S.end + 50; W2.over(); assert.ok(W2.api.board()); W2.api.boardAct("again"); assert.deepEqual(calls, [["again", true]], "the hub's play() does it when it gave a hook");
  W2.api.replay(); clock.p += W2.S().end + 50; W2.over(); W2.api.boardAct("exit"); assert.deepEqual(calls[1], ["exit"]); assert.equal(W2.api.board(), null); W2.api.boardHooks(null); W2.api.stop();
});

test("leaderboard picture: story 1080x1920 with one cyan link spot (480x64, centred, y 1506 to 1570), nothing in the top 250, the bottom 340 or the 96 px side edges; post 1080x1350", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()); const L = Wd.art.lb, X = L.XL;
  assert.deepEqual([X.s.W, X.s.H, X.p.W, X.p.H], [1080, 1920, 1080, 1350]);
  const b1 = lbShots([["@orion-the-very-long-handle-name", "@mike", 64.4e6], ["@lars", "@mike", 21.9e6], ["~raiders", "@lin", 14.2e6], ["@lin", "@orion", 9.8e6], ["@bart", "@lin", 4.6e6], ["@kes", "@lin", 2.4e6], ["@mike", "@orion", 6.4e5], ["@lin", "@mike", 0, { blocked: 1, pot: 3e6 }]]);
  for (const V of [null, "@mike", "@lars"]) for (const k of ["s", "p"]) {
    const D = Object.assign(L.model(lbX([b1], { V, fall: { key: "@mike" }, F: true }), true), { src: null, av: {} }), c = lbRecCtx(), Lk = X[k]; Wd.art.lb.draw(c, D, Lk);
    const spot = c.B.filter((b) => b.w < 800); assert.equal(spot.length, 1, "one box that looks like a button: the link spot");
    const ux = (Lk.W - Lk.urlW) / 2; assert.deepEqual(spot[0], { x: ux, y: Lk.urlY, w: Lk.urlW, h: Lk.urlH }); if (k === "s") assert.deepEqual([spot[0].x, spot[0].y, spot[0].x + spot[0].w, spot[0].y + spot[0].h], [300, 1506, 780, 1570], "the strike card's story spot (BCXL.s)");
    assert.equal(c.B.length, V === "@mike" || V === "@lars" ? 2 : 1, "the viewer's row outline is the only other stroke, and it spans the row"); c.B.filter((b) => b.w >= 800).forEach((b) => assert.ok(b.x >= Lk.M && b.x + b.w <= Lk.W - Lk.M));
    const url = c.T.filter((t) => t.t === "caldera.social"); assert.equal(url.length, 1); assert.equal(url[0].x, 540); assert.ok(url[0].y > Lk.urlY && url[0].y < Lk.urlY + Lk.urlH);
    if (k === "s") c.T.forEach((t) => { assert.ok(t.y >= 250 && t.y <= 1580, `text "${t.t}" at y ${t.y} stays out of the story header and reply bar`); if (t.align === "left" && !t.local) assert.ok(t.x >= 96, `"${t.t}" x ${t.x}`); if (t.align === "right") assert.ok(t.x <= 984, `"${t.t}" x ${t.x}`); });
    assert.ok(!c.T.some((t) => /\bYOU\b/.test(t.t)), "never YOU in a picture"); if (V === "@mike") assert.ok(c.T.some((t) => t.t === "MIKE"), "the saver's pinned row, with the handle");
    assert.ok(c.T.some((t) => t.t === "BATTLE RESULTS") && c.T.some((t) => t.t === "BATTLE · NOV 20, 2026") && c.T.some((t) => t.t === "CITY DOWN"));
    assert.ok(!c.T.some((t) => /TOP ATTACKER/.test(t.t) && t.t !== "TOP ATTACKERS"), "no TOP ATTACKER prefix on rank 1 in the picture"); }
  const Dd = Object.assign(L.model(lbX([b1], { demo: true, night: "demo" }), true), { src: null, av: {} }), cd = lbRecCtx(); L.draw(cd, Dd, X.s);
  assert.ok(cd.T.some((t) => t.t === "DEMO BATTLE") && cd.T.some((t) => t.t === "SAMPLE DATA. NOT A REAL BATTLE."), "the demo picture says so");
  const ce = lbRecCtx(); L.draw(ce, Object.assign(L.model(lbX([lbShots([["@a", "@b", 0]])]), true), { src: null, av: {} }), X.s); assert.ok(ce.T.some((t) => t.t === "No missile hit a city."));
  const cs = stubCtx(); L.draw(cs, Object.assign(L.model(lbX([b1], { V: "@mike" }), true), { src: { width: 1800, height: 1200 }, av: { "@lars": { width: 64 } } }), X.s); assert.ok(cs.__n.ops > 50, "finite geometry with a map frame and a photo");
});

test("ES tracer share funnel (MB 11-21): leaderboard shown / share tap / share done, strike card the same; no-op without esTrace", () => {
  const J = CITY_JS;
  assert.match(J, /function bcTr\(n,p\)\{try\{if\(typeof window!=='undefined'&&typeof window\.esTrace==='function'\)window\.esTrace\(n,p\|\|\{\}\)\}catch\(e\)\{\}\}/);
  assert.match(J, /bcTr\('leaderboard_shown',/);
  assert.match(J, /bcTr\('leaderboard_share_tap',\{kind:bcKind\(fmt\)\}\)/);
  assert.match(J, /bcTr\('leaderboard_share_done',\{ok:true,via:k\}\)/);
  assert.match(J, /bcTr\('leaderboard_share_done',\{ok:false,err:'AbortError'\}\)/);
  assert.match(J, /bcTr\('leaderboard_share_done',\{ok:false,err:bcErr\(e\)\}\)/);
  assert.match(J, /bcTr\('strikecard_share_tap',\{kind:bcKind\(fmt\)\}\)/);
  assert.match(J, /bcTr\('strikecard_share_done',\{ok:true,via:k\}\)/);
  assert.match(J, /function bcKind\(fmt\)\{if\(fmt==='p'\)return 'post45';/);
});

// ---- the battle screen (BATTLE.md, Fable design 11-24): the strike callout in the top corner, the fly line, the rank chip, the live sum
test("BATTLE.md U5: the fly line words: 1 missile, many, the viewer, the raiders, a montage; the short mono line on small panes", () => {
  const Wd = world("day", { t: at(16), p: 1 }, data()), A = Wd.art, sh = (n) => Array.from({ length: n }, () => ({}));
  const words = (F) => F.l1.map((p) => p[0]).join("");
  let F = A.bFlyModel({ a: "@jgeofil", n: 5, shots: sh(5), targets: ["@benzema216", "@mike", "@x", "@y", "@z"] }, null);
  assert.equal(words(F), "JGEOFIL FIRES 5 MISSILES"); assert.equal(F.l1[0][1], "atk"); assert.equal(F.sub, "at BENZEMA216 and 4 more cities"); assert.equal(F.subS, "at BENZEMA216 +4");
  F = A.bFlyModel({ a: "@a", n: 1, shots: sh(1), targets: ["@b"] }, null); assert.equal(words(F), "A FIRES 1 MISSILE"); assert.equal(F.sub, "at B"); assert.equal(F.subS, "at B");
  F = A.bFlyModel({ a: "@a", n: 3, shots: sh(3), targets: ["@b", "@c"] }, null); assert.equal(words(F), "A FIRES 3 MISSILES"); assert.equal(F.sub, "at B and 1 more city"); assert.equal(F.subS, "at B +1");
  F = A.bFlyModel({ a: "@a", n: 3, shots: sh(3), targets: ["@b"] }, "@a"); assert.equal(words(F), "YOU FIRE 3 MISSILES"); assert.equal(F.l1[0][1], "you");
  F = A.bFlyModel({ a: "@a", n: 2, shots: sh(2), targets: ["@b", "@c", "@d"] }, "@b"); assert.equal(F.sub, "at YOUR CITY and 2 more cities");
  F = A.bFlyModel({ a: "~raiders", n: 4, shots: sh(4), targets: ["@b"] }, null); assert.equal(words(F), "SEA RAIDERS FIRE 4 MISSILES"); assert.equal(F.l1[0][1], "raid");
  F = A.bFlyModel({ a: "@q", n: 9, shots: sh(9), targets: ["@b"], montage: true, cities: 4 }, null); assert.equal(words(F), "4 MORE CITIES FIRE"); assert.equal(F.sub, "", "a montage: the headline alone");
  assert.equal(words(A.bFlyModel({ a: "@q", n: 1, shots: sh(1), targets: ["@b"], montage: true, cities: 1 }, null)), "1 MORE CITY FIRES");
  const h = A.bFlyHTML(A.bFlyModel({ a: "@a", n: 5, shots: sh(5), targets: ["@b", "@c", "@d"] }, null), "s");
  assert.ok(h.includes('class="bc-l1"') && h.includes("at B +2") && !/bc-big|bc-save|bc-rank/.test(h), "one headline, one mono line: no number, no chip, no Save");
  assert.ok(!/[^\x00-\x7F]/.test(BATTLE_DRAW_JS.slice(BATTLE_DRAW_JS.indexOf("function bFlyModel"), BATTLE_DRAW_JS.indexOf("function bFlyModel") + 600)), "ASCII source");
});

test("BATTLE.md U6: the rank chip: NOW 1ST, 2ND, 3RD; none for rank 4 and lower, a shield, a miss, a montage, the fall and the last card", () => {
  const A = world("day", { t: at(16), p: 1 }, data()).art, rk = (o) => A.bcRank(Object.assign({ kind: "beat", state: "small", rank: 1 }, o));
  assert.deepEqual([1, 2, 3, 4, 5, 0].map((r) => rk({ rank: r })), ["NOW 1ST", "NOW 2ND", "NOW 3RD", "", "", ""]);
  for (const s of ["hit", "multi", "fall"]) assert.equal(rk({ state: s, rank: 2 }), "NOW 2ND", s);
  for (const s of ["shield", "miss", "montage"]) assert.equal(rk({ state: s }), "", s);
  assert.equal(rk({ kind: "fall", state: "fall" }), ""); assert.equal(rk({ kind: "last", state: "last" }), "");
  // in a replay: the model carries the attacker's rank after the strike (bCardRankOf), and the callout shows it after the tail
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay();
  const go = (ms) => { Wd.api.seek(ms); Wd.bcam(); Wd.over(); return Wd.api.card(); }, cards = Wd.api.cards();
  const m0 = go(cards[0].c0 + 1500).m, m1 = go(cards[1].c0 + 1500).m; assert.equal(m0.rank, 1, "A leads after strike 1"); assert.equal(m1.rank, 2, "B is second after strike 2");
  const h = Wd.art.bCardHTML(m1, "l", false).html; assert.ok(/<span class="bc-tail">.*<\/span><span class="bc-rank">NOW 2ND<\/span>/.test(h)); Wd.api.stop();
});

test("BATTLE.md U4: the callout's money value is the landed sum of the strike at the clock time, never ahead of the map; words and percents wait for the settle", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay();
  const A = Wd.art, R = Wd.rep().R, S = R.S, L = Wd.rep().cards || (Wd.over(), Wd.rep().cards), go = (ms) => { Wd.api.seek(ms); Wd.bcam(); Wd.over(); return Wd.api.card(); };
  const landed = (b, t) => b.shots.reduce((u, s) => u + (A.bImpactOf(S, s) <= t && s.f > 0 && !s.blocked ? s.usd || 0 : 0), 0);
  let checked = 0;
  R.beats.forEach((b, i) => { const c = Wd.api.cards()[i]; assert.ok(c.s0 >= Math.min(...b.shots.map((s) => A.bImpactOf(S, s))), "not before the first impact");
    for (let t = c.s0 - 200; t < c.x1; t += 37) { const u = A.bCardLive(Wd.rep().cards[i], t); assert.ok(u <= landed(b, t) + 1e-9, `strike ${i} at ${t}: ${u} > ${landed(b, t)}`); assert.equal(u, landed(b, t)); }
    assert.equal(A.bCardLive(Wd.rep().cards[i], c.settle), b.shots.reduce((u, s) => u + (s.f > 0 && !s.blocked ? s.usd || 0 : 0), 0), "all of it at the settle");
    const k = go(c.s0 + 5); if (k && k.kind === "beat" && A.bcMoney(k.m)) { for (const t of [c.s0 + 5, (c.s0 + c.settle) / 2, c.settle, c.settle + 300]) { const k2 = go(t); assert.equal(k2.big, A.bUsd(landed(b, t)), `the big value at ${t}`); checked++; } } });
  assert.ok(checked > 0, "a money callout was checked"); assert.ok(L); Wd.api.stop();
  // reduced motion: the callout comes in once at the settle with its final values
  const Wr = world("day", { t: at(16), p: 1 }, data(), true); Wr.api.view(true); Wr.over(); Wr.api.replay(); Wr.api.cards().forEach((c) => assert.equal(c.s0, c.settle)); Wr.api.stop();
});

test("BATTLE.md U1: the callout markup: no plate, the head, the timer line, the facts with Save, the city line; short words on small panes", () => {
  const A = world("day", { t: at(16), p: 1 }, data()).art;
  const M = { kind: "beat", state: "multi", tone: "gold", ac: "atk", l1: [["JGEOFIL", "atk"], [" HITS 5 CITIES"]], big: "$4M", tail: [["DAMAGE"]], rank: 2, say: "Jgeofil hits 5 cities $4m damage.",
    facts: [["5 of 5", "missiles hit", "hit"], ["$7.9M", "blocked by shield", "blocked"]], rows: [["MIKE", 100, 80, "−20%", "$2.3M"], ["DAVIDGUTTMAN", 100, 98, "−2%", "$852k"]], more: "+3 more cities" };
  assert.equal(A.bcCityLine(M), "MIKE −$2.3M · DAVIDGUTTMAN −$852k · +3 more cities");
  assert.equal(A.bcCityLine({ rows: [["MIKE", 100, 100, "held", "$0"]] }), "MIKE held", "a city with no damage holds");
  assert.equal(A.bcCityLine({ bar: ["B’S CITY", 100, 79, "100% → 79% standing"] }), "B’S CITY · 100% → 79% standing");
  assert.equal(A.bcCityLine({ you: "Your city: 2 hits, 80% standing" }), "Your city: 2 hits, 80% standing");
  const h = A.bCardHTML(M, "l", true).html;
  for (const k of ['class="sc-sr"', 'class="bc-head" aria-hidden="true"', 'class="bc-l1"', 'class="bc-big"', 'class="bc-tail"', 'class="bc-rank">NOW 2ND', 'class="bc-timer"', 'class="bc-row"', 'class="bc-facts" aria-hidden="true"><b>5 of 5</b> missiles hit · <b>$7.9M</b> blocked by shield', 'aria-label="Save a picture of this strike"', 'class="bc-cities"']) assert.ok(h.includes(k), k);
  for (const k of ["sc-plate", "sc-bar", "sc-rows", "sc-lb", "sc-paused", "Top attackers"]) assert.ok(!h.includes(k), `no ${k}`);
  assert.ok(A.bCardHTML(M, "s", true).html.includes("<b>5 of 5</b> hit · <b>$7.9M</b> blocked"), "small panes: the short words");
  assert.ok(!A.bCardHTML(M, "l", false).html.includes("bc-save"), "no Save where the page cannot save");
  const last = A.bCardHTML(Object.assign({}, M, { kind: "last", state: "last" }), "l", true).html; assert.ok(last.includes("Save post") && last.includes("Save story"));
  const css = BATTLE_DRAW_JS.slice(BATTLE_DRAW_JS.indexOf("var BCCSS="), BATTLE_DRAW_JS.indexOf("var BCICO="));
  assert.ok(/\.bcall\{position:absolute;z-index:6;left:16px;top:14px;max-width:calc\(100% - 200px\);pointer-events:none/.test(css), "top left, no pointer");
  assert.ok(css.includes(".bcall .bc-save{pointer-events:auto") && css.includes(".bcall.sz-s .bc-cities{display:none}") && css.includes("@keyframes scPop") && css.includes("@keyframes scOut{to{opacity:0;transform:translateY(-6px)}}"));
  assert.ok(!css.includes(".bcard") && !css.includes("data-card-hide"), "the plate and the phone hide rule are gone");
  assert.ok(/\.bcall\.go\.rm \*\{animation:none!important\}/.test(css), "reduced motion: no slam, slide or pop");
  assert.ok(!/pointerenter|pointerleave/.test(BATTLE_DRAW_JS.slice(BATTLE_DRAW_JS.indexOf("function bCardWire"), BATTLE_DRAW_JS.indexOf("function bCardDrive"))), "no pause on hover or tap");
});

test("BATTLE.md U1/U7/U8: no camera lift, the hit at 54% (50% under 700 px); phase() gives the strike's start and end; Save picks the strike that landed last", () => {
  const A = world("day", { t: at(16), p: 1 }, data()).art, b = { lead: { to: { x: 10, y: 20 } } };
  for (const [vw, vh, k] of [[1300, 800, .54], [900, 600, .54], [390, 700, .5]]) { const f = A.bHitFrame(b, vw, vh), y = vh * .52 + (b.lead.to.y - f.y) * f.z; assert.ok(Math.abs(y - vh * k) < 1e-6, `${vw}: ${y / vh}`); }
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over(); Wd.api.replay(); const R = Wd.rep().R, cards = Wd.api.cards();
  const go = (ms) => { Wd.api.seek(ms); Wd.bcam(); Wd.over(); return Wd.api.phase(); };
  let ph = go(R.beats[1].t0 + 100); assert.equal(ph.b0, R.beats[1].t0); assert.equal(ph.b1, R.beats[1].end); assert.deepEqual(ph.strikes, R.beats.map((x) => [x.t0, x.end]));
  go(cards[0].s0 - 50); assert.equal(Wd.art.bCardPick(cards[0].s0 - 50), null, "nothing landed yet");
  go(R.beats[1].t0 + 100); assert.equal(Wd.api.card(), null); assert.equal(Wd.art.bCardPick(R.beats[1].t0 + 100).id, 0, "after the callout left: the strike that landed last");
  assert.equal(Wd.api.canPic(), "off", "a page that cannot save a file: no row"); assert.equal(Wd.api.savePic(), false); Wd.api.stop();
});

test("Replay plays the newest night, the one the Last night card shows (GE 11-24 data fault)", () => {
  const f = new Function("BDATA", "bPick", CITY_JS.match(/function bNewest\(noon\)\{[^\n]*\}/)[0] + "; return bNewest(0);");
  const pick = () => ({ key: "old" });
  assert.equal(f({ t0: 5, night: "2026-11-24", shots: [{ a: 1 }] }, pick).key, "2026-11-24");
  assert.equal(f({ t0: 5, night: "2026-11-24", shots: [] }, pick).key, "old");
  assert.match(CITY_JS, /src0=demo\?null:bNewest\(/);
  assert.match(CITY_JS, /P\.night=demo\?'demo':\(src0&&src0\.key\)/);
});

test("bPick: the battle at 20:00 PT (2026-11-25 on) fires live at the Pacific 20:00; the 02:00 PT nights before keep their day; the switch evening takes the newest", () => {
  const src = CITY_JS.match(/function bPick\(noon\)\{[^\n]*\n[^\n]*\}/)[0], pick = (D, noon) => new Function("BDATA", "BDAY", src + "; return bPick(" + noon + ");")(D, 864e5);
  const noonPT = d => Date.parse(d + "T20:00:00Z");   // 12:00 PST
  const n24 = { night: "2026-11-24", t0: Date.parse("2026-11-24T10:00:00Z"), shots: [] }, n25 = { night: "2026-11-25", t0: Date.parse("2026-11-25T04:00:00Z"), shots: [] };
  assert.equal(pick({ ...n24, prev: null }, noonPT("2026-11-24")).key, "2026-11-24", "02:00 PT night: the same day's 20:00");
  assert.equal(pick({ ...n25, prev: n24 }, noonPT("2026-11-24")).key, "2026-11-25", "the switch evening: the newest");
  assert.equal(pick({ ...n25, prev: n24 }, noonPT("2026-11-25")), null, "the next day: nothing until tonight's night is resolved");
  const n26 = { night: "2026-11-26", t0: Date.parse("2026-11-26T04:00:00Z"), shots: [] };
  assert.equal(pick({ ...n26, prev: n25 }, noonPT("2026-11-25")).key, "2026-11-26", "20:00 PT battle: fires at the Pacific 20:00 that evening");
  assert.equal(pick({ ...n26, prev: n25 }, Date.parse("2026-11-26T11:00:00Z")).key, "2026-11-26", "Berlin (noon 11:00 UTC): the next day's 20:00");
});

test("impact camera (Mike 11-26: 'the map jumps' at the hit, 'view right at the moment before impact'): settled before the lead impact, still through the hit, no jump frame to frame", () => {
  const clock = { t: at(16), p: 10000 }, d = data(); const Wd = world("day", clock, d); Wd.api.view(true); Wd.over(); Wd.api.replay();
  const R = Wd.rep().R, A = Wd.art;
  R.beats.filter((b) => !b.montage).forEach((b) => {
    const ts = A.bSettleAt(b), L = b.lead, hk = A.bHitK(b, 900, 600);
    assert.ok(L.ri - ts >= 400 && L.ri - ts <= 600, `settles 400-600 ms before the impact (${L.ri - ts})`);
    for (const t of [ts, ts + 1, L.ri - 1, L.ri, L.ri + 1, L.ri + 300, b.end - 1]) assert.deepEqual(A.bRepCam(R, t, Wd.rep().home, 900, 600, false), hk, `still at ${t - L.ri} ms from the impact`);
    // every target of the beat and every missile still in the air at the settle time are inside the settled frame
    const inF = (p) => { const sx = 450 + (p.x - hk.x) * hk.z, sy = 600 * .52 + (p.y - hk.y) * hk.z; return sx >= -1 && sx <= 901 && sy >= -1 && sy <= 601; };
    b.shots.forEach((s) => { if (s.to) assert.ok(inF(s.to), "target in frame"); });
  });
  // driven frame by frame at 60 fps from the two-shot to past the last hit: no step bigger than a smooth move (no snap)
  const b = R.beats[0], at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); };
  at0(b.launch); let px = Wd.camera.x, py = Wd.camera.y, pz = Wd.camera.z, worst = 0;
  for (let t = b.launch; t < b.end; t += 16) { at0(t); const dx = Math.hypot(Wd.camera.x - px, Wd.camera.y - py), dz = Math.abs(Wd.camera.z - pz) / pz; worst = Math.max(worst, dx); assert.ok(dz < .03, `zoom step ${dz.toFixed(3)} at ${t - b.lead.ri} ms`); px = Wd.camera.x; py = Wd.camera.y; pz = Wd.camera.z; }
  assert.ok(worst < 40, `largest pan step per frame ${worst.toFixed(1)} px`);
  Wd.api.stop();
});

test("replay one shot (Mike 11-26: 'see the exact hit of each one'): one beat per chosen shot in the given order, earlier hits already standing, settled before the impact, then it holds on the hit; Next stops there", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over();
  assert.equal(Wd.api.replay("shots", { only: [4] }), 8, "the whole night is loaded");
  const R = Wd.rep().R, P = Wd.rep().P, A = Wd.art; assert.equal(R.beats.length, 1); assert.equal(R.beats[0].lead.ix, 4, "the chosen shot");
  assert.ok(P.shots.filter((s) => s.ix < 4).every((s) => s.pre && s.ri < 0), "the shots before it have landed: the city stands as it did");
  assert.ok(P.shots.filter((s) => s.ix > 4).every((s) => s.rf > 1e12), "the shots after it never fire");
  const b = R.beats[0], L = b.lead, at0 = (ms) => { clock.p = 10000 + ms; Wd.bcam(); Wd.over(); return Wd.api.phase(); };
  assert.deepEqual(A.bRepCam(R, A.bSettleAt(b), Wd.rep().home, 900, 600, false), A.bHitK(b, 900, 600), "settled before the impact");
  let ph = at0(L.ri - 100); assert.equal(ph.oneDone, false); assert.deepEqual(ph.one, [4]);
  ph = at0(R.oneEnd + 50); assert.equal(ph.oneDone, true, "done after the hit and the callout"); assert.equal(ph.replay, true, "the replay holds on the hit (no results board)");
  const hk = A.bHitK(b, 900, 600); assert.ok(Math.abs((450 - Wd.camera.x) / Wd.camera.z - hk.x) < 1, "the camera stays on the hit");
  assert.equal(Wd.api.next(), false, "nothing after the last chosen shot");
  // Replay all: the given order, one at a time
  Wd.api.replay("shots", { only: [5, 0, 6] }); const R2 = Wd.rep().R; assert.deepEqual(R2.beats.map((x) => x.lead.ix), [5, 0, 6]);
  R2.beats.forEach((x, i) => { if (i) assert.ok(x.t0 >= R2.beats[i - 1].end, "never two strikes at once"); });
  assert.equal(Wd.api.replay("shots", { only: [99] }), 0, "an unknown shot plays nothing"); Wd.api.stop();
  assert.deepEqual(Object.keys(Wd.api.gaps()).filter((k) => +k < 7), [], "every member shot here has a launch and a landing point");
});

test("replay one shot: the settled frame is the hit alone, so on a phone the target sits near the centre, not at the edge", () => {
  const clock = { t: at(16), p: 10000 }, Wd = world("day", clock, data()); Wd.api.view(true); Wd.over();
  Wd.api.replay("shots", { only: [6] }); const b = Wd.rep().R.beats[0], L = b.lead, f = Wd.art.bHitK(b, 360, 600);
  assert.ok(Math.abs(f.x - L.to.x) < 2 && Math.abs(f.y - L.to.y) < 40, "centred on the target"); Wd.api.stop();
});
