/**
 * caldera publish --vault <path> [--hub URL] [--dry-run] [--out dir]
 * Uses the plugin's settings and identity from <vault>/.obsidian/plugins/caldera/data.json.
 */
import fs from "node:fs";
import path from "node:path";
import * as C from "@caldera/core";
import { App } from "./obsidian-shim";
import { collectProfile } from "../../plugin/src/collect";
import { renderProfile } from "../../plugin/src/render";

const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const vault = path.resolve(flag("--vault") || ".");
const cfgPath = path.join(vault, ".obsidian/plugins/caldera/data.json");
if (args[0] !== "publish") { console.log("usage: caldera publish --vault <path> [--hub URL] [--dry-run] [--out dir]"); process.exit(1); }
if (!fs.existsSync(cfgPath)) { console.error("No Caldera settings found. Install the plugin in Obsidian and set your handle first."); process.exit(1); }
const s = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const hub = (flag("--hub") || s.hubUrl).replace(/\/$/, "");

const app = new App(vault) as any;
const me: C.Identity = s.identity;
let social;
try {
  const [fr, gr, cr] = await Promise.all([`/v1/friends/${me.id}`, `/v1/gravity/${me.id}`, `/v1/credits/${me.id}`].map(p => fetch(hub + p).then(r => r.json())));
  social = { friends: fr.friends?.length || 0, gravity: gr.gravity || 0, credits: cr.balance || 0 };
} catch { social = undefined; }
const { data, files: bins } = await collectProfile(app, s, s.sections.social ? social : undefined);
const text = renderProfile(data);

const out = flag("--out");
if (out) {
  for (const [p, t] of Object.entries(text)) { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), t); }
  for (const [p, b] of Object.entries(bins)) { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), Buffer.from(b)); }
  console.log("wrote", out);
}
if (args.includes("--dry-run")) { console.log(`dry run: ${data.stats.notes} notes, ${data.daily.length} days, ${data.publicNotes.length} public notes`); process.exit(0); }

const manifest = C.sign(me, "profile.manifest", {
  name: data.name, handle: s.handle, boxKey: me.boxPublic, headline: data.headline || "", photos: { avatar: data.avatar, banner: data.banner },
  links: data.links, sections: Object.keys(data.sections).filter(k => data.sections[k]), stats: data.stats,
  daily: data.daily.map(d => ({ date: d.date, score: C.activityScore(d.counts), headline: d.headline || "", counts: d.counts })),
  topics: data.topics, asks: data.asks, offers: data.offers, page: "index.html", updated: data.updated,
});
const payload: Record<string, string> = {};
for (const [p, t] of Object.entries(text)) payload[p] = Buffer.from(t).toString("base64");
for (const [p, b] of Object.entries(bins)) payload[p] = Buffer.from(b).toString("base64");
const r = await fetch(`${hub}/v1/profiles/${encodeURIComponent(me.id)}/bundle`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ manifest, files: payload }) });
const j = await r.json();
if (!r.ok) { console.error("publish failed:", j.error); process.exit(1); }
console.log("published:", hub + j.url);
