<script lang="ts">
    import { T } from "@threlte/core";
    import { HTML, ImageMaterial, Text } from "@threlte/extras";
    import type { ProjectData } from "$lib/types/project";
    import { worldStore } from "$lib/logic/store.svelte";
    import { Spring } from "svelte/motion";

    interface Props {
        project: ProjectData;
        position: [number, number, number];
    }

    let { project, position }: Props = $props();

    // Display-Daten
    const posterUrl = project.display?.posterImage;
    const screenshotUrl = project.display?.screenshotUrl;
    const displayColor = project.display?.color || project.color || '#3b82f6';
    const slogan = project.display?.slogan;

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
        scaleY.target = isHovered ? 1.15 : 1;
        emissiveIntensity.target = isHovered ? 0.4 : 0;
    });

    // Event Handlers
    function handleClick(e: any) {
        console.log("ExhibitStand clicked!", project.id);
        e.stopPropagation();
        worldStore.selectProject(project.id);
    }

    function handlePointerEnter() {
        console.log("ExhibitStand hover enter!", project.id);
        worldStore.setHovered(project.id);
    }

    function handlePointerLeave() {
        console.log("ExhibitStand hover leave!", project.id);
        worldStore.setHovered(null);
    }
</script>

<T.Group position={position}>
    <!-- Basis-Plattform -->
    <T.Mesh position.y={0.1} receiveShadow>
        <T.BoxGeometry args={[6, 0.2, 6]} />
        <T.MeshStandardMaterial color="#d4d4d8" roughness={0.7} />
    </T.Mesh>

    <!-- Messestand mit Rollup-Banner -->
    <T.Group scale.y={scaleY.current}>
        
        <!-- === ROLLUP-BANNER (Hauptelement) === -->
        <T.Group position={[0, 0, -2.5]}>
            <!-- Rollup-Ständer (Metall-Basis) -->
            <T.Mesh position.y={0.1}>
                <T.BoxGeometry args={[2.8, 0.2, 0.4]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
            </T.Mesh>
            
            <!-- Rollup-Banner mit Poster-Bild -->
            <T.Mesh 
                position.y={2.8}
                onclick={handleClick}
                onpointerenter={handlePointerEnter}
                onpointerleave={handlePointerLeave}
            >
                <!-- Banner-Größe: 2.5 breit x 5 hoch (typisches Rollup-Format) -->
                <T.PlaneGeometry args={[2.5, 5]} />
                {#if posterUrl}
                    <ImageMaterial 
                        url={posterUrl}
                        transparent
                        opacity={isDimmed ? 0.4 : 1}
                    />
                {:else}
                    <!-- Fallback: Farbiger Hintergrund -->
                    <T.MeshStandardMaterial
                        color={displayColor}
                        emissive={displayColor}
                        emissiveIntensity={emissiveIntensity.current}
                        transparent
                        opacity={isDimmed ? 0.4 : 1}
                    />
                {/if}
            </T.Mesh>
            
            <!-- Rollup-Rahmen oben -->
            <T.Mesh position.y={5.35}>
                <T.BoxGeometry args={[2.7, 0.1, 0.05]} />
                <T.MeshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
            </T.Mesh>
            
            <!-- Stützstange hinten -->
            <T.Mesh position={[0, 2.7, -0.15]} rotation.x={Math.PI * 0.03}>
                <T.CylinderGeometry args={[0.02, 0.02, 5.2, 8]} />
                <T.MeshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
            </T.Mesh>
        </T.Group>
        
        <!-- === HINTERWAND MIT SCREENSHOT === -->
        <T.Group position={[0, 0, -3.2]}>
            <!-- Wand-Rahmen -->
            <T.Mesh position.y={2.5}>
                <T.BoxGeometry args={[6, 4.5, 0.15]} />
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
                    <T.PlaneGeometry args={[5.5, 4]} />
                    <ImageMaterial 
                        url={screenshotUrl}
                        transparent
                        opacity={isDimmed ? 0.3 : 0.95}
                    />
                </T.Mesh>
            {/if}
        </T.Group>
        
        <!-- === SEITEN-PANELS === -->
        <!-- Linkes Panel mit Projekt-Info -->
        <T.Mesh
            position={[-3.2, 2.5, -1]}
            rotation.y={Math.PI / 2}
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
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
            position={[3.2, 2.5, -1]}
            rotation.y={-Math.PI / 2}
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
        >
            <T.PlaneGeometry args={[4, 4]} />
            <T.MeshStandardMaterial
                color={displayColor}
                transparent
                opacity={isDimmed ? 0.2 : 0.3}
            />
        </T.Mesh>
        
        <!-- === TEXT-ELEMENTE === -->
        <!-- Projekt-Titel auf dem Boden vor dem Rollup -->
        <Text
            text={project.title}
            fontSize={0.35}
            anchorX="center"
            anchorY="middle"
            position={[0, 0.15, 1]}
            rotation.x={-Math.PI / 2}
            color="#ffffff"
            outlineWidth={0.02}
            outlineColor="#000000"
            maxWidth={5}
            textAlign="center"
        />
        
        <!-- Slogan über dem Rollup -->
        {#if slogan}
            <Text
                text={slogan}
                fontSize={0.25}
                anchorX="center"
                anchorY="bottom"
                position={[0, 5.6, -2.5]}
                color={displayColor}
                fontStyle="italic"
                maxWidth={3}
                textAlign="center"
            />
        {/if}
    </T.Group>

    <!-- Hover-Label (HTML Overlay) -->
    {#if isHovered}
        <HTML transform position={[0, 5.5, 0]} center>
            <div
                class="bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm pointer-events-none whitespace-nowrap"
            >
                {project.title}
            </div>
        </HTML>
    {/if}
</T.Group>
