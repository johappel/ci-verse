# Komponenten-Dokumentation

## 3D-Komponenten (`src/lib/components/3d/`)

---

### Platform.svelte
Generische schwebende Plattform mit hexagonaler Basis.

```svelte
<script>
  import { T } from '@threlte/core';
  import { HTML } from '@threlte/extras';
  import ExhibitStand from './ExhibitStand.svelte';
  import { getHexLayout } from '$lib/logic/layout';
  
  let { platform, projects } = $props();
  // platform: { id, name, position: [x,y,z], size, color }
  // projects: Project[] die zu dieser Plattform gehören
  
  // Hexagonales Layout für Projekt-Stände
  let standPositions = $derived(getHexLayout(projects.length, platform.size * 0.7));
</script>

<T.Group position={[platform.x, platform.y, platform.z]}>
  <!-- Hexagonale Basis (6-seitiger Zylinder) -->
  <T.Mesh rotation.x={-Math.PI / 2}>
    <T.CylinderGeometry args={[platform.size, platform.size, 0.5, 6]} />
    <T.MeshStandardMaterial 
      color={platform.color} 
      metalness={0.3}
      roughness={0.7}
    />
  </T.Mesh>
  
  <!-- Plattform-Name (schwebt über der Plattform) -->
  <HTML position={[0, 2, 0]} center>
    <div class="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
      {platform.name}
    </div>
  </HTML>
  
  <!-- Projekt-Stände auf der Plattform -->
  {#each projects as project, i}
    <ExhibitStand 
      {project} 
      position={[standPositions[i].x, 0.5, standPositions[i].z]} 
    />
  {/each}
</T.Group>
```

---

### LightBridge.svelte
Klickbare Lichtlinie zwischen zwei Plattformen für Transport.

```svelte
<script>
  import { T } from '@threlte/core';
  import { Line2, HTML } from '@threlte/extras';
  import { worldStore } from '$lib/logic/store.svelte';
  import { Spring } from 'svelte/motion';
  
  let { from, to, color } = $props();
  // from: Platform-Objekt mit position
  // to: Platform-Objekt mit position
  // color: Linien-Farbe
  
  let isHovered = $state(false);
  
  // Punkte für die Linie
  let points = $derived([
    [from.x, from.y + 1, from.z],
    [to.x, to.y + 1, to.z]
  ]);
  
  // Mittelpunkt für Label
  let midpoint = $derived([
    (from.x + to.x) / 2,
    (from.y + to.y) / 2 + 1,
    (from.z + to.z) / 2
  ]);
  
  // Animation für Liniendicke
  let lineWidth = new Spring(2);
  $effect(() => { lineWidth.target = isHovered ? 5 : 2; });
  
  function handleClick() {
    worldStore.startTransport(to.id);
  }
</script>

<Line2
  {points}
  color={isHovered ? '#ffffff' : color}
  lineWidth={lineWidth.current}
  onclick={handleClick}
  onpointerenter={() => isHovered = true}
  onpointerleave={() => isHovered = false}
/>

<!-- Ziel-Label bei Hover -->
{#if isHovered}
  <HTML position={midpoint} center>
    <div class="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg
                border border-white/20 animate-pulse">
      → {to.name}
    </div>
  </HTML>
{/if}

<!-- Pulsierender Punkt am Ziel -->
{#if isHovered}
  <T.Mesh position={[to.x, to.y + 2, to.z]}>
    <T.SphereGeometry args={[0.3, 16, 16]} />
    <T.MeshBasicMaterial color="#ffffff" />
  </T.Mesh>
{/if}
```

---

### TransportNetwork.svelte
Verwaltet und rendert alle Lichtlinien-Verbindungen.

```svelte
<script>
  import LightBridge from './LightBridge.svelte';
  import { platforms, connections } from '$lib/logic/platforms';
  import { worldStore } from '$lib/logic/store.svelte';
  
  // Nur Verbindungen von/zu aktueller Plattform zeigen
  let visibleConnections = $derived(
    connections.filter(c => 
      c.from === worldStore.state.currentPlatform || 
      c.to === worldStore.state.currentPlatform
    )
  );
</script>

{#each visibleConnections as conn}
  <LightBridge 
    from={platforms[conn.from]} 
    to={platforms[conn.to]} 
    color={conn.color}
  />
{/each}
```

