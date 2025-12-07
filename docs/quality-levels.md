# Quality Levels - Detaillierte Übersicht

Dieses Dokument beschreibt die drei Qualitätsstufen des CI-Verse Performance-Systems und ihre Auswirkungen auf die 3D-Darstellung.

---

## Zentrale Konfiguration: `/static/config.json`

> **NEU seit v2.1.1**: Alle Qualitäts-Einstellungen sind zentral in einer JSON-Datei konfigurierbar!

Die Datei `/static/config.json` enthält alle Performance-Einstellungen und wird beim Start der Anwendung geladen. Änderungen werden nach einem Seiten-Reload wirksam (kein Build erforderlich).

### Aufbau der config.json

```json
{
  "_comment": "Beschreibung der Datei",
  
  "qualityPresets": {
    "high": { /* Einstellungen für High-Qualität */ },
    "medium": { /* Einstellungen für Medium-Qualität */ },
    "low": { /* Einstellungen für Low-Qualität */ }
  },
  
  "geometrySegments": {
    "high": 1.0,    // 100% der Basis-Segmente
    "medium": 0.6,  // 60%
    "low": 0.3      // 30%
  },
  
  "autoDowngrade": {
    "enabled": true,
    "fpsThreshold": 20,
    "measurementCount": 5
  }
}
```

### Struktur eines Quality-Presets

Jedes Preset (high, medium, low) hat folgende Kategorien:

| Kategorie | Einstellungen |
|-----------|---------------|
| `materials` | `usePBRMaterials`, `useEmissive` |
| `shadows` | `enableShadows` |
| `lighting` | `maxSpotlights`, `useHemisphereLight` |
| `geometry` | `geometryDetail` ("high" / "medium" / "low") |
| `effects` | `enableFog`, `enableParticles`, `enableAnimations`, `enableGlowRings`, `enableEnergyEffects`, `lightBridgeQuality` |
| `rendering` | `pixelRatio` (Zahl oder "auto"), `antialias` |
| `camera` | `flightSpeed` ("normal" / "fast" / "instant"), `smoothTime` |

### Beispiel: EnergyFloor im Low-Mode aktivieren

Standardmäßig sind die Energy-Effekte im Low-Mode deaktiviert. Um sie zu aktivieren:

```json
"low": {
  "effects": {
    "enableEnergyEffects": true,  // ← Auf true setzen
    // ... andere Einstellungen
  }
}
```

### Beispiel: Kamera-Geschwindigkeit anpassen

```json
"high": {
  "camera": {
    "flightSpeed": "normal",  // normal | fast | instant
    "smoothTime": 1.5         // Sekunden für Kamera-Glättung
  }
}
```

### Landepunkte konfigurieren

Die Landepunkte bestimmen, wo die Kamera beim Betreten einer Plattform positioniert wird:

```json
"landingPoints": {
  "B_platforms": {
    "_comment": "Bildungsplattformen (B1, B2, B3)",
    "offset": [-15, 8, -9],      // [x, y, z] Offset von Plattform-Mitte
    "lookAtOffset": [0, 3, 0]    // Wohin die Kamera schaut
  },
  "Q_platforms": {
    "_comment": "Querschnittsplattformen (Q1, Q2, Q3)",
    "offset": [-15, 10, -9],     // Etwas höher wegen höherer Plattformen
    "lookAtOffset": [0, 3, 0]
  },
  "S_platform": {
    "_comment": "Marktplatz - schaut zum NexusTerminal",
    "offset": [12, 10, 18],
    "lookAtOffset": [-20, 3, -12]
  }
}
```

**Parameter:**
- `offset`: Position der Kamera relativ zur Plattform-Mitte `[x, y, z]`
- `lookAtOffset`: Blickziel relativ zur Plattform-Mitte `[x, y, z]`

**Hinweise:**
- Größerer Y-Wert im Offset = Kamera ist höher
- Negativer X-Wert = Kamera ist links vom Zentrum
- Das InfoHexagon steht immer im Zentrum `[0, 0, 0]` der Plattform

### Fallback-Verhalten

Falls die `config.json` nicht geladen werden kann (z.B. Netzwerkfehler), verwendet der `performanceStore` eingebaute Fallback-Werte, die den Standard-Presets entsprechen.

