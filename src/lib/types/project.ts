export type Department = 'B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';

export type Perspective = 'default' | 'education' | 'justice' | 'sustainability' | 'diversity' | 'digitality' | 'structure';

export type TargetGroup = '0-3' | '4-6' | '7-10' | '11-14' | '15-18' | 'young-adults' | 'adults' | 'seniors' | 'employees' | 'volunteers' | 'Religionspädagog*innen' | 'Wissenschaftler*innen' | 'Praxiserprobte';

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
    color: string;             // Primärfarbe
    screenshotUrl?: string;    // Website-Screenshot
    icon?: string;             // Emoji oder Icon-Name
}

export interface ProjectData {
    id: string;
    title: string;
    slug: string;
    externalUrl: string;
    departments: Department[];           // Wo das Projekt angezeigt wird
    relatedDepartments?: Department[];   // Wo ein Wegweiser erscheint
    perspectives: Perspective[];
    targetGroups: TargetGroup[];
    displayType: 'booth' | 'wall' | 'both';  // Wie wird das Projekt angezeigt?
    staff: string[]; // IDs
    shortTeaser?: string;
    display?: ProjectDisplay;
    // Legacy (für Abwärtskompatibilität)
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
    color: string;             // Primärfarbe (Hex)
    glowColor: string;         // Leuchtfarbe für Glow-Effekte (Hex)
    aspects: PlatformAspect[]; // Max 5 thematische Aspekte
    // Projekte + Wegweiser werden über ProjectData.departments + relatedDepartments zugeordnet
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
    };
    // Interaktions-Quellen (je nach Typ)
    chatWebhook?: string;          // n8n Webhook für KI-Chat (type: institution)
    rssFeedUrls?: string[];        // RSS für News/Publikationen (type: publications)
    nostrFilter?: string;          // Nostr npub/nevent für Events (type: events)
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
    color: string;                           // Primärfarbe (Hex)
    glowColor: string;                       // Leuchtfarbe für Glow-Effekte (Hex)
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

// ============================================
// NEXUS TERMINAL - Partner-Verbindungen
// ============================================

/** Kategorie der Partner-Einrichtung */
export type PartnerCategory = 
    | 'ministry'      // Ministerien (BMBF)
    | 'church'        // Kirchliche Einrichtungen (EKD)
    | 'university'    // Universitäten
    | 'institute'     // Andere Institute (ALPIKA)
    | 'international' // EU, internationale Orgs
    | 'association';  // Verbände, Gesellschaften

/** Partner-Einrichtung für Nexus Terminal */
export interface PartnerConnection {
    id: string;
    name: string;              // Voller Name
    shortName: string;         // Kurzname für Tafel
    logoUrl: string;           // Logo-URL
    color: string;             // Primärfarbe (Hex)
    url: string;               // Externe Website
    category: PartnerCategory;
}

/** Zug-Status im Fahrplan */
export type TrainStatus = 'arriving' | 'boarding' | 'departing' | 'departed';

/** Eintrag im Fahrplan */
export interface TrainSchedule {
    destination: PartnerConnection;
    departureTime: string;     // Fake-Zeit (z.B. "12:34")
    platform: 1 | 2;           // Gleis-Nummer
    status: TrainStatus;
}
