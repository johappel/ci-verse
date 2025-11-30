# Platform Guide: Neue Plattform hinzufügen

Dieses Dokument beschreibt alle Schritte, die notwendig sind, um eine neue Plattform zur CI-Verse 3D-Welt hinzuzufügen.

> ⚠️ **Wichtig:** Das Hinzufügen einer Plattform ist **nicht vollständig dynamisch** möglich. Es erfordert Code-Änderungen in mehreren Dateien.

---

## Übersicht: Betroffene Dateien

| Datei | Änderung | Pflicht |
|-------|----------|---------|
| `src/lib/types/project.ts` | Department-Type erweitern | ✅ |
| `src/lib/logic/platforms.ts` | Layout-Definition (Position, Größe) | ✅ |
| `src/lib/data/mockProjects.ts` | Content-Daten (oder WordPress) | ✅ |
| `wordpress/.../acf-fields.php` | ACF Dropdown-Optionen | ✅ |
| `example-data.json` | Beispiel-Daten aktualisieren | 📝 Optional |

---

## Schritt 1: TypeScript Type erweitern

**Datei:** `src/lib/types/project.ts`

```typescript
// VORHER:
export type Department = 'B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';

// NACHHER (Beispiel: neue Plattform B4):
export type Department = 'B1' | 'B2' | 'B3' | 'B4' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';
```

---

## Schritt 2: Layout-Definition hinzufügen

**Datei:** `src/lib/logic/platforms.ts`

### 2.1 Plattform-Definition

```typescript
export const platforms: Record<string, Platform> = {
    // ... bestehende Plattformen ...
    
    // NEU: B4 - Beispiel "Hochschulbildung"
    B4: {
        id: 'B4',
        name: 'Hochschulbildung',
        shortName: 'Hochschule',
        description: 'Theologische Ausbildung an Hochschulen',
        y: 0,              // Gleiche Höhe wie andere B-Plattformen
        x: 0,              // X-Position (siehe Koordinatensystem unten)
        z: -180,           // Z-Position
        size: 35,          // Radius in Metern (70m Durchmesser)
        color: '#8b5cf6',  // Primärfarbe (Tailwind Violet-500)
        glowColor: '#a78bfa', // Hellere Variante (Violet-400)
        landing: {
            offset: [8, 8, -5],      // Kamera-Startposition relativ zur Mitte
            lookAtOffset: [0, 5, 15] // Blickrichtung
        }
    },
};
```

### 2.2 Koordinatensystem verstehen

```
Draufsicht (Y = Höhe):

                    Z- (hinten)
                        |
                       Q2
                      (Europa)
                        |
        Q1 -------- [Portal] -------- Q3
      (Forschung)       |          (Digital)
                        |
   X- (links)           S           X+ (rechts)
        |          (Marktplatz)          |
       B1               |               B3
      (Kita)           B2          (Erwachsene)
                    (Schule)
                        |
                    Z+ (vorne)
```

**Höhen (Y-Achse):**
- `y: 0` = Basis-Ebene (S, B1, B2, B3)
- `y: 80` = Mittlere Ebene (Q1, Q3)
- `y: 120` = Obere Ebene (Q2)

**Abstände:**
- B-Plattformen: ~180 Einheiten vom Zentrum
- Q-Plattformen: ~140-200 Einheiten vom Zentrum
- Mindestabstand zwischen Plattformen: ~100 Einheiten

### 2.3 Verbindungen (Lichtlinien) hinzufügen

```typescript
export const connections: Connection[] = [
    // ... bestehende Verbindungen ...
    
    // NEU: B4 Verbindungen
    { from: 'S', to: 'B4', color: '#fff8e0', type: 'primary' },
    { from: 'B3', to: 'B4', color: '#fbbf24', type: 'ring' },
    { from: 'B4', to: 'B1', color: '#fbbf24', type: 'ring' },
];
```

**Verbindungstypen:**
- `primary`: Vom Marktplatz (S) zu anderen Plattformen
- `ring`: Zwischen Plattformen derselben Ebene (B↔B oder Q↔Q)
- `secondary`: Vertikale Verbindungen (B↔Q)

---

## Schritt 3: Content-Daten hinzufügen

**Datei:** `src/lib/data/mockProjects.ts`

```typescript
export const mockPlatformContents: Record<string, PlatformContent> = {
    // ... bestehende Plattformen ...
    
    B4: {
        id: 'B4',
        title: 'Hochschulbildung',
        short: 'Hochschule',
        description: 'Theologische Ausbildung an Hochschulen',
        color: '#8b5cf6',
        glowColor: '#a78bfa',
        aspects: [
            { 
                id: 'b4-a1', 
                title: 'Theologie-Studium', 
                icon: '🎓', 
                description: 'Akademische theologische Ausbildung',
                contentUrl: '/content/b4-theologie.html'
            },
            { 
                id: 'b4-a2', 
                title: 'Religionspädagogik', 
                icon: '📚', 
                description: 'Lehramtsstudiengänge',
                contentUrl: '/content/b4-religionspaed.html'
            },
            // ... bis zu 5 Aspekte
        ],
        wallPosters: ['p16', 'p17'],     // Projekt-IDs für Wandposter
        boothProjects: ['p16', 'p17']    // Projekt-IDs für Messestände
    },
};
```

---

## Schritt 4: WordPress ACF-Felder erweitern

**Datei:** `wordpress/ci-verse-data/acf-fields.php`

### 4.1 Plattform-ID Dropdown

