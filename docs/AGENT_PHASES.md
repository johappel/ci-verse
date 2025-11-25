# Agent-Phasen: Detaillierte Implementierungsanweisungen

Dieses Dokument enthält präzise Anweisungen für jeden Implementierungsschritt. Jede Phase kann von einem AI-Agent autonom abgearbeitet werden.

---

## Phase A: Orbit-Layer (FloatingPlatform)

### Ziel
Q-Projekte (Q1, Q2, Q3) sollen als schwebende, leuchtende Kristalle/Satelliten über der Terra erscheinen, nicht als normale Messestände.

### Aufgaben

#### A1: FloatingPlatform.svelte erstellen
**Pfad:** `src/lib/components/3d/FloatingPlatform.svelte`

```svelte
<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { HTML } from "@threlte/extras";
  import type { ProjectData } from "$lib/types/project";
  import type { Vector3 } from "three";
  import { worldStore } from "$lib/logic/store.svelte";

  interface Props {
    project: ProjectData;
    position: Vector3;
  }

  let { project, position }: Props = $props();

  // Langsame Rotation
  let rotation = $state(0);
  useTask((delta) => {
    rotation += delta * 0.3;
  });

  // Zustände
  let isHovered = $derived(worldStore.state.hoveredId === project.id);
  let isActive = $derived(worldStore.state.activeQPlatform === project.departments[0]);

  // Farbe basierend auf Q-Department
  let platformColor = $derived.by(() => {
    switch (project.departments[0]) {
      case 'Q1': return '#a78bfa'; // Forschung = Violet
      case 'Q2': return '#fbbf24'; // Europa = Gold
      case 'Q3': return '#22d3ee'; // Digital = Cyan
      default: return '#ffffff';
    }
  });
</script>

<T.Group position={[position.x, position.y, position.z]}>
  <!-- Schwebender Kristall (Icosahedron) -->
  <T.Mesh
    rotation.y={rotation}
    onclick={() => worldStore.setQPlatform(project.departments[0])}
    onpointerenter={() => worldStore.setHovered(project.id)}
    onpointerleave={() => worldStore.setHovered(null)}
    scale={isHovered || isActive ? 1.2 : 1}
  >
    <T.IcosahedronGeometry args={[2, 0]} />
    <T.MeshStandardMaterial
      color={platformColor}
      emissive={platformColor}
      emissiveIntensity={isActive ? 1 : (isHovered ? 0.5 : 0.2)}
      transparent
      opacity={0.8}
      metalness={0.3}
      roughness={0.2}
    />
  </T.Mesh>

  <!-- Glow-Ring um den Kristall -->
  <T.Mesh rotation.x={Math.PI / 2}>
    <T.TorusGeometry args={[3, 0.1, 8, 32]} />
    <T.MeshBasicMaterial
      color={platformColor}
      transparent
      opacity={isActive ? 0.6 : 0.2}
    />
  </T.Mesh>

  <!-- Label -->
  {#if isHovered || isActive}
    <HTML transform position={[0, 4, 0]} center>
      <div class="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md whitespace-nowrap border border-white/20">
        {project.title}
      </div>
    </HTML>
  {/if}
</T.Group>
```

#### A2: WorldLayout.svelte anpassen
**Pfad:** `src/lib/components/3d/WorldLayout.svelte`

Unterscheide zwischen Terra-Projekten (ExhibitStand) und Orbit-Projekten (FloatingPlatform):

