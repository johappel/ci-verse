/**
 * Viewpoints - Zentrale API für Kamera-Positionierung
 * 
 * Berechnet die optimale Kamera-Position und Blickziel für jedes Projekt/Poster.
 * Synchronisiert mit den tatsächlichen 3D-Komponenten (Platform.svelte, ExhibitBooth.svelte, MesseWall.svelte).
 */

import type { ProjectData } from '$lib/types/project';
import { platforms, getCameraY } from './platforms';
import { 
    getBoothProjectsForPlatform, 
    getWallPostersForPlatform, 
    getMarketplaceContent 
} from '$lib/data/mockProjects';

export interface ViewPoint {
    camera: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    distance: number;
}

/**
 * Berechnet den ViewPoint für ein Projekt auf einer Plattform
 * 
 * @param projectId - ID des Projekts
 * @param displayType - 'booth' oder 'wall'
 * @param platformId - ID der Plattform (S, B1, B2, B3, Q1, Q2, Q3)
 * @returns ViewPoint mit Kamera-Position und Blickziel
 */
export function getViewPoint(
    projectId: string,
    displayType: 'booth' | 'wall',
    platformId: string
): ViewPoint | null {
    const platform = platforms[platformId];
    if (!platform) return null;

    const px = platform.x;
    const py = platform.y;
    const pz = platform.z;
    const platformSize = platform.size;

    if (displayType === 'booth') {
        return getBoothViewPoint(projectId, platformId, px, py, pz, platformSize);
    } else {
        return getWallViewPoint(projectId, platformId, px, py, pz, platformSize);
    }
}

/**
 * Berechnet ViewPoint für einen Exhibit-Booth
 * Synchronisiert mit Platform.svelte (Zeilen 320-380)
 */