```php
[
    'key' => 'field_platform_id',
    'label' => 'Plattform ID',
    'name' => 'platform_id',
    'type' => 'select',
    'required' => 1,
    'choices' => [
        'B1' => 'B1 - Frühkindliche Bildung',
        'B2' => 'B2 - Schule & Jugend',
        'B3' => 'B3 - Erwachsenenbildung',
        'B4' => 'B4 - Hochschulbildung',  // NEU
        'Q1' => 'Q1 - Forschung',
        'Q2' => 'Q2 - Europa & Internationales',
        'Q3' => 'Q3 - Digitalisierung',
    ],
],
```

### 4.2 Projekt-Zuordnung

```php
[
    'key' => 'field_project_departments',
    'label' => 'Plattformen (Departments)',
    'name' => 'project_departments',
    'type' => 'checkbox',
    'choices' => [
        'B1' => 'B1 - Kita',
        'B2' => 'B2 - Schule',
        'B3' => 'B3 - Erwachsene',
        'B4' => 'B4 - Hochschule',  // NEU
        'Q1' => 'Q1 - Forschung',
        'Q2' => 'Q2 - Europa',
        'Q3' => 'Q3 - Digital',
    ],
    'layout' => 'horizontal',
],
```

---

## Schritt 5: Transport-Portal aktualisieren (optional)

**Datei:** `src/lib/components/3d/TransportPortal.svelte`

Das Transport-Portal lädt automatisch alle Plattformen aus `platforms.ts` und gruppiert sie nach Prefix (B/Q). Wenn die neue Plattform mit "B" oder "Q" beginnt, wird sie automatisch angezeigt.

**Für neue Prefixe (z.B. "X")** müsste das Template erweitert werden:

```svelte
<!-- Aktuelle Gruppierung -->
let bPlatforms = destinations.filter(p => p.id.startsWith('B'));
let qPlatforms = destinations.filter(p => p.id.startsWith('Q'));

<!-- Neu (falls nötig) -->
let xPlatforms = destinations.filter(p => p.id.startsWith('X'));
```

---

## Checkliste: Neue Plattform

```
□ 1. TypeScript: Department-Type erweitern
□ 2. platforms.ts: Layout-Definition (Position, Größe, Farben)
□ 3. platforms.ts: Lichtlinien-Verbindungen definieren
□ 4. mockProjects.ts: Content-Daten (Titel, Aspekte, Projekte)
□ 5. acf-fields.php: Plattform-ID Dropdown erweitern
□ 6. acf-fields.php: Projekt-Departments Checkbox erweitern
□ 7. example-data.json: Beispieldaten aktualisieren (optional)
□ 8. WordPress: Plattform-Post erstellen mit allen Feldern
□ 9. pnpm run check: TypeScript-Fehler beheben
□ 10. Browser testen: Plattform sichtbar? Transport funktioniert?
```

---

## Warum nicht vollständig dynamisch?

### Technische Gründe:

1. **TypeScript Union Types** - `Department` ist ein String-Literal-Union für Type-Safety
2. **3D-Layout** - Positionen müssen manuell festgelegt werden (keine Auto-Anordnung)
3. **Lichtlinien** - Verbindungsnetzwerk muss geplant werden
4. **WordPress ACF** - Dropdown-Optionen sind statisch definiert

### Mögliche Verbesserungen (Zukunft):

1. **Dynamische Departments** 
   ```typescript
   // Statt Union-Type:
   export type Department = string;
   
   // Aber: Verlust von Autovervollständigung und Type-Safety
   ```

2. **Auto-Layout-Algorithmus**
   ```typescript
   // Berechne Positionen basierend auf Anzahl
   function calculatePlatformPositions(count: number): Position[] {
       // Spirale, Kreis, oder Grid-Anordnung
   }
   ```

3. **WordPress als Single Source of Truth**
   ```php
   // Plattformen als CPT mit Position-Feldern
   register_post_type('civerse_platform', [
       // + ACF-Felder für x, y, z, size, etc.
   ]);
   ```

---

## Beispiel: Vollständige Änderung für "B4 - Hochschule"

### 1. types/project.ts
```diff
- export type Department = 'B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';
+ export type Department = 'B1' | 'B2' | 'B3' | 'B4' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';
```

### 2. platforms.ts (Auszug)
```diff
  B3: { ... },
  
+ B4: {
+     id: 'B4',
+     name: 'Hochschulbildung',
+     shortName: 'Hochschule',
+     description: 'Theologische Ausbildung an Hochschulen',
+     y: 0,
+     x: 0,
+     z: -180,
+     size: 35,
+     color: '#8b5cf6',
+     glowColor: '#a78bfa',
+     landing: {
+         offset: [8, 8, -5],
+         lookAtOffset: [0, 5, 15]
+     }
+ },

  Q1: { ... },
```

### 3. platforms.ts - Connections
```diff
  { from: 'B3', to: 'B1', color: '#fbbf24', type: 'ring' },
  
+ { from: 'S', to: 'B4', color: '#fff8e0', type: 'primary' },
+ { from: 'B1', to: 'B4', color: '#fbbf24', type: 'ring' },
+ { from: 'B4', to: 'B3', color: '#fbbf24', type: 'ring' },

  { from: 'Q1', to: 'Q2', color: '#a78bfa', type: 'ring' },
```

---

## Support

Bei Fragen oder Problemen:
1. `pnpm run check` für TypeScript-Fehler
2. Browser-Konsole für 3D-Fehler
3. WordPress REST API testen: `/wp-json/civerse/v1/world`
