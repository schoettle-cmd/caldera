/**
 * Every feature a Caldera page can show, what feeds it and how to turn it on: one inventory for the setup prompt,
 * the "Unlock more" checklist tier, the site guide and llms.txt, so no feature is ever left undiscoverable.
 */
import { PRIVACY_RULES, MODULES_HELP } from "./agent-prompt.js";
import { gardenEnabled } from "./flags.js";

export interface Feature {
  id: string;
  /** what visitors (or the owner) see */
  label: string;
  /** what feeds it */
  source: string;
  /** how a user turns it on */
  how: string;
  /** shown only to the owner */
  ownerOnly?: boolean;
  /** behind a feature switch (see flags.ts): left out of everything while the switch is off */
  flag?: "garden";
}

export const FEATURES: Feature[] = [
  { id: "journal", label: "Daily journal", source: "caldera_headline / caldera_focus / caldera_wins / caldera_themes in daily notes (YYYY-MM-DD.md)", how: "The setup prompt's routine writes one entry per workday from your notes, calendar, sent email, commits and AI sessions." },
  { id: "scoreboard", label: "Scoreboard (streak, rank, 30-day bars)", source: "notes the plugin counts + the daily counts in Caldera/activity.json", how: "On by default; richer once the routine writes meetings, emails, prompts, commits, docs and tokens per day." },
  { id: "now", label: "Now", source: '"now" in Caldera/profile.md (3 lines)', how: "Write it yourself or let your AI propose it (you approve)." },
  { id: "activity", label: "Activity heatmap", source: "notes created and changed per day, plus outside counts from Caldera/activity.json", how: "Automatic; the routine adds calendar, email, AI and code counts." },
  { id: "growth", label: "Growth", source: "notes in the vault over time", how: "Automatic." },
  { id: "knows", label: "What it knows", source: '"knows" in Caldera/profile.md (Label | vault folder) or a "knows" list in Caldera/activity.json', how: "Pick the folders that describe your knowledge (counts only, never note names)." },
  { id: "inbox", label: "Inbox to knowledge", source: 'an "inbox" block in Caldera/activity.json: {"total", "kinds": [["Reports", 61]], "series": {"label", "weeks": [["Aug 3", 5]]}}', how: "If an agent files your email attachments into the vault, have it count them by kind (counts only)." },
  { id: "topics", label: "Topics", source: "tags you allow-list in Settings -> Caldera -> Public topics", how: "Only allow-listed tags are ever counted, so private names never appear." },
  { id: "projects", label: "Projects with live links", source: '"projects" in Caldera/profile.md (Name | status | https://link); commit counts per project from a "projects" map in Caldera/activity.json', how: "List public projects with their live URL; the routine can add commit counts per project." },
  { id: "code", label: "Code + GitHub city", source: "a GitHub (or Forgejo / Codeberg) link in your profile links, or Caldera/city.json written by the routine", how: 'Add "GitHub | https://github.com/you" to links, or sign up with GitHub.' },
  { id: "ai", label: "AI usage (tokens by model and provider)", source: 'Claude Code and Codex logs on this computer (read by the plugin itself), or an "ai" block in Caldera/activity.json for more machines and your products\' APIs', how: "Automatic on the computer where you code; the routine adds other machines and sources (counts only)." },
  { id: "timeline", label: "Timeline with eras and links", source: '"timeline" in Caldera/profile.md: "Year | milestone | detail" lines, chapters as "era | Name | 2015-2020", links as [[Name|https://...]]', how: "Only things already public; linked names also become links in the side menu." },
  { id: "sidebar", label: "Side menu groups", source: '"sidebar" in Caldera/profile.md (Group | item, item | optional vault folder)', how: "Hand-pick companies, projects or sources to list; items named in your timeline or projects link to their sites." },
  { id: "graph", label: "Local graph and backlinks", source: '"graph" (note names) and "backlinks" (Title | context) in Caldera/profile.md', how: "Pick names you're comfortable showing; the page shows how many notes link to each." },
  { id: "garden", label: "Garden and garden home", source: 'notes in your Garden folder or marked "caldera: garden" (stage + license)', how: "Plant a note; the whole note becomes a public page with backlinks from other gardens.", flag: "garden" },
  { id: "asks", label: "Help exchange (asks and offers)", source: "asks and offers you post", how: 'Run "Caldera: Post an ask" / "Caldera: Post an offer" in Obsidian.' },
  { id: "modules", label: "Your own sections (modules)", source: 'one Markdown note per section in Caldera/modules/ (frontmatter: title, place main | side, order, publish)', how: 'Write one yourself, or ask your AI: "add a Reading list module". Lists, tables, links and vault images all work.' },
  { id: "links", label: "Elsewhere (links)", source: '"links" in Caldera/profile.md (Label | https://url)', how: "Your site, GitHub, socials." },
  { id: "masthead", label: "Masthead and photo", source: '"banner" and "photo" in Caldera/profile.md (images inside the vault)', how: "Choose images in Private view, or copy the masthead prompt for your AI." },
  { id: "live", label: "Live visitors on your city", source: "the Caldera snippet (t.js with your site key) on each of your websites", how: "Copy each district's snippet from Settings -> Caldera -> Live traffic (or caldera.social/me) into that site's shared layout." },
  { id: "agents", label: "Your AI agents on the map", source: "the Caldera agent hook (agent-hook.mjs + Claude Code hooks) on each computer you code on", how: "Copy the agent setup prompt from Settings -> Caldera -> AI agents on your city (or caldera.social/me) and paste it into Claude Code." },
  { id: "weather", label: "Time of day and weather", source: "the viewer's own clock and local weather", how: "Automatic; anyone can override it with the sky buttons." },
  { id: "private", label: "Private view on the web", source: "your private sections, pushed encrypted from Obsidian", how: "Turn on Settings -> Caldera -> Private web view, then use the Public view | Private view switch when signed in.", ownerOnly: true },
  { id: "email", label: "Daily summary email", source: "your address (stored encrypted, double opt-in)", how: "Settings -> Caldera -> Daily summary email (or caldera.social/me), then click the confirm link.", ownerOnly: true },
  { id: "groups", label: "Groups", source: "the groups you join", how: "Settings -> Caldera -> Groups (or caldera.social/me); each group is a town of everyone's cities at caldera.social/g/<name>." },
  { id: "friends", label: "Friends, kudos and views", source: "other members", how: "Nothing to set up: follow people and send kudos from anyone's page (follow each other and you're friends); shared GitHub repos connect people automatically." },
];

