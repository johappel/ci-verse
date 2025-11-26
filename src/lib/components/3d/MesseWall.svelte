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
    import { Text, useCursor, HTML } from '@threlte/extras';
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
    
    let hoveredPosterId = $state<string | null>(null);
    let hoveredButtonId = $state<string | null>(null);
    
    // Distanz-Check wie bei InteractionPillar
    // Aktivierungsdistanz = Plattform-Größe + Puffer (User muss auf Plattform stehen)
    const ACTIVATION_DISTANCE = platformSize + 15;
    let isNearWall = $state(false);
    let frameCounter = 0;
    
    useTask(() => {
        frameCounter++;
        if (frameCounter % 6 !== 0) return; // Alle 6 Frames
        
        const camPos = $camera.position;
        const px = platformPosition[0];
        const py = platformPosition[1] + 3.3; // Augenhöhe
        const pz = platformPosition[2];
        
        const dx = camPos.x - px;
        const dy = camPos.y - py;
        const dz = camPos.z - pz;
        const distSq = dx * dx + dy * dy + dz * dz;
        const maxDistSq = ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
        
        // console.log('MesseWall Dist:', Math.sqrt(distSq).toFixed(1), 'Max:', ACTIVATION_DISTANCE, 'Near:', distSq <= maxDistSq);
        isNearWall = distSq <= maxDistSq;
    });

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
        const worldPosterZ = platformPosition[2] + posterZ + offsetWorldZ;
        
        // Kamera auf Augenhöhe (relativ zur Plattform-Oberfläche)
        const cameraY = getCameraY(platformPosition[1]);
        
        // Die Wand-Normale (lokales +Z) zeigt zur Plattform-Mitte
        // Lokales +Z nach Welt: (sin(rotY), 0, cos(rotY))
        const viewDistance = 5;
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
        {@const isHovered = hoveredPosterId === project.id}
        {@const isButtonHovered = hoveredButtonId === project.id}
        {@const displayColor = project.display?.color || project.color || '#3b82f6'}
        {@const titleFontSize = project.title.length > 20 ? 0.28 : project.title.length > 12 ? 0.32 : 0.38}
        
        <T.Group position={[x, wallHeight / 2 + 1.5, z]} rotation.y={rotY}>
            <!-- Offset für Position auf der Wand -->
            <T.Group position.x={offsetX}>
                <!-- Wandknopf unter dem Poster (ersetzt InteractionPillar) -->
                {#if project.externalUrl}
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
                                if (isNearWall && project.externalUrl) {
                                    window.open(project.externalUrl, '_blank'); 
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
                        
                        <!-- Glow-Ring (nur wenn nah) -->
                        {#if isNearWall}
                            <T.Mesh position.z={0.08} rotation.x={Math.PI / 2}>
                                <T.RingGeometry args={[0.32, 0.45, 16]} />
                                <T.MeshBasicMaterial 
                                    color={displayColor}
                                    transparent
                                    opacity={isButtonHovered ? 0.6 : 0.3}
                                />
                            </T.Mesh>
                        {/if}
                        
                        <!-- Link-Icon (🔗) -->
                        <Text
                            text="🔗"
                            fontSize={0.25}
                            anchorX="center"
                            anchorY="middle"
                            position.z={0.15}
                        />
                        
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
                                    {isNearWall ? 'Projekt öffnen →' : 'Näher kommen...'}
                                </div>
                            </HTML>
                        {/if}
                    </T.Group>
                {/if}
                
                <!-- Poster-Hintergrund (farbiger Rahmen) - QUADRATISCH -->
                <T.Mesh
                    position.z={0.2}
                    onpointerenter={() => { hoveredPosterId = project.id; onPointerEnter(); }}
                    onpointerleave={() => { hoveredPosterId = null; onPointerLeave(); }}
                    onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                >
                    <T.PlaneGeometry args={[posterSize, posterSize]} />
                    <T.MeshBasicMaterial 
                        color={isHovered ? '#ffffff' : displayColor}
                        transparent
                        opacity={isHovered ? 1 : 0.9}
                    />
                </T.Mesh>

                <!-- Poster-Inhalt (dunkel) - QUADRATISCH -->
                <T.Mesh position.z={0.22}>
                    <T.PlaneGeometry args={[posterSize * 0.9, posterSize * 0.9]} />
                    <T.MeshBasicMaterial color={isHovered ? '#1e293b' : '#0f172a'} />
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

                <!-- Hover-Tooltip rechts neben dem Poster -->
                {#if isHovered}
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
