<script lang="ts">
    /**
     * ExhibitBooth - Freistehender Messestand als Rollup-Banner
     * 
     * Struktur:
     * - Breite Bodenplatte (Rollup-Fuß)
     * - Großes vertikales Banner mit Text-Poster + posterImage
     * - Klickbares Hexagon-Button im Poster für ProjectCard-Aktivierung
     * 
     * Interaktion:
     * - Klick auf Banner → Kamera fährt davor
     * - Klick auf Hexagon-Button (bei Nähe) → Öffnet ProjectCard
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { ProjectData } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    import PosterImage from './PosterImage.svelte';
    
    import { getViewPoint } from '$lib/logic/viewpoints';
    
    // ⚠️ DEBUG: Temporär alle Texte deaktivieren um Performance zu testen
    const DEBUG_DISABLE_TEXT = false;
    
    // Performance: Im Low-Mode Transparenz deaktivieren (GPU-lastig)
    const enableTransparency = $derived(performanceStore.qualityLevel !== 'low');
    
    // Performance: Im Low-Mode keine Hover-Spotlights (zusätzliche Lichtquellen)
    const showHoverSpotlight = $derived(performanceStore.qualityLevel !== 'low');

    interface Props {
        project: ProjectData;
        position?: [number, number, number];
        rotation?: number; // Y-Rotation in Radians
        size?: 'small' | 'medium' | 'large';
        platformPosition?: [number, number, number]; // Welt-Position der Plattform
        platformId?: string; // ID der Plattform für Sichtbarkeits-Check
        inGroup?: boolean; // In Dreiergruppe? Dann keine Rückwand
    }

    let { 
        project, 
        position = [0, 0, 0], 
        rotation = 0,
        size = 'medium',
        platformPosition = [0, 0, 0],
        platformId = '',
        inGroup = false
    }: Props = $props();

    // Performance: Im Low-Mode oder bei Dreiergruppen nur Vorderseite rendern
    const showBackside = $derived(performanceStore.qualityLevel !== 'low' && !inGroup);

    const { camera } = useThrelte();
    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);
    let isButtonHovered = $state(false);
    
    // Entfernungs-basierte Aktivierung für Buttons
    const ACTIVATION_DISTANCE = 12;
    let isNearby = $state(false);
    
    // Auf der gleichen Plattform? (für Poster-Sichtbarkeit und Task-Optimierung)
    let isOnPlatform = $derived(worldStore.currentPlatform === platformId);
    
    // Ist die Zielplattform? (für Transport-Animation)
    let isTransportTarget = $derived(worldStore.transportTarget === platformId);
    
    // Task nur laufen lassen wenn relevant (auf Plattform oder Transport-Ziel)
    let shouldRunTask = $derived(isOnPlatform || isTransportTarget);
    
    let frameCounter = 0;
    
    // Berechne Welt-Position des Booths
    const worldPosition = $derived([
        platformPosition[0] + position[0],
        platformPosition[1] + position[1],
        platformPosition[2] + position[2]
    ] as [number, number, number]);
    
    // Entfernungs-Check (alle 6 Frames für Performance, nur wenn auf Plattform)
    useTask(() => {
        // Skip wenn nicht auf dieser Plattform
        if (!shouldRunTask) {
            isNearby = false;
            return;
        }
        
        frameCounter++;
        if (frameCounter % 6 !== 0) return;
        
        const camPos = $camera.position;
        const dx = camPos.x - worldPosition[0];
        const dy = camPos.y - worldPosition[1];
        const dz = camPos.z - worldPosition[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        
        isNearby = distSq <= ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
    });

    // Größen-Varianten für Rollup (ausgewogene Proportionen)
    // gap = einheitlicher Abstand zwischen Text und Bild
    const sizes = {
        small:  { width: 6.5,  height: 5.5, footWidth: 7,    footDepth: 0.8, textWidth: 2.2, gap: 0.2 },
        medium: { width: 8.5,  height: 6.5, footWidth: 9,    footDepth: 1.0, textWidth: 2.6, gap: 0.25 },
        large:  { width: 10.5, height: 8,   footWidth: 11,   footDepth: 1.2, textWidth: 3.0, gap: 0.3 }
    };
    
    const s = sizes[size];
    const displayColor = project.display?.color || project.color || '#3b82f6';
    const posterImage = project.display?.posterImage;
    const shortTeaser = project.shortTeaser;
    const slogan = project.display?.slogan;
    const imageFormat = project.display?.posterImageFormat || 'portrait';
    
    // Bildbreite berechnen (verfügbarer Platz = Gesamtbreite - Textbreite - Rahmen - Gap)
    const availableImageWidth = s.width - s.textWidth - 0.4 - s.gap; // 0.4 = Rahmen links+rechts
    const imageHeight = s.height * 0.92; // Höhe wie Text-Bereich
    
    // NEU: Feste Breite erzwingen (Stretching wie im CSS)
    // Wir nutzen den vollen verfügbaren Platz, egal welches Format das Bild hat
    const imageWidth = $derived(availableImageWidth);
    
    // Titel-Schriftgröße
    const titleFontSize = $derived(
        project.title.length > 22 ? 0.2 : 
        project.title.length > 16 ? 0.24 : 0.28
    );

    // Klick auf Banner: Kamera positioniert sich davor (über zentrale ViewPoint API)
    function handleBannerClick(e: Event) {
        e.stopPropagation(); // Verhindert Durchschuss zu dahinterliegenden Objekten
        
        // Nutze zentrale ViewPoint API für konsistente Kamera-Berechnung
        const viewPoint = getViewPoint(project.id, 'booth', platformId);
        
        if (viewPoint) {
            worldStore.setViewTarget(viewPoint.camera, viewPoint.target);
        } else {
            // Fallback: Lokale Berechnung (sollte nicht passieren)
            const worldBoothX = platformPosition[0] + position[0];
            const worldBoothY = platformPosition[1] + position[1];
            const worldBoothZ = platformPosition[2] + position[2];
            
            const viewDistance = 5;
            const forwardX = -Math.sin(rotation);
            const forwardZ = -Math.cos(rotation);
            
            worldStore.setViewTarget(
                { x: worldBoothX + forwardX * viewDistance, y: worldBoothY + s.height / 2 + 0.3, z: worldBoothZ + forwardZ * viewDistance },
                { x: worldBoothX, y: worldBoothY + s.height / 2 + 0.3, z: worldBoothZ }
            );
        }
    }

    function handlePointerEnter() {
        isHovered = true;
        onPointerEnter();
    }

    function handlePointerLeave() {
        isHovered = false;
        onPointerLeave();
    }

    // Klick auf Button: ProjectCard öffnen (nur wenn nah genug)
    function handleButtonClick(e: Event) {
        e.stopPropagation();
        if (!isNearby) return;
        worldStore.selectProject(project.id);
    }
    
    // Button Hover Handler (nur wenn nah genug)
    function handleButtonEnter() {
        if (isNearby) {
            isButtonHovered = true;
            onPointerEnter();
        }
    }
    
    function handleButtonLeave() {
        isButtonHovered = false;
        onPointerLeave();
    }
</script>

<T.Group position={position} rotation.y={rotation} scale={1.1}>
    
    <!-- ========== BODEN-SCHATTEN (nur bei High-Quality) ========== -->
    {#if performanceStore.qualityLevel === 'high'}
    <T.Mesh position={[0, 0.02, 0]} rotation.x={-Math.PI / 2}>
        <T.PlaneGeometry args={[s.width * 1.1, s.footDepth * 3]} />
        <T.MeshBasicMaterial 
            color="#000000"
            transparent
            opacity={0.25}
            depthWrite={false}
        />
    </T.Mesh>
    {/if}
    
    <!-- ========== STELLWAND-FUSS (leicht, Stützen nach beiden Seiten) ========== -->
    <T.Group>
        <!-- Linke Stütze -->
        <T.Group position.x={-s.width * 0.35}>
            <!-- Nach hinten -->
            <T.Mesh position={[0, 0.06, -0.35]} rotation.x={-0.12} castShadow>
                <T.BoxGeometry args={[0.1, 0.06, 0.8]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
            <!-- Nach vorne -->
            <T.Mesh position={[0, 0.06, 0.35]} rotation.x={0.12} castShadow>
                <T.BoxGeometry args={[0.1, 0.06, 0.8]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
            <!-- Vertikale Verbindung -->
            <T.Mesh position={[0, 0.22, 0]} castShadow>
                <T.BoxGeometry args={[0.06, 0.38, 0.06]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
        </T.Group>
        
        <!-- Rechte Stütze -->
        <T.Group position.x={s.width * 0.35}>
            <!-- Nach hinten -->
            <T.Mesh position={[0, 0.06, -0.35]} rotation.x={-0.12} castShadow>
                <T.BoxGeometry args={[0.1, 0.06, 0.8]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
            <!-- Nach vorne -->
            <T.Mesh position={[0, 0.06, 0.35]} rotation.x={0.12} castShadow>
                <T.BoxGeometry args={[0.1, 0.06, 0.8]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
            <!-- Vertikale Verbindung -->
            <T.Mesh position={[0, 0.22, 0]} castShadow>
                <T.BoxGeometry args={[0.06, 0.38, 0.06]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
            </T.Mesh>
        </T.Group>

        <!-- Farbige Akzent-Leiste unten am Banner -->
        <T.Mesh position={[0, 0.38, 0]}>
            <T.BoxGeometry args={[s.width * 0.95, 0.04, 0.04]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.3} roughness={0.5} />
        </T.Mesh>
    </T.Group>

    <!-- ========== BANNER (Hauptfläche) - DOPPELSEITIG ========== -->
    <T.Group position={[0, s.height / 2 + 0.3, 0]}>
        
        <!-- Banner-Kern (dünne Box für Stabilität) -->
        <T.Mesh>
            <T.BoxGeometry args={[s.width, s.height, 0.04]} />
            <T.MeshStandardMaterial 
                color="#1e293b"
                metalness={0.1}
                roughness={0.9}
            />
        </T.Mesh>

        <!-- ========== VORDERSEITE (z=0.03) - zeigt NACH INNEN zur Plattform-Mitte ========== -->
        <!-- User kommt von AUSSEN und sieht diese Seite SELTEN -->
        {#if showBackside}
        <!-- FULL QUALITY: Volle Details auf Vorderseite -->
        <T.Group position.z={0.03}>
            <!-- Klickbare Hintergrund-Fläche -->
            <T.Mesh 
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
                onclick={handleBannerClick}
            >
                <T.PlaneGeometry args={[s.width, s.height]} />
                <T.MeshBasicMaterial color="#0f172a" />
            </T.Mesh>

            <!-- Farbiger Rahmen -->
            <T.Mesh position={[0, s.height / 2 - 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[0, -s.height / 2 + 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[-s.width / 2 + 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[s.width / 2 - 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>

            <!-- === TEXT-POSTER (links) === -->
            {@const textOffsetX = posterImage ? -(s.width / 2 - s.textWidth / 2 - 0.15) : 0}
            <T.Group position.x={textOffsetX}>
                <!-- Text-Poster Hintergrund -->
                <T.Mesh position.z={0.01}>
                    <T.PlaneGeometry args={[s.textWidth + 0.1, s.height * 0.92]} />
                    <T.MeshBasicMaterial 
                        color={enableTransparency ? displayColor : '#1e293b'}
                        transparent={enableTransparency}
                        opacity={enableTransparency ? 0.12 : 1.0}
                    />
                </T.Mesh>
                
                <!-- Projekt-Titel (oben) -->
                <Text
                    text={project.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, s.height * 0.40, 0.02]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={s.textWidth}
                    textAlign="center"
                />

                <!-- Trennlinie unter Titel -->
                <T.Mesh position={[0, s.height * 0.26, 0.02]}>
                    <T.PlaneGeometry args={[s.textWidth * 0.6, 0.015]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>

                <!-- Slogan (Mitte) -->
                {#if slogan}
                    <Text
                        text={slogan}
                        fontSize={0.16}
                        anchorX="center"
                        anchorY="top"
                        position={[0, s.height * 0.20, 0.02]}
                        color={displayColor}
                        maxWidth={s.textWidth}
                        textAlign="center"
                        fontStyle="italic"
                    />
                {/if}

                <!-- Beschreibung -->
                {#if shortTeaser && !DEBUG_DISABLE_TEXT}
                    {@const descY = slogan ? s.height * 0.02 : s.height * 0.12}
                    <Text
                        text={shortTeaser}
                        fontSize={0.13}
                        anchorX="center"
                        anchorY="top"
                        position={[0, descY+0.3, 0.02]}
                        color="#94a3b8"
                        maxWidth={s.textWidth * 0.95}
                        textAlign="center"
                        lineHeight={1.5}
                    />
                {/if}

                <!-- Klickbares Hexagon-Button unten -->
                <T.Mesh 
                    position={[0, -s.height * 0.38, 0.02]}
                    onclick={handleButtonClick}
                    onpointerenter={handleButtonEnter}
                    onpointerleave={handleButtonLeave}
                >
                    <T.RingGeometry args={[0.18, 0.32, 6]} />
                    <T.MeshBasicMaterial 
                        color={isNearby && isButtonHovered ? '#ffffff' : displayColor} 
                        transparent 
                        opacity={isNearby ? (isButtonHovered ? 1 : 0.6) : 0.25} 
                    />
                </T.Mesh>
                <T.Mesh 
                    position={[0, -s.height * 0.38, 0.025]}
                    onclick={handleButtonClick}
                    onpointerenter={handleButtonEnter}
                    onpointerleave={handleButtonLeave}
                >
                    <T.CircleGeometry args={[0.18, 6]} />
                    <T.MeshBasicMaterial 
                        color={isNearby && isButtonHovered ? displayColor : '#0f172a'} 
                        transparent 
                        opacity={isNearby ? 0.9 : 0.5} 
                    />
                </T.Mesh>
                <Text
                    text={isNearby ? "ℹ️" : "👁️"}
                    fontSize={0.15}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -s.height * 0.38, 0.03]}
                    pointerEvents="none"
                />
            </T.Group>

            <!-- Vertikale Trennlinie zwischen Text und Bild -->
            {#if posterImage && isOnPlatform}
                {@const dividerX = textOffsetX + s.textWidth / 2 + s.gap / 2}
                <T.Mesh position={[dividerX, 0, 0.015]}>
                    <T.PlaneGeometry args={[0.02, s.height * 0.85]} />
                    <T.MeshBasicMaterial color={displayColor} transparent opacity={0.4} />
                </T.Mesh>
            {/if}

            <!-- === POSTER-BILD (rechts) === -->
            <!-- Textur-Qualität wird automatisch über PosterImage gesteuert -->
            {#if posterImage && isOnPlatform}
                {@const imageOffsetX = textOffsetX + s.textWidth / 2 + s.gap + imageWidth / 2}
                <T.Group
                    onpointerenter={handlePointerEnter}
                    onpointerleave={handlePointerLeave}
                    onclick={handleBannerClick}
                >
                    <PosterImage 
                        url={posterImage}
                        width={imageWidth}
                        height={imageHeight}
                        position={[imageOffsetX, 0, 0.02]}
                    />
                </T.Group>
            {/if}
        </T.Group>
        {:else}
        <!-- LOW-MODE: Einfache Vorderseite (User sieht sie selten) -->
        <T.Group position.z={0.03}>
            <T.Mesh>
                <T.PlaneGeometry args={[s.width, s.height]} />
                <T.MeshBasicMaterial color="#1e293b" />
            </T.Mesh>
            <!-- Nur dezenter Rahmen -->
            <T.Mesh position={[0, s.height / 2 - 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[0, -s.height / 2 + 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
        </T.Group>
        {/if}

        <!-- ========== RÜCKSEITE (z=-0.03) - zeigt NACH AUSSEN ========== -->
        <!-- User kommt von AUSSEN und sieht diese Seite ZUERST - IMMER volle Details! -->
        <T.Group position.z={-0.03} rotation.y={Math.PI}>
            <!-- Klickbare Hintergrund-Fläche -->
            <T.Mesh 
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
                onclick={handleBannerClick}
            >
                <T.PlaneGeometry args={[s.width, s.height]} />
                <T.MeshBasicMaterial color="#0f172a" />
            </T.Mesh>

            <!-- Farbiger Rahmen -->
            <T.Mesh position={[0, s.height / 2 - 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[0, -s.height / 2 + 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[-s.width / 2 + 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[s.width / 2 - 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>

            <!-- === TEXT-POSTER (links auf Rückseite) === -->
            {@const textOffsetX = posterImage ? -(s.width / 2 - s.textWidth / 2 - 0.15) : 0}
            <T.Group position.x={textOffsetX}>
                <!-- Text-Poster Hintergrund -->
                <T.Mesh position.z={0.01}>
                    <T.PlaneGeometry args={[s.textWidth + 0.1, s.height * 0.92]} />
                    <T.MeshBasicMaterial 
                        color={enableTransparency ? displayColor : '#1e293b'}
                        transparent={enableTransparency}
                        opacity={enableTransparency ? 0.12 : 1.0}
                    />
                </T.Mesh>
                
                <!-- Projekt-Titel (oben) -->
                {#if !DEBUG_DISABLE_TEXT}
                <Text
                    text={project.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, s.height * 0.40, 0.02]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={s.textWidth}
                    textAlign="center"
                />
                {/if}

                <!-- Trennlinie unter Titel -->
                <T.Mesh position={[0, s.height * 0.26, 0.02]}>
                    <T.PlaneGeometry args={[s.textWidth * 0.6, 0.015]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>

                <!-- Slogan (Mitte) -->
                {#if slogan && !DEBUG_DISABLE_TEXT}
                    <Text
                        text={slogan}
                        fontSize={0.16}
                        anchorX="center"
                        anchorY="top"
                        position={[0, s.height * 0.20, 0.02]}
                        color={displayColor}
                        maxWidth={s.textWidth}
                        textAlign="center"
                        fontStyle="italic"
                    />
                {/if}

                <!-- Beschreibung -->
                {#if shortTeaser && !DEBUG_DISABLE_TEXT}
                    {@const descY = slogan ? s.height * 0.02 : s.height * 0.12}
                    <Text
                        text={shortTeaser}
                        fontSize={0.13}
                        anchorX="center"
                        anchorY="top"
                        position={[0, descY, 0.02]}
                        color="#94a3b8"
                        maxWidth={s.textWidth * 0.95}
                        textAlign="center"
                        lineHeight={1.5}
                    />
                {/if}

                <!-- Klickbares Hexagon-Button unten (Rückseite) -->
                <T.Mesh 
                    position={[0, -s.height * 0.38, 0.02]}
                    onclick={handleButtonClick}
                    onpointerenter={handleButtonEnter}
                    onpointerleave={handleButtonLeave}
                >
                    <T.RingGeometry args={[0.18, 0.32, 6]} />
                    <T.MeshBasicMaterial 
                        color={isNearby && isButtonHovered ? '#ffffff' : displayColor} 
                        transparent 
                        opacity={isNearby ? (isButtonHovered ? 1 : 0.6) : 0.25} 
                    />
                </T.Mesh>
                <T.Mesh 
                    position={[0, -s.height * 0.38, 0.025]}
                    onclick={handleButtonClick}
                    onpointerenter={handleButtonEnter}
                    onpointerleave={handleButtonLeave}
                >
                    <T.CircleGeometry args={[0.18, 6]} />
                    <T.MeshBasicMaterial 
                        color={isNearby && isButtonHovered ? displayColor : '#0f172a'} 
                        transparent 
                        opacity={isNearby ? 0.9 : 0.5} 
                    />
                </T.Mesh>
                <Text
                    text={isNearby ? "ℹ️" : "👁️"}
                    fontSize={0.15}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -s.height * 0.38, 0.03]}
                    pointerEvents="none"
                />
            </T.Group>

            <!-- Vertikale Trennlinie zwischen Text und Bild -->
            {#if posterImage && isOnPlatform}
                {@const dividerX = textOffsetX + s.textWidth / 2 + s.gap / 2}
                <T.Mesh position={[dividerX, 0, 0.015]}>
                    <T.PlaneGeometry args={[0.02, s.height * 0.85]} />
                    <T.MeshBasicMaterial color={displayColor} transparent={enableTransparency} opacity={enableTransparency ? 0.4 : 1.0} />
                </T.Mesh>
            {/if}

            <!-- === POSTER-BILD (rechts auf Rückseite) === -->
            <!-- Textur-Qualität wird automatisch über PosterImage gesteuert -->
            {#if posterImage && isOnPlatform}
                {@const imageOffsetX = textOffsetX + s.textWidth / 2 + s.gap + imageWidth / 2}
                <T.Group
                    onpointerenter={handlePointerEnter}
                    onpointerleave={handlePointerLeave}
                    onclick={handleBannerClick}
                >
                    <PosterImage 
                        url={posterImage}
                        width={imageWidth}
                        height={imageHeight}
                        position={[imageOffsetX, 0, 0.02]}
                    />
                </T.Group>
            {/if}
        </T.Group>
    </T.Group>

    <!-- Spotlight bei Hover (im Low-Mode deaktiviert) -->
    {#if isHovered && showHoverSpotlight}
        <T.SpotLight
            position={[0, s.height + 2, 3]}
            target.position={[0, s.height / 2, 0]}
            color={displayColor}
            intensity={60}
            distance={s.height + 4}
            angle={0.5}
            penumbra={0.7}
            decay={1.5}
        />
        <T.SpotLight
            position={[0, s.height + 2, -3]}
            target.position={[0, s.height / 2, 0]}
            color={displayColor}
            intensity={60}
            distance={s.height + 4}
            angle={0.5}
            penumbra={0.7}
            decay={1.5}
        />
    {/if}
</T.Group>