/** The inventory minus anything switched off (the garden is paused). Use this for anything people see. */
export const activeFeatures = (): Feature[] => FEATURES.filter(f => f.flag !== "garden" || gardenEnabled());

export type UnlockId = "live" | "agents" | "ai" | "private" | "story" | "code";
export interface UnlockState {
  /** undefined = not applicable here (never nudged) */
  live?: boolean; agents?: boolean; ai?: boolean; private?: boolean; story?: boolean; code?: boolean;
}
export interface UnlockItem { id: UnlockId; label: string; why: string; done: boolean }

const UNLOCK: { id: UnlockId; label: string; why: string }[] = [
  { id: "live", label: "Live visitors on your city", why: "People visiting your sites parachute into your city in real time, and signups get a celebration." },
  { id: "agents", label: "Your AI agents on the map", why: "Your coding agents fly over the repos they're working in, so the city shows what's being built right now." },
  { id: "ai", label: "AI usage on your profile", why: "Tokens by model and provider: the clearest sign you build with AI." },
  { id: "private", label: "Private web view", why: "Your private sections in any browser when you're signed in, with links back into Obsidian." },
  { id: "story", label: "Timeline and projects with links", why: "Your story and live projects, each linking to the real thing." },
  { id: "code", label: "Your GitHub city", why: "Your repos as a living city: buildings grow with commits." },
];

/** The "Unlock more" tier of Finish your page: shown once the basics are done. Items that don't apply are left out. */
export function unlockChecklist(s: UnlockState): UnlockItem[] {
  return UNLOCK.filter(i => s[i.id] !== undefined).map(i => ({ ...i, done: !!s[i.id] }));
}

export interface FeaturePromptOptions { vaultPath?: string; hubUrl?: string; handle?: string; activityFile?: string; agentSetup?: string; hosted?: boolean }

