import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS, LEGEND_JS } from "./city.build.mjs";

// the pure row builder, with the module's globals stubbed (no DOM)
function legend() {
  const pre = `var localStorage={getItem:function(){return null},setItem:function(){}},document={getElementById:function(){return null}},MINI=false,st=null,LV={mode:'private'},LIFE={};`;
  return new Function(pre + LEGEND_JS + `; return {rows:legendRows,css:LEG_CSS,col:LEG_COL}`)();
}
const counts = (o) => ({ walk: { n: 12, raw: 12 }, stroll: { n: 4, raw: 4 }, cars: { n: 24, raw: 31 }, vans: { n: 3, raw: 3 }, scoots: { n: 5, raw: 5 }, bus: { n: 1, raw: 1 }, agents: { working: 5, thinking: 1, waiting: 2 }, steam: 7, crews: 2, mode: "private", ...o });

test("legend: the owner's rows state the numbers, '= fact', how they are computed, and +n for what the caps left undrawn", () => {
  const L = legend(); const rows = L.rows(counts(), "private");
  assert.deepEqual(rows.map(r => r.cls), ["walk", "stroll", "cars", "vans", "scoots", "bus", "drones", "steam"], "rows in the design's order");
  const by = Object.fromEntries(rows.map(r => [r.cls, r]));
  assert.equal(by.walk.label, "12 walking"); assert.equal(by.walk.fact, "12 people on your sites now");
  assert.equal(by.cars.label, "24 cars +7", "31 in the data, 24 drawn: the count is the data"); assert.match(by.cars.fact, /views ÷ 400/);
  assert.equal(by.vans.label, "3 vans"); assert.equal(by.vans.fact, "3 sales today"); assert.equal(by.scoots.fact, "5 signups today");
  assert.equal(by.bus.label, "1 bus"); assert.equal(L.rows(counts({ bus: { n: 2, raw: 2 } }), "private").find(r => r.cls === "bus").label, "2 buses");
  assert.equal(by.drones.label, "5 working · 1 thinking · 2 waiting on you"); assert.equal(by.steam.label, "7 roofs steaming");
  rows.forEach(r => { assert.ok(r.how.length > 30, r.cls + " says how it is computed"); assert.equal(r.col, L.col[r.cls]); });
});

test("legend: the public page gets the facts without numbers, and never vans, scooters, strollers or a bus", () => {
  const rows = legend().rows(counts({ mode: "public" }), "public");
  assert.deepEqual(rows.map(r => r.cls), ["walk", "cars", "drones", "steam"]);
  assert.equal(rows[0].label, "walking"); assert.equal(rows[0].fact, "people on these sites now"); assert.equal(rows[1].fact, "page views and commits this week");
});

test("legend: the chip, panel and CSS come from the script (hosted pages are only script-upgraded), with light theme, phone sheet and the mini page hidden", () => {
  const L = legend();
  assert.ok(L.css.includes("html[data-theme=light] .c-lgd{") && L.css.includes(".c-lgd.sheet{") && L.css.includes("html.c-mini .c-lgd"));
  assert.ok(CITY_JS.includes("function legendInit()") && CITY_JS.includes("chip.id='t-legend'") && CITY_JS.includes("ev.key!=='l'&&ev.key!=='L'"), "the toolbar chip is created when the page has none; keyboard L");
  assert.ok(CITY_JS.includes("lgd-open") && CITY_JS.includes("legendToggle(true)"), "the LIVE pill links to it");
  assert.ok(CITY_JS.includes("LIFE.hl=r.getAttribute('data-cls')"), "tapping a row highlights that element class");
});
