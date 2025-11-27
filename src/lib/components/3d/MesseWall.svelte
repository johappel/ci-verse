<script lang="ts">
    /**
     * MesseWall - Halbtransparente Messewand am Rand der Plattform
     * 
     * Struktur:
     * - Gebogene/segmentierte Wand am Plattformrand
     * - Poster-Slots für Projekt-Plakate
     * - Halbtransparentes Material (Glas-Effekt)
     * - Wandknopf unter jedem Poster für Link
     * 
     * Interaktion:
     * - Klick auf Poster → Kamera fährt davor
     * - Klick auf Wandknopf → Öffnet externe URL
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { Text, useCursor, HTML, ImageMaterial } from '@threlte/extras';
    import { BadgeInfo } from 'lucide-svelte';
    import type { ProjectData } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';

    interface WallPoster {
        project: ProjectData;
        position: number; // 0-5 für Position entlang der Wand
    }

    interface Props {
        posters: WallPoster[];
        platformSize: number;
        platformColor?: string;
        wallHeight?: number;
        wallCount?: number; // Anzahl der Wände (1-6, entspricht Hexagon-Kanten)
        startEdge?: number; // Welche Hexagon-Kante als Start (0-5)
        platformPosition?: [number, number, number]; // Welt-Position der Plattform
        platformId?: string; // ID der Plattform für Aktivierungs-Check
    }

    let { 
        posters,
        platformSize,
        platformColor = '#1e293b',
        wallHeight = 8,
        wallCount = 3, // Standard: 3 Wände (halbes Hexagon)
        startEdge = 3, // Standard: "hinten" (gegenüber vom Eingang)
        platformPosition = [0, 0, 0],
        platformId = '' // ID der Plattform für Aktivierungs-Check
    }: Props = $props();

    const { camera } = useThrelte();
    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let hoveredButtonId = $state<string | null>(null);
    
    // Distanz-Check: Wie nah ist die Kamera an den Wänden?
    // Aktivierung nur wenn Kamera nahe genug an einer Wand ist
    const WALL_ACTIVATION_DISTANCE = 12; // Distanz zur Wand für Aktivierung
    let isNearWall = $state(false);
    let frameCounter = 0;
    
    // Hexagon-Geometrie: Kantenlänge = Radius
    const hexEdgeLength = platformSize; // Kantenlänge des Hexagons
    const hexInnerRadius = platformSize * Math.cos(Math.PI / 6); // Apothem (Abstand Mitte zu Kante)
    
    // Wände entlang der Hexagon-Kanten
    // Jede Kante ist um 60° (π/3) versetzt
    const edgeAngleStep = Math.PI / 3; // 60°
    
    // Korrektur: Plattform ist um 30° rotiert (rotation.y = Math.PI / 6)
    const platformRotationOffset = Math.PI / 6;

    // Berechne Wand-Positionen (Mittelpunkt jeder Hexagon-Kante)
    const wallPositions = $derived(
        Array.from({ length: wallCount }, (_, i) => {
            const edgeIndex = (startEdge + i) % 6;
            // Winkel zur Kantenmitte (senkrecht zur Kante, von Mitte nach außen)
            const angleToEdge = edgeIndex * edgeAngleStep + platformRotationOffset;
            
            return {
                edgeIndex,
                // Position: auf der Kante, Abstand = Apothem (innerer Radius)
                x: Math.cos(angleToEdge) * hexInnerRadius * 0.98,
                z: Math.sin(angleToEdge) * hexInnerRadius * 0.98,
                // Rotation: Wand steht parallel zur Kante, zeigt nach innen
                rotY: -angleToEdge - Math.PI / 2
            };
        })
    );
    
    useTask(() => {
        frameCounter++;
        if (frameCounter % 6 !== 0) return; // Alle 6 Frames
        
        const camPos = $camera.position;
        const px = platformPosition[0];
        const py = platformPosition[1];
        const pz = platformPosition[2];
        
        // Berechne minimale Distanz zu einer der Wände
        let minDistSq = Infinity;
        for (const wall of wallPositions) {
            // Wand-Position in Weltkoordinaten
            const wallWorldX = px + wall.x;
            const wallWorldZ = pz + wall.z;
            
            const dx = camPos.x - wallWorldX;
            const dz = camPos.z - wallWorldZ;
            const distSq = dx * dx + dz * dz; // Nur horizontale Distanz
            
            if (distSq < minDistSq) {
                minDistSq = distSq;
            }
        }
        
        const maxDistSq = WALL_ACTIVATION_DISTANCE * WALL_ACTIVATION_DISTANCE;
        isNearWall = minDistSq <= maxDistSq;
    });

    // Poster auf die Wände verteilen (mehrere pro Wand möglich)
    // Berechne wie viele Poster pro Wand und deren Position
    const posterSize = 4; // Quadratische Poster
    const postersPerWall = 3; // Max 3 Poster pro Wand
    const posterSpacing = hexEdgeLength * 0.9 / postersPerWall; // Abstand zwischen Postern
    
    const posterPositions = $derived(posters.map((poster, i) => {
        const wallIndex = Math.floor(i / postersPerWall) % wallCount;
        const positionOnWall = i % postersPerWall; // 0, 1, oder 2
        const wall = wallPositions[wallIndex];
        
        // Horizontale Offset-Position auf der Wand (-1, 0, 1) * spacing
        const totalPostersOnThisWall = Math.min(
            posters.filter((_, idx) => Math.floor(idx / postersPerWall) % wallCount === wallIndex).length,
            postersPerWall
        );
        const offsetX = (positionOnWall - (totalPostersOnThisWall - 1) / 2) * posterSpacing;
        
        return {
            ...poster,
            wallIndex,
            positionOnWall,
            offsetX,
            ...wall
        };
    }));

    // Klick auf Poster: Kamera fährt davor
    function handlePosterClick(posterX: number, posterZ: number, wallRotY: number, offsetX: number) {
        // Die Wand ist bei (posterX, posterZ) positioniert und um wallRotY rotiert
        // Das Poster hat einen zusätzlichen offsetX entlang der lokalen X-Achse der Wand
        
        // Bei Y-Rotation: lokale X-Achse → Welt-Koordinaten
        // Lokales X nach Welt: (cos(rotY), 0, -sin(rotY)) - ACHTUNG: Three.js Y-Rotation ist gegen Uhrzeigersinn
        // Also: weltX = lokalX * cos(rotY), weltZ = lokalX * (-sin(rotY))
        const cosR = Math.cos(wallRotY);
        const sinR = Math.sin(wallRotY);
        
        // Offset von der Wand-Mitte zum Poster (in Weltkoordinaten)
        // Extra Offset nach rechts (+3), um Text-Poster + Bild besser zu sehen
        const viewOffsetX = offsetX + 3;
        const offsetWorldX = viewOffsetX * cosR;
        const offsetWorldZ = -viewOffsetX * sinR;  // Negativ wegen Three.js Koordinatensystem
        
        // Tatsächliche Poster-Position in Weltkoordinaten
        const worldPosterX = platformPosition[0] + posterX + offsetWorldX;
        const worldPosterZ = platformPosition[2] + posterZ + offsetWorldZ;
        
        // Kamera auf Augenhöhe (relativ zur Plattform-Oberfläche)
        const cameraY = getCameraY(platformPosition[1]);
        
        // Die Wand-Normale (lokales +Z) zeigt zur Plattform-Mitte
        // Lokales +Z nach Welt: (sin(rotY), 0, cos(rotY))
        const viewDistance = 6; // Nah genug für Wandknopf-Aktivierung (< WALL_ACTIVATION_DISTANCE)
        const normalX = sinR;
        const normalZ = cosR;
        
        // Kamera steht VOR dem Poster (in Richtung der Wand-Normale)
        const cameraPos = {
            x: worldPosterX + normalX * viewDistance,
            y: cameraY,
            z: worldPosterZ + normalZ * viewDistance
        };
        
        // Kamera schaut ZUM Poster (auf Augenhöhe)
        const lookAtPos = {
            x: worldPosterX,
            y: cameraY,
            z: worldPosterZ
        };
        
        worldStore.setViewTarget(cameraPos, lookAtPos);
    }
</script>

<T.Group>
    <!-- Wand-Segmente entlang der Hexagon-Kanten -->
    {#each wallPositions as wall, i}
        <T.Mesh
            position={[wall.x, wallHeight / 2 + 1.5, wall.z]}
            rotation.y={wall.rotY}
            receiveShadow
        >
            <!-- Breite = Hexagon-Kantenlänge -->
            <T.BoxGeometry args={[
                hexEdgeLength * 0.95, // Etwas kleiner als volle Kante
                wallHeight,
                0.3
            ]} />
            <T.MeshPhysicalMaterial
                color={platformColor}
                transparent
                opacity={0.3}
                metalness={0.1}
                roughness={0.1}
                transmission={0.6}
                thickness={0.3}
            />
        </T.Mesh>
        
        <!-- Rahmen oben -->
        <T.Mesh
            position={[wall.x, wallHeight + 1.5, wall.z]}
            rotation.y={wall.rotY}
        >
            <T.BoxGeometry args={[hexEdgeLength * 0.95, 0.15, 0.35]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
        </T.Mesh>
        
        <!-- Rahmen unten -->
        <T.Mesh
            position={[wall.x, 1.5, wall.z]}
            rotation.y={wall.rotY}
        >
            <T.BoxGeometry args={[hexEdgeLength * 0.95, 0.15, 0.35]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
        </T.Mesh>
    {/each}

    <!-- Poster auf der Wand -->
    {#each posterPositions as { project, x, z, rotY, offsetX }}
        {@const isButtonHovered = hoveredButtonId === project.id}
        {@const displayColor = project.display?.color || project.color || '#3b82f6'}
        {@const titleFontSize = project.title.length > 20 ? 0.28 : project.title.length > 12 ? 0.32 : 0.38}
        
        <T.Group position={[x, wallHeight / 2 + 1.5, z]} rotation.y={rotY}>
            <!-- Offset für Position auf der Wand -->
            <T.Group position.x={offsetX}>
                <!-- Wandknopf unter dem Poster - öffnet ProjectCard -->
                <T.Group position={[0, -posterSize / 2 - 0.8, 0.25]}>
                        <!-- Knopf-Gehäuse (flach an der Wand) -->
                        <T.Mesh rotation.x={Math.PI / 2}>
                            <T.CylinderGeometry args={[0.4, 0.4, 0.15, 8]} />
                            <T.MeshStandardMaterial 
                                color={isNearWall ? '#1e293b' : '#0f172a'}
                                metalness={0.5}
                                roughness={0.5}
                            />
                        </T.Mesh>
                        
                        <!-- Leuchtender Knopf -->
                        <T.Mesh 
                            position.z={0.12}
                            onclick={() => { 
                                if (isNearWall) {
                                    worldStore.selectProject(project.id); 
                                }
                            }}
                            onpointerenter={() => { hoveredButtonId = project.id; if (isNearWall) onPointerEnter(); }}
                            onpointerleave={() => { hoveredButtonId = null; onPointerLeave(); }}
                        >
                            <T.CircleGeometry args={[0.3, 16]} />
                            <T.MeshBasicMaterial 
                                color={isNearWall ? displayColor : '#475569'}
                                transparent
                                opacity={isButtonHovered ? 1 : 0.8}
                            />
                        </T.Mesh>
                        
                        <!-- Glow-Ring (nur wenn nah) - direkt an der Wand -->
                        {#if isNearWall}
                            <T.Mesh position.z={0.01}>
                                <T.RingGeometry args={[0.35, 0.55, 16]} />
                                <T.MeshBasicMaterial 
                                    color={displayColor}
                                    transparent
                                    opacity={isButtonHovered ? 0.6 : 0.3}
                                />
                            </T.Mesh>
                        {/if}
                        
                        <!-- Info-Icon (Lucide BadgeInfo) -->
                        <HTML position={[0, 0, 0.15]} center transform scale={0.6}>
                            <BadgeInfo 
                                size={24} 
                                strokeWidth={2}
                                color={isNearWall ? '#ffffff' : '#94a3b8'}
                            />
                        </HTML>
                        
                        <!-- Hover-Tooltip (immer bei Hover, unterschiedlicher Text) -->
                        {#if isButtonHovered}
                            <HTML position={[0.8, 0.3, 0]} center={false} transform={false}>
                                <div style="
                                    background: {isNearWall ? '#ffffff' : 'rgba(15, 23, 42, 0.9)'};
                                    color: {isNearWall ? '#0f172a' : '#94a3b8'};
                                    padding: 6px 10px;
                                    border-radius: 4px;
                                    font-size: 0.75rem;
                                    font-weight: 600;
                                    white-space: nowrap;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                    border-bottom: 2px solid {isNearWall ? displayColor : '#475569'};
                                ">
                                    {isNearWall ? 'Details anzeigen' : 'Näher kommen...'}
                                </div>
                            </HTML>
                        {/if}
                    </T.Group>
                
                <!-- === TEXT-POSTER (Hauptelement) === -->
                <!-- Poster-Hintergrund (farbiger Rahmen) - QUADRATISCH -->
                <T.Mesh
                    position.z={0.2}
                    onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                >
                    <T.PlaneGeometry args={[posterSize, posterSize]} />
                    <T.MeshBasicMaterial 
                        color={displayColor}
                        transparent
                        opacity={0.9}
                    />
                </T.Mesh>

                <!-- Poster-Inhalt (dunkel) -->
                <T.Mesh position.z={0.22}>
                    <T.PlaneGeometry args={[posterSize * 0.9, posterSize * 0.9]} />
                    <T.MeshBasicMaterial color="#0f172a" />
                </T.Mesh>

                <!-- Projekt-Titel -->
                <Text
                    text={project.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, posterSize * 0.38, 0.25]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={posterSize * 0.8}
                    textAlign="center"
                />

                <!-- Trennlinie unter dem Titel -->
                <T.Mesh position={[0, posterSize * 0.18, 0.24]}>
                    <T.PlaneGeometry args={[posterSize * 0.6, 0.02]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>

                <!-- Beschreibung (shortTeaser) -->
                {#if project.shortTeaser}
                    <Text
                        text={project.shortTeaser}
                        fontSize={0.18}
                        anchorX="center"
                        anchorY="top"
                        position={[0, posterSize * 0.12, 0.25]}
                        color="#cbd5e1"
                        maxWidth={posterSize * 0.75}
                        textAlign="center"
                        lineHeight={1.4}
                    />
                {/if}

                <!-- Slogan (falls vorhanden) - unten -->
                {#if project.display?.slogan}
                    <Text
                        text={project.display.slogan}
                        fontSize={0.2}
                        anchorX="center"
                        anchorY="bottom"
                        position={[0, -posterSize * 0.32, 0.25]}
                        color={displayColor}
                        maxWidth={posterSize * 0.75}
                        textAlign="center"
                        fontStyle="italic"
                    />
                {/if}

                <!-- === GROẞFLÄCHIGES POSTER-BILD NEBEN DEM TEXT-POSTER === -->
                {#if project.display?.posterImage}
                    {@const imageWidth = posterSize * 1.2}
                    {@const imageHeight = posterSize * 1.8}
                    
                    <!-- Poster-Bild rechts neben dem Text-Poster -->
                    <T.Group position.x={posterSize * 0.5 + imageWidth * 0.5 + 0.3}>
                        <!-- Rahmen für Poster-Bild -->
                        <T.Mesh position.z={0.18}>
                            <T.PlaneGeometry args={[imageWidth + 0.2, imageHeight + 0.2]} />
                            <T.MeshBasicMaterial 
                                color={displayColor}
                                transparent
                                opacity={0.8}
                            />
                        </T.Mesh>
                        
                        <!-- Poster-Bild (hochformat 800x1200) -->
                        <T.Mesh 
                            position.z={0.2}
                            onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                        >
                            <T.PlaneGeometry args={[imageWidth, imageHeight]} />
                            <ImageMaterial 
                                url={project.display.posterImage}
                                transparent
                                opacity={0.95}
                            />
                        </T.Mesh>
                    </T.Group>
                {/if}
            </T.Group>
        </T.Group>
    {/each}
</T.Group>
