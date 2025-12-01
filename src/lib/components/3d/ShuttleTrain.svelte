<script lang="ts">
    /**
     * ShuttleTrain - Animierter Licht-Zug aus dem Nebel
     * 
     * Zyklus (20s):
     * - 0-3s: Zug erscheint aus dem Nebel (von hinten/+Z)
     * - 3-8s: Zug hält am Bahnsteig, Türen "öffnen"
     * - 8-10s: Türen schließen, Abfahrts-Signal
     * - 10-15s: Zug beschleunigt ins Dunkel (nach vorne/-Z)
     * - 15-20s: Pause (Zug weg)
     */
    import { T } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import type { PartnerConnection } from '$lib/types/project';

    interface Props {
        partner: PartnerConnection;
        phase: 'arriving' | 'stopped' | 'departing' | 'away';
        progress: number; // 0-1 innerhalb der Phase
    }

    let { partner, phase, progress }: Props = $props();

    // Easing-Funktionen für smooth Animation
    function easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }
    function easeInQuad(t: number): number {
        return t * t;
    }
    function easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Zug-Position auf Z-Achse basierend auf Phase (mit Easing)
    let trainZ = $derived.by(() => {
        switch (phase) {
            case 'arriving':
                // Von weit hinten (+60) zur Mitte (0) - smooth abbremsen
                return 60 - easeOutQuad(progress) * 60;
            case 'stopped':
                return 0;
            case 'departing':
                // Von Mitte (0) nach vorne (-70) - smooth beschleunigen
                return -easeInQuad(progress) * 70;
            case 'away':
                return -80; // Komplett weg
        }
    });

    // Sichtbarkeit
    let isVisible = $derived(phase !== 'away');

    // Waggon-Daten (4 Waggons) - Transport-Stil
    const waggonCount = 4;
    const waggonSpacing = 4;
    const waggonLength = 3.5;   // Länge (Z)
    const waggonWidth = 2.2;    // Breite (X)
    const waggonHeight = 1.8;   // Höhe (Y)

    // Glow-Intensität
    let glowIntensity = $derived.by(() => {
        if (phase === 'arriving') return 0.3 + progress * 0.7;
        if (phase === 'stopped') return 1.0;
        if (phase === 'departing') return 1.0 - progress * 0.7;
        return 0;
    });

    // Tür-Animation (nur bei 'stopped')
    let doorOpen = $derived(phase === 'stopped' && progress > 0.1 && progress < 0.9);

    // Partner-Farbe
    let partnerColor = $derived(partner?.color ?? '#60a5fa');
</script>

