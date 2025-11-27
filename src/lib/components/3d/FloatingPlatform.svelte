<script lang="ts">
    import { T, useTask } from "@threlte/core";
    import { HTML } from "@threlte/extras";
    import type { ProjectData, Department } from "$lib/types/project";
    import type { Vector3 } from "three";
    import { worldStore } from "$lib/logic/store.svelte";
    import { Spring } from "svelte/motion";

    interface Props {
        project: ProjectData;
        position: Vector3;
    }

    let { project, position }: Props = $props();

    // Zustände müssen vor shouldAnimate definiert werden
    let isHovered = $derived(worldStore.state.hoveredId === project.id);
    let isActive = $derived(
        worldStore.state.activeQPlatform === project.departments[0],
    );

    // Langsame Rotation - nur wenn sichtbar (gehovert oder aktiv)
    let rotation = $state(0);
    let shouldAnimate = $derived(isHovered || isActive);
    
    useTask((delta) => {
        if (shouldAnimate) {
            rotation += delta * 0.3;
        }
    });

    // Animierte Werte
    const scale = new Spring(1, { stiffness: 0.3, damping: 0.6 });
    const glowIntensity = new Spring(0.2, { stiffness: 0.4, damping: 0.7 });

    $effect(() => {
        scale.target = isHovered || isActive ? 1.3 : 1;
        glowIntensity.target = isActive ? 1.2 : isHovered ? 0.6 : 0.2;
    });

    // Farbe basierend auf Q-Department
    let platformColor = $derived.by(() => {
        switch (project.departments[0]) {
            case "Q1":
                return "#a78bfa"; // Forschung = Violet
            case "Q2":
                return "#fbbf24"; // Europa = Gold
            case "Q3":
                return "#22d3ee"; // Digital = Cyan
            default:
                return "#ffffff";
        }
    });

    // Event Handlers
    function handleClick(e: any) {
        console.log("FloatingPlatform clicked!", project.id, project.departments[0]);
        e.stopPropagation();
        worldStore.setQPlatform(project.departments[0] as Department);
    }

    function handlePointerEnter(e: any) {
        console.log("FloatingPlatform hover enter!", project.id);
        worldStore.setHovered(project.id);
    }

    function handlePointerLeave(e: any) {
        console.log("FloatingPlatform hover leave!", project.id);
        worldStore.setHovered(null);
    }
</script>

<T.Group position={[position.x, position.y, position.z]}>
    <!-- Schwebender Kristall (Icosahedron) - Interaktiver Bereich -->
    <T.Mesh
        rotation.y={rotation}
        onclick={handleClick}
        onpointerenter={handlePointerEnter}
        onpointerleave={handlePointerLeave}
        scale={scale.current}
    >
        <T.IcosahedronGeometry args={[2, 0]} />
        <T.MeshStandardMaterial
            color={platformColor}
            emissive={platformColor}
            emissiveIntensity={glowIntensity.current}
            transparent
            opacity={0.85}
            metalness={0.4}
            roughness={0.15}
        />
    </T.Mesh>

    <!-- Innerer leuchtender Kern -->
    <T.Mesh rotation.y={-rotation * 0.5} scale={0.6}>
        <T.OctahedronGeometry args={[1.5, 0]} />
        <T.MeshBasicMaterial
            color={platformColor}
            transparent
            opacity={0.4}
        />
    </T.Mesh>

    <!-- Glow-Ring um den Kristall (dicker, heller) -->
    <T.Mesh rotation.x={Math.PI / 2} scale={scale.current}>
        <T.TorusGeometry args={[3.5, 0.15, 8, 24]} />
        <T.MeshBasicMaterial
            color={platformColor}
            transparent
            opacity={isActive ? 0.9 : 0.5}
        />
    </T.Mesh>

    <!-- Zweiter Ring (gekippt, rotiert mit) -->
    <T.Mesh rotation.x={Math.PI / 3} rotation.z={rotation * 0.5} scale={scale.current}>
        <T.TorusGeometry args={[4.2, 0.1, 8, 24]} />
        <T.MeshBasicMaterial
            color={platformColor}
            transparent
            opacity={isActive ? 0.7 : 0.35}
        />
    </T.Mesh>

    <!-- Label -->
    {#if isHovered || isActive}
        <HTML transform position={[0, 5, 0]} center>
            <div
                class="bg-black/90 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md whitespace-nowrap border border-white/20 shadow-lg"
            >
                <span class="opacity-60 text-xs mr-2"
                    >{project.departments[0]}</span
                >
                {project.title}
            </div>
        </HTML>
    {/if}

    <!-- Punkt-Licht für lokalen Glow-Effekt (viel stärker) -->
    <T.PointLight
        color={platformColor}
        intensity={isActive ? 80 : isHovered ? 50 : 25}
        distance={35}
        decay={1.5}
    />
</T.Group>
