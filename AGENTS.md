# Anweisungen für AI Coding Agents (Cursor/Copilot)

## Projekt Status
**🚀 Feature Complete v2.1** (2025-12-01)  
Neu: Signpost-Wegweiser für verwandte Projekte, displayType-System für Booth/Wall-Zuordnung.

---

## 1. Projekt Vision & Kernkonzept

### Was bauen wir?
Eine **interaktive 3D-Bildungslandschaft** für das Comenius-Institut. Keine klassische Website, sondern ein **explorativer 3D-Raum** im Browser, der als Gateway zu den vielen externen Projekten dient.

### Die Schwebende-Plattformen-Architektur

```
Seitenansicht (Y-Achse):
                                                    
Y=25    ·    ·    ·    ·    ·[Q2]·    ·    ·    ·   ← Europa (höchste)
                           ╱    ╲                   
Y=20    ·    ·[Q1]════════╬══════╬════════[Q3]·    ← Forschung & Digital
              ║           ║      ║         ║        
              ║      Lichtlinien-Transport ║        
              ║           ║      ║         ║        
Y=8    ·[B1]══╬═══════════[S]════╬═════════╬══[B3] ← Bildung + S (gleiche Höhe)
              ║           ║[B2]══╝         ║         
              ╚═══════════╬═══════════════╝         
                          ║                          
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~         ← Nebel-Grenze
Y=0    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Dichter Nebel (kein Boden)


Draufsicht (X-Z-Ebene):

                    [Q2 Europa]
                    Y=25, z=-20
                        
    [Q1 Forschung]              [Q3 Digital]
    Y=20, x=-15                 Y=20, x=15
                        
                        
   [B1 Schule]    [S Markt]    [B3 Erwachsene]
   Y=8, x=-20   Y=8, x=0     Y=8, x=20
                [B2 Gemeinde]
                Y=8, z=15
```

### Energie-Visualisierung (NEU in v2.0!)

```
    [Poster]     [Poster]     [Poster]     [Poster]
       │            │            │            │
       └────────────┼────────────┼────────────┘
                    │ EnergyFloor (6 Ströme)
                    ▼
              ╔═══════════╗
              ║  Oktaeder ║ ← Pulsiert + Glüht
              ╚═════╦═════╝
                    ║ EnergyBeam (vertikal)
                    ║
              ══════╩══════
                   [S]
              Marktplatz
```

Die 4 Leitlinien fließen als **sichtbare Energie** zum Oktaeder:
- **Gold** (Gerechtigkeit)
- **Grün** (Nachhaltigkeit)
- **Cyan** (Digitalität)
- **Violett** (Strukturen)

### Plattform-Definitionen

| ID | Name | Y | X | Z | Größe | Inhalt |
|----|------|---|---|---|-------|--------|
| **S** | Marktplatz | 8 | 0 | 0 | Klein | S1 (Bibliothek), S2_1 (ProjectChart KI) |
| **B1** | Frühkindliche Bildung | 8 | -20 | 0 | Mittel | Kita-Projekte |
| **B2** | Schule & Jugend | 8 | 0 | 15 | Mittel | Schul-Projekte |
| **B3** | Erwachsenenbildung | 8 | 20 | 0 | Mittel | Erwachsenen-Projekte |
| **Q1** | Forschung | 20 | -15 | -10 | Groß | Forschungs-Projekte |
| **Q2** | Europa | 25 | 0 | -20 | Groß | EU-Projekte |
| **Q3** | Digitalisierung | 20 | 15 | -10 | Groß | Digital-Projekte |

### S-Plattform (Marktplatz) Details

| ID | Name | Funktion | Interaktion |
|----|------|----------|-------------|
| S1 | Bibliothek | Dokumentation | → Externe Webseite |
| S2_1 | ProjectChart | KI-Auskunft | → Chat-Modal öffnen |
| S2_2 | Backoffice | - | Dekorativ (kein Link) |
| S2_3 | Finanzen | - | Dekorativ (kein Link) |

### Lichtlinien-Transport

