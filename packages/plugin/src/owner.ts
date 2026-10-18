/**
 * The owner's private layer: sections that only render inside Obsidian (the "My view" tab), never in a published
 * bundle. Pure: OwnerData -> HTML, so it is unit-testable and cannot leak into renderProfile's output.
 * Vault links use data-open="<path>" and actions use data-action="<name>"; the tab's bridge script handles both.
 */

export interface OwnerActivity {
  since: string; views: number; visitors: number; totalViews: number;
  pages: [string, number][]; days: [string, number, number][];
  gravity: { from: string | null; reason: string; ts: string }[];
  friends: { handle: string | null; ts: string }[];
  links: { src_handle: string; src_slug: string; src_title: string; dst_slug: string }[];
  asks: { title: string; status: string; ts: string }[];
  emailConfirmed?: boolean;
  viewsAll?: number; viewsWeek?: number; showViews?: boolean;
  kudos?: { kind: string; emoji: string; from: string | null; name: string; ts: string }[];
}
export interface VaultRef { title: string; path: string; excerpt?: string; time?: string; kind?: "new" | "edit" }
export interface OwnerData {
  now: string;                                                   // ISO, when this was built
  lastLooked?: string;                                           // ISO, the previous time the owner opened the tab
  activity?: OwnerActivity | { error: string };                  // from the hub (signed in with the vault's key)
  pending?: number;                                              // friend requests waiting in the panel
  today: { date: string; headline?: string; focus?: string[]; wins?: string[]; counts?: Record<string, number>; timeline: VaultRef[] };
  onThisDay: { label: string; date: string; items: VaultRef[] }[];
  rediscovered?: VaultRef & { why: string };
  patterns: string[];
  goals?: { heading: string; done: number; total: number; open: string[] }[] | null;   // null = no Caldera/Goals.md yet
  sources?: { label: string; ok: boolean; hint: string }[];      // what feeds the page; missing ones = copy the setup prompt
  promptOutdated?: boolean;                                      // the routine was set up with an older setup prompt
  checklist?: { id: string; label: string; why: string; done: boolean }[];   // "Finish your page" (core pageChecklist)
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const ago = (iso: string, now: string) => {
  const m = Math.max(0, Math.round((Date.parse(now) - Date.parse(iso)) / 60000));
  return m < 60 ? `${m}m ago` : m < 48 * 60 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)} days ago`;
};
const open = (r: VaultRef) => `<a class="ow-link" href="#" data-open="${esc(r.path)}">${esc(r.title)}</a>`;
const pageName = (p: string) => p === "index.html" ? "your profile" : p === "garden.html" ? "garden home" : p.replace(/^n\//, "").replace(/\.html$/, "").replace(/-/g, " ");

export function renderOwner(o: OwnerData): string {
  const out: string[] = [];
  const card = (id: string, title: string, body: string, extra = "") => out.push(`<section class="ow-card" id="${id}"><div class="ow-h"><h3>${title}</h3>${extra}</div>${body}</section>`);

  // 1. Since you last looked
  {
    const a = o.activity;
    const when = o.lastLooked ? `since you last looked, ${ago(o.lastLooked, o.now)}` : "in the last 24 hours";
    let body = "";
    if (!a) body = `<p class="ow-muted">Publish your profile to start seeing visits, gravity and links here.</p>`;
    else if ("error" in a) body = `<p class="ow-muted">Couldn't reach the hub (${esc(a.error)}). Your vault sections below still work offline.</p>`;
    else {
      const tiles = [[a.views, a.views === 1 ? "page view" : "page views"], [a.visitors, a.visitors === 1 ? "visitor" : "visitors"], [a.gravity.length, "gravity"], [a.friends.length, a.friends.length === 1 ? "new friend" : "new friends"], ...(a.kudos?.length ? [[a.kudos.length, "kudos"]] : [])]
        .concat(o.pending ? [[o.pending, o.pending === 1 ? "friend request" : "friend requests"]] : []);
      body += `<div class="ow-tiles">${tiles.map(([n, l]) => `<div class="ow-tile${Number(n) ? " is-up" : ""}"><b>${n}</b><span>${l}</span></div>`).join("")}</div>`;
      const byDay = new Map(a.days.map(d => [d[0], d] as const)), t0 = Date.parse(o.now);
      const days14 = Array.from({ length: 14 }, (_, i) => { const k = new Date(t0 - (13 - i) * 86_400_000).toISOString().slice(0, 10); return byDay.get(k) || [k, 0, 0] as [string, number, number]; });
      const max = Math.max(1, ...days14.map(d => d[1]));
      if (a.days.length) body += `<div class="ow-spark" title="Page views, last 14 days">${days14.map(d => `<i style="height:${d[1] ? Math.max(6, Math.round(d[1] / max * 100)) : 2}%;${d[1] ? "" : "opacity:.25"}" title="${esc(d[0])}: ${d[1]} views, ${d[2]} visitors"></i>`).join("")}</div><div class="ow-muted ow-small">Page views, last 14 days &middot; ${a.totalViews.toLocaleString("en-US")} all time</div>`;
      if (typeof a.viewsAll === "number") body += `<div class="ow-muted ow-small">Your page's view count: <b>${a.viewsAll.toLocaleString("en-US")}</b> all time &middot; <b>${(a.viewsWeek || 0).toLocaleString("en-US")}</b> this week (one per visitor per day)${a.showViews === false ? " &middot; hidden from visitors" : ""}</div>`;
      const lines: string[] = [];
      if (a.pages.length) lines.push(`<li>Most read: ${a.pages.slice(0, 4).map(([p, n]) => `${esc(pageName(p))} (${n})`).join(", ")}</li>`);
      for (const g of a.gravity.slice(0, 5)) lines.push(`<li><b>${g.from ? "@" + esc(g.from) : "Someone"}</b> gave you gravity${g.reason ? `: &ldquo;${esc(g.reason)}&rdquo;` : ""} <span class="ow-muted">${ago(g.ts, o.now)}</span></li>`);
      for (const k of (a.kudos || []).slice(0, 6)) lines.push(`<li>${esc(k.emoji)} <b>${k.from ? "@" + esc(k.from) : "Someone"}</b> sent you kudos <span class="ow-muted">${ago(k.ts, o.now)}</span></li>`);
      for (const f of a.friends.slice(0, 5)) lines.push(`<li>You and <b>${f.handle ? "@" + esc(f.handle) : "a new friend"}</b> are now friends <span class="ow-muted">${ago(f.ts, o.now)}</span></li>`);
      if (o.pending) lines.push(`<li><a href="#" data-action="panel" class="ow-link">${o.pending} friend request${o.pending === 1 ? "" : "s"} waiting</a></li>`);
      if (a.links.length) lines.push(`<li>Other gardens link to you ${a.links.length} time${a.links.length === 1 ? "" : "s"}: ${a.links.slice(0, 3).map(l => `@${esc(l.src_handle)}'s &ldquo;${esc(l.src_title)}&rdquo;`).join(", ")}</li>`);
      body += lines.length ? `<ul class="ow-list">${lines.join("")}</ul>` : `<p class="ow-muted">Quiet so far. Share your invite link from the Caldera panel to bring friends in.</p>`;
    }
    card("ow-since", "Since you last looked", body, `<span class="ow-muted ow-small">${esc(when)}</span>`);
  }

  // 1a. Finish your page: what's still missing, each with a one-click way to do it
  if (o.checklist?.some(i => !i.done)) {
    const items = o.checklist, left = items.filter(i => !i.done), done = items.length - left.length;
    const act = (a: string, label: string) => `<a href="#" class="ow-link ow-act" data-action="${a}">${label}</a>`;
    const how: Record<string, string> = {
      photo: `${act("pick-photo", "Choose an image")} ${act("prompt-photo", "Copy prompt for my AI")}`,
      banner: `${act("pick-banner", "Choose an image")} ${act("prompt-banner", "Copy prompt for my AI")} <span class="ow-muted ow-small">wide, about 3:1</span>`,
      headline: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      summary: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      links: `<a href="#" class="ow-link ow-act" data-open="Caldera/profile.md">Edit Caldera/profile.md</a> ${act("prompt-edit", "Copy prompt for my AI")}`,
      garden: `${act("garden-help", "How to plant a note")}`,
      friend: `${act("panel", "Open the Caldera panel")}`,
      group: `${act("settings", "Join one in settings")} <span class="ow-muted ow-small">try producthunt</span>`,
      email: `${act("settings", "Turn it on in settings")}`,
    };
    out.unshift(`<section class="ow-card ow-finish" id="ow-finish"><div class="ow-h"><h3>Finish your page</h3><span class="ow-muted ow-small">${done} of ${items.length} done</span></div>
<div class="ow-bar"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>
<p class="ow-small">${act("finish-form", "Fill it in with a quick form")} <span class="ow-muted">name, photo, masthead, links and a first garden note in one go</span></p>
<ul class="ow-list ow-todo">${left.map(i => `<li><b>${esc(i.label)}</b> <span class="ow-muted">${esc(i.why)}</span><div class="ow-acts">${how[i.id] || ""}</div></li>`).join("")}</ul></section>`);
  }

  // 1b. What feeds your page: every source the setup prompt can connect, and a one-click copy of that prompt
  if (o.sources?.length) {
    const on = o.sources.filter(x => x.ok).length, all = o.sources.length;
    const nudge = o.promptOutdated
      ? `<p class="ow-lead">Caldera can track more than your routine was set up for. Copy the setup prompt again and paste it into your AI agent: it upgrades what's there and fills in the rest.</p>`
      : on < all ? `<p class="ow-muted">Your page shows what your vault is fed. Copy the setup prompt into Claude Code, Codex or Cursor: it connects what it can find on this computer, schedules one routine to keep it fresh, and asks before anything goes public. Paste it again any time.</p>` : "";
    card("ow-sources", "What feeds your page", `${nudge}<ul class="ow-list ow-src">${o.sources.map(x => `<li>${x.ok ? "&#10003;" : "&#9675;"} <b>${esc(x.label)}</b>${x.ok ? "" : ` <span class="ow-muted">${esc(x.hint)}</span>`}</li>`).join("")}</ul>
<p><a href="#" class="ow-link" data-action="prompt"><b>Copy the setup prompt</b></a>${o.promptOutdated ? "" : ` <span class="ow-muted ow-small">safe to paste again</span>`}</p>`, `<span class="ow-muted ow-small">${on} of ${all} connected</span>`);
  }

  // 2. Today, building through the day
  {
    const t = o.today; const parts: string[] = [];
    if (t.headline) parts.push(`<p class="ow-lead">${esc(t.headline)}</p>`);
    const chips = Object.entries(t.counts || {}).filter(([, n]) => n > 0).map(([k, n]) => `<span class="ow-chip">${n} ${esc(k)}</span>`);
    if (chips.length) parts.push(`<div class="ow-chips">${chips.join("")}</div>`);
    for (const [lab, xs] of [["Focus", t.focus], ["Wins", t.wins]] as const) if (xs?.length) parts.push(`<div class="ow-small"><b>${lab}:</b> ${xs.map(esc).join(" &middot; ")}</div>`);
    if (t.timeline.length) parts.push(`<ol class="ow-time">${t.timeline.map(r => `<li><span class="ow-t">${esc(r.time || "")}</span>${r.kind === "new" ? '<span class="ow-new">new</span>' : ""}${open(r)}</li>`).join("")}</ol>`);
    else parts.push(`<p class="ow-muted">Nothing written yet today.</p>`);
    card("ow-today", "Today", parts.join(""), `<span class="ow-muted ow-small">${esc(t.date)}</span>`);
  }

  // 3. On this day
  if (o.onThisDay.some(d => d.items.length)) card("ow-otd", "On this day", o.onThisDay.filter(d => d.items.length).map(d =>
    `<div class="ow-otd"><div class="ow-small ow-muted">${esc(d.label)} &middot; ${esc(d.date)}</div>${d.items.slice(0, 2).map(r => `<div>${open(r)}${r.excerpt ? `<p class="ow-x">${esc(r.excerpt)}</p>` : ""}</div>`).join("")}</div>`).join(""));

  // 4. A note brought back
  if (o.rediscovered) { const r = o.rediscovered; card("ow-back", "Brought back", `<div class="ow-big">${open(r)}</div>${r.excerpt ? `<p class="ow-x">${esc(r.excerpt)}</p>` : ""}<div class="ow-small ow-muted">${esc(r.why)}</div>`, `<span class="ow-muted ow-small">changes every 3 hours</span>`); }

  // 5. Patterns
  if (o.patterns.length) card("ow-pat", "Patterns", `<ul class="ow-list">${o.patterns.map(p => `<li>${p}</li>`).join("")}</ul>`);

  // 6. Goals (Caldera/Goals.md)
  if (o.goals === null) card("ow-goals", "Goals", `<p class="ow-muted">Track goals here with checkboxes in a note. <a href="#" class="ow-link" data-action="goals">Create Caldera/Goals.md</a></p>`);
  else if (o.goals?.length) card("ow-goals", "Goals", o.goals.map(g => { const pct = g.total ? Math.round(g.done / g.total * 100) : 0;
    return `<div class="ow-goal"><div class="ow-goal-h"><b>${esc(g.heading)}</b><span class="ow-muted ow-small">${g.done}/${g.total}</span></div><div class="ow-bar"><i style="width:${pct}%"></i></div>${g.open.length ? `<div class="ow-small ow-muted">Next: ${g.open.slice(0, 2).map(esc).join(" &middot; ")}</div>` : ""}</div>`; }).join(""),
    `<a href="#" class="ow-link ow-small" data-open="Caldera/Goals.md">edit</a>`);

  return `<style>${OWNER_CSS}</style><div class="ow" id="owner"><div class="ow-top"><span class="ow-lock">&#128274; Only you can see this</span><span class="ow-muted ow-small">Built from your vault inside Obsidian. None of it is published.</span></div><div class="ow-grid">${out.join("")}</div></div>`;
}

