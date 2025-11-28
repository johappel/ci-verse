<script lang="ts">
    import Scene from "$lib/components/3d/Scene.svelte";
    import MinimalScene from "$lib/components/3d/MinimalScene.svelte";
    import ProjectCard from "$lib/components/ui/ProjectCard.svelte";
    import ContentCard from "$lib/components/ui/ContentCard.svelte";
    import FilterBar from "$lib/components/ui/FilterBar.svelte";
    import NavigationControls from "$lib/components/ui/NavigationControls.svelte";
    import { initWorldStore } from "$lib/logic/store.svelte";
    import { mockProjects } from "$lib/data/mockProjects";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    // Initialisiere Store sofort
    const store = initWorldStore(mockProjects);
    
    // Loading State (von Scene gemeldet)
    let isLoading = $state(true);
    let loadingProgress = $state(0);
    let loadingMessage = $state('Starte...');
    
    // CameraControls Referenz (von Scene)
    let cameraControls = $state<any>(null);

    function handleLoadingUpdate(data: { progress: number; message: string; done: boolean }) {
        loadingProgress = data.progress;
        loadingMessage = data.message;
        if (data.done) {
            isLoading = false;
        }
    }
    
    function handleCameraReady(controls: any) {
        cameraControls = controls;
    }

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
    <!-- Loading Overlay - ZUERST, damit es über allem liegt -->
    {#if isLoading}
        <div 
            style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                width: 100vw;
                height: 100vh;
                background: rgb(15, 23, 42);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            "
        >
            <!-- Logo/Titel -->
            <div style="margin-bottom: 2rem; text-align: center;">
                <h1 style="font-size: 2.25rem; font-weight: bold; color: white; margin-bottom: 0.5rem;">
                    Comenius <span style="color: #22d3ee;">Universum</span>
                </h1>
                <p style="color: #cbd5e1;">Bildungslandschaft wird geladen...</p>
            </div>
            
            <!-- Fortschrittsbalken -->
            <div style="width: 20rem; margin-bottom: 1rem;">
                <div style="height: 0.5rem; background: #334155; border-radius: 9999px; overflow: hidden;">
                    <div 
                        style="
                            height: 100%;
                            background: linear-gradient(to right, #3b82f6, #22d3ee);
                            transition: width 150ms;
                            width: {loadingProgress}%;
                        "
                    ></div>
                </div>
                <p style="text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">
                    {Math.round(loadingProgress)}%
                </p>
            </div>
            
            <!-- Status-Text -->
            <p style="color: white; font-size: 0.875rem;">{loadingMessage}</p>
        </div>
    {/if}

    <!-- 3D Canvas (Vollbild) - immer rendern -->
    <Scene onLoadingUpdate={handleLoadingUpdate} onCameraReady={handleCameraReady} />

    <!-- UI Overlays (nur wenn geladen) -->
    {#if !isLoading}
        <ProjectCard />
        <ContentCard />
        <!-- <FilterBar /> -->
        <NavigationControls {cameraControls} />

        <!-- Logo/Title Overlay -->
        <!-- <div class="absolute top-6 left-6 z-20">
            <h1 class="text-2xl font-bold text-white drop-shadow-lg">
                Comenius <span class="text-blue-400">Orbital</span>
            </h1>
            <p class="text-sm text-white/80 drop-shadow">
                Entdecke die Bildungslandschaft
            </p>
        </div> -->
    {/if}
</main>