---

## Übersicht

| Eigenschaft | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| **Zielgruppe** | Dedizierte GPUs | Integrierte GPUs | Schwache Hardware |
| **Icon** | 🔥 | ⚡ | 🌿 |
| **Label** | Beste Grafik | Ausgewogen | Performance |
| **Beschreibung** | Volle Effekte, Schatten & Beleuchtung | Gute Grafik, reduzierte Effekte | Einfache Grafik, schnellste Ladezeit |

---

## Materialien

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `usePBRMaterials` | ✅ `true` | ✅ `true` | ❌ `false` |
| `useEmissive` | ✅ `true` | ✅ `true` | ❌ `false` |

### Erklärung

- **`usePBRMaterials`**: Verwendet `MeshStandardMaterial` (physikalisch-basiertes Rendering) statt `MeshBasicMaterial`
  - High/Medium: Realistische Lichtreflexionen, Metallic- und Roughness-Eigenschaften
  - Low: Einfache flache Farben ohne Lichtinteraktion

- **`useEmissive`**: Aktiviert leuchtende/selbstleuchtende Materialien
  - High/Medium: Glüheffekte auf Plattformen und Objekten
  - Low: Keine Emissive-Eigenschaften → weniger Shader-Komplexität

---

## Schatten

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `enableShadows` | ✅ `true` | ❌ `false` | ❌ `false` |

### Erklärung

- **`enableShadows`**: Aktiviert `castShadow` und `receiveShadow` auf Meshes
  - High: Vollständige Echtzeit-Schatten (teuerste GPU-Operation)
  - Medium/Low: Keine Schatten → deutliche Performance-Verbesserung

---

## Beleuchtung

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `maxSpotlights` | `6` | `3` | `0` |
| `useHemisphereLight` | ✅ `true` | ✅ `true` | ❌ `false` |

### Erklärung

- **`maxSpotlights`**: Maximale Anzahl dynamischer Spotlights pro Szene
  - High: 6 Spotlights für volle Akzentbeleuchtung
  - Medium: 3 Spotlights (reduziert)
  - Low: Keine Spotlights → nur Ambient + Directional Light

- **`useHemisphereLight`**: Atmosphärisches Himmelslicht für weiche Übergänge
  - High/Medium: Aktiviert für natürliche Lichtstimmung
  - Low: Deaktiviert → einfacheres Beleuchtungsmodell

---

## Geometrie

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `geometryDetail` | `'high'` | `'medium'` | `'low'` |
| **Segment-Multiplikator** | `1.0` (100%) | `0.6` (60%) | `0.3` (30%) |

### Erklärung

- **`geometryDetail`**: Bestimmt die Polygon-Anzahl aller Geometrien
  - Beispiel: Ein Zylinder mit 32 Basis-Segmenten:
    - High: 32 Segmente
    - Medium: ~19 Segmente
    - Low: ~10 Segmente

### Spezifische Geometrie-Anpassungen

| Objekt | High | Medium | Low |
|--------|------|--------|-----|
| Kugeln (z.B. Oktaeder-Enden) | 16 Segmente | 16 Segmente | 8 Segmente |
| Point Lights pro Plattform | ✅ Aktiviert | ✅ Aktiviert | ❌ Deaktiviert |

---

## Texturen (Poster-Bilder)

Die `PosterImage`-Komponente passt die Textur-Qualität automatisch an:

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `minFilter` | `LinearMipmapLinearFilter` | `LinearFilter` | `NearestFilter` |
| `magFilter` | `LinearFilter` | `LinearFilter` | `NearestFilter` |
| `anisotropy` | `4` | `2` | `1` |
| `generateMipmaps` | ✅ `true` | ❌ `false` | ❌ `false` |

### Erklärung

- **`minFilter`**: Filter für verkleinertes Bild (Entfernung)
  - High: Beste Qualität mit Mipmaps (weiche Übergänge)
  - Medium: Linear interpoliert, keine Mipmaps
  - Low: Nearest-Neighbor (pixelig, aber schnell)

