<script lang="ts">
    import { interactivity } from '@threlte/extras';
    import { worldStore } from '$lib/logic/store.svelte';
    import { platforms, connections, getConnectionsForPlatform } from '$lib/logic/platforms';
    import Platform from './Platform.svelte';
    import LightBridge from './LightBridge.svelte';
    import TransportPortal from './TransportPortal.svelte';

    // Aktiviere Interaktivität für diese Komponente und alle Kinder
    interactivity();

    // Alle Plattformen als Array
    let allPlatforms = Object.values(platforms);

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

<!-- Alle Plattformen rendern -->
{#each allPlatforms as platform (platform.id)}
    <Platform {platform} projects={getProjectsForPlatform(platform.id)} />
{/each}

<!-- Transport-Portal auf S-Plattform -->
<TransportPortal />

<!-- Lichtlinien-Verbindungen -->
{#each visibleConnections as conn (conn.from + '-' + conn.to)}
    <LightBridge from={platforms[conn.from]} to={platforms[conn.to]} color={conn.color} />
{/each}
