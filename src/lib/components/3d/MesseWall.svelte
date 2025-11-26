<script lang="ts">
    /**
     * MesseWall - Halbtransparente Messewand am Rand der Plattform
     * 
     * Struktur:
     * - Gebogene/segmentierte Wand am Plattformrand
     * - Poster-Slots für Projekt-Plakate
     * - Halbtransparentes Material (Glas-Effekt)
     * - InteractionPillar vor jedem Poster
     * 
     * Interaktion:
     * - Klick auf Poster → Kamera fährt davor
     * - Klick auf Pillar-Knopf (bei Nähe) → Öffnet Link
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { ProjectData } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import InteractionPillar from './InteractionPillar.svelte';

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
    }

    let { 
        posters,
        platformSize,
        platformColor = '#1e293b',
        wallHeight = 8,
        wallCount = 3, // Standard: 3 Wände (halbes Hexagon)
        startEdge = 3, // Standard: "hinten" (gegenüber vom Eingang)
        platformPosition = [0, 0, 0]
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let hoveredPosterId = $state<string | null>(null);

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
        const offsetWorldX = offsetX * cosR;
        const offsetWorldZ = -offsetX * sinR;  // Negativ wegen Three.js Koordinatensystem
        
        // Tatsächliche Poster-Position in Weltkoordinaten
        const worldPosterX = platformPosition[0] + posterX + offsetWorldX;
        const worldPosterY = platformPosition[1] + wallHeight / 2 + 1.5;
        const worldPosterZ = platformPosition[2] + posterZ + offsetWorldZ;
        
        // Die Wand-Normale (lokales +Z) zeigt zur Plattform-Mitte
        // Lokales +Z nach Welt: (sin(rotY), 0, cos(rotY))
        const viewDistance = 5;
        const normalX = sinR;
        const normalZ = cosR;
        
        // Kamera steht VOR dem Poster (in Richtung der Wand-Normale)
        const cameraPos = {
            x: worldPosterX + normalX * viewDistance,
            y: worldPosterY,
            z: worldPosterZ + normalZ * viewDistance
        };
        
        // Kamera schaut ZUM Poster
        const lookAtPos = {
            x: worldPosterX,
            y: worldPosterY,
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
        {@const isHovered = hoveredPosterId === project.id}
        {@const displayColor = project.display?.color || project.color || '#3b82f6'}
        {@const titleFontSize = project.title.length > 20 ? 0.28 : project.title.length > 12 ? 0.32 : 0.38}
        {@const pillarDirX = -Math.sin(rotY)}
        {@const pillarDirZ = -Math.cos(rotY)}
        
        <T.Group position={[x, wallHeight / 2 + 1.5, z]} rotation.y={rotY}>
            <!-- Offset für Position auf der Wand -->
            <T.Group position.x={offsetX}>
                <!-- InteractionPillar vor dem Poster -->
                <!-- Berechne Welt-Position für den Pillar -->
                {@const pillarLocalZ = 3}
                {@const cosR = Math.cos(rotY)}
                {@const sinR = Math.sin(rotY)}
                <!-- Lokales X → Welt: (cos, 0, -sin), Lokales Z → Welt: (sin, 0, cos) -->
                {@const pillarWorldX = platformPosition[0] + x + offsetX * cosR + pillarLocalZ * sinR}
                {@const pillarWorldZ = platformPosition[2] + z - offsetX * sinR + pillarLocalZ * cosR}
                <InteractionPillar 
                    {project}
                    position={[0, -wallHeight / 2 - 0.3, pillarLocalZ]}
                    height={1.0}
                    worldPosition={[pillarWorldX, platformPosition[1] + 1.2, pillarWorldZ]}
                />
                
                <!-- Poster-Hintergrund (farbiger Rahmen) - QUADRATISCH -->
                <T.Mesh
                    position.z={0.2}
                    onpointerenter={() => { hoveredPosterId = project.id; onPointerEnter(); }}
                    onpointerleave={() => { hoveredPosterId = null; onPointerLeave(); }}
                    onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                >
                    <T.PlaneGeometry args={[posterSize, posterSize]} />
                    <T.MeshBasicMaterial 
                        color={displayColor}
                        transparent
                        opacity={isHovered ? 1 : 0.9}
                    />
                </T.Mesh>

                <!-- Poster-Inhalt (dunkel) - QUADRATISCH -->
                <T.Mesh position.z={0.21}>
                    <T.PlaneGeometry args={[posterSize * 0.9, posterSize * 0.9]} />
                    <T.MeshBasicMaterial color="#0f172a" />
                </T.Mesh>

                <!-- Projekt-Titel - dynamische Schriftgröße -->
                <Text
                    text={project.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, posterSize * 0.35, 0.25]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={posterSize * 0.75}
                    textAlign="center"
                />

                <!-- Slogan (falls vorhanden) -->
                {#if project.display?.slogan}
                    <Text
                        text={project.display.slogan}
                        fontSize={0.22}
                        anchorX="center"
                        anchorY="middle"
                        position={[0, -0.2, 0.25]}
                        color={displayColor}
                        maxWidth={posterSize * 0.75}
                        textAlign="center"
                        fontStyle="italic"
                    />
                {/if}

                <!-- "Mehr erfahren" Link-Hinweis -->
                <Text
                    text="→ Mehr erfahren"
                    fontSize={0.18}
                    anchorX="center"
                    anchorY="bottom"
                    position={[0, -posterSize * 0.38, 0.25]}
                    color={isHovered ? '#ffffff' : '#64748b'}
                />

                <!-- Hover-Glow -->
                {#if isHovered}
                    <T.Mesh position.z={0.15}>
                        <T.PlaneGeometry args={[posterSize + 0.2, posterSize + 0.2]} />
                        <T.MeshBasicMaterial 
                            color={displayColor}
                            transparent
                            opacity={0.3}
                        />
                    </T.Mesh>
                    
                    <!-- Hover-Tooltip rechts neben dem Poster, höher positioniert -->
                    <HTML position={[posterSize * 0.7, posterSize * 0.3, 0.3]} center={false}>
                        <div style="
                            background: #ffffff;
                            color: #0f172a;
                            padding: 16px 20px;
                            border-radius: 8px;
                            width: 220px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                            border-left: 4px solid {displayColor};
                        ">
                            <h3 style="font-weight: 700; font-size: 0.95rem; margin: 0 0 8px 0; color: #0f172a;">
                                {project.title}
                            </h3>
                            {#if project.shortTeaser}
                                <p style="font-size: 0.8rem; color: #374151; line-height: 1.5; margin: 0 0 10px 0;">
                                    {project.shortTeaser}
                                </p>
                            {/if}
                            <p style="font-size: 0.7rem; color: {displayColor}; margin: 0; font-weight: 500;">
                                Klicken zum Heranfahren →
                            </p>
                        </div>
                    </HTML>
                {/if}
            </T.Group>
        </T.Group>
    {/each}
</T.Group>
