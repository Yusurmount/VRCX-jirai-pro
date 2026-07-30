<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.advanced.advanced.vrchat_settings.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.relaunch_vrchat.header')"
                :description="t('view.settings.advanced.advanced.relaunch_vrchat.description')">
                <Switch :model-value="relaunchVRChatAfterCrash" @update:modelValue="setRelaunchVRChatAfterCrash" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.vrchat_quit_fix.header')"
                :description="t('view.settings.advanced.advanced.vrchat_quit_fix.description')">
                <Switch :model-value="vrcQuitFix" @update:modelValue="setVrcQuitFix" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.auto_cache_management.header')"
                :description="t('view.settings.advanced.advanced.auto_cache_management.description')">
                <Switch :model-value="autoSweepVRChatCache" @update:modelValue="setAutoSweepVRChatCache" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.self_invite.header')"
                :description="t('view.settings.advanced.advanced.self_invite.description')">
                <Switch :model-value="selfInviteOverride" @update:modelValue="setSelfInviteOverride" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced_groups.security.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.primary_password.header')"
                :description="t('view.settings.advanced.advanced.primary_password.description')">
                <Switch
                    :model-value="enablePrimaryPassword"
                    :disabled="!enablePrimaryPassword"
                    @update:modelValue="enablePrimaryPasswordChange" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.general.logging.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.cache_debug.udon_exception_logging')">
                <Switch :model-value="udonExceptionLogging" @update:modelValue="setUdonExceptionLogging" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.resource_load')">
                <Switch :model-value="logResourceLoad" @update:modelValue="setLogResourceLoad" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.empty_avatar')">
                <Switch :model-value="logEmptyAvatars" @update:modelValue="setLogEmptyAvatars" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.general.logging.auto_login_delay')">
                <Switch :model-value="autoLoginDelayEnabled" @update:modelValue="setAutoLoginDelayEnabled" />
            </SettingsItem>

            <SettingsItem
                v-if="autoLoginDelayEnabled"
                :label="t('view.settings.general.logging.auto_login_delay_button')">
                <Button size="sm" variant="outline" @click="promptAutoLoginDelaySeconds">
                    {{ t('view.settings.general.logging.auto_login_delay_button') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <template v-if="!isLinux">
            <SettingsGroup :title="t('view.settings.advanced.advanced.app_launcher.header')">
                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.folder')">
                    <Button size="sm" variant="outline" @click="openShortcutFolder()">{{
                        t('view.settings.advanced.advanced.app_launcher.folder')
                    }}</Button>
                </SettingsItem>

                <SettingsItem
                    :label="t('view.settings.advanced.advanced.remote_database.enable')"
                    :description="t('view.settings.advanced.advanced.app_launcher.folder_tooltip')">
                    <Switch :model-value="enableAppLauncher" @update:modelValue="setEnableAppLauncher" />
                </SettingsItem>

                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.auto_close')">
                    <Switch
                        :model-value="enableAppLauncherAutoClose"
                        @update:modelValue="setEnableAppLauncherAutoClose" />
                </SettingsItem>

                <SettingsItem :label="t('view.settings.advanced.advanced.app_launcher.run_process_once')">
                    <Switch
                        :model-value="enableAppLauncherRunProcessOnce"
                        @update:modelValue="setEnableAppLauncherRunProcessOnce" />
                </SettingsItem>
            </SettingsGroup>
        </template>

        <SettingsGroup :title="t('view.settings.advanced.advanced.launch_commands.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_enable')"
                :description="
                    t('view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_tooltip')
                ">
                <Switch
                    :model-value="showConfirmationOnSwitchAvatar"
                    @update:modelValue="setShowConfirmationOnSwitchAvatar" />
            </SettingsItem>

            <div class="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    @click="
                        openExternalLink('https://github.com/FuLuTang/VRCX-jirai/wiki/Launch-parameters-&-VRCX.json')
                    "
                    >{{ t('view.settings.advanced.advanced.launch_commands.docs') }}</Button
                >
                <Button
                    size="sm"
                    variant="outline"
                    @click="openExternalLink('https://github.com/Myrkie/open-in-vrcx')"
                    >{{ t('view.settings.advanced.advanced.launch_commands.website_userscript') }}</Button
                >
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.cache_debug.header')">
            <div class="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" @click="clearVRCXCache">{{
                    t('view.settings.advanced.advanced.cache_debug.clear_cache')
                }}</Button>
                <Button size="sm" variant="outline" @click="promptAutoClearVRCXCacheFrequency">{{
                    t('view.settings.advanced.advanced.cache_debug.auto_clear_cache')
                }}</Button>
                <Button size="sm" variant="outline" @click="refreshCacheSize">{{
                    t('view.settings.advanced.advanced.cache_debug.refresh_cache')
                }}</Button>
            </div>

            <SettingsItem
                :label="`${t('view.settings.advanced.advanced.cache_debug.disable_gamelog')} ${t('view.settings.advanced.advanced.cache_debug.disable_gamelog_notice')}`">
                <Switch :model-value="gameLogDisabled" @update:modelValue="disableGameLogDialog()" />
            </SettingsItem>

            <div class="flex flex-col gap-1 text-sm">
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.user_cache') }}
                    <span v-text="cacheSize.cachedUsers"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.world_cache') }}
                    <span v-text="cacheSize.cachedWorlds"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.avatar_cache') }}
                    <span v-text="cacheSize.cachedAvatars"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.group_cache') }}
                    <span v-text="cacheSize.cachedGroups"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.avatar_name_cache') }}
                    <span v-text="cacheSize.cachedAvatarNames"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.cache_debug.instance_cache') }}
                    <span v-text="cacheSize.cachedInstances"></span
                ></span>
            </div>

            <SettingsItem :label="t('view.settings.advanced.advanced.cache_debug.show_console')">
                <Button size="sm" variant="outline" @click="showConsole">{{
                    t('view.settings.advanced.advanced.cache_debug.show_console')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced_groups.database.header')">
            <SettingsItem :label="t('view.settings.advanced.advanced.sqlite_table_size.refresh')">
                <Button size="sm" variant="outline" @click="getSqliteTableSizes">{{
                    t('view.settings.advanced.advanced.sqlite_table_size.refresh')
                }}</Button>
            </SettingsItem>

            <div class="flex flex-col gap-1 text-sm">
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.gps') }}
                    <span v-text="sqliteTableSizes.gps"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.status') }}
                    <span v-text="sqliteTableSizes.status"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.bio') }}
                    <span v-text="sqliteTableSizes.bio"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.avatar') }}
                    <span v-text="sqliteTableSizes.avatar"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.online_offline') }}
                    <span v-text="sqliteTableSizes.onlineOffline"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.friend_log_history') }}
                    <span v-text="sqliteTableSizes.friendLogHistory"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.notification') }}
                    <span v-text="sqliteTableSizes.notification"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.location') }}
                    <span v-text="sqliteTableSizes.location"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.join_leave') }}
                    <span v-text="sqliteTableSizes.joinLeave"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.portal_spawn') }}
                    <span v-text="sqliteTableSizes.portalSpawn"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.video_play') }}
                    <span v-text="sqliteTableSizes.videoPlay"></span
                ></span>
                <span
                    >{{ t('view.settings.advanced.advanced.sqlite_table_size.event') }}
                    <span v-text="sqliteTableSizes.event"></span
                ></span>
            </div>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.db_export.button')"
                :description="t('view.settings.advanced.advanced.db_export.description')">
                <Button size="sm" variant="outline" :disabled="exportInProgress" @click="confirmExport">
                    <Download class="h-4 w-4 mr-1" />
                    {{ t('view.settings.advanced.advanced.db_export.button') }}
                </Button>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.db_import.button')"
                :description="t('view.settings.advanced.advanced.db_import.description')">
                <Button size="sm" variant="outline" :disabled="importInProgress" @click="confirmImport">
                    <Upload class="h-4 w-4 mr-1" />
                    {{ t('view.settings.advanced.advanced.db_import.button') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.database_cleanup.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.database_cleanup.auto_cleanup')"
                :description="t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_description')">
                <Select :model-value="avatarAutoCleanup" @update:modelValue="setAvatarAutoCleanup">
                    <SelectTrigger class="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="Off">{{
                                t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_off')
                            }}</SelectItem>
                            <SelectItem value="30">{{
                                t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_30')
                            }}</SelectItem>
                            <SelectItem value="90">{{
                                t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_90')
                            }}</SelectItem>
                            <SelectItem value="180">{{
                                t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_180')
                            }}</SelectItem>
                            <SelectItem value="365">{{
                                t('view.settings.advanced.advanced.database_cleanup.auto_cleanup_365')
                            }}</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.database_cleanup.purge_button')">
                <Button size="sm" variant="outline" @click="isPurgeDialogVisible = true">
                    <Trash2 class="h-4 w-4 mr-1" />
                    {{ t('view.settings.advanced.advanced.database_cleanup.purge') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <Dialog
            :open="isPurgeDialogVisible"
            @update:open="
                (open) => {
                    if (!open) isPurgeDialogVisible = false;
                }
            ">
            <DialogContent class="x-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{{
                        t('view.settings.advanced.advanced.database_cleanup.purge_confirm_title')
                    }}</DialogTitle>
                </DialogHeader>

                <Alert variant="warning" class="mb-3">
                    <TriangleAlert />
                    <AlertDescription>
                        {{ t('view.settings.advanced.advanced.database_cleanup.purge_confirm_alert') }}
                    </AlertDescription>
                </Alert>

                <div class="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                    <p>{{ t('view.settings.advanced.advanced.database_cleanup.purge_confirm_description_1') }}</p>
                    <p>{{ t('view.settings.advanced.advanced.database_cleanup.purge_confirm_description_2') }}</p>
                    <p>{{ t('view.settings.advanced.advanced.database_cleanup.purge_confirm_description_3') }}</p>
                </div>

                <SettingsItem :label="t('view.settings.advanced.advanced.database_cleanup.purge_older_than')">
                    <Select v-model="selectedPurgePeriod">
                        <SelectTrigger class="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="180">{{
                                    t('view.settings.advanced.advanced.database_cleanup.purge_option_180')
                                }}</SelectItem>
                                <SelectItem value="365">{{
                                    t('view.settings.advanced.advanced.database_cleanup.purge_option_365')
                                }}</SelectItem>
                                <SelectItem value="730">{{
                                    t('view.settings.advanced.advanced.database_cleanup.purge_option_730')
                                }}</SelectItem>
                                <SelectItem value="all">{{
                                    t('view.settings.advanced.advanced.database_cleanup.purge_option_all')
                                }}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SettingsItem>

                <DialogFooter>
                    <Button variant="outline" size="sm" @click="isPurgeDialogVisible = false">
                        {{ t('confirm.cancel_button') }}
                    </Button>
                    <Button size="sm" variant="destructive" :disabled="purgeInProgress" @click="handlePurge">
                        <Trash2 class="h-4 w-4 mr-1" />
                        {{ t('view.settings.advanced.advanced.database_cleanup.purge_confirm_button') }}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Export Progress Dialog -->
        <Dialog
            :open="isExportDialogVisible"
            @update:open="
                (open) => {
                    if (!open) isExportDialogVisible = false;
                }
            ">
            <DialogContent class="x-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{{ t('view.settings.advanced.advanced.db_export.confirm_title') }}</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col gap-4 py-2">
                    <template v-if="exportPhase === 'confirm'">
                        <p class="text-sm text-muted-foreground">
                            {{ t('view.settings.advanced.advanced.db_export.confirm_message') }}
                        </p>
                    </template>
                    <template v-else-if="exportPhase === 'in_progress'">
                        <p class="text-sm">
                            {{
                                t('view.settings.advanced.advanced.db_export.exporting', {
                                    current: exportProgress.current,
                                    total: exportProgress.total
                                })
                            }}
                        </p>
                        <div class="w-full bg-secondary rounded-full h-2">
                            <div
                                class="bg-primary h-2 rounded-full transition-all"
                                :style="{ width: exportProgress.percent + '%' }"></div>
                        </div>
                    </template>
                    <template v-else-if="exportPhase === 'done'">
                        <Alert variant="default" class="mb-2 border-green-500/50">
                            <AlertDescription>
                                {{ t('view.settings.advanced.advanced.db_export.success', { path: exportResult }) }}
                            </AlertDescription>
                        </Alert>
                    </template>
                    <template v-else-if="exportPhase === 'error'">
                        <Alert variant="destructive" class="mb-2">
                            <AlertDescription>
                                {{ t('view.settings.advanced.advanced.db_export.error', { error: exportError }) }}
                            </AlertDescription>
                        </Alert>
                    </template>
                </div>
                <DialogFooter>
                    <template v-if="exportPhase === 'confirm'">
                        <Button variant="outline" size="sm" @click="isExportDialogVisible = false">
                            {{ t('confirm.cancel_button') }}
                        </Button>
                        <Button size="sm" @click="handleExport">
                            <Download class="h-4 w-4 mr-1" />
                            {{ t('view.settings.advanced.advanced.db_export.button') }}
                        </Button>
                    </template>
                    <template v-else-if="exportPhase === 'in_progress'">
                        <Button variant="outline" size="sm" disabled>
                            {{
                                t('view.settings.advanced.advanced.db_export.exporting', {
                                    current: exportProgress.current,
                                    total: exportProgress.total
                                })
                            }}
                        </Button>
                    </template>
                    <template v-else>
                        <Button variant="outline" size="sm" @click="isExportDialogVisible = false">
                            {{ t('confirm.cancel_button') }}
                        </Button>
                    </template>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Import Dialog -->
        <Dialog
            :open="isImportDialogVisible"
            @update:open="
                (open) => {
                    if (!open) isImportDialogVisible = false;
                }
            ">
            <DialogContent class="x-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{{ t('view.settings.advanced.advanced.db_import.confirm_title') }}</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col gap-4 py-2">
                    <template v-if="importPhase === 'confirm'">
                        <p class="text-sm text-muted-foreground">
                            {{ t('view.settings.advanced.advanced.db_import.confirm_message') }}
                        </p>
                    </template>
                    <template v-else-if="importPhase === 'reading'">
                        <p class="text-sm">{{ t('view.settings.advanced.advanced.db_import.reading') }}</p>
                        <Spinner class="h-5 w-5 mx-auto" />
                    </template>
                    <template v-else-if="importPhase === 'importing'">
                        <p class="text-sm">
                            {{
                                t('view.settings.advanced.advanced.db_import.importing', {
                                    progress: Math.round(importProgressPercent)
                                })
                            }}
                        </p>
                        <div class="w-full bg-secondary rounded-full h-2">
                            <div
                                class="bg-primary h-2 rounded-full transition-all"
                                :style="{ width: importProgressPercent + '%' }"></div>
                        </div>
                    </template>
                    <template v-else-if="importPhase === 'done'">
                        <Alert variant="default" class="mb-2 border-green-500/50">
                            <AlertDescription>
                                {{
                                    t('view.settings.advanced.advanced.db_import.success', {
                                        importedCount: importResult.importedCount,
                                        tablesProcessed: importResult.tablesProcessed
                                    })
                                }}
                            </AlertDescription>
                        </Alert>
                    </template>
                    <template v-else-if="importPhase === 'error'">
                        <Alert variant="destructive" class="mb-2">
                            <AlertDescription>
                                {{ t('view.settings.advanced.advanced.db_import.error', { error: importError }) }}
                            </AlertDescription>
                        </Alert>
                    </template>
                </div>
                <DialogFooter>
                    <template v-if="importPhase === 'confirm'">
                        <Button variant="outline" size="sm" @click="isImportDialogVisible = false">
                            {{ t('confirm.cancel_button') }}
                        </Button>
                        <Button size="sm" @click="handleImport">
                            <Upload class="h-4 w-4 mr-1" />
                            {{ t('view.settings.advanced.advanced.db_import.button') }}
                        </Button>
                    </template>
                    <template v-else-if="importPhase === 'reading' || importPhase === 'importing'">
                        <Button variant="outline" size="sm" disabled>
                            {{
                                importPhase === 'reading'
                                    ? t('view.settings.advanced.advanced.db_import.reading')
                                    : t('view.settings.advanced.advanced.db_import.importing', {
                                          progress: Math.round(importProgressPercent)
                                      })
                            }}
                        </Button>
                    </template>
                    <template v-else>
                        <Button variant="outline" size="sm" @click="isImportDialogVisible = false">
                            {{ t('confirm.cancel_button') }}
                        </Button>
                    </template>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <SettingsGroup :title="t('view.settings.advanced_groups.diagnostics.header')">
            <SettingsItem :label="t('view.profile.game_info.online_users')">
                <div class="flex items-center gap-2">
                    <span v-if="visits !== null" class="text-sm text-muted-foreground">{{
                        t('view.profile.game_info.user_online', { count: visits })
                    }}</span>
                    <Button size="sm" variant="outline" @click="getVisits">{{ t('common.actions.refresh') }}</Button>
                </div>
            </SettingsItem>

            <SettingsItem :label="t('view.profile.config_json')">
                <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="refreshConfigTreeData()">{{
                        t('common.actions.refresh')
                    }}</Button>
                    <Button
                        v-if="Object.keys(configTreeData).length > 0"
                        size="sm"
                        variant="outline"
                        @click="configTreeData = {}"
                        >{{ t('common.actions.clear') }}</Button
                    >
                </div>
            </SettingsItem>
            <vue-json-pretty
                v-if="Object.keys(configTreeData).length > 0"
                :data="configTreeData"
                :deep="2"
                :theme="isDarkMode ? 'dark' : 'light'"
                :height="800"
                :dynamic-height="false"
                virtual
                show-icon />
        </SettingsGroup>

        <template v-if="branch === 'Nightly'">
            <SettingsGroup :title="t('view.settings.advanced_groups.nightly.header')">
                <SettingsItem
                    :label="t('view.settings.advanced.advanced.anonymous_error_reporting.header')"
                    :description="t('view.settings.advanced.advanced.anonymous_error_reporting.description')">
                    <Switch :model-value="sentryErrorReporting" @update:modelValue="setSentryErrorReporting()" />
                </SettingsItem>
            </SettingsGroup>
        </template>

        <RegistryBackupDialog />
        <PhotonSettings v-if="photonLoggingEnabled" />
    </div>
</template>

<script setup>
    import { Trash2, TriangleAlert, Download, Upload } from 'lucide-vue-next';
    import { computed, reactive, ref } from 'vue';
    import { toast } from 'vue-sonner';
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Alert, AlertDescription } from '@/components/ui/alert';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useAvatarStore,
        useGeneralSettingsStore,
        useGroupStore,
        useInstanceStore,
        usePhotonStore,
        useUiStore,
        useUserStore,
        useVRCXUpdaterStore,
        useWorldStore
    } from '@/stores';
    import { authRequest, queryRequest } from '@/api';
    import { disableGameLogDialog } from '@/coordinators/gameLogCoordinator';
    import { clearVRCXCache } from '@/coordinators/vrcxCoordinator';
    import { openExternalLink } from '@/shared/utils';
    import { exportDatabaseData, importDatabaseData } from '@/services/database/exportImport';

    import PhotonSettings from '../PhotonSettings.vue';
    import RegistryBackupDialog from '../../../Tools/dialogs/RegistryBackupDialog.vue';
    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();
    const { enablePrimaryPasswordChange } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());
    const { showConsole } = useUiStore();

    const generalSettingsStore = useGeneralSettingsStore();
    const { udonExceptionLogging, logResourceLoad, logEmptyAvatars, autoLoginDelayEnabled } =
        storeToRefs(generalSettingsStore);
    const {
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars,
        setAutoLoginDelayEnabled,
        promptAutoLoginDelaySeconds
    } = generalSettingsStore;

    const { cachedUsers } = useUserStore();
    const { cachedWorlds } = useWorldStore();
    const { cachedAvatars, cachedAvatarNames } = useAvatarStore();
    const { cachedGroups } = useGroupStore();
    const { cachedInstances } = useInstanceStore();

    const { photonLoggingEnabled } = storeToRefs(usePhotonStore());
    const { branch } = storeToRefs(useVRCXUpdaterStore());

    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const {
        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        selfInviteOverride,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        enableAppLauncherRunProcessOnce,
        showConfirmationOnSwitchAvatar,
        gameLogDisabled,
        sqliteTableSizes,
        avatarAutoCleanup,
        purgeInProgress,
        sentryErrorReporting
    } = storeToRefs(advancedSettingsStore);

    const {
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setSelfInviteOverride,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setEnableAppLauncherRunProcessOnce,
        setShowConfirmationOnSwitchAvatar,
        getSqliteTableSizes,
        setAvatarAutoCleanup,
        purgeAvatarFeedData,
        promptAutoClearVRCXCacheFrequency,
        setSentryErrorReporting
    } = advancedSettingsStore;

    const configTreeData = ref({});
    const visits = ref(null);
    const selectedPurgePeriod = ref('180');
    const isPurgeDialogVisible = ref(false);

    // Database Export/Import state
    const isExportDialogVisible = ref(false);
    const exportPhase = ref('confirm'); // 'confirm' | 'in_progress' | 'done' | 'error'
    const exportInProgress = ref(false);
    const exportProgress = reactive({ current: 0, total: 1, percent: 0 });
    const exportResult = ref('');
    const exportError = ref('');

    const isImportDialogVisible = ref(false);
    const importPhase = ref('confirm'); // 'confirm' | 'reading' | 'importing' | 'done' | 'error'
    const importInProgress = ref(false);
    const importProgressPercent = ref(0);
    const importResult = reactive({ importedCount: 0, tablesProcessed: 0 });
    const importError = ref('');

    const userStore = useUserStore();

    const cacheSize = reactive({
        cachedUsers: 0,
        cachedWorlds: 0,
        cachedAvatars: 0,
        cachedGroups: 0,
        cachedAvatarNames: 0,
        cachedInstances: 0
    });

    const isLinux = computed(() => LINUX);

    function handlePurge() {
        const days = selectedPurgePeriod.value === 'all' ? null : parseInt(selectedPurgePeriod.value, 10);
        isPurgeDialogVisible.value = false;
        purgeAvatarFeedData(days);
    }

    /**
     * Open export confirmation dialog
     */
    function confirmExport() {
        exportPhase.value = 'confirm';
        exportResult.value = '';
        exportError.value = '';
        exportProgress.current = 0;
        exportProgress.total = 1;
        exportProgress.percent = 0;
        isExportDialogVisible.value = true;
    }

    /**
     * Execute database export
     */
    async function handleExport() {
        const userId = userStore.currentUser?.id || '';
        exportPhase.value = 'in_progress';
        exportInProgress.value = true;

        const result = await exportDatabaseData(userId, (current, total) => {
            exportProgress.current = current;
            exportProgress.total = total;
            exportProgress.percent = total > 0 ? Math.round((current / total) * 100) : 0;
        });

        exportInProgress.value = false;

        if (result.success) {
            exportPhase.value = 'done';
            exportResult.value = result.path;
            toast.success(t('view.settings.advanced.advanced.db_export.success', { path: result.path }));
        } else if (result.error === 'cancelled') {
            isExportDialogVisible.value = false;
            toast(t('view.settings.advanced.advanced.db_export.error_cancelled'));
        } else {
            exportPhase.value = 'error';
            exportError.value = result.error;
            toast.error(t('view.settings.advanced.advanced.db_export.error', { error: result.error }));
        }
    }

    /**
     * Open import confirmation dialog
     */
    function confirmImport() {
        importPhase.value = 'confirm';
        importProgressPercent.value = 0;
        importResult.importedCount = 0;
        importResult.tablesProcessed = 0;
        importError.value = '';
        isImportDialogVisible.value = true;
    }

    /**
     * Execute database import
     */
    async function handleImport() {
        const userId = userStore.currentUser?.id || '';
        importInProgress.value = true;

        const result = await importDatabaseData(userId, (state) => {
            if (state.phase === 'reading') {
                importPhase.value = 'reading';
            } else if (state.phase === 'importing') {
                importPhase.value = 'importing';
                importProgressPercent.value = state.progress * 100;
            }
        });

        importInProgress.value = false;

        if (result.success) {
            importPhase.value = 'done';
            importResult.importedCount = result.importedCount;
            importResult.tablesProcessed = result.tablesProcessed;
            toast.success(
                t('view.settings.advanced.advanced.db_import.success', {
                    importedCount: result.importedCount,
                    tablesProcessed: result.tablesProcessed
                })
            );
        } else if (result.error === 'cancelled') {
            isImportDialogVisible.value = false;
            toast(t('view.settings.advanced.advanced.db_import.error_cancelled'));
        } else {
            importPhase.value = 'error';
            importError.value = result.error;
            toast.error(t('view.settings.advanced.advanced.db_import.error', { error: result.error }));
        }
    }

    /**
     *
     */
    function openShortcutFolder() {
        AppApi.OpenShortcutFolder();
    }

    /**
     *
     */
    function refreshCacheSize() {
        cacheSize.cachedUsers = cachedUsers.size;
        cacheSize.cachedWorlds = cachedWorlds.size;
        cacheSize.cachedAvatars = cachedAvatars.size;
        cacheSize.cachedGroups = cachedGroups.size;
        cacheSize.cachedAvatarNames = cachedAvatarNames.size;
        cacheSize.cachedInstances = cachedInstances.size;
    }

    /**
     *
     */
    async function refreshConfigTreeData() {
        await authRequest.getConfig();
        configTreeData.value = cachedConfig.value;
    }

    /**
     *
     */
    function getVisits() {
        queryRequest.fetch('visits').then((args) => {
            visits.value = args.json;
        });
    }
</script>

