/**
 * Caldera - the social layer for Obsidian.
 * Network use (disclosed): only when you publish, sync your inbox, or act on friends/asks/gravity,
 * and only to the hub you configure. No telemetry.
 */
import { App, FileSystemAdapter, ItemView, Menu, Modal, Notice, Plugin, Setting, SuggestModal, TFile, WorkspaceLeaf, normalizePath, requestUrl } from "obsidian";
import * as C from "@caldera/core";
import { CalderaSettingTab, CalderaSettings, DEFAULT_SETTINGS, WELCOME_NOTE, agentSetupPrompt, groupsFrom } from "./settings";
import { collectProfile } from "./collect";
import { renderProfile, renderPrivateCity } from "./render";
import { gardenManifest, LICENSES } from "./garden";
import type { GardenReport } from "./collect";
import { PROFILE_FILE, effectiveSettings, ensureProfileFile } from "./profile-file";
import { ProfileView, PROFILE_VIEW, collectOwner } from "./view";
import { CityFloatView, CITY_FLOAT_VIEW, FLOAT_SIZE, type FloatSpec } from "./float";
import { renderOwner } from "./owner";
import { QUICK_LINKS, quickLinkIndex, quickLinkUrl } from "./links";

const VIEW = "caldera-panel";
interface Friend { id: string; handle?: string; name?: string; box_key?: string; kind?: string; why?: string; }
interface Pending { request: string; from: string; handle?: string; note?: string; ts: string; }
interface Suggestion { id: string; handle: string; name: string; headline: string; why: string; }

