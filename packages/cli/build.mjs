import esbuild from "esbuild";
// Reuse the plugin's own collect + render code; swap the "obsidian" module for a tiny filesystem shim.
await esbuild.build({ entryPoints: ["src/cli.ts"], bundle: true, platform: "node", format: "esm", target: "node20", outfile: "dist/cli.js",
  alias: { obsidian: "./src/obsidian-shim.ts" }, loader: { ".css": "text" }, packages: "external", banner: { js: "#!/usr/bin/env node" } });
