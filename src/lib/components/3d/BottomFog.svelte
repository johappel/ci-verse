<script lang="ts">
    import { T } from '@threlte/core';
    import { ShaderMaterial, Color, DoubleSide, NormalBlending } from 'three';

    // Parameter
    let { 
        cutoffY = -5, 
        thickness = 30, 
        fogColor = '#0d1117',
        maxAlpha = 0.9,
        size = 600
    } = $props();

    // Shader Material für volumetrischen Nebel
    const fogMaterial = new ShaderMaterial({
        uniforms: {
            cutoffY: { value: cutoffY },
            thickness: { value: thickness },
            fogColor: { value: new Color(fogColor) },
            maxAlpha: { value: maxAlpha }
        },
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            uniform float cutoffY;
            uniform float thickness;
            uniform vec3 fogColor;
            uniform float maxAlpha;
            varying vec3 vWorldPos;
            void main() {
                // t==1 -> fully fogged (low), t==0 -> transparent (above cutoff)
                float t = clamp((cutoffY - vWorldPos.y) / thickness, 0.0, 1.0);
                float alpha = smoothstep(0.0, 1.0, t) * maxAlpha;
                gl_FragColor = vec4(fogColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: DoubleSide,
        blending: NormalBlending
    });

    // Update uniforms wenn sich Props ändern
    $effect(() => {
        fogMaterial.uniforms.cutoffY.value = cutoffY;
        fogMaterial.uniforms.thickness.value = thickness;
        fogMaterial.uniforms.fogColor.value = new Color(fogColor);
        fogMaterial.uniforms.maxAlpha.value = maxAlpha;
    });
</script>

<!-- Große Box die den unteren Bereich umschließt -->
<T.Mesh 
    position={[0, cutoffY - thickness / 2, 0]} 
    renderOrder={999}
    material={fogMaterial}
>
    <T.BoxGeometry args={[size, thickness * 2, size]} />
</T.Mesh>
