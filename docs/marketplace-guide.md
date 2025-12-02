# Marktplatz-Guide

## Überblick

Der Marktplatz (S-Plattform) ist das zentrale Hub der CI-Verse Anwendung. Er bietet:
- **Leitlinien-Visualisierung** - 6 Poster-Wände mit Energie-Effekten
- **Institutions-Präsenz** - Comenius-Institut Booth
- **Info-Terminals** - Dynamische Anzeigen für News & Events
- **Partner-Vernetzung** - Abfahrtstafel mit Shuttle-Zügen
- **Navigation** - Transport-Portal zu allen Plattformen

---

## Architektur

```
                    Leitlinien-Poster (6x)
                    ↓    ↓    ↓    ↓
    ┌─────────────────────────────────────────┐
    │                                         │
    │   ┌─────┐              ┌─────────────┐  │
    │   │ 📰 │              │ DepartureBoard│ │
    │   │News │              │   🚂 Zug     │ │
    │   └─────┘              └─────────────┘  │
    │                                         │
    │           ╔═══════════╗                 │
    │           ║  Oktaeder ║ ← Energie-Zentrum
    │           ╚═════╦═════╝                 │
    │                 ║                       │
    │   ┌───────┐     ║      ┌─────────┐      │
    │   │ 📅   │  EnergyBeam │ 🏛️     │      │
    │   │Events │     ║      │Institut │      │
    │   └───────┘     ║      └─────────┘      │
    │                 ║                       │
    │           ══════════════                │
    │             EnergyFloor                 │
    └─────────────────────────────────────────┘
                    ↓
            TransportPortal
```

---

## Komponenten-Übersicht

### MarketplacePlatform.svelte
Hauptcontainer für alle Marktplatz-Elemente.

**Enthält:**
- Hexagonale Plattform-Basis
- EnergyFloor (Shader)
- EnergyBeam (vertikale Säule)
- Pulsierender Oktaeder
- Alle Child-Komponenten

**Props:**
```typescript
let { isOnS = false, isTransporting = false } = $props();
```

---

## Info-Terminals

### MarketplaceStand.svelte

Drei Arten von Terminals auf dem Marktplatz:

