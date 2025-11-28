import type { ProjectData, StaffMember, PlatformContent, WorldData, Department, MarketplaceContent, MarketplaceStand } from '../types/project';

// ============================================================================
// PROJEKTE (15 Stück)
// ============================================================================

export const mockProjects: ProjectData[] = [
    {
        id: 'p1',
        title: 'Religionspädagogik in der Kita',
        slug: 'rpi-kita',
        externalUrl: 'https://relimentar.de',
        departments: ['B1'],
        perspectives: ['justice', 'sustainability'],
        targetGroups: ['0-3', '4-6'],
        type: 'ground',
        staff: ['m1', 'm2'],
        shortTeaser: 'Religiöse Bildung für die Kleinsten - spielerisch, respektvoll, entwicklungsgerecht.',
        display: {
            slogan: 'Glaube entdecken von Anfang an',
            posterImage: 'https://picsum.photos/seed/kita-poster/800/1200',
            logoUrl: '/logos/relimentar.svg',
            color: '#f97316',
            screenshotUrl: 'https://picsum.photos/seed/kita/800/600'
        }
    },
    {
        id: 'p2',
        title: 'Digitales Gemeindemanagement',
        slug: 'digi-gemeinde',
        externalUrl: 'https://efabi.net',
        departments: ['B3', 'Q3'],
        perspectives: ['digitality', 'structure'],
        targetGroups: ['adults', 'employees'],
        type: 'ground',
        staff: ['m3'],
        shortTeaser: 'Moderne Tools für die Gemeindearbeit - effizient, transparent und zukunftsorientiert.',
        display: {
            slogan: 'Gemeinde digital gestalten',
            posterImage: 'https://picsum.photos/seed/digital-poster/800/1200',
            logoUrl: '/logos/efabi.svg',
            color: '#0ea5e9',
            screenshotUrl: 'https://picsum.photos/seed/digital/800/600'
        }
    },
    {
        id: 'p3',
        title: 'Forschungsstelle Bildungsbericht',
        slug: 'bildungsbericht',
        externalUrl: 'https://comenius.de/forschung',
        departments: ['Q1'],
        perspectives: ['justice'],
        targetGroups: [],
        type: 'orbit',
        staff: ['m1'],
        shortTeaser: 'Evidenzbasierte Forschung zur evangelischen Bildungslandschaft in Deutschland.',
        display: {
            slogan: 'Wissen schafft Bildung',
            posterImage: 'https://picsum.photos/seed/research-poster/1200/800',
            posterImageFormat: 'landscape',
            logoUrl: '/logos/comenius.svg',
            color: '#8b5cf6',
            screenshotUrl: 'https://picsum.photos/seed/research/800/600'
        }
    },
    {
        id: 'p4',
        title: 'Kita-Qualitätsentwicklung',
        slug: 'kita-quali',
        externalUrl: 'https://kita-qualitaet.de',
        departments: ['B1'],
        perspectives: ['structure', 'justice'],
        targetGroups: ['employees'],
        type: 'ground',
        staff: ['m2', 'm4'],
        shortTeaser: 'Systematische Qualitätsentwicklung für evangelische Kindertageseinrichtungen.',
        display: {
            slogan: 'Qualität, die Kinder stärkt',
            posterImage: 'https://picsum.photos/seed/quali-poster/800/1200',
            logoUrl: '/logos/kita-quali.svg',
            color: '#10b981',
            screenshotUrl: 'https://picsum.photos/seed/quali/800/600'
        }
    },
    {
        id: 'p5',
        title: 'Konfi-App',
        slug: 'konfi-app',
        externalUrl: 'https://konfi-app.de',
        departments: ['B2', 'Q3'],
        perspectives: ['digitality'],
        targetGroups: ['11-14', '15-18'],
        type: 'ground',
        staff: ['m3', 'm5'],
        shortTeaser: 'Die digitale Begleitung für die Konfirmandenzeit - interaktiv und jugendgerecht.',
        display: {
            slogan: 'Konfi goes digital',
            posterImage: 'https://picsum.photos/seed/konfi-poster/800/1200',
            logoUrl: '/logos/konfi-app.svg',
            color: '#ec4899',
            screenshotUrl: 'https://picsum.photos/seed/konfi/800/600'
        }
    },
    {
        id: 'p6',
        title: 'Ehrenamtsakademie',
        slug: 'ehrenamt-akademie',
        externalUrl: 'https://ehrenamt-akademie.de',
        departments: ['B3'],
        perspectives: ['structure', 'sustainability'],
        targetGroups: ['adults', 'volunteers'],
        type: 'ground',
        staff: ['m4'],
        shortTeaser: 'Qualifizierung und Wertschätzung für ehrenamtlich Engagierte.',
        display: {
            slogan: 'Ehrenamt verdient Bildung',
            posterImage: 'https://picsum.photos/seed/ehrenamt-poster/800/1200',
            logoUrl: '/logos/ehrenamt.svg',
            color: '#f59e0b',
            screenshotUrl: 'https://picsum.photos/seed/ehrenamt/800/600'
        }
    },
    {
        id: 'p7',
        title: 'Godly Play',
        slug: 'godly-play',
        externalUrl: 'https://godlyplay.de',
        departments: ['B1', 'B2'],
        perspectives: ['justice', 'sustainability'],
        targetGroups: ['4-6', '7-10'],
        type: 'ground',
        staff: ['m1', 'm6'],
        shortTeaser: 'Biblische Geschichten spielerisch entdecken - ein Konzept aus den USA.',
        display: {
            slogan: 'Spielend Gott entdecken',
            posterImage: 'https://picsum.photos/seed/godly-poster/800/1200',
            logoUrl: '/logos/godly-play.svg',
            color: '#6366f1',
            screenshotUrl: 'https://picsum.photos/seed/godly/800/600'
        }
    },
    {
        id: 'p8',
        title: 'Schulseelsorge-Netzwerk',
        slug: 'schulseelsorge',
        externalUrl: 'https://schulseelsorge.net',
        departments: ['B2'],
        perspectives: ['justice'],
        targetGroups: ['7-10', '11-14', '15-18', 'employees'],
        type: 'ground',
        staff: ['m5', 'm6'],
        shortTeaser: 'Unterstützung und Begleitung in schulischen Krisensituationen.',
        display: {
            slogan: 'Da sein, wenn es zählt',
            posterImage: 'https://picsum.photos/seed/seelsorge-poster/800/1200',
            logoUrl: '/logos/schulseelsorge.svg',
            color: '#14b8a6',
            screenshotUrl: 'https://picsum.photos/seed/seelsorge/800/600'
        }
    },
    {
        id: 'p9',
        title: 'Seniorenbildung digital',
        slug: 'senioren-digital',
        externalUrl: 'https://senioren-digital.de',
        departments: ['B3', 'Q3'],
        perspectives: ['digitality', 'justice'],
        targetGroups: ['seniors'],
        type: 'ground',
        staff: ['m4', 'm3'],
        shortTeaser: 'Digitale Teilhabe für die ältere Generation ermöglichen.',
        display: {
            slogan: 'Nie zu alt für Neues',
            posterImage: 'https://picsum.photos/seed/senioren-poster/800/1200',
            logoUrl: '/logos/senioren.svg',
            color: '#0891b2',
            screenshotUrl: 'https://picsum.photos/seed/senioren/800/600'
        }
    },
    {
        id: 'p10',
        title: 'Bildungsatlas',
        slug: 'bildungsatlas',
        externalUrl: 'https://bildungsatlas.de',
        departments: ['Q1'],
        perspectives: ['structure'],
        targetGroups: ['employees'],
        type: 'orbit',
        staff: ['m1'],
        shortTeaser: 'Interaktive Karte aller evangelischen Bildungseinrichtungen.',
        display: {
            slogan: 'Bildung sichtbar machen',
            posterImage: 'https://picsum.photos/seed/atlas-poster/1200/800',
            posterImageFormat: 'landscape',
            logoUrl: '/logos/bildungsatlas.svg',
            color: '#7c3aed',
            screenshotUrl: 'https://picsum.photos/seed/atlas/800/600'
        }
    },
    {
        id: 'p11',
        title: 'RU-Materialpool',
        slug: 'ru-materialpool',
        externalUrl: 'https://ru-material.de',
        departments: ['B2'],
        perspectives: ['digitality', 'sustainability'],
        targetGroups: ['employees'],
        type: 'ground',
        staff: ['m5'],
        shortTeaser: 'Umfangreiche Materialsammlung für den Religionsunterricht.',
        display: {
            slogan: 'Material für guten Unterricht',
            posterImage: 'https://picsum.photos/seed/material-poster/800/1200',
            logoUrl: '/logos/ru-material.svg',
            color: '#059669',
            screenshotUrl: 'https://picsum.photos/seed/material/800/600'
        }
    },
    {
        id: 'p12',
        title: 'Erasmus+ Partnerschaft',
        slug: 'erasmus-partner',
        externalUrl: 'https://erasmus-religion.eu',
        departments: ['Q2'],
        perspectives: ['sustainability'],
        targetGroups: ['young-adults', 'employees'],
        type: 'orbit',
        staff: ['m6', 'm1'],
        shortTeaser: 'Europäische Zusammenarbeit in der religiösen Bildung.',
        display: {
            slogan: 'Bildung ohne Grenzen',
            posterImage: 'https://picsum.photos/seed/erasmus-poster/1200/800',
            posterImageFormat: 'landscape',
            logoUrl: '/logos/erasmus.svg',
            color: '#2563eb',
            screenshotUrl: 'https://picsum.photos/seed/erasmus/800/600'
        }
    },
    {
        id: 'p13',
        title: 'Ökumenisches Lernen',
        slug: 'oekumene-lernen',
        externalUrl: 'https://oekumene-lernen.de',
        departments: ['Q2'],
        perspectives: ['justice', 'sustainability'],
        targetGroups: ['adults', 'employees'],
        type: 'ground',
        staff: ['m6'],
        shortTeaser: 'Interreligiöser und interkonfessioneller Dialog in der Bildung.',
        display: {
            slogan: 'Vielfalt verbindet',
            posterImage: 'https://picsum.photos/seed/oekumene-poster/800/1200',
            logoUrl: '/logos/oekumene.svg',
            color: '#ca8a04',
            screenshotUrl: 'https://picsum.photos/seed/oekumene/800/600'
        }
    },
    {
        id: 'p14',
        title: 'KI-Werkstatt Bildung',
        slug: 'ki-werkstatt',
        externalUrl: 'https://ki-werkstatt.de',
        departments: ['Q3'],
        perspectives: ['digitality'],
        targetGroups: ['employees'],
        type: 'ground',
        staff: ['m3'],
        shortTeaser: 'Praktische Anwendung von KI-Tools in der Bildungsarbeit.',
        display: {
            slogan: 'KI verstehen und nutzen',
            posterImage: 'https://picsum.photos/seed/ki-poster/800/1200',
            logoUrl: '/logos/ki-werkstatt.svg',
            color: '#06b6d4',
            screenshotUrl: 'https://picsum.photos/seed/ki/800/600'
        }
    },
    {
        id: 'p15',
        title: 'Datenschutz-Helpdesk',
        slug: 'datenschutz-help',
        externalUrl: 'https://datenschutz-kirche.de',
        departments: ['Q3'],
        perspectives: ['structure', 'digitality'],
        targetGroups: ['employees'],
        type: 'ground',
        staff: ['m3', 'm4'],
        shortTeaser: 'Beratung und Unterstützung bei Datenschutzfragen.',
        display: {
            slogan: 'Sicher digital arbeiten',
            posterImage: 'https://picsum.photos/seed/dsgvo-poster/800/1200',
            logoUrl: '/logos/datenschutz.svg',
            color: '#dc2626',
            screenshotUrl: 'https://picsum.photos/seed/dsgvo/800/600'
        }
    }
];

