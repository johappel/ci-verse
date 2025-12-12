<script lang="ts">
    /**
     * MarketplaceStand - Interaktiver Stand auf dem Marktplatz (S-Plattform)
     * 
     * 3 Varianten je nach Typ:
     * - institution: Großer Hauptstand mit Banner + KI-Chat-Kiosk
     * - publications: Dynamische News-Tafel (wechselt alle 8-15s)
     * - events: Dynamische Event-Tafel (wechselt alle 8-15s)
     * 
     * Die Terminal-Tafeln zeigen immer nur EINEN Eintrag an,
     * der regelmäßig wechselt - wie eine Anzeigetafel am Bahnhof.
     * 
     * WICHTIG für AI Agents:
     * HTML-Overlays in Threlte ignorieren Z-Tiefe und "bluten" durch andere
     * 3D-Objekte. Daher werden alle <HTML>-Elemente nur gerendert wenn
     * isOnMarketplace === true (currentPlatform === 'S').
     * Die 3D-Strukturen (Rahmen, Pfosten etc.) bleiben immer sichtbar.
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { MarketplaceStand } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';
    import { onMount } from 'svelte';

    // ========== NOSTR HELPERS ==========
    
    interface NostrEvent {
        id: string;
        kind: number;
        tags: string[][];
    }

    // Bech32 npub zu hex pubkey
    function npubToHex(npub: string): string | null {
        if (!npub.startsWith('npub1')) return null;
        try {
            const ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
            const data = npub.slice(5);
            const values: number[] = [];
            for (const char of data) {
                const idx = ALPHABET.indexOf(char);
                if (idx === -1) return null;
                values.push(idx);
            }
            const bits: number[] = [];
            for (const v of values.slice(0, -6)) {
                for (let i = 4; i >= 0; i--) bits.push((v >> i) & 1);
            }
            const bytes: number[] = [];
            for (let i = 0; i + 8 <= bits.length; i += 8) {
                let byte = 0;
                for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
                bytes.push(byte);
            }
            return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch { return null; }
    }

    // Nostr Events via WebSocket (simplified for preview)
    function fetchNostrEvents(relay: string, filter: string): Promise<NostrEvent[]> {
        return new Promise((resolve) => {
            const events: NostrEvent[] = [];
            try {
                const ws = new WebSocket(relay);
                const subId = 'preview-' + Math.random().toString(36).slice(2, 8);
                const timeout = setTimeout(() => { ws.close(); resolve(events); }, 5000);
                
                ws.onopen = () => {
                    const pubkey = npubToHex(filter);
                    const req: Record<string, unknown> = { kinds: [31923], limit: 10 };
                    if (pubkey) req.authors = [pubkey];
                    ws.send(JSON.stringify(['REQ', subId, req]));
                };
                ws.onmessage = (msg) => {
                    try {
                        const data = JSON.parse(msg.data);
                        if (data[0] === 'EVENT' && data[1] === subId) events.push(data[2]);
                        else if (data[0] === 'EOSE') { clearTimeout(timeout); ws.close(); resolve(events); }
                    } catch {}
                };
                ws.onerror = () => { clearTimeout(timeout); resolve(events); };
            } catch { resolve(events); }
        });
    }

    // ========== COMPONENT ==========

    interface Props {
        stand: MarketplaceStand;
        position?: [number, number, number];
        rotation?: number;
        platformPosition?: [number, number, number];
    }

    let { 
        stand, 
        position = [0, 0, 0], 
        rotation = 0,
        platformPosition = [0, 0, 0]
    }: Props = $props();

    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);
    let isButtonHovered = $state(false);

    // ========== DYNAMISCHE INHALTE ==========
    
    // News-Daten (initial Mock, können durch RSS ersetzt werden)
    let newsItems = $state([
        { id: '1', title: 'Neue Studie zur religiösen Bildung', category: 'Forschung', date: '25. Nov' },
        { id: '2', title: 'Konfi-App 3.0 mit KI-Funktionen', category: 'Digital', date: '20. Nov' },
        { id: '3', title: 'Erasmus+ Projekt abgeschlossen', category: 'Europa', date: '15. Nov' },
        { id: '4', title: 'Fortbildung "Digitale Gemeinde"', category: 'Weiterbildung', date: '10. Nov' },
        { id: '5', title: 'Neuer Bildungsatlas online', category: 'Forschung', date: '05. Nov' },
    ]);

    // Event-Daten (initial Mock, können durch Nostr ersetzt werden)
    let eventItems = $state([
        { id: '1', title: 'KI in der religiösen Bildung', date: '05. Dez', time: '09:00', location: 'Münster' },
        { id: '2', title: 'Godly Play Einführung', date: '10. Dez', time: '14:00', location: 'Online' },
        { id: '3', title: 'Datenschutz Webinar', date: '15. Dez', time: '10:00', location: 'Online' },
        { id: '4', title: 'Neujahrsempfang 2026', date: '15. Jan', time: '18:00', location: 'Münster' },
        { id: '5', title: 'Digitale Gemeinde Modul 1', date: '22. Jan', time: '09:00', location: 'Frankfurt' },
    ]);

    // Aktueller Index für Animation
    let currentNewsIndex = $state(0);
    let currentEventIndex = $state(0);
    let isTransitioning = $state(false);

    // Wechsel-Animation alle 8-15 Sekunden (zufällig)
    function getRandomInterval() {
        return 8000 + Math.random() * 7000; // 8-15 Sekunden
    }

    onMount(() => {
        let intervalId: ReturnType<typeof setInterval>;
        // Wenn Publications-Stand RSS-Feeds hat, lade erste Feed-Einträge als Preview
        if (stand.type === 'publications' && stand.rssFeedUrls && stand.rssFeedUrls.length > 0) {
            const feedUrls = stand.rssFeedUrls;
            (async () => {
                try {
                    // Use WP feed-proxy to avoid CORS
                    const proxy = `${import.meta.env.VITE_WP_URL || window.location.origin}/wp-json/civerse/v1/feed-proxy?url=${encodeURIComponent(feedUrls[0])}`;
                    const resp = await fetch(proxy);
                    if (!resp.ok) throw new Error('Feed fetch failed');
                    const text = await resp.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'application/xml');
                    const items = Array.from(doc.querySelectorAll('item')).slice(0, 5).map((it, idx) => ({
                        id: String(idx),
                        title: it.querySelector('title')?.textContent || 'Kein Titel',
                        category: it.querySelector('category')?.textContent || '',
                        date: it.querySelector('pubDate')?.textContent || '',
                    }));
                    if (items.length > 0) {
                        newsItems = items;
                    }
                } catch (e) {
                    // Fallback: Leave mock items
                    console.warn('Could not load RSS preview for stand', stand.id, e);
                }
            })();
        }

        // Wenn Events-Stand Nostr-Relay hat, lade Events als Preview
        if (stand.type === 'events' && stand.nostrRelay && stand.nostrFilter) {
            const relay = stand.nostrRelay;
            const filter = stand.nostrFilter;
            (async () => {
                try {
                    const events = await fetchNostrEvents(relay, filter);
                    if (events.length > 0) {
                        eventItems = events.slice(0, 5).map(ev => {
                            const startTs = ev.tags.find(t => t[0] === 'start')?.[1];
                            const start = startTs ? new Date(parseInt(startTs) * 1000) : new Date();
                            return {
                                id: ev.id,
                                title: ev.tags.find(t => t[0] === 'title')?.[1] || 'Event',
                                date: start.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }).replace(' ', '. '),
                                time: start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                                location: ev.tags.find(t => t[0] === 'location')?.[1] || ''
                            };
                        });
                    }
                } catch (e) {
                    console.warn('Could not load Nostr events for stand', stand.id, e);
                }
            })();
        }

        if (stand.type === 'publications') {
            const runInterval = () => {
                isTransitioning = true;
                setTimeout(() => {
                    currentNewsIndex = (currentNewsIndex + 1) % newsItems.length;
                    isTransitioning = false;
                }, 300);
                intervalId = setTimeout(runInterval, getRandomInterval());
            };
            intervalId = setTimeout(runInterval, getRandomInterval());
            return () => clearTimeout(intervalId);
        }
        
        if (stand.type === 'events') {
            const runInterval = () => {
                isTransitioning = true;
                setTimeout(() => {
                    currentEventIndex = (currentEventIndex + 1) % eventItems.length;
                    isTransitioning = false;
                }, 300);
                intervalId = setTimeout(runInterval, getRandomInterval());
            };
            intervalId = setTimeout(runInterval, getRandomInterval());
            return () => clearTimeout(intervalId);
        }
    });

    // Aktuelle Anzeigedaten
    let currentNews = $derived(newsItems[currentNewsIndex]);
    let currentEvent = $derived(eventItems[currentEventIndex]);

    // ========== DIMENSIONEN ==========

    const dimensions = $derived.by(() => {
        switch (stand.type) {
            case 'institution':
                return { width: 10, height: 7, depth: 3, baseHeight: 0.8 };
            case 'publications':
            case 'events':
                return { width: 5, height: 6, depth: 1.5, baseHeight: 0.4 };
            default:
                return { width: 5, height: 4, depth: 1.5, baseHeight: 0.5 };
        }
    });

    const displayColor = stand.display.color || '#3b82f6';
    
    // ========== INTERAKTIONEN ==========

    function handleStandClick() {
        const worldX = platformPosition[0] + position[0];
        const worldY = platformPosition[1] + position[1];
        const worldZ = platformPosition[2] + position[2];
        
        const viewDistance = stand.type === 'institution' ? 14 : 15;
        const cameraY = getCameraY(platformPosition[1]);
        
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const worldOffsetX = viewDistance * sin;
        const worldOffsetZ = viewDistance * cos;
        
        const cameraPos = {
            x: worldX + worldOffsetX,
            y: cameraY,
            z: worldZ + worldOffsetZ
        };
        
        const bannerCenterY = worldY + dimensions.height / 2 + dimensions.baseHeight;
        const lookAtPos = {
            x: worldX,
            y: Math.min(bannerCenterY, cameraY + 1),
            z: worldZ
        };
        
        worldStore.setViewTarget(cameraPos, lookAtPos);
    }

    function handleButtonClick(e: Event) {
        e.stopPropagation();
        
        switch (stand.type) {
            case 'institution':
                worldStore.openChat(stand.chatWebhook);
                break;
            case 'publications':
                // Öffne RSS-Panel und übergebe die Feed-URLs (falls vorhanden)
                worldStore.openRssPanel(stand.rssFeedUrls ?? null, stand.title ?? 'Publikationen');
                break;
            case 'events':
                // Übergebe Nostr-Relay und Filter an das Events-Panel
                worldStore.openEventsPanel(stand.nostrRelay, stand.nostrFilter);
                break;
            default:
                if (stand.externalUrl) {
                    window.open(stand.externalUrl, '_blank');
                }
                break;
        }
    }

    function handlePointerEnter() {
        isHovered = true;
        onPointerEnter();
    }

    function handlePointerLeave() {
        isHovered = false;
        onPointerLeave();
    }

    const buttonText = $derived.by(() => {
        switch (stand.type) {
            case 'institution': return '💬 Chat starten';
            case 'publications': return '📰 Alle News';
            case 'events': return '📅 Alle Termine';
            default: return '🔗 Mehr erfahren';
        }
    });
    
    // Ist der User auf dem Marktplatz? HTML nur dort rendern!
    let isOnMarketplace = $derived(worldStore.currentPlatform === 'S');
</script>

<T.Group position={position} rotation.y={rotation}>
    
    {#if stand.type === 'institution'}
        <!-- ========== INSTITUTION STAND (Original-Design) ========== -->
        
        <!-- Basis -->
        <T.Mesh position.y={dimensions.baseHeight / 2} castShadow receiveShadow>
            <T.BoxGeometry args={[dimensions.width, dimensions.baseHeight, dimensions.depth]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.3} roughness={0.7} />
        </T.Mesh>

        <!-- Hauptdisplay -->
        <T.Group position.y={dimensions.baseHeight}>
            <T.Mesh 
                position.y={dimensions.height / 2}
                position.z={-dimensions.depth / 2 + 0.05}
                onclick={handleStandClick}
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
                castShadow
            >
                <T.BoxGeometry args={[dimensions.width - 0.2, dimensions.height, 0.1]} />
                <T.MeshStandardMaterial color={isHovered ? '#ffffff' : '#f8fafc'} metalness={0.1} roughness={0.9} />
            </T.Mesh>

            <!-- Header -->
            <T.Mesh position.y={dimensions.height - 0.4} position.z={-dimensions.depth / 2 + 0.11}>
                <T.BoxGeometry args={[dimensions.width - 0.3, 0.8, 0.02]} />
                <T.MeshStandardMaterial color={displayColor} />
            </T.Mesh>

            <Text text={stand.icon} fontSize={0.5} position={[-dimensions.width / 2 + 0.8, dimensions.height - 0.4, -dimensions.depth / 2 + 0.15]} anchorX="center" anchorY="middle" />
            <Text text={stand.title} fontSize={0.35} color="#1f2937" position={[0, dimensions.height - 1.2, -dimensions.depth / 2 + 0.12]} anchorX="center" anchorY="top" maxWidth={dimensions.width - 1} />

            <!-- Button - NUR auf Marktplatz rendern -->
            {#if isOnMarketplace}
            <HTML position={[0, -0.27, dimensions.depth / 3 + 0.3]} transform scale={0.4} pointerEvents="auto">
                <button class="marketplace-button institution" class:hovered={isButtonHovered} onclick={handleButtonClick} onmouseenter={() => isButtonHovered = true} onmouseleave={() => isButtonHovered = false}>
                    {buttonText}
                </button>
            </HTML>
            {/if}
        </T.Group>

        <!-- Seitenwände -->
        <T.Mesh position={[-dimensions.width / 2 + 0.05, dimensions.baseHeight + dimensions.height / 2, 0]} castShadow>
            <T.BoxGeometry args={[0.1, dimensions.height, dimensions.depth]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.2} roughness={0.8} />
        </T.Mesh>
        <T.Mesh position={[dimensions.width / 2 - 0.05, dimensions.baseHeight + dimensions.height / 2, 0]} castShadow>
            <T.BoxGeometry args={[0.1, dimensions.height, dimensions.depth]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.2} roughness={0.8} />
        </T.Mesh>
        <T.Mesh position.y={dimensions.baseHeight + dimensions.height + 0.15} castShadow>
            <T.BoxGeometry args={[dimensions.width + 0.4, 0.3, dimensions.depth + 0.4]} />
            <T.MeshStandardMaterial color={displayColor} metalness={0.3} roughness={0.6} />
        </T.Mesh>

    {:else if stand.type === 'publications' || stand.type === 'events'}
        <!-- ========== DYNAMISCHE ANZEIGETAFEL ========== -->
        
        <!-- Standfuß (Pfosten) -->
        <T.Mesh position={[0, 1.5, 0]} castShadow>
            <T.CylinderGeometry args={[0.15, 0.2, 3, 8]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </T.Mesh>
        
        <!-- Basis-Platte -->
        <T.Mesh position.y={0.05} castShadow receiveShadow>
            <T.CylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
            <T.MeshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
        </T.Mesh>

        <!-- Tafel-Gehäuse -->
        <T.Group position.y={3}>
            <!-- Rahmen -->
            <T.Mesh castShadow>
                <T.BoxGeometry args={[dimensions.width, 3.5, 0.25]} />
                <T.MeshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </T.Mesh>
            
            <!-- Leuchtender Rand -->
            <T.Mesh position.z={0.01}>
                <T.BoxGeometry args={[dimensions.width + 0.1, 3.6, 0.2]} />
                <T.MeshStandardMaterial 
                    color={displayColor} 
                    emissive={displayColor} 
                    emissiveIntensity={0.3}
                    metalness={0.7}
                    roughness={0.2}
                />
            </T.Mesh>

            <!-- HTML Content - NUR auf Marktplatz rendern -->
            {#if isOnMarketplace}
            <HTML 
                position={[0, 0, 0.2]} 
                transform 
                center
            >
                <div 
                    class="display-board"
                    class:news={stand.type === 'publications'}
                    class:events={stand.type === 'events'}
                    class:transitioning={isTransitioning}
                    style="--accent-color: {displayColor};"
                    role="button"
                    tabindex="0"
                    onclick={handleStandClick}
                    onkeydown={(e) => e.key === 'Enter' && handleStandClick()}
                    onmouseenter={handlePointerEnter}
                    onmouseleave={handlePointerLeave}
                >
                    <!-- Header -->
                    <div class="board-header">
                        <span class="header-icon">{stand.icon || (stand.type === 'publications' ? '📰' : '📅')}</span>
                        <span class="header-title">{stand.title || (stand.type === 'publications' ? 'AKTUELL' : 'TERMINE')}</span>
                        <span class="header-dot"></span>
                    </div>

                    {#if stand.type === 'publications'}
                        <!-- News Content -->
                        <div class="content-area">
                            {#if currentNews.category && currentNews.category.toLowerCase() !== 'uncategorized'}
                            <div class="category-badge">{currentNews.category}</div>
                            {/if}
                            <div class="main-title">{currentNews.title}</div>
                            <div class="meta-line">
                                <span class="date">{currentNews.date}</span>
                            </div>
                        </div>
                    {:else}
                        <!-- Event Content -->
                        <div class="content-area event-content">
                            <div class="event-date">
                                <span class="day">{currentEvent.date.split('.')[0]}</span>
                                <span class="month">{currentEvent.date.split('.')[1]?.trim()}</span>
                            </div>
                            <div class="event-details">
                                <div class="main-title">{currentEvent.title}</div>
                                <div class="meta-line">
                                    <span class="time">🕐 {currentEvent.time}</span>
                                    <span class="location">📍 {currentEvent.location}</span>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Footer mit Pagination -->
                    <div class="board-footer">
                        <div class="pagination">
                            {#each Array(stand.type === 'publications' ? newsItems.length : eventItems.length) as _, i}
                                <span 
                                    class="dot" 
                                    class:active={i === (stand.type === 'publications' ? currentNewsIndex : currentEventIndex)}
                                ></span>
                            {/each}
                        </div>
                        <button 
                            class="more-button"
                            onclick={handleButtonClick}
                            onmouseenter={() => isButtonHovered = true}
                            onmouseleave={() => isButtonHovered = false}
                        >
                            Alle anzeigen →
                        </button>
                    </div>
                </div>
            </HTML>
            {/if}
        </T.Group>

        <!-- Dezente Beleuchtung -->
        <T.SpotLight
            position={[0, 5, 2]}
            target.position={[0, 3, 0]}
            color={displayColor}
            intensity={15}
            distance={8}
            angle={0.4}
            penumbra={0.5}
        />

    {/if}

    <!-- Beleuchtung für Institution -->
    {#if stand.type === 'institution'}
        <T.PointLight
            position={[0, dimensions.height + 2, dimensions.depth]}
            intensity={0.5}
            distance={10}
            color={displayColor}
        />
    {/if}

</T.Group>

<style>
    /* ========== INSTITUTION BUTTON ========== */
    .marketplace-button {
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .marketplace-button.institution {
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        color: white;
    }

    .marketplace-button.hovered {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    /* ========== DISPLAY BOARD ========== */
    .display-board {
        width: 220px;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
        user-select: none;
        transition: opacity 0.3s, transform 0.3s;
        cursor: pointer;
    }

    .display-board.transitioning {
        opacity: 0.7;
        transform: scale(0.98);
    }

    .display-board:hover {
        border-color: var(--accent-color);
        box-shadow: 0 0 20px color-mix(in srgb, var(--accent-color) 30%, transparent);
    }

    /* Header */
    .board-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--accent-color);
        color: white;
    }

    .header-icon {
        font-size: 16px;
    }

    .header-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        flex: 1;
    }

    .header-dot {
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }

    /* Content Area */
    .content-area {
        padding: 14px 12px;
        min-height: 100px;
    }

    .category-badge {
        display: inline-block;
        padding: 2px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .main-title {
        font-size: 14px;
        font-weight: 600;
        color: white;
        line-height: 1.3;
        margin-bottom: 8px;
    }

    .meta-line {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Event specific */
    .event-content {
        display: flex;
        gap: 10px;
    }

    .event-date {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--accent-color);
        border-radius: 4px;
        padding: 4px 8px;
        min-width: 36px;
    }

    .event-date .day {
        font-size: 16px;
        font-weight: 700;
        color: white;
        line-height: 1;
    }

    .event-date .month {
        font-size: 9px;
        color: rgba(255, 255, 255, 0.8);
        text-transform: uppercase;
    }

    .event-details {
        flex: 1;
    }

    .event-details .meta-line {
        flex-direction: column;
        gap: 4px;
    }

    /* Footer */
    .board-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .pagination {
        display: flex;
        gap: 4px;
    }

    .pagination .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s;
    }

    .pagination .dot.active {
        background: var(--accent-color);
        width: 16px;
        border-radius: 3px;
    }

    .more-button {
        background: none;
        border: none;
        color: var(--accent-color);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .more-button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
