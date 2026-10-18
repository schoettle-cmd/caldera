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
  extras?: string;         // plugin-only additions (the user's own agent-hook and live-traffic setup)
}

/** Bump when the routine asks for new data: the routine writes it into activity.json, and the plugin tells the
 * owner to copy the prompt again when theirs is older. */
export const PROMPT_VERSION = 2;

/** One privacy policy for every prompt. The plugin also enforces most of this in code (see privacy.ts). */
export const PRIVACY_RULES = `Everything public is on the open internet, can be copied forever, and can affect other people. Be very cautious. Never write any of these into anything public:
- Other people: no names, initials, handles, photos or descriptions that identify anyone I meet, work with, hire, date, advise or invest with. Say "a founder", "the team", "a friend" only when it adds nothing identifying - usually leave it out.
- Meetings: no meetings, calls, lunches, dinners, interviews or events - not their titles, times, dates, attendees, or that they happened with someone specific.
- Times and places: no times of day, schedules, travel, cities, venues, addresses, offices, home or "where I am".
- Secret or sensitive work: no unannounced, stealth, confidential or NDA projects, codenames, deals, fundraising, investors, acquisitions, valuations, hiring, firing or anything said in confidence.
- Things that can get someone in trouble: legal, medical, health, HR, money, salaries, debts, relationships, family, children, politics, religion.
- Proprietary methods: no trading strategies, signals, indicators, thresholds, regime or risk rules, entry/exit logic, win rates, model weights, prompts, data sources or other trade secrets - in the journal, the garden or anywhere public. Name the theme only ("worked on the trading system").
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

  const extras = o.extras ? `\n${o.extras.trim()}\n` : "";
  return `You are helping me run Caldera, the social layer for my Obsidian vault (${hub}). Caldera builds a public profile page from my vault; the more of my real activity it can count, the richer that page is. Follow these instructions exactly. (Caldera setup prompt v${PROMPT_VERSION})

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which. If there is none, I probably don't have Obsidian yet - many people don't - so start with step 0.)"}
My public page: ${page}

THIS PROMPT IS SAFE TO PASTE AGAIN. Every time I paste it (for example after a Caldera update), first take stock of what is already set up - scheduled jobs, "${activity}", "Caldera/city.json", "Caldera/profile.md", journal fields in my daily notes - then repair anything broken, upgrade it to these instructions, and only add what is missing. Never create a second scheduled job that does the same thing; update the existing one in place.

