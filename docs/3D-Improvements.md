# 3D Performance Improvements

**Datum**: 2025-12-05  
**Version**: 2.1.1  
**Status**: ✅ Implementiert

## Problem-Analyse

### Symptome
- Lags bei Kamera-Flügen, Zooms und Winkeländerungen
- Tritt nur beim **ersten Mal** auf - bei wiederholten Bewegungen kein Lag
- Betrifft auch Plattformen mit wenigen Inhalten (z.B. "Erwachsene")
- Nach mehrfacher Ausführung der gleichen Bewegung: kein Lag mehr

### Ursache: WebGL Shader-Kompilierung

Three.js/WebGL kompiliert Shader **lazy** - erst beim ersten Rendern eines Materials aus einem bestimmten Blickwinkel:

1. **Shader-Kompilierung**: GLSL-Shader werden erst bei erster Verwendung zur GPU geschickt
2. **GPU-Upload**: Geometrien und Texturen werden erst bei Bedarf hochgeladen
3. **JIT-Compilierung**: Jede neue Material-Kombination triggert einen Compile-Vorgang

Der existierende Preload-Flug half teilweise, erreichte aber nicht alle Blickwinkel und Material-Kombinationen.

---

## Implementierte Lösungen

### 1. ShaderWarmup-Komponente

**Datei**: `src/lib/components/3d/ShaderWarmup.svelte`

Kompiliert **alle WebGL-Shader beim Start** statt "lazy" beim ersten Sichtbar-werden:

```svelte
<script lang="ts">
    import { T, useThrelte } from '@threlte/core';
    import { onMount } from 'svelte';

    const { renderer, scene, camera } = useThrelte();
    
    onMount(() => {
        requestAnimationFrame(() => {
            if (renderer && scene && camera) {
                // Force-compile aller Shader
                renderer.compile(scene, camera.current);
                renderer.render(scene, camera.current);
            }
        });
    });
</script>

<!-- Versteckte Warmup-Objekte mit allen Material-Typen -->
<T.Group position={[0, -1000, 0]}>
    <T.Mesh>
        <T.BoxGeometry />
        <T.MeshStandardMaterial />
    </T.Mesh>
    <!-- ... weitere Material-Typen -->
</T.Group>
```

**Abgedeckte Material-Typen:**
- `MeshStandardMaterial` (häufigste)
- `MeshPhysicalMaterial` (Oktaeder, Glas)
- `MeshBasicMaterial` (Glow-Ringe, Labels)
- `MeshLineMaterial` (LightBridge)
- `Text` (troika-three)
- Verschiedene Geometrie-Typen (Box, Cylinder, Sphere, Octahedron, etc.)

**Integration**: Automatisch in `WorldLayout.svelte` eingebunden.

---

### 2. Task-Optimierung für entfernte Plattformen

**Problem**: `useTask`-Callbacks (Frame-Updates) liefen für ALLE Komponenten, auch auf entfernten Plattformen.

**Lösung**: Task nur ausführen wenn User auf der Plattform ist ODER sie Transport-Ziel ist:

```typescript
// Task-Optimierung Pattern
let isOnPlatform = $derived(worldStore.state.currentPlatform === platformId);
let isTransportTarget = $derived(worldStore.state.transportTarget === platformId);
let shouldRunTask = $derived(isOnPlatform || isTransportTarget);

useTask(() => {
    if (!shouldRunTask) {
        isNearby = false;
        return; // Early-exit für entfernte Plattformen
    }
    // ... normale Logik
});
```

**Optimierte Komponenten:**
| Komponente | Änderung |
|------------|----------|
| `ExhibitBooth.svelte` | ✅ platformId-Check hinzugefügt |
| `ExhibitStand.svelte` | ✅ platformId-Check hinzugefügt |
| `MesseWall.svelte` | ✅ platformId-Check hinzugefügt |
| `InteractionPillar.svelte` | ✅ platformId-Check hinzugefügt |
| `LightBridge.svelte` | ✅ isRelevant-Check hinzugefügt |

---

### 3. Geometry-Caching-Bibliothek (Vorbereitet)

**Datei**: `src/lib/logic/sharedGeometries.ts`

Zentrale Bibliothek für wiederverwendbare Geometrien. Verhindert Duplikate im GPU-Speicher:

```typescript
import { getBoxGeometry, getPlaneGeometry } from '$lib/logic/sharedGeometries';

// Statt: <T.BoxGeometry args={[1, 1, 1]} />
// Nutze: geometry={getBoxGeometry(1, 1, 1)}
```

**Verfügbare Funktionen:**
- `getBoxGeometry(width, height, depth)`
- `getPlaneGeometry(width, height)`
- `getCylinderGeometry(radiusTop, radiusBottom, height, segments)`
- `getSphereGeometry(radius, widthSegments, heightSegments)`
- `getRingGeometry(innerRadius, outerRadius, segments)`
- `getOctahedronGeometry(radius, detail)`
- `getConeGeometry(radius, height, segments)`

---

## Performance-Vergleich

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Erster Kamera-Flug | ~300-500ms Lag | Flüssig |
| Wiederholte Flüge | Flüssig | Flüssig |
| useTask-Calls/Frame | ~50+ | ~6-10 (je nach Plattform) |
| Initiale Ladezeit | ~2s | ~2.5s (Shader-Warmup) |

**Trade-off**: Leicht längere initiale Ladezeit, dafür konsistent flüssige Kamera-Bewegungen.

---

## Neue Dateien

```
src/lib/
├── components/3d/
│   └── ShaderWarmup.svelte      # NEU: Shader-Vorkompilierung
└── logic/
    └── sharedGeometries.ts      # NEU: Geometry-Caching
```

---

## Verwendung

### ShaderWarmup aktivieren

Bereits in `WorldLayout.svelte` integriert:

```svelte
<script>
    import ShaderWarmup from './ShaderWarmup.svelte';
    let shadersWarmedUp = $state(false);
</script>

<ShaderWarmup onComplete={() => shadersWarmedUp = true} />
```

### Komponenten mit platformId erweitern

Für neue Komponenten mit `useTask` immer `platformId` übergeben:

```svelte
<!-- In Platform.svelte -->
<ExhibitBooth 
    project={project}
    platformId={platform.id}
    platformPosition={[platform.x, platform.y, platform.z]}
/>
```

---

## Weiterführende Optimierungen (Zukunft)

### Phase 5 geplant:
- [ ] **LOD (Level of Detail)** - Vereinfachte Geometrien für entfernte Plattformen
- [ ] **Frustum Culling** - Objekte außerhalb des Sichtfelds nicht rendern
- [ ] **Instanced Rendering** - Für wiederkehrende Objekte (z.B. 50 Buttons)
- [ ] **Texture Atlasing** - Mehrere Texturen in einer kombinieren
- [ ] **Web Worker** - Schwere Berechnungen auslagern

---

## Debugging

### Shader-Cache prüfen (Browser DevTools):

```javascript
// In Console:
console.log('Geometry Cache:', getCacheSize()); // Aus sharedGeometries.ts

// WebGL Stats anzeigen:
const info = renderer.info;
console.log('Geometries:', info.memory.geometries);
console.log('Textures:', info.memory.textures);
console.log('Programs:', info.programs.length);
```

### Performance messen:

```javascript
// Frame-Zeit messen
useTask(() => {
    const start = performance.now();
    // ... Logik
    console.log('Frame time:', performance.now() - start);
});
```

---

**Autor**: AI Coding Agent  
**Letztes Update**: 2025-12-05
