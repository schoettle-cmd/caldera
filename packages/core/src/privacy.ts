/**
 * Last line of defence for text that goes public (journal headlines, focus, wins, themes).
 * Prompts ask AI agents to keep private things out; this enforces it in code, because an agent can ignore a prompt.
 * Policy: when a line looks even slightly sensitive, drop the whole line. An empty journal is fine; a leak is not.
 *
 * Dropped: times and meeting language, locations and addresses, other people's names, secrecy / unannounced work,
 * legal / health / HR / money / family matters, contact details and links.
 * Kept: names the owner has deliberately made public (their name, projects, topics, links...) plus common product names.
 */

const RULES: [string, RegExp][] = [
  ["time", /\b\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?)\b|\b\d{1,2}:\d{2}\b|\b(noon|midnight|o'clock|this morning|this afternoon|tonight|tomorrow|tmrw)\b/i],
  ["meeting", /\b(meeting|meetings|met with|meet with|meets with|call with|calls with|called|zoom|lunch|dinner|breakfast|coffee|drinks|catch[- ]?up|1[:-]1|one[- ]on[- ]one|interview(ed)?|pitched|pitch meeting|sync with|session with|appointment|attendee|agenda|board meeting|offsite|hosted|visited|visit to|trip|flight|flew|travel(l?ed|ing)?)\b/i],
  ["location", /\b(?:in|at|from|to|near|around)\s+(?:the\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/],   // case-sensitive: "in Santa Monica", not "in the category"
  ["place", /\b(street|st\.|avenue|ave\.|boulevard|blvd|road|rd\.|lane|suite|ste\.|hotel|restaurant|airport|hq|headquarters|downtown|neighborhood|zip code|address|office in|offices in)\b/i],
  ["secret", /\b(secret|confidential|stealth|unannounced|under wraps|nda|non[- ]disclosure|private beta|embargo(ed)?|off the record|internal only|not public|leak(ed)?|rumou?r|codename|code name)\b/i],
  ["trouble", /\b(lawsuit|sue[ds]?|legal|lawyer|attorney|court|settlement|investigation|fired|firing|layoffs?|laid off|resign(ed|ation)?|hr\b|complaint|harass\w*|divorce|custody|diagnos\w*|therapy|therapist|doctor|hospital|surgery|medical|health|pregnan\w*|arrest\w*|police|debt|bankrupt\w*|salary|raise|bonus|equity|valuation|term sheet|acquisition|acquire[ds]?|merger|investor|investors|fundrais\w*|round|due diligence|diligence|cap table)\b/i],
  ["money", /[$€£¥]\s?\d|\b\d[\d,.]*\s?(k|m|mm|bn|million|billion|thousand|usd|dollars?|euros?)\b/i],
  ["contact", /[\w.+-]+@[\w-]+\.[\w.]+|(?<!\d)(\+?\d[\d .()-]{7,}\d)(?!\d)|https?:\/\/|www\./i],
  ["family", /\b(wife|husband|partner|girlfriend|boyfriend|ex-wife|ex-husband|son|daughter|kids?|children|mom|dad|mother|father|brother|sister|family)\b/i],
];

/** Common product and tech names that are not people. Extended at runtime with the owner's own public words. */
const BASE_ALLOW = ["Obsidian", "Caldera", "Claude", "Claude Code", "ChatGPT", "OpenAI", "Codex", "Cursor", "GitHub", "Git", "Google", "Gmail",
  "Apple", "iOS", "Android", "Mac", "macOS", "Windows", "Linux", "Notion", "Slack", "Discord", "Figma", "Python", "JavaScript", "TypeScript",
  "React", "Node", "AI", "API", "LLM", "MCP", "SQL", "CSS", "HTML", "PDF", "CRM", "SEO", "UX", "UI", "Markdown", "Monday", "Tuesday",
  "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December", "Building", "Operations", "Research", "Writing", "Design", "Shipping", "Learning"];

export interface PublicTextFilter { (line: string): boolean; why(line: string): string | null }

/** Build a filter. `allowed` = names the owner already published on purpose (their name, projects, topics, links...). */
export function publicTextFilter(allowed: string[] = []): PublicTextFilter {
  const allow = new Set([...BASE_ALLOW, ...allowed].flatMap(a => [a.toLowerCase(), ...a.toLowerCase().split(/\s+/)]).filter(Boolean));
  const why = (line: string): string | null => {
    const t = String(line ?? "").trim();
    if (!t) return null;
    for (const [name, rx] of RULES) {
      const m = t.match(rx);
      if (!m) continue;
      if (name === "location") {
        // "in Claude Code", "with GitHub" etc. are fine when every capitalized word is an allowed public name
        const words = (m[0].match(/[A-Z][a-z]+/g) || []);
        if (words.length && words.every(w => allow.has(w.toLowerCase()))) continue;
      }
      return name;
    }
    // other people's names: capitalized words (not sentence-initial) that the owner hasn't made public
    const words = t.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[^A-Za-z'-]/g, "");
      if (!/^[A-Z][a-z]{1,}/.test(w)) continue;
      if (/[.!?:]$/.test(words[i - 1])) continue;              // start of a new sentence
      if (allow.has(w.toLowerCase()) || allow.has(w.toLowerCase().replace(/'s$/, ""))) continue;
      return "name";
    }
    return null;
  };
  const f = ((line: string) => why(line) === null) as PublicTextFilter;
  f.why = why;
  return f;
}
