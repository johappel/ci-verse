<script lang="ts">
    /**
     * EnergyBeam - Vertikale Energie-Säule vom Boden zum Oktaeder
     * 
     * Visualisiert wie die gesammelte Energie aus dem Boden
     * nach oben in den Oktaeder fließt.
     * 
     * Features:
     * - Aufsteigende Licht-Partikel
     * - Pulsierender Zylinder
     * - Farbmischung aller Leitlinien
     * - Verstärkt beim Transport
     */
    import { T, useTask } from '@threlte/core';
    import { ShaderMaterial, Color, AdditiveBlending, DoubleSide, FrontSide } from 'three';
    import { worldStore } from '$lib/logic/store.svelte';

    interface Props {
        height?: number;
        baseY?: number;
        radius?: number;
        colors?: string[];
    }

    let { 
        height = 13,      // Höhe bis zum Oktaeder
        baseY = 2,        // Start-Y (über dem Boden)
        radius = 0.8,     // Radius der Säule
        colors = [
            '#facc15',  // Gold
            '#4ade80',  // Grün
            '#22d3ee',  // Cyan
            '#a78bfa'   // Violett
        ]
    }: Props = $props();

    let isTransporting = $derived(worldStore.state.isTransporting);
    let isOnS = $derived(worldStore.state.currentPlatform === 'S');

    // Zeit für Animation
    let time = $state(0);
    useTask((delta) => {
        time += delta * (isTransporting ? 3.0 : 1.0);
    });

    // Shader für die Energie-Säule
    const beamMaterial = new ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uHeight: { value: height },
            uColor0: { value: new Color(colors[0]) },
            uColor1: { value: new Color(colors[1]) },
            uColor2: { value: new Color(colors[2]) },
            uColor3: { value: new Color(colors[3]) },
            uTransporting: { value: 0.0 },
            uActive: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform float uHeight;
            uniform vec3 uColor0;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform float uTransporting;
            uniform float uActive;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            
            #define PI 3.14159265359
            
            float hash(float n) {
                return fract(sin(n) * 43758.5453);
            }
            
            void main() {
                // Normalisierte Hoehe (0 = unten, 1 = oben)
                float h = vUv.y;
                
                // === AUFSTEIGENDE ENERGIE-WELLEN ===
                float speed = uTransporting > 0.5 ? 3.0 : 1.2;
                
                // Mehrere Wellen die nach oben steigen
                float wave1 = sin((h * 8.0 - uTime * speed) * PI) * 0.5 + 0.5;
                float wave2 = sin((h * 12.0 - uTime * speed * 1.3) * PI) * 0.5 + 0.5;
                float wave3 = sin((h * 6.0 - uTime * speed * 0.8) * PI) * 0.5 + 0.5;
                
                float waves = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
                
                // === AUFSTEIGENDE PARTIKEL/PULSE ===
                // Mehrere Lichtpunkte die nach oben wandern
                float p1 = fract(uTime * speed * 0.3);
                float p2 = fract(uTime * speed * 0.3 + 0.33);
                float p3 = fract(uTime * speed * 0.3 + 0.66);
                
                float particle1 = smoothstep(0.15, 0.0, abs(h - p1)) * 2.0;
                float particle2 = smoothstep(0.12, 0.0, abs(h - p2)) * 1.5;
                float particle3 = smoothstep(0.10, 0.0, abs(h - p3)) * 1.2;
                
                float particles = particle1 + particle2 + particle3;
                
                // === FARB-ROTATION ===
                // Farben rotieren mit der Zeit
                float colorPhase = uTime * 0.5 + h * 2.0;
                float c0 = sin(colorPhase) * 0.5 + 0.5;
                float c1 = sin(colorPhase + PI * 0.5) * 0.5 + 0.5;
                float c2 = sin(colorPhase + PI) * 0.5 + 0.5;
                float c3 = sin(colorPhase + PI * 1.5) * 0.5 + 0.5;
                
                vec3 color = uColor0 * c0 + uColor1 * c1 + uColor2 * c2 + uColor3 * c3;
                color = normalize(color) * 0.8; // Normalisieren
                
                // === INTENSITAET ===
                // Staerker in der Mitte, schwaecher am Rand
                float radialFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
                radialFade = pow(radialFade, 0.5);
                
                // Staerker oben (wo Energie ankommt)
                float heightIntensity = 0.5 + h * 0.5;
                
                // Basis-Glow
                float baseGlow = 0.3 + waves * 0.4;
                
                // Partikel addieren
                float intensity = (baseGlow + particles * 0.5) * radialFade * heightIntensity;
                
                // Transport-Boost
                if (uTransporting > 0.5) {
                    intensity *= 1.8;
                    // Schnelleres Pulsieren
                    intensity += sin(uTime * 8.0) * 0.2 * radialFade;
                }
                
                // Rand-Glow (aeusserer Schein)
                float edgeGlow = smoothstep(0.3, 0.5, abs(vUv.x - 0.5));
                color += vec3(1.0) * edgeGlow * 0.2;
                
                intensity *= uActive;
                
                gl_FragColor = vec4(color, intensity * 0.7);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide
    });

    // Uniforms aktualisieren
    $effect(() => {
        beamMaterial.uniforms.uTime.value = time;
    });

    $effect(() => {
        beamMaterial.uniforms.uTransporting.value = isTransporting ? 1.0 : 0.0;
    });

    $effect(() => {
        beamMaterial.uniforms.uActive.value = isOnS ? 1.0 : 0.0;
    });

    // Puls-Intensität für den Oktaeder (exportiert)
    let pulseIntensity = $derived(
        isTransporting 
            ? 0.8 + Math.sin(time * 8) * 0.2
            : 0.4 + Math.sin(time * 2) * 0.1
    );
</script>

<!-- Energie-Säule (Zylinder mit Shader) -->
{#if isOnS}
    <T.Mesh 
        position.y={baseY + height / 2}
        material={beamMaterial}
    >
        <T.CylinderGeometry args={[radius, radius * 1.5, height, 32, 1, true]} />
    </T.Mesh>

    <!-- Innerer Kern (heller, schmaler) -->
    <T.Mesh 
        position.y={baseY + height / 2}
        material={beamMaterial}
    >
        <T.CylinderGeometry args={[radius * 0.3, radius * 0.5, height, 16, 1, true]} />
    </T.Mesh>

    <!-- Basis-Glow (wo Energie vom Boden kommt) -->
    <T.Mesh 
        position.y={baseY + 0.1}
        rotation.x={-Math.PI / 2}
    >
        <T.RingGeometry args={[0, radius * 2, 32]} />
        <T.MeshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.3 + Math.sin(time * 3) * 0.1}
            blending={AdditiveBlending}
        />
    </T.Mesh>
{/if}
