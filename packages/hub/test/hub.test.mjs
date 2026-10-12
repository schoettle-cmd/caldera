import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as C from "@caldera/core";
import { createHub } from "../dist/server.js";

let hub, base, dir;
const mike = C.newIdentity(), ana = C.newIdentity(), eve = C.newIdentity();
const post = (p, body, token) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, body: await r.json() }));
const get = (p, token) => fetch(base + p, { headers: token ? { authorization: "Bearer " + token } : {} }).then(async r => ({ status: r.status, body: r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text() }));
const today = new Date().toISOString().slice(0, 10);
const manifest = (id, handle, name, score) => C.sign(id, "profile.manifest", { name, handle, boxKey: id.boxPublic, headline: name + "'s vault", daily: [{ date: today, score }] });

async function login(id) {
  const { body } = await post("/v1/auth/challenge", { id: id.id });
  return (await post("/v1/auth/verify", C.sign(id, "message", { nonce: body.nonce }))).body.token;
}

before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "caldera-hub-"));
  hub = createHub({ dataDir: dir, publicUrl: "" });
  base = "http://127.0.0.1:" + await hub.listen(0);
});
after(() => { hub.server.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test("profiles: publish manifest + static page; handles are unique", async () => {
  const files = { "index.html": Buffer.from("<h1>Mike</h1>").toString("base64"), "assets/theme.css": Buffer.from(":root{}").toString("base64"), "../../escape.html": Buffer.from("x").toString("base64") };
  const up = await post(`/v1/profiles/${mike.id}/bundle`, { manifest: manifest(mike, "mike", "Mike Jones", 370), files });
  assert.equal(up.status, 200); assert.equal(up.body.url, "/@mike/");
  const page = (await get("/@mike/")).body; assert.ok(page.endsWith("<h1>Mike</h1>") && page.includes('id="caldera-bar"'));
  assert.equal((await get("/@mike/caldera.json")).status, 200);
  assert.ok(!fs.existsSync(path.join(dir, "escape.html")), "path traversal blocked");
  assert.equal((await post("/v1/envelopes", manifest(eve, "mike", "Impostor", 1))).status, 409);
  assert.equal((await post("/v1/envelopes", manifest(ana, "ana", "Ana", 250))).status, 200);
  assert.equal((await get("/v1/profiles?q=mike")).body.profiles.length, 1);
});

test("signatures: forged or tampered envelopes are rejected; unknown types ignored", async () => {
  const forged = { ...C.sign(eve, "gravity", { to: mike.id }), from: ana.id };
  assert.equal((await post("/v1/envelopes", forged)).status, 400);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "future.thing", { x: 1 }))).body.ignored, "future.thing");
});

test("friends: request + accept creates a mutual friendship", async () => {
  const req = await post("/v1/envelopes", C.sign(mike, "friend.request", { to: ana.id, note: "hi" }));
  assert.equal(req.status, 200);
  assert.equal((await post("/v1/envelopes", C.sign(eve, "friend.accept", { request: req.body.request, to: mike.id }))).status, 403);
  assert.equal((await post("/v1/envelopes", C.sign(ana, "friend.accept", { request: req.body.request, to: mike.id }))).status, 200);
  assert.equal((await get(`/v1/friends/${mike.id}`)).body.friends[0].handle, "ana");
});

test("cards: encrypted, friends only, delivered to an authenticated inbox", async () => {
  const sealed = C.seal("# Operator shortlist\nprivate", ana.boxPublic, mike);
  const card = C.sign(mike, "card", { id: C.newId("card"), title: "Operator shortlist", to: [ana.id], payload: { [ana.id]: sealed }, version: 1 });
  assert.equal((await post("/v1/envelopes", card)).status, 200);
  assert.equal((await post("/v1/envelopes", C.sign(eve, "card", { id: "card_x", title: "spam", to: [ana.id], payload: {} }))).status, 403);
  assert.equal((await get(`/v1/inbox/${ana.id}`)).status, 401);
  const inbox = await get(`/v1/inbox/${ana.id}`, await login(ana));
  const got = inbox.body.envelopes.find(e => e.type === "card");
  assert.equal(C.open(got.body.payload[ana.id], mike.boxPublic, ana), "# Operator shortlist\nprivate");
});