---

### ExhibitStand.svelte
Einzelner Projekt-Messestand auf einer Plattform.

```svelte
<script>
  import { T } from '@threlte/core';
  import { HTML } from '@threlte/extras';
  import { worldStore } from '$lib/logic/store.svelte';
  import { Spring } from 'svelte/motion';
  
  let { project, position = [0, 0, 0] } = $props();
  
  let isHovered = $state(false);
  let scale = new Spring(1);
  
  $effect(() => { scale.target = isHovered ? 1.1 : 1; });
  
  // Dimmen wenn Perspektive aktiv und Projekt nicht relevant
  let isDimmed = $derived(
    worldStore.state.activePerspective !== 'neutral' &&
    !project.perspectives?.includes(worldStore.state.activePerspective)
  );
  
  function handleClick() {
    if (project.isInteractive !== false) {
      worldStore.selectProject(project.id);
    }
  }
</script>

<T.Group {position} scale={scale.current}>
  <!-- Stand-Basis -->
  <T.Mesh 
    onclick={handleClick}
    onpointerenter={() => isHovered = true}
    onpointerleave={() => isHovered = false}
  >
    <T.BoxGeometry args={[1.5, 0.3, 1.5]} />
    <T.MeshStandardMaterial 
      color={project.color || '#4a5568'} 
      transparent
      opacity={isDimmed ? 0.3 : 1}
    />
  </T.Mesh>
  
  <!-- Stand-Rückwand -->
  <T.Mesh position={[0, 1, -0.7]}>
    <T.BoxGeometry args={[1.5, 2, 0.1]} />
    <T.MeshStandardMaterial 
      color={project.color || '#4a5568'}
      transparent
      opacity={isDimmed ? 0.3 : 1}
    />
  </T.Mesh>
  
  <!-- Label bei Hover -->
  {#if isHovered && project.isInteractive !== false}
    <HTML position={[0, 2.5, 0]} center>
      <div class="bg-white/90 text-slate-800 px-3 py-2 rounded-lg shadow-lg 
                  text-sm max-w-[200px] text-center">
        <p class="font-semibold">{project.title}</p>
        <p class="text-xs text-slate-500 mt-1">Klicken für Details</p>
      </div>
    </HTML>
  {/if}
</T.Group>
```

---

### ExhibitBooth.svelte
Freistehender Messestand für Projekte mit `displayType: 'booth'` oder `'both'`.

```svelte
<script>
  import { T } from '@threlte/core';
  import { Text, Billboard } from '@threlte/extras';
  
  let { 
    project,           // ProjectData
    position,          // [x, y, z] relativ zur Plattform
    rotation = 0,      // Ausrichtung (Radians)
    size = 'medium',   // 'small' | 'medium' | 'large'
    platformPosition   // [x, y, z] für absolute Positionierung
  } = $props();
</script>
```

**Positionierung:** Booths werden im Halbkreis **vorne** auf der Plattform angeordnet (gegenüber der MesseWall).

---

### MesseWall.svelte
Poster-Wand für Projekte mit `displayType: 'wall'` oder `'both'`.

```svelte
<script>
  import { T } from '@threlte/core';
  import { Text, useTexture } from '@threlte/extras';
  
  let { 
    posters,           // Array<{ project, position }>
    platformSize,      // Für Wand-Positionierung
    platformColor,     // Wand-Akzentfarbe
    wallHeight = 10,
    wallCount = 3,     // Anzahl Wände (1-3)
    startEdge = 3,     // Startkante (Hexagon-Seite)
    platformPosition,
    platformId
  } = $props();
</script>
```

**Positionierung:** Wände werden an **Kanten 3-5** des Hexagons platziert (hinten).

---

