<script lang="ts">
    import { T } from '@threlte/core';
    import { Text, Billboard } from '@threlte/extras';
    import { Spring } from 'svelte/motion';
    import type { ProjectData } from '$lib/types/project';
    import { getPlatformContent } from '$lib/data/mockProjects';
    import { worldStore } from '$lib/logic/store.svelte';

    let { 
        relatedProjects, 
        position = [0, 0, 0],
        platformId,
        compact = false
    }: { 
        relatedProjects: ProjectData[]; 
        position?: [number, number, number];
        platformId: string;
        compact?: boolean;
    } = $props();

    // Hover-State
    let hoveredProjectId = $state<string | null>(null);

    // Spring für sanfte Animation
    const glowIntensity = new Spring(0.3, { stiffness: 0.3, damping: 0.7 });

    $effect(() => {
        glowIntensity.target = hoveredProjectId ? 0.8 : 0.3;
    });

    // Generiere Hinweistext basierend auf Heimat-Plattformen
    function getHintText(project: ProjectData): string {
        const homePlatforms = project.departments
            .map(id => getPlatformContent(id)?.short ?? id)
            .join(' & ');
        return `→ ${homePlatforms}`;
    }

    // Klick auf Projekt: Direkt zum Projekt navigieren (Booth oder Wall)
    function handleProjectClick(project: ProjectData) {
        const targetPlatform = project.departments[0];
        if (!targetPlatform) return;

        // Bestimme displayType: 'both' → bevorzuge 'booth', ansonsten Projekt-Einstellung
        const displayType = project.displayType === 'wall' ? 'wall' : 'booth';
        
        // Nutze Store-Methode für Navigation (handled Transport automatisch)
        worldStore.navigateToProject(project.id, displayType, targetPlatform);
    }

    // Kompakte Maße
    const compactItemWidth = 3.5;
    const compactItemSpacing = 0.3;

    // Standard-Tafel Maße
    const boardWidth = 6;
    const rowHeight = 1.2;
    const headerHeight = 1.5;
    let boardHeight = $derived(headerHeight + relatedProjects.length * rowHeight + 0.5);
</script>

