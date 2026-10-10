/**
 * @caldera/core - identity, signed envelopes, encryption and scoring shared by the
 * Obsidian plugin and the hub. Pure JS (tweetnacl), so it runs on desktop, mobile and Node.
 */
import nacl from "tweetnacl";

export const PROTOCOL_VERSION = 1;

export type EnvelopeType =
  | "profile.manifest" | "profile.delete" | "friend.request" | "friend.accept" | "friend.remove"
  | "card" | "ask" | "offer" | "gravity" | "credit.award" | "message";

export interface Envelope<B = any> {
  v: number;
  type: EnvelopeType;
  from: string;          // "cal:" + base58(ed25519 public key)
  ts: string;            // ISO time
  body: B;
  sig: string;           // base64 signature over canonical(v,type,from,ts,body)
}

export interface Identity {
  id: string;
  signPublic: string;    // base64
  signSecret: string;    // base64 (never leaves the device)
  boxPublic: string;     // base64 X25519
  boxSecret: string;     // base64
}

// ------------------------------------------------------------------ encoding
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function b58encode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  let out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b === 0) out = "1" + out; else break; }
  return out;
}

export function b58decode(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const i = B58.indexOf(c);
    if (i < 0) throw new Error("bad base58");
    n = n * 58n + BigInt(i);
  }
  const bytes: number[] = [];
  while (n > 0n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  for (const c of s) { if (c === "1") bytes.unshift(0); else break; }
  return new Uint8Array(bytes);
}

export const b64 = {
  enc(u: Uint8Array): string {
    let s = ""; for (const b of u) s += String.fromCharCode(b);
    return btoa(s);
  },
  dec(s: string): Uint8Array {
    const bin = atob(s); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  },
};

const utf8 = (s: string) => new TextEncoder().encode(s);
const fromUtf8 = (u: Uint8Array) => new TextDecoder().decode(u);

/** Canonical JSON: recursively sorted keys, no whitespace (RFC 8785 style, sufficient for our types). */
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const obj = value as Record<string, unknown>;
  return "{" + Object.keys(obj).filter(k => obj[k] !== undefined).sort()
    .map(k => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
}

// ------------------------------------------------------------------ identity
export function newIdentity(): Identity {
  const sign = nacl.sign.keyPair();
  const box = nacl.box.keyPair();
  return {
    id: idFromPublicKey(sign.publicKey),
    signPublic: b64.enc(sign.publicKey), signSecret: b64.enc(sign.secretKey),
    boxPublic: b64.enc(box.publicKey), boxSecret: b64.enc(box.secretKey),
  };
}

export function idFromPublicKey(pk: Uint8Array): string { return "cal:" + b58encode(pk); }

export function publicKeyFromId(id: string): Uint8Array {
  if (!id.startsWith("cal:")) throw new Error("not a caldera id");
  const pk = b58decode(id.slice(4));
  if (pk.length !== 32) throw new Error("bad id length");
  return pk;
}

// ------------------------------------------------------------------ envelopes
function signingBytes(e: Omit<Envelope, "sig">): Uint8Array {
  return utf8(canonical({ v: e.v, type: e.type, from: e.from, ts: e.ts, body: e.body }));
}

export function sign<B>(identity: Identity, type: EnvelopeType, body: B, ts = new Date().toISOString()): Envelope<B> {
  const unsigned = { v: PROTOCOL_VERSION, type, from: identity.id, ts, body };
  const sig = nacl.sign.detached(signingBytes(unsigned), b64.dec(identity.signSecret));
  return { ...unsigned, sig: b64.enc(sig) };
}

export function verify(e: Envelope): boolean {
  try {
    if (!e || e.v !== PROTOCOL_VERSION || typeof e.sig !== "string") return false;
    return nacl.sign.detached.verify(signingBytes(e), b64.dec(e.sig), publicKeyFromId(e.from));
  } catch { return false; }
}

/** Stable content hash of an envelope (used to reference a friend.request from a friend.accept). */
export function envelopeHash(e: Envelope): string {
  return b64.enc(nacl.hash(utf8(canonical(e)))).slice(0, 43);
}

// ------------------------------------------------------------------ encryption (cards, messages)
export interface Sealed { nonce: string; box: string; }

export function seal(plaintext: string, recipientBoxPublic: string, sender: Identity): Sealed {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(utf8(plaintext), nonce, b64.dec(recipientBoxPublic), b64.dec(sender.boxSecret));
  return { nonce: b64.enc(nonce), box: b64.enc(box) };
}

export function open(sealed: Sealed, senderBoxPublic: string, recipient: Identity): string | null {
  const out = nacl.box.open(b64.dec(sealed.box), b64.dec(sealed.nonce), b64.dec(senderBoxPublic), b64.dec(recipient.boxSecret));
  return out ? fromUtf8(out) : null;
}

// ------------------------------------------------------------------ scoring
export const GRAVITY_HALF_LIFE_DAYS = 30;
export const STARTING_CREDITS = 100;

/** Gravity received: each endorsement decays with a 30-day half-life, weighted by the giver's own gravity (1.0 to 2.0). */
export function gravityScore(received: { ts: string; giverWeight?: number }[], now = Date.now()): number {
  let s = 0;
  for (const g of received) {
    const ageDays = Math.max(0, (now - Date.parse(g.ts)) / 86_400_000);
    const w = Math.min(2, Math.max(1, g.giverWeight ?? 1));
    s += w * Math.pow(0.5, ageDays / GRAVITY_HALF_LIFE_DAYS);
  }
  return Math.round(s * 10) / 10;
}

/** Map a giver's own gravity onto the 1.0 to 2.0 weight range (log-scaled, so whales can't dominate). */
export function giverWeight(giverGravity: number): number {
  return 1 + Math.min(1, Math.log10(1 + Math.max(0, giverGravity)) / 2);
}

export const ACTIVITY_WEIGHTS = { meetings: 6, emails: 2, prompts: 1, commits: 0.5, notes: 0.25, docs: 1 } as const;
export const ACTIVITY_CAPS: Partial<Record<keyof typeof ACTIVITY_WEIGHTS, number>> = { notes: 60, docs: 40, commits: 200 };
export type DailyCounts = Partial<Record<keyof typeof ACTIVITY_WEIGHTS, number>>;

/** Daily activity score: weighted counts, with caps so a bulk import can't win a day. */
export function activityScore(c: DailyCounts): number {
  let s = 0;
  for (const [k, w] of Object.entries(ACTIVITY_WEIGHTS) as [keyof typeof ACTIVITY_WEIGHTS, number][]) {
    s += w * Math.min(c[k] ?? 0, ACTIVITY_CAPS[k] ?? Infinity);
  }
  return Math.round(s);
}

export function newId(prefix: "ask" | "off" | "card" | "msg"): string {
  return prefix + "_" + b58encode(nacl.randomBytes(12));
}

export { agentPrompt } from "./agent-prompt.js";
export type { AgentPromptOptions } from "./agent-prompt.js";
