<script lang="ts">
    import { T, useThrelte, useTask } from "@threlte/core";
    import { HTML, ImageMaterial, Text, useCursor } from "@threlte/extras";
    import { base } from '$app/paths';
    import { BadgeInfo } from 'lucide-svelte';
    import type { ProjectData } from "$lib/types/project";
    import { worldStore } from "$lib/logic/store.svelte";
    import { Spring } from "svelte/motion";

    interface Props {
        project: ProjectData;
        position: [number, number, number];
        platformPosition?: [number, number, number]; // Für Distanz-Check
    }

    let { project, position, platformPosition = [0, 0, 0] }: Props = $props();

    // Display-Daten
    const posterUrl = project.display?.posterImage?.startsWith('/') ? base + project.display.posterImage : project.display?.posterImage;
    const screenshotUrl = project.display?.screenshotUrl?.startsWith('/') ? base + project.display.screenshotUrl : project.display?.screenshotUrl;
    const displayColor = project.display?.color || project.color || '#3b82f6';
    const slogan = project.display?.slogan;
    const shortTeaser = project.shortTeaser;

    // Distanz-Check für Button-Aktivierung
    const { camera } = useThrelte();
    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    const ACTIVATION_DISTANCE = 15;
    let isNearby = $state(false);
    let isButtonHovered = $state(false);
    let frameCounter = 0;
    
    useTask(() => {
        frameCounter++;
        if (frameCounter % 6 !== 0) return;
        
        const camPos = $camera.position;
        // Weltposition = Plattform + lokale Position
        const wx = platformPosition[0] + position[0];
        const wy = platformPosition[1] + position[1];
        const wz = platformPosition[2] + position[2];
        
        const dx = camPos.x - wx;
        const dy = camPos.y - wy;
        const dz = camPos.z - wz;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        isNearby = distSq <= ACTIVATION_DISTANCE * ACTIVATION_DISTANCE;
    });

    // Zustandsableitungen
    let isHovered = $derived(worldStore.state.hoveredId === project.id);
    let isSelected = $derived(worldStore.state.selectedId === project.id);
    let isDimmed = $derived(
        worldStore.state.activePerspective !== "default" &&
            !project.perspectives.includes(worldStore.state.activePerspective),
    );

    // Animierte Werte
    const scaleY = new Spring(1, { stiffness: 0.3, damping: 0.6 });
    const emissiveIntensity = new Spring(0, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        scaleY.target = isHovered ? 1.05 : 1;
        emissiveIntensity.target = isHovered ? 0.4 : 0;
    });

    // Event Handlers
    function handleClick(e: any) {
        e.stopPropagation();
        worldStore.selectProject(project.id);
    }
    
    function handleButtonClick() {
        if (isNearby) {
            worldStore.selectProject(project.id);
        }
    }

    function handlePointerEnter() {
        worldStore.setHovered(project.id);
    }

    function handlePointerLeave() {
        worldStore.setHovered(null);
    }
    
    // Titel-Schriftgröße basierend auf Länge
    const titleFontSize = $derived(
        project.title.length > 25 ? 0.22 : 
        project.title.length > 18 ? 0.26 : 0.32
    );
</script>

