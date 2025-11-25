<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
</script>

<div class="w-full h-full bg-gray-200">
	<Canvas>
		<T.PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50}>
			<OrbitControls enableDamping />
		</T.PerspectiveCamera>

		<T.DirectionalLight position={[5, 10, 5]} />
		<T.AmbientLight intensity={0.5} />

		<T.Mesh>
			<T.BoxGeometry args={[2, 2, 2]} />
			<T.MeshStandardMaterial color="orange" />
		</T.Mesh>

		<T.GridHelper args={[20, 20]} />
	</Canvas>
</div>
