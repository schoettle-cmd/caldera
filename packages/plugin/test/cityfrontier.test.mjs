import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// MB 11-17 gaps: (1) a claimed land keeps its ring cell, lit; (2) a land added on the open world map appears at once.
test("frontier layout: a claimed member (world.fs) is laid out in the ring by its old slot, not in the member grid", () => {
  assert.match(CITY_JS, /else if\(FS\[n\.key\]\)\{n\.fs=1;n\.by=FS\[n\.key\]\.by\|\|null;n\.slot=FS\[n\.key\]\.slot\|\|0\}return !!\(n\.uc\|\|n\.fs\)/);
  assert.match(CITY_JS, /MEMS=NBS\.filter\(function\(n\)\{return !n\.uc&&!n\.fs\}\)/);
  assert.match(CITY_JS, /UCL\.sort\(function\(a,b\)\{return a\.slot-b\.slot/, "same order as when it was unclaimed, so the same cell");
});

test("frontier live add: spare ring cells, ring columns fit a 3x3 land, insert only into a cell that fits, reload-free API", () => {
  assert.match(CITY_JS, /UCSP=FRON\?6:0/); assert.match(CITY_JS, /cap>=UCL\.length\+UCSP/);
  assert.match(CITY_JS, /CWs\[ci0\]=Math\.max\(CWs\[ci0\]\|\|0,UCW\)/); assert.match(CITY_JS, /CHs\[rj0\]=Math\.max\(CHs\[rj0\]\|\|0,UCW\)/);
  assert.match(CITY_JS, /if\(fit&&!\(\(CWs\[c\[0\]\]\|\|0\)>=n\.w&&\(CHs\[c\[1\]\]\|\|0\)>=n\.h\)\)return;/);
  assert.match(CITY_JS, /function ucInsert\(d,meta,mine\)\{if\(!D\.world\|\|!RING\|\|!d\|\|typeof d\.nb!=='string'\|\|!Array\.isArray\(d\.repos\)\)return null;if\(NBM\[d\.nb\]\)return/);
  for (const f of ["nbPack(n)", "nbPlace(n)", "nbStreet(n)", "NBS.push(n)", "byName[n.key]=n.rep", "D.districts.push(d)", "dirty=true"]) assert.ok(CITY_JS.includes(f), f);
  assert.match(CITY_JS, /window\.CALDERA_FRONTIER_ADD=function\(d,meta,fly\)\{try\{/);
  assert.match(CITY_JS, /window\.CALDERA_FRONTIER_FOCUS=function\(key\)/);
});

test("frontier arrival (J7): 700 ms fade-in, 200 ms with reduced motion, no animation for more than 3 in 1 s, other members' adds from the live poll", () => {
  assert.match(CITY_JS, /if\(reduce\)return Math\.min\(1,e\/200\)/);
  assert.match(CITY_JS, /n\.born=UCARR\.length>3\?0:t/);
  assert.match(CITY_JS, /if\(D\.world&&ucAnim\(\)\)dirty=true;/);
  assert.match(CITY_JS, /c\.globalAlpha=UCF\[ucSky\(\)\]\.alpha\*ucK\(NBM\[t\.d\.nb\],0,500\)/);
  assert.match(CITY_JS, /Array\.isArray\(data\.lands\)\)data\.lands\.slice\(0,20\)\.forEach\(function\(x\)\{if\(x&&x\.district&&!NBM\[x\.district\.nb\]\)try\{ucInsert\(x\.district,x\.meta,false\)/);
  assert.match(CITY_JS, /function ucHl\(n\)\{if\(!n\|\|!n\.born\|\|!n\.mine\|\|reduce\)return \.7;/, "only the adder sees the label highlight");
});
