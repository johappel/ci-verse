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
    posterImageFormat?: 'portrait' | 'landscape' | 'square'; // Bildformat (default: portrait)
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

// WallPoster Interface entfernt - Position = Array-Index

export interface PlatformContent {
    id: Department;
    title: string;             // Voller Name, z.B. "Schule & Jugend"
    short: string;             // Kurzname für Buttons, z.B. "Schule"
    description: string;       // Kurzbeschreibung der Plattform
    aspects: PlatformAspect[]; // Max 5 thematische Aspekte
    wallPosters: string[];     // Projekt-IDs für Messewände (Position = Index)
    boothProjects: string[];   // Projekt-IDs für freie Messestände (Position = Index)
}

// ============================================
// MARKTPLATZ (S-PLATTFORM)
// ============================================

/** Stand-Typen auf dem Marktplatz */
export type MarketplaceStandType = 
    | 'institution'    // Das Institut selbst (mit KI-Chat)
    | 'publications'   // Publikationen/News-Terminal (RSS)
    | 'events'         // Veranstaltungskalender
    | 'info';          // Allgemeiner Info-Stand

/** Einzelner Stand auf dem Marktplatz */
export interface MarketplaceStand {
    id: string;
    title: string;
    type: MarketplaceStandType;
    icon: string;                  // Emoji oder Icon-Name
    description: string;
    display: {
        color: string;
        logoUrl?: string;
        bannerImage?: string;      // Großes Bannerbild für den Stand
    };
    // Interaktions-Quellen (je nach Typ)
    chatWebhook?: string;          // n8n Webhook für KI-Chat (type: institution)
    rssFeedUrls?: string[];        // RSS für News/Publikationen (type: publications)
    calendarUrl?: string;          // iCal/API für Events (type: events)
    externalUrl?: string;          // Fallback-Link zur Webseite
}

/** Atmosphärisches Wandposter für Leitlinien */
export interface MarketplaceWallPoster {
    id: string;
    title: string;                 // z.B. "Gerechtigkeit"
    imageUrl: string;              // Atmosphärisches Bild
    perspective: Perspective;      // Zugehörige Leitlinie
    position: number;              // Wand-Segment (0-5)
}

/** Inhalt der S-Plattform (Marktplatz) */
export interface MarketplaceContent {
    id: 'S';
    title: string;                           // Voller Name, z.B. "Marktplatz"
    short: string;                           // Kurzname für Buttons
    description: string;                     // Kurzbeschreibung der Plattform
    stands: MarketplaceStand[];              // Interaktive Stände
    wallPosters: MarketplaceWallPoster[];    // Leitlinien-Poster an den Wänden
}

// ============================================
// GESAMTDATEN-STRUKTUR
// ============================================

export interface WorldData {
    platforms: Record<string, PlatformContent>;
    marketplace: MarketplaceContent;         // S-Plattform separat
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
    // Content-Card für Aspects
    selectedAspect: PlatformAspect | null;
}