test("asks + credits: bounty escrow, award to helper, balances add up", async () => {
  const askId = C.newId("ask");
  assert.equal((await post("/v1/envelopes", C.sign(mike, "ask", { id: askId, title: "Need a DTC operator", bounty: 40, tags: ["ops"] }))).status, 200);
  assert.equal((await get(`/v1/credits/${mike.id}`)).body.balance, 60);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "ask", { id: C.newId("ask"), title: "too big", bounty: 1000 }))).status, 402);
  assert.equal((await get("/v1/asks?tag=ops")).body.asks.length, 1);
  assert.equal((await post("/v1/envelopes", C.sign(ana, "credit.award", { ask: askId, to: ana.id }))).status, 403);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "credit.award", { ask: askId, to: ana.id, amount: 30 }))).body.awarded, 30);
  assert.equal((await get(`/v1/credits/${ana.id}`)).body.balance, 130);
  assert.equal((await get(`/v1/credits/${mike.id}`)).body.balance, 70);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "credit.award", { ask: askId, to: ana.id }))).status, 409);
});

test("gravity: positive only, one per person per day, not to yourself", async () => {
  const g = await post("/v1/envelopes", C.sign(mike, "gravity", { to: ana.id, reason: "found me an operator" }));
  assert.equal(g.status, 200); assert.equal(g.body.gravity, 1);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "gravity", { to: ana.id }))).status, 429);
  assert.equal((await post("/v1/envelopes", C.sign(mike, "gravity", { to: mike.id }))).status, 400);
  assert.equal((await get(`/v1/gravity/${ana.id}`)).body.recent[0].reason, "found me an operator");
});

test("leaderboard: friends scope ranks you against your friends by weekly score", async () => {
  const lb = (await get(`/v1/leaderboard?scope=friends&of=${encodeURIComponent(mike.id)}`)).body.rows;
  assert.deepEqual(lb.map(r => r.handle), ["mike", "ana"]);
  assert.equal(lb[0].week, 370);
});

test("security: reserved handles, sandboxed profile pages, rate limits", async () => {
  const x = C.newIdentity();
  assert.equal((await post("/v1/envelopes", C.sign(x, "profile.manifest", { name: "x", handle: "admin", boxKey: x.boxPublic }))).status, 400);
  const r = await fetch(base + "/@mike/");
  assert.match(r.headers.get("content-security-policy") || "", /sandbox allow-scripts/);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});

