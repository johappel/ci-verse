<script lang="ts">
    import { T, useTask } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import type { Platform } from '$lib/logic/platforms';
    import { worldStore } from '$lib/logic/store.svelte';
    import { Vector3, QuadraticBezierCurve3, TubeGeometry } from 'three';

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

    // Punkte für die Lichtlinie (leichte Kurve nach oben)
    let midHeight = $derived(Math.max(from.y, to.y) + 25);
    
    // Bezier-Kurve für sanften Bogen
    let curve = $derived(new QuadraticBezierCurve3(
        new Vector3(from.x, from.y + 3, from.z),
        new Vector3((from.x + to.x) / 2, midHeight, (from.z + to.z) / 2),
        new Vector3(to.x, to.y + 3, to.z)
    ));

    // TubeGeometry - dünn und dezent
    let tubeGeometry = $derived(new TubeGeometry(curve, 32, 0.15, 6, false));

    // Mittelpunkt für Label (3D Position)
    let labelPosition = $derived<[number, number, number]>([
        (from.x + to.x) / 2,
        midHeight + 1,
        (from.z + to.z) / 2
    ]);

    // Pulsieren der Linie
    let pulseOpacity = $state(0.5);
    
    useTask(() => {
        // Sanftes Pulsieren
        const pulse = Math.sin(Date.now() * 0.003) * 0.25 + 0.55;
        pulseOpacity = isHovered ? 0.95 : (isActive ? pulse : 0.25);
    });

    function handleClick() {
        worldStore.startTransport(to.id);
    }

    // Ist die Linie aktiv (verbunden mit aktueller Plattform)?
    let isActive = $derived(
        worldStore.state.currentPlatform === from.id || worldStore.state.currentPlatform === to.id
    );

    // Farbe je nach Zustand
    let displayColor = $derived(isHovered ? '#ffffff' : color);
</script>

<!-- Lichtstrahl als Tube (THREE.Line mit linewidth funktioniert nicht in WebGL!) -->
<T.Mesh
    geometry={tubeGeometry}
    onclick={handleClick}
    onpointerenter={() => (isHovered = true)}
    onpointerleave={() => (isHovered = false)}
>
    <T.MeshBasicMaterial
        color={displayColor}
        transparent
        opacity={pulseOpacity}
    />
</T.Mesh>

<!-- Zweite, dickere Tube für Glow-Effekt (sehr transparent) -->
{#if isActive}
    {@const glowTube = new TubeGeometry(curve, 24, 0.5, 6, false)}
    <T.Mesh geometry={glowTube}>
        <T.MeshBasicMaterial
            color={color}
            transparent
            opacity={pulseOpacity * 0.2}
        />
    </T.Mesh>
{/if}

<!-- Ziel-Label bei Hover -->
{#if isHovered}
    <HTML position={labelPosition} center pointerEvents="none">
        <div
            class="bg-black/80 text-white px-4 py-2 rounded-lg text-base font-medium
                   shadow-xl border border-white/30 whitespace-nowrap
                   pointer-events-none select-none"
        >
            → {to.name}
        </div>
    </HTML>

    <!-- Leuchtender Punkt am Ziel -->
    <T.Mesh position={[to.x, to.y + 8, to.z]}>
        <T.SphereGeometry args={[1.5, 12, 12]} />
        <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </T.Mesh>

    <!-- Glow-Effekt am Ziel -->
    <T.PointLight position={[to.x, to.y + 8, to.z]} color="#ffffff" intensity={30} distance={40} />
{/if}

<!-- Kleine leuchtende Punkte an Start und Ende -->
{#if isActive}
    <T.Mesh position={[from.x, from.y + 3, from.z]}>
        <T.SphereGeometry args={[0.4, 8, 8]} />
        <T.MeshBasicMaterial color={color} transparent opacity={pulseOpacity * 1.3} />
    </T.Mesh>
    <T.Mesh position={[to.x, to.y + 3, to.z]}>
        <T.SphereGeometry args={[0.4, 8, 8]} />
        <T.MeshBasicMaterial color={color} transparent opacity={pulseOpacity * 1.3} />
    </T.Mesh>
{/if}
