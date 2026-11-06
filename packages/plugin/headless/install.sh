#!/usr/bin/env bash
# Install the Inbox Hero headless sync as a launchd agent (every 5 minutes: poll for "Sync now", daily run after 4:30am
# Pacific). Re-run after changing headless/ih-sync.ts. Reads the vault and the plugin's data.json; writes only to
# ~/.ih-obsidian-sync. Usage: headless/install.sh [vault dir]
set -euo pipefail
cd "$(dirname "$0")/.."
VAULT="${1:-$HOME/claude-obsidian}"; DIR="$HOME/.ih-obsidian-sync"; LABEL=com.mjones.ih-obsidian-sync
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"; NODE="$(command -v node)"
node esbuild.config.mjs >/dev/null
mkdir -p "$DIR"; chmod 700 "$DIR"; cp headless/ih-sync.mjs "$DIR/ih-sync.mjs"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$DIR/ih-sync.mjs</string><string>--vault</string><string>$VAULT</string><string>--daily</string><string>04:30</string><string>--tz</string><string>America/Los_Angeles</string></array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>$DIR/sync.log</string>
  <key>StandardErrorPath</key><string>$DIR/sync.log</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed $LABEL (vault $VAULT); log $DIR/sync.log"
