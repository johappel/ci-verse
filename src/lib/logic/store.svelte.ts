import type { AppState, ProjectData, Perspective, Department } from '../types/project';

export class WorldStore {
    state = $state<AppState>({
        projects: [],
        activePerspective: 'default',
        hoveredId: null,
        selectedId: null,
        activeQPlatform: null,
        // NEU: Transport-System
        currentPlatform: 'S',
        isTransporting: false,
        transportTarget: null,
        hoveredDestination: null, // Für Lichtlinien-Highlight
        // NEU: Chat-Modal
        isChatOpen: false
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

    constructor(initialData: ProjectData[]) {
        this.state.projects = initialData;
    }

    setPerspective(perspective: Perspective) {
        this.state.activePerspective = perspective;
    }

    selectProject(id: string | null) {
        this.state.selectedId = id;
        // Reset Q-Platform wenn Projekt gewählt wird
        if (id !== null) {
            this.state.activeQPlatform = null;
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

    // NEU: Transport-System
    startTransport(targetId: string) {
        if (this.state.isTransporting) return; // Bereits unterwegs
        if (this.state.currentPlatform === targetId) return; // Schon dort
        
        this.state.isTransporting = true;
        this.state.transportTarget = targetId;
        
        // Nach Animation (2.5s) abschließen
        setTimeout(() => {
            this.state.currentPlatform = targetId;
            this.state.isTransporting = false;
            this.state.transportTarget = null;
        }, 2500);
    }

    setCurrentPlatform(platformId: string) {
        this.state.currentPlatform = platformId;
    }

    // NEU: Chat-Modal für ProjectChart
    openChat() {
        this.state.isChatOpen = true;
        this.state.selectedId = null; // Schließe Projekt-Modal
    }

    closeChat() {
        this.state.isChatOpen = false;
    }

    // NEU: Hover über Transport-Button
    setHoveredDestination(platformId: string | null) {
        this.state.hoveredDestination = platformId;
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

export function initWorldStore(projects: ProjectData[]) {
    worldStore = new WorldStore(projects);
    return worldStore;
}