```typescript
// Verbindungen zwischen Plattformen
const connections = [
  // S zu allen anderen
  { from: 'S', to: 'B1', color: '#fff8e0' },
  { from: 'S', to: 'B2', color: '#fff8e0' },
  { from: 'S', to: 'B3', color: '#fff8e0' },
  { from: 'S', to: 'Q1', color: '#60a5fa' },
  { from: 'S', to: 'Q2', color: '#60a5fa' },
  { from: 'S', to: 'Q3', color: '#60a5fa' },
  // B-Ring untereinander
  { from: 'B1', to: 'B2', color: '#fbbf24' },
  { from: 'B2', to: 'B3', color: '#fbbf24' },
  { from: 'B3', to: 'B1', color: '#fbbf24' },
  // Q-Ring untereinander
  { from: 'Q1', to: 'Q2', color: '#a78bfa' },
  { from: 'Q2', to: 'Q3', color: '#a78bfa' },
  { from: 'Q3', to: 'Q1', color: '#a78bfa' },
];
```

**Transport-Interaktion:**
1. User startet auf S-Plattform (Kamera)
2. Sieht leuchtende Lichtlinien zu anderen Plattformen
3. Hover auf Linie → Linie wird heller, Zielname erscheint
4. Klick auf Linie → Kamera fliegt sanft entlang (2-3 Sek)
5. Landet auf Ziel-Plattform

### Nebel-System

```typescript
// Nebel versteckt "Abgrund", fokussiert auf Plattformen
const fogConfig = {
  type: 'exponential',
  color: '#1a1a2e',      // Tiefes Blau-Schwarz
  density: 0.02,
  near: 5,               // Beginnt unter Y=5
};

// Perspektiven-Farben
const fogColors = {
  neutral:       '#1a1a2e',  // Default
  digitality:    '#0a1628',  // Cyan-getönt
  sustainability:'#0a2818',  // Grün-getönt
  justice:       '#28200a',  // Warm-Gold
};
```

---

## 2. Technische Regeln (STRIKT!)

### Svelte 5 Runes Syntax
```typescript
// ✅ KORREKT
let count = $state(0);
let doubled = $derived(count * 2);
let { project, position } = $props();
$effect(() => { console.log(count); });

// ❌ VERBOTEN - Veraltete Syntax
export let project;           // Niemals!
$: doubled = count * 2;       // Niemals!
let store = writable({});     // Verwende $state stattdessen
```

### Threlte Patterns
```svelte
<!-- ✅ Deklarativ mit T-Komponenten -->
<T.Mesh position={[x, y, z]} onclick={handleClick}>
  <T.BoxGeometry args={[1, 1, 1]} />
  <T.MeshStandardMaterial color="#ff0000" />
</T.Mesh>

<!-- ✅ Reaktive Properties -->
<T.Group position.y={$animatedY} scale={$scale}>

<!-- ⚠️ interactivity() MUSS in Komponente mit Render-Output aufgerufen werden -->
<script>
  import { interactivity } from '@threlte/extras';
  interactivity(); // In WorldLayout.svelte, NICHT in leerem Setup-Component
</script>

<!-- ❌ Vermeide direkten Three.js Code in Komponenten -->
const mesh = new THREE.Mesh(); // Nur in Utilities!
```

### ⚠️ HTML-Raycasting Problem & Lösung

**Problem:** `<HTML>` Elemente blockieren 3D-Raycasts zu darunterliegenden Meshes. Auch mit `pointer-events: none` oder unterschiedlichen Z-Positionen funktioniert Raycasting durch HTML nicht zuverlässig.

**❌ Funktioniert NICHT:**
```svelte
<!-- HTML-Button blockiert Raycasts, Klicks inkonsistent -->
<HTML center position={[0, 0, 0.1]}>
  <button onclick={handleClick}>Klick mich!</button>
</HTML>

<!-- Mesh dahinter wird NICHT getroffen -->
<T.Mesh position={[0, 0, 0]} onclick={handleWallClick}>
  <T.PlaneGeometry />
</T.Mesh>
```

