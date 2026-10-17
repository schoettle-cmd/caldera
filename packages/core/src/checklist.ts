/**
 * "Finish your page": the same checklist in every private view (Obsidian's My view, the hub's /me page for GitHub
 * sign-ups, and one nudge in the daily email). Pure: state in, items out.
 */
import { PRIVACY_RULES } from "./agent-prompt.js";

export type ChecklistId = "photo" | "banner" | "headline" | "summary" | "links" | "garden" | "friend" | "group" | "email";
export interface PageState {
  photo: boolean; banner: boolean; headline: boolean;
  /** undefined = not known (the hub can't see a vault profile's summary): treated as done, never nudged */
  summary?: boolean;
  links: boolean;
  /** undefined = not applicable (a GitHub-hosted profile has no vault to plant notes from) */
  garden?: boolean;
  friend: boolean; group: boolean; email: boolean;
}
export interface ChecklistItem { id: ChecklistId; label: string; why: string; done: boolean }

const ITEMS: { id: ChecklistId; label: string; why: string }[] = [
  { id: "photo", label: "Profile photo", why: "A face (or a logo) makes people trust the page and accept your friend requests." },
  { id: "banner", label: "Masthead", why: "A wide cover image across the top makes the page feel like yours and shows in link previews." },
  { id: "headline", label: "Headline", why: "One line under your name that says what you do." },
  { id: "summary", label: "About you", why: "Two sentences so a visitor knows why to follow you." },
  { id: "links", label: "Links", why: "Where else to find you: your site, GitHub, socials." },
  { id: "garden", label: "First garden note", why: "One note grown in public gives visitors something to read and link to." },
  { id: "friend", label: "First friend", why: "Friends see your updates, link your notes and give you gravity." },
  { id: "group", label: "Join a group", why: "Groups are towns of everyone's cities, and people in them are suggested to you." },
  { id: "email", label: "Daily summary email", why: "Hear when people visit, link your notes or ask to be friends." },
];

export function pageChecklist(s: PageState): ChecklistItem[] {
  return ITEMS.filter(i => !(i.id === "garden" && s.garden === undefined))
    .map(i => ({ ...i, done: i.id === "summary" ? s.summary !== false : i.id === "garden" ? !!s.garden : !!(s as any)[i.id] }));
}

/** The first thing still to do, in checklist order (for the one nudge in the daily email). */
export const nextStep = (s: PageState): ChecklistItem | undefined => pageChecklist(s).find(i => !i.done);

/** Copy-paste prompt: ask the owner's AI agent to set a masthead (banner) or profile photo for their Caldera page. */
export function imagePrompt(kind: "banner" | "photo", o: { vaultPath?: string; hubUrl?: string; handle?: string } = {}): string {
  const hub = (o.hubUrl || "https://caldera.social").replace(/\/$/, ""), vault = o.vaultPath || "<ABSOLUTE PATH TO MY OBSIDIAN VAULT>";
  const what = kind === "banner"
    ? `a masthead: the wide cover image across the top of my page. It should be about 3:1 (for example 1800x600), landscape, calm enough that my name and photo read on top of it, and under 2 MB (JPG or WebP).`
    : `a profile photo: square, at least 400x400, my face or my logo, under 1 MB (JPG, PNG or WebP).`;
  const key = kind === "banner" ? "banner" : "photo", file = kind === "banner" ? "banner" : "photo";
  return `Help me add ${what}

My Caldera page: ${hub}/@${o.handle || "<my handle>"}/ . Caldera builds it from my Obsidian vault.
Vault: ${vault}

1. Ask me which image to use. Offer three routes: (a) I point you at a photo I already have, (b) you find a free-to-use image I approve (say where it's from and its license), ${kind === "banner" ? "or (c) you make one (a simple abstract or landscape image, or an image generator I already use)" : "or (c) I'll take one now"}.
2. Crop or resize it to the size above if you can, and save it as "${vault}/Caldera/${file}.jpg" (or .png / .webp to match).
3. In the frontmatter of "${vault}/Caldera/profile.md", set ${key}: "Caldera/${file}.jpg" (the path inside the vault). Change nothing else.
4. Caldera republishes the page about a minute after profile.md changes. Tell me to look at ${hub}/@${o.handle || "<my handle>"}/ .

Rules:
${PRIVACY_RULES}
- The image is public: no other people's faces without their OK, no screens, documents, addresses or anything readable that's private.
- Never read or edit .obsidian/plugins/caldera/data.json - it holds my private key.`;
}
