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

// Default: WordPress-Installation (Production)
const DEFAULT_API_URL = '/wp-json/civerse/v1/world';

// Für lokale Entwicklung mit Local by Flywheel
const DEV_API_URL = 'http://ci.test/wp-json/civerse/v1/world';

// Automatische Erkennung: Dev wenn auf localhost:5173, sonst Production
function getApiUrl(): string {
    if (typeof window === 'undefined') {
        // Server-Side Rendering
        return DEFAULT_API_URL;
    }
    
    // Client-Side: Localhost → Dev-Server, sonst WordPress-Site
    if (window.location.hostname === 'localhost') {
        return DEV_API_URL;
    }
    
    return DEFAULT_API_URL;
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
