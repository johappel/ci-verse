# WordPress Integration - Development Workflow

Dieser Guide erklärt, wie du die CI-Verse Svelte-App mit einer lokalen WordPress-Installation verbindest.

## 📋 Voraussetzungen

- **Local by Flywheel** mit WordPress-Installation unter `http://ci.test`
- **ACF Pro Plugin** in WordPress installiert
- **Node.js** und **pnpm** installiert
- CI-Verse Git-Repository geklont

## 🗂️ Projekt-Struktur

```
ci-verse/
├── src/                          # Svelte-App
├── build/                        # Build-Artefakte (nach pnpm build)
├── wordpress/
│   └── ci-verse-data/           # WordPress-Plugin-Quellcode
│       ├── ci-verse-data.php    # Haupt-Plugin-Datei
│       ├── acf-fields.php       # ACF-Felder (optional)
│       └── acf-json/            # ACF-JSON-Definitionen
└── scripts/
    ├── deploy-to-wp.js          # Deployment-Script
    └── watch-wp-plugin.js       # Watch-Mode für Plugin-Dateien
```

## 🚀 Setup (Einmalig)

### 1. WordPress-Plugin-Verzeichnis vorbereiten

Erstelle das Plugin-Verzeichnis in deiner Local-Installation:

```powershell
mkdir "C:\Users\Joachim\Local Sites\ci\app\public\wp-content\plugins\ci-verse-data"
```

### 2. Plugin-Dateien initial deployen

```powershell
pnpm deploy:wp
```

Dies kopiert:
- ✅ `ci-verse-data.php` (Haupt-Plugin-Datei)
- ✅ `acf-fields.php` (falls vorhanden)
- ✅ `acf-json/` (ACF-Definitionen)

### 3. Plugin in WordPress aktivieren

1. Öffne `http://ci.test/wp-admin`
2. Gehe zu **Plugins**
3. Aktiviere **CI-Verse Data**

⚠️ **Wichtig:** Das Plugin benötigt **ACF Pro**! Falls nicht installiert, erscheint ein Hinweis.

### 4. ACF-Felder importieren

Die ACF-Felder werden automatisch aus `acf-json/` geladen. Du solltest nun sehen:

- Custom Post Types: `civerse_project`, `civerse_platform`, `civerse_staff`
- Options Page: **CI-Verse Marktplatz** (Menü links)

## 🔄 Development Workflow

### Variante A: Manuelle Deployments (Empfohlen für Build)

#### 1. Svelte-App entwickeln

```powershell
pnpm dev
# → http://localhost:5173 (verwendet Mock-Daten)
```

#### 2. Build + Deploy zu WordPress

```powershell
pnpm build:deploy
```

Dies führt aus:
1. `vite build` → Erstellt `build/` Ordner
2. `deploy-to-wp.js` → Kopiert `build/` nach WordPress

# 3. App in WordPress testen

Öffne `http://ci.test/ci-verse` - die App lädt nun Daten vom WordPress REST-API!

---

### Variante B: Watch-Mode für Plugin-Entwicklung

Wenn du an den **WordPress-Plugin-Dateien** arbeitest:

#### Terminal 1: Watch WordPress-Dateien

```powershell
pnpm watch:wp-plugin
```

Dies überwacht `wordpress/ci-verse-data/*` und kopiert Änderungen automatisch.

#### Terminal 2: Svelte-Dev-Server

```powershell
pnpm dev
```

⚠️ **Achtung:** Der Dev-Server (`localhost:5173`) versucht, Daten von `http://ci.local` zu laden. Wenn du Mock-Daten testen willst, musst du `apiService.ts` temporär anpassen.

---

## 🌐 API-Endpunkte

Das WordPress-Plugin stellt folgende Endpunkte bereit:

### GET `/wp-json/civerse/v1/world`

Gibt alle Daten für die 3D-Welt zurück:

```json
{
  "partnerConnections": [...],
  "marketplace": {
    "id": "S",
    "title": "Marktplatz",
    "stands": [...],
    "wallPosters": [...]
  },
  "platforms": {
    "B1": { ... },
    "B2": { ... },
    ...
  },
  "projects": [...],
  "staff": [...]
}
```

**Test im Browser:**
```
http://ci.test/wp-json/civerse/v1/world
```

---

## 📝 Daten in WordPress bearbeiten

### Projekte hinzufügen

1. Gehe zu **Projekte** → **Neu hinzufügen**
2. Fülle alle Felder aus:
   - **Projekt-ID** (z.B. `p25`)
   - **Abteilungen** (B1, B2, B3, Q1, Q2, Q3)
   - **Display Type** (booth, wall, both)
   - **Perspektiven**, **Zielgruppen**, **Team**
   - **Poster-Bild**, **Logo**, **Farbe**
3. Speichern

### Plattformen bearbeiten

