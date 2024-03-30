chrome.runtime.onInstalled.addListener(async (reason) => {
    // if reason is updated, move the old keyword to the new keywords array
    if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
        const previousKeyword = await chrome.storage.sync.get('keyword_to_exit');
        if (previousKeyword.keyword_to_exit) { // remove old keyword if exists
            await chrome.storage.sync.remove('keyword_to_exit');
            await saveKeywords(previousKeyword.keyword_to_exit);
        }
    }

    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await saveKeywords();
    }

    // open options page after install or update
    if (reason === chrome.runtime.OnInstalledReason.UPDATE || reason === chrome.runtime.OnInstalledReason.INSTALL) {
        await chrome.runtime.openOptionsPage();
    }
});

/**
 * @param {number} tabId
 * @param {object} changeInfo
 * @param {tab} Tab
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const configuration = await chrome.storage.sync.get({keywords: ['exitkiosk']});
    if (changeInfo.status === "loading" && tab.url && configuration.keywords.some(keyword => tab.url.indexOf(keyword) > -1)) {
        await chrome.tabs.remove(tabId);
    }
})

/**
 * Move the old keyword to the new keywords array
 * Now is possible have multiples keywords to exit
 * @param {string} previousKeyword
 */
async function saveKeywords(previousKeyword = 'exitkiosk') {
    let keywords = await chrome.storage.sync.get({keywords: []});
    keywords = keywords.keywords;
    keywords.push(previousKeyword);
    // make unique keywords, removing duplicates
    const uniqueKeywords = [...new Set(keywords)];
    await chrome.storage.sync.set({keywords: uniqueKeywords});
}