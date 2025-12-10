import type { AppState, ProjectData, Perspective, Department, PlatformAspect, PartnerConnection, PlatformContent, MarketplaceContent } from '../types/project';
import { fetchWorldData } from './apiService';

// Erweiterte AppState für Marketplace-Panels
interface ExtendedAppState extends AppState {
    isRssPanelOpen: boolean;
    isEventsPanelOpen: boolean;
    // Iframe Dialog
    isIframeOpen: boolean;
    iframeUrl: string | null;
    iframeTitle: string | null;
    // Partner Dialog (Nexus Terminal)
    isPartnerDialogOpen: boolean;
    selectedPartner: PartnerConnection | null;
    // Chat Webhook URL (von Institution-Stand)
    chatWebhook: string | null;
    // Pending ViewTarget (nach Transport ausführen)
    pendingViewTarget: { projectId: string; displayType: 'booth' | 'wall'; platformId: string } | null;
}

export class WorldStore {
    // ============================================
    // SEPARATE TRANSPORT-SIGNALE (Performance-kritisch!)
    // Diese sind vom Haupt-State getrennt, um granulare Updates zu ermöglichen
    // ============================================
    currentPlatform = $state<string>('S');
    isTransporting = $state<boolean>(false);
    transportTarget = $state<string | null>(null);
    
    // Loading-State für API-Daten
    isLoading = $state<boolean>(true);
    loadError = $state<string | null>(null);
    
    // World-Daten (von WordPress API)
    platforms = $state<Record<string, PlatformContent>>({});
    marketplace = $state<MarketplaceContent | null>(null);
    staff = $state<any[]>([]);
    partnerConnections = $state<PartnerConnection[]>([]);
    
    // Haupt-State (weniger performance-kritisch)
    state = $state<Omit<ExtendedAppState, 'currentPlatform' | 'isTransporting' | 'transportTarget'>>({
        projects: [],
        activePerspective: 'default',
        hoveredId: null,
        selectedId: null,
        activeQPlatform: null,
        hoveredDestination: null, // Für Lichtlinien-Highlight
        // NEU: Lokale Kamera-Bewegung auf Plattform (Boden-Klick)
        localCameraTarget: null, // {x, y, z} Position auf der Plattform
        // NEU: Direkte Kamera-Ansicht (Poster/Rollup-Klick)
        viewTarget: null, // { camera: {x,y,z}, lookAt: {x,y,z} }
        // NEU: Chat-Modal
        isChatOpen: false,
        // NEU: Content-Card für Aspects
        selectedAspect: null,
        // NEU: Marketplace-Panels
        isRssPanelOpen: false,
        isEventsPanelOpen: false,
        // NEU: Iframe Dialog
        isIframeOpen: false,
        iframeUrl: null,
        iframeTitle: null,
        // NEU: Partner Dialog (Nexus Terminal)
        isPartnerDialogOpen: false,
        selectedPartner: null,
        // NEU: Chat Webhook URL
        chatWebhook: null,
        // NEU: Pending ViewTarget (nach Transport)
        pendingViewTarget: null
    });

    // Derived: Theme-Farbe basierend auf aktiver Perspektive
    themeColor = $derived.by(() => {
        switch (this.state.activePerspective) {
            case 'digitality':
                return '#00ffff';
            case 'sustainability':
                return '#4ade80';
            case 'justice':
                return '#facc15';
            case 'structure':
                return '#a78bfa';
            default:
                return '#ffffff';
        }
    });

    // Derived: Nebel-Farbe (leicht abgedunkelt)
    fogColor = $derived.by(() => {
        switch (this.state.activePerspective) {
            case 'digitality':
                return '#001a1a';
            case 'sustainability':
                return '#1a2e1f';
            case 'justice':
                return '#2e2a1a';
            case 'structure':
                return '#1f1a2e';
            default:
                return '#f5f5f5';
        }
    });

    // Derived: Gefilterte Projekte basierend auf aktiver Perspektive
    filteredProjects = $derived.by(() => {
        if (this.state.activePerspective === 'default') {
            return this.state.projects;
        }
        return this.state.projects.map((p) => ({
            ...p,
            dimmed: !p.perspectives.includes(this.state.activePerspective)
        }));
    });

    constructor() {
        // Daten werden mit loadWorldData() geladen
    }
    
