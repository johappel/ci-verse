<script lang="ts">
    /**
     * InfoHexagon - Zentraler 6-seitiger Info-Pillar auf jeder Plattform
     * 
     * Struktur:
     * - 6-seitige Basis
     * - 5 Seiten zeigen je einen Aspect (Icon + Titel)
     * - 6. Seite zeigt den Plattform-Titel
     * - Hover auf eine Seite zeigt Description
     * - Klick öffnet contentUrl
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import { spring } from 'svelte/motion';
    import type { PlatformAspect } from '$lib/types/project';

    interface Props {
        platformName: string;
        aspects: PlatformAspect[];
        position?: [number, number, number];
        height?: number;
        radius?: number;
        color?: string;
    }

    let { 
        platformName, 
        aspects, 
        position = [0, 0, 0], 
        height = 4,
        radius = 2.5,
        color = '#1e293b'
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    // Welche Seite ist gehovered?
    let hoveredSide = $state<number | null>(null);
    
    // Scale Animation bei Hover
    let scale = spring(1, { stiffness: 0.3, damping: 0.8 });
    
    $effect(() => {
        scale.set(hoveredSide !== null ? 1.02 : 1);
    });

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
        return { x, z, rotY };
    }

    // Klick auf Aspect öffnet Content-URL
    function handleAspectClick(aspect: PlatformAspect | null) {
        if (aspect?.contentUrl) {
            window.open(aspect.contentUrl, '_blank');
        }
    }
</script>

<T.Group position={position} scale={$scale}>
    <!-- Hexagonale Säule - rotation.y um 30° damit Kanten zu den Seiten passen -->
    <T.Mesh position.y={height / 2} rotation.y={Math.PI / 6} castShadow receiveShadow>
        <T.CylinderGeometry args={[radius, radius * 1.1, height, 6]} />
        <T.MeshStandardMaterial 
            color={color}
            metalness={0.2}
            roughness={0.8}
            transparent
            opacity={0.9}
        />
    </T.Mesh>

    <!-- Leuchtender Ring oben - rotation.x kippt flach, keine Z-Rotation nötig -->
    <T.Mesh position.y={height + 0.1} rotation.x={Math.PI / 2}>
        <T.TorusGeometry args={[radius * 0.97, 0.12, 8, 6]} />
        <T.MeshStandardMaterial 
            color="#60a5fa" 
            emissive="#60a5fa"
            emissiveIntensity={1.0}
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
            <!-- Hintergrund-Panel für diese Seite -->
            <T.Mesh
                position.z={0.01}
                onpointerenter={() => { hoveredSide = i; onPointerEnter(); }}
                onpointerleave={() => { hoveredSide = null; onPointerLeave(); }}
                onclick={() => side.type === 'aspect' && handleAspectClick(side.aspect)}
            >
                <T.PlaneGeometry args={[radius * 1.1, height * 0.85]} />
                <T.MeshBasicMaterial 
                    color={isHovered ? '#3b82f6' : '#0f172a'}
                    transparent
                    opacity={isHovered ? 0.8 : 0.5}
                />
            </T.Mesh>

            {#if side.type === 'aspect' && side.aspect}
                <!-- Aspect: Icon oben, Titel unten - mit Abstand vom Rand -->
                <Text
                    text={side.aspect.icon}
                    fontSize={1.2}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, height * 0.15, 0.02]}
                />
                <!-- Titel-Schriftgröße basierend auf Textlänge -->
                {@const titleFontSize = side.aspect.title.length > 12 ? 0.28 : 0.35}
                <Text
                    text={side.aspect.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -height * 0.25, 0.02]}
                    color={isHovered ? '#ffffff' : '#94a3b8'}
                    maxWidth={radius * 0.9}
                    textAlign="center"
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

    <!-- Hover-Tooltip mit Description (HTML-Overlay) -->
    {#if hoveredSide !== null && sides[hoveredSide]?.type === 'aspect' && sides[hoveredSide]?.aspect}
        {@const hoveredAspect = sides[hoveredSide].aspect!}
        <HTML position={[0, height + 1.5, 0]} center transform={false}>
            <div style="background: #0f172a; border-radius: 16px; padding: 4px;">
                <div 
                    style="
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        color: white;
                        padding: 20px 24px;
                        border-radius: 12px;
                        width: 320px;
                        border: 2px solid #475569;
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0,0,0,0.5);
                    "
                >
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 2rem;">{hoveredAspect.icon}</span>
                        <span style="font-weight: 700; font-size: 1.125rem; color: #f1f5f9;">{hoveredAspect.title}</span>
                    </div>
                    <p style="font-size: 1rem; color: #cbd5e1; line-height: 1.6; margin: 0;">{hoveredAspect.description}</p>
                    {#if hoveredAspect.contentUrl}
                        <p style="font-size: 0.875rem; color: #60a5fa; margin-top: 16px; font-weight: 500;">
                            Panel klicken für mehr Info →
                        </p>
                    {/if}
                </div>
            </div>
        </HTML>
    {/if}
</T.Group>