- **`magFilter`**: Filter für vergrößertes Bild (Nähe)
  - High/Medium: Linear interpoliert
  - Low: Nearest-Neighbor (pixelig)

- **`anisotropy`**: Qualität bei schräger Betrachtung
  - High: 4x anisotrope Filterung
  - Medium: 2x
  - Low: Keine (1x)

- **`generateMipmaps`**: Vorberechnete kleinere Texturversionen
  - High: Aktiviert für bessere Qualität bei Entfernung
  - Medium/Low: Deaktiviert → spart VRAM und Ladezeit

---

## Effekte

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `enableFog` | ✅ `true` | ✅ `true` | ❌ `false` |
| `enableParticles` | ✅ `true` | ❌ `false` | ❌ `false` |
| `enableAnimations` | ✅ `true` | ✅ `true` | ❌ `false` |
| `enableGlowRings` | ✅ `true` | ✅ `true` | ❌ `false` |
| `enableEnergyEffects` | ✅ `true` | ✅ `true` | ❌ `false` |
| `lightBridgeQuality` | `'high'` | `'medium'` | `'low'` |

### Erklärung

- **`enableFog`**: Volumetrischer Nebel für Tiefenwirkung
  - High/Medium: Atmosphärischer Nebel unter den Plattformen
  - Low: Kein Nebel → weniger Fragment-Shader-Berechnungen

- **`enableParticles`**: Partikel-Effekte (z.B. beim Transport)
  - High: Volle Partikel-Effekte
  - Medium/Low: Keine Partikel → GPU-Entlastung

- **`enableAnimations`**: Objekt- und Kamera-Animationen
  - High/Medium: Sanfte Übergänge und Bewegungen
  - Low: **Keine Animationen** → sofortige Zustandsänderungen

- **`enableGlowRings`**: Leuchtende Ringe um Plattformen
  - High/Medium: Sichtbare Glow-Ringe
  - Low: Keine Glow-Ringe (Shader-basiert!)

- **`enableEnergyEffects`**: EnergyFloor + EnergyBeam auf dem Marktplatz
  - High/Medium: Animierte Energie-Ströme zum Oktaeder
  - Low: **Deaktiviert** (komplexe Shader!)

### LightBridge-Qualität (Lichtlinien)

| Ebene | High | Medium | Low |
|-------|------|--------|-----|
| **Äußerer diffuser Glow** | ✅ Sichtbar | ❌ Nicht sichtbar | ❌ Nicht sichtbar |
| **Mittlerer Glow** | ✅ Sichtbar | ✅ Sichtbar | ❌ Nicht sichtbar |
| **Kern-Linie** | ✅ Sichtbar | ✅ Sichtbar | ✅ Sichtbar |

- High: 3-Layer-Glow (Kern + Glow + äußerer Glow)
- Medium: 2-Layer-Glow (Kern + Glow)
- Low: Nur Kern-Linie (minimale Darstellung)

---

## Rendering

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `pixelRatio` | `devicePixelRatio` (max 2.0) | `1.0` | `0.5` |
| `antialias` | ✅ `true` | ✅ `true` | ❌ `false` |

### Erklärung

- **`pixelRatio`**: Canvas-Auflösung relativ zum Display
  - High: Native Auflösung (z.B. 2.0 auf Retina-Displays)
  - Medium: Feste 1:1 Auflösung
  - Low: **Halbe Auflösung** → 75% weniger Pixel zu berechnen!

- **`antialias`**: Kantenglättung (Anti-Aliasing)
  - High/Medium: Geglättete Kanten
  - Low: Keine Glättung → schnelleres Rendering

---

## Kamera

| Einstellung | 🔥 High | ⚡ Medium | 🌿 Low |
|-------------|---------|----------|--------|
| `cameraFlightSpeed` | `'normal'` | `'fast'` | `'instant'` |
| `cameraSmoothTime` | `1.5` | `0.9` | `0.4` |

### Erklärung

- **`cameraFlightSpeed`**: Geschwindigkeit bei Plattform-Wechsel
  - High: Normale Fluganimation (2-3 Sekunden, cinematisch)
  - Medium: Schnelle Fluganimation (~1 Sekunde)
  - Low: **Sofortiger Sprung** → keine Zwischen-Frames

