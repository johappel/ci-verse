<script lang="ts" module>
    // Exportiere den Typ für TypeScript
    export interface QualityDialogProps {
        isOpen: boolean;
    }
</script>

<script lang="ts">
    import { performanceStore, type QualityLevel } from '$lib/logic/performanceStore.svelte';
    
    let { isOpen = $bindable(false) }: { isOpen: boolean } = $props();
    
    // Stability delay - verhindert sofortiges Schließen
    let isStable = $state(false);
    
    $effect(() => {
        if (isOpen) {
            isStable = false;
            const timer = setTimeout(() => {
                isStable = true;
            }, 100);
            return () => clearTimeout(timer);
        }
    });
    
    // Qualitätsstufen-Definitionen
    const qualityOptions: { level: QualityLevel; icon: string; label: string; description: string }[] = [
        { 
            level: 'high', 
            icon: '🔥', 
            label: 'Beste Grafik',
            description: 'Volle Effekte, Schatten & Beleuchtung'
        },
        { 
            level: 'medium', 
            icon: '⚡', 
            label: 'Ausgewogen',
            description: 'Gute Grafik, reduzierte Effekte'
        },
        { 
            level: 'low', 
            icon: '🌿', 
            label: 'Performance',
            description: 'Einfache Grafik, schnellste Ladezeit'
        }
    ];
    
    // GPU-Info für Anzeige
    let gpuInfo = $derived(
        performanceStore.gpuTier === 'integrated' 
            ? 'Integrierte GPU erkannt' 
            : performanceStore.gpuTier === 'dedicated'
                ? 'Dedizierte GPU erkannt'
                : 'GPU unbekannt'
    );
    
    // GPU-Farbe
    let gpuColor = $derived(
        performanceStore.gpuTier === 'dedicated' ? '#4ade80' : 
        performanceStore.gpuTier === 'integrated' ? '#facc15' : '#9ca3af'
    );
    
    // Turbo-Modus (überspringt Preload-Flug)
    let turboMode = $state(performanceStore.settings.skipPreloadFlight);
    
    $effect(() => {
        turboMode = performanceStore.settings.skipPreloadFlight;
    });
    
    function selectQuality(level: QualityLevel) {
        console.log('[QualityDialog] Setting quality to:', level);
        performanceStore.setQuality(level);
        console.log('[QualityDialog] After set - qualityLevel:', performanceStore.qualityLevel);
        console.log('[QualityDialog] After set - enableGlowRings:', performanceStore.settings.enableGlowRings);
    }
    
    function toggleTurboMode() {
        // Turbo-Modus setzt automatisch auf 'low' und skipPreloadFlight
        if (!turboMode) {
            performanceStore.setQuality('low');
        }
    }
    
    function closeDialog() {
        isOpen = false;
    }
    
    // Escape-Taste schließt Dialog
    function handleKeydown(e: KeyboardEvent) {
        if (!isStable) return;
        if (e.key === 'Escape') {
            closeDialog();
        }
    }
    
    // Backdrop-Click schließt Dialog
    function handleBackdropClick(e: MouseEvent) {
        if (!isStable) return;
        if (e.target === e.currentTarget) {
            closeDialog();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop - NUR INLINE STYLES gemäß dialog-components.md -->
    <div 
        style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 99999;
            isolation: isolate;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
        "
        onclick={handleBackdropClick}
        onkeydown={(e) => e.key === 'Enter' && closeDialog()}
        role="button"
        tabindex="0"
        aria-label="Dialog schließen"
    >
        <!-- Dialog Box -->
        <div 
            style="
                width: 90vw;
                max-width: 420px;
                background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
                backdrop-filter: blur(20px);
                border-radius: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                overflow: hidden;
            "
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            tabindex="-1"
            aria-labelledby="quality-dialog-title"
        >
            <!-- Header -->
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1.25rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">🚀</span>
                    <h2 id="quality-dialog-title" style="
                        font-size: 1.125rem;
                        font-weight: 600;
                        color: white;
                        margin: 0;
                    ">
                        Grafik-Einstellungen
                    </h2>
                </div>
                <button
                    onclick={closeDialog}
                    style="
                        padding: 0.375rem;
                        border-radius: 0.5rem;
                        background: transparent;
                        border: none;
                        color: rgba(255, 255, 255, 0.6);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    "
                    aria-label="Schließen"
                >
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <!-- Content -->
            <div style="padding: 1.25rem;">
                <!-- GPU Info -->
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    margin-bottom: 1rem;
                ">
                    <span style="color: rgba(255, 255, 255, 0.6); display: flex; align-items: center;">
                        <span style="
                            display: inline-block;
                            width: 0.5rem;
                            height: 0.5rem;
                            border-radius: 50%;
                            margin-right: 0.5rem;
                            background: {gpuColor};
                        "></span>
                        {gpuInfo}
                    </span>
                    <span style="color: #22d3ee; font-family: monospace;">
                        {performanceStore.currentFPS} FPS
                    </span>
                </div>
                
                <!-- Quality Options -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    {#each qualityOptions as option}
                        {@const isSelected = performanceStore.qualityLevel === option.level}
                        <button
                            onclick={() => selectQuality(option.level)}
                            style="
                                width: 100%;
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                                padding: 1rem;
                                border-radius: 0.75rem;
                                border: 2px solid {isSelected ? 'rgba(96, 165, 250, 0.6)' : 'transparent'};
                                background: {isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s;
                            "
                        >
                            <span style="font-size: 1.5rem;">{option.icon}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 500; color: white;">{option.label}</div>
                                <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">{option.description}</div>
                            </div>
                            {#if isSelected}
                                <svg style="width: 1.5rem; height: 1.5rem; color: #60a5fa;" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                            {/if}
                        </button>
                    {/each}
                </div>
                
                <!-- Turbo Mode Toggle -->
                <div style="
                    margin-top: 1rem;
                    padding: 1rem;
                    background: linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(239, 68, 68, 0.1));
                    border-radius: 0.75rem;
                    border: 1px solid rgba(251, 146, 60, 0.3);
                ">
                    <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer;">
                        <input 
                            type="checkbox" 
                            bind:checked={turboMode}
                            onchange={toggleTurboMode}
                            style="
                                width: 1.25rem;
                                height: 1.25rem;
                                accent-color: #f97316;
                                cursor: pointer;
                            "
                        />
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.125rem;">🏎️</span>
                                <span style="font-weight: 500; color: white;">Turbo-Modus</span>
                            </div>
                            <p style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0 0;">
                                Überspringt den Rundflug beim Start
                            </p>
                        </div>
                    </label>
                </div>
                
                <!-- Info -->
                <p style="
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.4);
                    text-align: center;
                    margin-top: 1rem;
                    margin-bottom: 0;
                ">
                    Änderungen werden sofort wirksam und gespeichert
                </p>
            </div>
        </div>
    </div>
{/if}
