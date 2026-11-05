import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { inFolder, normFolder, scopeOf, suggestedScope, scopeRoot, scopeEmpty, inScope, topmost, defaultExclusions, isPrivateNote, countScope, scopeLabel, scanSecrets, buildNote, batches, IhSyncEngine, ihApiOk, ihTokenOk, IH_API_DEFAULT, skippedMessage, entropy } from "./ihsync.build.mjs";

const TOKEN = "iho_" + "A".repeat(20) + "b1_-" + "x".repeat(19);
const CODE = "ihp_" + "Q".repeat(32);

// ---- a fake vault that only allows reading; any write method throws and is recorded
function fakeVault(files) {
  const reads = [], writes = [];
  const base = {
    getMarkdownFiles: () => Object.keys(files).filter(p => p.endsWith(".md")).map(p => ({ path: p, stat: { mtime: 1793900000000, size: files[p].length } })),
    cachedRead: async f => { reads.push(f.path); return files[f.path]; },
  };
  const v = new Proxy(base, { get(t, k) { if (k in t) return t[k]; return (...a) => { writes.push(String(k)); throw new Error("write attempted: " + String(k)); }; } });
  return { v, reads, writes };
}
// a fake Inbox Hero: records every request, answers like the contract
function fakeIh(opts = {}) {
  const calls = [], store = new Map(); let folder = opts.folder ?? null, flip409 = !!opts.conflictOnce;
  const req = async o => {
    calls.push(o); const u = new URL(o.url), body = o.body ? JSON.parse(o.body) : null;
    if (u.pathname === "/api/obsidian/pair") return body.code === CODE ? { status: 200, json: { ok: true, token: TOKEN } } : { status: 401, json: { error: "bad_code" } };
    if (o.headers.authorization !== "Bearer " + TOKEN) return { status: 401, json: { error: "revoked" } };
    if (u.pathname === "/api/obsidian/limits") return { status: 200, json: { maxNoteBytes: opts.maxNoteBytes || 2_000_000, maxTotalBytes: 50_000_000, maxNotes: 5000, maxBatchNotes: opts.maxBatchNotes || 50, maxBatchBytes: 4_000_000, folder, notes: store.size, bytes: 0 } };
    if (u.pathname === "/api/obsidian/notes") {
      if (flip409) { flip409 = false; return { status: 409, json: { error: "folder_changed" } }; }
      if (opts.max413 && body.notes.length > opts.max413) return { status: 413, json: { error: "too_big" } };
      if (folder && body.folder !== folder) return { status: 409, json: { error: "folder_changed" } };
      folder = body.folder; let unchanged = 0; for (const n of body.notes) { if (store.get(n.path)?.hash === n.hash) unchanged++; store.set(n.path, n); }
      return { status: 200, json: { ok: true, accepted: body.notes.length - unchanged, unchanged, rejected: [] } };
    }
    if (u.pathname === "/api/obsidian/notes/delete") { for (const p of body.paths) store.delete(p); return { status: 200, json: { ok: true } }; }
    if (u.pathname === "/api/obsidian/resync") { folder = body.folder; let removed = 0; for (const p of [...store.keys()]) if (!body.paths.includes(p)) { store.delete(p); removed++; } return { status: 200, json: { ok: true, removed } }; }
    if (u.pathname === "/api/obsidian/disconnect") { const n = store.size; store.clear(); return { status: 200, json: { ok: true, deleted: n } }; }
    return { status: 404, json: null };
  };
  return { req, calls, store, get folder() { return folder; } };
}
const files = () => ({
  "Work/People/Jordan.md": "---\ncompany: Harborlane\naliases: [JA]\ntags: [cfo]\n---\nMet [[Harborlane]] about [[Q4 planning|Q4]] #intro\n",
  "Work/Plan.md": "Plan for the quarter. See [[Jordan]].",
  "Work/keys.md": "aws: AKIAIOSFODNN7EXAMPLE and more",
  "Work/image.png": "binary",
  "Personal/Diary.md": "my private diary",
  "Workshop/Other.md": "not in Work",
  "Caldera/profile.md": "---\nname: Mike\n---",
});
const cache = p => p === "Work/People/Jordan.md" ? { frontmatter: { company: "Harborlane", aliases: ["JA"], tags: ["cfo"], position: {} }, links: [{ link: "Harborlane" }, { link: "Q4 planning" }], tags: [{ tag: "#intro" }] } : null;