function getBoothViewPoint(
    projectId: string,
    platformId: string,
    px: number,
    py: number,
    pz: number,
    platformSize: number
): ViewPoint | null {
    const booths = getBoothProjectsForPlatform(platformId);
    const boothIndex = booths.findIndex(p => p.id === projectId);
    if (boothIndex === -1) return null;

    const boothCount = booths.length;

    // Layout-System aus Platform.svelte (Zeilen 323-370)
    const sectorSize = (2 * Math.PI) / 6;
    const hexRotation = Math.PI / 6;
    const usedSectors = 4;
    const startSector = 2;
    const usedArcSize = usedSectors * sectorSize;
    const startAngle = startSector * sectorSize + hexRotation;
    const angleSpread = usedArcSize * 0.85;

    // NEU: Dreiergruppen-Logik synchronisiert mit Platform.svelte
    const useTriangleGroups = boothCount >= 6;
    const completeTripleCount = Math.floor(boothCount / 3);
    const boothsInTriples = completeTripleCount * 3;
    
    // Ist dieser Booth in einer Dreiergruppe oder ein Rest-Booth?
    const isInTripleGroup = useTriangleGroups && boothIndex < boothsInTriples;
    const isRestBooth = useTriangleGroups && boothIndex >= boothsInTriples;

    // Rest-Booths: Index relativ zu den Rest-Booths
    const restBoothIndex = isRestBooth ? boothIndex - boothsInTriples : 0;
    const restBoothCount = boothCount - boothsInTriples;

    let boothX: number, boothZ: number, boothRotation: number;

    if (isInTripleGroup) {
        // --- DREIERGRUPPEN-LOGIK (synchronisiert mit Platform.svelte) ---
        const groupIndex = Math.floor(boothIndex / 3);
        const posInGroup = boothIndex % 3;
        const totalGroups = completeTripleCount + (restBoothCount > 0 ? 1 : 0);

        // Gruppen-Winkel (mit Rest-Gruppen berücksichtigt)
        const groupAngle = (completeTripleCount === 1 && restBoothCount === 0)
            ? startAngle + angleSpread / 2
            : startAngle + (groupIndex / (totalGroups - 1)) * angleSpread;

        // Dreieck-Formation (gegen den Uhrzeigersinn: A → B → C)
        const triangleRadius = 2.5;
        const triangleAngles = [0, -2.0944, -4.1888]; // 0°, -120°, -240°

        const localAngle = triangleAngles[posInGroup];
        const localX = Math.cos(groupAngle + localAngle) * triangleRadius;
        const localZ = Math.sin(groupAngle + localAngle) * triangleRadius;

        // Welt-Position
        const baseRadius = platformSize * 0.48;
        const centerX = Math.cos(groupAngle) * baseRadius;
        const centerZ = Math.sin(groupAngle) * baseRadius;

        boothX = centerX + localX;
        boothZ = centerZ + localZ;

        // Rotation: Booth zeigt nach INNEN zum Dreieck-Zentrum
        boothRotation = -(groupAngle + localAngle) + Math.PI / 2 + Math.PI;
    } else if (isRestBooth) {
        // --- REST-BOOTH-LOGIK (synchronisiert mit Platform.svelte) ---
        // Rest-Booths werden einzeln positioniert, zwischen die Dreiergruppen verteilt
        const totalGroups = completeTripleCount + (restBoothCount > 0 ? 1 : 0);
        const groupAngle = startAngle + ((completeTripleCount + restBoothIndex * 0.5) / (totalGroups - 0.5)) * angleSpread;

        const baseRadius = platformSize * 0.45;
        boothX = Math.cos(groupAngle) * baseRadius;
        boothZ = Math.sin(groupAngle) * baseRadius;

        // Rotation: Rest-Booth zeigt zur Plattform-Mitte
        boothRotation = -groupAngle + Math.PI / 2;
    } else {
        // --- EINZELN (weniger als 6 Booths) ---
        const groupAngle = boothCount === 1
            ? startAngle + angleSpread / 2
            : startAngle + (boothIndex / (boothCount - 1)) * angleSpread;

        const baseRadius = platformSize * 0.45;
        boothX = Math.cos(groupAngle) * baseRadius;
        boothZ = Math.sin(groupAngle) * baseRadius;

        // Rotation: Booth zeigt zur Plattform-Mitte
        boothRotation = -groupAngle + Math.PI / 2;
    }

    // Welt-Koordinaten
    const worldBoothX = px + boothX;
    const worldBoothZ = pz + boothZ;

    // Kamera-Position
    const viewDistance = 5;
    const cos = Math.cos(boothRotation);
    const sin = Math.sin(boothRotation);
    
    // Kamera-Offset: VOR der Booth (in Blickrichtung)
    // Dreiergruppen: Kamera muss nach außen (invertiert)
    // Rest-Booths & Einzelne: Kamera muss nach außen (auch invertiert, da sie zur Mitte zeigen)
    // Die Formel bleibt gleich, weil boothRotation bereits korrekt ist
    const worldOffsetX = -viewDistance * sin;
    const worldOffsetZ = -viewDistance * cos;

    // Banner-Höhe
    const boothHeight = 3.5; // Aus ExhibitBooth.svelte (s.height)
    const bannerCenterY = py + 3.5 + boothHeight / 2 + 0.3;

    return {
        camera: {
            x: worldBoothX + worldOffsetX,
            y: bannerCenterY,
            z: worldBoothZ + worldOffsetZ
        },
        target: {
            x: worldBoothX,
            y: bannerCenterY,
            z: worldBoothZ
        },
        distance: viewDistance
    };
}

/**
 * Berechnet ViewPoint für ein Wall-Poster
 * Synchronisiert mit MesseWall.svelte (Zeilen 50-150)
 */
