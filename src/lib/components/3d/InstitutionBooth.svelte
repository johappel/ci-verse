<script lang="ts">
    /**
     * InstitutionBooth - Zentraler Turm mit CI-Logo und Info-Panels
     * 
     * Nach Skizze:
     * - Zentraler Turm/Säule mit Institut-Inschrift
     * - Rotierendes Neon-Logo "CI" oben auf dem Turm
     * - 2 Info-Panels links/rechts mit Institutsbeschreibung
     * - Chat-Button am Turm
     * 
     * Die 4 großen Wandsegmente für Leitlinien werden separat
     * über MesseWall in MarketplacePlatform integriert.
     */
    import { T, useTask } from '@threlte/core';
    import { Text, useCursor, HTML } from '@threlte/extras';
    import type { MarketplaceStand } from '$lib/types/project';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';

    interface Props {
        stand: MarketplaceStand;
        position?: [number, number, number];
        rotation?: number;
        platformPosition?: [number, number, number];
    }

    let { 
        stand, 
        position = [0, 0, 0], 
        rotation = 0,
        platformPosition = [0, 0, 0]
    }: Props = $props();

    const { onPointerEnter, onPointerLeave } = useCursor('pointer');
    
    let isHovered = $state(false);
    let isButtonHovered = $state(false);

    // Farben
    const primaryColor = stand.display.color || '#1e40af';
    const accentColor = '#fbbf24'; // Gold Akzent
    const neonBlue = '#60a5fa';
    const lightColor = '#f8fafc';
    const darkColor = '#1e293b';

    // Dimensionen
    const tower = {
        width: 2.5,
        depth: 2.5,
        height: 12,
        baseHeight: 0.5,
        baseWidth: 4,
    };

    const infoPanel = {
        width: 5,
        height: 4,
        depth: 0.15,
        offsetX: 4.5,  // Abstand vom Turm-Zentrum
        offsetY: 5,    // Höhe
    };

    const logo = {
        size: 2.5,
        height: 2,      // Höhe über Turm
        rotationSpeed: 0.3,
    };

    // Institut-Texte für die Panels
    const institutTexts = {
        left: "Das Comenius-Institut ist eine Einrichtung der EKD für Bildung und Medien.",
        right: "Es forscht, entwickelt und berät zu Fragen religiöser Bildung."
    };

    // Logo-Rotation
    let logoRotation = $state(0);
    let pulsePhase = $state(0);
    
    useTask((delta) => {
        logoRotation += delta * logo.rotationSpeed;
        pulsePhase += delta * 2;
    });

    // Pulsierender Glow für Neon-Effekt
    let glowIntensity = $derived(0.5 + Math.sin(pulsePhase) * 0.3);

    // Klick-Handler
    function handleStandClick() {
        const worldX = platformPosition[0] + position[0];
        const worldY = platformPosition[1] + position[1];
        const worldZ = platformPosition[2] + position[2];
        
        const viewDistance = 15;
        const cameraY = getCameraY(platformPosition[1]) + 2;
        
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const worldOffsetX = viewDistance * sin;
        const worldOffsetZ = viewDistance * cos;
        
        const cameraPos = {
            x: worldX + worldOffsetX,
            y: cameraY,
            z: worldZ + worldOffsetZ
        };
        
        const lookAtPos = {
            x: worldX,
            y: worldY + tower.height / 2,
            z: worldZ
        };
        
        worldStore.setViewTarget(cameraPos, lookAtPos);
    }

    function handleChatClick(e: Event) {
        e.stopPropagation();
        worldStore.openChat();
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

<T.Group position={position} rotation.y={rotation}>
    
    <!-- ========== TURM-BASIS ========== -->
    <T.Mesh position.y={tower.baseHeight / 2} castShadow receiveShadow>
        <T.BoxGeometry args={[tower.baseWidth, tower.baseHeight, tower.baseWidth]} />
        <T.MeshStandardMaterial 
            color={darkColor}
            metalness={0.4}
            roughness={0.3}
        />
    </T.Mesh>

    <!-- ========== HAUPTTURM ========== -->
    <T.Mesh 
        position.y={tower.height / 2 + tower.baseHeight}
        castShadow
        onclick={handleStandClick}
        onpointerenter={handlePointerEnter}
        onpointerleave={handlePointerLeave}
    >
        <T.BoxGeometry args={[tower.width, tower.height, tower.depth]} />
        <T.MeshStandardMaterial 
            color={primaryColor}
            metalness={0.5}
            roughness={0.3}
        />
    </T.Mesh>

    <!-- Turm-Kanten (dekorative Leisten) - leicht nach außen versetzt um Z-Fighting zu vermeiden -->
    {#each [-1, 1] as xDir}
        {#each [-1, 1] as zDir}
            <T.Mesh 
                position={[
                    xDir * (tower.width / 2 + 0.02), 
                    tower.height / 2 + tower.baseHeight, 
                    zDir * (tower.depth / 2 + 0.02)
                ]}
                castShadow
            >
                <T.BoxGeometry args={[0.12, tower.height, 0.12]} />
                <T.MeshStandardMaterial 
                    color={accentColor}
                    metalness={0.6}
                    roughness={0.2}
                />
            </T.Mesh>
        {/each}
    {/each}

    <!-- ========== INSTITUT-INSCHRIFT AM TURM ========== -->
    <T.Group position.y={tower.height / 2 + tower.baseHeight}>
        <!-- Vorderseite -->
        <Text
            text="Comenius"
            color={lightColor}
            fontSize={0.6}
            position={[0, 1.5, tower.depth / 2 + 0.02]}
            anchorX="center"
            anchorY="middle"
        />
        <Text
            text="Institut"
            color={lightColor}
            fontSize={0.6}
            position={[0, 0.7, tower.depth / 2 + 0.02]}
            anchorX="center"
            anchorY="middle"
        />
        
        <!-- Rückseite -->
        <Text
            text="Comenius"
            color={lightColor}
            fontSize={0.6}
            position={[0, 1.5, -tower.depth / 2 - 0.02]}
            rotation.y={Math.PI}
            anchorX="center"
            anchorY="middle"
        />
        <Text
            text="Institut"
            color={lightColor}
            fontSize={0.6}
            position={[0, 0.7, -tower.depth / 2 - 0.02]}
            rotation.y={Math.PI}
            anchorX="center"
            anchorY="middle"
        />
    </T.Group>

    <!-- ========== ROTIERENDES NEON-LOGO "CI" ========== -->
    <!-- Drehstange vom Turm zur Scheibe -->
    <T.Group position.y={tower.height + tower.baseHeight}>
        <!-- Stange die aus dem Turm ragt und die Scheibe trägt -->
        <T.Mesh position.y={logo.height / 2 + 0.5}>
            <T.CylinderGeometry args={[0.15, 0.2, logo.height + 1, 8]} />
            <T.MeshStandardMaterial 
                color={darkColor}
                metalness={0.8}
                roughness={0.2}
            />
        </T.Mesh>
        
        <!-- Halterung/Basis der Stange auf dem Turm -->
        <T.Mesh position.y={0.15}>
            <T.CylinderGeometry args={[0.5, 0.6, 0.3, 16]} />
            <T.MeshStandardMaterial 
                color={accentColor}
                metalness={0.6}
                roughness={0.3}
            />
        </T.Mesh>
    </T.Group>

    <!-- Rotierende Scheibe mit Logo -->
    <T.Group 
        position.y={tower.height + tower.baseHeight + logo.height + 1.2}
        rotation.y={logoRotation}
    >
        <!-- Logo-Scheibe Hintergrund (horizontal liegend) -->
        <T.Mesh rotation.x={Math.PI / 2}>
            <T.CylinderGeometry args={[logo.size, logo.size, 0.3, 32]} />
            <T.MeshStandardMaterial 
                color={darkColor}
                metalness={0.7}
                roughness={0.2}
            />
        </T.Mesh>

        <!-- Neon-Ring außen (vertikal um die Scheibe) -->
        <T.Mesh>
            <T.TorusGeometry args={[logo.size * 1.1, 0.08, 16, 48]} />
            <T.MeshBasicMaterial 
                color={neonBlue}
            />
        </T.Mesh>

        <!-- Neon-Text "CI" oben (auf der Scheibe) -->
        <Text
            text="CI"
            color={neonBlue}
            fontSize={1.8}
            position={[0, 0.2, 0]}
            rotation.x={-Math.PI / 2}
            anchorX="center"
            anchorY="middle"
        />
        
        <!-- Neon-Text "CI" unten (auf der Unterseite) -->
        <Text
            text="CI"
            color={neonBlue}
            fontSize={1.8}
            position={[0, -0.2, 0]}
            rotation.x={Math.PI / 2}
            anchorX="center"
            anchorY="middle"
        />

        <!-- Glow-Effekt -->
        <T.PointLight
            color={neonBlue}
            intensity={glowIntensity * 50}
            distance={15}
            decay={2}
        />
    </T.Group>

    <!-- ========== INFO-PANELS LINKS & RECHTS ========== -->
    {#each [
        { x: -infoPanel.offsetX, text: institutTexts.left, rotY: Math.PI / 6 },
        { x: infoPanel.offsetX, text: institutTexts.right, rotY: -Math.PI / 6 }
    ] as panel}
        <T.Group 
            position={[panel.x, infoPanel.offsetY, 0]}
            rotation.y={panel.rotY}
        >
            <!-- Panel-Rahmen -->
            <T.Mesh castShadow>
                <T.BoxGeometry args={[infoPanel.width + 0.4, infoPanel.height + 0.4, infoPanel.depth]} />
                <T.MeshStandardMaterial 
                    color={accentColor}
                    metalness={0.5}
                    roughness={0.3}
                />
            </T.Mesh>
            
            <!-- Panel-Fläche -->
            <T.Mesh position.z={0.05}>
                <T.BoxGeometry args={[infoPanel.width, infoPanel.height, infoPanel.depth]} />
                <T.MeshStandardMaterial 
                    color={lightColor}
                    metalness={0.1}
                    roughness={0.8}
                />
            </T.Mesh>

            <!-- Panel-Text -->
            <Text
                text={panel.text}
                color={darkColor}
                fontSize={0.35}
                position={[0, 0, 0.15]}
                anchorX="center"
                anchorY="middle"
                maxWidth={infoPanel.width - 0.6}
                textAlign="center"
                lineHeight={1.4}
            />

            <!-- Halterung zum Turm -->
            <T.Mesh 
                position={[panel.x > 0 ? -infoPanel.width/2 - 0.5 : infoPanel.width/2 + 0.5, 0, 0]}
                rotation.z={Math.PI / 2}
            >
                <T.CylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
                <T.MeshStandardMaterial 
                    color={darkColor}
                    metalness={0.6}
                    roughness={0.3}
                />
            </T.Mesh>
        </T.Group>
    {/each}

    <!-- ========== CHAT-BUTTON (interaktiv) ========== -->
    <T.Group position={[0, 2, tower.depth / 2 + 1.5]}>
        <T.Mesh
            onclick={handleChatClick}
            onpointerenter={() => isButtonHovered = true}
            onpointerleave={() => isButtonHovered = false}
            scale={isButtonHovered ? 1.1 : 1}
        >
            <T.BoxGeometry args={[2.5, 0.8, 0.2]} />
            <T.MeshStandardMaterial 
                color={isButtonHovered ? '#dc2626' : '#ef4444'}
                emissive={isButtonHovered ? '#dc2626' : '#ef4444'}
                emissiveIntensity={isButtonHovered ? 0.4 : 0.2}
                metalness={0.3}
                roughness={0.4}
            />
        </T.Mesh>
        <Text
            text="💬 Fragen?"
            color="#ffffff"
            fontSize={0.35}
            position={[0, 0, 0.15]}
            anchorX="center"
            anchorY="middle"
        />
    </T.Group>

    <!-- ========== BODEN-MARKIERUNG ========== -->
    <T.Mesh 
        position.y={0.02}
        rotation.x={-Math.PI / 2}
        receiveShadow
    >
        <T.CircleGeometry args={[5, 32]} />
        <T.MeshStandardMaterial 
            color={primaryColor}
            transparent
            opacity={0.3}
            metalness={0.2}
            roughness={0.8}
        />
    </T.Mesh>

    <!-- Ring um Boden-Markierung -->
    <T.Mesh 
        position.y={0.03}
        rotation.x={-Math.PI / 2}
    >
        <T.RingGeometry args={[4.8, 5, 32]} />
        <T.MeshBasicMaterial 
            color={accentColor}
            transparent
            opacity={0.6}
        />
    </T.Mesh>

</T.Group>
