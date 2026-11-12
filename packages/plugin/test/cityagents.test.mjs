import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, AGENTS_JS } from "./city.build.mjs";

// a 2D context that accepts every call, refuses non-finite geometry and remembers the pills drawn
function stubCtx() {
  const n = { ops: 0 }, grad = { addColorStop() {} }, target = { canvas: { width: 10, height: 10 } };
  return new Proxy(target, {
    get(t, k) { if (k === "__n") return n; if (k in t) return t[k];
      if (k === "createLinearGradient" || k === "createRadialGradient") return (...a) => { for (const v of a) if (!Number.isFinite(v)) throw new Error(`non-finite gradient arg in ${String(k)}`); return grad; };
      if (k === "measureText") return () => ({ width: 10 }); if (k === "fillText") return (txt) => { n.ops++; (n.text = n.text || []).push(String(txt)); };
      return (...a) => { n.ops++; for (const v of a) if (typeof v === "number" && !Number.isFinite(v)) throw new Error(`non-finite arg to ${String(k)}`); }; },
    set(t, k, v) { t[k] = v; return true } });
}
/** a city with two districts: P has towers p1, p2, p3 and Q has q1; the public world flag off (a member's own page) */
function city(world = false) {
  const pre = `var TW=64,TH=32,W=24,H=24,D={world:${world}},NBS=[],NBM={},cam={x:300,y:200,z:1},labels=false,dirty=false,PILLS=[],MINI=false,reduce=false,LODN=1,PXS=2,dpr=2;function rnd(s){var x=Math.sin(s)*10000;return x-Math.floor(x)}function rgb(h){var n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]}function pxTex(k,w,h){return {ok:false,w:w,h:h}}function pxGlyph(){return {ok:false}}function pxBlit(){return false}
    var performance={now:function(){return CLOCK.p}};function iso(i,j){return {x:(i-j)*TW/2,y:(i+j)*TH/2}}
    function hash(t){var h=0;t=String(t);for(var i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))|0;return Math.abs(h)}
    function bh(r){return r.commits}function tronPill(c,x,y,text){PILLS.push(text)}function pxPill(c,x,y,text){PILLS.push(text)}
    var DP={name:'P'},DQ={name:'Q'},tiles={};for(var j=0;j<=H;j++)for(var i=0;i<=W;i++)tiles[i+','+j]={t:'g'};
    tiles['2,9']={t:'b',d:DP,r:{name:'p1',commits:40}};tiles['4,9']={t:'b',d:DP,r:{name:'p2',commits:20}};tiles['6,9']={t:'b',d:DP,r:{name:'p3',commits:30}};tiles['12,9']={t:'b',d:DQ,r:{name:'q1',commits:60}};`;
  const clock = { p: 1000 };
  const w = new Function("CLOCK", pre + AGENTS_JS + `; return {agentsIn:agentsIn,layout:agentLayout,draw:drawAgents,AG:function(){return AG},sum:function(){return AGSUM},pills:PILLS,setLabels:function(v){labels=v}}`)(clock);
  return { ...w, clock };
}
const agent = (id, state, extra = {}) => ({ id, state, label: "Claude · tron", ...extra });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function visible(lay) { return Object.keys(lay.spots).filter(id => !lay.spots[id].hidden).map(id => ({ id, ...lay.spots[id] })); }
function minGap(list) { let m = Infinity; for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) m = Math.min(m, dist(list[i], list[j])); return m; }

