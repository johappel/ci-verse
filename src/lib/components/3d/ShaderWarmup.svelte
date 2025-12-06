<script lang="ts">
    /**
     * ShaderWarmup - VEREINFACHT für Debugging
     * 
     * Alle komplexen Warmup-Strategien haben nicht geholfen.
     * Jetzt nur noch: Warten und dann Ready signalisieren.
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { Text, MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
    import { Vector3 } from 'three';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';

    const { renderer, scene, camera } = useThrelte();
    
    let isWarmedUp = $state(false);
    let frameCount = $state(0);
    
    // Linien-Punkte für MeshLine Warmup
    const linePoints = [
        new Vector3(0, 0, 0),
        new Vector3(1, 1, 1),
        new Vector3(2, 0, 2)
    ];
    
    // Einfach: Warte 60 Frames, dann fertig
    useTask(() => {
        if (isWarmedUp) return;
        
        frameCount++;
        
        // Frame 30: Einfache Kompilierung
        if (frameCount === 30) {
            console.log('[ShaderWarmup] Simple compile at frame 30...');
            try {
                renderer.compile(scene, camera.current);
                renderer.render(scene, camera.current);
            } catch (e) {
                console.warn('[ShaderWarmup] Error:', e);
            }
        }
        
        // Frame 60: Fertig
        if (frameCount === 60) {
            console.log('[ShaderWarmup] Complete (simplified)!');
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