function getWallViewPoint(
    projectId: string,
    platformId: string,
    px: number,
    py: number,
    pz: number,
    platformSize: number
): ViewPoint | null {
    const walls = getWallPostersForPlatform(platformId);
    const posterIndex = walls.findIndex(w => w.project.id === projectId);
    if (posterIndex === -1) return null;

    // Hexagon-Geometrie (aus MesseWall.svelte)
    const hexInnerRadius = platformSize * Math.cos(Math.PI / 6);
    const hexEdgeLength = platformSize;
    const edgeAngleStep = Math.PI / 3; // 60°
    const platformRotationOffset = Math.PI / 6;

    // Wall-Konfiguration (aus Platform.svelte)
    const wallCount = Math.min(Math.ceil(walls.length / 2), 6);
    const startEdge = 3;
    const postersPerWall = 2;

    // Auf welcher Wand ist das Poster?
    const wallIndex = Math.floor(posterIndex / postersPerWall) % wallCount;
    const positionOnWall = posterIndex % postersPerWall;

    // Wand-Position
    const edgeIndex = (startEdge + wallIndex) % 6;
    const angleToEdge = edgeIndex * edgeAngleStep + platformRotationOffset;

    const wallX = Math.cos(angleToEdge) * hexInnerRadius * 0.98;
    const wallZ = Math.sin(angleToEdge) * hexInnerRadius * 0.98;
    const wallRotY = -angleToEdge - Math.PI / 2;

    // Poster-Spacing
    const wallHeight = 10;
    const posterHeight = wallHeight * 0.85;
    const maxImageWidth = posterHeight * 1.2;
    const textAreaWidth = posterHeight * 0.5;
    const maxPosterWidth = textAreaWidth + maxImageWidth + 0.8;
    const idealSpacing = maxPosterWidth + 4;
    const minSpacingFor2 = hexEdgeLength / 2.2;
    const posterSpacing = Math.max(maxPosterWidth + 1, Math.min(idealSpacing, minSpacingFor2));

    // Wie viele Poster sind auf dieser Wand?
    const postersOnThisWall = walls.filter((_, idx) =>
        Math.floor(idx / postersPerWall) % wallCount === wallIndex
    ).length;
    const actualOnWall = Math.min(postersOnThisWall, postersPerWall);

    // Offset auf der Wand
    let offsetX = 0;
    if (actualOnWall === 1) {
        offsetX = 0; // Einzelnes Poster mittig
    } else {
        const totalWidth = (actualOnWall - 1) * posterSpacing;
        offsetX = -totalWidth / 2 + positionOnWall * posterSpacing;
    }

    // Offset in Weltkoordinaten
    const cosR = Math.cos(wallRotY);
    const sinR = Math.sin(wallRotY);
    const offsetWorldX = offsetX * cosR;
    const offsetWorldZ = -offsetX * sinR;

    // Welt-Position des Posters
    const worldPosterX = px + wallX + offsetWorldX;
    const worldPosterZ = pz + wallZ + offsetWorldZ;

    // Kamera-Position
    const cameraY = getCameraY(py);
    const viewDistance = 6;
    const normalX = sinR;
    const normalZ = cosR;

    return {
        camera: {
            x: worldPosterX + normalX * viewDistance,
            y: cameraY,
            z: worldPosterZ + normalZ * viewDistance
        },
        target: {
            x: worldPosterX,
            y: cameraY,
            z: worldPosterZ
        },
        distance: viewDistance
    };
}

/**
 * Spezielle ViewPoints für Marktplatz (Plattform S)
 */
export function getMarketplaceViewPoint(
    type: 'reception' | 'leitlinie',
    index: number = 0
): ViewPoint | null {
    const platform = platforms['S'];
    if (!platform) return null;

    const px = platform.x;
    const py = platform.y;
    const pz = platform.z;

    if (type === 'reception') {
        return getReceptionWallViewPoint(px, py, pz);
    } else {
        return getLeitlinieViewPoint(index, px, py, pz, platform.size);
    }
}

/**
 * ViewPoint für ReceptionWall auf Marktplatz
 */
