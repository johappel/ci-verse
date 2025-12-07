/**
 * PerformanceStore - Verwaltet Qualitätseinstellungen für schwache Hardware
 * 
 * Features:
 * - Lädt Konfiguration aus /static/config.json (zentrale Einstellungen)
 * - Automatische Hardware-Erkennung
 * - Drei Qualitätsstufen: high, medium, low
 * - Frame-Rate-Monitoring mit automatischem Downgrade
 * - Persistente Einstellungen im LocalStorage
 * - SSR-kompatibel (Browser-APIs nur client-seitig)
 */
import { browser } from '$app/environment';

export type QualityLevel = 'high' | 'medium' | 'low';

export interface PerformanceSettings {
    // Materialien
    usePBRMaterials: boolean;        // MeshStandardMaterial vs MeshBasicMaterial
    useEmissive: boolean;            // Emissive-Glow-Effekte
    
    // Schatten
    enableShadows: boolean;          // castShadow/receiveShadow
    
    // Beleuchtung
    maxSpotlights: number;           // Max Spotlights pro Szene (6, 3, oder 0)
    useHemisphereLight: boolean;     // Atmosphärisches Licht
    
    // Geometrie
    geometryDetail: 'high' | 'medium' | 'low';  // Segment-Anzahl
    
    // Effekte
    enableFog: boolean;              // Volumetrischer Nebel
    enableParticles: boolean;        // Partikel-Effekte
    enableAnimations: boolean;       // Kamera/Objekt-Animationen
    enableGlowRings: boolean;        // Plattform-Leucht-Ringe
    enableEnergyEffects: boolean;    // EnergyFloor + EnergyBeam auf Marktplatz
    lightBridgeQuality: 'high' | 'medium' | 'low';  // Lichtlinien-Qualität
    
    // Rendern
    pixelRatio: number;              // Canvas Auflösung (1.0 = native, 0.5 = halbe)
    antialias: boolean;              // Kantenglättung
    
    // Kamera
    cameraFlightSpeed: 'normal' | 'fast' | 'instant';  // Fluggeschwindigkeit
    cameraSmoothTime: number;        // Standard-Glättung für Kamera (0.3 = direkt, 1.5 = weich)
}

// Config-Interface für JSON-Datei
interface ConfigJSON {
    qualityPresets: Record<QualityLevel, {
        comment?: string;
        materials: { usePBRMaterials: boolean; useEmissive: boolean };
        shadows: { enableShadows: boolean };
        lighting: { maxSpotlights: number; useHemisphereLight: boolean };
        geometry: { geometryDetail: 'high' | 'medium' | 'low' };
        effects: {
            enableFog: boolean;
            enableParticles: boolean;
            enableAnimations: boolean;
            enableGlowRings: boolean;
            enableEnergyEffects: boolean;
            lightBridgeQuality: 'high' | 'medium' | 'low';
        };
        rendering: { pixelRatio: number | 'auto'; antialias: boolean };
        camera: { flightSpeed: 'normal' | 'fast' | 'instant'; smoothTime: number };
    }>;
    geometrySegments: Record<'high' | 'medium' | 'low', number>;
    autoDowngrade: { enabled: boolean; fpsThreshold: number; measurementCount: number };
}

// Helper: Sichere devicePixelRatio
function getDevicePixelRatio(): number {
    if (browser && typeof window !== 'undefined') {
        return Math.min(window.devicePixelRatio || 1, 2);
    }
    return 1;
}