- **`cameraSmoothTime`**: Glättung der Kamera-Bewegung
  - High: 1.5 → Sehr weiche, cinematische Bewegung
  - Medium: 0.9 → Mittlere Glättung
  - Low: 0.4 → Direkte, reaktive Kamera (weniger Interpolation)

---

## Transparenz-Handling

| Komponente | High/Medium | Low |
|------------|-------------|-----|
| `MesseWall` | Transparente Materialien | Opake Materialien |
| `ReceptionWall` | Transparente Materialien | Opake Materialien |
| `InteractionPillar` | Transparente Materialien | Opake Materialien |

Bei Low-Qualität wird auf `opacity < 1.0` verzichtet, um Alpha-Blending-Kosten zu sparen.

---

## Automatische Hardware-Erkennung

Der `performanceStore` erkennt automatisch die Hardware-Kapazitäten:

### GPU-Erkennung

| GPU-Typ | Erkennungsmerkmale | Standard-Qualität |
|---------|-------------------|-------------------|
| **Dediziert** | NVIDIA, AMD (nicht integriert) | High |
| **Integriert** | Intel, Mesa, Mali, Adreno, SwiftShader | Medium |

### Weitere Faktoren

| Faktor | Bedingung | Aktion |
|--------|-----------|--------|
| RAM < 4GB | `navigator.deviceMemory < 4` | Low-Qualität |
| Touch-Device | `'ontouchstart' in window` | Medium-Qualität |

### Auto-Downgrade bei schlechter FPS

- Überwacht die letzten 10 FPS-Messungen
- Bei Durchschnitt < 20 FPS: Automatisches Downgrade
  - high → medium
  - medium → low

---

## Komponenten-Nutzung

### So prüfst du die Qualität in Komponenten:

```svelte
<script lang="ts">
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    
    // Qualitätsstufe direkt
    let isLow = $derived(performanceStore.qualityLevel === 'low');
    
    // Einzelne Settings
    let enableAnimations = $derived(performanceStore.settings.enableAnimations);
    let usePBRMaterials = $derived(performanceStore.settings.usePBRMaterials);
    let maxSpotlights = $derived(performanceStore.settings.maxSpotlights);
</script>

<!-- Bedingte Darstellung -->
{#if performanceStore.qualityLevel !== 'low'}
    <ExpensiveEffect />
{/if}

<!-- Material-Auswahl -->
{#if usePBRMaterials}
    <T.MeshStandardMaterial color="#ffffff" />
{:else}
    <T.MeshBasicMaterial color="#ffffff" />
{/if}
```

### Segment-Anzahl anpassen:

```typescript
// Basis-Segmente mit Qualitäts-Multiplikator
const segments = performanceStore.getSegments(32); 
// High: 32, Medium: 19, Low: 10
```

---

## LocalStorage-Persistenz

Die gewählte Qualitätsstufe wird im Browser gespeichert:

- **Key**: `ci-verse-quality`
- **Werte**: `'high'` | `'medium'` | `'low'`

Bei erneutem Besuch wird die gespeicherte Einstellung geladen, sofern vorhanden.

---

## Zusammenfassung: Was wird bei jedem Level deaktiviert?

### Medium (vs High)

- ❌ Schatten
- ❌ Partikel
- ❌ Äußerer LightBridge-Glow
- ⬇️ Reduzierte Spotlights (6 → 3)
- ⬇️ Feste pixelRatio (1.0)
- ⬇️ Schnellere Kamera-Glättung

### Low (vs Medium)

- ❌ PBR-Materialien → BasicMaterial
- ❌ Emissive-Effekte
- ❌ Hemisphere Light
- ❌ Alle Spotlights
- ❌ Nebel
- ❌ Animationen (sofortiger Kamera-Sprung!)
- ❌ Glow-Ringe
- ❌ Energie-Effekte (EnergyFloor/Beam)
- ❌ LightBridge-Glow (nur Kern)
- ❌ Antialias
- ❌ Transparenz in Wänden/Pillars
- ⬇️ Halbe Auflösung (pixelRatio: 0.5)
- ⬇️ Minimale Geometrie (30%)
- ⬇️ Direkte Kamera-Reaktion