```svelte
<script lang="ts">
  import { worldStore } from "$lib/logic/store.svelte";
  import { calculateHexLayout } from "$lib/logic/layout";
  import ExhibitStand from "./ExhibitStand.svelte";
  import FloatingPlatform from "./FloatingPlatform.svelte";

  let positions = $derived(calculateHexLayout(worldStore.state.projects));

  // Trenne Terra und Orbit Projekte
  let terraProjects = $derived(
    worldStore.state.projects.filter(p => p.type === 'ground')
  );
  let orbitProjects = $derived(
    worldStore.state.projects.filter(p => p.type === 'orbit')
  );
</script>

<!-- Terra Layer: Messestände -->
{#each terraProjects as project (project.id)}
  {@const position = positions.get(project.id)}
  {#if position}
    <ExhibitStand {project} {position} />
  {/if}
{/each}

<!-- Orbit Layer: Schwebende Plattformen -->
{#each orbitProjects as project (project.id)}
  {@const position = positions.get(project.id)}
  {#if position}
    <FloatingPlatform {project} {position} />
  {/if}
{/each}
```

### Verifikation Phase A
- [ ] Q-Projekte erscheinen als rotierende Kristalle
- [ ] Kristalle schweben über der Terra (Y > 10)
- [ ] Hover zeigt Glow + Label
- [ ] Klick setzt `activeQPlatform` im Store

---

## Phase B: DataStreams (Verbindungslinien)

### Ziel
Wenn ein Q-Satellit aktiviert wird, erscheinen leuchtende Bezier-Kurven zu allen Terra-Projekten, die mit diesem Q-Department verbunden sind.

### Aufgaben

#### B1: DataStream.svelte erstellen
**Pfad:** `src/lib/components/3d/DataStream.svelte`

```svelte
<script lang="ts">
  import { T } from "@threlte/core";
  import { QuadraticBezierLine } from "@threlte/extras";
  import type { Vector3 } from "three";

  interface Props {
    start: Vector3;
    end: Vector3;
    color?: string;
    active?: boolean;
  }

  let { start, end, color = '#00ffff', active = true }: Props = $props();

  // Mittelpunkt für die Kurve (nach oben gewölbt)
  let midPoint = $derived.by(() => ({
    x: (start.x + end.x) / 2,
    y: Math.max(start.y, end.y) + 5,
    z: (start.z + end.z) / 2
  }));
</script>

{#if active}
  <QuadraticBezierLine
    start={[start.x, start.y, start.z]}
    end={[end.x, end.y + 5, end.z]}
    mid={[midPoint.x, midPoint.y, midPoint.z]}
    {color}
    lineWidth={2}
    dashed
    dashScale={5}
    dashSize={0.5}
    gapSize={0.3}
  />
{/if}
```

#### B2: WorldLayout um DataStreams erweitern

```svelte
<!-- Nach den FloatingPlatforms einfügen -->

<!-- DataStreams: Verbindungen von aktiver Q-Platform zu Terra -->
{#if worldStore.state.activeQPlatform}
  {@const activeQ = orbitProjects.find(p => p.departments.includes(worldStore.state.activeQPlatform!))}
  {@const qPosition = activeQ ? positions.get(activeQ.id) : null}
  
  {#if qPosition}
    {#each terraProjects as terraProject (terraProject.id)}
      {#if terraProject.departments.includes(worldStore.state.activeQPlatform!)}
        {@const terraPosition = positions.get(terraProject.id)}
        {#if terraPosition}
          <DataStream
            start={qPosition}
            end={terraPosition}
            color={worldStore.themeColor}
          />
        {/if}
      {/if}
    {/each}
  {/if}
{/if}
```

#### B3: Store-Logik für Q-Toggle

In `store.svelte.ts` die `setQPlatform` Methode so anpassen, dass erneuter Klick deaktiviert:

```typescript
setQPlatform(department: Department | null) {
  // Toggle: Wenn gleiche Platform, deaktivieren
  if (this.state.activeQPlatform === department) {
    this.state.activeQPlatform = null;
  } else {
    this.state.activeQPlatform = department;
    this.state.selectedId = null; // Schließe Modal
  }
}
```

### Verifikation Phase B
- [ ] Klick auf Q-Kristall zeigt Linien zu verbundenen Terra-Projekten
- [ ] Linien sind gestrichelt und in Theme-Farbe
- [ ] Erneuter Klick auf gleichen Kristall blendet Linien aus
- [ ] Nicht verbundene Terra-Projekte bleiben ohne Linie