**✅ LÖSUNG: Verwende 3D-Text + Unsichtbare Mesh**
```svelte
<!-- Unsichtbare Mesh fängt Klicks ab -->
<T.Mesh 
  position={[0, -2, 0.1]} 
  onclick={(e) => { e.stopPropagation(); handleClick(e); }}
  onpointerenter={() => isHovered = true}
  onpointerleave={() => isHovered = false}
>
  <T.PlaneGeometry args={[3, 1]} />
  <T.MeshBasicMaterial 
    transparent 
    opacity={isHovered ? 0.3 : 0.01}  // 0.01 = unsichtbar aber raycast-fähig!
    depthWrite={false}
  />
</T.Mesh>

<!-- 3D-Text darüber (blockiert Raycasts NICHT) -->
<Billboard position={[0, -2, 0.15]}>
  <Text
    text="Klick mich!"
    color="#ffffff"
    fontSize={0.35}
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.02}
    outlineColor="#00ffff"
  />
</Billboard>
```

**Wichtige Erkenntnisse:**
- `opacity={0}` macht Mesh raycast-unsichtbar → mindestens `0.01` verwenden
- `<HTML>` blockiert Raycasts IMMER, egal welche Z-Position oder `pointer-events`
- `<Text>` + `<Billboard>` sind echte 3D-Objekte, blockieren Raycasts nicht
- `depthWrite={false}` verhindert Rendering-Artefakte bei transparenten Meshes
- `stopPropagation()` verhindert Weiterleitung zu dahinterliegenden Objekten

### Store-Interaktion
```typescript
// ✅ Immer durch Store-Methoden
worldStore.selectProject(id);
worldStore.setPerspective('digitality');
worldStore.setCurrentPlatform('Q1');
worldStore.startTransport('B2');

// ⚠️ Direkter State-Zugriff nur lesend
const current = worldStore.state.currentPlatform;
```

### Styling
- **3D-Objekte**: Three.js Materials über Threlte
- **UI-Overlays**: TailwindCSS (liegen über Canvas mit z-index)
- **Keine Inline-Styles** außer dynamische Three.js-Werte

### ⚠️ HTML-Overlay Z-Fighting Problem

**Problem:** Das `<HTML>` Element von `@threlte/extras` ignoriert die Z-Tiefe von 3D-Objekten. HTML-Inhalte "bluten" durch andere Plattformen und Objekte durch, auch wenn diese eigentlich davor liegen sollten.

**Lösung:** Bei Marktplatz-spezifischen Komponenten ALLE `<HTML>` Elemente nur rendern, wenn der User auf dem Marktplatz ist:

```svelte
<script>
    // Ist der User auf dem Marktplatz?
    let isOnMarketplace = $derived(worldStore.state.currentPlatform === 'S');
</script>

<!-- HTML nur auf Marktplatz rendern -->
{#if isOnMarketplace}
<HTML position={[0, 0, 0.1]} transform center>
    <!-- Interaktiver Inhalt -->
</HTML>
{/if}

<!-- 3D-Strukturen (Rahmen, Tafel) bleiben IMMER sichtbar -->
<T.Mesh>
    <T.BoxGeometry args={[5, 3, 0.2]} />
    <T.MeshStandardMaterial color="#1e293b" />
</T.Mesh>
```

**Betroffene Komponenten:**
- `DepartureBoard.svelte` - Fahrplan-Tafel
- `ReceptionWall.svelte` - Team-Slideshow, Chatbot-Video, "Frag mich!"-Button
- `MarketplaceStand.svelte` - News/Events-Tafeln, Institution-Button

---

## 3. Dateistruktur (Neu)

```
src/lib/
├── components/
│   ├── 3d/
│   │   ├── Scene.svelte           # Canvas, Kamera, Licht, Nebel
│   │   ├── WorldLayout.svelte     # Rendert Plattformen + Lichtlinien
│   │   ├── Platform.svelte        # Generische Plattform (Waben-Basis)
│   │   ├── ExhibitStand.svelte    # Projekt-Messestand auf Plattform
│   │   ├── ExhibitBooth.svelte    # Freistehender Messestand (displayType: booth)
│   │   ├── MesseWall.svelte       # Poster-Wand (displayType: wall)
│   │   ├── Signpost.svelte        # Wegweiser für verwandte Projekte
│   │   ├── LightBridge.svelte     # Einzelne Lichtlinie (klickbar)
│   │   ├── TransportNetwork.svelte # Verwaltet alle Verbindungen
│   │   └── [DEPRECATED] Terra.svelte
│   │   └── [DEPRECATED] FloatingPlatform.svelte
│   └── ui/
│       ├── ProjectCard.svelte     # Detail-Modal
│       ├── FilterBar.svelte       # Perspektiven-Buttons
│       └── ChatModal.svelte       # ProjectChart KI (S2_1)
├── logic/
│   ├── store.svelte.ts            # WorldStore mit Transport-State
│   ├── layout.ts                  # Hexagonales Layout für Stände
│   └── platforms.ts               # Plattform-Definitionen & Verbindungen
├── types/
│   └── project.ts                 # TypeScript Interfaces
└── data/
    └── mockProjects.ts            # Test-Daten
```

