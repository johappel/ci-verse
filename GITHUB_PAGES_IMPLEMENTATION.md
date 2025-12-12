# 📋 Schnellstart: Deployment auf GitHub Pages

## Was wurde implementiert?

✅ **Mock-Daten Support** in `apiService.ts`
- Automatische Erkennung von `VITE_USE_MOCK_DATA` Environment-Variable
- Fallback auf lokale Test-Daten wenn WordPress nicht erreichbar ist
- Vollständig kompatibel mit bestehender WordPress-Integration

✅ **.env.production** für GitHub Pages
- Aktiviert Mock-Daten-Mode automatisch beim Production Build
- `VITE_USE_MOCK_DATA=true`

✅ **Dokumentation**
- `GITHUB_PAGES_SETUP.md` - Vollständiger Setup-Guide
- `.env.example` - Konfiguration erklärt

---

## Aktueller Status

| Umgebung | Modus | Konfiguration | Status |
|----------|-------|---------------|--------|
| Local Dev (aktuell) | Mock-Daten | `.env` → `VITE_USE_MOCK_DATA=true` | ✅ Aktiv |
| Local Dev (mit WP) | WordPress API | `.env.local` → `VITE_USE_MOCK_DATA=false` | ✅ Konfigurierbar |
| GitHub Pages | Mock-Daten | `.env.production` → `VITE_USE_MOCK_DATA=true` | ✅ Bereit |
| Production (mit WP) | WordPress API | Env-Variable setzen | ✅ Unterstützt |

---

## Nächste Schritte zum Deployment

### 1️⃣ Repository zusammenmergen
```bash
git checkout main
git merge feature-branch
git push origin main
```

### 2️⃣ GitHub Actions Workflow einrichten (falls nicht existierend)

Erstelle `.github/workflows/deploy.yml` (siehe `GITHUB_PAGES_SETUP.md`)

### 3️⃣ GitHub Pages aktivieren

Settings → Pages → Branch: `gh-pages` (wird vom Workflow erstellt)

### 4️⃣ Fertig! 🎉

Die App ist unter `https://<username>.github.io/ci-verse` verfügbar

---

## Local Testing

Teste die Implementierung lokal:

```bash
# Mit Mock-Daten (GitHub Pages Modus)
pnpm build
pnpm preview

# Browser-Konsole sollte anzeigen:
# 🎭 Using MOCK DATA mode
# ✅ Mock Data loaded: { projects: 15, platforms: 7, staff: ... }
```

---

## Dateien geändert/erstellt

```
src/lib/logic/apiService.ts
├─ Import: mockProjects, mockPlatformContents, mockStaff, mockMarketplace
├─ USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'
└─ fetchWorldData() → Condition: If USE_MOCK_DATA → Return Mock data directly

.env.production (NEU)
└─ VITE_USE_MOCK_DATA=true
└─ VITE_WP_URL=http://ci.test (Fallback)

.env.example (Updated)
└─ Dokumentation für VITE_USE_MOCK_DATA erweitert

GITHUB_PAGES_SETUP.md (NEU)
└─ Vollständiger Deployment-Guide
```

---

## ⚠️ Wichtige Hinweise

### Production vs. Development

- **`.env`** (im Git) - Shared Development Settings
- **`.env.local`** (Git-ignoriert) - Persönliche Overrides
- **`.env.production`** (im Git) - Production Build Settings
- **`.env.production.local`** (Git-ignoriert) - Persönliche Production Overrides

### Build-Zeit vs. Runtime

Die `VITE_USE_MOCK_DATA` Variable wird **zur Build-Zeit** gelesen!

```bash
# Build mit Mock-Daten
VITE_USE_MOCK_DATA=true pnpm build

# Ergebnis: App nutzt IMMER Mock-Daten
pnpm preview
```

Eine Änderung zur Runtime ist nicht möglich. Neuer Build erforderlich.

---

## Debugging

Falls Mock-Daten nicht geladen werden:

1. **Browser-Konsole öffnen** (`F12`)
2. **Nachricht suchen:**
   - `🎭 Using MOCK DATA mode` → Mock-Daten aktiv ✅
   - `🌍 Fetching World Data from:` → WordPress-Modus ✅

3. **Build-Umgebung prüfen:**
   ```bash
   echo $env:VITE_USE_MOCK_DATA  # PowerShell
   # oder
   echo $VITE_USE_MOCK_DATA       # Bash
   ```

4. **Neu bauen:**
   ```bash
   rm -r build .svelte-kit
   VITE_USE_MOCK_DATA=true pnpm build
   ```
