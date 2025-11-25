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
		<!-- Kamera: Start VOR dem Marktplatz (negatives Z = vor dem User) -->
		<T.PerspectiveCamera makeDefault position={[0, 11, -16]} fov={60} near={0.1} far={200}>
			<OrbitControls
				enableDamping
				dampingFactor={0.05}
				maxPolarAngle={Math.PI / 2.1}
				minPolarAngle={Math.PI / 6}
				maxDistance={60}
				minDistance={5}
				target={[0, 8, 0]}
			/>
		</T.PerspectiveCamera>

		<!-- Hintergrund (sehr dunkel für Kontrast) -->
		<T.Color attach="background" args={[currentFogColor]} />

		<!-- Exponentieller Nebel - moderat, entfernte Plattformen im Nebel -->
		<T.FogExp2 attach="fog" args={[currentFogColor, 0.018]} />

		<!-- Beleuchtung -->
		<T.AmbientLight intensity={ambientIntensity} color="#e0e7ff" />

		<!-- Hauptlicht von oben -->
		<T.DirectionalLight position={[15, 40, 20]} intensity={1} castShadow color="#ffffff" />

		<!-- Gegenlicht für weichere Schatten -->
		<T.DirectionalLight position={[-20, 30, -15]} intensity={0.4} color="#93c5fd" />

		<!-- Bodenlicht (nach oben gerichtet, für Atmosphäre) -->
		<T.DirectionalLight position={[0, -10, 0]} intensity={0.2} color="#4f46e5" />

		<!-- Hemisphären-Licht für natürlichere Beleuchtung -->
		<T.HemisphereLight args={['#87ceeb', '#1a1a2e', 0.4]} />

		<!-- Projekt-Layout mit Plattformen -->
		<WorldLayout />
	</Canvas>
</div>
