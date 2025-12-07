<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { Text, Billboard, useCursor } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms } from '$lib/logic/platforms';
    import { getPlatformContent, getMarketplaceContent } from '$lib/data/mockProjects';
    import { CylinderGeometry } from 'three';

    // Helper: Farben aus Content-Daten holen (Fallback auf platforms.ts)
    function getPlatformColors(platformId: string): { color: string; glowColor: string } {
        if (platformId === 'S') {
            const marketplace = getMarketplaceContent();
            return {
                color: marketplace?.color ?? platforms['S']?.color ?? '#64748b',
                glowColor: marketplace?.glowColor ?? platforms['S']?.glowColor ?? '#94a3b8'
            };
        }
        const content = getPlatformContent(platformId);
        const layout = platforms[platformId];
        return {
            color: content?.color ?? layout?.color ?? '#64748b',
            glowColor: content?.glowColor ?? layout?.glowColor ?? '#94a3b8'
        };
    }

    // Helper: Plattform-Name holen
    function getPlatformName(platformId: string): string {
        if (platformId === 'S') {
            const marketplace = getMarketplaceContent();
            return marketplace?.title ?? 'Marktplatz';
        }
        const content = getPlatformContent(platformId);
        return content?.title ?? platformId;
    }

    // Helper: Plattform-Kurzname holen
    function getPlatformShortName(platformId: string): string {
        if (platformId === 'S') {
            const marketplace = getMarketplaceContent();
            return marketplace?.short ?? 'Markt';
        }
        const content = getPlatformContent(platformId);
        return content?.short ?? platformId;
    }

    // Zeit-basierte Animation (unabhängig von Frame-Rate)
    let animationStartTime = $state(0);
    let rotationY = $state(0);
    let pulseIntensity = $state(0);
    
    // Starte Animation-Timer wenn Transport beginnt
    $effect(() => {
        if (isTransporting && animationStartTime === 0) {
            animationStartTime = performance.now();
        }
        if (!isTransporting && !isOnS) {
            animationStartTime = 0;
        }
    });
    
    // Animation basierend auf absoluter Zeit (nicht delta)
    useTask(() => {
        const now = performance.now();
        
        if (isTransporting) {
            // Zeit seit Animation-Start
            const elapsed = (now - animationStartTime) / 1000; // Sekunden
            
            // Schnelle Rotation während Transport
            rotationY = elapsed * 2.0;
            
            // Puls basierend auf Zeit
            pulseIntensity = 0.5 + Math.sin(elapsed * 8) * 0.5;
        } else if (isOnS) {
            // Normale langsame Rotation
            rotationY = (now / 1000) * 0.3;
            pulseIntensity = 0;
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

    // Ist der User gerade auf S? (separate Signale!)
    let isOnS = $derived(worldStore.currentPlatform === 'S');
    
    // Ist Transport aktiv? (Animation während Flug)
    let isTransporting = $derived(worldStore.isTransporting && worldStore.currentPlatform === 'S');
    
    // Soll Animation laufen? (Normal auf S, schnell beim Transport)
    let shouldAnimate = $derived(isTransporting);
    
    // Ziel-Plattform für Anzeige
    let targetPlatform = $derived(
        worldStore.transportTarget 
            ? platforms[worldStore.transportTarget] 
            : null
    );
    
    // Hexagonale Button-Geometrie (6-seitiger flacher Zylinder)
    const hexButtonGeometry = new CylinderGeometry(1.3, 1.3, 0.5, 6);
</script>

<!-- Transport-Portal immer sichtbar (auf Marktplatz-Plattform) -->
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

        <!-- Leuchtender Ring um die Basis - pulsiert beim Aufladen/Transport -->
        <T.Mesh position.y={0.05} rotation.x={-Math.PI / 2}>
            <T.RingGeometry args={[7.5, 8, 32]} />
            <T.MeshBasicMaterial 
                color={shouldAnimate && targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#60a5fa"} 
                transparent 
                opacity={shouldAnimate ? 0.5 + pulseIntensity * 0.5 : 0.8} 
            />
        </T.Mesh>

        <!-- Holografischer Ring (rotierend) - mehrere Ringe beim Aufladen/Transport -->
        <T.Group rotation.y={rotationY}>
            <T.Mesh position.y={3} rotation.x={Math.PI / 2}>
                <T.TorusGeometry args={[5, 0.08, 8, 32]} />
                <T.MeshBasicMaterial 
                    color={shouldAnimate && targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#60a5fa"} 
                    transparent 
                    opacity={shouldAnimate ? 0.8 : 0.6} 
                />
            </T.Mesh>
        </T.Group>
        
        <!-- Zweiter Ring (gegenläufig) - nur beim Aufladen/Transport -->
        {#if shouldAnimate}
            <T.Group rotation.y={-rotationY * 1.5}>
                <T.Mesh position.y={3.5} rotation.x={Math.PI / 2}>
                    <T.TorusGeometry args={[4, 0.06, 8, 32]} />
                    <T.MeshBasicMaterial 
                        color={targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#60a5fa"} 
                        transparent 
                        opacity={0.4 + pulseIntensity * 0.4} 
                    />
                </T.Mesh>
            </T.Group>
            <!-- Dritter Ring (noch schneller) -->
            <T.Group rotation.y={rotationY * 2}>
                <T.Mesh position.y={2.5} rotation.x={Math.PI / 2}>
                    <T.TorusGeometry args={[6, 0.05, 8, 32]} />
                    <T.MeshBasicMaterial 
                        color={targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#60a5fa"} 
                        transparent 
                        opacity={0.3 + pulseIntensity * 0.3} 
                    />
                </T.Mesh>
            </T.Group>
        {/if}

        <!-- Zentraler Leuchtpunkt - größer und heller beim Aufladen/Transport -->
        <T.Mesh position.y={3} scale={shouldAnimate ? 1 + pulseIntensity * 0.5 : 1}>
            <T.SphereGeometry args={[0.4, 16, 16]} />
            <T.MeshBasicMaterial color={shouldAnimate && targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#ffffff"} />
        </T.Mesh>
        <T.PointLight 
            position={[0, 3, 0]} 
            color={shouldAnimate && targetPlatform ? getPlatformColors(targetPlatform.id).glowColor : "#60a5fa"} 
            intensity={shouldAnimate ? 40 + pulseIntensity * 40 : 20} 
            distance={shouldAnimate ? 50 : 30} 
        />

        <!-- B-Plattform Buttons (Bildung - vordere Reihe) -->
        <T.Group position.y={0.5}>
            {#each bPlatforms as platform, i}
                {@const angle = ((i - 1) / 3) * Math.PI * 0.6 + Math.PI * 0.7}
                {@const radius = 4.5}
                {@const isHovered = worldStore.state.hoveredDestination === platform.id}
                {@const colors = getPlatformColors(platform.id)}
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
                            color={colors.color}
                            emissive={colors.color}
                            emissiveIntensity={isHovered ? 0.8 : 0.3}
                            metalness={0.6}
                            roughness={0.2}
                        />
                    </T.Mesh>
                    <!-- Label über Button -->
                    <Billboard position={[0, 1, 0]}>
                        <Text
                            text={getPlatformShortName(platform.id)}
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
                {@const colors = getPlatformColors(platform.id)}
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
                            color={colors.color}
                            emissive={colors.color}
                            emissiveIntensity={isHovered ? 0.8 : 0.3}
                            metalness={0.6}
                            roughness={0.2}
                        />
                    </T.Mesh>
                    <!-- Label über Button -->
                    <Billboard position={[0, 1, 0]}>
                        <Text
                            text={getPlatformShortName(platform.id)}
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

        <!-- Portal-Titel über der Konsole - zeigt Ziel beim Transport -->
        <Billboard position={[0, 5, 0]}>
            {#if isTransporting && targetPlatform}
                <Text
                    text={`→ ${getPlatformName(targetPlatform.id)}`}
                    color={getPlatformColors(targetPlatform.id).glowColor}
                    fontSize={0.9}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#1e1b4b"
                />
            {:else}
                <Text
                    text="Transport"
                    color="#60a5fa"
                    fontSize={0.8}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.04}
                    outlineColor="#1e1b4b"
                />
            {/if}
        </Billboard>
    </T.Group>
