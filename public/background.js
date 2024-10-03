chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'queryTabs') {
        chrome.tabs.query({ audible: true }, (tabs) => {
            sendResponse({ tabs })
        })
    }
    return true
})
