export type Department = 'B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';

export type Perspective = 'default' | 'justice' | 'sustainability' | 'digitality' | 'structure';

export type TargetGroup = '0-3' | '4-6' | '7-10' | '11-14' | '15-18' | 'young-adults' | 'adults' | 'seniors' | 'employees' | 'volunteers';

// ============================================
// STAFF / MITARBEITER
// ============================================

export interface StaffMember {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
    email?: string;
}

// ============================================
// PROJEKTE
// ============================================

export interface ProjectDisplay {
    slogan: string;
    posterImage?: string;      // Großes Bild für Messewand
    logoUrl?: string;          // Projekt-Logo
    color: string;             // Primärfarbe
    screenshotUrl?: string;    // Website-Screenshot
    icon?: string;             // Emoji oder Icon-Name
}

export interface ProjectData {
    id: string;
    title: string;
    slug: string;
    externalUrl: string;
    departments: Department[];
    perspectives: Perspective[];
    targetGroups: TargetGroup[];
    type: 'ground' | 'orbit';
    staff: string[]; // IDs
    shortTeaser?: string;
    display?: ProjectDisplay;
    // Legacy (für Abwärtskompatibilität)
    logoUrl?: string;
    screenshotUrl?: string;
    color?: string;
}

// ============================================
// PLATTFORM-CONTENT
// ============================================

export interface PlatformAspect {
    id: string;
    title: string;
    icon: string;              // Emoji oder Icon-Name
    description: string;
    contentUrl?: string;       // Link zu HTML-Content
}

export interface WallPoster {
    projectId: string;
    position: number;          // 0-5 für 6 Wand-Segmente
}

export interface PlatformContent {
    id: Department;
    aspects: PlatformAspect[]; // Max 5 thematische Aspekte
    wallPosters: WallPoster[]; // Projekte auf den Messewänden
    boothProjects: string[];   // Projekt-IDs für freie Messestände
}

// ============================================
// GESAMTDATEN-STRUKTUR
// ============================================

export interface WorldData {
    platforms: Record<string, PlatformContent>;
    projects: ProjectData[];
    staff: StaffMember[];
}

// ============================================
// APP STATE
// ============================================

export interface AppState {
    projects: ProjectData[];
    activePerspective: Perspective;
    hoveredId: string | null;
    selectedId: string | null;
    activeQPlatform: Department | null;
    // Transport-System
    currentPlatform: string;
    isTransporting: boolean;
    transportTarget: string | null;
    hoveredDestination: string | null; // Für Lichtlinien-Highlight
    // Lokale Kamera-Bewegung (Boden-Klick)
    localCameraTarget: { x: number; y: number; z: number } | null;
    // Direkte Kamera-Ansicht (Poster/Rollup-Klick)
    viewTarget: {
        camera: { x: number; y: number; z: number };
        lookAt: { x: number; y: number; z: number };
    } | null;
    // Chat-Modal
    isChatOpen: boolean;
}