---

## Phase C: Atmosphären-Verfeinerung

### Ziel
Perspektiven-Wechsel soll nicht nur Nebel ändern, sondern die gesamte Atmosphäre transformieren (Materials, Licht-Intensität, optional Post-Processing).

### Aufgaben

#### C1: ExhibitStand Material-Reaktivität

In `ExhibitStand.svelte` die Materials auf Perspektive reagieren lassen:

```svelte
<script lang="ts">
  // ... bestehender Code ...

  // Material-Farbe basierend auf Perspektive
  let materialTint = $derived.by(() => {
    if (isDimmed) return '#666666';
    
    switch (worldStore.state.activePerspective) {
      case 'digitality':
        return project.perspectives.includes('digitality') 
          ? '#00ffff' : project.color;
      case 'sustainability':
        return project.perspectives.includes('sustainability')
          ? '#22c55e' : project.color;
      case 'justice':
        return project.perspectives.includes('justice')
          ? '#facc15' : project.color;
      default:
        return project.color;
    }
  });
</script>

<!-- Material mit Tint -->
<T.MeshStandardMaterial
  color={materialTint}
  emissive={materialTint}
  emissiveIntensity={isDimmed ? 0 : $emissiveIntensity}
  transparent
  opacity={isDimmed ? 0.2 : 1}
/>
```

#### C2: Scene.svelte Licht-Anpassung

```svelte
<script lang="ts">
  // ... bestehender Code ...

  // Licht-Intensitäten basierend auf Perspektive
  let ambientIntensity = $derived(
    worldStore.state.activePerspective === 'digitality' ? 0.2 :
    worldStore.state.activePerspective === 'sustainability' ? 0.8 :
    0.5
  );

  let directionalIntensity = $derived(
    worldStore.state.activePerspective === 'digitality' ? 0.4 : 0.8
  );
</script>

<T.AmbientLight intensity={ambientIntensity} />
<T.DirectionalLight
  position={[10, 20, 10]}
  intensity={directionalIntensity}
  castShadow
/>
```

#### C3: Optional - Bloom für Digitalität

Falls `@threlte/extras` EffectComposer unterstützt:

```svelte
{#if worldStore.state.activePerspective === 'digitality'}
  <EffectComposer>
    <Bloom
      intensity={0.8}
      luminanceThreshold={0.4}
      luminanceSmoothing={0.9}
    />
  </EffectComposer>
{/if}
```

### Verifikation Phase C
- [ ] Digitalität: Dunkle Umgebung, Cyan-Töne, evtl. Bloom
- [ ] Nachhaltigkeit: Helle, grüne Töne
- [ ] Gerechtigkeit: Warme, gelbe Töne
- [ ] Relevante Projekte leuchten, andere sind gedimmt

---

## Phase D: Erweiterte Mock-Daten

### Ziel
Mindestens 10 Projekte mit realistischer Verteilung über alle Departments.

### Aufgaben

#### D1: mockProjects.ts erweitern

