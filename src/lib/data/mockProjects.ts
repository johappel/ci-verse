import type { ProjectData } from '../types/project';

// Mock-Daten basierend auf example-data.json mit Erweiterungen
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
        logoUrl: '/placeholder-logo.svg',
        screenshotUrl: 'https://picsum.photos/seed/kita/800/600',
        color: '#f97316'
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
        logoUrl: '/placeholder-logo.svg',
        screenshotUrl: 'https://picsum.photos/seed/digital/800/600',
        color: '#0ea5e9'
    },
    {
        id: 'p3',
        title: 'Forschungsstelle Bildungsbericht',
        slug: 'bildungsbericht',
        externalUrl: 'https://comenius.de',
        departments: ['Q1'],
        perspectives: ['justice'],
        targetGroups: [],
        type: 'orbit',
        staff: ['m1'],
        shortTeaser: 'Evidenzbasierte Forschung zur evangelischen Bildungslandschaft in Deutschland.',
        logoUrl: '/placeholder-logo.svg',
        screenshotUrl: 'https://picsum.photos/seed/research/800/600',
        color: '#8b5cf6'
    }
];

// Mock Staff Data
export const mockStaff = [
    {
        id: 'm1',
        name: 'Dr. Maria Schmidt',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        role: 'Projektleitung'
    },
    {
        id: 'm2',
        name: 'Thomas Weber',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        role: 'Pädagogischer Referent'
    },
    {
        id: 'm3',
        name: 'Julia Becker',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        role: 'Digitalbeauftragte'
    }
];
