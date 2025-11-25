<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms, connections } from '$lib/logic/platforms';
    import type { Object3D } from 'three';

    // Type für Pointer Events
    type PointerEvent = { object: Object3D };

    // Rotationswinkel für Animation
    let rotationY = $state(0);
    let pulseScale = $state(1);
    
    useTask((delta) => {
        rotationY += delta * 0.5; // Langsame Rotation
        pulseScale = 1 + Math.sin(Date.now() * 0.002) * 0.05; // Sanftes Pulsieren
    });

    // Alle Ziel-Plattformen (außer S selbst)
    let destinations = Object.values(platforms).filter(p => p.id !== 'S');

    // Gruppiere nach Ebene
    let bPlatforms = destinations.filter(p => p.id.startsWith('B'));
    let qPlatforms = destinations.filter(p => p.id.startsWith('Q'));

    function navigateTo(platformId: string) {
        worldStore.startTransport(platformId);
    }

    // Ist der User gerade auf S?
    let isOnS = $derived(worldStore.state.currentPlatform === 'S');
</script>

<!-- Transport-Portal nur sichtbar wenn auf S-Plattform -->
{#if isOnS}
    <T.Group position={[0, 8.5, 0]}>
        <!-- Zentrale Säule -->
        <T.Mesh>
            <T.CylinderGeometry args={[0.3, 0.4, 4, 8]} />
            <T.MeshStandardMaterial 
                color="#4f46e5" 
                emissive="#4f46e5"
                emissiveIntensity={0.5}
                metalness={0.8}
                roughness={0.2}
            />
        </T.Mesh>

        <!-- Rotierender Ring um die Säule -->
        <T.Group rotation.y={rotationY}>
            <T.Mesh position.y={1.5} rotation.x={Math.PI / 2}>
                <T.TorusGeometry args={[1.2, 0.08, 8, 6]} />
                <T.MeshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
            </T.Mesh>
        </T.Group>

        <!-- Zweiter rotierender Ring (gegenläufig) -->
        <T.Group rotation.y={-rotationY * 1.5}>
            <T.Mesh position.y={2.5} rotation.x={Math.PI / 2} rotation.z={Math.PI / 6}>
                <T.TorusGeometry args={[0.9, 0.06, 8, 6]} />
                <T.MeshBasicMaterial color="#a78bfa" transparent opacity={0.7} />
            </T.Mesh>
        </T.Group>

        <!-- Leuchtende Kugel oben -->
        <T.Mesh position.y={3.5} scale={pulseScale}>
            <T.SphereGeometry args={[0.4, 16, 16]} />
            <T.MeshBasicMaterial color="#ffffff" />
        </T.Mesh>

        <!-- Lichtquelle -->
        <T.PointLight position={[0, 3.5, 0]} color="#60a5fa" intensity={3} distance={15} />

        <!-- B-Ebene Auswahl (unten) -->
        <T.Group position.y={0.5}>
            {#each bPlatforms as platform, i}
                {@const angle = (i / bPlatforms.length) * Math.PI * 2 - Math.PI / 2}
                {@const radius = 2.5}
                <T.Group position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
                    <!-- Kleiner Würfel als Button -->
                    <T.Mesh 
                        onclick={() => navigateTo(platform.id)}
                        onpointerenter={(e: PointerEvent) => e.object.scale.setScalar(1.2)}
                        onpointerleave={(e: PointerEvent) => e.object.scale.setScalar(1)}
                    >
                        <T.BoxGeometry args={[0.6, 0.6, 0.6]} />
                        <T.MeshStandardMaterial 
                            color={platform.color}
                            emissive={platform.color}
                            emissiveIntensity={0.3}
                        />
                    </T.Mesh>
                    <HTML position={[0, 0.8, 0]} center pointerEvents="none">
                        <div class="text-xs text-white/80 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                            {platform.shortName}
                        </div>
                    </HTML>
                </T.Group>
            {/each}
        </T.Group>

        <!-- Q-Ebene Auswahl (oben) -->
        <T.Group position.y={2}>
            {#each qPlatforms as platform, i}
                {@const angle = (i / qPlatforms.length) * Math.PI * 2}
                {@const radius = 2}
                <T.Group position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
                    <!-- Schwebender Kristall als Button -->
                    <T.Mesh 
                        rotation.x={Math.PI / 4}
                        rotation.z={Math.PI / 4}
                        onclick={() => navigateTo(platform.id)}
                        onpointerenter={(e: PointerEvent) => e.object.scale.setScalar(1.3)}
                        onpointerleave={(e: PointerEvent) => e.object.scale.setScalar(1)}
                    >
                        <T.OctahedronGeometry args={[0.4]} />
                        <T.MeshStandardMaterial 
                            color={platform.color}
                            emissive={platform.color}
                            emissiveIntensity={0.5}
                            transparent
                            opacity={0.9}
                        />
                    </T.Mesh>
                    <HTML position={[0, 0.8, 0]} center pointerEvents="none">
                        <div class="text-xs text-white/80 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                            {platform.shortName}
                        </div>
                    </HTML>
                </T.Group>
            {/each}
        </T.Group>

        <!-- Portal-Label -->
        <HTML position={[0, 5, 0]} center pointerEvents="none">
            <div class="text-white font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 
                        px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                🚀 Transport-Portal
            </div>
        </HTML>
    </T.Group>
{/if}
