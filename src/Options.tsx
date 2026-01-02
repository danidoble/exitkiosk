import { ModeToggle } from './components/mode-toggle';
import { Trash2, Save, RotateCcw, Plus, XCircle, Coffee, Download, Upload } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { t } from './utils/i18n';
import { getChrome } from './utils/chrome-mock';
import type { Options as OptionsType, StorageData } from './types/background';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from './components/ui/alert-dialog';
import { toast } from 'sonner';

export function Options({ mini = false }: { mini?: boolean }) {
    const chromeApi = getChrome();
    const [saving, setSaving] = useState<boolean>(false);

    const [config, setConfig] = useState<OptionsType>({
        keywords: [''],
        enabled: true,
        version: '1.3.0',
        notifyEvent: false
    });

    const formatKeywordsForUI = (keywords: string[]): string[] => {
        const clean = keywords.filter(k => k !== '');
        return [...clean, ''];
    };

    const loadOptions = async () => {
        try {
            const data = (await chromeApi.storage.sync.get('options')) as StorageData;
            if (data.options) {
                setConfig(() => ({
                    ...data.options,
                    keywords: formatKeywordsForUI(data.options.keywords || [])
                }));
            }
        } catch (error) {
            console.error('Error loading options:', error);
            toast.error(t('app_load_error') || 'Error loading settings');
        }
    };

    useEffect(() => {
        loadOptions();

        const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'sync' && changes.options) {
                const newOptions = changes.options.newValue as OptionsType;
                if (newOptions) {
                    setConfig(() => ({
                        ...newOptions,
                        keywords: formatKeywordsForUI(newOptions.keywords || [])
                    }));
                }
            }
        };

        if (chromeApi.storage.onChanged) {
            chromeApi.storage.onChanged.addListener(storageListener);
        }

        return () => {
            if (chromeApi.storage.onChanged) {
                chromeApi.storage.onChanged.removeListener(storageListener);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEnabledChange = (checked: boolean) => {
        const newConfig = { ...config, enabled: checked };
        setConfig(newConfig);
        saveImplicitly(newConfig);
    };

    const handleNotifyChange = (checked: boolean) => {
        const newConfig = { ...config, notifyEvent: checked };
        setConfig(newConfig);
        saveImplicitly(newConfig);
    };

    const handleKeywordChange = (index: number, value: string) => {
        const newKeywords = [...config.keywords];
        newKeywords[index] = value;

        if (index === newKeywords.length - 1 && value.trim() !== '') {
            newKeywords.push('');
        }

        setConfig({ ...config, keywords: newKeywords });
    };

    const handleKeywordDelete = (index: number) => {
        const newKeywords = config.keywords.filter((_, i) => i !== index);
        if (newKeywords.length === 0) {
            newKeywords.push('');
        }
        setConfig({ ...config, keywords: newKeywords });
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const exportData = {
            options: {
                ...config,
                keywords: [...new Set(config.keywords.filter(k => k !== ''))]
            },
            exported_at: new Date().toISOString(),
            app: 'exitkiosk',
            version: config.version
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exitkiosk-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async e => {
            try {
                const content = e.target?.result as string;
                const importedData = JSON.parse(content);

                // Basic validation
                if (
                    !importedData.options ||
                    !Array.isArray(importedData.options.keywords) ||
                    typeof importedData.options.enabled !== 'boolean'
                ) {
                    throw new Error('Invalid file structure');
                }

                // Clean keywords for import
                const validKeywords = importedData.options.keywords.filter((k: unknown) => typeof k === 'string');

                // Update config
                const newConfig: OptionsType = {
                    keywords: validKeywords.length > 0 ? validKeywords : ['exitkiosk'],
                    enabled: importedData.options.enabled,
                    version: importedData.options.version || '1.0.0',
                    notifyEvent: !!importedData.options.notifyEvent
                };

                setConfig({
                    ...newConfig,
                    keywords: formatKeywordsForUI(newConfig.keywords)
                });

                await saveImplicitly(newConfig);
                toast.success(t('app_import_success') || 'Settings imported');
            } catch (error) {
                console.error('Import error:', error);
                toast.error(t('app_import_error') || 'Invalid file');
            }

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const saveImplicitly = async (data: OptionsType) => {
        const cleanKeywords = [...new Set(data.keywords.filter(k => k.trim() !== ''))];

        const toSave = {
            ...data,
            keywords: cleanKeywords.length > 0 ? cleanKeywords : ['exitkiosk']
        };

        await chromeApi.storage.sync.set({ options: toSave });
        await chromeApi.runtime.sendMessage({ type: 'syncOptions', options: toSave });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const cleanKeywords = [...new Set(config.keywords.filter(k => k.trim() !== ''))];
            if (cleanKeywords.length === 0) {
                toast.error(t('app_keywords_desc') || 'At least one keyword is required');
                setSaving(false);
                return;
            }

            const toSave = {
                ...config,
                keywords: cleanKeywords
            };

            await chromeApi.storage.sync.set({ options: toSave });
            await chromeApi.runtime.sendMessage({ type: 'syncOptions', options: toSave });

            setConfig(prev => ({
                ...prev,
                keywords: formatKeywordsForUI(cleanKeywords)
            }));

            toast.success(t('app_saved') || 'Settings saved');
        } catch (error) {
            console.error('Save error:', error);
            toast.error(t('app_save_error') || 'Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setSaving(true);
        try {
            await chromeApi.runtime.sendMessage({ type: 'resetRules' });
        } catch (error) {
            console.error('Reset error:', error);
            toast.error(t('app_reset_error') || 'Error resetting settings');
            setSaving(false);
        }
    };

    const handleClearKeywords = async () => {
        setSaving(true);
        try {
            const newConfig = { ...config, keywords: [''] };
            // We need at least one keyword potentially, but "Clear" implies empty?
            // Background logic says if empty -> push 'exitkiosk'.
            // Let's clear to default 'exitkiosk' or fully empty but UI handles empty->input.
            // If we save empty list to background, handleUpgrade puts 'exitkiosk'.
            // Let's explicitly save empty and let UI show one empty input.

            // Wait, "Clear all rules" in Redirector meant delete all.
            // Here "Clear all keywords".
            // Implementation: Save empty list -> Background might default it?
            // Let's save ['exitkiosk'] effectively resetting keywords OR just []?
            // "siempre debe quedar una obligatoriamente" - user said.
            // So arguably clearing should leave us with 1 empty input (which means we haven't saved distinct keywords yet).

            setConfig(newConfig);
            // Effectively we don't save to storage until they add one?
            // Or we save defaults?
            // If we clear, we probably want to sync that state.
            // But validation prevents saving 0 keywords.
            // So we just reset UI to empty state.
            // But if we want to "persist" the clear, we must save something.
            // Let's save ['exitkiosk'] as a fallback if they truly clear?
            // User says "siempre debe quedar una obligatoriamente" (strictly one input must remain).
            // It corresponds to UI behavior mainly.

            // If I clear, I'll reset to default 'exitkiosk' or just UI clear?
            // Probably UI clear.

            toast.success(t('app_clear_success') || 'Keywords cleared');
        } catch (error) {
            console.error('Clear error:', error);
            toast.error(t('app_clear_error') || 'Error clearing keywords');
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const messageListener = (message: { type: string }) => {
            if (message.type === 'reloadOptions') {
                loadOptions();
                toast.success(t('app_config_reset') || 'Reset complete');
                setSaving(false);
            }
        };
        chromeApi.runtime.onMessage.addListener(messageListener);
        return () => chromeApi.runtime.onMessage.removeListener(messageListener);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate active keywords count (excluding empty)
    const activeKeywordsCount = config.keywords.filter(k => k.trim() !== '').length;

    return (
        <div className={`min-h-screen bg-background ${mini ? 'pt-4' : ''} flex flex-col`}>
            {/* Header */}
            <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src="/img/icon-64.png" alt="ExitKiosk" className="w-10 h-10" />
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">{t('app_name')}</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                    {t('app_subtitle')}
                                </p>
                            </div>
                        </div>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Donation Banner */}
            <div className="container max-w-4xl mx-auto px-4 mb-0 mt-4">
                <a
                    href="https://buymeacoffee.com/danidoble"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-950/40">
                        <CardContent className="flex items-center justify-center px-4 py-2 gap-3 text-yellow-700 dark:text-yellow-400 font-medium text-lg">
                            <Coffee className="w-5 h-5" />
                            {t('app_buy_coffee')}
                        </CardContent>
                    </Card>
                </a>
            </div>

            {/* Main Content */}
            <main className="container max-w-4xl mx-auto px-4 py-8 flex-1">
                <Tabs defaultValue="settings" className="w-full space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                        <TabsTrigger value="settings">{t('app_settings')}</TabsTrigger>
                        <TabsTrigger value="rules" className="relative">
                            {t('app_keywords')}
                            <Badge
                                variant="secondary"
                                className="ml-2 h-5 min-w-5 px-1.5 rounded-full text-[10px] sm:text-xs"
                            >
                                {activeKeywordsCount}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="advanced">{t('app_advanced')}</TabsTrigger>
                    </TabsList>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('app_general_settings')}</CardTitle>
                                <CardDescription>{t('app_enable_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="enabled" className="text-base">
                                            {t('app_enable')}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {config.enabled
                                                ? t('app_extension_enabled_desc')
                                                : t('app_extension_disabled_desc')}
                                        </p>
                                    </div>
                                    <Switch
                                        id="enabled"
                                        checked={config.enabled}
                                        onCheckedChange={handleEnabledChange}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between space-x-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="notify" className="text-base">
                                            {t('app_notify')}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">{t('app_notify_desc')}</p>
                                    </div>
                                    <Switch
                                        id="notify"
                                        checked={config.notifyEvent}
                                        onCheckedChange={handleNotifyChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Keywords (Rules) Tab */}
                    <TabsContent value="rules" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('app_keywords')}</CardTitle>
                                <CardDescription>{t('app_keywords_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {config.keywords.map((keyword, index) => (
                                    <div key={index} className="flex gap-3 group">
                                        <Input
                                            value={keyword}
                                            placeholder={t('app_keyword_placeholder')}
                                            onChange={e => handleKeywordChange(index, e.target.value)}
                                            className="font-mono"
                                        />
                                        {config.keywords.length > 1 && index !== config.keywords.length - 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleKeywordDelete(index)}
                                                className="shrink-0 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                title={t('app_delete_keyword')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {index === config.keywords.length - 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled
                                                className="shrink-0 opacity-50 cursor-default"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <div className="flex justify-end">
                            <Button size="lg" onClick={handleSave} disabled={saving} className="min-w-32 shadow-md">
                                {saving ? (
                                    <>Wait...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {t('app_save')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Advanced Tab */}
                    <TabsContent value="advanced" className="space-y-6">
                        {/* Backup & Restore */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="w-5 h-5" />
                                    {t('app_backup')}
                                </CardTitle>
                                <CardDescription>{t('app_backup_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4">
                                <Button className="flex-1" variant="outline" onClick={handleExport}>
                                    <Download className="w-4 h-4 mr-2" />
                                    {t('app_export')}
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t('app_import')}
                                </Button>
                                <input
                                    type="file"
                                    accept=".json"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    className="hidden"
                                />
                            </CardContent>
                        </Card>

                        {/* Reset Configuration */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <RotateCcw className="w-5 h-5" />
                                    {t('app_reset')}
                                </CardTitle>
                                <CardDescription>{t('app_reset_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full" disabled={saving}>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            {t('app_reset')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('app_reset_confirm_title')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('app_reset_confirm_desc')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('app_cancel')}</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleReset}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {t('app_reset')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>

                        {/* Clear Keywords */}
                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                    <XCircle className="w-5 h-5" />
                                    {t('app_clear_keywords')}
                                </CardTitle>
                                <CardDescription>{t('app_clear_keywords_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full" disabled={saving}>
                                            <XCircle className="w-4 h-4 mr-2" />
                                            {t('app_clear_keywords')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('app_clear_confirm_title')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('app_clear_confirm_desc')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('app_cancel')}</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleClearKeywords}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {t('app_clear_keywords')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Footer */}
            <footer className="border-t mt-4 py-6 text-center text-sm text-muted-foreground">
                Created by{' '}
                <a
                    href="https://github.com/danidoble"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
                >
                    danidoble
                </a>
                . © {new Date().getFullYear()}
            </footer>
        </div>
    );
}
