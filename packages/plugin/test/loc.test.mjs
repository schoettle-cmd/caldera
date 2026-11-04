import { test } from "node:test";
import assert from "node:assert/strict";
import { remoteSlug, linesOfCode, gitLinesDetail } from "./gitlines.build.mjs";
import { renderProfile, locSection } from "./render.build.mjs";

const day = (n, now) => { const d = new Date(now - n * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const NOW = new Date("2026-11-04T15:00:00").getTime();

test("loc: GitHub remotes become owner/name (https and ssh); anything else is unnamed", () => {
  assert.equal(remoteSlug("https://github.com/schoettle-cmd/Caldera.git"), "schoettle-cmd/caldera");
  assert.equal(remoteSlug("git@github.com:schoettle-cmd/caldera-hub.git"), "schoettle-cmd/caldera-hub");
  assert.equal(remoteSlug("https://gitlab.com/a/b.git"), "");
  assert.equal(remoteSlug(""), "");
});

test("loc: per-repo lines only for repos the public page already names; private ones count in totals only", () => {
  const g = { days: { [day(0, NOW)]: { added: 500, removed: 40 }, [day(3, NOW)]: { added: 100, removed: 10 }, [day(40, NOW)]: { added: 7, removed: 1 } },
    repos: [
      { slug: "me/web", days: { [day(0, NOW)]: { added: 300, removed: 20 }, [day(40, NOW)]: { added: 7, removed: 1 } } },
      { slug: "me/secret-app", days: { [day(0, NOW)]: { added: 150, removed: 15 } } },
      { slug: "me/named-private", days: { [day(3, NOW)]: { added: 100, removed: 10 } } },
      { slug: "", days: { [day(0, NOW)]: { added: 50, removed: 5 } } },
    ] };
  const city = { private: false, districts: [{ name: "Acme", notes: 0, repos: [
    { name: "web", project: "Acme", public: true, url: "https://github.com/me/web", language: "TS", commits: 1, weeks: [], week: 0, today: 0 },
    { name: "", project: "Acme", public: false, locked: true, language: "Private", commits: 1, weeks: [], week: 0, today: 0 },   // secret-app, padlocked
    { name: "named-private", project: "Acme", public: false, priv: true, language: "Go", commits: 1, weeks: [], week: 0, today: 0 },
  ] }] };
  const L = linesOfCode(g, city, undefined, NOW);
  assert.equal(L.days.length, 90);
  assert.deepEqual(L.days.at(-1), [day(0, NOW), 500, 40], "today's total includes the private repo and the unnamed one");
  assert.deepEqual(L.repos, [["web", "https://github.com/me/web", 300, 20], ["named-private", "", 100, 10]], "30 days, named repos only; private ones never linked");
  assert.ok(!JSON.stringify(L).includes("secret-app"), "a padlocked repo is never named");
  const ext = new Map([[day(0, NOW), { linesAdded: 9, linesRemoved: 2 }]]);
  assert.deepEqual(linesOfCode(g, city, ext, NOW).days.at(-1), [day(0, NOW), 9, 2], "an owner tool's numbers win for their day");
  assert.deepEqual(linesOfCode(g, undefined, undefined, NOW).repos, [], "no public city: no repo names at all");
});

test("loc: local git per repo (one clone counted once), merges excluded by the git query, totals summed", async () => {
  const repos = { "/h/a": "https://github.com/me/web.git", "/h/b": "git@github.com:me/web.git", "/h/c": "" };
  const log = "\x1e2026-11-04\x1fme@x.com\n120\t10\tsrc/a.ts\n9000\t0\tbig.sql\n5\t5\tpackage-lock.json\n";
  const calls = [];
  const mods = {
    os: { homedir: () => "/h" }, path: { join: (...a) => a.join("/").replace(/\/+/g, "/") },
    fs: { promises: { readdir: async d => d === "/h" ? ["a", "b", "c"].map(n => ({ name: n, isDirectory: () => true })) : [], stat: async p => { if (!/^\/h\/[abc]\/\.git$/.test(p)) throw new Error("ENOENT"); return { mtimeMs: Date.now(), isDirectory: () => false }; }, realpath: async p => p } },
    cp: { execFile: (cmd, args, o, cb) => { calls.push(args.join(" ")); if (args[0] === "config") return cb(null, "me@x.com\n"); if (args[0] === "remote") return repos[o.cwd] ? cb(null, repos[o.cwd] + "\n") : cb(new Error("no remote")); return cb(null, log); } },
  };
  const g = await gitLinesDetail(mods, 90, []);
  assert.deepEqual(g.days["2026-11-04"], { added: 240, removed: 20 }, "two repos (web once + the unnamed one); the huge file and the lockfile don't count");
  assert.deepEqual(g.repos.map(r => r.slug), ["me/web", ""]);
  assert.ok(calls.filter(c => c.startsWith("log")).every(c => c.includes("--no-merges") && c.includes("--author=<me@x\\.com>")), "own commits only, no merges");
});

test("loc: the section (today / 7 / 30 days, 7-30-90 chart with hover, public repos) and it is opt-in", () => {
  const days = Array.from({ length: 90 }, (_, i) => [day(89 - i, NOW), i % 3 ? 100 + i : 0, i % 4 ? 20 : 0]);
  const html = locSection({ days, repos: [["web", "https://github.com/me/web", 900, 80]] });
  assert.ok(/<h2>Lines of code<\/h2>/.test(html));
  assert.equal((html.match(/class="loc-chart"/g) || []).length, 3);
  assert.equal((html.match(/class="loc-chart"[^>]* hidden/g) || []).length, 2, "30 days shown first");
  assert.ok(html.includes("today") && html.includes("last 7 days") && html.includes("last 30 days"));
  assert.ok(!/streak/i.test(html), "no streaks");
  assert.ok(html.includes('data-a="') && html.includes("<title>"), "hover values on every day");
  assert.ok(html.includes('href="https://github.com/me/web"'));
  const base = { name: "A", handle: "a", sections: { loc: true }, daily: [], topics: [], links: [], properties: [], publicNotes: [], stats: { notes: 0, words: 0, links: 0, activeDays: 0 }, updated: "2026-11-04T00:00:00Z", loc: { days, repos: [] } };
  assert.ok(renderProfile(base)["index.html"].includes('id="loc"'));
  assert.ok(!renderProfile({ ...base, sections: {} })["index.html"].includes('id="loc"'), "off unless the owner turns it on");
});