// ============================================================================
// MITARBEITER (6 Personen)
// ============================================================================

export const mockStaff: StaffMember[] = [
    {
        id: 'm1',
        name: 'Dr. Maria Schmidt',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        role: 'Wissenschaftliche Leitung',
        email: 'schmidt@comenius.de'
    },
    {
        id: 'm2',
        name: 'Thomas Weber',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        role: 'Pädagogischer Referent Kita',
        email: 'weber@comenius.de'
    },
    {
        id: 'm3',
        name: 'Julia Becker',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        role: 'Digitalbeauftragte',
        email: 'becker@comenius.de'
    },
    {
        id: 'm4',
        name: 'Michael Hoffmann',
        avatarUrl: 'https://i.pravatar.cc/150?img=4',
        role: 'Referent Erwachsenenbildung',
        email: 'hoffmann@comenius.de'
    },
    {
        id: 'm5',
        name: 'Sarah Klein',
        avatarUrl: 'https://i.pravatar.cc/150?img=5',
        role: 'Referentin Schule & Jugend',
        email: 'klein@comenius.de'
    },
    {
        id: 'm6',
        name: 'Dr. Andreas Müller',
        avatarUrl: 'https://i.pravatar.cc/150?img=6',
        role: 'Referent Europa & Ökumene',
        email: 'mueller@comenius.de'
    }
];

