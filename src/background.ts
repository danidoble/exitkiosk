import type { StorageData, PrevStorageData, ExitKioskMessage, Config } from './types/background';

// Default configuration
const defaultOptions: StorageData = {
    options: {
        keywords: ['exitkiosk'],
        enabled: true,
        version: '1.3.0',
        notifyEvent: false
    }
};

// In-memory configuration state
const data: Config = {
    keywords: ['exitkiosk'],
    enabled: true,
    version: '1.3.0',
    notifyEvent: false,
    lastTabId: 0
};

/**
 * Handles the initial installation of the extension.
 * Sets default options and opens the options page.
 */
const handleInstall = async (): Promise<void> => {
    await chrome.storage.sync.set(defaultOptions);
    Object.assign(data, defaultOptions.options);
    await chrome.runtime.openOptionsPage();
};

/**
 * Handles the upgrade process from previous versions.
 * Migrates old string-based keywords to the new array format.
 */
const handleUpgrade = async (): Promise<string[]> => {
    // Legacy support for versions < 1.2.0
    const prevData = (await chrome.storage.sync.get({
        keyword_to_exit: '',
        keywords: []
    })) as PrevStorageData;

    // Remove legacy keys if they exist
    if (prevData.keyword_to_exit) {
        await chrome.storage.sync.remove('keyword_to_exit');
    }

    if (prevData.keywords.length > 0) {
        await chrome.storage.sync.remove('keywords');
    }

    // Merge and deduplicate keywords
    const mergedKeywords = [...prevData.keywords];
    if (prevData.keyword_to_exit) {
        mergedKeywords.push(prevData.keyword_to_exit);
    }

    const keywords = [...new Set(mergedKeywords)];

    // Ensure at least one keyword exists
    if (keywords.length === 0) {
        keywords.push('exitkiosk');
    }

    return keywords;
};

/**
 * Handles extension updates.
 * Migrates settings if necessary or loads existing options.
 */
const handleUpdate = async (): Promise<void> => {
    const currentData = (await chrome.storage.sync.get('options')) as StorageData;

    if (!currentData.options) {
        // Upgrade needed
        const previousKeywords = await handleUpgrade();

        Object.assign(data, {
            keywords: previousKeywords,
            enabled: true,
            version: '1.3.0',
            notifyEvent: false,
            lastTabId: 0
        });

        // Clear and save new structure
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set({ options: data });
    } else {
        // Just update in-memory data
        Object.assign(data, currentData.options);
    }

    await chrome.runtime.openOptionsPage();
};

/**
 * Listener for installation and update events.
 */
chrome.runtime.onInstalled.addListener(async details => {
    try {
        if (details.reason === 'install') {
            await handleInstall();
        } else if (details.reason === 'update') {
            await handleUpdate();
        }
    } catch (error) {
        console.error('Error during install/update:', error);
    }
});

/**
 * Checks if the URL matches any configured keyword.
 */
const matchUrl = (url: string): string | null => {
    if (data.keywords.some(keyword => keyword && url.includes(keyword))) {
        return url;
    }
    return null;
};

/**
 * Handles logic when a tab is updated (navigation).
 * Checks if the URL should trigger an exit (tab removal).
 */
const handleTabUpdate = async (url: string, tabId: number): Promise<void> => {
    const matchedUrl = matchUrl(url);
    if (!matchedUrl) return;

    data.lastTabId = tabId;
    try {
        await chrome.tabs.remove(tabId);
        notify();
        data.lastTabId = 0;
    } catch (error) {
        console.debug('Error removing tab:', error);
    }
};

/**
 * Tab update listener to monitor navigation.
 */
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (!data.enabled) return;

    const url = tab.url || change.url;

    const checkRedirection = async () => {
        if (change.status === 'loading' && url) {
            await handleTabUpdate(url, tabId);
        }

        if (change.status === 'complete' && tabId === data.lastTabId) {
            notify();
            data.lastTabId = 0;
        }
    };

    checkRedirection().catch(err => console.error('Error in onUpdated:', err));
});

/**
 * Displays a system notification if enabled.
 */
const notify = (): void => {
    if (!data.notifyEvent) return;

    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('img/icon-48.png'),
        title: chrome.i18n.getMessage('app_name'),
        message: chrome.i18n.getMessage('notification_event')
    });
};

/**
 * Updates the in-memory configuration.
 */
const syncOptions = (options: StorageData['options']): void => {
    Object.assign(data, {
        enabled: options.enabled,
        notifyEvent: options.notifyEvent,
        keywords: options.keywords,
        version: options.version
    });
};

/**
 * Resets the extension configuration to defaults.
 */
const resetRules = async (): Promise<void> => {
    Object.assign(data, defaultOptions.options);

    await chrome.storage.sync.set(defaultOptions);

    try {
        await chrome.runtime.sendMessage({ type: 'reloadOptions' });
    } catch (error) {
        // Message might fail if no other views are open, which is fine
        console.debug('Error sending reload message:', error);
    }
};

/**
 * Message listener for communication with Options page.
 */
chrome.runtime.onMessage.addListener((message: ExitKioskMessage /*_sender, _sendResponse*/): void => {
    // console.debug('Received message:', { message, sender: _sender });

    if (message.type === 'syncOptions') {
        syncOptions(message.options);
        return; // Return undefined implies synchronous handling or no response needed
    }

    if (message.type === 'resetRules') {
        resetRules().catch(error => console.error('Error resetting rules:', error));
    }
});

/**
 * Initial load of options from storage.
 */
const loadOptions = async (): Promise<void> => {
    try {
        const currentData = (await chrome.storage.sync.get('options')) as StorageData;

        if (currentData.options) {
            Object.assign(data, {
                enabled: currentData.options.enabled,
                notifyEvent: currentData.options.notifyEvent,
                keywords: currentData.options.keywords,
                version: currentData.options.version
            });
        }
    } catch (error) {
        console.error('Error loading options:', error);
    }
};

// Initialize
loadOptions().catch(error => console.error('Fatal error initializing options:', error));
