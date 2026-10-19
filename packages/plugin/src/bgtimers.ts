/**
 * Timers for background work (republish queue, auto-publish, inbox sync, repo checks, private-view push).
 * Chromium freezes a hidden window's timers: on a Mac where Obsidian sits minimized or behind other windows,
 * window.setTimeout can wait indefinitely, so a queued publish never happens. On desktop these use Node's timers,
 * which keep running; on mobile (no Node) they fall back to the window's own.
 */
import { Platform } from "obsidian";

export type BgTimer = unknown;
const node: any = (() => { try { return Platform.isDesktopApp ? (window as any).require?.("timers") ?? null : null; } catch { return null; } })();

export const later = (fn: () => void, ms: number): BgTimer => node ? node.setTimeout(fn, ms) : window.setTimeout(fn, ms);
export const every = (fn: () => void, ms: number): BgTimer => node ? node.setInterval(fn, ms) : window.setInterval(fn, ms);
export const cancel = (t: BgTimer | null | undefined): void => {
  if (t == null) return;
  if (node) { node.clearTimeout(t); node.clearInterval(t); } else { window.clearTimeout(t as number); window.clearInterval(t as number); }
};
