import { test } from "node:test";
import assert from "node:assert/strict";
import { renderOwner } from "./owner.build.mjs";
import { renderProfile } from "./render.build.mjs";
import * as C from "@caldera/core";

const now = "2026-10-15T20:00:00.000Z";
const base = () => ({ now, today: { date: "2026-10-15", timeline: [] }, onThisDay: [], patterns: [] });

test("owner layer: escaped, marked private, every section renders", () => {
  const html = renderOwner({ ...base(), lastLooked: "2026-10-15T17:00:00.000Z", pending: 2,
    activity: { since: now, views: 12, visitors: 5, totalViews: 300, pages: [["index.html", 8], ["n/gardens.html", 4]], days: [["2026-10-14", 3, 2], ["2026-10-15", 12, 5]],
      gravity: [{ from: "ana", reason: "<img src=x onerror=alert(1)>", ts: now }], friends: [{ handle: "bo", ts: now }], links: [{ src_handle: "cy", src_slug: "a", src_title: "On gardens", dst_slug: "gardens" }], asks: [] },
    today: { date: "2026-10-15", headline: "Shipped <b>it</b>", counts: { notes: 4 }, timeline: [{ title: "Plan", path: "wiki/Plan.md", time: "09:12", kind: "new" }] },
    onThisDay: [{ label: "A year ago", date: "2025-10-15", items: [{ title: "Old", path: "old.md", excerpt: "x" }] }],
    rediscovered: { title: "Forgotten", path: "f.md", excerpt: "y", why: "Connects." }, patterns: ["<b>3-day</b> streak."], goals: [{ heading: "Launch", done: 1, total: 3, open: ["Ship"] }] });
  assert.ok(html.includes("Only you can see this") && html.includes('id="owner"'));
  assert.ok(!html.includes("<img src=x") && html.includes("&lt;img src=x") && !html.includes("Shipped <b>it</b>"));
  for (const s of ["Since you last looked", "3h ago", "12</b><span>page views", "2 friend requests", "@ana", "@bo", "Today", 'data-open="wiki/Plan.md"', "On this day", "Brought back", "Patterns", "Goals", "1/3"]) assert.ok(html.includes(s), s);
});

test("owner layer: works offline / unpublished; goals prompt when there is no goals note", () => {
  const off = renderOwner({ ...base(), activity: { error: "offline" }, goals: null });
  assert.ok(off.includes("Couldn't reach the hub") && off.includes('data-action="goals"') && off.includes("Nothing written yet today"));
  assert.ok(renderOwner(base()).includes("Publish your profile to start seeing visits"));
});

test("published profile never contains the owner layer, only an empty marker", () => {
  const p = { name: "Mike", handle: "mike", links: [], properties: [], sections: { notes: true }, stats: { notes: 1, words: 1, links: 1, activeDays: 1 }, topics: [], daily: [],
    publicNotes: [], asks: [], offers: [], updated: now };
  const html = renderProfile(p)["index.html"];
  assert.ok(html.includes("<!--caldera:owner-->") && !html.includes("Only you can see this") && !html.includes('id="owner"'));
});

test("finish your page: first card, only what's left, image actions for photo and masthead", () => {
  const checklist = [
    { id: "photo", label: "Profile photo", why: "w", done: true }, { id: "banner", label: "Masthead", why: "A wide <cover>", done: false },
    { id: "group", label: "Join a group", why: "g", done: false }, { id: "email", label: "Daily summary email", why: "e", done: true }];
  const html = renderOwner({ ...base(), checklist });
  assert.ok(html.indexOf('id="ow-finish"') < html.indexOf('id="ow-since"'), "first card");
  assert.ok(html.includes("2 of 4 done") && html.includes('data-action="pick-banner"') && html.includes('data-action="prompt-banner"') && html.includes('data-action="settings"'));
  assert.ok(!html.includes('data-action="pick-photo"'), "done items aren't listed");
  assert.ok(html.includes("A wide &lt;cover&gt;"));
  assert.ok(!renderOwner({ ...base(), checklist: checklist.map(i => ({ ...i, done: true })) }).includes(`id="ow-finish"`), "hidden when complete");
});
