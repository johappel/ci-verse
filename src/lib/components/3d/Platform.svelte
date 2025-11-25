<script lang="ts">
    import { T } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import { spring } from 'svelte/motion';
    import type { Platform as PlatformType } from '$lib/logic/platforms';
    import type { ProjectData } from '$lib/types/project';
    import ExhibitStand from './ExhibitStand.svelte';
    import { getHexagonalLayout } from '$lib/logic/layout';
    import { worldStore } from '$lib/logic/store.svelte';

    let { platform, projects = [] }: { platform: PlatformType; projects: ProjectData[] } = $props();

    // Hover-State
    let isHovered = $state(false);
    
    // Spring für numerische Werte (nicht für Strings!)
    let platformScale = spring(1, { stiffness: 0.3, damping: 0.8 });

    $effect(() => {
        platformScale.set(isHovered ? 1.03 : 1);
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
        onpointerenter={() => (isHovered = true)}
        onpointerleave={() => (isHovered = false)}
        receiveShadow
        rotation.y={Math.PI / 6}
    >
        <!-- rotation.y dreht Hexagon damit Kanten nach vorne zeigen, nicht Ecken -->
        <T.CylinderGeometry args={[platform.size, platform.size, 0.5, 6]} />
        <T.MeshStandardMaterial
            color={platform.color}
            metalness={0.3}
            roughness={0.6}
            emissive={isCurrentPlatform ? platform.glowColor : '#000000'}
            emissiveIntensity={isCurrentPlatform ? 0.4 : 0}
        />
    </T.Mesh>

    <!-- Glow-Ring unter der Plattform (flach, gleiche Orientierung wie Hexagon) -->
    <!-- RingGeometry startet mit Ecke bei 0°, CylinderGeometry mit Kante -->
    <!-- Daher: Ring OHNE Y-Rotation, nur flachlegen -->
    <T.Mesh position.y={-0.3} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.95, platform.size * 1.05, 6]} />
        <T.MeshBasicMaterial
            color={platform.glowColor}
            transparent
            opacity={isCurrentPlatform ? 0.8 : 0.2}
            side={2}
        />
    </T.Mesh>

    <!-- Plattform-Name Label (schwebt über der Plattform) -->
    <HTML position={[0, 3, 0]} center pointerEvents="none">
        <div
            class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap
                   transition-all duration-300 pointer-events-none select-none
                   {isCurrentPlatform
                ? 'bg-white text-slate-800 shadow-lg'
                : 'bg-black/60 text-white/90'}"
        >
            {platform.name}
        </div>
    </HTML>

    <!-- Projekt-Stände auf der Plattform -->
    {#each projects as project, i}
        <ExhibitStand {project} position={[standPositions[i]?.x ?? 0, 0.5, standPositions[i]?.z ?? 0]} />
    {/each}

    <!-- Licht-Punkt auf der Plattform -->
    <T.PointLight
        position={[0, 2, 0]}
        color={platform.glowColor}
        intensity={isCurrentPlatform ? 2 : 0.5}
        distance={platform.size * 2}
    />
</T.Group>
