<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { useCursor, Text, Billboard } from '@threlte/extras';
    import { Spring } from 'svelte/motion';
    import type { Platform as PlatformType } from '$lib/logic/platforms';
    import type { ProjectData, PlatformContent } from '$lib/types/project';
    import ExhibitStand from './ExhibitStand.svelte';
    import InfoHexagon from './InfoHexagon.svelte';
    import MesseWall from './MesseWall.svelte';
    import ExhibitBooth from './ExhibitBooth.svelte';
    import Signpost from './Signpost.svelte';
    import { getHexagonalLayout } from '$lib/logic/layout';
    import { worldStore } from '$lib/logic/store.svelte';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    import { 
        getPlatformContent, 
        getBoothProjectsForPlatform, 
        getWallPostersForPlatform,
        getRelatedProjectsForPlatform 
    } from '$lib/data/mockProjects';
    import type { Object3D, Intersection } from 'three';

    let { platform, projects = [] }: { platform: PlatformType; projects?: ProjectData[] } = $props();

    // ============================================
    // DIREKTE TRANSPORT-SIGNALE (nicht mehr über state-Objekt!)
    // worldStore.currentPlatform etc. sind separate $state Variablen
    // ============================================
    let currentPlatformId = $derived(worldStore.currentPlatform);
    let transportTargetId = $derived(worldStore.transportTarget);
    
    // Abgeleitete Werte NUR von den isolierten Selektoren
    let isCurrentPlatform = $derived(currentPlatformId === platform.id);
    let isTransportTarget = $derived(transportTargetId === platform.id);

    // Plattform-Content - GECACHT, nicht reaktiv auf worldStore
    const platformContent = getPlatformContent(platform.id);
    const boothProjects = getBoothProjectsForPlatform(platform.id);
    const wallPosters = getWallPostersForPlatform(platform.id);
    const relatedProjects = getRelatedProjectsForPlatform(platform.id);

    // Farben aus Content-Daten (statisch)
    const platformColor = platformContent?.color ?? platform.color;
    const platformGlowColor = platformContent?.glowColor ?? platform.glowColor;

    // Referenzen für Spotlight-Targets (je Spot ein eigenes Target)
    let spotTargets: (Object3D | undefined)[] = $state(Array(6).fill(undefined));

    // Oktaeder-Rotation (animiert) - nur auf aktueller Plattform UND wenn Animationen erlaubt
    let octaederRotation = $state(0);
    const enableAnimations = $derived(performanceStore.settings.enableAnimations);
    
    useTask((delta) => {
        if (isCurrentPlatform && enableAnimations) {
            octaederRotation += delta * 0.5; // Langsame Rotation
        }
    });

    // Oktaeder-Hover-State für Lichtlinien-Aktivierung
    let oktaederHovered = $state(false);

    // Cursor-Änderung bei Hover
    const { hovering, onPointerEnter, onPointerLeave } = useCursor();
    
    // Glow-Intensität für den Ring bei Hover
    const glowOpacity = new Spring(0.15, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        const baseOpacity = isCurrentPlatform ? 0.5 : 0.15;
        glowOpacity.target = $hovering ? 0.9 : baseOpacity;
    });

    // Layout für Projekt-Stände auf der Plattform (statisch)
    const standPositions = getHexagonalLayout(projects.length, platform.size * 0.6);
    
    // ALLE Plattformen rendern immer ihre Inhalte (für flüssige Übergänge)
    let shouldRenderContent = true;
    
    // Spotlights basierend auf Performance-Einstellungen
    // Low = keine Spotlights, Medium = 3 Spots (nur aktuelle), High = 6 Spots (aktuelle + Ziel)
    let maxSpotlights = $derived(performanceStore.settings.maxSpotlights);
    let shouldRenderSpotlights = $derived(
        maxSpotlights > 0 && (isCurrentPlatform || (maxSpotlights >= 6 && isTransportTarget))
    );
    let spotlightCount = $derived(
        maxSpotlights >= 6 ? 6 : Math.min(maxSpotlights, 3)
    );
    
    // Materialien: PBR oder Basic
    let usePBRMaterials = $derived(performanceStore.settings.usePBRMaterials);
    let useEmissive = $derived(performanceStore.settings.useEmissive);
    
    // Glow-Ringe (deaktiviert bei Low-Qualität)
    let enableGlowRings = $derived(performanceStore.settings.enableGlowRings);

    // Drag-Detection: Unterscheide zwischen Klick und Kamera-Drehen
    let pointerDownPos = $state<{ x: number; y: number } | null>(null);
    let pointerDownTime = $state<number>(0);
    const DRAG_THRESHOLD = 5; // Pixel Bewegung bevor es als Drag gilt
    const CLICK_MAX_DURATION = 300; // Max ms für einen Klick

    // Typ für Threlte Click Event
    type ThreltePointerEvent = { 
        point: { x: number; y: number; z: number };
        nativeEvent: PointerEvent;
        stopPropagation: () => void;
    };

    function handlePointerDown(event: ThreltePointerEvent) {
        pointerDownPos = { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY };
        pointerDownTime = Date.now();
    }

    function handlePointerUp(event: ThreltePointerEvent) {
        if (!pointerDownPos) return;
        
        const dx = Math.abs(event.nativeEvent.clientX - pointerDownPos.x);
        const dy = Math.abs(event.nativeEvent.clientY - pointerDownPos.y);
        const duration = Date.now() - pointerDownTime;
        
        // Nur als Klick werten wenn: wenig Bewegung UND kurze Dauer
        const isClick = dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD && duration < CLICK_MAX_DURATION;
        
        if (isClick) {
            if (!isCurrentPlatform) {
                // Wenn nicht aktuelle Plattform, navigiere dorthin
                worldStore.startTransport(platform.id);
            }
            // Auf aktueller Plattform: Kein Kamera-Move mehr (führte zu merkwürdigen Rotationen)
        }
        
        pointerDownPos = null;
    }

    // 6 Spotlight-Positionen im Hexagon-Muster (wie Messehallen-Beleuchtung)
    const spotlightHeight = 15; // Höhe über der Plattform (näher)
    const spotlightRadius = 0.7; // Relativ zur Plattform-Größe
    const spotlightPositions = Array.from({ length: 6 }, (_, i) => {
        // Startwinkel angepasst damit Spots über den Ecken der Plattform sind
        const angle = (i / 6) * Math.PI * 2;
        return {
            x: Math.cos(angle) * spotlightRadius,
            z: Math.sin(angle) * spotlightRadius
        };
    });