    // Lade alle World-Daten vom WordPress API
    async loadWorldData() {
        this.isLoading = true;
        this.loadError = null;
        
        try {
            const data = await fetchWorldData();
            
            // Daten in Store speichern
            this.state.projects = data.projects;
            this.platforms = data.platforms;
            this.marketplace = data.marketplace;
            this.staff = data.staff;
            this.partnerConnections = data.partnerConnections;
            
            console.log('✅ World Data loaded into store:', {
                projects: this.state.projects.length,
                platforms: Object.keys(this.platforms).length,
                staff: this.staff.length,
                partners: this.partnerConnections.length
            });
            
            this.isLoading = false;
        } catch (error) {
            console.error('❌ Failed to load World Data:', error);
            this.loadError = error instanceof Error ? error.message : 'Unknown error';
            this.isLoading = false;
        }
    }

    setPerspective(perspective: Perspective) {
        this.state.activePerspective = perspective;
    }

    selectProject(id: string | null) {
        this.state.selectedId = id;
        // Reset Q-Platform wenn Projekt gewählt wird
        if (id !== null) {
            this.state.activeQPlatform = null;
            this.state.selectedAspect = null; // Schließe Aspect-Card
        }
    }

    // NEU: Aspect für ContentCard auswählen
    selectAspect(aspect: PlatformAspect | null) {
        this.state.selectedAspect = aspect;
        // Schließe andere Modals
        if (aspect !== null) {
            this.state.selectedId = null;
            this.state.isChatOpen = false;
        }
    }

    setHovered(id: string | null) {
        this.state.hoveredId = id;
    }

    setQPlatform(department: Department | null) {
        // Toggle: Wenn gleiche Platform erneut geklickt, deaktivieren
        if (this.state.activeQPlatform === department) {
            this.state.activeQPlatform = null;
        } else {
            this.state.activeQPlatform = department;
            // Schließe eventuell offenes Projekt-Modal
            this.state.selectedId = null;
        }
    }

    // NEU: Transport-System (vereinfacht - alle Plattformen sind vorgeladen)
    startTransport(targetId: string) {
        console.log('[Store] startTransport called:', targetId);
        
        if (this.isTransporting) return; // Bereits unterwegs
        if (this.currentPlatform === targetId) return; // Schon dort
        
        console.time('[Store] FULL FREEZE MEASUREMENT');
        
        // Setze Transport-Signale (separate $state, nicht im Haupt-state-Objekt!)
        this.transportTarget = targetId;
        this.isTransporting = true;
        
        // Dieser setTimeout wird NACH allen synchronen $derived/$effect ausgeführt
        setTimeout(() => {
            console.timeEnd('[Store] FULL FREEZE MEASUREMENT');
        }, 0);
        
        // Fallback-Timeout falls finishTransport nicht aufgerufen wird
        setTimeout(() => {
            if (this.isTransporting && this.transportTarget === targetId) {
                this.finishTransport();
            }
        }, 5000);
    }
    
    // Transport abschließen (wird von Scene nach Animation aufgerufen)
    finishTransport() {
        if (!this.isTransporting) return;
        
        if (this.transportTarget) {
            this.currentPlatform = this.transportTarget;
        }
        this.isTransporting = false;
        this.transportTarget = null;

        // Pending ViewTarget nach Transport ausführen
        if (this.state.pendingViewTarget) {
            const pending = this.state.pendingViewTarget;
            this.state.pendingViewTarget = null;
            
            // Kurze Verzögerung damit Transport-Animation abgeschlossen ist
            setTimeout(() => {
                import('./viewpoints').then(({ getViewPoint }) => {
                    const viewPoint = getViewPoint(pending.projectId, pending.displayType, pending.platformId);
                    if (viewPoint) {
                        this.setViewTarget(viewPoint.camera, viewPoint.target);
                    }
                });
            }, 500); // 500ms warten nach Transport
        }
    }

    setCurrentPlatform(platformId: string) {
        this.currentPlatform = platformId;
    }

    // NEU: Chat-Modal für ProjectChart
    openChat(webhookUrl?: string) {
        this.state.isChatOpen = true;
        this.state.chatWebhook = webhookUrl ?? null;
        this.state.selectedId = null; // Schließe Projekt-Modal
        this.state.isRssPanelOpen = false;
        this.state.isEventsPanelOpen = false;
    }

    closeChat() {
        this.state.isChatOpen = false;
        this.state.chatWebhook = null;
    }

    // NEU: RSS-Panel für Publications
    openRssPanel() {
        this.state.isRssPanelOpen = true;
        this.state.selectedId = null;
        this.state.isChatOpen = false;
        this.state.isEventsPanelOpen = false;
    }

    closeRssPanel() {
        this.state.isRssPanelOpen = false;
    }

    // NEU: Events-Panel für Veranstaltungen
    openEventsPanel() {
        this.state.isEventsPanelOpen = true;
        this.state.selectedId = null;
        this.state.isChatOpen = false;
        this.state.isRssPanelOpen = false;
    }

