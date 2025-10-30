// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "openSettings") {
    // Open the options page
    chrome.runtime.openOptionsPage();
  }
});
