<script lang="ts">
    /**
     * EventsPanel - Veranstaltungen/Termine Anzeige
     * 
     * Aktuell: Mock-Daten im NIP52 Format
     * Später: NIP52 Nostr-Stream [kind 31923 - Time-Based Calendar Event]
     */
    import { Calendar, ExternalLink, Clock, MapPin, User, RefreshCw } from "lucide-svelte";
    import GlassDialog from "./GlassDialog.svelte";

    /**
     * NIP52 Nostr Calendar Event (kind 31923)
     */
    interface NostrCalendarEvent {
        id: string;
        pubkey: string;
        created_at: number;
        kind: 31923;
        content: string;
        tags: string[][];
    }

    interface ParsedCalendarEvent {
        raw: NostrCalendarEvent;
        d: string;
        title: string;
        summary?: string;
        image?: string;
        start: Date;
        end?: Date;
        startTzid?: string;
        location?: string;
        participants: Array<{ pubkey: string; relay?: string; role?: string; }>;
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

    function getTagValue(tags: string[][], name: string): string | undefined {
        return tags.find(t => t[0] === name)?.[1];
    }

    function getAllTags(tags: string[][], name: string): string[][] {
        return tags.filter(t => t[0] === name);
    }

    function parseNostrEvent(event: NostrCalendarEvent): ParsedCalendarEvent {
        const startTs = getTagValue(event.tags, 'start');
        const endTs = getTagValue(event.tags, 'end');
        
        return {
            raw: event,
            d: getTagValue(event.tags, 'd') || event.id,
            title: getTagValue(event.tags, 'title') || 'Unbenanntes Event',
            summary: getTagValue(event.tags, 'summary'),
            image: getTagValue(event.tags, 'image'),
            start: new Date((startTs ? parseInt(startTs) : event.created_at) * 1000),
            end: endTs ? new Date(parseInt(endTs) * 1000) : undefined,
            startTzid: getTagValue(event.tags, 'start_tzid'),
            location: getTagValue(event.tags, 'location'),
            participants: getAllTags(event.tags, 'p').map(tag => ({
                pubkey: tag[1], relay: tag[2], role: tag[3]
            }))
        };
    }

    // Mock-Daten im NIP52 Format
    const mockNostrEvents: NostrCalendarEvent[] = [
        {
            id: 'a1b2c3d4e5f6',
            pubkey: 'comenius01',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 7,
            kind: 31923,
            content: 'Zweitägige Konferenz zu den Chancen und Herausforderungen von KI-Tools in Kirche und Bildung.',
            tags: [
                ['d', 'ki-tagung-2025'],
                ['title', 'Fachtagung: KI in der religiösen Bildung'],
                ['summary', 'KI-Tools für Kirche und Bildung'],
                ['start', String(Math.floor(new Date('2025-12-05T09:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-06T17:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Comenius-Institut, Münster'],
                ['p', 'speaker01', '', 'speaker']
            ]
        },
        {
            id: 'b2c3d4e5f6a1',
            pubkey: 'comenius01',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
            kind: 31923,
            content: 'Grundlagen des Godly Play Konzepts für Erzieher*innen. Online-Format.',
            tags: [
                ['d', 'godly-play-intro'],
                ['title', 'Online-Workshop: Godly Play Einführung'],
                ['summary', 'Grundlagen des Godly Play Konzepts'],
                ['start', String(Math.floor(new Date('2025-12-10T14:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-10T17:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Online (Zoom)']
            ]
        },
        {
            id: 'c3d4e5f6a1b2',
            pubkey: 'comenius01',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 3,
            kind: 31923,
            content: 'DSGVO-konforme Datenverarbeitung in Kirchengemeinden.',
            tags: [
                ['d', 'dsgvo-webinar'],
                ['title', 'Webinar: Datenschutz in der Gemeinde'],
                ['summary', 'DSGVO-konforme Datenverarbeitung'],
                ['start', String(Math.floor(new Date('2025-12-15T10:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2025-12-15T11:30:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Online (Microsoft Teams)']
            ]
        },
        {
            id: 'd4e5f6a1b2c3',
            pubkey: 'comenius01',
            created_at: Math.floor(Date.now() / 1000) - 86400 * 2,
            kind: 31923,
            content: 'Rückblick auf 2025 und Ausblick mit dem Team.',
            tags: [
                ['d', 'neujahr-2026'],
                ['title', 'Neujahrsempfang 2026'],
                ['summary', 'Rückblick und Ausblick'],
                ['start', String(Math.floor(new Date('2026-01-15T18:00:00').getTime() / 1000))],
                ['end', String(Math.floor(new Date('2026-01-15T21:00:00').getTime() / 1000))],
                ['start_tzid', 'Europe/Berlin'],
                ['location', 'Comenius-Institut, Münster']
            ]
        }
    ];
    
    let nostrEvents = $state<NostrCalendarEvent[]>(mockNostrEvents);
    let events = $derived(nostrEvents.map(parseNostrEvent));
    let sortedEvents = $derived([...events].sort((a, b) => a.start.getTime() - b.start.getTime()));

    async function refreshEvents() {
        isLoading = true;
        await new Promise(resolve => setTimeout(resolve, 800));
        isLoading = false;
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    }

    function formatTime(date: Date): string {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDateRange(start: Date, end?: Date): string {
        if (!end) return formatDate(start);
        const sameDay = start.toDateString() === end.toDateString();
        if (sameDay) return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
        return `${formatDate(start)} – ${formatDate(end)}`;
    }

    function isOnlineEvent(location?: string): boolean {
        if (!location) return false;
        return ['online', 'zoom', 'teams', 'webex'].some(kw => location.toLowerCase().includes(kw));
    }

    function getEventType(title: string): { label: string; bg: string; color: string } {
        const lower = title.toLowerCase();
        if (lower.includes('tagung')) return { label: 'Tagung', bg: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' };
        if (lower.includes('workshop')) return { label: 'Workshop', bg: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d' };
        if (lower.includes('webinar')) return { label: 'Webinar', bg: 'rgba(34, 211, 238, 0.2)', color: '#67e8f9' };
        if (lower.includes('fortbildung')) return { label: 'Fortbildung', bg: 'rgba(52, 211, 153, 0.2)', color: '#6ee7b7' };
        return { label: 'Event', bg: 'rgba(244, 114, 182, 0.2)', color: '#f9a8d4' };
    }

    function isUpcoming(date: Date): boolean {
        return date > new Date();
    }
</script>

<GlassDialog 
    isOpen={isOpen} 
    onClose={onClose}
    title={title}
    subtitle="{sortedEvents.length} Termine"
    icon={Calendar}
    width="550px"
    height="650px"
>
    <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Refresh Button -->
        <div style="
            padding: 0.5rem 1rem;
            display: flex;
            justify-content: flex-end;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <button
                onclick={refreshEvents}
                disabled={isLoading}
                style="
                    padding: 0.4rem 0.75rem;
                    border-radius: 0.5rem;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    cursor: pointer;
                    opacity: {isLoading ? '0.5' : '1'};
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                "
            >
                <RefreshCw style="width: 0.875rem; height: 0.875rem;" />
                Aktualisieren
            </button>
        </div>
        
        <!-- Events List -->
        <div style="flex: 1; overflow-y: auto;">
            {#each sortedEvents as event (event.raw.id)}
                {@const upcoming = isUpcoming(event.start)}
                {@const isOnline = isOnlineEvent(event.location)}
                {@const eventType = getEventType(event.title)}
                <div
                    role="article"
                    style="
                        padding: 1rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        opacity: {upcoming ? '1' : '0.6'};
                        transition: background 0.2s;
                    "
                    onmouseenter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style="display: flex; gap: 1rem;">
                        <!-- Date Badge -->
                        <div style="
                            flex-shrink: 0;
                            width: 3.5rem;
                            text-align: center;
                            background: rgba(239, 68, 68, 0.2);
                            border-radius: 0.5rem;
                            padding: 0.5rem;
                        ">
                            <div style="font-size: 1.5rem; font-weight: bold; color: white;">
                                {event.start.getDate()}
                            </div>
                            <div style="font-size: 0.7rem; color: rgba(252, 165, 165, 0.9); text-transform: uppercase;">
                                {event.start.toLocaleDateString('de-DE', { month: 'short' })}
                            </div>
                        </div>

                        <!-- Content -->
                        <div style="flex: 1; min-width: 0;">
                            <!-- Tags -->
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                                <span style="
                                    font-size: 0.65rem;
                                    padding: 0.15rem 0.5rem;
                                    border-radius: 9999px;
                                    background: {eventType.bg};
                                    color: {eventType.color};
                                ">
                                    {eventType.label}
                                </span>
                                {#if isOnline}
                                    <span style="
                                        font-size: 0.65rem;
                                        padding: 0.15rem 0.5rem;
                                        border-radius: 9999px;
                                        background: rgba(59, 130, 246, 0.2);
                                        color: #93c5fd;
                                    ">
                                        🌐 Online
                                    </span>
                                {/if}
                                {#if !upcoming}
                                    <span style="font-size: 0.65rem; color: rgba(148, 163, 184, 0.6);">
                                        Vergangen
                                    </span>
                                {/if}
                            </div>

                            <h4 style="
                                font-size: 0.95rem;
                                font-weight: 500;
                                color: white;
                                margin: 0 0 0.25rem 0;
                            ">
                                {event.title}
                            </h4>

                            {#if event.summary}
                                <p style="font-size: 0.8rem; color: rgba(203, 213, 225, 0.9); margin: 0 0 0.5rem 0;">
                                    {event.summary}
                                </p>
                            {/if}

                            <!-- Meta Info -->
                            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.7rem; color: rgba(148, 163, 184, 0.8);">
                                <span style="display: flex; align-items: center; gap: 0.25rem;">
                                    <Clock style="width: 0.7rem; height: 0.7rem;" />
                                    {formatDateRange(event.start, event.end)}
                                </span>
                                {#if event.location}
                                    <span style="display: flex; align-items: center; gap: 0.25rem;">
                                        <MapPin style="width: 0.7rem; height: 0.7rem;" />
                                        {event.location}
                                    </span>
                                {/if}
                                {#if event.participants.length > 0}
                                    <span style="display: flex; align-items: center; gap: 0.25rem;">
                                        <User style="width: 0.7rem; height: 0.7rem;" />
                                        {event.participants.length} Beteiligte
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Footer -->
        <div style="
            padding: 0.75rem 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <p style="font-size: 0.75rem; color: rgba(148, 163, 184, 0.6); margin: 0;">
                Demo-Modus • NIP52 kind:31923
            </p>
            <a 
                href="https://comenius.de/termine" 
                target="_blank"
                rel="noopener noreferrer"
                style="
                    font-size: 0.75rem;
                    color: #f87171;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    text-decoration: none;
                "
            >
                Alle Termine <ExternalLink style="width: 0.75rem; height: 0.75rem;" />
            </a>
        </div>
    </div>
</GlassDialog>
