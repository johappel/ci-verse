<script lang="ts">
    import { T } from '@threlte/core';
    import { interactivity } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms, connections } from '$lib/logic/platforms';
    // Vollständige Platform.svelte aktivieren
    import Platform from './Platform.svelte';
    import MarketplacePlatform from './MarketplacePlatform.svelte';
    import LightBridge from './LightBridge.svelte';
    import ShaderWarmup from './ShaderWarmup.svelte';

    // Aktiviere Interaktivität für diese Komponente und alle Kinder
    interactivity();

    // S-Plattform (Marktplatz) separat
    const sPlatform = platforms['S'];
    
    // Andere Plattformen (B1, B2, B3, Q1, Q2, Q3)
    const departmentPlatforms = Object.values(platforms).filter(p => p.id !== 'S');

    // Alle Verbindungen zwischen Plattformen
    const allConnections = connections;
</script>

<!-- Shader Warmup -->
<ShaderWarmup />

<!-- Department-Plattformen (B1-B3, Q1-Q3) - VOLLE Komponente -->
{#each departmentPlatforms as platform (platform.id)}
    <Platform {platform} />
{/each}

<!-- Marktplatz (S) - VOLLE Komponente -->
{#if sPlatform}
    <MarketplacePlatform platform={sPlatform} />
{/if}

<!-- LightBridges - Verbindungslinien zwischen Plattformen -->
{#each allConnections as conn (conn.from + '-' + conn.to)}
    <LightBridge from={platforms[conn.from]} to={platforms[conn.to]} color={conn.color} />
{/each}