```typescript
export const mockProjects: ProjectData[] = [
  // B1 - Frühkindliche Bildung (Ring 1)
  {
    id: 'p1',
    title: 'Religionspädagogik in der Kita',
    slug: 'rpi-kita',
    departments: ['B1'],
    perspectives: ['justice', 'sustainability'],
    targetGroups: ['0-3', '4-6'],
    type: 'ground',
    // ...
  },
  {
    id: 'p2',
    title: 'Inklusive Frühförderung',
    slug: 'inklusive-fruehfoerderung',
    departments: ['B1'],
    perspectives: ['justice'],
    targetGroups: ['0-3', '4-6'],
    type: 'ground',
    // ...
  },

  // B2 - Schule & Jugend (Ring 2)
  {
    id: 'p3',
    title: 'Konfirmandenarbeit Digital',
    slug: 'konfi-digital',
    departments: ['B2', 'Q3'],
    perspectives: ['digitality'],
    targetGroups: ['12-18'],
    type: 'ground',
    // ...
  },
  {
    id: 'p4',
    title: 'Schulseelsorge Netzwerk',
    slug: 'schulseelsorge',
    departments: ['B2'],
    perspectives: ['justice', 'structure'],
    targetGroups: ['12-18', 'employees'],
    type: 'ground',
    // ...
  },

  // B3 - Erwachsenenbildung (Ring 3)
  {
    id: 'p5',
    title: 'Digitales Gemeindemanagement',
    slug: 'digi-gemeinde',
    departments: ['B3', 'Q3'],
    perspectives: ['digitality', 'structure'],
    targetGroups: ['adults', 'employees'],
    type: 'ground',
    // ...
  },
  {
    id: 'p6',
    title: 'Seniorenbildung Online',
    slug: 'senioren-online',
    departments: ['B3'],
    perspectives: ['digitality', 'justice'],
    targetGroups: ['seniors'],
    type: 'ground',
    // ...
  },

  // Q1 - Forschung (Orbit)
  {
    id: 'p7',
    title: 'Forschungsstelle Bildungsbericht',
    slug: 'bildungsbericht',
    departments: ['Q1'],
    perspectives: ['structure'],
    targetGroups: [],
    type: 'orbit',
    // ...
  },

  // Q2 - Europa (Orbit)
  {
    id: 'p8',
    title: 'Europäisches Bildungsnetzwerk',
    slug: 'eu-bildung',
    departments: ['Q2'],
    perspectives: ['justice', 'sustainability'],
    targetGroups: [],
    type: 'orbit',
    // ...
  },

  // Q3 - Digitalisierung (Orbit)
  {
    id: 'p9',
    title: 'Digitalisierungsstrategie',
    slug: 'digi-strategie',
    departments: ['Q3'],
    perspectives: ['digitality'],
    targetGroups: [],
    type: 'orbit',
    // ...
  },

  // S1 - Verwaltung (Zentrum)
  {
    id: 'p10',
    title: 'Institutsleitung',
    slug: 'leitung',
    departments: ['S1'],
    perspectives: ['structure'],
    targetGroups: ['employees'],
    type: 'ground',
    // ...
  }
];
```

### Verifikation Phase D
- [ ] Mindestens 10 Projekte in mockProjects.ts
- [ ] Alle Departments (B1, B2, B3, Q1, Q2, Q3, S1) haben min. 1 Projekt
- [ ] Projekte sind über verschiedene Perspektiven verteilt
- [ ] Layout zeigt konzentrische Ringe korrekt an

---

## Phase E: UI Polish & Deep-Linking

### Ziel
ProjectCard verbessern, URL-Parameter für direktes Verlinken zu Projekten/Perspektiven.

### Aufgaben

#### E1: ProjectCard mit Staff-Details

Erweitere die ProjectCard um echte Mitarbeiter-Daten aus mockStaff.

#### E2: URL Deep-Linking

In `+page.svelte` bereits vorhanden, aber sicherstellen:
- `/?project=rpi-kita` öffnet Modal direkt
- `/?view=digitality` aktiviert Perspektive
- `/?q=Q3` aktiviert Q-Platform

#### E3: FilterBar erweitern

Buttons für Q-Platforms (Forschung, Europa, Digital) hinzufügen.

### Verifikation Phase E
- [ ] ProjectCard zeigt Mitarbeiter-Avatare
- [ ] URL-Parameter funktionieren
- [ ] FilterBar hat separate Q-Buttons

---

## Phasen-Zusammenfassung

| Phase | Fokus | Geschätzte Zeit |
|-------|-------|-----------------|
| A | FloatingPlatform (Orbit) | 1-2h |
| B | DataStreams | 1h |
| C | Atmosphären-Polish | 1h |
| D | Mock-Daten erweitern | 30min |
| E | UI Polish | 1-2h |

**Empfohlene Reihenfolge:** A → B → D → C → E
