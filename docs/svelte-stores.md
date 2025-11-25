```typescript
// src/lib/logic/store.svelte.ts

type AppState = {
  projects: ProjectData[];
  activePerspective: 'default' | 'justice' | 'sustainability' | 'digitality' | 'structure';
  hoveredId: string | null;
  selectedId: string | null;
  activeQPlatform: string | null; // Wenn man auf Q1, Q2, Q3 klickt
};

export class WorldStore {
  // Globaler State
  state = $state<AppState>({
    projects: [],
    activePerspective: 'default',
    hoveredId: null,
    selectedId: null,
    activeQPlatform: null
  });

  // Derived: Visuelle Stimmung
  themeColor = $derived.by(() => {
    switch (this.state.activePerspective) {
      case 'digitality': return '#00ffff';
      case 'sustainability': return '#4ade80';
      case 'justice': return '#facc15';
      default: return '#ffffff';
    }
  });

  constructor(initialData: ProjectData[]) {
    this.state.projects = initialData;
  }

  setPerspective(p: AppState['activePerspective']) {
    this.state.activePerspective = p;
  }

  // Aktionen für Interaktion
  selectProject(id: string) {
    this.state.selectedId = id;
    // Hier könnte man Kamera-Logik triggern
  }
}

// Singleton exportieren oder via Context API bereitstellen
```
