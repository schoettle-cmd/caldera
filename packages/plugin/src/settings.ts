import { githubUser } from "./auto";
import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type CalderaPlugin from "./main";
import type { Identity } from "@caldera/core";

export interface CalderaSettings {
  hubUrl: string;
  identity: Identity | null;          // stays on this device (plugin data); export it as your recovery key
  handle: string; name: string; headline: string; theme: "dark" | "light";
  avatarPath: string; bannerPath: string;
  links: [string, string][]; properties: [string, string][];
  sections: Record<string, boolean>;
  publicTopics: [string, string][];   // [tag, label] - only these tags are ever counted
  activityFile: string; historyDays: number;
  inboxFolder: string; lastInboxSync: string;
  ownerLastLooked?: string;   // when the owner last opened the My profile tab (drives 'Since you last looked')
  openProfileOnStartup?: boolean;
  privateWeb?: boolean; privateUrl?: string;   // private web address (Tailscale) for the owner layer
  pendingRequests?: { request: string; from: string; handle?: string; note?: string; ts: string }[];   // friend requests survive a restart
  traffic?: { key: string; project: string; public: number | boolean; secret?: string }[];
  agentKey?: { key: string; secret: string };   // AI agents report what they're working on (drones in the city)   // live traffic: one site key per city district
  asks: { id: string; title: string; bounty: number }[];
  offers: { id: string; title: string }[];
  autoPublishHours: number;           // 0 = manual only
  welcomed: boolean;                  // first-run welcome finished
  listed: boolean;                    // shown in the public directory at hub/people
  lastSeenRelease: string;            // newest release the owner has been shown (What's new)
  lastPublished: number;              // ms epoch of the last successful publish (catch-up publish on start)
  tree: [string, string, string?][];  // left sidebar: [group, "item, item", folder to count]; empty = topics + public notes
  graph: string[];                    // right rail graph: note names, sized by how many notes link to each; empty = topics
  backlinks: [string, string][];      // right rail list: [title, context]; empty = public notes
  summary: string; now: string[];      // owner-written page text (Caldera/profile.md)
  timeline: [string, string][];       // [year, text]
  projects: [string, string][];       // [name, "status | url"]
  knows: [string, string][];          // [label, vault folder] -> note counts
  tabs: string[];                     // extra tab labels in the page's top bar
  gardenFolder: string;               // notes in this folder are published as full pages ("" = only caldera: garden)
  gardenJournal: boolean;             // grow garden pages from the public daily journal (projects + recurring themes)
  gardenUrl: string;                  // an existing garden elsewhere (Quartz, Obsidian Publish...), linked from the profile
}

export const DEFAULT_SETTINGS: CalderaSettings = {
  hubUrl: "https://caldera.social",
  identity: null, handle: "", name: "", headline: "", theme: "dark",
  avatarPath: "", bannerPath: "",
  links: [], properties: [],
  sections: { journal: true, scoreboard: true, properties: true, numbers: true, topics: true, notes: true, asks: true, social: true, links: true, sidebar: true, rail: true },
  publicTopics: [["ai", "AI"], ["design", "Design"], ["startups", "Startups"], ["investing", "Investing"], ["writing", "Writing"]],
  activityFile: "Caldera/activity.json", historyDays: 45,
  inboxFolder: "Caldera/Inbox", lastInboxSync: "1970-01-01T00:00:00.000Z",
  asks: [], offers: [], autoPublishHours: 6, welcomed: false, listed: true, lastSeenRelease: "", lastPublished: 0,
  tree: [], graph: [], backlinks: [], summary: "", now: [], timeline: [], projects: [], knows: [], tabs: [],
  gardenFolder: "Garden", gardenUrl: "", gardenJournal: true,
};

const SECTION_LABELS: Record<string, string> = {
  journal: "Daily journal (flip through days)", scoreboard: "Scoreboard (streak, rank, 30-day bars)", properties: "Properties",
  numbers: "Vault numbers (notes, words, links, active days)", topics: "Topics (allow-listed tags only)", notes: "Notes marked caldera: public",
  asks: "Help exchange (asks and offers)", social: "Friends, gravity and credits", links: "Links elsewhere", garden: "Garden (full pages for notes you plant: Garden folder or caldera: garden)",
  city: "City (your GitHub as a little city: add GitHub | https://github.com/you to Links, or write Caldera/city.json yourself)",
};

