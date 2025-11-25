<script lang="ts">
    import { T, useTask } from "@threlte/core";
    import { HTML } from "@threlte/extras";
    import type { ProjectData } from "$lib/types/project";
    import { worldStore } from "$lib/logic/store.svelte";
    import { spring } from "svelte/motion";

    interface Props {
        project: ProjectData;
        position: [number, number, number];
    }

    let { project, position }: Props = $props();

    // Zustandsableitungen
    let isHovered = $derived(worldStore.state.hoveredId === project.id);
    let isSelected = $derived(worldStore.state.selectedId === project.id);
    let isDimmed = $derived(
        worldStore.state.activePerspective !== "default" &&
            !project.perspectives.includes(worldStore.state.activePerspective),
    );

    // Animierte Werte
    let scaleY = spring(1, { stiffness: 0.3, damping: 0.6 });
    let emissiveIntensity = spring(0, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        scaleY.set(isHovered ? 1.15 : 1);
        emissiveIntensity.set(isHovered ? 0.4 : 0);
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

    <!-- Haupt-Panel (Vorne) mit Screenshot -->
    <T.Group scale.y={$scaleY}>
        <!-- Hinterwand - INTERAKTIV -->
        <T.Mesh 
            position={[0, 2.5, -2.5]} 
            castShadow
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
        >
            <T.BoxGeometry args={[5.5, 4, 0.2]} />
            <T.MeshStandardMaterial
                color={project.color || "#ffffff"}
                emissive={project.color || "#ffffff"}
                emissiveIntensity={$emissiveIntensity}
                transparent
                opacity={isDimmed ? 0.3 : 1}
            />
        </T.Mesh>

        <!-- Vorderes Display-Panel (Screenshot) - INTERAKTIV -->
        <T.Mesh 
            position={[0, 2.5, -2.3]} 
            castShadow
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
        >
            <T.PlaneGeometry args={[5, 3.5]} />
            <T.MeshStandardMaterial
                color="#ffffff"
                transparent
                opacity={isDimmed ? 0.25 : 0.95}
            />
        </T.Mesh>

        <!-- Linkes Seiten-Panel - INTERAKTIV -->
        <T.Mesh
            position={[-2.8, 2.5, -0.5]}
            rotation.y={Math.PI / 2}
            castShadow
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
        >
            <T.PlaneGeometry args={[4, 3.5]} />
            <T.MeshStandardMaterial
                color="#f5f5f5"
                transparent
                opacity={isDimmed ? 0.2 : 0.8}
            />
        </T.Mesh>

        <!-- Rechtes Seiten-Panel - INTERAKTIV -->
        <T.Mesh
            position={[2.8, 2.5, -0.5]}
            rotation.y={-Math.PI / 2}
            castShadow
            onclick={handleClick}
            onpointerenter={handlePointerEnter}
            onpointerleave={handlePointerLeave}
        >
            <T.PlaneGeometry args={[4, 3.5]} />
            <T.MeshStandardMaterial
                color="#f5f5f5"
                transparent
                opacity={isDimmed ? 0.2 : 0.8}
            />
        </T.Mesh>

        <!-- Rahmen-Streben (Holz-Optik) -->
        <!-- Linke Säule -->
        <T.Mesh position={[-2.7, 2, -2.5]} castShadow>
            <T.BoxGeometry args={[0.15, 4, 0.15]} />
            <T.MeshStandardMaterial color="#8b5a3c" roughness={0.8} />
        </T.Mesh>

        <!-- Rechte Säule -->
        <T.Mesh position={[2.7, 2, -2.5]} castShadow>
            <T.BoxGeometry args={[0.15, 4, 0.15]} />
            <T.MeshStandardMaterial color="#8b5a3c" roughness={0.8} />
        </T.Mesh>

        <!-- Obere Querstrebe -->
        <T.Mesh position={[0, 4.5, -2.5]} castShadow>
            <T.BoxGeometry args={[5.5, 0.15, 0.15]} />
            <T.MeshStandardMaterial color="#8b5a3c" roughness={0.8} />
        </T.Mesh>
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
