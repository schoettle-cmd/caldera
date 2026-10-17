import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../dist/index.js";

test("ids round-trip through base58", () => {
  const me = C.newIdentity();
  assert.match(me.id, /^cal:[1-9A-HJ-NP-Za-km-z]+$/);
  assert.equal(C.idFromPublicKey(C.publicKeyFromId(me.id)), me.id);
});

test("canonical JSON sorts keys recursively", () => {
  assert.equal(C.canonical({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: null } }), '{"a":{"c":null,"d":[2,{"y":2,"z":1}]},"b":1}');
});

test("signed envelopes verify, and tampering is caught", () => {
  const me = C.newIdentity();
  const e = C.sign(me, "ask", { id: "ask_1", title: "Need an operator", bounty: 40 });
  assert.ok(C.verify(e));
  assert.equal(C.verify({ ...e, body: { ...e.body, bounty: 4000 } }), false);
  const other = C.newIdentity();
  assert.equal(C.verify({ ...e, from: other.id }), false);
});

test("cards are end-to-end encrypted between two vaults", () => {
  const a = C.newIdentity(), b = C.newIdentity(), eve = C.newIdentity();
  const sealed = C.seal("# Secret note\nhello", b.boxPublic, a);
  assert.equal(C.open(sealed, a.boxPublic, b), "# Secret note\nhello");
  assert.equal(C.open(sealed, a.boxPublic, eve), null);
});

test("gravity decays with a 30-day half-life and is weighted 1 to 2", () => {
  const now = Date.parse("2026-10-10T00:00:00Z");
  assert.equal(C.gravityScore([{ ts: "2026-10-10T00:00:00Z" }], now), 1);
  assert.equal(C.gravityScore([{ ts: "2026-09-10T00:00:00Z" }], now), 0.5);
  assert.equal(C.gravityScore([{ ts: "2026-10-10T00:00:00Z", giverWeight: 9 }], now), 2);
  assert.ok(C.giverWeight(0) === 1 && C.giverWeight(1e9) === 2);
});

test("activity score caps bulk imports", () => {
  assert.equal(C.activityScore({ meetings: 11, emails: 60, prompts: 144, commits: 37, notes: 1547, docs: 6 }), 370);
  assert.equal(C.activityScore({ notes: 1547 }), 15);
});

test("agent prompt: privacy rules always present; install steps only when not installed", async () => {
  const { agentPrompt } = await import("../dist/index.js");
  const fresh = agentPrompt({ hubUrl: "https://hub.example/" });
  assert.ok(fresh.includes("## 6. Privacy rules") && fresh.includes("Download https://hub.example/download/caldera-latest.zip"));
  assert.ok(fresh.includes("SAFE TO PASTE AGAIN") && fresh.includes('"prompt_version": ') && fresh.includes("Never create a second scheduled job"));
  assert.ok(fresh.includes("data.json"), "warns agent away from the key file");
  const mine = agentPrompt({ installed: true, vaultPath: "/v", handle: "mike", publicTopics: ["ai"] });
  assert.ok(!mine.includes("Download ") && mine.includes("/@mike/") && mine.includes("#ai") && mine.includes("/v/Caldera/activity.json"));
});

test("richer prompt: approval-gated, counts-only activity, key file off-limits", async () => {
  const { richerPrompt } = await import("../dist/index.js");
  const t = richerPrompt({ vaultPath: "/v" });
  assert.ok(t.includes("explicit yes first") && t.includes("Counts only") && t.includes("data.json") && t.includes("/v/Caldera/activity.json"));
  assert.ok(t.includes("## 4. Make the page rich") && t.includes("## 3. Routine"), "one prompt: richer is the setup prompt");
  assert.ok(!t.includes("If I did not fill this in"));
});

test("edit prompt: points at Caldera/profile.md, approval-gated, key file off-limits", async () => {
  const { editPrompt, agentPrompt } = await import("../dist/index.js");
  const t = editPrompt({ handle: "mike" });
  assert.ok(t.includes("Caldera/profile.md") && t.includes("/@mike/") && t.includes("before you make it") && t.includes("data.json"));
  assert.ok(agentPrompt().includes("Changing my page") && agentPrompt().includes("Caldera/profile.md"));
});

test("setup prompt covers installing Obsidian when missing; installed variant skips it", async () => {
  const { agentPrompt } = await import("../dist/index.js");
  const fresh = agentPrompt();
  assert.ok(fresh.includes("## 0. Obsidian itself") && fresh.includes("brew install --cask obsidian") && fresh.includes("winget install --id Obsidian.Obsidian") && fresh.includes("md.obsidian.Obsidian") && fresh.includes("Open folder as vault"));
  assert.ok(fresh.indexOf("## 0.") < fresh.indexOf("## 1. Install the plugin"));
  assert.ok(!agentPrompt({ installed: true }).includes("## 0. Obsidian itself"));
});

test("public text filter: blocks people, places, meetings, times, secrets, money, family; keeps public work", async () => {
  const { publicTextFilter } = await import("../dist/index.js");
  const f = publicTextFilter(["Mike Jones", "Human Architecture", "Inbox Hero", "Kitse"]);
  const keep = ["Rebuilt Human Architecture's daily readings and turned my Obsidian vault into dashboards", "Organizing my Obsidian vault into clear dashboards with Claude",
    "Making Human Architecture's daily readings the best in the category", "Shipped a new win-back sequence, ready to turn on once the copy is approved",
    "Launched a living profile page built from my Obsidian notes and GitHub activity", "Fixed bugs in Inbox Hero", "Building"];
  const drop = ["Coffee with Sarah at 10am to talk about the new app", "Met with the team in Santa Monica", "Call with investors about the term sheet", "Working on a stealth project",
    "Helped Peter Pham with a deck", "Closed a $2M round", "Lunch at Gjelina", "Took my daughter to school", "Prepared for the 3:30 board meeting", "Sent the draft to jane@acme.com",
    "Flew to Aspen", "Spoke with the lawyer about the contract", "Reviewed the confidential plan", "Office on 2nd Street"];
  for (const t of keep) assert.ok(f(t), "should keep: " + t + " (" + f.why(t) + ")");
  for (const t of drop) assert.ok(!f(t), "should drop: " + t);
});

test("all three prompts carry the full privacy policy", async () => {
  const { agentPrompt, richerPrompt, editPrompt, PRIVACY_RULES } = await import("../dist/index.js");
  for (const t of [agentPrompt(), agentPrompt({ installed: true }), richerPrompt(), editPrompt()]) {
    assert.ok(t.includes(PRIVACY_RULES));
    for (const k of ["Other people", "Meetings", "Times and places", "Secret or sensitive work", "get someone in trouble", "data.json"]) assert.ok(t.includes(k), k);
  }
});
