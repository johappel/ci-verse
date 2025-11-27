<script lang="ts">
    /**
     * InfoHexagon - Zentraler 6-seitiger Info-Pillar auf jeder Plattform
     * 
     * Struktur:
     * - 6-seitige Basis
     * - 5 Seiten zeigen je einen Aspect (Icon + Titel)
     * - 6. Seite zeigt den Plattform-Titel
     * - Hover auf eine Seite zeigt Description
     * - Klick fährt Kamera davor, InteractionPillar öffnet contentUrl
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import { BadgeInfo } from 'lucide-svelte';
    import type { PlatformAspect } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';
    import AspectPillar from './AspectPillar.svelte';

    interface Props {
        platformName: string;
        aspects: PlatformAspect[];
        position?: [number, number, number];
        height?: number;
        radius?: number;
        color?: string;
        platformPosition?: [number, number, number]; // Welt-Position der Plattform
    }

    let { 
        platformName, 
        aspects, 
        position = [0, 0, 0], 
        height = 4,
        radius = 2.5,
        color = '#1e293b',
        platformPosition = [0, 0, 0]
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    // Welche Seite ist gehovered?
    let hoveredSide = $state<number | null>(null);

    // 6 Seiten: 5 Aspects + 1 Titel
    // Aspect-Seiten (0-4), Titel-Seite (5)
    const sides = $derived([
        ...aspects.slice(0, 5).map((a, i) => ({
            type: 'aspect' as const,
            aspect: a,
            index: i
        })),
        { type: 'title' as const, aspect: null, index: 5 }
    ]);

    // Berechne Position und Rotation für jede Seite
    function getSideTransform(index: number) {
        const angle = (index / 6) * Math.PI * 2 - Math.PI / 2; // Start oben
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const rotY = -angle + Math.PI / 2; // Zeigt nach außen
        return { x, z, rotY, angle };
    }

    // Klick auf Seite: Kamera fährt davor
    function handleSideClick(sideIndex: number) {
        const transform = getSideTransform(sideIndex);
        const viewDistance = 10; // Weiter weg für bessere Gesamtansicht
        
        // Welt-Position des Hexagons
        const hexWorldX = platformPosition[0] + position[0];
        const hexWorldZ = platformPosition[2] + position[2];
        
        // Kamera auf Augenhöhe (relativ zur Plattform-Oberfläche)
        const cameraY = getCameraY(platformPosition[1]);
        
        // Die Seite zeigt nach außen (in Richtung des Winkels)
        // Kamera muss außerhalb stehen und zur Seite schauen
        const normalX = Math.cos(transform.angle);
        const normalZ = Math.sin(transform.angle);
        
        // Seiten-Position in Weltkoordinaten
        const sideWorldX = hexWorldX + transform.x;
        const sideWorldZ = hexWorldZ + transform.z;
        
        // Kamera steht VOR der Seite (in Richtung der Normalen, also nach außen)
        const cameraPos = {
            x: sideWorldX + normalX * viewDistance,
            y: cameraY,
            z: sideWorldZ + normalZ * viewDistance
        };
        
        // Kamera schaut zur Mitte des Hexagons (etwas über Augenhöhe für besseren Blickwinkel)
        const lookAtPos = {
            x: hexWorldX,
            y: cameraY + 0.5, // Leicht nach oben schauen
            z: hexWorldZ
        };
        
        worldStore.setViewTarget(cameraPos, lookAtPos);
    }

    // Klick auf Aspect öffnet Content-URL (nur noch für direkte Öffnung)
    function handleAspectClick(aspect: PlatformAspect | null) {
        if (aspect?.contentUrl) {
            window.open(aspect.contentUrl, '_blank');
        }
    }
</script>

<T.Group position={position}>
    <!-- Hexagonale Säule - rotation.y um 30° damit Kanten zu den Seiten passen -->
    <T.Mesh position.y={height / 2} rotation.y={Math.PI / 6} castShadow receiveShadow>
        <T.CylinderGeometry args={[radius * 1.1, radius * 1.1, height, 6]} />
        <T.MeshStandardMaterial 
            color={color}
            metalness={0.90}
            roughness={0.6}
            
            opacity={0.96}
        />
    </T.Mesh>

    <!-- Leuchtender Ring oben - rotation.x kippt flach, keine Z-Rotation nötig -->
    <T.Mesh position.y={height - 0.1} rotation.x={Math.PI / 2}>
        <T.TorusGeometry args={[radius * 0.97, 0.12, 8, 6]} />
        <T.MeshStandardMaterial 
            color="#60a5fa" 
            emissive="#60a5fa"
            emissiveIntensity={6.0}
        />
    </T.Mesh>

    <!-- Leuchtender Ring unten -->
    <T.Mesh position.y={0.05} rotation.x={Math.PI / 2}>
        <T.TorusGeometry args={[radius * 1.0, 0.1, 8, 6]} />
        <T.MeshStandardMaterial 
            color="#60a5fa" 
            emissive="#60a5fa"
            emissiveIntensity={0.6}
        />
    </T.Mesh>

    <!-- 6 Seiten mit Content -->
    {#each sides as side, i}
        {@const transform = getSideTransform(i)}
        {@const isHovered = hoveredSide === i}
        
        <T.Group 
            position={[transform.x, height / 2, transform.z]}
            rotation.y={transform.rotY}
        >
            <!-- AspectPillar vor Aspect-Seiten (nicht vor Titel-Seite) -->
            {#if side.type === 'aspect' && side.aspect?.contentUrl}
                {@const pillarDistance = 2.5}
                {@const normalX = Math.cos(transform.angle)}
                {@const normalZ = Math.sin(transform.angle)}
                {@const hexWorldX = platformPosition[0] + position[0]}
                {@const hexWorldZ = platformPosition[2] + position[2]}
                {@const pillarWorldX = hexWorldX + transform.x + normalX * pillarDistance}
                {@const pillarWorldZ = hexWorldZ + transform.z + normalZ * pillarDistance}
                <AspectPillar 
                    aspect={side.aspect}
                    position={[0, -height / 2 + 0.5, pillarDistance]}
                    size={1.0}
                    worldPosition={[pillarWorldX, platformPosition[1] + 0.5, pillarWorldZ]}
                />
            {/if}
            
            <!-- Hintergrund-Panel für diese Seite -->
            <T.Mesh
                position.z={0.01}
                onpointerenter={() => { hoveredSide = i; onPointerEnter(); }}
                onpointerleave={() => { hoveredSide = null; onPointerLeave(); }}
                onclick={() => handleSideClick(i)}
            >
                <T.PlaneGeometry args={[radius * 1.1, height * 0.85]} />
                <T.MeshBasicMaterial 
                    color={isHovered ? '#3b82f6' : '#0f172a'}
                    transparent
                    opacity={isHovered ? 0.8 : 0.5}
                />
            </T.Mesh>

            {#if side.type === 'aspect' && side.aspect}
                <!-- Aspect: Icon oben, Titel, Description -->
                <Text
                    text={side.aspect.icon}
                    fontSize={0.9}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, height * 0.28, 0.02]}
                />
                <!-- Titel -->
                {@const titleFontSize = side.aspect.title.length > 12 ? 0.24 : 0.30}
                <Text
                    text={side.aspect.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, height * 0.08, 0.02]}
                    color={isHovered ? '#ffffff' : '#e2e8f0'}
                    fontWeight="bold"
                    maxWidth={radius * 0.95}
                    textAlign="center"
                />
                <!-- Description (unter Titel) -->
                <Text
                    text={side.aspect.description}
                    fontSize={0.16}
                    anchorX="center"
                    anchorY="top"
                    position={[0, -height * 0.08, 0.02]}
                    color={isHovered ? '#cbd5e1' : '#64748b'}
                    maxWidth={radius * 0.9}
                    textAlign="center"
                    lineHeight={1.4}
                />
            {:else}
                <!-- Titel-Seite: Plattform-Name mit dynamischer Schriftgröße -->
                {@const nameFontSize = platformName.length > 15 ? 0.32 : platformName.length > 10 ? 0.4 : 0.5}
                <Text
                    text={platformName}
                    fontSize={nameFontSize}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, 0, 0.02]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={radius * 0.9}
                    textAlign="center"
                />
            {/if}
        </T.Group>
    {/each}
</T.Group>
