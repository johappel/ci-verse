<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { Text, Billboard, useCursor } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms } from '$lib/logic/platforms';
    import { CylinderGeometry } from 'three';

    // Rotationswinkel für Animation - nur wenn Portal sichtbar (isOnS)
    let rotationY = $state(0);
    
    useTask((delta) => {
        if (isOnS) {
            rotationY += delta * 0.3; // Langsame Rotation des Rings
        }
    });

    // Alle Ziel-Plattformen (außer S selbst)
    let destinations = Object.values(platforms).filter(p => p.id !== 'S');

    // Gruppiere nach Ebene
    let bPlatforms = destinations.filter(p => p.id.startsWith('B'));
    let qPlatforms = destinations.filter(p => p.id.startsWith('Q'));

    function navigateTo(platformId: string) {
        worldStore.startTransport(platformId);
    }

    function onButtonHover(platformId: string) {
        worldStore.setHoveredDestination(platformId);
    }

    function onButtonLeave() {
        worldStore.setHoveredDestination(null);
    }

    // Ist der User gerade auf S?
    let isOnS = $derived(worldStore.state.currentPlatform === 'S');
    
    // Hexagonale Button-Geometrie (6-seitiger flacher Zylinder)
    const hexButtonGeometry = new CylinderGeometry(1.3, 1.3, 0.5, 6);
</script>

<!-- Transport-Portal nur sichtbar wenn auf S-Plattform -->
{#if isOnS}
    <T.Group position={[0, 2, 0]}>
        <!-- Basis-Plattform (rund, flach) - auf der Plattform-Oberfläche -->
        <T.Mesh position.y={0.1} rotation.x={-Math.PI / 2}>
            <T.CircleGeometry args={[8, 32]} />
            <T.MeshStandardMaterial 
                color="#1e1b4b" 
                metalness={0.7}
                roughness={0.3}
            />
        </T.Mesh>

        <!-- Leuchtender Ring um die Basis -->
        <T.Mesh position.y={0.05} rotation.x={-Math.PI / 2}>
            <T.RingGeometry args={[7.5, 8, 32]} />
            <T.MeshBasicMaterial color="#60a5fa" transparent opacity={0.8} />
        </T.Mesh>

        <!-- Holografischer Ring (rotierend) -->
        <T.Group rotation.y={rotationY}>
            <T.Mesh position.y={3} rotation.x={Math.PI / 2}>
                <T.TorusGeometry args={[5, 0.08, 8, 32]} />
                <T.MeshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
            </T.Mesh>
        </T.Group>

        <!-- Zentraler Leuchtpunkt -->
        <T.Mesh position.y={3}>
            <T.SphereGeometry args={[0.4, 16, 16]} />
            <T.MeshBasicMaterial color="#ffffff" />
        </T.Mesh>
        <T.PointLight position={[0, 3, 0]} color="#60a5fa" intensity={20} distance={30} />

        <!-- B-Plattform Buttons (Bildung - vordere Reihe) -->
        <T.Group position.y={0.5}>
            {#each bPlatforms as platform, i}
                {@const angle = ((i - 1) / 3) * Math.PI * 0.6 + Math.PI * 0.7}
                {@const radius = 4.5}
                {@const isHovered = worldStore.state.hoveredDestination === platform.id}
                <T.Group position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
                    <!-- Hexagonaler Button -->
                    <T.Mesh 
                        geometry={hexButtonGeometry}
                        rotation.y={Math.PI / 6}
                        scale={isHovered ? [1.2, 1.5, 1.2] : [1, 1, 1]}
                        onclick={() => navigateTo(platform.id)}
                        onpointerenter={() => onButtonHover(platform.id)}
                        onpointerleave={onButtonLeave}
                    >
                        <T.MeshStandardMaterial 
                            color={platform.color}
                            emissive={platform.color}
                            emissiveIntensity={isHovered ? 0.8 : 0.3}
                            metalness={0.6}
                            roughness={0.2}
                        />
                    </T.Mesh>
                    <!-- Label über Button -->
                    <Billboard position={[0, 1, 0]}>
                        <Text
                            text={platform.shortName}
                            color={isHovered ? '#ffffff' : '#cccccc'}
                            fontSize={isHovered ? 0.5 : 0.4}
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.03}
                            outlineColor="#000000"
                        />
                    </Billboard>
                </T.Group>
            {/each}
        </T.Group>

        <!-- Q-Plattform Buttons (Querschnitt - hintere Reihe) -->
        <T.Group position.y={0.5}>
            {#each qPlatforms as platform, i}
                {@const angle = ((i - 1) / 3) * Math.PI * 0.6 - Math.PI * 0.3}
                {@const radius = 5}
                {@const isHovered = worldStore.state.hoveredDestination === platform.id}
                <T.Group position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
                    <!-- Hexagonaler Button -->
                    <T.Mesh 
                        geometry={hexButtonGeometry}
                        rotation.y={Math.PI / 6}
                        scale={isHovered ? [1.2, 1.5, 1.2] : [1, 1, 1]}
                        onclick={() => navigateTo(platform.id)}
                        onpointerenter={() => onButtonHover(platform.id)}
                        onpointerleave={onButtonLeave}
                    >
                        <T.MeshStandardMaterial 
                            color={platform.color}
                            emissive={platform.color}
                            emissiveIntensity={isHovered ? 0.8 : 0.3}
                            metalness={0.6}
                            roughness={0.2}
                        />
                    </T.Mesh>
                    <!-- Label über Button -->
                    <Billboard position={[0, 1, 0]}>
                        <Text
                            text={platform.shortName}
                            color={isHovered ? '#ffffff' : '#cccccc'}
                            fontSize={isHovered ? 0.5 : 0.4}
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.03}
                            outlineColor="#000000"
                        />
                    </Billboard>
                </T.Group>
            {/each}
        </T.Group>

        <!-- Portal-Titel über der Konsole -->
        <Billboard position={[0, 5, 0]}>
            <Text
                text="Transport"
                color="#60a5fa"
                fontSize={0.8}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.04}
                outlineColor="#1e1b4b"
            />
        </Billboard>
    </T.Group>
{/if}
