<script lang="ts">
    /**
     * ContentCard - Modal für Aspect-Inhalte
     * 
     * Zeigt HTML-Content von einer contentUrl an.
     * Ähnlich wie ProjectCard, aber für statische Inhalte.
     */
    import { worldStore } from "$lib/logic/store.svelte";
    import { fade, fly } from "svelte/transition";

    // Hole das aktuell ausgewählte Aspect aus dem Store
    let aspect = $derived(worldStore.state.selectedAspect);

    // Content-State
    let htmlContent = $state<string | null>(null);
    let isLoading = $state(false);
    let loadError = $state<string | null>(null);

    // Lade HTML-Content wenn Aspect sich ändert
    $effect(() => {
        if (aspect?.contentUrl) {
            loadContent(aspect.contentUrl);
        } else {
            htmlContent = null;
            loadError = null;
        }
    });

    async function loadContent(url: string) {
        isLoading = true;
        loadError = null;
        htmlContent = null;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            htmlContent = await response.text();
        } catch (err) {
            loadError = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
            console.error('ContentCard: Fehler beim Laden von', url, err);
        } finally {
            isLoading = false;
        }
    }

    function close() {
        worldStore.selectAspect(null);
    }

    // Farbe für Aspect (blau wie InfoHexagon)
    const aspectColor = '#60a5fa';
</script>

{#if aspect}
    <!-- Backdrop -->
    <button
        type="button"
        class="fixed inset-0 w-full h-full bg-black/40 backdrop-blur-md z-40 cursor-default"
        onclick={close}
        aria-label="Schließen"
        transition:fade={{ duration: 200 }}
    ></button>

    <!-- Die Card -->
    <article
        class="fixed inset-0 m-auto w-[90%] max-w-3xl h-fit max-h-[85vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
        transition:fly={{ y: 50, duration: 300 }}
        style="border: 2px solid {aspectColor}40;"
    >
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-700/50">
            <div class="flex items-center gap-3">
                <!-- Icon -->
                <div 
                    class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style="background: {aspectColor}20;"
                >
                    {aspect.icon}
                </div>
                <div>
                    <span class="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Themenbereich
                    </span>
                    <h2 class="text-xl font-bold text-white">
                        {aspect.title}
                    </h2>
                </div>
            </div>
            <button
                onclick={close}
                class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >✕</button>
        </div>

        <!-- Scrollbarer Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <!-- Description (immer sichtbar) -->
            <p class="text-lg text-slate-300 mb-6 pb-6 border-b border-slate-700/50">
                {aspect.description}
            </p>

            <!-- Geladener HTML-Content -->
            {#if isLoading}
                <div class="flex items-center justify-center py-12">
                    <div class="flex flex-col items-center gap-4">
                        <!-- Spinner -->
                        <div class="w-10 h-10 border-4 border-slate-700 border-t-blue-400 rounded-full animate-spin"></div>
                        <span class="text-slate-400 text-sm">Inhalt wird geladen...</span>
                    </div>
                </div>
            {:else if loadError}
                <div class="bg-red-900/20 border border-red-700/50 rounded-xl p-6 text-center">
                    <div class="text-red-400 text-lg mb-2">⚠️ Fehler beim Laden</div>
                    <p class="text-slate-400 text-sm">{loadError}</p>
                    <p class="text-slate-500 text-xs mt-2">URL: {aspect.contentUrl}</p>
                </div>
            {:else if htmlContent}
                <!-- Gerenderter HTML-Content mit Tailwind Typography Styles -->
                <div 
                    class="prose prose-invert prose-slate max-w-none
                           prose-headings:text-slate-100 prose-headings:font-bold
                           prose-h1:text-2xl prose-h1:border-b prose-h1:border-slate-700 prose-h1:pb-3 prose-h1:mb-6
                           prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                           prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                           prose-p:text-slate-300 prose-p:leading-relaxed
                           prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                           prose-strong:text-white
                           prose-ul:text-slate-300 prose-ol:text-slate-300
                           prose-li:marker:text-slate-500
                           prose-blockquote:border-l-blue-400 prose-blockquote:bg-slate-800/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                           prose-code:text-blue-300 prose-code:bg-slate-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5
                           prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700"
                >
                    {@html htmlContent}
                </div>
            {:else}
                <div class="text-center py-12 text-slate-500">
                    <p>Kein zusätzlicher Inhalt verfügbar.</p>
                </div>
            {/if}
        </div>

        <!-- Footer mit externem Link (falls contentUrl existiert) -->
        {#if aspect.contentUrl}
            <div class="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50">
                <a 
                    href={aspect.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                    <span>Vollständige Seite öffnen</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        {/if}
    </article>
{/if}