test("agents: N active agents in -> N drones on the map, each at its own spot, none parked", () => {
  const c = city(), list = [
    agent("w1", "working", { repo: "p1" }), agent("w2", "working", { repo: "p1" }), agent("w3", "working", { repo: "P1" }),   // three in one repo (case differs)
    agent("t1", "thinking", { repo: "q1" }),
    agent("d1", "working", { d: "P" }), agent("d2", "working", { d: "P" }),           // public page: district only
    agent("u1", "working"), agent("u2", "working", { repo: "not-a-building" }), agent("u3", "thinking", { d: "Nowhere" }), agent("u4", "working", { repo: "" }),   // nowhere to go
  ];
  c.agentsIn(list); const lay = c.layout(1000), vis = visible(lay), S = c.sum();
  assert.equal(Object.keys(lay.spots).length, 10, "every agent has a spot");
  assert.equal(vis.length, 10, "and every one of them is visible");
  assert.equal(S.dock, 0, "no active agent is parked"); assert.equal(S.fly, 6); assert.equal(S.hold, 4, "the four with no building hold in the air over the sky base");
  assert.ok(minGap(vis) >= 5, "no two drones on top of each other: min gap " + minGap(vis).toFixed(1));
  const onP1 = ["w1", "w2", "w3"].map(id => lay.spots[id]); assert.ok(onP1.every(s => s.n >= 3), "the three on p1 know they share the roof");
  const p1 = { x: (2 - 9) * 32, y: (2 + 9) * 16 - 40 - 24 }; assert.ok(onP1.every(s => dist(s, p1) < 40), "they ring the p1 roof");
  assert.notEqual(Math.round(lay.spots.d1.x / 64), Math.round(lay.spots.d2.x / 64), "two district-only agents take two different buildings");
  const ctx = stubCtx(); c.draw(ctx, 1000); c.draw(ctx, 1600); assert.ok(ctx.__n.ops > 50);
});

test("agents: quiet agents hover dim over their building; waiting, done and unplaced idle ones park on the deck", () => {
  const c = city(); c.agentsIn([agent("i1", "idle", { repo: "p2" }), agent("i2", "idle"), agent("x1", "done", { repo: "p2" }), agent("y1", "waiting", { repo: "p2" })]);
  const lay = c.layout(1000);
  assert.equal(lay.spots.i1.mode, "fly"); assert.equal(lay.spots.i1.dim, true); assert.equal(lay.spots.i1.roof, null, "no beam when idle");
  assert.equal(lay.spots.i2.mode, "dock"); assert.equal(lay.spots.x1.mode, "land", "a done agent lands on its roof"); assert.equal(lay.spots.y1.mode, "dock");
  assert.equal(minGap(visible(lay)) >= 4, true);
});

test("agents: the deck shows 24 parked drones and a +n badge for the rest, whatever the label setting; the ones waiting on you are never the hidden ones", () => {
  const c = city(), list = []; for (let i = 0; i < 70; i++) list.push(agent("p" + i, i % 10 === 0 ? "waiting" : "done"));
  c.agentsIn(list); const lay = c.layout(1000), S = c.sum();
  assert.equal(S.n, 70); assert.equal(S.dock, 24); assert.equal(S.hidden, 46);
  assert.ok(Object.keys(lay.spots).filter(id => lay.spots[id].hidden).every(id => c.AG()[id].a.state !== "waiting"));
  assert.ok(minGap(visible(lay)) >= 3.5, "parked drones keep apart: " + minGap(visible(lay)).toFixed(1));
  const cx = stubCtx(); c.draw(cx, 1000); assert.ok((cx.__n.text || []).includes("+46"), "the badge is drawn with labels off: " + (cx.__n.text || []).join("|"));
});

test("agents: the page keeps up to 200 agents and the HUD line knows about the ones in the air", () => {
  const c = city(), list = []; for (let i = 0; i < 230; i++) list.push(agent("a" + i, "working", { repo: "p3" }));
  c.agentsIn(list); assert.equal(Object.keys(c.AG()).length, 200); const lay = c.layout(1000); assert.equal(visible(lay).length, 200, "200 on one roof, all visible");
  assert.ok(CITY_JS.includes("function agentLayout") && CITY_JS.includes("AGSUM.hold"), "city.ts embeds the module and the HUD reads the hold count");
});