test("security: new-profile cap per address", async () => {
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "caldera-hub2-"));
  const h2 = createHub({ dataDir: dir2, limits: { newProfilesPerDay: 2 } }); const b2 = "http://127.0.0.1:" + await h2.listen(0);
  const codes = [];
  for (let i = 0; i < 3; i++) { const id = C.newIdentity(); codes.push((await fetch(b2 + "/v1/envelopes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(C.sign(id, "profile.manifest", { name: "n" + i, handle: "user" + i, boxKey: id.boxPublic })) })).status); }
  assert.deepEqual(codes, [200, 200, 429]);
  h2.server.close(); fs.rmSync(dir2, { recursive: true, force: true });
});

test("privacy: owner can erase their profile and everything tied to it", async () => {
  const z = C.newIdentity();
  await post(`/v1/profiles/${z.id}/bundle`, { manifest: C.sign(z, "profile.manifest", { name: "Zed", handle: "zed", boxKey: z.boxPublic }), files: { "index.html": Buffer.from("<p>z</p>").toString("base64") } });
  assert.equal((await get("/@zed/")).status, 200);
  assert.equal((await post("/v1/envelopes", C.sign(eve, "profile.delete", {}))).body.deleted, eve.id);
  assert.equal((await get("/v1/profiles/zed")).status, 200, "someone else cannot delete it");
  assert.equal((await post("/v1/envelopes", C.sign(z, "profile.delete", {}))).status, 200);
  assert.equal((await get("/v1/profiles/zed")).status, 404);
  assert.equal((await get("/@zed/")).status, 404);
  assert.equal((await get(`/v1/credits/${z.id}`)).body.balance, 0);
});

test("routes accept percent-encoded ids (raw-URI proxies)", async () => {
  const files = { "index.html": Buffer.from("<h1>Mike again</h1>").toString("base64") };
  const up = await post(`/v1/profiles/${encodeURIComponent(mike.id)}/bundle`, { manifest: manifest(mike, "mike", "Mike Jones", 371), files });
  assert.equal(up.status, 200);
  assert.equal((await get(`/v1/credits/${encodeURIComponent(mike.id)}`)).status, 200);
  assert.equal((await get(`/v1/profiles/${encodeURIComponent(mike.id)}`)).status, 200);
});

test("directory: lists listed profiles, honours listed:false, hides moderated, admin tools", async () => {
  const d1 = await get("/v1/directory");
  assert.equal(d1.status, 200);
  const handles = d1.body.profiles.map(p => p.handle);
  assert.ok(handles.includes("mike") && handles.includes("ana"));
  const mikeRow = d1.body.profiles.find(p => p.handle === "mike");
  assert.ok("week" in mikeRow && !("manifest" in mikeRow) && !("id" in mikeRow), "directory exposes only card fields");
  // opt out
  const unl = C.sign(ana, "profile.manifest", { name: "Ana", handle: "ana", boxKey: ana.boxPublic, listed: false, daily: [] });
  assert.equal((await post("/v1/envelopes", unl)).status, 200);
  assert.ok(!(await get("/v1/directory")).body.profiles.some(p => p.handle === "ana"), "unlisted not in directory");
  assert.equal((await get("/v1/profiles/ana")).status, 200, "unlisted still reachable directly");
  // operator takedown
  hub.admin.hide("mike", "test");
  assert.equal((await get("/@mike/")).status, 410);
  assert.equal((await get("/v1/profiles/mike")).status, 404);
  assert.ok(!(await get("/v1/directory")).body.profiles.some(p => p.handle === "mike"));
  assert.equal((await post("/v1/envelopes", manifest(mike, "mike", "Mike Jones", 1))).status, 403, "owner cannot republish while hidden");
  hub.admin.unhide("mike");
  assert.equal((await get("/@mike/")).status, 200);
  hub.admin.block("impostor");
  assert.equal((await post("/v1/envelopes", manifest(ana, "impostor", "Fake", 1))).status, 403, "blocked handle cannot be claimed");
});

test("onEvent: signup fires once per new profile, not on updates; delete fires", async () => {
  const fs2 = await import("node:fs"), os2 = await import("node:os"), path2 = await import("node:path");
  const dir2 = fs2.mkdtempSync(path2.join(os2.tmpdir(), "caldera-ev-")), events = [];
  const h2 = createHub({ dataDir: dir2, onEvent: e => events.push(e) });
  const b2 = "http://127.0.0.1:" + await h2.listen(0);
  const p2 = (body) => fetch(b2 + "/v1/envelopes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(r => r.status);
  const z = C.newIdentity();
  assert.equal(await p2(manifest(z, "zed", "Zed", 1)), 200);
  assert.equal(await p2(manifest(z, "zed", "Zed again", 2)), 200);
  assert.equal(await p2(C.sign(z, "profile.delete", {})), 200);
  assert.deepEqual(events.map(e => e.type + ":" + e.handle + ":" + e.total), ["signup:zed:1", "delete:zed:0"]);
  h2.server.close(); fs2.rmSync(dir2, { recursive: true, force: true });
});

test("every hosted profile page gets the Caldera bar linking home with the owner's invite", async () => {
  const html = (await get("/@mike/")).body;
  assert.ok(html.includes('id="caldera-bar"') && html.includes("/?invite=mike") && html.includes("Get your own page"));
  assert.ok(html.indexOf('id="caldera-bar"') < html.indexOf("Mike again") || !html.includes("Mike again"));
  const css = await fetch(base + "/@mike/caldera.json").then(r => r.text());
  assert.ok(!css.includes("caldera-bar"), "only HTML pages are touched");
});

test("gardens: signed garden index, cross-garden backlinks injected into note pages, recent feed", async () => {
  const gdir = fs.mkdtempSync(path.join(os.tmpdir(), "caldera-garden-"));
  const gh = createHub({ dataDir: gdir, publicUrl: "" }); const gbase = "http://127.0.0.1:" + await gh.listen(0);
  const post = (p, body) => fetch(gbase + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, body: await r.json() }));
  const get = (p) => fetch(gbase + p).then(async r => ({ status: r.status, body: r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text() }));
  const g1 = C.newIdentity(), g2 = C.newIdentity();
  const note = (slug, title, extra = {}) => ({ slug, title, stage: "budding", license: "cc-by", created: new Date().toISOString(), updated: new Date().toISOString(), sha256: "a".repeat(64), words: 120, excerpt: title + " excerpt", xlinks: [], ...extra });
  const page = (s) => Buffer.from(`<html><body><article>${s}<!--caldera:xlinks--></article></body></html>`).toString("base64");
  const m1 = C.sign(g1, "profile.manifest", { name: "Gardener One", handle: "gone", boxKey: g1.boxPublic, garden: [note("tools-for-thought", "Tools for thought"), note("bad slug!", "x")] });
  assert.equal((await post(`/v1/profiles/${g1.id}/bundle`, { manifest: m1, files: { "index.html": page("one"), "n/tools-for-thought.html": page("tft") } })).status, 200);
  const m2 = C.sign(g2, "profile.manifest", { name: "Gardener Two", handle: "gtwo", boxKey: g2.boxPublic, garden: [note("reply", "My reply <b>", { xlinks: ["gone/tools-for-thought", "gtwo/self", "../evil"] })] });
  assert.equal((await post(`/v1/profiles/${g2.id}/bundle`, { manifest: m2, files: { "index.html": page("two"), "n/reply.html": page("r") } })).status, 200);
  const html = (await get("/@gone/n/tools-for-thought.html")).body;
  assert.ok(html.includes("Linked from other gardens") && html.includes("/@gtwo/n/reply.html") && html.includes("My reply &lt;b&gt;"), "backlink from another garden, escaped");
  assert.ok(html.includes('id="caldera-bar"'), "bar on note pages too");
  const feed = (await get("/v1/gardens/recent")).body.notes;
  assert.ok(feed.some(n => n.handle === "gone" && n.slug === "tools-for-thought") && !feed.some(n => n.slug === "bad slug!"));
  assert.ok((await get("/gardens")).body.includes("Tools for thought"));
  // republishing without the link removes the backlink; deleting the profile removes its garden
  await post(`/v1/profiles/${g2.id}/bundle`, { manifest: C.sign(g2, "profile.manifest", { name: "Gardener Two", handle: "gtwo", boxKey: g2.boxPublic, garden: [note("reply", "My reply")] }), files: { "index.html": page("two") } });
  assert.ok(!(await get("/@gone/n/tools-for-thought.html")).body.includes("Linked from other gardens"));
  await post("/v1/envelopes", C.sign(g1, "profile.delete", {}));
  assert.ok(!(await get("/v1/gardens/recent")).body.notes.some(n => n.handle === "gone"));
  gh.server.close(); fs.rmSync(gdir, { recursive: true, force: true });
});
