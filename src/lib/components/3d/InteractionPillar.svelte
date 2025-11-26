<script lang="ts">
    /**
     * InteractionPillar - Säule mit Knopf vor Exponaten
     * 
     * Struktur:
     * - Dünne Säule
     * - Leuchtender Knopf oben
     * - Aktiviert sich nur bei Nähe (<8 Einheiten)
     * - Klick öffnet URL oder ProjectCard
     */
    import { T, useThrelte, useTask } from '@threlte/core';
    import { Text, HTML, useCursor } from '@threlte/extras';
    import type { ProjectData } from '$lib/types/project';

    interface Props {
        project: ProjectData;
        position?: [number, number, number];
        rotation?: number;
        height?: number;
        worldPosition?: [number, number, number]; // Echte Welt-Position für Distanz-Berechnung
    }

    let { 
        project, 
        position = [0, 0, 0],
        rotation = 0,
        height = 1.2,
        worldPosition // Falls nicht gesetzt, verwende position
    }: Props = $props();
    
    // Welt-Position für Distanz-Berechnung (falls worldPosition nicht gesetzt, nutze position)
    const effectiveWorldPos = $derived(worldPosition || position);

    const { camera } = useThrelte();
    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    // Distanz-Schwellwert für Aktivierung
    const ACTIVATION_DISTANCE = 12;
    
    let isNearby = $state(false);
    let isHovered = $state(false);
    let pulsePhase = $state(0);
    let frameCounter = 0; // Für Throttling der Distanz-Prüfung
    
    const displayColor = project.display?.color || project.color || '#3b82f6';

    // Optimierte Distanz-Prüfung (nur alle 6 Frames, ~10Hz bei 60fps)
    useTask((delta) => {
        frameCounter++;
        
        // Puls-Animation läuft immer wenn nah (leichtgewichtig)
        if (isNearby) {
            pulsePhase += delta * 3;
        }
        
        // Distanz-Prüfung nur alle 6 Frames (Performance)
        if (frameCounter % 6 !== 0) return;
        
        const camPos = $camera.position;
        const wx = effectiveWorldPos[0];
        const wy = effectiveWorldPos[1];
        const wz = effectiveWorldPos[2];
        
        const dx = camPos.x - wx;
        const dy = camPos.y - wy;
        const dz = camPos.z - wz;
        // Vermeide sqrt wenn möglich (vergleiche Quadrate)
        const distSq = dx * dx + dy * dy + dz * dz;
        
        isNearby = distSq <= ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
    });

    function handleClick() {
        if (!isNearby) return;
        
        if (project.externalUrl) {
            window.open(project.externalUrl, '_blank');
        }
    }

    // Puls-Intensität (0.5 - 1.0)
    let pulseIntensity = $derived(isNearby ? 0.7 + Math.sin(pulsePhase) * 0.3 : 0.3);
</script>

<T.Group position={position} rotation.y={rotation}>
    <!-- Säule (dünn, metallisch) - reduzierte Segmente -->
    <T.Mesh position.y={height / 2}>
        <T.CylinderGeometry args={[0.08, 0.1, height, 6]} />
        <T.MeshStandardMaterial 
            color="#374151"
            metalness={0.8}
            roughness={0.3}
        />
    </T.Mesh>

    <!-- Sockel - reduzierte Segmente -->
    <T.Mesh position.y={0.05}>
        <T.CylinderGeometry args={[0.2, 0.25, 0.1, 6]} />
        <T.MeshStandardMaterial 
            color="#1f2937"
            metalness={0.7}
            roughness={0.4}
        />
    </T.Mesh>

    <!-- Knopf-Gehäuse - reduzierte Segmente -->
    <T.Mesh position.y={height + 0.15}>
        <T.CylinderGeometry args={[0.18, 0.15, 0.3, 8]} />
        <T.MeshStandardMaterial 
            color={isNearby ? '#1e293b' : '#0f172a'}
            metalness={0.5}
            roughness={0.5}
        />
    </T.Mesh>

    <!-- Leuchtender Knopf - reduzierte Segmente -->
    <T.Mesh 
        position.y={height + 0.32}
        onclick={handleClick}
        onpointerenter={() => { if (isNearby) { isHovered = true; onPointerEnter(); }}}
        onpointerleave={() => { isHovered = false; onPointerLeave(); }}
    >
        <T.SphereGeometry args={[0.12, 8, 8]} />
        <T.MeshBasicMaterial 
            color={isNearby ? displayColor : '#475569'}
            transparent
            opacity={pulseIntensity}
        />
    </T.Mesh>

    <!-- Glow-Ring um den Knopf (nur wenn aktiv) - reduzierte Segmente -->
    {#if isNearby}
        <T.Mesh position.y={height + 0.32} rotation.x={-Math.PI / 2}>
            <T.RingGeometry args={[0.15, 0.25, 8]} />
            <T.MeshBasicMaterial 
                color={displayColor}
                transparent
                opacity={pulseIntensity * 0.5}
                side={2}
            />
        </T.Mesh>

        <!-- Punktlicht vom Knopf - nur bei Hover für Performance -->
        {#if isHovered}
            <T.PointLight
                position.y={height + 0.4}
                color={displayColor}
                intensity={12}
                distance={3}
                decay={2}
            />
        {/if}
    {/if}

    <!-- Label über dem Knopf (nur wenn nah und gehovert) -->
    {#if isNearby && isHovered}
        <HTML position={[0, height + 0.7, 0]} center transform={false}>
            <div style="
                background: #ffffff;
                color: #0f172a;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
                white-space: nowrap;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                border-bottom: 3px solid {displayColor};
            ">
                🔗 Projekt öffnen
            </div>
        </HTML>
    {/if}

    <!-- "Komm näher" Hinweis wenn nicht nah genug aber gehovert -->
    {#if !isNearby && isHovered}
        <HTML position={[0, height + 0.7, 0]} center transform={false}>
            <div style="
                background: rgba(15, 23, 42, 0.9);
                color: #94a3b8;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 0.7rem;
                white-space: nowrap;
            ">
                Näher kommen zum Aktivieren
            </div>
        </HTML>
    {/if}
</T.Group>
