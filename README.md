# CI-Verse: Das Comenius-Orbital
**Status: 🚀 Feature Complete (v2.1)**

## 🎯 Übersicht

Interaktive 3D-Visualisierung der Comenius-Institut Bildungslandschaft als explorative Browser-Anwendung. Eine immersive Messe-Erfahrung mit schwebenden Plattformen, Energie-Visualisierungen, Partner-Vernetzung und intuitivem Transport-System.

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
- ✅ **Dynamische Terminal-Stände** für Events und Publikationen mit Auto-Rotation
- ✅ **Reception Wall** mit KI-Chat Integration
- ✅ **Transport-Portal** mit Destinations-Buttons zu allen Plattformen

### 🚂 Partner-Vernetzung (NEU in v2.1!)
- ✅ **DepartureBoard** - Abfahrtstafel im Bahnhofs-Stil mit Partner-Verbindungen
- ✅ **ShuttleTrain** - Animierter Zug mit Partner-Branding (Ein-/Ausfahrt)
- ✅ **PartnerDialog** - Erklärt Vernetzungsidee vor externem Link
- ✅ **Kategorien**: Ministerien, Kirchen, Hochschulen, Institute, Internationale Partner

### ⚡ Energie-Visualisierung (v2.0)
- ✅ **EnergyFloor** - 6 animierte Ströme fließen von den Leitlinien-Postern zur Mitte
- ✅ **EnergyBeam** - Vertikale Energie-Säule vom Boden zum Oktaeder
- ✅ **Pulsierender Oktaeder** - Empfängt und visualisiert die gesammelte Leitlinien-Energie
- ✅ **Leitlinien-Farben**: Gold (Gerechtigkeit), Grün (Nachhaltigkeit), Cyan (Digitalität), Violett (Strukturen)

### 🌐 Plattform-System
- ✅ **7 Plattformen** (S, B1-B3, Q1-Q3) mit individuellen Farben
- ✅ **Lichtlinien-Transport** zwischen allen Plattformen
- ✅ **Kamera-Animation** entlang der Transport-Linien
- ✅ **Perspektiven-Filter** ändern Atmosphäre und Hervorhebung

### 🎨 UI & Dialoge
- ✅ **GlassDialog** - Glassmorphism-Modals (ziehbar, einheitliches Design)
- ✅ **ChatModal** - KI-Assistent Integration (n8n Webhook)
- ✅ **RssFeedPanel** - News & Publikationen mit Kategorie-Tags
- ✅ **EventsPanel** - Termine im NIP52 Nostr-Format
- ✅ **PartnerDialog** - Vernetzungs-Erklärung vor externem Link
- ✅ **IframeDialog** - Eingebettete externe Websites
- ✅ **NavigationControls** - Kamera-Steuerung
- ✅ **FilterBar** - Leitperspektiven-Buttons

### 📡 Daten-Integration
- ✅ **Mock-Daten System** mit vollständigem Datenmodell
- ✅ **WordPress REST API** vorbereitet (ACF Fields definiert)
- ✅ **NIP52 Nostr Events** vorbereitet (kind 31923)
- ✅ **example-data.json** als Referenz für WordPress-Export

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [architektur.md](./docs/architektur.md) | Technische Architektur & Layer |
| [components.md](./docs/components.md) | 3D-Komponenten-Spezifikation |
| [dialog-components.md](./docs/dialog-components.md) | UI-Dialog-Pattern & GlassDialog |
| [marketplace-guide.md](./docs/marketplace-guide.md) | Marktplatz, Terminals & Partner |
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
| Icons | Lucide Svelte |
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
│   │   │   ├── DepartureBoard.svelte       # Partner-Abfahrtstafel 🚂
│   │   │   ├── ShuttleTrain.svelte         # Animierter Partner-Zug 🚂
│   │   │   ├── MarketplaceStand.svelte     # Dynamische Terminals
│   │   │   ├── EnergyFloor.svelte          # Boden-Energie-Shader ⚡
│   │   │   ├── EnergyBeam.svelte           # Vertikale Energie-Säule ⚡
│   │   │   ├── MesseWall.svelte            # Poster-Wände
│   │   │   ├── TransportPortal.svelte      # Navigation-Hub
│   │   │   └── ...
│   │   └── ui/                    # HTML UI-Overlays
│   │       ├── GlassDialog.svelte          # Basis-Dialog (ziehbar)
│   │       ├── ChatModal.svelte            # KI-Assistent
│   │       ├── PartnerDialog.svelte        # Vernetzungs-Dialog
│   │       ├── RssFeedPanel.svelte         # News-Panel
│   │       ├── EventsPanel.svelte          # Termine-Panel
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

Die 6 Leitlinien des Instituts  **fließen als sichtbare Energie** durch das System:

```
    [Poster]     [Poster]     [Poster]     [Poster]
       │            │            │            │
       └────────────┼────────────┼────────────┘
                    │ EnergyFloor (6 Ströme)
                    ▼
              ╔═══════════╗
              ║  Oktaeder ║ ← Pulsiert mit  Energie
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
- [ ] Partner-Daten aus WordPress ACF
- [ ] Bilder/Assets aus WordPress Media Library laden

### Phase 4: Live-Daten
- [ ] Echter RSS-Feed für Publikationen
- [ ] Echte Nostr NIP52 Events (kind 31923)
- [ ] n8n Webhook für Chat-Integration
- [ ] iCal-Import für Termine

### Phase 5: Polish & Performance
- [ ] Bloom Post-Processing für verstärkte Glow-Effekte
- [ ] LOD (Level of Detail) für entfernte Plattformen
- [ ] Mobile Touch-Controls
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

**Letztes Update**: 2025-12-02  
**Version**: 2.1.0
