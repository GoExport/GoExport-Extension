// Default settings structure - easily expandable
const DEFAULT_SETTINGS = {
  aspectRatio: "16:9",
  resolution: "720p",
  openFolder: false,
  useOutro: true,
  // Add more default settings here as needed
};

// Resolution options for different aspect ratios (matching Wrapper: Offline)
const resolutionOptions = {
  "16:9": {
    "360p": "360p",
    "480p": "480p",
    "720p": "720p (Recommended)",
    "1080p": "1080p",
    "2k": "2K",
    "4k": "4K",
    "5k": "5K",
    "8k": "8K",
  },
  "14:9": {
    "360p": "360p",
    "480p": "480p",
    "720p": "720p (Recommended)",
    "1080p": "1080p",
    "2k": "2K",
    "4k": "4K",
    "5k": "5K",
    "8k": "8K",
  },
  "9:16": {
    "360p": "360p",
    "480p": "480p",
    "720p": "720p (Recommended)",
    "1080p": "1080p",
    "2k": "2K",
    "4k": "4K",
    "5k": "5K",
    "8k": "8K",
  },
  "4:3": {
    "240p": "240p",
    "360p": "360p",
    "420p": "420p",
    "480p": "480p (Recommended)",
  },
};

// Function to update resolution options based on aspect ratio
function updateResolutionOptions(aspectRatio, currentResolution) {
  const resolutionSelect = document.getElementById("resolution");
  const options = resolutionOptions[aspectRatio];

  // Clear current options
  resolutionSelect.innerHTML = "";

  // Add new options
  for (const [value, label] of Object.entries(options)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    resolutionSelect.appendChild(option);
  }

  // Try to maintain the current selection if it exists in new options
  let newValue;
  if (options[currentResolution]) {
    newValue = currentResolution;
  } else {
    // Default to 720p if available, otherwise first option
    newValue = options["720p"] ? "720p" : Object.keys(options)[0];
  }

  resolutionSelect.value = newValue;
  return newValue;
}

// Load settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, function (items) {
    // Set aspect ratio
    document.getElementById("aspectRatio").value = items.aspectRatio;

    // Update resolution options and set the value
    updateResolutionOptions(items.aspectRatio, items.resolution);

    // Set checkboxes
    document.getElementById("openFolder").checked = items.openFolder;
    document.getElementById("useOutro").checked = items.useOutro;
  });
}

// Save settings to Chrome storage
function saveSettings() {
  const settings = {
    aspectRatio: document.getElementById("aspectRatio").value,
    resolution: document.getElementById("resolution").value,
    openFolder: document.getElementById("openFolder").checked,
    useOutro: document.getElementById("useOutro").checked,
  };

  chrome.storage.sync.set(settings, function () {
    // Show success message
    const status = document.getElementById("status");
    status.textContent = "Settings saved!";
    status.style.opacity = "1";

    // Reload all FlashThemes movie tabs to apply new settings
    chrome.tabs.query({ url: "*://flashthemes.net/movie/*" }, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.reload(tab.id);
      });
    });

    // Fade out after 2 seconds
    setTimeout(function () {
      status.style.opacity = "0";
    }, 2000);
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadSettings();

  // Add save button click handler
  document.getElementById("save").addEventListener("click", saveSettings);

  // Listen for aspect ratio changes to update resolution options
  document
    .getElementById("aspectRatio")
    .addEventListener("change", function () {
      const currentResolution = document.getElementById("resolution").value;
      updateResolutionOptions(this.value, currentResolution);
    });
});
