import { test } from "node:test";
import assert from "node:assert/strict";
import { labelOf, vaultTags, topicsInUse, githubLogin } from "./suggest.build.mjs";

const app = files => ({ vault: { getMarkdownFiles: () => files.map((tags, i) => ({ path: tags.path || `n${i}.md`, tags })) },
  metadataCache: { getFileCache: f => ({ tags: f.tags.map(t => "#" + t) }) } });

test("labels read like topics", () => {
  assert.equal(labelOf("tools-for-thought"), "Tools for thought");
  assert.equal(labelOf("ai"), "AI"); assert.equal(labelOf("dev/rust"), "Rust"); assert.equal(labelOf("#machineLearning"), "Machine learning");
});

test("vault tags: most used first, workflow and private tags, dates and one-offs left out", () => {
  const a = app([["ai", "startups", "private"], ["ai", "startups", "todo"], ["ai", "daily", "2024-q1"], ["once"], ["private", "todo", "2024-q1", "status/done", "status/done"]]);
  assert.deepEqual(vaultTags(a).map(t => [t.tag, t.count]), [["ai", 3], ["startups", 2]]);
  assert.equal(topicsInUse(a, [["ai", "AI"], ["design", "Design"]]), 1);
  assert.equal(topicsInUse(a, [["design", "Design"]]), 0, "the default list that matches nothing");
  const w = app([["entity", "pdf", "email-attachment", "daily-digest", "contract", "crypto"], ["entity", "pdf", "email-attachment", "daily-digest", "contract", "crypto"]]);
  assert.deepEqual(vaultTags(w).map(t => t.tag), ["crypto"], "structural tags and deal paperwork aren't topics");
});

test("GitHub login from links", () => {
  assert.equal(githubLogin([["Site", "https://x.dev"], ["GitHub", "https://github.com/ada-l/"]]), "ada-l");
  assert.equal(githubLogin([["Repo", "https://github.com/ada/repo"]]), null, "a repo link isn't a profile");
});
