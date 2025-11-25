<script lang="ts">
    import Scene from "$lib/components/3d/Scene.svelte";
    import MinimalScene from "$lib/components/3d/MinimalScene.svelte";
    import ProjectCard from "$lib/components/ui/ProjectCard.svelte";
    import FilterBar from "$lib/components/ui/FilterBar.svelte";
    import { initWorldStore } from "$lib/logic/store.svelte";
    import { mockProjects } from "$lib/data/mockProjects";
    import { onMount } from "svelte";

    // Initialisiere Store sofort
    const store = initWorldStore(mockProjects);
    let ready = $state(true); // SOFORT rendern!

    // URL-Parameter beim Mount lesen
    onMount(() => {
        const searchParams = new URLSearchParams(window.location.search);

        // Deep-Link zu Projekt
        const projectSlug = searchParams.get("project");
        if (projectSlug) {
            const project = store.findBySlug(projectSlug);
            if (project) {
                store.selectProject(project.id);
            }
        }

        // Deep-Link zu Perspektive
        const view = searchParams.get("view");
        if (
            view &&
            ["digitality", "sustainability", "justice", "structure"].includes(
                view,
            )
        ) {
            store.setPerspective(view as any);
        }
    });
</script>

<svelte:head>
    <title>Comenius Orbital - Bildungslandschaft</title>
    <meta
        name="description"
        content="Interaktive 3D-Visualisierung der Comenius-Institut Projektlandschaft"
    />
</svelte:head>

<main class="w-screen h-screen overflow-hidden relative">
    {#if ready}
        <!-- 3D Canvas (Vollbild) -->
        <Scene />

        <!-- UI Overlays -->
        <ProjectCard />
        <FilterBar />

        <!-- Logo/Title Overlay -->
        <div class="absolute top-6 left-6 z-20">
            <h1 class="text-2xl font-bold text-white drop-shadow-lg">
                Comenius <span class="text-blue-400">Orbital</span>
            </h1>
            <p class="text-sm text-white/80 drop-shadow">
                Entdecke die Bildungslandschaft
            </p>
        </div>
    {:else}
        <!-- Loading State -->
        <div
            class="absolute inset-0 flex items-center justify-center bg-gray-100"
        >
            <div class="text-center">
                <div class="text-4xl mb-4">🌐</div>
                <p class="text-xl font-semibold text-gray-700">
                    Lade Comenius Orbital...
                </p>
            </div>
        </div>
    {/if}
</main>