// ============================================================================
// PLATTFORM-INHALTE (6 Plattformen)
// ============================================================================

export const mockPlatformContents: Record<string, PlatformContent> = {
    B1: {
        id: 'B1',
        title: 'Frühkindliche Bildung',
        short: 'Kita',
        description: 'Religiöse Bildung für Kinder von 0-6 Jahren',
        aspects: [
            { id: 'b1-a1', title: 'Religiöse Bildung', icon: '🙏', description: 'Grundlagen religiöser Erziehung im Kita-Alter', contentUrl: '/content/b1-religioes.html' },
            { id: 'b1-a2', title: 'Spielerisches Lernen', icon: '🎮', description: 'Spielbasierte pädagogische Konzepte', contentUrl: '/content/b1-spielen.html' },
            { id: 'b1-a3', title: 'Elternarbeit', icon: '👨‍👩‍👧', description: 'Zusammenarbeit mit Familien', contentUrl: '/content/b1-eltern.html' },
            { id: 'b1-a4', title: 'Inklusion', icon: '🤝', description: 'Vielfalt als Bereicherung', contentUrl: '/content/b1-inklusion.html' },
            { id: 'b1-a5', title: 'Fachkräfte', icon: '👩‍🏫', description: 'Fortbildung und Qualifizierung', contentUrl: '/content/b1-fachkraefte.html' }
        ],
        wallPosters: ['p1', 'p4', 'p7'],
        boothProjects: ['p1', 'p4']
    },
    B2: {
        id: 'B2',
        title: 'Schule & Jugend',
        short: 'Schule',
        description: 'Bildungsangebote für Schule und Jugendarbeit',
        aspects: [
            { id: 'b2-a1', title: 'Konfirmandenarbeit', icon: '⛪', description: 'Begleitung junger Menschen im Glauben', contentUrl: '/content/b2-konfi.html' },
            { id: 'b2-a2', title: 'Schulseelsorge', icon: '💚', description: 'Unterstützung in schulischen Krisen', contentUrl: '/content/b2-seelsorge.html' },
            { id: 'b2-a3', title: 'Jugendarbeit', icon: '🎸', description: 'Freizeitangebote und Gemeinschaft', contentUrl: '/content/b2-jugend.html' },
            { id: 'b2-a4', title: 'Religionsunterricht', icon: '📖', description: 'Didaktik und Methodik', contentUrl: '/content/b2-ru.html' },
            { id: 'b2-a5', title: 'Medienkompetenz', icon: '📱', description: 'Digitale Bildung für Jugendliche', contentUrl: '/content/b2-medien.html' }
        ],
        wallPosters: ['p5', 'p8'],
        boothProjects: ['p5', 'p8', 'p11']
    },
    B3: {
        id: 'B3',
        title: 'Erwachsenenbildung',
        short: 'Erwachsene',
        description: 'Fortbildung und Lebenslanges Lernen',
        aspects: [
            { id: 'b3-a1', title: 'Gemeindebildung', icon: '🏛️', description: 'Bildungsangebote in Kirchengemeinden', contentUrl: '/content/b3-gemeinde.html' },
            { id: 'b3-a2', title: 'Ehrenamtliche', icon: '🤲', description: 'Qualifizierung freiwillig Engagierter', contentUrl: '/content/b3-ehrenamt.html' },
            { id: 'b3-a3', title: 'Seniorenarbeit', icon: '👴', description: 'Bildung im dritten Lebensabschnitt', contentUrl: '/content/b3-senioren.html' },
            { id: 'b3-a4', title: 'Familienbildung', icon: '👪', description: 'Angebote für die ganze Familie', contentUrl: '/content/b3-familie.html' },
            { id: 'b3-a5', title: 'Berufliche Bildung', icon: '💼', description: 'Fortbildung für Hauptamtliche', contentUrl: '/content/b3-beruf.html' }
        ],
        wallPosters: ['p2', 'p6', 'p9'],
        boothProjects: ['p2', 'p6', 'p9']
    },
    Q1: {
        id: 'Q1',
        title: 'Forschung',
        short: 'Forschung',
        description: 'Wissenschaftliche Studien und Publikationen',
        aspects: [
            { id: 'q1-a1', title: 'Empirische Forschung', icon: '📊', description: 'Datenbasierte Studien zur Bildung', contentUrl: '/content/q1-empirisch.html' },
            { id: 'q1-a2', title: 'Bildungsmonitoring', icon: '📈', description: 'Kontinuierliche Beobachtung des Bildungssystems', contentUrl: '/content/q1-monitoring.html' },
            { id: 'q1-a3', title: 'Publikationen', icon: '📚', description: 'Wissenschaftliche Veröffentlichungen', contentUrl: '/content/q1-publikationen.html' },
            { id: 'q1-a4', title: 'Kooperationen', icon: '🤝', description: 'Zusammenarbeit mit Hochschulen', contentUrl: '/content/q1-kooperation.html' },
            { id: 'q1-a5', title: 'Transfer', icon: '🔄', description: 'Wissenstransfer in die Praxis', contentUrl: '/content/q1-transfer.html' }
        ],
        wallPosters: ['p3', 'p10'],
        boothProjects: ['p3', 'p10']
    },
    Q2: {
        id: 'Q2',
        title: 'Europa & Internationales',
        short: 'Europa',
        description: 'Internationale Kooperationen und EU-Projekte',
        aspects: [
            { id: 'q2-a1', title: 'EU-Projekte', icon: '🇪🇺', description: 'Erasmus+ und andere Förderprogramme', contentUrl: '/content/q2-eu.html' },
            { id: 'q2-a2', title: 'Ökumene', icon: '🌍', description: 'Interkirchliche Zusammenarbeit', contentUrl: '/content/q2-oekumene.html' },
            { id: 'q2-a3', title: 'Partnerschaften', icon: '🤝', description: 'Internationale Bildungspartnerschaften', contentUrl: '/content/q2-partner.html' },
            { id: 'q2-a4', title: 'Austausch', icon: '✈️', description: 'Begegnungsprogramme', contentUrl: '/content/q2-austausch.html' },
            { id: 'q2-a5', title: 'Mehrsprachigkeit', icon: '🗣️', description: 'Sprachförderung und Interkulturalität', contentUrl: '/content/q2-sprache.html' }
        ],
        wallPosters: ['p12', 'p13'],
        boothProjects: ['p12', 'p13']
    },
    Q3: {
        id: 'Q3',
        title: 'Digitalisierung',
        short: 'Digital',
        description: 'Digitale Transformation und E-Learning',
        aspects: [
            { id: 'q3-a1', title: 'E-Learning', icon: '💻', description: 'Digitale Lernplattformen', contentUrl: '/content/q3-elearning.html' },
            { id: 'q3-a2', title: 'KI in der Bildung', icon: '🤖', description: 'Künstliche Intelligenz als Werkzeug', contentUrl: '/content/q3-ki.html' },
            { id: 'q3-a3', title: 'Datenschutz', icon: '🔒', description: 'Sicherer Umgang mit Daten', contentUrl: '/content/q3-datenschutz.html' },
            { id: 'q3-a4', title: 'Tools & Apps', icon: '📲', description: 'Digitale Werkzeuge für die Praxis', contentUrl: '/content/q3-tools.html' },
            { id: 'q3-a5', title: 'Medienpädagogik', icon: '🎬', description: 'Kritischer Umgang mit Medien', contentUrl: '/content/q3-medienpaed.html' }
        ],
        wallPosters: ['p2', 'p14', 'p15'],
        boothProjects: ['p2', 'p14', 'p15']
    }
};

