/**
 * Plattform-Definitionen für die schwebende Welt
 * 
 * Architektur:
 * - S: Marktplatz (Zentrum, Y=8)
 * - B1-B3: Bildungsplattformen (gleiche Höhe wie S, Y=8)
 * - Q1-Q3: Querschnittsplattformen (höher, Y=20-25)
 */

export interface Platform {
    id: string;
    name: string;
    shortName: string;
    description: string;
    y: number;
    x: number;
    z: number;
    size: number;
    color: string;
    glowColor: string;
}

export interface Connection {
    from: string;
    to: string;
    color: string;
    type: 'primary' | 'secondary' | 'ring';
}

// ============================================
// PLATTFORM-DEFINITIONEN
// ============================================

export const platforms: Record<string, Platform> = {
    // S - Marktplatz (Zentrum)
    S: {
        id: 'S',
        name: 'Marktplatz',
        shortName: 'Markt',
        description: 'Zentraler Ausgangspunkt mit Bibliothek und ProjectChart',
        y: 8,
        x: 0,
        z: 0,
        size: 8,
        color: '#64748b',      // Slate
        glowColor: '#94a3b8'
    },

    // B-Plattformen (Bildung) - gleiche Höhe wie S
    B1: {
        id: 'B1',
        name: 'Frühkindliche Bildung',
        shortName: 'Kita',
        description: 'Religiöse Bildung für Kinder von 0-6 Jahren',
        y: 8,
        x: -22,
        z: 0,
        size: 10,
        color: '#fcd34d',      // Amber
        glowColor: '#fde68a'
    },
    B2: {
        id: 'B2',
        name: 'Schule & Jugend',
        shortName: 'Schule',
        description: 'Bildungsangebote für Schule und Jugendarbeit',
        y: 8,
        x: 0,
        z: 18,
        size: 10,
        color: '#fb923c',      // Orange
        glowColor: '#fdba74'
    },
    B3: {
        id: 'B3',
        name: 'Erwachsenenbildung',
        shortName: 'Erwachsene',
        description: 'Fortbildung und Lebenslanges Lernen',
        y: 8,
        x: 22,
        z: 0,
        size: 10,
        color: '#f87171',      // Red
        glowColor: '#fca5a5'
    },

    // Q-Plattformen (Querschnitt) - höher schwebend
    Q1: {
        id: 'Q1',
        name: 'Forschung',
        shortName: 'Forschung',
        description: 'Wissenschaftliche Studien und Publikationen',
        y: 18,
        x: -16,
        z: -14,
        size: 12,
        color: '#a78bfa',      // Violet
        glowColor: '#c4b5fd'
    },
    Q2: {
        id: 'Q2',
        name: 'Europa',
        shortName: 'Europa',
        description: 'Internationale Kooperationen und EU-Projekte',
        y: 24,
        x: 0,
        z: -22,
        size: 12,
        color: '#fbbf24',      // Yellow
        glowColor: '#fcd34d'
    },
    Q3: {
        id: 'Q3',
        name: 'Digitalisierung',
        shortName: 'Digital',
        description: 'Digitale Transformation und E-Learning',
        y: 18,
        x: 16,
        z: -14,
        size: 12,
        color: '#22d3ee',      // Cyan
        glowColor: '#67e8f9'
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
