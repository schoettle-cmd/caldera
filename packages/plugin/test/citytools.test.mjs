import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_JS } from "./city.build.mjs";

// Mike 11-19 (Duo landscape): the toolbar wrapped into tall circles over the map. One row always; what doesn't fit goes
// into a More menu, least used first; Full screen never moves; the CSS rides in the script for published pages.
test("toolbar: one row, overflow into More, least used first", () => {
  const i = CITY_JS.indexOf("function toolsFit()"); assert.ok(i > 0);
  const code = CITY_JS.slice(i, i + 4000);
  assert.match(CITY_JS, /MORDER=\['t-legend','t-topics','t-sky','t-wx','t-sf','t-under','\*','t-pop','t-snd','t-reset','t-fr','t-stores','t-labels'\]/);
  assert.match(code, /flex-wrap:nowrap!important;overflow:visible!important;z-index:20/);
  assert.match(code, /b\.id!=='t-full'/, "Full screen never goes into the menu");
  assert.match(code, /if\(used\(\)<=avail\)\{moreOpen\(false\);return\}/);
  assert.match(code, /tb\.classList\.add\('tight'\)/);
  assert.match(CITY_JS, /legendInit\(\);toolsFit\(\);setTimeout\(toolsFit,600\);window\.addEventListener\('resize',function\(\)\{toolsFit\(\)\}\)/);
  assert.match(CITY_JS, /e\.key==='Escape'&&MOREP&&!MOREP\.hidden/);
});
