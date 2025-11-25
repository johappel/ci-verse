import type { ProjectData, Department } from '../types/project';
import { Vector3 } from 'three';

interface Position {
    x: number;
    y: number;
    z: number;
}

interface HexPosition {
    x: number;
    z: number;
}

// Ring-Konfiguration für Departments (DEPRECATED - wird durch platforms.ts ersetzt)
const RING_CONFIG: Record<string, { radius: number; height: number }> = {
    B1: { radius: 8, height: 0 },
    B2: { radius: 16, height: 0 },
    B3: { radius: 24, height: 0 },
    S1: { radius: 3, height: 0 },
    S2: { radius: 3, height: 0 },
    S3: { radius: 3, height: 0 },
    Q1: { radius: 12, height: 12 }, // Orbit
    Q2: { radius: 18, height: 12 },
    Q3: { radius: 24, height: 12 }
};

/**
 * Berechnet hexagonale Positionen für Objekte auf einer Plattform
 * @param count Anzahl der Objekte
 * @param maxRadius Maximaler Radius für die Anordnung
 * @returns Array von {x, z} Positionen
 */
export function getHexagonalLayout(count: number, maxRadius: number): HexPosition[] {
    if (count === 0) return [];
    if (count === 1) return [{ x: 0, z: 0 }];

    const positions: HexPosition[] = [];
    
    // Zentrum
    positions.push({ x: 0, z: 0 });
    
    if (count === 1) return positions;

    // Hexagonale Ringe um das Zentrum
    let ring = 1;
    const hexSpacing = maxRadius / 3; // Abstand zwischen Objekten
    
    while (positions.length < count) {
        const ringPositions = ring * 6; // Jeder Ring hat 6 * ring Positionen
        const angleStep = (Math.PI * 2) / ringPositions;
        const radius = ring * hexSpacing;
        
        for (let i = 0; i < ringPositions && positions.length < count; i++) {
            const angle = angleStep * i - Math.PI / 2; // Start oben
            positions.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius
            });
        }
        ring++;
    }

    return positions;
}

/**
 * Berechnet hexagonale Positionen für alle Projekte (LEGACY - für Kompatibilität)
 */
export function calculateHexLayout(projects: ProjectData[]): Map<string, Vector3> {
    const positions = new Map<string, Vector3>();

    // Gruppiere Projekte nach primärem Department
    const grouped = new Map<Department, ProjectData[]>();

    projects.forEach((project) => {
        const primaryDept = project.departments[0];
        if (!grouped.has(primaryDept)) {
            grouped.set(primaryDept, []);
        }
        grouped.get(primaryDept)!.push(project);
    });

    // Platziere jede Gruppe
    grouped.forEach((projectsInDept, dept) => {
        const config = RING_CONFIG[dept];
        if (!config) return;

        const count = projectsInDept.length;
        const angleStep = (Math.PI * 2) / Math.max(count, 6); // Mindestens 6 Slots für schöne Hexagone

        projectsInDept.forEach((project, index) => {
            const angle = angleStep * index;
            const x = Math.cos(angle) * config.radius;
            const z = Math.sin(angle) * config.radius;
            const y = config.height;

            positions.set(project.id, new Vector3(x, y, z));
        });
    });

    console.log(
        'calculateHexLayout: Generated',
        positions.size,
        'positions for',
        projects.length,
        'projects'
    );
    console.log(
        'Positions:',
        Array.from(positions.entries()).map(([id, pos]) => ({ id, x: pos.x, y: pos.y, z: pos.z }))
    );

    return positions;
}

/**
 * Berechnet eine sanfte Kreisbewegung für die Initial-Kamera-Animation
 */
export function getCameraOrbitPosition(time: number, radius: number = 50): Position {
    return {
        x: Math.cos(time * 0.3) * radius,
        y: 30,
        z: Math.sin(time * 0.3) * radius
    };
}
