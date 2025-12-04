/**
 * Plattform-Definitionen für die schwebende Welt
 * 
 * SKALA (neu):
 * - 1 Einheit ≈ 1 Meter
 * - Person: ~1.8 Einheiten groß
 * - Messestand: ~4x3 Einheiten
 * - Plattform: 50-80 Einheiten Durchmesser (für 5-15 Stände)
 * - Abstand zwischen Plattformen: 150-250 Einheiten
 * 
 * Architektur:
 * - S: Marktplatz (Zentrum, Y=0)
 * - B1-B3: Bildungsplattformen (gleiche Höhe wie S)
 * - Q1-Q3: Querschnittsplattformen (höher schwebend)
 */

// ========================================
// KONSTANTEN FÜR KAMERA-POSITIONIERUNG
// ========================================

/** Augenhöhe des Betrachters in Einheiten (≈ Metern) */
export const EYE_HEIGHT = 4.8;

/** Dicke der Plattform (Zylinder-Höhe) - Oberfläche ist bei platform.y + PLATFORM_SURFACE_OFFSET */
export const PLATFORM_THICKNESS = 3;

/** Offset von platform.y zur begehbaren Oberfläche */
export const PLATFORM_SURFACE_OFFSET = PLATFORM_THICKNESS / 2; // = 1.5

/** Standard-Betrachtungsabstand zu Exponaten */
export const VIEW_DISTANCE = 5;

/** Berechnet die Kamera-Y-Position für eine Plattform */
export function getCameraY(platformY: number): number {
    return platformY + PLATFORM_SURFACE_OFFSET + EYE_HEIGHT;
}

export interface Platform {
    id: string;
    // name und description sind in mockPlatformContents definiert!
    // Verwende getPlatformContent() um Title und Beschreibung zu laden
    y: number;
    x: number;
    z: number;
    size: number;          // Radius der Plattform
    color: string;
    glowColor: string;
    // Landepunkt: Wo die Kamera beim Betreten positioniert wird
    // Relativ zur Plattform-Mitte, User schaut Richtung lookAt
    landing?: {
        offset: [number, number, number];  // [x, y, z] Offset von Plattform-Mitte
        lookAtOffset: [number, number, number]; // Wohin der User schaut (relativ)
    };
}

export interface Connection {
    from: string;
    to: string;
    color: string;
    type: 'primary' | 'secondary' | 'ring';
}

// ============================================
// PLATTFORM-DEFINITIONEN (NEUE SKALA!)
// ============================================

export const platforms: Record<string, Platform> = {
    // S - Marktplatz (Zentrum) - größte Plattform
    S: {
        id: 'S',
        y: 0,
        x: 0,
        z: 0,
        size: 40,              // 80m Durchmesser
        color: '#64748b',      // Slate
        glowColor: '#94a3b8',
        landing: {
            offset: [12, 10, 18],       // Rechts-vorne vom Portal, erhöht
            lookAtOffset: [0, 4, -12]   // Schaut zum Turm (hinten-mitte)
        }
    },

    // B-Plattformen (Bildung) - gleiche Höhe wie S, im Kreis angeordnet
    B1: {
        id: 'B1',
        y: 0,
        x: -180,
        z: 0,
        size: 35,              // 70m Durchmesser
        color: '#fcd34d',      // Amber
        glowColor: '#fde68a',
        landing: {
            offset: [8, 8, -5],        // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 15]   // Schaut Richtung Wände (hinten)
        }
    },
    B2: {
        id: 'B2',
        y: 0,
        x: 0,
        z: 180,
        size: 35,
        color: '#fb923c',      // Orange
        glowColor: '#fdba74',
        landing: {
            offset: [-8, 8, -5],       // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 15]   // Schaut Richtung Wände (hinten)
        }
    },
    B3: {
        id: 'B3',
        y: 0,
        x: 180,
        z: 0,
        size: 35,
        color: '#f87171',      // Red
        glowColor: '#fca5a5',
        landing: {
            offset: [-8, 8, -5],       // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 15]   // Schaut Richtung Wände (hinten)
        }
    },

    // Q-Plattformen (Querschnitt) - höher schwebend
    Q1: {
        id: 'Q1',
        y: 80,
        x: -140,
        z: -140,
        size: 45,              // Größer wegen mehr Projekten
        color: '#a78bfa',      // Violet
        glowColor: '#c4b5fd',
        landing: {
            offset: [10, 10, -8],      // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 20]   // Schaut Richtung Wände
        }
    },
    Q2: {
        id: 'Q2',
        y: 120,
        x: 0,
        z: -200,
        size: 45,
        color: '#fbbf24',      // Yellow
        glowColor: '#fcd34d',
        landing: {
            offset: [-10, 10, -8],     // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 20]   // Schaut Richtung Wände
        }
    },
    Q3: {
        id: 'Q3',
        y: 80,
        x: 140,
        z: -140,
        size: 45,
        color: '#22d3ee',      // Cyan
        glowColor: '#67e8f9',
        landing: {
            offset: [-10, 10, -8],     // Nah an InfoHexagon, seitlich
            lookAtOffset: [0, 5, 20]   // Schaut Richtung Wände
        }
    }
};

