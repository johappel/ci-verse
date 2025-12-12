/**
 * WordPress REST API Service
 * 
 * Lädt alle Daten (Plattformen, Projekte, Staff, Marktplatz)
 * vom WordPress REST API Endpoint
 */

import type { 
    ProjectData, 
    StaffMember, 
    PlatformContent, 
    MarketplaceContent,
    PartnerConnection 
} from '$lib/types/project';

// ============================================================================
// KONFIGURATION
// ============================================================================

// WordPress URL aus Environment oder Default
const WP_BASE_URL = import.meta.env.VITE_WP_URL || 'http://ci.test';
const API_URL = `${WP_BASE_URL}/wp-json/civerse/v1/world`;

function getApiUrl(): string {
    return API_URL;
}

export function getWpBaseUrl(): string {
    return WP_BASE_URL;
}

/**
 * Konvertiert relative Bild-URLs zu absoluten URLs
 * Falls WordPress relative Pfade zurückgibt, füge die Base-URL hinzu
 */
function toAbsoluteUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    return `${WP_BASE_URL}${url}`;
}

/**
 * Stellt sicher, dass alle Bild-URLs absolut sind
 */
function normalizeImageUrls(data: WorldDataResponse): WorldDataResponse {
    // Projects
    data.projects = data.projects.map(project => {
        // Override für rpi-virtuell: Immer Landscape erzwingen
        // (Falls im WordPress noch nicht korrekt eingestellt)
        let display = project.display;
        if (project.slug === 'rpi-virtuell' && display) {
            display = { ...display, posterImageFormat: 'landscape' };
        }

        return {
            ...project,
            display: display ? {
                ...display,
                posterImage: toAbsoluteUrl(display.posterImage),
                logoUrl: toAbsoluteUrl(display.logoUrl),
                screenshotUrl: toAbsoluteUrl(display.screenshotUrl),
            } : undefined
        };
    }) as ProjectData[];
    
    // Marketplace
    if (data.marketplace) {
        data.marketplace.wallPosters = data.marketplace.wallPosters?.map(poster => ({
            ...poster,
            imageUrl: toAbsoluteUrl(poster.imageUrl) || '',
        })) || [];
    }
    
    // Staff
    data.staff = data.staff.map(member => ({
        ...member,
        avatarUrl: toAbsoluteUrl(member.avatarUrl) || '',
    })) as StaffMember[];
    
    // Partner Connections
    data.partnerConnections = data.partnerConnections?.map(partner => ({
        ...partner,
        logoUrl: toAbsoluteUrl(partner.logoUrl) || '',
    })) || [];
    
    return data;
}

// ============================================================================
// API RESPONSE INTERFACE
// ============================================================================

interface WorldDataResponse {
    partnerConnections: PartnerConnection[];
    marketplace: MarketplaceContent;
    platforms: Record<string, PlatformContent>;
    projects: ProjectData[];
    staff: StaffMember[];
}

// ============================================================================
// API CALL
// ============================================================================

let cachedWorldData: WorldDataResponse | null = null;
let fetchPromise: Promise<WorldDataResponse> | null = null;

/**
 * Lädt alle World-Daten vom WordPress REST API
 * 
 * Features:
 * - Automatische Dev/Prod-URL-Erkennung
 * - Caching für wiederholte Aufrufe
 * - Fehlerbehandlung mit aussagekräftigen Meldungen
 */
export async function fetchWorldData(): Promise<WorldDataResponse> {
    // Wenn bereits geladen → Cache zurückgeben
    if (cachedWorldData) {
        return cachedWorldData;
    }
    
    // Wenn gerade lädt → Promise wiederverwenden (Race Condition vermeiden)
    if (fetchPromise) {
        return fetchPromise;
    }
    
    const apiUrl = getApiUrl();
    console.log('🌍 Fetching World Data from:', apiUrl);
    
    fetchPromise = fetch(apiUrl)
        .then(async (response) => {
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Error ${response.status}: ${text}`);
            }
            return response.json();
        })
        .then((data: WorldDataResponse) => {
            // Validierung
            if (!data.projects || !data.platforms || !data.staff) {
                throw new Error('Invalid API response: Missing required fields');
            }
            
            // Normalisiere alle Bild-URLs zu absoluten URLs
            data = normalizeImageUrls(data);
            
            console.log('✅ World Data loaded:', {
                projects: data.projects.length,
                platforms: Object.keys(data.platforms).length,
                staff: data.staff.length,
                marketplace: data.marketplace ? '✓' : '✗'
            });
            
            cachedWorldData = data;
            fetchPromise = null;
            return data;
        })
        .catch((error) => {
            fetchPromise = null;
            console.error('❌ Failed to fetch World Data:', error);
            throw error;
        });
    
    return fetchPromise;
}

// ============================================================================
// CONVENIENCE GETTERS
// ============================================================================

export async function getProjects(): Promise<ProjectData[]> {
    const data = await fetchWorldData();
    return data.projects;
}

export async function getProjectById(id: string): Promise<ProjectData | undefined> {
    const projects = await getProjects();
    return projects.find(p => p.id === id);
}

export async function getStaff(): Promise<StaffMember[]> {
    const data = await fetchWorldData();
    return data.staff;
}

export async function getPlatforms(): Promise<Record<string, PlatformContent>> {
    const data = await fetchWorldData();
    return data.platforms;
}

export async function getMarketplace(): Promise<MarketplaceContent> {
    const data = await fetchWorldData();
    return data.marketplace;
}

export async function getPartnerConnections(): Promise<PartnerConnection[]> {
    const data = await fetchWorldData();
    return data.partnerConnections;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Cache leeren (z.B. nach Daten-Update)
 */
export function clearCache() {
    cachedWorldData = null;
    fetchPromise = null;
    console.log('🗑️ World Data Cache cleared');
}

/**
 * Daten neu laden (Cache leeren + neu fetchen)
 */
export async function refetchWorldData(): Promise<WorldDataResponse> {
    clearCache();
    return fetchWorldData();
}
