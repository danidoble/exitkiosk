chrome.runtime.onInstalled.addListener((reason) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: './config.html'
        });
    }
});

/**
 * @param {number} tabId
 * @param {object} changeInfo
 * @param {tab} Tab
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.storage.sync.get({keyword_to_exit: 'exitkiosk'}, async (result) => {
        if (changeInfo.status === "loading" && tab.url && tab.url.indexOf(result.keyword_to_exit) > -1) {
            await chrome.tabs.remove(tabId);
        }
    });
})

/**
 * Just for own custom projects
 */
chrome.runtime.onMessageExternal.addListener(() => {
    return true;
});