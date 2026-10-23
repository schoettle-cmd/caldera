/**
 * Apps and websites a member lists on their page (Caldera/profile.md `apps:` / `websites:`, plugin settings, or
 * caldera.social/settings): each line is a store or site link, optionally tied to a repo with `| repo-name`.
 * Pure (no Obsidian imports): shared by the plugin and the hub, which fetches the public details (name, icon, rating,
 * title...) and caches them. In the city every listing is a storefront building; a website also lights up the building
 * its live visitors stand in. A listing tied to a private repo is public, but the repo's name never is (unless the
 * owner shows private repos by name).
 */
import { cleanSites, type CityData, type CityDistrict, type CityRepo, type PrivateMode } from "./city";

export const MAX_LISTINGS = 12;
/** the district for listings not tied to a repo (or whose repo can't be shown) */
export const LISTING_DISTRICT = "Apps & sites";
export type Store = "apple" | "play";
export type ListingKind = "app" | "site";

export interface ListingRef { kind: ListingKind; key: string; url: string; store?: Store; id?: string; host?: string; repo?: string; storefront?: false }
/** What the hub found out about a listing (all text already cleaned there; cleaned again before rendering). */
export interface ListingMeta { key: string; name?: string; img?: string; genre?: string; rating?: number; ratings?: number; seller?: string; desc?: string }
/** A listing ready to show: the link plus its public details. `repo` is only ever used for placement, never shown. */
export interface Listing { kind: ListingKind; key: string; url: string; name: string; store?: Store; host?: string; icon?: string;
  genre?: string; rating?: number; ratings?: number; seller?: string; desc?: string; repo?: string;
  /** false: no storefront building in the city (the profile card still shows) */
  storefront?: false }

const REPO_RX = /^[A-Za-z0-9._-]{1,100}$/;
const PKG_RX = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/;
const clean = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

/** FNV-1a, twice: a short stable id for a website URL (same in the plugin and the hub, no crypto needed) */
export function shortHash(s: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5bd1e995) >>> 0; }
  return (a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0")).slice(0, 14);
}

/** An App Store (apps.apple.com) or Google Play (play.google.com) link -> its store and id; anything else -> null. */
export function parseAppUrl(raw: string): ListingRef | null {
  let u: URL; try { u = new URL(String(raw || "").trim()); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
  if (u.hostname === "apps.apple.com") {
    const m = u.pathname.match(/\/id(\d{5,12})(?:\/|$)/); if (!m) return null;
    return { kind: "app", store: "apple", id: m[1], key: `apple-${m[1]}`, url: `https://apps.apple.com/app/id${m[1]}` };
  }
  if (u.hostname === "play.google.com" && /^\/store\/apps\/details\/?$/.test(u.pathname)) {
    const id = u.searchParams.get("id") || ""; if (!PKG_RX.test(id) || id.length > 150) return null;
    return { kind: "app", store: "play", id, key: `play-${id}`, url: `https://play.google.com/store/apps/details?id=${id}` };
  }
  return null;
}

/** A website link: http(s) only, a real hostname (no IP addresses, no localhost, standard ports), no credentials. */
export function parseSiteUrl(raw: string): ListingRef | null {
  let s = String(raw || "").trim(); if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u: URL; try { u = new URL(s); } catch { return null; }
  if ((u.protocol !== "https:" && u.protocol !== "http:") || u.username || u.password) return null;
  if (u.port && u.port !== "80" && u.port !== "443") return null;
  const h = u.hostname.toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) || /^\d+(\.\d+){3}$/.test(h) || h.length > 253) return null;   // no IP literals
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|test|invalid|example)$/.test(h)) return null;
  if (h === "apps.apple.com" || h === "play.google.com") return null;   // a store link belongs in apps
  const url = `${u.protocol}//${h}${u.pathname === "/" ? "/" : u.pathname.replace(/\/+$/, "")}`.slice(0, 300);
  return { kind: "site", key: `site-${shortHash(url)}`, url, host: cleanSites(h)?.[0] || h.replace(/^www\./, "") };
}

export const NO_STOREFRONT = "no-storefront";
const isFlag = (v: string) => /^no-?storefront$/i.test(v);
/** One line: `link`, `link | repo-name`, `link | repo-name | no-storefront` or `link | | no-storefront`
 *  (`link | no-storefront` works too). A repo name that isn't a valid GitHub name is ignored. */
