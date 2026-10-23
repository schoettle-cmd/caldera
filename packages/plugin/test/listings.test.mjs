import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAppUrl, parseSiteUrl, parseListingLine, parseListings, invalidListingLines, listingLine, storefrontOn, toListing, siteKey,
  withListingsPrivate, withListingsPublic, appsCards, siteCards, MAX_LISTINGS, LISTING_DISTRICT } from "./listings.build.mjs";
import { cityData, publicCity, applyPrivateMode, renderCity } from "./city.build.mjs";
import { renderProfile } from "./render.build.mjs";

const HUB = "https://caldera.social";

test("app links: App Store and Google Play only, canonical keys", () => {
  const a = parseAppUrl("https://apps.apple.com/us/app/some-app/id1234567890?pt=1");
  assert.deepEqual([a.store, a.id, a.key, a.url], ["apple", "1234567890", "apple-1234567890", "https://apps.apple.com/app/id1234567890"]);
  const g = parseAppUrl("https://play.google.com/store/apps/details?id=com.acme.notes&hl=en");
  assert.deepEqual([g.store, g.id, g.key, g.url], ["play", "com.acme.notes", "play-com.acme.notes", "https://play.google.com/store/apps/details?id=com.acme.notes"]);
  for (const bad of ["http://apps.apple.com/us/app/x/id1234567", "https://itunes.apple.com/app/id1234567", "https://apps.apple.com/us/app/x", "https://evil.com/apps.apple.com/id1234567",
    "https://play.google.com/store/apps/details?id=bad", "https://play.google.com/store/apps/details?id=com.x;rm", "https://user:pw@apps.apple.com/app/id1234567", "javascript:alert(1)", ""])
    assert.equal(parseAppUrl(bad), null, bad);
});

test("website links: http(s), real hostnames, standard ports, path kept", () => {
  const s = parseSiteUrl("https://www.Kitse.co/");
  assert.deepEqual([s.host, s.url], ["kitse.co", "https://www.kitse.co/"]);
  assert.equal(parseSiteUrl("kitse.co").url, "https://kitse.co/");
  const p = parseSiteUrl("https://mjonesone.com/dictate/");
  assert.equal(p.url, "https://mjonesone.com/dictate"); assert.equal(siteKey(p), "mjonesone.com/dictate"); assert.equal(siteKey(s), "kitse.co");
  for (const bad of ["ftp://x.com", "http://127.0.0.1/", "https://10.0.0.1", "http://localhost:3000", "https://x.com:8080/", "https://a:b@x.com", "https://intranet.corp", "https://box.local", "https://apps.apple.com/app/id123456", "javascript:alert(1)", "https://nodot"])
    assert.equal(parseSiteUrl(bad), null, bad);
  assert.ok(parseSiteUrl("http://old.example.org/page"), "plain http is allowed");
});

test("lines: repo tie, storefront flag, de-dup, max 12", () => {
  const l = parseListingLine("https://kitse.co | kitse", "site"); assert.equal(l.repo, "kitse"); assert.equal(l.storefront, undefined);
  assert.equal(parseListingLine("https://kitse.co | kitse | no-storefront", "site").storefront, false);
  const n = parseListingLine("https://kitse.co | | no-storefront", "site"); assert.equal(n.storefront, false); assert.equal(n.repo, undefined);
  assert.equal(parseListingLine("https://kitse.co | no-storefront", "site").storefront, false);
  assert.equal(parseListingLine("https://kitse.co | bad repo name!", "site").repo, undefined);
  assert.equal(listingLine(parseListingLine("https://kitse.co | kitse | no-storefront", "site")), "https://kitse.co/ | kitse | no-storefront");
  assert.equal(listingLine(parseListingLine("https://kitse.co | kitse", "site")), "https://kitse.co/ | kitse");
  const many = Array.from({ length: 20 }, (_, i) => `https://site${i}.com`).concat(["https://site1.com"]);
  assert.equal(parseListings(many, "site").length, MAX_LISTINGS);
  assert.equal(parseListings("https://a.com\nhttps://a.com/\nnot a link", "site").length, 1);
  assert.deepEqual(invalidListingLines(["https://a.com", "nope"], "site"), ["nope"]);
});

test("storefront toggles: per listing and per repo", () => {
  assert.equal(storefrontOn({}), true);
  assert.equal(storefrontOn({ storefront: false }), false);
  assert.equal(storefrontOn({ repo: "Numbi" }, ["numbi"]), false);
  assert.equal(storefrontOn({ repo: "kitse" }, ["numbi"]), true);
});

