// End-to-end check of the Inbox Hero connector against the live API (not part of npm test: it needs a pairing code).
// Usage: node test/ih-e2e.mjs <ihp_ pairing code> [api]
// Builds a throwaway vault folder on disk, pairs, syncs, edits, deletes, resyncs, then disconnects (which deletes
// everything it sent). Prints E2E PASS or E2E FAIL.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { IhSyncEngine, IH_API_DEFAULT } from "./ihsync.build.mjs";
const [code, api = IH_API_DEFAULT] = process.argv.slice(2);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ih-e2e-")), fails = [], ok = (c, m) => { if (!c) fails.push(m); else console.log("ok " + m); };
const put = (p, t) => { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), t); };
put("IH Test/People/Jordan Avery.md", "---\ncompany: Harborlane\naliases: [Jordan]\n---\nIntro'd by [[Sam Lee]] for the [[Q4 planning]] review. #cfo\n");
put("IH Test/Projects/Q4 planning.md", "Owner: [[Jordan Avery]]. Budget review on Friday. #planning\n");
put("IH Test/Secrets.md", "staging db password: Hunter2-Example!\n");
put("Elsewhere/Private.md", "outside the folder, never read\n");
const reads = [];
const vault = {
  getMarkdownFiles: () => { const out = []; const walk = d => { for (const e of fs.readdirSync(path.join(dir, d), { withFileTypes: true })) { const p = d ? d + "/" + e.name : e.name; if (e.isDirectory()) walk(p); else if (p.endsWith(".md")) { const s = fs.statSync(path.join(dir, p)); out.push({ path: p, stat: { mtime: s.mtimeMs, size: s.size } }); } } }; walk(""); return out; },
  cachedRead: async f => { reads.push(f.path); return fs.readFileSync(path.join(dir, f.path), "utf8"); },
};
const cache = p => { const t = fs.existsSync(path.join(dir, p)) ? fs.readFileSync(path.join(dir, p), "utf8") : ""; return { links: [...t.matchAll(/\[\[([^\]|#]+)/g)].map(m => ({ link: m[1] })), tags: [...t.matchAll(/(^|\s)#([\w/-]+)/g)].map(m => ({ tag: "#" + m[2] })), frontmatter: /^---\n/.test(t) ? { company: (t.match(/company: (.*)/) || [])[1] } : undefined }; };
const req = async o => { const r = await fetch(o.url, { method: o.method, headers: o.headers, body: o.body }); let json = null; try { json = await r.json(); } catch {} return { status: r.status, json }; };
const st = { api }, e = new IhSyncEngine(st, vault, cache, req, "IH e2e");
try {
  await e.pair(code, "e2e script"); ok(/^iho_/.test(st.token || ""), "pairing code swapped for an iho_ token");
  await (async () => { try { await new IhSyncEngine({ api }, vault, cache, req, "x").pair(code, "again"); ok(false, "a used code is refused"); } catch (x) { ok(/already used|expired/.test(x.message), "a used code is refused"); } })();
  st.folder = "IH Test";
  const r1 = await e.sync(true);
  ok(r1.sent === 2, `full sync sent 2 notes (sent ${r1.sent})`);
  ok(r1.skipped.length === 1 && r1.skipped[0].path === "IH Test/Secrets.md", "the note with a password was skipped and named");
  ok(reads.every(p => p.startsWith("IH Test/")), "nothing outside the folder was read");
  let L = await e.limits(); ok(L.folder === "IH Test" && L.notes === 2, `Inbox Hero has the folder and 2 notes (${L.folder}, ${L.notes})`);
  const r2 = await e.sync(false); ok(r2.sent === 0, "no changes: nothing re-sent");
  put("IH Test/Projects/Q4 planning.md", "Owner: [[Jordan Avery]]. Budget review moved to Monday. #planning\n");
  const r3 = await e.sync(false, new Set(["IH Test/Projects/Q4 planning.md"])); ok(r3.sent === 1, "an edit sends just that note");
  fs.rmSync(path.join(dir, "IH Test/People/Jordan Avery.md"));
  const r4 = await e.sync(false, new Set(["IH Test/People/Jordan Avery.md"])); ok(r4.removed === 1, "a deleted note is removed from Inbox Hero");
  L = await e.limits(); ok(L.notes === 1, `Inbox Hero now has 1 note (${L.notes})`);
  const r5 = await e.sync(true); ok(r5.sent >= 1, "full resync works");
  const tok = st.token; await e.disconnect(); ok(!st.token, "disconnected locally");
  const after = await req({ url: api + "/api/obsidian/limits", method: "GET", headers: { authorization: "Bearer " + tok } });
  ok(after.status === 401 || after.status === 404, "the token no longer works after disconnect");
} catch (x) { fails.push("crashed: " + x.message); }
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails.length ? "E2E FAIL\n - " + fails.join("\n - ") : "E2E PASS");
