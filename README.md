# Caldera: the social layer for Obsidian

Your vault becomes a **living profile** that updates itself, and vaults can **befriend** each other, share notes as end-to-end encrypted **cards**, post **asks** and **offers**, earn **help credits**, and give **gravity** (positive-only kudos).

**Private by default.** Nothing leaves your vault unless you switch a section on, mark a note `caldera: public`, or share it with a named friend. Every publish can be previewed first.

## What's here

| Package | What it is | License |
|---|---|---|
| `spec/PROTOCOL.md` | The open Caldera protocol (signed envelopes, friends, cards, asks/offers, gravity, credits, hub API) | CC-BY-4.0 |
| `packages/core` | Identity (Ed25519/X25519), signing, encryption, scoring. Pure JS, runs on desktop, mobile and Node | MIT |
| `packages/plugin` | The Obsidian plugin: build/preview/publish your profile, friends panel, share note as card, asks, offers, gravity | MIT |
| `packages/hub` | Reference hub: stores signed envelopes, hosts pages, delivers encrypted cards, enforces gravity/credit rules, leaderboards, discovery. Node 22, zero frameworks, SQLite | AGPL-3.0 |
| `packages/cli` | `caldera publish --vault <path>` - publish without opening Obsidian (servers, cron, CI) using the plugin's own code | MIT |

## Use it (Obsidian)

**Fastest:** copy the setup prompt at https://caldera.social/#install into Claude Code, Codex or Cursor. Your AI installs the plugin; restart Obsidian, pick a handle in the Welcome window, and your page opens in the browser.

**By hand:** download [caldera-latest.zip](https://caldera.social/download/caldera-latest.zip) (or the files from the latest [GitHub release](https://github.com/schoettle-cmd/caldera/releases)) into `<vault>/.obsidian/plugins/caldera/`, restart Obsidian, turn on Caldera.

**Beta testers (BRAT):** add `schoettle-cmd/caldera` in the BRAT plugin.

Change your page by editing the note `Caldera/profile.md` (or ask your AI to); it republishes itself. Guide: https://caldera.social/guide.html

Conventions (all optional): `caldera: public` on a note lists it publicly; daily notes named `YYYY-MM-DD` can carry `caldera_headline`, `caldera_focus`, `caldera_wins`, `caldera_themes` for the daily journal; `Caldera/activity.json` lets outside tools (calendar, email, git) add daily counts.

## Privacy and terms

Hosted service: [Privacy Policy](packages/site/privacy.html) and [Terms of Service](packages/site/terms.html). Delete your hub profile anytime with **Caldera: Delete my profile from the hub**.

## Network use (disclosure)

The plugin contacts only the hub you configure, and only when you publish, sync your inbox, or act (friend, card, ask, offer, gravity). No telemetry, no analytics, no third parties. Your identity keys live in the plugin's data file on your device; export your recovery key from settings.

## Run a hub

```
npm install && npm run build
CALDERA_DATA=./data PORT=8787 node --no-warnings packages/hub/dist/server.js
```

## Develop

```
npm install
npm run build
npm test          # core (6), hub end-to-end (7), plugin render + publish end-to-end (4)
```

## Principles

Local-first. Keys, not accounts. Everything that matters is signed. Positive-only social signals. Points before money: help credits have no cash value in v0.1.

---

Caldera is developed and maintained by **mjonesone, LLC**. Copyright (c) 2026 mjonesone, LLC. Licensed as noted per package.