// a city with a public repo (web), a private repo (secret-app) in the same project, and a private-only project
const repos = [
  { name: "web", project: "Acme", public: true, language: "TypeScript", commits: 40, weeks: [], week: 1, today: 0, url: "https://github.com/me/web", sites: ["acme.com"] },
  { name: "secret-app", project: "Acme", public: false, language: "Swift", commits: 90, weeks: [], week: 2, today: 0 },
  { name: "stealth", project: "Stealth", public: false, language: "Go", commits: 10, weeks: [], week: 0, today: 0 },
  { name: "numbi", project: "Numbi", public: true, language: "TypeScript", commits: 30, weeks: [], week: 0, today: 0, url: "https://github.com/me/numbi", sites: ["numbi.app"] },
];
const priv = () => cityData(structuredClone(repos), () => ({ n: 0, paths: [] }), "2026-10-23T00:00:00Z");
const L = (line, kind, meta) => toListing(parseListingLine(line, kind), meta, HUB);
const all = c => c.districts.flatMap(d => d.repos.map(r => ({ ...r, district: d.name })));

test("privacy: an app tied to a private repo never carries the repo's name", () => {
  const app = L("https://apps.apple.com/app/id1234567 | secret-app", "app", { key: "apple-1234567", name: "Secret App" });
  const site = L("https://stealth.io | stealth", "site", { key: "x", name: "Stealth" });
  for (const mode of ["show", "anonymous", "hidden", "named"]) {
    const p = priv(), pub = withListingsPublic(publicCity(p, ["Acme"], mode), p, [app, site], mode);
    const json = JSON.stringify(applyPrivateMode(pub, mode));
    if (mode !== "named") { assert.ok(!json.includes("secret-app"), mode); assert.ok(!json.includes("\"stealth\""), mode); }
    const a = all(pub).find(r => r.kind === "app");
    assert.ok(a, mode + ": the app is public");
    // show/named reveal where the private repo stands, so the app may stand there; anonymous/hidden must not
    assert.equal(a.district, mode === "show" || mode === "named" ? "Acme" : LISTING_DISTRICT, mode);
    // a private-only project's district isn't public: its site goes to Apps & sites
    assert.equal(all(pub).find(r => r.kind === "site").district, mode === "named" ? "Stealth" : LISTING_DISTRICT, mode);
  }
});

test("privacy: switching to anonymous later moves listings away from private work (serve-time rewrite)", () => {
  const p = priv(), app = L("https://apps.apple.com/app/id1234567 | secret-app", "app");
  const shown = withListingsPublic(publicCity(p, ["Acme"], "show"), p, [app], "show");
  assert.equal(all(shown).find(r => r.kind).district, "Acme");
  const anon = applyPrivateMode(shown, "anonymous");
  assert.equal(all(anon).find(r => r.kind).district, LISTING_DISTRICT);
});

test("websites: storefront on stands alone and carries the site; off attaches to a repo shown by name", () => {
  const p = priv();
  const on = withListingsPublic(publicCity(p, ["Acme"]), p, [L("https://shop.acme.com | web", "site")]);
  const sf = all(on).find(r => r.kind === "site");
  assert.deepEqual([sf.district, sf.sites[0], sf.url], ["Acme", "shop.acme.com", "https://shop.acme.com/"]);
  assert.equal(all(on).find(r => r.name === "web").sites, undefined, "the storefront is the product's one public face: the repo's own domains leave the public city");
  const off = withListingsPublic(publicCity(p, ["Acme"]), p, [L("https://shop.acme.com | web | no-storefront", "site")]);
  assert.equal(all(off).filter(r => r.kind).length, 0);
  assert.ok(all(off).find(r => r.name === "web").sites.includes("shop.acme.com"));
  // a page of a host another repo owns gets its own storefront, keyed by host + path
  const page = withListingsPublic(publicCity(p, ["Acme"]), p, [L("https://acme.com/tool | web", "site")]);
  assert.equal(all(page).find(r => r.kind).sites[0], "acme.com/tool");
});

test("hideStorefronts: no storefront, and the repo's own website is dropped from the public city", () => {
  const p = priv();
  const pub = withListingsPublic(publicCity(p, ["Acme", "Numbi"]), p, [L("https://numbi.app | numbi", "site"), L("https://apps.apple.com/app/id7654321 | numbi", "app")], "show", [], ["numbi"]);
  const nb = all(pub).find(r => r.name === "numbi");
  assert.ok(nb, "the repo still stands"); assert.equal(nb.sites, undefined, "no website on it");
  assert.ok(!JSON.stringify(pub).includes("numbi.app"));
  assert.equal(all(pub).filter(r => r.kind).length, 0);
  assert.deepEqual(all(pub).find(r => r.name === "web").sites, ["acme.com"], "other repos keep theirs");
  // with nothing listed at all, hiding still strips the homepage
  assert.ok(!JSON.stringify(withListingsPublic(publicCity(p, ["Numbi"]), p, [], "show", [], ["numbi"])).includes("numbi.app"));
});

