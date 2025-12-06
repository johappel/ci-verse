<script lang="ts">
    /**
     * ShaderWarmup - Kompiliert alle WebGL-Shader beim Start
     * 
     * Problem: Three.js kompiliert Shader "lazy" - erst beim ersten Rendern.
     * Das führt zu Lags wenn neue Materialien ins Sichtfeld kommen.
     * 
     * Lösung: 
     * 1. Verschiebe ALLE Plattformen temporär an eine zentrale Position
     * 2. Lasse eine virtuelle Kamera um sie kreisen (rendert alle Winkel)
     * 3. Verschiebe sie zurück an ihre echten Positionen
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { Text, MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
    import { Vector3, Object3D, PerspectiveCamera } from 'three';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';

    const { renderer, scene, camera } = useThrelte();
    
    let isWarmedUp = $state(false);
    let frameCount = $state(0);
    
    // Speichert Original-Positionen der Plattform-Gruppen
    const originalPositions = new Map<Object3D, Vector3>();
    
    // Virtuelle Kamera für Warmup-Schwenk
    let warmupCamera: PerspectiveCamera | null = null;
    
    // Zentrale Position wohin alle Plattformen verschoben werden
    const CENTER = new Vector3(0, 10, 0);
    
    // Linien-Punkte für MeshLine Warmup
    const linePoints = [
        new Vector3(0, 0, 0),
        new Vector3(1, 1, 1),
        new Vector3(2, 0, 2)
    ];
    
    // Findet alle Plattform-Gruppen in der Scene (userData.isPlatform = true)
    function findPlatformGroups(): Object3D[] {
        const platforms: Object3D[] = [];
        scene.traverse((obj) => {
            if (obj.userData?.isPlatform) {
                platforms.push(obj);
            }
        });
        return platforms;
    }
    
    // Verschiebt alle Plattformen an zentrale Position
    function movePlatformsToCenter() {
        const platforms = findPlatformGroups();
        
        console.log(`[ShaderWarmup] Moving ${platforms.length} platforms to center...`);
        
        platforms.forEach((platform, index) => {
            // Speichere Original-Position
            originalPositions.set(platform, platform.position.clone());
            
            // Verschiebe zur Mitte (leicht versetzt damit sie sich nicht überlappen)
            // Grid-Anordnung: 3x3 mit 15 Einheiten Abstand
            const col = index % 3;
            const row = Math.floor(index / 3);
            platform.position.set(
                CENTER.x + (col - 1) * 15,  // -15, 0, +15
                CENTER.y,
                CENTER.z + (row - 1) * 15   // -15, 0, +15
            );
        });
        
        return platforms.length;
    }
    
    // Verschiebt alle Plattformen zurück an Original-Positionen
    function restorePlatformPositions() {
        console.log(`[ShaderWarmup] Restoring ${originalPositions.size} platforms to original positions...`);
        
        originalPositions.forEach((originalPos, platform) => {
            platform.position.copy(originalPos);
        });
        
        originalPositions.clear();
    }
    
    // Berechnet Kameraposition für Orbit um Zentrum
    function getOrbitPosition(angle: number, radius: number, height: number): Vector3 {
        return new Vector3(
            CENTER.x + Math.cos(angle) * radius,
            CENTER.y + height,
            CENTER.z + Math.sin(angle) * radius
        );
    }
    
    // Nutze useTask um JEDEN Frame zu zählen
    useTask(() => {
        if (isWarmedUp) return;
        
        frameCount++;
        
        // Frame 30: Verschiebe alle Plattformen zur Mitte & erstelle virtuelle Kamera
        if (frameCount === 30) {
            const count = movePlatformsToCenter();
            
            if (count === 0) {
                console.warn('[ShaderWarmup] No platforms found! Make sure platforms have userData.isPlatform = true');
            }
            
            // Erstelle virtuelle Kamera für Orbit
            warmupCamera = new PerspectiveCamera(75, 16/9, 0.1, 500);
            console.log('[ShaderWarmup] Starting virtual camera orbit...');
        }
        
        // Frame 31-50: Virtuelle Kamera kreist um die Plattformen
        // 20 Frames = ~360° Orbit + verschiedene Höhen
        if (frameCount >= 31 && frameCount <= 50 && warmupCamera) {
            const orbitFrame = frameCount - 31;  // 0-19
            const totalOrbitFrames = 20;
            
            // Orbit-Winkel: 0 bis 2*PI
            const angle = (orbitFrame / totalOrbitFrames) * Math.PI * 2;
            
            // Radius variiert: 40-60 Einheiten
            const radius = 40 + (orbitFrame % 3) * 10;
            
            // Höhe variiert: 5-25 (von unten nach oben schauen)
            const height = 5 + (orbitFrame / totalOrbitFrames) * 20;
            
            // Positioniere virtuelle Kamera
            const camPos = getOrbitPosition(angle, radius, height);
            warmupCamera.position.copy(camPos);
            warmupCamera.lookAt(CENTER);
            warmupCamera.updateMatrixWorld();
            
            try {
                // Kompiliere und rendere mit virtueller Kamera
                renderer.compile(scene, warmupCamera);
                renderer.render(scene, warmupCamera);
                
                if (orbitFrame === 10) {
                    console.log('[ShaderWarmup] Virtual camera orbiting platforms (50%)...');
                }
            } catch (e) {
                console.warn('[ShaderWarmup] Render error:', e);
            }
        }
        
        // Frame 55: Verschiebe Plattformen zurück
        if (frameCount === 55) {
            restorePlatformPositions();
            warmupCamera = null;
            
            // Finale Kompilierung mit echter Kamera
            console.log('[ShaderWarmup] Final compilation with platforms at original positions...');
            const startTime = performance.now();
            
            try {
                renderer.compile(scene, camera.current);
                renderer.render(scene, camera.current);
                
                const elapsed = performance.now() - startTime;
                console.log(`[ShaderWarmup] Final compilation done in ${elapsed.toFixed(0)}ms`);
            } catch (e) {
                console.warn('[ShaderWarmup] Error:', e);
            }
        }
        
        // Frame 65: Fertig!
        if (frameCount === 65) {
            console.log('[ShaderWarmup] Complete!');
            isWarmedUp = true;
            performanceStore.setShadersReady();
        }
    });
</script>

<!-- Warmup-Objekte weit außerhalb des Sichtfelds (Material-Types Pre-Compile) -->
{#if !isWarmedUp}
    <T.Group position={[0, -1000, 0]}>
        
        <!-- MeshStandardMaterial (häufigste) -->
        <T.Mesh>
            <T.BoxGeometry args={[1, 1, 1]} />
            <T.MeshStandardMaterial color="#888" metalness={0.5} roughness={0.5} />
        </T.Mesh>
        
        <!-- MeshPhysicalMaterial (Oktaeder, Glas) -->
        <T.Mesh position.x={2}>
            <T.OctahedronGeometry args={[1, 0]} />
            <T.MeshPhysicalMaterial 
                color="#6366f1"
                emissive="#6366f1"
                emissiveIntensity={0.3}
                metalness={0.3}
                roughness={0.1}
                transparent
                opacity={0.6}
                transmission={0.3}
            />
        </T.Mesh>
        
        <!-- MeshBasicMaterial (Glow-Ringe, Labels) -->
        <T.Mesh position.x={4}>
            <T.RingGeometry args={[0.8, 1, 6]} />
            <T.MeshBasicMaterial color="#fbbf24" transparent opacity={0.5} />
        </T.Mesh>
        
        <!-- MeshBasicMaterial transparent (Buttons, Overlays) -->
        <T.Mesh position.x={6}>
            <T.PlaneGeometry args={[2, 1]} />
            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.01} depthWrite={false} />
        </T.Mesh>
        
        <!-- CylinderGeometry (Plattformen) -->
        <T.Mesh position.x={8}>
            <T.CylinderGeometry args={[2, 2, 0.5, 6]} />
            <T.MeshStandardMaterial color="#1e3a5f" metalness={0.3} roughness={0.6} />
        </T.Mesh>
        
        <!-- Text3D (troikaThree) -->
        <Text
            position={[10, 0, 0]}
            text="Warmup"
            color="#ffffff"
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
        />
        
        <!-- MeshLine (LightBridge) -->
        <T.Mesh position.x={12}>
            <MeshLineGeometry points={linePoints} />
            <MeshLineMaterial
                width={0.2}
                color="#60a5fa"
                opacity={0.5}
                transparent
                depthWrite={false}
            />
        </T.Mesh>
        
        <!-- SphereGeometry (Energiekern, Highlights) -->
        <T.Mesh position.x={14}>
            <T.SphereGeometry args={[0.5, 16, 16]} />
            <T.MeshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </T.Mesh>
        
        <!-- Cone (für Spotlights) -->
        <T.Mesh position.x={16}>
            <T.ConeGeometry args={[0.5, 1, 8]} />
            <T.MeshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.2} />
        </T.Mesh>
        
    </T.Group>
{/if}