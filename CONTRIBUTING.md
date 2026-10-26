# Contributing to Caldera

Thanks for helping. Small, focused pull requests are the easiest to review and merge.

## Set up

```
git clone https://github.com/schoettle-cmd/caldera
cd caldera && npm install && npm run build && npm test
```

The Obsidian plugin is in `packages/plugin` (the city is `packages/plugin/src/city.ts`), shared identity and crypto code in `packages/core`. To try a change in Obsidian, copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/caldera/` and restart Obsidian.

The website, the hub and the README badges (`caldera.social/gh/<user>`) live in [schoettle-cmd/caldera-hub](https://github.com/schoettle-cmd/caldera-hub), which expects this repo checked out next to it.

## Good first issues

Look for the [`good first issue`](https://github.com/schoettle-cmd/caldera/labels/good%20first%20issue) label here and in caldera-hub. Comment on an issue before you start so two people don't build the same thing.

**Hacktoberfest:** both repos take part. Merged pull requests get the `hacktoberfest-accepted` label.

## Pull requests

- Run `npm test` before you push, and add a test when you change behavior.
- Never include anyone's private data in tests or screenshots. Use made-up repos and names.
- The plugin is MIT, `packages/core` is MIT and the protocol spec is CC-BY-4.0. By opening a pull request you agree your change is shared under the same license.
