import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../dist/index.js";

// words in the setup prompt that prove each feature in the inventory is covered
const MENTION = {
  journal: "caldera_headline", scoreboard: '"days"', now: '"now"', activity: "Activity counts", growth: "Notes are counted by the plugin",
  knows: '"knows"', inbox: '"inbox"', topics: "Public topics", projects: '"projects"', code: "city.json", ai: '"ai"',
  timeline: '"timeline"', sidebar: '"sidebar"', graph: '"graph"', garden: "caldera: garden", asks: "Post an ask", links: '"links"',
  masthead: "masthead", live: "t.js", agents: "agent-hook.mjs", weather: null, private: "Private web view", email: "Daily summary email",
  groups: "Groups", friends: "kudos",
};

test("setup prompt mentions every feature in the inventory (except purely automatic ones)", () => {
  const t = C.agentPrompt({ hubUrl: "https://caldera.social" });
  for (const f of C.FEATURES) {
    assert.ok(f.id in MENTION, `inventory feature ${f.id} has no prompt check`);
    if (MENTION[f.id]) assert.ok(t.includes(MENTION[f.id]), `prompt does not cover ${f.id} (${MENTION[f.id]})`);
  }
  assert.equal(C.PROMPT_VERSION, 3);
  assert.ok(t.includes("SAFE TO PASTE AGAIN") && t.includes("data.json") && t.includes("## 6. Privacy rules"));
});

test("unlock tier: not-applicable items are left out, done-ness passes through", () => {
  const items = C.unlockChecklist({ live: false, agents: true, ai: undefined, private: false, story: true, code: true });
  assert.deepEqual(items.map(i => i.id), ["live", "agents", "private", "story", "code"]);
  assert.deepEqual(items.filter(i => !i.done).map(i => i.id), ["live", "private"]);
});

test("feature prompts: each slice is self-contained, privacy-safe and never asks for the key file", () => {
  for (const id of ["live", "agents", "ai", "private", "story", "code", "email", "groups"]) {
    const t = C.featurePrompt(id, { handle: "x", vaultPath: "/v" });
    assert.ok(t.includes("/@x/") && t.includes("data.json") && t.length > 200, id);
  }
  assert.ok(C.featurePrompt("live", {}).includes("caldera('signup')"));
  assert.ok(C.featurePrompt("agents", { agentSetup: "MY OWN PROMPT" }) === "MY OWN PROMPT");
  assert.ok(C.featurePrompt("live", { hosted: true }).includes("/me"));
  const up = C.upgradePrompt(["live", "private"], { handle: "x" });
  assert.ok(up.includes("1. Live visitors") && up.includes("2. Private web view") && up.includes("t.js") && up.includes("data.json") && !up.includes("agent-hook"));
  assert.ok(C.upgradePrompt([], { handle: "x" }).includes("Nothing to do"));
});