### Signpost.svelte
Wegweiser für verwandte Projekte (zeigt auf andere Plattformen).

```svelte
<script>
  import { T } from '@threlte/core';
  import { Text, Billboard } from '@threlte/extras';
  
  let { 
    relatedProjects,   // ProjectData[] - Projekte mit relatedDepartments
    position,          // [x, y, z]
    platformId,        // Aktuelle Plattform-ID
    compact = false    // true = horizontal, false = vertikale Tafel
  } = $props();
</script>
```

**Zwei Darstellungsmodi:**

#### Compact Mode (`compact={true}`)
Horizontale Anordnung unter dem Plattform-Namensschild:

```
    [Plattformschild: "Erwachsene"]
              ↓
    🔗 Siehe auch:
    ┌──────────┐ ┌──────────┐
    │Konfi-App │ │Projekt 2 │
    │→ Schule  │ │→ Digital │
    └──────────┘ └──────────┘
```

- Position: Y=9.5 (direkt unter Schild bei Y=12)
- Buttons mit farbigem Rand (Projekt-Farbe)
- Hover: Button leuchtet auf
- Klick: Navigation zur Heimat-Plattform

#### Standard Mode (`compact={false}`)
Freistehende Holztafel mit Pfosten:

```
    ┌─────────────────────┐
    │ 🔗 Siehe auch...    │
    ├─────────────────────┤
    │ ● Konfi-App         │
    │   → Schule & Digital│
    └─────────────────────┘
           ║
           ║ Holzpfosten
           ║
    ═══════╩═══════
```

**Verwendung in Platform.svelte:**
```svelte
{#if relatedProjects.length > 0 && platform.id !== 'S'}
    <Signpost
        {relatedProjects}
        position={[0, 9.5, 0]}
        platformId={platform.id}
        compact={true}
    />
{/if}
```

**Datenquelle:**
```typescript
// Helper-Funktion in mockProjects.ts
export function getRelatedProjectsForPlatform(platformId: string): ProjectData[] {
    return mockProjects.filter(p => 
        p.relatedDepartments?.includes(platformId as Department)
    );
}
```

---

### Scene.svelte
Canvas-Container mit Kamera, Licht und Nebel.

```svelte
<script>
  import { Canvas } from '@threlte/core';
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import WorldLayout from './WorldLayout.svelte';
  import { worldStore } from '$lib/logic/store.svelte';
  import { Spring } from 'svelte/motion';
  
  // Nebel-Farbe basierend auf Perspektive
  const fogColors = {
    neutral: '#1a1a2e',
    digitality: '#0a1628',
    sustainability: '#0a2818',
    justice: '#28200a',
  };
  
  let fogColor = new Spring('#1a1a2e');
  $effect(() => {
    fogColor.target = fogColors[worldStore.state.activePerspective] || '#1a1a2e';
  });
</script>

<div class="fixed inset-0 w-screen h-screen">
  <Canvas>
    <!-- Kamera -->
    <T.PerspectiveCamera 
      makeDefault 
      position={[0, 15, 35]} 
      fov={50}
      near={0.1}
      far={200}
    />
    <OrbitControls 
      enableDamping 
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={10}
      maxDistance={80}
    />
    
    <!-- Hintergrund & Nebel -->
    <T.Color attach="background" args={[fogColor.current]} />
    <T.FogExp2 attach="fog" args={[fogColor.current, 0.02]} />
    
    <!-- Beleuchtung -->
    <T.AmbientLight intensity={0.4} />
    <T.DirectionalLight position={[10, 20, 10]} intensity={1} castShadow />
    <T.DirectionalLight position={[-10, 15, -10]} intensity={0.5} />
    
    <!-- Die Welt -->
    <WorldLayout />
  </Canvas>
</div>
```

---

## UI-Komponenten (`src/lib/components/ui/`)

---

### ProjectCard.svelte
Modal für Projekt-Details (erscheint bei Klick auf Stand).

