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
  pendingRequests?: { request: string; from: string; handle?: string; note?: string; ts: string }[];   // friend requests survive a restart
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
    this.pairs("Properties", "One per line: key | value (shown as a properties block)", "properties");

    new Setting(containerEl).setName("What is public").setHeading();
    for (const [k, label] of Object.entries(SECTION_LABELS)) {
      new Setting(containerEl).setName(label).addToggle(t => t.setValue(s.sections[k] !== undefined ? !!s.sections[k] : k === "garden").onChange(async v => { s.sections[k] = v; await this.plugin.saveSettings(); }));
    }
    this.text("Garden folder", "Notes in this folder are published as full pages, with stage and license from their properties. Empty = only notes marked caldera: garden.", "gardenFolder", v => v.replace(/^\/+|\/+$/g, ""));
    new Setting(containerEl).setName("Grow my garden from my journal").setDesc("Each public project and recurring theme in your daily journal gets a garden page that adds a dated entry whenever it comes up. Uses only journal text that is already public.")
      .addToggle(t => t.setValue(s.gardenJournal !== false).onChange(async v => { s.gardenJournal = v; await this.plugin.saveSettings(); }));
    this.text("Existing garden URL", "Optional: a garden you already publish elsewhere (Quartz, Obsidian Publish...). Linked from your page.", "gardenUrl", v => /^https:\/\//.test(v) ? v : "");
    this.pairs("Public topics", "Only these tags are counted. One per line: tag | Label", "publicTopics");
    this.text("Activity file", "Optional JSON of daily counts from outside tools (calendar, email, git)", "activityFile");

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
