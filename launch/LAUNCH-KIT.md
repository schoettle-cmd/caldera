# Caldera launch kit

Nothing here is submitted until (1) caldera.social is live on HTTPS, and (2) Mike approves making the repo public.

## 0. Pre-launch checklist

- [x] caldera.social resolves to DIRECTOR; TLS cert issued; nginx server block live
- [x] mjonesone.com/caldera/ 301 -> caldera.social (API path still proxied for older plugin settings)
- [ ] privacy@ and legal@caldera.social forwarding works (send a test to each)
- [ ] Plugin manifest description no longer contains the word "Obsidian" (the release bot flags it). Suggested: "The social layer for your vault: a living profile, friends between vaults, encrypted shared notes, asks, offers and gravity. Private by default."
- [ ] Public plugin repo `schoettle-cmd/caldera-obsidian` (or the monorepo made public with a ROOT `manifest.json` + README; the obsidian-releases bot reads the repo root)
- [ ] GitHub release tagged exactly `0.1.0` (no "v"), assets: `main.js`, `manifest.json`, `styles.css`
- [ ] `leak_audit.py` clean, e2e test on production hub green (done 2026-10-10)
- [ ] Attorney skim of privacy.html / terms.html; USPTO/TESS check on "Caldera" in class 9/42 (MITRE Caldera is a security tool; different field, but check)

## 1. obsidian-releases PR

Fork https://github.com/obsidianmd/obsidian-releases, append to the END of `community-plugins.json`:

```json
{
  "id": "caldera",
  "name": "Caldera",
  "author": "mjonesone, LLC",
  "description": "The social layer for your vault: a living profile, friends between vaults, encrypted shared notes, asks, offers and gravity. Private by default.",
  "repo": "schoettle-cmd/caldera-obsidian"
}
```

PR title: `Add plugin: Caldera`

PR body (fill the template checkboxes; key disclosures):

> Caldera turns your vault into a living public profile you control, and lets vaults befriend each other: share a note as an end-to-end encrypted card, post asks and offers, and give positive-only "gravity".
>
> Network use (disclosed in README): the plugin contacts a hub (default https://caldera.social, configurable, self-hostable under AGPL) only when the user publishes, syncs their inbox, or takes a social action. No telemetry, no ads, no account/email. Vault content is read locally; only sections the user switches on, notes marked `caldera: public`, and cards sent to a named friend leave the device. Shared cards are encrypted with nacl.box; the hub stores ciphertext.
>
> Desktop and mobile. Uses `requestUrl`, no Node/Electron APIs.

## 2. Obsidian forum: Share & showcase

Title: **Caldera: a living profile from your vault, plus friends between vaults (open source)**

> I wanted a way to show what I'm working on without handing my notes to a social network. Caldera is a plugin that builds a public profile page from your vault (counts, a daily journal you write in frontmatter, the tags and notes you choose) and publishes it to a small open hub.
>
> Then it gets social, the Obsidian way:
> - **Friends between vaults.** Send a request by handle; accept from the Caldera panel.
> - **Share a note as a card.** End-to-end encrypted; it lands in your friend's vault under `Caldera/Inbox/`.
> - **Asks and offers.** Post "I need help with X" with an optional bounty of help credits (points, no cash value).
> - **Gravity.** Positive-only kudos with a 30-day half-life. No likes, no downvotes, no follower counts.
>
> **Private by default.** Nothing leaves your vault unless you switch a section on, mark a note `caldera: public`, or share with a named friend. Preview before every publish. Delete everything from the hub with one command.
>
> Open protocol (CC-BY), plugin and core MIT, hub AGPL so you can self-host.
>
> Install: Community plugins -> search "Caldera" (or the manual zip at https://caldera.social/#install).
> Site: https://caldera.social - Code: https://github.com/schoettle-cmd/caldera-obsidian
>
> Feedback very welcome, especially on what you'd want to be able to share and what you'd never want to.

## 3. Reddit r/ObsidianMD

Title: **I built Caldera: turn your vault into a living profile, and befriend other vaults (open source, private by default)**

Body: same as the forum post, shortened to the first paragraph + the four bullets + install line. Add one screenshot of a profile page and one of the Caldera panel. Post Tue-Thu morning PT; reply to every comment the first 24h.

## 4. After listing

- Swap install option A on the landing page from "once listed" to the live `obsidian://show-plugin?id=caldera` link.
- Watch hub: `pm2 logs caldera-hub`, new-profile rate, 429s.
