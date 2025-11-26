<script lang="ts">
    /**
     * ExhibitBooth - Freistehender Messestand für ein Projekt
     * 
     * Struktur:
     * - Podest/Basis
     * - Vertikaler Info-Pillar mit Logo
     * - Horizontales Schild mit Titel + Slogan
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
        scale.set(isHovered ? 1.05 : 1);
    });

    // Größen-Varianten
    const sizes = {
        small: { podest: [3, 0.3, 3], pillar: 3, sign: [4, 1.2] },
        medium: { podest: [4, 0.4, 4], pillar: 4, sign: [5, 1.5] },
        large: { podest: [5, 0.5, 5], pillar: 5, sign: [6, 1.8] }
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
    <!-- Podest / Basis -->
    <T.Mesh 
        position.y={s.podest[1] / 2}
        castShadow 
        receiveShadow
        onpointerenter={handlePointerEnter}
        onpointerleave={handlePointerLeave}
        onclick={handleClick}
    >
        <T.BoxGeometry args={s.podest} />
        <T.MeshStandardMaterial 
            color={displayColor}
            metalness={0.3}
            roughness={0.7}
        />
    </T.Mesh>

    <!-- Farbiger Rand um Podest -->
    <T.Mesh position.y={s.podest[1]} rotation.x={-Math.PI / 2}>
        <T.RingGeometry args={[s.podest[0] * 0.45, s.podest[0] * 0.5, 4]} />
        <T.MeshBasicMaterial 
            color={displayColor}
            transparent
            opacity={isHovered ? 0.8 : 0.4}
        />
    </T.Mesh>

    <!-- Info-Pillar (Säule mit "i" Symbol) -->
    <T.Group position={[0, s.podest[1], 0]}>
        <!-- Säule -->
        <T.Mesh position.y={s.pillar / 2} castShadow>
            <T.CylinderGeometry args={[0.15, 0.2, s.pillar, 8]} />
            <T.MeshStandardMaterial 
                color="#374151"
                metalness={0.6}
                roughness={0.4}
            />
        </T.Mesh>

        <!-- Info-Kugel oben -->
        <T.Mesh position.y={s.pillar + 0.4}>
            <T.SphereGeometry args={[0.4, 16, 16]} />
            <T.MeshStandardMaterial 
                color={isHovered ? '#ffffff' : displayColor}
                emissive={displayColor}
                emissiveIntensity={isHovered ? 0.5 : 0.2}
            />
        </T.Mesh>

        <!-- "i" Symbol auf der Kugel -->
        <Text
            text="i"
            fontSize={0.4}
            anchorX="center"
            anchorY="middle"
            position={[0, s.pillar + 0.4, 0.35]}
            color={isHovered ? displayColor : '#ffffff'}
            fontWeight="bold"
        />
    </T.Group>

    <!-- Horizontales Schild -->
    <T.Group position={[0, s.podest[1] + s.pillar * 0.6, 0]}>
        <!-- Schild-Hintergrund -->
        <T.Mesh castShadow>
            <T.BoxGeometry args={[s.sign[0], s.sign[1], 0.15]} />
            <T.MeshStandardMaterial 
                color="#1e293b"
                metalness={0.1}
                roughness={0.8}
            />
        </T.Mesh>

        <!-- Farbiger Streifen oben -->
        <T.Mesh position={[0, s.sign[1] / 2 - 0.1, 0.08]}>
            <T.BoxGeometry args={[s.sign[0], 0.15, 0.02]} />
            <T.MeshBasicMaterial color={displayColor} />
        </T.Mesh>

        <!-- Projekt-Titel -->
        <Text
            text={project.title}
            fontSize={size === 'large' ? 0.35 : size === 'medium' ? 0.3 : 0.25}
            anchorX="center"
            anchorY="middle"
            position={[0, s.sign[1] * 0.15, 0.1]}
            color="#ffffff"
            fontWeight="bold"
            maxWidth={s.sign[0] * 0.9}
            textAlign="center"
        />

        <!-- Slogan (falls vorhanden) -->
        {#if project.display?.slogan}
            <Text
                text={project.display.slogan}
                fontSize={size === 'large' ? 0.2 : size === 'medium' ? 0.18 : 0.15}
                anchorX="center"
                anchorY="middle"
                position={[0, -s.sign[1] * 0.2, 0.1]}
                color={displayColor}
                maxWidth={s.sign[0] * 0.85}
                textAlign="center"
                fontStyle="italic"
            />
        {/if}

        <!-- Rückseite (gespiegelt) -->
        <Text
            text={project.title}
            fontSize={size === 'large' ? 0.35 : size === 'medium' ? 0.3 : 0.25}
            anchorX="center"
            anchorY="middle"
            position={[0, s.sign[1] * 0.15, -0.1]}
            rotation.y={Math.PI}
            color="#ffffff"
            fontWeight="bold"
            maxWidth={s.sign[0] * 0.9}
            textAlign="center"
        />
    </T.Group>

    <!-- Spotlight von oben (nur bei Hover) -->
    {#if isHovered}
        <T.SpotLight
            position={[0, s.pillar + 3, 0]}
            target.position={[0, 0, 0]}
            color={displayColor}
            intensity={100}
            distance={s.pillar + 5}
            angle={0.5}
            penumbra={0.8}
            decay={1.5}
        />
    {/if}

    <!-- Hover-Tooltip -->
    {#if isHovered}
        <HTML position={[0, s.pillar + 2.5, 0]} center>
            <div class="bg-slate-900/95 text-white px-4 py-3 rounded-lg shadow-xl max-w-xs backdrop-blur-sm border border-slate-700 transform -translate-y-2">
                <h3 class="font-bold text-lg" style="color: {displayColor}">{project.title}</h3>
                {#if project.shortTeaser}
                    <p class="text-sm text-slate-300 mt-1">{project.shortTeaser}</p>
                {/if}
                <div class="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    {#each project.departments as dept}
                        <span class="bg-slate-800 px-2 py-0.5 rounded">{dept}</span>
                    {/each}
                </div>
                <p class="text-xs text-blue-400 mt-2">Klicken um Projekt zu öffnen →</p>
            </div>
        </HTML>
    {/if}
</T.Group>