    closeEventsPanel() {
        this.state.isEventsPanelOpen = false;
    }

    // NEU: Iframe Dialog für externe Websites
    openIframe(url: string, title?: string) {
        this.state.iframeUrl = url;
        this.state.iframeTitle = title || this.extractDomain(url);
        this.state.isIframeOpen = true;
        // Schließe andere Modals
        this.state.selectedId = null;
        this.state.isChatOpen = false;
        this.state.isRssPanelOpen = false;
        this.state.isEventsPanelOpen = false;
        this.state.selectedAspect = null;
    }

    closeIframe() {
        this.state.isIframeOpen = false;
        this.state.iframeUrl = null;
        this.state.iframeTitle = null;
    }

    // NEU: Partner Dialog für Nexus Terminal
    openPartnerDialog(partner: PartnerConnection) {
        this.state.selectedPartner = partner;
        this.state.isPartnerDialogOpen = true;
        // Schließe andere Modals
        this.state.selectedId = null;
        this.state.isChatOpen = false;
        this.state.isRssPanelOpen = false;
        this.state.isEventsPanelOpen = false;
    }

    closePartnerDialog() {
        this.state.isPartnerDialogOpen = false;
        this.state.selectedPartner = null;
    }

    // Hilfsfunktion: Domain aus URL extrahieren
    private extractDomain(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Website';
        }
    }

    // NEU: Hover über Transport-Button
    setHoveredDestination(platformId: string | null) {
        this.state.hoveredDestination = platformId;
    }

    // NEU: Lokale Kamera-Bewegung auf der Plattform
    moveToLocalPosition(worldPosition: { x: number; y: number; z: number }) {
        this.state.localCameraTarget = worldPosition;
    }

    clearLocalCameraTarget() {
        this.state.localCameraTarget = null;
    }

    // NEU: Direkte Kamera-Ansicht für Poster/Rollup-Klicks
    setViewTarget(
        camera: { x: number; y: number; z: number },
        lookAt: { x: number; y: number; z: number }
    ) {
        this.state.viewTarget = { camera, lookAt };
    }

    clearViewTarget() {
        this.state.viewTarget = null;
    }

    // NEU: Navigiere direkt zu einem Projekt (auf aktueller oder Ziel-Plattform)
    // Nutzt getViewPoint() API und setzt viewTarget oder triggert Transport
    navigateToProject(projectId: string, displayType: 'booth' | 'wall', platformId: string) {
        // Import getViewPoint dynamisch zur Laufzeit (vermeidet circular dependencies)
        import('./viewpoints').then(({ getViewPoint }) => {
            // Wenn auf gleicher Plattform: Direkt viewTarget setzen
            if (platformId === this.currentPlatform) {
                const viewPoint = getViewPoint(projectId, displayType, platformId);
                if (viewPoint) {
                    this.setViewTarget(viewPoint.camera, viewPoint.target);
                }
            }
            // Sonst: Transport zur Plattform starten + pendingViewTarget speichern
            else {
                this.state.pendingViewTarget = { projectId, displayType, platformId };
                this.startTransport(platformId);
            }
        });
    }

    // Algorithmus: Finde verwandte Projekte
    getRelated(projectId: string): ProjectData[] {
        const current = this.state.projects.find((p) => p.id === projectId);
        if (!current) return [];

        const scores = this.state.projects
            .filter((p) => p.id !== projectId)
            .map((p) => {
                let score = 0;

                // Gleiche Abteilung: +3 Punkte
                const sharedDepts = p.departments.filter((d) => current.departments.includes(d));
                score += sharedDepts.length * 3;

                // Gleiche Zielgruppe: +2 Punkte
                const sharedGroups = p.targetGroups.filter((g) => current.targetGroups.includes(g));
                score += sharedGroups.length * 2;

                // Gleiche Perspektive: +1 Punkt
                const sharedPersp = p.perspectives.filter((per) =>
                    current.perspectives.includes(per)
                );
                score += sharedPersp.length;

                return { project: p, score };
            })
            .sort((a, b) => b.score - a.score);

        return scores.slice(0, 3).map((s) => s.project);
    }

    // Hilfsfunktion: Projekt nach Slug finden
    findBySlug(slug: string): ProjectData | undefined {
        return this.state.projects.find((p) => p.slug === slug);
    }
}

// Singleton-Export (wird in +page.svelte initialisiert)
export let worldStore: WorldStore;

export function initWorldStore() {
    if (!worldStore) {
        worldStore = new WorldStore();
    }
    return worldStore;
}

// Hilfsfunktion: Store mit WordPress-Daten initialisieren
export async function initWorldStoreWithData() {
    const store = initWorldStore();
    await store.loadWorldData();
    return store;
}
