<script lang="ts">
    import { T } from '@threlte/core';
    import { HTML, FakeGlowMaterial, useCursor } from '@threlte/extras';
    import { spring } from 'svelte/motion';
    import type { Platform as PlatformType } from '$lib/logic/platforms';
    import type { ProjectData } from '$lib/types/project';
    import ExhibitStand from './ExhibitStand.svelte';
    import { getHexagonalLayout } from '$lib/logic/layout';
    import { worldStore } from '$lib/logic/store.svelte';

    let { platform, projects = [] }: { platform: PlatformType; projects: ProjectData[] } = $props();

    // Cursor-Änderung bei Hover
    const { hovering, onPointerEnter, onPointerLeave } = useCursor();
    
    // Spring für numerische Werte
    let platformScale = spring(1, { stiffness: 0.3, damping: 0.8 });

    $effect(() => {
        platformScale.set($hovering ? 1.02 : 1);
    });

    // Layout für Projekt-Stände auf der Plattform
    let standPositions = $derived(getHexagonalLayout(projects.length, platform.size * 0.6));

    // Ist diese Plattform die aktuelle?
    let isCurrentPlatform = $derived(worldStore.state.currentPlatform === platform.id);

    function handlePlatformClick() {
        // Wenn nicht aktuelle Plattform, navigiere dorthin
        if (!isCurrentPlatform) {
            worldStore.startTransport(platform.id);
        }
    }
</script>

<T.Group position={[platform.x, platform.y, platform.z]} scale={$platformScale}>
    <!-- Hexagonale Plattform-Basis (6-seitiger Zylinder) -->
    <T.Mesh
        onclick={handlePlatformClick}
        onpointerenter={onPointerEnter}
        onpointerleave={onPointerLeave}
        receiveShadow
        rotation.y={Math.PI / 6}
    >
        <!-- Plattform ist jetzt 3 Einheiten dick (begehbar) -->
        <T.CylinderGeometry args={[platform.size, platform.size, 3, 6]} />
        <T.MeshStandardMaterial
            color={platform.color}
            metalness={0.3}
            roughness={0.6}
            emissive={isCurrentPlatform ? platform.glowColor : '#000000'}
            emissiveIntensity={isCurrentPlatform ? 0.3 : 0}
        />
    </T.Mesh>

    <!-- Glow-Effekt mit FakeGlowMaterial (sichtbar wenn aktuelle Plattform) -->
    {#if isCurrentPlatform}
        <T.Mesh position.y={-1} rotation.y={Math.PI / 6}>
            <T.CylinderGeometry args={[platform.size * 1.1, platform.size * 1.1, 1, 6]} />
            <FakeGlowMaterial 
                glowColor={platform.glowColor}
                falloff={0.8}
                glowSharpness={0.5}
                glowInternalRadius={0.5}
            />
        </T.Mesh>
    {/if}

    <!-- Dezenter Ring auch für nicht-aktive Plattformen -->
    <T.Mesh position.y={-2} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.98, platform.size * 1.02, 6]} />
        <T.MeshBasicMaterial
            color={platform.glowColor}
            transparent
            opacity={isCurrentPlatform ? 0.6 : 0.15}
            side={2}
        />
    </T.Mesh>

    <!-- Plattform-Name Label (schwebt über der Plattform) -->
    <HTML position={[0, 12, 0]} center pointerEvents="none">
        <div
            class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                   transition-all duration-300 pointer-events-none select-none
                   {isCurrentPlatform
                ? 'bg-white text-slate-800 shadow-lg scale-110'
                : 'bg-black/60 text-white/90'}"
        >
            {platform.name}
        </div>
    </HTML>

    <!-- Projekt-Stände auf der Plattform -->
    {#each projects as project, i}
        <ExhibitStand {project} position={[standPositions[i]?.x ?? 0, 2, standPositions[i]?.z ?? 0]} />
    {/each}

    <!-- Licht-Punkt auf der Plattform -->
    <T.PointLight
        position={[0, 8, 0]}
        color={platform.glowColor}
        intensity={isCurrentPlatform ? 40 : 8}
        distance={platform.size * 2.5}
    />
</T.Group>