// ============================================================================
// MARKTPLATZ (S-PLATTFORM)
// ============================================================================

export const mockMarketplace: MarketplaceContent = {
    id: 'S',
    stands: [
        {
            id: 's-institut',
            title: 'Comenius-Institut',
            type: 'institution',
            icon: '🏛️',
            description: 'Evangelische Arbeitsstätte für Erziehungswissenschaft e.V. – Ihr Kompetenzzentrum für religiöse Bildung seit 1954.',
            display: {
                color: '#1e40af',
                logoUrl: '/logos/comenius.svg',
                bannerImage: 'https://picsum.photos/seed/comenius-banner/1200/400'
            },
            chatWebhook: 'https://n8n.comenius.de/webhook/ci-chat',
            externalUrl: 'https://comenius.de'
        },
        {
            id: 's-publications',
            title: 'Publikationen & News',
            type: 'publications',
            icon: '📚',
            description: 'Aktuelle Veröffentlichungen, Neuigkeiten und Forschungsergebnisse aus dem Comenius-Institut.',
            display: {
                color: '#059669',
                logoUrl: '/logos/publikationen.svg',
                bannerImage: 'https://picsum.photos/seed/publications-banner/1200/400'
            },
            rssFeedUrls: [
                'https://comenius.de/feed/',
                'https://comenius.de/publikationen/feed/'
            ],
            externalUrl: 'https://comenius.de/publikationen'
        },
        {
            id: 's-events',
            title: 'Veranstaltungen',
            type: 'events',
            icon: '📅',
            description: 'Aktuelle Termine, Tagungen, Fortbildungen und Workshops des Comenius-Instituts.',
            display: {
                color: '#dc2626',
                logoUrl: '/logos/events.svg',
                bannerImage: 'https://picsum.photos/seed/events-banner/1200/400'
            },
            calendarUrl: 'https://comenius.de/termine/events.ics',
            externalUrl: 'https://comenius.de/termine'
        }
    ],
    wallPosters: [
        {
            id: 'leitlinie-justice',
            title: 'Gerechtigkeit',
            imageUrl: 'https://picsum.photos/seed/leitlinie-justice/800/1200',
            perspective: 'justice',
            position: 0
        },
        {
            id: 'leitlinie-sustainability',
            title: 'Nachhaltigkeit',
            imageUrl: 'https://picsum.photos/seed/leitlinie-sustainability/800/1200',
            perspective: 'sustainability',
            position: 1
        },
        {
            id: 'leitlinie-digitality',
            title: 'Digitalität',
            imageUrl: 'https://picsum.photos/seed/leitlinie-digitality/800/1200',
            perspective: 'digitality',
            position: 2
        },
        {
            id: 'leitlinie-structure',
            title: 'Strukturen',
            imageUrl: 'https://picsum.photos/seed/leitlinie-structure/800/1200',
            perspective: 'structure',
            position: 3
        }
    ]
};

