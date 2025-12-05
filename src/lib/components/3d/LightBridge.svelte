<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { MeshLineGeometry, MeshLineMaterial, Text, Billboard } from '@threlte/extras';
    import type { Platform } from '$lib/logic/platforms';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getPlatformContent } from '$lib/data/mockProjects';
    import { Vector3, QuadraticBezierCurve3 } from 'three';

    let {
        from,
        to,
        color
    }: {
        from: Platform;
        to: Platform;
        color: string;
    } = $props();

    let isHovered = $state(false);

    // Bestimme die aktuelle Plattform
    let currentPlatformId = $derived(worldStore.state.currentPlatform);
    
    // Ist diese Linie relevant für den User? (Verbindung geht VON oder ZU aktueller Plattform)
    let isRelevant = $derived(currentPlatformId === from.id || currentPlatformId === to.id);
    
    // Bestimme Start und Ziel basierend auf aktueller Position
    // "origin" = wo der User steht, "destination" = wohin die Linie führt
    let origin = $derived(currentPlatformId === from.id ? from : to);
    let destination = $derived(currentPlatformId === from.id ? to : from);
    
    // Lade den Namen der Zielplattform aus PlatformContent
    let destinationName = $derived(getPlatformContent(destination.id)?.title ?? destination.id);

    // Punkte für die Lichtlinie - enden am Oktaeder (Y+15)
    const OKTAEDER_HEIGHT = 15;
    let midHeight = $derived(Math.max(from.y, to.y) + OKTAEDER_HEIGHT + 10);
    
    // Bezier-Kurve für sanften Bogen - Start und Ende am Oktaeder
    let curve = $derived(new QuadraticBezierCurve3(
        new Vector3(from.x, from.y + OKTAEDER_HEIGHT, from.z),
        new Vector3((from.x + to.x) / 2, midHeight, (from.z + to.z) / 2),
        new Vector3(to.x, to.y + OKTAEDER_HEIGHT, to.z)
    ));

    // Punkte entlang der Kurve für MeshLine
    let linePoints = $derived(curve.getPoints(50));

    // Mittelpunkt für Label (3D Position)
    let labelPosition = $derived<[number, number, number]>([
        (from.x + to.x) / 2,
        midHeight + 1,
        (from.z + to.z) / 2
    ]);

    // Wird dieses Ziel gerade gehovert (im TransportPortal)?
    let isDestinationHovered = $derived(worldStore.state.hoveredDestination === destination.id);

    // Linie ist aktiv (heller) wenn: gehovert ODER Ziel gehovert
    let isActive = $derived(isHovered || isDestinationHovered);

    // Farbe je nach Zustand
    let displayColor = $derived(isActive ? '#ffffff' : color);

    // Animation Phase - läuft immer für passive Animation
    let animPhase = $state(0);
    let flowPhase = $state(0); // Für fließende Energie-Partikel
    
    // Animation läuft immer
    useTask((delta) => {
        animPhase += delta * 2; // Geschwindigkeit der Puls-Animation
        flowPhase += delta * 1.5; // Fließbewegung
    });
    
    // Sanftes Pulsieren für passive Linien
    let passivePulse = $derived(Math.sin(animPhase) * 0.1 + 0.25); // 0.15 - 0.35 Opacity
    
    // Aktives Pulsieren - sanftes Atmen
    let activePulse = $derived(Math.sin(animPhase * 1.5) * 0.1 + 0.9); // 0.8 - 1.0
    
    // Kern-Opacity: Passiv = dünn pulsierend, Aktiv = sanft atmend
    let coreOpacity = $derived(
        isActive 
            ? (isDestinationHovered ? 1.0 : activePulse * 0.95)
            : passivePulse
    );
    
    // Glow-Opacity (äußerer Schein) - sanfter als der Kern
    let glowOpacity = $derived(
        isActive 
            ? (isDestinationHovered ? 0.25 : activePulse * 0.15)
            : passivePulse * 0.3
    );
    
    // Kern-Breite: Passiv = hauchfein, Aktiv = schlank
    let coreWidth = $derived(
        isDestinationHovered ? 0.12 : (isActive ? 0.08 : 0.04)
    );
    
    // Glow-Breite: Passiv = minimal, Aktiv = sanfter Schimmer
    let glowWidth = $derived(
        isDestinationHovered ? 0.6 : (isActive ? 0.4 : 0.15)
    );
    
    // Äußerster Glow (sehr diffus)
    let outerGlowWidth = $derived(
        isDestinationHovered ? 1.2 : (isActive ? 0.8 : 0)
    );

    function handleClick() {
        worldStore.startTransport(destination.id);
    }
