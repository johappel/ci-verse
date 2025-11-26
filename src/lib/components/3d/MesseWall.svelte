<script lang="ts">
    /**
     * MesseWall - Halbtransparente Messewand am Rand der Plattform
     * 
     * Struktur:
     * - Gebogene/segmentierte Wand am Plattformrand
     * - Poster-Slots für Projekt-Plakate
     * - Halbtransparentes Material (Glas-Effekt)
     * - Poster zeigen posterImage, Slogan, Logo
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { ProjectData } from '$lib/types/project';

    interface WallPoster {
        project: ProjectData;
        position: number; // 0-5 für Position entlang der Wand
    }

    interface Props {
        posters: WallPoster[];
        platformSize: number;
        platformColor?: string;
        wallHeight?: number;
        wallArc?: number; // Bogen in Grad (z.B. 120 = 1/3 Kreis)
        startAngle?: number; // Startwinkel in Grad
    }

    let { 
        posters,
        platformSize,
        platformColor = '#1e293b',
        wallHeight = 8,
        wallArc = 120,
        startAngle = -60 // Standardmäßig "hinten"
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let hoveredPosterId = $state<string | null>(null);

    // Wand-Segmente berechnen
    const segmentCount = Math.max(posters.length, 3); // Mindestens 3 Segmente
    const wallRadius = platformSize * 0.85; // Etwas innerhalb des Randes
    const segmentWidth = (wallArc / segmentCount) * (Math.PI / 180); // Radians pro Segment
    const startRad = startAngle * (Math.PI / 180);

    // Poster-Positionen auf der Wand
    const posterPositions = $derived(posters.map((poster, i) => {
        const angle = startRad + (i + 0.5) * segmentWidth;
        return {
            ...poster,
            x: Math.cos(angle) * wallRadius,
            z: Math.sin(angle) * wallRadius,
            rotY: -angle + Math.PI / 2 // Zeigt zur Mitte
        };
    }));

    function handlePosterClick(project: ProjectData) {
        if (project.externalUrl) {
            window.open(project.externalUrl, '_blank');
        }
    }
</script>

<T.Group>
    <!-- Wand-Segmente (halbtransparentes Glas) -->
    {#each Array(segmentCount) as _, i}
        {@const angle = startRad + (i + 0.5) * segmentWidth}
        {@const x = Math.cos(angle) * wallRadius}
        {@const z = Math.sin(angle) * wallRadius}
        
        <T.Mesh
            position={[x, wallHeight / 2 + 1.5, z]}
            rotation.y={-angle + Math.PI / 2}
            receiveShadow
        >
            <!-- Segment-Breite basierend auf Bogen -->
            <T.BoxGeometry args={[
                wallRadius * segmentWidth * 0.95, // Breite (mit kleinem Gap)
                wallHeight,
                0.3
            ]} />
            <T.MeshPhysicalMaterial
                color={platformColor}
                transparent
                opacity={0.3}
                metalness={0.1}
                roughness={0.1}
                transmission={0.6}
                thickness={0.3}
            />
        </T.Mesh>
        
        <!-- Rahmen oben -->
        <T.Mesh
            position={[x, wallHeight + 1.5, z]}
            rotation.y={-angle + Math.PI / 2}
        >
            <T.BoxGeometry args={[wallRadius * segmentWidth * 0.95, 0.15, 0.35]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
        </T.Mesh>
        
        <!-- Rahmen unten -->
        <T.Mesh
            position={[x, 1.5, z]}
            rotation.y={-angle + Math.PI / 2}
        >
            <T.BoxGeometry args={[wallRadius * segmentWidth * 0.95, 0.15, 0.35]} />
            <T.MeshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
        </T.Mesh>
    {/each}

    <!-- Poster auf der Wand -->
    {#each posterPositions as { project, x, z, rotY }}
        {@const isHovered = hoveredPosterId === project.id}
        {@const displayColor = project.display?.color || project.color || '#3b82f6'}
        
        <T.Group position={[x, wallHeight / 2 + 1.5, z]} rotation.y={rotY}>
            <!-- Poster-Hintergrund (farbiger Rahmen) -->
            <T.Mesh
                position.z={0.2}
                onpointerenter={() => { hoveredPosterId = project.id; onPointerEnter(); }}
                onpointerleave={() => { hoveredPosterId = null; onPointerLeave(); }}
                onclick={() => handlePosterClick(project)}
            >
                <T.PlaneGeometry args={[4, 6]} />
                <T.MeshBasicMaterial 
                    color={displayColor}
                    transparent
                    opacity={isHovered ? 1 : 0.9}
                />
            </T.Mesh>

            <!-- Poster-Inhalt (weiß/dunkel) -->
            <T.Mesh position.z={0.21}>
                <T.PlaneGeometry args={[3.6, 5.6]} />
                <T.MeshBasicMaterial color="#0f172a" />
            </T.Mesh>

            <!-- Projekt-Titel -->
            <Text
                text={project.title}
                fontSize={0.4}
                anchorX="center"
                anchorY="top"
                position={[0, 2.5, 0.25]}
                color="#ffffff"
                fontWeight="bold"
                maxWidth={3.2}
                textAlign="center"
            />

            <!-- Slogan (falls vorhanden) -->
            {#if project.display?.slogan}
                <Text
                    text={project.display.slogan}
                    fontSize={0.25}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, 0, 0.25]}
                    color={displayColor}
                    maxWidth={3.2}
                    textAlign="center"
                    fontStyle="italic"
                />
            {/if}

            <!-- "Mehr erfahren" Link-Hinweis -->
            <Text
                text="→ Mehr erfahren"
                fontSize={0.2}
                anchorX="center"
                anchorY="bottom"
                position={[0, -2.5, 0.25]}
                color={isHovered ? '#ffffff' : '#64748b'}
            />

            <!-- Hover-Glow -->
            {#if isHovered}
                <T.Mesh position.z={0.15}>
                    <T.PlaneGeometry args={[4.2, 6.2]} />
                    <T.MeshBasicMaterial 
                        color={displayColor}
                        transparent
                        opacity={0.3}
                    />
                </T.Mesh>
            {/if}
        </T.Group>
    {/each}

    <!-- Hover-Tooltip -->
    {#if hoveredPosterId}
        {@const hoveredPoster = posterPositions.find(p => p.project.id === hoveredPosterId)}
        {#if hoveredPoster}
            <HTML position={[hoveredPoster.x * 0.5, wallHeight + 3, hoveredPoster.z * 0.5]} center>
                <div class="bg-slate-900/95 text-white px-4 py-3 rounded-lg shadow-xl max-w-sm backdrop-blur-sm border border-slate-700">
                    <h3 class="font-bold text-lg">{hoveredPoster.project.title}</h3>
                    {#if hoveredPoster.project.shortTeaser}
                        <p class="text-sm text-slate-300 mt-1">{hoveredPoster.project.shortTeaser}</p>
                    {/if}
                    <p class="text-xs text-blue-400 mt-2">Klicken um Projekt zu öffnen →</p>
                </div>
            </HTML>
        {/if}
    {/if}
</T.Group>
