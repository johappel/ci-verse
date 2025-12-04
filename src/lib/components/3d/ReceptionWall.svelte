<script lang="ts">
    /**
     * ReceptionWall - Empfangswand mit Institution, Chatbot & Team
     * 
     * Ersetzt den InstitutionBooth-Turm mit einer integrierten Wandlösung:
     * - Links: Chatbot-Avatar (klickbar, pulsierend)
     * - Mitte: Institutions-Info (Name, Mission, Ort)
     * - Rechts: Team-Slideshow mit Mitarbeiter:innen-Fotos
     * 
     * WICHTIG: HTML-Overlays werden NUR auf dem Marktplatz gerendert,
     * um "Durchbluten" durch andere Plattformen zu verhindern.
     */
    import { T, useTask } from '@threlte/core';
    import { HTML, useCursor, useTexture, Text, Billboard } from '@threlte/extras';
    import { SRGBColorSpace } from 'three';
    import { base } from '$app/paths';
    import { worldStore } from '$lib/logic/store.svelte';
    import { getCameraY } from '$lib/logic/platforms';
    import InteractionPillar from './InteractionPillar.svelte';
    import type { ProjectData } from '$lib/types/project';
    
    // Institutions-Bild laden mit korrektem Farbmanagement und Base Path
    const institutionTexture = useTexture(`${base}/assets/about-ci.jpg`, {
        transform: (texture) => {
            texture.colorSpace = SRGBColorSpace;
            return texture;
        }
    });

    interface TeamMember {
        name: string;
        role: string;
        imageUrl: string;
    }

    interface Props {
        position?: [number, number, number];
        rotation?: number;
        platformPosition?: [number, number, number];
        teamMembers?: TeamMember[];
    }

    let { 
        position = [0, 0, 0], 
        rotation = 0,
        platformPosition = [0, 0, 0],
        teamMembers = []
    }: Props = $props();

    const { onPointerEnter, onPointerLeave } = useCursor('pointer');

    // Farben
    const primaryColor = '#1e40af';
    const accentColor = '#fbbf24';
    const neonCyan = '#22d3d3';
    const darkColor = '#1e293b';

    // Dimensionen
    const wall = { width: 20, height: 8, depth: 0.3 };
    const panels = {
        chatbot: { width: 5, height: 6 },
        institution: { width: 8, height: 6 },
        team: { width: 5, height: 6 },
        gap: 0.5,
    };

    // States
    let isChatHovered = $state(false);
    let currentTeamIndex = $state(0);
    let pulsePhase = $state(0);
    let slideTimer = $state(0);

    useTask((delta) => {
        pulsePhase += delta * 2.5;
        slideTimer += delta;
        if (slideTimer > 4 && teamMembers.length > 1) {
            slideTimer = 0;
            currentTeamIndex = (currentTeamIndex + 1) % teamMembers.length;
        }
    });

    let chatGlow = $derived(0.4 + Math.sin(pulsePhase) * 0.3);
    let chatScale = $derived(1 + Math.sin(pulsePhase * 0.5) * 0.02);
    let currentMember = $derived(teamMembers[currentTeamIndex] || null);

    // GETAUSCHT: Chatbot jetzt rechts, Team jetzt links
    const chatbotX = panels.institution.width / 2 + panels.gap + panels.chatbot.width / 2;
    const teamX = -(panels.institution.width / 2 + panels.gap + panels.team.width / 2);

    function handleChatClick(e?: Event) {
        e?.stopPropagation(); // Verhindert dass Klick zur Mesh durchdringt
        console.log('handleChatClick aufgerufen!');
        console.log('isChatOpen vorher:', worldStore.state.isChatOpen);
        worldStore.openChat();
        console.log('isChatOpen nachher:', worldStore.state.isChatOpen);
    }

    function handleWallClick() {
        const worldX = platformPosition[0] + position[0];
        const worldZ = platformPosition[2] + position[2];
        const viewDistance = 9;
        const cameraY = getCameraY(platformPosition[1]);
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        worldStore.setViewTarget(
            { x: worldX + sin * viewDistance, y: cameraY, z: worldZ + cos * viewDistance },
            { x: worldX, y: cameraY + -0.0, z: worldZ }
        );
    }

    function nextTeamMember() {
        slideTimer = 0;
        currentTeamIndex = (currentTeamIndex + 1) % teamMembers.length;
    }

    function prevTeamMember() {
        slideTimer = 0;
        currentTeamIndex = (currentTeamIndex - 1 + teamMembers.length) % teamMembers.length;
    }
    
    // Ist der User auf dem Marktplatz?
    let isOnMarketplace = $derived(worldStore.state.currentPlatform === 'S');