export class CalderaSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: CalderaPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this; const s = this.plugin.settings;
    containerEl.empty();
    containerEl.createEl("p", { text: "Your vault stays private. Only the sections you switch on below, notes you mark caldera: public, and counts are published. Use 'Preview profile' before publishing.", cls: "setting-item-description" });

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
      .setDesc("Started your Caldera profile with GitHub on the website? Get a code on your account page (caldera.social/me) and paste it here: your vault takes over that profile (same handle and page) and the hub deletes its copy of the key.")
      .addText(t => t.setPlaceholder("CAL-...").onChange(v => { claim = v.trim(); }))
      .addButton(b => b.setButtonText("Import").onClick(() => this.plugin.importGithub(claim).then(ok => { if (ok) this.display(); })));
    this.text("Hub", "Where your profile is hosted and friends connect. Self-hosters can point this at their own hub.", "hubUrl");
    new Setting(containerEl).setName("List me in the directory").setDesc("Show your profile card on the public People page. Off: your page still works for anyone with the link, but isn't browsable.")
      .addToggle(t => t.setValue(s.listed !== false).onChange(async v => { s.listed = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("Profile").setHeading();
    new Setting(containerEl).setName("Edit your page as a note").setDesc("Name, headline, photo, links, topics and sections also live in Caldera/profile.md. Edit it (or ask your AI agent to) and the page republishes itself. Values there win over the fields below.")
      .addButton(b => b.setButtonText("Open profile file").onClick(() => this.plugin.openProfileFile()));
    this.text("Name", "", "name");
    this.text("Headline", "One line under your name", "headline");
    this.text("Avatar image", "Path in your vault, e.g. Attachments/me.jpg", "avatarPath");
    this.text("Banner image", "Path in your vault", "bannerPath");
    new Setting(containerEl).setName("Theme").addDropdown(d => d.addOptions({ dark: "Dark", light: "Light" }).setValue(s.theme).onChange(async v => { s.theme = v as any; await this.plugin.saveSettings(); }));
    this.pairs("Links", "One per line: Label | https://url", "links");
    new Setting(containerEl).setName("GitHub username").setDesc("Your public repos become your city, and your contributions your code chart. Refreshed every 6 hours. Same as a GitHub line in Links.")
      .addText(t => t.setPlaceholder("octocat").setValue(githubUser(s.links || []) || "").onChange(async v => {
        const u = v.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/.*$/, "");
        s.links = (s.links || []).filter(l => !/^https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9-]{1,39}\/?$/.test(l[1]));
        if (/^[A-Za-z0-9-]{1,39}$/.test(u)) s.links.push(["GitHub", `https://github.com/${u}`]);
        await this.plugin.saveSettings();
      }));
    this.pairs("Properties", "One per line: key | value (shown as a properties block)", "properties");

    new Setting(containerEl).setName("What is public").setHeading();
    for (const [k, label] of Object.entries(SECTION_LABELS)) {
      new Setting(containerEl).setName(label).addToggle(t => t.setValue(s.sections[k] !== undefined ? !!s.sections[k] : k === "garden" || k === "city").onChange(async v => { s.sections[k] = v; await this.plugin.saveSettings(); }));
    }
    this.text("Garden folder", "Notes in this folder are published as full pages, with stage and license from their properties. Empty = only notes marked caldera: garden.", "gardenFolder", v => v.replace(/^\/+|\/+$/g, ""));
    new Setting(containerEl).setName("Grow my garden from my journal").setDesc("Each public project and recurring theme in your daily journal gets a garden page that adds a dated entry whenever it comes up. Uses only journal text that is already public.")
      .addToggle(t => t.setValue(s.gardenJournal !== false).onChange(async v => { s.gardenJournal = v; await this.plugin.saveSettings(); }));
    this.text("Existing garden URL", "Optional: a garden you already publish elsewhere (Quartz, Obsidian Publish...). Linked from your page.", "gardenUrl", v => /^https:\/\//.test(v) ? v : "");
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
      ? "Paste a project's snippet into that site's pages (before </body>). Each visit then rides out of its district as a light, live. Call caldera('signup') or caldera('buy') on the page to mark conversions. Your public city shows only how busy each district is; the numbers stay in My view and your private address."
      : "Each city district gets a tracking snippet after your next publish (you need a city: add GitHub | https://github.com/you to Links above).");
    for (const site of sites) {
      const snippet = `<script async src="${hub}/t.js" data-site="${site.key}"></script>`;
      new Setting(containerEl).setName(site.project).setDesc(snippet + (site.public ? "" : "  (unlisted project: shown as Private on your public city)"))
        .addButton(b => b.setButtonText("Copy snippet").onClick(async () => { await navigator.clipboard.writeText(snippet); new Notice(`Snippet for ${site.project} copied`); }))
        .addExtraButton(b => b.setIcon("key-round").setTooltip("Copy server key (for sending events from your own server: POST " + hub + "/v1/t/" + site.key + "/events)").onClick(async () => {
          if (!site.secret) return void new Notice("Publish once to get the server key");
          await navigator.clipboard.writeText(site.secret); new Notice("Server key copied. Keep it secret: it lets a server send events for this site."); }));
    }

    new Setting(containerEl).setName("AI agents on your city").setHeading();
    new Setting(containerEl).setName("Show your AI agents working in your city")
      .setDesc(s.agentKey ? "Each Claude Code agent you run becomes a drone over the repo it's working in: a beam while it edits, circling while it thinks, parked at Agent HQ blinking amber when it's waiting on you. Copy the setup prompt and paste it into Claude Code on each computer you use. What an agent is working on stays private (My view and your private address); your public city only shows anonymous drones."
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

/** A prompt the owner pastes into Claude Code: installs the Caldera agent hook (one small script, no dependencies). */
export function agentSetupPrompt(hub: string, k: { key: string; secret: string }): string {
  return `Set up the Caldera agent hook on this computer, so my Caldera city shows what my AI agents are working on.

1. Download ${hub}/agent-hook.mjs to ~/.caldera/agent-hook.mjs (create the folder). Read it first: it reads the hook event from stdin, works out the repo (git remote name) and a short task title, and posts only that to my Caldera hub, with a 1.5 second timeout. It never blocks or changes anything.
2. Write ~/.caldera/agent.json (chmod 600): {"hub": "${hub}", "key": "${k.key}", "secret": "${k.secret}", "machine": "<a short name for this computer>"}
3. In ~/.claude/settings.json, add hooks (keep any existing ones) that run \`node ~/.caldera/agent-hook.mjs\` for UserPromptSubmit, PostToolUse, Stop, Notification and SessionEnd.
4. Test it: echo '{"hook_event_name":"UserPromptSubmit","session_id":"caldera-test-1","cwd":"'$PWD'","prompt":"Testing the Caldera agent hook"}' | node ~/.caldera/agent-hook.mjs and confirm it exits quietly, then send SessionEnd for the same session to clear the test drone.

Keep the key and secret out of any repo.`;
}
