<script lang="ts">
    /**
     * NexusTerminal - Interstellarer Bahnhof für Partner-Verbindungen
     * 
     * Bestandteile:
     * - Bahnsteig-Plattform (andockend an Hauptplattform)
     * - Gleise ins Dunkel
     * - Abfahrtstafel
     * - Animierter Licht-Zug (alle 20s)
     * 
     * Positionierung: Rechts neben der ReceptionWall
     */
    import { T, useTask } from '@threlte/core';
    import { Text, HTML } from '@threlte/extras';
    import ShuttleTrain from './ShuttleTrain.svelte';
    import DepartureBoard from './DepartureBoard.svelte';
    import { partnerConnections } from '$lib/data/mockProjects';
    import type { PartnerConnection, TrainStatus } from '$lib/types/project';

    interface Props {
        position?: [number, number, number];
        rotation?: number;
        platformColor?: string;
    }

    let { 
        position = [0, 0, 0],
        rotation = 0,
        platformColor = '#1e3a5f'
    }: Props = $props();

    // ========== ZUG-ANIMATION ==========
    // Zyklus: 20 Sekunden
    const CYCLE_DURATION = 20;
    const PHASE_TIMINGS = {
        arriving: { start: 0, end: 3 },      // 0-3s
        stopped: { start: 3, end: 10 },      // 3-10s
        departing: { start: 10, end: 15 },   // 10-15s
        away: { start: 15, end: 20 }         // 15-20s
    };

    let cycleTime = $state(0);
    let currentPartnerIndex = $state(0);

    // Aktuelle Phase und Fortschritt
    let trainPhase = $derived.by((): 'arriving' | 'stopped' | 'departing' | 'away' => {
        const t = cycleTime % CYCLE_DURATION;
        if (t < PHASE_TIMINGS.arriving.end) return 'arriving';
        if (t < PHASE_TIMINGS.stopped.end) return 'stopped';
        if (t < PHASE_TIMINGS.departing.end) return 'departing';
        return 'away';
    });

    let trainProgress = $derived.by(() => {
        const t = cycleTime % CYCLE_DURATION;
        const timing = PHASE_TIMINGS[trainPhase];
        const duration = timing.end - timing.start;
        return (t - timing.start) / duration;
    });

    // Aktueller Partner
    let currentPartner = $derived(partnerConnections[currentPartnerIndex]);

    // Animation-Loop
    useTask((delta) => {
        const prevCycle = Math.floor(cycleTime / CYCLE_DURATION);
        cycleTime += delta;
        const newCycle = Math.floor(cycleTime / CYCLE_DURATION);
        
        // Neuer Zyklus = nächster Partner
        if (newCycle > prevCycle) {
            currentPartnerIndex = (currentPartnerIndex + 1) % partnerConnections.length;
        }
    });

    // ========== FAHRPLAN ==========
    function generateSchedule() {
        const now = new Date();
        const scheduleEntries = [];
        
        for (let i = 0; i < 5; i++) {
            const partnerIdx = (currentPartnerIndex + i) % partnerConnections.length;
            const partner = partnerConnections[partnerIdx];
            
            // Fake-Zeit generieren
            const mins = (now.getMinutes() + i * 8 + 2) % 60;
            const hours = (now.getHours() + Math.floor((now.getMinutes() + i * 8 + 2) / 60)) % 24;
            const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
            
            // Status basierend auf Position
            let status: TrainStatus;
            if (i === 0) {
                // Aktuelle Verbindung - Status von Phase ableiten
                if (trainPhase === 'arriving') status = 'arriving';
                else if (trainPhase === 'stopped') status = 'boarding';
                else if (trainPhase === 'departing') status = 'departing';
                else status = 'departed';
            } else {
                status = 'departed'; // Zukünftige zeigen "---"
            }
            
            scheduleEntries.push({
                destination: partner,
                time,
                platform: (i % 2 + 1) as 1 | 2,
                status
            });
        }
        
        return scheduleEntries;
    }

    let schedule = $derived(generateSchedule());

    // ========== GLEIS-GEOMETRIE ==========
    // Gleise verlaufen entlang X-Achse (links-rechts)
    // Bahnsteig ist bei Z=0, Gleise bei Z > 0
    const trackLength = 60;
    const trackWidth = 0.15;
    const trackSpacing = 2;  // Abstand zwischen den Schienen
    const trackY = 0;        // Höhe der Gleise
    const trackZ = 4;        // Z-Position der Gleismitte (vor dem Bahnsteig)
</script>

