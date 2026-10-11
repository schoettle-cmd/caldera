import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderProfile, scored } from "./render.build.mjs";
import * as C from "@caldera/core";
import { createHub } from "../../hub/dist/server.js";

const day = (i) => new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
const sample = () => ({
  name: "Ana <script>alert(1)</script>", handle: "ana", headline: "Builder", theme: "dark",
  links: [["Site", "https://example.com"]], properties: [["based", "Venice"]],
  sections: { journal: true, scoreboard: true, properties: true, numbers: true, topics: true, notes: true, asks: true, social: true, links: true },
  stats: { notes: 1200, words: 340000, links: 5100, activeDays: 90 },
  topics: [["AI", 12], ["Design", 4]],
  daily: [5, 4, 3, 2, 1, 0].map((i, k) => ({ date: day(i), counts: { notes: 3 + k, meetings: k, emails: 2 * k }, headline: k === 4 ? "Shipped the beta" : undefined, focus: k === 4 ? ["Beta"] : [] })),
  publicNotes: [{ title: "Why local-first", excerpt: "Because your notes are yours.", updated: new Date().toISOString() }],
  asks: [{ title: "Need a designer", bounty: 20 }], offers: [{ title: "Happy to review decks" }],
  social: { friends: 3, gravity: 2.5, credits: 120 }, updated: new Date().toISOString(),
});

test("renders a complete static profile and escapes user text", () => {
  const files = renderProfile(sample());
  assert.deepEqual(Object.keys(files).sort(), ["assets/favicon.svg", "assets/profile.css", "assets/theme.css", "index.html"]);
  const html = files["index.html"];
  assert.ok(!html.includes("<script>alert(1)</script>"), "name is escaped");
  assert.ok(html.includes("Need a designer") && html.includes("Why local-first") && html.includes('id="journal-data"'));
  assert.ok(files["assets/theme.css"].includes("--accent"), "design tokens shipped");
  assert.ok(files["assets/profile.css"].includes(".journal"), "components shipped");
});

test("sections can be switched off", () => {
  const p = sample(); for (const k of Object.keys(p.sections)) p.sections[k] = false;
  const html = renderProfile(p)["index.html"];
  assert.ok(!html.includes(`id="journal-data"`) && !html.includes("Need a designer") && !html.includes("Why local-first"));
});

test("journal scores and day-over-day deltas", () => {
  const d = scored(sample().daily);
  assert.equal(d[0].delta, null);
  assert.equal(d[1].score, 0.25 * 4 + 6 * 1 + 2 * 2);
});

test("end to end: plugin-style publish to a real hub, page is served", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "caldera-e2e-"));
  const hub = createHub({ dataDir: dir }); const base = "http://127.0.0.1:" + await hub.listen(0);
  const me = C.newIdentity(); const p = sample();
  const files = {}; for (const [k, v] of Object.entries(renderProfile(p))) files[k] = Buffer.from(v).toString("base64");
  const manifest = C.sign(me, "profile.manifest", { name: p.name, handle: "ana", boxKey: me.boxPublic, daily: p.daily.map(d => ({ date: d.date, score: C.activityScore(d.counts) })) });
  const r = await fetch(`${base}/v1/profiles/${me.id}/bundle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest, files }) }).then(r => r.json());
  assert.equal(r.url, "/@ana/");
  const page = await fetch(base + "/@ana/").then(r => r.text());
  assert.ok(page.includes("Shipped the beta"));
  const css = await fetch(base + "/@ana/assets/theme.css"); assert.equal(css.headers.get("content-type"), "text/css");
  hub.server.close(); fs.rmSync(dir, { recursive: true, force: true });
});

test("three columns: vault sidebar, graph + backlinks rail; switchable; escaped", () => {
  const p = { ...sample(), tree: [{ name: "People", child: false }, { name: "Ana", child: true, current: true }, { name: "Projects <b>", child: false }],
    graph: [{ t: "Garden app", n: 12 }, { t: "<img src=x>", n: 3 }], graphLabel: "Local graph / sized by linked notes",
    backlinks: [["Garden app", "builder"]], backlinkLabel: "Backlinks / 40 notes link here" };
  const html = renderProfile(p)["index.html"];
  assert.ok(html.includes('class="shell"') && html.includes('class="sidebar tree"') && html.includes('class="rail"'));
  assert.ok(html.includes("Local graph / sized by linked notes") && html.includes("Backlinks / 40 notes link here") && html.includes("<circle class=\"center\""));
  assert.ok(!html.includes("<img src=x>") && !html.includes("Projects <b>"), "sidebar and graph text escaped");
  const off = renderProfile({ ...p, sections: { ...p.sections, sidebar: false, rail: false } })["index.html"];
  assert.ok(!off.includes('class="sidebar tree"') && !off.includes('class="rail"'));
});

test("vault sidebar: linked items, collapsible groups, folder counts, on-this-page anchors", () => {
  const p = { ...sample(), tree: [{ name: "People", child: false }, { name: "Ana", child: true, current: true, href: "#top" },
      { name: "Projects", child: false }, { name: "Garden app", child: true, href: "https://garden.example" }, { name: "Plain", child: true },
      { name: "Bad", child: true, href: "javascript:alert(1)" }, { name: "Concepts", child: false, count: 54 }] };
  const html = renderProfile(p)["index.html"];
  assert.ok(html.includes('<details class="tree-group" open>') && html.includes('href="https://garden.example" target="_blank" rel="noopener"'));
  assert.ok(html.includes('<div class="tree-row child"><span>Plain</span></div>'), "unmatched items stay plain text");
  assert.ok(/class="tree-row group leaf">.*Concepts.*title="54 notes">54</.test(html), "folder-only group shows its count without a caret");
  assert.ok(html.includes('aria-current="page"') && !html.includes("javascript:"), "current marked; only http(s) and #anchors link");
  const toc = html.match(/<div class="toc">(.*?)<\/div>/)[1];
  for (const id of [...toc.matchAll(/href="#([^"]+)"/g)].map(m => m[1])) assert.ok(html.includes(`id="${id}"`), `anchor #${id} exists`);
});

