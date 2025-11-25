# Comenius Orbital - Implementation Plan

**Interaktive 3D-Visualisierung der Comenius-Institut Bildungslandschaft**

---

## Überblick

Wir bauen eine explorative 3D-Welt im Browser mit **Ausstellungsständen** (wie auf Messen üblich), die externe Websites der Comenius-Projekte repräsentieren. Die 3D-Szene basiert auf Threlte (Three.js) und ist vollständig mit Svelte 5 Runes reaktiv.

---

## Proposed Changes

### **Core Infrastructure**

#### [NEW] [package.json](file:///f:/code/svelte/ci-verse/package.json)
Füge Dependencies hinzu:
- **Threlte**: `@threlte/core@^8.0.0`, `@threlte/extras@^9.0.0`
- **Three.js**: `three@^0.172.0`, `@types/three`
- **TailwindCSS**: `tailwindcss`, `autoprefixer`, `postcss`
- **Utils**: `clsx`, `tailwind-merge`

#### [NEW] [tailwind.config.ts](file:///f:/code/svelte/ci-verse/tailwind.config.ts)
Tailwind-Konfiguration mit Custom Theme für Leitperspektiven (Farben für Digitalität, Nachhaltigkeit, Gerechtigkeit)

#### [NEW] [src/app.css](file:///f:/code/svelte/ci-verse/src/app.css)
Global Styles mit Tailwind Directives

---

### **Data Layer**

#### [NEW] [src/lib/types/project.ts](file:///f:/code/svelte/ci-verse/src/lib/types/project.ts)
TypeScript Interfaces für:
- `ProjectData` (id, title, department, perspectives, targetGroups, staff, externalUrl)
- `StaffMember`
- `Department` ('B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3')
- `Perspective` ('default' | 'justice' | 'sustainability' | 'digitality' | 'structure')