export function parseListingLine(line: unknown, kind: ListingKind): ListingRef | null {
  const [a = "", ...rest] = String(line ?? "").split("|").map(x => x.trim());
  const ref = kind === "app" ? parseAppUrl(a) : parseSiteUrl(a); if (!ref) return null;
  for (const v of rest) { if (!v) continue; if (isFlag(v)) ref.storefront = false; else if (!ref.repo && REPO_RX.test(v)) ref.repo = v; }
  return ref;
}
/** Back to the one-line form (settings and profile.md write it this way). */
export function listingLine(r: { url: string; repo?: string; storefront?: false }): string {
  return r.storefront === false ? `${r.url} | ${r.repo || ""} | ${NO_STOREFRONT}` : r.repo ? `${r.url} | ${r.repo}` : r.url;
}
/** Does this listing stand as a building? Off per listing (no-storefront) or for every listing tied to a repo in hideStorefronts. */
export function storefrontOn(l: { repo?: string; storefront?: false }, hideStorefronts: string[] = []): boolean {
  if (l.storefront === false) return false;
  return !(l.repo && hideStorefronts.some(h => h.trim().toLowerCase() === l.repo!.toLowerCase()));
}

/** A list (array, or text one per line) -> valid, de-duplicated listings, at most 12. */
export function parseListings(raw: unknown, kind: ListingKind): ListingRef[] {
  const lines = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  const out: ListingRef[] = [], seen = new Set<string>();
  for (const l of lines) { const r = parseListingLine(l, kind); if (!r || seen.has(r.key)) continue; seen.add(r.key); out.push(r); if (out.length >= MAX_LISTINGS) break; }
  return out;
}

/** The lines that didn't make it, so settings can say why. */
export function invalidListingLines(raw: unknown, kind: ListingKind): string[] {
  const lines = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : []).map(x => String(x ?? "").trim()).filter(Boolean);
  return lines.filter(l => !parseListingLine(l, kind));
}

/** A name to show before (or without) the store's details: "com.acme.notes" -> "Notes", "www.kitse.co" -> "kitse.co" */
export function fallbackName(r: ListingRef): string {
  if (r.kind === "site") return r.host || "Website";
  if (r.store === "play" && r.id) { const last = r.id.split(".").pop() || r.id; return last.charAt(0).toUpperCase() + last.slice(1); }
  return "App";
}

/** Ref + what the hub found -> a listing ready to show. `hub` makes the cached image an absolute link (CSP: same origin). */
export function toListing(r: ListingRef, m: ListingMeta | undefined, hub: string): Listing {
  const base = hub.replace(/\/$/, "");
  const rating = Number(m?.rating), ratings = Number(m?.ratings);
  const img = m?.img && /^[a-z0-9._-]{3,170}$/i.test(m.img) ? `${base}/v1/listings/img/${encodeURIComponent(m.img)}` : undefined;
  return { kind: r.kind, key: r.key, url: r.url, store: r.store, host: r.host, repo: r.repo, ...(r.storefront === false ? { storefront: false as const } : {}),
    name: clean(m?.name, 80) || fallbackName(r), icon: img,
    genre: clean(m?.genre, 40) || undefined, seller: clean(m?.seller, 80) || undefined, desc: clean(m?.desc, 200) || undefined,
    rating: rating > 0 && rating <= 5 ? Math.round(rating * 10) / 10 : undefined, ratings: ratings > 0 ? Math.round(ratings) : undefined };
}

// ---- city: every listing is a storefront building ----------------------------------------------------------------

/** A listing as a city building (a CityRepo with kind set). Public by design: the owner listed it. A website carries its
 *  own site ("host" or "host/path"), so its live visitors stand in the storefront. */
