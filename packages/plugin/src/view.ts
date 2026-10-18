/**
 * "My profile" tab: the profile rendered inside Obsidian.
 *  - My view: built from the vault right now, plus the owner's private layer (owner.ts). Nothing here is published.
 *  - Public view: the live page on the hub, exactly as visitors see it (with the hub's live blocks).
 * The page runs in a sandboxed iframe with no access to the vault; a tiny bridge script posts clicks back here.
 */
import { ItemView, Notice, TFile, WorkspaceLeaf, setIcon, type App } from "obsidian";
import * as C from "@caldera/core";
import type CalderaPlugin from "./main";
import { renderOwner, type OwnerData, type VaultRef } from "./owner";
import { renderPrivateCity, type ProfileData } from "./render";

export const PROFILE_VIEW = "caldera-profile";
const DAY = 86_400_000;
const ymd = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const hm = (t: number) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const SKIP = /^(\.|Caldera\/|templates?\/|_templates\/)/i;

const BRIDGE = `(function(){var P=parent;document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a,[data-open],[data-action]');if(!a||a.hasAttribute('data-invite'))return;
var o=a.getAttribute('data-open'),ac=a.getAttribute('data-action');if(o){e.preventDefault();P.postMessage({caldera:'open',path:o},'*');return}if(ac){e.preventDefault();P.postMessage({caldera:'action',name:ac},'*');return}
var h=a.getAttribute('href');if(!h||h.charAt(0)==='#')return;e.preventDefault();P.postMessage({caldera:/^[a-z][a-z0-9+.-]*:/i.test(h)?'ext':'nav',href:h},'*')},true);
var t;addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){P.postMessage({caldera:'scroll',y:scrollY},'*')},250)});
addEventListener('load',function(){var H=%%HASH%%,Y=%%Y%%;var el=H&&document.getElementById(H);if(el)el.scrollIntoView();else if(Y)scrollTo(0,Y)})})();`;

export class ProfileView extends ItemView {
  private mode: "mine" | "public" = "mine";
  private current = "index.html";
  private built: { text: Record<string, string>; data: ProfileData; uris: Map<string, string>; city?: string } | null = null;
  private owner = "";
  private frame!: HTMLIFrameElement;
  private status!: HTMLElement;
  private scrollY = 0;
  private shownLooked?: string;
  private timer: number | null = null;
  private busy = false;

  constructor(leaf: WorkspaceLeaf, private plugin: CalderaPlugin) { super(leaf); }
  getViewType() { return PROFILE_VIEW; }
  getDisplayText() { return "My profile"; }
  getIcon() { return "user-round"; }

  async onOpen() {
    const root = this.contentEl; root.empty(); root.addClass("caldera-profile-view");
    const bar = root.createDiv("caldera-pv-bar");
    const seg = bar.createDiv("caldera-pv-seg");
    // same order and labels as the bar on the web: [Public view | Private view]
    const pub = seg.createEl("button", { text: "Public view", attr: { "aria-label": "Your live page on the hub, exactly as visitors see it" } });
    const mine = seg.createEl("button", { text: "Private view", attr: { "aria-label": "Your profile built from your vault, with private sections only you see" } });
    const setMode = (m: "mine" | "public") => { this.mode = m; mine.toggleClass("is-on", m === "mine"); pub.toggleClass("is-on", m === "public"); this.scrollY = 0; void this.show(); };
    mine.onclick = () => setMode("mine"); pub.onclick = () => setMode("public");
    mine.addClass("is-on");
    this.status = bar.createSpan({ cls: "caldera-pv-status" });
    const btn = (icon: string, label: string, fn: () => unknown) => { const b = bar.createEl("button", { cls: "clickable-icon", attr: { "aria-label": label } }); setIcon(b, icon); b.onclick = () => fn(); };
    btn("refresh-cw", "Refresh", () => this.refresh(true));
    btn("external-link", "Open in browser (signed in as you)", () => this.plugin.settings.handle ? void this.plugin.openProfile(this.current === "index.html" ? "" : this.current) : new Notice("Publish your profile first"));
    if (this.plugin.settings.privateUrl) btn("lock", "Open my private web view (Tailscale)", async () => { await this.plugin.pushPrivate(false); window.open(this.plugin.settings.privateUrl!); });
    btn("picture-in-picture-2", "Pop out my city (a small window that stays on top)", () => void this.popOut());
    btn("key-round", "Sign in another device (phone, other browser)", () => this.plugin.pairDevice());
    btn("upload-cloud", "Publish now", async () => { const u = await this.plugin.publish(); if (u && this.mode === "public") void this.show(); });

    this.frame = root.createEl("iframe", { cls: "caldera-pv-frame" });
    this.frame.setAttr("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox"); this.frame.setAttr("allow", "fullscreen"); this.frame.setAttr("allowfullscreen", "true");
    this.registerDomEvent(window, "message", e => this.onMessage(e));
    this.registerEvent(this.app.workspace.on("active-leaf-change", leaf => { if (leaf === this.leaf) this.markLooked(false); }));
    this.markLooked(true);
    await this.refresh(false);
    this.timer = window.setInterval(() => { if (this.mode === "mine" && this.contentEl.isShown()) void this.refresh(false); }, 10 * 60_000);
    this.liveTimer = window.setInterval(() => void this.pushLive(), 10_000);
    this.frame.addEventListener("load", () => window.setTimeout(() => void this.pushLive(), 400));
    // the Underground: a note you edit lights up and pulses through its links
    let lastPulse = 0;
    this.registerEvent(this.app.vault.on("modify", f => {
      if (this.mode !== "mine" || !this.current.startsWith("city.html") || Date.now() - lastPulse < 1500) return;
      lastPulse = Date.now(); this.frame.contentWindow?.postMessage({ caldera: "note", p: f.path }, "*");
    }));
  }