// Konvertiert JSON-Preset zu PerformanceSettings
function convertPreset(preset: ConfigJSON['qualityPresets'][QualityLevel]): PerformanceSettings {
    return {
        usePBRMaterials: preset.materials.usePBRMaterials,
        useEmissive: preset.materials.useEmissive,
        enableShadows: preset.shadows.enableShadows,
        maxSpotlights: preset.lighting.maxSpotlights,
        useHemisphereLight: preset.lighting.useHemisphereLight,
        geometryDetail: preset.geometry.geometryDetail,
        enableFog: preset.effects.enableFog,
        enableParticles: preset.effects.enableParticles,
        enableAnimations: preset.effects.enableAnimations,
        enableGlowRings: preset.effects.enableGlowRings,
        enableEnergyEffects: preset.effects.enableEnergyEffects,
        lightBridgeQuality: preset.effects.lightBridgeQuality,
        pixelRatio: preset.rendering.pixelRatio === 'auto' ? getDevicePixelRatio() : preset.rendering.pixelRatio,
        antialias: preset.rendering.antialias,
        cameraFlightSpeed: preset.camera.flightSpeed,
        cameraSmoothTime: preset.camera.smoothTime
    };
}

// Fallback-Presets (falls config.json nicht geladen werden kann)
function getDefaultPresets(): Record<QualityLevel, PerformanceSettings> {
    return {
        high: {
            usePBRMaterials: true,
            useEmissive: true,
            enableShadows: true,
            maxSpotlights: 6,
            useHemisphereLight: true,
            geometryDetail: 'high',
            enableFog: true,
            enableParticles: true,
            enableAnimations: true,
            enableGlowRings: true,
            enableEnergyEffects: true,
            lightBridgeQuality: 'high',
            pixelRatio: getDevicePixelRatio(),
            antialias: true,
            cameraFlightSpeed: 'normal',
            cameraSmoothTime: 1.5
        },
        medium: {
            usePBRMaterials: true,
            useEmissive: true,
            enableShadows: false,
            maxSpotlights: 3,
            useHemisphereLight: true,
            geometryDetail: 'medium',
            enableFog: true,
            enableParticles: false,
            enableAnimations: true,
            enableGlowRings: true,
            enableEnergyEffects: true,
            lightBridgeQuality: 'medium',
            pixelRatio: 1.0,
            antialias: true,
            cameraFlightSpeed: 'fast',
            cameraSmoothTime: 0.9
        },
        low: {
            usePBRMaterials: false,
            useEmissive: false,
            enableShadows: false,
            maxSpotlights: 0,
            useHemisphereLight: false,
            geometryDetail: 'low',
            enableFog: false,
            enableParticles: false,
            enableAnimations: false,
            enableGlowRings: false,
            enableEnergyEffects: false,
            lightBridgeQuality: 'low',
            pixelRatio: 0.5,
            antialias: false,
            cameraFlightSpeed: 'instant',
            cameraSmoothTime: 0.4
        }
    };
}

// Geometrie-Segment-Multiplikatoren (werden aus config.json überschrieben)
export let GEOMETRY_SEGMENTS: Record<'high' | 'medium' | 'low', number> = {
    high: 1.0,
    medium: 0.6,
    low: 0.3
};

class PerformanceStore {
    // Reaktiver State
    qualityLevel = $state<QualityLevel>('medium');
    settings = $state<PerformanceSettings>(getDefaultPresets().medium);
    
    // Geladene Presets (aus config.json oder Fallback)
    private presets: Record<QualityLevel, PerformanceSettings> = getDefaultPresets();
    private configLoaded = $state(false);
    
    // Auto-Downgrade Einstellungen (aus config.json)
    private autoDowngradeConfig = { enabled: true, fpsThreshold: 20, measurementCount: 5 };
    
    // Shader-Warmup Status (wird von ShaderWarmup.svelte gesetzt)
    shadersReady = $state(false);
    
    // FPS-Monitoring
    private frameTimestamps: number[] = [];
    private fpsHistory: number[] = [];
    private autoAdjustEnabled = $state(true);
    private hasDowngraded = $state(false);
    private initialized = false;
    
    // Statistiken (für Debug-Overlay)
    currentFPS = $state(60);
    gpuTier = $state<'integrated' | 'dedicated' | 'unknown'>('unknown');
    isLowEndDevice = $state(false);
    
    constructor() {
        // Nur im Browser initialisieren
        if (browser) {
            this.initialize();
        }
    }
    
    /**
     * Signalisiert dass alle Shader kompiliert sind
     */
    setShadersReady() {
        this.shadersReady = true;
        console.log('[Performance] Shaders ready!');
    }
    
