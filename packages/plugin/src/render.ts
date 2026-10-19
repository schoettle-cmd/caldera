/**
 * Pure profile renderer: ProfileData -> static files (index.html + CSS).
 * No Obsidian imports, so it is unit-testable in Node and reusable by self-hosters.
 * Restyle everything via assets/theme.css (design tokens only).
 */
// @ts-ignore - esbuild loads .css as text via the define below
import THEME_CSS from "./assets/theme.css";
import { PROFILE_CSS } from "./profile.css";
import { activityScore, ACTIVITY_WEIGHTS, ACTIVITY_CAPS, externalLinksNewWindow, gardenEnabled, type DailyCounts } from "@caldera/core";
import { gardenSection, renderGarden, type GardenNote } from "./garden";
import { citySnapshot, renderCity, type CityData } from "./city";
import type { ProfileModule } from "./modules";

export interface DailyEntry { date: string; counts: DailyCounts; tokens?: number; headline?: string; focus?: string[]; wins?: string[]; themes?: string[]; }
export interface ProfileData {
  name: string; handle?: string; headline?: string; theme?: "dark" | "light";
  avatar?: string; banner?: string;                       // relative paths inside the bundle, e.g. img/avatar.jpg
  icon?: string;                                           // browser-tab icon (round avatar PNG); default: Caldera logo
  links: [string, string][];
  properties: [string, string][];
  sections: Record<string, boolean>;                      // journal, scoreboard, numbers, topics, notes, asks, social, links
  stats: { notes: number; words: number; links: number; activeDays: number };
  topics: [string, number][];
  daily: DailyEntry[];                                     // oldest -> newest, last item = today
  publicNotes: { title: string; excerpt: string; updated: string }[];
  asks: { title: string; bounty: number }[];
  offers: { title: string }[];
  social?: { friends: number; gravity: number; credits: number };
  updated: string;                                         // ISO
  hub?: string;                                            // hub base URL, for the 'how to edit' link
  tree?: { name: string; child: boolean; current?: boolean; href?: string; count?: number }[];   // left sidebar (href: link or #anchor; count: notes in folder)
  graph?: { t: string; n: number }[]; graphLabel?: string;        // right rail graph (counts only)
  backlinks?: [string, string][]; backlinkLabel?: string;         // right rail list
  // owner-written (Caldera/profile.md)
  summary?: string; now?: string[]; timeline?: [string, string][];
  /** Now came from the journal (the last week's wins), not from the profile note */
  nowAuto?: boolean;
  projects?: { name: string; status: string; url: string; commits?: number }[];
  // computed from the vault (counts only)
  heat?: { date: string; n: number }[];                    // 26 weeks, Monday-first, oldest first
  growth?: { week: string; total: number }[];              // cumulative notes per week
  // supplied by the owner's tools via Caldera/activity.json (counts only)
  knows?: [string, number][];
  inbox?: { total?: number; note?: string; kinds: [string, number][]; series?: { label: string; weeks: [string, number][] } };
  code?: { commits: number; repos: number; languages?: string[]; weekly?: number[]; url?: string; start?: string };
  extraNumbers?: [string, string][];                        // [value, label] appended to the number strip
  tabs?: string[];                                          // extra (decorative) tabs next to the page tab
  source?: string;                                          // where the page comes from ("vault" by default; "GitHub" for GitHub sign-ups)
  garden?: GardenNote[];                                   // full public notes (Garden/ folder or caldera: garden)
  gardenExternal?: string;                                 // an existing garden elsewhere (Quartz, Obsidian Publish...)
  gardenImages?: Record<string, string>;                   // embed target -> bundle path
  id?: string;                                             // cal: id, shown in note provenance
  city?: CityData;                                         // public subset only (see city.ts publicCity)
  modules?: ProfileModule[];                               // owner/agent-written sections from Caldera/modules/*.md (already safe HTML)
  ai?: { total: number; window_days?: number; models: [string, number][]; providers?: [string, number][]; sources?: [string, number][]; note?: string };   // AI tokens, counts only
}

/** Pre-written invite email; the link carries the inviter's handle so caldera.social can greet the friend. */
function inviteHref(p: ProfileData): string {
  const hub = (p.hub || "https://caldera.social").replace(/\/$/, "");
  const who = p.handle ? `@${p.handle}` : p.name;
  const join = `${hub}/${p.handle ? `?invite=${encodeURIComponent(p.handle)}` : ""}#install`;
  const subject = `Join me on Caldera`;
  const body = `Hey,\n\nI'm using Caldera, the social layer for Obsidian. It turns your notes into a living profile that updates itself, and lets our vaults connect: share notes, ask for help, and compare our daily scores.\n\nMy page: ${hub}/@${p.handle || ""}/\n\nSet up takes about 5 minutes - copy one prompt into your AI and it installs everything:\n${join}\n\nThen add me as a friend (${who}) from the Caldera panel in Obsidian.\n\n${p.name}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Invite panel: copy link, email, text, native share. One per page, opened by any [data-invite] button. */
const INVITE_MSG = "I'm using Caldera, the social layer for Obsidian. It turns your notes into a living page that updates itself, and our vaults can connect and compare daily scores. Setup takes about 5 minutes: copy one prompt into your AI.";
function inviteUrl(p: ProfileData): string { const hub = (p.hub || "https://caldera.social").replace(/\/$/, ""); return `${hub}/${p.handle ? `?invite=${encodeURIComponent(p.handle)}` : ""}#install`; }
function invitePop(p: ProfileData): string {
  return `<div class="invite-pop" hidden role="dialog" aria-label="Invite a friend" data-url="${esc(inviteUrl(p))}" data-msg="${esc(INVITE_MSG)}" data-subject="Join me on Caldera"><div class="inv-head"><div><div class="inv-title">Invite a friend</div><div class="inv-sub">They get their own living page in about 5 minutes, and you compare daily scores here.</div></div><button class="inv-close" type="button" aria-label="Close">&times;</button></div><div class="inv-link"><input class="inv-url" readonly aria-label="Invite link" value="${esc(inviteUrl(p))}"><button class="inv-copy" type="button">Copy link</button></div><div class="inv-ways"><a class="inv-email" href="#">Email</a><a class="inv-text" href="#">Text</a><button class="inv-share" type="button">Share</button></div><div class="inv-status" role="status" aria-live="polite"></div></div>`;
}

/** Anchor id for a heading or note title: "AI usage" -> "ai-usage". */
export function slug(t: string): string { return t.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "s"; }

/** 7675123642 -> 7.68B, 456865 -> 457K */
const big = (n: number) => n >= 1e9 ? (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);

/** Inline text: [[Label|https://url]], [Label](https://url) and **bold**. Everything else escaped; only http(s) links. */
function inline(t: string): string {
  const parts: string[] = []; let last = 0;
  const rx = /\[\[([^|\]]+)\|(https?:\/\/[^\]\s]+)\]\]|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*/g;
  for (let m; (m = rx.exec(t));) {
    parts.push(esc(t.slice(last, m.index)));
    if (m[5]) parts.push(`<b>${esc(m[5])}</b>`);
    else parts.push(`<a href="${esc(m[2] || m[4])}" rel="noopener">${esc(m[1] || m[3])}</a>`);
    last = m.index + m[0].length;
  }
  return parts.join("") + esc(t.slice(last));
}

