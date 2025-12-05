# CI-Verse Entwicklungs-Roadmap

## Version History

---

## 2025-12-05: v2.1.1 – 3D Performance Optimierungen

### ✅ Status: Implementiert

**Problem**: Lags bei Kamera-Flügen und Zoom-Aktionen beim ersten Ausführen

**Ursache**: WebGL kompiliert Shader "lazy" - erst beim ersten Rendern eines Materials

**Implementierte Lösungen:**

#### 🚀 ShaderWarmup-Komponente
- Neue Komponente `ShaderWarmup.svelte` kompiliert alle Shader beim Start
- Ruft `renderer.compile()` auf um GPU zur Vorkompilierung zu zwingen
- Rendert alle verwendeten Material-Typen versteckt (MeshStandard, MeshPhysical, MeshBasic, MeshLine, Text)

#### ⚡ Task-Optimierung für entfernte Plattformen
- `useTask`-Callbacks laufen nur noch wenn User auf der Plattform ist
- Neue `platformId`-Props in betroffenen Komponenten
- Early-exit für nicht-relevante Plattformen

#### 📦 Geometry-Caching-Bibliothek (Vorbereitet)
- Neue Datei `src/lib/logic/sharedGeometries.ts`
- Zentrale Geometrie-Bibliothek verhindert GPU-Duplikate

**Optimierte Komponenten:**
- `ExhibitBooth.svelte` ✅
- `ExhibitStand.svelte` ✅
- `MesseWall.svelte` ✅
- `InteractionPillar.svelte` ✅
- `LightBridge.svelte` ✅

**Neue Dateien:**
```
src/lib/components/3d/ShaderWarmup.svelte   # Shader-Vorkompilierung
src/lib/logic/sharedGeometries.ts           # Geometry-Caching
```

**Dokumentation:** [3D-Improvements.md](./3D-Improvements.md)

---

## 2025-12-02: v2.1.0 – Marktplatz & Partner-Vernetzung

### ✅ Status: Feature Complete

**Neue Features:**

#### 🚂 Shuttle-Train System
- **DepartureBoard** - Abfahrtstafel im Bahnhofs-Stil für Partner-Verbindungen
- **ShuttleTrain** - Animierter Zug mit Partner-Branding (Ein-/Ausfahrt)
- Partner-Kategorien: ministry, church, university, institute, international, association
- Farbcodierung nach Kategorie

#### 💬 PartnerDialog - Vernetzungs-Erklärung
- Zwischengeschalteter Dialog vor externem Link
- Erklärt die Vernetzungsidee je nach Partner-Kategorie
- Zeigt Partner-Logo, Kategorie-Badge und Statistiken
- Inline-Styles für Portal-Kompatibilität

#### 📺 Dynamische MarketplaceStand-Terminals
- **Publikationen-Terminal** (grün) - Rotierende News-Anzeige
- **Events-Terminal** (rot) - Rotierende Termin-Anzeige  
- Auto-Rotation alle 8-15 Sekunden
- Pagination-Dots und "Alle anzeigen →" Button
- Kompakte Date-Badges für Events

#### 📰 RssFeedPanel (GlassDialog)
- Vollständige Umstellung auf GlassDialog-Pattern
- Inline-Styles statt Tailwind für Portal-Kompatibilität
- Kategorie-Tags mit Farbcodierung
- Aktualisieren-Button

#### 📅 EventsPanel (GlassDialog)
- NIP52 Nostr Calendar Event Format (kind 31923)
- Datum-Badge mit rotem Hintergrund
- Event-Typ-Tags (Tagung, Workshop, Webinar, etc.)
- Online/Vor-Ort Kennzeichnung

**Verbesserungen:**
- Alle Dialoge außerhalb `<main>` für korrekten z-index
- Einheitliches GlassDialog-Pattern für alle Overlays
- ShuttleTrain-Logo auf Marktplatz entfernt (störend)
- Kleineres Event-Date-Badge im Terminal

**Neue/Erweiterte Komponenten:**
```
src/lib/components/3d/
├── DepartureBoard.svelte      # Partner-Abfahrtstafel (NEU)
├── ShuttleTrain.svelte        # Animierter Partner-Zug (NEU)
├── MarketplaceStand.svelte    # Dynamische Terminals (REWRITTEN)

src/lib/components/ui/
├── PartnerDialog.svelte       # Vernetzungs-Dialog (NEU)
├── RssFeedPanel.svelte        # News-Panel (REWRITTEN)
├── EventsPanel.svelte         # Termine-Panel (REWRITTEN)
```

---

## 2025-11-30: v2.0.0 – Energie-Visualisierung

### ✅ Status: Feature Complete

**Neue Features:**

