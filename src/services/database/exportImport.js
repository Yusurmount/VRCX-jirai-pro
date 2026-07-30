import sqliteService from '../sqlite.js';
import { i18n } from '@/plugins/i18n';

const EXPORT_VERSION = 1;
const EXPORT_FILE_EXT = '.vrcxdb.json';

/**
 * @typedef {Object} ExportMetadata
 * @property {number} version
 * @property {string} exportedAt
 * @property {string} userId
 */

/**
 * @typedef {Object} ExportPackage
 * @property {ExportMetadata} metadata
 * @property {Record<string, Array<Record<string, any>>>} tables
 */

/**
 * @returns {Promise<string|null>} Selected file path or null if cancelled
 */
async function getSaveFilePath() {
    const defaultName = `VRCX_DB_${new Date().toISOString().slice(0, 10)}${EXPORT_FILE_EXT}`;
    if (window.electron?.saveFileDialog) {
        return window.electron.saveFileDialog(defaultName, 'VRCX Database Backup');
    }
    if (AppApi?.OpenFileSelectorDialog) {
        return AppApi.OpenFileSelectorDialog(defaultName, EXPORT_FILE_EXT, 'VRCX Database Backup');
    }
    return null;
}

/**
 * @returns {Promise<string|null>} Selected file path or null if cancelled
 */
async function getOpenFilePath() {
    if (window.electron?.openJsonFileDialog) {
        return window.electron.openJsonFileDialog();
    }
    if (window.electron?.openFileDialog) {
        return window.electron.openFileDialog();
    }
    if (AppApi?.OpenFileSelectorDialog) {
        return AppApi.OpenFileSelectorDialog('', EXPORT_FILE_EXT, 'VRCX Database Backup');
    }
    return null;
}

/**
 * @param {string} filePath
 * @param {string} content
 * @returns {Promise<boolean>}
 */
async function writeFile(filePath, content) {
    if (window.electron?.writeFile) {
        return window.electron.writeFile(filePath, Buffer.from(content, 'utf-8'));
    }
    throw new Error('No file writing method available');
}

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function readFile(filePath) {
    if (window.electron?.readFile) {
        return window.electron.readFile(filePath);
    }
    throw new Error('No file reading method available');
}

/**
 * Query all rows from a table
 * @param {string} tableName
 * @returns {Promise<Array<Record<string, any>>>}
 */
function queryAllRows(tableName) {
    return new Promise((resolve, reject) => {
        const rows = [];
        sqliteService.execute(
            (row) => rows.push(row),
            `SELECT * FROM "${tableName}"`
        ).then(() => resolve(rows)).catch(reject);
    });
}

/**
 * Get all table names from the database
 * @returns {Promise<string[]>}
 */
function getAllTableNames() {
    return new Promise((resolve, reject) => {
        const tables = [];
        sqliteService.execute(
            (row) => tables.push(row.name),
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).then(() => resolve(tables)).catch(reject);
    });
}

/**
 * Export all database data
 * @param {string} userId - Current user's ID for validation
 * @param {function} onProgress - Progress callback (current, total)
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
export async function exportDatabaseData(userId, onProgress) {
    try {
        const filePath = await getSaveFilePath();
        if (!filePath) {
            return { success: false, error: 'cancelled' };
        }

        onProgress?.(0, 1);

        const tableNames = await getAllTableNames();

        /** @type {ExportPackage} */
        const exportPackage = {
            metadata: {
                version: EXPORT_VERSION,
                exportedAt: new Date().toISOString(),
                userId: userId || ''
            },
            tables: {}
        };

        const total = tableNames.length;
        for (let i = 0; i < total; i++) {
            const tableName = tableNames[i];
            onProgress?.(i + 1, total, tableName);
            const rows = await queryAllRows(tableName);
            exportPackage.tables[tableName] = rows;
        }

        const jsonContent = JSON.stringify(exportPackage, null, 2);
        await writeFile(filePath, jsonContent);

        return { success: true, path: filePath };
    } catch (e) {
        console.error('[Export] Failed:', e);
        return { success: false, error: e.message || String(e) };
    }
}

