// Injects the agent prompt (single source: @caldera/core agentPrompt) into the landing page.
import fs from "node:fs";
import { agentPrompt } from "../packages/core/dist/index.js";
const p = new URL("../packages/site/index.html", import.meta.url);
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = fs.readFileSync(p, "utf8").replace(/<!-- AGENT_PROMPT_START -->[\s\S]*?<!-- AGENT_PROMPT_END -->/,
  "<!-- AGENT_PROMPT_START -->" + esc(agentPrompt({ hubUrl: "https://caldera.social" })) + "<!-- AGENT_PROMPT_END -->");
fs.writeFileSync(p, html);
console.log("agent prompt injected");
