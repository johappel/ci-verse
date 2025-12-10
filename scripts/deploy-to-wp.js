/**
 * Deploy-Script für WordPress-Plugin Integration
 * 
 * Kopiert:
 * 1. Build-Artefakte → WordPress-Plugin/build/
 * 2. WordPress-Plugin-Dateien → WordPress-Plugin/
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
const BUILD_DIR = path.join(projectRoot, 'build');
const WP_SOURCE_DIR = path.join(projectRoot, 'wordpress', 'ci-verse-data');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function copyDirectory(src, dest) {
    ensureDirectoryExists(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function copyFile(src, dest) {
    ensureDirectoryExists(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

function deleteDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

// ============================================================================
// DEPLOY TASKS
// ============================================================================

function deployBuildArtifacts() {
    console.log('📦 Deploying Build-Artefakte...');
    
    if (!fs.existsSync(BUILD_DIR)) {
        console.error('❌ Build-Verzeichnis nicht gefunden! Bitte zuerst "pnpm build" ausführen.');
        process.exit(1);
    }
    
    const targetBuildDir = path.join(WP_PLUGIN_PATH, 'build');
    
    // Alten Build löschen
    deleteDirectory(targetBuildDir);
    
    // Neuen Build kopieren
    copyDirectory(BUILD_DIR, targetBuildDir);
    
    console.log('✅ Build-Artefakte deployed nach:', targetBuildDir);
}

function deployPluginFiles() {
    console.log('📄 Deploying WordPress-Plugin-Dateien...');
    
    if (!fs.existsSync(WP_SOURCE_DIR)) {
        console.error('❌ WordPress-Source-Verzeichnis nicht gefunden:', WP_SOURCE_DIR);
        process.exit(1);
    }
    
    // PHP-Dateien
    const phpFiles = ['ci-verse-data.php', 'acf-fields.php'];
    phpFiles.forEach(file => {
        const src = path.join(WP_SOURCE_DIR, file);
        const dest = path.join(WP_PLUGIN_PATH, file);
        if (fs.existsSync(src)) {
            copyFile(src, dest);
            console.log(`  ✓ ${file}`);
        }
    });
    
    // ACF JSON
    const acfJsonSrc = path.join(WP_SOURCE_DIR, 'acf-json');
    const acfJsonDest = path.join(WP_PLUGIN_PATH, 'acf-json');
    if (fs.existsSync(acfJsonSrc)) {
        deleteDirectory(acfJsonDest);
        copyDirectory(acfJsonSrc, acfJsonDest);
        console.log('  ✓ acf-json/');
    }
    
    console.log('✅ WordPress-Plugin-Dateien deployed');
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    console.log('🚀 CI-Verse WordPress Deployment\n');
    console.log('Target:', WP_PLUGIN_PATH);
    console.log('─────────────────────────────────────\n');
    
    // Check ob WordPress-Plugin-Verzeichnis existiert
    if (!fs.existsSync(WP_PLUGIN_PATH)) {
        console.error('❌ WordPress-Plugin-Verzeichnis nicht gefunden!');
        console.error('   Erwartet:', WP_PLUGIN_PATH);
        console.error('\n💡 Tipp: Verzeichnis manuell erstellen oder Pfad anpassen.');
        process.exit(1);
    }
    
    deployBuildArtifacts();
    deployPluginFiles();
    
    console.log('\n✨ Deployment abgeschlossen!\n');
    console.log('🔗 CI-Verse URL: http://ci.local/ci-verse');
}

main();
