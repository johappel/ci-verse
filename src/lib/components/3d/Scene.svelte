<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
	import { CameraControls } from '@threlte/extras';
	import type { CameraControlsRef } from '@threlte/extras';
	import WorldLayout from './WorldLayout.svelte';
	import BottomFog from './BottomFog.svelte';
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms } from '$lib/logic/platforms';

	// CameraControls Referenz für Transport-Animation
	let cameraControls = $state<CameraControlsRef>();

	// Exportiere controls für externe Nutzung
	export function getCameraControls() {
		return cameraControls;
	}

	// Transport-Animation wenn sich die Plattform ändert
	$effect(() => {
		if (worldStore.state.isTransporting && worldStore.state.transportTarget && cameraControls) {
			const target = platforms[worldStore.state.transportTarget];
			if (target) {
				// Fliege zur Ziel-Plattform
				cameraControls.setLookAt(
					target.x, target.y + 15, target.z - 60,  // Kamera-Position
					target.x, target.y, target.z,            // Look-At Ziel
					true                                      // animiert
				);
			}
		}
	});

	// Lokale Kamera-Bewegung auf der Plattform (Klick auf Boden)
	$effect(() => {
		const target = worldStore.state.localCameraTarget;
		if (target && cameraControls && !worldStore.state.isTransporting) {
			const currentPlatform = platforms[worldStore.state.currentPlatform];
			if (currentPlatform) {
				// Berechne Distanz vom Klickpunkt zur Plattformmitte
				const dx = target.x - currentPlatform.x;
				const dz = target.z - currentPlatform.z;
				const distFromCenter = Math.sqrt(dx * dx + dz * dz);
				
				// Schwellwert: Innerhalb von 40% des Radius = "innen"
				const innerThreshold = currentPlatform.size * 0.4;
				const isInnerArea = distFromCenter < innerThreshold;
				
				let camX: number, camZ: number, lookX: number, lookZ: number;
				
				if (isInnerArea) {
					// Innerer Bereich: Kamera hinter Klickpunkt, schaut zur Mitte
					const dirX = dx / (distFromCenter || 1);
					const dirZ = dz / (distFromCenter || 1);
					camX = target.x + dirX * 15;  // Hinter dem Klickpunkt (von Mitte aus)
					camZ = target.z + dirZ * 15;
					lookX = currentPlatform.x;    // Schaut zur Plattform-Mitte
					lookZ = currentPlatform.z;
				} else {
					// Äußerer Bereich: Kamera zwischen Mitte und Klickpunkt, schaut nach außen
					const dirX = dx / distFromCenter;
					const dirZ = dz / distFromCenter;
					camX = target.x - dirX * 20;  // Zwischen Mitte und Klickpunkt
					camZ = target.z - dirZ * 20;
					lookX = target.x;             // Schaut zum Klickpunkt (Rand)
					lookZ = target.z;
				}
				
				cameraControls.setLookAt(
					camX, target.y + 10, camZ,    // Kamera-Position
					lookX, target.y + 2, lookZ,   // Look-At Ziel
					true
				);
			}
			// Target zurücksetzen nach Animation
			setTimeout(() => worldStore.clearLocalCameraTarget(), 100);
		}
	});

	// Nebel-Farben je nach Perspektive
	const fogColors: Record<string, string> = {
		default: '#0d1117',
		digitality: '#0a1628',
		sustainability: '#0a2818',
		justice: '#28200a',
		structure: '#0d1117'
	};

	// Reaktive Nebel-Farbe
	let currentFogColor = $derived(fogColors[worldStore.state.activePerspective] || '#0d1117');

	// Reaktive Atmosphäre
	let ambientIntensity = $derived(
		worldStore.state.activePerspective === 'digitality' ? 0.3 : 0.5
	);
</script>

<!-- Container mit festen viewport-Einheiten -->
<div class="w-screen h-screen" style="position: fixed; top: 0; left: 0;">
	<Canvas>
		<!-- Kamera mit CameraControls für smooth Transport -->
		<T.PerspectiveCamera makeDefault position={[0, 15, -80]} fov={60} near={1} far={2000}>
			<CameraControls 
				bind:ref={cameraControls}
				smoothTime={1.5}
				draggingSmoothTime={0.2}
				maxPolarAngle={Math.PI / 2.1}
				minPolarAngle={Math.PI / 8}
				maxDistance={400}
				minDistance={8}
			/>
		</T.PerspectiveCamera>

		<!-- Hintergrund -->
		<T.Color attach="background" args={[currentFogColor]} />

		<!-- Distanz-Nebel für weit entfernte Objekte -->
		<T.FogExp2 attach="fog" args={[currentFogColor, 0.0015]} />

		<!-- Beleuchtung -->
		<T.AmbientLight intensity={ambientIntensity} color="#e0e7ff" />

		<!-- Hauptlicht von oben -->
		<T.DirectionalLight position={[100, 300, 150]} intensity={1.0} castShadow color="#ffffff" />

		<!-- Gegenlicht -->
		<T.DirectionalLight position={[-150, 200, -100]} intensity={0.4} color="#93c5fd" />

		<!-- Bodenlicht von unten -->
		<T.DirectionalLight position={[0, -80, 0]} intensity={0.2} color="#4f46e5" />

		<!-- Hemisphären-Licht -->
		<T.HemisphereLight args={['#87ceeb', '#1a1a2e', 0.4]} />

		<!-- Volumetrischer Boden-Nebel -->
		<BottomFog 
			cutoffY={-10} 
			thickness={40} 
			fogColor={currentFogColor}
			maxAlpha={0.85}
			size={800}
		/>

		<!-- Projekt-Layout mit Plattformen -->
		<WorldLayout />
	</Canvas>
</div>