</script>

<T.Group position={position} rotation.y={rotation} scale={1.0}>
    
    <!-- ========== WAND-HINTERGRUND ========== -->
    <T.Mesh position.y={wall.height / 2 + 1.5} receiveShadow>
        <T.BoxGeometry args={[wall.width, wall.height, wall.depth]} />
        <T.MeshPhysicalMaterial
            color={darkColor}
            transparent
            opacity={0.4}
            metalness={0.2}
            roughness={0.3}
        />
    </T.Mesh>

    <!-- Rahmen oben/unten -->
    <T.Mesh position={[0, wall.height + 1.7, 0]}>
        <T.BoxGeometry args={[wall.width + 0.4, 0.2, wall.depth + 0.1]} />
        <T.MeshStandardMaterial color={accentColor} metalness={0.6} roughness={0.3} />
    </T.Mesh>
    <T.Mesh position={[0, 1.3, 0]}>
        <T.BoxGeometry args={[wall.width + 0.4, 0.2, wall.depth + 0.1]} />
        <T.MeshStandardMaterial color={accentColor} metalness={0.6} roughness={0.3} />
    </T.Mesh>

    <!-- ========== TEAM-SLIDESHOW (Links) ========== -->
    <T.Group position={[teamX, wall.height / 2 + 1.5, wall.depth / 2 + 0.1]}>
        
        <!-- Rahmen -->
        <T.Mesh position.z={0.01}>
            <T.PlaneGeometry args={[panels.team.width + 0.2, panels.team.height + 0.2]} />
            <T.MeshBasicMaterial color={accentColor} />
        </T.Mesh>

        <!-- Panel-Hintergrund -->
        <T.Mesh position.z={0.05}>
            <T.PlaneGeometry args={[panels.team.width, panels.team.height]} />
            <T.MeshBasicMaterial color={darkColor} />
        </T.Mesh>

        <!-- Team Content via HTML - NUR auf Marktplatz -->
        {#if isOnMarketplace}
        <HTML position={[0, 0, 0.1]} center transform scale={0.35}>
            <div class="text-center text-white" style="width: 400px;">
                <h3 class="text-2xl font-bold mb-4" style="color: #fbbf24;">TEAM</h3>
                
                {#if currentMember}
                    <div class="relative">
                        <img 
                            src={currentMember.imageUrl} 
                            alt={currentMember.name}
                            class="w-48 h-48 rounded-lg mx-auto mb-3 object-cover"
                            style="border: 2px solid rgba(251,191,36,0.5);"
                        />
                        <div class="p-3 text-xl font-bold text-white"  style="color: #ffffff; padding: 10px">{currentMember.name}</div>
                        <div class="text-sm" style="color: #94a3b8;">{currentMember.role}</div>
                    </div>
                {:else}
                    <div class="text-6xl mb-4">👥</div>
                    <div style="color: #94a3b8;">Team laden...</div>
                {/if}

                {#if teamMembers.length > 1}
                    <div class="flex justify-center items-center gap-2 mt-4" style="align-items: center; margin-top: 16px;">
                        <button 
                            class="w-8 h-8 rounded-full text-white cursor-pointer"
                            style="background: #334155;"
                            onclick={prevTeamMember}
                        >◀</button>
                        
                        <div class="flex gap-1">
                            {#each teamMembers as member, i}
                                <button 
                                    class="w-3 h-3 rounded-full cursor-pointer"
                                    style="background: {i === currentTeamIndex ? '#fbbf24' : '#475569'};"
                                    onclick={() => { currentTeamIndex = i; slideTimer = 0; }}
                                    aria-label="Team-Mitglied {i + 1}: {member.name}"
                                ></button>
                            {/each}
                        </div>
                        
                        <button 
                            class="w-8 h-8 rounded-full text-white cursor-pointer"
                            style="background: #334155;"
                            onclick={nextTeamMember}
                        >▶</button>
                    </div>
                {/if}
            </div>
        </HTML>
        {/if}
    </T.Group>
    
    <!-- ========== INSTITUTIONS-PANEL (Mitte) mit Bild ========== -->
    <T.Group position={[0, wall.height / 2 + 1.5, wall.depth / 2 + 0.1]}>
        
        <!-- Goldener Rahmen -->
        <T.Mesh position.z={0.01} onclick={handleWallClick}>
            <T.PlaneGeometry args={[panels.institution.width + 0.3, panels.institution.height + 0.3]} />
            <T.MeshBasicMaterial color={accentColor} />
        </T.Mesh>

        <!-- CI-Blau Hintergrund -->
        <T.Mesh position.z={0.03} onclick={handleWallClick}>
            <T.PlaneGeometry args={[panels.institution.width, panels.institution.height]} />
            <T.MeshBasicMaterial color="#023b88" toneMapped={false} />
        </T.Mesh>

        <!-- Institutions-Bild (about-ci.jpg) mit korrektem Farbmanagement -->
        {#await institutionTexture then texture}
            <T.Mesh position.z={0.05} onclick={handleWallClick}>
                <T.PlaneGeometry args={[panels.institution.width, panels.institution.height]} />
                <T.MeshBasicMaterial map={texture} toneMapped={false} />
            </T.Mesh>
        {/await}
    </T.Group>

    <!-- ========== INTERACTION PILLAR vor Institution (Link zur Website) ========== -->
    {@const institutionProject: ProjectData = {
        id: 'comenius-website',
        title: 'Comenius-Institut Website',
        slug: 'comenius-website',
        externalUrl: 'https://comenius.de',
        departments: ['S1'],
        perspectives: [],
        targetGroups: [],
        displayType: 'booth',
        staff: [],
        shortTeaser: 'Besuchen Sie unsere Website',
        display: {
            slogan: 'comenius.de',
            color: '#fbbf24'
        }
    }}
    <InteractionPillar 
        project={institutionProject}
        position={[0, 0, 1.7]}
        size={1.0}
        worldPosition={[platformPosition[0] + position[0], platformPosition[1] + position[1], platformPosition[2] + position[2] + 3]}
    />


    <!-- ========== CHATBOT-PANEL (Rechts) ========== -->
    <T.Group position={[chatbotX, wall.height / 2 + 1.5, wall.depth / 2 + 0.1]}>
        
        <!-- Rahmen mit Glow -->
        <T.Mesh position.z={0.01}>
            <T.PlaneGeometry args={[panels.chatbot.width + 0.3, panels.chatbot.height + 0.3]} />
            <T.MeshBasicMaterial color={neonCyan} transparent opacity={chatGlow} />
        </T.Mesh>

        <!-- Panel-Hintergrund -->
        <T.Mesh position.z={0.05}>
            <T.PlaneGeometry args={[panels.chatbot.width, panels.chatbot.height]} />
            <T.MeshBasicMaterial color={darkColor} />
        </T.Mesh>

        <!-- Chatbot-Video - NUR auf Marktplatz -->
        {#if isOnMarketplace}
        <T.Group position={[0, 0.5, 0.1]} scale={chatScale}>
            <HTML center transform scale={0.12}>
                <div class="flex flex-col items-center">
                    <video 
                        src="{base}/assets/bot.mp4" 
                        autoplay 
                        loop 
                        muted 
                        playsinline
                        class="w-48 h-64 object-contain rounded-lg pointer-events-none"
                        style="background: transparent;"
                    ></video>
                </div>
            </HTML>
        </T.Group>

        <!-- 3D-Mesh Button - fängt ALLE Klicks ab -->
        <T.Mesh 
            position={[0, -2, 0.1]} 
            onclick={(e: Event) => { e.stopPropagation(); handleChatClick(e); }}
            onpointerenter={() => isChatHovered = true}
            onpointerleave={() => isChatHovered = false}
        >
            <T.PlaneGeometry args={[3, 1]} />
            <T.MeshBasicMaterial 
                color={neonCyan}
                transparent 
                opacity={isChatHovered ? 0.3 : 0.01}
                depthWrite={false}
            />
        </T.Mesh>
        
        <!-- "Frag mich!" Text über dem Button -->
        <Billboard position={[0, -2, 0.15]}>
            <Text
                text="Frag mich!"
                color="#ffffff"
                fontSize={0.35}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor={neonCyan}
            />
        </Billboard>
        {/if}

        {#if isChatHovered}
            <T.Mesh position.z={0.02}>
                <T.PlaneGeometry args={[panels.chatbot.width + 0.5, panels.chatbot.height + 0.5]} />
                <T.MeshBasicMaterial color={neonCyan} transparent opacity={0.2} />
            </T.Mesh>
        {/if}

        <T.PointLight color={neonCyan} intensity={chatGlow * 30} distance={8} decay={2} position={[0, 0, 1]} />
    </T.Group>

    <!-- Boden-Markierung -->
    <T.Mesh position.y={0.01} rotation.x={-Math.PI / 2} receiveShadow>
        <T.PlaneGeometry args={[wall.width + 1, 2]} />
        <T.MeshStandardMaterial color={primaryColor} transparent opacity={0.3} />
    </T.Mesh>

</T.Group>
