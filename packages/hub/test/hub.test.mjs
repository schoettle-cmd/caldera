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
  assert.equal((await get("/@mike/")).body, "<h1>Mike</h1>");
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
