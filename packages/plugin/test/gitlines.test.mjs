import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cp from "node:child_process";
import { parseNumstat, findRepos, gitLines } from "./gitlines.build.mjs";

test("numstat: lines per day; binary, lockfiles, build output and huge single-file changes don't count", () => {
  const out = "\x1e2026-10-24\x1fme@x.dev\n10\t2\tsrc/a.ts\n-\t-\timg.png\n500\t0\tpackage-lock.json\n9000\t0\tsrc/vendor.js\n3\t1\tdist/main.js\n\n\x1e2026-10-24\x1fme@x.dev\n5\t5\tsrc/{old => new}.ts\n\x1e2026-10-25\x1fme@x.dev\n1\t0\tREADME.md";
  assert.deepEqual(parseNumstat(out), { "2026-10-24": { added: 15, removed: 7 }, "2026-10-25": { added: 1, removed: 0 } });
});

test("git repos on this computer: only my commits, counted per local day; no repos = unknown (undefined)", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "caldera-gitlines-"));
  const mods = { fs, path, os: { homedir: () => home }, cp };
  assert.equal(await gitLines(mods, 14, ["~/nothing-here"]), undefined, "no repos: unknown, not zero");
  const repo = path.join(home, "code", "proj"); fs.mkdirSync(repo, { recursive: true });
  fs.mkdirSync(path.join(home, "Documents", "secret"), { recursive: true }); fs.mkdirSync(path.join(home, "Documents", "secret", ".git"));
  const git = (...a) => cp.execFileSync("git", a, { cwd: repo, env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" } });
  git("init", "-q"); git("config", "user.email", "me@x.dev"); git("config", "user.name", "Me");
  fs.writeFileSync(path.join(repo, "a.ts"), "1\n2\n3\n"); git("add", "."); git("commit", "-q", "-m", "mine");
  fs.writeFileSync(path.join(repo, "b.ts"), "x\n"); git("add", "."); git("-c", "user.email=other@x.dev", "commit", "-q", "-m", "theirs", "--author", "Other <other@x.dev>");
  const repos = await findRepos(mods, 14);
  assert.deepEqual(repos, [repo], "found under ~/code; protected folders like Documents are never looked in");
  const v = await gitLines(mods, 13, []);   // a different key than the memoized call above
  const d = new Date(), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.deepEqual(v, { [day]: { added: 3, removed: 0 } }, "only the repo user's own commits");
  assert.ok(!JSON.stringify(v).includes("proj"), "no repo names");
  fs.rmSync(home, { recursive: true, force: true });
});
