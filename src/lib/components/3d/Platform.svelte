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
    import { 
        getPlatformContent, 
        getBoothProjectsForPlatform, 
        getWallPostersForPlatform,
        getRelatedProjectsForPlatform 
    } from '$lib/data/mockProjects';
    import type { Object3D, Intersection } from 'three';

    let { platform, projects = [] }: { platform: PlatformType; projects: ProjectData[] } = $props();

    // Plattform-Content (Aspects, WallPosters, BoothProjects)
    let platformContent = $derived(getPlatformContent(platform.id));
    let boothProjects = $derived(getBoothProjectsForPlatform(platform.id));
    let wallPosters = $derived(getWallPostersForPlatform(platform.id));
    let relatedProjects = $derived(getRelatedProjectsForPlatform(platform.id));

    // Farben aus Content-Daten (Fallback auf platforms.ts)
    let platformColor = $derived(platformContent?.color ?? platform.color);
    let platformGlowColor = $derived(platformContent?.glowColor ?? platform.glowColor);

    // Referenzen für Spotlight-Targets (je Spot ein eigenes Target)
    let spotTargets: (Object3D | undefined)[] = $state(Array(6).fill(undefined));

    // Oktaeder-Rotation (animiert) - nur auf aktueller Plattform für Performance
    let octaederRotation = $state(0);
    useTask((delta) => {
        if (isCurrentPlatform) {
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

    // Layout für Projekt-Stände auf der Plattform
    let standPositions = $derived(getHexagonalLayout(projects.length, platform.size * 0.6));

    // Ist diese Plattform die aktuelle?
    let isCurrentPlatform = $derived(worldStore.state.currentPlatform === platform.id);
    
    // Ist diese Plattform das Transport-Ziel?
    let isTransportTarget = $derived(worldStore.state.transportTarget === platform.id);
    
    // ALLE Plattformen rendern immer ihre Inhalte (für flüssige Übergänge)
    let shouldRenderContent = true;
    
    // Spotlights nur auf aktueller ODER Ziel-Plattform (WebGL-Limit: max 2×6=12 Spots)
    let shouldRenderSpotlights = $derived(isCurrentPlatform || isTransportTarget);

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

<T.Group position={[platform.x, platform.y, platform.z]}>
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

    <!-- Dezenter Ring am Rand - leuchtet bei Hover -->
    <T.Mesh position.y={-2} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.98, platform.size * 1.02, 6]} />
        <T.MeshBasicMaterial
            color={platformGlowColor}
            transparent
            opacity={glowOpacity.current}
            side={2}
        />
    </T.Mesh>

    <!-- Rotierender Oktaeder über dem Schild - Ankerpunkt für Lichtlinien -->
    <!-- Klick auf Oktaeder = Zurück zum Marktplatz (S) -->
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
        </T.Mesh>
        <!-- Innere leuchtende Kugel (der "Kern", auch klickbar) -->
        <T.Mesh 
            rotation.y={octaederRotation * -1.5}
            onclick={(e: ThreltePointerEvent) => {
                e.stopPropagation();
                if (platform.id !== 'S') {
                    worldStore.startTransport('S');
                }
            }}
        >
            <T.SphereGeometry args={[0.5, 16, 16]} />
            <T.MeshBasicMaterial 
                color={platformGlowColor}
            />
        </T.Mesh>
        <!-- Punktlicht vom Kern -->
        <T.PointLight
            color={platformGlowColor}
            intensity={isCurrentPlatform ? 50 : 15}
            distance={20}
            decay={2}
        />
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
        <!-- Halbtransparente Glasscheibe mit mehr Tiefe -->
        <T.Mesh>
            <T.BoxGeometry args={[platform.name.length * 0.5 + 1.5, 1.8, 0.3]} />
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
            <T.BoxGeometry args={[platform.name.length * 0.5 + 1.7, 2, 0.1]} />
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
            text={platform.name}
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
                platformName={platform.name}
                aspects={platformContent.aspects}
                position={[0, 1.5, 0]}
                height={5}
                radius={3}
                color={platformColor}
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/if}

        <!-- Messe-Wand am hinteren Rand (3 Hexagon-Kanten) -->
        {#if wallPosters.length > 0}
            <MesseWall
                posters={wallPosters}
                platformSize={platform.size}
                platformColor={platformColor}
                wallHeight={10}
                wallCount={Math.min(wallPosters.length, 3)}
                startEdge={3}
                platformPosition={[platform.x, platform.y, platform.z]}
                platformId={platform.id}
            />
        {/if}

        <!-- Freistehende Exhibit-Booths für Booth-Projekte -->
        <!-- Positioniert auf der VORDEREN Seite (gegenüber der Wände bei startEdge=3) -->
        {#each boothProjects as project, i}
            {@const boothCount = boothProjects.length}
            {@const spreadAngle = Math.min(boothCount * 0.4, Math.PI * 0.5)}
            {@const startAngle = -spreadAngle / 2}
            {@const angle = startAngle + (i / Math.max(boothCount - 1, 1)) * spreadAngle}
            {@const radius = platform.size * 0.5}
            <ExhibitBooth
                {project}
                position={[Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius]}
                rotation={-angle + Math.PI / 2}
                size={boothCount > 3 ? 'small' : 'medium'}
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/each}
    {:else if shouldRenderContent}
        <!-- Fallback: Alte ExhibitStand-Komponente für Projekte ohne PlatformContent -->
        {#each projects as project, i}
            <ExhibitStand 
                {project} 
                position={[standPositions[i]?.x ?? 0, 2, standPositions[i]?.z ?? 0]} 
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/each}
    {/if}

    <!-- 6 Spotlights wie in einer Messehalle (aktuelle + Ziel-Plattform) -->
    {#if shouldRenderSpotlights}
        {#each spotlightPositions as spot, i}
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
                castShadow
            />
            <!-- Aufhängung (kurze Stange) -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight - 0.5, spot.z * platform.size]}>
                <T.CylinderGeometry args={[0.08, 0.08, 1, 8]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
            </T.Mesh>
            <!-- Spot-Gehäuse (hängt unter der Traverse) -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight - 1.3, spot.z * platform.size]}>
                <T.CylinderGeometry args={[0.5, 0.3, 0.6, 8]} />
                <T.MeshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
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
            <T.MeshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
        </T.Mesh>
    {/if}

    <!-- Dezentes Ambient-Licht für Plattformen ohne Spotlights -->
    {#if !shouldRenderSpotlights}
        <T.PointLight
            position={[0, 10, 0]}
            color={platformGlowColor}
            intensity={5}
            distance={platform.size * 1.5}
        />
    {/if}
</T.Group>
