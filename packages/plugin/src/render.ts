/**
 * Pure profile renderer: ProfileData -> static files (index.html + CSS).
 * No Obsidian imports, so it is unit-testable in Node and reusable by self-hosters.
 * Restyle everything via assets/theme.css (design tokens only).
 */
// @ts-ignore - esbuild loads .css as text via the define below
import THEME_CSS from "./assets/theme.css";
import { PROFILE_CSS } from "./profile.css";
import { activityScore, ACTIVITY_WEIGHTS, type DailyCounts } from "@caldera/core";

export interface DailyEntry { date: string; counts: DailyCounts; tokens?: number; headline?: string; focus?: string[]; wins?: string[]; themes?: string[]; }
export interface ProfileData {
  name: string; handle?: string; headline?: string; theme?: "dark" | "light";
  avatar?: string; banner?: string;                       // relative paths inside the bundle, e.g. img/avatar.jpg
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
  tree?: { name: string; child: boolean; current?: boolean }[];   // left sidebar
  graph?: { t: string; n: number }[]; graphLabel?: string;        // right rail graph (counts only)
  backlinks?: [string, string][]; backlinkLabel?: string;         // right rail list
  // owner-written (Caldera/profile.md)
  summary?: string; now?: string[]; timeline?: [string, string][];
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
  ai?: { total: number; window_days?: number; models: [string, number][]; providers?: [string, number][]; note?: string };   // AI tokens, counts only
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

export function renderProfile(p: ProfileData): Record<string, string> {
  const s = p.sections;
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
<link rel="stylesheet" href="assets/theme.css"><link rel="stylesheet" href="assets/profile.css"></head><body>
<div class="tabs"><span class="tab is-active">${esc(p.name)}.md</span>${(p.tabs || []).map(t => `<span class="tab">${esc(t)}</span>`).join("")}<span class="spacer"></span><span class="sync"><span class="dot"></span>synced from vault <span id="ago" data-ts="${esc(p.updated)}">just now</span></span></div>
<div class="shell">`);
  const sideOn = s.sidebar !== false && !!p.tree?.length, railOn = s.rail !== false && (!!p.graph?.length || !!p.backlinks?.length);
  if (sideOn) parts.push(`<nav class="sidebar tree" aria-label="Vault"><span class="label">Vault</span>${p.tree!.map(r => `<div class="tree-row${r.child ? " child" : ""}${r.current ? " is-current" : ""}"><span>${r.child ? "" : "&#9662; "}${esc(r.name)}</span></div>`).join("")}</nav>`);
  parts.push(`<main class="note">`);
  if (p.banner || p.avatar) parts.push(`<div class="banner">${p.banner ? `<img class="cover" src="${esc(p.banner)}" alt="">` : ""}${p.avatar ? `<img class="avatar" src="${esc(p.avatar)}" alt="${esc(p.name)}">` : ""}</div>`);
  parts.push(`<div class="page"><div class="crumb">People / ${esc(p.name)}.md${p.handle ? " / @" + esc(p.handle) : ""}</div>
<h1 class="title">${esc(p.name)}<span class="caret">|</span></h1>${p.headline ? `<p class="lede">${esc(p.headline)}</p>` : ""}`);

  if (s.journal && journal.length) parts.push(`<section class="journal" aria-label="Daily journal"><div class="j-head"><button class="j-nav" id="jprev" aria-label="Previous day">&#8249;</button>
<div class="j-title"><div class="label">Daily journal</div><div class="j-date" id="jdate"></div></div><button class="j-nav" id="jnext" aria-label="Next day">&#8250;</button></div>
<div class="j-body" id="jbody" aria-live="polite"></div></section><script id="journal-data" type="application/json">${JSON.stringify(journal).replace(/</g, "\\u003c")}</script>`);

  if (s.scoreboard && days.length > 2) parts.push(`<section class="scoreboard"><div class="sb-stats">
<div class="sb-stat"><div class="v">${streak}<small> days</small></div><div class="l">active streak</div></div>
<div class="sb-stat"><div class="v">#${yrank}</div><div class="l">yesterday's rank of ${days.length - 1} days</div></div>
<div class="sb-stat"><div class="v">${avg(last7)}</div><div class="l">7-day average, ${trend >= 0 ? `<span class="up">&#9650; ${trend}%</span>` : `<span class="down">&#9660; ${-trend}%</span>`} vs prior week</div></div></div>
<div class="sb-bars" role="img" aria-label="Daily activity score">${days.slice(-30).map((d, i, a) => `<span class="${i === a.length - 2 ? "yday" : i === a.length - 1 ? "today" : ""}" style="height:${Math.max(2, Math.round(d.score / smax * 100))}%" title="${d.date}: ${d.score}"></span>`).join("")}</div><div class="bars-legend"><span>${Math.min(30, days.length)} days ago</span><span>yesterday highlighted / today in progress</span></div>
${(() => { const best = days.slice(0, -2).map((d, i) => ({ d, i })).sort((a, b) => b.d.score - a.d.score).slice(0, 5);
    const lb = [`<div class="lb-row me"><span class="rank">1</span><span class="who">You</span><span class="num">${fmt(days.slice(-8, -1).reduce((x, d) => x + d.score, 0))}</span></div>`]
      .concat([2, 3, 4].map(r => `<div class="lb-row empty"><span class="rank">${r}</span><a class="who" href="${esc(inviteHref(p))}" target="_blank" rel="noopener">Invite a friend</a><span class="num">-</span></div>`));
    return `<div class="two-col sb-lower"><div><div class="label">Leaderboard / points this week</div>${lb.join("")}</div><div><div class="label">Your best other days</div>${best.map((b, k) => `<div class="lb-row"><span class="rank">${k + 1}</span><span class="who">${esc(new Date(b.d.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }))}</span><span class="num">${b.d.score}</span></div>`).join("")}</div></div>`; })()}
<details class="sb-how"><summary>How the score works</summary>Weighted daily counts: ${Object.entries(ACTIVITY_WEIGHTS).map(([k, w]) => `${labels[k] || k} x${w}`).join(", ")}. Bulk imports are capped. Counts only.</details></section>`);

  if (s.properties && p.properties.length) parts.push(`<dl class="props">${p.properties.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`);
  if (s.numbers) parts.push(`<div class="stat-strip">${[[fmt(p.stats.notes), "notes"], [(p.stats.words / 1e6).toFixed(2) + "M", "words"], [fmt(p.stats.links), "links between notes"], [String(p.stats.activeDays), "active days, 26 weeks"], ...(p.extraNumbers || [])].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.summary !== false && p.summary) parts.push(`<div class="callout"><div class="callout-title">Summary</div>${inline(p.summary)}</div>`);
  if (s.now !== false && p.now?.length) parts.push(`<h2>Now</h2><ul class="bullets">${p.now.map(x => `<li>${inline(x)}</li>`).join("")}</ul>`);
  if (s.activity !== false && p.heat?.length) {
    const lvl = (n: number) => n === 0 ? 0 : n < 5 ? 1 : n < 30 ? 2 : n < 200 ? 3 : 4;
    const pad = (new Date(p.heat[0].date + "T12:00:00Z").getUTCDay() + 6) % 7;
    parts.push(`<h2>Activity</h2><p class="small muted">Every day the vault learned something in the last 26 weeks: notes written and changed${p.extraNumbers?.length ? ", documents filed" : ""}.</p><div class="heat-wrap"><div class="heat" role="img" aria-label="Activity, last 26 weeks">${"<i></i>".repeat(pad).replace(/<i>/g, '<i style="visibility:hidden">')}${p.heat.map(c => `<i class="l${lvl(c.n)}" title="${esc(c.date)}: ${c.n}"></i>`).join("")}</div></div><div class="heat-legend">less <i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> more</div>`);
  }
  const growthOn = s.growth !== false && (p.growth?.length || 0) > 1, knowsOn = s.knows !== false && !!p.knows?.length;
  if (growthOn || knowsOn) {
    let g = "";
    if (growthOn) {
      const gp = p.growth!, gmax = Math.max(1, gp[gp.length - 1].total), W = 600, H = 180;
      const gx = (i: number) => 30 + i * (W - 40) / Math.max(1, gp.length - 1), gy = (v: number) => 10 + (H - 30) * (1 - v / gmax);
      const line = gp.map((x, i) => `${gx(i).toFixed(1)},${gy(x.total).toFixed(1)}`).join(" ");
      const first = new Date(gp[0].week + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
      g = `<div><h2>Growth</h2><svg class="growth" viewBox="0 0 ${W} ${H}" role="img" aria-label="Notes over time, ${fmt(gmax)} now"><line class="axis" x1="30" y1="${H - 20}" x2="${W - 10}" y2="${H - 20}"></line><path class="area" d="M${gx(0).toFixed(1)},${H - 20} L${line.replace(/ /g, " L")} L${gx(gp.length - 1).toFixed(1)},${H - 20} Z"></path><polyline class="line" points="${line}"></polyline><circle class="now" cx="${gx(gp.length - 1).toFixed(1)}" cy="${gy(gmax).toFixed(1)}" r="5"></circle><text x="30" y="${H - 4}">${esc(first)}</text><text x="${W - 10}" y="${H - 4}" text-anchor="end">${fmt(gmax)} notes</text></svg></div>`;
    }
    const kmax = Math.max(1, ...(p.knows || []).map(k => k[1]));
    const k = knowsOn ? `<div><h2>What it knows</h2>${p.knows!.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>` : "";
    parts.push(`<div class="two-col">${g}${k}</div>`);
  }
  if (s.inbox !== false && p.inbox?.kinds?.length) {
    const ib = p.inbox, kmax = Math.max(1, ...ib.kinds.map(k => k[1])), total = ib.total ?? ib.kinds.reduce((a, k) => a + k[1], 0);
    const se = ib.series, smax2 = Math.max(1, ...(se?.weeks || []).map(w => w[1]));
    parts.push(`<h2>Inbox to knowledge</h2><p class="small muted">${esc(ib.note || `Every email attachment is read, summarized and linked into the vault overnight. ${fmt(total)} documents so far, by kind. Contents stay private.`)}</p><div class="two-col"><div>${ib.kinds.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill alt" style="width:${(n / kmax * 100).toFixed(1)}%"></span></span><span class="num">${fmt(n)}</span></div>`).join("")}</div>${se?.weeks?.length ? `<div><div class="label">${esc(se.label)} / ${fmt(se.weeks.reduce((a, w) => a + w[1], 0))} in ${se.weeks.length} weeks</div><div class="cols">${se.weeks.map(([l, n]) => `<span title="${esc(l)}: ${n}"><b style="height:${Math.max(3, n / smax2 * 100).toFixed(1)}%"></b><em>${n || ""}</em></span>`).join("")}</div><div class="bars-legend"><span>${esc(se.weeks[0][0])}</span><span>this week</span></div></div>` : ""}</div>`);
  }
  if (s.topics && p.topics.length) parts.push(`<h2>Topics</h2><div class="cloud">${p.topics.map(([t, n]) => `<span style="font-size:${(13 + n / tmax * 15).toFixed(1)}px">${esc(t)}<sup>${n}</sup></span>`).join("")}</div>`);
  if (s.projects !== false && p.projects?.length) {
    const hasC = p.projects.some(x => x.commits);
    parts.push(`<h2>Projects</h2><div class="query">TABLE status, ${hasC ? "commits, " : ""}link FROM "Projects" SORT ${hasC ? "commits DESC" : "file.name"}</div><div class="table-wrap"><table class="data"><thead><tr><th>File</th><th>status</th>${hasC ? '<th class="num">commits</th>' : ""}<th>link</th></tr></thead><tbody>${p.projects.map(x => `<tr><td>${/^https?:\/\//.test(x.url) ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.name)}</a>` : esc(x.name)}</td><td>${esc(x.status)}</td>${hasC ? `<td class="num">${x.commits ? fmt(x.commits) : ""}</td>` : ""}<td>${/^https?:\/\//.test(x.url) ? `<a href="${esc(x.url)}" rel="noopener">${esc(x.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : ""}</td></tr>`).join("")}</tbody></table></div>`);
  }
  if (s.code !== false && p.code && p.code.commits > 0) {
    const c = p.code, wk = c.weekly || [], f = Math.max(0, wk.findIndex(x => x > 0)), w2 = wk.slice(f), peak = Math.max(1, ...w2);
    parts.push(`<h2>Code</h2><p class="small"><b>${fmt(c.commits)}</b> commits across <b>${fmt(c.repos)}</b> repositories in the last year.${c.languages?.length ? ` Mostly ${esc(c.languages.slice(0, -1).join(", "))}${c.languages.length > 1 ? " and " : ""}${esc(c.languages[c.languages.length - 1])}.` : ""}${c.url && /^https?:\/\//.test(c.url) ? ` <a href="${esc(c.url)}" rel="noopener">${esc(c.url.replace(/^https?:\/\//, ""))}</a>` : ""}</p>${w2.length ? `<div class="bars" role="img" aria-label="Commits per week">${w2.map(x => `<span class="${x >= peak * .5 ? "" : "quiet"}" style="height:${Math.max(2, x / peak * 100).toFixed(1)}%" title="${x}"></span>`).join("")}</div><div class="bars-legend"><span>${esc(c.start || "")}</span><span>peak week: ${fmt(peak)}</span><span>this week</span></div>` : ""}`);
  }
  if (s.ai !== false && p.ai && p.ai.total > 0) {
    const a = p.ai, td = days.map(d => ({ date: d.date, n: d.tokens || 0 })), tpeak = Math.max(1, ...td.map(x => x.n));
    const share = (n: number) => a.total ? Math.round(n / a.total * 1000) / 10 : 0;
    const bars = (rows: [string, number][], alt = false) => { const m = Math.max(1, ...rows.map(r => r[1])); return rows.map(([l, n]) => `<div class="hbar"><span>${esc(l)}</span><span class="track"><span class="fill${alt ? " alt" : ""}" style="width:${(n / m * 100).toFixed(1)}%"></span></span><span class="num" title="${fmt(n)} tokens">${share(n) >= 0.1 ? share(n) + "%" : "&lt;0.1%"}</span></div>`).join(""); };
    parts.push(`<h2>AI usage</h2><p class="small"><b>${big(a.total)}</b> tokens across <b>${a.models.length}</b> model${a.models.length === 1 ? "" : "s"} in the last ${a.window_days || td.length} days.${a.note ? ` <span class="muted">${esc(a.note)}</span>` : ""}</p>${td.some(x => x.n) ? `<div class="bars" role="img" aria-label="AI tokens per day">${td.map(x => `<span class="${x.n >= tpeak * .5 ? "" : "quiet"}" style="height:${Math.max(2, x.n / tpeak * 100).toFixed(1)}%" title="${esc(x.date)}: ${big(x.n)} tokens"></span>`).join("")}</div><div class="bars-legend"><span>${esc(td[0]?.date || "")}</span><span>peak day: ${big(tpeak)}</span><span>today</span></div>` : ""}<div class="two-col" style="margin-top:var(--space-4)"><div><div class="label">Models / share of tokens</div>${bars(a.models)}</div>${a.providers?.length ? `<div><div class="label">Providers</div>${bars(a.providers, true)}</div>` : ""}</div>`);
  }
  if (s.timeline !== false && p.timeline?.length) parts.push(`<h2>Timeline</h2><div class="timeline">${p.timeline.map(([y, t]) => `<div class="row"><span class="year">${esc(y)}</span><span>${inline(t)}</span></div>`).join("")}</div>`);
  if (s.notes && p.publicNotes.length) parts.push(`<h2>Notes</h2>${p.publicNotes.map(n => `<div class="pnote"><div class="pn-title">${esc(n.title)}</div><div class="pn-ex">${esc(n.excerpt)}</div><div class="pn-date">${esc(n.updated.slice(0, 10))}</div></div>`).join("")}`);
  if (s.asks && (p.asks.length || p.offers.length)) parts.push(`<h2>Help exchange</h2><div class="hx-grid">
<div class="hx-card"><div class="label">I could use help with</div>${p.asks.map(a => `<div class="hx-row"><span>${esc(a.title)}</span><span class="bounty">+${a.bounty}</span></div>`).join("") || '<div class="muted">Nothing right now</div>'}</div>
<div class="hx-card"><div class="label">I can help with</div>${p.offers.map(o => `<div class="hx-row"><span>${esc(o.title)}</span></div>`).join("") || '<div class="muted">Ask me</div>'}</div></div>`);
  if (s.social && p.social) parts.push(`<div class="stat-strip">${[[fmt(p.social.friends), "friends"], [String(p.social.gravity), "gravity"], [fmt(p.social.credits), "help credits"]].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.links && p.links.length) parts.push(`<h2>Elsewhere</h2><ul class="bullets">${p.links.map(([l, u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(l)}</a></li>`).join("")}</ul>`);
  parts.push(`<div class="foot">Grown from an Obsidian vault with Caldera. Updated ${esc(p.updated.slice(0, 16).replace("T", " "))} UTC. <a href="${esc((p.hub || "https://caldera.social").replace(/\/$/, ""))}/guide.html" target="_blank" rel="noopener">Your page? How to edit it</a></div></div></main>`);
  if (railOn) parts.push(`<aside class="rail">${p.graph?.length ? `<div class="graph"><div class="label">${esc(p.graphLabel || "Graph")}</div>${graphSvg(p.graph, p.name)}</div>` : ""}${p.backlinks?.length ? `<div><div class="label">${esc(p.backlinkLabel || "Backlinks")}</div>${p.backlinks.map(([t, c]) => `<div class="backlink"><span>${esc(t)}</span><div class="ctx">${esc(c)}</div></div>`).join("")}</div>` : ""}</aside>`);
  parts.push(`</div>`);
  parts.push(`<script>${CLIENT_JS}</script></body></html>`);
  return { "index.html": parts.join("\n"), "assets/theme.css": THEME_CSS as string, "assets/profile.css": PROFILE_CSS };
}

/** Tiny client script: "synced ago" + flippable journal. */
const CLIENT_JS = `(function(){var a=document.getElementById('ago');if(a){var t=Date.parse(a.dataset.ts);var f=function(){var m=Math.max(0,Math.round((Date.now()-t)/60000));a.textContent=m<60?m+'m ago':Math.floor(m/60)+'h '+(m%60)+'m ago'};f();setInterval(f,30000)}
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
