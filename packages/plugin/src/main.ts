/**
 * Caldera - the social layer for Obsidian.
 * Network use (disclosed): only when you publish, sync your inbox, or act on friends/asks/gravity,
 * and only to the hub you configure. No telemetry.
 */
import { App, FileSystemAdapter, ItemView, Modal, Notice, Plugin, Setting, SuggestModal, TFile, WorkspaceLeaf, normalizePath, requestUrl } from "obsidian";
import * as C from "@caldera/core";
import { CalderaSettingTab, CalderaSettings, DEFAULT_SETTINGS } from "./settings";
import { collectProfile } from "./collect";
import { renderProfile } from "./render";

const VIEW = "caldera-panel";
interface Friend { id: string; handle?: string; name?: string; box_key?: string; }
interface Pending { request: string; from: string; note?: string; ts: string; }

export default class CalderaPlugin extends Plugin {
  settings!: CalderaSettings;
  pending: Pending[] = [];
  friends: Friend[] = [];
  social = { friends: 0, gravity: 0, credits: 0 };
  private token: { value: string; until: number } | null = null;
  private timers: number[] = [];

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new CalderaSettingTab(this.app, this));
    this.registerView(VIEW, leaf => new CalderaView(leaf, this));
    this.addRibbonIcon("flame", "Caldera", () => this.openPanel());

    this.addCommand({ id: "preview", name: "Preview my public profile", callback: () => this.preview() });
    this.addCommand({ id: "publish", name: "Publish my profile", callback: () => this.publish() });
    this.addCommand({ id: "open", name: "Open my public profile", callback: () => this.openProfile() });
    this.addCommand({ id: "welcome", name: "Set up my profile (welcome)", callback: () => new WelcomeModal(this.app, this).open() });
    this.addCommand({ id: "export", name: "Export profile to a vault folder (self-host)", callback: () => this.exportToFolder() });
    this.addCommand({ id: "panel", name: "Open friends panel", callback: () => this.openPanel() });
    this.addCommand({ id: "sync", name: "Sync inbox now", callback: () => this.syncInbox(true) });
    this.addCommand({ id: "share", name: "Share this note with a friend", checkCallback: (check) => {
      const f = this.app.workspace.getActiveFile(); if (!f) return false; if (!check) this.shareNote(f); return true; } });
    this.addCommand({ id: "delete", name: "Delete my profile from the hub", callback: () => new ConfirmModal(this.app, "Delete your Caldera profile from the hub? Your page, friendships, asks, offers, gravity and credits on the hub are erased. Your vault is not touched.", async () => {
      try { await this.send("profile.delete", {}); new Notice("Your Caldera profile was deleted from the hub."); } catch (e: any) { new Notice(e.message); } }).open() });
    this.addCommand({ id: "agent-prompt", name: "Copy AI agent setup prompt (daily journal + activity)", callback: () => this.copyPrompt("setup") });
    this.addCommand({ id: "richer-prompt", name: "Copy AI prompt: make my profile richer", callback: () => this.copyPrompt("richer") });
    this.addCommand({ id: "ask", name: "Post an ask (I could use help with...)", callback: () => new AskModal(this.app, this, "ask").open() });
    this.addCommand({ id: "offer", name: "Post an offer (I can help with...)", callback: () => new AskModal(this.app, this, "offer").open() });

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.identity && this.settings.handle) this.syncInbox(false);
      else if (!this.settings.welcomed) new WelcomeModal(this.app, this).open();   // first run: one screen to a live profile
    });
    this.timers.push(window.setInterval(() => this.settings.identity && this.syncInbox(false), 10 * 60_000));
    this.scheduleAutoPublish();
  }

  onunload() { this.timers.forEach(t => window.clearInterval(t)); }
  async saveSettings() { await this.saveData(this.settings); }

  async ensureIdentity(quiet = false): Promise<C.Identity> {
    if (!this.settings.identity) {
      this.settings.identity = C.newIdentity(); await this.saveSettings();
      if (!quiet) new Notice("Caldera identity created. Export your recovery key from settings and keep it safe.");
    }
    return this.settings.identity;
  }

  scheduleAutoPublish() {
    if ((this as any)._auto) window.clearInterval((this as any)._auto);
    const h = this.settings.autoPublishHours;
    if (h > 0) (this as any)._auto = window.setInterval(() => this.publish(true), h * 3600_000);
  }

  // ---------------------------------------------------------------- hub client
  private async api(method: "GET" | "POST", path: string, body?: unknown, auth = false): Promise<any> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (auth) headers.authorization = "Bearer " + await this.authToken();
    const r = await requestUrl({ url: this.settings.hubUrl.replace(/\/$/, "") + path, method, headers, body: body ? JSON.stringify(body) : undefined, throw: false });
    if (r.status >= 400) throw new Error(r.json?.error || `hub error ${r.status}`);
    return r.json;
  }

  async send(type: C.EnvelopeType, body: unknown) { return this.api("POST", "/v1/envelopes", C.sign(await this.ensureIdentity(), type, body)); }

  private async authToken(): Promise<string> {
    if (this.token && this.token.until > Date.now()) return this.token.value;
    const me = await this.ensureIdentity();
    const { nonce } = await this.api("POST", "/v1/auth/challenge", { id: me.id });
    const { token, expires_in } = await this.api("POST", "/v1/auth/verify", C.sign(me, "message", { nonce }));
    this.token = { value: token, until: Date.now() + (expires_in - 60) * 1000 };
    return token;
  }

  // ---------------------------------------------------------------- profile
  private async build() {
    const { data, files } = await collectProfile(this.app, this.settings, this.settings.sections.social ? this.social : undefined);
    const text = renderProfile(data);
    return { data, text, binaries: files };
  }

  async preview() {
    const { text, binaries } = await this.build();
    let html = text["index.html"]
      .replace('<link rel="stylesheet" href="assets/theme.css">', `<style>${text["assets/theme.css"]}</style>`)
      .replace('<link rel="stylesheet" href="assets/profile.css">', `<style>${text["assets/profile.css"]}</style>`);
    for (const [p, buf] of Object.entries(binaries)) {
      const mime = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : "image/jpeg";
      html = html.split(`src="${p}"`).join(`src="data:${mime};base64,${C.b64.enc(new Uint8Array(buf))}"`);
    }
    new PreviewModal(this.app, html).open();
  }

  async copyPrompt(kind: "setup" | "richer") {
    const a = this.app.vault.adapter;
    const text = (kind === "richer" ? C.richerPrompt : C.agentPrompt)({
      vaultPath: a instanceof FileSystemAdapter ? a.getBasePath() : undefined,
      hubUrl: this.settings.hubUrl, handle: this.settings.handle || undefined,
      activityFile: this.settings.activityFile, publicTopics: this.settings.publicTopics.map(t => t[0]), installed: true,
    });
    try { await navigator.clipboard.writeText(text); new Notice(kind === "richer" ? "Prompt copied. Paste it into your AI agent; it asks before making anything public." : "Agent prompt copied. Paste it into your AI agent (Claude Code, Codex, ...) and schedule it daily."); }
    catch { new PromptModal(this.app, text).open(); }
  }

  async publish(quiet = false): Promise<string | null> {
    try {
      if (!this.settings.handle) throw new Error("Set a handle in Caldera settings first");
      const me = await this.ensureIdentity();
      const { data, text, binaries } = await this.build();
      const manifest = C.sign(me, "profile.manifest", {
        name: data.name, handle: this.settings.handle, boxKey: me.boxPublic, headline: data.headline || "",
        photos: { avatar: data.avatar, banner: data.banner }, links: data.links,
        sections: Object.keys(data.sections).filter(k => data.sections[k]), stats: data.stats,
        daily: data.daily.map(d => ({ date: d.date, score: C.activityScore(d.counts), headline: d.headline || "", counts: d.counts })),
        topics: data.topics, asks: data.asks, offers: data.offers, listed: this.settings.listed !== false, page: "index.html", updated: data.updated,
      });
      const files: Record<string, string> = {};
      for (const [p, t] of Object.entries(text)) files[p] = C.b64.enc(new TextEncoder().encode(t));
      for (const [p, b] of Object.entries(binaries)) files[p] = C.b64.enc(new Uint8Array(b));
      const r = await this.api("POST", `/v1/profiles/${encodeURIComponent(me.id)}/bundle`, { manifest, files });
      const url = this.profileUrl();
      if (!quiet) new Notice(`Published: ${url}`);
      return url;
    } catch (e: any) { new Notice("Caldera publish failed: " + e.message); return null; }
  }

  profileUrl() { return `${this.settings.hubUrl.replace(/\/$/, "")}/@${this.settings.handle}/`; }
  openProfile() { if (this.settings.handle) window.open(this.profileUrl()); else new WelcomeModal(this.app, this).open(); }

  async exportToFolder() {
    const { text, binaries } = await this.build();
    const root = "Caldera/site";
    for (const [p, t] of Object.entries(text)) await this.write(`${root}/${p}`, t);
    for (const [p, b] of Object.entries(binaries)) await this.writeBinary(`${root}/${p}`, b);
    new Notice(`Exported to ${root}. Upload that folder to any static host.`);
  }

  // ---------------------------------------------------------------- inbox
  async syncInbox(loud: boolean) {
    try {
      const me = await this.ensureIdentity();
      const [{ envelopes }, fr, gr, cr] = await Promise.all([
        this.api("GET", `/v1/inbox/${encodeURIComponent(me.id)}?since=${encodeURIComponent(this.settings.lastInboxSync)}`, undefined, true),
        this.api("GET", `/v1/friends/${encodeURIComponent(me.id)}`), this.api("GET", `/v1/gravity/${encodeURIComponent(me.id)}`), this.api("GET", `/v1/credits/${encodeURIComponent(me.id)}`)]);
      this.friends = fr.friends; this.social = { friends: fr.friends.length, gravity: gr.gravity, credits: cr.balance };
      let cards = 0;
      for (const e of envelopes as C.Envelope<any>[]) {
        if (!C.verify(e)) continue;
        if (e.type === "friend.request" && !this.friends.some(f => f.id === e.from)) this.pending.push({ request: C.envelopeHash(e), from: e.from, note: e.body.note, ts: e.ts });
        if (e.type === "friend.accept") new Notice("Caldera: a friend request was accepted");
        if (e.type === "gravity") new Notice(`Caldera: someone gave you gravity${e.body.reason ? ': "' + e.body.reason + '"' : ""}`);
        if (e.type === "card") { if (await this.receiveCard(e)) cards++; }
        if (e.ts > this.settings.lastInboxSync) this.settings.lastInboxSync = e.ts;
      }
      await this.saveSettings();
      this.refreshPanel();
      if (loud || cards) new Notice(`Caldera: inbox synced${cards ? `, ${cards} shared note(s) received` : ""}`);
    } catch (e: any) { if (loud) new Notice("Caldera sync failed: " + e.message); }
  }

  private async receiveCard(e: C.Envelope<any>): Promise<boolean> {
    const me = this.settings.identity!; const sealed = e.body.payload?.[me.id];
    const sender = this.friends.find(f => f.id === e.from);
    if (!sealed || !sender?.box_key) return false;
    const text = C.open(sealed, sender.box_key, me); if (text === null) return false;
    const who = sender.handle || e.from.slice(4, 12);
    const safe = String(e.body.title || "Shared note").replace(/[\\/:*?"<>|#^[\]]/g, " ").trim().slice(0, 80);
    const fm = `---\ncaldera_from: "${who}"\ncaldera_card: "${e.body.id}"\ncaldera_version: ${Number(e.body.version) || 1}\ncaldera_received: ${e.ts}\n---\n`;
    await this.write(`${this.settings.inboxFolder}/${who}/${safe}.md`, fm + text.replace(/^---[\s\S]*?---\s*/, ""));
    return true;
  }

  async acceptFriend(p: Pending) {
    await this.send("friend.accept", { request: p.request, to: p.from });
    this.pending = this.pending.filter(x => x !== p);
    await this.syncInbox(false); new Notice("Friend added");
  }

  async requestFriend(handleOrId: string, note = "") {
    const pr = await this.api("GET", `/v1/profiles/${encodeURIComponent(handleOrId.replace(/^@/, ""))}`);
    await this.send("friend.request", { to: pr.id, note }); new Notice(`Friend request sent to @${pr.handle || pr.id}`);
  }

  async giveGravity(f: Friend, reason: string) {
    const r = await this.send("gravity", { to: f.id, reason: reason.slice(0, 140) });
    new Notice(`Gravity sent. @${f.handle || "friend"} now has ${r.gravity}`);
  }

  async shareNote(file: TFile) {
    if (!this.friends.length) await this.syncInbox(false);
    if (!this.friends.length) return new Notice("Add a friend first (Caldera panel)");
    new FriendPicker(this.app, this.friends, async f => {
      if (!f.box_key) return new Notice("That friend has not published a profile yet");
      const me = await this.ensureIdentity();
      const text = await this.app.vault.read(file);
      const version = Date.now();
      await this.send("card", { id: "card_" + C.b58encode(new TextEncoder().encode(file.path)).slice(0, 20), title: file.basename, to: [f.id],
        payload: { [f.id]: C.seal(text, f.box_key, me) }, version });
      new Notice(`Shared "${file.basename}" with @${f.handle || "friend"} (end-to-end encrypted)`);
    }).open();
  }

  // ---------------------------------------------------------------- utils
  private async ensureFolder(path: string) {
    const parts = normalizePath(path).split("/").slice(0, -1); let cur = "";
    for (const p of parts) { cur = cur ? `${cur}/${p}` : p; if (!this.app.vault.getAbstractFileByPath(cur)) await this.app.vault.createFolder(cur).catch(() => {}); }
  }
  private async write(path: string, text: string) {
    path = normalizePath(path); await this.ensureFolder(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) await this.app.vault.modify(f, text); else await this.app.vault.create(path, text);
  }
  private async writeBinary(path: string, data: ArrayBuffer) {
    path = normalizePath(path); await this.ensureFolder(path);
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) await this.app.vault.modifyBinary(f, data); else await this.app.vault.createBinary(path, data);
  }
  async openPanel() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getRightLeaf(false)!; await leaf.setViewState({ type: VIEW, active: true }); }
    this.app.workspace.revealLeaf(leaf);
  }
  refreshPanel() { for (const l of this.app.workspace.getLeavesOfType(VIEW)) (l.view as CalderaView).render(); }
}

