/**
 * Hub operator tool. Run on the server next to the hub (same data dir):
 *   CALDERA_DATA=/opt/caldera-hub/data node dist/admin.js list
 *   ... hide <handle> "reason"     take a profile down (page 410, out of search/directory); owner cannot republish
 *   ... unhide <handle>            undo hide/block
 *   ... remove <handle> "reason"   erase the profile and everything tied to it, and keep the handle off-limits
 *   ... block <handle> "reason"    reserve a handle so nobody can claim it (impersonation, trademarks)
 */
import { createHub } from "./server.js";
const [cmd, handle, ...why] = process.argv.slice(2);
const hub = createHub({ dataDir: process.env.CALDERA_DATA || "./data" });
const a = hub.admin as any;
if (!cmd || !(cmd in a) || (cmd !== "list" && !handle)) { console.log("usage: admin.js list | hide|unhide|remove|block <handle> [reason]"); process.exit(1); }
console.log(JSON.stringify(cmd === "list" ? a.list() : a[cmd](handle.toLowerCase().replace(/^@/, ""), why.join(" ")), null, 2));
hub.db.close();