test("connector: folder scoping (only that folder's .md notes, subfolders included, no folder = nothing)", async () => {
  assert.ok(inFolder("Work/a.md", "Work") && inFolder("Work/x/y.md", "/Work/") && !inFolder("Workshop/a.md", "Work") && !inFolder("Work/a.png", "Work") && !inFolder("a.md", "") && !inFolder("Work/../Personal/a.md", "Work"));
  assert.equal(normFolder(" /Work/People/ "), "Work/People");
  const { v, reads } = fakeVault(files()), ih = fakeIh(), st = { token: TOKEN, folder: "Work" };
  const r = await new IhSyncEngine(st, v, cache, ih.req, "Mike").sync(true);
  assert.deepEqual([...ih.store.keys()].sort(), ["Work/People/Jordan.md", "Work/Plan.md"]);
  assert.ok(reads.every(p => p.startsWith("Work/")), "nothing outside the folder is even read: " + reads);
  assert.equal(r.sent, 2);
  const none = fakeVault(files()), ih2 = fakeIh();
  assert.deepEqual(await new IhSyncEngine({ token: TOKEN, folder: "" }, none.v, cache, ih2.req, "Mike").sync(true), { sent: 0, removed: 0, skipped: [], unchanged: 0 });
  assert.equal(none.reads.length + ih2.calls.length, 0, "no folder chosen: no reads, no requests");
});

test("connector: payload (path, title, frontmatter, body, mtime, wikilinks, tags; hash = sha256 of body)", async () => {
  const { v } = fakeVault(files()), ih = fakeIh();
  await new IhSyncEngine({ token: TOKEN, folder: "Work/People" }, v, cache, ih.req, "Mike").sync(true);
  const n = ih.store.get("Work/People/Jordan.md");
  assert.equal(n.title, "Jordan"); assert.deepEqual(n.frontmatter, { company: "Harborlane", aliases: ["JA"], tags: ["cfo"] });
  assert.equal(n.body, "Met [[Harborlane]] about [[Q4 planning|Q4]] #intro\n");
  assert.deepEqual(n.wikilinks, ["Harborlane", "Q4 planning"]); assert.deepEqual(n.tags.sort(), ["cfo", "intro"]);
  assert.equal(n.mtime, 1793900000000);
  const crypto = await import("node:crypto"); assert.equal(n.hash, crypto.createHash("sha256").update(n.body).digest("hex"));
  const big = buildNote("a.md", "x", 1, { frontmatter: { nested: { a: 1 }, huge: "z".repeat(20000) } }, "h");
  assert.equal(big.frontmatter.nested, '{"a":1}'); assert.equal(big.frontmatter.huge, undefined, "frontmatter kept under 16 KB");
  const notes = Array.from({ length: 120 }, (_, i) => buildNote("W/" + i + ".md", "b", 1, null, "h"));
  assert.deepEqual(batches(notes, { maxBatchNotes: 50, maxBatchBytes: 4e6 }).map(b => b.length), [50, 50, 20]);
});