<T.Group position={position} rotation.y={rotation}>
    
    <!-- ========== BAHNSTEIG-PLATTFORM ========== -->
    <!-- Bahnsteig parallel zu den Gleisen (entlang X) -->
    <T.Group position={[0, 0, 0]}>
        <!-- Hauptplattform: Lang entlang X, schmal in Z -->
        <T.Mesh position.y={-0.5} receiveShadow>
            <T.BoxGeometry args={[18, 1, 6]} />
            <T.MeshStandardMaterial 
                color={platformColor}
                metalness={0.3}
                roughness={0.7}
            />
        </T.Mesh>

        <!-- Plattform-Rand / Sicherheitslinie (am Gleis-Rand, Z=2.5) -->
        <T.Mesh position={[0, 0.01, 2.5]}>
            <T.BoxGeometry args={[18, 0.02, 0.3]} />
            <T.MeshStandardMaterial 
                color="#fbbf24"
                emissive="#fbbf24"
                emissiveIntensity={0.5}
            />
        </T.Mesh>

        <!-- Wartezone-Markierung -->
        <T.Mesh position={[0, 0.01, 0]}>
            <T.BoxGeometry args={[16, 0.02, 4]} />
            <T.MeshStandardMaterial 
                color="#334155"
                metalness={0.2}
                roughness={0.8}
            />
        </T.Mesh>
    </T.Group>

    <!-- ========== GLEISE (entlang X-Achse) ========== -->
    <T.Group position={[0, trackY, trackZ]}>
        <!-- Vordere Schiene (näher zum Bahnsteig) -->
        <T.Mesh position={[0, 0, -trackSpacing / 2]} rotation.z={Math.PI / 2} rotation.x={-Math.PI / 2}>
            <T.PlaneGeometry args={[trackWidth, trackLength]} />
            <T.MeshStandardMaterial 
                color="#64748b"
                metalness={0.8}
                roughness={0.3}
            />
        </T.Mesh>
        
        <!-- Hintere Schiene (weiter vom Bahnsteig) -->
        <T.Mesh position={[0, 0, trackSpacing / 2]} rotation.z={Math.PI / 2} rotation.x={-Math.PI / 2}>
            <T.PlaneGeometry args={[trackWidth, trackLength]} />
            <T.MeshStandardMaterial 
                color="#64748b"
                metalness={0.8}
                roughness={0.3}
            />
        </T.Mesh>

        <!-- Schwellen (quer zu den Gleisen, also entlang Z) -->
        {#each Array(20) as _, i}
            <T.Mesh position={[i * 3 - 28, -0.05, 0]}>
                <T.BoxGeometry args={[0.3, 0.1, 3]} />
                <T.MeshStandardMaterial 
                    color="#3f3f46"
                    roughness={0.9}
                />
            </T.Mesh>
        {/each}

        <!-- Gleis-Beleuchtung entlang der Schienen -->
        {#each Array(10) as _, i}
            <T.PointLight
                position={[i * 6 - 27, 0.3, 0]}
                color="#3b82f6"
                intensity={2}
                distance={5}
                decay={2}
            />
        {/each}
    </T.Group>

    <!-- ========== ZUG ========== -->
    <!-- Position: Auf den Gleisen (Z=trackZ, Y=0.8 über Boden) -->
    <!-- Der ShuttleTrain bewegt sich intern auf Z, wir rotieren die ganze Gruppe um 90° -->
    <T.Group position={[0, 0.8, trackZ]} rotation.y={Math.PI / 2}>
        <ShuttleTrain 
            partner={currentPartner}
            phase={trainPhase}
            progress={trainProgress}
        />
    </T.Group>

    <!-- ========== ABFAHRTSTAFEL ========== -->
    <DepartureBoard 
        {schedule}
        position={[-6, 4, -2]}
        rotation={Math.PI * 0.1}
    />

    <!-- ========== TERMINAL-SCHILD ========== -->
    <T.Group position={[0, 5, -2.5]}>
        <T.Mesh>
            <T.BoxGeometry args={[8, 1.2, 0.2]} />
            <T.MeshStandardMaterial 
                color="#0f172a"
                metalness={0.5}
                roughness={0.3}
            />
        </T.Mesh>
        <Text
            text="🚉 NEXUS TERMINAL"
            color="#3b82f6"
            fontSize={0.5}
            position={[0, 0, 0.15]}
            anchorX="center"
            anchorY="middle"
        />
    </T.Group>

    <!-- ========== DEKORATIVE ELEMENTE ========== -->
    
    <!-- Säulen entlang des Bahnsteigs -->
    {#each [-7, -2, 3, 8] as x}
        <T.Group position={[x, 0, -2]}>
            <T.Mesh position.y={2}>
                <T.CylinderGeometry args={[0.2, 0.25, 4, 8]} />
                <T.MeshStandardMaterial 
                    color="#64748b"
                    metalness={0.6}
                    roughness={0.3}
                />
            </T.Mesh>
            <!-- Säulen-Licht -->
            <T.PointLight
                position.y={3.5}
                color="#60a5fa"
                intensity={5}
                distance={6}
            />
        </T.Group>
    {/each}

    <!-- Bänke entlang des Bahnsteigs -->
    {#each [-5, 0, 5] as x}
        <T.Group position={[x, 0.4, -0.5]}>
            <!-- Sitzfläche -->
            <T.Mesh>
                <T.BoxGeometry args={[2, 0.1, 0.6]} />
                <T.MeshStandardMaterial color="#475569" />
            </T.Mesh>
            <!-- Beine -->
            {#each [-0.8, 0.8] as legX}
                <T.Mesh position={[legX, -0.25, 0]}>
                    <T.BoxGeometry args={[0.1, 0.5, 0.5]} />
                    <T.MeshStandardMaterial color="#334155" />
                </T.Mesh>
            {/each}
        </T.Group>
    {/each}

    <!-- ========== ATMOSPHÄRISCHE BELEUCHTUNG ========== -->
    <T.PointLight
        position={[0, 5, 2]}
        color="#3b82f6"
        intensity={20}
        distance={25}
    />
    
    <!-- Spots ins Dunkel (beide Gleis-Enden) -->
    <T.SpotLight
        position={[-25, 3, trackZ]}
        target.position={[-50, 0, trackZ]}
        color="#1e3a5f"
        intensity={30}
        distance={40}
        angle={0.4}
        penumbra={1}
    />
    <T.SpotLight
        position={[25, 3, trackZ]}
        target.position={[50, 0, trackZ]}
        color="#1e3a5f"
        intensity={30}
        distance={40}
        angle={0.4}
        penumbra={1}
    />

</T.Group>