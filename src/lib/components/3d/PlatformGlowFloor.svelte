<script lang="ts">
    /**
     * PlatformGlowFloor - 6 diffuse Glow-Spots + Lampen an Traverse
     * 
     * Shader mit UV-Koordinaten für weiche Glows
     * Plus: Kegel-Lampen an hexagonaler Traverse
     */
    import { T } from '@threlte/core';
    import { ShaderMaterial, Color, AdditiveBlending, DoubleSide } from 'three';
    import { performanceStore } from '$lib/logic/performanceStore.svelte';

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

    // Performance-basierte Material-Auswahl
    // Verwende getter statt $derived für robustere Reaktivität
    let qualityLevel = $state(performanceStore.qualityLevel);
    
    // Sync mit Store
    $effect(() => {
        qualityLevel = performanceStore.qualityLevel;
    });
    
    // Abgeleitete Werte basierend auf lokalem State
    let isHighQuality = $derived(qualityLevel === 'high');
    let isLowQuality = $derived(qualityLevel === 'low');

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
    
    // Traverse-Konfiguration
    const traverseRadius = platformSize * spotRadius;
    const traverseColor = '#1a1a1a';
    const tubeRadius = 0.08;

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
                    float spotSize = 0.23;
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

<!-- Hexagonale Traverse - mit key für saubere Re-Renders bei Quality-Wechsel -->
{#key qualityLevel}

<!-- Äußerer Ring (oben) -->
<T.Mesh position.y={lampHeight + 0.15} rotation.x={Math.PI / 2}>
    <T.TorusGeometry args={[traverseRadius, tubeRadius, 8, 6]} />
    {#if isHighQuality}
    <T.MeshStandardMaterial color={traverseColor} metalness={0.2} roughness={0.8} />
    {:else if isLowQuality}
    <T.MeshBasicMaterial color={traverseColor} />
    {:else}
    <T.MeshLambertMaterial color={traverseColor} />
    {/if}
</T.Mesh>

<!-- Innerer Ring (unten) -->
<T.Mesh position.y={lampHeight - 0.15} rotation.x={Math.PI / 2}>
    <T.TorusGeometry args={[traverseRadius, tubeRadius, 8, 6]} />
    {#if isHighQuality}
    <T.MeshStandardMaterial color={traverseColor} metalness={0.2} roughness={0.8} />
    {:else if isLowQuality}
    <T.MeshBasicMaterial color={traverseColor} />
    {:else}
    <T.MeshLambertMaterial color={traverseColor} />
    {/if}
</T.Mesh>

<!-- 6 vertikale Streben zwischen den Ringen (an den Ecken) -->
{#each lamps as lamp}
    <T.Mesh position={[lamp.x, lampHeight, lamp.z]}>
        <T.CylinderGeometry args={[tubeRadius, tubeRadius, 0.3, 8]} />
        {#if isHighQuality}
        <T.MeshStandardMaterial color={traverseColor} metalness={0.2} roughness={0.8} />
        {:else if isLowQuality}
        <T.MeshBasicMaterial color={traverseColor} />
        {:else}
        <T.MeshLambertMaterial color={traverseColor} />
        {/if}
    </T.Mesh>
{/each}

<!-- 6 Lampen an der Traverse -->
{#each lamps as lamp}
    <!-- Aufhängung (vertikale Stange) -->
    <T.Mesh position={[lamp.x, lampHeight - 0.5, lamp.z]}>
        <T.CylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
        {#if isHighQuality}
        <T.MeshStandardMaterial color={traverseColor} metalness={0.2} roughness={0.8} />
        {:else if isLowQuality}
        <T.MeshBasicMaterial color={traverseColor} />
        {:else}
        <T.MeshLambertMaterial color={traverseColor} />
        {/if}
    </T.Mesh>
    
    <!-- Lampen-Kegel (Schirm: oben spitz, unten offen) -->
    <T.Mesh position={[lamp.x, lampHeight - 1.05, lamp.z]}>
        <T.ConeGeometry args={[0.45, 0.6, 8]} />
        {#if isHighQuality}
        <T.MeshStandardMaterial color={traverseColor} metalness={0.2} roughness={0.8} />
        {:else if isLowQuality}
        <T.MeshBasicMaterial color={traverseColor} />
        {:else}
        <T.MeshLambertMaterial color={traverseColor} />
        {/if}
    </T.Mesh>
    
    <!-- Leuchtende Linse (emissive Scheibe an Unterseite des Schirms) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.34}
        position.z={lamp.z}
        rotation.x={-Math.PI / 2}
    >
        <T.CircleGeometry args={[0.42, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            side={DoubleSide}
        />
    </T.Mesh>
    
    <!-- Leuchtende Kugel in der Mitte (hängt unter dem Schirm) -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.23}
        position.z={lamp.z}
    >
        <T.SphereGeometry args={[0.28, isHighQuality ? 30 : 16, isHighQuality ? 30 : 16]} />
        {#if isHighQuality}
        <T.MeshStandardMaterial 
            color="#fffaf0"
            emissive="#fffaf0"
            emissiveIntensity={20}
            toneMapped={false}
        />
        {:else}
        <T.MeshBasicMaterial 
            color="#fffaf0"
        />
        {/if}
    </T.Mesh>
    
    <!-- Glow-Ring nach unten (sichtbar von oben) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.39}
        position.z={lamp.z}
        rotation.x={-Math.PI / 2}
    >
        <T.RingGeometry args={[0.35, 0.8, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            transparent={true}
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
        />
    </T.Mesh>
    
    <!-- Glow-Ring nach oben (sichtbar von unten) - WARMWEISS -->
    <T.Mesh 
        position.x={lamp.x}
        position.y={lampHeight - 1.38}
        position.z={lamp.z}
        rotation.x={Math.PI / 2}
    >
        <T.RingGeometry args={[0.35, 0.8, 16]} />
        <T.MeshBasicMaterial 
            color="#fff8e0"
            transparent={true}
            opacity={0.6}
            blending={AdditiveBlending}
            depthWrite={false}
        />
    </T.Mesh>
{/each}

{/key}