| Typ | Farbe | Funktion | Dialog |
|-----|-------|----------|--------|
| `institution` | Blau (#3b82f6) | Comenius-Institut Info | ChatModal |
| `publications` | Grün (#22c55e) | News & Publikationen | RssFeedPanel |
| `events` | Rot (#ef4444) | Termine & Events | EventsPanel |

#### Dynamische Content-Rotation

Die `publications` und `events` Terminals rotieren automatisch durch ihre Inhalte:

```typescript
// Rotation alle 8-15 Sekunden
const rotationInterval = 8000 + Math.random() * 7000;

$effect(() => {
    const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % items.length;
    }, rotationInterval);
    return () => clearInterval(interval);
});
```

#### Design-Elemente

```
┌─────────────────────────┐
│ 📰 NEUESTE NEWS    ●   │  ← Header mit Status-LED
├─────────────────────────┤
│                         │
│ Kategorie    Datum      │  ← Meta-Infos
│ ─────────────────────── │
│ Artikel-Titel           │  ← Hauptinhalt
│ Kurzbeschreibung...     │
│                         │
├─────────────────────────┤
│ ● ○ ○ ○   Alle News →  │  ← Pagination + Action
└─────────────────────────┘
```

---

## Partner-Vernetzung

### Konzept

Das Institut ist vernetzt mit vielen Bildungsakteuren. Dieses Netzwerk wird als "Bahnhof" visualisiert:
- **DepartureBoard** zeigt "Abfahrten" zu Partner-Organisationen
- **ShuttleTrain** visualisiert die "Verbindung" animiert
- **PartnerDialog** erklärt die Vernetzungsidee vor dem externen Link

### Partner-Kategorien

| Kategorie | Icon | Farbe | Beispiele |
|-----------|------|-------|-----------|
| ministry | 🏛️ Building2 | Blau | Landeskirchen, EKD |
| church | ⛪ Church | Violett | Kirchengemeinden |
| university | 🎓 GraduationCap | Grün | Hochschulen |
| institute | 🔬 Microscope | Cyan | Forschungsinstitute |
| international | 🌍 Globe | Amber | EU-Partner, ICCS |
| association | 👥 Users | Pink | Fachverbände |

### DepartureBoard.svelte

**Design:**
```
╔═══════════════════════════════════════════════╗
║  🚂 PARTNER-VERBINDUNGEN                     ║
╠═══════════════════════════════════════════════╣
║  🏛️ Ministerium  │ EKD Hannover     │ 10:30  ║
║  🎓 Hochschule   │ Uni Münster      │ 11:15  ║
║  🌍 Europa       │ ICCS Brüssel     │ 12:00  ║
║  ⛪ Kirche       │ EKHN Frankfurt   │ 13:45  ║
╚═══════════════════════════════════════════════╝
```

**Interaktion:**
1. User klickt auf Partner-Zeile
2. ShuttleTrain fährt ein (Animation)
3. PartnerDialog öffnet sich
4. User liest Vernetzungs-Info
5. Klick auf "Website besuchen" → Externer Link

### ShuttleTrain.svelte

**Animation-Phasen:**
```
Phase 1: Idle         ───[🚂]───────────────────  (außerhalb)
Phase 2: Arriving     ────────────[🚂]──────────  (fährt ein)
Phase 3: Stopped      ─────────────────[🚂]─────  (am Bahnsteig)
Phase 4: Departing    ───────────────────────[🚂] (fährt aus)
```

**Animation-Code:**
```typescript
let trainPosition = $state(-5);  // Startposition außerhalb

$effect(() => {
    if (isArriving) {
        // Smooth easing zum Bahnsteig
        const animation = animate(trainPosition, 0, { duration: 2000 });
    }
    if (isDeparting) {
        // Ausfahrt in andere Richtung
        const animation = animate(trainPosition, 5, { duration: 2000 });
    }
});
```

### PartnerDialog.svelte

**Layout:**
```
┌──────────────────────────────────────────────┐
│ 🔗 Partner-Verbindung                    ✕   │
├──────────────────────────────────────────────┤
│                                              │
│  [Logo]  Partner-Name                        │
│          🏛️ Ministerium                      │
│                                              │
│  ─────────────────────────────────────────── │
│                                              │
│  Das Comenius-Institut arbeitet eng mit      │
│  kirchlichen Strukturen und Landeskirchen    │
│  zusammen. Diese Partnerschaft ermöglicht... │
│                                              │
│  ─────────────────────────────────────────── │
│                                              │
│  🔗 Vernetzt mit 25+ Partnern in dieser      │
│     Kategorie                                │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │   🌐 Website besuchen               │     │
│  └─────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

---

## Datenmodell

### PartnerConnection Interface

```typescript
interface PartnerConnection {
    id: string;
    name: string;
    category: 'ministry' | 'church' | 'university' | 'institute' | 'international' | 'association';
    url: string;
    description?: string;
    logo?: string;
    departureTime?: string;  // Für DepartureBoard
    platform?: string;       // "Gleis" (rein visuell)
}
```

### MarketplaceContent Interface

```typescript
interface MarketplaceContent {
    institution: {
        name: string;
        description: string;
        logo?: string;
        team?: TeamMember[];
        chatWebhook?: string;
    };
    publications: {
        rssFeedUrls: string[];
    };
    events: {
        calendarUrl?: string;
        nostrRelay?: string;
    };
    partners: PartnerConnection[];
}
```

---

## Store-Integration

### WorldStore State für Marktplatz

```typescript
interface WorldState {
    // ... andere States
    
    // Dialog-States
    isChatOpen: boolean;
    isRssPanelOpen: boolean;
    isEventsPanelOpen: boolean;
    isPartnerDialogOpen: boolean;
    selectedPartner: PartnerConnection | null;
}
```

### Store-Methoden

```typescript
// Chat
openChat(): void;
closeChat(): void;

// RSS Feed
openRssPanel(): void;
closeRssPanel(): void;

// Events
openEventsPanel(): void;
closeEventsPanel(): void;

// Partner
openPartnerDialog(partner: PartnerConnection): void;
closePartnerDialog(): void;
```

---

## Positionen auf dem Marktplatz

```typescript
// In MarketplacePlatform.svelte

// Leitlinien-Wände (6 Stück, hexagonal)
const wallPositions = [
    { x: 6, z: 0, rotation: Math.PI / 2 },
    { x: 3, z: 5.2, rotation: Math.PI / 6 },
    { x: -3, z: 5.2, rotation: -Math.PI / 6 },
    { x: -6, z: 0, rotation: -Math.PI / 2 },
    { x: -3, z: -5.2, rotation: Math.PI + Math.PI / 6 },
    { x: 3, z: -5.2, rotation: Math.PI - Math.PI / 6 },
];

// Terminals
const terminalPositions = {
    institution: { x: 2, z: 3, rotation: -Math.PI / 4 },
    publications: { x: -3, z: 2, rotation: Math.PI / 4 },
    events: { x: -3, z: -2, rotation: -Math.PI / 4 },
};

// DepartureBoard + ShuttleTrain
const departurePosition = { x: 4, z: -3, rotation: Math.PI / 3 };
```

---

## Erweiterung: Neuen Terminal-Typ hinzufügen

1. **Store erweitern:**
```typescript
// store.svelte.ts
isMyPanelOpen: boolean = false;

openMyPanel() { this.state.isMyPanelOpen = true; }
closeMyPanel() { this.state.isMyPanelOpen = false; }
```

2. **Dialog erstellen:**
```svelte
<!-- MyPanel.svelte -->
<GlassDialog 
    isOpen={worldStore.state.isMyPanelOpen}
    onClose={() => worldStore.closeMyPanel()}
    title="Mein Panel"
    icon={MyIcon}
>
    <!-- Inhalt mit Inline-Styles -->
</GlassDialog>
```

3. **MarketplaceStand erweitern:**
```typescript
// MarketplaceStand.svelte
if (standType === 'myType') {
    worldStore.openMyPanel();
}
```

4. **Dialog in +page.svelte registrieren:**
```svelte
</main>

<MyPanel />
```

---

## Performance-Hinweise

- **EnergyFloor Shader** läuft kontinuierlich → GPU-Last beachten
- **ShuttleTrain Animation** nur bei aktivem Partner-Dialog
- **Content-Rotation** hat randomisierte Intervalle (8-15s) für natürlicheres Gefühl
- **Dialoge lazy laden** - Erst rendern wenn geöffnet

---

**Letztes Update:** 2025-12-02  
**Version:** 2.1.0