test("full page: summary/now/activity/growth/knows/inbox/projects/code/timeline; safe inline links", () => {
  const heat = Array.from({ length: 30 }, (_, i) => ({ date: day(29 - i), n: i % 7 }));
  const p = { ...sample(),
    summary: "Builder in [[Venice|https://example.com/venice]]. **Bold** and [[bad|javascript:alert(1)]] <b>raw</b>",
    now: ["Testing **agents**"], timeline: [["2011", "Co-founded [[Studio|https://example.com]]"]],
    projects: [{ name: "Garden", status: "live", url: "https://garden.example", commits: 42 }, { name: "Bad", status: "x", url: "javascript:alert(1)" }],
    heat, growth: [{ week: day(21), total: 10 }, { week: day(14), total: 40 }, { week: day(7), total: 90 }],
    knows: [["Companies", 230], ["People", 82]],
    inbox: { kinds: [["Legal", 145], ["Reports", 55]], series: { label: "Pitch decks received per week", weeks: [["Jul 20", 1], ["Jul 27", 5]] } },
    code: { commits: 5706, repos: 29, languages: ["HTML", "Python"], weekly: [0, 3, 10, 4], url: "https://github.com/x", start: "Feb 2026" },
    extraNumbers: [["121", "daily digests written"]] };
  const html = renderProfile(p)["index.html"];
  for (const h of ["Summary", ">Now</h2>", ">Activity</h2>", ">Growth</h2>", ">What it knows</h2>", ">Inbox to knowledge</h2>", ">Projects</h2>", ">Code</h2>", ">Timeline</h2>", "daily digests written", "Your best other days"])
    assert.ok(html.includes(h), "missing " + h);
  assert.ok(html.includes('<a href="https://example.com/venice" rel="noopener">Venice</a>') && html.includes("<b>Bold</b>"));
  assert.ok(!/href="javascript/i.test(html), "no javascript: links anywhere");
  assert.ok(!html.includes("<b>raw</b>"), "raw HTML in text is escaped");
  const off = renderProfile({ ...p, sections: { ...p.sections, code: false, timeline: false, inbox: false } })["index.html"];
  assert.ok(!off.includes(">Code</h2>") && !off.includes(">Timeline</h2>") && !off.includes("Inbox to knowledge"));
});

test("AI usage: totals, per-day bars, model and provider shares; hidden when off or empty", () => {
  const p = { ...sample(), daily: sample().daily.map((d, i) => ({ ...d, tokens: i * 1e8 })),
    ai: { total: 7_675_123_642, window_days: 45, models: [["Claude Opus 5.5", 5_930_000_000], ["GPT-5 <x>", 256_000]], providers: [["Anthropic", 7_674_000_000], ["OpenAI", 712_069]], note: "Counts only." } };
  const html = renderProfile(p)["index.html"];
  assert.ok(html.includes(">AI usage</h2>") && html.includes("<b>7.68B</b> tokens") && html.includes("Models / share of tokens") && html.includes("Providers"));
  assert.ok(html.includes("77.3%") && html.includes("&lt;0.1%") && !html.includes("GPT-5 <x>"), "shares + escaping");
  assert.ok(!renderProfile({ ...p, sections: { ...p.sections, ai: false } })["index.html"].includes("AI usage"));
  assert.ok(!renderProfile(sample())["index.html"].includes("AI usage"));
});

test("timeline: eras, detail lines (links with | survive), repeated years shown once", () => {
  const html = renderProfile({ ...sample(), timeline: [["era", "Founder | 1995-2006"], ["2001", "Founded [[Userplane|https://u.example]] | Chat for the <early> web"], ["2001", "Second thing"], ["era", "Investor"]] })["index.html"];
  assert.ok(html.includes('<span class="era-name">Founder</span><span class="era-range">1995-2006</span>'));
  assert.ok(html.includes('<a href="https://u.example"') && html.includes('<div class="detail">Chat for the &lt;early&gt; web</div>'));
  assert.ok(html.includes('class="row same"><span class="year"></span>'));
});

test("leaderboard invite: buttons open one invite panel with the inviter's link", () => {
  const days = Array.from({ length: 10 }, (_, i) => ({ date: `2026-10-0${i}`, counts: { notes: i } }));
  const html = renderProfile({ ...sample(), handle: "ana", hub: "https://caldera.social", daily: days, sections: { ...sample().sections, scoreboard: true } })["index.html"];
  assert.equal((html.match(/data-invite href=/g) || []).length, 3);
  assert.equal((html.match(/class="invite-pop"/g) || []).length, 1);
  assert.ok(html.includes('data-url="https://caldera.social/?invite=ana#install"') && html.includes("Copy link"));
});

test("tab icon: round avatar when present, Caldera logo otherwise", () => {
  const a = renderProfile({ ...sample(), icon: "img/icon.png" });
  assert.ok(a["index.html"].includes('<link rel="icon" href="img/icon.png" type="image/png">') && a["index.html"].includes('rel="apple-touch-icon"'));
  const b = renderProfile({ ...sample() });
  assert.ok(b["index.html"].includes('<link rel="icon" href="assets/favicon.svg"') && b["assets/favicon.svg"].startsWith("<svg"));
});
