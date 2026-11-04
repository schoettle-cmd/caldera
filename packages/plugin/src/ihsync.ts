/**
 * Inbox Hero sync (private, opt-in): one folder of this vault, one way, to the member's own Inbox Hero account.
 *
 * - Off and invisible until the member opens the pairing link from Inbox Hero Settings (obsidian://caldera?ih=pair...).
 *   The upload-only token lives in the plugin's data.json, never in a note, never published.
 * - Exactly one folder (and its subfolders), chosen by the member; nothing outside it is read.
 * - Read-only: this file only ever reads the vault (getMarkdownFiles, cachedRead, metadataCache). It never writes,
 *   renames or deletes anything in it.
 * - A note that looks like it holds a secret (API keys, private keys, passwords, card numbers, seed phrases, or a
 *   long high-entropy value next to a key-like label) is skipped and listed, never sent.
 * - Nothing here talks to the Caldera hub: every request goes to the Inbox Hero API (https, joininboxhero.com).
 *
 * The pure parts (folder scoping, the secret scanner, payload building, batching) are exported for tests.
 */

// ---- the Inbox Hero API (docs: inbox-hero docs/obsidian-sync.md) ------------------------------------------------------
export const IH_API_DEFAULT = "https://joininboxhero.com";
export const IH_PATHS = {
  pair: "/api/obsidian/pair",
  limits: "/api/obsidian/limits",
  notes: "/api/obsidian/notes",
  remove: "/api/obsidian/notes/delete",
  resync: "/api/obsidian/resync",
  disconnect: "/api/obsidian/disconnect",
};
export interface IhLimits { maxNoteBytes: number; maxTotalBytes: number; maxNotes: number; maxBatchNotes: number; maxBatchBytes: number; folder?: string | null; notes?: number; bytes?: number }
export const IH_LIMITS_DEFAULT: IhLimits = { maxNoteBytes: 2_000_000, maxTotalBytes: 50_000_000, maxNotes: 5000, maxBatchNotes: 50, maxBatchBytes: 4_000_000 };

/** Only Inbox Hero itself (https://joininboxhero.com). Anything else is refused, so a crafted pairing link can't point
 *  the plugin's uploads somewhere else. */
export function ihApiOk(u: unknown): string | null {
  const s = String(u ?? "").trim().replace(/\/+$/, "").toLowerCase();
  return s === IH_API_DEFAULT ? s : null;
}
export const ihTokenOk = (t: unknown) => typeof t === "string" && /^iho_[A-Za-z0-9_-]{30,80}$/.test(t);
export const ihCodeOk = (t: unknown) => typeof t === "string" && /^ihp_[A-Za-z0-9_-]{20,80}$/.test(t);

export interface IhSyncState {
  token?: string;            // upload-only iho_ token, swapped once for the pairing link's one-time code
  api?: string;              // the Inbox Hero API base
  folder?: string;           // the one folder that syncs ("" = none chosen yet: nothing syncs)
  sent?: Record<string, string>;   // path -> hash of what Inbox Hero has, so only changes go up
  lastSync?: number;
  skipped?: { path: string; why: string }[];   // last scan: notes left out (secrets or too big), names only
  error?: string;
}