    /**
     * Initialisierung (nur client-seitig)
     */
    private initialize() {
        if (this.initialized) return;
        this.initialized = true;
        
        // Config aus JSON laden, dann Settings anwenden
        this.loadConfigFromJSON().then(() => {
            this.loadSettings();
            this.detectHardware();
        });
    }
    
    /**
     * Lädt Konfiguration aus /static/config.json
     */
    private async loadConfigFromJSON(): Promise<void> {
        if (!browser) return;
        
        try {
            const response = await fetch('/config.json');
            if (!response.ok) {
                console.warn('[Performance] config.json nicht gefunden, verwende Fallback-Presets');
                return;
            }
            
            const config: ConfigJSON = await response.json();
            console.log('[Performance] config.json geladen');
            
            // Presets konvertieren
            this.presets = {
                high: convertPreset(config.qualityPresets.high),
                medium: convertPreset(config.qualityPresets.medium),
                low: convertPreset(config.qualityPresets.low)
            };
            
            // Geometry Segments übernehmen
            if (config.geometrySegments) {
                GEOMETRY_SEGMENTS = { ...config.geometrySegments };
            }
            
            // Auto-Downgrade Einstellungen
            if (config.autoDowngrade) {
                this.autoDowngradeConfig = { ...config.autoDowngrade };
            }
            
            // Aktuelles Level neu anwenden mit geladenen Presets
            this.settings = { ...this.presets[this.qualityLevel] };
            this.configLoaded = true;
            
            console.log('[Performance] Presets aus config.json angewendet');
        } catch (e) {
            console.warn('[Performance] config.json laden fehlgeschlagen, verwende Fallback-Presets:', e);
        }
    }
    
    /**
     * Hardware-Erkennung (nur im Browser)
     */
    private detectHardware() {
        if (!browser) return;
        
        // WebGL Renderer Info
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl && gl instanceof WebGLRenderingContext) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    
                    console.log('[Performance] GPU:', renderer, '| Vendor:', vendor);
                    
                    // Erkenne integrierte GPUs
                    const rendererLower = renderer.toLowerCase();
                    const isIntegrated = 
                        rendererLower.includes('intel') ||
                        rendererLower.includes('mesa') ||
                        rendererLower.includes('llvmpipe') ||
                        rendererLower.includes('swiftshader') ||
                        rendererLower.includes('software') ||
                        rendererLower.includes('mali') ||
                        rendererLower.includes('adreno');
                    
                    this.gpuTier = isIntegrated ? 'integrated' : 'dedicated';
                    this.isLowEndDevice = isIntegrated;
                    
