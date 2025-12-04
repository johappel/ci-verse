import type { ProjectData, StaffMember, PlatformContent, WorldData, Department, MarketplaceContent, MarketplaceStand, PartnerConnection } from '../types/project';

// ============================================================================
// PARTNER-EINRICHTUNGEN (Nexus Terminal)
// ============================================================================

export const partnerConnections: PartnerConnection[] = [
    {
        id: 'bmbf',
        name: 'Bundesministerium für Bildung und Forschung',
        shortName: 'BMBF Berlin',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bundesministerium_f%C3%BCr_Bildung_und_Forschung_Logo.svg/320px-Bundesministerium_f%C3%BCr_Bildung_und_Forschung_Logo.svg.png',
        color: '#003366',
        url: 'https://www.bmbf.de',
        category: 'ministry'
    },
    {
        id: 'ekd',
        name: 'Evangelische Kirche in Deutschland',
        shortName: 'EKD Hannover',
        logoUrl: 'https://www.ekd.de/system/images/logo_small/logo-ekd.png',
        color: '#7c3aed',
        url: 'https://www.ekd.de',
        category: 'church'
    },
    {
        id: 'eu',
        name: 'Europäische Kommission',
        shortName: 'EU Brüssel',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/320px-Flag_of_Europe.svg.png',
        color: '#003399',
        url: 'https://ec.europa.eu',
        category: 'international'
    },
    {
        id: 'alpika',
        name: 'ALPIKA - Arbeitsgemeinschaft der Pädagogischen Institute',
        shortName: 'ALPIKA',
        logoUrl: 'https://alpika.de/wp-content/uploads/2020/07/alpika-logo.png',
        color: '#059669',
        url: 'https://alpika.de',
        category: 'institute'
    },
    {
        id: 'eftre',
        name: 'European Forum for Teachers of Religious Education',
        shortName: 'EFTRE Europa',
        logoUrl: 'https://www.eftre.net/wp-content/uploads/2019/09/eftre-logo.png',
        color: '#0284c7',
        url: 'https://www.eftre.net',
        category: 'international'
    },
    {
        id: 'gpm',
        name: 'Gesellschaft für Religionspädagogik',
        shortName: 'GPM e.V.',
        logoUrl: 'https://www.gfrp.de/images/logo.png',
        color: '#ea580c',
        url: 'https://www.gfrp.de',
        category: 'association'
    },
    {
        id: 'uni-goettingen',
        name: 'Georg-August-Universität Göttingen',
        shortName: 'Uni Göttingen',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Uni_G%C3%B6ttingen_Siegel.svg/200px-Uni_G%C3%B6ttingen_Siegel.svg.png',
        color: '#00447c',
        url: 'https://www.uni-goettingen.de',
        category: 'university'
    },
    {
        id: 'hochschulverband',
        name: 'Evangelischer Hochschulverband',
        shortName: 'EHV',
        logoUrl: 'https://www.ekd.de/system/images/logo_small/logo-ekd.png',
        color: '#6366f1',
        url: 'https://www.ev-hochschularbeit.de',
        category: 'association'
    }
];

/** Zufällige Partner-Connection für Fahrplan */
export function getRandomPartner(): PartnerConnection {
    return partnerConnections[Math.floor(Math.random() * partnerConnections.length)];
}

