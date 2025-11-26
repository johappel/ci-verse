<script lang="ts">
    /**
     * ExhibitBooth - Freistehender Messestand als Rollup-Banner
     * 
     * Struktur:
     * - Schmale Bodenplatte (Rollup-Fuß)
     * - Großes vertikales Banner
     * - Optional: Video/Bild-Bereich
     * - Interaktiv: Hover zeigt Details, Klick öffnet Projekt
     */
    import { T } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import { spring } from 'svelte/motion';
    import type { ProjectData } from '$lib/types/project';

    interface Props {
        project: ProjectData;
        position?: [number, number, number];
        rotation?: number; // Y-Rotation in Radians
        size?: 'small' | 'medium' | 'large';
    }

    let { 
        project, 
        position = [0, 0, 0], 
        rotation = 0,
        size = 'medium'
    }: Props = $props();

    const { hovering, onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);
    
    // Scale Animation
    let scale = spring(1, { stiffness: 0.3, damping: 0.8 });
    
    $effect(() => {
        scale.set(isHovered ? 1.03 : 1);
    });

    // Größen-Varianten für Rollup
    const sizes = {
        small:  { width: 2.5, height: 5,   footWidth: 2.8,  footDepth: 0.8 },
        medium: { width: 3,   height: 6.5, footWidth: 3.3,  footDepth: 1.0 },
        large:  { width: 4,   height: 8,   footWidth: 4.3,  footDepth: 1.2 }
    };
    
    const s = sizes[size];
    const displayColor = project.display?.color || project.color || '#3b82f6';

    function handleClick() {
        if (project.externalUrl) {
            window.open(project.externalUrl, '_blank');
        }
    }

    function handlePointerEnter() {
        isHovered = true;
        onPointerEnter();
    }

    function handlePointerLeave() {
        isHovered = false;
        onPointerLeave();
    }
</script>

