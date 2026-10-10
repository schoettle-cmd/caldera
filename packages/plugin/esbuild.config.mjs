import esbuild from "esbuild";
await esbuild.build({
  entryPoints: ["src/main.ts"], bundle: true, loader: { ".css": "text" }, format: "cjs", target: "es2020", platform: "browser",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"], outfile: "main.js", sourcemap: false, logLevel: "info",
});
// render.ts is pure (no obsidian import) so it can be unit-tested in Node
await esbuild.build({ entryPoints: ["src/render.ts"], bundle: true, loader: { ".css": "text" }, format: "esm", platform: "node", packages: "external", outfile: "test/render.build.mjs" });
