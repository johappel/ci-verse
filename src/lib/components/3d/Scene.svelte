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

	// Startposition: Marktplatz-Landepunkt
	const startPlatform = platforms['S'];
	const startLanding = startPlatform.landing || { offset: [0, 12, -35], lookAtOffset: [0, 3, 0] };
	const initialCamPos: [number, number, number] = [
		startPlatform.x + startLanding.offset[0],
		startPlatform.y + startLanding.offset[1],
		startPlatform.z + startLanding.offset[2]
	];

	// Exportiere controls für externe Nutzung
	export function getCameraControls() {
		return cameraControls;
	}

	// Initial-Setup: Kamera richtig ausrichten beim Start
	let hasInitialized = $state(false);
	$effect(() => {
		if (cameraControls && !hasInitialized) {
			hasInitialized = true;
			// Setze initiale Kamera-Ausrichtung zur Plattform-Mitte
			cameraControls.setLookAt(
				initialCamPos[0], initialCamPos[1], initialCamPos[2],
				startPlatform.x + startLanding.lookAtOffset[0],
				startPlatform.y + startLanding.lookAtOffset[1],
				startPlatform.z + startLanding.lookAtOffset[2],
				false // Nicht animiert beim Start
			);
		}
	});

	// Transport-Animation wenn sich die Plattform ändert
	$effect(() => {
		if (worldStore.state.isTransporting && worldStore.state.transportTarget && cameraControls) {
			const target = platforms[worldStore.state.transportTarget];
			if (target) {
				// Landepunkt: Entweder custom oder Fallback
				const landing = target.landing || {
					offset: [0, 15, -40],
					lookAtOffset: [0, 3, 0]
				};
				
				// Berechne absolute Kamera-Position
				const camX = target.x + landing.offset[0];
				const camY = target.y + landing.offset[1];
				const camZ = target.z + landing.offset[2];
				
				// Look-At IMMER zur Plattform-Mitte (auf Augenhöhe)
				const lookX = target.x;
				const lookY = target.y + 5;  // Augenhöhe über Plattform
				const lookZ = target.z;
				
				// Fliege zur Ziel-Plattform mit individuellem Landepunkt
				cameraControls.setLookAt(
					camX, camY, camZ,    // Kamera-Position
					lookX, lookY, lookZ, // Look-At zur Mitte
					true                 // animiert
				);
			}
		}
	});

	// Lokale Kamera-Bewegung auf der Plattform (Klick auf Boden)
	// Regel: Kamera positioniert sich so, dass sie ZUM KLICKPUNKT schaut
	// - Klick am Rand → Kamera bleibt innen, schaut nach außen
	// - Klick in der Mitte → Kamera bleibt außen, schaut nach innen
	$effect(() => {
		const target = worldStore.state.localCameraTarget;
		if (target && cameraControls && !worldStore.state.isTransporting) {
			const currentPlatform = platforms[worldStore.state.currentPlatform];
			if (currentPlatform) {
				// Berechne Distanz vom Klickpunkt zur Plattformmitte
				const dx = target.x - currentPlatform.x;
				const dz = target.z - currentPlatform.z;
				const distFromCenter = Math.sqrt(dx * dx + dz * dz);
				
				// Schwellwert: Innerhalb von 35% des Radius = "Mitte"
				const innerThreshold = currentPlatform.size * 0.35;
				const isClickingCenter = distFromCenter < innerThreshold;
				
				let camX: number, camZ: number;
				
				if (isClickingCenter) {
					// KLICK IN DER MITTE: Kamera von außen, schaut zur Mitte
					// Behalte aktuelle Kamera-Richtung oder nutze Standard-Richtung
					const camAngle = Math.atan2(
						cameraControls.camera.position.z - currentPlatform.z,
						cameraControls.camera.position.x - currentPlatform.x
					);
					const camDist = currentPlatform.size * 0.5; // Mittlerer Abstand
					camX = currentPlatform.x + Math.cos(camAngle) * camDist;
					camZ = currentPlatform.z + Math.sin(camAngle) * camDist;
				} else {
					// KLICK AM RAND: Kamera zwischen Mitte und Klickpunkt
					const dirX = dx / distFromCenter;
					const dirZ = dz / distFromCenter;
					const cameraDistFromCenter = Math.min(distFromCenter * 0.4, currentPlatform.size * 0.3);
					camX = currentPlatform.x + dirX * cameraDistFromCenter;
					camZ = currentPlatform.z + dirZ * cameraDistFromCenter;
				}
				
				// Kamera schaut IMMER zum Klickpunkt
				cameraControls.setLookAt(
					camX, currentPlatform.y + 8, camZ,          // Kamera-Position
					target.x, currentPlatform.y + 4, target.z, // Schaut zum Klickpunkt
					true
				);
			}
			// Target zurücksetzen nach Animation
			setTimeout(() => worldStore.clearLocalCameraTarget(), 100);
		}
	});

	// NEU: Direkte Kamera-Ansicht für Poster/Rollup-Klicks
	// Verwendet exakte Welt-Koordinaten für Kamera und LookAt
	$effect(() => {
		const view = worldStore.state.viewTarget;
		if (view && cameraControls && !worldStore.state.isTransporting) {
			cameraControls.setLookAt(
				view.camera.x, view.camera.y, view.camera.z,
				view.lookAt.x, view.lookAt.y, view.lookAt.z,
				true // animiert
			);
			// Target zurücksetzen nach kurzer Verzögerung
			setTimeout(() => worldStore.clearViewTarget(), 100);
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
		<!-- Startposition: Marktplatz-Landepunkt -->
		<T.PerspectiveCamera makeDefault position={initialCamPos} fov={60} near={1} far={2000}>
			<CameraControls 
				bind:ref={cameraControls}
				smoothTime={2.0}
				draggingSmoothTime={0.5}
				maxPolarAngle={Math.PI / 2.1}
				minPolarAngle={Math.PI / 8}
				maxDistance={400}
				minDistance={8}
				azimuthRotateSpeed={0.5}
				polarRotateSpeed={0.5}
				dollySpeed={0.5}
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
