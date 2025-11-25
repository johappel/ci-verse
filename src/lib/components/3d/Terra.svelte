<script lang="ts">
    import { T } from "@threlte/core";
</script>

<T.Group rotation.x={-Math.PI / 2}>
    <T.Mesh receiveShadow position.y={-0.1}>
        <T.CircleGeometry args={[50, 64]} />
        <T.MeshStandardMaterial color="#e8e8e8" roughness={0.8} />
    </T.Mesh>

    <!-- Zentrum-Kreis als optischer Anker -->
    <T.Mesh receiveShadow position.y={0}>
        <T.CircleGeometry args={[2, 32]} />
        <T.MeshStandardMaterial color="#d1d5db" roughness={0.6} />
    </T.Mesh>
</T.Group>
