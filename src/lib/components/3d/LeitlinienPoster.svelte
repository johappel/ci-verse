<script lang="ts">
    /**
     * LeitlinienPoster - Atmosphärisches Wand-Poster für die 4 Leitlinien
     * 
     * Platziert an den Wänden der Marktplatz-Plattform:
     * - Gerechtigkeit (justice) - Gold/Gelb
     * - Nachhaltigkeit (sustainability) - Grün
     * - Digitalität (digitality) - Cyan
     * - Strukturen (structure) - Violett
     * 
     * Interaktion:
     * - Hover: Leuchtet auf, Titel erscheint
     * - Klick: Aktiviert Perspektiven-Filter
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { MarketplaceWallPoster, Perspective } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';

    interface Props {
        poster: MarketplaceWallPoster;
        position?: [number, number, number];
        rotation?: number;
        size?: 'small' | 'medium' | 'large';
    }

    let { 
        poster, 
        position = [0, 0, 0], 
        rotation = 0,
        size = 'medium'
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);

    // Größen-Varianten
    const sizes = {
        small:  { width: 2.5, height: 4 },
        medium: { width: 3.5, height: 5.5 },
        large:  { width: 4.5, height: 7 }
    };
    
    const s = sizes[size];

    // Farben für jede Perspektive
    const perspectiveColors: Record<Perspective, { primary: string; glow: string; accent: string }> = {
        default: { primary: '#ffffff', glow: '#ffffff', accent: '#94a3b8' },
        education: { primary: '#fbbf24', glow: '#fcd34d', accent: '#f59e0b' },
        justice: { primary: '#facc15', glow: '#fef08a', accent: '#eab308' },
        sustainability: { primary: '#4ade80', glow: '#86efac', accent: '#22c55e' },
        diversity: { primary: '#f472b6', glow: '#f9a8d4', accent: '#ec4899' },
        digitality: { primary: '#22d3ee', glow: '#67e8f9', accent: '#06b6d4' },
        structure: { primary: '#a78bfa', glow: '#c4b5fd', accent: '#8b5cf6' }
    };

    const colors = $derived(perspectiveColors[poster.perspective] || perspectiveColors.default);
    
    // Ist diese Perspektive aktiv?
    const isActive = $derived(worldStore.state.activePerspective === poster.perspective);

    // Klick: Perspektive aktivieren/deaktivieren
    function handleClick() {
        if (isActive) {
            worldStore.setPerspective('default');
        } else {
            worldStore.setPerspective(poster.perspective);
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

    // Perspektiven-Icon
    const perspectiveIcon = $derived.by(() => {
        switch (poster.perspective) {
            case 'justice': return '⚖️';
            case 'sustainability': return '🌱';
            case 'digitality': return '💻';
            case 'structure': return '🏗️';
            default: return '🔮';
        }
    });
</script>

<T.Group position={position} rotation.y={rotation}>
    
    <!-- ========== POSTER-RAHMEN ========== -->
    <T.Mesh 
        position.y={s.height / 2}
        onclick={handleClick}
        onpointerenter={handlePointerEnter}
        onpointerleave={handlePointerLeave}
        castShadow
    >
        <T.BoxGeometry args={[s.width + 0.2, s.height + 0.2, 0.08]} />
        <T.MeshStandardMaterial 
            color={isHovered || isActive ? colors.accent : '#374151'}
            metalness={0.4}
            roughness={0.6}
        />
    </T.Mesh>

    <!-- ========== POSTER-FLÄCHE (mit Bild-Simulation) ========== -->
    <T.Mesh 
        position={[0, s.height / 2, 0.05]}
    >
        <T.PlaneGeometry args={[s.width, s.height]} />
        <T.MeshStandardMaterial 
            color={isHovered || isActive ? colors.glow : colors.primary}
            emissive={isHovered || isActive ? colors.primary : '#000000'}
            emissiveIntensity={isHovered || isActive ? 0.3 : 0}
            metalness={0.1}
            roughness={0.8}
        />
    </T.Mesh>

    <!-- ========== GRADIENT OVERLAY (von unten nach oben) ========== -->
    <T.Mesh position={[0, s.height * 0.25, 0.06]}>
        <T.PlaneGeometry args={[s.width - 0.1, s.height * 0.5]} />
        <T.MeshBasicMaterial 
            color={colors.accent}
            transparent
            opacity={0.4}
        />
    </T.Mesh>

    <!-- ========== ICON (groß, zentral) ========== -->
    <Text
        text={perspectiveIcon}
        fontSize={1.2}
        position={[0, s.height * 0.6, 0.1]}
        anchorX="center"
        anchorY="middle"
    />

    <!-- ========== TITEL ========== -->
    <Text
        text={poster.title}
        fontSize={0.35}
        color="#ffffff"
        position={[0, s.height * 0.2, 0.1]}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
    />

    <!-- ========== PERSPEKTIVE LABEL ========== -->
    <Text
        text="LEITLINIE"
        fontSize={0.12}
        color={colors.glow}
        position={[0, s.height - 0.3, 0.1]}
        anchorX="center"
        letterSpacing={0.15}
    />

    <!-- ========== GLOW-EFFEKT (bei Hover/Aktiv) ========== -->
    {#if isHovered || isActive}
        <T.PointLight
            position={[0, s.height / 2, 1]}
            intensity={isActive ? 2 : 1}
            distance={8}
            color={colors.glow}
        />
    {/if}

    <!-- ========== HOVER-TOOLTIP ========== -->
    {#if isHovered && !isActive}
        <HTML
            position={[0, s.height + 0.8, 0.5]}
            center
            transform
            scale={0.06}
        >
            <div class="tooltip">
                Klicken für Perspektive "{poster.title}"
            </div>
        </HTML>
    {/if}

    <!-- ========== AKTIV-INDIKATOR ========== -->
    {#if isActive}
        <HTML
            position={[s.width / 2 + 0.3, s.height - 0.5, 0.2]}
            transform
            scale={0.05}
        >
            <div class="active-badge">
                ✓ AKTIV
            </div>
        </HTML>
    {/if}

</T.Group>

<style>
    .tooltip {
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
        pointer-events: none;
    }

    .active-badge {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
    }
</style>
