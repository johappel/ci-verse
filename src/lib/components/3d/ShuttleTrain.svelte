<script lang="ts">
    /**
     * ShuttleTrain - Animierter Licht-Zug aus dem Nebel
     * 
     * Zyklus (20s):
     * - 0-3s: Zug erscheint aus dem Nebel (von rechts)
     * - 3-8s: Zug hält am Bahnsteig, Türen "öffnen"
     * - 8-10s: Türen schließen, Abfahrts-Signal
     * - 10-15s: Zug beschleunigt ins Dunkel (nach links)
     * - 15-20s: Pause (Zug weg)
     */
    import { T, useTask } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import type { PartnerConnection } from '$lib/types/project';

    interface Props {
        partner: PartnerConnection;
        phase: 'arriving' | 'stopped' | 'departing' | 'away';
        progress: number; // 0-1 innerhalb der Phase
    }

    let { partner, phase, progress }: Props = $props();

    // Zug-Position basierend auf Phase
    let trainX = $derived.by(() => {
        switch (phase) {
            case 'arriving':
                // Von weit rechts (30) zur Mitte (0)
                return 30 - progress * 30;
            case 'stopped':
                return 0;
            case 'departing':
                // Von Mitte (0) nach links (-40)
                return -progress * 40;
            case 'away':
                return -50; // Komplett weg
        }
    });

    // Sichtbarkeit
    let isVisible = $derived(phase !== 'away');

    // Waggon-Daten (4 Waggons)
    const waggonCount = 4;
    const waggonSpacing = 3.5;
    const waggonLength = 3;
    const waggonRadius = 0.8;

    // Glow-Intensität
    let glowIntensity = $derived.by(() => {
        if (phase === 'arriving') return 0.3 + progress * 0.7;
        if (phase === 'stopped') return 1.0;
        if (phase === 'departing') return 1.0 - progress * 0.7;
        return 0;
    });

    // Tür-Animation (nur bei 'stopped')
    let doorOpen = $derived(phase === 'stopped' && progress > 0.1 && progress < 0.9);

    // Pulsieren für "Boarding"
    let time = $state(0);
    useTask((delta) => {
        time += delta;
    });
    let pulse = $derived(Math.sin(time * 4) * 0.2 + 0.8);

    // Partner-Farbe
    let partnerColor = $derived(partner?.color ?? '#60a5fa');
</script>

{#if isVisible}
    <T.Group position.x={trainX}>
        <!-- Waggons -->
        {#each Array(waggonCount) as _, i}
            {@const waggonX = (i - (waggonCount - 1) / 2) * waggonSpacing}
            <T.Group position.x={waggonX}>
                <!-- Haupt-Zylinder (Waggon-Körper) -->
                <T.Mesh rotation.z={Math.PI / 2}>
                    <T.CylinderGeometry args={[waggonRadius, waggonRadius, waggonLength, 16]} />
                    <T.MeshStandardMaterial
                        color={partnerColor}
                        emissive={partnerColor}
                        emissiveIntensity={glowIntensity * pulse}
                        metalness={0.7}
                        roughness={0.2}
                        transparent
                        opacity={0.9}
                    />
                </T.Mesh>

                <!-- Leuchtender Kern -->
                <T.Mesh rotation.z={Math.PI / 2}>
                    <T.CylinderGeometry args={[waggonRadius * 0.6, waggonRadius * 0.6, waggonLength * 0.95, 16]} />
                    <T.MeshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={glowIntensity * 0.5}
                    />
                </T.Mesh>

                <!-- Glow-Halo -->
                <T.Mesh rotation.z={Math.PI / 2}>
                    <T.CylinderGeometry args={[waggonRadius * 1.3, waggonRadius * 1.3, waggonLength * 0.8, 16]} />
                    <T.MeshBasicMaterial
                        color={partnerColor}
                        transparent
                        opacity={glowIntensity * 0.2}
                    />
                </T.Mesh>

                <!-- Punktlicht pro Waggon -->
                <T.PointLight
                    color={partnerColor}
                    intensity={glowIntensity * 15}
                    distance={8}
                    decay={2}
                />

                <!-- Fenster-Streifen (dekorativ) -->
                <T.Mesh position.y={0.2} rotation.z={Math.PI / 2}>
                    <T.BoxGeometry args={[0.3, waggonLength * 0.8, waggonRadius * 2.1]} />
                    <T.MeshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={glowIntensity * 0.6}
                    />
                </T.Mesh>

                <!-- Tür-Indikator (öffnet bei Halt) -->
                {#if doorOpen && i === 1}
                    <T.Mesh position={[0, -waggonRadius - 0.1, 0]}>
                        <T.BoxGeometry args={[0.8, 0.1, 1.2]} />
                        <T.MeshBasicMaterial
                            color="#4ade80"
                            transparent
                            opacity={pulse}
                        />
                    </T.Mesh>
                {/if}
            </T.Group>
        {/each}

        <!-- Verbindungen zwischen Waggons -->
        {#each Array(waggonCount - 1) as _, i}
            {@const connX = (i - (waggonCount - 2) / 2) * waggonSpacing + waggonSpacing / 2}
            <T.Mesh position.x={connX} rotation.z={Math.PI / 2}>
                <T.CylinderGeometry args={[0.2, 0.2, 0.8, 8]} />
                <T.MeshBasicMaterial
                    color={partnerColor}
                    transparent
                    opacity={glowIntensity * 0.7}
                />
            </T.Mesh>
        {/each}

        <!-- Partner-Logo auf mittlerem Waggon (HTML Billboard) -->
        {#if phase === 'stopped' && partner?.logoUrl}
            <HTML position={[0, waggonRadius + 1.5, 0]} center transform sprite>
                <div class="flex flex-col items-center gap-1 pointer-events-none select-none">
                    <img 
                        src={partner.logoUrl} 
                        alt={partner.shortName}
                        class="w-16 h-16 object-contain bg-white/90 rounded-lg p-1 shadow-lg"
                        style="filter: drop-shadow(0 0 10px {partnerColor});"
                    />
                    <span 
                        class="text-xs font-bold px-2 py-0.5 rounded bg-black/70 text-white whitespace-nowrap"
                        style="text-shadow: 0 0 8px {partnerColor};"
                    >
                        {partner.shortName}
                    </span>
                </div>
            </HTML>
        {/if}

        <!-- Kopf-Licht (vorne am Zug) -->
        <T.SpotLight
            position={[(waggonCount / 2) * waggonSpacing + 1, 0, 0]}
            target.position={[(waggonCount / 2) * waggonSpacing + 10, 0, 0]}
            color="#ffffff"
            intensity={glowIntensity * 50}
            distance={20}
            angle={0.3}
            penumbra={0.5}
        />

        <!-- Rück-Licht (hinten am Zug) -->
        <T.PointLight
            position={[-(waggonCount / 2) * waggonSpacing - 1, 0, 0]}
            color="#ef4444"
            intensity={glowIntensity * 10}
            distance={5}
        />
    </T.Group>
{/if}
