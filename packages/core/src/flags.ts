/**
 * Feature switches. The garden (notes published as pages, the garden home, links between gardens, the gardens
 * stream) is paused: the code stays, nothing shows. To bring it back, set the default below to true (Obsidian
 * plugin) and run the hub with CALDERA_GARDEN=1.
 * Kept on globalThis so every bundled copy of core (the plugin, the hub, the hub's copy of the renderer) shares one switch.
 */
const G = globalThis as unknown as { __calderaFlags?: { garden: boolean } };
export const FLAGS: { garden: boolean } = G.__calderaFlags || (G.__calderaFlags = { garden: false });
export const gardenEnabled = (): boolean => FLAGS.garden;
