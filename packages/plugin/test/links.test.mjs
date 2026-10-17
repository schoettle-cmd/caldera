import { test } from "node:test";
import assert from "node:assert/strict";
import { quickLinkUrl, quickLinkIndex } from "./links.build.mjs";

test("setup form quick links: handles and bare domains become https URLs", () => {
  assert.equal(quickLinkUrl(0, "octo"), "https://github.com/octo");
  assert.equal(quickLinkUrl(0, "github.com/octo"), "https://github.com/octo");
  assert.equal(quickLinkUrl(1, "ada.dev"), "https://ada.dev");
  assert.equal(quickLinkUrl(1, "http://ada.dev/x"), "https://ada.dev/x");
  assert.equal(quickLinkUrl(2, "@ada"), "https://x.com/ada");
  assert.equal(quickLinkUrl(3, "in/ada"), "https://www.linkedin.com/in/ada");
  assert.equal(quickLinkUrl(3, "https://www.linkedin.com/in/ada/"), "https://www.linkedin.com/in/ada/");
  assert.equal(quickLinkUrl(2, "  "), "");
});

test("existing links map onto the quick fields by label or host; others are left alone", () => {
  assert.equal(quickLinkIndex("GitHub", "https://github.com/x"), 0);
  assert.equal(quickLinkIndex("Code", "https://github.com/x"), 0);
  assert.equal(quickLinkIndex("Website", "https://ada.dev"), 1);
  assert.equal(quickLinkIndex("Twitter", "https://twitter.com/x"), 2);
  assert.equal(quickLinkIndex("LinkedIn", "https://linkedin.com/in/x"), 3);
  assert.equal(quickLinkIndex("Newsletter", "https://ada.substack.com"), -1);
  assert.equal(quickLinkIndex("Blog", "https://ada.dev/blog"), -1, "only the Website label claims a generic site");
});
