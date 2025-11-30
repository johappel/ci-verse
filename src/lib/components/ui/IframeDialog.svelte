<script lang="ts">
    /**
     * IframeDialog - Dialog mit eingebetteter Website
     * 
     * Zeigt externe Websites in einem iframe innerhalb des GlassDialog an.
     * Verwendet von:
     * - InteractionPillar vor ReceptionWall (comenius.de)
     * - AspectPillar vor InfoHexagon (contentUrl der Aspects)
     */
    import { Globe, ExternalLink, RefreshCw } from 'lucide-svelte';
    import GlassDialog from './GlassDialog.svelte';
    import { worldStore } from '$lib/logic/store.svelte';

    // Reaktiv vom Store
    let isOpen = $derived(worldStore.state.isIframeOpen);
    let iframeUrl = $derived(worldStore.state.iframeUrl);
    let iframeTitle = $derived(worldStore.state.iframeTitle || 'Website');

    let isLoading = $state(true);
    let iframeRef: HTMLIFrameElement | null = $state(null);

    function handleClose() {
        worldStore.closeIframe();
        isLoading = true;
    }

    function handleIframeLoad() {
        isLoading = false;
    }

    function handleRefresh() {
        if (iframeRef && iframeUrl) {
            isLoading = true;
            iframeRef.src = iframeUrl;
        }
    }

    function handleOpenExternal() {
        if (iframeUrl) {
            window.open(iframeUrl, '_blank');
        }
    }

    // Reset loading state when URL changes
    $effect(() => {
        if (iframeUrl) {
            isLoading = true;
        }
    });
</script>

<GlassDialog 
    {isOpen} 
    onClose={handleClose}
    title={iframeTitle}
    subtitle={iframeUrl || ''}
    icon={Globe}
    width="min(90vw, 1400px)"
    height="85vh"
>
    <div style="
        display: flex;
        flex-direction: column;
        height: calc(85vh - 80px);
        min-height: 400px;
    ">
        <!-- Toolbar -->
        <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <!-- URL Display -->
            <div style="
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 0.5rem;
                margin-right: 0.75rem;
                overflow: hidden;
            ">
                <Globe style="width: 1rem; height: 1rem; color: #94a3b8; flex-shrink: 0;" />
                <span style="
                    font-size: 0.8rem;
                    color: #94a3b8;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: monospace;
                ">{iframeUrl || ''}</span>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.5rem;">
                <button
                    onclick={handleRefresh}
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 0.375rem;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        cursor: pointer;
                        transition: background 0.2s;
                    "
                    title="Neu laden"
                >
                    <RefreshCw style="width: 1rem; height: 1rem;" />
                </button>
                <button
                    onclick={handleOpenExternal}
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 2rem;
                        height: 2rem;
                        border-radius: 0.375rem;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        cursor: pointer;
                        transition: background 0.2s;
                    "
                    title="In neuem Tab öffnen"
                >
                    <ExternalLink style="width: 1rem; height: 1rem;" />
                </button>
            </div>
        </div>

        <!-- Iframe Container -->
        <div style="
            flex: 1 1 auto;
            position: relative;
            background: #ffffff;
            overflow: hidden;
            min-height: 0;
        ">
            <!-- Loading Spinner -->
            {#if isLoading}
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(15, 23, 42, 0.9);
                    z-index: 10;
                ">
                    <div style="
                        width: 3rem;
                        height: 3rem;
                        border: 3px solid rgba(34, 211, 211, 0.3);
                        border-top-color: #22d3d3;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <p style="
                        margin-top: 1rem;
                        color: #94a3b8;
                        font-size: 0.875rem;
                    ">Seite wird geladen...</p>
                </div>
            {/if}

            <!-- Iframe -->
            {#if iframeUrl}
                <iframe
                    bind:this={iframeRef}
                    src={iframeUrl}
                    title={iframeTitle}
                    onload={handleIframeLoad}
                    style="
                        width: 100%;
                        height: 100%;
                        border: none;
                        display: block;
                    "
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                ></iframe>
            {:else}
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #64748b;
                ">
                    <p>Keine URL angegeben</p>
                </div>
            {/if}
        </div>

        <!-- Hinweis bei iframe-Blockierung -->
        <div style="
            padding: 0.5rem 1rem;
            background: rgba(251, 191, 36, 0.1);
            border-top: 1px solid rgba(251, 191, 36, 0.3);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        ">
            <span style="font-size: 0.75rem; color: #fbbf24;">ℹ️</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">
                Einige Websites blockieren die Einbettung. 
                <button
                    onclick={handleOpenExternal}
                    style="
                        background: none;
                        border: none;
                        color: #22d3d3;
                        cursor: pointer;
                        text-decoration: underline;
                        font-size: inherit;
                        padding: 0;
                    "
                >In neuem Tab öffnen</button>
            </span>
        </div>
    </div>
</GlassDialog>

<style>
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
