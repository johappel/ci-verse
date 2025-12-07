<script lang="ts">
    /**
     * PlatformGlowFloor - 6 diffuse Glow-Spots auf dem Plattform-Boden
     * 
     * Shader mit UV-Koordinaten für weiche Glows
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

    // Shader Material für weiche Glow-Spots
    const glowMaterial = new ShaderMaterial({
        uniforms: {
            uColor: { value: new Color(glowColor) },
            uIntensity: { value: 0.6 }
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
        side: DoubleSide
    });

    // Color updaten
    $effect(() => {
        glowMaterial.uniforms.uColor.value = new Color(glowColor);
    });
</script>

<!-- Debug: Teste ob überhaupt was gerendert wird -->
<T.Mesh 
    rotation.x={-Math.PI / 2} 
    position.y={1.6}
    material={glowMaterial}
>
    <T.PlaneGeometry args={[platformSize * 2, platformSize * 2]} />
</T.Mesh>
