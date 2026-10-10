/**
 * Pure profile renderer: ProfileData -> static files (index.html + CSS).
 * No Obsidian imports, so it is unit-testable in Node and reusable by self-hosters.
 * Restyle everything via assets/theme.css (design tokens only).
 */
// @ts-ignore - esbuild loads .css as text via the define below
import THEME_CSS from "./assets/theme.css";
import { PROFILE_CSS } from "./profile.css";
import { activityScore, ACTIVITY_WEIGHTS, type DailyCounts } from "@caldera/core";

export interface DailyEntry { date: string; counts: DailyCounts; headline?: string; focus?: string[]; wins?: string[]; themes?: string[]; }
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
<div class="tabs"><span class="tab is-active">${esc(p.name)}.md</span><span class="spacer"></span><span class="sync"><span class="dot"></span>synced from vault <span id="ago" data-ts="${esc(p.updated)}">just now</span></span></div>
<main class="note">`);
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
<div class="sb-bars" role="img" aria-label="Daily activity score">${days.slice(-30).map((d, i, a) => `<span class="${i === a.length - 2 ? "yday" : i === a.length - 1 ? "today" : ""}" style="height:${Math.max(2, Math.round(d.score / smax * 100))}%" title="${d.date}: ${d.score}"></span>`).join("")}</div>
<details class="sb-how"><summary>How the score works</summary>Weighted daily counts: ${Object.entries(ACTIVITY_WEIGHTS).map(([k, w]) => `${labels[k] || k} x${w}`).join(", ")}. Bulk imports are capped. Counts only.</details></section>`);

  if (s.properties && p.properties.length) parts.push(`<dl class="props">${p.properties.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`);
  if (s.numbers) parts.push(`<div class="stat-strip">${[[fmt(p.stats.notes), "notes"], [(p.stats.words / 1e6).toFixed(2) + "M", "words"], [fmt(p.stats.links), "links between notes"], [String(p.stats.activeDays), "active days, 26 weeks"]].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.topics && p.topics.length) parts.push(`<h2>Topics</h2><div class="cloud">${p.topics.map(([t, n]) => `<span style="font-size:${(13 + n / tmax * 15).toFixed(1)}px">${esc(t)}<sup>${n}</sup></span>`).join("")}</div>`);
  if (s.notes && p.publicNotes.length) parts.push(`<h2>Notes</h2>${p.publicNotes.map(n => `<div class="pnote"><div class="pn-title">${esc(n.title)}</div><div class="pn-ex">${esc(n.excerpt)}</div><div class="pn-date">${esc(n.updated.slice(0, 10))}</div></div>`).join("")}`);
  if (s.asks && (p.asks.length || p.offers.length)) parts.push(`<h2>Help exchange</h2><div class="hx-grid">
<div class="hx-card"><div class="label">I could use help with</div>${p.asks.map(a => `<div class="hx-row"><span>${esc(a.title)}</span><span class="bounty">+${a.bounty}</span></div>`).join("") || '<div class="muted">Nothing right now</div>'}</div>
<div class="hx-card"><div class="label">I can help with</div>${p.offers.map(o => `<div class="hx-row"><span>${esc(o.title)}</span></div>`).join("") || '<div class="muted">Ask me</div>'}</div></div>`);
  if (s.social && p.social) parts.push(`<div class="stat-strip">${[[fmt(p.social.friends), "friends"], [String(p.social.gravity), "gravity"], [fmt(p.social.credits), "help credits"]].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("")}</div>`);
  if (s.links && p.links.length) parts.push(`<h2>Elsewhere</h2><ul class="bullets">${p.links.map(([l, u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(l)}</a></li>`).join("")}</ul>`);
  parts.push(`<div class="foot">Grown from an Obsidian vault with Caldera. Updated ${esc(p.updated.slice(0, 16).replace("T", " "))} UTC.</div></div></main>`);
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