const OWNER_CSS = `
.ow{margin:18px 0 26px;padding:16px;border:1px dashed var(--accent);border-radius:var(--radius-md,10px);background:color-mix(in srgb,var(--accent) 5%,transparent)}
.ow-top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin-bottom:12px}
.ow-lock{font-family:var(--font-mono);font-size:var(--text-xs,12px);text-transform:uppercase;letter-spacing:.05em;color:var(--accent);font-weight:600}
.ow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}
.ow-card{background:var(--bg-raised);border:1px solid var(--line);border-radius:var(--radius-md,10px);padding:14px 16px;min-width:0}
.ow-card#ow-since,.ow-card#ow-today,.ow-card#ow-finish{grid-column:1/-1}
.ow-todo{list-style:none;padding:0;gap:10px}.ow-acts{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:3px;align-items:baseline}.ow-act{font-weight:600}
.ow-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}
.ow-h h3{margin:0;font-size:1rem;font-family:var(--font-sans);font-weight:600;color:var(--text-strong)}
.ow-muted{color:var(--text-muted)}.ow-small{font-size:var(--text-sm,13px)}
.ow-tiles{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
.ow-tile{flex:1 1 90px;padding:8px 10px;border-radius:var(--radius-sm,6px);background:var(--bg-sunken);display:flex;flex-direction:column}
.ow-tile b{font-size:1.35rem;font-variant-numeric:tabular-nums;color:var(--text-muted)}.ow-tile.is-up b{color:var(--accent)}
.ow-tile span{font-size:var(--text-xs,12px);color:var(--text-muted)}
.ow-spark{display:flex;align-items:flex-end;gap:3px;height:38px;margin:4px 0}
.ow-spark i{flex:1;background:var(--accent);opacity:.75;border-radius:2px 2px 0 0;min-height:2px}
.ow-list{margin:8px 0 0;padding-left:18px;display:grid;gap:4px}
.ow-link{color:var(--accent);text-decoration:none}.ow-link:hover{text-decoration:underline}
.ow-lead{margin:0 0 8px;font-weight:500}
.ow-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.ow-chip{font-size:var(--text-xs,12px);padding:2px 8px;border-radius:999px;background:var(--bg-sunken);color:var(--text-muted);font-variant-numeric:tabular-nums}
.ow-time{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:3px;max-height:260px;overflow:auto;columns:2}
.ow-time li{display:flex;gap:8px;align-items:baseline;min-width:0}
.ow-time .ow-link{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ow-t{font-family:var(--font-mono);font-size:var(--text-xs,12px);color:var(--text-muted);flex:0 0 40px;font-variant-numeric:tabular-nums}
.ow-new{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);flex:0 0 auto}
.ow-otd{display:grid;gap:4px;margin-bottom:10px}.ow-otd:last-child{margin-bottom:0}
.ow-x{margin:2px 0 0;font-size:var(--text-sm,13px);color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ow-big{font-size:1.1rem;font-weight:600}
.ow-goal{margin-bottom:10px}.ow-goal-h{display:flex;justify-content:space-between;gap:8px}
.ow-bar{height:6px;border-radius:3px;background:var(--bg-sunken);margin:4px 0;overflow:hidden}.ow-bar i{display:block;height:100%;background:var(--accent)}
@media (max-width:600px){.ow{padding:12px}.ow-time{columns:1}}
`;