test("connector: secret scanner flags secrets and passes ordinary notes", () => {
  const yes = {
    "AWS key": "key AKIAIOSFODNN7EXAMPLE",
    "private key": "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjE=\n-----END OPENSSH PRIVATE KEY-----",
    "GitHub token": "token ghp_" + "a1B2c3D4e5".repeat(4),
    "Stripe": "sk_live_" + "4eC39HqLyjWDarjtT1zdp7dc",
    "OpenAI": "OPENAI=sk-proj-" + "Abc123Xyz789".repeat(3),
    "Anthropic": "sk-ant-api03-" + "AbCdEf123456".repeat(4),
    "Slack": "xoxb-123456789012-abcdefghijkl",
    "Google": "AIza" + "SyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY",
    "JWT": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    "password": "wifi password: hunter22!",
    "password is": "The password is = S3cr3t!pw",
    "URL creds": "postgres://admin:Sup3rS3cret@db.example.com:5432/app",
    "labelled key": "api_key = \"q8Zr2LkP0vN4xW7tY1bC9mD3\"",
    "card": "card 4111 1111 1111 1111 exp 12/29",
    "seed": "My wallet recovery phrase: abandon ability able about above absent absorb abstract absurd abuse access accident",
    "numbered seed": "1. abandon 2. ability 3. able 4. about 5. above 6. absent 7. absorb 8. abstract 9. absurd 10. abuse 11. access 12. accident",
    "entropy": "here: Zx9Qw3Er7Ty1Ui5Op2As8Df4Gh6Jk0LmNb",
  };
  for (const [k, t] of Object.entries(yes)) assert.ok(scanSecrets(t).length > 0, "should flag " + k);
  const no = [
    "Meeting with Jordan about Q4 planning. Budget 4,500,000 for 2027.",
    "Commit 3f2a9c1b7e4d5f6a8b9c0d1e2f3a4b5c6d7e8f90 fixed the build",   // a git SHA is not a secret
    "See https://github.com/schoettle-cmd/caldera/blob/main/packages/plugin/src/city.ts for the renderer",
    "Phone 415 555 0134, order #12345678",
    "I need to reset my password tomorrow.",
    "The token economy and the secret sauce of the business.",
    "uuid 123e4567-e89b-12d3-a456-426614174000",
    "a list of words like apple banana cherry for the fruit stand menu today",
    "Card 1234 5678 9012 3456 is not a real number",   // fails Luhn
  ];
  for (const t of no) assert.deepEqual(scanSecrets(t), [], "false positive: " + t);
  assert.ok(entropy("aaaa") < 1 && entropy("Zx9Qw3Er7Ty1Ui5Op2As8Df4Gh6Jk0L") > 4);
});

test("connector: notes with secrets are skipped, named, and removed from Inbox Hero if they were there", async () => {
  const f = files(), { v } = fakeVault(f), ih = fakeIh(), st = { token: TOKEN, folder: "Work" }, e = new IhSyncEngine(st, v, cache, ih.req, "Mike");
  const r = await e.sync(true);
  assert.deepEqual(r.skipped.map(s => s.path), ["Work/keys.md"]);
  assert.ok(!JSON.stringify(ih.calls).includes("AKIAIOSFODNN7EXAMPLE"), "the secret never leaves the vault");
  assert.equal(skippedMessage(r.skipped), "Skipped 1 note with sensitive data: keys");
  f["Work/Plan.md"] = "now with password: hunter22!"; const r2 = await e.sync(false);
  assert.ok(!ih.store.has("Work/Plan.md"), "a note that gains a secret is deleted from Inbox Hero"); assert.equal(r2.removed, 1);
});

test("connector: incremental sync, deletes and renames, full resync", async () => {
  const f = files(), { v } = fakeVault(f), ih = fakeIh(), st = { token: TOKEN, folder: "Work" }, e = new IhSyncEngine(st, v, cache, ih.req, "Mike");
  await e.sync(true); const before = ih.calls.length;
  const r = await e.sync(false); assert.equal(r.sent, 0, "nothing changed, nothing sent"); assert.ok(ih.calls.length - before <= 1, "only /limits");
  f["Work/Plan.md"] += " more"; delete f["Work/People/Jordan.md"]; f["Work/New.md"] = "new note";
  const r2 = await e.sync(false, new Set(["Work/Plan.md", "Work/People/Jordan.md", "Work/New.md"]));
  assert.equal(r2.sent, 2); assert.equal(r2.removed, 1); assert.deepEqual([...ih.store.keys()].sort(), ["Work/New.md", "Work/Plan.md"]);
  ih.store.set("Work/Ghost.md", { hash: "x" }); await e.sync(true); assert.ok(!ih.store.has("Work/Ghost.md"), "full resync drops what isn't in the vault");
});

