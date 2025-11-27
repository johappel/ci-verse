<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
	import { CameraControls } from '@threlte/extras';
	import type { CameraControlsRef } from '@threlte/extras';
	import WorldLayout from './WorldLayout.svelte';
	import BottomFog from './BottomFog.svelte';
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms, getCameraY } from '$lib/logic/platforms';

	// Props: Callback für Loading-Updates
	let { onLoadingUpdate }: { 
		onLoadingUpdate?: (data: { progress: number; message: string; done: boolean }) => void 
	} = $props();

	// CameraControls Referenz für Transport-Animation
	let cameraControls = $state<CameraControlsRef>();

	// Preload-Status (intern)
	let isPreloading = $state(true);
	let tourProgress = $state(0);

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
	
	// Helper: Update an Parent senden
	function updateLoading(progress: number, message: string, done = false) {
		onLoadingUpdate?.({ progress, message, done });
	}
	
	// Sofort beim Mount den ersten Update senden
	$effect(() => {
		// Sende sofort initialen Status
		updateLoading(5, 'Initialisiere 3D-Szene...');
	});

	// Preload-Rundflug
	async function runPreloadFlight() {
		if (!cameraControls) return;
		
		// === PHASE 1: Start ===
		updateLoading(10, 'Starte...');
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// === PHASE 2: Tour zu Q2 ===
		updateLoading(20, 'Fliege zu Europa...');
		
		cameraControls.smoothTime = 1.5;
		worldStore.startTransport('Q2');
		
		// Progress animieren während Flug
		for (let i = 0; i <= 25; i++) {
			tourProgress = i / 50;
			updateLoading(20 + (i * 2), 'Fliege zu Europa...');
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		// === PHASE 3: Zurück zum Marktplatz ===
		updateLoading(70, 'Zurück zum Marktplatz...');
		
		worldStore.startTransport('S');
		
		// Progress animieren während Rückflug
		for (let i = 25; i <= 50; i++) {
			tourProgress = i / 50;
			updateLoading(70 + ((i - 25) * 1.2), 'Zurück zum Marktplatz...');
			await new Promise(resolve => setTimeout(resolve, 60));
		}
		
		// === FERTIG ===
		updateLoading(100, 'Bereit!', true);
		isPreloading = false;
	}

	// Initial-Setup: Starte Preload-Flug SOFORT
	let hasInitialized = $state(false);
	$effect(() => {
		if (cameraControls && !hasInitialized) {
			hasInitialized = true;
			// Setze Startposition
			const q2 = platforms['Q2'];
			cameraControls.setLookAt(
				0, 80, 60,
				q2.x, q2.y, q2.z,
				false
			);
			// Starte SOFORT
			runPreloadFlight();
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
				
				// Kamera auf Augenhöhe, schaut IMMER zum Klickpunkt
				const cameraY = getCameraY(currentPlatform.y);
				cameraControls.setLookAt(
					camX, cameraY, camZ,                        // Kamera-Position auf Augenhöhe
					target.x, currentPlatform.y + 2, target.z,  // Schaut zum Klickpunkt (leicht über Oberfläche)
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
		<T.PerspectiveCamera makeDefault position={initialCamPos} fov={80} near={1} far={2000}>
			<CameraControls 
				bind:ref={cameraControls}
				smoothTime={3.0}
				draggingSmoothTime={0.5}
				maxPolarAngle={Math.PI / 2}
				minPolarAngle={Math.PI / 8}
				maxDistance={400}
				minDistance={8}
				azimuthRotateSpeed={0.5}
				polarRotateSpeed={0.9}
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
