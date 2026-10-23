import { githubUser } from "./auto";
import { App, PluginSettingTab, Setting, Notice, TFile } from "obsidian";
import type CalderaPlugin from "./main";
import { gardenEnabled, type Identity } from "@caldera/core";
import { listingLine, MAX_LISTINGS, parseListingLine, type ListingKind, type ListingRef } from "./listings";
import { PROFILE_FILE } from "./profile-file";

export interface CalderaSettings {
  lastMsgUnread?: number;             // unread direct messages already announced with a notice
  lastAlertTs?: string;               // newest Caldera alert already shown as a notice
  hubUrl: string;
  identity: Identity | null;          // stays on this device (plugin data); export it as your recovery key
  handle: string; name: string; headline: string; theme: "dark" | "light";
  avatarPath: string; bannerPath: string;
  links: [string, string][]; properties: [string, string][];
  sections: Record<string, boolean>;
  publicTopics: [string, string][];   // [tag, label] - only these tags are ever counted
  activityFile: string; historyDays: number;
  inboxFolder: string; lastInboxSync: string;
  citySetupDismissed?: boolean;   // hide the 'turn on live visitors / agents' row under My view's city
  ownerLastLooked?: string;   // when the owner last opened the My profile tab (drives 'Since you last looked')
  openProfileOnStartup?: boolean;
  privateWeb?: boolean; privateUrl?: string;   // private web address (Tailscale) for the owner layer
  pendingRequests?: { request: string; from: string; handle?: string; note?: string; ts: string }[];   // friend requests survive a restart
  ignoredRequests?: string[]; seenRequests?: string[];   // friend requests: hidden by the owner / already announced
  traffic?: { key: string; project: string; public: number | boolean; secret?: string }[];
  agentKey?: { key: string; secret: string };   // AI agents report what they're working on (drones in the city)   // live traffic: one site key per city district
  asks: { id: string; title: string; bounty: number }[];
  offers: { id: string; title: string }[];
  autoPublishHours: number;           // 0 = manual only
  welcomed: boolean;                  // first-run welcome finished
  listed: boolean;                    // shown in the public directory at hub/people
  autoConnectRepos?: boolean;         // become friends with members who work on the same public GitHub repos (default on)
  tags?: string[]; hideTags?: string[]; hideRepos?: string[];   // what I'm building: tags I add, and extracted ones to hide (Caldera/profile.md tags / hideTags)
  autoTags?: boolean;                  // tag me automatically from my public GitHub repos (default on)
  privateRepos?: "show" | "anonymous" | "hidden" | "named";
  privateReposTs?: string;           // when privateRepos was last chosen here (a newer choice on caldera.social wins)   // how private repos show on my PUBLIC city (unset = Caldera's default); Caldera/profile.md privateRepos
  seenIntros?: string[];
  seenRepoFriends?: string[];         // shared-repo friendships already announced
  lastSeenRelease: string;            // newest release the owner has been shown (What's new)
  lastPublished: number;              // ms epoch of the last successful publish (catch-up publish on start)
  tree: [string, string, string?][];  // left sidebar: [group, "item, item", folder to count]; empty = topics + public notes
  graph: string[];                    // right rail graph: note names, sized by how many notes link to each; empty = topics
  backlinks: [string, string][];      // right rail list: [title, context]; empty = public notes
  summary: string; now: string[];      // owner-written page text (Caldera/profile.md)
  nowAuto?: boolean;                   // "now: auto" (or no now list): Now is the last week's wins from the journal
  timeline: [string, string][];       // [year, text]
  projects: [string, string][];       // [name, "status | url"]
  knows: [string, string][];          // [label, vault folder] -> note counts
  tabs: string[];                     // extra tab labels in the page's top bar
  gardenFolder: string;               // notes in this folder are published as full pages ("" = only caldera: garden)
  gardenJournal: boolean;             // grow garden pages from the public daily journal (projects + recurring themes)
  gardenUrl: string;                  // an existing garden elsewhere (Quartz, Obsidian Publish...), linked from the profile
  groups: string[];                   // groups this profile is in: each is a town at hub/g/<name>
  apps?: string[];                    // App Store / Google Play links, "link | repo-name" (Caldera/profile.md apps: wins)
  websites?: string[];                // websites, "link | repo-name" (Caldera/profile.md websites: wins)
  hideStorefronts?: string[];         // repos whose apps and websites get no storefront in the city (and whose own websites are dropped from it)
  invitedBy?: string;                 // handle whose invite link brought this vault to Caldera (sent once, with the first publish)
  sharePrompted?: boolean;
  topicsOffered?: boolean;            // the one-time "pick topics from your tags" offer has been shown
  finishOffered?: boolean;            // the one-time "finish your page" offer for a bare page has been shown            // the "your page is live, share it" screen has been shown
  showViews?: boolean;                // show the public view count on my page (default on)
  lastKudos?: string;                 // ISO time of the newest kudos already announced
  lastAttention?: string;             // ISO time of the last "people looked at your page" notice (at most one a day)
  emailPromptShown?: boolean;         // the one-time "get your daily summary" notice was shown
  welcomeNew?: boolean;               // community hosts: send a friend request to each new member
  welcomeSince?: string;              // ... who joined after this time
  welcomeNote?: string;               // the note that goes with it
  welcomeSent?: string[];             // ids already welcomed
  welcomeDay?: [string, number];      // [date, requests sent that day] (max 10 a day)
  summaryEmail?: string;              // address for the daily summary email (kept in this vault; the hub stores it encrypted)
}

