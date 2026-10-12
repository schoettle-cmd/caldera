/**
 * The copy-paste prompt that hands Caldera to an AI agent (Claude Code, Codex, Cursor, an OpenClaw/MCP agent ...):
 * install the plugin, then run a public-safe daily routine that writes the journal and activity counts.
 * Single source for the landing page block and the plugin's "Copy AI agent setup prompt" command.
 */
export interface AgentPromptOptions {
  vaultPath?: string;      // absolute path, when known (the plugin fills it in)
  hubUrl?: string;
  handle?: string;
  activityFile?: string;
  publicTopics?: string[]; // tag names the user has allow-listed
  installed?: boolean;     // true when generated from inside the plugin (skip install steps)
  zipUrl?: string;
}

/** One privacy policy for every prompt. The plugin also enforces most of this in code (see privacy.ts). */
export const PRIVACY_RULES = `Everything public is on the open internet, can be copied forever, and can affect other people. Be very cautious. Never write any of these into anything public:
- Other people: no names, initials, handles, photos or descriptions that identify anyone I meet, work with, hire, date, advise or invest with. Say "a founder", "the team", "a friend" only when it adds nothing identifying - usually leave it out.
- Meetings: no meetings, calls, lunches, dinners, interviews or events - not their titles, times, dates, attendees, or that they happened with someone specific.
- Times and places: no times of day, schedules, travel, cities, venues, addresses, offices, home or "where I am".
- Secret or sensitive work: no unannounced, stealth, confidential or NDA projects, codenames, deals, fundraising, investors, acquisitions, valuations, hiring, firing or anything said in confidence.
- Things that can get someone in trouble: legal, medical, health, HR, money, salaries, debts, relationships, family, children, politics, religion.
- Contact details and links: no emails, phone numbers or links to private documents. No money amounts at all.
Describe work only by its public theme ("shipped a release", "wrote about design") and only name things I have already made public on my page (my own public projects, topics and links). If you are unsure, leave it out - an empty field is fine. Caldera also drops any journal line that looks sensitive before publishing.`;

