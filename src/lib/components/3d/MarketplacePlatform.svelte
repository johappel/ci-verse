<script lang="ts">
    /**
     * MarketplacePlatform - Spezielle S-Plattform (Marktplatz)
     * 
     * Unterschiede zur normalen Platform:
     * - 3 Marketplace-Stände (Institution, Publications, Events)
     * - 4 Leitlinien-Poster an den Wänden
     * - Zentrales Willkommens-Element
     * - Keine Projekt-Messewände (stattdessen Leitlinien)
     */
    import { T, useTask } from '@threlte/core';
    import { useCursor, Text, Billboard } from '@threlte/extras';
    import { Spring } from 'svelte/motion';
    import type { Platform as PlatformType } from '$lib/logic/platforms';
    import type { MarketplaceContent } from '$lib/types/project';
    import MarketplaceStand from './MarketplaceStand.svelte';
    import LeitlinienPoster from './LeitlinienPoster.svelte';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getMarketplaceContent } from '$lib/data/mockProjects';
    import type { Object3D } from 'three';

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

    // ========== STAND-POSITIONEN ==========
    // 3 Stände in Dreiecks-Formation
    const standPositions: Array<{ x: number; z: number; rotation: number }> = [
        { x: 0, z: -6, rotation: 0 },           // Hinten (Institution)
        { x: -7, z: 4, rotation: Math.PI / 3 }, // Links vorne (Publications)
        { x: 7, z: 4, rotation: -Math.PI / 3 }  // Rechts vorne (Events)
    ];

    // ========== LEITLINIEN-POSTER POSITIONEN ==========
    // 4 Poster an den 4 hinteren Hexagon-Kanten
    const hexInnerRadius = platform.size * Math.cos(Math.PI / 6) * 0.95;
    const posterPositions = $derived(
        marketplace.wallPosters.map((poster, i) => {
            // Verteile auf Kanten 2, 3, 4, 5 (hintere Hälfte des Hexagons)
            const edgeIndex = i + 2;
            const angle = (edgeIndex * Math.PI / 3) + Math.PI / 6;
            return {
                poster,
                x: Math.cos(angle) * hexInnerRadius,
                z: Math.sin(angle) * hexInnerRadius,
                rotation: -angle - Math.PI / 2
            };
        })
    );

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

    <!-- ========== ZENTRALES WILLKOMMENS-ELEMENT ========== -->
    <T.Group position.y={1.5}>
        <!-- Sockel -->
        <T.Mesh castShadow>
            <T.CylinderGeometry args={[2, 2.5, 0.5, 8]} />
            <T.MeshStandardMaterial 
                color="#1e3a5f" 
                metalness={0.4} 
                roughness={0.5}
            />
        </T.Mesh>
        
        <!-- Willkommens-Text -->
        <Billboard position={[0, 2, 0]}>
            <Text
                text="🏛️"
                fontSize={1.5}
                anchorX="center"
                anchorY="middle"
            />
        </Billboard>
        <Billboard position={[0, 0.8, 0]}>
            <Text
                text="Comenius-Institut"
                color="#ffffff"
                fontSize={0.5}
                font="/fonts/Inter-Bold.woff"
                anchorX="center"
            />
        </Billboard>
        <Billboard position={[0, 0.2, 0]}>
            <Text
                text="Marktplatz"
                color="#94a3b8"
                fontSize={0.3}
                anchorX="center"
            />
        </Billboard>
    </T.Group>

    <!-- ========== MARKETPLACE STÄNDE ========== -->
    {#each marketplace.stands as stand, i}
        {@const pos = standPositions[i]}
        {#if pos}
            <MarketplaceStand
                {stand}
                position={[pos.x, 1.5, pos.z]}
                rotation={pos.rotation}
                platformPosition={[platform.x, platform.y, platform.z]}
            />
        {/if}
    {/each}

    <!-- ========== LEITLINIEN-POSTER ========== -->
    {#each posterPositions as { poster, x, z, rotation }}
        <LeitlinienPoster
            {poster}
            position={[x, 1.5, z]}
            {rotation}
            size="medium"
        />
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
