<script lang="ts">
    /**
     * DepartureBoard - Abfahrtstafel im Bahnhofs-Stil
     * 
     * Zeigt die nächsten "Verbindungen" zu Partner-Einrichtungen.
     * Die aktive Verbindung wird hervorgehoben.
     */
    import { T } from '@threlte/core';
    import { HTML } from '@threlte/extras';
    import type { PartnerConnection, TrainStatus } from '$lib/types/project';

    interface ScheduleEntry {
        destination: PartnerConnection;
        time: string;
        platform: 1 | 2;
        status: TrainStatus;
    }

    interface Props {
        schedule: ScheduleEntry[];
        position?: [number, number, number];
        rotation?: number;
    }

    let { 
        schedule, 
        position = [0, 4, 0],
        rotation = 0
    }: Props = $props();

    // Status-Text und Farbe
    function getStatusDisplay(status: TrainStatus): { text: string; color: string; blink: boolean } {
        switch (status) {
            case 'arriving':
                return { text: 'Einfahrt', color: '#fbbf24', blink: true };
            case 'boarding':
                return { text: 'Boarding', color: '#4ade80', blink: true };
            case 'departing':
                return { text: 'Abfahrt', color: '#f97316', blink: true };
            case 'departed':
                return { text: '---', color: '#64748b', blink: false };
        }
    }

    // Klick auf Partner-Link
    function handlePartnerClick(partner: PartnerConnection) {
        window.open(partner.url, '_blank');
    }
</script>

<T.Group position={position} rotation.y={rotation}>
    <!-- Tafel-Rahmen (3D) -->
    <T.Mesh position={[0, 0, -0.1]}>
        <T.BoxGeometry args={[8, 5, 0.2]} />
        <T.MeshStandardMaterial
            color="#1e293b"
            metalness={0.5}
            roughness={0.3}
        />
    </T.Mesh>

    <!-- Leuchtender Rand -->
    <T.Mesh position={[0, 0, -0.05]}>
        <T.BoxGeometry args={[8.2, 5.2, 0.1]} />
        <T.MeshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.3}
            metalness={0.7}
            roughness={0.2}
        />
    </T.Mesh>

    <!-- HTML-Overlay für Tafel-Inhalt -->
    <HTML position={[0, 0, 0.05]} transform center>
        <div 
            class="w-[320px] bg-slate-900/95 rounded-lg border border-blue-500/50 shadow-2xl overflow-hidden select-none"
            style="font-family: 'Courier New', monospace;"
        >
            <!-- Header -->
            <div class="bg-blue-600 px-3 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-lg">🚉</span>
                    <span class="text-white font-bold text-sm">NEXUS TERMINAL</span>
                </div>
                <span class="text-blue-200 text-xs">Verbindungen</span>
            </div>

            <!-- Spalten-Header -->
            <div class="grid grid-cols-[60px_1fr_50px_70px] gap-1 px-2 py-1 bg-slate-800 text-xs text-slate-400 border-b border-slate-700">
                <span>Zeit</span>
                <span>Ziel</span>
                <span class="text-center">Gleis</span>
                <span class="text-right">Status</span>
            </div>

            <!-- Fahrplan-Einträge -->
            <div class="divide-y divide-slate-700/50">
                {#each schedule.slice(0, 5) as entry, i}
                    {@const statusDisplay = getStatusDisplay(entry.status)}
                    <button
                        class="grid grid-cols-[60px_1fr_50px_70px] gap-1 px-2 py-1.5 w-full text-left hover:bg-slate-800/50 transition-colors"
                        class:bg-slate-800={i === 0}
                        onclick={() => handlePartnerClick(entry.destination)}
                    >
                        <!-- Zeit -->
                        <span 
                            class="text-sm font-mono"
                            class:text-yellow-400={i === 0}
                            class:text-slate-300={i !== 0}
                        >
                            {entry.time}
                        </span>

                        <!-- Ziel mit Farb-Indikator -->
                        <div class="flex items-center gap-1 overflow-hidden">
                            <span 
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                style="background-color: {entry.destination.color};"
                            ></span>
                            <span 
                                class="text-sm truncate"
                                class:text-white={i === 0}
                                class:text-slate-300={i !== 0}
                            >
                                {entry.destination.shortName}
                            </span>
                        </div>

                        <!-- Gleis -->
                        <span 
                            class="text-sm text-center"
                            class:text-blue-400={i === 0}
                            class:text-slate-400={i !== 0}
                        >
                            {entry.platform}
                        </span>

                        <!-- Status -->
                        <span 
                            class="text-xs text-right font-semibold"
                            class:animate-pulse={statusDisplay.blink && i === 0}
                            style="color: {statusDisplay.color};"
                        >
                            {statusDisplay.text}
                        </span>
                    </button>
                {/each}
            </div>

            <!-- Footer -->
            <div class="bg-slate-800 px-3 py-1.5 flex justify-between items-center border-t border-slate-700">
                <span class="text-xs text-slate-500">
                    "Bildung verbindet Welten"
                </span>
                <span class="text-xs text-blue-400">
                    ↗ Klick = Website
                </span>
            </div>
        </div>
    </HTML>

    <!-- Beleuchtung der Tafel -->
    <T.SpotLight
        position={[0, 2, 3]}
        target.position={[0, 0, 0]}
        color="#ffffff"
        intensity={20}
        distance={10}
        angle={0.5}
        penumbra={0.3}
    />
</T.Group>
