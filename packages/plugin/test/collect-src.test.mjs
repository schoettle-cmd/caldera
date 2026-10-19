import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// collect.ts needs Obsidian to run, so guard its profile fields at the source level: in 0.25.5-0.25.6 a trailing
// comment swallowed headline and theme, and every page shipped without them.
test("collect: the published profile carries the headline and theme from settings", () => {
  const code = fs.readFileSync(new URL("../src/collect.ts", import.meta.url), "utf8").replace(/\/\/[^\n]*/g, "");
  const data = code.slice(code.indexOf("const data: ProfileData = {"));
  for (const f of ["headline: s.headline", "theme: s.theme", "handle: s.handle"]) assert.ok(data.includes(f), `${f} missing from ProfileData`);
});