#### [NEW] [src/lib/data/mockProjects.ts](file:///f:/code/svelte/ci-verse/src/lib/data/mockProjects.ts)
Transformiere [example-data.json](file:///f:/code/svelte/ci-verse/example-data.json) in typisiertes Array mit erweiterten Mock-Daten (Avatare, Screenshots)

---

### **Store Architecture (Svelte 5 Runes)**

#### [NEW] [src/lib/logic/store.svelte.ts](file:///f:/code/svelte/ci-verse/src/lib/logic/store.svelte.ts)
WorldStore Klasse mit:
- **State**: `$state<AppState>` (projects, activePerspective, hoveredId, selectedId, activeQPlatform)
- **Derived**: `themeColor`, `fogColor`, `filteredProjects`
- **Methods**: `selectProject()`, `setPerspective()`, `setQPlatform()`, `getRelated()`

Algorithmus für `getRelated()`:
1. Gleiche Abteilung (Score +3)
2. Gleiche Zielgruppe (Score +2)
3. Gleiche Perspektive (Score +1)
4. Return Top 3 by Score

---

### **Layout Algorithm**

#### [NEW] [src/lib/logic/layout.ts](file:///f:/code/svelte/ci-verse/src/lib/logic/layout.ts)
Hexagonale Positionierung:
- **Funktion**: `calculateHexLayout(projects: ProjectData[]): Map<string, Vector3>`
- **Ring-System**: B1 = Ring 1 (Radius 8), B2 = Ring 2 (Radius 16), B3 = Ring 3 (Radius 24)
- **Hexagon-Verteilung**: Verwende 60°-Steps für gleichmäßige Verteilung
- **Orbit**: Q1-Q3 = Y-Position: 12 (schwebend)

---

### **3D Components**

#### [NEW] [src/lib/components/3d/Scene.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/3d/Scene.svelte)
Haupt-3D-Container:
- `<Canvas>`
- `<T.PerspectiveCamera>` (position: [0, 40, 50])
- `<OrbitControls>` (min/max Polar Angle, Zoom Limits)
- `<T.AmbientLight>` (dynamisch basierend auf Perspektive)
- `<T.DirectionalLight>`
- `<T.Fog>` (reaktiv auf themeColor)
- Einbinde `<WorldLayout>`

#### [NEW] [src/lib/components/3d/WorldLayout.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/3d/WorldLayout.svelte)
Layout-Manager:
- Importiere Layout-Funktion
- Iteriere über `worldStore.state.projects`
- Rendere `<ExhibitStand>` für jedes Projekt an berechneter Position

#### [NEW] [src/lib/components/3d/ExhibitStand.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/3d/ExhibitStand.svelte)
**Ausstellungsstand-Komponente** (inspiriert vom Screenshot):
- **Props**: `project`, `position`
- **Struktur**:
  - Basis-Plattform (Box, 6×0.2×6)
  - 3 Paneele (PlaneGeometry, 5×3)
    - Vorderes Panel: Website-Screenshot (Texture)
    - Seitliche Panels: Logo/Text
  - Holz-Rahmen (BoxGeometry als Streben)
- **Hover**: Scale Y Animation (+0.1), EmissiveIntensity
- **Click**: `worldStore.selectProject(project.id)`
- **Texture**: `useTexture()` für Screenshot-Laden

#### [NEW] [src/lib/components/3d/Terra.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/3d/Terra.svelte)
Grundboden:
- Große Plane (CircleGeometry, Radius 40)
- Material: MeshStandardMaterial (Color: #e8e8e8, Roughness: 0.8)

#### [NEW] [src/lib/components/3d/FloatingPlatform.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/3d/FloatingPlatform.svelte)
Q-Ebene Satelliten:
- Kristall/Glasformen (IcosahedronGeometry)
- Langsame Rotation (`useTask`)
- Emissive Material (Glow-Effekt)

---

### **UI Overlays**

#### [NEW] [src/lib/components/ui/ProjectCard.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/ui/ProjectCard.svelte)
Modal-Card (bereits in [docs/components.md](file:///f:/code/svelte/ci-verse/docs/components.md) spezifiziert):
- Backdrop mit Blur
- 2-Spalten-Layout (Screenshot links, Info rechts)
- Related Projects Footer
- Transitions (fly, fade)

#### [NEW] [src/lib/components/ui/FilterBar.svelte](file:///f:/code/svelte/ci-verse/src/lib/components/ui/FilterBar.svelte)
Untere Navigation:
- Buttons für Perspektiven (Default, Digitalität, Nachhaltigkeit, Gerechtigkeit, Struktur)
- Active State Styling
- onClick: `worldStore.setPerspective()`

---

### **Routes**

#### [MODIFY] [src/routes/+page.svelte](file:///f:/code/svelte/ci-verse/src/routes/+page.svelte)
Haupt-Page:
- Initialisiere WorldStore mit Mock-Daten
- Lese URL-Params (`$page.url.searchParams.get('view')`, `'project'`)
- Rendere `<Scene>` + UI-Overlays
- Vollbild Canvas mit fixed UI-Layer

#### [NEW] [src/routes/+layout.svelte](file:///f:/code/svelte/ci-verse/src/routes/+layout.svelte)
Root Layout:
- Import `app.css`
- Basic HTML structure

---

## Verification Plan

### Automated Tests
```bash
npm run dev
```
- Server startet ohne Fehler
- TypeScript Checks bestehen (`npm run check`)

### Manual Verification
1. **3D-Szene lädt**: Browser öffnen, Ausstellungsstände sichtbar in hexagonaler Anordnung
2. **Hover-Effekt**: Maus über Stand bewegt → Stand hebt sich leicht + Glow
3. **Click Interaction**: Stand anklicken → ProjectCard Modal öffnet sich
4. **Filter**: Perspektive wählen (z.B. "Digitalität") → Atmosphäre ändert Farbe, irrelevante Stände dimmen
5. **Related Projects**: In Modal → Verwandte Projekte anklicken → Navigation funktioniert
6. **Camera Controls**: OrbitControls funktionieren (Drehen, Zoom)
7. **Performance**: 60 FPS in Chrome DevTools Performance Monitor
8. **URL Deep-Linking**: `/?project=rpi-kita` öffnet direkt das Modal