export function agentPrompt(o: AgentPromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const activity = o.activityFile || "Caldera/activity.json";
  const zip = o.zipUrl || hub + "/download/caldera-latest.zip";
  const topics = o.publicTopics?.length ? o.publicTopics.map(t => "#" + t).join(", ") : "the tags I allow-listed in Settings -> Caldera -> Public topics";
  const page = o.handle ? `${hub}/@${o.handle}/` : `${hub}/@<my handle>/`;

  const plugin = `1. Download ${zip} and unzip it into "<vault>/.obsidian/plugins/caldera/" so that folder contains main.js, manifest.json and styles.css (create the folders if needed).
2. Add "caldera" to the JSON array in "<vault>/.obsidian/community-plugins.json" (create the file as ["caldera"] if it does not exist). Do not remove other entries.`;
  const welcome = `Caldera opens a Welcome window where I type my name and pick a handle; it creates my identity on this device, publishes my profile and opens it in my browser. Do NOT create the identity, read the plugin's data.json, or handle my keys yourself - that file holds my private key. Wait until I tell you my profile is live, then continue with step 2.`;

  const install = o.installed ? `## 1. Install
Caldera is already installed and enabled in this vault. Skip to step 2.
` : `## 0. Obsidian itself (if I'm new - many people are - this step sets everything up; skip it only if I already use Obsidian)
1. Check whether Obsidian is installed (macOS: /Applications/Obsidian.app or ~/Applications/Obsidian.app; Windows: %LOCALAPPDATA%\\Programs\\Obsidian\\Obsidian.exe; Linux: the obsidian command, Flatpak md.obsidian.Obsidian, or an Obsidian AppImage).
2. If it is not installed, tell me you are about to install Obsidian (the free official app from https://obsidian.md), then install it:
   - macOS: brew install --cask obsidian  (no Homebrew? download https://obsidian.md/download , open the .dmg and copy Obsidian.app into /Applications)
   - Windows: winget install --id Obsidian.Obsidian -e  (or run the installer from https://obsidian.md/download)
   - Linux: flatpak install -y flathub md.obsidian.Obsidian  (or the AppImage / .deb from https://obsidian.md/download)
   If you cannot install software here, give me the download link and wait until I tell you it's installed. Do not open Obsidian yet.
3. If I don't have a vault yet, make one for me, completely, BEFORE Obsidian opens it:
   a. Ask where I'd like my notes; if I don't care, use ~/Documents/Notes (Windows: %USERPROFILE%\\Documents\\Notes). Create the folder, a "Welcome.md" note in it ("# Welcome" and one line saying this is my vault), and an empty ".obsidian" folder inside it. That folder is now my vault; use its absolute path below.
   b. Install the plugin into it now (exactly as in step 1 below), so it is ready on first launch.
   c. Make Obsidian quit if it is running (it rewrites its vault list on exit). Then register the vault in Obsidian's vault list, a JSON file at:
      macOS ~/Library/Application Support/obsidian/obsidian.json - Windows %APPDATA%\\obsidian\\obsidian.json - Linux ~/.config/obsidian/obsidian.json (Flatpak: ~/.var/app/md.obsidian.Obsidian/config/obsidian/obsidian.json).
      Create the folder and file if missing. The file looks like {"vaults":{"<id>":{"path":"<absolute vault path>","ts":<now in ms>,"open":true}}}. Add my vault under a new random 16-character lowercase hex id, keep every other key and vault already in the file, and write valid JSON.
   d. Open it: macOS  open "obsidian://open?path=<url-encoded absolute vault path>"  - Windows  start "" "obsidian://open?path=..."  - Linux  xdg-open "obsidian://open?path=..." . If Obsidian instead shows its vault picker, tell me to click "Open folder as vault" and choose that folder.
   e. Tell me, in plain words: in Obsidian, open Settings (the gear, bottom left) -> Community plugins -> click "Turn on community plugins". (If Obsidian shows a "Trust author and enable plugins" prompt instead, click that.) Caldera is already switched on, so its Welcome window appears right away. ${welcome}
   Steps a-e replace step 1 - after e, go straight to step 2.

## 1. Install the plugin (when I already have a vault)
${plugin.replace(/<vault>/g, vault)}
3. Tell me to restart Obsidian (quit fully, then open it). If Obsidian asks, I turn off Restricted mode (Settings -> Community plugins -> Turn on community plugins) and make sure Caldera is switched on. ${welcome}
`;

  return `You are helping me run Caldera, the social layer for my Obsidian vault (${hub}). Caldera builds a public profile page from my vault. Follow these instructions exactly.

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which. If there is none, I probably don't have Obsidian yet - many people don't - so start with step 0.)"}
My public page: ${page}

${install}
## 2. Daily routine (run once a day, in the morning, for YESTERDAY's date; I will schedule you)
A. Journal entry. Open (or create) yesterday's daily note, named YYYY-MM-DD.md, wherever my daily notes live. Add these frontmatter properties, keeping everything already in the note:
   caldera_headline: one sentence, the shape of the day
   caldera_focus: 2-4 short items, what I worked on
   caldera_wins: 1-3 short items, what got done
   caldera_themes: 1-3 single words
   Write them from my notes, calendar, sent email, commits and AI sessions for that day - whatever you can access.

B. Activity counts. Update "${vault}/${activity}" (create it if missing). Format:
   { "days": [ { "date": "YYYY-MM-DD", "meetings": 0, "emails": 0, "prompts": 0, "commits": 0, "docs": 0, "tokens": 0 } ],
     "ai": { "total": 0, "window_days": 45, "models": [["Claude Opus 5.5", 0]], "providers": [["Anthropic", 0]] },
     "code": { "commits": 0, "repos": 0, "languages": ["Python"], "weekly": [0], "url": "https://github.com/<me>", "start": "Mon YYYY" } }
   One object per date: replace that date's object if it exists, keep the last 60 days, and only include counts you can actually measure (omit the rest - never guess). meetings = calendar events attended, emails = emails I sent, prompts = AI prompts I sent, commits = git commits I authored, docs = documents/attachments I produced or filed, tokens = AI tokens processed for me that day. Notes are counted by the plugin itself.
   AI usage ("tokens" per day and the "ai" block, last 45 days): read the usage logs of the AI tools on this computer - Claude Code (~/.claude/projects/**/*.jsonl: assistant messages have message.model and message.usage; count each message.id once; tokens = input + output + cache read + cache write) and Codex (~/.codex/sessions/**/*.jsonl: event_msg token_count -> last_token_usage.total_tokens, model from turn_context). Add other tools only if they keep local usage logs. Group by model (readable names) and by provider. Never include prompts, file names or costs.
   Code ("code" block, optional): if I use GitHub, count my commits in the last 52 weeks per week across my repositories (the gh CLI or the GitHub API), number of repos, and top 4 languages. Counts only - never repository names that are private.

C. Publish. If Caldera auto-publish is on (Settings -> Caldera -> Auto-publish every N hours), you are done. Otherwise ask me to run "Caldera: Publish my profile" from the command palette.

## 3. Privacy rules (these override everything above)
${PRIVACY_RULES}
Themes and topics: only use topics among ${topics}.
Also: never write to any other part of the vault, never change notes' privacy markings (caldera: public / friends), never touch .obsidian/plugins/caldera/data.json.

## 4. Check your work
After each run, tell me in two lines what you wrote for that day, and anything you skipped because it looked private.

## 5. When I ask you to change my page
My name, headline, photo, banner, links, properties, topics, which sections show and whether I'm listed in the directory all live in the frontmatter of "${vault}/Caldera/profile.md". Edit that file (keep its format; the same privacy rules apply) and the page republishes itself within about a minute. Guide: ${hub}/guide.html`;
}

