<script lang="ts">
    /**
     * RssFeedPanel - News/Publikationen Anzeige
     * 
     * Aktuell: Mock-Daten
     * Später: Fetch von RSS-Feeds (rssFeedUrls aus MarketplaceStand)
     */
    import { fade, fly } from "svelte/transition";
    import { Newspaper, ExternalLink, X, Calendar, ArrowRight, RefreshCw } from "lucide-svelte";

    interface FeedItem {
        id: string;
        title: string;
        excerpt: string;
        date: Date;
        url: string;
        category?: string;
        imageUrl?: string;
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
            category: 'Forschung',
            imageUrl: 'https://picsum.photos/seed/news1/400/200'
        },
        {
            id: '2',
            title: 'Konfi-App 3.0 mit KI-Funktionen',
            excerpt: 'Die beliebte Konfi-App erhält ein großes Update mit neuen KI-gestützten Lernfunktionen für die Konfirmandenarbeit.',
            date: new Date('2025-11-20'),
            url: 'https://comenius.de/news/konfi-app-3',
            category: 'Digital',
            imageUrl: 'https://picsum.photos/seed/news2/400/200'
        },
        {
            id: '3',
            title: 'Erasmus+ Projekt erfolgreich abgeschlossen',
            excerpt: 'Nach drei Jahren intensiver Zusammenarbeit wurde das EU-Projekt zur interreligiösen Bildung erfolgreich abgeschlossen.',
            date: new Date('2025-11-15'),
            url: 'https://comenius.de/news/erasmus-2025',
            category: 'Europa',
            imageUrl: 'https://picsum.photos/seed/news3/400/200'
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

    // Simuliertes Laden (später: echtes RSS-Fetch)
    async function refreshFeed() {
        isLoading = true;
        
        // TODO: Später durch echtes RSS-Fetch ersetzen
        // for (const url of feedUrls) {
        //     const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(url)}`);
        //     const items = await response.json();
        //     feedItems = [...feedItems, ...items];
        // }
        
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

    function getCategoryColor(category?: string): string {
        switch (category) {
            case 'Forschung': return 'bg-purple-500/20 text-purple-300';
            case 'Digital': return 'bg-cyan-500/20 text-cyan-300';
            case 'Europa': return 'bg-blue-500/20 text-blue-300';
            case 'Weiterbildung': return 'bg-amber-500/20 text-amber-300';
            default: return 'bg-slate-500/20 text-slate-300';
        }
    }
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
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[calc(100vw-2rem)] max-h-[80vh] bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-emerald-700/50"
        transition:fly={{ y: 50, duration: 300 }}
    >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-900 to-emerald-800 border-b border-emerald-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Newspaper class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 class="font-semibold text-white">{title}</h3>
                    <p class="text-xs text-emerald-200">{feedItems.length} Artikel</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button
                    onclick={refreshFeed}
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

        <!-- Feed Items -->
        <div class="flex-1 overflow-y-auto">
            {#each feedItems as item (item.id)}
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block p-4 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors group"
                >
                    <div class="flex gap-4">
                        <!-- Thumbnail -->
                        {#if item.imageUrl}
                            <div class="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800">
                                <img 
                                    src={item.imageUrl} 
                                    alt="" 
                                    class="w-full h-full object-cover"
                                />
                            </div>
                        {/if}

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                {#if item.category}
                                    <span class="text-xs px-2 py-0.5 rounded-full {getCategoryColor(item.category)}">
                                        {item.category}
                                    </span>
                                {/if}
                                <span class="text-xs text-slate-500 flex items-center gap-1">
                                    <Calendar class="w-3 h-3" />
                                    {formatDate(item.date)}
                                </span>
                            </div>

                            <h4 class="font-medium text-white text-sm mb-1 line-clamp-2 group-hover:text-emerald-300 transition-colors">
                                {item.title}
                            </h4>

                            <p class="text-xs text-slate-400 line-clamp-2">
                                {item.excerpt}
                            </p>
                        </div>

                        <!-- Arrow -->
                        <div class="flex items-center">
                            <ArrowRight class="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </a>
            {/each}
        </div>

        <!-- Footer -->
        <div class="px-4 py-3 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center">
            <p class="text-xs text-slate-500">
                Demo-Modus • Später RSS-Feed
            </p>
            <a 
                href="https://comenius.de/publikationen" 
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
                Alle Artikel <ExternalLink class="w-3 h-3" />
            </a>
        </div>
    </div>
{/if}