function getReceptionWallViewPoint(
    px: number,
    py: number,
    pz: number
): ViewPoint {
    const receptionWallPosition = { x: -1, z: -30, rotation: Math.PI * 2.0 };

    const worldX = px + receptionWallPosition.x;
    const worldZ = pz + receptionWallPosition.z;
    const rotation = receptionWallPosition.rotation;

    const viewDistance = 9;
    const cameraY = getCameraY(py);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    return {
        camera: {
            x: worldX + sin * viewDistance,
            y: cameraY,
            z: worldZ + cos * viewDistance
        },
        target: {
            x: worldX,
            y: cameraY,
            z: worldZ
        },
        distance: viewDistance
    };
}

/**
 * ViewPoint für Leitlinien-Poster auf Marktplatz
 */
function getLeitlinieViewPoint(
    posterIndex: number,
    px: number,
    py: number,
    pz: number,
    platformSize: number
): ViewPoint | null {
    const marketplace = getMarketplaceContent();
    if (posterIndex >= marketplace.wallPosters.length) return null;

    // Linke Wände: 0-3 (startEdge=5, wallCount=2)
    // Rechte Wand: 4-5 (startEdge=1, wallCount=1)
    const side = posterIndex < 4 ? 'left' : 'right';
    const localIndex = side === 'left' ? posterIndex : posterIndex - 4;

    const hexInnerRadius = platformSize * Math.cos(Math.PI / 6);
    const hexEdgeLength = platformSize;
    const edgeAngleStep = Math.PI / 3;
    const platformRotationOffset = Math.PI / 6;

    const startEdge = side === 'left' ? 5 : 1;
    const wallCount = side === 'left' ? 2 : 1;
    const postersPerWall = 2;

    const wallIndex = Math.floor(localIndex / postersPerWall) % wallCount;
    const positionOnWall = localIndex % postersPerWall;

    const edgeIndex = (startEdge + wallIndex) % 6;
    const angleToEdge = edgeIndex * edgeAngleStep + platformRotationOffset;

    const wallX = Math.cos(angleToEdge) * hexInnerRadius * 0.98;
    const wallZ = Math.sin(angleToEdge) * hexInnerRadius * 0.98;
    const wallRotY = -angleToEdge - Math.PI / 2;

    // Poster-Spacing (imageOnly-Modus)
    const imageOnlyWidth = 12;
    const posterSpacing = imageOnlyWidth + 2;

    const totalPosters = side === 'left' ? 4 : 2;
    const postersOnThisWall = Math.min(2, totalPosters - wallIndex * 2);

    let offsetX = 0;
    if (postersOnThisWall > 1) {
        const totalWidth = (postersOnThisWall - 1) * posterSpacing;
        offsetX = -totalWidth / 2 + positionOnWall * posterSpacing;
    }

    const cosR = Math.cos(wallRotY);
    const sinR = Math.sin(wallRotY);
    const offsetWorldX = offsetX * cosR;
    const offsetWorldZ = -offsetX * sinR;

    const worldPosterX = px + wallX + offsetWorldX;
    const worldPosterZ = pz + wallZ + offsetWorldZ;

    const cameraY = getCameraY(py);
    const viewDistance = 8;
    const normalX = sinR;
    const normalZ = cosR;

    return {
        camera: {
            x: worldPosterX + normalX * viewDistance,
            y: cameraY,
            z: worldPosterZ + normalZ * viewDistance
        },
        target: {
            x: worldPosterX,
            y: cameraY,
            z: worldPosterZ
        },
        distance: viewDistance
    };
}

/**
 * ViewPoint für InfoHexagon (Plattform-Zentrum)
 */
export function getCenterViewPoint(platformId: string): ViewPoint | null {
    const platform = platforms[platformId];
    if (!platform) return null;

    const px = platform.x;
    const py = platform.y;
    const pz = platform.z;

    const cameraY = getCameraY(py);

    return {
        camera: {
            x: px,
            y: cameraY,
            z: pz + 18
        },
        target: {
            x: px,
            y: py + 3,
            z: pz
        },
        distance: 18
    };
}
