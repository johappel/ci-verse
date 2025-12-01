# CI-Verse: Das Comenius-Orbital
**Status: 🚀 Feature Complete (v2.0)**

## 🎯 Übersicht

Interaktive 3D-Visualisierung der Comenius-Institut Bildungslandschaft als explorative Browser-Anwendung. Eine immersive Messe-Erfahrung mit schwebenden Plattformen, Energie-Visualisierungen und intuitivem Transport-System.

## 🚀 Quick Start

```bash
# Development
pnpm install
pnpm dev          # → http://localhost:5173

# Production
pnpm build
pnpm preview      # → http://localhost:4173
```

## ✨ Implementierte Features

### 🏛️ Marktplatz (S-Plattform)
- ✅ **Hexagonale Plattform** mit MesseWalls für Leitlinien-Poster
- ✅ **Institutions-Booth** (Comenius-Institut) mit Team-Anzeige
- ✅ **Terminal-Stände** für Events und Publikationen (RSS)
- ✅ **Reception Wall** mit KI-Chat Integration
- ✅ **Transport-Portal** mit Destinations-Buttons zu allen Plattformen

### ⚡ Energie-Visualisierung (NEU in v2.0!)
- ✅ **EnergyFloor** - 6 animierte Ströme fließen von den Leitlinien-Postern zur Mitte
- ✅ **EnergyBeam** - Vertikale Energie-Säule vom Boden zum Oktaeder
- ✅ **Pulsierender Oktaeder** - Empfängt und visualisiert die gesammelte Leitlinien-Energie
- ✅ **Leitlinien-Farben**: Gold (Gerechtigkeit), Grün (Nachhaltigkeit), Cyan (Digitalität), Violett (Strukturen)

### 🌐 Plattform-System
- ✅ **7 Plattformen** (S, B1-B3, Q1-Q3) mit individuellen Farben
- ✅ **Lichtlinien-Transport** zwischen allen Plattformen
- ✅ **Kamera-Animation** entlang der Transport-Linien
- ✅ **Perspektiven-Filter** ändern Atmosphäre und Hervorhebung

### 🎨 UI & Interaktion
- ✅ **GlassDialog** - Glassmorphism-Modals für Projekt-Details
- ✅ **IframeDialog** - Eingebettete externe Websites
- ✅ **ChatModal** - KI-Assistent Integration (n8n Webhook)
- ✅ **NavigationControls** - Kamera-Steuerung
- ✅ **FilterBar** - Leitperspektiven-Buttons

### 📡 Daten-Integration
- ✅ **Mock-Daten System** mit vollständigem Datenmodell
- ✅ **WordPress REST API** vorbereitet (ACF Fields definiert)
- ✅ **example-data.json** als Referenz für WordPress-Export

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [architektur.md](./docs/architektur.md) | Technische Architektur & Layer |
| [components.md](./docs/components.md) | Komponenten-Spezifikation |
| [platform-guide.md](./docs/platform-guide.md) | Anleitung: Neue Plattform hinzufügen |
| [svelte-stores.md](./docs/svelte-stores.md) | State Management |
| [wp-setup.md](./docs/wp-setup.md) | WordPress Integration |
| [Roadmap.md](./docs/Roadmap.md) | Entwicklungs-History & Nächste Schritte |

## 🛠️ Tech-Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit (Svelte 5 Runes) |
| 3D Engine | Threlte 8 (Three.js) |
| Shader | GLSL (Custom Fragment Shader) |
| Styling | TailwindCSS v4 |
| State | Svelte 5 Runes (`$state`, `$derived`, `$effect`) |
| Language | TypeScript |

## 📁 Projektstruktur

```
src/
├── lib/
│   ├── components/
│   │   ├── 3d/                    # 3D Threlte-Komponenten
│   │   │   ├── MarketplacePlatform.svelte  # Hauptplattform (S)
│   │   │   ├── Platform.svelte             # Generische Plattform (B/Q)
│   │   │   ├── EnergyFloor.svelte          # Boden-Energie-Shader ⚡
│   │   │   ├── EnergyBeam.svelte           # Vertikale Energie-Säule ⚡
│   │   │   ├── MesseWall.svelte            # Poster-Wände
│   │   │   ├── TransportPortal.svelte      # Navigation-Hub
│   │   │   └── ...
│   │   └── ui/                    # HTML UI-Overlays
│   │       ├── GlassDialog.svelte
│   │       ├── ChatModal.svelte
│   │       └── ...
│   ├── logic/
│   │   ├── store.svelte.ts        # WorldStore State Management
│   │   ├── platforms.ts           # Plattform-Definitionen
│   │   └── layout.ts              # Hexagonaler Layout-Algorithmus
│   ├── types/
│   │   └── project.ts             # TypeScript Interfaces
│   └── data/
│       └── mockProjects.ts        # Mock-Daten
├── routes/
│   └── +page.svelte               # Hauptseite
└── wordpress/
    └── ci-verse-data/             # WordPress Plugin (ACF)
```

## 🎨 Design-Konzept

### Die Energie-Metapher

Die 4 Leitlinien des Instituts (Gerechtigkeit, Nachhaltigkeit, Digitalität, Strukturen) **fließen als sichtbare Energie** durch das System:

```
    [Poster]     [Poster]     [Poster]     [Poster]
       │            │            │            │
       └────────────┼────────────┼────────────┘
                    │ EnergyFloor (6 Ströme)
                    ▼
              ╔═══════════╗
              ║  Oktaeder ║ ← Pulsiert mit Energie
              ╚═════╦═════╝
                    ║ EnergyBeam
                    ║
              ══════╩══════
                   [S]
              Marktplatz
```

### Plattform-Hierarchie

```
Y=25    ·    ·    ·    ·[Q2 Europa]·    ·    ·
                              
Y=20    ·[Q1 Forschung]·    ·    ·[Q3 Digital]·
                              
Y=8    [B1 Kita]·····[S Marktplatz]·····[B3 Erwachsene]
                         [B2 Schule]
```

## 🔄 Nächste Schritte

### Phase 3: WordPress Integration
- [ ] WordPress Plugin aktivieren und testen
- [ ] REST API Endpoint `/civerse/v1/world` anbinden
- [ ] Bilder/Assets aus WordPress Media Library laden

### Phase 4: Polish & Performance
- [ ] Bloom Post-Processing für verstärkte Glow-Effekte
- [ ] LOD (Level of Detail) für entfernte Plattformen
- [ ] Lazy Loading für Plattform-Inhalte
- [ ] Mobile Touch-Controls

### Phase 5: Erweiterungen
- [ ] Live-RSS-Feed Integration
- [ ] iCal Events-Anzeige
- [ ] Nostr Live-Pulse Animationen
- [ ] Audio-Feedback für Interaktionen

## 🧪 Entwicklung

```bash
pnpm dev           # Development Server
pnpm build         # Production Build
pnpm preview       # Preview Production Build
pnpm check         # TypeScript Check
```

## 📝 Notizen

- **Mock-Daten**: `src/lib/data/mockProjects.ts`
- **WordPress Plugin**: `wordpress/ci-verse-data/`
- **Deployment**: Vercel-ready (SvelteKit adapter-auto)
- **Browser-Support**: Modern browsers mit WebGL 2.0

---

**Letztes Update**: 2025-11-30  
**Version**: 2.0.0