/** Same layout as the living profile: nodes on two rings around the center, size by sqrt(count). */
function graphSvg(nodes: { t: string; n: number }[], name: string): string {
  if (!nodes.length) return "";
  const top = Math.max(1, ...nodes.map(x => x.n)), order = [...nodes].sort((a, b) => b.n - a.n);
  const out = order.map((nd, i) => {
    const a = i / order.length * Math.PI * 2, r = i % 2 === 0 ? 64 : 96;
    const x = 130 + Math.cos(a) * r, y = 120 + Math.sin(a) * r * .85, size = 2.5 + 6.5 * Math.sqrt(nd.n / top);
    return { ...nd, x: x.toFixed(1), y: y.toFixed(1), ty: (y + size + 9).toFixed(1), r: size.toFixed(1), hot: nd.n >= top * .35, d: (-i * .3).toFixed(1) };
  });
  return `<svg viewBox="0 0 260 240" role="img" aria-label="Notes connected to ${esc(name)}">${out.map(n => `<line class="edge" x1="130" y1="120" x2="${n.x}" y2="${n.y}"></line>`).join("")}${out.map(n => `<g class="float" style="animation-delay:${n.d}s"><circle class="node${n.hot ? " hot" : ""}" cx="${n.x}" cy="${n.y}" r="${n.r}"><title>${esc(n.t)}: ${n.n}</title></circle><text x="${n.x}" y="${n.ty}" text-anchor="middle">${esc(n.t)}</text></g>`).join("")}<circle class="center" cx="130" cy="120" r="9"></circle></svg>`;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const fmt = (n: number) => n.toLocaleString("en-US");

export function scored(daily: DailyEntry[]) {
  return daily.map((d, i) => {
    const score = activityScore(d.counts);
    const prev = i ? activityScore(daily[i - 1].counts) : null;
    return { ...d, score, delta: prev ? Math.round((score - prev) / prev * 100) : null };
  });
}

/** Where each part of a profile comes from: a small tag beside every section header, so a visitor can tell what is
 *  Obsidian, what is GitHub and what is Caldera's own. */
type Src = "obsidian" | "github" | "caldera" | "agents" | "calendar" | "profile" | "module" | "self";
const SRC_LABEL: Record<Src, string> = { obsidian: "Obsidian vault", github: "GitHub", caldera: "Caldera", agents: "AI agents", calendar: "Calendar and email", self: "In their words", profile: "Profile note", module: "Custom module" };
const srcLine = (src: Src[], what: string) => `<p class="sec-src">${src.map(x => `<span class="src s-${x}">${SRC_LABEL[x]}</span>`).join("")}<span class="sec-what">${what}</span></p>`;
/** a section header: the h2 (listed in "On this page") plus its source tags and one line on what it is */
const head = (title: string, src: Src[], what: string) => `<h2>${esc(title)}</h2>${srcLine(src, what)}`;

export function renderProfile(p: ProfileData): Record<string, string> {
  const s = p.sections, gh = p.source === "GitHub", em = p.source === "Caldera";   // em: a page made by email + an AI, no vault or GitHub
  const days = scored(p.daily);
  const labels: Record<string, string> = { meetings: "Meetings", emails: "Emails sent", prompts: "AI sessions", commits: "Commits", notes: "Notes", docs: "Docs filed" };
  const present = Object.keys(labels).filter(k => days.some(d => (d.counts as any)[k]));
  const journal = days.map((d, i) => ({
    date: d.date, label: new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    score: d.score, delta: d.delta, headline: d.headline || "", focus: d.focus || [], wins: d.wins || [], themes: d.themes || [],
    chips: present.map(k => ({ k: labels[k], v: (d.counts as any)[k] || 0, d: i ? ((d.counts as any)[k] || 0) - ((days[i - 1].counts as any)[k] || 0) : null })),
  }));
  const scores = days.map(d => d.score);
  const yday = days.length > 1 ? days[days.length - 2] : days[days.length - 1];
  let streak = 0; const thresh = Math.max(20, (scores.slice().sort((a, b) => a - b)[Math.floor(scores.length / 2)] || 0) * 0.6);
  for (const sc of scores.slice(0, -1).reverse()) { if (sc >= thresh) streak++; else break; }
  const ranked = days.slice(0, -1).slice().sort((a, b) => b.score - a.score);
  const yrank = yday ? ranked.findIndex(d => d.date === yday.date) + 1 : 0;
  const smax = Math.max(1, ...scores);
  const last7 = scores.slice(-8, -1), prev7 = scores.slice(-15, -8);
  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  const trend = avg(prev7) ? Math.round((avg(last7) - avg(prev7)) / avg(prev7) * 100) : 0;
  const tmax = Math.max(1, ...p.topics.map(t => t[1]));

  const parts: string[] = [];
  parts.push(`<!doctype html><html lang="en"${p.theme === "light" ? ' data-theme="light"' : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.name)}</title>
<meta name="robots" content="noindex, nofollow"><meta name="generator" content="Caldera for Obsidian">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
${p.icon ? `<link rel="icon" href="${esc(p.icon)}" type="image/png"><link rel="apple-touch-icon" href="${esc(p.icon)}">` : `<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">`}
<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css">${(gardenEnabled() && s.garden !== false) && p.garden?.length ? '<link rel="stylesheet" href="assets/garden.css">' : ""}</head><body>
<div class="tabs"><span class="tab is-active">${esc(p.name)}.md</span>${(p.tabs || []).map(t => `<span class="tab">${esc(t)}</span>`).join("")}<span class="spacer"></span><span class="sync"><span class="dot"></span>synced from ${esc(p.source || "vault")} <span id="ago" data-ts="${esc(p.updated)}">just now</span></span></div>
<div class="shell">`);
  const sideOn = s.sidebar !== false && !!p.tree?.length, modOn = s.modules !== false, mainMods = modOn ? (p.modules || []).filter(m => m.place === "main") : [], sideMods = modOn ? (p.modules || []).filter(m => m.place === "side") : [];
  const railOn = s.rail !== false && (!!p.graph?.length || !!p.backlinks?.length || sideMods.length > 0);
  const gardenOn = (gardenEnabled() && s.garden !== false) && !!p.garden?.length;
  const nav = (depth: number, current: string, toc = "") => s.sidebar === false ? "" : navSidebar(p, sideOn, gardenOn, depth, current, toc);
  parts.push(nav(0, "index.html", "%%TOC%%"));
  parts.push(`<main class="note">`);
  // With a cover photo the avatar hangs off the banner; without one it sits on the page above the name.
  if (p.banner) parts.push(`<div class="banner"><img class="cover" src="${esc(p.banner)}" alt="">${p.avatar ? `<img class="avatar" src="${esc(p.avatar)}" alt="${esc(p.name)}">` : ""}</div>`);
  parts.push(`<div class="page">${!p.banner && p.avatar ? `<img class="avatar solo" src="${esc(p.avatar)}" alt="${esc(p.name)}">` : ""}<div class="crumb">People / ${esc(p.name)}.md${p.handle ? " / @" + esc(p.handle) : ""}</div>
<h1 class="title">${esc(p.name)}<span class="caret">|</span></h1>${p.headline ? `<p class="lede">${esc(p.headline)}</p>` : ""}<!--caldera:owner-->`);
  if (s.city !== false && p.city?.districts.length) parts.push(citySnapshot(p.city, { name: p.name }));

  if (s.journal && journal.length) parts.push(`<section class="journal" id="journal" aria-label="Daily journal"><div class="j-head"><button class="j-nav" id="jprev" aria-label="Previous day">&#8249;</button>
<div class="j-title"><div class="label">Daily journal</div><div class="j-date" id="jdate"></div></div><button class="j-nav" id="jnext" aria-label="Next day">&#8250;</button></div>${srcLine(["obsidian"], "Each day, summarized from the daily notes in the vault. Use the arrows to go back.")}
<div class="j-body" id="jbody" aria-live="polite"></div></section><script id="journal-data" type="application/json">${JSON.stringify(journal).replace(/</g, "\\u003c")}</script>`);

  // each day's points split by where they came from, so a bar shows its GitHub, Obsidian, AI and work parts
  const GROUPS: [string, string, (keyof typeof ACTIVITY_WEIGHTS)[]][] = [["github", "GitHub commits", ["commits"]], ["ai", "AI sessions", ["prompts"]], ["work", "Meetings and email", ["meetings", "emails"]], ["obsidian", "Obsidian notes and docs", ["notes", "docs"]]];
  const pts = (c: DailyCounts, ks: (keyof typeof ACTIVITY_WEIGHTS)[]) => ks.reduce((a, k) => a + ACTIVITY_WEIGHTS[k] * Math.min((c as any)[k] ?? 0, (ACTIVITY_CAPS as any)[k] ?? Infinity), 0);
  const groupsOn = GROUPS.filter(g => days.some(d => pts(d.counts, g[2]) > 0));
  const weekPts = groupsOn.map(g => [g, Math.round(days.slice(-8, -1).reduce((a, d) => a + pts(d.counts, g[2]), 0))] as const);
  const barOf = (d: typeof days[number]) => { if (groupsOn.length < 2) return "";   // one source (GitHub-only pages): plain bars
    const tot = groupsOn.reduce((a, g) => a + pts(d.counts, g[2]), 0) || 1;
    return groupsOn.map(g => { const v = pts(d.counts, g[2]); return v > 0 ? `<i class="g-${g[0]}" style="flex-grow:${(v / tot * 100).toFixed(1)}"></i>` : ""; }).join(""); };
  const counted = present.map(k => labels[k].toLowerCase().replace(/^ai /, "AI ")), countedTxt = counted.length > 1 ? counted.slice(0, -1).join(", ") + " and " + counted[counted.length - 1] : counted[0] || "activity";
  const sbSrc: Src[] = [...groupsOn.map(g => ({ github: "github", ai: "agents", work: "calendar", obsidian: "obsidian" } as Record<string, Src>)[g[0]]), "caldera"];
  if (s.scoreboard && days.length > 2) parts.push(`<section class="scoreboard" id="scoreboard"><h2 class="t">Scoreboard</h2>${srcLine(sbSrc, `Points for each day's ${esc(countedTxt)}. The leaderboard compares this week with friends on Caldera.`)}<div class="sb-stats">
<div class="sb-stat"><div class="v">${streak}<small> days</small></div><div class="l">active streak</div></div>
<div class="sb-stat"><div class="v">#${yrank}</div><div class="l">yesterday's rank of ${days.length - 1} days</div></div>
<div class="sb-stat"><div class="v">${avg(last7)}</div><div class="l">7-day average, ${trend >= 0 ? `<span class="up">&#9650; ${trend}%</span>` : `<span class="down">&#9660; ${-trend}%</span>`} vs prior week</div></div></div>
<div class="sb-bars" role="img" aria-label="Daily activity score, by source">${days.slice(-30).map((d, i, a) => `<span class="${i === a.length - 2 ? "yday" : i === a.length - 1 ? "today" : ""}" style="height:${Math.max(2, Math.round(d.score / smax * 100))}%" title="${d.date}: ${d.score}${groupsOn.map(g => { const v = Math.round(pts(d.counts, g[2])); return v ? `, ${g[1].toLowerCase()} ${v}` : ""; }).join("")}">${barOf(d)}</span>`).join("")}</div><div class="bars-legend"><span>${Math.min(30, days.length)} days ago</span><span>yesterday highlighted / today in progress</span></div>
${groupsOn.length > 1 ? `<div class="sb-split"><span class="label">Points this week, by source</span>${weekPts.map(([g, v]) => `<span class="sb-key"><i class="g-${g[0]}"></i>${esc(g[1])} <b>${fmt(v)}</b></span>`).join("")}</div>` : ""}
${(() => { const best = days.slice(0, -2).map((d, i) => ({ d, i })).sort((a, b) => b.d.score - a.d.score).slice(0, 5);
    const lb = [`<div class="lb-row me"><span class="rank">1</span><span class="who">You</span><span class="num">${fmt(days.slice(-8, -1).reduce((x, d) => x + d.score, 0))}</span></div>`]
      .concat([2, 3, 4].map(r => `<div class="lb-row empty"><span class="rank">${r}</span><a class="who invite-btn" data-invite href="${esc(inviteHref(p))}" target="_blank" rel="noopener">Invite a friend</a><span class="num">-</span></div>`));
    return `<div class="two-col sb-lower"><div class="lb-wrap"><div class="label">Leaderboard / points this week</div>${lb.join("")}${invitePop(p)}</div><div><div class="label">Your best other days</div>${best.map((b, k) => `<div class="lb-row"><span class="rank">${k + 1}</span><span class="who">${esc(new Date(b.d.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }))}</span><span class="num">${b.d.score}</span></div>`).join("")}</div></div>`; })()}
<details class="sb-how"><summary>How the score works</summary>Weighted daily counts: ${Object.entries(ACTIVITY_WEIGHTS).map(([k, w]) => `${labels[k] || k} x${w}`).join(", ")}. Bulk imports are capped. Counts only.</details></section>`);

  if (s.properties && p.properties.length) parts.push(`${head("At a glance", [gh ? "github" : em ? "self" : "profile"], gh ? "From the GitHub profile." : em ? "A few facts." : "Facts from the profile note in the vault.")}<dl class="props">${p.properties.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`);
  if (s.numbers) parts.push(`${head("The vault in numbers", ["obsidian"], "Counts only. What the notes say stays private.")}<div class="stat-strip">${[[fmt(p.stats.notes), "notes"], [(p.stats.words / 1e6).toFixed(2) + "M", "words"], [fmt(p.stats.links), "links between notes"], [String(p.stats.activeDays), "active days, 26 weeks"], ...(p.extraNumbers || [])].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.summary !== false && p.summary) parts.push(`<div class="callout"><div class="callout-title">Summary</div>${inline(p.summary)}</div>`);
  if (s.now !== false && p.now?.length) parts.push(`${head("Now", [gh ? "github" : em ? "self" : p.nowAuto ? "obsidian" : "profile"], gh ? "Public repos pushed in the last two weeks. Updates by itself." : p.nowAuto ? "What's been happening this week, from the daily journal. Updates by itself." : "What's in progress right now.")}<ul class="bullets">${p.now.map(x => `<li>${inline(x)}</li>`).join("")}</ul>`);
  for (const m of mainMods) parts.push(`<section class="module" data-module="${esc(m.slug)}">${head(m.title, ["module"], "A section written for this page in Obsidian.")}<div class="mod-body">${m.html}</div></section>`);
  if (s.activity !== false && p.heat?.length) {
    const lvl = (n: number) => n === 0 ? 0 : n < 5 ? 1 : n < 30 ? 2 : n < 200 ? 3 : 4;
    const pad = (new Date(p.heat[0].date + "T12:00:00Z").getUTCDay() + 6) % 7;
    parts.push(`${head("Activity", ["obsidian"], `Every day the vault learned something in the last 26 weeks: notes written and changed${p.extraNumbers?.length ? ", documents filed" : ""}.`)}<div class="heat-box" data-unit="updates"><div class="heat-frame"><div class="heat-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div><div class="heat-wrap"><div class="heat-months" aria-hidden="true"></div><div class="heat" tabindex="0" aria-label="Activity, last 26 weeks. Use arrow keys to move between days." aria-describedby="heat-read">${'<i style="visibility:hidden"></i>'.repeat(pad)}${p.heat.map(c => `<i class="l${lvl(c.n)}" data-d="${esc(c.date)}" data-n="${c.n}"></i>`).join("")}</div></div></div><div class="heat-tip" hidden></div><div class="heat-foot"><div class="heat-read" id="heat-read" aria-live="polite"></div><div class="heat-legend">less <i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</div></div></div>`);
  }
  const growthOn = s.growth !== false && (p.growth?.length || 0) > 1, knowsOn = s.knows !== false && !!p.knows?.length;
  if (growthOn || knowsOn) {
    let g = "";
    if (growthOn) {
      const gp = p.growth!, gmax = Math.max(1, gp[gp.length - 1].total), W = 600, H = 180;
      const gx = (i: number) => 30 + i * (W - 40) / Math.max(1, gp.length - 1), gy = (v: number) => 10 + (H - 30) * (1 - v / gmax);
      const line = gp.map((x, i) => `${gx(i).toFixed(1)},${gy(x.total).toFixed(1)}`).join(" ");
      const first = new Date(gp[0].week + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      g = `<div>${head("Growth", ["obsidian"], "Notes in the vault over time.")}<svg class="growth" viewBox="0 0 ${W} ${H}" role="img" aria-label="Notes over time, ${fmt(gmax)} now"><line class="axis" x1="30" y1="${H - 20}" x2="${W - 10}" y2="${H - 20}"></line><path class="area" d="M${gx(0).toFixed(1)},${H - 20} L${line.replace(/ /g, " L")} L${gx(gp.length - 1).toFixed(1)},${H - 20} Z"></path><polyline class="line" points="${line}"></polyline><circle class="now" cx="${gx(gp.length - 1).toFixed(1)}" cy="${gy(gmax).toFixed(1)}" r="5"></circle><text x="30" y="${H - 4}">${esc(first)}</text><text x="${W - 10}" y="${H - 4}" text-anchor="end">${fmt(gmax)} notes</text></svg></div>`;
    }
    const kmax = Math.max(1, ...(p.knows || []).map(k => k[1]));
    const k = knowsOn ? `<div>${head("What it knows", ["obsidian"], "Notes in the vault, by subject.")}${p.knows!.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>` : "";
    parts.push(`<div class="two-col">${g}${k}</div>`);
  }
  if (s.inbox !== false && p.inbox?.kinds?.length) {
    const ib = p.inbox, kmax = Math.max(1, ...ib.kinds.map(k => k[1])), total = ib.total ?? ib.kinds.reduce((a, k) => a + k[1], 0);
    const se = ib.series, smax2 = Math.max(1, ...(se?.weeks || []).map(w => w[1]));
    parts.push(`${head("Inbox to knowledge", ["obsidian"], esc(ib.note || `Every email attachment is read, summarized and linked into the vault overnight. ${fmt(total)} documents so far, by kind. Contents stay private.`))}<div class="two-col"><div>${ib.kinds.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill alt" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>${se?.weeks?.length ? `<div><div class="label">${esc(se.label)} / ${fmt(se.weeks.reduce((a, w) => a + w[1], 0))} in ${se.weeks.length} weeks</div><div class="cols">${se.weeks.map(([l, n]) => `<span title="${esc(l)}: ${n}"><b style="height:${Math.max(3, n / smax2 * 100).toFixed(1)}%"></b><em>${n || ""}</em></span>`).join("")}</div><div class="bars-legend"><span>${esc(se.weeks[0][0])}</span><span>this week</span></div></div>` : ""}</div>`);
  }
  if (s.topics && p.topics.length) parts.push(`${(gh ? head("Topics", ["github"], "Repo topics and languages, from public repos.") : em ? head("Topics", ["self"], "What they work on.") : head("Topics", ["obsidian"], "The tags used most in the vault."))}<div class="cloud">${p.topics.map(([t, n]) => `<span style="font-size:${(13 + n / tmax * 15).toFixed(1)}px">${esc(t)}<sup>${n}</sup></span>`).join("")}</div>`);
  if (s.projects !== false && p.projects?.length) {
    const hasC = p.projects.some(x => x.commits);
    parts.push(`${gh ? head("Projects", ["github"], "Public repositories with the most commits.") : em ? head("Projects", ["self"], "What they're building, with the number of updates on each.") : head("Projects", hasC ? ["obsidian", "github"] : ["obsidian"], `Notes in the vault's Projects folder${hasC ? ", with commit counts from GitHub" : ""}.`) + `<div class="query">TABLE status, ${hasC ? "commits, " : ""}link FROM "Projects" SORT ${hasC ? "commits DESC" : "file.name"}</div>`}<div class="table-wrap"><table class="data"><thead><tr><th>File</th><th>status</th>${hasC ? `<th class="num">${em ? "updates" : "commits"}</th>` : ""}<th>link</th></tr></thead><tbody>${p.projects.map(x => `<tr><td>${/^https?:\/\//.test(x.url) ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}</td><td>${esc(x.status)}</td>${hasC ? `<td class="num">${x.commits ? fmt(x.commits) : ""}</td>` : ""}<td>${/^https?:\/\//.test(x.url) ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</td></tr>`).join("")}</tbody></table></div>`);
  }
  if (s.code !== false && p.code && p.code.commits > 0) {
    const c = p.code, wk = c.weekly || [], f = Math.max(0, Math.min(wk.findIndex(x => x > 0), wk.length - 26)), w2 = [...Array(Math.max(0, 26 - wk.length)).fill(0), ...wk.slice(f)], peak = Math.max(1, ...w2);
    parts.push(`${head("Code", ["github"], "Commits and languages, from GitHub.")}<p class="small"><b>${fmt(c.commits)}</b> commits across <b>${fmt(c.repos)}</b> repositories in the last year.${c.languages?.length ? ` Mostly ${esc(c.languages.slice(0, -1).join(", "))}${c.languages.length > 1 ? " and " : ""}${esc(c.languages[c.languages.length - 1])}.` : ""}${c.url && /^https?:\/\//.test(c.url) ? ` <a href="${esc(c.url)}" rel="noopener">${esc(c.url.replace(/^https?:\/\//, ""))}</a>` : ""}</p>${w2.length ? `<div class="bars" role="img" aria-label="Commits per week">${w2.map(x => `<span class="${x >= peak * .5 ? "" : "quiet"}" style="height:${Math.max(2, x / peak * 100).toFixed(1)}%" title="${x}"></span>`).join("")}</div><div class="bars-legend"><span>${esc(c.start || "")}</span><span>peak week: ${fmt(peak)}</span><span>this week</span></div>` : ""}`);
  }
  if (s.ai !== false && p.ai && p.ai.total > 0) {
    const a = p.ai, td = days.map(d => ({ date: d.date, n: d.tokens || 0 })), tpeak = Math.max(1, ...td.map(x => x.n));
    const share = (n: number) => a.total ? Math.round(n / a.total * 1000) / 10 : 0;
    const bars = (rows: [string, number][], alt = false) => { const m = Math.max(1, ...rows.map(r => r[1])); return rows.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill${alt ? " alt" : ""}" style="width:${(n / m * 100).toFixed(1)}%"></span></span><span class="num" title="${fmt(n)} tokens">${share(n) >= 0.1 ? share(n) + "%" : "&lt;0.1%"}</span></div>`).join(""); };
    parts.push(`${head("AI usage", ["agents"], "Tokens used by AI models and coding agents.")}<p class="small"><b>${big(a.total)}</b> tokens across <b>${a.models.length}</b> model${a.models.length === 1 ? "" : "s"} in the last ${a.window_days || td.length} days.${a.note ? ` <span class="muted">${esc(a.note)}</span>` : ""}</p>${td.some(x => x.n) ? `<div class="bars" role="img" aria-label="AI tokens per day">${td.map(x => `<span class="${x.n >= tpeak * .5 ? "" : "quiet"}" style="height:${Math.max(2, x.n / tpeak * 100).toFixed(1)}%" title="${esc(x.date)}: ${big(x.n)} tokens"></span>`).join("")}</div><div class="bars-legend"><span>${esc(td[0]?.date || "")}</span><span>peak day: ${big(tpeak)}</span><span>today</span></div>` : ""}<div class="two-col" style="margin-top:var(--space-4)"><div><div class="label">Models / share of tokens</div>${bars(a.models)}</div>${a.providers?.length ? `<div><div class="label">Providers</div>${bars(a.providers, true)}</div>` : ""}</div>${a.sources && a.sources.length > 1 ? `<div style="margin-top:var(--space-4)"><div class="label">Where the tokens come from</div>${bars(a.sources, true)}</div>` : ""}`);
  }
  if (s.timeline !== false && p.timeline?.length) parts.push(`${(gh ? head("Timeline", ["github"], "Milestones from public GitHub: joining, then the repos that stand out.") : em ? head("Timeline", ["self"], "Milestones.") : head("Timeline", ["profile"], "Milestones, from the profile note."))}<div class="timeline">${timelineRows(p.timeline)}</div>`);
  if ((gardenEnabled() && s.garden !== false) && (p.garden?.length || p.gardenExternal)) parts.push(gardenSection(p.garden || [], p.gardenExternal));
  if (s.notes && p.publicNotes.length) parts.push(`${head("Notes", ["obsidian"], "Notes published from the vault.")}${p.publicNotes.map(n => `<div class="pnote" id="${slug("note-" + n.title)}"><div class="pn-title">${esc(n.title)}</div><div class="pn-ex">${esc(n.excerpt)}</div><div class="pn-date">${esc(n.updated.slice(0, 10))}</div></div>`).join("")}`);
  // the help exchange (asks, offers, help credits) and the friends / gravity / credits strip are retired: the hub shows
  // friends, followers and following under the name
  if (s.links && p.links.length) parts.push(`${head("Elsewhere", [gh ? "github" : em ? "self" : "profile"], "Other places on the web.")}<ul class="bullets">${p.links.map(([l, u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(l)}</a></li>`).join("")}</ul>`);
  parts.push(`<div class="foot">${gh ? "Built from GitHub" : em ? "Made" : "Grown from an Obsidian vault"} with Caldera. Updated ${esc(p.updated.slice(0, 16).replace("T", " "))} UTC. <a href="${esc((p.hub || "https://caldera.social").replace(/\/$/, ""))}/guide.html" target="_blank" rel="noopener">Your page? How to edit it</a></div></div></main>`);
  if (railOn) parts.push(`<aside class="rail">${p.graph?.length ? `<div class="graph"><div class="label">${esc(p.graphLabel || "Graph")}</div>${graphSvg(p.graph, p.name)}</div>` : ""}${p.backlinks?.length ? `<div><div class="label">${esc(p.backlinkLabel || "Backlinks")}</div>${p.backlinks.map(([t, c]) => `<div class="backlink"><span>${esc(t)}</span><div class="ctx">${esc(c)}</div></div>`).join("")}</div>` : ""}${sideMods.map(m => `<div class="module side" data-module="${esc(m.slug)}"><div class="label">${esc(m.title)}</div><div class="mod-body">${m.html}</div></div>`).join("")}</aside>`);
  parts.push(`</div>`);
  parts.push(`<script>${CLIENT_JS}</script></body></html>`);
  // every h2 gets an anchor; the sidebar's "On this page" lists them (journal + scoreboard first)
  const toc: [string, string][] = [];
  if (s.journal && journal.length) toc.push(["journal", "Daily journal"]);
  if (s.scoreboard && days.length > 2) toc.push(["scoreboard", "Scoreboard"]);
  const seen = new Set<string>();
  let html = parts.join("\n").replace(/<h2>([^<]+)<\/h2>/g, (_m, t: string) => { let id = slug(t); while (seen.has(id)) id += "-2"; seen.add(id); toc.push([id, t]); return `<h2 id="${id}">${t}</h2>`; });
  html = html.replace("%%TOC%%", toc.length > 2 ? `<span class="label">On this page</span><div class="toc">${toc.map(([id, t]) => `<a class="tree-row toc-row" href="#${id}">${t}</a>`).join("")}</div>` : "");
  const garden = (gardenEnabled() && s.garden !== false) && p.garden?.length
    ? renderGarden({ name: p.name, handle: p.handle, hub: p.hub, icon: p.icon, theme: p.theme, id: p.id, external: p.gardenExternal, nav: (d, cur) => nav(d, cur) }, p.garden, p.gardenImages) : {};
  const city: Record<string, string> = s.city !== false && p.city?.districts.length
    ? { "city.html": renderCity({ name: p.name, handle: p.handle, theme: p.theme, icon: p.icon, github: githubOf(p), nav: (d, cur) => nav(d, cur) }, p.city) } : {};
  const out: Record<string, string> = { ...garden, ...city, "index.html": html, "assets/theme.css": THEME_CSS as string, "assets/profile.css": PROFILE_CSS, "assets/favicon.svg": LOGO_SVG };
  // every link that leaves the hub opens in a new window
  let own = "caldera.social"; try { own = new URL(p.hub || "https://caldera.social").host; } catch { /* default hub */ }
  for (const k of Object.keys(out)) if (k.endsWith(".html")) out[k] = externalLinksNewWindow(out[k], [own]);
  return out;
}

/** The standard left nav, identical on the profile, the garden home and every garden note: a Pages block (profile,
 * garden home) then the vault tree. depth = how many folders below the profile root the page sits (n/ pages = 1);
 * current = the page's own href from the root ("index.html", "garden.html", "n/<slug>.html"). */
export function navSidebar(p: ProfileData, sideOn: boolean, gardenOn: boolean, depth: number, current: string, toc = ""): string {
  const up = "../".repeat(depth), onProfile = current === "index.html";
  // hrefs in the tree are written from the profile root; rebase them for this page
  const fix = (h: string) => /^https?:\/\//.test(h) ? h : h.startsWith("#") ? (onProfile ? h : `${up}index.html${h}`) : up + h;
  const pages: [string, string][] = [["index.html", p.name || "Profile"]];
  if (gardenOn) pages.push(["garden.html", "Garden home"]);
  // World sits just above City: one click up to the whole map, flying to this person's neighborhood
  if (p.handle) pages.push([`${(p.hub || "https://caldera.social").replace(/\/$/, "")}/world?focus=${encodeURIComponent(p.handle)}`, "World"]);
  if (p.sections?.city !== false && p.city?.districts.length) pages.push(["city.html", "City"]);
  const pageRows = pages.map(([h, l]) => `<a class="tree-row toc-row page-row${h === current ? " is-active" : ""}" href="${/^https?:\/\//.test(h) ? h : onProfile && h === "index.html" ? "#top" : up + h}"${h === current ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("");
  // the hub turns this into an inline Add friend for signed-in visitors (and Friends / Requested / Accept states); the
  // href is the hub's fallback page for anyone without scripts
  const hubBase = (p.hub || "https://caldera.social").replace(/\/$/, "");
  const friend = p.handle ? `<a class="tree-row toc-row page-row friend-row" href="${esc(hubBase)}/kudos/${encodeURIComponent(p.handle)}" data-caldera-friend="${esc(p.handle)}" target="_blank" rel="noopener" title="Send @${esc(p.handle)} a friend request">+ Follow @${esc(p.handle)}</a>` : "";
  const tree = sideOn && p.tree?.length ? `<span class="label">Vault</span>${sidebarTree(p.tree.map(r => ({ ...r, current: (r.href === "#top" && onProfile) || (!!r.href && r.href === current) })), fix)}` : "";
  return `<nav class="sidebar tree" aria-label="Navigation"><div class="side-inner"><span class="label">Pages</span><div class="toc pages">${pageRows}${friend}</div>${toc}${tree}</div></nav>`;
}

/** Vault groups: collapsible (native <details>, works without script), linked items, optional note count.
 * A group row with an href (e.g. Garden -> garden.html) links its name; the caret still opens and closes it. */
function sidebarTree(rows: NonNullable<ProfileData["tree"]>, fix: (h: string) => string = h => h): string {
  const out: string[] = []; let open = false;
  const ok = (h?: string) => !!h && /^(https?:\/\/|#[\w-]+$|garden\.html$|n\/[a-z0-9-]+\.html$)/.test(h);
  const item = (r: (typeof rows)[number]) => {
    const cls = `tree-row child${r.current ? " is-current" : ""}${r.href ? " is-link" : ""}`;
    if (!ok(r.href)) return `<div class="tree-row child${r.current ? " is-current" : ""}"><span>${esc(r.name)}</span></div>`;
    const ext = /^https?:\/\//.test(r.href!);
    return `<a class="${cls}" href="${esc(fix(r.href!))}"${ext ? ' target="_blank" rel="noopener"' : ""}${r.current ? ' aria-current="page"' : ""}><span>${esc(r.name)}</span>${ext ? '<span class="ext" aria-hidden="true">&#8599;</span>' : ""}</a>`;
  };
  const gname = (r: (typeof rows)[number]) => ok(r.href) && !/^https?:/.test(r.href!) ? `<a class="g-name g-link" href="${esc(fix(r.href!))}">${esc(r.name)}</a>` : `<span class="g-name">${esc(r.name)}</span>`;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.child) { out.push(item(r)); continue; }
    if (open) { out.push(`</details>`); open = false; }
    const kids = rows.slice(i + 1).findIndex(x => !x.child), n = kids < 0 ? rows.length - i - 1 : kids;
    const count = r.count != null ? `<span class="count" title="${r.count} notes">${fmt(r.count)}</span>` : n ? `<span class="count">${n}</span>` : "";
    if (!n) { out.push(`<div class="tree-row group leaf"><span class="caret" aria-hidden="true"></span>${gname(r)}${count}</div>`); open = false; continue; }
    out.push(`<details class="tree-group" open><summary class="tree-row group"><span class="caret" aria-hidden="true"></span>${gname(r)}${count}</summary>`);
    open = true;
  }
  if (open) out.push(`</details>`);
  return out.join("");
}

/** Split "text | detail" on the last " | " outside [[Label|url]] links. */
function splitDetail(t: string): [string, string] {
  const masked = t.replace(/\[\[[^\]]*\]\]/g, m => "x".repeat(m.length)), i = masked.lastIndexOf(" | ");
  return i < 0 ? [t, ""] : [t.slice(0, i).trim(), t.slice(i + 3).trim()];
}

/** Timeline: "year | text | optional detail"; "era | Name | 1995-2006" starts a section. A repeated year shows once. */
function timelineRows(rows: [string, string][]): string {
  let prev = "";
  return rows.map(([y, t]) => {
    const [main, detail] = splitDetail(t);
    if (y.trim().toLowerCase() === "era") { prev = ""; return `<div class="era"><span class="era-name">${inline(main)}</span>${detail ? `<span class="era-range">${esc(detail)}</span>` : ""}</div>`; }
    const same = y === prev; prev = y;
    return `<div class="row${same ? " same" : ""}"><span class="year">${same ? "" : esc(y)}</span><span class="dot" aria-hidden="true"></span><div class="what"><div>${inline(main)}</div>${detail ? `<div class="detail">${inline(detail)}</div>` : ""}</div></div>`;
  }).join("");
}

/** Caldera mark, the tab icon for pages without a photo. Same as caldera.social/favicon.svg. */
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1C1C1F"/><path d="M4 25 L12 10 L15 15 L18 8 L28 25 Z" fill="#8B6CF6"/><circle cx="16" cy="21" r="2.4" fill="#4FB89A"/></svg>';

/** Tiny client script: "synced ago" + flippable journal. */
/** Activity heatmap: instant date tooltip, readout that rolls back to today, month labels, click to pin, arrow keys. */
const HEAT_JS = "(function(){var g=document.querySelector('.heat');if(!g)return;var box=g.closest('.heat-box');if(!box)return;\nvar tip=box.querySelector('.heat-tip'),rd=box.querySelector('.heat-read'),mo=box.querySelector('.heat-months');\nvar cells=[].slice.call(g.querySelectorAll('i[data-d]'));if(!cells.length)return;var unit=box.getAttribute('data-unit')||'updates';\nvar D=function(s){return new Date(s+'T12:00:00')};\nvar fd=function(s){return D(s).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})};\nvar amt=function(c){var n=+c.getAttribute('data-n');return n?n.toLocaleString('en-US')+' '+(n===1?unit.replace(/s$/,''):unit):'No activity'};\nvar today=cells[cells.length-1],cur=null,pin=null;today.classList.add('is-today');\nfunction months(){if(!mo)return;mo.innerHTML='';var last=-1,lm=-1;cells.forEach(function(c){var x=c.offsetLeft-g.offsetLeft;if(x===last)return;last=x;var m=D(c.getAttribute('data-d')).getMonth();if(m!==lm){if(x<=g.offsetWidth-26&&(lm>=0||D(c.getAttribute('data-d')).getDate()<=7)){var s=document.createElement('span');s.textContent=D(c.getAttribute('data-d')).toLocaleDateString('en-US',{month:'short'});s.style.left=x+'px';mo.appendChild(s)}lm=m}})}months();\nfunction sel(c,show){if(cur)cur.classList.remove('is-sel');cur=c;c.classList.add('is-sel');\nrd.textContent='';var b=document.createElement('b');b.textContent=(c===today?'Today, ':'')+fd(c.getAttribute('data-d'));rd.appendChild(b);rd.appendChild(document.createTextNode(' \u00b7 '+amt(c)));\nif(!show){tip.hidden=true;return}tip.textContent=fd(c.getAttribute('data-d'))+' \u00b7 '+amt(c);tip.hidden=false;\nvar r=c.getBoundingClientRect(),br=box.getBoundingClientRect(),w=tip.offsetWidth,x=r.left-br.left+r.width/2;var cx=x;x=Math.max(w/2,Math.min(br.width-w/2,x));tip.style.left=x+'px';tip.style.setProperty('--ax',(cx-x)+'px');tip.style.top=(r.top-br.top)+'px'}\nvar wr=g.parentNode;if(wr.scrollWidth>wr.clientWidth)wr.scrollLeft=wr.scrollWidth;\nsel(today,false);\nvar at=function(e){return e.target.closest?e.target.closest('i[data-d]'):null};\ng.addEventListener('mouseover',function(e){var c=at(e);if(c)sel(c,true)});\ng.addEventListener('mouseleave',function(){sel(pin||today,false)});\ng.addEventListener('click',function(e){var c=at(e);if(!c)return;pin=pin===c?null:c;g.querySelectorAll('.is-pin').forEach(function(x){x.classList.remove('is-pin')});if(pin)pin.classList.add('is-pin');sel(c,true)});\ng.addEventListener('keydown',function(e){var k={ArrowLeft:-7,ArrowRight:7,ArrowUp:-1,ArrowDown:1,Home:-1e6,End:1e6}[e.key];if(k==null){if(e.key==='Escape'){e.stopPropagation();pin=null;sel(today,false)}return}e.preventDefault();e.stopPropagation();var i=cells.indexOf(cur);sel(cells[Math.max(0,Math.min(cells.length-1,i+k))],true)});\ng.addEventListener('focus',function(){sel(cur||today,true)});g.addEventListener('blur',function(){tip.hidden=true});\nwindow.addEventListener('resize',function(){tip.hidden=true;months()})})();";

/** Invite panel behaviour (see invitePop). */
const INVITE_JS = "(function(){var pop=document.querySelector('.invite-pop');if(!pop)return;var btns=[].slice.call(document.querySelectorAll('[data-invite]'));if(!btns.length)return;\nvar url=pop.getAttribute('data-url'),msg=pop.getAttribute('data-msg'),subj=pop.getAttribute('data-subject')||'Join me on Caldera';\nvar inp=pop.querySelector('.inv-url'),cp=pop.querySelector('.inv-copy'),em=pop.querySelector('.inv-email'),tx=pop.querySelector('.inv-text'),sh=pop.querySelector('.inv-share'),st=pop.querySelector('.inv-status'),x=pop.querySelector('.inv-close');\ninp.value=url;var body=msg+'\\n\\n'+url;em.href='mailto:?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);tx.href='sms:?&body='+encodeURIComponent(msg+' '+url);\nvar canShare=!!(navigator.share&&(!navigator.canShare||navigator.canShare({url:url})));if(!canShare)sh.hidden=true;\nvar host=pop.parentNode,from=null;\nfunction say(t){st.textContent=t;clearTimeout(say.t);say.t=setTimeout(function(){st.textContent=''},2600)}\nfunction open(b){from=b;pop.hidden=false;var hr=host.getBoundingClientRect(),r=b.getBoundingClientRect();pop.style.top=(r.bottom-hr.top+8)+'px';var l=r.left-hr.left;pop.style.left=Math.max(0,Math.min(hr.width-pop.offsetWidth,l))+'px';btns.forEach(function(x){x.setAttribute('aria-expanded',x===b?'true':'false')});cp.focus()}\nfunction close(back){if(pop.hidden)return;pop.hidden=true;btns.forEach(function(x){x.setAttribute('aria-expanded','false')});if(back&&from)from.focus()}\nbtns.forEach(function(b){b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');b.addEventListener('click',function(e){e.preventDefault();if(!pop.hidden&&from===b)close(true);else open(b)})});\nfunction fallback(){inp.focus();inp.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}say(ok?'Link copied':'Press Ctrl/Cmd+C to copy')}\ncp.addEventListener('click',function(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){say('Link copied')},fallback)}else fallback()});\ninp.addEventListener('focus',function(){inp.select()});\nsh.addEventListener('click',function(){navigator.share({title:subj,text:msg,url:url}).catch(function(e){if(e&&e.name!=='AbortError'){sh.hidden=true;say('Sharing is not available here. Copy the link instead.')}})});\nx.addEventListener('click',function(){close(true)});\ndocument.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pop.hidden){e.stopPropagation();close(true)}},true);\ndocument.addEventListener('click',function(e){if(!pop.hidden&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest('[data-invite]')))close(false)});\nwindow.addEventListener('resize',function(){close(false)})})();";

const CLIENT_JS = INVITE_JS + "\n" + HEAT_JS + "\n" + `(function(){var L=[].slice.call(document.querySelectorAll('.toc:not(.pages) a'));if(!L.length||!window.IntersectionObserver)return;var by={};L.forEach(function(a){by[a.getAttribute('href').slice(1)]=a});var cur;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(cur)cur.classList.remove('is-active');cur=by[e.target.id];if(cur){cur.classList.add('is-active');var t=cur.parentNode;if(t.scrollWidth>t.clientWidth)t.scrollLeft=cur.offsetLeft-t.clientWidth/2+cur.offsetWidth/2}}})},{rootMargin:'0px 0px -70% 0px'});Object.keys(by).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)})})();
(function(){var a=document.getElementById('ago');if(a){var t=Date.parse(a.dataset.ts);var f=function(){var m=Math.max(0,Math.round((Date.now()-t)/60000));a.textContent=m<60?m+'m ago':Math.floor(m/60)+'h '+(m%60)+'m ago'};f();setInterval(f,30000)}
var el=document.getElementById('journal-data');if(!el)return;var days=JSON.parse(el.textContent);if(!days.length)return;var i=Math.max(0,days.length-2);
var body=document.getElementById('jbody'),dt=document.getElementById('jdate'),pv=document.getElementById('jprev'),nx=document.getElementById('jnext');
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var dl=function(d){return d==null?'':d>0?'<span class="up">&#9650; '+d+'</span>':d<0?'<span class="down">&#9660; '+(-d)+'</span>':'<span class="flat">=</span>'};
var mx=Math.max.apply(null,days.map(function(x){return x.score}).concat([1]));
function r(dir){var d=days[i],L=days.length;dt.textContent=(i===L-1?'Today so far / ':i===L-2?'Yesterday / ':'')+d.label;var C=2*Math.PI*42,p=Math.min(1,d.score/mx);
var sd=d.delta==null?'':(d.delta>=0?'<span class="up">&#9650; '+d.delta+'%</span>':'<span class="down">&#9660; '+(-d.delta)+'%</span>')+' vs day before';
var h='<div class="j-top"><div class="ring-wrap"><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="42"></circle><circle class="val" cx="50" cy="50" r="42" style="stroke-dasharray:'+C+';stroke-dashoffset:'+(C*(1-p))+'"></circle></svg><div class="j-score"><div class="v">'+d.score+'</div><div class="l">score</div></div></div>'+
'<div class="j-headline">'+(sd?'<div class="j-delta">'+sd+'</div>':'')+(d.headline?esc(d.headline):'<span class="muted">No journal for this day. Activity only.</span>')+(d.themes.length?'<div class="j-themes">'+d.themes.map(function(t){return'<span>'+esc(t)+'</span>'}).join('')+'</div>':'')+'</div></div>';
if(d.chips.length)h+='<div class="j-chips">'+d.chips.map(function(c){return'<div class="chip"><div class="v">'+c.v+'</div><div class="l">'+esc(c.k)+'</div><div class="dd">'+dl(c.d)+'</div></div>'}).join('')+'</div>';
if(d.focus.length||d.wins.length){h+='<div class="two-col j-lists">';if(d.focus.length)h+='<div><div class="label">Focus</div><ul class="bullets">'+d.focus.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul></div>';if(d.wins.length)h+='<div><div class="label">Wins</div><ul class="bullets">'+d.wins.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ul></div>';h+='</div>'}
body.innerHTML=h;body.classList.remove('flip-l','flip-r');void body.offsetWidth;if(dir)body.classList.add(dir<0?'flip-l':'flip-r');pv.disabled=i===0;nx.disabled=i===L-1}
pv.onclick=function(){if(i>0){i--;r(-1)}};nx.onclick=function(){if(i<days.length-1){i++;r(1)}};document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')pv.onclick();if(e.key==='ArrowRight')nx.onclick()});r(0)})();`;

/** The owner's city (every repo, private ones included) with the same nav as the public pages. Never published. */
/** The owner's GitHub profile, when the page links one (Links, or the code section's source). */
function githubOf(p: ProfileData): string | undefined {
  const ok = (u?: string) => !!u && /^https:\/\/github\.com\/[\w.-]+\/?$/.test(u);
  const l = (p.links || []).find(x => /github/i.test(x[0]) && ok(x[1]));
  return l ? l[1] : ok(p.code?.url) ? p.code!.url : undefined;
}

export function renderPrivateCity(p: ProfileData, city: CityData, openBase = ""): string {
  const q = { ...p, city: p.city?.districts.length ? p.city : city };   // the nav shows City even when nothing is public
  const sideOn = p.sections.sidebar !== false && !!p.tree?.length, gardenOn = gardenEnabled() && p.sections.garden !== false && !!p.garden?.length;
  return renderCity({ name: p.name, handle: p.handle, theme: p.theme, icon: p.icon, openBase, github: githubOf(p), nav: (d, cur) => p.sections.sidebar === false ? "" : navSidebar(q, sideOn, gardenOn, d, cur) }, city);
}