${install}
## 2. Connect every source of activity I have (this is what makes the page rich)
Check each source below on this computer and tell me which you can reach. Use the ones that work; for the ones that don't, say what it would take (for example "connect your calendar to me") and move on.
- Calendar: events I attended (a calendar connector, or a calendar app's local data).
- Email: emails I sent (a mail connector, or the mail app's local data).
- AI usage: Claude Code (~/.claude/projects/**/*.jsonl: assistant messages have message.model and message.usage; count each message.id once; tokens = input + output + cache read + cache write) and Codex (~/.codex/sessions/**/*.jsonl: event_msg token_count -> last_token_usage.total_tokens, model from turn_context). Prompts = user messages I typed in those sessions. Add other tools only if they keep local usage logs.
- Code: git commits I authored, in repositories on this computer, plus my code host if I use one: GitHub (the gh CLI or the GitHub API), or Forgejo / Gitea / Codeberg (the tea CLI or the /api/v1 REST API on that server, with my access token if I have one).
- Documents: files I produced or filed (for example new files in Documents/Downloads I saved, or attachments filed into the vault).
Then write a small script for the routine below that computes these counts with code (no AI call per run).

## 3. Routine (4 times per workday: 9am, 12pm, 3pm and 6pm my local time, Monday to Friday)
Schedule ONE job on my computer (cron, launchd, Task Scheduler, or your own scheduler) at those four times. Nothing overnight and nothing on weekends; Monday's first run catches up the weekend. Keep it light on AI tokens: compute counts with code that reads logs, not with an AI call; read a calendar connector at most once a day and cache the result; and never rewrite a journal entry that already exists.
A. Journal entry (first run of each workday only, for YESTERDAY; on Monday also Saturday and Sunday if they had activity; skip any day that already has caldera_headline). Open (or create) that day's daily note, named YYYY-MM-DD.md, wherever my daily notes live. Add these frontmatter properties, keeping everything already in the note:
   caldera_headline: one sentence, the shape of the day
   caldera_focus: 2-4 short items, what I worked on
   caldera_wins: 1-3 short items, what got done
   caldera_themes: 1-3 single words
   Write them from my notes, calendar, sent email, commits and AI sessions for that day - whatever you can access.
   Name my projects the way they appear in Caldera/profile.md "projects" when they come up: Caldera grows a garden page for each project (and each distinctive theme) from these journal lines, adding a dated entry whenever it comes up.

B. Activity counts (every run, for today and yesterday). Update "${vault}/${activity}" (create it if missing). Format:
   { "prompt_version": ${PROMPT_VERSION},
     "days": [ { "date": "YYYY-MM-DD", "meetings": 0, "emails": 0, "prompts": 0, "commits": 0, "docs": 0, "tokens": 0 } ],
     "ai": { "total": 0, "window_days": 45, "models": [["Claude Opus 5.5", 0]], "providers": [["Anthropic", 0]] },
     "code": { "commits": 0, "repos": 0, "languages": ["Python"], "weekly": [0], "url": "https://github.com/<me>", "start": "Mon YYYY" } }
   One object per date: replace that date's object if it exists, keep the last 60 days, and only include counts you can actually measure (omit the rest - never guess). meetings = calendar events attended, emails = emails I sent, prompts = AI prompts I sent, commits = git commits I authored, docs = documents/attachments I produced or filed, tokens = AI tokens processed for me that day. Notes are counted by the plugin itself. Always write "prompt_version": ${PROMPT_VERSION} - Caldera uses it to tell me when this routine is out of date.
   AI usage ("tokens" per day and the "ai" block, last 45 days): group by model (readable names) and by provider. Never include prompts, file names or costs.
   Code ("code" block): count my commits in the last 52 weeks per week across my repositories, number of repos, and top 4 languages. Counts only - never names of private repositories.

C. City (every run, only if I use GitHub, Forgejo, Gitea or Codeberg). Keep "${vault}/Caldera/city.json" fresh: {"generated": "<ISO time>", "source": "github <my login>" (or "forgejo <https://server/my login>"), "repos": [{"name", "project", "public", "language", "commits", "weeks", "week", "today", "pushed", "url", "description"}]} with one row per repo I own (private ones too, if the gh CLI is signed in): project = which of my projects it belongs to (group repos into districts; ask me once how to group them), public = true only for public repos, commits = commits in the last 52 weeks, weeks = the last 12 weekly commit counts, week = commits in the last 7 days, today = commits today, pushed = last push time, url and description only for public repos. On GitHub use gh api user/repos and repos/<owner>/<repo>/stats/commit_activity. On Forgejo / Gitea / Codeberg use GET /api/v1/user/repos (or /api/v1/users/<me>/repos) and page through /api/v1/repos/<owner>/<repo>/commits?limit=50, counting by commit.author.date yourself (that endpoint ignores "since"). Caldera turns it into a little city on my page: districts are projects, buildings are repos. Visitors see public repos, and private ones only as locked glass buildings (no names); full details only in my own Private view. If you cannot reach the API, instead make sure my profile is a line in "links" in Caldera/profile.md ("GitHub | https://github.com/<me>", or "Forgejo | https://<server>/<me>" for Forgejo, Gitea or Codeberg) - Caldera then builds the city from my public repos itself. With no code host at all, Caldera builds the city from my vault folders.

D. Publish. If Caldera auto-publish is on (Settings -> Caldera -> Auto-publish every N hours), you are done. Otherwise ask me to run "Caldera: Publish my profile" from the command palette.

After setting up the job, run it once now, then backfill: for each of the last 14 days that has activity, add the journal fields from A to that day's daily note. Show me the 14 entries before writing them.

## 4. Make the page rich (once; on a re-paste, only fill what is still empty)
Anything that would become PUBLIC needs my explicit yes first: show me exactly what you propose, wait for my answer, then make only the approved changes.
1. Page text, in "${vault}/Caldera/profile.md": "headline" (one line), "summary" (2 sentences, links as [[Label|https://...]]), "now" (3 lines on what I'm doing now), "timeline" (only things already public: "Year | milestone | one-line detail", grouped into chapters with "era | Name | 2015-2020" lines), "projects" (Name | status | https://link, only public projects) and "links" (Label | https://url - include my GitHub profile if I have one: that turns on the Code section and the city). Offer to set a profile photo: save an image I choose into "Caldera/img/" and set "photo" to that path. Optional: offer a masthead (the wide cover image across the top of the page, about 3:1 such as 1800x600, under 2 MB): an image I choose or a free-to-use one I approve, saved into "Caldera/img/" with "banner" set to its path. Also suggest "sidebar" groups (Group | item, item), up to 14 "graph" note names (people/companies/projects I'm comfortable showing - the page shows how many notes link to each), and 6 "backlinks" (Title | short context).
2. My garden (public notes). Find 3-8 notes that would be good to grow in public: evergreen essays, how-tos, reading notes, overviews of work that is already public. Skip anything about people, clients, deals, money, health, family or unannounced work. List them with one line each on why, and a suggested stage (seedling = rough, budding = taking shape, evergreen = worked through). After I approve, add to the frontmatter of the approved notes only: "caldera: garden", "stage: <stage>" and "license: all-rights" (ask me if I want "cc-by" instead). The WHOLE note becomes a public page, so read every line and point out anything private first.
3. Notes friends can receive. Suggest notes I might want to share with friends as encrypted cards (frameworks, checklists, templates). After I approve, add "caldera: friends" to their frontmatter.
4. Public topics. List my 10 most-used tags that are safe to show publicly (no client, company or people tags), with a short label for each. I add them myself in Settings -> Caldera -> Public topics. Do not edit plugin settings.
5. Asks and offers. Draft 2 asks ("I could use help with...") and 2 offers ("I can help with...") that fit what I work on. I post the ones I like with "Caldera: Post an ask" / "Caldera: Post an offer".
6. Goals. If "${vault}/Caldera/Goals.md" doesn't exist, offer to create it with my current goals (checkboxes under ## headings). It stays private: it powers the goals section only I see.

## 5. Live city extras (ask me first for each)
- Websites: if I run websites for my projects, offer to add each project's live-traffic snippet (Caldera settings > "Live traffic on your city") to that site's pages, so visits ride through my city in real time.
- AI agents: offer to install the Caldera agent hook (Caldera settings > "AI agents on your city"), so my coding agents appear in the city as drones over the repo they're working in.${extras}

## 6. Privacy rules (these override everything above)
${PRIVACY_RULES}
Themes and topics: only use topics among ${topics}.
Also: never write to any other part of the vault, never change notes' privacy markings (caldera: public / garden / friends / private) without asking, never move notes into or out of the Garden folder, never touch .obsidian/plugins/caldera/data.json - it holds my private key.

## 7. Report
When you finish, show me a short checklist of every source and feature - calendar, email, AI usage, code, documents, journal, city, page text, garden, live traffic, agents - marked connected, skipped (and why) or needs me. After each scheduled run, the job only needs to log what it wrote. Then tell me to run "Caldera: Preview my public profile", check it, and publish.

## 8. Later
- Changing my page: name, headline, photo, banner, links, properties, topics, which sections show and whether I'm listed live in the frontmatter of "${vault}/Caldera/profile.md". Edit it (same privacy rules) and the page republishes within about a minute. Guide: ${hub}/guide.html
- My garden home: ${hub}/@<my handle>/garden.html shows live my notes, links from other gardens, gravity (goodwill friends give), help credits (100 to start; ask bounties are held until awarded, returned after 30 days, no cash value), my open asks and offers, friends and weekly rank.
- My profile inside Obsidian: the ribbon icon "My Caldera profile" opens my page as a tab. "Private view" adds private sections only I see (visits, today, on this day, patterns, goals, and a checklist of which sources are connected); "Public view" shows the page as visitors see it.
- When Caldera tells me my setup prompt is out of date, I copy it again ("Caldera: Copy the AI setup prompt") and paste it here; you upgrade the routine in place.`;
}

/** Older name for the same prompt: "make my profile richer" is now part of the one setup prompt (safe to re-paste). */
export function richerPrompt(o: AgentPromptOptions = {}): string { return agentPrompt({ ...o, installed: true }); }

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