```svelte
<script>
  import { worldStore } from '$lib/logic/store.svelte';
  import { fade, fly } from 'svelte/transition';
  
  let project = $derived(
    worldStore.state.selectedProjectId
      ? worldStore.state.projects.find(p => p.id === worldStore.state.selectedProjectId)
      : null
  );

  function close() {
    worldStore.selectProject(null);
  }
</script>

{#if project}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
    onclick={close}
    transition:fade
  ></div>

  <!-- Card -->
  <article 
    class="fixed inset-0 m-auto w-[90%] max-w-xl h-fit max-h-[80vh] 
           bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
    transition:fly={{ y: 50, duration: 300 }}
  >
    <!-- Header mit Bild -->
    <div class="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative">
      {#if project.imageUrl}
        <img src={project.imageUrl} alt="" class="w-full h-full object-cover" />
      {/if}
      <button 
        onclick={close}
        class="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full
               flex items-center justify-center hover:bg-black/70"
      >
        ✕
      </button>
    </div>
    
    <!-- Content -->
    <div class="p-6">
      <span class="text-xs font-bold uppercase tracking-wider text-blue-600">
        {project.department}
      </span>
      <h2 class="text-2xl font-bold mt-1 mb-3">{project.title}</h2>
      <p class="text-slate-600 leading-relaxed">{project.teaser}</p>
      
      <!-- Action -->
      {#if project.externalUrl}
        <a 
          href={project.externalUrl}
          target="_blank"
          rel="noopener"
          class="mt-6 block w-full text-center py-3 bg-blue-600 text-white 
                 font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Zur Website →
        </a>
      {/if}
    </div>
  </article>
{/if}
```

---

### FilterBar.svelte
Perspektiven-Filter am unteren Rand.

```svelte
<script>
  import { worldStore } from '$lib/logic/store.svelte';
  
  const perspectives = [
    { id: 'neutral', label: 'Alle', color: 'bg-slate-600' },
    { id: 'digitality', label: 'Digitalität', color: 'bg-cyan-600' },
    { id: 'sustainability', label: 'Nachhaltigkeit', color: 'bg-green-600' },
    { id: 'justice', label: 'Gerechtigkeit', color: 'bg-amber-600' },
  ];
</script>

<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30
            bg-black/60 backdrop-blur-md rounded-full px-2 py-2
            flex gap-2">
  {#each perspectives as p}
    <button
      onclick={() => worldStore.setPerspective(p.id)}
      class="px-4 py-2 rounded-full text-sm font-medium transition-all
             {worldStore.state.activePerspective === p.id 
               ? `${p.color} text-white shadow-lg` 
               : 'text-white/70 hover:text-white hover:bg-white/10'}"
    >
      {p.label}
    </button>
  {/each}
</div>
```

---

### ChatModal.svelte
ProjectChart KI-Chat für S2_1.

```svelte
<script>
  import { worldStore } from '$lib/logic/store.svelte';
  import { fade, fly } from 'svelte/transition';
  
  let isOpen = $state(false);
  let messages = $state([
    { role: 'assistant', content: 'Hallo! Ich bin ProjectChart. Wie kann ich dir bei der Suche nach Projekten helfen?' }
  ]);
  let input = $state('');
  
  function sendMessage() {
    if (!input.trim()) return;
    
    messages.push({ role: 'user', content: input });
    // TODO: KI-Integration
    messages.push({ role: 'assistant', content: 'Diese Funktion wird bald verfügbar sein!' });
    input = '';
  }
  
  export function open() {
    isOpen = true;
  }
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black/50 z-40"
    onclick={() => isOpen = false}
    transition:fade
  ></div>
  
  <div 
    class="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-50
           flex flex-col overflow-hidden"
    transition:fly={{ y: 100 }}
  >
    <!-- Header -->
    <div class="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h3 class="font-semibold">ProjectChart Auskunft</h3>
      <button onclick={() => isOpen = false}>✕</button>
    </div>
    
    <!-- Messages -->
    <div class="flex-1 p-4 overflow-y-auto space-y-3">
      {#each messages as msg}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] px-4 py-2 rounded-2xl
                      {msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-800'}">
            {msg.content}
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Input -->
    <div class="p-4 border-t">
      <div class="flex gap-2">
        <input 
          bind:value={input}
          onkeydown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Frag mich etwas..."
          class="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onclick={sendMessage}
          class="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          →
        </button>
      </div>
    </div>
  </div>
{/if}
```

