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
  assert.ok(fresh.includes("## 3. Privacy rules") && fresh.includes("Download https://hub.example/download/caldera-0.1.0.zip"));
  assert.ok(fresh.includes("data.json"), "warns agent away from the key file");
  const mine = agentPrompt({ installed: true, vaultPath: "/v", handle: "mike", publicTopics: ["ai"] });
  assert.ok(!mine.includes("Download ") && mine.includes("/@mike/") && mine.includes("#ai") && mine.includes("/v/Caldera/activity.json"));
});

test("richer prompt: approval-gated, counts-only activity, key file off-limits", async () => {
  const { richerPrompt } = await import("../dist/index.js");
  const t = richerPrompt({ vaultPath: "/v" });
  assert.ok(t.includes("explicit yes first") && t.includes("COUNTS ONLY") && t.includes("data.json") && t.includes("/v/Caldera/activity.json"));
  assert.ok(!t.includes("If I did not fill this in"));
});
