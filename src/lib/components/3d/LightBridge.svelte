<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { MeshLineGeometry, MeshLineMaterial, Text, Billboard } from '@threlte/extras';
    import type { Platform } from '$lib/logic/platforms';
    import { worldStore } from '$lib/logic/store.svelte';
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

    // Pulsieren der Linie
    let pulseOpacity = $state(0.5);
    let lineWidth = $state(0.3);
    
    useTask(() => {
        // Nur bei Hover pulsieren
        if (isDestinationHovered || isHovered) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.85;
            pulseOpacity = pulse;
            lineWidth = 0.5;
        } else {
            pulseOpacity = baseOpacity;
            lineWidth = isActive ? 0.15 : 0.08;
        }
    });

    function handleClick() {
        worldStore.startTransport(to.id);
    }

    // Ist die Linie aktiv (verbunden mit aktueller Plattform)?
    let isActive = $derived(
        worldStore.state.currentPlatform === from.id || worldStore.state.currentPlatform === to.id
    );

    // NEU: Wird dieses Ziel gerade gehovert?
    let isDestinationHovered = $derived(worldStore.state.hoveredDestination === to.id);

    // Farbe je nach Zustand - nur bei Hover leuchten!
    let displayColor = $derived(isHovered || isDestinationHovered ? '#ffffff' : color);
    
    // Opacity: Nur sichtbar wenn aktiv, hell wenn gehovert
    let baseOpacity = $derived(
        isDestinationHovered ? 1.0 : (isActive ? 0.15 : 0.05)
    );
</script>

<!-- Lichtstrahl mit MeshLineMaterial (unterstützt variable Breite!) -->
<T.Mesh
    onclick={handleClick}
    onpointerenter={() => (isHovered = true)}
    onpointerleave={() => (isHovered = false)}
>
    <MeshLineGeometry points={linePoints} />
    <MeshLineMaterial
        width={lineWidth}
        color={displayColor}
        opacity={pulseOpacity}
        transparent
        depthWrite={false}
    />
</T.Mesh>

<!-- Glow-Linie (breiter, transparenter) -->
{#if isActive}
    <T.Mesh>
        <MeshLineGeometry points={linePoints} />
        <MeshLineMaterial
            width={lineWidth * 3}
            color={color}
            opacity={pulseOpacity * 0.15}
            transparent
            depthWrite={false}
        />
    </T.Mesh>
{/if}

<!-- Ziel-Label bei Hover als 3D Glasscheibe -->
{#if isHovered}
    <T.Group position={labelPosition}>
        <Billboard>
            <!-- Glasscheibe -->
            <T.Mesh>
                <T.PlaneGeometry args={[to.name.length * 0.5 + 3, 2]} />
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
                <T.PlaneGeometry args={[to.name.length * 0.5 + 3.3, 2.3]} />
                <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </T.Mesh>
            <!-- Pfeil + Text -->
            <Text
                text={`→ ${to.name}`}
                color="#ffffff"
                fontSize={0.7}
                anchorX="center"
                anchorY="middle"
                position.z={0.08}
            />
        </Billboard>
    </T.Group>

    <!-- Leuchtender Punkt am Ziel-Oktaeder -->
    <T.Mesh position={[to.x, to.y + OKTAEDER_HEIGHT, to.z]}>
        <T.SphereGeometry args={[1.8, 12, 12]} />
        <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </T.Mesh>

    <!-- Glow-Effekt am Ziel-Oktaeder -->
    <T.PointLight position={[to.x, to.y + OKTAEDER_HEIGHT, to.z]} color="#ffffff" intensity={50} distance={40} />
{/if}

<!-- Kleine leuchtende Punkte an Start und Ende (am Oktaeder) -->
{#if isActive}
    <T.Mesh position={[from.x, from.y + OKTAEDER_HEIGHT, from.z]}>
        <T.SphereGeometry args={[0.5, 8, 8]} />
        <T.MeshBasicMaterial color={color} transparent opacity={pulseOpacity} />
    </T.Mesh>
    <T.Mesh position={[to.x, to.y + OKTAEDER_HEIGHT, to.z]}>
        <T.SphereGeometry args={[0.5, 8, 8]} />
        <T.MeshBasicMaterial color={color} transparent opacity={pulseOpacity} />
    </T.Mesh>
{/if}