export default class CalderaPlugin extends Plugin {
  settings!: CalderaSettings;
  pending: Pending[] = [];
  sent: Pending[] = [];         // my requests nobody has answered yet
  friends: Friend[] = [];
  social = { friends: 0, gravity: 0, credits: 0 };
  suggestions: Suggestion[] = [];
  /** members who asked to meet you (double opt-in introductions waiting for your answer) */
  intros: { id: string; handle: string; name: string; headline: string; tag: string; ts: string }[] = [];
  private token: { value: string; until: number } | null = null;
  private timers: number[] = [];

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new CalderaSettingTab(this.app, this));
    this.registerView(VIEW, leaf => new CalderaView(leaf, this));
    this.registerView(PROFILE_VIEW, leaf => new ProfileView(leaf, this));
    this.registerView(CITY_FLOAT_VIEW, leaf => new CityFloatView(leaf, this));
    this.addRibbonIcon("flame", "Caldera", () => this.openPanel());
    this.addRibbonIcon("user-round", "My Caldera profile", () => this.openProfileTab());
    this.pending = [...(this.settings.pendingRequests || [])];
    // obsidian://caldera?friend=<handle> - the "Add as friend" button on every Caldera profile and garden page
    // obsidian://caldera?group=<name> - "Join from Obsidian" on a group's town page
    this.registerObsidianProtocolHandler("caldera", params => {
      const friend = String(params.friend || "").replace(/^@/, "").toLowerCase();
      if (friend && /^[a-z0-9][a-z0-9-]{1,30}$/.test(friend) && !this.settings.handle && !this.settings.invitedBy) { this.settings.invitedBy = friend; void this.saveSettings(); }   // came from their invite
      if (params.group) void this.joinGroup(String(params.group));
      if (friend) void this.confirmFriend(friend);
      if (params.open === "private") void this.openPrivate();   // "Private view in Obsidian" on your own public page
      if (params.open === "finish") void this.openProfileTab();   // "Finish your page" from the daily email
    });

    this.addCommand({ id: "preview", name: "Preview my public profile", callback: () => this.preview() });
    this.addCommand({ id: "publish", name: "Publish my profile", callback: () => this.publish() });
    this.addCommand({ id: "open", name: "Open my public page (as owner)", callback: () => this.openProfile() });
    this.addCommand({ id: "open-private", name: "Open my private view", callback: () => this.openPrivate() });
    this.addCommand({ id: "profile-tab", name: "Open my profile in Obsidian (Public view + Private view)", callback: () => this.openProfileTab() });
    this.addCommand({ id: "pop-city", name: "Pop out my city (small window that stays on top)", callback: () => void this.popCity() });
    this.addCommand({ id: "pair-device", name: "Sign in another device", callback: () => this.pairDevice() });
    this.addCommand({ id: "masthead", name: "Set my masthead (cover image)", callback: () => this.pickImage("banner") });
    this.addCommand({ id: "masthead-prompt", name: "Copy AI prompt: make my masthead", callback: () => this.copyImagePrompt("banner") });
    this.addCommand({ id: "profile-file", name: "Edit my profile (open profile.md)", callback: () => this.openProfileFile() });
    this.addCommand({ id: "edit-prompt", name: "Copy AI prompt: change my profile", callback: () => this.copyPrompt("edit") });
    this.addCommand({ id: "whats-new", name: "What's new", callback: () => this.checkReleases(true) });
    this.addCommand({ id: "guide", name: "Open the guide", callback: () => window.open(this.settings.hubUrl.replace(/\/$/, "") + "/guide.html") });
    this.registerEvent(this.app.metadataCache.on("changed", (f, _d, cache) => {
      if (f.path === PROFILE_FILE) this.queuePublish("profile");
      // a daily note's public journal fields feed the journal and the journal-grown garden
      else if (/^\d{4}-\d{2}-\d{2}$/.test(f.basename) && cache?.frontmatter && Object.keys(cache.frontmatter).some(k => k.startsWith("caldera_"))) this.queuePublish("activity");
    }));
    this.registerEvent(this.app.vault.on("modify", f => { if (f.path === this.settings.activityFile) this.queuePublish("activity"); }));
    if (C.gardenEnabled()) {   // the garden is paused (core flags.ts): its commands only exist while it's on
      this.addCommand({ id: "garden-preview", name: "Preview my garden (what goes public + privacy check)", callback: () => this.previewGarden() });
      this.addCommand({ id: "garden-plant", name: "Plant this note in my garden (make it public)", checkCallback: (check) => {
        const f = this.app.workspace.getActiveFile(); if (!f || f.extension !== "md") return false; if (!check) void this.plantNote(f); return true; } });
    }
    this.addCommand({ id: "welcome", name: "Set up my profile (welcome)", callback: () => new WelcomeModal(this.app, this).open() });
    this.addCommand({ id: "finish", name: C.gardenEnabled() ? "Finish my page (name, photo, masthead, links, first garden note)" : "Finish my page (name, photo, masthead, links)", callback: () => this.openFinish() });
    this.addCommand({ id: "export", name: "Export profile to a vault folder (self-host)", callback: () => this.exportToFolder() });
    this.addCommand({ id: "panel", name: "Open friends panel", callback: () => this.openPanel() });
    this.addCommand({ id: "sync", name: "Sync inbox now", callback: () => this.syncInbox(true) });
    this.addCommand({ id: "share", name: "Share this note with a friend", checkCallback: (check) => {
      const f = this.app.workspace.getActiveFile(); if (!f) return false; if (!check) void this.shareNote(f); return true; } });
    this.addCommand({ id: "delete", name: "Delete my profile from the hub", callback: () => new ConfirmModal(this.app, "Delete your Caldera profile from the hub? Your page, friendships, asks, offers, gravity and credits on the hub are erased. Your vault is not touched.", async () => {
      try { await this.send("profile.delete", {}); new Notice("Your Caldera profile was deleted from the hub."); } catch (e: any) { new Notice(e.message); } }).open() });
    this.addCommand({ id: "agent-prompt", name: "Copy the AI setup prompt (connects every source; safe to paste again)", callback: () => this.copyPrompt("setup") });
    this.addCommand({ id: "share-page", name: "Share my page (link preview, invite link)", callback: () => this.openShare() });
    this.addCommand({ id: "ask", name: "Post an ask (I could use help with...)", callback: () => new AskModal(this.app, this, "ask").open() });
    this.addCommand({ id: "offer", name: "Post an offer (I can help with...)", callback: () => new AskModal(this.app, this, "offer").open() });

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.openProfileOnStartup) void this.openProfileTab();
      this.schedulePrivatePush(); if (this.settings.privateWeb) window.setTimeout(() => { void this.pushPrivate(false); }, 30_000);
      if (this.settings.identity && this.settings.handle) void this.syncInbox(false);
      else if (!this.settings.welcomed) new WelcomeModal(this.app, this).open();   // first run: one screen to a live profile
      window.setTimeout(() => { void this.checkReleases(false); }, 8_000);
      window.setTimeout(() => { void this.offerFinish(); }, 12_000);   // once: a bare page gets an offer to fill it in
      // catch up after Obsidian was closed: the daily journal (and the garden it grows) may have changed meanwhile
      window.setTimeout(() => { if (this.settings.identity && this.settings.handle && this.settings.autoPublishHours > 0 && Date.now() - (this.settings.lastPublished || 0) > 6 * 3600_000) void this.publish(true); }, 20_000);
    });
    this.timers.push(window.setInterval(() => { if (this.settings.identity) void this.syncInbox(false); }, 10 * 60_000));
    this.scheduleAutoPublish();
  }

  // every repeating timer is cleared on unload: an update or reload must not leave the old code publishing in the background
  onunload() { this.timers.forEach(t => window.clearInterval(t)); for (const k of ["_auto", "_priv"]) if ((this as any)[k]) window.clearInterval((this as any)[k]); this.unloaded = true; }
  private unloaded = false;
  async saveSettings() { await this.saveData(this.settings); }

  /** Take over a profile that was started with "Sign up with GitHub" on the hub (one-time code from caldera.social/me). */
  async importGithub(code: string): Promise<boolean> {
    if (!/^CAL-[\w-]{6,}$/.test(code)) { new Notice("Paste the code from your account page (it starts with CAL-)."); return false; }
    const go = async () => {
      try {
        const r = await this.api("POST", "/v1/github/claim", { code });
        if (!r?.identity?.id || !r.handle) throw new Error("the hub didn't return the profile");
        if (this.settings.identity && this.settings.identity.id !== r.identity.id) (this.settings as any).previousIdentity = this.settings.identity;   // kept, in case
        this.settings.identity = r.identity; this.settings.handle = r.handle;
        if (!this.settings.name && r.name) this.settings.name = r.name;
        if (!this.settings.headline && r.headline) this.settings.headline = r.headline;
        await this.saveSettings();
        new Notice(`@${r.handle} now lives in this vault. Publishing it from your vault...`);
        const url = await this.publish(true); if (url) new Notice("Published: " + url);
        return true;
      } catch (e: any) { new Notice("Couldn't import: " + e.message); return false; }
    };
    if (this.settings.identity && this.settings.handle) {
      return new Promise<boolean>(res => new ConfirmModal(this.app, `This vault is already @${this.settings.handle}. Importing switches it to the GitHub profile (your current key is kept in settings as a backup, but @${this.settings.handle} stops updating). Continue?`,
        async () => res(await go()), "Import", "Switch profiles?").open());
    }
    return go();
  }

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
    if (h > 0) (this as any)._auto = window.setInterval(() => { void this.publish(true); }, h * 3600_000);
  }

  // ---------------------------------------------------------------- hub client
  /** "Your GitHub people" (circle logins not on Caldera yet), loaded when the friends panel opens. */
  ghPeople: { people: { login: string; avatar: string; url: string; relation: string; invited: boolean; canEmail: boolean }[]; message: string; invitesLeft: number } | null = null;
  ghPeopleLoading = false;
  async loadGithubPeople(): Promise<void> {
    const me = this.settings.identity; if (!me || !this.settings.handle || this.ghPeopleLoading) return;
    this.ghPeopleLoading = true;
    try { this.ghPeople = await this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/github-people`, undefined, true); } catch { this.ghPeople = { people: [], message: "", invitesLeft: 0 }; }
    finally { this.ghPeopleLoading = false; }
  }
  async githubInvite(login: string): Promise<string> {
    const me = this.settings.identity!; const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/github-invite`, { login }, true);
    return String(r?.message || "Invite sent.");
  }
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
  /** Link counts are only right once Obsidian has resolved every link (it re-indexes after a restart). */
  /** Wait until Obsidian has indexed every note (so link counts are right), at most 10s. Obsidian has no public
   *  "resolved" flag and the "resolved" event may already have fired, so check the caches directly. */
  private linksResolved(): Promise<void> {
    const mc = this.app.metadataCache;
    const ready = () => this.app.vault.getMarkdownFiles().every(f => mc.getFileCache(f));
    if (ready()) return Promise.resolve();
    return new Promise(r => {
      const t0 = Date.now();
      const tick = window.setInterval(() => { if (ready() || Date.now() - t0 > 10_000) { window.clearInterval(tick); r(); } }, 250);
    });
  }

  async build() {
    await this.linksResolved();
    const eff = effectiveSettings(this.app, this.settings);   // Caldera/profile.md wins over settings
    const { data, files, gardenReport, cityPrivate } = await collectProfile(this.app, eff, eff.sections.social ? this.social : undefined);
    data.hub = this.settings.hubUrl; data.id = this.settings.identity?.id;
    const text = renderProfile(data);
    return { data, text, binaries: files, eff, gardenReport, cityPrivate };
  }

  async openProfileFile() {
    const f = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
    await this.app.workspace.getLeaf(true).openFile(f);
  }

  // republish shortly after the owner (or their agent) edits Caldera/profile.md or the activity file
  private publishTimer: number | null = null;
  queuePublish(reason: "profile" | "activity") {
    if (!this.settings.identity || !this.settings.handle) return;
    if (this.publishTimer) window.clearTimeout(this.publishTimer);
    this.publishTimer = window.setTimeout(() => {
      this.publishTimer = null;
      void this.publish(true).then(url => { if (url && reason === "profile") new Notice("Caldera: your public page was updated."); });
    }, 45_000);
  }

  // What's new: the hub's release feed, shown only to the owner, inside Obsidian
  async checkReleases(manual = false) {
    try {
      const r = await requestUrl({ url: this.settings.hubUrl.replace(/\/$/, "") + "/releases.json", throw: false });
      const list: Release[] = r.status === 200 ? (r.json?.releases || []) : [];
      if (!list.length) { if (manual) new Notice("Couldn't load release notes."); return; }
      const seen = list.findIndex(x => x.version === this.settings.lastSeenRelease);
      if (!this.settings.lastSeenRelease && !manual) { this.settings.lastSeenRelease = list[0].version; await this.saveSettings(); return; }
      const unseen = manual ? list.slice(0, 3) : list.slice(0, seen === -1 ? 1 : seen);
      if (!unseen.length) return;
      const open = () => { new WhatsNewModal(this.app, this, unseen).open(); this.settings.lastSeenRelease = list[0].version; void this.saveSettings(); };
      if (manual) return open();
      const frag = createFragment(f => { f.createEl("b", { text: `Caldera ${unseen[0].version}: ` }); f.appendText(unseen[0].title + " "); f.createEl("u", { text: "See what's new" }); });
      const n = new Notice(frag, 20_000); n.noticeEl.addEventListener("click", open);
    } catch { if (manual) new Notice("Couldn't load release notes."); }
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

  async copyPrompt(kind: "setup" | "richer" | "edit") {
    const a = this.app.vault.adapter;
    const hub = this.settings.hubUrl.replace(/\/$/, "");
    const extras = this.settings.agentKey ? `\nMy agent hook (only if I say yes above), exactly as Caldera gave it to me:\n\n${agentSetupPrompt(hub, this.settings.agentKey)}` : "";
    const text = (kind === "edit" ? C.editPrompt : C.agentPrompt)({ extras,
      vaultPath: a instanceof FileSystemAdapter ? a.getBasePath() : undefined,
      hubUrl: this.settings.hubUrl, handle: this.settings.handle || undefined,
      activityFile: this.settings.activityFile, publicTopics: this.settings.publicTopics.map(t => t[0]), installed: true,
    });
    try { await navigator.clipboard.writeText(text); new Notice(kind === "edit" ? "Prompt copied. Paste it into your AI agent." : "Setup prompt copied. Paste it into Claude Code, Codex or Cursor: it connects every source it can find, keeps it fresh, and asks before anything goes public.", 8000); }
    catch { new PromptModal(this.app, text).open(); }
  }

  async publish(quiet = false): Promise<string | null> {
    if (this.unloaded) return null;
    this.lastPublishError = "";
    try {
      if (!this.settings.handle) throw new Error("Set a handle in Caldera settings first");
      const me = await this.ensureIdentity();
      const { data, text, binaries, eff, cityPrivate } = await this.build();
      const manifest = C.sign(me, "profile.manifest", {
        name: data.name, handle: this.settings.handle, boxKey: me.boxPublic, headline: data.headline || "",
        photos: { avatar: data.avatar, banner: data.banner }, links: data.links,
        sections: Object.keys(data.sections).filter(k => data.sections[k]), stats: data.stats,
        daily: data.daily.map(d => ({ date: d.date, score: C.activityScore(d.counts), headline: d.headline || "", counts: d.counts })),
        topics: data.topics, asks: data.asks, offers: data.offers, listed: eff.listed !== false, ...((eff as any).autoConnectRepos === false || (eff as any).autoConnectGithub === false || this.settings.autoConnectRepos === false ? { autoConnectRepos: false, autoConnectGithub: false } : {}), showViews: this.settings.showViews !== false,
        ...((eff as any).tags?.length ? { tags: (eff as any).tags.slice(0, 12) } : {}), ...((eff as any).hideTags?.length ? { hideTags: (eff as any).hideTags.slice(0, 40) } : {}),
        ...((eff as any).autoTags === false || this.settings.autoTags === false ? { autoTags: false } : {}), page: "index.html", updated: data.updated,
        // the garden: every public note with its stage, license and a sha256 of the published text, signed with the profile
        garden: data.garden?.length && eff.sections.garden !== false ? gardenManifest(data.garden) : undefined, gardenUrl: data.gardenExternal,
        groups: groupsFrom((this.settings.groups || []).join(",")), languages: (data as any).code?.languages?.slice(0, 6) || [],
        invitedBy: this.settings.invitedBy || undefined,   // the hub only uses it on a profile's first publish
      });
      const files: Record<string, string> = {};
      for (const [p, t] of Object.entries(text)) files[p] = C.b64.enc(new TextEncoder().encode(t));
      for (const [p, b] of Object.entries(binaries)) files[p] = C.b64.enc(new Uint8Array(b));
      await this.api("POST", `/v1/profiles/${encodeURIComponent(me.id)}/bundle`, { manifest, files, v: this.manifest.version });
      this.settings.lastPublished = Date.now(); await this.saveSettings();
      if (this.settings.privateWeb) void this.pushPrivate(false);
      void this.syncSites(cityPrivate, data.city?.districts.map(d => d.name) || []);
      const url = this.profileUrl();
      if (!quiet) new Notice(`Published: ${url}`);
      // once, after the page is first live (or after updating to a Caldera with sharing): offer to share it
      if (!this.settings.sharePrompted && this.settings.welcomed) { this.settings.sharePrompted = true; await this.saveSettings(); window.setTimeout(() => this.openShare(), 1500); }
      return url;
    } catch (e: any) { this.lastPublishError = e.message; if (!quiet) new Notice("Caldera publish failed: " + e.message); else console.warn("Caldera publish failed:", e.message); return null; }
  }
  lastPublishError = "";

  async previewGarden() {
    const { gardenReport, eff } = await this.build();
    new GardenPreviewModal(this.app, gardenReport, eff.gardenFolder ?? "Garden", this.settings.handle ? `${this.profileUrl()}garden.html` : "").open();
  }

  /** Opt a note into the garden: caldera: garden + stage + license (only fills what is missing). */
  async plantNote(f: TFile) {
    await this.app.fileManager.processFrontMatter(f, (fm: any) => {
      fm.caldera = "garden"; if (!fm.stage) fm.stage = "seedling"; if (!fm.license) fm.license = "all-rights";
    });
    new Notice(`"${f.basename}" is now in your garden as a seedling. It goes public on the next publish; run "Preview my garden" to check it first.`);
  }

  profileUrl() { return `${this.settings.hubUrl.replace(/\/$/, "")}/@${this.settings.handle}/`; }
  /** Open the public page in the browser signed in as its owner (a one-time link sets an owner cookie on the hub), so the
   *  page shows a "Private view" button instead of the sign-up pitch, and the owner's own visits aren't counted. */
  async openProfile(sub = "") {
    if (!this.settings.handle || !this.settings.identity) return void new WelcomeModal(this.app, this).open();
    try { const r = await this.api("POST", `/v1/owner/${encodeURIComponent(this.settings.identity.id)}/link`, {}, true); if (r?.url) return void window.open(sub ? `${r.url}&to=${encodeURIComponent(sub)}` : r.url); }
    catch (e: any) { console.warn("Caldera owner link failed:", e.message); }
    window.open(this.profileUrl() + sub);
  }
  /** Approve a sign-in code shown on another device (caldera.social/signin): that browser becomes the owner's. */
  pairDevice() {
    if (!this.settings.identity || !this.settings.handle) return void new Notice("Publish your profile first.");
    new PairModal(this.app, async code => {
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(this.settings.identity!.id)}/pair`, { code }, true);
      new Notice(`Signed in. That device now shows the Private view button on @${r.handle || this.settings.handle}.`, 8000);
    }, this.profileUrl()).open();
  }
  /** Write the setup form into Caldera/profile.md: name, headline, listed, chosen images (saved as Caldera/photo|banner.ext),
   *  the four quick links (replacing only those, keeping every other link), and plant a first garden note. */
  async applyProfileForm(f: { name: string; headline: string; listed: boolean; images: Record<"photo" | "banner", { buf: ArrayBuffer; ext: string } | null>; links: [string, string][]; plant: TFile | null }) {
    const v = this.app.vault, paths: Partial<Record<"photo" | "banner", string>> = {};
    for (const kind of ["photo", "banner"] as const) {
      const im = f.images[kind]; if (!im) continue;
      if (!v.getAbstractFileByPath("Caldera")) await v.createFolder("Caldera").catch(() => {});
      const path = normalizePath(`Caldera/${kind}.${im.ext}`), old = v.getAbstractFileByPath(path);
      if (old instanceof TFile) await v.modifyBinary(old, im.buf); else await v.createBinary(path, im.buf);
      paths[kind] = path;
    }
    const pf = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
    await this.app.fileManager.processFrontMatter(pf, (fm: any) => {
      fm.name = f.name; fm.headline = f.headline; fm.listed = f.listed;
      if (paths.photo) fm.photo = paths.photo; if (paths.banner) fm.banner = paths.banner;
      const old: string[] = Array.isArray(fm.links) ? fm.links.map(String) : [];
      const keep = old.filter(l => { const [a = "", ...b] = l.split("|"); return quickLinkIndex(a, b.join("|").trim()) < 0; });
      fm.links = [...f.links.filter(([, u]) => u).map(([l, u]) => `${l} | ${u}`), ...keep];
    });
    if (f.plant && C.gardenEnabled()) await this.plantNote(f.plant);
  }
  openSettings() { const st = (this.app as any).setting; if (!st) return; st.open(); st.openTabById?.(this.manifest.id); }
  /** Copy a focused prompt that has the owner's AI agent set a masthead or profile photo. */
  /** "Unlock more": the slice of the setup prompt for one feature (or "all" still off), with this owner's own snippets and agent hook. */
  async copyFeaturePrompt(id: string) {
    const a = this.app.vault.adapter, s = this.settings, hub = s.hubUrl.replace(/\/$/, "");
    const o = { vaultPath: a instanceof FileSystemAdapter ? a.getBasePath() : undefined, hubUrl: s.hubUrl, handle: s.handle || undefined, activityFile: s.activityFile,
      agentSetup: s.agentKey ? agentSetupPrompt(hub, s.agentKey) : undefined };
    const snippets = (s.traffic || []).map(t => `- ${t.project}: <script async src="${hub}/t.js" data-site="${t.key}"></script>`).join("\n");
    const withSnippets = (t: string) => snippets ? `${t}\n\nMy snippets, one per district (these are public site keys, fine in page HTML):\n${snippets}` : t;
    const ids = ["live", "agents", "ai", "private", "story", "code"] as const;
    let text: string;
    if (id === "all") {
      const view = this.app.workspace.getLeavesOfType(PROFILE_VIEW)[0]?.view as any;
      const left = (view?.ownerData?.unlock || []).filter((i: any) => !i.done).map((i: any) => i.id).filter((x: string) => (ids as readonly string[]).includes(x));
      text = withSnippets(C.upgradePrompt(left.length ? left : [...ids], o));
      if (o.agentSetup && (!left.length || left.includes("agents"))) text += `\n\nMy agent hook, exactly as Caldera gave it to me (keep the key and secret out of any repo):\n\n${o.agentSetup}`;
    } else if ((ids as readonly string[]).includes(id)) text = id === "live" ? withSnippets(C.featurePrompt("live", o)) : C.featurePrompt(id as typeof ids[number], o);
    else return;
    try { await navigator.clipboard.writeText(text); new Notice("Prompt copied. Paste it into Claude Code, Codex or Cursor.", 6000); }
    catch { new PromptModal(this.app, text).open(); }
  }

  async copyImagePrompt(kind: "banner" | "photo") {
    const a = this.app.vault.adapter;
    const text = C.imagePrompt(kind, { vaultPath: a instanceof FileSystemAdapter ? a.getBasePath() : undefined, hubUrl: this.settings.hubUrl, handle: this.settings.handle || undefined });
    try { await navigator.clipboard.writeText(text); new Notice(`Prompt copied. Paste it into your AI agent: it sets your ${kind === "banner" ? "masthead" : "photo"} and the page republishes itself.`, 8000); }
    catch { new PromptModal(this.app, text).open(); }
  }
  /** Choose an image from disk: copied into the vault as Caldera/<kind>.<ext>, set in Caldera/profile.md (which republishes). */
  pickImage(kind: "banner" | "photo"): Promise<boolean> {
    return new Promise(done => new ImagePickModal(this.app, kind, async (buf, ext) => {
      const path = normalizePath(`Caldera/${kind}.${ext}`), v = this.app.vault;
      if (!v.getAbstractFileByPath("Caldera")) await v.createFolder("Caldera").catch(() => {});
      const old = v.getAbstractFileByPath(path);
      if (old instanceof TFile) await v.modifyBinary(old, buf); else await v.createBinary(path, buf);
      const pf = await ensureProfileFile(this.app, this.settings, this.settings.hubUrl);
      await this.app.fileManager.processFrontMatter(pf, fm => { fm[kind === "banner" ? "banner" : "photo"] = path; });
      new Notice(`${kind === "banner" ? "Masthead" : "Photo"} set. Your page republishes in about a minute.`);
      done(true);
    }, () => done(false)).open());
  }
  /** The private view: the Tailscale web address when this hub gives you one, otherwise My view inside Obsidian. */
  async openPrivate() {
    if (this.settings.privateUrl) { void this.pushPrivate(false); return void window.open(this.settings.privateUrl); }
    await this.openProfileTab();
  }

  async exportToFolder() {
    const { text, binaries } = await this.build();
    const root = "Caldera/site";
    for (const [p, t] of Object.entries(text)) await this.write(`${root}/${p}`, t);
    for (const [p, b] of Object.entries(binaries)) await this.writeBinary(`${root}/${p}`, b);
    new Notice(`Exported to ${root}. Upload that folder to any static host.`);
  }

  // ---------------------------------------------------------------- inbox
  /** Add friend / Accept tapped on caldera.social while signed in: the hub queues it (it never holds this vault's key);
   *  this signs and sends it, and the hub clears the queue entry when the request or acceptance lands. */
  async sendQueuedFriends(myId: string) {
    let list: { id: string; handle: string | null; kind: "add" | "accept"; request?: string | null }[] = [];
    try { list = (await this.api("GET", `/v1/owner/${encodeURIComponent(myId)}/intents`, undefined, true))?.intents || []; } catch { return; }
    const done: string[] = [];
    for (const x of list.slice(0, 20)) {
      try {
        if (x.kind === "accept" && x.request) await this.send("friend.accept", { request: x.request, to: x.id });
        else await this.send("friend.request", { to: x.id, note: "" });
        done.push((x.kind === "accept" ? "accepted @" : "sent a request to @") + (x.handle || "someone"));
      } catch (e: any) { console.warn("Caldera queued friend failed:", e?.message); }
    }
    if (done.length) new Notice(`Caldera: from your taps on the web, ${done.join(", ")}.`, 8000);
  }

  async syncInbox(loud: boolean) {
    try {
      const me = await this.ensureIdentity();
      const [{ envelopes }, fr, gr, cr, rq] = await Promise.all([
        this.api("GET", `/v1/inbox/${encodeURIComponent(me.id)}?since=${encodeURIComponent(this.settings.lastInboxSync)}`, undefined, true),
        this.api("GET", `/v1/friends/${encodeURIComponent(me.id)}`), this.api("GET", `/v1/gravity/${encodeURIComponent(me.id)}`), this.api("GET", `/v1/credits/${encodeURIComponent(me.id)}`),
        this.api("GET", `/v1/requests/${encodeURIComponent(me.id)}`, undefined, true).catch(() => null)]);
      this.friends = fr.friends; this.social = { friends: fr.friends.length, gravity: gr.gravity, credits: cr.balance };
      // shared-repo friendships the hub made: announce each once
      const seen = new Set(this.settings.seenRepoFriends || []), fresh = this.friends.filter(f => (f.kind === "repo" || f.kind === "github") && f.why && !seen.has(f.id));
      if (fresh.length) {
        if (this.settings.seenRepoFriends) for (const f of fresh.slice(0, 3)) new Notice(`Caldera: you and ${f.handle ? "@" + f.handle : "a member"} are now connected: ${f.kind === "repo" ? "you both work on " : ""}${f.why}.`, 10_000);
        this.settings.seenRepoFriends = [...seen, ...fresh.map(f => f.id)].slice(-500); await this.saveSettings();   // first sync after updating: remember, don't announce
      }
      await this.sendQueuedFriends(me.id);
      let cards = 0;
      for (const e of envelopes as C.Envelope<any>[]) {
        if (!C.verify(e)) continue;
        if (!rq && e.type === "friend.request" && !this.friends.some(f => f.id === e.from) && !this.pending.some(x => x.from === e.from)) {   // older hub
          let handle: string | undefined; try { handle = (await this.api("GET", `/v1/profiles/${encodeURIComponent(e.from)}`)).handle; } catch { /* unpublished sender */ }
          this.pending.push({ request: C.envelopeHash(e), from: e.from, handle, note: e.body.note, ts: e.ts });
          new Notice(`Caldera: friend request from ${handle ? "@" + handle : "someone new"}. Open the Caldera panel to accept.`);
        }
        if (e.type === "friend.accept") { const f = this.friends.find(x => x.id === e.from); new Notice(`Caldera: ${f?.handle ? "@" + f.handle : "someone"} accepted your friend request`); }
        if (e.type === "gravity") new Notice(`Caldera: someone gave you gravity${e.body.reason ? ': "' + e.body.reason + '"' : ""}`);
        if (e.type === "card") { if (await this.receiveCard(e)) cards++; }
        if (e.ts > this.settings.lastInboxSync) this.settings.lastInboxSync = e.ts;
      }
      if (rq) {
        // the hub keeps every open request, so one lost on this device (a crash, an old copy of the plugin) comes back
        const ignored = new Set(this.settings.ignoredRequests || []), seen = new Set(this.settings.seenRequests || []);
        this.pending = (rq.incoming as any[]).filter(r => !ignored.has(r.request)).map(r => ({ request: r.request, from: r.id, handle: r.handle || undefined, note: r.note || undefined, ts: r.ts }));
        this.sent = (rq.outgoing as any[]).map(r => ({ request: r.request, from: r.id, handle: r.handle || undefined, note: r.note || undefined, ts: r.ts }));
        const fresh = this.pending.filter(x => !seen.has(x.request));
        if (fresh.length) new Notice(`Caldera: friend request from ${fresh.map(x => x.handle ? "@" + x.handle : "someone new").join(", ")}. Open the Caldera panel to accept.`, 10_000);
        this.settings.seenRequests = this.pending.map(x => x.request);
      }
      this.pending = this.pending.filter(x => !this.friends.some(f => f.id === x.from));
      this.settings.pendingRequests = this.pending;
      await this.saveSettings();
      if (this.settings.handle) {
        try { this.suggestions = (await this.api("GET", `/v1/suggest/${encodeURIComponent(me.id)}?n=4`)).suggestions || []; } catch { /* older hub */ }
        try { const r = await this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/intros`, undefined, true); this.intros = r.intros || [];
          const seen = new Set(this.settings.seenIntros || []), fresh = this.intros.filter(i => !seen.has(i.handle + i.ts));
          if (fresh.length) new Notice(`Caldera: ${fresh.map(i => "@" + i.handle).join(", ")} would like to meet you${fresh[0]!.tag ? ` (also building ${fresh[0]!.tag})` : ""}. Open the Caldera panel to answer.`, 10_000);
          this.settings.seenIntros = this.intros.map(i => i.handle + i.ts); } catch { /* older hub */ }
        void this.welcomeNewMembers(); void this.attention(); void this.kudosNews(); void this.checkAlerts();
      }
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
    try { await this.send("friend.accept", { request: p.request, to: p.from }); } catch (e: any) { return void new Notice("Couldn't accept: " + e.message); }
    this.pending = this.pending.filter(x => x !== p); this.settings.pendingRequests = this.pending;
    await this.syncInbox(false); new Notice(`You and ${p.handle ? "@" + p.handle : "your new friend"} are now friends`);
  }

  async ignoreFriend(p: Pending) {
    this.settings.ignoredRequests = [...(this.settings.ignoredRequests || []), p.request].slice(-200);
    this.pending = this.pending.filter(x => x !== p); this.settings.pendingRequests = this.pending;
    await this.saveSettings(); this.refreshPanel();
  }

  /** Join a group (obsidian://caldera?group=): it goes into the next publish, and the group's town lists this profile. */
  async joinGroup(raw: string) {
    const g = groupsFrom(raw)[0]; if (!g) return;
    if ((this.settings.groups || []).includes(g)) return void new Notice(`You're already in ${g}.`);
    this.settings.groups = [...(this.settings.groups || []), g]; await this.saveSettings();
    if (!this.settings.identity || !this.settings.handle) return void new Notice(`You'll join ${g} when you publish your profile.`);
    const url = await this.publish(true);
    new Notice(url ? `You joined ${g}. Your city is on ${this.settings.hubUrl.replace(/\/$/, "")}/g/${g}` : `Saved: you'll join ${g} on the next publish.`);
  }

  openFinish() { new WelcomeModal(this.app, this, this.settings.handle && this.settings.identity ? "finish" : "welcome").open(); }
  /** Existing profiles with a bare page (no photo, headline or links): offer the setup form once. */
  async offerFinish() {
    const s = this.settings; if (!s.identity || !s.handle || !s.welcomed || s.finishOffered || this.unloaded) return;
    const e = effectiveSettings(this.app, s);
    if (e.avatarPath && e.headline?.trim() && (e.links || []).length) return;
    s.finishOffered = true; await this.saveSettings();
    new ConfirmModal(this.app, "Your page is live, but it's still bare. Add a photo, a masthead, a headline and a few links in about a minute - no AI needed.", () => this.openFinish(), "Finish my page", "Finish your page").open();
  }
  openShare() { if (!this.settings.handle) return void new WelcomeModal(this.app, this).open(); new ShareModal(this.app, this).open(); }

  /** Daily summary email: the hub sends a confirmation link first. Empty turns it off. */
  async setSummaryEmail(email: string) {
    try {
      const me = await this.ensureIdentity(); if (!this.settings.handle) throw new Error("Publish your profile first");
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/email`, { email: email || null }, true);
      this.settings.summaryEmail = email; await this.saveSettings();
      new Notice(r.off ? "Daily summary emails are off." : r.message || "Check your inbox for a confirmation link.", 8000);
    } catch (e: any) { new Notice("Couldn't save: " + e.message); }
  }

  /** New alerts from Caldera (welcome, release notes, announcements) appear once as a notice; click opens them, signed in. */
  async checkAlerts() {
    const s = this.settings; if (!s.identity || !s.handle) return;
    try {
      const r = await this.api("GET", `/v1/owner/${encodeURIComponent(s.identity.id)}/alerts`, undefined, true);
      const fresh = (r?.alerts || []).filter((x: any) => !x.read && (!s.lastAlertTs || x.ts > s.lastAlertTs)).slice(0, 2);
      const newest = (r?.alerts || []).reduce((m: string, x: any) => x.ts > m ? x.ts : m, s.lastAlertTs || "");
      if (newest !== (s.lastAlertTs || "")) { s.lastAlertTs = newest; await this.saveSettings(); }
      for (const x of fresh) {
        const frag = createFragment(f => { f.createEl("b", { text: "Caldera: " }); f.appendText(String(x.title) + " "); f.createEl("u", { text: "Read it" }); });
        const n = new Notice(frag, 20_000); n.noticeEl.addEventListener("click", () => void this.openProfile("alerts"));
      }
    } catch { /* offline or older hub */ }
  }

  /** At most once a day: if people looked at the page, linked to it or befriended you, say so (click: share it). */
  async attention() {
    const s = this.settings, today = new Date().toISOString().slice(0, 10);
    if (s.lastAttention?.slice(0, 10) === today) return;
    try {
      const since = s.lastAttention || new Date(Date.now() - 7 * 86400_000).toISOString();
      const a = await this.ownerActivity(since);
      s.lastAttention = new Date().toISOString(); await this.saveSettings();
      const bits: string[] = [], n = (x: number, one: string, many = one + "s") => `${x} ${x === 1 ? one : many}`;
      if (a.visitors) bits.push(n(a.visitors, "visitor"));
      if (a.friends?.length) bits.push(n(a.friends.length, "new friend"));
      if (a.gravity?.length) bits.push(n(a.gravity.length, "gift of gravity", "gifts of gravity"));
      if (C.gardenEnabled() && a.links?.length) bits.push(n(a.links.length, "link into your garden", "links into your garden"));
      if (!bits.length) return;
      const days = Math.max(1, Math.round((Date.now() - Date.parse(since)) / 86400_000));
      const frag = createFragment(f => { f.createEl("b", { text: `Caldera, ${days >= 6 ? "this week" : days === 1 ? "since yesterday" : `last ${days} days`}: ` }); f.appendText(bits.join(", ") + ". "); f.createEl("u", { text: "Share your page" }); });
      const note = new Notice(frag, 15_000); note.noticeEl.addEventListener("click", () => this.openShare());
    } catch { /* offline or older hub */ }
  }

  /** New kudos since the last sync: a Notice per batch (who sent what). */
  async kudosNews() {
    const s = this.settings, me = s.identity; if (!me || !s.handle) return;
    try {
      const since = s.lastKudos || new Date(Date.now() - 86400_000).toISOString();
      const r = await this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/kudos?since=${encodeURIComponent(since)}`, undefined, true);
      const list: { emoji: string; from: string | null; ts: string }[] = r.kudos || [];
      if (!list.length) return;
      s.lastKudos = list[0]!.ts; await this.saveSettings();
      const who = list.slice(0, 3).map(k => `${k.emoji} ${k.from ? "@" + k.from : "someone"}`).join(", ");
      new Notice(`Caldera: kudos from ${who}${list.length > 3 ? ` and ${list.length - 3} more` : ""}`, 12_000);
    } catch { /* offline or older hub */ }
  }

  /** Send someone kudos from Obsidian (one per person per day). */
  /** answer an introduction (accept -> friends; not now -> closed, they aren't told), or ask to meet someone */
  async introduce(handle: string, how: "accept" | "decline" | "ask") {
    const me = this.settings.identity; if (!me) return;
    try { const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/intros/${encodeURIComponent(handle)}`, how === "ask" ? { ask: true } : { accept: how === "accept" }, true);
      this.intros = this.intros.filter(i => i.handle !== handle);
      new Notice(how === "accept" || r.state === "friends" ? `You and @${handle} are now friends` : how === "ask" ? `Asked to meet @${handle}. They can accept or say not now.` : "Closed. They won't be told.");
      if (how === "accept" || r.state === "friends") await this.syncInbox(false); else this.refreshPanel();
    } catch (e: any) { new Notice(e.message); }
  }
  async sendKudos(handle: string, kind: "heart" | "up" | "fire" | "sparkle") {
    const me = this.settings.identity; if (!me || !this.settings.handle) return void new Notice("Publish your page first.");
    try { await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/kudos`, { to: handle, kind }, true); new Notice(`Kudos sent to @${handle}`); }
    catch (e: any) { new Notice(e.message); }
  }

  /** Community hosts: a friend request (with a note) to each person who joins after the option was turned on. */
  async welcomeNewMembers() {
    const s = this.settings; if (!s.welcomeNew || !s.identity || !s.handle) return;
    const today = new Date().toISOString().slice(0, 10), day = s.welcomeDay?.[0] === today ? s.welcomeDay[1] : 0;
    if (day >= 10) return;
    try {
      const since = s.welcomeSince || new Date().toISOString(), sent = new Set(s.welcomeSent || []);
      const skip = new Set([s.identity.id, ...this.friends.map(f => f.id), ...this.pending.map(p => p.from), ...this.sent.map(p => p.from)]);
      const dir = await this.api("GET", "/v1/directory?sort=new");
      let n = day;
      for (const p of (dir.profiles || []) as { handle: string; created: string }[]) {
        if (n >= 10 || String(p.created) <= since) break;
        const pr = await this.api("GET", `/v1/profiles/${encodeURIComponent(p.handle)}`);
        if (skip.has(pr.id) || sent.has(pr.id)) continue;
        await this.send("friend.request", { to: pr.id, note: (s.welcomeNote || WELCOME_NOTE).slice(0, 200) });
        sent.add(pr.id); n++;
      }
      s.welcomeSent = [...sent].slice(-500); s.welcomeDay = [today, n]; await this.saveSettings();
    } catch (e: any) { console.warn("Caldera welcome:", e.message); }
  }

  /** "Add as friend" from a profile page (obsidian://caldera?friend=) or the My profile tab: confirm, then request. */
  async confirmFriend(raw: string) {
    const h = raw.replace(/^@/, "").trim();
    if (!/^[a-z0-9_-]{1,40}$/i.test(h)) return;
    if (!this.settings.identity || !this.settings.handle) { new Notice(`Publish your Caldera profile first, then click "Add @${h} as a friend" again.`); return void new WelcomeModal(this.app, this).open(); }
    if (h.toLowerCase() === this.settings.handle.toLowerCase()) return void new Notice("That's your own profile. Share your invite link from the Caldera panel instead.");
    new ConfirmModal(this.app, `Send @${h} a friend request? Once they accept, you can share notes end-to-end encrypted and give each other gravity.`, async () => {
      try { await this.requestFriend(h); } catch (e: any) { new Notice(e.message); } }, "Send request", "Add a friend").open();
  }

  /** Live traffic: one site key per city district, registered with the hub (which hands back each site's server key). */
  async syncSites(city: { districts: { name: string; repos?: { name: string }[] }[] } | undefined, publicNames: string[]) {
    if (!city?.districts.length || !this.settings.identity) return;
    try {
      const have = new Map((this.settings.traffic || []).map(t => [t.project, t.key]));
      const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("") + Date.now().toString(36).slice(-4);
      const sites = city.districts.filter(d => d.name && d.name !== "Private").map(d => ({ key: have.get(d.name) || rnd(), project: d.name, public: publicNames.includes(d.name) }));
      const me = await this.ensureIdentity();
      // repo -> district, hashed: the hub places agent drones without ever holding private repo names
      const repos: Record<string, string> = {};
      for (const d of city.districts) for (const rp of d.repos || []) if (rp.name) repos[await sha16(rp.name.toLowerCase())] = d.name;
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/sites`, { sites, repos }, true);
      if (Array.isArray(r.sites)) { this.settings.traffic = r.sites; if (r.agent?.key) this.settings.agentKey = r.agent; await this.saveSettings(); }
    } catch (e: any) { console.warn("Caldera live-traffic sites:", e.message); }
  }
  /** The weather where this computer is (the hub looks it up from this request and keeps nothing), for the city's sky. */
  async weather() { return this.api("GET", "/v1/weather"); }
  async ownerLive() {
    const me = await this.ensureIdentity();
    return this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/live`, undefined, true);
  }

  /** Private activity for the My view tab: visits, gravity, friends, links in. Signed in with the vault's key. */
  async ownerActivity(since: string) {
    const me = await this.ensureIdentity();
    return this.api("GET", `/v1/owner/${encodeURIComponent(me.id)}/activity?since=${encodeURIComponent(since)}`, undefined, true);
  }

  /** Private web address (Tailscale): push the owner layer, encrypted at rest on the hub, served only to the owner's tailnet login. */
  async pushPrivate(loud = false): Promise<string | null> {
    if (this.unloaded || !this.settings.privateWeb || !this.settings.identity || !this.settings.handle) return null;
    try {
      const { data, cityPrivate } = await this.build();
      const vault = encodeURIComponent(this.app.vault.getName());
      const pages: Record<string, string> = {};
      if (cityPrivate?.districts.length) pages["city.html"] = renderPrivateCity(data, cityPrivate, `obsidian://open?vault=${vault}&file=`);
      const html = renderOwner(await collectOwner(this.app, this, data, this.settings.ownerLastLooked))
        // on the web, vault links open the note in Obsidian; in-app actions become plain text
        .replace(/href="#"((?: [\w-]+="[^"]*")*?) data-open="([^"]*)"/g, (_m, attrs, p) => `${attrs.trim()} href="obsidian://open?vault=${vault}&amp;file=${encodeURIComponent(p.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))}" target="_blank" rel="noopener"`)
        .replace(/<a href="#"[^>]*data-action="[^"]*"[^>]*>([\s\S]*?)<\/a>/g, "$1")
        .replace("Built from your vault inside Obsidian. None of it is published.", "Pushed from your vault. Only your Tailscale account can see this page.");
      const me = await this.ensureIdentity();
      const r = await this.api("POST", `/v1/owner/${encodeURIComponent(me.id)}/private`, { html, pages, built: new Date().toISOString(), v: this.manifest.version }, true);
      if (r.url && r.url !== this.settings.privateUrl) { this.settings.privateUrl = r.url; await this.saveSettings(); }
      if (loud) new Notice("Private view pushed. Open it on any of your Tailscale devices: " + r.url);
      return r.url;
    } catch (e: any) {
      if (loud) new Notice("Couldn't push the private view: " + e.message); else console.warn("Caldera private push failed:", e.message);
      return null;
    }
  }

  schedulePrivatePush() {
    if ((this as any)._priv) window.clearInterval((this as any)._priv);
    if (this.settings.privateWeb) (this as any)._priv = window.setInterval(() => { void this.pushPrivate(false); }, 10 * 60_000);
  }

  /** The city in a small always-on-top window: needs the My profile tab (it builds the city), so open it first if needed. */
  async popCity() {
    await this.openProfileTab();
    const v = this.app.workspace.getLeavesOfType(PROFILE_VIEW)[0]?.view as unknown as { isReady?: () => boolean; popOut?: () => Promise<void> } | undefined;
    if (!v?.popOut) return;
    for (let i = 0; i < 40 && !v.isReady?.(); i++) await new Promise(r => window.setTimeout(r, 100));
    await v.popOut();
  }

  /** What the floating city shows; open=false only refreshes a window that's already open. */
  floatSpec: FloatSpec | null = null;
  async floatCity(spec: FloatSpec, open = true) {
    this.floatSpec = spec;
    const leaf = this.app.workspace.getLeavesOfType(CITY_FLOAT_VIEW)[0];
    if (leaf) { (leaf.view as CityFloatView).showSpec(spec); if (open) leaf.view.containerEl.win.focus(); return; }
    if (!open) return;
    const pop = this.app.workspace.openPopoutLeaf({ size: FLOAT_SIZE });
    await pop.setViewState({ type: CITY_FLOAT_VIEW, active: true });
  }

  async openProfileTab() {
    const ws = this.app.workspace;
    const existing = ws.getLeavesOfType(PROFILE_VIEW)[0];
    if (existing) return void ws.revealLeaf(existing);
    const leaf = ws.getLeaf("tab"); await leaf.setViewState({ type: PROFILE_VIEW, active: true }); ws.revealLeaf(leaf);
  }

  async requestFriend(handleOrId: string, note = "") {
    const h = handleOrId.trim().replace(/^https?:\/\/[^/]+\/@?/, "").replace(/[/?#].*$/, "").replace(/^@/, "");
    if (!h) throw new Error("Enter a handle, like @orion, or their profile link");
    const pr = await this.api("GET", `/v1/profiles/${encodeURIComponent(h)}`);
    if (pr.id === this.settings.identity?.id) throw new Error("That's your own profile");
    if (this.friends.some(f => f.id === pr.id)) throw new Error(`You're already friends with @${pr.handle}`);
    await this.send("friend.request", { to: pr.id, note }); new Notice(`Friend request sent to @${pr.handle || pr.id}. You'll be friends once they accept.`);
    await this.syncInbox(false);
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
    void this.app.workspace.revealLeaf(leaf);
  }
  refreshPanel() { for (const l of this.app.workspace.getLeavesOfType(VIEW)) (l.view as CalderaView).render(); }
}

// ------------------------------------------------------------------ friends panel
class CalderaView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: CalderaPlugin) { super(leaf); }
  getViewType() { return VIEW; }
  getDisplayText() { return "Caldera"; }
  getIcon() { return "flame"; }
  async onOpen() { this.render(); await this.plugin.syncInbox(false); }

  render() {
    const el = this.contentEl; el.empty(); el.addClass("caldera-panel");
    const p = this.plugin, s = p.settings;
    el.createEl("h3", { text: "Caldera" });
    if (!s.identity || !s.handle) {
      el.createEl("p", { text: "Set your name and handle in settings, then publish your profile to join." });
      new Setting(el).addButton(b => b.setButtonText("Open settings").setCta().onClick(() => { (this.app as any).setting.open(); (this.app as any).setting.openTabById("caldera"); }));
      return;
    }
    const stats = el.createDiv("caldera-stats");
    for (const [v, l] of [[p.social.friends, "friends"], [p.social.gravity, "gravity"], [p.social.credits, "credits"]] as const) {
      const st = stats.createDiv({ cls: "caldera-stat" }); st.createEl("b", { text: String(v) }); st.createSpan({ text: String(l) });
    }
    const actions = el.createDiv("caldera-actions");
    actions.createEl("button", { text: "My profile" }).onclick = () => p.openProfileTab();
    actions.createEl("button", { text: "Publish", cls: "mod-cta" }).onclick = () => p.publish();
    actions.createEl("button", { text: "Sync" }).onclick = () => p.syncInbox(true);
    actions.createEl("button", { text: "Share" }).onclick = () => p.openShare();

    if (p.pending.length) {
      el.createEl("h4", { text: "Friend requests" });
      for (const r of p.pending) {
        const row = el.createDiv("caldera-row");
        row.createSpan({ text: (r.handle ? "@" + r.handle : r.from.slice(0, 14)) + (r.note ? ` - "${r.note}"` : "") });
        row.createEl("button", { text: "Accept", cls: "mod-cta" }).onclick = () => p.acceptFriend(r);
        row.createEl("button", { text: "Ignore" }).onclick = () => p.ignoreFriend(r);
      }
    }
    if (p.sent.length) {
      el.createEl("h4", { text: "Waiting for them to accept" });
      for (const r of p.sent) el.createDiv({ cls: "caldera-row", text: (r.handle ? "@" + r.handle : r.from.slice(0, 14)) + ` - sent ${r.ts.slice(0, 10)}` });
    }
    if (p.intros.length) {
      el.createEl("h4", { text: "Introductions" });
      for (const it of p.intros) {
        const row = el.createDiv("caldera-row");
        const who = row.createSpan(); who.createEl("b", { text: it.name || "@" + it.handle }); who.appendText(` @${it.handle}`);
        who.createDiv({ cls: "setting-item-description", text: `${it.tag ? `Also building ${it.tag}. ` : ""}Would like to connect.` });
        row.createEl("button", { text: "Accept", cls: "mod-cta" }).onclick = () => void p.introduce(it.handle, "accept");
        row.createEl("button", { text: "Not now" }).onclick = () => void p.introduce(it.handle, "decline");
      }
    }
    el.createEl("h4", { text: "Add a friend" });
    el.createEl("p", { cls: "setting-item-description", text: "Already on Caldera: enter their handle or paste their profile link. Or click \"Add as friend\" on their profile page." });
    let handle = "";
    new Setting(el).addText(t => t.setPlaceholder("@handle or profile link").onChange(v => handle = v)).addButton(b => b.setButtonText("Request").onClick(async () => {
      try { await p.requestFriend(handle.trim()); } catch (e: any) { new Notice(e.message); }
    }));
    if (p.suggestions.length) {
      el.createEl("h4", { text: "People you might know" });
      for (const sg of p.suggestions) {
        const row = el.createDiv("caldera-row");
        const who = row.createSpan(); who.createEl("b", { text: sg.name || "@" + sg.handle }); who.appendText(` @${sg.handle}`);
        who.createDiv({ cls: "setting-item-description", text: sg.why });
        row.createEl("button", { text: "Add" }).onclick = async () => { try { await p.requestFriend(sg.handle); p.suggestions = p.suggestions.filter(x => x !== sg); this.render(); } catch (e: any) { new Notice(e.message); } };
        row.createEl("button", { text: "View" }).onclick = () => window.open(`${s.hubUrl.replace(/\/$/, "")}/@${sg.handle}/`);
        row.createEl("button", { text: "Kudos" }).onclick = (ev) => kudosMenu(ev, sg.handle, p);
        if (/both building/i.test(sg.why || "")) row.createEl("button", { text: "Introduce me" }).onclick = () => void p.introduce(sg.handle, "ask");
      }
    }
    el.createEl("h4", { text: "Invite someone new" });
    el.createEl("p", { cls: "setting-item-description", text: "Not on Caldera yet: send them this link. It walks them through installing, then they add you with one click." });
    const inv = `${s.hubUrl.replace(/\/$/, "")}/?invite=${encodeURIComponent(s.handle)}#install`;
    new Setting(el).addText(t => { t.setValue(inv); t.inputEl.readOnly = true; t.inputEl.onfocus = () => t.inputEl.select(); })
      .addButton(b => b.setButtonText("Copy").setCta().onClick(async () => { await navigator.clipboard.writeText(inv); new Notice("Invite link copied"); }));
    // the people in your GitHub circle who aren't on Caldera yet: invite them (when they join you start out connected)
    if (!p.ghPeople && !p.ghPeopleLoading) void p.loadGithubPeople().then(() => { if (p.ghPeople?.people.length) this.render(); });
    if (p.ghPeople?.people.length) {
      el.createEl("h4", { text: "Your GitHub people" });
      el.createEl("p", { cls: "setting-item-description", text: "People you follow, who follow you, or who work on your repos, who aren't on Caldera yet. When they join, you start out connected." });
      new Setting(el).setName("Invite message").setDesc(p.ghPeople.message).addButton(b => b.setButtonText("Copy").onClick(async () => { await navigator.clipboard.writeText(p.ghPeople!.message); new Notice("Invite message copied. Send it to them anywhere."); }));
      for (const x of p.ghPeople.people.slice(0, 20)) {
        const row = el.createDiv("caldera-row");
        const who = row.createSpan(); who.createEl("b", { text: "@" + x.login }); who.createDiv({ cls: "setting-item-description", text: x.relation });
        row.createEl("button", { text: "GitHub" }).onclick = () => window.open(x.url);
        if (x.invited) row.createSpan({ cls: "setting-item-description", text: "invited" });
        else if (x.canEmail) row.createEl("button", { text: "Email invite" }).onclick = async () => {
          try { new Notice(await p.githubInvite(x.login)); x.invited = true; this.render(); } catch (e: any) { new Notice(e.message); } };
      }
    }
    el.createEl("h4", { text: `Friends (${p.friends.length})` });
    for (const f of p.friends) {
      const row = el.createDiv("caldera-row");
      row.createSpan({ text: "@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : "") + (f.why && f.kind === "repo" ? ` (both work on ${f.why})` : f.why && f.kind === "github" ? ` (${f.why})` : "") });
      row.createEl("button", { text: "+ gravity" }).onclick = () => new GravityModal(this.app, f, r => p.giveGravity(f, r)).open();
      if (f.handle) row.createEl("button", { text: "Kudos" }).onclick = (ev) => kudosMenu(ev, f.handle!, p);
    }
  }
}

/** A small menu: ❤️ 👍 🔥 ✨ -> send that kudos. */
function kudosMenu(ev: MouseEvent, handle: string, plugin: CalderaPlugin) {
  const m = new Menu();
  for (const [k, em] of [["heart", "\u2764\uFE0F"], ["up", "\u{1F44D}"], ["fire", "\u{1F525}"], ["sparkle", "\u2728"]] as const)
    m.addItem(i => i.setTitle(`${em}  Send @${handle} ${k === "up" ? "a thumbs up" : k}`).onClick(() => void plugin.sendKudos(handle, k)));
  m.showAtMouseEvent(ev);
}

// ------------------------------------------------------------------ modals
class PreviewModal extends Modal {
  constructor(app: App, private html: string) { super(app); }
  onOpen() {
    this.modalEl.addClass("caldera-preview-modal");
    this.titleEl.setText("Public profile preview (exactly what visitors will see)");
    const frame = this.contentEl.createEl("iframe", { cls: "caldera-preview" });
    frame.setAttr("sandbox", "allow-scripts"); frame.srcdoc = this.html;
  }
}

class FriendPicker extends SuggestModal<Friend> {
  constructor(app: App, private list: Friend[], private pick: (f: Friend) => unknown) { super(app); this.setPlaceholder("Share with which friend?"); }
  getSuggestions(q: string) { return this.list.filter(f => (f.handle || f.name || f.id).toLowerCase().includes(q.toLowerCase())); }
  renderSuggestion(f: Friend, el: HTMLElement) { el.setText("@" + (f.handle || f.id.slice(4, 12)) + (f.name ? ` - ${f.name}` : "")); }
  onChooseSuggestion(f: Friend) { void this.pick(f); }
}

class GravityModal extends Modal {
  constructor(app: App, private f: Friend, private done: (reason: string) => unknown) { super(app); }
  onOpen() {
    this.titleEl.setText(`Add gravity to @${this.f.handle || "friend"}`);
    this.contentEl.createEl("p", { text: "Gravity is positive only. Say what they helped with (optional)." });
    let reason = "";
    new Setting(this.contentEl).addText(t => t.setPlaceholder("They found me an operator").onChange(v => reason = v))
      .addButton(b => b.setButtonText("Add gravity").setCta().onClick(() => { void this.done(reason); this.close(); }));
  }
}

class ConfirmModal extends Modal {
  constructor(app: App, private msg: string, private yes: () => unknown, private label = "Delete", private title = "Are you sure?") { super(app); }
  onOpen() {
    this.titleEl.setText(this.title); this.contentEl.createEl("p", { text: this.msg });
    new Setting(this.contentEl).addButton(b => b.setButtonText("Cancel").onClick(() => this.close()))
      .addButton(b => { b.setButtonText(this.label).onClick(() => { void this.yes(); this.close(); }); if (this.label === "Delete") b.setWarning(); else b.setCta(); });
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

/** Type the code from caldera.social/signin on the other device. */
class PairModal extends Modal {
  constructor(app: App, private approve: (code: string) => Promise<void>, private page: string) { super(app); }
  onOpen() {
    this.titleEl.setText("Sign in another device");
    this.contentEl.createEl("p", { text: `On your phone or the other browser, open ${this.page}, tap "Owner? Sign in" in the bar at the top, then "Show a code". Type that code here.` });
    this.contentEl.createEl("p", { cls: "setting-item-description", text: "Only approve a code on a screen you're holding yourself: approving signs that browser in as you." });
    let code = "";
    const go = async () => { if (code.replace(/[^A-Za-z0-9]/g, "").length !== 6) return void new Notice("The code has 6 characters.");
      try { await this.approve(code); this.close(); } catch (e: any) { new Notice(e.message); } };
    new Setting(this.contentEl).setName("Code").addText(t => { t.setPlaceholder("ABC 123").onChange(v => code = v); t.inputEl.addEventListener("keydown", e => { if (e.key === "Enter") void go(); }); window.setTimeout(() => t.inputEl.focus(), 50); })
      .addButton(b => b.setButtonText("Sign it in").setCta().onClick(() => void go()));
  }
  onClose() { this.contentEl.empty(); }
}

/** Choose (or drop) an image for the masthead or profile photo. A real button click, so the file chooser always opens. */
class ImagePickModal extends Modal {
  private chosen = false;
  constructor(app: App, private kind: "banner" | "photo", private use: (buf: ArrayBuffer, ext: string) => Promise<void>, private cancelled: () => void) { super(app); }
  onOpen() {
    const banner = this.kind === "banner";
    this.titleEl.setText(banner ? "Set your masthead" : "Set your profile photo");
    this.contentEl.createEl("p", { text: banner ? "The wide cover image across the top of your page. Best about 3:1 (for example 1800x600), JPG or WebP, up to 5 MB. It's public." : "Square, at least 400x400: your face or your logo. JPG, PNG or WebP, up to 5 MB. It's public." });
    const input = this.contentEl.createEl("input", { attr: { type: "file", accept: "image/jpeg,image/png,image/webp" } }); input.setCssStyles({ display: "none" });
    const take = async (f?: File) => {
      if (!f) return; const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : f.type === "image/jpeg" ? "jpg" : "";
      if (!ext) return void new Notice("Use a JPG, PNG or WebP image."); if (f.size > 5 * 1024 * 1024) return void new Notice("That image is over 5 MB. Try a smaller one.");
      try { this.chosen = true; await this.use(await f.arrayBuffer(), ext); this.close(); } catch (e: any) { this.chosen = false; new Notice("Couldn't set it: " + e.message); }
    };
    input.addEventListener("change", () => void take(input.files?.[0]));
    this.contentEl.addEventListener("dragover", e => e.preventDefault());
    this.contentEl.addEventListener("drop", e => { e.preventDefault(); void take(e.dataTransfer?.files?.[0]); });
    new Setting(this.contentEl).setDesc("Or drop an image on this window.").addButton(b => b.setButtonText("Choose an image").setCta().onClick(() => input.click()));
  }
  onClose() { this.contentEl.empty(); if (!this.chosen) this.cancelled(); }
}

class PromptModal extends Modal {
  constructor(app: App, private text: string) { super(app); }
  onOpen() {
    this.titleEl.setText("AI agent setup prompt");
    const ta = this.contentEl.createEl("textarea", { cls: "caldera-prompt" });
    ta.value = this.text; ta.rows = 18; ta.readOnly = true; ta.select();
  }
  onClose() { this.contentEl.empty(); }
}

/** First run: name + handle -> identity created on this device -> publish -> profile opens in the browser. */
/** Pick any note in the vault to plant as the first garden note. */
class NotePickModal extends SuggestModal<TFile> {
  constructor(app: App, private pick: (f: TFile) => void) { super(app); this.setPlaceholder("Type to find a note to plant in your garden"); }
  getSuggestions(q: string) { const s = q.toLowerCase(); return this.app.vault.getMarkdownFiles().filter(f => !f.path.startsWith("Caldera/") && f.path.toLowerCase().includes(s)).slice(0, 40); }
  renderSuggestion(f: TFile, el: HTMLElement) { el.createEl("div", { text: f.basename }); el.createEl("small", { text: f.parent?.path && f.parent.path !== "/" ? f.parent.path : "", cls: "caldera-muted" }); }
  onChooseSuggestion(f: TFile) { this.pick(f); }
}

/** Set up (first run) or finish the page with a short form - no AI needed. Everything lands in Caldera/profile.md,
 *  then the page publishes and the share screen opens. "finish" mode is the same form for an existing profile, prefilled. */
class WelcomeModal extends Modal {
  constructor(app: App, private plugin: CalderaPlugin, private mode: "welcome" | "finish" = "welcome") { super(app); }
  onOpen() {
    const s = this.plugin.settings, finish = this.mode === "finish" && !!s.handle && !!s.identity;
    const eff = effectiveSettings(this.app, s);
    this.modalEl.addClass("caldera-welcome");
    this.titleEl.setText(finish ? "Finish your page" : "Welcome to Caldera");
    const c = this.contentEl;
    c.createEl("p", { text: finish ? "A few details make your page worth visiting. Fill in what you like - everything is optional, and you can change it later in Caldera/profile.md."
      : "Set up your page in a minute. Caldera creates your identity on this device and publishes a page that keeps itself fresh from your vault. Nothing private leaves your vault." });
    let name = eff.name || "", handle = s.handle || "", headline = eff.headline || "", listed = eff.listed !== false;
    const clean = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
    const status = createDiv({ cls: "caldera-welcome-status" });
    const head = (t: string) => c.createEl("h4", { text: t, cls: "caldera-welcome-h" });

    head("You");
    new Setting(c).setName("Your name").addText(t => t.setPlaceholder("Ada Lovelace").setValue(name).onChange(v => name = v.trim()));
    if (finish) new Setting(c).setName("Handle").setDesc(this.plugin.profileUrl());
    else new Setting(c).setName("Handle").setDesc(`${s.hubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/@handle`)
      .addText(t => t.setPlaceholder("ada").setValue(handle).onChange(v => { handle = clean(v); if (v !== handle) t.setValue(handle); status.setText(""); }));
    const examples = ["Designer writing about tools for thought", "Founder building in public", "Researcher: notes on climate and cities"];
    new Setting(c).setName("Headline").setDesc("One line about what you do or think about")
      .addText(t => { t.setPlaceholder(examples[Math.floor(Math.random() * examples.length)]!).setValue(headline).onChange(v => headline = v.trim()); t.inputEl.addClass("caldera-wide"); });

    head("Pictures");
    const img: Record<"photo" | "banner", { buf: ArrayBuffer; ext: string } | null> = { photo: null, banner: null };
    const picRow = (kind: "photo" | "banner", label: string, desc: string, current: string) => {
      const st = new Setting(c).setName(label).setDesc(current ? `${desc} Now: ${current}` : desc);
      st.addButton(b => b.setButtonText(current ? "Change" : "Choose an image").onClick(() => new ImagePickModal(this.app, kind, async (buf, ext) => {
        img[kind] = { buf, ext }; st.setDesc(`${desc} Chosen. It's saved when you publish.`); b.setButtonText("Change");
      }, () => {}).open()));
      if (!current) st.addExtraButton(x => x.setIcon("x").setTooltip("Skip for now").onClick(() => { img[kind] = null; st.setDesc(`${desc} Skipped - you can add it later.`); }));
    };
    picRow("photo", "Profile photo", "Square: your face or your logo.", eff.avatarPath || "");
    picRow("banner", "Masthead", "The wide cover image across the top (about 3:1).", eff.bannerPath || "");

    head("Links");
    const have = (eff.links || []).map(([l, u]) => ({ l, u, i: quickLinkIndex(l, u) }));
    const quick = QUICK_LINKS.map((_, i) => have.find(h => h.i === i)?.u || "");
    QUICK_LINKS.forEach((q, i) => new Setting(c).setName(q.label).addText(t => t.setPlaceholder(q.ph).setValue(quick[i]!).onChange(v => quick[i] = v.trim())));

    let plant: TFile | null = null;
    if (C.gardenEnabled()) {   // paused garden: no "plant your first note" step
      head("Your garden");
      const gs = new Setting(c).setName("Plant your first note").setDesc("Optional. Pick a note to publish as a page in your garden, marked seedling - rough is fine.");
      gs.addButton(b => b.setButtonText("Pick a note").onClick(() => new NotePickModal(this.app, f => { plant = f; gs.setDesc(`"${f.basename}" goes public as a seedling when you publish.`); b.setButtonText("Change"); }).open()));
    }

    head("Staying in touch");
    new Setting(c).setName("List me in People").setDesc("Your card appears on the public directory. Change it anytime.").addToggle(t => t.setValue(listed).onChange(v => listed = v));
    let email = s.summaryEmail || "";
    new Setting(c).setName("Daily summary email").setDesc("Optional. Who visited, friend requests and kudos - only on days something happens.")
      .addText(t => t.setPlaceholder("you@example.com").setValue(email).onChange(v => email = v.trim()));

    c.appendChild(status);
    const go = new Setting(c)
      .addButton(b => b.setButtonText("Use my AI agent instead").setTooltip("Copies a setup prompt for Claude Code, Codex or Cursor").onClick(() => this.plugin.copyPrompt("setup")))
      .addButton(b => b.setButtonText(finish ? "Save and publish" : "Publish my page").setCta().onClick(async () => {
        if (!name) { status.setText("Add your name."); return; }
        if (!finish && handle.length < 3) { status.setText("Handles need at least 3 letters or numbers."); return; }
        b.setDisabled(true); b.setButtonText("Publishing...");
        const fail = (msg: string) => { status.setText(msg); b.setDisabled(false); b.setButtonText(finish ? "Save and publish" : "Publish my page"); };
        try {
          const me = await this.plugin.ensureIdentity(true);
          if (!finish) {
            const r = await requestUrl({ url: `${s.hubUrl.replace(/\/$/, "")}/v1/profiles/${handle}`, throw: false });
            if (r.status === 200 && r.json?.id !== me.id) return fail(`@${handle} is taken. Try another.`);
            s.handle = handle; if (!s.autoPublishHours) s.autoPublishHours = 6;
          }
          Object.assign(s, { name, headline, listed });
          await this.plugin.saveSettings();
          await this.plugin.applyProfileForm({ name, headline, listed, images: img, links: quick.map((v, i) => [QUICK_LINKS[i]!.label, quickLinkUrl(i, v)] as [string, string]), plant });
          const firstRun = !s.welcomed;
          s.welcomed = true; s.sharePrompted = true; await this.plugin.saveSettings();   // this form opens the share screen itself
          const url = await this.plugin.publish(true);
          if (!url) {   // first run: stay un-welcomed so this screen comes back next time
            if (firstRun) { s.welcomed = false; await this.plugin.saveSettings(); }
            const why = this.plugin.lastPublishError;
            return fail(why && !/network|fetch|ENOTFOUND|timed out/i.test(why) ? `Publishing failed: ${why}` : "Publishing failed. Check your connection and try again.");
          }
          this.plugin.scheduleAutoPublish();
          if (email && email !== s.summaryEmail) void this.plugin.setSummaryEmail(email);
          this.close();
          new ShareModal(this.app, this.plugin, firstRun).open();
        } catch (e: any) { fail(e.message); }
      }));
    go.settingEl.addClass("caldera-welcome-go");
  }
  onClose() { this.contentEl.empty(); }
}

/** "Your page is live": the link-preview picture, the link, one-click posts, the invite link, and the daily email. */
class ShareModal extends Modal {
  constructor(app: App, private plugin: CalderaPlugin, private firstRun = false) { super(app); }
  onOpen() {
    const s = this.plugin.settings, hub = s.hubUrl.replace(/\/$/, ""), url = this.plugin.profileUrl(), invite = `${hub}/?invite=${encodeURIComponent(s.handle)}`;
    this.modalEl.addClass("caldera-share");
    this.titleEl.setText("Your page is live");
    const c = this.contentEl;
    c.createEl("p", { text: "This is what people see when you post your link. Pages that get shared get visitors, friend requests and kudos." });
    const img = c.createEl("img", { cls: "caldera-share-card", attr: { src: `${url}card.png?t=${Date.now()}`, alt: "Your link preview" } });
    img.onerror = () => img.remove();
    const copy = async (t: string, msg: string) => { try { await navigator.clipboard.writeText(t); new Notice(msg); } catch { new Notice(t, 10_000); } };
    new Setting(c).setName("Your link").setDesc(url).addButton(b => b.setButtonText("Copy link").setCta().onClick(() => copy(url, "Link copied")));
    const text = `My page on Caldera: a living profile built from my Obsidian vault, with my work as a little city. ${url}`, t = encodeURIComponent(text);
    new Setting(c).setName("Post it")
      .addButton(b => b.setButtonText("X").onClick(() => window.open(`https://x.com/intent/post?text=${t}`)))
      .addButton(b => b.setButtonText("Bluesky").onClick(() => window.open(`https://bsky.app/intent/compose?text=${t}`)))
      .addButton(b => b.setButtonText("LinkedIn").onClick(() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)))
      .addButton(b => b.setButtonText("Mastodon").onClick(() => window.open(`https://mastodonshare.com/?text=${t}`)));
    new Setting(c).setName("Invite a friend").setDesc(`${invite} - they're walked through setup and add you with one click. You get 25 help credits for each person who joins.`)
      .addButton(b => b.setButtonText("Copy invite link").onClick(() => copy(invite, "Invite link copied")));
    let email = s.summaryEmail || "";
    new Setting(c).setName("Daily summary email").setDesc("Who visited, friend requests and kudos. Only on days something happens.")
      .addText(tx => tx.setPlaceholder("you@example.com").setValue(email).onChange(v => email = v.trim()))
      .addButton(b => b.setButtonText("Email me").onClick(() => { if (email) void this.plugin.setSummaryEmail(email); }));
    if (this.firstRun) new Setting(c).setName("Save your recovery key").setDesc("Your login is a key stored in this vault - no password. Keep a copy in your password manager to recover your page on another device. Anyone with it can act as you.")
      .addButton(b => b.setButtonText("Copy recovery key").onClick(() => copy(btoa(JSON.stringify(s.identity)), "Recovery key copied. Paste it into your password manager.")));
    new Setting(c).addButton(b => b.setButtonText("Open my page").onClick(() => void this.plugin.openProfile())).addButton(b => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() { this.contentEl.empty(); }
}

interface Release { version: string; date: string; title: string; items: string[]; howto?: string }

class WhatsNewModal extends Modal {
  constructor(app: App, private plugin: CalderaPlugin, private releases: Release[]) { super(app); }
  onOpen() {
    this.titleEl.setText("What's new in Caldera");
    // the notes come from the hub, so they can be ahead of what's installed: say how to get the update
    const have = this.plugin.manifest.version, newest = this.releases[0]?.version;
    const older = (a: string, b: string) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); return false; };
    if (newest && older(have, newest)) {
      const up = this.contentEl.createDiv({ cls: "caldera-release-howto" });
      up.createEl("p", { text: `You have Caldera ${have}. Version ${newest} is out: open Community plugins, click "Check for updates", then update Caldera.` });
      new Setting(up).addButton(b => b.setButtonText("Open Community plugins").setCta().onClick(() => {
        const st = (this.app as any).setting; if (st) { st.open(); st.openTabById("community-plugins"); } this.close(); }));
    }
    for (const r of this.releases) {
      const box = this.contentEl.createDiv({ cls: "caldera-release" });
      box.createDiv({ cls: "caldera-release-meta", text: `${r.version} \u00b7 ${r.date}` });
      box.createEl("h3", { text: r.title });
      const ul = box.createEl("ul"); for (const it of r.items) ul.createEl("li", { text: it });
      if (r.howto) box.createEl("p", { cls: "caldera-release-howto", text: r.howto });
    }
    const hub = this.plugin.settings.hubUrl.replace(/\/$/, "");
    new Setting(this.contentEl)
      .addButton(b => b.setButtonText("All release notes").onClick(() => window.open(hub + "/changelog.html")))
      .addButton(b => b.setButtonText("Guide").onClick(() => window.open(hub + "/guide.html")))
      .addButton(b => b.setButtonText("Done").setCta().onClick(() => this.close()));
  }
  onClose() { this.contentEl.empty(); }
}

/** What the garden will publish, note by note, with lines the privacy filter would flag. Nothing is sent from here. */
class GardenPreviewModal extends Modal {
  constructor(app: App, private report: GardenReport[], private folder: string, private url: string) { super(app); }
  onOpen() {
    const c = this.contentEl; c.empty();
    c.createEl("h2", { text: "Your garden" });
    if (!this.report.length) {
      c.createEl("p", { text: `No garden notes yet. Put notes in the "${this.folder || "(no folder set)"}" folder, or run "Plant this note in my garden" on any note. Nothing is published until you do.` });
      return;
    }
    const words = this.report.reduce((a, r) => a + r.words, 0);
    c.createEl("p", { text: `${this.report.length} notes (${words.toLocaleString()} words) will be public as full pages${this.url ? ` at ${this.url}` : ""}. Email addresses and phone numbers are removed automatically. Lines below were flagged as possibly private: edit them, or add "caldera: private" to keep a note out.` });
    for (const r of this.report) {
      const box = c.createDiv({ cls: "caldera-garden-row" });
      box.createEl("h4", { text: `${r.title}  (${r.stage}, ${LICENSES[r.license]?.short || r.license}, ${r.words} words)` });
      box.createDiv({ text: r.path, cls: "setting-item-description" });
      if (r.removed) box.createDiv({ text: `${r.removed} email/phone value(s) will be removed.` });
      if (!r.flags.length) box.createDiv({ text: "No flagged lines.", cls: "setting-item-description" });
      for (const fl of r.flags) box.createDiv({ text: `[${fl.why}] ${fl.line}` });
    }
  }
}

async function sha16(t: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