export function listingBuilding(l: Listing, project: string, besidePrivate = false): CityRepo {
  const site = l.kind === "site" ? siteKey(l) : "";
  return { ...(besidePrivate ? { pv: true } : {}), name: clean(l.name, 60) || "App", project, public: true, language: l.kind === "app" ? "App" : "Web", commits: 0, weeks: [], week: 0, today: 0,
    url: l.url, kind: l.kind, ...(site ? { sites: [site] } : {}),
    meta: { store: l.store, icon: l.icon, genre: l.genre, rating: l.rating, ratings: l.ratings, desc: l.desc, host: l.host } };
}
/** "kitse.co" for https://www.kitse.co/, "mjonesone.com/dictate" for https://mjonesone.com/dictate */
export function siteKey(l: { url: string; host?: string }): string {
  let path = ""; try { path = new URL(l.url).pathname.toLowerCase().replace(/\/+$/, ""); } catch { /* host only */ }
  return (l.host || "") + (/^\/[a-z0-9._~%\/-]{1,120}$/.test(path) ? path : "");
}

const lc = (v: string) => v.trim().toLowerCase();
const findRepo = (c: CityData | undefined, name: string) => {
  const n = lc(name);
  for (const d of c?.districts || []) for (const r of d.repos) if (!r.kind && r.name && lc(r.name) === n) return { d, r };
  return null;
};
const general = (ds: CityDistrict[]) => { let g = ds.find(d => d.name === LISTING_DISTRICT); if (!g) { g = { name: LISTING_DISTRICT, notes: 0, repos: [] }; ds.push(g); } return g; };
const copy = (c: CityData): CityData => ({ ...c, districts: c.districts.map(d => ({ ...d, repos: d.repos.map(r => ({ ...r })) })) });
const addSite = (r: CityRepo, host?: string) => { if (host) r.sites = cleanSites([...(r.sites || []), host]); };
const dropEmptyGeneral = (c: CityData) => { if (!c.districts.find(d => d.name === LISTING_DISTRICT)?.repos.length) c.districts = c.districts.filter(d => d.name !== LISTING_DISTRICT); return c; };

/** Rules (the same in the owner's private view and on the public page):
 *  - a listing with its storefront on (the default) stands as its own storefront building: in its tied repo's district
 *    when that's allowed (see withListingsPublic), else in "Apps & sites". A website's storefront carries the site, so its
 *    live visitors stand there.
 *  - a website with its storefront off, tied to a repo shown by name, becomes that repo building's site instead.
 *  - hideStorefronts: repos whose listings get no storefront, and whose own websites (GitHub homepage, city.json sites)
 *    are dropped from the public city, so that repo stands as a plain building and nothing presents it as a product. */
export function withListingsPrivate(city: CityData | undefined, items: Listing[], hideStorefronts: string[] = []): CityData | undefined {
  if (!items.length) return city;
  const c = city ? copy(city) : { districts: [], private: true } as CityData;
  for (const l of items) {
    const hit = l.repo ? findRepo(c, l.repo) : null;
    if (!storefrontOn(l, hideStorefronts)) { if (hit && l.kind === "site" && l.storefront === false) addSite(hit.r, l.host); continue; }
    (hit ? hit.d : general(c.districts)).repos.push(listingBuilding(l, hit ? hit.d.name : LISTING_DISTRICT));
  }
  return dropEmptyGeneral(c);
}

/** The PUBLIC city: `pub` is publicCity() of `priv` (both without listings). A listing tied to a repo stands in that
 *  repo's district only when the district is public and the setting already reveals that the repo belongs there (a
 *  public repo, or private repos shown by name or as padlocks in place); otherwise it goes to "Apps & sites". Nothing
 *  here ever carries the tied repo's name. */
export function withListingsPublic(pub: CityData | undefined, priv: CityData | undefined, items: Listing[], mode: PrivateMode = "show", hideRepos: string[] = [], hideStorefronts: string[] = []): CityData | undefined {
  const hs = new Set(hideStorefronts.map(lc).filter(Boolean));
  if (!items.length && !hs.size) return pub;
  const c = pub ? copy(pub) : { districts: [], private: false } as CityData;
  // no website on a hidden repo; and a repo whose website stands as its own storefront hands its sites to it (its other
  // domains from GitHub or city.json stay off the public city: the storefront is the one public face of that product)
  const owned = new Set(items.filter(l => l.kind === "site" && l.repo && storefrontOn(l, hideStorefronts)).map(l => lc(l.repo!)));
  for (const d of c.districts) for (const r of d.repos) if (!r.kind && r.name && (hs.has(lc(r.name)) || owned.has(lc(r.name)))) delete r.sites;
  const hide = new Set(hideRepos.map(lc).filter(Boolean));
  for (const l of items) {
    const hit = l.repo ? findRepo(priv, l.repo) : null;
    let district: CityDistrict | null = null, named: CityRepo | null = null, pv = false;
    if (hit) {
      const pd = c.districts.find(d => d.name === hit.d.name && !d.apart) || null;
      const shownByName = hit.r.public || (mode === "named" && !hide.has(lc(hit.r.name)));
      const placeOk = hit.r.public || mode === "named" || mode === "show";
      if (pd && placeOk) {
        district = pd; pv = !hit.r.public;
        if (shownByName) named = pd.repos.find(r => !r.kind && !r.locked && lc(r.name) === lc(hit.r.name)) || null;
      }
    }
    if (!storefrontOn(l, [...hs])) { if (l.kind === "site" && l.storefront === false && named && !hs.has(lc(named.name))) addSite(named, l.host); continue; }
    const d = district || general(c.districts);
    d.repos.push(listingBuilding(l, d.name, pv && !!district));
  }
  return dropEmptyGeneral(c);
}

