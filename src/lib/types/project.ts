export type Department = 'B1' | 'B2' | 'B3' | 'Q1' | 'Q2' | 'Q3' | 'S1' | 'S2' | 'S3';

export type Perspective = 'default' | 'justice' | 'sustainability' | 'digitality' | 'structure';

export interface StaffMember {
    id: string;
    name: string;
    avatarUrl: string;
    role?: string;
}

export interface ProjectData {
    id: string;
    title: string;
    slug: string;
    externalUrl: string;
    departments: Department[];
    perspectives: Perspective[];
    targetGroups: string[];
    type: 'ground' | 'orbit';
    staff: string[]; // IDs
    shortTeaser?: string;
    logoUrl?: string;
    screenshotUrl?: string;
    color?: string;
}

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
    // Chat-Modal
    isChatOpen: boolean;
}
