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

export function agentPrompt(o: AgentPromptOptions = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, "");
  const vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const activity = o.activityFile || "Caldera/activity.json";
  const zip = o.zipUrl || hub + "/download/caldera-0.1.0.zip";
  const topics = o.publicTopics?.length ? o.publicTopics.map(t => "#" + t).join(", ") : "the tags I allow-listed in Settings -> Caldera -> Public topics";
  const page = o.handle ? `${hub}/@${o.handle}/` : `${hub}/@<my handle>/`;

  const install = o.installed ? `## 1. Install
Caldera is already installed and enabled in this vault. Skip to step 2.
` : `## 1. Install the plugin
1. Download ${zip} and unzip it into "${vault}/.obsidian/plugins/caldera/" so that folder contains main.js, manifest.json and styles.css.
2. Add "caldera" to the JSON array in "${vault}/.obsidian/community-plugins.json" (create the file as ["caldera"] if it does not exist). Do not remove other entries.
3. Tell me to restart Obsidian. If Obsidian asks, I turn off Restricted mode (Settings -> Community plugins -> Turn on community plugins) and make sure Caldera is switched on. Then I open Settings -> Caldera, click "Create identity", export the recovery key, pick a handle, and choose which sections are public. Do NOT create the identity, read the plugin's data.json, or handle my keys yourself - that file holds my private key.
`;

  return `You are helping me run Caldera, the social layer for my Obsidian vault (${hub}). Caldera builds a public profile page from my vault. Follow these instructions exactly.

Vault: ${vault}${o.vaultPath ? "" : "\n(If I did not fill this in, find my vault yourself: it is the folder that contains a .obsidian folder. If there is more than one, ask me which.)"}
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
   { "days": [ { "date": "YYYY-MM-DD", "meetings": 0, "emails": 0, "prompts": 0, "commits": 0, "docs": 0 } ] }
   One object per date: replace that date's object if it exists, keep the last 60 days, and only include counts you can actually measure (omit the rest - never guess). meetings = calendar events attended, emails = emails I sent, prompts = AI prompts I sent, commits = git commits I authored, docs = documents/attachments I produced or filed. Notes are counted by the plugin itself.

C. Publish. If Caldera auto-publish is on (Settings -> Caldera -> Auto-publish every N hours), you are done. Otherwise ask me to run "Caldera: Publish my profile" from the command palette.

## 3. Privacy rules (these override everything above)
Everything you write in the caldera_* fields and in ${activity} is PUBLIC on the internet. So:
- No names of people, companies, clients, investors, deals, or products that are not already public on my page.
- No money amounts, prices, valuations, metrics, health, legal, family, location or travel details.
- No email addresses, phone numbers, URLs to private docs, or anything copied from email bodies.
- Describe work by its public theme instead ("closed out a design review", "shipped a release"), and only use topics among ${topics}.
- If you are unsure whether something is private, leave it out. An empty field is fine.
- Never write to any other part of the vault, never change notes' privacy markings (caldera: public / friends), never touch .obsidian/plugins/caldera/data.json.

## 4. Check your work
After each run, tell me in two lines what you wrote for that day, and anything you skipped because it looked private.`;
}
