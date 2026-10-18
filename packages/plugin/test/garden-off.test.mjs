import { test } from "node:test";
import assert from "node:assert/strict";
import { renderProfile } from "./render.build.mjs";
import { excerptOf } from "./garden.build.mjs";
import * as C from "@caldera/core";

const note = (title, markdown) => ({ slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title, stage: "seedling", license: "all-rights",
  created: "2026-10-01T00:00:00.000Z", updated: "2026-10-12T00:00:00.000Z", markdown, sha256: "f".repeat(64), words: 10, excerpt: excerptOf(markdown), out: [], xlinks: [], tags: [] });

test("garden paused: a profile with garden notes publishes no garden pages, section, nav link or stylesheet", () => {
  assert.equal(C.gardenEnabled(), false);
  const p = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true, sidebar: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [],
    publicNotes: [], asks: [], offers: [], updated: new Date().toISOString(), garden: [note("Gardens", "Gardens beat streams, every time.")], gardenExternal: "https://garden.example",
    tree: [{ name: "People", child: false }, { name: "Mike", child: true, current: true, href: "#top" }] };
  const files = renderProfile(p);
  assert.ok(!files["garden.html"] && !Object.keys(files).some(k => k.startsWith("n/")), "no garden pages");
  const html = files["index.html"];
  assert.ok(!/garden/i.test(html.replace(/garden\.example/g, "")) || !html.includes("Garden home"), "no garden section or nav link");
  assert.ok(!html.includes("Garden home") && !html.includes('id="garden"') && !html.includes("garden.css") && !html.includes("garden.example"));
  C.FLAGS.garden = true;
  try { const on = renderProfile(p); assert.ok(on["garden.html"] && on["index.html"].includes("Garden home")); } finally { C.FLAGS.garden = false; }
});