---

## 4. Datenmodell

### ProjectData Interface (Auszug)
```typescript
interface ProjectData {
    id: string;
    title: string;
    departments: Department[];           // Heimat-Plattformen (B1, B2, B3, Q1, Q2, Q3)
    relatedDepartments?: Department[];   // Wegweiser auf diesen Plattformen zeigen
    displayType: 'booth' | 'wall' | 'both';  // Wie wird das Projekt angezeigt?
    display?: ProjectDisplay;
    // ... weitere Felder
}
```

### ProjectDisplay Interface
```typescript
interface ProjectDisplay {
    slogan: string;               // Slogan für das Poster
    posterImage?: string;         // URL zum Poster-Bild
    posterImageFormat?: 'portrait' | 'landscape' | 'square'; // Bildformat (default: portrait)
    logoUrl?: string;             // Projekt-Logo
    color: string;                // Primärfarbe (Hex)
    screenshotUrl?: string;       // Website-Screenshot
    icon?: string;                // Emoji oder Icon-Name
}
```

### displayType - Projekt-Anzeige

| displayType | Komponente | Beschreibung |
|-------------|------------|---------------|
| **booth** | ExhibitBooth | Freistehender Messestand (vorne auf Plattform) |
| **wall** | MesseWall | Poster an der Wand (hinten auf Plattform) |
| **both** | Beide | Sowohl Booth als auch Poster |

### relatedDepartments - Wegweiser-System

Projekte können auf anderen Plattformen als "Wegweiser" erscheinen:

```typescript
// Beispiel: Konfi-App ist auf B2 + Q3, zeigt Wegweiser auf B3
{
    id: 'p5',
    title: 'Konfi-App',
    departments: ['B2', 'Q3'],        // Heimat-Plattformen
    relatedDepartments: ['B3'],       // Wegweiser auf B3 zeigen
    displayType: 'both'
}
```

**Aktuelle Wegweiser-Konfiguration:**

| Plattform | Zeigt Wegweiser zu |
|-----------|--------------------|
| B3 | Konfi-App (→ Schule & Digital) |
| Q1 | Godly Play (→ Kita & Schule) |
| B2 | Senioren digital (→ Erwachsene & Digital) |

### Poster-Bildformate

| Format | Empfohlene Größe | Darstellung |
|--------|------------------|-------------|
| **portrait** (Standard) | 800×1200 px | Schmal und hoch, rechts neben Text |
| **landscape** | 1200×800 px | Breit und flach, rechts neben Text |
| **square** | 1000×1000 px | Quadratisch, rechts neben Text |

**Wichtig:** Poster und Bild sind **immer nebeneinander** mit einheitlichem Abstand!

**Beispiel (mockProjects.ts):**
```typescript
{
    id: 'p3',
    title: 'Forschungsstelle Bildungsbericht',
    display: {
        slogan: 'Wissen schafft Bildung',
        posterImage: 'https://picsum.photos/seed/research/1200/800',
        posterImageFormat: 'landscape',  // ← Breitbild rechts neben Text
        color: '#8b5cf6'
    }
}
```

---

## 5. Komponenten-Übersicht

### Platform.svelte
Generische schwebende Plattform mit hexagonaler Basis.

```svelte
<script>
  import { T } from '@threlte/core';
  import ExhibitStand from './ExhibitStand.svelte';
  
  let { platform, projects } = $props();
  // platform: { id, name, position, size, color }
  // projects: Project[] die zu dieser Plattform gehören
</script>

<T.Group position={platform.position}>
  <!-- Hexagonale Basis -->
  <T.Mesh rotation.x={-Math.PI / 2}>
    <T.CylinderGeometry args={[platform.size, platform.size, 0.5, 6]} />
    <T.MeshStandardMaterial color={platform.color} />
  </T.Mesh>
  
  <!-- Projekt-Stände darauf -->
  {#each projects as project, i}
    <ExhibitStand {project} position={layoutPosition(i)} />
  {/each}
</T.Group>
```