// ------------------------------------------------------------------ friends panel
class CalderaView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: CalderaPlugin) { super(leaf); }
  getViewType() { return VIEW; }
  getDisplayText() { return "Caldera"; }
  getIcon() { return "flame"; }
  async onOpen() { this.render(); this.plugin.syncInbox(false); }

  render() {
    const el = this.contentEl; el.empty(); el.addClass("caldera-panel");
    const p = this.plugin, s = p.settings;
    el.createEl("h3", { text: "Caldera" });
    if (!s.identity || !s.handle) {
      el.createEl("p", { text: "Set your name and handle in Settings, then publish your profile to join." });
      new Setting(el).addButton(b => b.setButtonText("Open settings").setCta().onClick(() => { (this.app as any).setting.open(); (this.app as any).setting.openTabById("caldera"); }));
      return;
    }
    const stats = el.createDiv("caldera-stats");
    for (const [v, l] of [[p.social.friends, "friends"], [p.social.gravity, "gravity"], [p.social.credits, "credits"]] as const)
      stats.createDiv({ cls: "caldera-stat" }).innerHTML = `<b>${v}</b><span>${l}</span>`;
    const actions = el.createDiv("caldera-actions");
    actions.createEl("button", { text: "Preview" }).onclick = () => p.preview();
    actions.createEl("button", { text: "Publish", cls: "mod-cta" }).onclick = () => p.publish();
    actions.createEl("button", { text: "Sync" }).onclick = () => p.syncInbox(true);

    if (p.pending.length) {
      el.createEl("h4", { text: "Friend requests" });
      for (const r of p.pending) {
        const row = el.createDiv("caldera-row");
        row.createSpan({ text: r.from.slice(0, 14) + (r.note ? ` - "${r.note}"` : "") });
        row.createEl("button", { text: "Accept", cls: "mod-cta" }).onclick = () => p.acceptFriend(r);
      }
    }
    el.createEl("h4", { text: "Add a friend" });
    let handle = "";
    new Setting(el).addText(t => t.setPlaceholder("@handle").onChange(v => handle = v)).addButton(b => b.setButtonText("Request").onClick(async () => {
      try { await p.requestFriend(handle.trim()); } catch (e: any) { new Notice(e.message); }
    }));
    el.createEl("h4", { text: `Friends (${p.friends.length})` });
    for (const f of p.friends) {
      const row = el.createDiv("caldera-row");
      row.createSpan({ text: "@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : "") });
      row.createEl("button", { text: "+ Gravity" }).onclick = () => new GravityModal(this.app, f, r => p.giveGravity(f, r)).open();
    }
  }
}

// ------------------------------------------------------------------ modals
class PreviewModal extends Modal {
  constructor(app: App, private html: string) { super(app); }
  onOpen() {
    this.modalEl.addClass("caldera-preview-modal");
    this.titleEl.setText("Public profile preview (exactly what visitors will see)");
    const frame = this.contentEl.createEl("iframe", { cls: "caldera-preview" });
    frame.setAttr("sandbox", "allow-scripts"); (frame as HTMLIFrameElement).srcdoc = this.html;
  }
}

class FriendPicker extends SuggestModal<Friend> {
  constructor(app: App, private list: Friend[], private pick: (f: Friend) => void) { super(app); this.setPlaceholder("Share with which friend?"); }
  getSuggestions(q: string) { return this.list.filter(f => (f.handle || f.name || f.id).toLowerCase().includes(q.toLowerCase())); }
  renderSuggestion(f: Friend, el: HTMLElement) { el.setText("@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : "")); }
  onChooseSuggestion(f: Friend) { this.pick(f); }
}

class GravityModal extends Modal {
  constructor(app: App, private f: Friend, private done: (reason: string) => void) { super(app); }
  onOpen() {
    this.titleEl.setText(`Add gravity to @${this.f.handle || "friend"}`);
    this.contentEl.createEl("p", { text: "Gravity is positive only. Say what they helped with (optional)." });
    let reason = "";
    new Setting(this.contentEl).addText(t => t.setPlaceholder("They found me an operator").onChange(v => reason = v))
      .addButton(b => b.setButtonText("Add gravity").setCta().onClick(() => { this.done(reason); this.close(); }));
  }
}

class ConfirmModal extends Modal {
  constructor(app: App, private msg: string, private yes: () => void) { super(app); }
  onOpen() {
    this.titleEl.setText("Are you sure?"); this.contentEl.createEl("p", { text: this.msg });
    new Setting(this.contentEl).addButton(b => b.setButtonText("Cancel").onClick(() => this.close()))
      .addButton(b => b.setButtonText("Delete").setWarning().onClick(() => { this.yes(); this.close(); }));
  }
}

class AskModal extends Modal {
  constructor(app: App, private plugin: CalderaPlugin, private kind: "ask" | "offer") { super(app); }
  onOpen() {
    const ask = this.kind === "ask";
    this.titleEl.setText(ask ? "I could use help with..." : "I can help with...");
    let title = "", bounty = 20;
    new Setting(this.contentEl).setName("What").addText(t => t.onChange(v => title = v));
    if (ask) new Setting(this.contentEl).setName("Bounty (help credits)").setDesc("Held until you award it to whoever helps")
      .addText(t => t.setValue("20").onChange(v => bounty = Math.max(0, Number(v) || 0)));
    new Setting(this.contentEl).addButton(b => b.setButtonText(ask ? "Post ask" : "Post offer").setCta().onClick(async () => {
      if (!title.trim()) return;
      try {
        const id = C.newId(ask ? "ask" : "off");
        await this.plugin.send(ask ? "ask" : "offer", ask ? { id, title, bounty, tags: [], visibility: "public" } : { id, title, tags: [] });
        if (ask) this.plugin.settings.asks.push({ id, title, bounty }); else this.plugin.settings.offers.push({ id, title });
        await this.plugin.saveSettings(); new Notice(ask ? "Ask posted" : "Offer posted"); this.close();
      } catch (e: any) { new Notice(e.message); }
    }));
  }
}

class PromptModal extends Modal {
  constructor(app: App, private text: string) { super(app); }
  onOpen() {
    this.titleEl.setText("AI agent setup prompt");
    const ta = this.contentEl.createEl("textarea", { cls: "caldera-prompt" });
    ta.value = this.text; ta.rows = 18; ta.style.width = "100%"; ta.readOnly = true; ta.select();
  }
  onClose() { this.contentEl.empty(); }
}

/** First run: name + handle -> identity created on this device -> publish -> profile opens in the browser. */
class WelcomeModal extends Modal {
  constructor(app: App, private plugin: CalderaPlugin) { super(app); }
  onOpen() {
    const s = this.plugin.settings;
    this.modalEl.addClass("caldera-welcome");
    this.titleEl.setText("Welcome to Caldera");
    this.contentEl.createEl("p", { text: "Pick a name and a handle. Caldera creates your identity on this device, publishes your profile, and opens it in your browser. Nothing private leaves your vault." });
    let name = s.name, handle = s.handle, headline = s.headline;
    const status = createEl("div", { cls: "caldera-welcome-status" });
    const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    new Setting(this.contentEl).setName("Your name").addText(t => t.setPlaceholder("Ada Lovelace").setValue(name).onChange(v => name = v.trim()));
    new Setting(this.contentEl).setName("Handle").setDesc(`${s.hubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/@handle`)
      .addText(t => t.setPlaceholder("ada").setValue(handle).onChange(v => { handle = clean(v); if (v !== handle) t.setValue(handle); status.setText(""); }));
    let listed = s.listed !== false;
    new Setting(this.contentEl).setName("List me in the directory").setDesc("Your card appears on the public People page. You can change this anytime.")
      .addToggle(t => t.setValue(listed).onChange(v => listed = v));
    new Setting(this.contentEl).setName("Headline").setDesc("Optional, one line").addText(t => t.setPlaceholder("Building things with notes").setValue(headline).onChange(v => headline = v.trim()));
    this.contentEl.appendChild(status);
    const go = new Setting(this.contentEl).addButton(b => b.setButtonText("Create my profile").setCta().onClick(async () => {
      if (!name) { status.setText("Add your name."); return; }
      if (handle.length < 3) { status.setText("Handles need at least 3 letters or numbers."); return; }
      b.setDisabled(true); b.setButtonText("Publishing...");
      try {
        const me = await this.plugin.ensureIdentity(true);
        const r = await requestUrl({ url: `${s.hubUrl.replace(/\/$/, "")}/v1/profiles/${handle}`, throw: false });
        if (r.status === 200 && r.json?.id !== me.id) { status.setText(`@${handle} is taken. Try another.`); b.setDisabled(false); b.setButtonText("Create my profile"); return; }
        Object.assign(s, { name, handle, headline, listed, welcomed: true });
        if (!s.autoPublishHours) s.autoPublishHours = 6;
        await this.plugin.saveSettings(); this.plugin.scheduleAutoPublish();
        const url = await this.plugin.publish(true);
        if (!url) { status.setText("Publishing failed. Check your connection and try again."); b.setDisabled(false); b.setButtonText("Create my profile"); return; }
        window.open(url);
        this.done(url);
      } catch (e: any) { status.setText(e.message); b.setDisabled(false); b.setButtonText("Create my profile"); }
    }));
    go.settingEl.addClass("caldera-welcome-go");
  }
  done(url: string) {
    this.contentEl.empty(); this.titleEl.setText("Your profile is live");
    const link = this.contentEl.createEl("p").createEl("a", { text: url, href: url });
    link.addEventListener("click", e => { e.preventDefault(); window.open(url); });
    this.contentEl.createEl("p", { text: "It updates itself every 6 hours from your vault. To change it, edit Settings -> Caldera (sections, photo, links) or your notes, then run 'Caldera: Publish my profile' - or let your AI agent do it." });
    this.contentEl.createEl("p", { text: "Your login is a key stored in this vault - no password. Save a copy so you can recover your profile on another device:", cls: "caldera-welcome-key" });
    new Setting(this.contentEl)
      .addButton(b => b.setButtonText("Copy recovery key").onClick(async () => {
        await navigator.clipboard.writeText(btoa(JSON.stringify(this.plugin.settings.identity)));
        new Notice("Recovery key copied. Paste it into your password manager. Anyone with it can act as you.");
      }))
      .addButton(b => b.setButtonText("Open my profile").setCta().onClick(() => window.open(url)))
      .addButton(b => b.setButtonText("Done").onClick(() => this.close()));
  }
  onClose() { this.contentEl.empty(); }
}
