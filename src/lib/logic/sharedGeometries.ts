/**
 * SharedGeometries - Gemeinsam genutzte Three.js Geometrien
 * 
 * Problem: Jede Komponente erstellt eigene Geometrie-Instanzen.
 * Bei vielen ähnlichen Objekten (z.B. 50 Buttons) wird viel GPU-Speicher verschwendet.
 * 
 * Lösung: Zentrale Geometrie-Bibliothek, die einmal erstellt und geteilt wird.
 * Three.js erlaubt das Sharing von Geometrien zwischen Meshes.
 */
import {
    BoxGeometry,
    PlaneGeometry,
    CylinderGeometry,
    SphereGeometry,
    RingGeometry,
    OctahedronGeometry,
    ConeGeometry
} from 'three';

// Lazy initialization - Geometrien werden erst bei Bedarf erstellt
const geometryCache = new Map<string, BoxGeometry | PlaneGeometry | CylinderGeometry | SphereGeometry | RingGeometry | OctahedronGeometry | ConeGeometry>();

/**
 * Generiert einen Cache-Key für Geometrie-Parameter
 */
function makeKey(type: string, ...args: number[]): string {
    return `${type}:${args.join(',')}`;
}

/**
 * Holt oder erstellt eine BoxGeometry
 */
export function getBoxGeometry(width = 1, height = 1, depth = 1): BoxGeometry {
    const key = makeKey('box', width, height, depth);
    let geo = geometryCache.get(key) as BoxGeometry;
    if (!geo) {
        geo = new BoxGeometry(width, height, depth);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine PlaneGeometry
 */
export function getPlaneGeometry(width = 1, height = 1): PlaneGeometry {
    const key = makeKey('plane', width, height);
    let geo = geometryCache.get(key) as PlaneGeometry;
    if (!geo) {
        geo = new PlaneGeometry(width, height);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine CylinderGeometry (Hexagon-Basis)
 */
export function getCylinderGeometry(
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 6
): CylinderGeometry {
    const key = makeKey('cylinder', radiusTop, radiusBottom, height, radialSegments);
    let geo = geometryCache.get(key) as CylinderGeometry;
    if (!geo) {
        geo = new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine SphereGeometry
 */
export function getSphereGeometry(
    radius = 1,
    widthSegments = 16,
    heightSegments = 16
): SphereGeometry {
    const key = makeKey('sphere', radius, widthSegments, heightSegments);
    let geo = geometryCache.get(key) as SphereGeometry;
    if (!geo) {
        geo = new SphereGeometry(radius, widthSegments, heightSegments);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine RingGeometry
 */
export function getRingGeometry(
    innerRadius = 0.5,
    outerRadius = 1,
    thetaSegments = 32
): RingGeometry {
    const key = makeKey('ring', innerRadius, outerRadius, thetaSegments);
    let geo = geometryCache.get(key) as RingGeometry;
    if (!geo) {
        geo = new RingGeometry(innerRadius, outerRadius, thetaSegments);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine OctahedronGeometry
 */
export function getOctahedronGeometry(radius = 1, detail = 0): OctahedronGeometry {
    const key = makeKey('octahedron', radius, detail);
    let geo = geometryCache.get(key) as OctahedronGeometry;
    if (!geo) {
        geo = new OctahedronGeometry(radius, detail);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Holt oder erstellt eine ConeGeometry
 */
export function getConeGeometry(
    radius = 1,
    height = 1,
    radialSegments = 8
): ConeGeometry {
    const key = makeKey('cone', radius, height, radialSegments);
    let geo = geometryCache.get(key) as ConeGeometry;
    if (!geo) {
        geo = new ConeGeometry(radius, height, radialSegments);
        geometryCache.set(key, geo);
    }
    return geo;
}

/**
 * Gibt die Anzahl der gecachten Geometrien zurück (für Debugging)
 */
export function getCacheSize(): number {
    return geometryCache.size;
}

/**
 * Leert den Cache (normalerweise nicht nötig)
 */
export function clearCache(): void {
    geometryCache.forEach(geo => geo.dispose());
    geometryCache.clear();
}
