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

const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export interface HubOptions { dataDir: string; port?: number; publicUrl?: string; siteDir?: string; trustProxy?: boolean; limits?: { perMinute?: number; writesPerMinute?: number; newProfilesPerDay?: number }; }

const MAX_BODY = 12 * 1024 * 1024;
const RESERVED = new Set(["admin", "api", "www", "caldera", "help", "support", "root", "hub", "v1", "about", "login", "settings", "official", "team", "security", "obsidian"]);
const SECURITY_HEADERS = { "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "x-frame-options": "DENY" };
// User-uploaded profile pages run in a sandbox: unique origin, no access to the hub's origin, no forms, no top navigation.
const PROFILE_CSP = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
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
    CREATE TABLE IF NOT EXISTS moderation (handle TEXT PRIMARY KEY, id TEXT, action TEXT, reason TEXT, at TEXT);
  `);
  const q = (sql: string) => db.prepare(sql);
  const now = () => new Date().toISOString();

  // ---------------------------------------------------------------- helpers
  const profile = (id: string) => q("SELECT * FROM profiles WHERE id=?").get(id) as any;
  const byHandle = (h: string) => q("SELECT * FROM profiles WHERE handle=?").get(h) as any;
  // operator moderation (Terms s.3): hidden = taken down, owner cannot republish; blocked = handle can never be claimed
  const modOf = (handle: string | null, id?: string) => q("SELECT * FROM moderation WHERE handle=? OR (id IS NOT NULL AND id=?)").get(handle || "", id || "") as any;
  const body = (pr: any) => { try { return JSON.parse(pr.manifest).body || {}; } catch { return {}; } };
  const listed = (pr: any) => body(pr).listed !== false && !modOf(pr.handle, pr.id);
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
        if (RESERVED.has(handle)) return { status: 400, body: { error: "that handle is reserved" } };
        if (modOf(handle, e.from)) return { status: 403, body: { error: "this profile or handle is not available" } };
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
      case "profile.delete": {
        // Owner-signed erasure: profile, page files, friendships, asks, offers, gravity, ledger and stored envelopes.
        erase(e.from);
        return { status: 200, body: { ok: true, deleted: e.from } };
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

  function erase(id: string) {
    const pr = profile(id);
    if (pr?.handle) fs.rmSync(path.join(opts.dataDir, "profiles", pr.handle), { recursive: true, force: true });
    for (const sql of ["DELETE FROM profiles WHERE id=?", "DELETE FROM friends WHERE a=? OR b=?", "DELETE FROM asks WHERE author=?", "DELETE FROM offers WHERE author=?",
      "DELETE FROM gravity WHERE sender=? OR recipient=?", "DELETE FROM ledger WHERE who=?", "DELETE FROM envelopes WHERE sender=? OR recipient=?", "DELETE FROM tokens WHERE id=?"]) {
      const n = (sql.match(/\?/g) || []).length; q(sql).run(...Array(n).fill(id));
    }
  }

  // ---------------------------------------------------------------- operator tools (run on the server: node dist/admin.js)
  const admin = {
    list: () => q("SELECT * FROM moderation ORDER BY at DESC").all(),
    hide(handle: string, reason = "") { const pr = byHandle(handle); q("INSERT OR REPLACE INTO moderation VALUES (?,?,?,?,?)").run(handle, pr?.id || null, "hidden", reason, now()); return { hidden: handle, id: pr?.id || null }; },
    unhide(handle: string) { q("DELETE FROM moderation WHERE handle=?").run(handle); return { restored: handle }; },
    remove(handle: string, reason = "") { const pr = byHandle(handle); if (pr) erase(pr.id); q("INSERT OR REPLACE INTO moderation VALUES (?,?,?,?,?)").run(handle, pr?.id || null, "removed", reason, now()); return { removed: handle, id: pr?.id || null }; },
    block(handle: string, reason = "") { q("INSERT OR REPLACE INTO moderation VALUES (?,?,?,?,?)").run(handle, null, "blocked", reason, now()); return { blocked: handle }; },
  };

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
      : (q("SELECT * FROM profiles WHERE handle IS NOT NULL").all() as any[]).filter(listed)) as any[];
    return rows.map(p => ({ id: p.id, handle: p.handle, name: p.name, week: weekScore(p.manifest), gravity: gravityOf(p.id) }))
      .sort((a, b) => b.week - a.week || b.gravity - a.gravity)
      .map((r, i) => ({ rank: i + 1, ...r }));
  }

  // ---------------------------------------------------------------- auth (signed nonce, no passwords)
  function authed(req: http.IncomingMessage): string | null {
    const t = String(req.headers.authorization || "").replace(/^Bearer /, "");
    const row = q("SELECT id FROM tokens WHERE token=? AND expires > ?").get(hashToken(t), Date.now()) as any;
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
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" , ".md": "text/plain; charset=utf-8", ".zip": "application/zip", ".ico": "image/x-icon" };

  const buckets = new Map<string, { n: number; w: number; reset: number }>();
  const newProfiles = new Map<string, { n: number; day: string }>();
  const L = { perMinute: 240, writesPerMinute: 40, newProfilesPerDay: 5, ...(opts.limits || {}) };
  // Behind nginx, X-Real-IP is set by the proxy from the TCP peer (clients cannot spoof it); X-Forwarded-For is not trusted.
  const ipOf = (req: http.IncomingMessage) => (opts.trustProxy ? String(req.headers["x-real-ip"] || "").trim() : "") || req.socket.remoteAddress || "?";
  function limited(req: http.IncomingMessage): boolean {
    const ip = ipOf(req), t = Date.now(); let b = buckets.get(ip);
    if (!b || b.reset < t) { b = { n: 0, w: 0, reset: t + 60_000 }; buckets.set(ip, b); }
    b.n++; if (req.method === "POST") b.w++;
    if (buckets.size > 50_000) buckets.clear();
    return b.n > L.perMinute || b.w > L.writesPerMinute;
  }
  function allowNewProfile(req: http.IncomingMessage): boolean {
    const ip = ipOf(req), day = new Date().toISOString().slice(0, 10); const r = newProfiles.get(ip);
    if (!r || r.day !== day) { newProfiles.set(ip, { n: 1, day }); return true; }
    r.n++; return r.n <= L.newProfilesPerDay;
  }

  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    try {
      if (limited(req)) return json(res, 429, { error: "slow down" });
      const url = new URL(req.url || "/", "http://hub");
      // ids arrive percent-encoded ("cal%3A...") when a proxy passes the raw URI through; API routes match the decoded form
      const p = url.pathname.startsWith("/v1/") ? url.pathname.replace(/%3A/gi, ":") : url.pathname;
      if (req.method === "OPTIONS") return json(res, 204, {});

      if (req.method === "GET" && p === "/v1/info") return json(res, 200, { name: "Caldera Hub", protocol: C.PROTOCOL_VERSION, profiles: (q("SELECT COUNT(*) c FROM profiles").get() as any).c });
      if (req.method === "GET" && opts.siteDir && !p.startsWith("/v1/") && !p.startsWith("/@")) {
        let rel = p === "/" ? "index.html" : decodeURIComponent(p.slice(1));
        if (rel.endsWith("/")) rel += "index.html";
        const root = path.resolve(opts.siteDir), file = path.resolve(root, path.normalize(rel));
        if (file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
          const ext = path.extname(file).toLowerCase();
          res.writeHead(200, { "content-type": MIME[ext] || (ext === ".zip" ? "application/zip" : "application/octet-stream"), "cache-control": "public, max-age=600" });
          return fs.createReadStream(file).pipe(res);
        }
      }
      if (req.method === "GET" && p === "/") return json(res, 200, { name: "Caldera Hub", protocol: C.PROTOCOL_VERSION });

      if (req.method === "POST" && p === "/v1/envelopes") {
        const env = await readBody(req);
        if (env?.type === "profile.manifest" && !profile(env.from) && !allowNewProfile(req)) return json(res, 429, { error: "too many new profiles from this address today" });
        const r = accept(env); return json(res, r.status, r.body);
      }

      // upload a static profile bundle: { manifest: <signed profile.manifest>, files: { "index.html": "<base64>", ... } }
      let m = p.match(/^\/v1\/profiles\/(cal:[1-9A-HJ-NP-Za-km-z]+)\/bundle$/);
      if (req.method === "POST" && m) {
        const body = await readBody(req);
        if (body.manifest?.from !== m[1]) return json(res, 403, { error: "manifest must be signed by the profile" });
        if (!profile(m[1]) && !allowNewProfile(req)) return json(res, 429, { error: "too many new profiles from this address today" });
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
        if (modOf(m[1])) { res.writeHead(410, { "content-type": "text/plain" }); return res.end("This profile is not available."); }
        const dir = path.join(opts.dataDir, "profiles", m[1]);
        let rel = (m[2] || "/").slice(1) || "index.html";
        if (rel.endsWith("/")) rel += "index.html";
        const file = path.join(dir, path.normalize(rel));
        if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
        res.removeHeader("x-frame-options");
        res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "x-robots-tag": "noindex", "content-security-policy": PROFILE_CSP, "cache-control": "public, max-age=300" });
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
        q("INSERT INTO tokens VALUES (?,?,?)").run(hashToken(token), env.from, Date.now() + 3600_000);  // only the hash is stored
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
        return json(res, 200, { profiles: (rows as any[]).filter(r => !modOf(r.handle, r.id)) });
      }
      if (req.method === "GET" && p === "/v1/directory") {
        const term = (url.searchParams.get("q") || "").toLowerCase().trim(), sort = url.searchParams.get("sort") || "active";
        const rows = (q("SELECT * FROM profiles WHERE handle IS NOT NULL").all() as any[]).filter(listed).map(pr => {
          const b = body(pr), avatar = b.photos?.avatar ? `/@${pr.handle}/${String(b.photos.avatar).replace(/^\.?\//, "")}` : null;
          return { handle: pr.handle, name: pr.name, headline: pr.headline, avatar, topics: (b.topics || []).slice(0, 3).map((t: any) => t[0]),
            week: weekScore(pr.manifest), gravity: gravityOf(pr.id), created: pr.created, updated: pr.updated };
        }).filter(r => !term || [r.handle, r.name, r.headline, ...r.topics].join(" ").toLowerCase().includes(term));
        rows.sort(sort === "new" ? (a, b) => String(b.created).localeCompare(String(a.created)) : (a, b) => b.week - a.week || b.gravity - a.gravity);
        return json(res, 200, { total: rows.length, profiles: rows.slice(0, 120) });
      }
      m = p.match(/^\/v1\/profiles\/(cal:[1-9A-HJ-NP-Za-km-z]+|[a-z0-9-]+)$/);
      if (req.method === "GET" && m) {
        const pr = m[1].startsWith("cal:") ? profile(m[1]) : byHandle(m[1]);
        if (!pr || modOf(pr.handle, pr.id)) return json(res, 404, { error: "not found" });
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

  return { server, db, admin, listen: (port = opts.port || 8787, host = process.env.CALDERA_HOST || "127.0.0.1") => new Promise<number>(r => server.listen(port, host, () => r((server.address() as any).port))) };
}

// CLI: node dist/server.js  (env: CALDERA_DATA, PORT, CALDERA_PUBLIC_URL)
if (import.meta.url === `file://${process.argv[1]}` && /server\.js$/.test(process.argv[1] || "")) {
  const hub = createHub({ dataDir: process.env.CALDERA_DATA || "./data", port: Number(process.env.PORT || 8787), publicUrl: process.env.CALDERA_PUBLIC_URL || "",
    siteDir: process.env.CALDERA_SITE || undefined, trustProxy: process.env.CALDERA_TRUST_PROXY === "1" });
  hub.listen().then(p => console.log(`Caldera Hub listening on :${p}`));
}