test("connector: folder change (409) resyncs; an oversized batch (413) is split", async () => {
  const { v } = fakeVault(files()), ih = fakeIh({ folder: "Personal" });
  await new IhSyncEngine({ token: TOKEN, folder: "Work" }, v, cache, ih.req, "Mike").sync(false);
  assert.equal(ih.folder, "Work"); assert.ok(ih.calls.some(c => c.url.endsWith("/resync")));
  const ih2 = fakeIh({ conflictOnce: true }); const r = await new IhSyncEngine({ token: TOKEN, folder: "Work" }, fakeVault(files()).v, cache, ih2.req, "Mike").sync(true);
  assert.equal(r.sent, 2, "409 -> /resync -> sent again");
  const ih3 = fakeIh({ max413: 1 }); const r3 = await new IhSyncEngine({ token: TOKEN, folder: "Work" }, fakeVault(files()).v, cache, ih3.req, "Mike").sync(true);
  assert.equal(r3.sent, 2); assert.equal(ih3.store.size, 2);
});

test("connector: pairing swaps the one-time code; only joininboxhero.com; 401 forgets the token; disconnect deletes", async () => {
  assert.equal(ihApiOk("https://joininboxhero.com/"), IH_API_DEFAULT);
  for (const bad of ["https://caldera.social", "http://joininboxhero.com", "https://joininboxhero.com.evil.io", "https://evil.joininboxhero.com", "javascript:alert(1)"]) assert.equal(ihApiOk(bad), null, bad);
  assert.ok(ihTokenOk(TOKEN) && !ihTokenOk("ihn_" + "a".repeat(43)));
  const ih = fakeIh(), st = { api: IH_API_DEFAULT }, e = new IhSyncEngine(st, fakeVault(files()).v, cache, ih.req, "Mike");
  await assert.rejects(e.pair("ihp_" + "Z".repeat(32), "Mac"), /already used or has expired/);
  assert.equal(st.token, undefined);
  await e.pair(CODE, "Mac"); assert.equal(st.token, TOKEN);
  assert.deepEqual(JSON.parse(ih.calls.at(-1).body), { code: CODE, vault: "Mike", device: "Mac" }); assert.equal(ih.calls.at(-1).headers.authorization, undefined);
  st.folder = "Work"; await e.sync(true); assert.equal(ih.store.size, 2);
  await e.disconnect(); assert.equal(st.token, undefined); assert.equal(ih.store.size, 0, "Inbox Hero deleted the synced notes");
  const st2 = { token: "iho_" + "R".repeat(43), folder: "Work" }; await assert.rejects(new IhSyncEngine(st2, fakeVault(files()).v, cache, ih.req, "Mike").sync(true), /disconnected/);
  assert.equal(st2.token, undefined, "401: the token is forgotten");
});