</script>

<!-- Lichtstrahl - IMMER sichtbar wenn relevant (von aktueller Plattform) -->
{#if isRelevant}
    <!-- Äußerster diffuser Glow (nur aktiv) -->
    {#if isActive}
        <T.Mesh>
            <MeshLineGeometry points={linePoints} />
            <MeshLineMaterial
                width={outerGlowWidth}
                color={color}
                opacity={glowOpacity * 0.4}
                transparent
                depthWrite={false}
            />
        </T.Mesh>
    {/if}

    <!-- Mittlerer Glow-Layer -->
    <T.Mesh>
        <MeshLineGeometry points={linePoints} />
        <MeshLineMaterial
            width={glowWidth}
            color={color}
            opacity={glowOpacity}
            transparent
            depthWrite={false}
        />
    </T.Mesh>

    <!-- Heller Kern - interaktiv -->
    <T.Mesh
        onclick={handleClick}
        onpointerenter={() => (isHovered = true)}
        onpointerleave={() => (isHovered = false)}
    >
        <MeshLineGeometry points={linePoints} />
        <MeshLineMaterial
            width={coreWidth}
            color={displayColor}
            opacity={coreOpacity}
            transparent
            depthWrite={false}
        />
    </T.Mesh>
{/if}

<!-- Ziel-Label bei Hover als 3D Glasscheibe -->
{#if isHovered && isRelevant}
    <T.Group position={labelPosition}>
        <Billboard>
            <!-- Glasscheibe -->
            <T.Mesh>
                <T.PlaneGeometry args={[destinationName.length * 0.5 + 3, 2]} />
                <T.MeshStandardMaterial 
                    color="#0f172a"
                    transparent
                    opacity={0.92}
                    metalness={0.2}
                    roughness={0.2}
                />
            </T.Mesh>
            <!-- Leuchtender Rahmen -->
            <T.Mesh position.z={-0.03}>
                <T.PlaneGeometry args={[destinationName.length * 0.5 + 3.3, 2.3]} />
                <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </T.Mesh>
            <!-- Pfeil + Text -->
            <Text
                text={`→ ${destinationName}`}
                color="#ffffff"
                fontSize={0.7}
                anchorX="center"
                anchorY="middle"
                position.z={0.08}
            />
        </Billboard>
    </T.Group>

    <!-- Leuchtender Punkt am Ziel-Oktaeder -->
    <T.Mesh position={[destination.x, destination.y + OKTAEDER_HEIGHT, destination.z]}>
        <T.SphereGeometry args={[1.8, 6, 6]} />
        <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </T.Mesh>

    <!-- Glow-Effekt am Ziel-Oktaeder -->
    <T.PointLight position={[destination.x, destination.y + OKTAEDER_HEIGHT, destination.z]} color="#ffffff" intensity={50} distance={40} />
{/if}

<!-- Kleine leuchtende Punkte an Start und Ende - immer sichtbar wenn relevant -->
{#if isRelevant}
    <!-- Start-Punkt -->
    <T.Mesh position={[from.x, from.y + OKTAEDER_HEIGHT, from.z]}>
        <T.SphereGeometry args={[isActive ? 0.4 : 0.2, 8, 8]} />
        <T.MeshBasicMaterial color={displayColor} transparent opacity={coreOpacity} />
    </T.Mesh>
    <!-- Start-Glow -->
    {#if isActive}
        <T.Mesh position={[from.x, from.y + OKTAEDER_HEIGHT, from.z]}>
            <T.SphereGeometry args={[0.8, 8, 8]} />
            <T.MeshBasicMaterial color={color} transparent opacity={glowOpacity} />
        </T.Mesh>
    {/if}
    
    <!-- End-Punkt -->
    <T.Mesh position={[to.x, to.y + OKTAEDER_HEIGHT, to.z]}>
        <T.SphereGeometry args={[isActive ? 0.4 : 0.2, 8, 8]} />
        <T.MeshBasicMaterial color={displayColor} transparent opacity={coreOpacity} />
    </T.Mesh>
    <!-- End-Glow -->
    {#if isActive}
        <T.Mesh position={[to.x, to.y + OKTAEDER_HEIGHT, to.z]}>
            <T.SphereGeometry args={[0.8, 8, 8]} />
            <T.MeshBasicMaterial color={color} transparent opacity={glowOpacity} />
        </T.Mesh>
    {/if}
{/if}