test("private view: listings stand in their repo's district, untied ones in Apps & sites", () => {
  const c = withListingsPrivate(priv(), [L("https://apps.apple.com/app/id1234567 | secret-app", "app"), L("https://other.com", "site"), L("https://x.com | | no-storefront", "site")]);
  assert.equal(all(c).find(r => r.kind === "app").district, "Acme");
  assert.equal(all(c).find(r => r.kind === "site").district, LISTING_DISTRICT);
  assert.equal(all(c).filter(r => r.kind).length, 2, "no-storefront makes no building");
});

test("renderer: Apps and Websites sections, escaped, store links, hub-only images, own toggles; city carries storefronts", () => {
  const app = L("https://apps.apple.com/app/id1234567", "app", { key: "apple-1234567", name: "Notes <script>x</script>", genre: "Productivity", rating: 4.66, img: "apple-1234567.abcdef0123" });
  const site = L("https://kitse.co", "site", { key: "s", name: "Kitse", desc: "Home chefs \" onmouseover=alert(1)", img: "../../etc" });
  assert.ok(appsCards([app]).includes(`src="${HUB}/v1/listings/img/apple-1234567.abcdef0123"`));
  assert.ok(appsCards([app]).includes("&#9733; 4.7") && appsCards([app]).includes("App Store"));
  assert.ok(!siteCards([site]).includes("<img"), "a bad image id is never linked");
  const base = { name: "Ana", handle: "ana", links: [], properties: [], sections: { links: true }, stats: { notes: 0, words: 0, links: 0, activeDays: 0 }, topics: [], daily: [], publicNotes: [], asks: [], offers: [], updated: new Date().toISOString(), hub: HUB };
  const html = renderProfile({ ...base, apps: [app], websites: [site] })["index.html"];
  assert.ok(html.includes('id="apps"') && html.includes('id="websites"'));
  assert.ok(!html.includes("<script>x</script>") && !html.includes('" onmouseover'));
  const a = html.match(/<a class="ls-card"[^>]*href="https:\/\/apps\.apple\.com\/app\/id1234567"[^>]*>/)?.[0] || "";
  assert.ok(a && /rel="[^"]*noopener/.test(a) && /target="_blank"/.test(a), a);
  const off = renderProfile({ ...base, sections: { apps: false, websites: false }, apps: [app], websites: [site] })["index.html"];
  assert.ok(!off.includes('id="apps"') && !off.includes('id="websites"'));
  assert.ok(renderProfile({ ...base, apps: [app] })["assets/profile.css"].includes(".ls-card"));
  // storefront off still shows the card
  const quiet = L("https://kitse.co | | no-storefront", "site", { key: "s", name: "Kitse" });
  assert.ok(renderProfile({ ...base, websites: [quiet] })["index.html"].includes("Kitse"));
  const city = withListingsPublic(undefined, undefined, [app, site]);
  const page = renderCity({ name: "Ana" }, city);
  assert.ok(page.includes('"kind":"app"') && page.includes("Apps</span>"));
  assert.ok(!page.includes("<script>x</script>"), "names are escaped inside the city data");
});

test("a private repo with a storefront website (named mode): only the listed site, name and link; no repo internals or other domains", () => {
  const rs = [{ name: "relay", project: "Relay", public: false, language: "TypeScript", commits: 500, weeks: [3, 4], week: 4, today: 1, url: "https://github.com/me/relay", description: "internal", sites: ["relaysos.com", "relay-brand-a.com", "relay-brand-b.com"] },
    { name: "dictate", project: "Dictate", public: false, language: "Swift", commits: 50, weeks: [], week: 0, today: 0 },
    { name: "mjonesone-site", project: "Site", public: false, language: "HTML", commits: 80, weeks: [], week: 0, today: 0, sites: ["mjonesone.com"] }];
  const p = cityData(structuredClone(rs), () => ({ n: 0, paths: [] }));
  const items = [L("https://relaysos.com | relay", "site", { key: "a", name: "Relay SOS" }), L("https://mjonesone.com/dictate | dictate", "site", { key: "b", name: "Dictate" }), L("https://mjonesone.com | mjonesone-site", "site", { key: "c", name: "M Jones" })];
  const pub = withListingsPublic(publicCity(p, [], "named"), p, items, "named");
  const json = JSON.stringify(pub);
  for (const bad of ["relay-brand-a.com", "relay-brand-b.com", "github.com/me/relay", "internal"]) assert.ok(!json.includes(bad), bad);
  const fronts = all(pub).filter(r => r.kind);
  assert.deepEqual(fronts.map(r => [r.name, r.district, r.sites[0]]).sort(), [["Dictate", "Dictate", "mjonesone.com/dictate"], ["M Jones", "Site", "mjonesone.com"], ["Relay SOS", "Relay", "relaysos.com"]]);
  for (const f of fronts) { assert.equal(f.description, undefined); assert.equal(f.commits, 0); assert.deepEqual(f.weeks, []); assert.ok(!/github\.com/.test(f.url)); }
});
