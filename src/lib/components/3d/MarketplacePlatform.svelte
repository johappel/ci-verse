<script lang="ts">
    /**
     * MarketplacePlatform - S-Plattform (Marktplatz) nach Skizze
     * 
     * Layout (Hexagon mit Pentagon-artiger Nutzung):
     * - Transport-Portal: Mitte
     * - InstitutionBooth (Turm): Hinten-Mitte (vor Wand)
     * - 4 Wandsegmente: Am Rand für 6 Leitlinien-Poster
     * - Chatpanel: Oben links (am Turm)
     * - Newspanel: Unten rechts (separater Stand)
     * - Eventpanel: Links (separater Stand)
     * - Stehtische: Verteilt für Atmosphäre
     * - Start-Position: Rechts vom Portal
     */
    import { T, useTask } from '@threlte/core';
    import { useCursor, Text, Billboard } from '@threlte/extras';
    import { Spring } from 'svelte/motion';
    import type { Platform as PlatformType } from '$lib/logic/platforms';
    import type { MarketplaceContent } from '$lib/types/project';
    import MesseWall from './MesseWall.svelte';
    import InstitutionBooth from './InstitutionBooth.svelte';
    import MarketplaceStand from './MarketplaceStand.svelte';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getMarketplaceContent } from '$lib/data/mockProjects';
    import { mockProjects } from '$lib/data/mockProjects';
    import type { ProjectData, Department, Perspective, TargetGroup } from '$lib/types/project';

    let { platform }: { platform: PlatformType } = $props();

    // Marketplace-Daten laden
    let marketplace = $derived(getMarketplaceContent());

    // Oktaeder-Rotation (animiert)
    let octaederRotation = $state(0);
    useTask((delta) => {
        if (isCurrentPlatform) {
            octaederRotation += delta * 0.5;
        }
    });

    // Cursor und Hover
    const { hovering, onPointerEnter, onPointerLeave } = useCursor();
    const glowOpacity = new Spring(0.3, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        glowOpacity.target = $hovering || isCurrentPlatform ? 0.7 : 0.3;
    });

    // Ist diese Plattform die aktuelle?
    let isCurrentPlatform = $derived(worldStore.state.currentPlatform === platform.id);
    
    // Drag-Detection
    let pointerDownPos = $state<{ x: number; y: number } | null>(null);
    let pointerDownTime = $state<number>(0);
    const DRAG_THRESHOLD = 5;
    const CLICK_MAX_DURATION = 300;

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
        
        const isClick = dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD && duration < CLICK_MAX_DURATION;
        
        if (isClick && !isCurrentPlatform) {
            worldStore.startTransport(platform.id);
        }
        
        pointerDownPos = null;
    }

    // ========== POSITIONEN NACH SKIZZE ==========
    // Hexagon: Kamera startet rechts vom Portal, schaut zur Mitte
    // 
    // Layout (Draufsicht, X nach rechts, Z nach oben):
    //
    //           Wand 3 (hinten-links)    Wand 4 (hinten-rechts)
    //                    \                    /
    //                     \   [Turm/CI]      /
    //                      \      |         /
    //     [Event]           \     |        /
    //     (links)   Wand 2   \    |       /   Wand 1
    //                         \   |      /
    //                          \  ●     /    ← Transport-Portal (Mitte)
    //                           \ |    /
    //                            \|   /
    //                      [Start] →  [News]
    //                     (rechts)    (rechts-vorne)
    
    const institutionPosition = { 
        x: -18,           // Links versetzt
        z: -18,           // Hinten-links, vor der Wand
        rotation: Math.PI * 0.15  // Leicht gedreht zur Mitte
    };
    
    // Terminal-Stände nach Ellipsen-Positionen im Screenshot:
    // Rot (links-mitte) = Events, Grün (unten-links) = Publications
    // Chat ist am Turm (InstitutionBooth) integriert
    const terminalPositions: Array<{ x: number; z: number; rotation: number; type: string }> = [
        { x: -12, z: 22, rotation: Math.PI, type: 'publications' },        // Grün: unten-links (vorne)
        { x: -24, z: 5, rotation: Math.PI * 0.5, type: 'events' }          // Rot: links-mitte
    ];

    // Institution-Stand aus den Daten finden
    let institutionStand = $derived(marketplace.stands.find(s => s.type === 'institution'));
    // Terminal-Stände (publications, events)
    let terminalStands = $derived(marketplace.stands.filter(s => s.type !== 'institution'));

    // ========== WANDSEGMENTE FÜR LEITLINIEN ==========
    // 3 Wände mit 6 Leitlinien, Wand hinter Turm bleibt frei
    // Aufteilung: Links 2 Wände (4 Poster), Rechts 1 Wand (2 Poster)
    
    // Dummy-Projekte für Leitlinien-Poster erstellen
    const leitlinienProjects = $derived(
        marketplace.wallPosters.map((poster, index) => {
            const project: ProjectData = {
                id: poster.id,
                title: poster.title,
                slug: poster.id,
                externalUrl: `#perspective-${poster.perspective}`,
                departments: ['S1' as Department],
                perspectives: [poster.perspective] as Perspective[],
                targetGroups: [] as TargetGroup[],
                type: 'ground',
                staff: [],
                shortTeaser: `Leitlinie: ${poster.title}`,
                display: {
                    slogan: poster.title,
                    posterImage: poster.imageUrl,
                    color: getPerspectiveColor(poster.perspective)
                }
            };
            return { project, position: index };
        })
    );

    // Aufteilen: Linke Wände (Poster 0-3) und Rechte Wand (Poster 4-5)
    const leftWallPosters = $derived(leitlinienProjects.slice(0, 4).map((p, i) => ({ ...p, position: i })));
    const rightWallPosters = $derived(leitlinienProjects.slice(4, 6).map((p, i) => ({ ...p, position: i })));

    // Perspektiven-Farben
    function getPerspectiveColor(perspective: string): string {
        const colors: Record<string, string> = {
            justice: '#facc15',
            sustainability: '#4ade80',
            digitality: '#22d3ee',
            structure: '#a78bfa'
        };
        return colors[perspective] || '#ffffff';
    }

    // Stehtisch-Positionen (für Atmosphäre)
    const stehtischPositions = [
        { x: -8, z: 8, rotation: 0 },      // Links-vorne
        { x: 8, z: -5, rotation: Math.PI / 4 },   // Rechts-mitte
        { x: -5, z: -8, rotation: -Math.PI / 6 }, // Links-hinten
    ];

    // Spotlight-Positionen
    const spotlightHeight = 15;
    const spotlightPositions = Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return {
            x: Math.cos(angle) * platform.size * 0.7,
            z: Math.sin(angle) * platform.size * 0.7
        };
    });