#### ⚡ EnergyFloor (Custom GLSL Shader)
- 6 animierte Energieströme von den Leitlinien-Wänden zur Mitte
- Farbcodierung nach Leitlinie:
  - Gerechtigkeit → Gold (#fbbf24)
  - Nachhaltigkeit → Grün (#22c55e)  
  - Digitalität → Cyan (#06b6d4)
  - Strukturen → Violett (#a855f7)
- Inward-Flow-Animation mit Partikeln und Pulsen
- Reagiert auf `worldStore.state.activePerspective`

#### ⚡ EnergyBeam (Vertikale Energie-Säule)
- Aufsteigende Partikel von Boden zum Oktaeder
- Farbrotation durch alle 4 Leitlinien-Farben
- Nur sichtbar wenn auf S-Plattform (`isOnS`)

#### ⚡ Pulsierender Oktaeder
- Empfängt visuelle Energie als zentrales Element
- MeshStandardMaterial mit dynamischem Emissive
- Mehrschichtiger Glow-Effekt:
  - Äußerer Halo (pulsierend)
  - Innerer Core
  - Ring-Effekt
- Skalierungs-Animation

**Weitere Verbesserungen:**
- Platform-Farben in Daten-Layer verschoben (CMS-ready)
- MarketplaceContent Interface erweitert
- Darkened Marketplace Platform (#1e293b)
- Neue Dokumentation: `platform-guide.md`

**Neue Komponenten:**
```
src/lib/components/3d/
├── EnergyFloor.svelte      # Boden-Shader (NEU)
├── EnergyBeam.svelte       # Vertikale Säule (NEU)
└── MarketplacePlatform.svelte  # Oktaeder-Glow (ERWEITERT)
```

---

## 2025-11-28: v1.5.0 – Marktplatz-Ausbau

### ✅ Status: Abgeschlossen

**Implementiert:**
- ✅ MesseWall-Komponenten mit Leitlinien-Postern
- ✅ LeitlinienPoster mit klickbaren Bereichen
- ✅ InstitutionBooth für Comenius-Institut
- ✅ TransportPortal mit Destinations-Buttons
- ✅ ReceptionWall mit Chat-Integration
- ✅ MarketplaceStand (Terminal) für Events/Publikationen
- ✅ GlassDialog und IframeDialog
- ✅ ChatModal mit n8n Webhook

**Transport-System:**
- Lichtlinien zwischen Plattformen
- Kamera-Animation entlang Linien
- Destination-Overlay bei Hover

---

## 2025-11-25: v1.0.0 – Initial MVP

### ✅ Status: Core Features

**Implementiert:**
- ✅ SvelteKit Setup mit Svelte 5 Runes
- ✅ Threlte 8 Integration
- ✅ WorldStore State Management
- ✅ Hexagonaler Layout-Algorithmus
- ✅ ExhibitStand 3D-Komponente
- ✅ ProjectCard Modal (Glassmorphism)
- ✅ FilterBar mit Leitperspektiven
- ✅ Camera Controls (OrbitControls)
- ✅ URL Deep-Linking

**Performance:**
- 60 FPS bestätigt
- WebGL 2.0 Support

---

## Geplante Features

### Phase 3: WordPress Integration
- [ ] Plugin auf WordPress-Instanz aktivieren
- [ ] REST API `/civerse/v1/world` testen
- [ ] Bilder aus WordPress Media Library
- [ ] Cache-Strategie für API-Daten
- [ ] Partner-Daten aus WordPress ACF

### Phase 4: Live-Daten Integration
- [ ] Echter RSS-Feed für Publikationen
- [ ] Echte Nostr NIP52 Events (kind 31923)
- [ ] n8n Webhook für Chat-Integration
- [ ] iCal-Import für Termine

### Phase 5: Polish & Performance
- [x] **Shader-Warmup** - Vorkompilierung aller WebGL-Shader ✅
- [x] **Task-Optimierung** - useTask nur auf aktiver Plattform ✅
- [x] **Geometry-Caching** - Bibliothek vorbereitet ✅
- [ ] Bloom Post-Processing (UnrealBloomPass)
- [ ] LOD für entfernte Plattformen
- [ ] Frustum Culling für unsichtbare Objekte
- [ ] Lazy Loading für Plattform-Inhalte
- [ ] Mobile Touch-Controls
- [ ] Loading-Screen mit Progress
- [ ] Audio-Feedback für Interaktionen

### Phase 6: Erweiterungen
- [ ] Ambient Soundscape
- [ ] VR-Modus (WebXR)
- [ ] Multi-User Presence
- [ ] Weitere Partner-Kategorien

---

## Tech Debt

- [ ] Font-Loading Cleanup (aktuell entfernt wegen Bugs)
- [ ] Error Boundaries für 3D-Komponenten
- [ ] Unit Tests für Store-Methoden
- [ ] E2E Tests mit Playwright
- [ ] Accessibility-Audit
- [ ] TypeScript strict mode

---

## Dependencies

```json
{
  "three": "^0.172.0",
  "@threlte/core": "^8.0.0",
  "@threlte/extras": "^9.0.0",
  "tailwindcss": "^4.0.0",
  "@tailwindcss/postcss": "^4.0.0",
  "lucide-svelte": "^0.460.0"
}
```

## Commands

```bash
pnpm dev       # Development → http://localhost:5173
pnpm build     # Production Build
pnpm preview   # Preview → http://localhost:4173
pnpm check     # TypeScript Check
```

---

**Letztes Update**: 2025-12-05  
**Aktuelle Version**: 2.1.1