// ---- folder scoping ---------------------------------------------------------------------------------------------------
export function normFolder(f: unknown): string {
  return String(f ?? "").trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
/** Is this a markdown note inside the chosen folder (or its subfolders)? No folder chosen = nothing. */
export function inFolder(path: string, folder: string): boolean {
  const f = normFolder(folder); if (!f || !/\.md$/i.test(path)) return false;
  const p = String(path).replace(/\\/g, "/");
  if (p.split("/").some(seg => seg === ".." || seg === ".")) return false;
  return p.startsWith(f + "/");
}

// ---- the secret scanner -----------------------------------------------------------------------------------------------
const RX: [string, RegExp][] = [
  ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Stripe key", /\b(?:sk|rk|pk)_(?:live|test)_[0-9A-Za-z]{16,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["OpenAI / Anthropic key", /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}/],
  ["SendGrid key", /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/],
  ["Twilio key", /\bSK[0-9a-f]{32}\b/],
  ["JSON web token", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["URL with a password", /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s/@]{3,}@/i],
  ["password", /\b(?:password|passwd|pwd|passcode|passphrase|pass)\b\s*(?:is\s*)?[:=]\s*["'`]?[^\s"'`]{4,}/i],
];
const KEYLABEL = /\b(?:api[_ -]?key|apikey|secret(?:[_ -]?key)?|client[_ -]?secret|access[_ -]?token|auth[_ -]?token|bearer|token|private[_ -]?key|access[_ -]?key|signing[_ -]?key|webhook[_ -]?secret)\b\s*[:=]\s*["'`]?([A-Za-z0-9_\-\/+=.]{16,})/gi;

/** Shannon entropy in bits per character. */
export function entropy(s: string): number {
  if (!s) return 0; const m: Record<string, number> = {}; for (const ch of s) m[ch] = (m[ch] || 0) + 1;
  let e = 0; for (const k in m) { const p = m[k] / s.length; e -= p * Math.log2(p); } return e;
}
function luhn(d: string): boolean {
  let sum = 0, alt = false; for (let i = d.length - 1; i >= 0; i--) { let n = d.charCodeAt(i) - 48; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; }
  return sum % 10 === 0;
}
/** 12-24 short lowercase words in a row (optionally numbered), in a note that talks about a seed/recovery phrase,
 *  or 12+ numbered words on their own ("1. word 2. word ..."). */
function seedPhrase(text: string): boolean {
  const ctx = /\b(?:seed|mnemonic|recovery|secret)\s*(?:phrase|words)\b|\bwallet\b|\bbip-?39\b|\bledger\b|\bmetamask\b/i.test(text);
  const words = text.replace(/\b\d{1,2}[.)]\s*/g, " ").split(/[\s,]+/);
  let run = 0, best = 0;
  for (const w of words) { if (/^[a-z]{3,8}$/.test(w)) { run++; best = Math.max(best, run); } else if (w) run = 0; }
  if (ctx && best >= 12) return true;
  const numbered = text.match(/(?:^|\s)(?:\d{1,2}[.)]\s*[a-z]{3,8}\b[\s,]*){12,}/);
  return !!numbered;
}

/** What kinds of secret a note seems to hold ([] = none). Never returns the secret itself. */
export function scanSecrets(text: string): string[] {
  const t = String(text || ""), out = new Set<string>();
  for (const [why, rx] of RX) if (rx.test(t)) out.add(why);
  for (const m of t.matchAll(KEYLABEL)) { const v = m[1]; if (v.length >= 16 && entropy(v) >= 3.3 && /\d/.test(v) && /[A-Za-z]/.test(v)) { out.add("key or token"); break; } }
  for (const m of t.matchAll(/\b(?:\d[ -]?){13,19}\b/g)) { const d = m[0].replace(/\D/g, ""); if (d.length >= 13 && d.length <= 19 && /^[3-6]/.test(d) && luhn(d) && !/^(\d)\1+$/.test(d)) { out.add("card number"); break; } }
  if (seedPhrase(t)) out.add("seed phrase");
  // a long random-looking string on its own (mixed case and digits, not a URL path or a plain hex hash)
  for (const m of t.matchAll(/(?<![\w/.-])[A-Za-z0-9+\/_-]{32,}={0,2}(?![\w/.-])/g)) {
    const v = m[0]; if (/^[0-9a-f]+$/i.test(v)) continue;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && entropy(v) >= 4.3) { out.add("high-entropy string"); break; }
  }
  return [...out];
}

// ---- payload ----------------------------------------------------------------------------------------------------------
export interface IhNote { path: string; title: string; frontmatter: Record<string, unknown>; body: string; mtime: number; wikilinks: string[]; tags: string[]; hash: string }
export interface CacheLike { frontmatter?: Record<string, unknown>; links?: { link: string }[]; embeds?: { link: string }[]; tags?: { tag: string }[] }

/** The note as Inbox Hero gets it. Frontmatter from Obsidian's cache (minus Obsidian's own "position"), the body without
 *  the frontmatter block, wikilinks and tags (inline and frontmatter) de-duplicated. */
export function buildNote(path: string, text: string, mtime: number, cache: CacheLike | null | undefined, hash: string): IhNote {
  // a flat object (nested values as JSON text), at most 16 KB: keys that don't fit are left out
  const fm: Record<string, unknown> = {}; let fmBytes = 2;
  for (const [k, v0] of Object.entries(cache?.frontmatter || {})) { if (k === "position") continue;
    const v = v0 !== null && typeof v0 === "object" && !(Array.isArray(v0) && v0.every(x => x === null || typeof x !== "object")) ? JSON.stringify(v0) : v0;
    const b = new TextEncoder().encode(JSON.stringify(k) + ":" + JSON.stringify(v) + ",").length; if (fmBytes + b > 16_000) continue; fmBytes += b; fm[k] = v; }
  const body = String(text || "").replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "");
  const links = [...(cache?.links || []), ...(cache?.embeds || [])].map(l => String(l.link || "").split("#")[0].trim()).filter(Boolean);
  const fmTags = ([] as unknown[]).concat((fm as any).tags ?? [], (fm as any).tag ?? []).flatMap(x => String(x ?? "").split(/[,\s]+/));
  const tags = [...(cache?.tags || []).map(t => t.tag), ...fmTags].map(x => String(x).replace(/^#/, "").trim()).filter(Boolean);
  const title = String(path.split("/").pop() || path).replace(/\.md$/i, "").slice(0, 300);
  const cap = (l: string[]) => [...new Set(l.map(x => x.slice(0, 200)))].slice(0, 500);
  return { path, title, frontmatter: fm, body, mtime: Math.round(Number(mtime) || 0), wikilinks: cap(links), tags: cap(tags), hash };
}
export const noteBytes = (n: IhNote) => new TextEncoder().encode(JSON.stringify(n)).length;

/** Batches under the per-request caps. */
export function batches(notes: IhNote[], lim: IhLimits): IhNote[][] {
  const out: IhNote[][] = []; let cur: IhNote[] = [], bytes = 0;
  for (const n of notes) { const b = noteBytes(n);
    if (cur.length && (cur.length >= lim.maxBatchNotes || bytes + b > lim.maxBatchBytes)) { out.push(cur); cur = []; bytes = 0; }
    cur.push(n); bytes += b; }
  if (cur.length) out.push(cur); return out;
}
export function limitsFrom(j: any): IhLimits {
  const n = (v: unknown, d: number, max: number) => { const x = Math.round(Number(v)); return x > 0 ? Math.min(x, max) : d; };
  return { maxNoteBytes: n(j?.maxNoteBytes, IH_LIMITS_DEFAULT.maxNoteBytes, 20_000_000), maxTotalBytes: n(j?.maxTotalBytes, IH_LIMITS_DEFAULT.maxTotalBytes, 1e10), maxNotes: n(j?.maxNotes, IH_LIMITS_DEFAULT.maxNotes, 100_000),
    maxBatchNotes: n(j?.maxBatchNotes, IH_LIMITS_DEFAULT.maxBatchNotes, 1000), maxBatchBytes: n(j?.maxBatchBytes, IH_LIMITS_DEFAULT.maxBatchBytes, 50_000_000),
    folder: typeof j?.folder === "string" ? j.folder : null, notes: Math.max(0, Number(j?.notes) || 0), bytes: Math.max(0, Number(j?.bytes) || 0) };
}

// ---- the sync engine (vault + network injected, so tests drive it with fakes) -------------------------------------------
export interface VaultReader {
  getMarkdownFiles(): { path: string; stat: { mtime: number; size: number } }[];
  cachedRead(f: { path: string }): Promise<string>;
}
export type Requester = (o: { url: string; method: string; headers: Record<string, string>; body?: string }) => Promise<{ status: number; json: any }>;
export interface SyncResult { sent: number; removed: number; skipped: { path: string; why: string }[]; unchanged: number }

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export class IhError extends Error { constructor(msg: string, public status = 0, public code = "") { super(msg); } }

export class IhSyncEngine {
  constructor(private st: IhSyncState, private vault: VaultReader, private cacheOf: (path: string) => CacheLike | null, private req: Requester, private vaultName: string) {}

  private async raw(path: string, method: string, body?: unknown, auth = true): Promise<{ status: number; json: any }> {
    const api = ihApiOk(this.st.api || IH_API_DEFAULT); if (!api) throw new IhError("Inbox Hero address isn't valid");
    if (auth && !ihTokenOk(this.st.token)) throw new IhError("Not connected to Inbox Hero", 401);
    const headers: Record<string, string> = { "content-type": "application/json" }; if (auth) headers.authorization = "Bearer " + this.st.token;
    return this.req({ url: api + path, method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }
  private async call(path: string, method: string, body?: unknown): Promise<any> {
    const r = await this.raw(path, method, body);
    if (r.status === 401) { this.st.token = undefined; throw new IhError("Inbox Hero disconnected this vault. Make a new link in Inbox Hero Settings to connect again.", 401); }
    if (r.status === 404) throw new IhError("The Inbox Hero connector isn't available for this account", 404);
    if (r.status === 409) throw new IhError("folder changed", 409, "folder_changed");
    if (r.status === 413) throw new IhError("Over Inbox Hero's size limit", 413);
    if (r.status === 429) throw new IhError("Inbox Hero asked to slow down; trying again later", 429);
    if (r.status < 200 || r.status >= 300) throw new IhError("Inbox Hero answered " + r.status, r.status);
    return r.json;
  }

  /** Swap the one-time pairing code for the upload token. */
  async pair(code: string, device: string): Promise<void> {
    if (!ihCodeOk(code)) throw new IhError("That pairing link isn't valid. Make a new one in Inbox Hero Settings.");
    const r = await this.raw(IH_PATHS.pair, "POST", { code, vault: this.vaultName, device: String(device || "").slice(0, 80) }, false);
    if (r.status === 401) throw new IhError("That pairing link was already used or has expired. Make a new one in Inbox Hero Settings.", 401, "bad_code");
    if (r.status === 404) throw new IhError("The Inbox Hero connector isn't available for this account", 404);
    if (r.status < 200 || r.status >= 300 || !ihTokenOk(r.json?.token)) throw new IhError("Inbox Hero couldn't connect (" + r.status + ")", r.status);
    this.st.token = r.json.token; this.st.sent = {}; this.st.error = undefined;
  }

  async limits(): Promise<IhLimits> { return limitsFrom(await this.call(IH_PATHS.limits, "GET")); }

  /** Read one note and decide: send it, or skip it (secrets / too big / path too long). */
  private async prepare(f: { path: string; stat: { mtime: number; size: number } }, lim: IhLimits): Promise<{ note?: IhNote; skip?: string }> {
    if (f.path.length > 512) return { skip: "path too long" };
    if (f.stat.size > lim.maxNoteBytes) return { skip: "too large" };
    const text = await this.vault.cachedRead(f);
    const found = scanSecrets(text); if (found.length) return { skip: "sensitive data: " + found.join(", ") };
    const note = buildNote(f.path, text, f.stat.mtime, this.cacheOf(f.path), "");
    note.hash = await sha256(note.body);
    if (noteBytes(note) > lim.maxNoteBytes) return { skip: "too large" };
    return { note };
  }

  private async upload(folder: string, notes: IhNote[], res: SyncResult, sent: Record<string, string>): Promise<void> {
    try {
      const j = await this.call(IH_PATHS.notes, "POST", { vault: this.vaultName, folder, notes });
      const bad = new Map<string, string>(((j && j.rejected) || []).map((x: any) => [String(x.path), String(x.reason || "")]));
      res.unchanged += Math.max(0, Number(j?.unchanged) || 0);
      for (const n of notes) { const why = bad.get(n.path);
        if (why !== undefined) { res.skipped.push({ path: n.path, why: why === "secret" ? "sensitive data (flagged by Inbox Hero)" : why === "quota" ? "over the limit" : why === "too_big" ? "too large" : "Inbox Hero refused it (" + why + ")" }); delete sent[n.path]; continue; }
        sent[n.path] = n.hash; res.sent++; }
    } catch (e: any) {
      if (e instanceof IhError && e.status === 413) {   // split the batch; a single note over the cap is skipped
        if (notes.length === 1) { res.skipped.push({ path: notes[0].path, why: "too large" }); return; }
        const h = Math.ceil(notes.length / 2); await this.upload(folder, notes.slice(0, h), res, sent); await this.upload(folder, notes.slice(h), res, sent); return;
      }
      throw e;
    }
  }

  /** Sync the chosen folder. full = re-send everything and tell Inbox Hero the complete list (it drops the rest).
   *  only = just these changed paths (debounced file events). */
  async sync(full = false, only?: Set<string>): Promise<SyncResult> {
    const folder = normFolder(this.st.folder); const res: SyncResult = { sent: 0, removed: 0, skipped: [], unchanged: 0 };
    if (!folder) return res;
    const lim = await this.limits();
    const files = this.vault.getMarkdownFiles().filter(f => inFolder(f.path, folder)).sort((a, b) => a.path.localeCompare(b.path));
    let sent = { ...(this.st.sent || {}) };
    // a different folder than Inbox Hero has: drop the old folder's notes first, then send this folder in full
    if (lim.folder && normFolder(lim.folder) !== folder) { await this.call(IH_PATHS.resync, "POST", { vault: this.vaultName, folder, paths: [] }); sent = {}; full = true; only = undefined; }
    const keep: string[] = [], up: IhNote[] = [], gone: string[] = []; let bytes = 0;
    for (const f of files) {
      if (only && !only.has(f.path)) { if (sent[f.path]) keep.push(f.path); continue; }
      const p = await this.prepare(f, lim);
      if (p.skip) { res.skipped.push({ path: f.path, why: p.skip }); if (sent[f.path]) gone.push(f.path); continue; }   // a note that now holds a secret leaves Inbox Hero
      const b = noteBytes(p.note!);
      if (keep.length >= lim.maxNotes || bytes + b > lim.maxTotalBytes) { res.skipped.push({ path: f.path, why: "over the limit" }); if (sent[f.path]) gone.push(f.path); continue; }
      keep.push(f.path); bytes += b;
      if (!full && sent[f.path] === p.note!.hash) { res.unchanged++; continue; }
      up.push(p.note!);
    }
    // notes Inbox Hero has that are no longer here (deleted, renamed, moved out of the folder)
    const here = new Set(files.map(f => f.path));
    for (const path of Object.keys(sent)) if (!here.has(path)) gone.push(path);
    const goneU = [...new Set(gone)];
    for (let i = 0; i < goneU.length; i += 200) await this.call(IH_PATHS.remove, "POST", { paths: goneU.slice(i, i + 200) });
    for (const p of goneU) delete sent[p]; res.removed = goneU.length;
    try { for (const b of batches(up, lim)) await this.upload(folder, b, res, sent); }
    catch (e: any) {
      if (!(e instanceof IhError && e.code === "folder_changed")) throw e;
      await this.call(IH_PATHS.resync, "POST", { vault: this.vaultName, folder, paths: [] }); sent = {};   // contract: 409 -> /resync with the new folder, then send again
      for (const b of batches(up, lim)) await this.upload(folder, b, res, sent);
    }
    if (full && !only) { const j = await this.call(IH_PATHS.resync, "POST", { vault: this.vaultName, folder, paths: keep }); res.removed += Math.max(0, Number(j?.removed) || 0); }
    this.st.sent = sent; this.st.lastSync = Date.now(); this.st.skipped = res.skipped; this.st.error = undefined;
    return res;
  }

  /** Scan the folder without sending anything: what would sync and what the secret scanner would skip. */
  async preview(folderIn?: string): Promise<{ notes: number; skipped: { path: string; why: string }[] }> {
    const folder = normFolder(folderIn ?? this.st.folder); if (!folder) return { notes: 0, skipped: [] };
    const out = { notes: 0, skipped: [] as { path: string; why: string }[] };
    for (const f of this.vault.getMarkdownFiles().filter(f => inFolder(f.path, folder))) { const p = await this.prepare(f, IH_LIMITS_DEFAULT); if (p.skip) out.skipped.push({ path: f.path, why: p.skip }); else out.notes++; }
    return out;
  }

  /** Revoke the token and ask Inbox Hero to delete everything synced with it. */
  async disconnect(): Promise<void> {
    try { await this.call(IH_PATHS.disconnect, "POST", {}); } finally { this.st.token = undefined; this.st.sent = {}; this.st.lastSync = undefined; this.st.skipped = []; }
  }
}

/** "Skipped 2 notes with sensitive data: A, B" (names only) */
export function skippedMessage(sk: { path: string; why: string }[]): string {
  const sens = sk.filter(s => /^sensitive/.test(s.why)), big = sk.filter(s => !/^sensitive/.test(s.why));
  const names = (l: typeof sk) => l.slice(0, 8).map(s => s.path.split("/").pop()!.replace(/\.md$/i, "")).join(", ") + (l.length > 8 ? ` and ${l.length - 8} more` : "");
  const parts: string[] = [];
  if (sens.length) parts.push(`Skipped ${sens.length} note${sens.length === 1 ? "" : "s"} with sensitive data: ${names(sens)}`);
  if (big.length) parts.push(`Left out ${big.length} note${big.length === 1 ? "" : "s"} (too large or over the limit): ${names(big)}`);
  return parts.join(". ");
}
