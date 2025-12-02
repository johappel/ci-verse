<script lang="ts">
    /**
     * RssFeedPanel - News/Publikationen Anzeige
     * 
     * Aktuell: Mock-Daten
     * Später: Fetch von RSS-Feeds
     */
    import { Newspaper, ExternalLink, Calendar, RefreshCw } from "lucide-svelte";
    import GlassDialog from "./GlassDialog.svelte";

    interface FeedItem {
        id: string;
        title: string;
        excerpt: string;
        date: Date;
        url: string;
        category?: string;
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        feedUrls?: string[];
        title?: string;
    }

    let { 
        isOpen = false, 
        onClose, 
        feedUrls = [],
        title = "Publikationen & News"
    }: Props = $props();

    let isLoading = $state(false);

    // Mock-Daten für Demo
    const mockFeedItems: FeedItem[] = [
        {
            id: '1',
            title: 'Neue Studie zur religiösen Bildung in Kitas veröffentlicht',
            excerpt: 'Die Forschungsstelle des Comenius-Instituts hat eine umfassende Studie zur religiösen Bildung in evangelischen Kindertageseinrichtungen durchgeführt.',
            date: new Date('2025-11-25'),
            url: 'https://comenius.de/news/studie-kitas-2025',
            category: 'Forschung'
        },
        {
            id: '2',
            title: 'Konfi-App 3.0 mit KI-Funktionen',
            excerpt: 'Die beliebte Konfi-App erhält ein großes Update mit neuen KI-gestützten Lernfunktionen für die Konfirmandenarbeit.',
            date: new Date('2025-11-20'),
            url: 'https://comenius.de/news/konfi-app-3',
            category: 'Digital'
        },
        {
            id: '3',
            title: 'Erasmus+ Projekt erfolgreich abgeschlossen',
            excerpt: 'Nach drei Jahren intensiver Zusammenarbeit wurde das EU-Projekt zur interreligiösen Bildung erfolgreich abgeschlossen.',
            date: new Date('2025-11-15'),
            url: 'https://comenius.de/news/erasmus-2025',
            category: 'Europa'
        },
        {
            id: '4',
            title: 'Fortbildungsreihe "Digitale Gemeinde" startet',
            excerpt: 'Ab Januar 2026 bietet das Comenius-Institut eine neue Fortbildungsreihe für digitale Kompetenzen in der Gemeindearbeit an.',
            date: new Date('2025-11-10'),
            url: 'https://comenius.de/news/fortbildung-digital',
            category: 'Weiterbildung'
        },
        {
            id: '5',
            title: 'Neuer Bildungsatlas online',
            excerpt: 'Der interaktive Bildungsatlas zeigt nun alle evangelischen Bildungseinrichtungen in Deutschland mit erweiterten Filterfunktionen.',
            date: new Date('2025-11-05'),
            url: 'https://comenius.de/news/bildungsatlas-neu',
            category: 'Forschung'
        }
    ];

    let feedItems = $state<FeedItem[]>(mockFeedItems);

    // Simuliertes Laden
    async function refreshFeed() {
        isLoading = true;
        await new Promise(resolve => setTimeout(resolve, 800));
        isLoading = false;
    }

    function formatDate(date: Date): string {
        return date.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    function getCategoryStyle(category?: string): { bg: string; color: string } {
        switch (category) {
            case 'Forschung': return { bg: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' };
            case 'Digital': return { bg: 'rgba(34, 211, 238, 0.2)', color: '#67e8f9' };
            case 'Europa': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' };
            case 'Weiterbildung': return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fcd34d' };
            default: return { bg: 'rgba(100, 116, 139, 0.2)', color: '#cbd5e1' };
        }
    }
</script>

<GlassDialog 
    isOpen={isOpen} 
    onClose={onClose}
    title={title}
    subtitle="{feedItems.length} Artikel"
    icon={Newspaper}
    width="550px"
    height="600px"
>
    <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Refresh Button im Content-Bereich -->
        <div style="
            padding: 0.5rem 1rem;
            display: flex;
            justify-content: flex-end;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <button
                onclick={refreshFeed}
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
                aria-label="Aktualisieren"
            >
                <RefreshCw style="width: 0.875rem; height: 0.875rem;" />
                Aktualisieren
            </button>
        </div>
        
        <!-- Feed Items -->
        <div style="flex: 1; overflow-y: auto;">
            {#each feedItems as item (item.id)}
                {@const catStyle = getCategoryStyle(item.category)}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display: block;
                        padding: 1rem;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        text-decoration: none;
                        transition: background 0.2s;
                    "
                    onmouseenter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onmouseleave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                        {#if item.category}
                            <span style="
                                font-size: 0.7rem;
                                padding: 0.2rem 0.5rem;
                                border-radius: 9999px;
                                background: {catStyle.bg};
                                color: {catStyle.color};
                            ">
                                {item.category}
                            </span>
                        {/if}
                        <span style="
                            font-size: 0.7rem;
                            color: rgba(148, 163, 184, 0.8);
                            display: flex;
                            align-items: center;
                            gap: 0.25rem;
                        ">
                            <Calendar style="width: 0.75rem; height: 0.75rem;" />
                            {formatDate(item.date)}
                        </span>
                    </div>

                    <h4 style="
                        font-size: 0.95rem;
                        font-weight: 500;
                        color: white;
                        margin: 0 0 0.5rem 0;
                        line-height: 1.4;
                    ">
                        {item.title}
                    </h4>

                    <p style="
                        font-size: 0.8rem;
                        color: rgba(148, 163, 184, 0.9);
                        margin: 0;
                        line-height: 1.5;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    ">
                        {item.excerpt}
                    </p>
                </a>
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
                Demo-Modus • Später RSS-Feed
            </p>
            <a 
                href="https://comenius.de/publikationen" 
                target="_blank"
                rel="noopener noreferrer"
                style="
                    font-size: 0.75rem;
                    color: #34d399;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    text-decoration: none;
                "
            >
                Alle Artikel <ExternalLink style="width: 0.75rem; height: 0.75rem;" />
            </a>
        </div>
    </div>
</GlassDialog>
