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

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop mit leichtem Blur -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabindex="-1"
        transition:fade={{ duration: 150 }}
    >
        <!-- Semi-transparenter Overlay -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        
        <!-- Dialog Container -->
        <div
            bind:this={dialogRef}
            class="relative glass-dialog"
            style="
                width: {width};
                height: {height};
                max-width: calc(100vw - 2rem);
                max-height: calc(100vh - 2rem);
                transform: translate({dialogX}px, {dialogY}px);
            "
            transition:scale={{ duration: 200, start: 0.95 }}
        >
            <!-- Glasrahmen -->
            <div class="absolute inset-0 rounded-2xl glass-frame"></div>
            
            <!-- Innerer Content-Bereich -->
            <div class="relative rounded-2xl overflow-hidden flex flex-col h-full glass-inner">
                
                <!-- Header mit Drag-Handle -->
                <div 
                    class="glass-header flex items-center justify-between px-4 py-3 cursor-move select-none"
                    onmousedown={startDrag}
                    ontouchstart={startDrag}
                    role="button"
                    tabindex="0"
                >
                    <div class="flex items-center gap-3">
                        {#if Icon}
                            <div class="w-10 h-10 rounded-xl glass-icon flex items-center justify-center">
                                <Icon class="w-5 h-5 text-cyan-300" />
                            </div>
                        {/if}
                        <div>
                            {#if title}
                                <h3 id="dialog-title" class="font-semibold text-white text-lg">{title}</h3>
                            {/if}
                            {#if subtitle}
                                <p class="text-xs text-cyan-200/70">{subtitle}</p>
                            {/if}
                        </div>
                        {#if headerSlot}
                            {@render headerSlot()}
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <!-- Drag Indicator -->
                        <div class="text-white/30 hidden sm:block">
                            <GripHorizontal class="w-5 h-5" />
                        </div>
                        
                        <!-- Close Button -->
                        <button
                            onclick={onClose}
                            class="p-2 rounded-lg hover:bg-white/10 transition-colors glass-button"
                            aria-label="Schließen"
                        >
                            <X class="w-5 h-5 text-white/80" />
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="flex-1 overflow-hidden">
                    {#if children}
                        {@render children()}
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .glass-dialog {
        /* Outer glow */
        filter: drop-shadow(0 0 30px rgba(34, 211, 211, 0.15))
                drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5));
    }
    
    .glass-frame {
        /* Glasrahmen wie NavigationControls */
        background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.02) 100%
        );
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            inset 0 -1px 1px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.3);
    }
    
    .glass-inner {
        background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.85) 0%,
            rgba(15, 23, 42, 0.92) 100%
        );
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    }
    
    .glass-header {
        background: linear-gradient(
            90deg,
            rgba(34, 211, 211, 0.08) 0%,
            rgba(59, 130, 246, 0.08) 100%
        );
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .glass-icon {
        background: rgba(34, 211, 211, 0.15);
        border: 1px solid rgba(34, 211, 211, 0.3);
    }
    
    .glass-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
