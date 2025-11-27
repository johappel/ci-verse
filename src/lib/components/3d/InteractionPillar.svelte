<script lang="ts">
    /**
     * InteractionPillar - Leuchtende Bodenplatte vor Exponaten
     * 
     * Struktur:
     * - Flache hexagonale Platte im Boden
     * - Leuchtender Ring + Kern
     * - Aktiviert sich bei Nähe (<12 Einheiten)
     * - Klick öffnet ProjectCard
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { HTML, useCursor } from '@threlte/extras';
    import { BadgeInfo } from 'lucide-svelte';
    import type { ProjectData } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';

    interface Props {
        project: ProjectData;
        position?: [number, number, number];
        rotation?: number;
        size?: number;
        worldPosition?: [number, number, number];
    }

    let { 
        project, 
        position = [0, 0, 0],
        rotation = 0,
        size = 0.8,
        worldPosition
    }: Props = $props();
    
    const effectiveWorldPos = $derived(worldPosition || position);

    const { camera } = useThrelte();
    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    const ACTIVATION_DISTANCE = 12;
    
    let isNearby = $state(false);
    let isHovered = $state(false);
    let pulsePhase = $state(0);
    let frameCounter = 0;
    
    const displayColor = project.display?.color || project.color || '#3b82f6';

    useTask((delta) => {
        frameCounter++;
        
        if (isNearby || isHovered) {
            pulsePhase += delta * 2.5;
        }
        
        if (frameCounter % 6 !== 0) return;
        
        const camPos = $camera.position;
        const wx = effectiveWorldPos[0];
        const wy = effectiveWorldPos[1];
        const wz = effectiveWorldPos[2];
        
        const dx = camPos.x - wx;
        const dy = camPos.y - wy;
        const dz = camPos.z - wz;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        isNearby = distSq <= ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
    });

    function handleClick() {
        if (!isNearby) return;
        // Öffne ProjectCard statt externe URL
        worldStore.selectProject(project.id);
    }

    // Puls-Animation
    let pulseIntensity = $derived(isNearby ? 0.6 + Math.sin(pulsePhase) * 0.4 : 0.2);
    let ringScale = $derived(isHovered ? 1.15 + Math.sin(pulsePhase * 2) * 0.05 : 1.0);
</script>

<T.Group position={position} rotation.y={rotation}>
    <!-- Basis-Platte (dunkel, leicht erhaben) -->
    <T.Mesh 
        position.y={0.02} 
        rotation.x={-Math.PI / 2}
        onclick={handleClick}
        onpointerenter={() => { isHovered = true; onPointerEnter(); }}
        onpointerleave={() => { isHovered = false; onPointerLeave(); }}
    >
        <T.CircleGeometry args={[size, 6]} />
        <T.MeshStandardMaterial 
            color={isNearby ? '#1e293b' : '#0f172a'}
            metalness={0.6}
            roughness={0.4}
        />
    </T.Mesh>

    <!-- Äußerer leuchtender Ring -->
    <T.Mesh position.y={0.03} rotation.x={-Math.PI / 2} scale={[ringScale, ringScale, 1]}>
        <T.RingGeometry args={[size * 0.75, size * 0.95, 6]} />
        <T.MeshBasicMaterial 
            color={displayColor}
            transparent
            opacity={pulseIntensity * 0.7}
            side={2}
        />
    </T.Mesh>

    <!-- Innerer leuchtender Kern -->
    <T.Mesh position.y={0.04} rotation.x={-Math.PI / 2}>
        <T.CircleGeometry args={[size * 0.3, 6]} />
        <T.MeshBasicMaterial 
            color={isHovered ? '#ffffff' : displayColor}
            transparent
            opacity={isNearby ? pulseIntensity : 0.15}
        />
    </T.Mesh>

    <!-- Link-Symbol in der Mitte (BadgeInfo Icon) -->
    {#if isNearby}
        <HTML position={[0, 0.15, 0]} center transform scale={0.015} pointerEvents="none">
            <div style="pointer-events: none;">
                <BadgeInfo 
                    size={48} 
                    strokeWidth={2}
                    color="#ffffff"
                />
            </div>
        </HTML>
    {:else}
        <T.Mesh position.y={0.05} rotation.x={-Math.PI / 2}>
            <T.RingGeometry args={[size * 0.08, size * 0.15, 16]} />
            <T.MeshBasicMaterial 
                color="#94a3b8"
                transparent
                opacity={0.3}
            />
        </T.Mesh>
    {/if}

    <!-- Glow nach oben (nur wenn aktiv und gehovert) -->
    {#if isNearby && isHovered}
        <T.PointLight
            position.y={0.3}
            color={displayColor}
            intensity={8}
            distance={4}
            decay={2}
        />
    {/if}

    <!-- Label (nur wenn nah und gehovert) -->
    {#if isNearby && isHovered}
        <HTML position={[0, 0.8, 0]} center transform={false}>
            <div style="
                background: #ffffff;
                color: #0f172a;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border-bottom: 3px solid {displayColor};
            ">
                Details anzeigen
            </div>
        </HTML>
    {/if}

    <!-- "Komm näher" Hinweis -->
    {#if !isNearby && isHovered}
        <HTML position={[0, 0.5, 0]} center transform={false}>
            <div style="
                background: rgba(15, 23, 42, 0.9);
                color: #94a3b8;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 0.7rem;
                white-space: nowrap;
            ">
                Näher kommen...
            </div>
        </HTML>
    {/if}
</T.Group>
