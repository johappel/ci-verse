# CI-Verse Entwicklungs-Roadmap

## Version History

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

### Phase 4: Polish & Performance
- [ ] Bloom Post-Processing (UnrealBloomPass)
- [ ] LOD für entfernte Plattformen
- [ ] Lazy Loading für Plattform-Inhalte
- [ ] Mobile Touch-Controls
- [ ] Loading-Screen mit Progress

### Phase 5: Live-Daten
- [ ] RSS-Feed Integration (Publikationen)
- [ ] iCal Events-Anzeige
- [ ] Nostr Live-Pulse für Aktivitäten
- [ ] WebSocket für Echtzeit-Updates

### Phase 6: Erweiterungen
- [ ] Audio-Feedback für Interaktionen
- [ ] Ambient Soundscape
- [ ] VR-Modus (WebXR)
- [ ] Multi-User Presence

---

## Tech Debt

- [ ] Font-Loading Cleanup (aktuell entfernt wegen Bugs)
- [ ] Error Boundaries für 3D-Komponenten
- [ ] Unit Tests für Store-Methoden
- [ ] E2E Tests mit Playwright
- [ ] Accessibility-Audit

---

## Dependencies

```json
{
  "three": "^0.172.0",
  "@threlte/core": "^8.0.0",
  "@threlte/extras": "^9.0.0",
  "tailwindcss": "^4.0.0",
  "@tailwindcss/postcss": "^4.0.0"
}
```

## Commands

```bash
pnpm dev       # Development → http://localhost:5173
pnpm build     # Production Build
pnpm preview   # Preview → http://localhost:4173
pnpm check     # TypeScript Check
```
