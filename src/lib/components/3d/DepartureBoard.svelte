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
        rotationX?: number;  // Kippung zum Betrachter
        rotationZ?: number;  // Seitliche Kippung
    }

    let { 
        schedule, 
        position = [0, 4, 0],
        rotation = 0,
        rotationX = 0,
        rotationZ = 0
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

<T.Group position={position} rotation.y={rotation} rotation.x={rotationX} rotation.z={rotationZ}>
    <!-- Tafel-Rahmen (3D) - weiter nach hinten -->
    <T.Mesh position={[0, 0, -0.15]}>
        <T.BoxGeometry args={[8, 5, 0.2]} />
        <T.MeshStandardMaterial
            color="#1e293b"
            metalness={0.5}
            roughness={0.3}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
        />
    </T.Mesh>

    <!-- Leuchtender Rand - weiter nach hinten -->
    <T.Mesh position={[0, 0, -0.12]}>
        <T.BoxGeometry args={[8.1, 6.3, 0.1]} />
        <T.MeshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.3}
            metalness={0.7}
            roughness={0.2}
            polygonOffset
            polygonOffsetFactor={2}
            polygonOffsetUnits={2}
        />
    </T.Mesh>

    <!-- HTML-Overlay für Tafel-Inhalt - weiter nach vorne -->
    <HTML position={[0, 0, 0.1]} transform center>
        <div style="
            width: 320px;
            background: #0f172a;
            border-radius: 8px;
            border: 1px solid rgba(59, 130, 246, 0.5);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            user-select: none;
            font-family: 'Courier New', monospace;
        ">
            <!-- Header -->
            <div style="
                background: #2563eb;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">🚉</span>
                    <span style="color: white; font-weight: bold; font-size: 14px;">NEXUS TERMINAL</span>
                </div>
                <span style="color: white; font-size: 12px;">Verbindungen</span>
            </div>

            <!-- Spalten-Header -->
            <div style="
                display: grid;
                grid-template-columns: 60px 1fr 50px 70px;
                gap: 4px;
                padding: 4px 8px;
                background: #1e293b;
                font-size: 12px;
                color: white;
                border-bottom: 1px solid #334155;
            ">
                <span>Zeit</span>
                <span>Ziel</span>
                <span style="text-align: center;">Gleis</span>
                <span style="text-align: right;">Status</span>
            </div>

            <!-- Fahrplan-Einträge -->
            <div>
                {#each schedule.slice(0, 5) as entry, i}
                    {@const statusDisplay = getStatusDisplay(entry.status)}
                    {@const isFirst = i === 0}
                    <button
                        style="
                            display: grid;
                            grid-template-columns: 60px 1fr 50px 70px;
                            gap: 4px;
                            padding: 6px 8px;
                            width: 100%;
                            text-align: left;
                            background: {isFirst ? '#1e293b' : 'transparent'};
                            border: none;
                            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
                            cursor: pointer;
                        "
                        onclick={() => handlePartnerClick(entry.destination)}
                    >
                        <!-- Zeit -->
                        <span style="
                            font-size: 14px;
                            font-family: monospace;
                            color: {isFirst ? '#facc15' : '#cbd5e1'};
                        ">
                            {entry.time}
                        </span>

                        <!-- Ziel mit Farb-Indikator -->
                        <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                            <span style="
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                flex-shrink: 0;
                                background-color: {entry.destination.color};
                            "></span>
                            <span style="
                                font-size: 14px;
                                color: {isFirst ? 'white' : '#cbd5e1'};
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">
                                {entry.destination.shortName}
                            </span>
                        </div>

                        <!-- Gleis -->
                        <span style="
                            font-size: 14px;
                            text-align: center;
                            color: {isFirst ? '#60a5fa' : '#94a3b8'};
                        ">
                            {entry.platform}
                        </span>

                        <!-- Status -->
                        <span style="
                            font-size: 12px;
                            text-align: right;
                            font-weight: 600;
                            color: {statusDisplay.color};
                        ">
                            {statusDisplay.text}
                        </span>
                    </button>
                {/each}
            </div>

            <!-- Footer -->
            <div style="
                background: #1e293b;
                padding: 6px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #334155;
            ">
                <span style="font-size: 12px; color: #64748b;">
                    "Bildung verbindet uns"
                </span>
                <span style="font-size: 12px; color: #60a5fa;">
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
