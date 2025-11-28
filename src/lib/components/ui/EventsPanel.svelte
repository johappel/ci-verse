<script lang="ts">
    /**
     * EventsPanel - Veranstaltungen/Termine Anzeige
     * 
     * Aktuell: Mock-Daten im NIP52 Format
     * Später: NIP52 Nostr-Stream [kind 31923 - Time-Based Calendar Event]
     * 
     * @see https://github.com/nostr-protocol/nips/blob/master/52.md
     */
    import { fade, fly } from "svelte/transition";
    import { Calendar, ExternalLink, X, Clock, MapPin, Users, RefreshCw, User } from "lucide-svelte";

    /**
     * NIP52 Nostr Calendar Event (kind 31923)
     * Time-Based Calendar Event nach NIP-52 Spezifikation
     */
    interface NostrCalendarEvent {
        id: string;                    // 32-bytes hex SHA-256
        pubkey: string;                // 32-bytes hex public key
        created_at: number;            // Unix timestamp
        kind: 31923;                   // Time-Based Calendar Event
        content: string;               // Event description
        tags: string[][];              // NIP-52 Tags
    }

    /** Geparste Event-Daten für einfachere Verwendung */
    interface ParsedCalendarEvent {
        raw: NostrCalendarEvent;
        // Extrahierte Tag-Werte
        d: string;                     // Random identifier
        title: string;
        summary?: string;
        image?: string;
        start: Date;
        end?: Date;
        startTzid?: string;
        endTzid?: string;
        location?: string;
        geohash?: string;
        participants: Array<{
            pubkey: string;
            relay?: string;
            role?: string;
        }>;
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        calendarUrl?: string;
        title?: string;
    }

    let { 
        isOpen = false, 
        onClose, 
        calendarUrl,
        title = "Veranstaltungen"
    }: Props = $props();

    let isLoading = $state(false);

    // Helper: Tag-Wert aus Nostr Event extrahieren
    function getTagValue(tags: string[][], name: string): string | undefined {
        const tag = tags.find(t => t[0] === name);
        return tag?.[1];
    }

    // Helper: Alle Tags eines Typs extrahieren
    function getAllTags(tags: string[][], name: string): string[][] {
        return tags.filter(t => t[0] === name);
    }

    // Helper: Nostr Event zu ParsedCalendarEvent konvertieren
    function parseNostrEvent(event: NostrCalendarEvent): ParsedCalendarEvent {
        const startTs = getTagValue(event.tags, 'start');
        const endTs = getTagValue(event.tags, 'end');
        
        const participants = getAllTags(event.tags, 'p').map(tag => ({
            pubkey: tag[1],
            relay: tag[2],
            role: tag[3]
        }));

        return {
            raw: event,
            d: getTagValue(event.tags, 'd') || event.id,
            title: getTagValue(event.tags, 'title') || 'Unbenanntes Event',
            summary: getTagValue(event.tags, 'summary'),
            image: getTagValue(event.tags, 'image'),
            start: new Date((startTs ? parseInt(startTs) : event.created_at) * 1000),
            end: endTs ? new Date(parseInt(endTs) * 1000) : undefined,
            startTzid: getTagValue(event.tags, 'start_tzid'),
            endTzid: getTagValue(event.tags, 'end_tzid'),
            location: getTagValue(event.tags, 'location'),
            geohash: getTagValue(event.tags, 'g'),
            participants
        };
    }

    // Mock-Daten im NIP52 Format (kind 31923)
    const mockNostrEvents: NostrCalendarEvent[] = [
        {
            id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
            pubkey: 'comenius0000000000000000000000000000000000000000000000000001',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 7,
            kind: 31923,
            content: 'Zweitägige Konferenz zu den Chancen und Herausforderungen von KI-Tools in Kirche und Bildung. Mit Workshops, Vorträgen und Praxisbeispielen.',
            tags: [
                ['d', 'ki-tagung-2025'],
                ['title', 'Fachtagung: KI in der religiösen Bildung'],
                ['summary', 'KI-Tools für Kirche und Bildung - Chancen und Herausforderungen'],
                ['image', 'https://picsum.photos/seed/ki-tagung/800/400'],
                ['start', String(Math.floor(new Date('2025-12-05T09:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-06T17:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['end_tzid', 'Europe/Berlin'],
                ['location', 'Comenius-Institut, Münster'],
                ['g', 'u1h6qy'],
                ['p', 'speaker00000000000000000000000000000000000000000000000001', '', 'speaker'],
                ['p', 'speaker00000000000000000000000000000000000000000000000002', '', 'moderator']
            ]
        },
        {
            id: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b3',
            pubkey: 'comenius0000000000000000000000000000000000000000000000000001',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
            kind: 31923,
            content: 'Grundlagen des Godly Play Konzepts für Erzieher*innen und Religionspädagog*innen. Online-Format mit interaktiven Elementen.',
            tags: [
                ['d', 'godly-play-intro-2025'],
                ['title', 'Online-Workshop: Godly Play Einführung'],
                ['summary', 'Grundlagen des Godly Play Konzepts'],
                ['start', String(Math.floor(new Date('2025-12-10T14:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-10T17:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Online (Zoom)'],
                ['p', 'trainer0000000000000000000000000000000000000000000000000001', '', 'host']
            ]
        },
        {
            id: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b4c4',
            pubkey: 'comenius0000000000000000000000000000000000000000000000000001',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 3,
            kind: 31923,
            content: 'Praktische Tipps zur DSGVO-konformen Datenverarbeitung in Kirchengemeinden. Inkl. Checklisten und Vorlagen.',
            tags: [
                ['d', 'dsgvo-webinar-2025'],
                ['title', 'Webinar: Datenschutz in der Gemeinde'],
                ['summary', 'DSGVO-konforme Datenverarbeitung'],
                ['start', String(Math.floor(new Date('2025-12-15T10:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-15T11:30:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Online (Microsoft Teams)']
            ]
        },
        {
            id: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b5d5e5',
            pubkey: 'comenius0000000000000000000000000000000000000000000000000001',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 2,
            kind: 31923,
            content: 'Rückblick auf 2025 und Ausblick auf die Projekte 2026 mit dem Team des Comenius-Instituts. Mit Empfang und Networking.',
            tags: [
                ['d', 'neujahr-2026'],
                ['title', 'Neujahrsempfang 2026'],
                ['summary', 'Rückblick und Ausblick mit dem Team'],
                ['image', 'https://picsum.photos/seed/neujahr/800/400'],
                ['start', String(Math.floor(new Date('2026-01-15T18:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2026-01-15T21:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Comenius-Institut, Münster'],
                ['g', 'u1h6qy']
            ]
        },
        {
            id: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b6e6f6a1',
            pubkey: 'comenius0000000000000000000000000000000000000000000000000001',
            created_at: Math.floor(Date.now() / 1000) - 86400,
            kind: 31923,
            content: 'Erster Teil der sechsteiligen Fortbildung zu digitalen Kompetenzen in der Gemeindearbeit. Modul 1: Grundlagen der digitalen Kommunikation.',
            tags: [
                ['d', 'digital-gemeinde-1-2026'],
                ['title', 'Fortbildungsreihe: Digitale Gemeinde (Modul 1)'],
                ['summary', 'Grundlagen der digitalen Kommunikation'],
                ['start', String(Math.floor(new Date('2026-01-22T09:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2026-01-23T16:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Evangelische Akademie, Frankfurt'],
                ['g', 'u0yj9v'],
                ['p', 'trainer0000000000000000000000000000000000000000000000000002', '', 'trainer'],
                ['p', 'trainer0000000000000000000000000000000000000000000000000003', '', 'trainer']
            ]
        }
    ];
    let nostrEvents = $state<NostrCalendarEvent[]>(mockNostrEvents);
    
    // Geparste Events für die Anzeige
    let events = $derived(nostrEvents.map(parseNostrEvent));

    // Simuliertes Laden (später: NIP52 Nostr-Stream)
    async function refreshEvents() {
        isLoading = true;
        
        // TODO: Später durch echten Nostr-Client ersetzen
        // const pool = new SimplePool();
        // const events = await pool.querySync(relays, {
        //     kinds: [31923],  // Time-Based Calendar Event
        //     authors: ['comenius-pubkey...'],
        //     '#d': ['*']
        // });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        isLoading = false;
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString('de-DE', { 
            weekday: 'short',
            day: '2-digit', 
            month: 'short'
        });
    }

    function formatTime(date: Date): string {
        return date.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    function formatDateRange(start: Date, end?: Date): string {
        if (!end) return formatDate(start);
        
        const sameDay = start.toDateString() === end.toDateString();
        if (sameDay) {
            return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
        }
        return `${formatDate(start)} – ${formatDate(end)}`;
    }

    function isOnlineEvent(location?: string): boolean {
        if (!location) return false;
        const onlineKeywords = ['online', 'zoom', 'teams', 'webex', 'jitsi', 'virtual', 'remote'];
        return onlineKeywords.some(kw => location.toLowerCase().includes(kw));
    }

    function getEventTypeFromTitle(title: string): string {
        if (title.toLowerCase().includes('tagung')) return 'Tagung';
        if (title.toLowerCase().includes('workshop')) return 'Workshop';
        if (title.toLowerCase().includes('webinar')) return 'Webinar';
        if (title.toLowerCase().includes('fortbildung')) return 'Fortbildung';
        if (title.toLowerCase().includes('empfang')) return 'Event';
        return 'Event';
    }

    function getCategoryColor(category: string): string {
        switch (category) {
            case 'Tagung': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            case 'Workshop': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            case 'Webinar': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'Event': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
            case 'Fortbildung': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    }

    function isUpcoming(date: Date): boolean {
        return date > new Date();
    }

    // Sortiere nach Start-Datum
    let sortedEvents = $derived(
        [...events].sort((a, b) => a.start.getTime() - b.start.getTime())
    );
</script>

{#if isOpen}
    <!-- Backdrop -->
    <button
        type="button"
        class="fixed inset-0 w-full h-full bg-black/50 backdrop-blur-sm z-50 cursor-default"
        onclick={onClose}
        aria-label="Schließen"
        transition:fade={{ duration: 200 }}
    ></button>

    <!-- Panel -->
    <div
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[calc(100vw-2rem)] max-h-[80vh] bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-red-700/50"
        transition:fly={{ y: 50, duration: 300 }}
    >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-900 to-red-800 border-b border-red-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                    <Calendar class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="font-semibold text-white">{title}</h3>
                    <p class="text-xs text-red-200">{sortedEvents.length} Termine</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button
                    onclick={refreshEvents}
                    disabled={isLoading}
                    class="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    aria-label="Aktualisieren"
                >
                    <span class:animate-spin={isLoading}>
                        <RefreshCw class="w-5 h-5 text-white" />
                    </span>
                </button>
                <button
                    onclick={onClose}
                    class="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Schließen"
                >
                    <X class="w-5 h-5 text-white" />
                </button>
            </div>
        </div>

        <!-- Events List -->
        <div class="flex-1 overflow-y-auto">
            {#each sortedEvents as event (event.raw.id)}
                {@const upcoming = isUpcoming(event.start)}
                {@const isOnline = isOnlineEvent(event.location)}
                {@const eventType = getEventTypeFromTitle(event.title)}
                <div
                    class="block p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    class:opacity-60={!upcoming}
                    role="article"
                >
                    <div class="flex gap-4">
                        <!-- Date Badge -->
                        <div class="flex-shrink-0 w-14 text-center">
                            <div class="text-2xl font-bold text-white">
                                {event.start.getDate()}
                            </div>
                            <div class="text-xs text-slate-400 uppercase">
                                {event.start.toLocaleDateString('de-DE', { month: 'short' })}
                            </div>
                            {#if event.image}
                                <img 
                                    src={event.image} 
                                    alt="" 
                                    class="w-14 h-10 object-cover rounded mt-2"
                                />
                            {/if}
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1 flex-wrap">
                                <span class="text-xs px-2 py-0.5 rounded-full border {getCategoryColor(eventType)}">
                                    {eventType}
                                </span>
                                {#if isOnline}
                                    <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        🌐 Online
                                    </span>
                                {/if}
                                {#if !upcoming}
                                    <span class="text-xs text-slate-500">
                                        Vergangen
                                    </span>
                                {/if}
                            </div>

                            <h4 class="font-medium text-white text-sm mb-1 group-hover:text-red-300 transition-colors">
                                {event.title}
                            </h4>

                            {#if event.summary}
                                <p class="text-xs text-slate-300 mb-1">
                                    {event.summary}
                                </p>
                            {/if}

                            <p class="text-xs text-slate-400 line-clamp-2 mb-2">
                                {event.raw.content}
                            </p>

                            <!-- Meta Info -->
                            <div class="flex flex-wrap gap-3 text-xs text-slate-500">
                                <span class="flex items-center gap-1">
                                    <Clock class="w-3 h-3" />
                                    {formatDateRange(event.start, event.end)}
                                    {#if event.startTzid}
                                        <span class="text-slate-600">({event.startTzid})</span>
                                    {/if}
                                </span>
                                {#if event.location}
                                    <span class="flex items-center gap-1">
                                        <MapPin class="w-3 h-3" />
                                        {event.location}
                                    </span>
                                {/if}
                                {#if event.participants.length > 0}
                                    <span class="flex items-center gap-1">
                                        <User class="w-3 h-3" />
                                        {event.participants.length} Beteiligte
                                    </span>
                                {/if}
                            </div>

                            <!-- Participants Roles (optional) -->
                            {#if event.participants.length > 0}
                                <div class="flex flex-wrap gap-1 mt-2">
                                    {#each event.participants as participant}
                                        {#if participant.role}
                                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                                                {participant.role}
                                            </span>
                                        {/if}
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center">
            <p class="text-xs text-slate-500">
                Demo-Modus • NIP52 kind:31923
            </p>
            <a 
                href="https://comenius.de/termine" 
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
                Alle Termine <ExternalLink class="w-3 h-3" />
            </a>
        </div>
    </div>
{/if}