export const DEFAULT_SETTINGS: CalderaSettings = {
  hubUrl: "https://caldera.social",
  identity: null, handle: "", name: "", headline: "", theme: "dark",
  avatarPath: "", bannerPath: "",
  links: [], properties: [],
  sections: { journal: true, scoreboard: true, properties: true, numbers: true, topics: true, notes: true, links: true, sidebar: true, rail: true, modules: true },
  publicTopics: [["ai", "AI"], ["design", "Design"], ["startups", "Startups"], ["investing", "Investing"], ["writing", "Writing"]],
  activityFile: "Caldera/activity.json", historyDays: 45,
  inboxFolder: "Caldera/Inbox", lastInboxSync: "1970-01-01T00:00:00.000Z",
  asks: [], offers: [], autoPublishHours: 6, welcomed: false, listed: true, lastSeenRelease: "", lastPublished: 0,
  tree: [], graph: [], backlinks: [], summary: "", now: [], timeline: [], projects: [], knows: [], tabs: [],
  gardenFolder: "Garden", gardenUrl: "", gardenJournal: true, groups: [],
};

export const WELCOME_NOTE = "Welcome to Caldera - I built it. Glad you're here. If anything breaks or feels confusing, tell me and I'll fix it.";
export const groupsFrom = (v: unknown) => [...new Set(String(v || "").toLowerCase().split(/[\s,]+/).map(g => g.replace(/^#/, "")).filter(g => /^[a-z0-9][a-z0-9-]{1,29}$/.test(g)))].slice(0, 8);

const SECTION_LABELS: Record<string, string> = {
  journal: "Daily journal (flip through days)", scoreboard: "Scoreboard (streak, rank, 30-day bars)", properties: "Properties",
  numbers: "Vault numbers (notes, words, links, active days)", topics: "Topics (allow-listed tags only)", notes: "Notes marked caldera: public",
  links: "Links elsewhere", garden: "Garden (full pages for notes you plant: Garden folder or caldera: garden)",
  city: "City (your GitHub as a little city: add GitHub | https://github.com/you to Links, or write Caldera/city.json yourself)",
};

export class CalderaSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: CalderaPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; const s = this.plugin.settings;
    containerEl.empty();
    containerEl.createEl("p", { text: "Your vault stays private. Only the sections you switch on below, notes you mark caldera: public, and counts are published. Use 'Preview profile' before publishing.", cls: "setting-item-description" });

    // Connections: the same lights as caldera.social/settings, so it's obvious what's connected and what isn't
    new Setting(containerEl).setName("Connections").setHeading();
    const lights = containerEl.createDiv({ cls: "caldera-conn" });
    lights.createEl("p", { text: s.identity && s.handle ? "Checking..." : "Publish your page to see your connections.", cls: "setting-item-description" });
    if (s.identity && s.handle) void this.plugin.ownerActivity(new Date(Date.now() - 86400_000).toISOString()).then((a: any) => {
      const c = a?.connections; lights.empty(); if (!c) { lights.createEl("p", { text: "Update the hub to see connections.", cls: "setting-item-description" }); return; }
      const rows: [string, boolean, string][] = [
        ["GitHub", !!c.github?.on, c.github?.on ? `Connected as @${c.github.login}` : c.github?.listed ? `Listed (github.com/${c.github.listed}), sign in with GitHub once to link it` : "Not connected"],
        ["Obsidian", true, "Connected (this vault)"],
        ["Live visitors on your city", !!c.live, c.live ? "Visits in the last 7 days" : "No visits in the last 7 days"],
        ["AI agents on the map", !!c.agents, c.agents ? "Agents in the last 7 days" : "No agents in the last 7 days"],
        ["Private view", !!c.private, c.private ? "Up to date" : "Not turned on"],
        ["Daily summary email", !!c.email, c.email ? "On" : "Off"],
      ];
      for (const [name, on, status] of rows) {
        const r = lights.createDiv({ cls: "caldera-conn-row" });
        r.createSpan({ cls: "caldera-conn-dot" + (on ? " is-on" : ""), attr: { "aria-label": on ? "Connected" : "Not connected" } });
        r.createSpan({ text: name, cls: "caldera-conn-name" }); r.createSpan({ text: status, cls: "caldera-conn-status" });
      }
    }).catch(() => { lights.empty(); lights.createEl("p", { text: "Couldn't reach the hub.", cls: "setting-item-description" }); });
    new Setting(containerEl).setName("Set them up on caldera.social").setDesc("Opens your settings page, already signed in, with a step-by-step for anything that's grey.")
      .addButton(b => b.setButtonText("Open settings").setDisabled(!s.identity || !s.handle).onClick(() => void this.plugin.openProfile("settings")));

    new Setting(containerEl).setName("Identity").setHeading();
    new Setting(containerEl).setName("Your Caldera ID").setDesc(s.identity ? s.identity.id : "Not created yet")
      .addButton(b => b.setButtonText(s.identity ? "Copy ID" : "Create identity").onClick(async () => {
        if (!s.identity) { await this.plugin.ensureIdentity(); this.display(); }
        else { await navigator.clipboard.writeText(s.identity.id); new Notice("ID copied"); }
      }))
      .addButton(b => b.setButtonText("Export recovery key").setDisabled(!s.identity).onClick(async () => {
        await navigator.clipboard.writeText(btoa(JSON.stringify(s.identity))); new Notice("Recovery key copied. Store it somewhere safe; anyone with it can act as you.");
      }));
    this.text("Handle", "Your address on the hub: hub/@handle", "handle", v => v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
    let claim = "";
    new Setting(containerEl).setName("Import a GitHub sign-up")
      .setDesc("Started your Caldera profile with GitHub on the website? Get a code on your settings page (caldera.social/settings, Connections > Obsidian) and paste it here: your vault takes over that profile (same handle and page) and the hub deletes its copy of the key.")
      .addText(t => t.setPlaceholder("CAL-...").onChange(v => { claim = v.trim(); }))
      .addButton(b => b.setButtonText("Import").onClick(() => this.plugin.importGithub(claim).then(ok => { if (ok) this.display(); })));
    this.text("Hub", "Where your profile is hosted and friends connect. Self-hosters can point this at their own hub.", "hubUrl");
    new Setting(containerEl).setName("List me in the directory").setDesc("Show your profile card on the public People page. Off: your page still works for anyone with the link, but isn't browsable.")
      .addToggle(t => t.setValue(s.listed !== false).onChange(async v => { s.listed = v; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Connect me with my GitHub people").setDesc("Become friends automatically with Caldera members you follow or who follow you on GitHub, or who work on the same public repos, including people who join later. Remove one like any friend and it never comes back.")
      .addToggle(t => t.setValue(s.autoConnectRepos !== false).onChange(async v => { s.autoConnectRepos = v; await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }));
    new Setting(containerEl).setName("Tag me from my public GitHub")
      .setDesc("Shows what you're building (like AI agents or Next.js) on your page and in People, worked out from your public repos' topics, descriptions, READMEs and dependencies. Private repos only ever add a language. Add or hide tags with tags / hideTags in Caldera/profile.md, or on caldera.social/me/building.")
      .addToggle(t => t.setValue(s.autoTags !== false).onChange(async v => { s.autoTags = v; await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }));
    new Setting(containerEl).setName("Private repos on my city")
      .setDesc("How your private repos appear on your public city, the World and your share card. With names: they look exactly like your private view (names, language colours, activity, real projects) but nobody can open the code. Padlocked: nameless locked buildings in place, which still show roughly how big and how busy private work is, and which project it sits beside. Anonymous: one separate padlocked district with no sizes, activity or projects. Hidden: no trace at all. Your private view always shows everything. Also: privateRepos in Caldera/profile.md.")
      .addDropdown(d => d.addOption("", "Caldera's default (padlocked)").addOption("named", "Show with names (code stays private)").addOption("show", "Show as padlocked").addOption("anonymous", "Anonymous").addOption("hidden", "Hidden").setValue(s.privateRepos || "")
        .onChange(async v => { s.privateRepos = (v || undefined) as CalderaSettings["privateRepos"]; s.privateReposTs = new Date().toISOString(); await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }));
    new Setting(containerEl).setName("Show my view count").setDesc("Your page shows how many people have viewed it (one per visitor per day). Off: only you see the count, in the bar when you're signed in and in your private view.")
      .addToggle(t => t.setValue(s.showViews !== false).onChange(async v => { s.showViews = v; await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }));

    new Setting(containerEl).setName("Friends and sharing").setHeading();
    new Setting(containerEl).setName("Share my page").setDesc("Your link, the picture people see when you post it, and your invite link (you get 25 help credits for each person who joins from it).")
      .addButton(b => b.setButtonText("Share my page").setCta().setDisabled(!s.handle).onClick(() => this.plugin.openShare()));
    new Setting(containerEl).setName("Groups").setDesc(`Comma separated, like producthunt. Each group is a town of everyone's cities at ${s.hubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/g/name, and people in your groups are suggested to you as friends.`)
      .addText(t => t.setPlaceholder("producthunt, obsidian-pkm").setValue((s.groups || []).join(", ")).onChange(async v => { s.groups = groupsFrom(v); await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }));
    let email = s.summaryEmail || "";
    new Setting(containerEl).setName("Email me a daily summary").setDesc("One short email on days something happens: who visited your page, kudos and new followers, people to meet. We send a confirmation link first; every email has a one-click unsubscribe. Leave empty and save to turn it off.")
      .addText(t => t.setPlaceholder("you@example.com").setValue(email).onChange(v => email = v.trim()))
      .addButton(b => b.setButtonText("Save").onClick(() => this.plugin.setSummaryEmail(email)));
    new Setting(containerEl).setName("Welcome new members").setDesc("For community hosts: follow each person who joins Caldera from now on, with the note below (up to 10 a day). Off by default.")
      .addToggle(t => t.setValue(!!s.welcomeNew).onChange(async v => { s.welcomeNew = v; if (v && !s.welcomeSince) s.welcomeSince = new Date().toISOString(); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Welcome note").addTextArea(t => { t.setValue(s.welcomeNote || WELCOME_NOTE); t.inputEl.rows = 2; t.onChange(async v => { s.welcomeNote = v.trim().slice(0, 200); await this.plugin.saveSettings(); }); });

    new Setting(containerEl).setName("Profile").setHeading();
    new Setting(containerEl).setName("Edit your page as a note").setDesc("Name, headline, photo, links, topics and sections also live in Caldera/profile.md. Edit it (or ask your AI agent to) and the page republishes itself. Values there win over the fields below.")
      .addButton(b => b.setButtonText("Open profile file").onClick(() => this.plugin.openProfileFile()));
    this.text("Name", "", "name");
    this.text("Headline", "One line under your name", "headline");
    this.text("Avatar image", "Path in your vault, e.g. Attachments/me.jpg", "avatarPath");
    this.text("Banner image", "Path in your vault", "bannerPath");
    new Setting(containerEl).setName("Theme").addDropdown(d => d.addOptions({ dark: "Dark", light: "Light" }).setValue(s.theme).onChange(async v => { s.theme = v as any; await this.plugin.saveSettings(); }));
    this.pairs("Links", "One per line: Label | https://url", "links");
    this.listing("Apps", "Your apps in the App Store or Google Play (up to 12). Each one gets a card on your page and, with Storefront on, a storefront building in your city. Repo: the repo it's built from, so it stands beside that repo (a private repo's name is never shown).", "apps", "app");
    this.listing("Websites", "Sites you run (up to 12), a whole site or one page like example.com/tool. Each one gets a card on your page and, with Storefront on, a storefront building in your city that its live visitors walk into. Repo: the repo that builds it. Storefront off: the site lights up that repo's building instead.", "websites", "site");
    new Setting(containerEl).setName("Repos without storefronts").setDesc("Comma separated repo names. Their apps and websites get no storefront, and their own websites (GitHub homepage) are left off your public city. Also hideStorefronts in Caldera/profile.md.")
      .addText(t => { void this.listValue("hideStorefronts").then(v => t.setValue(v.join(", "))); t.setPlaceholder("old-site, client-work").onChange(v => this.saveList("hideStorefronts", v.split(",").map(x => x.trim()).filter(x => /^[A-Za-z0-9._-]{1,100}$/.test(x)))); });
    new Setting(containerEl).setName("GitHub username").setDesc("Your public repos become your city, and your contributions your code chart. Refreshed every 6 hours. Same as a GitHub line in Links.")
      .addText(t => t.setPlaceholder("octocat").setValue(githubUser(s.links || []) || "").onChange(async v => {
        const u = v.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/.*$/, "");
        s.links = (s.links || []).filter(l => !/^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9-]{1,39}\/?$/.test(l[1]));
        if (/^[A-Za-z0-9-]{1,39}$/.test(u)) s.links.push(["GitHub", `https://github.com/${u}`]);
        await this.plugin.saveSettings();
      }));
    new Setting(containerEl).setName("Forgejo or Codeberg profile").setDesc("Code on Codeberg or your own Forgejo / Gitea server instead? Paste your profile address. Your public repos become your city, and your contributions your code chart. Used when no GitHub username is set.")
      .addText(t => t.setPlaceholder("https://codeberg.org/you").setValue((s.links || []).find(l => l[0] === "Forgejo")?.[1] || "").onChange(async v => {
        const m = v.trim().replace(/^http:/, "https:").replace(/\/+$/, "").match(/^(https:\/\/[^/\s]+)\/([A-Za-z0-9._-]{1,40})$/);
        s.links = (s.links || []).filter(l => l[0] !== "Forgejo");
        if (m) s.links.push(["Forgejo", `${m[1]}/${m[2]}`]);
        await this.plugin.saveSettings();
      }));
    this.pairs("Properties", "One per line: key | value (shown as a properties block)", "properties");

    new Setting(containerEl).setName("What is public").setHeading();
    for (const [k, label] of Object.entries(SECTION_LABELS)) {
      if (k === "garden" && !gardenEnabled()) continue;   // the garden is paused (core flags.ts)
      new Setting(containerEl).setName(label).addToggle(t => t.setValue(s.sections[k] !== undefined ? !!s.sections[k] : k === "garden" || k === "city").onChange(async v => { s.sections[k] = v; await this.plugin.saveSettings(); }));
    }
    if (gardenEnabled()) {
    this.text("Garden folder", "Notes in this folder are published as full pages, with stage and license from their properties. Empty = only notes marked caldera: garden.", "gardenFolder", v => v.replace(/^\/+|\/+$/g, ""));
    new Setting(containerEl).setName("Grow my garden from my journal").setDesc("Each public project and recurring theme in your daily journal gets a garden page that adds a dated entry whenever it comes up. Uses only journal text that is already public.")
      .addToggle(t => t.setValue(s.gardenJournal !== false).onChange(async v => { s.gardenJournal = v; await this.plugin.saveSettings(); }));
    this.text("Existing garden URL", "Optional: a garden you already publish elsewhere (Quartz, Obsidian Publish...). Linked from your page.", "gardenUrl", v => /^https:\/\//.test(v) ? v : "");
    }
    this.pairs("Public topics", "Only these tags are counted. One per line: tag | Label", "publicTopics");
    this.text("Activity file", "Optional JSON of daily counts from outside tools (calendar, email, git)", "activityFile");

    new Setting(containerEl).setName("My profile tab").setHeading();
    new Setting(containerEl).setName("Open my profile when Obsidian starts").setDesc("The My profile tab shows your page built from your vault, plus private sections only you can see (visits, today, on this day, patterns, goals). Switch to Public view to see the live page.")
      .addToggle(t => t.setValue(!!s.openProfileOnStartup).onChange(async v => { s.openProfileOnStartup = v; await this.plugin.saveSettings(); }))
      .addButton(b => b.setButtonText("Open now").onClick(() => this.plugin.openProfileTab()));
    new Setting(containerEl).setName("Private web address (Tailscale)")
      .setDesc(createFragment(f => { f.appendText("See your private sections in a browser, on any of your Tailscale devices. Every 10 minutes Obsidian pushes them to your hub, which stores them encrypted and shows them only to your own Tailscale account, never on your public page. Needs a hub with a private address set up for you (self-hosted, or the operator's own profile)."); if (s.privateUrl) { f.createEl("br"); f.appendText("Your private address: "); f.createEl("a", { text: s.privateUrl, href: s.privateUrl }); } }))
      .addToggle(t => t.setValue(!!s.privateWeb).onChange(async v => {
        s.privateWeb = v; await this.plugin.saveSettings(); this.plugin.schedulePrivatePush();
        if (v && !(await this.plugin.pushPrivate(true))) { s.privateWeb = false; await this.plugin.saveSettings(); this.plugin.schedulePrivatePush(); }
        this.display();
      }));

    new Setting(containerEl).setName("Live traffic on your city").setHeading();
    const sites = s.traffic || [], hub = s.hubUrl.replace(/\/$/, "");
    new Setting(containerEl).setName("Show visitors to your own sites in your city").setDesc(sites.length
      ? "Paste a project's snippet into that site's pages (before </body>). Each visit then rides out of its district as a light, live. Call caldera('signup') or caldera('buy') on the page to mark conversions. Your public city shows only how busy each district is; the numbers stay in your private view and private address."
      : "Each city district gets a tracking snippet after your next publish (you need a city: add GitHub | https://github.com/you to Links above).");
    for (const site of sites) {
      const snippet = trackTag(hub, site.key);
      new Setting(containerEl).setName(site.project).setDesc(snippet + (site.public ? "" : "  (unlisted project: shown as Private on your public city)"))
        .addButton(b => b.setButtonText("Copy snippet").onClick(async () => { await navigator.clipboard.writeText(snippet); new Notice(`Snippet for ${site.project} copied`); }))
        .addExtraButton(b => b.setIcon("key-round").setTooltip("Copy server key (for sending events from your own server: POST " + hub + "/v1/t/" + site.key + "/events)").onClick(async () => {
          if (!site.secret) return void new Notice("Publish once to get the server key");
          await navigator.clipboard.writeText(site.secret); new Notice("Server key copied. Keep it secret: it lets a server send events for this site."); }));
    }

    new Setting(containerEl).setName("AI agents on your city").setHeading();
    new Setting(containerEl).setName("Show your AI agents working in your city")
      .setDesc(s.agentKey ? "Each Claude Code agent you run becomes a drone over the repo it's working in: a beam while it edits, circling while it thinks, parked at Agent HQ blinking amber when it's waiting on you. Copy the setup prompt and paste it into Claude Code on each computer you use. What an agent is working on stays private (your private view and private address); your public city only shows anonymous drones."
        : "Publish once (with a city) to get your agent key.")
      .addButton(b => b.setButtonText("Copy setup prompt").setDisabled(!s.agentKey).onClick(async () => {
        await navigator.clipboard.writeText(agentSetupPrompt(hub, s.agentKey!)); new Notice("Setup prompt copied. Paste it into Claude Code on each computer you use.");
      }));

    new Setting(containerEl).setName("Publishing").setHeading();
    new Setting(containerEl).setName("Auto-publish interval (hours)").setDesc("0 = only when you publish manually")
      .addText(t => t.setValue(String(s.autoPublishHours)).onChange(async v => { s.autoPublishHours = Math.max(0, Number(v) || 0); await this.plugin.saveSettings(); this.plugin.scheduleAutoPublish(); }));
  }

  private text(name: string, desc: string, key: keyof CalderaSettings, clean: (v: string) => string = v => v) {
    new Setting(this.containerEl).setName(name).setDesc(desc).addText(t => t.setValue(String(this.plugin.settings[key] ?? "")).onChange(async v => { (this.plugin.settings as any)[key] = clean(v.trim()); await this.plugin.saveSettings(); }));
  }

  /** The current list: from Caldera/profile.md when the note sets it (it wins there), else from settings. */
  private async listValue(key: "apps" | "websites" | "hideStorefronts"): Promise<string[]> {
    const f = this.app.vault.getAbstractFileByPath(PROFILE_FILE), fm = f instanceof TFile ? this.app.metadataCache.getFileCache(f)?.frontmatter : null;
    const v = fm && key in fm ? fm[key] : this.plugin.settings[key];
    return Array.isArray(v) ? v.map(x => String(x ?? "").trim()).filter(Boolean) : typeof v === "string" ? v.split(/\r?\n/).map(x => x.trim()).filter(Boolean) : [];
  }
  /** Saved where it came from: into Caldera/profile.md when the note sets this list (so the note stays the source), else settings. */
  private async saveList(key: "apps" | "websites" | "hideStorefronts", lines: string[]) {
    const f = this.app.vault.getAbstractFileByPath(PROFILE_FILE), fm = f instanceof TFile ? this.app.metadataCache.getFileCache(f)?.frontmatter : null;
    if (f instanceof TFile && fm && key in fm) await this.app.fileManager.processFrontMatter(f, (m: any) => { m[key] = lines; });
    else { this.plugin.settings[key] = lines; await this.plugin.saveSettings(); this.plugin.queuePublish("profile"); }
  }
  /** One row per app or website: its link, the repo it's tied to (editable), a Storefront toggle and Remove; then Add. */
  private listing(name: string, desc: string, key: "apps" | "websites", kind: ListingKind) {
    new Setting(this.containerEl).setName(name).setDesc(desc);
    const box = this.containerEl.createDiv({ cls: "caldera-listings" });
    let refs: ListingRef[] = [];
    const save = () => this.saveList(key, refs.map(listingLine));
    const draw = () => {
      box.empty();
      refs.forEach((r, i) => {
        const label = r.kind === "site" ? r.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : r.store === "play" ? `Google Play: ${r.id}` : `App Store: id${r.id}`;
        new Setting(box).setName(label).setClass("caldera-listing-row")
          .addText(t => t.setPlaceholder("repo (optional)").setValue(r.repo || "").onChange(v => { const x = v.trim(); if (x && !/^[A-Za-z0-9._-]{1,100}$/.test(x)) return; r.repo = x || undefined; void save(); }))
          .addToggle(t => t.setTooltip("Storefront in my city").setValue(r.storefront !== false).onChange(v => { if (v) delete r.storefront; else r.storefront = false; void save(); }))
          .addExtraButton(b => b.setIcon("trash").setTooltip("Remove").onClick(() => { refs.splice(i, 1); void save(); draw(); }));
      });
      let add = "";
      const row = new Setting(box).setName(refs.length ? "" : `No ${kind === "app" ? "apps" : "websites"} yet`)
        .addText(t => t.setPlaceholder(kind === "app" ? "https://apps.apple.com/us/app/name/id123456789" : "https://example.com").onChange(v => { add = v.trim(); }))
        .addButton(b => b.setButtonText("Add").onClick(() => {
          const r = parseListingLine(add, kind);
          if (!r) { row.setDesc(kind === "app" ? "That isn't an App Store (apps.apple.com) or Google Play link." : "That isn't a website link (http or https, no IP addresses)."); return; }
          if (refs.some(x => x.key === r.key)) { row.setDesc("Already listed."); return; }
          if (refs.length >= MAX_LISTINGS) { row.setDesc(`Up to ${MAX_LISTINGS}.`); return; }
          refs.push(r); void save(); draw();
        }));
    };
    void this.listValue(key).then(lines => { refs = lines.map(l => parseListingLine(l, kind)).filter((x): x is ListingRef => !!x).slice(0, MAX_LISTINGS); draw(); });
  }

  private pairs(name: string, desc: string, key: "links" | "properties" | "publicTopics") {
    new Setting(this.containerEl).setName(name).setDesc(desc).addTextArea(t => {
      t.setValue(this.plugin.settings[key].map(p => p.join(" | ")).join("\n"));
      t.inputEl.rows = 4;
      t.onChange(async v => {
        this.plugin.settings[key] = v.split("\n").map(l => l.split("|").map(x => x.trim())).filter(p => p[0] && p[1]).map(p => [p[0], p.slice(1).join("|")] as [string, string]);
        await this.plugin.saveSettings();
      });
    });
  }
}

/** The agent hook this release was built against (hub site/agent-hook.mjs); the setup prompt refuses any other file. */
/** The live-traffic script, frozen at /t/1.js: snippets carry its integrity hash so a changed file never runs on your sites. */
export const TRACK_SRI = "sha384-UCnwKWu6Be2g87+ZI1+h367D6yOXEuXFQL2U2Z7PuSoH3oSCsu/cmZMbj4s70JlC";
export const trackTag = (hub: string, key: string) => `<script async src="${hub.replace(/\/$/, "")}/t/1.js" integrity="${TRACK_SRI}" crossorigin="anonymous" data-site="${key}"></script>`;
export const AGENT_HOOK_SHA256 = "bfe8dbde26fdc5e8b2e33805cdd4cadb98020ecaf34fe3f7c2e491ed636aedae";

/** A prompt the owner pastes into Claude Code: installs the Caldera agent hook (one small script, no dependencies). */
export function agentSetupPrompt(hub: string, k: { key: string; secret: string }): string {
  return `Set up the Caldera agent hook on this computer, so my Caldera city shows what my AI agents are working on.

1. Download ${hub}/agent-hook.mjs to ~/.caldera/agent-hook.mjs (create the folder). Read it first: it reads the hook event from stdin, works out the repo (git remote name) and a short task title, and posts only that to my Caldera hub, with a 1.5 second timeout. It never blocks or changes anything.
   Before using it, check its SHA-256 is ${AGENT_HOOK_SHA256} (shasum -a 256 ~/.caldera/agent-hook.mjs). If it doesn't match, delete it, stop and tell me.
2. Write ~/.caldera/agent.json (chmod 600): {"hub": "${hub}", "key": "${k.key}", "secret": "${k.secret}", "machine": "<a short name for this computer>"}
3. In ~/.claude/settings.json, add hooks (keep any existing ones) that run \`node ~/.caldera/agent-hook.mjs\` for UserPromptSubmit, PostToolUse, Stop, Notification and SessionEnd.
4. Test it: echo '{"hook_event_name":"UserPromptSubmit","session_id":"caldera-test-1","cwd":"'$PWD'","prompt":"Testing the Caldera agent hook"}' | node ~/.caldera/agent-hook.mjs and confirm it exits quietly, then send SessionEnd for the same session to clear the test drone.

Keep the key and secret out of any repo. If I'd rather not send task titles at all, add "tasks": false to agent.json (drones still fly, without words).`;
}
