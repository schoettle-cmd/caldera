// Caldera inbound mail forwarder.
// Resend receives mail for caldera.social and calls this webhook (event "email.received").
// We verify the Svix signature, fetch the message, and forward it to FORWARD_TO with Reply-To = original sender.
// env: RESEND_API_KEY, WEBHOOK_SECRET (whsec_...), FORWARD_TO, ALIASES (comma list), PORT
import http from "node:http";
import crypto from "node:crypto";

const KEY = process.env.RESEND_API_KEY;
const SECRET = process.env.WEBHOOK_SECRET || "";
const FORWARD_TO = process.env.FORWARD_TO;
const ALIASES = (process.env.ALIASES || "privacy,legal,hello").split(",").map(s => s.trim().toLowerCase() + "@caldera.social");
const FROM = process.env.FORWARD_FROM || "Caldera Inbox <inbox@caldera.social>";
const log = (...a) => console.log(new Date().toISOString(), ...a);

function verify(headers, body) {
  if (!SECRET) return false;
  const id = headers["svix-id"], ts = headers["svix-timestamp"], sigs = headers["svix-signature"];
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;          // replay window
  const key = Buffer.from(SECRET.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64");
  return sigs.split(" ").some(s => {
    const v = s.split(",")[1] || "";
    return v.length === expected.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected));
  });
}

async function resend(path, init = {}) {
  const r = await fetch("https://api.resend.com" + path, { ...init, headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json", ...(init.headers || {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} ${r.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const addrs = v => (Array.isArray(v) ? v : [v]).filter(Boolean).map(x => String(typeof x === "object" ? x.email || x.address : x));

async function forward(data) {
  const id = data.email_id || data.id;
  const to = addrs(data.to).map(a => (a.match(/<([^>]+)>/)?.[1] || a).toLowerCase());
  const alias = to.find(a => ALIASES.includes(a));
  if (!alias) { log("skip: not an alias", to.join(",")); return; }
  let msg = data;
  try { msg = { ...data, ...(await resend(`/emails/receiving/${id}`)) }; } catch (e) { log("fetch body failed", e.message); }
  const from = addrs(msg.from)[0] || "unknown sender";
  const subject = msg.subject || "(no subject)";
  const attachments = (msg.attachments || []).length;
  const note = `Sent to ${alias} from ${from}${attachments ? ` - ${attachments} attachment(s) not forwarded, see Resend` : ""}. Reply normally to answer the sender.`;
  await resend("/emails", { method: "POST", body: JSON.stringify({
    from: FROM, to: [FORWARD_TO], reply_to: from, subject: `[${alias.split("@")[0]}@] ${subject}`,
    text: `${note}\n\n${msg.text || "(no plain-text body)"}`,
    html: `<p style="font:13px sans-serif;color:#666;border-bottom:1px solid #ddd;padding-bottom:8px">${esc(note)}</p>${msg.html || `<pre style="white-space:pre-wrap">${esc(msg.text || "")}</pre>`}`,
  }) });
  log("forwarded", alias, "from", from.replace(/^.*<|>$/g, ""), "id", id);
}

http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/hooks/resend-inbound") { res.writeHead(404).end(); return; }
  let body = "";
  req.on("data", c => { body += c; if (body.length > 2e6) req.destroy(); });
  req.on("end", async () => {
    if (!verify(req.headers, body)) { log("rejected: bad signature"); res.writeHead(401).end(); return; }
    res.writeHead(200).end("ok");
    try { const ev = JSON.parse(body); if (ev.type === "email.received") await forward(ev.data || {}); else log("ignored event", ev.type); }
    catch (e) { log("error", e.message); }
  });
}).listen(Number(process.env.PORT || 4791), "127.0.0.1", () => log("caldera-mail listening"));