1. Gehe zu **Plattformen**
2. Bearbeite vorhandene Plattformen (B1, B2, B3, Q1, Q2, Q3)
3. Ändere:
   - Titel, Beschreibung
   - Farben (color, glowColor)
   - Aspekte (max. 5 pro Plattform)

### Marktplatz bearbeiten

1. Gehe zu **CI-Verse Marktplatz** (Menü links)
2. Bearbeite:
   - **Stands** (Comenius, Publikationen, Events, Info)
   - **Wall Posters** (Leitlinien-Poster)
   - **Partner Connections** (Nexus Terminal)

---

## 🛠️ Scripts-Übersicht

| Command | Beschreibung |
|---------|--------------|
| `pnpm dev` | Lokaler Dev-Server (Port 5173, lädt WP-Daten) |
| `pnpm build` | Production-Build in `build/` |
| `pnpm build:deploy` | Build + Deploy zu WordPress |
| `pnpm deploy:wp` | Nur Deployment (ohne neuen Build) |
| `pnpm watch:wp-plugin` | Watch-Mode für Plugin-Dateien |
| `pnpm preview` | Preview des Production-Builds |

---

## 🔍 Troubleshooting

### ❌ "WordPress-Plugin-Verzeichnis nicht gefunden"

**Problem:** Scripts finden das Plugin-Verzeichnis nicht.

**Lösung:** Passe den Pfad in `scripts/deploy-to-wp.js` und `scripts/watch-wp-plugin.js` an:

```javascript
const WP_PLUGIN_PATH = 'C:\\Users\\Joachim\\Local Sites\\ci\\app\\public\\wp-content\\plugins\\ci-verse-data';
```

---

### ❌ "API Error 404: Endpoint not found"

**Problem:** WordPress REST-API liefert keine Daten.

**Lösung:**
1. Prüfe, ob Plugin aktiviert ist
2. Öffne `http://ci.test/wp-json/civerse/v1/world` im Browser
3. Falls 404: Gehe zu **Einstellungen** → **Permalinks** → **Speichern** (Flush Rewrite Rules)

---

### ❌ "ACF Pro nicht gefunden"

**Problem:** Plugin benötigt ACF Pro.

**Lösung:**
1. Installiere ACF Pro in WordPress
2. Aktiviere das Plugin
3. ACF-Felder werden automatisch aus `acf-json/` geladen

---

### ⚠️ Dev-Server lädt keine Daten

**Problem:** `localhost:5173` kann nicht mit `http://ci.test` kommunizieren (CORS).

**Lösung:** Das WordPress-Plugin sendet bereits CORS-Header. Falls Probleme bestehen:

1. Prüfe Browser-Konsole auf Fehler
2. Falls CORS-Fehler: Ändere temporär in `apiService.ts`:

```typescript
const DEV_API_URL = 'http://ci.test/wp-json/civerse/v1/world';
```

---

### 📦 Build-Artefakte fehlen in WordPress

**Problem:** Nach `pnpm build:deploy` fehlen Dateien.

**Lösung:**
1. Prüfe, ob `build/` Ordner existiert
2. Prüfe, ob `C:\Users\Joachim\Local Sites\ci\app\public\wp-content\plugins\ci-verse-data\build\` existiert
3. Führe manuell aus:

```powershell
pnpm build
pnpm deploy:wp
```

---

## 🎯 Best Practices

### ✅ Entwicklung

1. **Svelte-Code ändern** → Automatisches Hot-Reload im Dev-Server
2. **WordPress-Plugin-Code ändern** → `pnpm watch:wp-plugin` im Hintergrund laufen lassen
3. **Testen in WordPress** → `pnpm build:deploy` ausführen

### ✅ Deployment

1. Finale Änderungen committen
2. `pnpm build:deploy` ausführen
3. In WordPress testen: `http://ci.test/ci-verse`
4. Bei Erfolg: Production-Deployment

### ✅ Daten-Migration

Wenn du von Mock-Daten zu WordPress wechselst:

1. Exportiere Mock-Daten als JSON
2. Importiere in WordPress (manuell oder via WP-CLI)
3. Teste alle Endpoints
4. Prüfe 3D-Visualisierung

---

## 📚 Weitere Ressourcen

- **SvelteKit Docs:** https://kit.svelte.dev
- **WordPress REST API:** https://developer.wordpress.org/rest-api/
- **ACF Documentation:** https://www.advancedcustomfields.com/resources/
- **Local by Flywheel:** https://localwp.com/help-docs/

---

## 🆘 Support

Bei Problemen:
1. Prüfe Browser-Konsole (`F12`)
2. Prüfe WordPress-Debug-Log (falls aktiviert)
3. Prüfe `scripts/deploy-to-wp.js` Output
4. Erstelle GitHub Issue mit Fehlermeldung