<T.Group position={position}>
    {#if compact}
        <!-- ========== KOMPAKTER MODUS (horizontal unter Schild) ========== -->
        <Billboard>
            <!-- "Siehe auch:" Label -->
            <Text
                text="Besuchen Sie auch:"
                color="#94a3b8"
                fontSize={0.3}
                anchorX="center"
                anchorY="middle"
                position={[0, 0.6, 0]}
            />

            <!-- Horizontale Projekt-Buttons -->
            {#each relatedProjects as project, i}
                {@const xOffset = (i - (relatedProjects.length - 1) / 2) * (compactItemWidth + compactItemSpacing)}
                {@const isHovered = hoveredProjectId === project.id}
                
                <T.Group position={[xOffset, 0, 0]}>
                    <!-- Button-Hintergrund -->
                    <T.Mesh
                        onpointerenter={() => {
                            hoveredProjectId = project.id;
                            document.body.style.cursor = 'pointer';
                        }}
                        onpointerleave={() => {
                            hoveredProjectId = null;
                            document.body.style.cursor = 'auto';
                        }}
                        onclick={(e: { stopPropagation: () => void }) => {
                            e.stopPropagation();
                            handleProjectClick(project);
                        }}
                    >
                        <T.BoxGeometry args={[compactItemWidth, 0.8, 0.1]} />
                        <T.MeshStandardMaterial
                            color={isHovered ? project.display?.color ?? '#666' : '#374151'}
                            emissive={project.display?.color ?? '#666'}
                            emissiveIntensity={isHovered ? 0.5 : 0.1}
                            metalness={0.2}
                            roughness={0.8}
                        />
                    </T.Mesh>

                    <!-- Farbiger Rand links -->
                    <T.Mesh position={[-compactItemWidth / 2 + 0.08, 0, 0.06]}>
                        <T.BoxGeometry args={[0.15, 0.7, 0.02]} />
                        <T.MeshBasicMaterial color={project.display?.color ?? '#888'} />
                    </T.Mesh>

                    <!-- Projekt-Titel (gekürzt) -->
                    <Text
                        text={project.title.length > 18 ? project.title.slice(0, 16) + '...' : project.title}
                        color={isHovered ? '#ffffff' : '#e2e8f0'}
                        fontSize={0.22}
                        anchorX="center"
                        anchorY="middle"
                        position={[0.1, 0.1, 0.1]}
                        maxWidth={compactItemWidth - 0.4}
                    />

                    <!-- Ziel-Plattform -->
                    <Text
                        text={getHintText(project)}
                        color="#94a3b8"
                        fontSize={0.16}
                        anchorX="center"
                        anchorY="middle"
                        position={[0.1, -0.2, 0.1]}
                    />
                </T.Group>
            {/each}
        </Billboard>

    {:else}
        <!-- ========== STANDARD MODUS (vertikale Tafel mit Pfosten) ========== -->
        <!-- Pfosten (Holz-Optik) -->
        <T.Mesh position={[0, -1, 0]}>
            <T.CylinderGeometry args={[0.15, 0.2, 3, 8]} />
            <T.MeshStandardMaterial 
                color="#8B4513" 
                metalness={0.1} 
                roughness={0.8} 
            />
        </T.Mesh>

        <Billboard position={[0, boardHeight / 2 + 0.5, 0]}>
            <!-- Haupttafel -->
            <T.Mesh>
                <T.BoxGeometry args={[boardWidth, boardHeight, 0.15]} />
                <T.MeshStandardMaterial 
                    color="#5D4037"
                    metalness={0.05}
                    roughness={0.9}
                />
            </T.Mesh>

            <!-- Rahmen -->
            <T.Mesh position.z={-0.05}>
                <T.BoxGeometry args={[boardWidth + 0.3, boardHeight + 0.3, 0.1]} />
                <T.MeshStandardMaterial 
                    color="#8D6E63"
                    metalness={0.1}
                    roughness={0.7}
                />
            </T.Mesh>

            <!-- Header -->
            <Text
                text="🔗 Besuche auch..."
                color="#FFF8E1"
                fontSize={0.5}
                anchorX="center"
                anchorY="middle"
                position={[0, boardHeight / 2 - headerHeight / 2 - 0.2, 0.1]}
            />

            <!-- Trennlinie -->
            <T.Mesh position={[0, boardHeight / 2 - headerHeight, 0.08]}>
                <T.BoxGeometry args={[boardWidth - 0.5, 0.05, 0.02]} />
                <T.MeshBasicMaterial color="#A1887F" />
            </T.Mesh>

            <!-- Projekt-Einträge -->
            {#each relatedProjects as project, i}
                {@const yPos = boardHeight / 2 - headerHeight - (i + 0.7) * rowHeight}
                {@const projectHovered = hoveredProjectId === project.id}
                
                <!-- Hover-Bereich -->
                <T.Mesh 
                    position={[0, yPos, 0.08]}
                    onpointerenter={() => {
                        hoveredProjectId = project.id;
                        document.body.style.cursor = 'pointer';
                    }}
                    onpointerleave={() => {
                        hoveredProjectId = null;
                        document.body.style.cursor = 'auto';
                    }}
                    onclick={(e: { stopPropagation: () => void }) => {
                        e.stopPropagation();
                        handleProjectClick(project);
                    }}
                >
                    <T.BoxGeometry args={[boardWidth - 0.4, rowHeight - 0.1, 0.02]} />
                    <T.MeshBasicMaterial 
                        color={project.display?.color ?? '#888888'}
                        transparent
                        opacity={projectHovered ? 0.3 : 0}
                    />
                </T.Mesh>

                <!-- Farbiger Punkt -->
                <T.Mesh position={[-boardWidth / 2 + 0.5, yPos, 0.1]}>
                    <T.SphereGeometry args={[0.15, 8, 8]} />
                    <T.MeshBasicMaterial color={project.display?.color ?? '#888888'} />
                </T.Mesh>

                <!-- Projekt-Titel -->
                <Text
                    text={project.title}
                    color={projectHovered ? '#FFFFFF' : '#EFEBE9'}
                    fontSize={0.35}
                    anchorX="left"
                    anchorY="middle"
                    position={[-boardWidth / 2 + 0.9, yPos + 0.15, 0.1]}
                    maxWidth={boardWidth - 2}
                />

                <!-- Hinweis-Text -->
                <Text
                    text={getHintText(project)}
                    color="#BCAAA4"
                    fontSize={0.25}
                    anchorX="left"
                    anchorY="middle"
                    position={[-boardWidth / 2 + 0.9, yPos - 0.2, 0.1]}
                />
            {/each}
        </Billboard>

        <!-- Dezentes Licht -->
        <T.PointLight
            position={[0, boardHeight / 2, 1]}
            color="#FFF8E1"
            intensity={glowIntensity.current * 3}
            distance={5}
            decay={2}
        />
    {/if}
</T.Group>