/**
 * Validate an import file
 * @param {ExportPackage} data
 * @param {string} currentUserId
 * @returns {{valid: boolean, reason?: string}}
 */
function validateImportData(data, currentUserId) {
    if (!data || typeof data !== 'object') {
        return { valid: false, reason: i18n.global.t('view.settings.advanced.advanced.db_import.error_invalid_format') };
    }
    if (!data.metadata || !data.metadata.version) {
        return { valid: false, reason: i18n.global.t('view.settings.advanced.advanced.db_import.error_missing_metadata') };
    }
    if (data.metadata.version !== EXPORT_VERSION) {
        return { valid: false, reason: i18n.global.t('view.settings.advanced.advanced.db_import.error_version_mismatch', { version: EXPORT_VERSION }) };
    }
    if (!data.tables || typeof data.tables !== 'object') {
        return { valid: false, reason: i18n.global.t('view.settings.advanced.advanced.db_import.error_missing_tables') };
    }
    // Only allow import from the same account
    if (data.metadata.userId && data.metadata.userId !== currentUserId) {
        return { valid: false, reason: i18n.global.t('view.settings.advanced.advanced.db_import.error_user_mismatch') };
    }
    return { valid: true };
}

/**
 * Import database data (merge)
 * @param {string} currentUserId
 * @param {function} onProgress
 * @returns {Promise<{success: boolean, importedCount: number, tablesProcessed: number, error?: string}>}
 */
export async function importDatabaseData(currentUserId, onProgress) {
    try {
        const filePath = await getOpenFilePath();
        if (!filePath) {
            return { success: false, importedCount: 0, tablesProcessed: 0, error: 'cancelled' };
        }

        onProgress?.({ phase: 'reading', progress: 0 });

        const content = await readFile(filePath);

        /** @type {ExportPackage} */
        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            return { success: false, importedCount: 0, tablesProcessed: 0, error: i18n.global.t('view.settings.advanced.advanced.db_import.error_invalid_json') };
        }

        const validation = validateImportData(data, currentUserId);
        if (!validation.valid) {
            return { success: false, importedCount: 0, tablesProcessed: 0, error: validation.reason };
        }

        onProgress?.({ phase: 'importing', progress: 0 });

        const tableNames = Object.keys(data.tables);
        let importedCount = 0;
        const totalRows = tableNames.reduce((sum, name) => sum + data.tables[name].length, 0);
        let processedRows = 0;

        // Begin transaction
        sqliteService.executeNonQuery('BEGIN');

        try {
            for (const tableName of tableNames) {
                const rows = data.tables[tableName];
                if (rows.length === 0) continue;

                // Get column info for this table
                const columns = Object.keys(rows[0]);
                const quotedColumns = columns.map(c => `"${c}"`).join(', ');
                const placeholders = columns.map(() => '?').join(', ');
                const conflictColumns = columns.filter(c => c !== 'id').slice(0, 1);
                const conflictClause = conflictColumns.length > 0
                    ? `ON CONFLICT${columns.includes('id') ? '' : `(${conflictColumns.map(c => `"${c}"`).join(', ')})`} DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}"=excluded."${c}"`).join(', ')}`
                    : '';

                for (const row of rows) {
                    const values = columns.map(c => row[c]);
                    const sql = `INSERT OR REPLACE INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`;
                    await sqliteService.executeNonQuery(sql, values);
                    importedCount++;
                    processedRows++;
                    onProgress?.({ phase: 'importing', progress: processedRows / totalRows });
                }
            }

            await sqliteService.executeNonQuery('COMMIT');
        } catch (e) {
            await sqliteService.executeNonQuery('ROLLBACK');
            console.error('[Import] Transaction failed, rolled back:', e);
            return { success: false, importedCount: 0, tablesProcessed: tableNames.length, error: e.message || String(e) };
        }

        return { success: true, importedCount, tablesProcessed: tableNames.length };
    } catch (e) {
        console.error('[Import] Failed:', e);
        return { success: false, importedCount: 0, tablesProcessed: 0, error: e.message || String(e) };
    }
}