</script>

<T.Group 
    position={[platform.x, platform.y, platform.z]}
    userData={{ isPlatform: true, platformId: platform.id }}
>
    <!-- Hexagonale Plattform-Basis (6-seitiger Zylinder) -->
    <T.Mesh
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerenter={onPointerEnter}
        onpointerleave={onPointerLeave}
        receiveShadow
        rotation.y={Math.PI / 6}
    >
        <!-- Plattform ist jetzt 3 Einheiten dick (begehbar) -->
        <T.CylinderGeometry args={[platform.size, platform.size, 3, 6]} />
        <T.MeshStandardMaterial
            color={platformColor}
            metalness={0.3}
            roughness={0.6}
        />
    </T.Mesh>

    <!-- Dezenter Ring am Rand - leuchtet bei Hover (nur bei aktiviertem Glow) -->
    {#if enableGlowRings}
    <T.Mesh position.y={-2} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.98, platform.size * 1.02, 6]} />
        <T.MeshBasicMaterial
            color={platformGlowColor}
            transparent
            opacity={glowOpacity.current}
            side={2}
        />
    </T.Mesh>
    {/if}

    <!-- Rotierender Oktaeder über dem Schild - Ankerpunkt für Lichtlinien -->
    <!-- Klick auf Oktaeder = Zurück zum Marktplatz (S) -->
    {@const usePBR = performanceStore.settings.usePBRMaterials}
    {@const sphereSegments = performanceStore.qualityLevel === 'low' ? 8 : 16}
    {@const showPointLight = performanceStore.qualityLevel !== 'low'}
    
    <T.Group position.y={15}>
        <!-- Oktaeder (halbtransparent, klickbar) -->
        <T.Mesh 
            rotation.y={octaederRotation}
            rotation.x={Math.PI / 8}
            onclick={(e: ThreltePointerEvent) => {
                e.stopPropagation();
                if (platform.id !== 'S') {
                    worldStore.startTransport('S');
                }
            }}
            onpointerenter={() => {
                if (platform.id !== 'S' && isCurrentPlatform) {
                    document.body.style.cursor = 'pointer';
                    oktaederHovered = true;
                    // Setze hoveredDestination auf 'S' (Marktplatz) für LightBridge-Aktivierung
                    worldStore.setHoveredDestination('S');
                }
            }}
            onpointerleave={() => {
                document.body.style.cursor = 'auto';
                oktaederHovered = false;
                if (isCurrentPlatform) {
                    worldStore.setHoveredDestination(null);
                }
            }}
        >
            <T.OctahedronGeometry args={[1.2, 0]} />
            {#if usePBR}
            <T.MeshPhysicalMaterial 
                color={platformGlowColor}
                emissive={platformGlowColor}
                emissiveIntensity={isCurrentPlatform ? 0.5 : 0.2}
                metalness={0.3}
                roughness={0.1}
                transparent
                opacity={0.6}
                transmission={0.3}
            />
            {:else}
            <!-- Low-Mode: Einfaches Material ohne Transmission -->
            <T.MeshBasicMaterial 
                color={platformGlowColor}
            />
            {/if}
        </T.Mesh>
        <!-- Innere leuchtende Kugel (der "Kern", auch klickbar) -->
        <T.Mesh 
            rotation.y={enableAnimations ? octaederRotation * -1.5 : 0}
            onclick={(e: ThreltePointerEvent) => {
                e.stopPropagation();
                if (platform.id !== 'S') {
                    worldStore.startTransport('S');
                }
            }}
        >
            <T.SphereGeometry args={[0.5, sphereSegments, sphereSegments]} />
            <T.MeshBasicMaterial 
                color={platformGlowColor}
            />
        </T.Mesh>
        <!-- Punktlicht vom Kern - NUR bei nicht-Low-Mode -->
        {#if showPointLight}
        <T.PointLight
            color={platformGlowColor}
            intensity={isCurrentPlatform ? 50 : 15}
            distance={20}
            decay={2}
        />
        {/if}
        <!-- Tooltip bei Hover (nur wenn nicht Marktplatz und gehovered) -->
        {#if platform.id !== 'S' && $hovering}
            <Billboard position={[0, 2.5, 0]}>
                <Text
                    text="→ Marktplatz"
                    color="#94a3b8"
                    fontSize={0.4}
                    anchorX="center"
                    anchorY="middle"
                />
            </Billboard>
        {/if}
    </T.Group>

    <!-- 3D Namensschild - unter dem Oktaeder -->
    <Billboard position={[0, 12, 0]}>
        {@const displayName = platformContent?.short ?? platform.id}
        <!-- Halbtransparente Glasscheibe mit mehr Tiefe -->
        <T.Mesh>
            <T.BoxGeometry args={[displayName.length * 0.5 + 1.5, 1.8, 0.3]} />
            <T.MeshStandardMaterial 
                color={isCurrentPlatform ? '#ffffff' : '#1e293b'}
                transparent
                opacity={isCurrentPlatform ? 0.95 : 0.85}
                metalness={0.1}
                roughness={0.2}
            />
        </T.Mesh>
        
        <!-- Rahmen mit Tiefe -->
        <T.Mesh position.z={-0.05}>
            <T.BoxGeometry args={[displayName.length * 0.5 + 1.7, 2, 0.1]} />
            <T.MeshStandardMaterial 
                color={platformGlowColor}
                emissive={platformGlowColor}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
            />
        </T.Mesh>

        <!-- 3D Text (kleinere Schrift) -->
        <Text
            text={displayName}
            color={isCurrentPlatform ? '#1e293b' : '#ffffff'}
            fontSize={0.7}
            anchorX="center"
            anchorY="middle"
            position.z={0.2}
            outlineWidth={isCurrentPlatform ? 0 : 0.02}
            outlineColor="#000000"
        />
    </Billboard>

    <!-- Wegweiser unter dem Plattformschild (nur wenn relatedProjects vorhanden) -->
    {#if relatedProjects.length > 0 && platform.id !== 'S'}
        <Signpost
            {relatedProjects}
            position={[0, 9.5, 0]}
            platformId={platform.id}
            compact={true}
        />
    {/if}

    <!-- ============================================ -->
    <!-- PLATTFORM-INHALTE (nur für aktuelle/Ziel-Plattform!) -->
    <!-- Inhalte werden gerendert wenn: -->
    <!-- - Wir auf dieser Plattform sind (und nicht wegtransportieren) -->
    <!-- - ODER wir zu dieser Plattform transportieren (Vorrendern) -->
    <!-- ============================================ -->
    
    {#if platformContent && platform.id !== 'S' && shouldRenderContent}
        <!-- Info-Hexagon im Zentrum -->
        {#if platformContent.aspects.length > 0}
            <InfoHexagon
                platformName={platformContent.title}
                platformDescription={platformContent.description}
                aspects={platformContent.aspects}
                position={[0, 1.5, 0]}
                height={5}
                radius={3}
                color={platformColor}
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/if}

        <!-- Messe-Wand am hinteren Rand (dynamische Anzahl Hexagon-Kanten) -->
        {#if wallPosters.length > 0}
            {@const postersPerWall = 2} <!-- Max. 2 Poster pro Wand -->
            {@const neededWalls = Math.ceil(wallPosters.length / postersPerWall)}
            {@const wallCount = Math.min(neededWalls, 6)} <!-- Max. 6 Wände (komplettes Hexagon) -->
            <MesseWall
                posters={wallPosters}
                platformSize={platform.size}
                platformColor={platformColor}
                wallHeight={10}
                {wallCount}
                startEdge={3}
                platformPosition={[platform.x, platform.y, platform.z]}
                platformId={platform.id}
            />
        {/if}

        <!-- Freistehende Exhibit-Booths: Innerer Kreis (max 7) + Dreiecks-Ecken (je 3) -->
        {#each boothProjects as project, i}
            {@const boothCount = boothProjects.length}
            {@const boothSize = boothCount > 6 ? 'small' : (boothCount > 3 ? 'medium' : 'medium')}
            
            <!-- Layout-System: Einzeln (≤5) oder in Dreiergruppen (≥6) -->
            {@const sectorSize = (2 * Math.PI) / 6}
            {@const hexRotation = Math.PI / 6}
            {@const usedSectors = 4}
            {@const startSector = 2}
            {@const usedArcSize = usedSectors * sectorSize}
            {@const startAngle = startSector * sectorSize + hexRotation}
            {@const angleSpread = usedArcSize * 0.85}
            
            {@const useTriangleGroups = boothCount >= 6}
            
            {@const groupIndex = useTriangleGroups ? Math.floor(i / 3) : 0}
            {@const posInGroup = useTriangleGroups ? i % 3 : 0}
            {@const totalGroups = useTriangleGroups ? Math.ceil(boothCount / 3) : 1}
            
            <!-- Zentrum der Gruppe berechnen -->
            {@const groupAngle = useTriangleGroups
                ? (totalGroups === 1
                    ? startAngle + angleSpread / 2
                    : startAngle + (groupIndex / (totalGroups - 1)) * angleSpread)
                : (boothCount === 1 
                    ? startAngle + angleSpread / 2
                    : startAngle + (i / (boothCount - 1)) * angleSpread)
            }
            
            <!-- Dreieck-Formation: 3 Ecken um gemeinsamen Mittelpunkt, jede Booth schaut nach außen -->
            <!-- Reihenfolge gegen den Uhrzeigersinn: A (oben) → B (unten-links) → C (unten-rechts) -->
            {@const triangleRadius = useTriangleGroups ? 2.5 : 0}
            {@const triangleAngles = [
                0,           // Position 0: oben (A)
                -2.0944,     // Position 1: unten-links (B) = -120° = gegen Uhrzeigersinn
                -4.1888      // Position 2: unten-rechts (C) = -240° = gegen Uhrzeigersinn
            ]}
            
            {@const localAngle = useTriangleGroups ? triangleAngles[posInGroup] : 0}
            {@const localX = useTriangleGroups ? Math.cos(groupAngle + localAngle) * triangleRadius : 0}
            {@const localZ = useTriangleGroups ? Math.sin(groupAngle + localAngle) * triangleRadius : 0}
            
            <!-- Welt-Position: Gruppen-Zentrum + lokale Dreieck-Position -->
            {@const baseRadius = useTriangleGroups ? platform.size * 0.48 : platform.size * 0.45}
            {@const centerX = Math.cos(groupAngle) * baseRadius}
            {@const centerZ = Math.sin(groupAngle) * baseRadius}
            
            {@const boothX = centerX + localX}
            {@const boothZ = centerZ + localZ}
            
            <!-- Rotation: Jede Booth zeigt nach INNEN zum Dreieck-Zentrum (Kamera schaut von außen) -->
            {@const boothRotation = useTriangleGroups
                ? -(groupAngle + localAngle) + Math.PI / 2 + Math.PI
                : -groupAngle + Math.PI / 2
            }
            
            <ExhibitBooth
                {project}
                position={[boothX, 1.5, boothZ]}
                rotation={boothRotation}
                size={boothSize}
                platformPosition={[platform.x, platform.y, platform.z]}
                platformId={platform.id}
            />
        {/each}
    {:else if shouldRenderContent}
        <!-- Fallback: Alte ExhibitStand-Komponente für Projekte ohne PlatformContent -->
        {#each projects as project, i}
            <ExhibitStand 
                {project} 
                position={[standPositions[i]?.x ?? 0, 2, standPositions[i]?.z ?? 0]} 
                platformPosition={[platform.x, platform.y, platform.z]}
                platformId={platform.id}
            />
        {/each}
    {/if}

    <!-- 
        6 Spotlights wie in einer Messehalle (Performance-abhängig)
        WICHTIG: Immer gemountet mit visible={} statt {#if} um Shader-Kompilierung beim Transport zu vermeiden!
    -->
    <T.Group visible={shouldRenderSpotlights}>
        {#each spotlightPositions.slice(0, spotlightCount) as spot, i}
            <!-- Target-Objekt direkt unter dem Spot (leicht zur Mitte versetzt) -->
            <T.Object3D 
                position={[spot.x * platform.size * 0.85, 0, spot.z * platform.size * 0.85]} 
                bind:ref={spotTargets[i]} 
            />
            
            <!-- Spotlight von oben - zielt fast senkrecht nach unten -->
            <T.SpotLight
                position={[spot.x * platform.size, spotlightHeight - 1.5, spot.z * platform.size]}
                target={spotTargets[i]}
                color={platformGlowColor}
                intensity={250}
                distance={spotlightHeight * 2.5}
                angle={0.7}
                penumbra={0.6}
                decay={1.2}
                castShadow={performanceStore.settings.enableShadows}
            />
            <!-- Aufhängung (kurze Stange) -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight - 0.5, spot.z * platform.size]}>
                <T.CylinderGeometry args={[0.08, 0.08, 1, 8]} />
                {#if usePBRMaterials}
                    <T.MeshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
                {:else}
                    <T.MeshBasicMaterial color="#374151" />
                {/if}
            </T.Mesh>
            <!-- Spot-Gehäuse (hängt unter der Traverse) -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight - 1.3, spot.z * platform.size]}>
                <T.CylinderGeometry args={[0.5, 0.3, 0.6, 8]} />
                {#if usePBRMaterials}
                    <T.MeshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
                {:else}
                    <T.MeshBasicMaterial color="#1f2937" />
                {/if}
            </T.Mesh>
            <!-- Leuchtende Linse -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight - 1.7, spot.z * platform.size]}>
                <T.SphereGeometry args={[0.25, 8, 8]} />
                <T.MeshBasicMaterial color={platformGlowColor} />
            </T.Mesh>
        {/each}
        
        <!-- Dünne Traversen-Struktur die die Lampen verbindet (horizontal liegend) -->
        <T.Mesh position.y={spotlightHeight} rotation.x={Math.PI / 2}>
            <T.TorusGeometry args={[platform.size * spotlightRadius, 0.15, 6, 6]} />
            {#if usePBRMaterials}
                <T.MeshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
            {:else}
                <T.MeshBasicMaterial color="#374151" />
            {/if}
        </T.Mesh>
    </T.Group>

    <!-- Dezentes Ambient-Licht für Plattformen ohne Spotlights -->
    <T.PointLight
        visible={!shouldRenderSpotlights}
        position={[0, 10, 0]}
        color={platformGlowColor}
        intensity={5}
        distance={platform.size * 1.5}
    />
</T.Group>
