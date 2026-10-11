// Content for the search / AI-answer pages on caldera.social. One entry = one page at /<slug>.
// Rules: answer the question in the first paragraph, keep claims about other tools general and current-safe,
// every page ends in an FAQ (rendered + FAQPage JSON-LD). Edit here, then: node scripts/build-seo.mjs
export const UPDATED = "2026-10-11";

export const pages = [
  {
    slug: "what-is-caldera",
    title: "What is Caldera? The social layer for Obsidian",
    description: "Caldera is a free, open-source Obsidian plugin that turns your vault into a living public profile and lets vaults befriend each other, share encrypted notes and help each other.",
    h1: "What is Caldera?",
    answer: "Caldera is a free, open-source plugin for Obsidian that turns your notes vault into a living public profile page and connects vaults to each other. Your page updates itself from your notes (a daily journal, activity, topics, projects and the notes you choose to share), and friends can share notes as end-to-end encrypted cards, post asks and offers for help, and give positive-only \"gravity\". It is private by default: nothing leaves your vault unless you switch it on.",
    sections: [
      { h2: "What Caldera does", html: `<ul>
<li><b>Living profile.</b> A public page at caldera.social/@you, built on your own device from your vault and republished automatically.</li>
<li><b>Friends between vaults.</b> Add friends by handle. Share any note as an end-to-end encrypted card that lands in their vault as a normal note.</li>
<li><b>Help exchange.</b> Post asks ("I could use help with...") and offers, with optional help-credit bounties. Credits have no cash value.</li>
<li><b>Gravity.</b> Positive-only recognition that fades over a month. No likes, downvotes or follower counts.</li>
<li><b>AI-native setup.</b> One copy-paste prompt lets Claude Code, Codex or Cursor install it and run a daily journal routine.</li>
</ul>` },
      { h2: "Who makes it", html: `<p>Caldera is built by mjonesone, LLC. The plugin and core library are MIT-licensed, the reference hub is AGPL-3.0 and self-hostable, and the protocol is open. Source: <a href="https://github.com/schoettle-cmd/caldera">github.com/schoettle-cmd/caldera</a>.</p>` },
      { h2: "How private is it?", html: `<p>The plugin reads your vault locally and never uploads it. Only counts, the profile sections you switch on, notes you mark <code>caldera: public</code>, and journal fields you write are published. Shared notes are end-to-end encrypted; the hub stores ciphertext it cannot read. Your identity is a key in your vault, not a password account.</p>` },
    ],
    faq: [
      ["Is Caldera free?", "Yes. The plugin, your profile and friends are free and open source."],
      ["Does Caldera need Obsidian?", "Yes, it is an Obsidian plugin. Obsidian is free; the Caldera install prompt can install Obsidian for you and create your first vault."],
      ["Is Caldera an official Obsidian product?", "No. Caldera is an independent, open-source community plugin made by mjonesone, LLC."],
    ],
    related: ["obsidian-public-profile", "obsidian-social-network", "share-obsidian-notes-privately"],
  },
  {
    slug: "obsidian-public-profile",
    title: "How to make a public profile from your Obsidian vault",
    description: "Turn your Obsidian notes into a public profile page that updates itself: journal, activity, topics and the notes you choose. Free with the open-source Caldera plugin.",
    h1: "How to make a public profile from your Obsidian vault",
    answer: "The fastest way to turn an Obsidian vault into a public profile page is the free Caldera plugin: install it (or paste one prompt into Claude Code, Codex or Cursor and let the AI install it), type your name and a handle in the Welcome window, and your page goes live at caldera.social/@yourhandle. It rebuilds itself from your vault, publishing only counts and the notes and sections you switch on.",
    sections: [
      { h2: "Steps", html: `<ol>
<li>Install Obsidian if you don't have it (free at <a href="https://obsidian.md">obsidian.md</a>).</li>
<li>Copy the setup prompt from <a href="/#install">caldera.social/#install</a> into your AI agent, or install the plugin by hand from the latest release.</li>
<li>Open Obsidian. The <b>Welcome to Caldera</b> window asks for your name and a handle, creates your identity on your device, publishes your page and opens it in your browser.</li>
<li>Edit the note <code>Caldera/profile.md</code> to change your headline, photo, links, projects and which sections show. The page republishes about a minute after you save.</li>
</ol>` },
      { h2: "What can be on the page", html: `<p>A flippable daily journal, an activity score and 26-week heatmap, a growth chart, your public topics, projects, a timeline, links, AI usage charts, and any note you mark <code>caldera: public</code> (title and first paragraph). Every section has an on/off switch. See a full example: <a href="/@mike/">caldera.social/@mike</a>.</p>` },
      { h2: "What stays private", html: `<p>Note contents stay on your computer unless you mark a note public. Topics are allow-listed, so only tags you approve are counted, and the plugin publishes counts rather than titles. You can preview before publishing and delete your page with one command.</p>` },
    ],
    faq: [
      ["Can I use my own domain?", "You can export your profile as a static site and host it anywhere, or run your own Caldera hub."],
      ["Does it update automatically?", "Yes. It republishes every few hours and about a minute after you edit Caldera/profile.md."],
      ["Do I need to code?", "No. Paste one prompt into an AI agent, or install the plugin by hand and use the Welcome window."],
    ],
    related: ["obsidian-publish-alternatives", "obsidian-activity-tracker", "obsidian-daily-journal-ai"],
  },
  {
    slug: "share-obsidian-notes-privately",
    title: "How to share Obsidian notes privately (end-to-end encrypted)",
    description: "Share individual Obsidian notes with specific friends, end-to-end encrypted, so they land in their vault as normal notes. No shared folders or public links.",
    h1: "How to share Obsidian notes privately with friends",
    answer: "To share a single Obsidian note privately, use the free Caldera plugin: add a friend by their handle, open the note and run \"Caldera: Share this note with a friend\". The note is encrypted on your device so only that friend can read it, and it arrives in their vault as a normal Markdown note under Caldera/Inbox. Nothing is posted publicly and the server only stores ciphertext.",
    sections: [
      { h2: "How it works", html: `<ol>
<li>Both of you install Caldera and pick a handle.</li>
<li>Send a friend request from the Caldera panel (the flame icon); your friend accepts it.</li>
<li>On any note, run <b>Share this note with a friend</b> from the command palette.</li>
<li>Your friend's vault receives the note on its next sync, in <code>Caldera/Inbox/your-handle/</code>.</li>
</ol>` },
      { h2: "Other ways to share Obsidian notes", html: `<ul>
<li><b>Obsidian Sync shared vaults</b> (paid): share a whole vault with collaborators.</li>
<li><b>Obsidian Publish</b> (paid) or static-site tools: public pages, not private sharing.</li>
<li><b>Collaboration plugins</b>: shared folders edited live by a team.</li>
<li><b>Caldera</b> (free): one note at a time to one friend, end-to-end encrypted, landing in their own vault.</li>
</ul>` },
    ],
    faq: [
      ["Can the server read shared notes?", "No. Notes are encrypted on your device with your friend's public key; the hub stores ciphertext only."],
      ["Does my friend need Obsidian?", "Yes, shared notes are delivered into an Obsidian vault with Caldera installed."],
      ["Can I unshare a note?", "A delivered note is a copy in your friend's vault, like an email. You can stop sharing future versions."],
    ],
    related: ["obsidian-social-network", "what-is-caldera", "obsidian-public-profile"],
  },
  {
    slug: "obsidian-social-network",
    title: "Is there a social network for Obsidian users?",
    description: "Caldera is an open-source social layer for Obsidian: living profiles, friends between vaults, encrypted shared notes, a help exchange and a People directory.",
    h1: "Is there a social network for Obsidian users?",
    answer: "Yes. Caldera is an open-source social layer built for Obsidian: every member gets a living profile generated from their vault, vaults can befriend each other and share end-to-end encrypted notes, people post asks and offers for help, and a People directory at caldera.social/people lets you browse profiles by what people work on. There are no likes or follower counts; recognition is a positive-only score called gravity.",
    sections: [
      { h2: "How it differs from a normal social network", html: `<ul>
<li><b>Your vault is the source.</b> Profiles are built from your own notes on your own device, not typed into a website.</li>
<li><b>Private by default.</b> Only the sections and notes you switch on are published.</li>
<li><b>Open protocol.</b> Identity is a key in your vault; the hub is open source and self-hostable.</li>
<li><b>Built for helping.</b> Asks, offers and help credits instead of feeds and engagement.</li>
</ul>` },
      { h2: "Where Obsidian users talk today", html: `<p>The official Obsidian forum and Discord, and the r/ObsidianMD subreddit, are where the community discusses the app. Caldera complements them: it is about connecting vaults and showing your work, not discussion threads.</p>` },
    ],
    faq: [
      ["How do I find other Obsidian users on Caldera?", "Browse caldera.social/people and search by name, headline or topic."],
      ["Can I stay unlisted?", "Yes. Turn off \"List me in the directory\" and your page works only for people with the link."],
      ["How do I invite friends?", "Use \"Invite a friend\" on your page's leaderboard, or share caldera.social/?invite=yourhandle."],
    ],
    related: ["what-is-caldera", "share-obsidian-notes-privately", "obsidian-activity-tracker"],
  },
  {
    slug: "obsidian-publish-alternatives",
    title: "Free Obsidian Publish alternatives (2026 comparison)",
    description: "Compare ways to put your Obsidian notes online: Obsidian Publish, Quartz, Digital Garden-style plugins and Caldera's living profile. What each is best for.",
    h1: "Free alternatives to Obsidian Publish",
    answer: "Obsidian Publish is the official paid way to put a vault online as a website. Popular free alternatives are Quartz (an open-source static-site generator for publishing many notes), digital-garden style community plugins that publish selected notes to hosts like Netlify or Vercel, and Caldera, which publishes a living profile page about you and your work rather than your notes themselves. Pick by goal: a full notes website, a curated garden, or a profile that updates itself.",
    sections: [
      { h2: "Comparison", html: `<div class="table-wrap"><table class="data">
<thead><tr><th>Option</th><th>Cost</th><th>Best for</th><th>Setup</th></tr></thead>
<tbody>
<tr><td>Obsidian Publish</td><td>Paid add-on (see obsidian.md for current pricing)</td><td>An official, hosted website of your notes</td><td>Built into Obsidian</td></tr>
<tr><td>Quartz</td><td>Free, open source</td><td>A full static site of many notes, self-hosted</td><td>Command line + a static host</td></tr>
<tr><td>Digital-garden plugins</td><td>Free (hosting tier dependent)</td><td>Publishing selected notes as a garden</td><td>Plugin + Netlify/Vercel account</td></tr>
<tr><td>Caldera</td><td>Free, open source</td><td>A living profile: journal, activity, projects, chosen notes, plus friends and private sharing</td><td>One prompt or the plugin; hosted at caldera.social or self-hosted</td></tr>
</tbody></table></div>` },
      { h2: "When Caldera is the right choice", html: `<p>Choose Caldera if you want a page that shows what you're working on and updates itself, while your actual notes stay private, and if you want to connect with other Obsidian users. If you want to publish hundreds of notes as a browsable website, use Obsidian Publish or Quartz; Caldera can link to it.</p>` },
    ],
    faq: [
      ["Can I use Caldera and Quartz together?", "Yes. Many people publish a notes site with Quartz or Publish and use Caldera for their profile, linking the two."],
      ["Does Caldera publish my whole vault?", "No. It publishes counts, sections you turn on, and only notes marked caldera: public (title and first paragraph)."],
      ["Is there a hosting cost?", "Profiles on caldera.social are free. Self-hosting the open-source hub is also possible."],
    ],
    related: ["obsidian-public-profile", "what-is-caldera", "share-obsidian-notes-privately"],
  },
  {
    slug: "obsidian-ai-agent-setup",
    title: "Use Claude Code, Codex or Cursor with your Obsidian vault",
    description: "Let an AI agent set up and maintain your Obsidian vault: install plugins, write a daily journal, track activity, and keep private data private. Copy-paste prompts included.",
    h1: "Using Claude Code, Codex or Cursor with Obsidian",
    answer: "Because an Obsidian vault is just a folder of Markdown files, AI coding agents like Claude Code, OpenAI Codex and Cursor can work in it directly: install plugins, edit notes, and run daily routines. Caldera ships copy-paste prompts built for this: one installs Obsidian (if needed) and the Caldera plugin, then has the agent write your daily journal and activity counts each morning under strict privacy rules, and never lets it touch your identity key.",
    sections: [
      { h2: "The three Caldera prompts", html: `<ul>
<li><b>Setup</b> (<a href="/#install">caldera.social/#install</a>): install Obsidian and Caldera, then a daily journal + activity routine.</li>
<li><b>Make it richer</b> (<a href="/#richer">caldera.social/#richer</a>): suggests public notes, topics, activity sources and a 14-day journal backfill, asking before anything goes public.</li>
<li><b>Change my profile</b> (<a href="/guide#ai">caldera.social/guide</a>): describe a change in plain English; the agent edits Caldera/profile.md and the page republishes.</li>
</ul>` },
      { h2: "Safety rules built into the prompts", html: `<ul>
<li>Privacy rules override everything: no names, clients, money, health, family or locations on public pages.</li>
<li>Anything that would become public needs your explicit yes.</li>
<li>The agent never reads or edits the plugin's key file, so your identity key never passes through the model.</li>
</ul>` },
    ],
    faq: [
      ["Which AI agents work?", "Any agent that can read and write files on your computer: Claude Code, OpenAI Codex, Cursor, and similar tools."],
      ["Can the AI run this daily?", "Yes. The setup prompt describes a once-a-day routine you can schedule with your agent."],
      ["Does the AI see my private key?", "No. The prompts forbid reading the plugin's data.json, and your identity is created by the plugin, not the AI."],
    ],
    related: ["obsidian-daily-journal-ai", "track-ai-token-usage", "obsidian-public-profile"],
  },
  {
    slug: "obsidian-daily-journal-ai",
    title: "Automatic daily journal in Obsidian with AI",
    description: "Have an AI agent write yesterday's journal entry in Obsidian each morning from your notes, calendar, email and commits, with privacy rules, and show it on a flippable public journal.",
    h1: "An automatic daily journal in Obsidian, written by AI",
    answer: "You can have an AI agent write a short journal entry in Obsidian every morning: it reads yesterday's notes, calendar, sent email, commits and AI sessions, then adds a headline, focus, wins and themes to that day's daily note. With the Caldera plugin those entries become a flippable daily journal on your public profile, alongside an activity score, while the privacy rules keep names, clients and money out of anything public.",
    sections: [
      { h2: "What gets written", html: `<p>Four properties on each daily note (named <code>YYYY-MM-DD.md</code>): <code>caldera_headline</code> (one sentence), <code>caldera_focus</code> (2-4 items), <code>caldera_wins</code> (1-3 items) and <code>caldera_themes</code> (1-3 words). Daily counts (meetings, emails sent, AI prompts, commits, documents) go in <code>Caldera/activity.json</code>.</p>` },
      { h2: "How to set it up", html: `<ol><li>Copy the setup prompt from <a href="/#install">caldera.social/#install</a> into Claude Code, Codex or Cursor.</li><li>After install, schedule the agent to run the daily routine each morning.</li><li>Use the "make it richer" prompt to backfill the last 14 days.</li></ol>` },
    ],
    faq: [
      ["Do I have to make the journal public?", "No. The journal section has an on/off switch; the entries stay in your daily notes either way."],
      ["What if a day had nothing public to say?", "The rules allow empty fields; the page shows the activity counts only."],
      ["Can I write entries myself?", "Yes. The same four properties work whether you or an agent write them."],
    ],
    related: ["obsidian-ai-agent-setup", "obsidian-activity-tracker", "obsidian-public-profile"],
  },
  {
    slug: "track-ai-token-usage",
    title: "Track your Claude Code and Codex token usage (by model)",
    description: "See how many AI tokens you use per day and which models (Claude Opus, Sonnet, GPT-5 and more), charted on your profile. Counts only, read from local Claude Code and Codex logs.",
    h1: "Track your AI token usage by day and by model",
    answer: "Claude Code and OpenAI Codex both keep local usage logs with the model and token counts for every response, so you can chart your AI usage without any API access. Caldera's prompts have your AI agent total those logs into tokens per day, per model and per provider (counts only, never prompts or costs), and the AI usage section of your profile shows the daily chart and your model mix.",
    sections: [
      { h2: "Where the numbers come from", html: `<ul>
<li><b>Claude Code:</b> <code>~/.claude/projects/**/*.jsonl</code> - assistant messages include <code>message.model</code> and <code>message.usage</code> (input, output, cache read and cache write tokens). Count each message id once.</li>
<li><b>Codex:</b> <code>~/.codex/sessions/**/*.jsonl</code> - <code>token_count</code> events carry per-turn usage; the model comes from <code>turn_context</code>.</li>
</ul>` },
      { h2: "What surprises most people", html: `<p>Agent sessions re-read cached context constantly, so totals are dominated by cache reads. On one heavy user's profile, about 7.7 billion tokens over 45 days were almost all cached context. Charting it by model also shows how much work each model actually does.</p>` },
    ],
    faq: [
      ["Does this show my costs?", "No. Only token counts and model names are published; money amounts are deliberately excluded."],
      ["Does it read my prompts?", "No. Only usage fields (model, token counts, timestamps) are totaled."],
      ["Which tools are supported?", "Claude Code and Codex out of the box; any tool that keeps local usage logs can be added by your agent."],
    ],
    related: ["obsidian-ai-agent-setup", "obsidian-activity-tracker", "what-is-caldera"],
  },
  {
    slug: "obsidian-activity-tracker",
    title: "Obsidian activity heatmap, streaks and leaderboard",
    description: "A 26-week activity heatmap, daily score, streaks, best days and a friends leaderboard for your Obsidian vault, on a public profile page. Free and open source.",
    h1: "Activity heatmap, streaks and a leaderboard for Obsidian",
    answer: "Caldera adds a GitHub-style 26-week activity heatmap, a daily activity score, streaks, your best days and a friends leaderboard to your Obsidian vault, shown on your public profile. The score combines notes written plus optional outside counts (meetings, emails sent, AI prompts, commits, documents), with caps so a bulk import can't win a day.",
    sections: [
      { h2: "What's measured", html: `<p>Notes created and changed each day come from the vault itself. Outside activity comes from <code>Caldera/activity.json</code>, which your AI agent or scripts can fill with counts. Only numbers are published.</p>` },
      { h2: "Compete with friends, positively", html: `<p>The leaderboard ranks you against friends by points this week. There are no downvotes; recognition is gravity, a positive-only score that fades over a month so recent help counts most.</p>` },
    ],
    faq: [
      ["How is the score calculated?", "Weighted daily counts (meetings, emails, prompts, commits, notes, documents), each capped so bulk imports can't dominate. The formula is shown on every page under \"How the score works\"."],
      ["Can I hide the heatmap?", "Yes. Every section can be switched off in Caldera/profile.md."],
      ["Does it work on mobile?", "Yes. The plugin runs on Obsidian desktop and mobile, and profiles are responsive."],
    ],
    related: ["obsidian-public-profile", "obsidian-daily-journal-ai", "track-ai-token-usage"],
  },
];
