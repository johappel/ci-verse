# Technische Architektur

## Stack
- **Framework:** SvelteKit (Svelte 5 Runes Mode)
- **3D Engine:** Threlte 8 (Three.js Wrapper)
- **Styling:** TailwindCSS 4 (für HUD/Overlays)
- **State:** Svelte 5 `$state` mit Klassen-basiertem Store

---

## Die Schwebende-Plattformen-Welt

### Plattform-Positionen

```typescript
// src/lib/logic/platforms.ts
export const platforms = {
  S:  { id: 'S',  name: 'Marktplatz',           y: 8,  x: 0,   z: 0,   size: 6,  color: '#e0e0e0' },
  B1: { id: 'B1', name: 'Frühkindliche Bildung', y: 8,  x: -20, z: 0,   size: 10, color: '#fcd34d' },
  B2: { id: 'B2', name: 'Schule & Jugend',       y: 8,  x: 0,   z: 15,  size: 10, color: '#fb923c' },
  B3: { id: 'B3', name: 'Erwachsenenbildung',    y: 8,  x: 20,  z: 0,   size: 10, color: '#f87171' },
  Q1: { id: 'Q1', name: 'Forschung',             y: 20, x: -15, z: -10, size: 12, color: '#a78bfa' },
  Q2: { id: 'Q2', name: 'Europa',                y: 25, x: 0,   z: -20, size: 12, color: '#fbbf24' },
  Q3: { id: 'Q3', name: 'Digitalisierung',       y: 20, x: 15,  z: -10, size: 12, color: '#22d3ee' },
};
```

### Lichtlinien-Verbindungen

```typescript
// src/lib/logic/platforms.ts
export const connections = [
  // S zu allen (Zentrum → Außen)
  { from: 'S', to: 'B1', color: '#fff8e0' },
  { from: 'S', to: 'B2', color: '#fff8e0' },
  { from: 'S', to: 'B3', color: '#fff8e0' },
  { from: 'S', to: 'Q1', color: '#60a5fa' },
  { from: 'S', to: 'Q2', color: '#60a5fa' },
  { from: 'S', to: 'Q3', color: '#60a5fa' },
  
  // B-Ring (Bildungsebene)
  { from: 'B1', to: 'B2', color: '#fbbf24' },
  { from: 'B2', to: 'B3', color: '#fbbf24' },
  { from: 'B3', to: 'B1', color: '#fbbf24' },
  
  // Q-Ring (Querschnittsebene)
  { from: 'Q1', to: 'Q2', color: '#a78bfa' },
  { from: 'Q2', to: 'Q3', color: '#a78bfa' },
  { from: 'Q3', to: 'Q1', color: '#a78bfa' },
];
```

### Nebel-Konfiguration

```typescript
// src/lib/logic/atmosphere.ts
export const fogConfig = {
  type: 'FogExp2',           // Exponentieller Nebel
  color: '#1a1a2e',          // Tiefes Blau-Schwarz
  density: 0.02,             // Dichte
};

// Perspektiven-Variationen
export const perspectiveFog = {
  neutral:       '#1a1a2e',   // Default
  digitality:    '#0a1628',   // Cyan-getönt
  sustainability:'#0a2818',   // Grün-getönt  
  justice:       '#28200a',   // Warm-Gold
};
```

---

## Layer-Trennung

### 1. Data Layer (`+page.server.ts`)
- Holt Daten via GraphQL beim Build/SSR
- Transformiert WP-Node-Struktur in flaches Array
- Ordnet Projekte den Plattformen zu (via `department` → Platform-ID)

### 2. State Layer (`store.svelte.ts`)
```typescript
interface WorldState {
  // Navigation
  currentPlatform: string;       // 'S', 'B1', 'Q2', etc.
  isTransporting: boolean;
  transportTarget: string | null;
  
  // Selektion
  selectedProjectId: string | null;
  hoveredId: string | null;
  
  // Atmosphäre
  activePerspective: 'neutral' | 'digitality' | 'sustainability' | 'justice';
  
  // Daten
  projects: Project[];
}
```

### 3. Visual Layer (Canvas/Threlte)
- `Scene.svelte` - Canvas, Kamera, Licht, Nebel
- `WorldLayout.svelte` - Rendert Plattformen + Transport-Netzwerk
- `Platform.svelte` - Einzelne Plattform mit Projekt-Ständen
- `LightBridge.svelte` - Klickbare Lichtlinie
- `ExhibitStand.svelte` - Einzelner Projekt-Stand

### 4. UI Layer (HTML über Canvas)
- `FilterBar.svelte` - Perspektiven-Buttons
- `ProjectCard.svelte` - Detail-Modal bei Projekt-Klick
- `ChatModal.svelte` - ProjectChart KI (S2_1)

---

## Kamera & Transport

### Kamera-Setup
```typescript
// In Scene.svelte
const cameraConfig = {
  position: [0, 15, 30],    // Initial über S-Plattform
  fov: 50,
  near: 0.1,
  far: 200,
};
```

### Transport-Animation
```typescript
// Wenn User Lichtlinie klickt
function startTransport(targetId: string) {
  // 1. State setzen
  state.isTransporting = true;
  state.transportTarget = targetId;
  
  // 2. Kamera-Animation (via Tween/Spring)
  // Start: aktuelle Kamera-Position
  // Ende: Position über Ziel-Plattform
  // Dauer: 2-3 Sekunden
  // Pfad: Entlang der Lichtlinie (Bezier-Kurve)
  
  // 3. Nach Animation
  setTimeout(() => {
    state.currentPlatform = targetId;
    state.isTransporting = false;
    state.transportTarget = null;
  }, 2500);
}
```

---

## Folder Structure

```text
src/
  lib/
    components/
      3d/                    # Threlte Komponenten
        Scene.svelte         # Canvas-Container, Kamera, Nebel
        WorldLayout.svelte   # Rendert alle Plattformen + Linien
        Platform.svelte      # Hexagonale Plattform-Basis
        ExhibitStand.svelte  # Projekt-Messestand
        LightBridge.svelte   # Einzelne Transport-Linie
        TransportNetwork.svelte # Alle Verbindungen
      ui/                    # HTML Overlays
        FilterBar.svelte     # Perspektiven-Filter
        ProjectCard.svelte   # Projekt-Detail-Modal
        ChatModal.svelte     # ProjectChart KI-Chat
    logic/
      store.svelte.ts        # WorldStore (Singleton)
      platforms.ts           # Plattform-Definitionen
      layout.ts              # Hexagonales Layout für Stände
    types/
      project.ts             # TypeScript Interfaces
    data/
      mockProjects.ts        # Test-Daten
  routes/
    +page.server.ts          # GraphQL Fetch
    +page.svelte             # Hauptansicht
```

---

## TypeScript Interfaces

```typescript
// src/lib/types/project.ts

interface Platform {
  id: string;
  name: string;
  y: number;
  x: number;
  z: number;
  size: number;
  color: string;
}

interface Connection {
  from: string;  // Platform-ID
  to: string;    // Platform-ID
  color: string;
}

interface Project {
  id: string;
  title: string;
  department: string;  // 'S1', 'B1', 'Q2', etc.
  teaser: string;
  externalUrl: string;
  imageUrl?: string;
  logoUrl?: string;
  perspectives: string[];
  isInteractive: boolean;  // false für S2_2, S2_3
}
```