  async onClose() { if (this.timer) window.clearInterval(this.timer); if (this.liveTimer) window.clearInterval(this.liveTimer); }

  /** Pop the city out into a small window that stays on top (float.ts). My view floats the private city with live traffic;
   *  Public view floats the hub's page. */
  isReady() { return !!this.built || this.mode === "public"; }
  cityMini(): string | null { return this.built ? this.page("city.html", "").replace(/<head>/i, "<head><script>window.CALDERA_MINI=1</script>") : null; }
  async popOut() {
    const handle = this.plugin.settings.handle;
    if (this.mode === "mine" && this.built) return this.plugin.floatCity({ html: this.cityMini()!, live: true });
    if (!handle) return void new Notice("Publish your profile first");
    return this.plugin.floatCity({ src: `${this.plugin.profileUrl()}city.html?caldera=owner#mini` });
  }

  /** Live traffic for the city in My view: polled from the hub (signed in) and posted into the sandboxed page. */
  private liveTimer: number | null = null;
  private async pushLive() {
    if (this.mode !== "mine" || !this.current.startsWith("city.html") || !this.plugin.settings.traffic?.length || !this.contentEl.isShown()) return;
    try { const data = await this.plugin.ownerLive(); this.frame.contentWindow?.postMessage({ caldera: "live", data }, "*"); } catch { /* offline: the city just stays quiet */ }
  }

  /** "Since you last looked" moves forward when you come back after 30+ minutes away, not on every refresh. */
  private markLooked(first: boolean) {
    const s = this.plugin.settings, now = Date.now(), last = s.ownerLastLooked ? Date.parse(s.ownerLastLooked) : 0;
    if (first || now - last > 30 * 60_000) {
      this.shownLooked = s.ownerLastLooked; s.ownerLastLooked = new Date(now).toISOString(); void this.plugin.saveSettings();
      if (!first) void this.refresh(false);
    }
  }

  async refresh(loud: boolean) {
    if (this.busy) return; this.busy = true;
    try {
      this.status.setText("Building from your vault...");
      const { data, text, binaries, cityPrivate } = await this.plugin.build();
      const uris = new Map<string, string>();
      for (const [p, buf] of Object.entries(binaries)) {
        const mime = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : p.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
        uris.set(p, `data:${mime};base64,${C.b64.enc(new Uint8Array(buf))}`);
      }
      this.built = { text, data, uris, city: cityPrivate?.districts.length ? renderPrivateCity(data, cityPrivate) : undefined };
      this.owner = renderOwner(await collectOwner(this.app, this.plugin, data, this.shownLooked));
      if (this.plugin.floatSpec?.html) this.plugin.floatCity({ html: this.cityMini()!, live: true }, false);   // keep a floating city current
      await this.show();
      if (loud) new Notice("Profile refreshed");
    } catch (e: any) { this.status.setText("Couldn't build: " + e.message); }
    finally { this.busy = false; }
  }