// ---- profile sections -----------------------------------------------------------------------------------------------

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const httpsOk = (u: string) => /^https?:\/\/[^\s"<>]+$/.test(u);
const imgOk = (u?: string) => !!u && /^https:\/\/[^\s"<>]+\/v1\/listings\/img\/[A-Za-z0-9._%-]+$/.test(u);
const stars = (r?: number) => r ? `<span class="ls-rate" title="${r} out of 5">&#9733; ${r.toFixed(1)}</span>` : "";

/** The Apps section's cards (icon, name, rating, category, store) */
export function appsCards(apps: Listing[]): string {
  return `<div class="ls-grid">${apps.filter(a => a.kind === "app" && httpsOk(a.url)).map(a => `<a class="ls-card" href="${esc(a.url)}" target="_blank" rel="noopener">${imgOk(a.icon) ? `<img class="ls-icon app" src="${esc(a.icon)}" alt="" loading="lazy" width="56" height="56">` : `<span class="ls-icon app ls-ph" aria-hidden="true">${esc((a.name || "A").charAt(0))}</span>`}<span class="ls-body"><span class="ls-name">${esc(a.name)}</span><span class="ls-sub">${[a.genre ? esc(a.genre) : "", stars(a.rating)].filter(Boolean).join(" &middot; ")}</span><span class="ls-store">${a.store === "play" ? "Google Play" : "App Store"} &#8599;</span></span></a>`).join("")}</div>`;
}
/** The Websites section's cards (favicon, title, host, short description) */
export function siteCards(sites: Listing[]): string {
  return `<div class="ls-grid">${sites.filter(s => s.kind === "site" && httpsOk(s.url)).map(s => `<a class="ls-card" href="${esc(s.url)}" target="_blank" rel="noopener">${imgOk(s.icon) ? `<img class="ls-icon site" src="${esc(s.icon)}" alt="" loading="lazy" width="40" height="40">` : `<span class="ls-icon site ls-ph" aria-hidden="true">${esc((s.host || "W").charAt(0).toUpperCase())}</span>`}<span class="ls-body"><span class="ls-name">${esc(s.name)}</span><span class="ls-host">${esc(s.host || "")} &#8599;</span>${s.desc ? `<span class="ls-desc">${esc(s.desc)}</span>` : ""}</span></a>`).join("")}</div>`;
}
export const LISTINGS_CSS = `
.ls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--space-3); margin: var(--space-2) 0 var(--space-6); }
.ls-card { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--bg-raised); color: var(--text); text-decoration: none; min-width: 0; }
.ls-card:hover { border-color: var(--line-strong); }
.ls-icon { flex: none; object-fit: cover; background: var(--bg-sunken); }
.ls-icon.app { width: 56px; height: 56px; border-radius: 13px; }
.ls-icon.site { width: 40px; height: 40px; border-radius: 9px; }
.ls-ph { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; color: var(--accent-text); font-size: var(--text-lg); }
.ls-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ls-name { font-weight: 600; color: var(--text-strong); overflow-wrap: anywhere; }
.ls-sub, .ls-host, .ls-store { font-size: var(--text-sm); color: var(--text-muted); overflow-wrap: anywhere; }
.ls-store { color: var(--accent-text); }
.ls-desc { font-size: var(--text-sm); color: var(--text); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.ls-rate { white-space: nowrap; }
`;
