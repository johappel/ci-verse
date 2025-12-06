<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { T } from '@threlte/core';
	import { CameraControls } from '@threlte/extras';
	import type { CameraControlsRef } from '@threlte/extras';
	import { Box3, Vector3 } from 'three';
	import WorldLayout from './WorldLayout.svelte';
	import BottomFog from './BottomFog.svelte';
	import { worldStore } from '$lib/logic/store.svelte';
	import { performanceStore } from '$lib/logic/performanceStore.svelte';
	import { platforms, getCameraY } from '$lib/logic/platforms';

	// Props: Callback für Loading-Updates und CameraControls
	let { onLoadingUpdate, onCameraReady }: { 
		onLoadingUpdate?: (data: { progress: number; message: string; done: boolean }) => void;
		onCameraReady?: (controls: CameraControlsRef) => void;
	} = $props();

	// CameraControls Referenz für Transport-Animation
	let cameraControls = $state<CameraControlsRef>();
	
	// Benachrichtige Parent wenn CameraControls bereit
	$effect(() => {
		if (cameraControls) {
			onCameraReady?.(cameraControls);
		}
	});

	// Preload-Status (intern)
	let isPreloading = $state(true);

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

	// Direkter Start - alle Plattformen werden sofort geladen, Shader im Hintergrund kompiliert
	async function initializeScene() {
		if (!cameraControls) return;
		
		updateLoading(10, 'Lade 3D-Welt...');
		
		// Setze Kamera direkt auf Startposition (Marktplatz-Landepunkt)
		const landing = startPlatform.landing || { offset: [0, 12, -35], lookAtOffset: [0, 3, 0] };
		cameraControls.setLookAt(
			startPlatform.x + landing.offset[0],
			startPlatform.y + landing.offset[1],
			startPlatform.z + landing.offset[2],
			startPlatform.x + landing.lookAtOffset[0],
			startPlatform.y + landing.lookAtOffset[1],
			startPlatform.z + landing.lookAtOffset[2],
			false // Keine Animation
		);
		
		updateLoading(20, 'Rendere Plattformen...');
		
		// Warte bis ShaderWarmup fertig ist (signalisiert via performanceStore)
		// Polling mit Progress-Updates
		let progress = 20;
		while (!performanceStore.shadersReady) {
			await new Promise(resolve => setTimeout(resolve, 100));
			progress = Math.min(progress + 5, 90);
			updateLoading(progress, 'Kompiliere Shader...');
		}
		
		updateLoading(100, 'Bereit!', true);
		isPreloading = false;
	}

	// Initial-Setup: Direkter Start
	let hasInitialized = $state(false);
	$effect(() => {
		if (cameraControls && !hasInitialized) {
			hasInitialized = true;
			// Starte direkt auf Marktplatz
			initializeScene();
		}
	});

	// Transport-Animation wenn sich die Plattform ändert
	// Die Kamera fliegt auf Höhe der Lichtlinien (Oktaeder-Höhe Y+15)
	// Im Low-Mode: Sofortiger Sprung statt Animation
	$effect(() => {
		if (worldStore.state.isTransporting && worldStore.state.transportTarget && cameraControls) {
			const target = platforms[worldStore.state.transportTarget];
			const current = platforms[worldStore.state.currentPlatform];
			if (target && current) {
				// Fluggeschwindigkeit aus Settings
				const flightSpeed = performanceStore.settings.cameraFlightSpeed;
				
				// Lichtlinien-Höhe: Oktaeder sind bei platform.y + 15
				const LIGHT_LINE_HEIGHT = 15;
				
				// Berechne Flughöhe: Höhere der beiden Plattformen + Lichtlinien-Offset + etwas darüber
				const flightAltitude = Math.max(current.y, target.y) + LIGHT_LINE_HEIGHT + 5;
				
				// Landepunkt auf Ziel-Plattform
				const landing = target.landing || {
					offset: [0, 15, -40],
					lookAtOffset: [0, 3, 0]
				};
				
				// Finale Kamera-Position
				const finalCamX = target.x + landing.offset[0];
				const finalCamY = target.y + landing.offset[1];
				const finalCamZ = target.z + landing.offset[2];
				
				// === INSTANT MODE: Sofortiger Sprung ===
				if (flightSpeed === 'instant') {
					// Berechne korrektes LookAt-Ziel aus landing.lookAtOffset
					const lookAtX = target.x + landing.lookAtOffset[0];
					const lookAtY = target.y + landing.lookAtOffset[1];
					const lookAtZ = target.z + landing.lookAtOffset[2];
					
					// Sofort teleportieren (ohne Animation!)
					cameraControls!.setLookAt(
						finalCamX, finalCamY, finalCamZ,
						lookAtX, lookAtY, lookAtZ,
						false  // FALSE = keine Animation, sofortiger Sprung
					);
					
					// Transport sofort abschließen
					worldStore.finishTransport();
					return; // Beende hier, keine weitere Animation
				}
				
				// === FAST MODE: Schnelle Animation ===
				const speedMultiplier = flightSpeed === 'fast' ? 0.5 : 1.0;
				
				// Aktuelle Kamera-Position
				const startX = cameraControls.camera.position.x;
				const startY = cameraControls.camera.position.y;
				const startZ = cameraControls.camera.position.z;
				
				// Mittelpunkt der Strecke (für Bogenkurve)
				const midX = (startX + finalCamX) / 2;
				const midZ = (startZ + finalCamZ) / 2;
				
				// 3-Stufen-Animation: Aufsteigen → Gleiten → Landen
				async function flyAlongLightBridge() {
					// Stufe 1: Sanft auf Flughöhe steigen
					cameraControls!.smoothTime = 1.8 * speedMultiplier;
					cameraControls!.setLookAt(
						startX, flightAltitude, startZ,  // Aufsteigen
						midX, flightAltitude - 5, midZ,  // Vorausschauen Richtung Ziel
						true
					);
					// Warte bis Aufstieg abgeschlossen
					await new Promise(r => setTimeout(r, 1600 * speedMultiplier));
					
					// Stufe 2: Auf Flughöhe zum Ziel gleiten
					cameraControls!.smoothTime = 2.5 * speedMultiplier;
					cameraControls!.setLookAt(
						finalCamX, flightAltitude, finalCamZ,  // Über dem Ziel
						target.x, target.y + 5, target.z,      // Schaut zur Plattform runter
						true
					);
					// Warte bis Gleiten abgeschlossen
					await new Promise(r => setTimeout(r, 2400 * speedMultiplier));
					
					// Stufe 3: Sanft zur Landeposition absenken
					cameraControls!.smoothTime = 1.0 * speedMultiplier;
					cameraControls!.setLookAt(
						finalCamX, finalCamY, finalCamZ,        // Finale Position
						target.x, target.y + 5, target.z,      // Look-At zur Mitte
						true
					);

					// Warte bis Kamera TATSÄCHLICH an Zielposition angekommen ist
					const POSITION_THRESHOLD = 0.5; // 50cm Toleranz
					const maxWaitTime = flightSpeed === 'fast' ? 4000 : 8000;
					await new Promise<void>(resolve => {
						const checkPosition = setInterval(() => {
							const cam = cameraControls!.camera.position;
							const dx = Math.abs(cam.x - finalCamX);
							const dy = Math.abs(cam.y - finalCamY);
							const dz = Math.abs(cam.z - finalCamZ);
							
							// Alle drei Achsen müssen innerhalb der Toleranz sein
							if (dx < POSITION_THRESHOLD && dy < POSITION_THRESHOLD && dz < POSITION_THRESHOLD) {
								clearInterval(checkPosition);
								resolve();
							}
						}, 100); // Prüfe alle 100ms
						
						// Fallback
						setTimeout(() => {
							clearInterval(checkPosition);
							resolve();
						}, maxWaitTime);
					});
					
					// SmoothTime aus Settings zurücksetzen
					cameraControls!.smoothTime = performanceStore.settings.cameraSmoothTime;
					
					// Transport abschließen
					worldStore.finishTransport();
				}
				
				flyAlongLightBridge();
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

	// ============================================
	// KAMERA-BEGRENZUNG mit setBoundary
	// ============================================
	// Setzt eine Box-Boundary um die aktuelle Plattform
	// Die Boundary wird bei Plattformwechsel aktualisiert
	const BOUNDARY_MARGIN = 8; // Meter vor dem Rand stoppen
	
	// Setze Boundary für eine Plattform
	function updateCameraBoundary(platformId: string) {
		if (!cameraControls) return;
		
		const platform = platforms[platformId];
		if (!platform) return;
		
		const boundarySize = platform.size - BOUNDARY_MARGIN;
		const minY = platform.y + 2;  // Mindesthöhe über Plattform
		const maxY = platform.y + 50; // Maximale Höhe
		
		const boundaryBox = new Box3(
			new Vector3(
				platform.x - boundarySize,
				minY,
				platform.z - boundarySize
			),
			new Vector3(
				platform.x + boundarySize,
				maxY,
				platform.z + boundarySize
			)
		);
		
		cameraControls.setBoundary(boundaryBox);
	}
	
	// Entferne Boundary (für Transport)
	function clearCameraBoundary() {
		if (!cameraControls) return;
		cameraControls.setBoundary(undefined);
	}
	
	// Boundary aktualisieren wenn sich die Plattform ändert
	$effect(() => {
		if (!cameraControls) return;
		
		// Während Transport oder Preload: keine Boundary
		if (worldStore.state.isTransporting || isPreloading) {
			clearCameraBoundary();
		} else {
			// Setze Boundary für aktuelle Plattform
			updateCameraBoundary(worldStore.state.currentPlatform);
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

	// Reaktive Atmosphäre (Performance-abhängig)
	let ambientIntensity = $derived(
		worldStore.state.activePerspective === 'digitality' ? 0.3 : 0.5
	);
	
	// Performance-abhängige Einstellungen
	let enableShadows = $derived(performanceStore.settings.enableShadows);
	let enableFog = $derived(performanceStore.settings.enableFog);
	let useHemisphereLight = $derived(performanceStore.settings.useHemisphereLight);
	let pixelRatio = $derived(performanceStore.settings.pixelRatio);
	let cameraSmoothTime = $derived(performanceStore.settings.cameraSmoothTime);
</script>

<!-- Container mit festen viewport-Einheiten -->
<div class="w-screen h-screen" style="position: fixed; top: 0; left: 0; z-index: 1;">
	<Canvas>
		<!-- Kamera mit CameraControls für smooth Transport -->
		<!-- WASD-Navigation aktiviert, Boundary begrenzt Bewegungsbereich auf Plattform -->
		<T.PerspectiveCamera makeDefault position={initialCamPos} fov={80} near={1} far={2000}>
			<CameraControls 
				bind:ref={cameraControls}
				smoothTime={cameraSmoothTime}
				draggingSmoothTime={cameraSmoothTime * 0.4}
				maxPolarAngle={Math.PI / 2}
				minPolarAngle={Math.PI / 8}
				maxDistance={80}
				minDistance={8}
				azimuthRotateSpeed={0.5}
				polarRotateSpeed={0.9}
				dollySpeed={0.5}
				truckSpeed={2.0}
			/>
		</T.PerspectiveCamera>

		<!-- Hintergrund -->
		<T.Color attach="background" args={[currentFogColor]} />

		<!-- Distanz-Nebel für weit entfernte Objekte (Performance-abhängig) -->
		{#if enableFog}
			<T.FogExp2 attach="fog" args={[currentFogColor, 0.007]} />
		{/if}

		<!-- Beleuchtung -->
		<T.AmbientLight intensity={ambientIntensity} color="#e0e7ff" />

		<!-- Hauptlicht von oben (Schatten nur bei High-Quality) -->
		<T.DirectionalLight 
			position={[100, 300, 150]} 
			intensity={1.0} 
			castShadow={enableShadows} 
			color="#ffffff" 
		/>

		<!-- Gegenlicht -->
		<T.DirectionalLight position={[-150, 200, -100]} intensity={0.4} color="#93c5fd" />

		<!-- Bodenlicht von unten (nur bei Medium/High) -->
		{#if performanceStore.qualityLevel !== 'low'}
			<T.DirectionalLight position={[0, -80, 0]} intensity={0.2} color="#4f46e5" />
		{/if}

		<!-- Hemisphären-Licht (Performance-abhängig) -->
		{#if useHemisphereLight}
			<T.HemisphereLight args={['#87ceeb', '#1a1a2e', 0.4]} />
		{/if}

		<!-- Volumetrischer Boden-Nebel (Performance-abhängig) -->
		{#if enableFog}
			<BottomFog 
				cutoffY={-10} 
				thickness={40} 
				fogColor={currentFogColor}
				maxAlpha={0.85}
				size={800}
			/>
		{/if}

		<!-- Projekt-Layout mit Plattformen -->
		<WorldLayout />
	</Canvas>
</div>