/** The slice of the setup prompt for one feature: what to paste into an AI agent to turn just that on. */
export function featurePrompt(id: UnlockId | "email" | "groups" | "modules", o: FeaturePromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, ""), vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const page = `${hub}/@${o.handle || "<my handle>"}/`, act = o.activityFile || "Caldera/activity.json";
  const keys = o.hosted ? `${hub}/me (signed in with GitHub), section "Live traffic on your city"` : `Obsidian: Settings -> Caldera -> "Live traffic on your city"`;
  const head = (what: string) => `Help me turn on ${what} on my Caldera page (${page}).${o.hosted ? "" : ` Caldera builds that page from my Obsidian vault: ${vault}`}\n\n`;
  const rules = `\n\nRules:\n${PRIVACY_RULES}\n- Show me every change before you make it. Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key.`;
  switch (id) {
    case "live": return head("live visitors on my city") + liveSteps(keys) + rules;
    case "agents": return o.agentSetup ? o.agentSetup : head("my AI agents on the map") + agentSteps(o.hosted ? `${hub}/me` : `Obsidian: Settings -> Caldera -> "AI agents on your city" -> Copy setup prompt`) + rules;
    case "ai": return head("AI usage on my profile") + aiSteps(vault, act) + rules;
    case "private": return head("my private web view") + privateSteps(hub) + rules;
    case "story": return head("a timeline and projects with links") + storySteps(vault) + rules;
    case "code": return head("my GitHub city") + codeSteps(vault, o.hosted) + rules;
    case "email": return head("the daily summary email") + `1. In ${o.hosted ? `${hub}/me` : "Obsidian: Settings -> Caldera -> Daily summary email"}, I type my email address (you don't need to - it's my choice which address).\n2. Caldera emails a confirm link; I click it. Every email has a one-click unsubscribe.\nIt arrives about 8am Pacific, only on days something happened: visits, friend requests, kudos, links into my notes.` + rules;
    case "modules": return head("my own sections (custom modules)") + `${MODULES_HELP}\n\n1. Ask me what I'd like on my page that the standard sections don't cover, and suggest 3 modules that fit me (only from things that are already public).\n2. Draft the full Markdown of each one and show me.\n3. Create only the ones I approve, one note each in "Caldera/modules/". Use place: side for short ones (office hours, links, stack).` + rules;
    case "groups": return head("groups") + `1. Ask me which communities I belong to (a class, a Discord, a company, a cohort) and suggest short group names (lowercase, dashes), for example producthunt.\n2. I join in ${o.hosted ? `${hub}/me` : "Obsidian: Settings -> Caldera -> Groups"} (comma separated). Each group is a town of everyone's cities at ${hub}/g/<name>; share that link with the group.` + rules;
  }
}

export function liveSteps(keys: string): string {
  return `Live visitors: every visit to my websites rides through my Caldera city in real time (new visitors parachute in, signups get a celebration). Counts only: no cookies, no IP addresses, no personal data.
1. Get my snippets from ${keys}: one line per district (project), like <script async src="https://caldera.social/t.js" data-site="KEY"></script>. Districts marked private stay "Private" to visitors.
2. For each website I run, find its repo on this computer and the project/district it belongs to (ask me if unsure), and add that district's line to the site's shared layout so every page has it (for example the root layout, _app/_document, base template or index.html head). Don't add it twice.
3. Mark conversions where they happen: call caldera('signup') after a signup and caldera('buy') after a purchase (guard with if (window.caldera)).
4. Deploy each site the way it's normally deployed (ask me first if it goes to production), open the site, then open my city: the visit should appear within a minute.`;
}

export function agentSteps(where: string): string {
  return `AI agents on the map: each coding agent I run appears as a drone over the repo it's working in (state and a short task title only - never code, prompts or file contents; private repos stay "Private").
1. Ask me to copy my personal agent setup prompt from ${where} (it contains my agent key and secret - keep them out of every repo) and paste it here.
2. Follow that prompt exactly: it installs ~/.caldera/agent-hook.mjs, writes ~/.caldera/agent.json (chmod 600) and adds hooks to ~/.claude/settings.json, keeping any hooks already there. Repeat on each computer I code on.`;
}

