/**
 * Watch-Script für WordPress-Plugin-Dateien
 * 
 * Überwacht wordpress/ci-verse-data/* und kopiert Änderungen automatisch
 * ins WordPress-Plugin-Verzeichnis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lade .env aus Projekt-Root
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env') });

// ============================================================================
// KONFIGURATION
// ============================================================================

const WP_PLUGIN_PATH = process.env.WP_PLUGIN_PATH || 'C:\\Users\\Joachim\\Local Sites\\ci\\app\\public\\wp-content\\plugins\\ci-verse-data';
const WP_SOURCE_DIR = path.join(projectRoot, 'wordpress', 'ci-verse-data');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyFile(src, dest) {
    ensureDirectoryExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function getRelativePath(fullPath) {
    return path.relative(WP_SOURCE_DIR, fullPath);
}

function getTargetPath(sourcePath) {
    const relativePath = getRelativePath(sourcePath);
    return path.join(WP_PLUGIN_PATH, relativePath);
}

function syncFile(sourcePath) {
    const targetPath = getTargetPath(sourcePath);
    const relativePath = getRelativePath(sourcePath);
    
    try {
        copyFile(sourcePath, targetPath);
        console.log(`✓ ${relativePath}`);
    } catch (error) {
        console.error(`✗ ${relativePath}:`, error.message);
    }
}

function deleteFile(targetPath) {
    const relativePath = path.relative(WP_PLUGIN_PATH, targetPath);
    
    try {
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
            console.log(`🗑️  ${relativePath}`);
        }
    } catch (error) {
        console.error(`✗ Delete ${relativePath}:`, error.message);
    }
}

// ============================================================================
// INITIAL SYNC
// ============================================================================

function initialSync() {
    console.log('🔄 Initial Sync...\n');
    
    function syncDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                syncDirectory(fullPath);
            } else {
                syncFile(fullPath);
            }
        }
    }
    
    syncDirectory(WP_SOURCE_DIR);
    console.log('\n✅ Initial Sync abgeschlossen\n');
}

// ============================================================================
// WATCH
// ============================================================================

function watchPluginFiles() {
    console.log('👀 Watching WordPress-Plugin-Dateien...');
    console.log('   Source:', WP_SOURCE_DIR);
    console.log('   Target:', WP_PLUGIN_PATH);
    console.log('─────────────────────────────────────\n');
    
    const watcher = fs.watch(WP_SOURCE_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        const sourcePath = path.join(WP_SOURCE_DIR, filename);
        const targetPath = getTargetPath(sourcePath);
        
        if (eventType === 'rename') {
            // Datei gelöscht oder umbenannt
            if (!fs.existsSync(sourcePath)) {
                deleteFile(targetPath);
            } else {
                syncFile(sourcePath);
            }
        } else if (eventType === 'change') {
            // Datei geändert
            if (fs.existsSync(sourcePath)) {
                syncFile(sourcePath);
            }
        }
    });
    
    console.log('✨ Watcher läuft. Drücke Ctrl+C zum Beenden.\n');
    
    // Graceful Shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Watcher beendet.');
        watcher.close();
        process.exit(0);
    });
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    console.log('🚀 CI-Verse WordPress Plugin Watcher\n');
    
    // Check ob WordPress-Plugin-Verzeichnis existiert
    if (!fs.existsSync(WP_PLUGIN_PATH)) {
        console.error('❌ WordPress-Plugin-Verzeichnis nicht gefunden!');
        console.error('   Erwartet:', WP_PLUGIN_PATH);
        console.error('\n💡 Tipp: Verzeichnis manuell erstellen oder Pfad anpassen.');
        process.exit(1);
    }
    
    if (!fs.existsSync(WP_SOURCE_DIR)) {
        console.error('❌ WordPress-Source-Verzeichnis nicht gefunden!');
        console.error('   Erwartet:', WP_SOURCE_DIR);
        process.exit(1);
    }
    
    initialSync();
    watchPluginFiles();
}

main();
