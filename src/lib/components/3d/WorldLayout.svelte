<script lang="ts">
    import { interactivity } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms, getConnectionsForPlatform } from '$lib/logic/platforms';
    import Platform from './Platform.svelte';
    import MarketplacePlatform from './MarketplacePlatform.svelte';
    import LightBridge from './LightBridge.svelte';
    import TransportPortal from './TransportPortal.svelte';
    import ShaderWarmup from './ShaderWarmup.svelte';

    // Aktiviere Interaktivität für diese Komponente und alle Kinder
    interactivity();
    
    // Shader-Warmup Status
    let shadersWarmedUp = $state(false);

    // Alle Plattformen als Array (ohne S, die bekommt MarketplacePlatform)
    let regularPlatforms = Object.values(platforms).filter(p => p.id !== 'S');
    let sPlatform = platforms['S'];

    // Projekte nach Plattform gruppieren
    function getProjectsForPlatform(platformId: string) {
        return worldStore.state.projects.filter((p) => {
            // Projekte werden ihrer ersten Department zugeordnet
            const dept = p.departments[0];
            // B1, B2, B3 → direkt zu B-Plattformen
            // Q1, Q2, Q3 → direkt zu Q-Plattformen
            // S1, S2, S3 → zur S-Plattform
            if (dept?.startsWith('S')) return platformId === 'S';
            return dept === platformId;
        });
    }

    // Sichtbare Verbindungen: Alle von/zu aktueller Plattform
    let visibleConnections = $derived(getConnectionsForPlatform(worldStore.state.currentPlatform));
</script>

<!-- Shader Warmup - kompiliert alle WebGL-Shader beim Start -->
<ShaderWarmup onComplete={() => shadersWarmedUp = true} />

<!-- Reguläre Plattformen (B1, B2, B3, Q1, Q2, Q3) -->
{#each regularPlatforms as platform (platform.id)}
    <Platform {platform} projects={getProjectsForPlatform(platform.id)} />
{/each}

<!-- S-Plattform (Marktplatz) mit spezieller Komponente -->
{#if sPlatform}
    <MarketplacePlatform platform={sPlatform} />
{/if}

<!-- Transport-Portal auf S-Plattform -->
<TransportPortal />

<!-- Lichtlinien-Verbindungen -->
{#each visibleConnections as conn (conn.from + '-' + conn.to)}
    <LightBridge from={platforms[conn.from]} to={platforms[conn.to]} color={conn.color} />
{/each}
