# GoExport Chrome Extension - AI Coding Instructions

## Project Overview

This is a **Manifest V2** Chrome extension that integrates FlashThemes.net with GoExport (a desktop application). It injects custom UI buttons on FlashThemes movie pages to launch exports via the `goexport://` protocol handler.

### Architecture

- **Content Script** (`ft/player.js`): Injected into `*://flashthemes.net/movie/*` pages at `document_idle`
- **Background Script** (`background.js`): Non-persistent event page handling messages between content script and extension options
- **Options Page** (`options.html/js/css`): Sync storage-backed settings UI for GoExport parameters

## Critical Workflows

### Testing Changes

1. Make code edits
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select the extension directory
5. Navigate to any FlashThemes movie page (e.g., `flashthemes.net/movie/*`)
6. Check browser console for debug logs (the content script logs extensively)
7. For options changes: Right-click extension icon → "Options"

### Protocol Handler Dependency

The extension requires GoExport desktop app installed with `goexport://` protocol registered. On Windows, this is automatic via installer. On Linux, users must manually register the handler (see [GoExport docs](https://github.com/GoExport/GoExport/tree/main/docs)).

## Code Conventions

### Settings Management Pattern

`goexport.js` is loaded by both the content script (see `manifest.json`) and the options page. It holds the single source of truth:

- `GOEXPORT_FLASHTHEMES_SERVERS`: server settings copied from GoExport's FlashThemes preset
- `GOEXPORT_DEFAULT_SETTINGS`: `videoResolution` (`WIDTHxHEIGHT`), `videoFormat` (`mp4`/`mov`/`mkv`), `wideMode` (`auto`/`on`/`off`), `useOutro`, `ftServers`
- `GoExport.buildRecordUrl()`: validates everything and builds the `goexport://record?...` link

Settings live in `chrome.storage.sync`. Saving reloads all FlashThemes movie tabs.

### Content Script Injection Strategy

`ft/player.js` waits for full page load (`window.addEventListener("load")`) before:

1. Parsing FlashThemes' inline `flashvars` JavaScript object using regex (see `GatherVariables()`)
2. Extracting `movieId`, `movieOwnerId`, `isWide` from the flashvars
3. Creating two buttons in `#movie_actions .actions` container:
   - Export button: Launches `goexport://` URL with query params
   - Settings button: Sends message to background script to open options

### URL Construction for GoExport (v2 protocol)

See https://github.com/GoExport/GoExport/wiki/URL%E2%80%90Protocol. Example:

```
goexport://record?movie_id=X&user_id=Y&format=mp4&resolution=1280x720&wide=true&outro=true&url=...&api_url=...&swf_url=...&store_path=...&client_theme_path=...
```

GoExport rejects the whole link if any parameter is unknown, repeated or invalid, so never add parameters outside that list. All values are URL-encoded.

## Branches

- `2.x` (default): GoExport v2. Tags `v2.x.x`.
- `1.x`: GoExport v1 (old `goexport://?video_id=...` links). Tags `v1.x.x`.

The release workflow refuses to build a tag that isn't on its major version's branch.

## Key Files

- **`goexport.js`**: Shared defaults, validation and URL building
- **`ft/player.js`**: Core injection logic; modify to change button behavior or data extraction
- **`options.js`**: Settings UI logic; `DEFAULT_SETTINGS` object is the single source of truth
- **`manifest.json`**: Manifest V2 format; `content_scripts.matches` controls injection targets
- **`background.js`**: Minimal message relay; only handles opening options page

## Common Tasks

### Adding a New Setting

1. Add to `GOEXPORT_DEFAULT_SETTINGS` in `goexport.js`
2. Add UI elements in `options.html` (follow existing `.setting-item` structure)
3. Update `loadSettings()` and `saveSettings()` in `options.js`
4. Use it in `GoExport.buildRecordUrl()` (only if the protocol accepts it)

### Changing Target Website

Modify `manifest.json` → `content_scripts[0].matches` array. If not FlashThemes, rewrite `GatherVariables()` to extract video data from the new site's DOM/scripts.

### Debugging Extension Issues

- Check console logs: `GatherVariables()` logs extracted data, `launchGoExport()` logs the final URL (or alerts the validation error)
- Verify button injection: Look for elements with IDs `goexport_integration_button` and `goexport_settings_button`
- Test settings persistence: Open DevTools → Application → Storage → Extension storage

## Important Constraints

- **Manifest V2 only**: Uses `manifest_version: 2`. Migrating to V3 requires replacing `chrome.tabs.query` callback-based APIs with promises.
- **No build step**: Raw JavaScript/CSS. No transpilation, bundling, or preprocessing.
- **Sync storage limits**: Chrome limits sync storage to 100KB total, 8KB per item. Settings are small, but keep this in mind.
- **Non-persistent background**: `background.persistent: false` means background script unloads when idle. Only use for event listeners, not long-running state.
