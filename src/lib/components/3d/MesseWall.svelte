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
    const posterHeight = wallHeight * 0.85; // Höhe nutzt 85% der Wandhöhe
    const imageOnlyWidth = 12; // Breite für imageOnly-Modus (Landscape)
    const imageOnlyHeight = 6.6; // Höhe für imageOnly (1649x906 Verhältnis)
    
    // Maximale Poster-Breite für Spacing (Landscape ist der breiteste Fall)
    // Portrait: 0.55, Square: 0.85, Landscape: 1.2
    const maxImageWidth = posterHeight * 1.2; // Landscape-Breite als Maximum
    const textAreaWidth = posterHeight * 0.5; // Text-Bereich
    const maxPosterWidth = imageOnly ? imageOnlyWidth : (textAreaWidth + maxImageWidth + 0.8); // +0.8 für Rahmen/Gap
    
    // Spacing basiert auf maximaler Breite, damit keine Überlappung entsteht
    // Bei kleineren Plattformen wird der Spacing reduziert, um 2 Poster zu ermöglichen
    const idealSpacing = maxPosterWidth + 4; // Idealer Abstand
    const minSpacingFor2 = hexEdgeLength / 2.2; // Minimaler Spacing um 2 Poster zu ermöglichen
    const posterSpacing = Math.max(maxPosterWidth + 1, Math.min(idealSpacing, minSpacingFor2));
    
    // Immer mindestens 2 Poster pro Wand (wenn genug Platz)
    const maxPostersPerWall = Math.max(2, Math.floor(hexEdgeLength / posterSpacing));
    const postersPerWall = Math.min(maxPostersPerWall, 2); // Max 2 pro Wand
    
    const posterPositions = $derived(posters.map((poster, i) => {
        const wallIndex = Math.floor(i / postersPerWall) % wallCount;
        const positionOnWall = i % postersPerWall; // 0 oder 1
        const wall = wallPositions[wallIndex];
        
        // Wie viele Poster sind tatsächlich auf dieser Wand?
        const postersOnThisWall = posters.filter((_, idx) => 
            Math.floor(idx / postersPerWall) % wallCount === wallIndex
        ).length;
        const actualPostersOnWall = Math.min(postersOnThisWall, postersPerWall);
        
        // Zentriere die GRUPPE von Postern auf der Wand
        // Bei 1 Poster: mittig (offsetX = 0)
        // Bei 2 Postern: links und rechts von der Mitte, symmetrisch
        // Bei 3 Postern: links, mitte, rechts
        let offsetX: number;
        if (actualPostersOnWall === 1) {
            offsetX = 0; // Einzelnes Poster genau in der Mitte
        } else {
            // Mehrere Poster: gleichmäßig und symmetrisch verteilen
            const totalWidth = (actualPostersOnWall - 1) * posterSpacing;
            const startOffset = -totalWidth / 2;
            offsetX = startOffset + positionOnWall * posterSpacing;
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
        
        // offsetX ist die Position des Posters auf der Wand (Mitte der Gruppe)
        // Das Poster wird intern zentriert gerendert, also brauchen wir keinen extra Offset
        const viewOffsetX = offsetX;
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
        {@const hasImage = !!project.display?.posterImage}
        {@const imageFormat = project.display?.posterImageFormat || 'portrait'}
        {@const frameWidth = 0.08} <!-- Dünner Rahmen wie ExhibitBooth -->
        {@const innerPadding = 0.15} <!-- Abstand Inhalt zum Rahmen -->
        {@const gap = 0.35} <!-- Abstand zwischen Text und Bild -->
        
        <!-- Bildgrößen je nach Format (Bild ist dominant!) -->
        {@const imageWidth = hasImage ? (
            imageFormat === 'landscape' ? posterHeight * 1.2 :
            imageFormat === 'square' ? posterHeight * 0.85 :
            posterHeight * 0.55
        ) : 0}
        {@const imageHeight = hasImage ? (
            imageFormat === 'landscape' ? posterHeight * 0.8 :
            imageFormat === 'square' ? posterHeight * 0.85 :
            posterHeight * 0.92
        ) : 0}
        
        <!-- Text-Bereich: schmaler als Bild -->
        {@const textWidth = hasImage ? Math.min(posterHeight * 0.5, imageWidth * 0.6) : posterHeight * 0.8}
        
        <!-- Gesamtgröße: Inhalt + Rahmen -->
        {@const contentWidth = hasImage ? (textWidth + gap + imageWidth) : textWidth}
        {@const contentHeight = posterHeight * 0.92}
        {@const totalWidth = contentWidth + frameWidth * 2 + innerPadding * 2}
        {@const totalHeight = posterHeight}
        
        <!-- Schriftgrößen: Titel MUSS in textWidth passen! -->
        <!-- Lange Wörter wie "Religionspädagogik" brauchen kleine Schrift -->
        <!-- Faustregel: ~12-14 Zeichen pro textWidth bei dieser Schriftgröße -->
        {@const maxWordLength = Math.max(...project.title.split(' ').map(w => w.length))}
        {@const lengthFactor = maxWordLength > 15 ? (15 / maxWordLength) : 1.3}
        {@const titleFontSize = Math.min(textWidth * 0.090 * lengthFactor, 0.40)}
        {@const fontSize = Math.min(textWidth * 0.095, 0.30)}
        {@const sloganFontSize = fontSize * 0.85}
        {@const descFontSize = fontSize * 0.65}
        {@const buttonSize = Math.min(textWidth * 0.18, 0.45)}
        
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
                    <!-- === NORMAL MODUS (Dünner Rahmen wie ExhibitBooth) === -->
                    
                    <!-- Dunkler Hintergrund -->
                    <T.Mesh 
                        position.z={0.18}
                        onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                    >
                        <T.PlaneGeometry args={[totalWidth, totalHeight]} />
                        <T.MeshBasicMaterial color="#0f172a" />
                    </T.Mesh>
                    
                    <!-- Dünner farbiger Rahmen (4 Linien wie ExhibitBooth) -->
                    <!-- Oben -->
                    <T.Mesh position={[0, totalHeight / 2 - frameWidth / 2, 0.19]}>
                        <T.PlaneGeometry args={[totalWidth, frameWidth]} />
                        <T.MeshBasicMaterial color={displayColor} />
                    </T.Mesh>
                    <!-- Unten -->
                    <T.Mesh position={[0, -totalHeight / 2 + frameWidth / 2, 0.19]}>
                        <T.PlaneGeometry args={[totalWidth, frameWidth]} />
                        <T.MeshBasicMaterial color={displayColor} />
                    </T.Mesh>
                    <!-- Links -->
                    <T.Mesh position={[-totalWidth / 2 + frameWidth / 2, 0, 0.19]}>
                        <T.PlaneGeometry args={[frameWidth, totalHeight]} />
                        <T.MeshBasicMaterial color={displayColor} />
                    </T.Mesh>
                    <!-- Rechts -->
                    <T.Mesh position={[totalWidth / 2 - frameWidth / 2, 0, 0.19]}>
                        <T.PlaneGeometry args={[frameWidth, totalHeight]} />
                        <T.MeshBasicMaterial color={displayColor} />
                    </T.Mesh>
                    
                    <!-- === TEXT-POSTER (links) === -->
                    {@const textOffsetX = hasImage ? -(contentWidth / 2 - textWidth / 2) : 0}
                    <T.Group position.x={textOffsetX}>
                        <!-- Text-Bereich Hintergrund (dezent farbig) -->
                        <T.Mesh position.z={0.20}>
                            <T.PlaneGeometry args={[textWidth, contentHeight]} />
                            <T.MeshBasicMaterial color={displayColor} transparent opacity={0.1} />
                        </T.Mesh>
                        
                        <!-- Projekt-Titel (ganz oben, knapp unter Rahmen) -->
                        <Text
                            text={project.title}
                            fontSize={titleFontSize}
                            anchorX="center"
                            anchorY="top"
                            position={[0, contentHeight * 0.44, 0.25]}
                            color="#ffffff"
                            fontWeight="bold"
                            maxWidth={textWidth * 0.90}
                            textAlign="center"
                        />

                        <!-- Trennlinie unter dem Titel (fester Abstand) -->
                        <T.Mesh position={[0, contentHeight * 0.28, 0.24]}>
                            <T.PlaneGeometry args={[textWidth * 0.5, 0.025]} />
                            <T.MeshBasicMaterial color={displayColor} />
                        </T.Mesh>

                        <!-- Slogan (falls vorhanden) - direkt unter Trennlinie -->
                        {#if project.display?.slogan}
                            <Text
                                text={project.display.slogan}
                                fontSize={sloganFontSize}
                                anchorX="center"
                                anchorY="top"
                                position={[0, contentHeight * 0.22, 0.25]}
                                color={displayColor}
                                maxWidth={textWidth * 0.88}
                                textAlign="center"
                                fontStyle="italic"
                            />
                        {/if}

                        <!-- Beschreibung (shortTeaser) - direkt unter Slogan oder Trennlinie -->
                        {#if project.shortTeaser}
                            {@const descY = project.display?.slogan ? contentHeight * 0.08 : contentHeight * 0.18}
                            <Text
                                text={project.shortTeaser}
                                fontSize={descFontSize}
                                anchorX="center"
                                anchorY="top"
                                position={[0, descY, 0.25]}
                                color="#94a3b8"
                                maxWidth={textWidth * 0.88}
                                textAlign="center"
                                lineHeight={1.5}
                            />
                        {/if}

                        <!-- Klickbares Hexagon-Button unten (wie ExhibitBooth) -->
                        <T.Mesh 
                            position={[0, -contentHeight * 0.38, 0.22]}
                            onclick={() => { if (isNearWall) worldStore.selectProject(project.id); }}
                            onpointerenter={() => { hoveredButtonId = project.id; if (isNearWall) onPointerEnter(); }}
                            onpointerleave={() => { hoveredButtonId = null; onPointerLeave(); }}
                        >
                            <T.RingGeometry args={[buttonSize * 0.6, buttonSize, 6]} />
                            <T.MeshBasicMaterial 
                                color={isNearWall && isButtonHovered ? '#ffffff' : displayColor} 
                                transparent 
                                opacity={isNearWall ? (isButtonHovered ? 1 : 0.6) : 0.25} 
                            />
                        </T.Mesh>
                        <!-- Innerer Kreis des Hexagon-Buttons (auch klickbar) -->
                        <T.Mesh 
                            position={[0, -contentHeight * 0.38, 0.23]}
                            onclick={() => { if (isNearWall) worldStore.selectProject(project.id); }}
                            onpointerenter={() => { hoveredButtonId = project.id; if (isNearWall) onPointerEnter(); }}
                            onpointerleave={() => { hoveredButtonId = null; onPointerLeave(); }}
                        >
                            <T.CircleGeometry args={[buttonSize * 0.6, 6]} />
                            <T.MeshBasicMaterial 
                                color={isNearWall && isButtonHovered ? displayColor : '#0f172a'} 
                                transparent 
                                opacity={isNearWall ? 0.9 : 0.5} 
                            />
                        </T.Mesh>
                        <!-- Info-Icon im Hexagon (keine Pointer-Events) -->
                        <Text
                            text={isNearWall ? "ℹ️" : "👁️"}
                            fontSize={buttonSize * 0.5}
                            anchorX="center"
                            anchorY="middle"
                            position={[0, -contentHeight * 0.38, 0.24]}
                            pointerEvents="none"
                        />
                    </T.Group>
                    
                    <!-- Vertikale Trennlinie zwischen Text und Bild -->
                    {#if hasImage}
                        {@const dividerX = textOffsetX + textWidth / 2 + gap / 2}
                        <T.Mesh position={[dividerX, 0, 0.22]}>
                            <T.PlaneGeometry args={[0.04, contentHeight * 0.9]} />
                            <T.MeshBasicMaterial color={displayColor} transparent opacity={0.5} />
                        </T.Mesh>
                    {/if}

                    <!-- === POSTER-BILD (rechts) === -->
                    {#if hasImage}
                        {@const imageOffsetX = textOffsetX + textWidth / 2 + gap + imageWidth / 2}
                        <T.Mesh 
                            position={[imageOffsetX, 0, 0.22]}
                            onclick={() => handlePosterClick(x, z, rotY, offsetX)}
                        >
                            <T.PlaneGeometry args={[imageWidth, imageHeight]} />
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