// ============================================
// LICHTLINIEN-VERBINDUNGEN
// ============================================

export const connections: Connection[] = [
    // S zu allen B-Plattformen (warmweiß)
    { from: 'S', to: 'B1', color: '#fff8e0', type: 'primary' },
    { from: 'S', to: 'B2', color: '#fff8e0', type: 'primary' },
    { from: 'S', to: 'B3', color: '#fff8e0', type: 'primary' },

    // S zu allen Q-Plattformen (cyan/blau)
    { from: 'S', to: 'Q1', color: '#60a5fa', type: 'primary' },
    { from: 'S', to: 'Q2', color: '#60a5fa', type: 'primary' },
    { from: 'S', to: 'Q3', color: '#60a5fa', type: 'primary' },

    // B-Ring (untereinander verbunden, gold)
    { from: 'B1', to: 'B2', color: '#fbbf24', type: 'ring' },
    { from: 'B2', to: 'B3', color: '#fbbf24', type: 'ring' },
    { from: 'B3', to: 'B1', color: '#fbbf24', type: 'ring' },

    // Q-Ring (untereinander verbunden, violett)
    { from: 'Q1', to: 'Q2', color: '#a78bfa', type: 'ring' },
    { from: 'Q2', to: 'Q3', color: '#a78bfa', type: 'ring' },
    { from: 'Q3', to: 'Q1', color: '#a78bfa', type: 'ring' },

    // Vertikale Verbindungen B↔Q (sekundär, dezent)
    { from: 'B1', to: 'Q1', color: '#94a3b8', type: 'secondary' },
    { from: 'B3', to: 'Q3', color: '#94a3b8', type: 'secondary' },
];

// ============================================
// S-PLATTFORM ELEMENTE
// ============================================

export interface SPlatformElement {
    id: string;
    name: string;
    description: string;
    position: [number, number, number]; // Relative Position auf S-Plattform
    isInteractive: boolean;
    action: 'link' | 'chat' | 'none';
    url?: string;
    color: string;
}

export const sPlatformElements: SPlatformElement[] = [
    {
        id: 'S1',
        name: 'Bibliothek',
        description: 'Dokumentation und Informationen',
        position: [-2, 0.5, -2],
        isInteractive: true,
        action: 'link',
        url: 'https://comenius.de/bibliothek',
        color: '#3b82f6'  // Blue
    },
    {
        id: 'S2_1',
        name: 'ProjectChart',
        description: 'KI-Auskunft zu Projekten',
        position: [2, 0.5, -2],
        isInteractive: true,
        action: 'chat',
        color: '#8b5cf6'  // Violet
    },
    {
        id: 'S2_2',
        name: 'Backoffice',
        description: 'Verwaltung',
        position: [-2, 0.5, 2],
        isInteractive: false,
        action: 'none',
        color: '#6b7280'  // Gray
    },
    {
        id: 'S2_3',
        name: 'Finanzen',
        description: 'Buchhaltung',
        position: [2, 0.5, 2],
        isInteractive: false,
        action: 'none',
        color: '#6b7280'  // Gray
    }
];

// ============================================
// HELPER FUNKTIONEN
// ============================================

/**
 * Holt alle Verbindungen für eine bestimmte Plattform
 */
export function getConnectionsForPlatform(platformId: string): Connection[] {
    return connections.filter(c => c.from === platformId || c.to === platformId);
}

/**
 * Gibt die Position einer Plattform als Array zurück
 */
export function getPlatformPosition(platformId: string): [number, number, number] {
    const p = platforms[platformId];
    if (!p) return [0, 0, 0];
    return [p.x, p.y, p.z];
}

/**
 * Berechnet den Mittelpunkt zwischen zwei Plattformen
 */
export function getConnectionMidpoint(fromId: string, toId: string): [number, number, number] {
    const from = platforms[fromId];
    const to = platforms[toId];
    if (!from || !to) return [0, 0, 0];
    
    return [
        (from.x + to.x) / 2,
        (from.y + to.y) / 2 + 1, // Leicht angehoben für Label
        (from.z + to.z) / 2
    ];
}

/**
 * Gibt alle Platform-IDs zurück
 */
export function getAllPlatformIds(): string[] {
    return Object.keys(platforms);
}

/**
 * Prüft ob eine Plattform eine Q-Plattform ist
 */
export function isQPlatform(platformId: string): boolean {
    return platformId.startsWith('Q');
}

/**
 * Prüft ob eine Plattform eine B-Plattform ist
 */
export function isBPlatform(platformId: string): boolean {
    return platformId.startsWith('B');
}
