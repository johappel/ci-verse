<script lang="ts">
    /**
     * EnergyFloor - Energie-Ströme von Leitlinien zur Mitte
     * 
     * Visualisiert wie die 6 Leitlinien-Poster (an den MesseWalls)
     * zusammenfließen und das Zentrum speisen.
     * 
     * Performance: Ein einziger Shader - keine CPU-Animation, keine Partikel.
     * 
     * Features:
     * - 6 farbige Energie-Ströme von den Wänden zur Mitte
     * - Sanfte Wellen-Animation (komplett im Shader)
     * - Intensität erhöht wenn Leitlinie aktiv
     * - Schneller + heller beim Transport
     */
    import { T, useTask } from '@threlte/core';
    import { ShaderMaterial, Color, AdditiveBlending, DoubleSide } from 'three';
    import { worldStore } from '$lib/logic/store.svelte';
    import type { Perspective } from '$lib/types/project';

    interface Props {
        radius?: number;
        intensity?: number;
        // Positionen der 6 Poster-Wände (Winkel in Radians)
        posterAngles?: number[];
        // Farben der 6 Ströme
        posterColors?: string[];
    }

    let { 
        radius = 30,
        intensity = 0.4,
        // Default: 6 Poster an den Hexagon-Wänden
        posterAngles = [
            Math.PI * 0.5,    // Wand 1
            Math.PI * 0.833,  // Wand 2
            Math.PI * 1.167,  // Wand 3
            Math.PI * 1.5,    // Wand 4
            Math.PI * 1.833,  // Wand 5
            Math.PI * 0.167   // Wand 6
        ],
        // 6 Farben für die 6 Leitlinien
        posterColors = [
            '#f59e0b',  // Amber (education - Religiöse Bildung)
            '#facc15',  // Gold (justice - Bildungsgerechtigkeit)
            '#4ade80',  // Grün (sustainability - Nachhaltigkeit)
            '#ec4899',  // Pink (diversity - Differenzsensibilität)
            '#22d3ee',  // Cyan (digitality - Digitalität)
            '#a78bfa'   // Violett (structure - Strukturveränderungen)
        ]
    }: Props = $props();

    // Perspektiven in Reihenfolge (6 Leitlinien)
    const perspectives: Perspective[] = ['education', 'justice', 'sustainability', 'diversity', 'digitality', 'structure'];

    // Aktive Perspektive
    let activePerspective = $derived(worldStore.state.activePerspective);
    let isTransporting = $derived(worldStore.isTransporting);

    // Zeit für Animation
    let time = $state(0);
    useTask((delta) => {
        time += delta * (isTransporting ? 2.5 : 1.0);
    });

    // Shader Material erstellen mit 6 Strömen
    const energyMaterial = new ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: intensity },
            uRadius: { value: radius },
            // Farben der 6 Ströme
            uColor0: { value: new Color(posterColors[0]) },
            uColor1: { value: new Color(posterColors[1]) },
            uColor2: { value: new Color(posterColors[2]) },
            uColor3: { value: new Color(posterColors[3]) },
            uColor4: { value: new Color(posterColors[4]) },
            uColor5: { value: new Color(posterColors[5]) },
            // Winkel der 6 Poster
            uAngle0: { value: posterAngles[0] },
            uAngle1: { value: posterAngles[1] },
            uAngle2: { value: posterAngles[2] },
            uAngle3: { value: posterAngles[3] },
            uAngle4: { value: posterAngles[4] },
            uAngle5: { value: posterAngles[5] },
            // Welcher Strom ist aktiv? (0-5, -1 = keiner)
            uActiveStream: { value: -1 },
            // Transport-Modus
            uTransporting: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPos;
            
            void main() {
                vUv = uv;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uIntensity;
            uniform float uRadius;
            uniform vec3 uColor0;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform vec3 uColor4;
            uniform vec3 uColor5;
            uniform float uAngle0;
            uniform float uAngle1;
            uniform float uAngle2;
            uniform float uAngle3;
            uniform float uAngle4;
            uniform float uAngle5;
            uniform float uActiveStream;
            uniform float uTransporting;
            
            varying vec2 vUv;
            varying vec3 vWorldPos;
            
            #define PI 3.14159265359
            
            // Einfache Noise-Funktion
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            // Berechnet Energie-Strom von der MesseWall (aussen) nach innen zur Mitte
            float energyStream(vec2 pos, float angle, float time, bool isActive) {
                float dist = length(pos);
                float normalizedDist = dist / uRadius;
                float posAngle = atan(pos.y, pos.x);
                
                // Winkel-Differenz zum Strom
                float angleDiff = abs(mod(posAngle - angle + PI, 2.0 * PI) - PI);
                
                // Strom-Breite: BREIT am Rand (Quelle bei MesseWall), schmal zur Mitte
                float streamWidth = 0.3 * normalizedDist + 0.06;
                float streamFalloff = smoothstep(streamWidth, streamWidth * 0.2, angleDiff);
                
                // === STARKE QUELLE AM RAND (MesseWall) ===
                float sourceGlow = smoothstep(0.7, 0.95, normalizedDist) * streamFalloff;
                float sourcePulse = sin(time * 3.0 + angle * 2.0) * 0.3 + 0.7;
                float sourceIntensity = sourceGlow * sourcePulse * 3.5;
                
                // === FLIESSENDE ENERGIE ZUR MITTE ===
                float flowSpeed = isActive ? 2.0 : 0.8;
                
                // Wellen die nach innen wandern
                float wave1 = sin(dist * 0.25 - time * flowSpeed * 1.5) * 0.5 + 0.5;
                float wave2 = sin(dist * 0.4 - time * flowSpeed * 2.0) * 0.5 + 0.5;
                float waves = wave1 * 0.6 + wave2 * 0.4;
                
                // Noise
                float n = noise(pos * 1.5 - vec2(time * 0.2));
                waves *= 0.7 + n * 0.3;
                
                // Gradient: stark am Rand
                float flowGradient = smoothstep(0.1, 0.85, normalizedDist);
                
                // === PULSIERENDE ENERGIE-PAKETE ===
                float pulse1Pos = fract(time * flowSpeed * 0.12);
                float pulse2Pos = fract(time * flowSpeed * 0.12 + 0.5);
                
                float pulse1 = smoothstep(0.12, 0.0, abs(normalizedDist - (1.0 - pulse1Pos)));
                float pulse2 = smoothstep(0.10, 0.0, abs(normalizedDist - (1.0 - pulse2Pos)));
                float pulses = (pulse1 + pulse2 * 0.6) * streamFalloff;
                
                float activeBoost = isActive ? 2.5 : 1.0;
                
                // Kombinieren
                float streamFlow = streamFalloff * waves * flowGradient;
                float intensity = (sourceIntensity + streamFlow + pulses * 1.5) * activeBoost;
                
                // Zentrum-Sammlung
                float centerCollect = smoothstep(0.25, 0.0, normalizedDist) * streamFalloff;
                intensity += centerCollect * 0.8;
                
                return intensity;
            }
            
            void main() {
                vec2 pos = vWorldPos.xz;
                float dist = length(pos);
                
                if (dist > uRadius * 0.95) {
                    discard;
                }
                
                // 6 Energie-Stroeme berechnen
                float s0 = energyStream(pos, uAngle0, uTime, uActiveStream == 0.0);
                float s1 = energyStream(pos, uAngle1, uTime, uActiveStream == 1.0);
                float s2 = energyStream(pos, uAngle2, uTime, uActiveStream == 2.0);
                float s3 = energyStream(pos, uAngle3, uTime, uActiveStream == 3.0);
                float s4 = energyStream(pos, uAngle4, uTime, uActiveStream == 4.0);
                float s5 = energyStream(pos, uAngle5, uTime, uActiveStream == 5.0);
                
                // Farben mischen
                vec3 color = vec3(0.0);
                color += uColor0 * s0;
                color += uColor1 * s1;
                color += uColor2 * s2;
                color += uColor3 * s3;
                color += uColor4 * s4;
                color += uColor5 * s5;
                
                // Zentrum - Alle Farben sammeln sich
                float normalizedDist = dist / uRadius;
                float centerGlow = smoothstep(0.2, 0.0, normalizedDist);
                float centerPulse = sin(uTime * 3.0) * 0.3 + 0.7;
                vec3 centerColor = (uColor0 + uColor1 + uColor2 + uColor3 + uColor4 + uColor5) / 6.0;
                color += centerColor * centerGlow * centerPulse * 1.5;
                
                // Heller Kern
                float coreGlow = smoothstep(0.08, 0.0, normalizedDist);
                color += vec3(1.0) * coreGlow * (0.3 + sin(uTime * 5.0) * 0.2);
                
                // Transport-Modus
                if (uTransporting > 0.5) {
                    color *= 1.5;
                    color += centerColor * centerGlow * sin(uTime * 8.0) * 0.5;
                }
                
                // Gesamt-Intensitaet
                float totalIntensity = (s0 + s1 + s2 + s3 + s4 + s5) * uIntensity;
                totalIntensity += centerGlow * 0.3;
                
                // Rand ausblenden
                float edgeFade = smoothstep(uRadius * 0.95, uRadius * 0.7, dist);
                totalIntensity *= edgeFade;
                
                gl_FragColor = vec4(color, totalIntensity);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide
    });

    // Uniforms aktualisieren
    $effect(() => {
        energyMaterial.uniforms.uTime.value = time;
    });

    $effect(() => {
        energyMaterial.uniforms.uIntensity.value = intensity;
    });

    $effect(() => {
        energyMaterial.uniforms.uTransporting.value = isTransporting ? 1.0 : 0.0;
    });

    $effect(() => {
        // Welcher Strom ist aktiv?
        const activeIndex = perspectives.indexOf(activePerspective as Perspective);
        energyMaterial.uniforms.uActiveStream.value = activeIndex >= 0 ? activeIndex : -1;
    });

    // Winkel aktualisieren wenn Props sich aendern
    $effect(() => {
        energyMaterial.uniforms.uAngle0.value = posterAngles[0] ?? 0;
        energyMaterial.uniforms.uAngle1.value = posterAngles[1] ?? 0;
        energyMaterial.uniforms.uAngle2.value = posterAngles[2] ?? 0;
        energyMaterial.uniforms.uAngle3.value = posterAngles[3] ?? 0;
        energyMaterial.uniforms.uAngle4.value = posterAngles[4] ?? 0;
        energyMaterial.uniforms.uAngle5.value = posterAngles[5] ?? 0;
    });
</script>

<!-- Energie-Boden Mesh (leicht ueber der Plattform) -->
<T.Mesh 
    rotation.x={-Math.PI / 2} 
    position.y={1.6}
    material={energyMaterial}
    renderOrder={10}
>
    <T.CircleGeometry args={[radius, 64]} />
</T.Mesh>