/** Partner nach ID finden */
export function getPartnerById(id: string): PartnerConnection | undefined {
    return partnerConnections.find(p => p.id === id);
}

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
        displayType: 'booth',
        staff: ['m1', 'm2'],
        shortTeaser: 'Religiöse Bildung für die Kleinsten - spielerisch, respektvoll, entwicklungsgerecht.',
        display: {
            slogan: 'Glaube entdecken von Anfang an',
            posterImage: 'https://picsum.photos/seed/kita-poster/800/1200',
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
        displayType: 'both',
        staff: ['m3'],
        shortTeaser: 'Moderne Tools für die Gemeindearbeit - effizient, transparent und zukunftsorientiert.',
        display: {
            slogan: 'Gemeinde digital gestalten',
            posterImage: 'https://picsum.photos/seed/digital-poster/800/1200',
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
        displayType: 'wall',
        staff: ['m1'],
        shortTeaser: 'Evidenzbasierte Forschung zur evangelischen Bildungslandschaft in Deutschland.',
        display: {
            slogan: 'Wissen schafft Bildung',
            posterImage: 'https://picsum.photos/seed/research-poster/1200/800',
            posterImageFormat: 'landscape',
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
        displayType: 'booth',
        staff: ['m2', 'm4'],
        shortTeaser: 'Systematische Qualitätsentwicklung für evangelische Kindertageseinrichtungen.',
        display: {
            slogan: 'Qualität, die Kinder stärkt',
            posterImage: 'https://picsum.photos/seed/quali-poster/800/1200',
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
        relatedDepartments: ['B3'],
        perspectives: ['digitality'],
        targetGroups: ['11-14', '15-18'],
        displayType: 'both',
        staff: ['m3', 'm5'],
        shortTeaser: 'Die digitale Begleitung für die Konfirmandenzeit - interaktiv und jugendgerecht.',
        display: {
            slogan: 'Konfi goes digital',
            posterImage: 'https://picsum.photos/seed/konfi-poster/800/1200',
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
        displayType: 'booth',
        staff: ['m4'],
        shortTeaser: 'Qualifizierung und Wertschätzung für ehrenamtlich Engagierte.',
        display: {
            slogan: 'Ehrenamt verdient Bildung',
            posterImage: 'https://picsum.photos/seed/ehrenamt-poster/800/1200',
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
        relatedDepartments: ['Q1'],
        perspectives: ['justice', 'sustainability'],
        targetGroups: ['4-6', '7-10'],
        displayType: 'wall',
        staff: ['m1', 'm6'],
        shortTeaser: 'Biblische Geschichten spielerisch entdecken - ein Konzept aus den USA.',
        display: {
            slogan: 'Spielend Gott entdecken',
            posterImage: 'https://picsum.photos/seed/godly-poster/800/1200',
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
        displayType: 'both',
        staff: ['m5', 'm6'],
        shortTeaser: 'Unterstützung und Begleitung in schulischen Krisensituationen.',
        display: {
            slogan: 'Da sein, wenn es zählt',
            posterImage: 'https://picsum.photos/seed/seelsorge-poster/800/1200',
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
        relatedDepartments: ['B2'],
        perspectives: ['digitality', 'justice'],
        targetGroups: ['seniors'],
        displayType: 'booth',
        staff: ['m4', 'm3'],
        shortTeaser: 'Digitale Teilhabe für die ältere Generation ermöglichen.',
        display: {
            slogan: 'Nie zu alt für Neues',
            posterImage: 'https://picsum.photos/seed/senioren-poster/800/1200',
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
        displayType: 'wall',
        staff: ['m1'],
        shortTeaser: 'Interaktive Karte aller evangelischen Bildungseinrichtungen.',
        display: {
            slogan: 'Bildung sichtbar machen',
            posterImage: 'https://picsum.photos/seed/atlas-poster/1200/800',
            posterImageFormat: 'landscape',
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
        displayType: 'booth',
        staff: ['m5'],
        shortTeaser: 'Umfangreiche Materialsammlung für den Religionsunterricht.',
        display: {
            slogan: 'Material für guten Unterricht',
            posterImage: 'https://picsum.photos/seed/material-poster/800/1200',
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
        displayType: 'wall',
        staff: ['m6', 'm1'],
        shortTeaser: 'Europäische Zusammenarbeit in der religiösen Bildung.',
        display: {
            slogan: 'Bildung ohne Grenzen',
            posterImage: 'https://picsum.photos/seed/erasmus-poster/1200/800',
            posterImageFormat: 'landscape',
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
        displayType: 'booth',
        staff: ['m6'],
        shortTeaser: 'Interreligiöser und interkonfessioneller Dialog in der Bildung.',
        display: {
            slogan: 'Vielfalt verbindet',
            posterImage: 'https://picsum.photos/seed/oekumene-poster/800/800',
            color: '#ca8a04',
            posterImageFormat: 'square',
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
        displayType: 'booth',
        staff: ['m3'],
        shortTeaser: 'Praktische Anwendung von KI-Tools in der Bildungsarbeit.',
        display: {
            slogan: 'KI verstehen und nutzen',
            posterImage: 'https://picsum.photos/seed/ki-poster/800/1200',
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
        displayType: 'both',
        staff: ['m3', 'm4'],
        shortTeaser: 'Beratung und Unterstützung bei Datenschutzfragen.',
        display: {
            slogan: 'Sicher digital arbeiten',
            posterImage: 'https://picsum.photos/seed/dsgvo-poster/800/1200',
            color: '#dc2626',
            screenshotUrl: 'https://picsum.photos/seed/dsgvo/800/600'
        }
    },
    {
        id: 'p16',
        title: 'rpi-virtuell.de',
        slug: 'rpi-virtuell',
        externalUrl: 'https://rpi-virtuell.de',
        departments: ['Q3'],
        perspectives: ['structure', 'digitality'],
        targetGroups: ['Religionspädagog*innen', 'Wissenschaftler*innen', 'Praxiserprobte'],
        displayType: 'wall',
        staff: ['m4'],
        shortTeaser: 'rpi-virtuell ist eine digitale Plattform für Lehr- und Fachkräfte, Wissenschaft und Praxis der religionsbezogenen Bildung, die eine kuratierte Materialiensammlung, die Möglichkeit zum Austausch und zur Vernetzung in Communities sowie regelmäßige Updates bietet.',
        display: {
            slogan: 'Digitalität in der Religionspädagogik',
            posterImage: '/assets/images/rpi-dechow-lohrer-dekt-2023.png',
            color: '#16a34a',
            screenshotUrl: 'https://news.rpi-virtuell.de/wp-content/uploads/2023/06/grafik-2.png'
        }
    },
    {
        id: 'p17',
        title: 'Digital Labs',
        slug: 'digital-labs',
        externalUrl: 'https://digital-labs.de',
        departments: ['Q3'],
        perspectives: ['digitality', 'sustainability'],
        targetGroups: ['employees'],
        displayType: 'booth',
        staff: ['m3'],
        shortTeaser: 'Experimentierräume für digitale Innovation in der Bildungsarbeit.',
        display: {
            slogan: 'Zukunft ausprobieren',
            posterImage: 'https://picsum.photos/seed/labs-poster/800/1200',
            color: '#8b5cf6',
            screenshotUrl: 'https://picsum.photos/seed/labs/800/600'
        }
    },
    {
        id: 'p18',
        title: 'Cloud-Infrastruktur',
        slug: 'cloud-infra',
        externalUrl: 'https://cloud-kirche.de',
        departments: ['Q3'],
        perspectives: ['digitality', 'structure'],
        targetGroups: ['employees'],
        displayType: 'wall',
        staff: ['m3', 'm4'],
        shortTeaser: 'Sichere und datenschutzkonforme Cloud-Lösungen für kirchliche Einrichtungen.',
        display: {
            slogan: 'In der Cloud, geerdet',
            posterImage: 'https://picsum.photos/seed/cloud-poster/1200/800',
            posterImageFormat: 'landscape',
            color: '#0ea5e9',
            screenshotUrl: 'https://picsum.photos/seed/cloud/800/600'
        }
    },
    {
        id: 'p19',
        title: 'Webinar-Plattform',
        slug: 'webinar-platform',
        externalUrl: 'https://webinar.comenius.de',
        departments: ['Q3'],
        perspectives: ['digitality'],
        targetGroups: ['employees', 'adults'],
        displayType: 'booth',
        staff: ['m3'],
        shortTeaser: 'Professionelle Online-Fortbildungen und virtuelle Veranstaltungen.',
        display: {
            slogan: 'Lernen ohne Grenzen',
            posterImage: 'https://picsum.photos/seed/webinar-poster/800/1200',
            color: '#f59e0b',
            screenshotUrl: 'https://picsum.photos/seed/webinar/800/600'
        }
    },
    {
        id: 'p20',
        title: 'Barrierefreie Medien',
        slug: 'accessibility-media',
        externalUrl: 'https://barrierefrei-medien.de',
        departments: ['Q3'],
        perspectives: ['digitality', 'justice'],
        targetGroups: ['employees'],
        displayType: 'wall',
        staff: ['m4'],
        shortTeaser: 'Digitale Bildungsmedien für alle zugänglich machen.',
        display: {
            slogan: 'Teilhabe digital',
            posterImage: 'https://picsum.photos/seed/access-poster/800/1200',
            color: '#14b8a6',
            screenshotUrl: 'https://picsum.photos/seed/access/800/600'
        }
    },
    {
        id: 'p21',
        title: 'Social Media Pastoral',
        slug: 'social-media-pastoral',
        externalUrl: 'https://social-pastoral.de',
        departments: ['Q3'],
        perspectives: ['digitality'],
        targetGroups: ['employees', 'young-adults'],
        displayType: 'booth',
        staff: ['m3', 'm5'],
        shortTeaser: 'Seelsorge und Verkündigung in sozialen Netzwerken.',
        display: {
            slogan: 'Nah bei den Menschen',
            posterImage: 'https://picsum.photos/seed/social-poster/800/1200',
            color: '#ec4899',
            screenshotUrl: 'https://picsum.photos/seed/social/800/600'
        }
    },
    {
        id: 'p22',
        title: 'VR-Kirchenraum',
        slug: 'vr-kirchenraum',
        externalUrl: 'https://vr-kirche.de',
        departments: ['Q3'],
        perspectives: ['digitality', 'sustainability'],
        targetGroups: ['employees', 'young-adults'],
        displayType: 'both',
        staff: ['m3'],
        shortTeaser: 'Virtuelle Realität für spirituelle Erfahrungen und Kirchenpädagogik.',
        display: {
            slogan: 'Räume neu erleben',
            posterImage: 'https://picsum.photos/seed/vr-poster/800/1200',
            color: '#a855f7',
            screenshotUrl: 'https://picsum.photos/seed/vr/800/600'
        }
    },
    {
        id: 'p23',
        title: 'Podcast-Studio',
        slug: 'podcast-studio',
        externalUrl: 'https://podcast.comenius.de',
        departments: ['Q3'],
        perspectives: ['digitality'],
        targetGroups: ['employees'],
        displayType: 'wall',
        staff: ['m3', 'm6'],
        shortTeaser: 'Professionelle Podcast-Produktion für kirchliche und pädagogische Inhalte.',
        display: {
            slogan: 'Hörbar Glauben',
            posterImage: 'https://picsum.photos/seed/podcast-poster/800/800',
            posterImageFormat: 'square',
            color: '#f97316',
            screenshotUrl: 'https://picsum.photos/seed/podcast/800/600'
        }
    },
    {
        id: 'p24',
        title: 'Coding für Kirche',
        slug: 'coding-kirche',
        externalUrl: 'https://coding-kirche.de',
        departments: ['Q3'],
        perspectives: ['digitality', 'structure'],
        targetGroups: ['employees', 'young-adults'],
        displayType: 'booth',
        staff: ['m3'],
        shortTeaser: 'Programmier-Workshops und digitale Kompetenzen für kirchliche Mitarbeitende.',
        display: {
            slogan: 'Code mit Sinn',
            posterImage: 'https://picsum.photos/seed/coding-poster/800/1200',
            color: '#10b981',
            screenshotUrl: 'https://picsum.photos/seed/coding/800/600'
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
        color: '#fcd34d',      // Amber
        glowColor: '#fde68a',
        aspects: [
            { id: 'b1-a1', title: 'Religiöse Bildung', icon: '🙏', description: 'Grundlagen religiöser Erziehung im Kita-Alter', contentUrl: '/content/b1-religioes.html' },
            { id: 'b1-a2', title: 'Spielerisches Lernen', icon: '🎮', description: 'Spielbasierte pädagogische Konzepte', contentUrl: '/content/b1-spielen.html' },
            { id: 'b1-a3', title: 'Elternarbeit', icon: '👨‍👩‍👧', description: 'Zusammenarbeit mit Familien', contentUrl: '/content/b1-eltern.html' },
            { id: 'b1-a4', title: 'Inklusion', icon: '🤝', description: 'Vielfalt als Bereicherung', contentUrl: '/content/b1-inklusion.html' },
            { id: 'b1-a5', title: 'Fachkräfte', icon: '👩‍🏫', description: 'Fortbildung und Qualifizierung', contentUrl: '/content/b1-fachkraefte.html' }
        ]
    },
    B2: {
        id: 'B2',
        title: 'Schule & Jugend',
        short: 'Schule',
        description: 'Bildungsangebote für Schule und Jugendarbeit',
        color: '#fb923c',      // Orange
        glowColor: '#fdba74',
        aspects: [
            { id: 'b2-a1', title: 'Konfirmandenarbeit', icon: '⛪', description: 'Begleitung junger Menschen im Glauben', contentUrl: '/content/b2-konfi.html' },
            { id: 'b2-a2', title: 'Schulseelsorge', icon: '💚', description: 'Unterstützung in schulischen Krisen', contentUrl: '/content/b2-seelsorge.html' },
            { id: 'b2-a3', title: 'Jugendarbeit', icon: '🎸', description: 'Freizeitangebote und Gemeinschaft', contentUrl: '/content/b2-jugend.html' },
            { id: 'b2-a4', title: 'Religionsunterricht', icon: '📖', description: 'Didaktik und Methodik', contentUrl: '/content/b2-ru.html' },
            { id: 'b2-a5', title: 'Medienkompetenz', icon: '📱', description: 'Digitale Bildung für Jugendliche', contentUrl: '/content/b2-medien.html' }
        ]
    },
    B3: {
        id: 'B3',
        title: 'Erwachsenenbildung',
        short: 'Erwachsene',
        description: 'Fortbildung und Lebenslanges Lernen',
        color: '#f87171',      // Red
        glowColor: '#fca5a5',
        aspects: [
            { id: 'b3-a1', title: 'Gemeindebildung', icon: '🏛️', description: 'Bildungsangebote in Kirchengemeinden', contentUrl: '/content/b3-gemeinde.html' },
            { id: 'b3-a2', title: 'Ehrenamtliche', icon: '🤲', description: 'Qualifizierung freiwillig Engagierter', contentUrl: '/content/b3-ehrenamt.html' },
            { id: 'b3-a3', title: 'Seniorenarbeit', icon: '👴', description: 'Bildung im dritten Lebensabschnitt', contentUrl: '/content/b3-senioren.html' },
            { id: 'b3-a4', title: 'Familienbildung', icon: '👪', description: 'Angebote für die ganze Familie', contentUrl: '/content/b3-familie.html' },
            { id: 'b3-a5', title: 'Berufliche Bildung', icon: '💼', description: 'Fortbildung für Hauptamtliche', contentUrl: '/content/b3-beruf.html' }
        ]
    },
    Q1: {
        id: 'Q1',
        title: 'Forschung',
        short: 'Forschung',
        description: 'Wissenschaftliche Studien und Publikationen',
        color: '#a78bfa',      // Violet
        glowColor: '#c4b5fd',
        aspects: [
            { id: 'q1-a1', title: 'Empirische Forschung', icon: '📊', description: 'Datenbasierte Studien zur Bildung', contentUrl: '/content/q1-empirisch.html' },
            { id: 'q1-a2', title: 'Bildungsmonitoring', icon: '📈', description: 'Kontinuierliche Beobachtung des Bildungssystems', contentUrl: '/content/q1-monitoring.html' },
            { id: 'q1-a3', title: 'Publikationen', icon: '📚', description: 'Wissenschaftliche Veröffentlichungen', contentUrl: '/content/q1-publikationen.html' },
            { id: 'q1-a4', title: 'Kooperationen', icon: '🤝', description: 'Zusammenarbeit mit Hochschulen', contentUrl: '/content/q1-kooperation.html' },
            { id: 'q1-a5', title: 'Transfer', icon: '🔄', description: 'Wissenstransfer in die Praxis', contentUrl: '/content/q1-transfer.html' }
        ]
    },
    Q2: {
        id: 'Q2',
        title: 'Europa & Internationales',
        short: 'Europa',
        description: 'Internationale Kooperationen und EU-Projekte',
        color: '#fbbf24',      // Yellow
        glowColor: '#fcd34d',
        aspects: [
            { id: 'q2-a1', title: 'EU-Projekte', icon: '🇪🇺', description: 'Erasmus+ und andere Förderprogramme', contentUrl: '/content/q2-eu.html' },
            { id: 'q2-a2', title: 'Ökumene', icon: '🌍', description: 'Interkirchliche Zusammenarbeit', contentUrl: '/content/q2-oekumene.html' },
            { id: 'q2-a3', title: 'Partnerschaften', icon: '🤝', description: 'Internationale Bildungspartnerschaften', contentUrl: '/content/q2-partner.html' },
            { id: 'q2-a4', title: 'Austausch', icon: '✈️', description: 'Begegnungsprogramme', contentUrl: '/content/q2-austausch.html' },
            { id: 'q2-a5', title: 'Mehrsprachigkeit', icon: '🗣️', description: 'Sprachförderung und Interkulturalität', contentUrl: '/content/q2-sprache.html' }
        ]
    },
    Q3: {
        id: 'Q3',
        title: 'Digitalisierung',
        short: 'Digital',
        description: 'Digitale Transformation und E-Learning',
        color: '#22d3ee',      // Cyan
        glowColor: '#67e8f9',
        aspects: [
            { id: 'q3-a1', title: 'E-Learning', icon: '💻', description: 'Digitale Lernplattformen', contentUrl: '/content/q3-elearning.html' },
            { id: 'q3-a2', title: 'KI in der Bildung', icon: '🤖', description: 'Künstliche Intelligenz als Werkzeug', contentUrl: '/content/q3-ki.html' },
            { id: 'q3-a3', title: 'Datenschutz', icon: '🔒', description: 'Sicherer Umgang mit Daten', contentUrl: '/content/q3-datenschutz.html' },
            { id: 'q3-a4', title: 'Tools & Apps', icon: '📲', description: 'Digitale Werkzeuge für die Praxis', contentUrl: '/content/q3-tools.html' },
            { id: 'q3-a5', title: 'Medienpädagogik', icon: '🎬', description: 'Kritischer Umgang mit Medien', contentUrl: '/content/q3-medienpaed.html' }
        ]
    }
};

// ============================================================================
// MARKTPLATZ (S-PLATTFORM)
// ============================================================================

export const mockMarketplace: MarketplaceContent = {
    id: 'S',
    title: 'Marktplatz',
    description: 'Bildungsmarktplatz des Comenius-Instituts.',
    short: 'Marktplatz',
    color: '#1e293b',      // Dunkleres Slate für bessere Energie-Sichtbarkeit
    glowColor: '#475569',
    stands: [
        {
            id: 's-institut',
            title: 'Comenius-Institut',
            type: 'institution',
            icon: '🏛️',
            description: 'Evangelische Arbeitsstätte für Erziehungswissenschaft e.V. – Ihr Kompetenzzentrum für religiöse Bildung seit 1954.',
            display: {
                color: '#1e40af'
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
                color: '#059669'
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
                color: '#dc2626'
            },
            nostrFilter: 'npub1...',
            externalUrl: 'https://comenius.de/termine'
        }
    ],
    wallPosters: [
        {
            id: 'leitlinie-education',
            title: 'Religiöse Bildung',
            imageUrl: '/assets/leitlinien/leitlinie1.jpg',
            perspective: 'education',
            position: 0  // Wand 1, links
        },
        {
            id: 'leitlinie-justice',
            title: 'Bildungsgerechtigkeit',
            imageUrl: '/assets/leitlinien/leitlinie2.jpg',
            perspective: 'justice',
            position: 1  // Wand 1, rechts
        },
        {
            id: 'leitlinie-sustainability',
            title: 'Nachhaltigkeit',
            imageUrl: '/assets/leitlinien/leitlinie3.jpg',
            perspective: 'sustainability',
            position: 2  // Wand 2, links
        },
        {
            id: 'leitlinie-diversity',
            title: 'Differenzsensibilität',
            imageUrl: '/assets/leitlinien/leitlinie4.jpg',
            perspective: 'diversity',
            position: 3  // Wand 2, rechts
        },
        {
            id: 'leitlinie-digitality',
            title: 'Digitalität',
            imageUrl: '/assets/leitlinien/leitlinie5.jpg',
            perspective: 'digitality',
            position: 4  // Wand 3
        },
        {
            id: 'leitlinie-structure',
            title: 'Strukturveränderungen',
            imageUrl: '/assets/leitlinien/leitlinie6.jpg',
            perspective: 'structure',
            position: 5  // Wand 4
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

/** 
 * Booth-Projekte einer Plattform (displayType: 'booth' oder 'both')
 * Reihenfolge = Array-Position in mockProjects
 */
export function getBoothProjectsForPlatform(platformId: string): ProjectData[] {
    return mockProjects.filter(p => 
        p.departments.includes(platformId as Department) &&
        (p.displayType === 'booth' || p.displayType === 'both')
    );
}

/** 
 * Wall-Poster einer Plattform (displayType: 'wall' oder 'both')
 * Position = Index in gefiltertem Array
 */
export function getWallPostersForPlatform(platformId: string): Array<{ project: ProjectData; position: number }> {
    return mockProjects
        .filter(p => 
            p.departments.includes(platformId as Department) &&
            (p.displayType === 'wall' || p.displayType === 'both')
        )
        .map((project, index) => ({ project, position: index }));
}

/**
 * Wegweiser-Projekte einer Plattform
 * Findet Projekte, die diese Plattform in relatedDepartments haben
 */
export function getRelatedProjectsForPlatform(platformId: string): ProjectData[] {
    return mockProjects.filter(p => 
        p.relatedDepartments?.includes(platformId as Department)
    );
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
