/**
 * The city in a small window that stays on top: an Obsidian pop-out window holding just the city (mini mode), parked in the
 * lower-left corner of the screen, for watching it work all day. Obsidian's Electron can't open Document Picture-in-Picture
 * windows, so the pop-out window is pinned on top through Electron instead (desktop only; without it, it's a normal window).
 */
import { ItemView, WorkspaceLeaf, Platform } from "obsidian";
import type CalderaPlugin from "./main";

export const CITY_FLOAT_VIEW = "caldera-city-float";
const W = 420, H = 280, TITLE = "Caldera city";

export interface FloatSpec { html?: string; src?: string; live?: boolean }

export class CityFloatView extends ItemView {
  private frame: HTMLIFrameElement | null = null;
  private liveTimer: number | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: CalderaPlugin) { super(leaf); }
  getViewType() { return CITY_FLOAT_VIEW; }
  getDisplayText() { return TITLE; }
  getIcon() { return "building-2"; }

  async onOpen() {
    const root = this.contentEl; root.empty(); root.addClass("caldera-float");
    root.createDiv({ cls: "caldera-float-drag", attr: { "aria-hidden": "true" } });   // a thin strip to drag the window by
    this.frame = root.createEl("iframe", { cls: "caldera-float-frame" });
    this.frame.setAttr("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
    this.frame.addEventListener("load", () => window.setTimeout(() => void this.pushLive(), 400));
    this.liveTimer = window.setInterval(() => void this.pushLive(), 10_000);
    this.showSpec(this.plugin.floatSpec);
    // the window around this view: just the city (no tab bar), on top, small, lower-left. The leaf moves into its pop-out
    // window after it opens, so check for a few seconds.
    let tries = 0;
    const dress = () => {
      const doc = this.containerEl.doc;
      if (this.containerEl.win !== window) { doc.body.addClass("caldera-float-window"); pinWindow(); return; }
      if (++tries < 20) window.setTimeout(dress, 150);
    };
    window.setTimeout(dress, 100);
  }

  /** Show a new build of the city (the My profile tab rebuilds it every 10 minutes). */
  showSpec(spec: FloatSpec | null) {
    if (!this.frame || !spec) return;
    if (spec.html) { this.frame.removeAttribute("src"); this.frame.srcdoc = spec.html; }
    else if (spec.src) { this.frame.removeAttribute("srcdoc"); this.frame.src = spec.src; }
  }

  private async pushLive() {
    if (!this.frame || !this.plugin.floatSpec?.live || !this.plugin.settings.traffic?.length) return;
    try { const data = await this.plugin.ownerLive(); this.frame.contentWindow?.postMessage({ caldera: "live", data }, "*"); } catch { /* offline: the city stays quiet */ }
  }

  async onClose() { if (this.liveTimer) window.clearInterval(this.liveTimer); }
}

/** Pin the city's pop-out window: always on top (across desktops), 420x280, lower-left of the screen it's on. */
function pinWindow() {
  if (!Platform.isDesktopApp) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Electron window controls exist only on desktop
    const remote = (window as unknown as { require: (m: string) => any }).require("@electron/remote");
    const bw = remote.BrowserWindow.getAllWindows().find((w: { getTitle(): string }) => w.getTitle().startsWith(TITLE));   // Obsidian titles it "Caldera city - vault - Obsidian"
    if (!bw) return;
    const wa = remote.screen.getDisplayMatching(bw.getBounds()).workArea;
    bw.setAlwaysOnTop(true, "floating"); bw.setVisibleOnAllWorkspaces?.(true, { visibleOnFullScreen: true });
    bw.setBounds({ x: wa.x + 12, y: wa.y + wa.height - H - 12, width: W, height: H });
  } catch { /* not available: it stays a normal pop-out window */ }
}

export const FLOAT_SIZE = { width: W, height: H };