  private async show() {
    if (this.mode === "public") {
      if (!this.plugin.settings.handle) { this.frame.removeAttribute("src"); this.frame.srcdoc = `<p style="font-family:sans-serif;padding:24px">Publish your profile to see the public view.</p>`; return; }
      this.frame.removeAttribute("srcdoc");
      this.frame.src = this.plugin.profileUrl() + this.current + (this.current.includes("?") ? "&" : "?") + "caldera=owner";
      this.status.setText("Live on the hub, as visitors see it");
      return;
    }
    if (!this.built) return;
    this.frame.removeAttribute("src");
    this.frame.srcdoc = this.page(this.current.split("#")[0], this.current.split("#")[1] || "");
    const t = new Date(); this.status.setText(`Private view, built ${hm(t.getTime())}. Private sections are only visible here.`);
  }

  private page(path: string, hash: string): string {
    const { text, uris } = this.built!;
    let html = path === "city.html" && this.built!.city ? this.built!.city : text[path] ?? text["index.html"];
    html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)*(assets\/[\w-]+\.css)">/g, (m, a) => text[a] ? `<style>${text[a]}</style>` : m)
      .replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g, "")
      .replace(/(src|href)="(?:\.\.\/)*([^"#?]+\.(?:png|jpe?g|webp|svg))"/g, (m, k, p) => uris.has(p) ? `${k}="${uris.get(p)}"` : m);
    if (path === "index.html") html = html.replace("<!--caldera:owner-->", this.owner);
    const script = `<script>${BRIDGE.replace("%%HASH%%", JSON.stringify(hash)).replace("%%Y%%", String(hash ? 0 : this.scrollY))}</script>`;
    return html.includes("</body>") ? html.replace("</body>", script + "</body>") : html + script;
  }

  private onMessage(e: MessageEvent) {
    if (e.source !== this.frame?.contentWindow || !e.data || typeof e.data !== "object") return;
    if ((e.data as { caldera?: string }).caldera === "popout") return void this.popOut();
    const d = e.data as { caldera: string; path?: string; href?: string; name?: string; y?: number };
    if (d.caldera === "scroll") { this.scrollY = Number(d.y) || 0; return; }
    if (d.caldera === "open" && d.path) { void this.app.workspace.openLinkText(d.path, "", true); return; }
    if (d.caldera === "action") {
      if (d.name === "panel") void this.plugin.openPanel();
      if (d.name === "finish-form") this.plugin.openFinish();
      if (d.name === "goals") void this.createGoals();
      if (d.name === "prompt") void this.plugin.copyPrompt("setup");
      if (d.name === "prompt-edit") void this.plugin.copyPrompt("edit");
      if (d.name === "pick-banner" || d.name === "pick-photo") void this.plugin.pickImage(d.name === "pick-banner" ? "banner" : "photo").then(ok => { if (ok) void this.refresh(false); });
      if (d.name === "prompt-banner" || d.name === "prompt-photo") void this.plugin.copyImagePrompt(d.name === "prompt-banner" ? "banner" : "photo");
      if (d.name === "settings") this.plugin.openSettings();
      if (d.name === "garden-help") new Notice(`Put any note in your "${this.plugin.settings.gardenFolder || "Garden"}" folder, or open a note and run "Caldera: Plant this note in my garden". It goes public on the next publish.`, 12_000);
      return;
    }
    if (d.caldera === "ext" && d.href) {
      const f = d.href.match(/^obsidian:\/\/caldera\?friend=([A-Za-z0-9_-]+)/);
      if (f) return void this.plugin.confirmFriend(f[1]);
      if (/^(https?:|mailto:|sms:)/i.test(d.href)) window.open(d.href);
      return;
    }
    if (d.caldera === "nav" && d.href && this.built) {
      const u = new URL(d.href, "https://profile.local/" + this.current.split("#")[0]);
      let p = decodeURIComponent(u.pathname.slice(1)); if (!p || p.endsWith("/")) p += "index.html";
      if ((this.built.text[p] !== undefined || (p === "city.html" && this.built.city)) && p.endsWith(".html")) { this.current = p + (u.hash ? u.hash : ""); this.scrollY = 0; void this.show(); }
      else if (this.plugin.settings.handle) window.open(this.plugin.profileUrl() + p);
    }
  }

  private async createGoals() {
    const p = "Caldera/Goals.md";
    let f = this.app.vault.getAbstractFileByPath(p);
    if (!f) f = await this.app.vault.create(p, "# Goals\n\nOnly you see these, in the My profile tab. One heading per goal, checkboxes for the steps.\n\n## Example goal\n- [ ] First step\n- [ ] Second step\n");
    if (f instanceof TFile) await this.app.workspace.getLeaf(true).openFile(f);
  }
}

