<script lang="ts">
    /**
     * MarketplaceStand - Interaktiver Stand auf dem Marktplatz (S-Plattform)
     * 
     * 3 Varianten je nach Typ:
     * - institution: Großer Hauptstand mit Banner + KI-Chat-Kiosk
     * - publications: Info-Terminal mit RSS-Feed Anzeige
     * - events: Kalender-Terminal mit Veranstaltungen
     * 
     * Struktur:
     * - Fußbereich mit Logo/Icon
     * - Vertikale Display-Fläche mit Banner
     * - Interaktions-Button je nach Typ
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { MarketplaceStand } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';

    interface Props {
        stand: MarketplaceStand;
        position?: [number, number, number];
        rotation?: number;
        platformPosition?: [number, number, number];
    }

    let { 
        stand, 
        position = [0, 0, 0], 
        rotation = 0,
        platformPosition = [0, 0, 0]
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);
    let isButtonHovered = $state(false);

    // Größen basierend auf Typ
    const dimensions = $derived.by(() => {
        switch (stand.type) {
            case 'institution':
                return { width: 10, height: 7, depth: 3, baseHeight: 0.8 };
            case 'publications':
                return { width: 6, height: 5, depth: 2, baseHeight: 0.6 };
            case 'events':
                return { width: 6, height: 5, depth: 2, baseHeight: 0.6 };
            default:
                return { width: 5, height: 4, depth: 1.5, baseHeight: 0.5 };
        }
    });

    const displayColor = stand.display.color || '#b82f6';
    
    // Klick auf Stand: Kamera positioniert sich davor
    function handleStandClick() {
        const worldX = platformPosition[0] + position[0];
        const worldY = platformPosition[1] + position[1];
        const worldZ = platformPosition[2] + position[2];
        
        const viewDistance = stand.type === 'institution' ? 12 : 8;
        const cameraY = getCameraY(platformPosition[1]);
        
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const worldOffsetX = viewDistance * sin;
        const worldOffsetZ = viewDistance * cos;
        
        const cameraPos = {
            x: worldX + worldOffsetX,
            y: cameraY,
            z: worldZ + worldOffsetZ
        };
        
        const bannerCenterY = worldY + dimensions.height / 2 + dimensions.baseHeight;
        const lookAtPos = {
            x: worldX,
            y: Math.min(bannerCenterY, cameraY + 1),
            z: worldZ
        };
        
        worldStore.setViewTarget(cameraPos, lookAtPos);
    }

    // Klick auf Interaktions-Button
    function handleButtonClick(e: Event) {
        e.stopPropagation();
        
        switch (stand.type) {
            case 'institution':
                // Chat öffnen
                worldStore.openChat();
                break;
            case 'publications':
                // RSS-Panel öffnen
                worldStore.openRssPanel();
                break;
            case 'events':
                // Events-Panel öffnen
                worldStore.openEventsPanel();
                break;
            default:
                // Externe URL öffnen (Fallback)
                if (stand.externalUrl) {
                    window.open(stand.externalUrl, '_blank');
                }
                break;
        }
    }

    function handlePointerEnter() {
        isHovered = true;
        onPointerEnter();
    }

    function handlePointerLeave() {
        isHovered = false;
        onPointerLeave();
    }

    // Button-Text je nach Typ
    const buttonText = $derived.by(() => {
        switch (stand.type) {
            case 'institution': return '💬 Chat starten';
            case 'publications': return '📰 News lesen';
            case 'events': return '📅 Termine';
            default: return '🔗 Mehr erfahren';
        }
    });
</script>

<T.Group position={position} rotation.y={rotation}>
    
    <!-- ========== BASIS / SOCKEL ========== -->
    <T.Mesh 
        position.y={dimensions.baseHeight / 2}
        castShadow
        receiveShadow
    >
        <T.BoxGeometry args={[dimensions.width, dimensions.baseHeight, dimensions.depth]} />
        <T.MeshStandardMaterial 
            color={displayColor} 
            metalness={0.3} 
            roughness={0.7}
        />
    </T.Mesh>

    <!-- Sockel-Akzent (dunkler Streifen) -->
    <T.Mesh position.y={0.05} position.z={dimensions.depth / 2 + 0.01}>
        <T.BoxGeometry args={[dimensions.width * 0.9, 0.1, 0.02]} />
        <T.MeshStandardMaterial color="#1f2937" />
    </T.Mesh>

    <!-- ========== HAUPTDISPLAY (vertikale Wand) ========== -->
    <T.Group position.y={dimensions.baseHeight}>
        
        <!-- Rückwand / Displayfläche -->
        <T.Mesh 
            position.y={dimensions.height / 2}
            position.z={-dimensions.depth / 2 + 0.05}
            onclick={handleStandClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
            castShadow
        >
            <T.BoxGeometry args={[dimensions.width - 0.2, dimensions.height, 0.1]} />
            <T.MeshStandardMaterial 
                color={isHovered ? '#ffffff' : '#f8fafc'}
                metalness={0.1}
                roughness={0.9}
            />
        </T.Mesh>

        <!-- Farbiger Header-Streifen -->
        <T.Mesh 
            position.y={dimensions.height - 0.4}
            position.z={-dimensions.depth / 2 + 0.11}
        >
            <T.BoxGeometry args={[dimensions.width - 0.3, 0.8, 0.02]} />
            <T.MeshStandardMaterial color={displayColor} />
        </T.Mesh>

        <!-- Icon im Header -->
        <Text
            text={stand.icon}
            fontSize={0.5}
            position={[-dimensions.width / 2 + 0.8, dimensions.height - 0.4, -dimensions.depth / 2 + 0.15]}
            anchorX="center"
            anchorY="middle"
        />

        <!-- Titel -->
        <Text
            text={stand.title}
            fontSize={stand.type === 'institution' ? 0.35 : 0.28}
            color="#1f2937"
            font="/fonts/Inter-Bold.woff"
            position={[0, dimensions.height - 1.2, -dimensions.depth / 2 + 0.12]}
            anchorX="center"
            anchorY="top"
            maxWidth={dimensions.width - 1}
        />

        <!-- Beschreibung -->
        <Text
            text={stand.description}
            fontSize={0.18}
            color="#4b5563"
            font="/fonts/Inter-Regular.woff"
            position={[0, dimensions.height - 2, -dimensions.depth / 2 + 0.12]}
            anchorX="center"
            anchorY="top"
            maxWidth={dimensions.width - 1.5}
            lineHeight={1.4}
            textAlign="center"
        />

        <!-- ========== INTERAKTIONS-BUTTON (HTML Overlay) ========== -->
        <HTML
            position={[0, 1.2, dimensions.depth / 2 + 0.3]}
            transform
            scale={0.08}
            pointerEvents="auto"
        >
            <button
                class="marketplace-button"
                class:institution={stand.type === 'institution'}
                class:publications={stand.type === 'publications'}
                class:events={stand.type === 'events'}
                class:hovered={isButtonHovered}
                onclick={handleButtonClick}
                onmouseenter={() => isButtonHovered = true}
                onmouseleave={() => isButtonHovered = false}
            >
                {buttonText}
            </button>
        </HTML>

    </T.Group>

    <!-- ========== SEITENWÄNDE (nur bei Institution) ========== -->
    {#if stand.type === 'institution'}
        <!-- Linke Seitenwand -->
        <T.Mesh 
            position={[-dimensions.width / 2 + 0.05, dimensions.baseHeight + dimensions.height / 2, 0]}
            castShadow
        >
            <T.BoxGeometry args={[0.1, dimensions.height, dimensions.depth]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.2} roughness={0.8} />
        </T.Mesh>
        
        <!-- Rechte Seitenwand -->
        <T.Mesh 
            position={[dimensions.width / 2 - 0.05, dimensions.baseHeight + dimensions.height / 2, 0]}
            castShadow
        >
            <T.BoxGeometry args={[0.1, dimensions.height, dimensions.depth]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.2} roughness={0.8} />
        </T.Mesh>
        
        <!-- Dach -->
        <T.Mesh 
            position.y={dimensions.baseHeight + dimensions.height + 0.15}
            castShadow
        >
            <T.BoxGeometry args={[dimensions.width + 0.4, 0.3, dimensions.depth + 0.4]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.3} roughness={0.6} />
        </T.Mesh>
    {/if}

    <!-- ========== TERMINAL-BILDSCHIRM (nur bei publications/events) ========== -->
    {#if stand.type === 'publications' || stand.type === 'events'}
        <!-- Angewinkelter Bildschirm vorne -->
        <T.Group position={[0, dimensions.baseHeight + 1.5, dimensions.depth / 2 - 0.3]}>
            <T.Mesh rotation.x={-0.3} castShadow>
                <T.BoxGeometry args={[dimensions.width * 0.7, 2.5, 0.15]} />
                <T.MeshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.3} />
            </T.Mesh>
            
            <!-- Bildschirm-Inhalt (simuliert) -->
            <T.Mesh rotation.x={-0.3} position.z={0.08}>
                <T.PlaneGeometry args={[dimensions.width * 0.65, 2.3]} />
                <T.MeshBasicMaterial color={stand.type === 'publications' ? '#065f46' : '#7f1d1d'} />
            </T.Mesh>
            
            <!-- Bildschirm-Text -->
            <Text
                text={stand.type === 'publications' ? '📰 Aktuelle News' : '📅 Nächste Termine'}
                fontSize={0.2}
                color="#ffffff"
                position={[0, 0.5, 0.1]}
                rotation.x={-0.3}
                anchorX="center"
            />
        </T.Group>
    {/if}

    <!-- ========== BELEUCHTUNG (dezent) ========== -->
    <T.PointLight
        position={[0, dimensions.height + 2, dimensions.depth]}
        intensity={0.5}
        distance={10}
        color={displayColor}
    />

</T.Group>

<style>
    .marketplace-button {
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .marketplace-button.institution {
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        color: white;
    }

    .marketplace-button.publications {
        background: linear-gradient(135deg, #047857, #10b981);
        color: white;
    }

    .marketplace-button.events {
        background: linear-gradient(135deg, #b91c1c, #ef4444);
        color: white;
    }

    .marketplace-button.hovered {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
</style>