export function aiSteps(vault: string, act: string): string {
  return `AI usage: tokens processed for me, by model and provider (counts only - never prompts, file names or costs).
1. On the computer where I run Obsidian, Caldera already reads Claude Code (~/.claude/projects) and Codex (~/.codex/sessions) logs by itself. If the AI usage section is empty, check those folders exist here.
2. To include other computers or my own products' API usage, write an "ai" block into "${vault}/${act}" from a scheduled script (no AI call per run): {"total": <tokens in the window>, "window_days": 45, "models": [["Claude Opus 5.5", n]], "providers": [["Anthropic", n]], "sources": [["Coding agents (3 machines)", n], ["Product APIs", n]], "note": "one short public sentence"}, and "tokens" per day in each "days" entry. Keep "prompt_version" and every other key already in that file.`;
}

export function privateSteps(hub: string): string {
  return `Private web view: my page plus the private sections only I see (today, patterns, goals, visits, sources), in any browser when I'm signed in, with notes linking back into Obsidian.
1. In Obsidian: Settings -> Caldera -> turn on "Private web view". Caldera pushes my private sections to ${hub} encrypted, and shows them only to me when signed in. (I turn this on myself.)
2. Sign in on each browser or phone: open my page, tap "Sign in" (GitHub, an email link, or a code from Obsidian), then use the Public view | Private view switch.`;
}

export function storySteps(vault: string): string {
  return `Timeline and projects: my story and live work, each linking to the real thing.
1. In "${vault}/Caldera/profile.md", propose "timeline" lines from things already public about me: "Year | milestone | one-line detail", chapters as "era | Name | 2015-2020", and links as [[Name|https://...]] (linked names also become links in my side menu).
2. Propose "projects" lines for my public projects: "Name | status | https://live-url".
3. Optionally propose "sidebar" groups ("Companies | A, B, C | optional/vault/folder") and "knows" lines ("Label | vault folder", counts only).
Show me everything first; write only what I approve. The page republishes about a minute after profile.md changes.`;
}

export function codeSteps(vault: string, hosted?: boolean): string {
  return hosted ? `My GitHub city is built from my public GitHub repos automatically. To add private repos (never names or code), install the Caldera GitHub app on the repos I choose from my account page, then pick how they show in Settings > Privacy > Private repos on my city: padlocked in place, anonymous (one separate district, no sizes or activity) or hidden.`
    : `GitHub city: my repos as a living city (districts are projects, buildings are repos, taller = more commits).
1. Make sure "${vault}/Caldera/profile.md" links include my code host: "GitHub | https://github.com/<me>" (or "Forgejo | https://<server>/<me>" for Forgejo, Gitea or Codeberg). Caldera then builds the city from my public repos itself.
2. For private repos too (never named), the setup prompt's routine can write Caldera/city.json with the gh CLI - paste the full Caldera setup prompt for that.
3. Choose how private repos show on my PUBLIC city: set privateRepos in "${vault}/Caldera/profile.md" to show (padlocked buildings in place: no names, but size, activity and the project they sit beside are visible), anonymous (one separate padlocked district, no sizes, activity or projects) or hidden (no trace). Ask me which I want; my private view always shows everything.`;
}

/** A short "upgrade my page" prompt for existing users: only the features still missing. */
export function upgradePrompt(missing: (UnlockId | "email" | "groups")[], o: FeaturePromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  if (!missing.length) return `My Caldera page (${hub}/@${o.handle || "<my handle>"}/) already has every feature turned on. Nothing to do.`;
  const parts = missing.map((id, n) => `### ${n + 1}. ${id === "email" ? "Daily summary email" : id === "groups" ? "Groups" : UNLOCK.find(u => u.id === id)!.label}\n${featurePrompt(id, o).split("\n\nRules:")[0].split("\n\n").slice(1).join("\n\n") || featurePrompt(id, o)}`);
  return `Help me upgrade my Caldera page (${hub}/@${o.handle || "<my handle>"}/) with the features it doesn't use yet. Do them in order, ask me before each one, and skip any I say no to.${o.vaultPath ? `\nVault: ${o.vaultPath}` : ""}

${parts.join("\n\n")}

Rules:
${PRIVACY_RULES}
- Show me every change before you make it. Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key.`;
}