/** Second copy-paste prompt: an agent session that makes an existing profile richer, with the user approving anything that becomes public. */
export function richerPrompt(o: AgentPromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const activity = o.activityFile || "Caldera/activity.json";
  return `Help me make my Caldera profile richer. Caldera (${hub}) builds a public profile page from my Obsidian vault.

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which.)"}

Work through these one at a time. Anything that would become PUBLIC needs my explicit yes first: show me exactly what you propose, wait for my answer, then make only the approved changes.

1. Public notes. Find 3-8 notes that would be good to show publicly: evergreen essays, how-tos, reading notes, overviews of work that is already public. Skip anything about people, clients, deals, money, health, family or unannounced work. List them with one line each on why. After I approve, add "caldera: public" to the frontmatter of the approved notes only. The page shows each note's title and first paragraph, so check that first paragraph too.

2. Notes friends can receive. Suggest notes I might want to share with friends as encrypted cards (frameworks, checklists, templates). After I approve, add "caldera: friends" to their frontmatter. These are not public; only friends I pick receive them.

3. Public topics. List my 10 most-used tags that are safe to show publicly (no client, company or people tags), with a short label for each. I will add them myself in Settings -> Caldera -> Public topics. Do not edit plugin settings.

4. Activity sources. Set up a daily scheduled job (cron, launchd, Task Scheduler, or your own scheduler) that writes COUNTS ONLY for yesterday into "${vault}/${activity}" in this format, replacing that date's entry and keeping 60 days:
   { "days": [ { "date": "YYYY-MM-DD", "meetings": 0, "emails": 0, "prompts": 0, "commits": 0, "docs": 0 } ] }
   Use the sources I actually have: calendar events attended, emails I sent, AI prompts I sent, git commits I authored, documents I produced. Only numbers - never titles, subjects, names or contents. Tell me which sources you connected and which you could not. If a daily journal routine already writes this file, extend it instead of adding a second writer.

5. My page text. Draft, for Caldera/profile.md: "headline" (one line), "summary" (2 sentences, links as [[Label|https://...]]), "now" (3 lines on what I'm doing now), "timeline" (only things already public: "Year | milestone | one-line detail", grouped into chapters with "era | Name | 2015-2020" lines), "projects" (Name | status | https://link, only public projects) and "links" (Label | https://url - include my GitHub profile if I have one: that turns on the Code section). Offer to set a profile photo: save an image I choose into "Caldera/img/" and set "photo" to that path. Also suggest "sidebar" groups (Group | item, item), up to 14 "graph" note names (people/companies/projects I'm comfortable showing - the page shows how many notes link to each), and 6 "backlinks" (Title | short context). Show me everything first; write only what I approve.

6. Daily journal. If nothing writes my journal yet, extend the daily job from step 4 so that each morning it also opens yesterday's daily note (YYYY-MM-DD.md) and adds caldera_headline (one line), caldera_focus (up to 3), caldera_wins (up to 3) and caldera_themes (1-3 words), written from what I did that day, following the privacy rules below. Then backfill: For each of the last 14 days that has activity, add caldera_headline, caldera_focus, caldera_wins and caldera_themes to that day's daily note (YYYY-MM-DD.md), following the privacy rules below. Show me the 14 entries before writing them.

7. Asks and offers. Draft 2 asks ("I could use help with...") and 2 offers ("I can help with...") that fit what I work on. I will post the ones I like with the commands "Caldera: Post an ask" and "Caldera: Post an offer".

8. Finish. Tell me to run "Caldera: Preview my public profile", check it, then "Caldera: Publish my profile".

Privacy rules (these override everything above):
${PRIVACY_RULES}
- Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key.
- Never remove or change an existing "caldera:" marking without asking me.`;
}

/** Third copy-paste prompt: ask an agent to change something on an existing profile. */
export function editPrompt(o: AgentPromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  return `Help me change my Caldera profile (${hub}/@${o.handle || "<my handle>"}/). Caldera builds that public page from my Obsidian vault.

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which.)"}

Where things live:
- Name, headline, photo, banner, links, properties, topics, which sections show, and directory listing: the frontmatter of "Caldera/profile.md". Keep its format. Photo and banner are paths to images inside the vault.
- A note on my page: add "caldera: public" to that note's frontmatter (title and first paragraph are shown). Remove it to take the note down.
- My daily journal: caldera_headline / caldera_focus / caldera_wins / caldera_themes in daily notes named YYYY-MM-DD.md.
- Activity counts: "Caldera/activity.json".
The page republishes automatically about a minute after Caldera/profile.md changes. For anything else, tell me to run "Caldera: Publish my profile".

Rules:
- Show me the exact change before you make it, and only make what I approve.
${PRIVACY_RULES}
- Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key. My handle can only be changed in Settings -> Caldera.

What I want to change: <DESCRIBE THE CHANGE>`;
}