<T.Group position={position}>
    <!-- Basis-Plattform -->
    <T.Mesh position.y={0.1} receiveShadow>
        <T.BoxGeometry args={[8, 0.2, 6]} />
        <T.MeshStandardMaterial color="#d4d4d8" roughness={0.7} />
    </T.Mesh>

    <!-- Messestand mit Rollup-Banner -->
    <T.Group scale.y={scaleY.current}>
        
        <!-- === ROLLUP-BEREICH (Breiter für Text + Bild) === -->
        <T.Group position={[0, 0, -2.5]}>
            <!-- Rollup-Ständer (Metall-Basis) - breiter -->
            <T.Mesh position.y={0.1}>
                <T.BoxGeometry args={[7, 0.2, 0.4]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
            </T.Mesh>
            
            <!-- === TEXT-POSTER (links) === -->
            <T.Group position={[-1.8, 0, 0]}>
                <!-- Poster-Hintergrund (farbiger Rahmen) -->
                <T.Mesh position.y={3}>
                    <T.PlaneGeometry args={[3, 5.5]} />
                    <T.MeshBasicMaterial 
                        color={displayColor}
                        transparent
                        opacity={isDimmed ? 0.4 : 0.9}
                    />
                </T.Mesh>
                
                <!-- Poster-Inhalt (dunkel) -->
                <T.Mesh position={[0, 3, 0.02]}>
                    <T.PlaneGeometry args={[2.7, 5.2]} />
                    <T.MeshBasicMaterial color="#0f172a" />
                </T.Mesh>
                
                <!-- Projekt-Titel -->
                <Text
                    text={project.title}
                    fontSize={titleFontSize}
                    anchorX="center"
                    anchorY="top"
                    position={[0, 5.3, 0.05]}
                    color="#ffffff"
                    fontWeight="bold"
                    maxWidth={2.4}
                    textAlign="center"
                />
                
                <!-- Trennlinie -->
                <T.Mesh position={[0, 4.5, 0.04]}>
                    <T.PlaneGeometry args={[2, 0.02]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>
                
                <!-- Beschreibung (shortTeaser) -->
                {#if shortTeaser}
                    <Text
                        text={shortTeaser}
                        fontSize={0.16}
                        anchorX="center"
                        anchorY="top"
                        position={[0, 4.3, 0.05]}
                        color="#cbd5e1"
                        maxWidth={2.4}
                        textAlign="center"
                        lineHeight={1.4}
                    />
                {/if}
                
                <!-- Slogan (unten) -->
                {#if slogan}
                    <Text
                        text={slogan}
                        fontSize={0.18}
                        anchorX="center"
                        anchorY="bottom"
                        position={[0, 0.9, 0.05]}
                        color={displayColor}
                        fontStyle="italic"
                        maxWidth={2.4}
                        textAlign="center"
                    />
                {/if}
                
                <!-- === INFO-BUTTON unter dem Text-Poster === -->
                <T.Group position={[0, -0.2, 0.1]}>
                    <!-- Knopf-Gehäuse -->
                    <T.Mesh rotation.x={Math.PI / 2}>
                        <T.CylinderGeometry args={[0.35, 0.35, 0.12, 8]} />
                        <T.MeshStandardMaterial 
                            color={isNearby ? '#1e293b' : '#0f172a'}
                            metalness={0.5}
                            roughness={0.5}
                        />
                    </T.Mesh>
                    
                    <!-- Leuchtender Knopf -->
                    <T.Mesh 
                        position.z={0.08}
                        onclick={handleButtonClick}
                        onpointerenter={() => { isButtonHovered = true; if (isNearby) onPointerEnter(); }}
                        onpointerleave={() => { isButtonHovered = false; onPointerLeave(); }}
                    >
                        <T.CircleGeometry args={[0.28, 16]} />
                        <T.MeshBasicMaterial 
                            color={isNearby ? displayColor : '#475569'}
                            transparent
                            opacity={isButtonHovered ? 1 : 0.8}
                        />
                    </T.Mesh>
                    
                    <!-- Glow-Ring (nur wenn nah) -->
                    {#if isNearby}
                        <T.Mesh position.z={0.01}>
                            <T.RingGeometry args={[0.3, 0.45, 16]} />
                            <T.MeshBasicMaterial 
                                color={displayColor}
                                transparent
                                opacity={isButtonHovered ? 0.6 : 0.3}
                            />
                        </T.Mesh>
                    {/if}
                    
                    <!-- Info-Icon (Lucide BadgeInfo) -->
                    <HTML position={[0, 0, 0.1]} center transform scale={0.25} pointerEvents="none">
                        <div style="pointer-events: none;">
                            <BadgeInfo 
                                size={48} 
                                strokeWidth={2}
                                color={isNearby ? '#ffffff' : '#94a3b8'}
                            />
                        </div>
                    </HTML>
                    
                    <!-- Hover-Tooltip -->
                    {#if isButtonHovered}
                        <HTML position={[0.7, 0.2, 0]} center={false} transform={false}>
                            <div style="
                                background: {isNearby ? '#ffffff' : 'rgba(15, 23, 42, 0.9)'};
                                color: {isNearby ? '#0f172a' : '#94a3b8'};
                                padding: 6px 10px;
                                border-radius: 4px;
                                font-size: 0.75rem;
                                font-weight: 600;
                                white-space: nowrap;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                border-bottom: 2px solid {isNearby ? displayColor : '#475569'};
                            ">
                                {isNearby ? 'Details anzeigen' : 'Näher kommen...'}
                            </div>
                        </HTML>
                    {/if}
                </T.Group>
            </T.Group>
            
            <!-- === POSTER-BILD (rechts) === -->
            {#if posterUrl}
                <T.Group position={[1.8, 0, 0]}>
                    <!-- Rahmen für Poster-Bild -->
                    <T.Mesh position.y={3}>
                        <T.PlaneGeometry args={[3.2, 5.5]} />
                        <T.MeshBasicMaterial 
                            color={displayColor}
                            transparent
                            opacity={isDimmed ? 0.4 : 0.8}
                        />
                    </T.Mesh>
                    
                    <!-- Poster-Bild -->
                    <T.Mesh 
                        position={[0, 3, 0.02]}
                        onclick={handleClick}
                        onpointerenter={handlePointerEnter}
                        onpointerleave={handlePointerLeave}
                    >
                        <T.PlaneGeometry args={[3, 5.2]} />
                        <ImageMaterial 
                            url={posterUrl}
                            transparent
                            opacity={isDimmed ? 0.4 : 0.95}
                        />
                    </T.Mesh>
                </T.Group>
            {:else}
                <!-- Fallback wenn kein posterImage: nur Text-Poster zentriert -->
                <T.Mesh position={[1.8, 3, 0]}>
                    <T.PlaneGeometry args={[3, 5.5]} />
                    <T.MeshStandardMaterial
                        color={displayColor}
                        emissive={displayColor}
                        emissiveIntensity={emissiveIntensity.current}
                        transparent
                        opacity={isDimmed ? 0.4 : 0.6}
                    />
                </T.Mesh>
            {/if}
            
            <!-- Rollup-Rahmen oben -->
            <T.Mesh position.y={5.8}>
                <T.BoxGeometry args={[7.2, 0.1, 0.05]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
            </T.Mesh>
            
            <!-- Stützstange hinten -->
            <T.Mesh position={[0, 3, -0.15]} rotation.x={Math.PI * 0.02}>
                <T.CylinderGeometry args={[0.02, 0.02, 5.8, 8]} />
                <T.MeshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
            </T.Mesh>
        </T.Group>
        
        <!-- === HINTERWAND MIT SCREENSHOT === -->
        <T.Group position={[0, 0, -3.5]}>
            <!-- Wand-Rahmen -->
            <T.Mesh position.y={2.5}>
                <T.BoxGeometry args={[8, 4.5, 0.15]} />
                <T.MeshStandardMaterial
                    color="#1e293b"
                    transparent
                    opacity={isDimmed ? 0.3 : 0.95}
                />
            </T.Mesh>
            
            <!-- Screenshot-Display (wenn vorhanden) -->
            {#if screenshotUrl}
                <T.Mesh 
                    position={[0, 2.5, 0.1]}
                    onclick={handleClick}
                    onpointerenter={handlePointerEnter}
                    onpointerleave={handlePointerLeave}
                >
                    <T.PlaneGeometry args={[7.5, 4]} />
                    <ImageMaterial 
                        url={screenshotUrl}
                        transparent
                        opacity={isDimmed ? 0.3 : 0.95}
                    />
                </T.Mesh>
            {/if}
        </T.Group>
        
        <!-- === SEITEN-PANELS === -->
        <!-- Linkes Panel -->
        <T.Mesh
            position={[-4.2, 2.5, -1]}
            rotation.y={Math.PI / 2}
        >
            <T.PlaneGeometry args={[4, 4]} />
            <T.MeshStandardMaterial
                color={displayColor}
                transparent
                opacity={isDimmed ? 0.2 : 0.3}
            />
        </T.Mesh>

        <!-- Rechtes Panel -->
        <T.Mesh
            position={[4.2, 2.5, -1]}
            rotation.y={-Math.PI / 2}
        >
            <T.PlaneGeometry args={[4, 4]} />
            <T.MeshStandardMaterial
                color={displayColor}
                transparent
                opacity={isDimmed ? 0.2 : 0.3}
            />
        </T.Mesh>
        
        <!-- === TITEL AUF DEM BODEN === -->
        <Text
            text={project.title}
            fontSize={0.3}
            anchorX="center"
            anchorY="middle"
            position={[0, 0.15, 1.5]}
            rotation.x={-Math.PI / 2}
            color="#ffffff"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={6}
            textAlign="center"
        />
    </T.Group>
</T.Group>