</script>

<T.Group position={[platform.x, platform.y, platform.z]}>
    
    <!-- ========== HEXAGONALE PLATTFORM-BASIS ========== -->
    <T.Mesh
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerenter={onPointerEnter}
        onpointerleave={onPointerLeave}
        receiveShadow
        rotation.y={Math.PI / 6}
    >
        <T.CylinderGeometry args={[platform.size, platform.size, 3, 6]} />
        <T.MeshStandardMaterial
            color={platform.color}
            metalness={0.3}
            roughness={0.6}
        />
    </T.Mesh>

    <!-- Leuchtender Ring -->
    <T.Mesh position.y={-2} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.98, platform.size * 1.02, 6]} />
        <T.MeshBasicMaterial
            color={platform.glowColor}
            transparent
            opacity={glowOpacity.current}
            side={2}
        />
    </T.Mesh>

    <!-- ========== WANDSEGMENTE FÜR LEITLINIEN ========== -->
    <!-- Zwei MesseWall-Gruppen: Links und Rechts vom Turm, Wand dahinter frei -->
    <!-- Hexagon Edges (mit 30° Rotation): 
         0 = rechts-vorne, 1 = rechts, 2 = rechts-hinten
         3 = hinten (FREI für Turm), 4 = links-hinten, 5 = links-vorne
    -->
    
    <!-- Linke Wände (2 Wände, 4 Poster) - Edges 4 und 5 (links-hinten, links-vorne) -->
    <MesseWall
        posters={leftWallPosters}
        platformSize={platform.size}
        platformColor={platform.color}
        wallHeight={8}
        wallCount={2}
        startEdge={5}
        platformPosition={[platform.x, platform.y, platform.z]}
        platformId={platform.id}
        imageOnly={true}
    />
    
    <!-- Rechte Wand (1 Wand, 2 Poster) - Edge 1 (rechts) -->
    <MesseWall
        posters={rightWallPosters}
        platformSize={platform.size}
        platformColor={platform.color}
        wallHeight={8}
        wallCount={1}
        startEdge={1}
        platformPosition={[platform.x, platform.y, platform.z]}
        platformId={platform.id}
        imageOnly={true}
    />

    <!-- ========== INSTITUTION BOOTH (Turm mit CI-Logo) ========== -->
    {#if institutionStand}
        <InstitutionBooth
            stand={institutionStand}
            position={[institutionPosition.x, 1.5, institutionPosition.z]}
            rotation={institutionPosition.rotation}
            platformPosition={[platform.x, platform.y, platform.z]}
        />
    {/if}

    <!-- ========== TERMINAL STÄNDE (News rechts, Events links) ========== -->
    {#each terminalStands as stand, i}
        {@const pos = terminalPositions.find(p => p.type === stand.type) || terminalPositions[i]}
        {#if pos}
            <MarketplaceStand
                {stand}
                position={[pos.x, 1.5, pos.z]}
                rotation={pos.rotation}
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/if}
    {/each}

    <!-- ========== STEHTISCHE (Atmosphäre) ========== -->
    {#each stehtischPositions as tisch}
        <T.Group position={[tisch.x, 1.5, tisch.z]} rotation.y={tisch.rotation}>
            <!-- Tischplatte -->
            <T.Mesh position.y={1} castShadow>
                <T.CylinderGeometry args={[0.4, 0.35, 0.08, 16]} />
                <T.MeshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
            </T.Mesh>
            <!-- Tischbein -->
            <T.Mesh position.y={0.5} castShadow>
                <T.CylinderGeometry args={[0.05, 0.08, 1, 8]} />
                <T.MeshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
            </T.Mesh>
            <!-- Standfuß -->
            <T.Mesh position.y={0.02}>
                <T.CylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
                <T.MeshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
            </T.Mesh>
        </T.Group>
    {/each}

    <!-- ========== OKTAEDER (Navigation Hub) ========== -->
    <T.Group position.y={15}>
        <T.Mesh 
            rotation.y={octaederRotation}
            rotation.x={Math.PI / 8}
        >
            <T.OctahedronGeometry args={[1.5, 0]} />
            <T.MeshPhysicalMaterial 
                color={platform.glowColor}
                emissive={platform.glowColor}
                emissiveIntensity={isCurrentPlatform ? 0.6 : 0.2}
                metalness={0.3}
                roughness={0.1}
                transparent
                opacity={0.7}
                transmission={0.3}
            />
        </T.Mesh>
        
        <!-- Innerer Kern -->
        <T.Mesh rotation.y={octaederRotation * -1.5}>
            <T.SphereGeometry args={[0.6, 16, 16]} />
            <T.MeshBasicMaterial color={platform.glowColor} />
        </T.Mesh>
        
        <!-- Punktlicht -->
        <T.PointLight
            color={platform.glowColor}
            intensity={isCurrentPlatform ? 60 : 20}
            distance={25}
            decay={2}
        />
    </T.Group>

    <!-- ========== NAMENSSCHILD ========== -->
    <Billboard position={[0, 12, 0]}>
        <T.Mesh>
            <T.BoxGeometry args={[6, 1.8, 0.3]} />
            <T.MeshStandardMaterial 
                color={isCurrentPlatform ? '#ffffff' : '#1e293b'}
                transparent
                opacity={0.9}
                metalness={0.1}
                roughness={0.2}
            />
        </T.Mesh>
        <T.Mesh position.z={-0.05}>
            <T.BoxGeometry args={[6.2, 2, 0.1]} />
            <T.MeshStandardMaterial 
                color={platform.glowColor}
                emissive={platform.glowColor}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
            />
        </T.Mesh>
        <Text
            text={platform.name}
            color={isCurrentPlatform ? '#1e293b' : '#e2e8f0'}
            fontSize={0.6}
            font="/fonts/Inter-Bold.woff"
            position={[0, 0, 0.2]}
            anchorX="center"
            anchorY="middle"
        />
    </Billboard>

    <!-- ========== SPOTLIGHTS ========== -->
    {#if isCurrentPlatform}
        {#each spotlightPositions as spot, i}
            <T.SpotLight
                position={[spot.x, spotlightHeight, spot.z]}
                target.position={[spot.x * 0.3, 0, spot.z * 0.3]}
                angle={0.4}
                penumbra={0.5}
                intensity={30}
                distance={30}
                color="#ffffff"
                castShadow
            />
        {/each}
    {/if}

    <!-- ========== AMBIENT FÜR MARKTPLATZ ========== -->
    <T.PointLight
        position={[0, 8, 0]}
        intensity={isCurrentPlatform ? 40 : 15}
        distance={platform.size * 2}
        color="#fef3c7"
    />

</T.Group>
