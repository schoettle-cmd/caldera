import { test } from "node:test";
import assert from "node:assert/strict";
import { externalLinksNewWindow, isExternalHref } from "../dist/index.js";

const own = ["caldera.social"];
test("only off-site links gain target and rel", () => {
  const html = `<a href="https://github.com/x/y">gh</a> <a href="https://caldera.social/@a/">in</a> <a href="/people">rel</a> <a href="#top">anchor</a>
<a href="mailto:a@b.c">mail</a> <a href="obsidian://caldera?friend=a">obs</a> <a class="p" href='http://example.com/a' rel="me">ext2</a>
<a href="https://x.com/a" target="_blank" rel="noopener">already</a> <a name="n">no href</a>`;
  const out = externalLinksNewWindow(html, own);
  assert.match(out, /<a href="https:\/\/github.com\/x\/y" target="_blank" rel="noopener noreferrer">gh<\/a>/);
  assert.match(out, /<a href="https:\/\/caldera.social\/@a\/">in<\/a>/);
  assert.match(out, /<a href="\/people">rel<\/a>/);
  assert.match(out, /<a href="#top">anchor<\/a>/);
  assert.match(out, /<a href="mailto:a@b.c">mail<\/a>/);
  assert.match(out, /<a href="obsidian:\/\/caldera\?friend=a">obs<\/a>/);
  assert.match(out, /<a class="p" href='http:\/\/example.com\/a' rel="me noopener noreferrer" target="_blank">ext2<\/a>/);
  assert.equal((out.match(/target=/g) || []).length, 3);   // gh, ext2, already (not duplicated)
  assert.match(out, /href="https:\/\/x.com\/a" target="_blank" rel="noopener noreferrer"/);
  assert.match(out, /<a name="n">no href<\/a>/);
});
test("isExternalHref", () => {
  assert.equal(isExternalHref("https://caldera.social/x", own), false);
  assert.equal(isExternalHref("https://CALDERA.social/x", own), false);
  assert.equal(isExternalHref("//github.com/a", own), true);
  assert.equal(isExternalHref("javascript:alert(1)", own), false);
});
