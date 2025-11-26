<script lang="ts">
    import { T } from '@threlte/core';
    import { useCursor, Text, Billboard } from '@threlte/extras';
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

    // 6 Spotlight-Positionen im Hexagon-Muster (wie Messehallen-Beleuchtung)
    const spotlightHeight = 25; // Höhe über der Plattform
    const spotlightRadius = 0.7; // Relativ zur Plattform-Größe
    const spotlightPositions = Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        return {
            x: Math.cos(angle) * spotlightRadius,
            z: Math.sin(angle) * spotlightRadius
        };
    });
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
        />
    </T.Mesh>

    <!-- Dezenter Ring am Rand -->
    <T.Mesh position.y={-2} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[platform.size * 0.98, platform.size * 1.02, 6]} />
        <T.MeshBasicMaterial
            color={platform.glowColor}
            transparent
            opacity={isCurrentPlatform ? 0.5 : 0.15}
            side={2}
        />
    </T.Mesh>

    <!-- 3D Namensschild - kompakt, nah an der Plattform -->
    <Billboard position={[0, 4, 0]}>
        <!-- Halbtransparente Glasscheibe (kleiner) -->
        <T.Mesh>
            <T.PlaneGeometry args={[platform.name.length * 0.5 + 1.5, 1.8]} />
            <T.MeshStandardMaterial 
                color={isCurrentPlatform ? '#ffffff' : '#1e293b'}
                transparent
                opacity={isCurrentPlatform ? 0.95 : 0.85}
                metalness={0.1}
                roughness={0.2}
            />
        </T.Mesh>
        
        <!-- Rahmen -->
        <T.Mesh position.z={-0.03}>
            <T.PlaneGeometry args={[platform.name.length * 0.5 + 1.7, 2]} />
            <T.MeshBasicMaterial 
                color={platform.glowColor}
                transparent
                opacity={0.6}
            />
        </T.Mesh>

        <!-- 3D Text (kleinere Schrift) -->
        <Text
            text={platform.name}
            color={isCurrentPlatform ? '#1e293b' : '#ffffff'}
            fontSize={0.7}
            anchorX="center"
            anchorY="middle"
            position.z={0.05}
            outlineWidth={isCurrentPlatform ? 0 : 0.02}
            outlineColor="#000000"
        />
    </Billboard>

    <!-- Projekt-Stände auf der Plattform -->
    {#each projects as project, i}
        <ExhibitStand {project} position={[standPositions[i]?.x ?? 0, 2, standPositions[i]?.z ?? 0]} />
    {/each}

    <!-- 6 Spotlights wie in einer Messehalle (nur für aktive Plattform) -->
    {#if isCurrentPlatform}
        {#each spotlightPositions as spot, i}
            <!-- Spotlight von oben -->
            <T.SpotLight
                position={[spot.x * platform.size, spotlightHeight, spot.z * platform.size]}
                target.position={[spot.x * platform.size * 0.5, 0, spot.z * platform.size * 0.5]}
                color={platform.glowColor}
                intensity={80}
                distance={spotlightHeight * 2}
                angle={0.4}
                penumbra={0.5}
                decay={1.5}
                castShadow
            />
            <!-- Kleine sichtbare Lampe -->
            <T.Mesh position={[spot.x * platform.size, spotlightHeight, spot.z * platform.size]}>
                <T.SphereGeometry args={[0.3, 8, 8]} />
                <T.MeshBasicMaterial color={platform.glowColor} />
            </T.Mesh>
        {/each}
        
        <!-- Dünne Traversen-Struktur die die Lampen verbindet -->
        <T.Mesh position.y={spotlightHeight} rotation.y={Math.PI / 6}>
            <T.TorusGeometry args={[platform.size * spotlightRadius, 0.15, 6, 6]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
        </T.Mesh>
    {/if}

    <!-- Dezentes Ambient-Licht für nicht-aktive Plattformen -->
    {#if !isCurrentPlatform}
        <T.PointLight
            position={[0, 10, 0]}
            color={platform.glowColor}
            intensity={5}
            distance={platform.size * 1.5}
        />
    {/if}
</T.Group>
