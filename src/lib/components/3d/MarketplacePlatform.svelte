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
    import ReceptionWall from './ReceptionWall.svelte';
    import MarketplaceStand from './MarketplaceStand.svelte';
    import EnergyFloor from './EnergyFloor.svelte';
    import EnergyBeam from './EnergyBeam.svelte';
    import NexusTerminal from './NexusTerminal.svelte';
    import TransportPortal from './TransportPortal.svelte';
    import { worldStore } from '$lib/logic/store.svelte';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    import { getMarketplaceContent } from '$lib/data/mockProjects';
    import { mockProjects } from '$lib/data/mockProjects';
    import type { ProjectData, Department, Perspective, TargetGroup } from '$lib/types/project';

    interface Props {
        platform: PlatformType;
    }

    let { platform }: Props = $props();

    // ============================================
    // DIREKTE TRANSPORT-SIGNALE (nicht mehr über state-Objekt!)
    // worldStore.currentPlatform etc. sind separate $state Variablen
    // ============================================
    let currentPlatformId = $derived(worldStore.currentPlatform);
    let isTransportingState = $derived(worldStore.isTransporting);
    
    // Abgeleitete Werte NUR von den isolierten Selektoren
    let isCurrentPlatform = $derived(currentPlatformId === platform.id);
    let isTransporting = $derived(isTransportingState && isCurrentPlatform);

    // Performance-Einstellungen (ändern sich selten)
    let enableEnergyFloor = $derived(performanceStore.settings.enableEnergyFloor);
    let enableEnergyBeam = $derived(performanceStore.settings.enableEnergyEffects);
    let enableGlowRings = $derived(performanceStore.settings.enableGlowRings);

    // Marketplace-Content laden (gecacht, ändert sich nie)
    const marketplace = getMarketplaceContent(); // NICHT $derived - statisch!

    // Farben aus Content-Daten (statisch)
    const platformColor = marketplace?.color ?? platform.color;
    const platformGlowColor = marketplace?.glowColor ?? platform.glowColor;

    // Performance-Settings (ändern sich selten)
    const enableAnimations = $derived(performanceStore.settings.enableAnimations);
    const usePBR = $derived(performanceStore.settings.usePBRMaterials);
    const showPointLight = $derived(performanceStore.qualityLevel !== 'low');
    const sphereSegments = $derived(performanceStore.qualityLevel === 'low' ? 8 : 16);

    // Zeit-basierte Animation
    let animTime = $state(0);
    
    // Oktaeder-Rotation (animiert) + Energie-Puls - NUR wenn Animationen aktiviert
    let octaederRotation = $state(0);
    let energyPulse = $state(0);
    
    useTask((delta) => {
        if (!enableAnimations) return; // Skip im Low-Mode
        animTime += delta;
        if (isCurrentPlatform) {
            octaederRotation += delta * 0.5;
            // Energie-Puls basierend auf Zeit
            const speed = isTransporting ? 8.0 : 2.0;
            energyPulse = Math.sin(animTime * speed) * 0.5 + 0.5;
        }
    });

    // Oktaeder-Glow basierend auf Energie
    let oktaederEmissive = $derived(
        isTransporting ? 1.2 + energyPulse * 0.8 : 0.3 + energyPulse * 0.4
    );
    let oktaederScale = $derived(
        isTransporting ? 1.0 + energyPulse * 0.15 : 1.0 + energyPulse * 0.05
    );

    // Cursor und Hover
    const { hovering, onPointerEnter, onPointerLeave } = useCursor();
    const glowOpacity = new Spring(0.3, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        glowOpacity.target = $hovering || isCurrentPlatform ? 0.7 : 0.3;
    });
    
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
    //           Terminal (hinten-links)    Wand 3 (hinten-rechts)
    //                    \                    /
    //                     \   [CI Reception] /
    //                      \      |         /                                                                      
    //         [Event]       \     |        /
    //         [News]         \    |       /   Wand 2                                                                    
    //                         \   |      /
    //                   [Start] → ●     /    
    //                           \ |    /
    //                            \|   /
    //                            Wand 1
    
    // Nexus Terminal: Links seitlich (ehemals ReceptionWall-Position)
    const nexusTerminalPosition = {
        x: -31,           // Links
        z: -21,           // Mittig (Z-Achse)
        rotation: Math.PI * 0.335  // schaut zur Mitte, Gleise ins Dunkel
    };

    // Empfangswand: Rechts neben Nexus Terminal (ehemals Terminal-Position)
    const receptionWallPosition = { 
        x: -1,           // Rechts vom Terminal
        z: -30,           // Weiter hinten
        rotation: Math.PI * 2.0  // schaut zur Plattform
    };

    // Team-Mitglieder (von comenius.de)
    const teamMembers = [
        { name: 'Dr. Jens Dechow', role: 'Direktor', imageUrl: 'https://comenius.de/wp-content/uploads/Dechow-Portrait-wpv_250x250_center_center.jpg' },
        { name: 'Dr. Simone Wustrack', role: 'Wissenschaftliche Mitarbeiterin', imageUrl: 'https://comenius.de/wp-content/uploads/Simone.Wustrack-wpv_250x250_center_center.png' },
        { name: 'Dr. Andreas Sander', role: 'Wissenschaftlicher Mitarbeiter', imageUrl: 'https://comenius.de/wp-content/uploads/Bild_Andreas-Sander-wpv_250x250_center_center.jpg' },
        { name: 'Dr. Juliane Ta Van', role: 'Wissenschaftliche Mitarbeiterin', imageUrl: 'https://comenius.de/wp-content/uploads/tavan-wpv_250x250_center_center.jpg' },
        { name: 'Dr. Cornelius Sturm', role: 'Wissenschaftlicher Mitarbeiter', imageUrl: 'https://comenius.de/wp-content/uploads/Profilbild-Cornelius-Sturm-2020-wpv_250x250_center_center.jpg' },
        { name: 'Dr. Ada Wolf', role: 'Wissenschaftliche Mitarbeiterin', imageUrl: 'https://comenius.de/wp-content/uploads/2018/11/MBO_8255-wpv_250x250_center_center.jpg' },
    ];
    
    // Terminal-Stände nach Ellipsen-Positionen im Screenshot:
    // Rot (links-mitte) = Events, Grün (unten-links) = Publications
    // Chat ist am Turm (InstitutionBooth) integriert
    const terminalPositions: Array<{ x: number; z: number; rotation: number; type: string }> = [
        { x: -26, z: 12, rotation: Math.PI * +0.6, type: 'publications' },        // Grün: unten-links (vorne)
        { x: -20, z: 23, rotation: Math.PI * +0.7, type: 'events' }       // Rot: Rechts neben ReceptionWall
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
                displayType: 'wall',
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
        { x: -15, z: 13, rotation: 0 },      // Links-vorne
        { x: -16, z: 16, rotation: Math.PI / 4 },   // Rechts-mitte
        { x: -18, z: 13, rotation: -Math.PI / 6 }, // Links-hinten
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

<T.Group 
    position={[platform.x, platform.y, platform.z]}
    userData={{ isPlatform: true, platformId: platform.id }}
>
    
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
            color={platformColor}
            metalness={0.3}
            roughness={0.6}
        />
    </T.Mesh>

    <!-- Leuchtender Ring (nur bei aktiviertem Glow) -->
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

    <!-- ========== TRANSPORT-PORTAL (Navigation zu anderen Plattformen) ========== -->
    <TransportPortal />

    <!-- ========== ENERGIE-BODEN (Leitlinien fliessen zur Mitte) ========== -->
    <!-- 6 Stroeme fuer alle 6 Poster-Positionen an den Hexagon-Waenden -->
    <!-- Hexagon-Edge-Winkel = edgeIndex * 60 Grad + 30 Grad (Plattform-Rotation) -->
    {#if enableEnergyFloor}
    <EnergyFloor 
        radius={platform.size * 0.85}
        intensity={0.2}
        posterAngles={[
            Math.PI * 0.187,  // Edge 0: rechts-vorne (30 Grad)
            Math.PI * 0.4,    // Edge 1: rechts (90 Grad) - POSTER hier!
            Math.PI * 0.59,  // Edge 2: rechts-hinten (150 Grad) - POSTER hier!
            Math.PI * 1.367,  // Edge 3: links-hinten (210 Grad) - frei (Turm)
            Math.PI * 1.80,   // Edge 4: links (270 Grad) - POSTER hier!
            Math.PI * 1.96   // Edge 5: links-vorne (330 Grad) - POSTER hier!
        ]}
        posterColors={[
            '#facc00',  // Edge 0: Gold
            '#facc15',  // Edge 1: Gold (justice)
            '#4ade80',  // Edge 2: Gruen (sustainability)
            '#1e293b',  // Edge 3: Dunkel (kein Poster - Turm)
            '#22d3ee',  // Edge 4: Cyan (digitality)
            '#a78bfa'   // Edge 5: Violett (structure)
        ]}
    />
    {/if}

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
        platformColor={platformColor}
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
        platformColor={platformColor}
        wallHeight={8}
        wallCount={1}
        startEdge={1}
        platformPosition={[platform.x, platform.y, platform.z]}
        platformId={platform.id}
        imageOnly={true}
    />

    <!-- ========== EMPFANGSWAND (Institution + Chatbot + Team) ========== -->
    <ReceptionWall 
        position={[receptionWallPosition.x, 1.5, receptionWallPosition.z]}
        rotation={receptionWallPosition.rotation}
        platformPosition={[platform.x, platform.y, platform.z]}
        {teamMembers}
    />

    <!-- ========== NEXUS TERMINAL (Partner-Verbindungen) ========== -->
    <NexusTerminal 
        position={[nexusTerminalPosition.x, 1.8, nexusTerminalPosition.z]}
        rotation={nexusTerminalPosition.rotation}
        platformColor={platformColor}
    />

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
        <T.Group position={[tisch.x, 1.5, tisch.z]} rotation.y={tisch.rotation} scale={1.8}>
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

    <!-- ========== ENERGIE-SÄULE (vom Boden zum Oktaeder) ========== -->
    {#if enableEnergyBeam}
    <EnergyBeam 
        height={13}
        baseY={2.1}
        radius={0.6}
        colors={['#facc15', '#4ade80', '#22d3ee', '#a78bfa']}
    />
    {/if}

    <!-- ========== OKTAEDER (Navigation Hub) - jetzt mit Energie-Puls ========== -->
    <T.Group position.y={15} scale={enableAnimations ? oktaederScale : 1.0}>
        <!-- Äußerer Oktaeder - leuchtend -->
        <T.Mesh 
            rotation.y={enableAnimations ? octaederRotation : 0}
            rotation.x={Math.PI / 8}
        >
            <T.OctahedronGeometry args={[1.5, 0]} />
            {#if usePBR}
            <T.MeshStandardMaterial 
                color={platformGlowColor}
                emissive={platformGlowColor}
                emissiveIntensity={1.5 + energyPulse * 1.5}
                metalness={0.8}
                roughness={0.2}
                transparent
                opacity={0.85}
            />
            {:else}
            <!-- Low-Mode: Einfaches Material -->
            <T.MeshBasicMaterial 
                color={platformGlowColor}
            />
            {/if}
        </T.Mesh>
        
        <!-- Mittlerer Glow-Layer -->
        
        <!-- Innerer Kern - pulsiert hell -->
        <T.Mesh rotation.y={enableAnimations ? octaederRotation * -1.5 : 0} scale={enableAnimations ? 0.8 + energyPulse * 0.3 : 0.8}>
            <T.SphereGeometry args={[0.6, sphereSegments, sphereSegments]} />
            <T.MeshBasicMaterial 
                color="#ffff44"
                opacity={ 1.0 }
            />
        </T.Mesh>
        
        <!-- Energie-Kern (farbig, pulsierend) - NUR wenn Animationen aktiviert -->
        {#if enableAnimations}
        <T.Mesh rotation.y={octaederRotation * 2} scale={0.5 + energyPulse * 0.3}>
            <T.IcosahedronGeometry args={[0.8, 0]} />
            <T.MeshBasicMaterial 
                color={platformGlowColor}
                transparent
                opacity={0.8 + energyPulse * 0.4}
            />
        </T.Mesh>
        {/if}
        
        <!-- Punktlicht - NUR bei nicht-Low-Mode -->
        {#if showPointLight}
        <T.PointLight
            color={platformGlowColor}
            intensity={80 + energyPulse * 120}
            distance={35}
            decay={2}
        />
        
        <!-- Zusätzliches weißes Licht für Helligkeit -->
        <T.PointLight
            color="#ffffff"
            intensity={30 + energyPulse * 50}
            distance={20}
            decay={2}
        />
        {/if}
        
        <!-- Energie-Glow-Ring um Oktaeder -->
        {#if isCurrentPlatform && enableAnimations}
            <T.Mesh rotation.x={Math.PI / 2}>
                <T.RingGeometry args={[1.8, 2.5, 32]} />
                <T.MeshBasicMaterial 
                    color={platformGlowColor}
                    transparent
                    opacity={0.3 + energyPulse * 0.4}
                    side={2}
                />
            </T.Mesh>
            
            <!-- Zweiter Ring (größer, subtiler) -->
            <T.Mesh rotation.x={Math.PI / 2} scale={1.3 + energyPulse * 0.2}>
                <T.RingGeometry args={[2.2, 2.6, 32]} />
                <T.MeshBasicMaterial 
                    color="#ffffff"
                    transparent
                    opacity={0.15 + energyPulse * 0.2}
                    side={2}
                />
            </T.Mesh>
        {/if}
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
                color={platformGlowColor}
                emissive={platformGlowColor}
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
            />
        </T.Mesh>
        <Text
            text={marketplace?.title ?? 'Marktplatz'}
            color={isCurrentPlatform ? '#1e293b' : '#ffffff'}
            fontSize={0.7}
            position={[0, 0, 0.2]}
            anchorX="center"
            anchorY="middle"
            outlineWidth={isCurrentPlatform ? 0 : 0.02}
            outlineColor="#000000"
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
