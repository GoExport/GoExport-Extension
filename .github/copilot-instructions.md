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

Settings use **Chrome's sync storage** (`chrome.storage.sync`) with a centralized default structure:

```javascript
const DEFAULT_SETTINGS = {
  aspectRatio: "16:9",
  resolution: "720p",
  openFolder: false,
  useOutro: true,
};
```

- When adding settings: Update `DEFAULT_SETTINGS` in `options.js` and `chrome.storage.sync.get()` calls in `ft/player.js`
- Settings changes trigger tab reloads: `chrome.tabs.query()` finds all FlashThemes tabs and reloads them

### Content Script Injection Strategy

`ft/player.js` waits for full page load (`window.addEventListener("load")`) before:

1. Parsing FlashThemes' inline `flashvars` JavaScript object using regex (see `GatherVariables()`)
2. Extracting `movieId`, `movieOwnerId`, `isWide` from the flashvars
3. Creating two buttons in `#movie_actions .actions` container:
   - Export button: Launches `goexport://` URL with query params
   - Settings button: Sends message to background script to open options

### Dynamic Resolution Options

Resolution options in `options.js` are **aspect-ratio dependent** (matches GoExport's Wrapper: Offline). When aspect ratio changes, `updateResolutionOptions()` repopulates the dropdown and attempts to preserve the current selection or defaults to 720p.

### URL Construction for GoExport

The `launchGoExport()` function builds URLs like:

```
goexport://?video_id=X&user_id=Y&service=ft&no_input=1&aspect_ratio=16:9&resolution=720p&open_folder=0&use_outro=1
```

All parameters are URL-encoded. `service=ft` identifies FlashThemes as the source.

## Key Files

- **`ft/player.js`**: Core injection logic; modify to change button behavior or data extraction
- **`options.js`**: Settings UI logic; `DEFAULT_SETTINGS` object is the single source of truth
- **`manifest.json`**: Manifest V2 format; `content_scripts.matches` controls injection targets
- **`background.js`**: Minimal message relay; only handles opening options page

## Common Tasks

### Adding a New Setting

1. Add to `DEFAULT_SETTINGS` in `options.js`
2. Add UI elements in `options.html` (follow existing `.setting-item` structure)
3. Update `loadSettings()` and `saveSettings()` in `options.js`
4. Update `chrome.storage.sync.get()` default object in `ft/player.js`
5. Pass new setting through `createGoExportButton()` and use in `launchGoExport()`

### Changing Target Website

Modify `manifest.json` → `content_scripts[0].matches` array. If not FlashThemes, rewrite `GatherVariables()` to extract video data from the new site's DOM/scripts.

### Debugging Extension Issues

- Check console logs: `GatherVariables()` logs extracted data, `launchGoExport()` logs the final URL
- Verify button injection: Look for elements with IDs `goexport_integration_button` and `goexport_settings_button`
- Test settings persistence: Open DevTools → Application → Storage → Extension storage

## Important Constraints

- **Manifest V2 only**: Uses `manifest_version: 2`. Migrating to V3 requires replacing `chrome.tabs.query` callback-based APIs with promises.
- **No build step**: Raw JavaScript/CSS. No transpilation, bundling, or preprocessing.
- **Sync storage limits**: Chrome limits sync storage to 100KB total, 8KB per item. Settings are small, but keep this in mind.
- **Non-persistent background**: `background.persistent: false` means background script unloads when idle. Only use for event listeners, not long-running state.
