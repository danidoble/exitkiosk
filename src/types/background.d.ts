export interface PrevStorageData {
    keyword_to_exit: string;
    keywords: string[];
}

interface Options {
    keywords: string[];
    enabled: boolean;
    version: string;
    notifyEvent: boolean;
}

export interface StorageData {
    options: Options;
}

export interface Config extends Options {
    lastTabId: number;
}

export interface SyncOptionsMessage {
    type: 'syncOptions';
    options: Options;
}

export interface ResetRulesMessage {
    type: 'resetRules';
}

export interface ReloadOptionsMessage {
    type: 'reloadOptions';
}

export type ExitKioskMessage = SyncOptionsMessage | ResetRulesMessage | ReloadOptionsMessage;
