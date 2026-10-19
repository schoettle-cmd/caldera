import esbuild from "esbuild";
import fs from "node:fs";
// Every release's files carry their version, so no two releases ship byte-identical main.js or styles.css (the Obsidian
// directory looks up signatures by file contents, and an older release's signature must never be found for a newer one).
const version = JSON.parse(fs.readFileSync(new URL("./manifest.json", import.meta.url), "utf8")).version, stamp = `/* Caldera ${version} */`;
const css = fs.readFileSync(new URL("./styles.css", import.meta.url), "utf8"), cssBody = css.replace(/^\/\* Caldera [^*]* \*\/\n/, "");
if (css !== stamp + "\n" + cssBody) fs.writeFileSync(new URL("./styles.css", import.meta.url), stamp + "\n" + cssBody);
await esbuild.build({ banner: { js: stamp },
  entryPoints: ["src/main.ts"], bundle: true, loader: { ".css": "text" }, format: "cjs", target: "es2020", platform: "browser",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"], outfile: "main.js", sourcemap: false, logLevel: "info",
});
// render.ts is pure (no obsidian import) so it can be unit-tested in Node
await esbuild.build({ entryPoints: ["src/render.ts"], bundle: true, loader: { ".css": "text" }, format: "esm", platform: "node", packages: "external", outfile: "test/render.build.mjs" });
await esbuild.build({ entryPoints: ["src/garden.ts"], bundle: true, loader: { ".css": "text" }, format: "esm", platform: "node", packages: "external", outfile: "test/garden.build.mjs" });
await esbuild.build({ entryPoints: ["src/owner.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/owner.build.mjs" });
await esbuild.build({ entryPoints: ["src/city.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/city.build.mjs" });
await esbuild.build({ entryPoints: ["src/links.ts"], bundle: true, format: "esm", platform: "node", packages: "external", outfile: "test/links.build.mjs" });