### Signpost.svelte
Wegweiser für verwandte Projekte (unter dem Plattformschild).

```svelte
<script>
  let { 
    relatedProjects,   // ProjectData[] mit relatedDepartments
    position,          // [x, y, z]
    platformId,        // Aktuelle Plattform-ID
    compact = false    // true = horizontal unter Schild
  } = $props();
</script>
```

**Zwei Modi:**

| Modus | Position | Layout |
|-------|----------|--------|
| **compact** (Standard) | Y=9.5, unter Plattformschild | Horizontal, kleine Buttons |
| **standard** | Frei auf Plattform | Vertikale Holztafel mit Pfosten |

**Kompakt-Modus (unter Schild):**
```
    Y=12  ┌─────────────────┐
          │  Erwachsene     │  ← Plattformschild
          └─────────────────┘
    Y=9.5 🔗 Siehe auch:
          ┌──────────┐
          │Konfi-App │  ← Klickbarer Button
          │→ Schule  │
          └──────────┘
```

---

### LightBridge.svelte
Klickbare Lichtlinie zwischen zwei Plattformen.

```svelte
<script>
  import { T } from '@threlte/core';
  import { Line2 } from '@threlte/extras';
  import { worldStore } from '$lib/logic/store.svelte';
  
  let { from, to, color } = $props();
  let isHovered = $state(false);
  
  function handleClick() {
    worldStore.startTransport(to.id);
  }
</script>

<Line2
  points={[from.position, to.position]}
  color={isHovered ? '#ffffff' : color}
  lineWidth={isHovered ? 4 : 2}
  onclick={handleClick}
  onpointerenter={() => isHovered = true}
  onpointerleave={() => isHovered = false}
/>

{#if isHovered}
  <HTML position={midpoint} center>
    <div class="bg-black/80 text-white px-2 py-1 rounded text-sm">
      → {to.name}
    </div>
  </HTML>
{/if}
```

### Transport-Animation (Store)
```typescript
// In store.svelte.ts
startTransport(targetId: string) {
  this.state.isTransporting = true;
  this.state.transportTarget = targetId;
  
  // Nach Animation (2-3s) abschließen
  setTimeout(() => {
    this.state.currentPlatform = targetId;
    this.state.isTransporting = false;
    this.state.transportTarget = null;
  }, 2500);
}
```

---

## 5. Implementierungs-Reihenfolge

### Phase 1: Plattform-Grundlagen
1. [ ] `platforms.ts` - Definitionen aller 7 Plattformen
2. [ ] `Platform.svelte` - Hexagonale Basis rendern
3. [ ] `WorldLayout.svelte` refactoren - Plattformen statt einzelne Projekte
4. [ ] Nebel-System aktivieren (FogExp2)

### Phase 2: Lichtlinien-Transport
5. [ ] `LightBridge.svelte` - Basis-Linie rendern
6. [ ] `TransportNetwork.svelte` - Alle Verbindungen
7. [ ] Store: `currentPlatform`, `startTransport()`
8. [ ] Kamera-Animation entlang Linie

### Phase 3: Plattform-Inhalte
9. [ ] Projekt-Stände hexagonal auf Plattformen anordnen
10. [ ] S-Plattform: S1 (Link), S2_1 (Chat), S2_2/S2_3 (Deko)
11. [ ] `ChatModal.svelte` für ProjectChart KI

### Phase 4: Polish
12. [ ] Lichtlinien-Partikel während Transport
13. [ ] Perspektiven-Atmosphäre (Nebel-Farben)
14. [ ] Plattform-Glow-Effekte

---

## 6. Commands

```bash
pnpm dev           # http://localhost:5173
pnpm check         # TypeScript Prüfung
pnpm build         # Production Build
```

---

## 7. Referenz-Dokumente

| Datei | Beschreibung |
|-------|--------------|
| `docs/project.md` | Vision, Use Cases, Akzeptanzkriterien |
| `docs/architektur.md` | Plattform-Positionen, Nebel, Transport |
| `docs/components.md` | Komponenten-Konzepte mit Code |
| `docs/svelte-stores.md` | Store-Architektur |