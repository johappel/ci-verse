<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import WorldLayout from './WorldLayout.svelte';
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms } from '$lib/logic/platforms';

	// Nebel-Farben je nach Perspektive
	const fogColors: Record<string, string> = {
		default: '#0d1117',
		digitality: '#0a1628',
		sustainability: '#0a2818',
		justice: '#28200a',
		structure: '#0d1117'
	};

	// Reaktive Nebel-Farbe (direkt, ohne Spring für Strings)
	let currentFogColor = $derived(fogColors[worldStore.state.activePerspective] || '#0d1117');

	// Reaktive Atmosphäre
	let ambientIntensity = $derived(
		worldStore.state.activePerspective === 'digitality' ? 0.2 : 0.4
	);
</script>

<!-- Container mit festen viewport-Einheiten -->
<div class="w-screen h-screen" style="position: fixed; top: 0; left: 0;">
	<Canvas>
		<!-- Kamera: Auf Plattform-Höhe, etwas zurück -->
		<T.PerspectiveCamera makeDefault position={[0, 8, -80]} fov={60} near={1} far={2000}>
			<OrbitControls
				enableDamping
				dampingFactor={0.05}
				maxPolarAngle={Math.PI / 2.1}
				minPolarAngle={Math.PI / 8}
				maxDistance={500}
				minDistance={5}
				target={[0, 0, 0]}
			/>
		</T.PerspectiveCamera>

		<!-- Hintergrund (sehr dunkel für Kontrast) -->
		<T.Color attach="background" args={[currentFogColor]} />

		<!-- Exponentieller Nebel - angepasst für große Distanzen -->
		<T.FogExp2 attach="fog" args={[currentFogColor, 0.002]} />

		<!-- Beleuchtung -->
		<T.AmbientLight intensity={ambientIntensity} color="#e0e7ff" />

		<!-- Hauptlicht von oben (höher für große Szene) -->
		<T.DirectionalLight position={[100, 300, 150]} intensity={1.2} castShadow color="#ffffff" />

		<!-- Gegenlicht für weichere Schatten -->
		<T.DirectionalLight position={[-150, 200, -100]} intensity={0.5} color="#93c5fd" />

		<!-- Bodenlicht (nach oben gerichtet, für Atmosphäre) -->
		<T.DirectionalLight position={[0, -50, 0]} intensity={0.3} color="#4f46e5" />

		<!-- Hemisphären-Licht für natürlichere Beleuchtung -->
		<T.HemisphereLight args={['#87ceeb', '#1a1a2e', 0.5]} />

		<!-- Projekt-Layout mit Plattformen -->
		<WorldLayout />
	</Canvas>
</div>
