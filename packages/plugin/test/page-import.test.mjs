import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { after as __afterAll } from "node:test";
const __tmpDirs = [];
const __mkdtemp = (p) => { const d = fs.mkdtempSync(p); __tmpDirs.push(d); return d; };
__afterAll(() => { for (const d of __tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });   // temp hubs are removed after the file's tests, even when one fails
const out = path.join(__mkdtemp(path.join(os.tmpdir(), "pi-")), "pi.mjs");
buildSync({ entryPoints: [new URL("../src/page-import.ts", import.meta.url).pathname], outfile: out, format: "esm", bundle: true });
const { fillFromPage, isPageCode, photoPlan } = await import(out);
const page = { name: "Olive", headline: "Builds", summary: "About", now: ["x"], links: [["a", "b"]], timeline: [["2020", "y"]], projects: [["p", "q"]] };
test("an empty vault gets the page", () => { const r = fillFromPage({ name: "", headline: "", summary: "", now: [], links: [], timeline: [], projects: [] }, page); assert.deepEqual({ name: r.name, summary: r.summary, projects: r.projects, links: r.links }, { name: "Olive", summary: "About", projects: page.projects, links: page.links }); });
test("what the vault already has never changes", () => { const r = fillFromPage({ name: "Me", headline: "Mine", summary: "Mine", now: ["mine"], links: [["m", "n"]], timeline: [], projects: [] , theme: "dark" }, page); assert.equal(r.name, "Me"); assert.deepEqual(r.now, ["mine"]); assert.deepEqual(r.links, [["m", "n"]]); assert.equal(r.theme, "dark"); assert.deepEqual(r.timeline, page.timeline); });
test("page codes are told apart from GitHub codes", () => { assert.ok(isPageCode("CAL-P-abcdefghij12")); assert.ok(!isPageCode("CAL-abcdef")); });
test("the photo comes only when the vault has none", () => { assert.deepEqual(photoPlan("", "https://h.test/", "ann", "png"), { from: "https://h.test/@ann/img/photo.png", to: "Caldera/photo.png" }); assert.equal(photoPlan("Caldera/me.jpg", "https://h", "ann", "png"), null); assert.equal(photoPlan("", "https://h", "ann", ""), null); assert.equal(photoPlan("", "https://h", "ann", "svg"), null); assert.equal(photoPlan("", "https://h", "../x", "png"), null); });