{#if isVisible}
    <T.Group position.z={trainZ}>
        <!-- Waggons hintereinander entlang Z-Achse (Fahrtrichtung) -->
        {#each Array(waggonCount) as _, i}
            {@const waggonZ = (i - (waggonCount - 1) / 2) * waggonSpacing}
            <T.Group position.z={waggonZ}>
                
                <!-- Waggon-Körper (Box statt Zylinder) -->
                <T.Mesh position.y={waggonHeight / 2}>
                    <T.BoxGeometry args={[waggonWidth, waggonHeight, waggonLength]} />
                    <T.MeshStandardMaterial
                        color={partnerColor}
                        emissive={partnerColor}
                        emissiveIntensity={glowIntensity * 0.4}
                        metalness={0.6}
                        roughness={0.8}
                    />
                </T.Mesh>

                <!-- Dach (leicht gewölbt durch schmalere Box) -->
                <T.Mesh position.y={waggonHeight + 0.15}>
                    <T.BoxGeometry args={[waggonWidth * 0.9, 0.3, waggonLength * 0.95]} />
                    <T.MeshStandardMaterial
                        color={partnerColor}
                        emissive={partnerColor}
                        emissiveIntensity={glowIntensity * 0.3}
                        metalness={0.7}
                        roughness={0.2}
                    />
                </T.Mesh>

                <!-- Fenster links -->
                <T.Mesh position={[-waggonWidth / 2 - 0.02, waggonHeight * 0.55, 0]}>
                    <T.BoxGeometry args={[0.06, waggonHeight * 0.5, waggonLength * 0.7]} />
                    <T.MeshBasicMaterial color="#e0f0ff" />
                </T.Mesh>
                
                <!-- Fenster rechts -->
                <T.Mesh position={[waggonWidth / 2 + 0.02, waggonHeight * 0.55, 0]}>
                    <T.BoxGeometry args={[0.06, waggonHeight * 0.5, waggonLength * 0.7]} />
                    <T.MeshBasicMaterial color="#e0f0ff" />
                </T.Mesh>

                <!-- Leuchtstreifen unten (emissive statt Licht) -->
                <T.Mesh position.y={0.1}>
                    <T.BoxGeometry args={[waggonWidth * 1.05, 0.12, waggonLength * 0.9]} />
                    <T.MeshBasicMaterial color={partnerColor} />
                </T.Mesh>
                
                <!-- Leuchtender Dachstreifen -->
                <T.Mesh position.y={waggonHeight + 0.32}>
                    <T.BoxGeometry args={[waggonWidth * 0.3, 0.08, waggonLength * 0.7]} />
                    <T.MeshBasicMaterial color={partnerColor} />
                </T.Mesh>

                <!-- Tür-Markierung (öffnet bei Halt) -->
                {#if doorOpen && (i === 1 || i === 2)}
                    <T.Mesh position={[waggonWidth / 2 + 0.1, waggonHeight * 0.4, 0]}>
                        <T.BoxGeometry args={[0.08, waggonHeight * 0.6, 0.8]} />
                        <T.MeshBasicMaterial
                            color="#4ade80"
                        />
                    </T.Mesh>
                {/if}
            </T.Group>
        {/each}

        <!-- Verbindungen zwischen Waggons -->
        {#each Array(waggonCount - 1) as _, i}
            {@const connZ = (i - (waggonCount - 2) / 2) * waggonSpacing + waggonSpacing / 2}
            <T.Mesh position={[0, 0.6, connZ]}>
                <T.BoxGeometry args={[0.8, 0.6, 0.4]} />
                <T.MeshStandardMaterial
                    color="#334155"
                    metalness={0.5}
                    roughness={0.4}
                />
            </T.Mesh>
        {/each}

        <!-- Partner-Logo auf mittlerem Waggon (HTML Billboard) -->
        {#if phase === 'stopped' && partner?.logoUrl}
            <HTML position={[0, waggonHeight + 1.5, 0]} center transform sprite>
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

        <!-- Kopf-Scheinwerfer (kleine leuchtende Kugeln) - direkt am ersten Waggon -->
        {@const frontZ = -((waggonCount - 1) / 2) * waggonSpacing - waggonLength / 2 - 0.1}
        <T.Group position={[0, waggonHeight / 2, frontZ]}>
            <T.Mesh position={[-0.6, 0, 0]}>
                <T.SphereGeometry args={[0.15, 8, 8]} />
                <T.MeshBasicMaterial color="#ffffff" />
            </T.Mesh>
            <T.Mesh position={[0.6, 0, 0]}>
                <T.SphereGeometry args={[0.15, 8, 8]} />
                <T.MeshBasicMaterial color="#ffffff" />
            </T.Mesh>
        </T.Group>

        <!-- Rück-Lichter - direkt am letzten Waggon -->
        {@const backZ = ((waggonCount - 1) / 2) * waggonSpacing + waggonLength / 2 + 0.1}
        <T.Group position={[0, waggonHeight * 0.4, backZ]}>
            <T.Mesh position={[-0.5, 0, 0]}>
                <T.BoxGeometry args={[0.3, 0.15, 0.05]} />
                <T.MeshBasicMaterial color="#ef4444" />
            </T.Mesh>
            <T.Mesh position={[0.5, 0, 0]}>
                <T.BoxGeometry args={[0.3, 0.15, 0.05]} />
                <T.MeshBasicMaterial color="#ef4444" />
            </T.Mesh>
        </T.Group>
    </T.Group>
{/if}
