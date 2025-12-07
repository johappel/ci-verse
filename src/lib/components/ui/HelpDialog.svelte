<script lang="ts">
    /**
     * HelpDialog - Zeigt Tastaturkürzel und Impressum
     */
    
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
    
    // Shortcut-Definitionen
    const shortcuts = [
        { key: 'H', description: 'Zum Marktplatz (Home)' },
        { key: 'B', description: 'Letztes Poster' },
        { key: 'W', description: 'Vorwärts bewegen' },
        { key: 'N', description: 'Nächstes Poster' },
        { key: 'X', description: 'Quality-Einstellungen' },
        { key: 'A', description: 'Nach links drehen' },
        { key: 'C', description: 'Zum Zentrum' },
        { key: 'D', description: 'Nach rechts drehen' },
        { key: 'F1', description: 'Diese Hilfe anzeigen' },
        { key: 'O', description: 'Letzte Plattform' },
        { key: 'S', description: 'Rückwärts bewegen' },
        { key: 'P', description: 'Nächste Plattform' },
    ];
    
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
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_interactive_supports_focus -->
    <div 
        style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
        "
        onclick={handleBackdropClick}
        role="presentation"
        aria-label="Hilfe"
    >
        <!-- Dialog Container -->
        <div 
            style="
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 1.5rem;
                padding: 2rem;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            "
        >
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: white; font-size: 1.5rem; font-weight: 600; margin: 0;">
                    🎮 Tastatursteuerung
                </h2>
                <button
                    onclick={closeDialog}
                    style="
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 0.5rem;
                        color: white;
                        width: 2.5rem;
                        height: 2.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.25rem;
                    "
                    title="Schließen (Escape)"
                >
                    ✕
                </button>
            </div>
            
            <!-- Shortcuts Grid -->
            <div style="
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 0.75rem;
                margin-bottom: 2rem;
            ">
                {#each shortcuts as { key, description }}
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 0.75rem;
                        padding: 0.75rem;
                        text-align: center;
                    ">
                        <div style="
                            background: linear-gradient(145deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%);
                            border: 1px solid rgba(139, 92, 246, 0.5);
                            border-radius: 0.5rem;
                            padding: 0.5rem 0.75rem;
                            font-family: monospace;
                            font-size: 1rem;
                            font-weight: 600;
                            color: white;
                            margin-bottom: 0.5rem;
                            display: inline-block;
                            min-width: 2rem;
                        ">
                            {key}
                        </div>
                        <div style="
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 0.7rem;
                            line-height: 1.3;
                        ">
                            {description}
                        </div>
                    </div>
                {/each}
            </div>
            
            <!-- Trennlinie -->
            <div style="
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                margin: 1.5rem 0;
            "></div>
            
            <!-- Impressum -->
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.875rem;">
                <h3 style="color: white; font-size: 1rem; font-weight: 600; margin: 0 0 1rem 0;">
                    Impressum
                </h3>
                <p style="margin: 0 0 0.5rem 0;">
                    <strong style="color: white;">Comenius-Institut</strong><br />
                    Evangelische Arbeitsstätte für Erziehungswissenschaft e.V.
                </p>
                <p style="margin: 0 0 0.5rem 0;">
                    Schreiberstraße 12<br />
                    48149 Münster
                </p>
                <p style="margin: 0 0 0.5rem 0;">
                    Tel: +49 (0)251 98101-0<br />
                    E-Mail: <a href="mailto:info@comenius.de" style="color: #60a5fa; text-decoration: none;">info@comenius.de</a>
                </p>
                <p style="margin: 1rem 0 0 0; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4);">
                    CI-Verse v2.1 – Eine interaktive 3D-Bildungslandschaft<br />
                    © 2025 Comenius-Institut
                </p>
            </div>
        </div>
    </div>
{/if}
