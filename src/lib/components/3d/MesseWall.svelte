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
        imageOnly?: boolean; // Nur Bild anzeigen (keine Text-Poster, keine Buttons)
    }

    let { 
        posters,
        platformSize,
        platformColor = '#1e293b',
        wallHeight = 8,
        wallCount = 3, // Standard: 3 Wände (halbes Hexagon)
        startEdge = 3, // Standard: "hinten" (gegenüber vom Eingang)
        platformPosition = [0, 0, 0],
        platformId = '', // ID der Plattform für Aktivierungs-Check
        imageOnly = false // Nur Bild anzeigen (für Leitlinien)
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
    // imageOnly: Nur großes Bild (für Leitlinien) - Landscape 1649x906
    // Normal: Text-Poster + Bild nebeneinander
    const posterSize = 4; // Quadratische Text-Poster
    const imageOnlyWidth = 12; // Breite für imageOnly-Modus (Landscape)
    const imageOnlyHeight = 6.6; // Höhe für imageOnly (1649x906 Verhältnis)
    const maxImageWidth = posterSize * 2.2; // Landscape ist breiter (8.8)
    const combinedPosterWidth = imageOnly ? imageOnlyWidth : (posterSize + maxImageWidth + 0.5); // Max-Breite
    
    // Bei wenigen Postern: 1 Poster pro Wand, mittig platziert
    // Bei 3+ Postern: maximal 2 pro Wand (hexEdgeLength ≈ 35-45)
    const maxPostersPerWall = Math.floor(hexEdgeLength / (combinedPosterWidth + 3)); // +3 für Abstand
    const postersPerWall = Math.max(1, Math.min(maxPostersPerWall, 2)); // Max 2 pro Wand
    const posterSpacing = combinedPosterWidth + 4; // Abstand zwischen Postern
    
    const posterPositions = $derived(posters.map((poster, i) => {
        const wallIndex = Math.floor(i / postersPerWall) % wallCount;
        const positionOnWall = i % postersPerWall; // 0 oder 1
        const wall = wallPositions[wallIndex];
        
        // Wie viele Poster sind tatsächlich auf dieser Wand?
        const postersOnThisWall = posters.filter((_, idx) => 
            Math.floor(idx / postersPerWall) % wallCount === wallIndex
        ).length;
        const actualPostersOnWall = Math.min(postersOnThisWall, postersPerWall);
        
        // Berechne die tatsächliche Bildbreite für dieses Poster
        const isLandscape = poster.project.display?.posterImageFormat === 'landscape';
        const hasImage = !!poster.project.display?.posterImage;
        const imageWidth = hasImage ? (isLandscape ? posterSize * 2.2 : posterSize * 0.9) : 0;
        const imageGap = hasImage ? 0.25 : 0;
        
        // Das Bild geht nach rechts vom Text-Poster
        // Um das Paar zu zentrieren, muss das Text-Poster nach links verschoben werden
        // Zentrumverschiebung = (imageWidth + gap) / 2
        const centerCorrection = hasImage ? (imageWidth + imageGap) / 2 : 0;
        
        // Zentriere die Poster auf der Wand
        // Bei 1 Poster: mittig (offsetX = 0 - centerCorrection)
        // Bei 2 Postern: links und rechts von der Mitte
        let offsetX: number;
        if (actualPostersOnWall === 1) {
            offsetX = -centerCorrection; // Einzelnes Poster-Paar mittig
        } else {
            // Mehrere Poster: gleichmäßig verteilen
            const startOffset = -((actualPostersOnWall - 1) * posterSpacing) / 2;
            offsetX = startOffset + positionOnWall * posterSpacing - centerCorrection;
        }
        
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
        // imageOnly: Bild ist zentriert, kein Extra-Offset nötig
        // Normal: Extra Offset nach rechts (+3), um Text-Poster + Bild besser zu sehen
        const viewOffsetX = imageOnly ? offsetX : (offsetX + 3);
        const offsetWorldX = viewOffsetX * cosR;
        const offsetWorldZ = -viewOffsetX * sinR;  // Negativ wegen Three.js Koordinatensystem
        
        // Tatsächliche Poster-Position in Weltkoordinaten
        const worldPosterX = platformPosition[0] + posterX + offsetWorldX;
        const worldPosterZ = platformPosition[2] + posterZ + offsetWorldZ;
        
        // Kamera auf Augenhöhe (relativ zur Plattform-Oberfläche)
        // imageOnly: Etwas höher schauen, da Bilder tiefer hängen (Landscape-Format)
        const baseY = getCameraY(platformPosition[1]);
        const cameraY = imageOnly ? baseY - 0.5 : baseY;
        const lookAtY = imageOnly ? baseY -0.5 : baseY; // Blickpunkt etwas höher für Bildmitte
        
        // Die Wand-Normale (lokales +Z) zeigt zur Plattform-Mitte
        // Lokales +Z nach Welt: (sin(rotY), 0, cos(rotY))
        // imageOnly: Weiter weg stehen für größeres Bild
        const viewDistance = imageOnly ? 5 : 6;
        const normalX = sinR;
        const normalZ = cosR;
        
        // Kamera steht VOR dem Poster (in Richtung der Wand-Normale)
        const cameraPos = {
            x: worldPosterX + normalX * viewDistance,
            y: cameraY,
            z: worldPosterZ + normalZ * viewDistance
        };
        
        // Kamera schaut ZUM Poster
        const lookAtPos = {
            x: worldPosterX,
            y: lookAtY,
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
        {@const titleFontSize = project.title.length > 20 ? 0.24 : project.title.length > 12 ? 0.28 : 0.32}
        {@const hasImage = !!project.display?.posterImage}
        {@const isLandscape = project.display?.posterImageFormat === 'landscape'}
        {@const imageWidth = hasImage ? (isLandscape ? posterSize * 1.8 : posterSize * 0.85) : 0}
        {@const imageHeight = hasImage ? (isLandscape ? posterSize * 1.2 : posterSize * 1.28) : 0}
        {@const textWidth = posterSize * 0.95}
        {@const totalWidth = hasImage ? (textWidth + imageWidth + 0.3) : textWidth}
        {@const totalHeight = Math.max(posterSize, imageHeight)}
        
        <T.Group position={[x, wallHeight / 2 + 1.5, z]} rotation.y={rotY}>
            <!-- Offset für Position auf der Wand -->
            <T.Group position.x={offsetX}>
                
                {#if imageOnly}
                    <!-- === NUR BILD MODUS (Leitlinien) === -->
                    {#if project.display?.posterImage}
                        <!-- Großes Landscape-Bild zentriert -->
                        <T.Group>
                            <!-- Rahmen für Poster-Bild -->
                            <T.Mesh position.z={0.18}>
                                <T.PlaneGeometry args={[imageOnlyWidth + 0.2, imageOnlyHeight + 0.2]} />
                                <T.MeshBasicMaterial 
                                    color={displayColor}
                                    transparent
                                    opacity={0.8}
                                />
                            </T.Mesh>
                            
                            <!-- Poster-Bild -->
                            <T.Mesh 
                                position.z={0.2}
                                onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                            >
                                <T.PlaneGeometry args={[imageOnlyWidth, imageOnlyHeight]} />
                                <ImageMaterial 
                                    url={project.display.posterImage}
                                    transparent
                                    opacity={0.98}
                                />
                            </T.Mesh>
                        </T.Group>
                    {/if}
                {:else}
                    <!-- === NORMAL MODUS (Einheitlicher Rahmen wie ExhibitBooth) === -->
                    
                    <!-- Äußerer farbiger Rahmen um das gesamte Poster -->
                    <T.Mesh position.z={0.15}>
                        <T.BoxGeometry args={[totalWidth + 0.2, totalHeight + 0.2, 0.08]} />
                        <T.MeshBasicMaterial color={displayColor} />
                    </T.Mesh>
                    
                    <!-- Innerer dunkler Hintergrund -->
                    <T.Mesh 
                        position.z={0.2}
                        onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                    >
                        <T.PlaneGeometry args={[totalWidth, totalHeight]} />
                        <T.MeshBasicMaterial color="#0f172a" />
                    </T.Mesh>
                    
                    <!-- === TEXT-POSTER (links) === -->
                    {@const textOffsetX = hasImage ? -(totalWidth / 2 - textWidth / 2) : 0}
                    <T.Group position.x={textOffsetX}>
                        <!-- Text-Bereich Hintergrund (dezent farbig) -->
                        <T.Mesh position.z={0.21}>
                            <T.PlaneGeometry args={[textWidth, totalHeight * 0.95]} />
                            <T.MeshBasicMaterial color={displayColor} transparent opacity={0.1} />
                        </T.Mesh>
                        
                        <!-- Projekt-Titel (oben) -->
                        <Text
                            text={project.title}
                            fontSize={titleFontSize}
                            anchorX="center"
                            anchorY="top"
                            position={[0, totalHeight * 0.42, 0.25]}
                            color="#ffffff"
                            fontWeight="bold"
                            maxWidth={textWidth * 0.9}
                            textAlign="center"
                        />

                        <!-- Trennlinie unter dem Titel -->
                        <T.Mesh position={[0, totalHeight * 0.28, 0.24]}>
                            <T.PlaneGeometry args={[textWidth * 0.6, 0.02]} />
                            <T.MeshBasicMaterial color={displayColor} />
                        </T.Mesh>

                        <!-- Slogan (falls vorhanden) -->
                        {#if project.display?.slogan}
                            <Text
                                text={project.display.slogan}
                                fontSize={0.2}
                                anchorX="center"
                                anchorY="top"
                                position={[0, totalHeight * 0.22, 0.25]}
                                color={displayColor}
                                maxWidth={textWidth * 0.85}
                                textAlign="center"
                                fontStyle="italic"
                            />
                        {/if}

                        <!-- Beschreibung (shortTeaser) -->
                        {#if project.shortTeaser}
                            {@const descY = project.display?.slogan ? totalHeight * 0.02 : totalHeight * 0.14}
                            <Text
                                text={project.shortTeaser}
                                fontSize={0.16}
                                anchorX="center"
                                anchorY="top"
                                position={[0, descY, 0.25]}
                                color="#94a3b8"
                                maxWidth={textWidth * 0.85}
                                textAlign="center"
                                lineHeight={1.4}
                            />
                        {/if}

                        <!-- Klickbares Hexagon-Button unten (wie ExhibitBooth) -->
                        <T.Mesh 
                            position={[0, -totalHeight * 0.38, 0.22]}
                            onclick={() => { if (isNearWall) worldStore.selectProject(project.id); }}
                            onpointerenter={() => { hoveredButtonId = project.id; if (isNearWall) onPointerEnter(); }}
                            onpointerleave={() => { hoveredButtonId = null; onPointerLeave(); }}
                        >
                            <T.RingGeometry args={[0.22, 0.38, 6]} />
                            <T.MeshBasicMaterial 
                                color={isNearWall && isButtonHovered ? '#ffffff' : displayColor} 
                                transparent 
                                opacity={isNearWall ? (isButtonHovered ? 1 : 0.6) : 0.25} 
                            />
                        </T.Mesh>
                        <!-- Innerer Kreis des Hexagon-Buttons (auch klickbar) -->
                        <T.Mesh 
                            position={[0, -totalHeight * 0.38, 0.23]}
                            onclick={() => { if (isNearWall) worldStore.selectProject(project.id); }}
                            onpointerenter={() => { hoveredButtonId = project.id; if (isNearWall) onPointerEnter(); }}
                            onpointerleave={() => { hoveredButtonId = null; onPointerLeave(); }}
                        >
                            <T.CircleGeometry args={[0.22, 6]} />
                            <T.MeshBasicMaterial 
                                color={isNearWall && isButtonHovered ? displayColor : '#0f172a'} 
                                transparent 
                                opacity={isNearWall ? 0.9 : 0.5} 
                            />
                        </T.Mesh>
                        <!-- Info-Icon im Hexagon (keine Pointer-Events) -->
                        <Text
                            text={isNearWall ? "ℹ️" : "👁️"}
                            fontSize={0.18}
                            anchorX="center"
                            anchorY="middle"
                            position={[0, -totalHeight * 0.38, 0.24]}
                            pointerEvents="none"
                        />
                    </T.Group>
                    
                    <!-- Vertikale Trennlinie zwischen Text und Bild -->
                    {#if hasImage}
                        {@const dividerX = textOffsetX + textWidth / 2 + 0.1}
                        <T.Mesh position={[dividerX, 0, 0.22]}>
                            <T.PlaneGeometry args={[0.03, totalHeight * 0.9]} />
                            <T.MeshBasicMaterial color={displayColor} transparent opacity={0.5} />
                        </T.Mesh>
                    {/if}

                    <!-- === POSTER-BILD (rechts) === -->
                    {#if hasImage}
                        {@const imageOffsetX = totalWidth / 2 - imageWidth / 2}
                        <T.Mesh 
                            position={[imageOffsetX, 0, 0.22]}
                            onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                        >
                            <T.PlaneGeometry args={[imageWidth * 0.95, imageHeight * 0.95]} />
                            <ImageMaterial 
                                url={project.display?.posterImage || ''}
                                transparent
                                opacity={1}
                            />
                        </T.Mesh>
                    {/if}
                {/if}
            </T.Group>
        </T.Group>
    {/each}
</T.Group>
