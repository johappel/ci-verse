<script lang="ts">
    /**
     * GlassDialog - Glasartiger, draggbarer Dialog
     * 
     * Einheitliches UI-Design für alle Dialoge:
     * - Glasmorphismus mit Blur-Effekt
     * - Draggable (ziehbar)
     * - Zentriert geöffnet
     * - 3D-Welt bleibt sichtbar
     */
    import { fade, scale } from 'svelte/transition';
    import { X, GripHorizontal } from 'lucide-svelte';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        title?: string;
        subtitle?: string;
        icon?: typeof X;
        width?: string;
        height?: string;
        children?: import('svelte').Snippet;
        headerSlot?: import('svelte').Snippet;
    }

    let {
        isOpen,
        onClose,
        title = '',
        subtitle = '',
        icon: Icon = undefined,
        width = '450px',
        height = 'auto',
        children,
        headerSlot
    }: Props = $props();
    
    // Debug
    $effect(() => {
        console.log('GlassDialog: isOpen =', isOpen, 'hasChildren =', !!children);
    });

    // Drag State
    let dialogX = $state(0);
    let dialogY = $state(0);
    let isDragging = $state(false);
    let dragStartX = $state(0);
    let dragStartY = $state(0);
    let dialogRef: HTMLDivElement | null = $state(null);

    // Reset position when opening
    $effect(() => {
        if (isOpen) {
            dialogX = 0;
            dialogY = 0;
        }
    });

    function startDrag(e: MouseEvent | TouchEvent) {
        isDragging = true;
        
        if (e instanceof MouseEvent) {
            dragStartX = e.clientX - dialogX;
            dragStartY = e.clientY - dialogY;
        } else {
            dragStartX = e.touches[0].clientX - dialogX;
            dragStartY = e.touches[0].clientY - dialogY;
        }
        
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchmove', onDrag);
        window.addEventListener('touchend', stopDrag);
    }

    function onDrag(e: MouseEvent | TouchEvent) {
        if (!isDragging) return;
        e.preventDefault();
        
        let clientX: number, clientY: number;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        dialogX = clientX - dragStartX;
        dialogY = clientY - dragStartY;
        
        // Begrenze auf Bildschirm
        const maxX = window.innerWidth / 2 - 50;
        const maxY = window.innerHeight / 2 - 50;
        dialogX = Math.max(-maxX, Math.min(maxX, dialogX));
        dialogY = Math.max(-maxY, Math.min(maxY, dialogY));
    }

    function stopDrag() {
        isDragging = false;
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', onDrag);
        window.removeEventListener('touchend', stopDrag);
    }

    // Track wenn Dialog stabil offen ist (nach kurzer Verzögerung)
    let isStable = $state(false);
    
    $effect(() => {
        if (isOpen) {
            // Kurze Verzögerung bevor wir auf Events reagieren
            isStable = false;
            const timer = setTimeout(() => {
                isStable = true;
            }, 100);
            return () => clearTimeout(timer);
        } else {
            isStable = false;
        }
    });

    function handleBackdropClick(e: MouseEvent) {
        if (!isStable) return;
        console.log('handleBackdropClick', e.target, e.currentTarget, e.target === e.currentTarget);
        if (e.target === e.currentTarget) {
            console.log('Backdrop click - closing dialog');
            onClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!isStable) return;
        if (e.key === 'Escape') {
            console.log('Escape pressed - closing dialog');
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop Container - mit isolation für neuen Stacking Context -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            isolation: isolate;
        "
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabindex="-1"
        transition:fade={{ duration: 150 }}
    >
        <!-- Semi-transparenter Overlay -->
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
        "></div>
        
        <!-- Dialog Box -->
        <div
            bind:this={dialogRef}
            style="
                position: relative;
                width: {width};
                min-height: 200px;
                max-width: calc(100vw - 2rem);
                max-height: calc(100vh - 2rem);
                transform: translate({dialogX}px, {dialogY}px);
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 
                    0 25px 50px rgba(0, 0, 0, 0.5), 
                    0 0 30px rgba(34, 211, 211, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            "
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <!-- Header -->
            <div 
                style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    background: linear-gradient(90deg, rgba(34, 211, 211, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    cursor: move;
                    user-select: none;
                "
                onmousedown={startDrag}
                ontouchstart={startDrag}
                role="button"
                tabindex="0"
            >
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    {#if Icon}
                        <div style="
                            width: 2.5rem;
                            height: 2.5rem;
                            border-radius: 0.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: rgba(34, 211, 211, 0.3);
                        ">
                            <Icon style="width: 1.25rem; height: 1.25rem; color: #67e8f9;" />
                        </div>
                    {/if}
                    <div>
                        {#if title}
                            <h3 id="dialog-title" style="margin: 0; font-weight: 600; color: white; font-size: 1.125rem;">{title}</h3>
                        {/if}
                        {#if subtitle}
                            <p style="margin: 0; font-size: 0.75rem; color: rgba(165, 243, 252, 0.7);">{subtitle}</p>
                        {/if}
                    </div>
                </div>
                
                <!-- Close Button -->
                <button
                    onclick={onClose}
                    style="
                        width: 2rem;
                        height: 2rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 0.5rem;
                        border: none;
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        cursor: pointer;
                    "
                    aria-label="Schließen"
                >
                    <X style="width: 1rem; height: 1rem;" />
                </button>
            </div>
            
            <!-- Content -->
            <div style="flex: 1; overflow: auto; min-height: 0;">
                {#if children}
                    {@render children()}
                {:else}
                    <div style="padding: 2rem; color: white; text-align: center;">
                        <p>Dialog Inhalt wird geladen...</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Keine scoped styles nötig - alles inline für Portal-Kompatibilität -->