// ------------------------------------------------------------------ the owner's private data (read from the vault)

async function excerpt(app: App, f: TFile, n = 220): Promise<string> {
  try {
    const t = (await app.vault.cachedRead(f)).replace(/^---[\s\S]*?---\s*/, "");
    const para = t.split(/\n\s*\n/).map(x => x.replace(/^#+\s.*$/gm, "").trim()).find(x => x.replace(/[^A-Za-z]/g, "").length > 40 && (x.match(/\|/g) || []).length < 2 && !/^(navigation|nav|tags|source|sources|related|see also|aliases|links?)\s*:/i.test(x) && !/^[-*]?\s*\[\[/.test(x)) || "";
    const clean = para.replace(/!\[\[[^\]]*\]\]/g, "").replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (_m, a, _b, l) => l || a).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-*>]\s+/gm, "").replace(/[*_`=~#]/g, "").replace(/\s+/g, " ").trim();
    return clean.length <= n ? clean : clean.slice(0, n).replace(/\s+\S*$/, "") + "…";
  } catch { return ""; }
}

export async function collectOwner(app: App, plugin: CalderaPlugin, data: ProfileData, lastLooked?: string): Promise<OwnerData> {
  const now = Date.now(), today = ymd(now), startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const files = app.vault.getMarkdownFiles().filter(f => !SKIP.test(f.path));
  const ref = (f: TFile, extra: Partial<VaultRef> = {}): VaultRef => ({ title: f.basename, path: f.path, ...extra });

  // since you last looked (hub, signed in with the vault's key)
  let activity: OwnerData["activity"];
  if (plugin.settings.identity && plugin.settings.handle) {
    try { activity = await plugin.ownerActivity(lastLooked || new Date(now - DAY).toISOString()); }
    catch (e: any) { activity = { error: e.message }; }
  }

  // today
  const touched = files.filter(f => f.stat.mtime >= startToday.getTime()).sort((a, b) => b.stat.mtime - a.stat.mtime);
  const d = data.daily?.[data.daily.length - 1];
  const todayRow = d && d.date === today ? d : undefined;
  const counts = todayRow ? Object.fromEntries(Object.entries(todayRow.counts || {}).filter(([, n]) => typeof n === "number")) as Record<string, number> : undefined;

  // on this day
  const onThisDay: OwnerData["onThisDay"] = [];
  for (const [days, label] of [[7, "A week ago"], [30, "A month ago"], [91, "Three months ago"], [365, "A year ago"]] as const) {
    const date = ymd(now - days * DAY);
    const named = files.filter(f => f.basename.includes(date)).sort((a, b) => Number(/digest|daily|journal/i.test(b.path)) - Number(/digest|daily|journal/i.test(a.path)));
    const made = files.filter(f => ymd(f.stat.ctime) === date && !named.includes(f)).sort((a, b) => b.stat.size - a.stat.size);
    const pick = [...named, ...made].slice(0, 2);
    onThisDay.push({ label, date, items: await Promise.all(pick.map(async f => ref(f, { excerpt: await excerpt(app, f) }))) });
  }

  // a note brought back: old, substantial, ideally connected to what you touched today; rotates every 3 hours
  const mc = app.metadataCache;
  const near = new Set<string>();
  for (const f of touched.slice(0, 40)) {
    for (const t of Object.keys(mc.resolvedLinks[f.path] || {})) near.add(t);
    for (const t of mc.getFileCache(f)?.tags || []) near.add(t.tag);
  }
  const old = files.filter(f => f.stat.mtime < now - 60 * DAY && f.stat.size > 1500 && !/\d{4}-\d{2}-\d{2}/.test(f.basename));
  const scored = old.map(f => {
    const links = Object.keys(mc.resolvedLinks[f.path] || {}), tags = (mc.getFileCache(f)?.tags || []).map(t => t.tag);
    const shared = [...links.filter(l => near.has(l)), ...tags.filter(t => near.has(t))];
    return { f, shared, score: shared.length + (near.has(f.path) ? 3 : 0) };
  });
  const block = Math.floor(now / (3 * 3600_000));
  const pool = scored.filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 24);
  const choice = pool.length ? pool[block % pool.length] : scored.length ? scored[(block * 7919) % scored.length] : undefined;
  let rediscovered: OwnerData["rediscovered"];
  if (choice) {
    const s = choice.shared[0];
    const why = near.has(choice.f.path) ? "You linked to this today." : s ? `Connects to what you worked on today: ${s.startsWith("#") ? s : s.split("/").pop()!.replace(/\.md$/, "")}.` :
      `Last changed ${new Date(choice.f.stat.mtime).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.`;
    let ex = await excerpt(app, choice.f, 320), pick = choice;
    for (let k = 1; !ex && k < Math.min(6, (pool.length || scored.length)); k++) {   // no readable prose: try the next candidate
      const alt = pool.length ? pool[(block + k) % pool.length] : scored[(block * 7919 + k) % scored.length];
      ex = await excerpt(app, alt.f, 320); if (ex) pick = alt;
    }
    const s2 = pick.shared[0];
    const why2 = pick === choice ? why : near.has(pick.f.path) ? "You linked to this today." : s2 ? `Connects to what you worked on today: ${s2.startsWith("#") ? s2 : s2.split("/").pop()!.replace(/\.md$/, "")}.` : `Last changed ${new Date(pick.f.stat.mtime).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.`;
    rediscovered = { ...ref(pick.f, { excerpt: ex }), why: why2 };
  }

  // patterns
  const patterns: string[] = [];
  const daily = data.daily || [];
  const sum = (xs: typeof daily) => xs.reduce((a, x) => a + (Number(x.counts?.notes) || 0), 0);
  const wk = sum(daily.slice(-7)), prev = sum(daily.slice(-14, -7));
  if (wk) patterns.push(`<b>${wk}</b> notes written or changed this week${prev ? `, ${wk >= prev ? "up" : "down"} ${Math.abs(Math.round((wk - prev) / prev * 100))}% on last week` : ""}.`);
  const hours = new Array(24).fill(0);
  for (const f of files) if (f.stat.mtime > now - 30 * DAY) hours[new Date(f.stat.mtime).getHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  if (hours[peak] > 5) patterns.push(`Most of your writing lands around <b>${peak === 0 ? "midnight" : peak < 12 ? peak + "am" : peak === 12 ? "noon" : (peak - 12) + "pm"}</b> (last 30 days).`);
  const tally = (lo: number, hi: number) => { const m = new Map<string, number>();
    for (const f of files) if (f.stat.mtime > now - hi * DAY && f.stat.mtime <= now - lo * DAY) for (const t of Object.keys(mc.resolvedLinks[f.path] || {})) {
      const name = t.split("/").pop()!.replace(/\.md$/, ""); if (/\d{4}-\d{2}-\d{2}/.test(name)) continue; m.set(name, (m.get(name) || 0) + 1); }
    return m; };
  const recent = tally(0, 7), before = tally(7, 35);
  const rising = [...recent].map(([k, n]) => [k, n - (before.get(k) || 0) / 4] as const).filter(([k, s]) => s >= 2 && (recent.get(k) || 0) >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (rising.length) patterns.push(`Rising this week: ${rising.map(([k]) => `<b>${esc(k)}</b>`).join(", ")}.`);
  const heat = data.heat || [];
  if (heat.length) {
    let i = heat.length - 1; if (heat[i].n === 0) i--; let streak = 0; while (i >= 0 && heat[i].n > 0) { streak++; i--; }
    if (streak > 1) patterns.push(`<b>${streak}-day</b> streak of writing in your vault.`);
    const best = heat.reduce((a, b) => b.n > a.n ? b : a);
    const last = heat[heat.length - 1];
    if (last.n > 0 && last.n >= best.n) patterns.push(`Today is your <b>busiest day in 6 months</b> (${last.n} notes touched).`);
    else if (best.n) patterns.push(`Your busiest day in 6 months: ${esc(best.date)} with ${best.n} notes touched. Today: ${last.n}.`);
  }

  // goals
  let goals: OwnerData["goals"] = null;
  const gf = app.vault.getAbstractFileByPath("Caldera/Goals.md");
  if (gf instanceof TFile) {
    goals = []; let cur: NonNullable<OwnerData["goals"]>[number] | null = null;
    for (const line of (await app.vault.cachedRead(gf)).split("\n")) {
      const h = line.match(/^#{2,3}\s+(.+)/); if (h) { cur = { heading: h[1].trim(), done: 0, total: 0, open: [] }; goals.push(cur); continue; }
      const c = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)/); if (!c) continue;
      if (!cur) { cur = { heading: "Goals", done: 0, total: 0, open: [] }; goals.push(cur); }
      cur.total++; if (c[1] !== " ") cur.done++; else cur.open.push(c[2].trim());
    }
    goals = goals.filter(g => g.total);
  }

  // what feeds the page (and whether the routine predates the current setup prompt)
  const last14 = (data.daily || []).slice(-14), has = (k: string) => last14.some(d => Number((d.counts as any)?.[k]) > 0);
  let act: any = null;
  try { const af = plugin.settings.activityFile || "Caldera/activity.json"; if (await app.vault.adapter.exists(af)) act = JSON.parse(await app.vault.adapter.read(af)); } catch { /* unreadable */ }
  const cityOn = (!!data.city?.districts.length && data.city.kind !== "vault") || await app.vault.adapter.exists("Caldera/city.json");
  const sources = [
    { label: "Daily journal", ok: last14.some(d => d.headline), hint: "a line a day, written by your AI agent from what you did" },
    { label: "Calendar", ok: has("meetings"), hint: "meetings attended (counts only)" },
    { label: "Email", ok: has("emails"), hint: "emails sent (counts only)" },
    { label: "AI usage", ok: has("prompts") || !!data.ai?.total, hint: "prompts and tokens from Claude Code, Codex" },
    { label: "Code", ok: has("commits") || !!data.code?.commits, hint: "commits, or add your GitHub username or Forgejo / Codeberg profile in settings" },
    { label: "Documents", ok: has("docs"), hint: "documents you produced or filed" },
    { label: "City", ok: cityOn, hint: data.city?.kind === "vault" ? "your city is built from your vault folders; add your GitHub username or Forgejo / Codeberg profile in settings to build it from your repos" : "your repos as a city: add your GitHub username or Forgejo / Codeberg profile in settings" },
    { label: "Page text", ok: !!data.summary, hint: "headline, summary, now, timeline" },
    { label: "Garden", ok: !!data.garden?.length, hint: "a few notes grown in public" },
  ];
  const promptOutdated = !!act?.days?.length && (Number(act.prompt_version) || 1) < C.PROMPT_VERSION;
  const checklist = plugin.settings.handle ? C.pageChecklist({ photo: !!data.avatar, banner: !!data.banner, headline: !!data.headline?.trim(), summary: !!data.summary?.trim(),
    links: (data.links || []).length > 0, garden: !!data.garden?.length, friend: plugin.friends.length > 0 || plugin.social.friends > 0, group: (plugin.settings.groups || []).length > 0,
    email: activity && !("error" in activity) && typeof activity.emailConfirmed === "boolean" ? activity.emailConfirmed : !!plugin.settings.summaryEmail }) : undefined;

  return {
    sources, promptOutdated, checklist,
    now: new Date(now).toISOString(), lastLooked, activity, pending: plugin.pending.length,
    today: { date: today, headline: todayRow?.headline, focus: todayRow?.focus, wins: todayRow?.wins, counts,
      timeline: touched.slice(0, 30).map(f => ref(f, { time: hm(f.stat.mtime), kind: f.stat.ctime >= startToday.getTime() ? "new" : "edit" })) },
    onThisDay, rediscovered, patterns, goals,
  };
}
