// GOEXPORT_DEFAULT_SETTINGS, GOEXPORT_FLASHTHEMES_SERVERS, GOEXPORT_SERVER_KEYS
// and GoExport come from goexport.js.

function $(id) {
  return document.getElementById(id);
}

function hasPreset(resolution) {
  return !!document.querySelector(
    '#resolutionPreset option[value="' + resolution + '"]'
  );
}

function setResolution(resolution) {
  if (hasPreset(resolution) && resolution !== "custom") {
    $("resolutionPreset").value = resolution;
    $("resolutionCustom").value = "";
  } else {
    $("resolutionPreset").value = "custom";
    $("resolutionCustom").value = resolution;
  }
  updateCustomVisibility();
}

function getResolution() {
  var preset = $("resolutionPreset").value;
  return preset === "custom" ? $("resolutionCustom").value.trim() : preset;
}

function updateCustomVisibility() {
  $("resolutionCustom").hidden = $("resolutionPreset").value !== "custom";
}

function setServers(servers) {
  GOEXPORT_SERVER_KEYS.forEach(function (key) {
    $("server_" + key).value = servers[key];
  });
}

function showStatus(message, isError) {
  var status = $("status");
  status.textContent = message;
  status.classList.toggle("error", !!isError);
  status.style.opacity = "1";
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(
    function () {
      status.style.opacity = "0";
    },
    isError ? 5000 : 2000
  );
}

function loadSettings() {
  chrome.storage.sync.get(GOEXPORT_DEFAULT_SETTINGS, function (items) {
    setResolution(items.videoResolution);
    $("videoFormat").value = items.videoFormat;
    $("wideMode").value = items.wideMode;
    $("useOutro").checked = items.useOutro;
    setServers(GoExport.servers(items));
  });
}

function saveSettings() {
  var resolution = getResolution();
  if (!GoExport.isValidResolution(resolution)) {
    showStatus(
      "Resolution must be WIDTHxHEIGHT, each between 1 and 16384.",
      true
    );
    return;
  }

  var servers = {};
  for (var i = 0; i < GOEXPORT_SERVER_KEYS.length; i++) {
    var key = GOEXPORT_SERVER_KEYS[i];
    var value = $("server_" + key).value.trim();
    if (value && !GoExport.isValidServerUrl(value)) {
      showStatus(key + " must be an http:// or https:// URL with no spaces.", true);
      return;
    }
    servers[key] = value;
  }

  var settings = {
    videoResolution: resolution,
    videoFormat: $("videoFormat").value,
    wideMode: $("wideMode").value,
    useOutro: $("useOutro").checked,
    ftServers: servers,
  };

  chrome.storage.sync.set(settings, function () {
    // Show the defaults in any field left blank.
    setServers(GoExport.servers(settings));
    showStatus("Settings saved!");

    // Reload all FlashThemes movie tabs to apply new settings
    chrome.tabs.query({ url: "*://flashthemes.net/movie/*" }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.reload(tab.id);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadSettings();

  $("save").addEventListener("click", saveSettings);
  $("resolutionPreset").addEventListener("change", updateCustomVisibility);
  $("resetServers").addEventListener("click", function () {
    setServers(GOEXPORT_FLASHTHEMES_SERVERS);
    showStatus("Servers reset. Click Save to keep them.");
  });
});
