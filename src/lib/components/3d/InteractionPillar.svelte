<script lang="ts">
    /**
     * InteractionPillar - Einfache Bodenplatte vor Exponaten
     * 
     * Struktur (vereinfacht):
     * - Äußerer Ring: Immer sichtbar (dezent)
     * - Innerer Ring: Erscheint bei Nähe (<12 Einheiten)
     * - Klick öffnet ProjectCard
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { useCursor, Text, Billboard } from '@threlte/extras';
    import type { ProjectData } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    
    // Performance: Im Low-Mode Transparenz deaktivieren (GPU-lastig)
    const enableTransparency = $derived(performanceStore.qualityLevel !== 'low');

    interface Props {
        project: ProjectData;
        position?: [number, number, number];
        rotation?: number;
        size?: number;
        worldPosition?: [number, number, number];
        onActivate?: () => void;
        platformId?: string;
    }

    let { 
        project, 
        position = [0, 0, 0],
        rotation = 0,
        size = 0.8,
        worldPosition,
        onActivate,
        platformId = ''
    }: Props = $props();
    
    const effectiveWorldPos = $derived(worldPosition || position);

    const { camera } = useThrelte();
    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    const ACTIVATION_DISTANCE = 12;
    
    let isNearby = $state(false);
    let isHovered = $state(false);
    let frameCounter = 0;
    
    // Task-Optimierung: Nur laufen wenn auf dieser Plattform (separate Signale!)
    let isOnPlatform = $derived(platformId ? worldStore.currentPlatform === platformId : true);
    let isTransportTarget = $derived(platformId ? worldStore.transportTarget === platformId : false);
    let shouldRunTask = $derived(isOnPlatform || isTransportTarget);
    
    const displayColor = project.display?.color || project.color || '#3b82f6';

    useTask(() => {
        if (!shouldRunTask) {
            isNearby = false;
            return;
        }
        
        frameCounter++;
        if (frameCounter % 10 !== 0) return; // Noch seltener prüfen
        
        const camPos = $camera.position;
        const dx = camPos.x - effectiveWorldPos[0];
        const dy = camPos.y - effectiveWorldPos[1];
        const dz = camPos.z - effectiveWorldPos[2];
        const distSq = dx * dx + dy * dy + dz * dz;
        
        isNearby = distSq <= ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
    });

    function handleClick() {
        if (!isNearby) return;
        
        if (onActivate) {
            onActivate();
            return;
        }
        
        if (project.externalUrl) {
            worldStore.openIframe(project.externalUrl, project.title);
        } else {
            worldStore.selectProject(project.id);
        }
    }
</script>

<T.Group position={position} rotation.y={rotation}>
    <!-- Unsichtbare Klickfläche (gesamter Bereich) -->
    <T.Mesh 
        position.y={0.01} 
        rotation.x={-Math.PI / 2}
        onclick={handleClick}
        onpointerenter={() => { isHovered = true; onPointerEnter(); }}
        onpointerleave={() => { isHovered = false; onPointerLeave(); }}
    >
        <T.CircleGeometry args={[size, 6]} />
        <T.MeshBasicMaterial transparent opacity={0.01} />
    </T.Mesh>

    <!-- Äußerer Ring - immer sichtbar -->
    <T.Mesh position.y={0.02} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[size * 0.7, size, 6]} />
        <T.MeshBasicMaterial 
            color={isHovered ? '#ffffff' : '#64748b'}
            transparent={enableTransparency}
            opacity={enableTransparency ? (isHovered ? 0.6 : 0.3) : 1.0}
        />
    </T.Mesh>

    <!-- Innerer Ring - nur bei Nähe sichtbar -->
    {#if isNearby}
    <T.Mesh position.y={0.03} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[size * 0.2, size * 0.5, 6]} />
        <T.MeshBasicMaterial 
            color={displayColor}
            transparent={enableTransparency}
            opacity={enableTransparency ? (isHovered ? 0.9 : 0.6) : 1.0}
        />
    </T.Mesh>
    {/if}

    <!-- Hint bei Hover + Nähe -->
    {#if isNearby && isHovered}
    <Billboard position={[0, 0.6, 0]}>
        <T.Mesh>
            <T.PlaneGeometry args={[2.5, 0.5]} />
            <T.MeshBasicMaterial color="#ffffff" />
        </T.Mesh>
        <Text
            text="Details anzeigen"
            fontSize={0.18}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            position.z={0.01}
        />
    </Billboard>
    {/if}
</T.Group>