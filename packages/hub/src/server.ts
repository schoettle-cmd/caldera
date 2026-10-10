/**
 * Caldera Hub - reference hub for the Caldera protocol (spec/PROTOCOL.md).
 * Stores and indexes signed envelopes, hosts profile pages, delivers encrypted cards,
 * enforces the gravity and credit rules, and serves discovery and leaderboards.
 * Zero framework: node:http + node:sqlite (Node 22+).
 */
import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as C from "@caldera/core";

export interface HubOptions { dataDir: string; port?: number; publicUrl?: string; }

const MAX_BODY = 12 * 1024 * 1024;
const DAY = 86_400_000;

export function createHub(opts: HubOptions) {
  fs.mkdirSync(path.join(opts.dataDir, "profiles"), { recursive: true });
  const db = new DatabaseSync(path.join(opts.dataDir, "hub.sqlite"));
  db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS envelopes (hash TEXT PRIMARY KEY, type TEXT, sender TEXT, recipient TEXT, ts TEXT, json TEXT);
    CREATE INDEX IF NOT EXISTS env_to ON envelopes(recipient, ts);
    CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, handle TEXT UNIQUE, box_key TEXT, name TEXT, headline TEXT,
      manifest TEXT, updated TEXT, created TEXT);
    CREATE TABLE IF NOT EXISTS friends (a TEXT, b TEXT, ts TEXT, PRIMARY KEY (a, b));
    CREATE TABLE IF NOT EXISTS gravity (sender TEXT, recipient TEXT, ts TEXT, reason TEXT, ask TEXT);
    CREATE TABLE IF NOT EXISTS asks (id TEXT PRIMARY KEY, author TEXT, title TEXT, detail TEXT, bounty INTEGER, tags TEXT,
      visibility TEXT, status TEXT, ts TEXT, awarded_to TEXT);
    CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, author TEXT, title TEXT, detail TEXT, tags TEXT, ts TEXT);
    CREATE TABLE IF NOT EXISTS ledger (who TEXT, delta INTEGER, reason TEXT, ref TEXT, ts TEXT);
    CREATE TABLE IF NOT EXISTS challenges (id TEXT, nonce TEXT, expires INTEGER);
    CREATE TABLE IF NOT EXISTS tokens (token TEXT PRIMARY KEY, id TEXT, expires INTEGER);
  `);
  const q = (sql: string) => db.prepare(sql);
  const now = () => new Date().toISOString();

  // ---------------------------------------------------------------- helpers
  const profile = (id: string) => q("SELECT * FROM profiles WHERE id=?").get(id) as any;
  const byHandle = (h: string) => q("SELECT * FROM profiles WHERE handle=?").get(h) as any;
  const areFriends = (a: string, b: string) => !!q("SELECT 1 FROM friends WHERE a=? AND b=?").get(a, b);
  const balance = (id: string) => (q("SELECT COALESCE(SUM(delta),0) AS s FROM ledger WHERE who=?").get(id) as any).s as number;

  function storeEnvelope(e: C.Envelope, recipient: string | null) {
    const hash = C.envelopeHash(e);
    q("INSERT OR IGNORE INTO envelopes VALUES (?,?,?,?,?,?)").run(hash, e.type, e.from, recipient, e.ts, JSON.stringify(e));
    return hash;
  }

  function settleExpiredAsks() {
    const cutoff = new Date(Date.now() - 30 * DAY).toISOString();
    for (const a of q("SELECT * FROM asks WHERE status='open' AND ts < ?").all(cutoff) as any[]) {
      q("UPDATE asks SET status='expired' WHERE id=?").run(a.id);
      if (a.bounty > 0) q("INSERT INTO ledger VALUES (?,?,?,?,?)").run(a.author, a.bounty, "bounty returned", a.id, now());
    }
  }

  function gravityOf(id: string, depth = 0): number {
    const rows = q("SELECT sender, ts FROM gravity WHERE recipient=?").all(id) as any[];
    return C.gravityScore(rows.map(r => ({ ts: r.ts, giverWeight: depth < 1 ? C.giverWeight(gravityOf(r.sender, depth + 1)) : 1 })));
  }

  // ---------------------------------------------------------------- envelope rules
  function accept(e: C.Envelope): { status: number; body: any } {
    if (!C.verify(e)) return { status: 400, body: { error: "bad signature" } };
    const age = Date.now() - Date.parse(e.ts);
    if (!(age > -5 * 60_000 && age < 30 * DAY)) return { status: 400, body: { error: "stale or future timestamp" } };
    const b = e.body || {};
    switch (e.type) {
      case "profile.manifest": {
        const handle = String(b.handle || "").toLowerCase();
        if (handle && !/^[a-z0-9][a-z0-9-]{1,30}$/.test(handle)) return { status: 400, body: { error: "bad handle" } };
        const owner = handle ? byHandle(handle) : null;
        if (owner && owner.id !== e.from) return { status: 409, body: { error: "handle taken" } };
        const existing = profile(e.from);
        if (!existing) q("INSERT INTO ledger VALUES (?,?,?,?,?)").run(e.from, C.STARTING_CREDITS, "welcome", "", now());
        q(`INSERT INTO profiles (id, handle, box_key, name, headline, manifest, updated, created) VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET handle=excluded.handle, box_key=excluded.box_key, name=excluded.name,
           headline=excluded.headline, manifest=excluded.manifest, updated=excluded.updated`)
          .run(e.from, handle || null, b.boxKey || "", b.name || "", b.headline || "", JSON.stringify(e), e.ts, existing?.created || now());
        storeEnvelope(e, null);
        return { status: 200, body: { ok: true, id: e.from, handle } };
      }
      case "friend.request": {
        if (!b.to || b.to === e.from) return { status: 400, body: { error: "bad recipient" } };
        const hash = storeEnvelope(e, b.to);
        return { status: 200, body: { ok: true, request: hash } };
      }
      case "friend.accept": {
        const req = q("SELECT json FROM envelopes WHERE hash=? AND type='friend.request'").get(b.request) as any;
        if (!req) return { status: 404, body: { error: "unknown request" } };
        const r = JSON.parse(req.json) as C.Envelope;
        if (r.body.to !== e.from || r.from !== b.to) return { status: 403, body: { error: "request was not to you" } };
        q("INSERT OR IGNORE INTO friends VALUES (?,?,?)").run(e.from, r.from, e.ts);
        q("INSERT OR IGNORE INTO friends VALUES (?,?,?)").run(r.from, e.from, e.ts);
        storeEnvelope(e, r.from);
        return { status: 200, body: { ok: true } };
      }
      case "friend.remove": {
        q("DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)").run(e.from, b.to, b.to, e.from);
        return { status: 200, body: { ok: true } };
      }
      case "card":
      case "message": {
        const to: string[] = Array.isArray(b.to) ? b.to : [b.to];
        for (const t of to) if (!areFriends(e.from, t)) return { status: 403, body: { error: `not friends with ${t}` } };
        for (const t of to) storeEnvelope({ ...e }, t);
        return { status: 200, body: { ok: true, delivered: to.length } };
      }
      case "ask": {
        settleExpiredAsks();
        const bounty = Math.max(0, Math.floor(Number(b.bounty) || 0));
        if (!b.id || !b.title) return { status: 400, body: { error: "ask needs id and title" } };
        if (q("SELECT 1 FROM asks WHERE id=?").get(b.id)) return { status: 409, body: { error: "ask exists" } };
        if (bounty > balance(e.from)) return { status: 402, body: { error: "not enough credits", balance: balance(e.from) } };
        q("INSERT INTO asks VALUES (?,?,?,?,?,?,?,?,?,?)").run(b.id, e.from, String(b.title).slice(0, 140), String(b.detail || "").slice(0, 2000),
          bounty, JSON.stringify(b.tags || []), b.visibility === "friends" ? "friends" : "public", "open", e.ts, null);
        if (bounty) q("INSERT INTO ledger VALUES (?,?,?,?,?)").run(e.from, -bounty, "bounty escrow", b.id, now());
        storeEnvelope(e, null);
        return { status: 200, body: { ok: true, balance: balance(e.from) } };
      }
      case "offer": {
        if (!b.id || !b.title) return { status: 400, body: { error: "offer needs id and title" } };
        q("INSERT OR REPLACE INTO offers VALUES (?,?,?,?,?,?)").run(b.id, e.from, String(b.title).slice(0, 140), String(b.detail || "").slice(0, 2000), JSON.stringify(b.tags || []), e.ts);
        storeEnvelope(e, null);
        return { status: 200, body: { ok: true } };
      }
      case "gravity": {
        if (!b.to || b.to === e.from) return { status: 400, body: { error: "gravity goes to someone else" } };
        if (!profile(b.to)) return { status: 404, body: { error: "unknown profile" } };
        const since = new Date(Date.now() - DAY).toISOString();
        if (q("SELECT 1 FROM gravity WHERE sender=? AND recipient=? AND ts > ?").get(e.from, b.to, since))
          return { status: 429, body: { error: "one gravity per person per day" } };
        q("INSERT INTO gravity VALUES (?,?,?,?,?)").run(e.from, b.to, e.ts, String(b.reason || "").slice(0, 140), b.ask || null);
        storeEnvelope(e, b.to);
        return { status: 200, body: { ok: true, gravity: gravityOf(b.to) } };
      }
      case "credit.award": {
        const a = q("SELECT * FROM asks WHERE id=?").get(b.ask) as any;
        if (!a) return { status: 404, body: { error: "unknown ask" } };
        if (a.author !== e.from) return { status: 403, body: { error: "only the asker can award" } };
        if (a.status !== "open") return { status: 409, body: { error: `ask is ${a.status}` } };
        if (!b.to || b.to === e.from) return { status: 400, body: { error: "award goes to a helper" } };
        const amount = Math.max(0, Math.min(a.bounty, Math.floor(Number(b.amount) || a.bounty)));
        q("UPDATE asks SET status='awarded', awarded_to=? WHERE id=?").run(b.to, a.id);
        q("INSERT INTO ledger VALUES (?,?,?,?,?)").run(b.to, amount, "helped", a.id, now());
        if (a.bounty - amount > 0) q("INSERT INTO ledger VALUES (?,?,?,?,?)").run(e.from, a.bounty - amount, "bounty change", a.id, now());
        storeEnvelope(e, b.to);
        return { status: 200, body: { ok: true, awarded: amount } };
      }
      default:
        return { status: 200, body: { ok: true, ignored: e.type } };   // unknown types are ignored, not rejected
    }
  }

  // ---------------------------------------------------------------- scores for leaderboards
  function weekScore(manifestJson: string): number {
    try {
      const m = JSON.parse(manifestJson).body;
      const cutoff = new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10);
      return (m.daily || []).filter((d: any) => d.date >= cutoff).reduce((s: number, d: any) => s + (Number(d.score) || 0), 0);
    } catch { return 0; }
  }

  function leaderboard(ofId: string | null) {
    const rows = (ofId
      ? q("SELECT p.* FROM profiles p WHERE p.id=? OR p.id IN (SELECT b FROM friends WHERE a=?)").all(ofId, ofId)
      : q("SELECT * FROM profiles WHERE handle IS NOT NULL").all()) as any[];
    return rows.map(p => ({ id: p.id, handle: p.handle, name: p.name, week: weekScore(p.manifest), gravity: gravityOf(p.id) }))
      .sort((a, b) => b.week - a.week || b.gravity - a.gravity)
      .map((r, i) => ({ rank: i + 1, ...r }));
  }

  // ---------------------------------------------------------------- auth (signed nonce, no passwords)
  function authed(req: http.IncomingMessage): string | null {
    const t = String(req.headers.authorization || "").replace(/^Bearer /, "");
    const row = q("SELECT id FROM tokens WHERE token=? AND expires > ?").get(t, Date.now()) as any;
    return row?.id || null;
  }

  // ---------------------------------------------------------------- http
  const json = (res: http.ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization" });
    res.end(JSON.stringify(body));
  };

  async function readBody(req: http.IncomingMessage): Promise<any> {
    const chunks: Buffer[] = []; let size = 0;
    for await (const c of req) { size += (c as Buffer).length; if (size > MAX_BODY) throw new Error("too large"); chunks.push(c as Buffer); }
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
  }

  const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://hub");
      const p = url.pathname;
      if (req.method === "OPTIONS") return json(res, 204, {});

      if (req.method === "GET" && p === "/") return json(res, 200, { name: "Caldera Hub", protocol: C.PROTOCOL_VERSION, profiles: (q("SELECT COUNT(*) c FROM profiles").get() as any).c });

      if (req.method === "POST" && p === "/v1/envelopes") {
        const r = accept(await readBody(req)); return json(res, r.status, r.body);
      }

      // upload a static profile bundle: { manifest: <signed profile.manifest>, files: { "index.html": "<base64>", ... } }
      let m = p.match(/^\/v1\/profiles\/(cal:[1-9A-HJ-NP-Za-km-z]+)\/bundle$/);
      if (req.method === "POST" && m) {
        const body = await readBody(req);
        if (body.manifest?.from !== m[1]) return json(res, 403, { error: "manifest must be signed by the profile" });
        const r = accept(body.manifest); if (r.status !== 200) return json(res, r.status, r.body);
        const handle = r.body.handle; if (!handle) return json(res, 400, { error: "a handle is required to host a page" });
        const dir = path.join(opts.dataDir, "profiles", handle);
        fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
        for (const [rel, b64data] of Object.entries(body.files || {})) {
          const clean = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
          if (clean.includes("..") || path.isAbsolute(clean) || !MIME[path.extname(clean).toLowerCase()]) continue;
          fs.mkdirSync(path.dirname(path.join(dir, clean)), { recursive: true });
          fs.writeFileSync(path.join(dir, clean), Buffer.from(String(b64data), "base64"));
        }
        fs.writeFileSync(path.join(dir, "caldera.json"), JSON.stringify(body.manifest));
        return json(res, 200, { ok: true, url: `${opts.publicUrl || ""}/@${handle}/` });
      }

      m = p.match(/^\/@([a-z0-9-]+)(\/.*)?$/);
      if (req.method === "GET" && m) {
        const dir = path.join(opts.dataDir, "profiles", m[1]);
        let rel = (m[2] || "/").slice(1) || "index.html";
        if (rel.endsWith("/")) rel += "index.html";
        const file = path.join(dir, path.normalize(rel));
        if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
        res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "x-robots-tag": "noindex" });
        return fs.createReadStream(file).pipe(res);
      }

      if (req.method === "POST" && p === "/v1/auth/challenge") {
        const { id } = await readBody(req); const nonce = crypto.randomBytes(24).toString("base64");
        q("INSERT INTO challenges VALUES (?,?,?)").run(id, nonce, Date.now() + 5 * 60_000);
        return json(res, 200, { nonce });
      }
      if (req.method === "POST" && p === "/v1/auth/verify") {
        const env = await readBody(req) as C.Envelope;   // a "message" envelope whose body is { nonce }
        if (!C.verify(env)) return json(res, 401, { error: "bad signature" });
        const ch = q("SELECT * FROM challenges WHERE id=? AND nonce=? AND expires > ?").get(env.from, env.body?.nonce, Date.now());
        if (!ch) return json(res, 401, { error: "unknown or expired challenge" });
        q("DELETE FROM challenges WHERE id=?").run(env.from);
        const token = crypto.randomBytes(24).toString("hex");
        q("INSERT INTO tokens VALUES (?,?,?)").run(token, env.from, Date.now() + 3600_000);
        return json(res, 200, { token, expires_in: 3600 });
      }

      m = p.match(/^\/v1\/inbox\/(cal:[1-9A-HJ-NP-Za-km-z]+)$/);
      if (req.method === "GET" && m) {
        if (authed(req) !== m[1]) return json(res, 401, { error: "sign in as this profile" });
        const since = url.searchParams.get("since") || "1970-01-01";
        const rows = q("SELECT json FROM envelopes WHERE recipient=? AND ts > ? ORDER BY ts LIMIT 500").all(m[1], since) as any[];
        return json(res, 200, { envelopes: rows.map(r => JSON.parse(r.json)) });
      }

      if (req.method === "GET" && p === "/v1/profiles") {
        const term = "%" + (url.searchParams.get("q") || "").toLowerCase() + "%";
        const rows = q(`SELECT id, handle, name, headline, box_key FROM profiles WHERE handle IS NOT NULL AND
          (lower(name) LIKE ? OR lower(handle) LIKE ? OR lower(headline) LIKE ? OR lower(manifest) LIKE ?) ORDER BY updated DESC LIMIT 50`).all(term, term, term, term);
        return json(res, 200, { profiles: rows });
      }
      m = p.match(/^\/v1\/profiles\/(cal:[1-9A-HJ-NP-Za-km-z]+|[a-z0-9-]+)$/);
      if (req.method === "GET" && m) {
        const pr = m[1].startsWith("cal:") ? profile(m[1]) : byHandle(m[1]);
        if (!pr) return json(res, 404, { error: "not found" });
        return json(res, 200, { id: pr.id, handle: pr.handle, name: pr.name, headline: pr.headline, boxKey: pr.box_key, manifest: JSON.parse(pr.manifest) });
      }

      if (req.method === "GET" && p === "/v1/leaderboard") {
        const of = url.searchParams.get("scope") === "friends" ? url.searchParams.get("of") : null;
        return json(res, 200, { scope: of ? "friends" : "global", rows: leaderboard(of) });
      }
      if (req.method === "GET" && p === "/v1/asks") {
        settleExpiredAsks();
        const tag = url.searchParams.get("tag");
        const rows = (q("SELECT a.*, p.handle, p.name FROM asks a LEFT JOIN profiles p ON p.id=a.author WHERE a.status='open' AND a.visibility='public' ORDER BY a.ts DESC LIMIT 100").all() as any[])
          .map(a => ({ ...a, tags: JSON.parse(a.tags) })).filter(a => !tag || a.tags.includes(tag));
        return json(res, 200, { asks: rows });
      }
      if (req.method === "GET" && p === "/v1/offers") {
        const rows = (q("SELECT o.*, p.handle, p.name FROM offers o LEFT JOIN profiles p ON p.id=o.author ORDER BY o.ts DESC LIMIT 100").all() as any[]).map(o => ({ ...o, tags: JSON.parse(o.tags) }));
        return json(res, 200, { offers: rows });
      }
      m = p.match(/^\/v1\/gravity\/(cal:[1-9A-HJ-NP-Za-km-z]+)$/);
      if (req.method === "GET" && m) {
        const recent = q("SELECT g.sender, g.ts, g.reason, p.handle, p.name FROM gravity g LEFT JOIN profiles p ON p.id=g.sender WHERE g.recipient=? ORDER BY g.ts DESC LIMIT 20").all(m[1]);
        return json(res, 200, { id: m[1], gravity: gravityOf(m[1]), recent });
      }
      m = p.match(/^\/v1\/credits\/(cal:[1-9A-HJ-NP-Za-km-z]+)$/);
      if (req.method === "GET" && m) {
        settleExpiredAsks();
        return json(res, 200, { id: m[1], balance: balance(m[1]), ledger: q("SELECT * FROM ledger WHERE who=? ORDER BY ts DESC LIMIT 50").all(m[1]) });
      }
      m = p.match(/^\/v1\/friends\/(cal:[1-9A-HJ-NP-Za-km-z]+)$/);
      if (req.method === "GET" && m) {
        const rows = q("SELECT f.b AS id, p.handle, p.name, p.box_key FROM friends f LEFT JOIN profiles p ON p.id=f.b WHERE f.a=?").all(m[1]);
        return json(res, 200, { friends: rows });
      }
      json(res, 404, { error: "not found" });
    } catch (err: any) {
      json(res, err?.message === "too large" ? 413 : 400, { error: String(err?.message || err) });
    }
  });

  return { server, db, listen: (port = opts.port || 8787) => new Promise<number>(r => server.listen(port, () => r((server.address() as any).port))) };
}

// CLI: node dist/server.js  (env: CALDERA_DATA, PORT, CALDERA_PUBLIC_URL)
if (import.meta.url === `file://${process.argv[1]}`) {
  const hub = createHub({ dataDir: process.env.CALDERA_DATA || "./data", port: Number(process.env.PORT || 8787), publicUrl: process.env.CALDERA_PUBLIC_URL || "" });
  hub.listen().then(p => console.log(`Caldera Hub listening on :${p}`));
}
