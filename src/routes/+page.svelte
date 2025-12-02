<script lang="ts">
    import Scene from "$lib/components/3d/Scene.svelte";
    import MinimalScene from "$lib/components/3d/MinimalScene.svelte";
    import ProjectCard from "$lib/components/ui/ProjectCard.svelte";
    import ContentCard from "$lib/components/ui/ContentCard.svelte";
    import FilterBar from "$lib/components/ui/FilterBar.svelte";
    import NavigationControls from "$lib/components/ui/NavigationControls.svelte";
    import ChatModal from "$lib/components/ui/ChatModal.svelte";
    import RssFeedPanel from "$lib/components/ui/RssFeedPanel.svelte";
    import EventsPanel from "$lib/components/ui/EventsPanel.svelte";
    import IframeDialog from "$lib/components/ui/IframeDialog.svelte";
    import PartnerDialog from "$lib/components/ui/PartnerDialog.svelte";
    import { initWorldStore, worldStore } from "$lib/logic/store.svelte";
    import { mockProjects } from "$lib/data/mockProjects";
    import { platforms } from "$lib/logic/platforms";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";

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

    // Transport-Info: Zielplattform-Name
    let transportTargetName = $derived(
        worldStore.state.transportTarget 
            ? platforms[worldStore.state.transportTarget]?.name || worldStore.state.transportTarget
            : ''
    );

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
                    CI<span style="color: #22d3ee;">Versum</span>
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

    <!-- Transport-Overlay (Flug zwischen Plattformen) - auch während Loading! -->
    {#if worldStore.state.isTransporting}
        <div 
            class="transport-overlay"
            class:during-loading={isLoading}
            transition:fade={{ duration: 300 }}
        >
            <div class="transport-content" in:fly={{ y: -20, duration: 400 }}>
                <!-- Animiertes Flugzeug-Icon -->
                <div class="transport-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="plane-icon">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                    </svg>
                </div>
                
                <!-- Text -->
                <div class="transport-text">
                    <span class="transport-label">Flug zu</span>
                    <span class="transport-destination">{transportTargetName}</span>
                </div>
                
                <!-- Animierte Punkte -->
                <div class="transport-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
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

<!-- Dialoge außerhalb des main-Containers für korrekten z-index -->
{#if !isLoading}
    <ChatModal />
    <IframeDialog />
    <PartnerDialog />
    <RssFeedPanel 
        isOpen={worldStore.state.isRssPanelOpen} 
        onClose={() => worldStore.closeRssPanel()} 
    />
    <EventsPanel 
        isOpen={worldStore.state.isEventsPanelOpen} 
        onClose={() => worldStore.closeEventsPanel()} 
    />
{/if}

<style>
    /* Transport-Overlay Styles */
    .transport-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100000; /* Über Loading-Overlay */
        display: flex;
        justify-content: center;
        padding-top: 2rem;
        pointer-events: none;
    }
    
    /* Während Loading: weiter unten positionieren */
    .transport-overlay.during-loading {
        top: auto;
        bottom: 8rem;
        padding-top: 0;
    }
    
    .transport-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
        backdrop-filter: blur(12px);
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: 9999px;
        padding: 0.75rem 1.5rem;
        box-shadow: 
            0 4px 20px rgba(99, 102, 241, 0.3),
            0 0 40px rgba(99, 102, 241, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    .transport-icon {
        width: 1.5rem;
        height: 1.5rem;
        color: #818cf8;
        animation: fly-bounce 1s ease-in-out infinite;
    }
    
    .plane-icon {
        width: 100%;
        height: 100%;
        transform: rotate(-45deg);
    }
    
    @keyframes fly-bounce {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-3px) translateX(2px); }
    }
    
    .transport-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
    }
    
    .transport-label {
        font-size: 0.7rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .transport-destination {
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(90deg, #c7d2fe, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .transport-dots {
        display: flex;
        gap: 0.25rem;
        margin-left: 0.5rem;
    }
    
    .dot {
        width: 0.375rem;
        height: 0.375rem;
        border-radius: 50%;
        background: #818cf8;
        animation: dot-pulse 1.2s ease-in-out infinite;
    }
    
    .dot:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes dot-pulse {
        0%, 60%, 100% { 
            opacity: 0.3;
            transform: scale(1);
        }
        30% { 
            opacity: 1;
            transform: scale(1.2);
        }
    }
</style>
