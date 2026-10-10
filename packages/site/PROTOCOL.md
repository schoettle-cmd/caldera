# Caldera Protocol v0.1 (draft)

Caldera is the social layer for Obsidian. A vault publishes a **living profile**; vaults **befriend** each other, exchange **cards** (shared notes), post **asks** and **offers**, and give each other **gravity** (positive-only endorsements). This document is the open protocol. Anyone may implement it. The reference implementation is the Caldera Obsidian plugin plus the Caldera Hub.

Design rules:

1. **Local-first, private by default.** Nothing leaves a vault unless the owner marks it public or shares it with a named friend. Every publish shows a preview first.
2. **Identity is a key, not an account.** Each vault holds an Ed25519 signing key and an X25519 encryption key. A profile is whoever holds the key.
3. **Everything that matters is signed.** Manifests, friend records, cards, asks, offers and gravity are signed objects. A hub is a convenience (storage, discovery, delivery); it cannot forge anything.
4. **Positive-only social signals.** There are no downvotes. Gravity only adds, and it decays so recent help counts most.
5. **Points before money.** v0.1 credits have no cash value and cannot be transferred. Paid bounties, if added later, run on regulated payment rails.

---

## 1. Identity

```
signing key   Ed25519   (tweetnacl.sign)
box key       X25519    (tweetnacl.box), derived independently, published in the manifest
id            "cal:" + base58(ed25519 public key)
handle        optional, human readable, unique on a hub (e.g. "mike"), or a domain proven via /.well-known
```

Keys are generated on first run, stored only in the vault's plugin data on the user's device, and can be exported as a recovery phrase.

## 2. Signed envelope

Every protocol object is wrapped:

```json
{
  "v": 1,
  "type": "profile.manifest | friend.request | friend.accept | card | ask | offer | gravity | credit.award | message",
  "from": "cal:...",
  "ts": "2026-10-10T18:00:00.000Z",
  "body": { },
  "sig": "base64 Ed25519 signature over canonical(v,type,from,ts,body)"
}
```

`canonical()` is JSON with object keys sorted recursively and no insignificant whitespace (RFC 8785 style). Receivers MUST verify `sig` against `from` and reject envelopes older than 30 days for request-type objects.

## 3. Profile manifest (`profile.manifest`)

Published at `https://<host>/.well-known/caldera.json` (self-hosted) or `https://<hub>/@<handle>/caldera.json`.

```json
{
  "name": "Mike Jones",
  "handle": "mike",
  "boxKey": "base64 X25519 public key",
  "headline": "Builder and investor in Venice, California",
  "photos": { "avatar": "img/avatar.jpg", "banner": "img/banner.jpg" },
  "links": [["Instagram", "https://instagram.com/..."]],
  "sections": ["journal", "scoreboard", "numbers", "projects", "timeline"],
  "stats": { "notes": 3671, "links": 18993, "activeDays26w": 128 },
  "daily": [ { "date": "2026-10-09", "score": 370, "headline": "...", "counts": { "meetings": 11 } } ],
  "topics": [["AI", 35], ["Venture studios", 24]],
  "asks":   [ { "id": "ask_...", "title": "...", "bounty": 40 } ],
  "offers": [ { "id": "off_...", "title": "..." } ],
  "page": "index.html",
  "updated": "2026-10-10T18:00:00.000Z"
}
```

Only aggregate counts and text the owner marked public may appear. The plugin builds the manifest **and** a static page (`index.html` + `theme.css` + `profile.css`) so a profile works with zero server logic.

## 4. Friends

```
friend.request  body: { "to": "cal:...", "note": "optional" }
friend.accept   body: { "request": "<sha256 of the request envelope>", "to": "cal:..." }
```

A friendship exists when both envelopes exist and verify. Friends may see each other's **friends layer** (sections and cards marked `caldera: friends`). Either side may end a friendship (`friend.remove`); it is not announced.

## 5. Cards (sharing notes between vaults)

A card is a note shared with one or more friends. The note body is encrypted per recipient with `nacl.box(recipientBoxKey, senderBoxSecret)`.

```json
body: {
  "id": "card_...",
  "title": "Note title",
  "to": ["cal:..."],
  "payload": { "cal:recipient": { "nonce": "b64", "box": "b64 encrypted markdown" } },
  "version": 3
}
```

The receiving plugin writes it to `Caldera/Inbox/<sender>/<title>.md` with frontmatter `caldera_from`, `caldera_card`, `caldera_version`. A newer version replaces the older one. The hub only ever sees ciphertext.

## 6. Asks, offers, gravity, credits

```
ask      body: { "id", "title", "detail", "bounty": <credits, int>, "tags": [], "visibility": "public|friends" }
offer    body: { "id", "title", "detail", "tags": [] }
gravity  body: { "to": "cal:...", "reason": "short text", "ask": "optional ask id" }
credit.award body: { "ask": "ask id", "to": "cal:helper", "amount": <= bounty }
```

Rules enforced by every hub and verifiable by anyone:

- **Gravity** is positive only. One gravity per (from, to) per 24 hours. Gravity score = sum over received gravity of `0.5 ^ (ageDays / 30)` (30-day half-life), weighted by the giver's own gravity (bounded 1.0 to 2.0) to blunt sock puppets.
- **Credits** are created only by `credit.award` from an ask's author to a helper, up to the ask's bounty. Every new profile starts with 100 credits; posting an ask escrows its bounty; unawarded bounties return after 30 days. Credits have no cash value and cannot be transferred except through awards.

## 7. Hub API (reference: Caldera Hub)

```
POST /v1/envelopes                 submit any signed envelope (hub verifies, stores, indexes, delivers)
POST /v1/profiles/:id/bundle       upload static profile files (multipart; manifest envelope required)
GET  /@:handle                     the public profile page
GET  /@:handle/caldera.json        the signed manifest
GET  /v1/profiles?q=               discovery / search (public profiles only)
GET  /v1/inbox/:id?since=          envelopes addressed to :id (requires a signed auth challenge)
GET  /v1/leaderboard?scope=friends&of=:id   ranked by 7-day activity score
GET  /v1/asks?tag=                 open public asks
GET  /v1/gravity/:id               gravity score + recent endorsements
GET  /v1/credits/:id               credit balance + ledger
POST /v1/auth/challenge, /v1/auth/verify   signed-nonce login, returns a short-lived token
```

A hub MUST NOT require an email or password. Self-hosted profiles interoperate by publishing `/.well-known/caldera.json` and polling friends' inboxes on any hub they choose.

## 8. Versioning

`v` increments only for breaking changes. Unknown `type`s and unknown body fields MUST be ignored, not rejected.
