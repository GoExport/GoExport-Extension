// Shared by the FlashThemes content script and the options page.
//
// GoExport v2 URL protocol:
// https://github.com/GoExport/GoExport/wiki/URL%E2%80%90Protocol
//
//   goexport://record?movie_id=<id>&user_id=<id>&format=mp4&resolution=1280x720
//     &wide=true&outro=true&url=...&api_url=...&swf_url=...&store_path=...
//     &client_theme_path=...
//
// GoExport rejects the whole request if any parameter is unknown, repeated or
// invalid, so everything here is validated before a link is built.

// Server settings from GoExport's "FlashThemes" preset (presets.toml).
// `{user_id}` is left for GoExport to fill in, as the preset does.
var GOEXPORT_FLASHTHEMES_SERVERS = {
  url: "https://flashthemes.net/",
  api_url: "https://flashthemes.net/",
  swf_url: "https://lightspeed.flashthemes.net/static/animation/new87/player.swf?v=2",
  store_path:
    "https://lightspeed.flashthemes.net/static/store/<store>?v={user_id}",
  client_theme_path:
    "https://lightspeed.flashthemes.net/static/ct/ad44370a650793d9/<client_theme>",
};

var GOEXPORT_SERVER_KEYS = [
  "url",
  "api_url",
  "swf_url",
  "store_path",
  "client_theme_path",
];

var GOEXPORT_FORMATS = ["mp4", "mov", "mkv"];

// New storage keys so v1 settings (e.g. resolution "720p") don't leak in.
var GOEXPORT_DEFAULT_SETTINGS = {
  videoResolution: "1280x720",
  videoFormat: "mp4",
  wideMode: "auto", // "auto" (match the movie), "on" or "off"
  useOutro: true,
  ftServers: GOEXPORT_FLASHTHEMES_SERVERS,
};

var GoExport = {
  isValidId: function (value) {
    return (
      typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)
    );
  },

  isValidResolution: function (value) {
    var match = /^([0-9]{1,5})x([0-9]{1,5})$/.exec(value || "");
    if (!match) return false;
    var w = parseInt(match[1], 10);
    var h = parseInt(match[2], 10);
    return w >= 1 && w <= 16384 && h >= 1 && h <= 16384;
  },

  isValidServerUrl: function (value) {
    return (
      typeof value === "string" &&
      /^https?:\/\/[^\s#]+$/.test(value) &&
      !/[\u0000-\u001f\u007f]/.test(value)
    );
  },

  // Fills in any server setting that is missing or blank with the preset value.
  servers: function (settings) {
    var saved = (settings && settings.ftServers) || {};
    var out = {};
    GOEXPORT_SERVER_KEYS.forEach(function (key) {
      var value = typeof saved[key] === "string" ? saved[key].trim() : "";
      out[key] = value || GOEXPORT_FLASHTHEMES_SERVERS[key];
    });
    return out;
  },

  // Returns { url } or { error }.
  buildRecordUrl: function (movie, settings) {
    if (!GoExport.isValidId(movie.movieId)) {
      return { error: "Couldn't find a valid movie ID on this page." };
    }

    var params = [["movie_id", movie.movieId]];

    // The owner's ID is optional for GoExport, but FlashThemes' store path
    // uses it, so send it whenever the page provides one.
    if (GoExport.isValidId(movie.ownerId)) {
      params.push(["user_id", movie.ownerId]);
    }

    if (GOEXPORT_FORMATS.indexOf(settings.videoFormat) === -1) {
      return { error: "Unsupported format: " + settings.videoFormat };
    }
    params.push(["format", settings.videoFormat]);

    if (!GoExport.isValidResolution(settings.videoResolution)) {
      return { error: "Invalid resolution: " + settings.videoResolution };
    }
    params.push(["resolution", settings.videoResolution]);

    var wide = null;
    if (settings.wideMode === "on") wide = true;
    else if (settings.wideMode === "off") wide = false;
    else if (movie.isWide === "1") wide = true;
    else if (movie.isWide === "0") wide = false;
    if (wide !== null) params.push(["wide", wide ? "true" : "false"]);

    params.push(["outro", settings.useOutro ? "true" : "false"]);

    var servers = GoExport.servers(settings);
    for (var i = 0; i < GOEXPORT_SERVER_KEYS.length; i++) {
      var key = GOEXPORT_SERVER_KEYS[i];
      if (!GoExport.isValidServerUrl(servers[key])) {
        return { error: "Invalid " + key + " in the extension settings." };
      }
      params.push([key, servers[key]]);
    }

    var url =
      "goexport://record?" +
      params
        .map(function (p) {
          return p[0] + "=" + encodeURIComponent(p[1]);
        })
        .join("&");

    if (url.length > 4096) {
      return { error: "The GoExport link is too long (over 4096 characters)." };
    }
    return { url: url };
  },
};

if (typeof module !== "undefined") {
  module.exports = {
    GoExport: GoExport,
    GOEXPORT_DEFAULT_SETTINGS: GOEXPORT_DEFAULT_SETTINGS,
    GOEXPORT_FLASHTHEMES_SERVERS: GOEXPORT_FLASHTHEMES_SERVERS,
  };
}
