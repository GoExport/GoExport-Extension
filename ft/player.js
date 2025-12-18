// Make a function called "GatherVariables"
function GatherVariables() {
  var scripts = document.querySelectorAll("script");
  var movieData = {};

  // look through each <script> for one that contains "flashvars"
  for (var i = 0; i < scripts.length; i++) {
    var scriptText = scripts[i].textContent;

    if (scriptText.indexOf("flashvars") !== -1) {
      // crude but effective regex to match the flashvars object
      var match = scriptText.match(/flashvars\s*:\s*\{([\s\S]*?)\}\s*\}/);
      if (match) {
        var objectBody = match[1];

        // extract key-value pairs like key:"value"
        var pairs = objectBody.match(/(\w+):"([^"]*)"/g);
        if (pairs) {
          for (var j = 0; j < pairs.length; j++) {
            var parts = pairs[j].split(":");
            var key = parts[0].trim();
            var value = parts[1].trim().replace(/^"|"$/g, "");
            movieData[key] = value;
          }
        }
        break;
      }
    }
  }

  console.log("Extracted flashvars:", movieData);
  return movieData;
}

function launchGoExport(movieId, movieOwnerId, isWide, settings) {
  // Use the aspect ratio from settings, or fall back to isWide logic
  var aspect_ratio = settings.aspectRatio || (isWide === "1" ? "16:9" : "14:9");

  // Send the user to goexport://?video_id=...&owner_id=...
  return function () {
    var goExportUrl =
      "goexport://?video_id=" +
      encodeURIComponent(movieId) +
      "&user_id=" +
      encodeURIComponent(movieOwnerId) +
      "&service=ft" +
      "&no_input=1" +
      "&aspect_ratio=" +
      encodeURIComponent(aspect_ratio) +
      "&resolution=" +
      encodeURIComponent(settings.resolution) +
      "&open_folder=" +
      (settings.openFolder ? "1" : "0") +
      "&use_outro=" +
      (settings.useOutro ? "1" : "0") +
      "&obs_required=" +
      (settings.requireOBS ? "1" : "0");
    console.log("Navigating to GoExport URL:", goExportUrl);
    window.location.href = goExportUrl;
  };
}

// Wait for the page to fully load before touching the DOM
window.addEventListener("load", function () {
  // Load settings from Chrome storage with all GoExport settings
  chrome.storage.sync.get(
    {
      aspectRatio: "16:9",
      resolution: "720p",
      openFolder: false,
      useOutro: true,
      requireOBS: false,
    },
    function (settings) {
      console.log("Loaded settings:", settings);

      // Initial variables
      var movieData = GatherVariables();
      var movieId = movieData["movieId"];
      var movieOwnerId = movieData["movieOwnerId"];
      var wide = movieData["isWide"];

      // Pass settings to the button creation logic
      createGoExportButton(movieId, movieOwnerId, wide, settings);
    }
  );
});

// Create a single button that uses the user's saved settings
function createGoExportButton(movieId, movieOwnerId, wide, settings) {
  // Find the container that holds the action buttons
  var container = document.querySelector("#movie_actions .actions");
  if (!container) {
    console.log("No movie_actions container found.");
    return;
  }

  // Check if we already added our button (avoid duplicates)
  if (document.getElementById("goexport_integration_button")) {
    return;
  }

  // Create the export button
  var newButton = document.createElement("div");
  newButton.className = "movie_action_button";
  newButton.id = "goexport_integration_button";
  newButton.href = "javascript:void(0);";
  newButton.onclick = launchGoExport(movieId, movieOwnerId, wide, settings);

  // Tooltip for hover
  var tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = "Export with GoExport (" + settings.resolution + ")";

  // Append the export button to the container
  newButton.appendChild(tooltip);
  container.appendChild(newButton);

  // Create the settings button
  var settingsButton = document.createElement("div");
  settingsButton.className = "movie_action_button";
  settingsButton.id = "goexport_settings_button";
  settingsButton.href = "javascript:void(0);";
  settingsButton.onclick = function () {
    chrome.runtime.sendMessage({ action: "openSettings" });
  };

  // Tooltip for settings button
  var settingsTooltip = document.createElement("div");
  settingsTooltip.className = "tooltip";
  settingsTooltip.textContent = "GoExport Settings";

  // Append the settings button to the container
  settingsButton.appendChild(settingsTooltip);
  container.appendChild(settingsButton);
}
