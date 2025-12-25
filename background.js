'use strict';

// Recv from popup
async function onMessage(message) {
  console.log("Background message")
  const tabs = await browser.tabs.query({currentWindow: true, active: true})
  // send to content script
  for (const tab of tabs) {
    await browser.tabs.sendMessage(tab.id, {});
  }
}

browser.runtime.onMessage.addListener(onMessage);
