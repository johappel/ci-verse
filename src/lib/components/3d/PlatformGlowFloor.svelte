<script lang="ts">
    /**
     * PlatformGlowFloor - 6 diffuse Glow-Spots + Lampen an Traverse
     * 
     * Shader mit UV-Koordinaten für weiche Glows
     * Plus: Kegel-Lampen an hexagonaler Traverse
     */
    import { T } from '@threlte/core';
    import { ShaderMaterial, Color, AdditiveBlending, DoubleSide } from 'three';

    interface Props {
        platformSize: number;
        glowColor: string;
        spotCount?: number;
    }

    let { 
        platformSize,
        glowColor,
        spotCount = 6
    }: Props = $props();

    // Lampen-Positionen (Hexagon-Muster)
    const spotRadius = 0.55; // Etwas kleiner für kürzere Traverse
    const lampHeight = 13; // Höhe über Plattform
    const lamps = Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return {
            x: Math.cos(angle) * platformSize * spotRadius,
            z: Math.sin(angle) * platformSize * spotRadius,
            angle: angle
        };
    });

    // Warmweiße Lichtfarbe für alle Lampen und Boden-Glows
    const lightColor = '#fff8e0';

    // Shader Material für weiche Glow-Spots - WARMWEISS
    const glowMaterial = new ShaderMaterial({
        uniforms: {
            uColor: { value: new Color(lightColor) },
            uIntensity: { value: 0.65 }
        },
        vertexShader: `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uIntensity;
            
            varying vec2 vUv;
            
            #define PI 3.14159265359
            
            void main() {
                // UV von 0-1 zu -1 bis 1 zentrieren
                vec2 pos = (vUv - 0.5) * 2.0;
                
                float totalGlow = 0.0;
                
                // 6 Spot-Positionen im Hexagon-Muster (normalisiert auf -1 bis 1)
                float spotDist = 0.55; // Abstand vom Zentrum
                
                for (int i = 0; i < 6; i++) {
                    float angle = float(i) / 6.0 * 2.0 * PI;
                    vec2 spotCenter = vec2(cos(angle), sin(angle)) * spotDist;
                    
                    // Distanz zum Spot-Zentrum
                    float d = length(pos - spotCenter);
                    
                    // Gauss-Falloff für weichen Glow - etwas schärfer
                    float spotSize = 0.28;
                    float glow = exp(-d * d / (spotSize * spotSize));
                    
                    totalGlow += glow;
                }
                
                // Rand ausblenden
                float edgeDist = length(pos);
                float edgeFade = 1.0 - smoothstep(0.7, 1.0, edgeDist);
                totalGlow *= edgeFade;
                
                // Intensität
                totalGlow *= uIntensity;
                
                vec3 finalColor = uColor * totalGlow;
                
                gl_FragColor = vec4(finalColor, totalGlow);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });

    // Farbe ist fix warmweiß - kein Update nötig
</script>

<!-- Boden-Glows - höher über der Plattform für bessere Sichtbarkeit -->
<T.Mesh 
    rotation.x={-Math.PI / 2} 
    position.y={1.8}
    material={glowMaterial}
    renderOrder={100}
>
    <T.PlaneGeometry args={[platformSize * 2, platformSize * 2]} />
</T.Mesh>

<!-- Hexagonale Traverse (Ring) - fast schwarz -->
<T.Mesh position.y={lampHeight} rotation.x={Math.PI / 2}>
    <T.TorusGeometry args={[platformSize * spotRadius, 0.12, 6, 6]} />
    <T.MeshBasicMaterial color="#0f0f0f" />
</T.Mesh>

<!-- 6 Lampen an der Traverse -->
{#each lamps as lamp}
    <!-- Aufhängung (vertikale Stange) -->
    <T.Mesh position={[lamp.x, lampHeight - 0.4, lamp.z]}>
        <T.CylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
        <T.MeshBasicMaterial color="#0f0f0f" />
    </T.Mesh>
    
    <!-- Lampen-Kegel (hängt unter der Traverse) -->
    <T.Mesh position={[lamp.x, lampHeight - 1.0, lamp.z]}>
        <T.ConeGeometry args={[0.5, 0.7, 8]} />
        <T.MeshBasicMaterial color="#111111" />
    </T.Mesh>
    
    <!-- Leuchtende Linse (emissive Scheibe an Unterseite) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.32}
        position.z={lamp.z}
        rotation.x={-Math.PI / 2}
    >
        <T.CircleGeometry args={[0.35, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            side={DoubleSide}
        />
    </T.Mesh>
    
    <!-- Glow-Ring nach unten (sichtbar von oben) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.40}
        position.z={lamp.z}
        rotation.x={-Math.PI / 2}
    >
        <T.RingGeometry args={[0.35, 0.8, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            transparent={true}
            opacity={0.3}
            blending={AdditiveBlending}
            depthWrite={false}
        />
    </T.Mesh>
    
    <!-- Glow-Ring nach oben (sichtbar von unten) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.41}
        position.z={lamp.z}
        rotation.x={Math.PI / 2}
    >
        <T.RingGeometry args={[0.35, 0.8, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            transparent={true}
            opacity={0.3}
            blending={AdditiveBlending}
            depthWrite={false}
        />
    </T.Mesh>
{/each}
