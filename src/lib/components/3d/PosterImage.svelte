<script lang="ts">
    /**
     * PosterImage - Performance-optimierte Bild-Textur für Poster
     * 
     * Passt die Textur-Qualität basierend auf dem Performance-Level an:
     * - High: Volle Qualität (Mipmaps, hohe Anisotropie)
     * - Medium: Reduzierte Qualität (LinearFilter, niedrige Anisotropie)
     * - Low: Minimale Qualität (NearestFilter, keine Mipmaps)
     * 
     * Bei `preserveQuality=true` (z.B. für Leitlinien mit Text) wird
     * auch im Low-Mode mindestens LinearFilter verwendet.
     */
    import { T } from '@threlte/core';
    import { useTexture } from '@threlte/extras';
    import { LinearFilter, NearestFilter, LinearMipmapLinearFilter } from 'three';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';
    import { base } from '$app/paths';

    interface Props {
        url: string;
        width: number;
        height: number;
        position?: [number, number, number];
        transparent?: boolean;
        opacity?: number;
        /** Bei true: Mindestens LinearFilter auch im Low-Mode (für Bilder mit Text) */
        preserveQuality?: boolean;
    }

    let { 
        url, 
        width, 
        height, 
        position = [0, 0, 0],
        transparent = false,
        opacity = 1,
        preserveQuality = false
    }: Props = $props();

    // URL mit base-path verarbeiten (einmalig bei Komponenten-Erstellung)
    const processedUrl = url.startsWith('/') ? base + url : url;

    // Textur-Qualitätseinstellungen basierend auf Performance-Level
    function getTextureSettings() {
        const level = performanceStore.qualityLevel;
        
        if (level === 'low') {
            // Bei preserveQuality: LinearFilter statt NearestFilter für bessere Lesbarkeit
            if (preserveQuality) {
                return {
                    minFilter: LinearFilter,
                    magFilter: LinearFilter,
                    anisotropy: 1,
                    generateMipmaps: false
                };
            }
            return {
                minFilter: NearestFilter,
                magFilter: NearestFilter,
                anisotropy: 1,
                generateMipmaps: false
            };
        } else if (level === 'medium') {
            return {
                minFilter: LinearFilter,
                magFilter: LinearFilter,
                anisotropy: 2,
                generateMipmaps: false
            };
        } else {
            // high
            return {
                minFilter: LinearMipmapLinearFilter,
                magFilter: LinearFilter,
                anisotropy: 4,
                generateMipmaps: true
            };
        }
    }

    // Textur laden mit Performance-Optimierung
    const texture = useTexture(processedUrl, {
        transform: (tex) => {
            const settings = getTextureSettings();
            tex.minFilter = settings.minFilter;
            tex.magFilter = settings.magFilter;
            tex.anisotropy = settings.anisotropy;
            tex.generateMipmaps = settings.generateMipmaps;
            tex.needsUpdate = true;
            return tex;
        }
    });
</script>

{#await texture then map}
    <T.Mesh {position}>
        <T.PlaneGeometry args={[width, height]} />
        <T.MeshBasicMaterial 
            {map} 
            {transparent}
            {opacity}
        />
    </T.Mesh>
{:catch}
    <!-- Fallback bei Ladefehler: Farbiger Platzhalter -->
    <T.Mesh {position}>
        <T.PlaneGeometry args={[width, height]} />
        <T.MeshBasicMaterial color="#374151" />
    </T.Mesh>
{/await}