// ============================================================================
// KOMBINIERTE WORLD DATA
// ============================================================================

export const mockWorldData: WorldData = {
    platforms: mockPlatformContents,
    marketplace: mockMarketplace,
    projects: mockProjects,
    staff: mockStaff
};

// ============================================================================
// HELPER FUNKTIONEN
// ============================================================================

/** Projekt nach ID finden */
export function getProjectById(id: string): ProjectData | undefined {
    return mockProjects.find(p => p.id === id);
}

/** Mitarbeiter nach ID finden */
export function getStaffById(id: string): StaffMember | undefined {
    return mockStaff.find(s => s.id === id);
}

/** Alle Projekte einer Plattform (basierend auf departments) */
export function getProjectsForPlatform(platformId: string): ProjectData[] {
    return mockProjects.filter(p => p.departments.includes(platformId as Department));
}

/** Plattform-Content nach ID */
export function getPlatformContent(platformId: string): PlatformContent | undefined {
    return mockPlatformContents[platformId];
}

/** Booth-Projekte einer Plattform mit vollständigen Daten */
export function getBoothProjectsForPlatform(platformId: string): ProjectData[] {
    const content = mockPlatformContents[platformId];
    if (!content) return [];
    return content.boothProjects
        .map(id => getProjectById(id))
        .filter((p): p is ProjectData => p !== undefined);
}

/** Wall-Poster einer Plattform mit vollständigen Projektdaten (Position = Array-Index) */
export function getWallPostersForPlatform(platformId: string): Array<{ project: ProjectData; position: number }> {
    const content = mockPlatformContents[platformId];
    if (!content) return [];
    return content.wallPosters
        .map((projectId, index) => {
            const project = getProjectById(projectId);
            return project ? { project, position: index } : null;
        })
        .filter((item): item is { project: ProjectData; position: number } => item !== null);
}

// ============================================================================
// MARKTPLATZ HELPER FUNKTIONEN
// ============================================================================

/** Alle Stände auf dem Marktplatz */
export function getMarketplaceStands(): MarketplaceStand[] {
    return mockMarketplace.stands;
}

/** Stand nach ID finden */
export function getMarketplaceStandById(id: string): MarketplaceStand | undefined {
    return mockMarketplace.stands.find(s => s.id === id);
}

/** Marktplatz-Inhalte abrufen */
export function getMarketplaceContent(): MarketplaceContent {
    return mockMarketplace;
}

/** Leitlinien-Poster vom Marktplatz */
export function getMarketplaceWallPosters() {
    return mockMarketplace.wallPosters;
}
