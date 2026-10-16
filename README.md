# Caldera: the social layer for Obsidian

Your vault becomes a **living profile** that updates itself, and vaults can **befriend** each other, share notes as end-to-end encrypted **cards**, post **asks** and **offers**, earn **help credits**, and give **gravity** (positive-only kudos).

**Private by default.** Nothing leaves your vault unless you switch a section on, mark a note `caldera: public`, or share it with a named friend. Every publish can be previewed first.

## Your work as a city

![Your repos as a neon city, with live visitors and AI agents](https://raw.githubusercontent.com/schoettle-cmd/caldera/main/docs/img/1-city-live.jpg)

- **Every GitHub repo is a tower** on a Tron-style grid: taller = more commits this year, lit windows = this week, a crane = being built right now. Districts are your projects. Day, Dusk and Night modes too.
- **Live traffic:** paste a one-line snippet into your own sites and every visitor drives through their project's district in real time; signups pulse pink, sales fire a gold beam.
- **Your AI agents as drones:** each Claude Code session flies over the repo it's working in: a beam while it edits, circling while it thinks, parked at Agent HQ blinking amber when it's waiting on you.
- **The Underground:** your vault beneath the streets. Notes are glowing nodes (bigger = more links in), links are tunnels, depth is age, and roots run up to the project each note is about.

![The Underground: your vault as a network under the city](https://raw.githubusercontent.com/schoettle-cmd/caldera/main/docs/img/3-underground.jpg)

Visitors see private repos as padlocked buildings, live traffic only as activity levels, agents as anonymous drones, and your notes only as shapes. The details are yours: in the My profile tab in Obsidian.

**No Obsidian?** Sign up on [caldera.social](https://caldera.social) with GitHub: your repos become your city, and you can move the profile into a vault any time.

## What's here

The hub, the caldera.social website and the `caldera` CLI live in [schoettle-cmd/caldera-hub](https://github.com/schoettle-cmd/caldera-hub).

| Package | What it is | License |
|---|---|---|
| `spec/PROTOCOL.md` | The open Caldera protocol (signed envelopes, friends, cards, asks/offers, gravity, credits, hub API) | CC-BY-4.0 |
| `packages/core` | Identity (Ed25519/X25519), signing, encryption, scoring. Pure JS, runs on desktop, mobile and Node | MIT |
| `packages/plugin` | The Obsidian plugin: build/preview/publish your profile, friends panel, share note as card, asks, offers, gravity | MIT |

## Use it (Obsidian)

**Fastest:** copy the setup prompt at https://caldera.social/#install into Claude Code, Codex or Cursor. Your AI installs the plugin; restart Obsidian, pick a handle in the Welcome window, and your page opens in the browser.

**By hand:** download [caldera-latest.zip](https://caldera.social/download/caldera-latest.zip) (or the files from the latest [GitHub release](https://github.com/schoettle-cmd/caldera/releases)) into `<vault>/.obsidian/plugins/caldera/`, restart Obsidian, turn on Caldera.

**Beta testers (BRAT):** add `schoettle-cmd/caldera` in the BRAT plugin.

Change your page by editing the note `Caldera/profile.md` (or ask your AI to); it republishes itself. Guide: https://caldera.social/guide.html

Conventions (all optional): notes in a `Garden` folder (or `caldera: garden`) become full public pages with `stage:` and `license:`; `caldera: public` on a note lists its first paragraph; daily notes named `YYYY-MM-DD` can carry `caldera_headline`, `caldera_focus`, `caldera_wins`, `caldera_themes` for the daily journal; `Caldera/activity.json` lets outside tools (calendar, email, git) add daily counts.

## Privacy and terms

Hosted service: [Privacy Policy](https://caldera.social/privacy) and [Terms of Service](https://caldera.social/terms). Delete your hub profile anytime with **Caldera: Delete my profile from the hub**.

## Network use (disclosure)

The plugin contacts only the hub you configure, and only when you publish, sync your inbox, or act (friend, card, ask, offer, gravity). No telemetry, no analytics, no third parties. Your identity keys live in the plugin's data file on your device; export your recovery key from settings.

## Run a hub

See [schoettle-cmd/caldera-hub](https://github.com/schoettle-cmd/caldera-hub).

## Develop

```
npm install
npm run build
npm test          # core + plugin (render, garden)
```

## Principles

Local-first. Keys, not accounts. Everything that matters is signed. Positive-only social signals. Points before money: help credits have no cash value in v0.1.

---

Caldera is developed and maintained by **mjonesone, LLC**. Copyright (c) 2026 mjonesone, LLC. Licensed as noted per package.
