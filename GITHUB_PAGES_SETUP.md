# GitHub Pages Deployment mit Mock-Daten

## Übersicht

Die CI-Verse Anwendung unterstützt nun zwei Daten-Modi:

1. **Mock-Daten Mode** (Standard für GitHub Pages)
   - Verwendet lokale Test-Daten aus `src/lib/data/mockProjects.ts`
   - Keine externe WordPress-Abhängigkeit erforderlich
   - Ideal für GitHub Pages und schnelle lokale Entwicklung

2. **WordPress API Mode** (für Production mit Backend)
   - Lädt Daten live von WordPress REST API
   - Benötigt funktionierende WordPress-Installation
   - Wird über `VITE_WP_URL` konfiguriert

---

## Konfiguration nach Umgebung

### Local Development (mit WordPress)

**`.env.local`:**
```dotenv
VITE_USE_MOCK_DATA=false
VITE_WP_URL=http://ci.test
```

### Local Development (ohne WordPress - schnelle Tests)

**`.env.local`:**
```dotenv
VITE_USE_MOCK_DATA=true
VITE_WP_URL=http://ci.test
```

### GitHub Pages Deployment

**`.env.production`:** (bereits konfiguriert)
```dotenv
VITE_USE_MOCK_DATA=true
VITE_WP_URL=http://ci.test
```

→ Die App nutzt automatisch Mock-Daten für GitHub Pages

---

## Wie es funktioniert

### 1. Environment-Variablen beim Build

Der Wert von `VITE_USE_MOCK_DATA` wird **zur Build-Zeit** gelesen (nicht zur Runtime):

```bash
# Local Dev: Nutzt Mock-Daten
VITE_USE_MOCK_DATA=true pnpm dev

# Production Build: Nutzt Mock-Daten
VITE_USE_MOCK_DATA=true pnpm build

# Mit WordPress: Nutzt API
VITE_USE_MOCK_DATA=false pnpm dev
```

### 2. Mock-Daten Struktur

Alle Mock-Daten sind in **`src/lib/data/mockProjects.ts`** definiert:

- `mockProjects` - 15 Test-Projekte
- `mockPlatformContents` - 7 Plattformen (S, B1, B2, B3, Q1, Q2, Q3)
- `mockStaff` - Team-Mitglieder
- `mockMarketplace` - Marketplace-Inhalte
- `partnerConnections` - Partner-Institutionen

### 3. API Service Logik

In **`src/lib/logic/apiService.ts`**:

```typescript
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export async function fetchWorldData(): Promise<WorldDataResponse> {
    if (USE_MOCK_DATA) {
        // Gibt sofort Mock-Daten zurück
        return { projects, platforms, staff, marketplace, partnerConnections };
    }
    
    // Sonst: Fetch von WordPress API
    return fetch(API_URL).then(...);
}
```

---

## Deployment auf GitHub Pages

### Schritt 1: Repository zusammenmergen

```bash
git checkout main
git merge feature-branch
git push origin main
```

### Schritt 2: GitHub Actions Workflow

Falls nicht vorhanden, erstelle `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
```

### Schritt 3: GitHub Pages aktivieren

1. Repository → Settings → Pages
2. Branch: `gh-pages` (wird vom Workflow erstellt)
3. Folder: `/ (root)`
4. Save

→ Die App ist dann unter `https://yourusername.github.io/ci-verse` erreichbar

---

## Testen

### Mock-Daten lokal testen

```bash
# Mit Mock-Daten starten
VITE_USE_MOCK_DATA=true pnpm dev
```

Öffne Browser-Konsole und prüfe:
```javascript
// Sollte "🎭 Using MOCK DATA mode" ausgeben
```

### Production Build lokal simulieren

```bash
pnpm build
# oder
VITE_USE_MOCK_DATA=true pnpm build

pnpm preview  # Simuliert Production
```

---

## Häufig gestellte Fragen

### F: Warum Mock-Daten für GitHub Pages?

GitHub Pages ist ein **statischer Host** ohne eigene Backend-Ressourcen. Eine WordPress-Installation ist dort nicht möglich. Mit Mock-Daten kann die komplette Funktionalität offline getestet werden.

### F: Kann ich trotzdem WordPress verwenden?

Ja! Falls du ein eigenes WordPress-Backend hast:

```bash
VITE_USE_MOCK_DATA=false VITE_WP_URL=https://my-wp-site.de pnpm dev
```

Die API wird dann von der WordPress-Installation geladen.

### F: Wie aktualisiere ich die Mock-Daten?

Bearbeite `src/lib/data/mockProjects.ts` und neustart den Dev-Server:

```bash
pnpm dev
```

Änderungen werden automatisch hot-reloaded.

### F: Wie wechsel ich zwischen Modi?

Das ist über `.env` Dateien automatisiert:

- **`.env.local`** - Local Development (Git-ignoriert, persönlich)
- **`.env.production`** - Production Build (im Git, für GitHub Pages)

---

## Weitere Ressourcen

- Mock-Daten: [src/lib/data/mockProjects.ts](src/lib/data/mockProjects.ts)
- API Service: [src/lib/logic/apiService.ts](src/lib/logic/apiService.ts)
- Type Definitions: [src/lib/types/project.ts](src/lib/types/project.ts)
- Environment Guide: [.env.example](.env.example)