<T.Group position={position} rotation.y={rotation} scale={$scale}>
    
    <!-- ========== ROLLUP-FUSS (Basis) ========== -->
    <T.Group>
        <!-- Hauptfuß (flache Box) -->
        <T.Mesh position.y={0.08} castShadow receiveShadow>
            <T.BoxGeometry args={[s.footWidth, 0.15, s.footDepth]} />
            <T.MeshStandardMaterial 
                color="#374151"
                metalness={0.7}
                roughness={0.3}
            />
        </T.Mesh>
        
        <!-- Farbiger Streifen auf dem Fuß -->
        <T.Mesh position={[0, 0.16, 0]}>
            <T.BoxGeometry args={[s.footWidth * 0.9, 0.02, s.footDepth * 0.6]} />
            <T.MeshBasicMaterial color={displayColor} />
        </T.Mesh>

        <!-- Rollup-Mechanismus (Zylinder) -->
        <T.Mesh position={[0, 0.25, 0]} rotation.z={Math.PI / 2}>
            <T.CylinderGeometry args={[0.08, 0.08, s.width * 0.9, 16]} />
            <T.MeshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </T.Mesh>
    </T.Group>

    <!-- ========== BANNER (Hauptfläche) - DOPPELSEITIG ========== -->
    <T.Group position={[0, s.height / 2 + 0.3, 0]}>
        
        <!-- Banner-Kern (dünne Box für Stabilität) -->
        <T.Mesh>
            <T.BoxGeometry args={[s.width, s.height, 0.04]} />
            <T.MeshStandardMaterial 
                color="#1e293b"
                metalness={0.1}
                roughness={0.9}
            />
        </T.Mesh>

        <!-- ========== VORDERSEITE ========== -->
        <T.Group position.z={0.03}>
            <!-- Display-Fläche -->
            <T.Mesh 
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
                onclick={handleClick}
            >
                <T.PlaneGeometry args={[s.width, s.height]} />
                <T.MeshBasicMaterial color="#0f172a" />
            </T.Mesh>

            <!-- Farbiger Rahmen -->
            <T.Mesh position={[0, s.height / 2 - 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[0, -s.height / 2 + 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[-s.width / 2 + 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[s.width / 2 - 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>

            <!-- Content Vorderseite -->
            {@const titleFontSize = project.title.length > 20 ? 0.28 : project.title.length > 14 ? 0.32 : 0.4}
            <Text
                text={project.title}
                fontSize={titleFontSize}
                anchorX="center"
                anchorY="top"
                position={[0, s.height * 0.4, 0.02]}
                color="#ffffff"
                fontWeight="bold"
                maxWidth={s.width * 0.85}
                textAlign="center"
            />

            {#if project.display?.slogan}
                <Text
                    text={project.display.slogan}
                    fontSize={0.22}
                    anchorX="center"
                    anchorY="top"
                    position={[0, s.height * 0.25, 0.02]}
                    color={displayColor}
                    maxWidth={s.width * 0.8}
                    textAlign="center"
                    fontStyle="italic"
                />
            {/if}

            <!-- Icon-Bereich -->
            <T.Mesh position={[0, -s.height * 0.05, 0.01]}>
                <T.PlaneGeometry args={[s.width * 0.7, s.height * 0.35]} />
                <T.MeshBasicMaterial color={displayColor} transparent opacity={0.15} />
            </T.Mesh>
            
            {#if project.display?.icon}
                <Text
                    text={project.display.icon}
                    fontSize={1.5}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -s.height * 0.05, 0.02]}
                />
            {:else}
                <T.Mesh position={[0, -s.height * 0.05, 0.02]}>
                    <T.RingGeometry args={[0.4, 0.6, 6]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>
            {/if}

            <Text
                text="→ Mehr erfahren"
                fontSize={0.18}
                anchorX="center"
                anchorY="bottom"
                position={[0, -s.height * 0.42, 0.02]}
                color={isHovered ? '#ffffff' : '#64748b'}
            />
        </T.Group>

        <!-- ========== RÜCKSEITE (gespiegelt) ========== -->
        <T.Group position.z={-0.03} rotation.y={Math.PI}>
            <!-- Display-Fläche -->
            <T.Mesh 
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
                onclick={handleClick}
            >
                <T.PlaneGeometry args={[s.width, s.height]} />
                <T.MeshBasicMaterial color="#0f172a" />
            </T.Mesh>

            <!-- Farbiger Rahmen -->
            <T.Mesh position={[0, s.height / 2 - 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[0, -s.height / 2 + 0.06, 0.01]}>
                <T.BoxGeometry args={[s.width, 0.12, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[-s.width / 2 + 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>
            <T.Mesh position={[s.width / 2 - 0.04, 0, 0.01]}>
                <T.BoxGeometry args={[0.08, s.height, 0.02]} />
                <T.MeshBasicMaterial color={displayColor} />
            </T.Mesh>

            <!-- Content Rückseite (identisch) -->
            {@const titleFontSize = project.title.length > 20 ? 0.28 : project.title.length > 14 ? 0.32 : 0.4}
            <Text
                text={project.title}
                fontSize={titleFontSize}
                anchorX="center"
                anchorY="top"
                position={[0, s.height * 0.4, 0.02]}
                color="#ffffff"
                fontWeight="bold"
                maxWidth={s.width * 0.85}
                textAlign="center"
            />

            {#if project.display?.slogan}
                <Text
                    text={project.display.slogan}
                    fontSize={0.22}
                    anchorX="center"
                    anchorY="top"
                    position={[0, s.height * 0.25, 0.02]}
                    color={displayColor}
                    maxWidth={s.width * 0.8}
                    textAlign="center"
                    fontStyle="italic"
                />
            {/if}

            <!-- Icon-Bereich -->
            <T.Mesh position={[0, -s.height * 0.05, 0.01]}>
                <T.PlaneGeometry args={[s.width * 0.7, s.height * 0.35]} />
                <T.MeshBasicMaterial color={displayColor} transparent opacity={0.15} />
            </T.Mesh>
            
            {#if project.display?.icon}
                <Text
                    text={project.display.icon}
                    fontSize={1.5}
                    anchorX="center"
                    anchorY="middle"
                    position={[0, -s.height * 0.05, 0.02]}
                />
            {:else}
                <T.Mesh position={[0, -s.height * 0.05, 0.02]}>
                    <T.RingGeometry args={[0.4, 0.6, 6]} />
                    <T.MeshBasicMaterial color={displayColor} />
                </T.Mesh>
            {/if}

            <Text
                text="→ Mehr erfahren"
                fontSize={0.18}
                anchorX="center"
                anchorY="bottom"
                position={[0, -s.height * 0.42, 0.02]}
                color={isHovered ? '#ffffff' : '#64748b'}
            />
        </T.Group>

        <!-- Hover-Glow Effekt (beidseitig) -->
        {#if isHovered}
            <T.Mesh position.z={0.04}>
                <T.PlaneGeometry args={[s.width + 0.2, s.height + 0.2]} />
                <T.MeshBasicMaterial color={displayColor} transparent opacity={0.2} side={2} />
            </T.Mesh>
        {/if}
    </T.Group>

    <!-- Spotlight bei Hover (von beiden Seiten) -->
    {#if isHovered}
        <T.SpotLight
            position={[0, s.height + 2, 3]}
            target.position={[0, s.height / 2, 0]}
            color={displayColor}
            intensity={60}
            distance={s.height + 4}
            angle={0.4}
            penumbra={0.7}
            decay={1.5}
        />
        <T.SpotLight
            position={[0, s.height + 2, -3]}
            target.position={[0, s.height / 2, 0]}
            color={displayColor}
            intensity={60}
            distance={s.height + 4}
            angle={0.4}
            penumbra={0.7}
            decay={1.5}
        />
    {/if}

    <!-- Hover-Tooltip (seitlich neben dem Banner, auf Augenhöhe) -->
    {#if isHovered}
        <HTML position={[s.width / 2 + 0.3, s.height * 0.5, 0]} center={false} transform={false}>
            <div style="
                background: #ffffff;
                color: #0f172a;
                padding: 14px 18px;
                border-radius: 8px;
                width: 200px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                border-left: 4px solid {displayColor};
            ">
                <h3 style="font-weight: 700; font-size: 0.9rem; margin: 0 0 6px 0;">
                    {project.title}
                </h3>
                {#if project.shortTeaser}
                    <p style="font-size: 0.75rem; color: #374151; line-height: 1.4; margin: 0 0 8px 0;">
                        {project.shortTeaser}
                    </p>
                {/if}
                {#if project.departments?.length}
                    <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 8px;">
                        {#each project.departments as dept}
                            <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem;">
                                {dept}
                            </span>
                        {/each}
                    </div>
                {/if}
                <p style="font-size: 0.7rem; color: {displayColor}; margin: 0; font-weight: 500;">
                    Klicken für mehr →
                </p>
            </div>
        </HTML>
    {/if}
</T.Group>
