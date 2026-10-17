import esbuild from "esbuild";
await esbuild.build({
  entryPoints: ["src/main.ts"], bundle: true, loader: { ".css": "text" }, format: "cjs", target: "es2020", platform: "browser",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"], outfile: "main.js", sourcemap: false, logLevel: "info",
});
// render.ts is pure (no obsidian import) so it can be unit-tested in Node
await esbuild.build({ entryPoints: ["src/render.ts"], bundle: true, loader: { ".css": "text" }, format: "esm", platform: "node", packages: "external", outfile: "test/render.build.mjs" });
await esbuild.build({ entryPoints: ["src/garden.ts"], bundle: true, loader: { ".css": "text" }, format: "esm", platform: "node", packages: "external", outfile: "test/garden.build.mjs" });
await esbuild.build({ entryPoints: ["src/owner.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/owner.build.mjs" });
await esbuild.build({ entryPoints: ["src/city.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/city.build.mjs" });
await esbuild.build({ entryPoints: ["src/links.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/links.build.mjs" });