---

## Energie-Komponenten (NEU in v2.0)

Diese Komponenten visualisieren die Leitlinien als fließende Energie.

---

### EnergyFloor.svelte
Animierter Boden-Shader mit 6 Energieströmen von den Leitlinien-Postern zur Mitte.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `size` | number | 8 | Größe des Boden-Bereichs |
| `activePerspective` | string | 'neutral' | Aktive Leitperspektive |
| `isOnS` | boolean | false | Ob auf S-Plattform |
| `isTransporting` | boolean | false | Ob Transport aktiv |

**Shader-Features:**
- GLSL Fragment Shader mit `AdditiveBlending`
- 6 farbige Ströme (2 pro Leitlinie da 6 Poster-Positionen)
- Inward-Flow Animation mit Partikeln
- Puls-Effekte die zur Mitte laufen
- Perspektiven-Highlight wenn aktiviert

**Farben nach Leitlinie:**
```typescript
const streamColors = {
  justice: '#fbbf24',      // Gold
  sustainability: '#22c55e', // Grün
  digitality: '#06b6d4',   // Cyan
  structure: '#a855f7',    // Violett
};
```

---

### EnergyBeam.svelte
Vertikale Energie-Säule vom Boden zum Oktaeder.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `height` | number | 5 | Höhe der Säule |
| `isOnS` | boolean | false | Sichtbar nur auf S |
| `isTransporting` | boolean | false | Transport aktiv |

**Features:**
- Aufsteigende Partikel-Animation
- Farbrotation durch alle 4 Leitlinien-Farben
- AdditiveBlending für Glow-Effekt
- Intensität erhöht während Transport

**Shader-Auszug:**
```glsl
// Aufsteigende Partikel
float particles = smoothstep(0.0, 0.02, 
  sin(vUv.y * 30.0 - time * 3.0) * 
  sin(vUv.x * 20.0)
);

// Farbrotation
float colorPhase = time * 0.3;
vec3 color = mix(justice, sustainability, step(0.25, fract(colorPhase)));
// ... weitere Farb-Übergänge
```

---

### Pulsierender Oktaeder (in MarketplacePlatform.svelte)
Der zentrale Oktaeder empfängt die Energie und visualisiert sie.

**Animationen:**
```typescript
// In MarketplacePlatform.svelte
let animTime = $state(0);
let energyPulse = $derived(Math.sin(animTime * 2) * 0.5 + 0.5);
let oktaederScale = $derived(1.0 + energyPulse * 0.1);
let oktaederEmissive = $derived(1.5 + energyPulse * 2.0);
```

**Effekt-Layer:**
1. **Outer Glow** - Pulsierender Halo (Icosahedron)
2. **Middle Glow** - Mittlerer Glow (Sphere)
3. **Inner Core** - Heller Kern (Oktaeder)
4. **Ring Effect** - Horizontaler Ring (Torus)

**Material:**
```svelte
<T.MeshStandardMaterial
  color="#ffffff"
  emissive="#fbbf24"
  emissiveIntensity={oktaederEmissive}
  metalness={0.5}
  roughness={0.2}
/>
```

---

## Partner-Vernetzung (NEU in v2.1)

Diese Komponenten visualisieren die Vernetzung des Instituts mit Bildungspartnern.

---

### DepartureBoard.svelte
Abfahrtstafel im Bahnhofs-Stil für Partner-Verbindungen.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `partners` | PartnerConnection[] | required | Liste der Partner |
| `position` | [x, y, z] | [0, 0, 0] | Position im 3D-Raum |
| `rotation` | [x, y, z] | [0, 0, 0] | Rotation |