test("connector: read-only (never writes to the vault) and never talks to the Caldera hub", async () => {
  const { v, writes } = fakeVault(files()), ih = fakeIh(), st = { api: IH_API_DEFAULT }, e = new IhSyncEngine(st, v, cache, ih.req, "Mike");
  await e.pair(CODE, "Mac"); st.folder = "Work"; await e.preview(); await e.sync(true); await e.sync(false); await e.disconnect();
  assert.deepEqual(writes, [], "no vault writes");
  assert.ok(ih.calls.length > 4 && ih.calls.every(c => c.url.startsWith("https://joininboxhero.com/api/obsidian/")), "every request goes to the Inbox Hero API");
  // source-level guards: the connector code has no vault write calls and no hub calls
  const src = fs.readFileSync(new URL("../src/ihsync.ts", import.meta.url), "utf8");
  assert.ok(!/\.(modify|modifyBinary|create|createBinary|createFolder|delete|trash|rename|process|append|write|remove)\s*\(/.test(src.replace(/IH_PATHS\.remove/g, "")), "ihsync.ts never calls a write API");
  assert.ok(!/hubUrl|caldera\.social|\/v1\//.test(src), "ihsync.ts never names the hub");
  const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const ihBlock = main.slice(main.indexOf("// ---- Inbox Hero connector"), main.indexOf("async ihDisconnect")) + main.slice(main.indexOf("export class IhConnectModal"), main.indexOf("class WelcomeModal"));
  assert.ok(!/this\.api\(|this\.send\(|hubUrl|\.vault\.(modify|create|delete|trash|rename|process|append)/.test(ihBlock), "the plugin's connector code makes no hub calls and no vault writes");
});

test("connector: Caldera publishing is unaffected (no connector data in what gets published)", () => {
  const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
  const pub = main.slice(main.indexOf("private async publishNow("), main.indexOf("this.settings.lastPublished = Date.now()"));
  assert.ok(pub.length > 500 && !/ihSync|ihOnly|ihsync/i.test(pub), "publishNow never reads connector settings");
  for (const f of ["collect.ts", "render.ts", "profile-file.ts", "city.ts", "listings.ts", "view.ts", "owner.ts"]) {
    const s = fs.readFileSync(new URL("../src/" + f, import.meta.url), "utf8");
    assert.ok(!/ihSync|ihsync/.test(s), f + " doesn't touch the connector");
  }
  const st = fs.readFileSync(new URL("../src/settings.ts", import.meta.url), "utf8");
  assert.ok(/ihSync\?: import\("\.\/ihsync"\)\.IhSyncState;\s+\/\/ Inbox Hero connector \(private\)[^\n]*Never published/.test(st));
});

test("settings: no input is filled in after display() returns (an async setValue froze Obsidian 1.15's settings window)", () => {
  const st = fs.readFileSync(new URL("../src/settings.ts", import.meta.url), "utf8");
  assert.ok(!/listValue\([^)]*\)\.then/.test(st) && !/private async listValue/.test(st), "listValue is synchronous");
  assert.ok(!/\.then\([^)]*=>\s*t\.setValue/.test(st), "no setValue inside a .then");
});

// ---- 0.28.30: several folders, or the whole vault minus some (Mike 2026-11-05 "how do we fix this folder thing") ----
test("scope: several folders, a parent includes its subfolders, whole vault minus sensitive folders, private notes out", () => {
  assert.deepEqual(topmost(["wiki/a", "wiki", "Work/People", "Work"]), ["wiki", "Work"]);
  const folders = ["wiki", "wiki/People", ".raw", "Slack", "Slack/general", "meetings", "Trading", "Trading/Grid bots", "Finance/Taxes 2025", "Health/Medical", "Notes", "Notes/Journal", "Real Estate", "Projects/quantum", "Projects/Caldera"];
  const ex = defaultExclusions(folders);
  for (const f of [".raw", "Slack", "meetings", "Trading", "Finance/Taxes 2025", "Health/Medical", "Notes/Journal", "Real Estate", "Projects/quantum"]) assert.ok(ex.includes(f), f + " starts excluded");
  assert.ok(!ex.includes("Slack/general") && !ex.includes("Trading/Grid bots"), "only the topmost match is listed (it covers its subfolders)");
  assert.ok(!ex.includes("wiki") && !ex.includes("Notes") && !ex.includes("Projects/Caldera"));
  const many = { mode: "folders", include: ["wiki", "Projects/Caldera"], skipPrivate: true };
  assert.ok(inScope("wiki/People/Ana.md", many) && inScope("Projects/Caldera/x.md", many) && !inScope("Projects/Other/x.md", many) && !inScope("wikipedia/a.md", many) && !inScope("wiki/a.png", many) && !inScope("wiki/../x.md", many));
  const vault = { mode: "vault", include: [], exclude: ex, skipPrivate: true };
  assert.ok(inScope("Notes/idea.md", vault) && inScope("top.md", vault) && !inScope("Slack/general/a.md", vault) && !inScope("Notes/Journal/2026-11-05.md", vault) && !inScope(".obsidian/x.md", vault) && !inScope(".trash/x.md", vault));
  assert.equal(scopeRoot({ mode: "folders", include: ["wiki"], skipPrivate: true }), "wiki", "one folder: sent as the root, same as before");
  assert.equal(scopeRoot(many), "", "several folders: the vault root");
  assert.equal(scopeRoot(vault), "");
  assert.ok(isPrivateNote({ frontmatter: { private: true } }) && isPrivateNote({ frontmatter: { private: "yes" } }) && isPrivateNote({ tags: [{ tag: "#private" }] }) && isPrivateNote({ frontmatter: { tags: ["work", "private"] } }));
  assert.ok(!isPrivateNote({ frontmatter: { private: false, tags: ["privacy"] } }) && !isPrivateNote(null));
  const fl = [{ path: "wiki/a.md" }, { path: "wiki/b.md", priv: true }, { path: "Notes/c.md" }, { path: "Slack/d.md" }];
  assert.equal(countScope(fl, { mode: "folders", include: ["wiki"], skipPrivate: true }), 1);
  assert.equal(countScope(fl, { mode: "folders", include: ["wiki"], skipPrivate: false }), 2);
  assert.equal(countScope(fl, vault), 2);
  assert.equal(scopeLabel(many), "wiki and 1 more folder");
  assert.match(scopeLabel(vault), /^Whole vault, except 9 folders$/);
});

test("scope: old single-folder installs keep their folder; nothing chosen = nothing syncs; wiki/ is only a suggestion", () => {
  assert.deepEqual(scopeOf({ folder: "Work" }).include, ["Work"]);
  assert.ok(scopeEmpty(scopeOf({ token: TOKEN })), "connected, nothing picked: nothing syncs (wiki is never auto-synced)");
  assert.deepEqual(suggestedScope({ token: TOKEN }, ["wiki", "Work"]).include, ["wiki"], "the picker starts on wiki/");
  assert.deepEqual(suggestedScope({ token: TOKEN }, ["Notes/wiki", "Work"]).include, [], "only a top-level wiki/");
  assert.deepEqual(suggestedScope({ folder: "Work" }, ["wiki"]).include, ["Work"], "a saved choice wins");
});

test("connector: several folders sync under the vault root, only in-scope non-private notes are read, and deselected ones leave Inbox Hero", async () => {
  const fs2 = { ...files(), "wiki/Ana.md": "Ana works at Harborlane.", "wiki/Secret.md": "---\nprivate: true\n---\nnot for Inbox Hero" };
  const { v, reads } = fakeVault(fs2), ih = fakeIh();
  const cache2 = p => p === "wiki/Secret.md" ? { frontmatter: { private: true } } : cache(p);
  const st = { api: IH_API_DEFAULT, scope: { mode: "folders", include: ["Work", "wiki"], skipPrivate: true } };
  const e = new IhSyncEngine(st, v, cache2, ih.req, "Mike"); await e.pair(CODE, "Mac");
  const r = await e.sync(true);
  assert.equal(ih.folder, "", "two folders: the root sent is the vault root");
  assert.deepEqual([...ih.store.keys()].sort(), ["Work/People/Jordan.md", "Work/Plan.md", "wiki/Ana.md"]);
  assert.ok(!reads.includes("wiki/Secret.md") && !reads.includes("Personal/Diary.md") && !reads.includes("Workshop/Other.md"), "private and out-of-scope notes are never read");
  assert.ok(r.skipped.some(s => s.path === "Work/keys.md"), "the secret scanner still applies");
  st.scope = { mode: "folders", include: ["wiki"], skipPrivate: true };
  await e.sync(true);
  assert.deepEqual([...ih.store.keys()], ["wiki/Ana.md"], "back to one folder: Work's notes are removed from Inbox Hero");
  assert.equal(ih.folder, "wiki");
  st.scope = { mode: "vault", include: [], exclude: ["Personal", "Caldera"], skipPrivate: true };
  await e.sync(true);
  assert.deepEqual([...ih.store.keys()].sort(), ["Work/People/Jordan.md", "Work/Plan.md", "Workshop/Other.md", "wiki/Ana.md"], "whole vault minus Personal and Caldera, minus private and secret notes");
});

test("connector: a sync cut short keeps what was sent, and the next one carries on", async () => {
  const many = {}; for (let i = 0; i < 7; i++) many[`wiki/n${i}.md`] = "note " + i;
  const { v } = fakeVault(many), ih = fakeIh({ maxBatchNotes: 3 }); let n = 0;
  const req = async o => { if (/\/notes$/.test(new URL(o.url).pathname) && ++n === 2) return { status: 500, json: null }; return ih.req(o); };
  const st = { api: IH_API_DEFAULT, scope: { mode: "folders", include: ["wiki"], skipPrivate: true } };
  const e = new IhSyncEngine(st, v, () => null, req, "Mike"); await e.pair(CODE, "Mac");
  await assert.rejects(e.sync(false), /answered 500/);
  assert.equal(Object.keys(st.sent).length, 3, "the first batch is remembered");
  const r = await e.sync(false);
  assert.equal(r.sent, 4, "only the rest is sent next time"); assert.equal(Object.keys(st.sent).length, 7); assert.equal(st.maxNotes, 5000);
});