                    // Bei integrierter GPU: Automatisch auf Medium starten
                    if (isIntegrated && !this.hasStoredSettings()) {
                        console.log('[Performance] Integrierte GPU erkannt - starte mit Medium-Qualität');
                        this.setQuality('medium');
                    }
                }
            }
        } catch (e) {
            console.warn('[Performance] GPU-Erkennung fehlgeschlagen:', e);
        }
        
        // Speicher-Check
        if ('deviceMemory' in navigator) {
            const memory = (navigator as { deviceMemory?: number }).deviceMemory;
            if (memory && memory < 4) {
                this.isLowEndDevice = true;
                if (!this.hasStoredSettings()) {
                    console.log('[Performance] Wenig RAM erkannt (<4GB) - starte mit Low-Qualität');
                    this.setQuality('low');
                }
            }
        }
        
        // Touch-Device (oft schwächer)
        if (typeof window !== 'undefined' && 'ontouchstart' in window && !this.hasStoredSettings()) {
            // Mobile Geräte bekommen Medium als Default
            if (this.qualityLevel === 'high') {
                console.log('[Performance] Touch-Device erkannt - starte mit Medium-Qualität');
                this.setQuality('medium');
            }
        }
    }
    
    /**
     * Prüft ob bereits gespeicherte Settings existieren
     */
    private hasStoredSettings(): boolean {
        if (!browser) return false;
        try {
            return localStorage.getItem('ci-verse-quality') !== null;
        } catch {
            return false;
        }
    }
    
    /**
     * Lädt Settings aus LocalStorage
     */
    private loadSettings() {
        if (!browser) return;
        
        try {
            const stored = localStorage.getItem('ci-verse-quality');
            if (stored) {
                const level = stored as QualityLevel;
                if (this.presets[level]) {
                    this.qualityLevel = level;
                    this.settings = { ...this.presets[level] };
                    console.log('[Performance] Geladene Qualität:', level);
                }
            }
        } catch (e) {
            console.warn('[Performance] Settings laden fehlgeschlagen:', e);
        }
    }
    
    /**
     * Speichert Settings in LocalStorage
     */
    private saveSettings() {
        if (!browser) return;
        
        try {
            localStorage.setItem('ci-verse-quality', this.qualityLevel);
        } catch (e) {
            console.warn('[Performance] Settings speichern fehlgeschlagen:', e);
        }
    }
    
    /**
     * Setzt die Qualitätsstufe
     */
    setQuality(level: QualityLevel) {
        console.log('[Performance] Setze Qualität auf:', level);
        this.qualityLevel = level;
        this.settings = { ...this.presets[level] };
        this.saveSettings();
    }
    
    /**
     * Frame-Zeit für FPS-Berechnung registrieren
     * Rufe dies in useTask oder requestAnimationFrame auf
     */
    recordFrame() {
        if (!browser) return;
        
        const now = performance.now();
        this.frameTimestamps.push(now);
        
        // Nur die letzten 60 Frames behalten
        if (this.frameTimestamps.length > 60) {
            this.frameTimestamps.shift();
        }
        
        // FPS berechnen (alle 30 Frames)
        if (this.frameTimestamps.length >= 30 && this.frameTimestamps.length % 30 === 0) {
            const oldest = this.frameTimestamps[0];
            const newest = this.frameTimestamps[this.frameTimestamps.length - 1];
            const elapsed = newest - oldest;
            const fps = (this.frameTimestamps.length - 1) / (elapsed / 1000);
            
            this.currentFPS = Math.round(fps);
            this.fpsHistory.push(fps);
            
            // Nur letzte 10 Messungen
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }
            
            // Auto-Downgrade bei konstant niedrigen FPS
            this.checkAutoDowngrade();
        }
    }
    
    /**
     * Automatisches Downgrade bei schlechter Performance
     */
    private checkAutoDowngrade() {
        if (!this.autoAdjustEnabled || this.hasDowngraded) return;
        
        // Nur wenn genug Messungen vorhanden
        if (this.fpsHistory.length < 5) return;
        
        // Durchschnitt der letzten Messungen
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        // Unter 20 FPS: Downgrade
        if (avgFPS < 20) {
            this.hasDowngraded = true;
            
            if (this.qualityLevel === 'high') {
                console.log('[Performance] Auto-Downgrade: high → medium (Durchschnitt:', Math.round(avgFPS), 'FPS)');
                this.setQuality('medium');
            } else if (this.qualityLevel === 'medium') {
                console.log('[Performance] Auto-Downgrade: medium → low (Durchschnitt:', Math.round(avgFPS), 'FPS)');
                this.setQuality('low');
            }
            
            // FPS-History zurücksetzen nach Downgrade
            this.fpsHistory = [];
        }
    }
    
    /**
     * Auto-Adjust aktivieren/deaktivieren
     */
    setAutoAdjust(enabled: boolean) {
        this.autoAdjustEnabled = enabled;
        if (!enabled) {
            this.hasDowngraded = false;
        }
    }
    
    /**
     * Gibt angepasste Segment-Anzahl zurück
     */
    getSegments(baseSegments: number): number {
        const multiplier = GEOMETRY_SEGMENTS[this.settings.geometryDetail];
        return Math.max(3, Math.round(baseSegments * multiplier));
    }
}

// Singleton-Export
export const performanceStore = new PerformanceStore();