**PartnerConnection Interface:**
```typescript
interface PartnerConnection {
    id: string;
    name: string;
    category: 'ministry' | 'church' | 'university' | 'institute' | 'international' | 'association';
    url: string;
    description?: string;
    logo?: string;
    departureTime?: string;
    platform?: string;
}
```

**Kategorie-Farben:**
```typescript
const categoryColors = {
    ministry: '#3b82f6',     // Blau
    church: '#a855f7',       // Violett
    university: '#22c55e',   // Grün
    institute: '#06b6d4',    // Cyan
    international: '#f59e0b', // Amber
    association: '#ec4899',   // Pink
};
```

**Features:**
- Flip-Board Animation für Texte
- Kategorie-Badge mit Icon
- Klick öffnet PartnerDialog (nicht direkt externen Link)
- LED-Anzeige-Stil

---

### ShuttleTrain.svelte
Animierter Zug mit Partner-Branding für visuelles Feedback.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `partner` | PartnerConnection | null | Aktueller Partner |
| `position` | [x, y, z] | [0, 0, 0] | Start-Position |
| `isArriving` | boolean | false | Einfahrt-Animation |
| `isDeparting` | boolean | false | Ausfahrt-Animation |

**Features:**
- Smooth Ein-/Ausfahrt-Animation
- Partner-Logo auf Zug-Seite
- Partner-Farbe basierend auf Kategorie
- Sound-Ready (Audio später hinzufügen)

**Animation-Phasen:**
1. **Idle** - Zug außerhalb sichtbar
2. **Arriving** - Zug fährt ein (2s)
3. **Stopped** - Zug steht am Bahnsteig
4. **Departing** - Zug fährt aus (2s)

---

### MarketplaceStand.svelte
Dynamische Terminal-Stände für Events und Publikationen.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `standType` | 'institution' \| 'publications' \| 'events' | required | Art des Terminals |
| `position` | [x, y, z] | [0, 0, 0] | Position |
| `rotation` | number | 0 | Y-Rotation |

**Features für publications/events:**
- **Auto-Rotation** - Wechselt Inhalt alle 8-15 Sekunden
- **Pagination Dots** - Zeigt aktuellen Index
- **Display Board** - Schlanke Säule mit Anzeige-Tafel
- **"Alle anzeigen →"** Button öffnet RssFeedPanel/EventsPanel

**Stand-Typen:**
| Typ | Farbe | Icon | Aktion |
|-----|-------|------|--------|
| `institution` | Blau | 🏛️ | Chat öffnen |
| `publications` | Grün | 📰 | RssFeedPanel |
| `events` | Rot | 📅 | EventsPanel |

**Event-Card Design:**
```
┌──────────────────────┐
│ 🟥 NÄCHSTER TERMIN ● │
├──────────────────────┤
│ ┌────┐               │
│ │ 10 │ Event-Titel   │
│ │DEZ │ 🕐 14:00      │
│ └────┘ 📍 Ort        │
├──────────────────────┤
│ ● ○ ○   Alle anzeigen│
└──────────────────────┘
```

---

### Signpost.svelte
Wegweiser für verwandte Projekte auf anderen Plattformen.

**Props:**
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `relatedProjects` | ProjectData[] | required | Projekte mit relatedDepartments |
| `position` | [x, y, z] | [0, 0, 0] | Position |
| `platformId` | string | required | ID der aktuellen Plattform |
| `compact` | boolean | false | Kompakt unter Schild |

**Features:**
- Zeigt Projekte die `relatedDepartments` zur aktuellen Plattform haben
- Klick navigiert zur Heimat-Plattform des Projekts
- Kompakt-Modus: Horizontal unter Plattform-Schild
- Standard-Modus: Vertikale Holztafel

**Beispiel-Konfiguration:**
```typescript
// Konfi-App ist auf B2 + Q3, zeigt Wegweiser auf B3
{
    id: 'p5',
    title: 'Konfi-App',
    departments: ['B2', 'Q3'],
    relatedDepartments: ['B3'],  // ← Wegweiser auf B3
}
```

