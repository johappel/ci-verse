<script lang="ts">
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms } from '$lib/logic/platforms';
	import { getViewPoint, getMarketplaceViewPoint, getCenterViewPoint } from '$lib/logic/viewpoints';
	import { getBoothProjectsForPlatform, getWallPostersForPlatform, getMarketplaceContent, getPlatformContent } from '$lib/data/mockProjects';
	import { performanceStore } from '$lib/logic/performanceStore.svelte';
	import QualityDialog from './QualityDialog.svelte';
	import type { ProjectData } from '$lib/types/project';
	
	// Kamera-Referenz wird von außen gesetzt
	let { cameraControls }: { cameraControls?: any } = $props();
	
	// Prüfe ob ein Textfeld fokussiert ist
	let isInputFocused = $state(false);
	
	// Aktive Tasten für visuelles Feedback
	let activeKeys = $state<Set<string>>(new Set());
	
	// Poster-Navigation State
	let currentPosterIndex = $state(-1); // -1 = noch kein Poster angefahren
	
	// Plattform-Tour State
	const platformTourOrder = ['S', 'B1', 'B2', 'B3', 'Q1', 'Q2', 'Q3'] as const;
	let currentPlatformTourIndex = $state(-1); // -1 = noch nicht gestartet
	
	// Quality-Dialog State
	let isQualityDialogOpen = $state(false);
	
	// Draggable Panel Position
	let panelX = $state(0);  // Offset von Mitte
	let panelY = $state(0);  // Offset von unten
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let panelRef: HTMLDivElement | null = $state(null);
	
	// Bewegungs-Geschwindigkeiten
	const MOVE_SPEED = 2;      // Vorwärts/Rückwärts
	const ROTATE_SPEED = 0.3; // Drehung in Radians (erhöht von 0.03)
	
	// Keyboard-Listener
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignoriere wenn Textfeld fokussiert
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}
			
			const key = e.key.toLowerCase();
			
			if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'h', 'home', 'c', 'n', 'p'].includes(key)) {
				e.preventDefault();
				activeKeys.add(key);
				activeKeys = activeKeys; // Trigger reactivity
				
				// Home-Taste für Marktplatz
				if (key === 'h' || key === 'home') {
					goHome();
				} else if (key === 'c') {
					goToCenter();
				} else if (key === 'n') {
					// N = Nächstes Poster
					goToNextPoster();
				} else if (key === 'p') {
					// P = Nächste Plattform
					goToNextPlatform();
				} else {
					handleMovement(key);
				}
			}
		}
		
		function handleKeyUp(e: KeyboardEvent) {
			const key = e.key.toLowerCase();
			activeKeys.delete(key);
			activeKeys = activeKeys;
		}
		
		function handleFocusIn(e: FocusEvent) {
			const target = e.target as HTMLElement;
			isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
		}
		
		function handleFocusOut() {
			isInputFocused = false;
		}
		
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('focusin', handleFocusIn);
		window.addEventListener('focusout', handleFocusOut);
		
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			window.removeEventListener('focusin', handleFocusIn);
			window.removeEventListener('focusout', handleFocusOut);
		};
	});
	
	// Kamera-Bewegung (A = rechts drehen, D = links drehen - intuitiver!)
	function handleMovement(key: string) {
		// Schnelle Reaktion für Tastatur-Steuerung
		const currentSmoothTime = cameraControls?.smoothTime > 0.3 ? cameraControls.smoothTime : 1;
		cameraControls!.smoothTime = 0.1;
		
		switch (key) {
			case 'w':
			case 'arrowup':
				// Vorwärts (in Blickrichtung)
				cameraControls.forward(MOVE_SPEED, true);
				break;
			case 's':
			case 'arrowdown':
				// Rückwärts
				cameraControls.forward(-MOVE_SPEED, true);
				break;
			case 'a':
			case 'arrowleft':
				// A = Kamera dreht nach RECHTS (Blick bewegt sich nach links)
				cameraControls.rotate(ROTATE_SPEED, 0, true);
				break;
			case 'd':
			case 'arrowright':
				// D = Kamera dreht nach LINKS (Blick bewegt sich nach rechts)
				cameraControls.rotate(-ROTATE_SPEED, 0, true);
				break;
		}
		
		// Verzögert zurücksetzen, damit die Bewegung erst abgeschlossen wird
		setTimeout(() => {
			if (cameraControls) {
				cameraControls.smoothTime = currentSmoothTime;
			}
		}, 300);
	}
	
	// Button-Handler für Klicks
	function handleButtonPress(direction: 'w' | 'a' | 's' | 'd') {
		if (isInputFocused) return;
		handleMovement(direction);
	}
	
	function goHome() {
		if (worldStore.state.isTransporting || isInputFocused) return;
		if (worldStore.state.currentPlatform !== 'S') {
			worldStore.startTransport('S');
		}
	}
	
	// Zurück zum Zentrum/InfoHexagon der aktuellen Plattform
	function goToCenter() {
		if (isInputFocused || !cameraControls) return;
		
		const viewPoint = getCenterViewPoint(worldStore.state.currentPlatform);
		if (viewPoint) {
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
			
			// Poster-Index zurücksetzen wenn zum Zentrum navigiert wird
			currentPosterIndex = -1;
		}
	}
	
	// ============================================
	// PLATTFORM-TOUR (Play-Button)
	// ============================================
	
	// Aktueller Index in der Plattform-Tour basierend auf aktueller Plattform
	let currentPlatformIndex = $derived(
		platformTourOrder.indexOf(worldStore.state.currentPlatform as typeof platformTourOrder[number])
	);
	
	// Nächste Plattform in der Tour
	let nextPlatformId = $derived.by(() => {
		const nextIndex = (currentPlatformIndex + 1) % platformTourOrder.length;
		return platformTourOrder[nextIndex];
	});
	
	let nextPlatformName = $derived(getPlatformContent(nextPlatformId)?.short || nextPlatformId);
	
	// Zur nächsten Plattform in der Tour navigieren
	function goToNextPlatform() {
		if (worldStore.state.isTransporting || isInputFocused) return;
		
		// Poster-Index zurücksetzen
		currentPosterIndex = -1;
		
		// Zur nächsten Plattform transportieren
		worldStore.startTransport(nextPlatformId);
	}
	
	// ============================================
	// POSTER-NAVIGATION
	// ============================================
	
	// Interface für einheitliche Poster-Liste
	interface PosterTarget {
		type: 'booth' | 'wall' | 'reception' | 'leitlinie-left' | 'leitlinie-right';
		project?: ProjectData;
		position: number; // Index innerhalb des Typs
		label?: string; // Für Marktplatz-Tour
		groupIndex?: number; // Dreieck-Gruppe (0, 1, 2, ...)
		posInGroup?: number; // Position im Dreieck (0=A, 1=B, 2=C)
		groupAngle?: number; // Winkel der Gruppe für Sortierung
	}
	
	// Berechnet Gruppen-Info für einen Booth auf der Plattform
	// Synchron mit Platform.svelte Layout-Logik
	function getBoothGroupInfo(boothIndex: number, boothCount: number): { groupIndex: number; posInGroup: number; groupAngle: number } {
		const sectorSize = (2 * Math.PI) / 6;
		const hexRotation = Math.PI / 6;
		const usedSectors = 4;
		const startSector = 2;
		const usedArcSize = usedSectors * sectorSize;
		const startAngle = startSector * sectorSize + hexRotation;
		const angleSpread = usedArcSize * 0.85;
		
		const useTriangleGroups = boothCount >= 6;
		const groupIndex = useTriangleGroups ? Math.floor(boothIndex / 3) : 0;
		const posInGroup = useTriangleGroups ? boothIndex % 3 : boothIndex;
		const totalGroups = useTriangleGroups ? Math.ceil(boothCount / 3) : 1;
		
		const groupAngle = useTriangleGroups
			? (totalGroups === 1
				? startAngle + angleSpread / 2
				: startAngle + (groupIndex / (totalGroups - 1)) * angleSpread)
			: (boothCount === 1
				? startAngle + angleSpread / 2
				: startAngle + (boothIndex / (boothCount - 1)) * angleSpread);
		
		return { groupIndex, posInGroup, groupAngle };
	}
	
	// Alle anfahrbaren Poster/Booths der aktuellen Plattform
	// Marktplatz (S): ReceptionWall → Leitlinien-Poster
	// Andere Plattformen: Booths → Wall-Poster (räumlich sortiert)
	// Tour-Reihenfolge: Dreieck 1 (A→B→C), Dreieck 2 (A→B→C), Dreieck 3 (A→B→C)
	let allPosters = $derived.by(() => {
		const platformId = worldStore.state.currentPlatform;
		
		// Spezielle Tour für Marktplatz
		if (platformId === 'S') {
			const marketplace = getMarketplaceContent();
			const targets: PosterTarget[] = [
				// 1. ReceptionWall
				{ type: 'reception', position: 0, label: 'Empfang' },
				// 2-5. Linke Wand (4 Leitlinien-Poster, startEdge=5, 2 Wände)
				...marketplace.wallPosters.slice(0, 4).map((_, i) => ({
					type: 'leitlinie-left' as const,
					position: i,
					label: `Leitlinie ${i + 1}`
				})),
				// 6-7. Rechte Wand (2 Leitlinien-Poster, startEdge=1, 1 Wand)
				...marketplace.wallPosters.slice(4, 6).map((_, i) => ({
					type: 'leitlinie-right' as const,
					position: i,
					label: `Leitlinie ${i + 5}`
				}))
			];
			return targets;
		}
		
		// Standard-Tour für andere Plattformen
		const booths = getBoothProjectsForPlatform(platformId);
		const walls = getWallPostersForPlatform(platformId);
		const boothCount = booths.length;
		
		// Booths mit Gruppen-Info versehen
		const boothTargets: PosterTarget[] = booths.map((project, i) => {
			const info = getBoothGroupInfo(i, boothCount);
			return {
				type: 'booth' as const,
				project,
				position: i,
				groupIndex: info.groupIndex,
				posInGroup: info.posInGroup,
				groupAngle: info.groupAngle
			};
		});
		
		// Sortieren: Erst nach Gruppen-Winkel (im Uhrzeigersinn), dann nach Position im Dreieck (A→B→C)
		boothTargets.sort((a, b) => {
			// Primär: Nach Gruppen-Winkel (Dreiecke im Uhrzeigersinn)
			const angleDiff = (a.groupAngle ?? 0) - (b.groupAngle ?? 0);
			if (Math.abs(angleDiff) > 0.01) return angleDiff;
			// Sekundär: Nach Position im Dreieck (A=0, B=1, C=2)
			return (a.posInGroup ?? 0) - (b.posInGroup ?? 0);
		});
		
		// Wall-Poster hinzufügen (bleiben in Array-Reihenfolge, da sie schon räumlich sortiert sind)
		const wallTargets: PosterTarget[] = walls.map(({ project }, i) => ({
			type: 'wall' as const,
			project,
			position: i
		}));
		
		return [...boothTargets, ...wallTargets];
	});
	
	// Poster-Index zurücksetzen wenn Plattform wechselt
	$effect(() => {
		// Bei Plattformwechsel resetten
		const _platform = worldStore.state.currentPlatform;
		currentPosterIndex = -1;
	});
	
	// Hat die Plattform überhaupt Poster?
	let hasPosters = $derived(allPosters.length > 0);
	
	// Zum nächsten Poster navigieren
	function goToNextPoster() {
		if (isInputFocused || !cameraControls || allPosters.length === 0) return;
		
		// Nächster Index (loopt am Ende)
		currentPosterIndex = (currentPosterIndex + 1) % allPosters.length;
		
		const target = allPosters[currentPosterIndex];
		const platformId = worldStore.state.currentPlatform;
		
		if (!target) return;
		
		// Marktplatz-spezifische Navigation
		if (target.type === 'reception') {
			navigateToReceptionWall();
		} else if (target.type === 'leitlinie-left' || target.type === 'leitlinie-right') {
			// Konvertiere Position: left 0-3 = absolut 0-3, right 0-1 = absolut 4-5
			const absoluteIndex = target.type === 'leitlinie-left' ? target.position : target.position + 4;
			navigateToLeitlinie(absoluteIndex);
		} else if (target.type === 'booth' && target.project) {
			// Booth: Nutze Projekt-ID
			navigateToBooth(target.project.id, platformId);
		} else if (target.type === 'wall' && target.project) {
			// Wall-Poster: Nutze Projekt-ID
			navigateToWallPoster(target.project.id, platformId);
		}
	}
	
	// Navigation zu Marktplatz-Elementen (ReceptionWall, Leitlinien)
	function navigateToReceptionWall() {
		const viewPoint = getMarketplaceViewPoint('reception');
		if (viewPoint && cameraControls) {
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	function navigateToLeitlinie(posterIndex: number) {
		const viewPoint = getMarketplaceViewPoint('leitlinie', posterIndex);
		if (viewPoint && cameraControls) {
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	// Navigation zu einem Booth (nutzt zentrale API)
	function navigateToBooth(projectId: string, platformId: string) {
		const viewPoint = getViewPoint(projectId, 'booth', platformId);
		if (viewPoint && cameraControls) {
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	// Navigation zu einem Wall-Poster (nutzt zentrale API)
	function navigateToWallPoster(projectId: string, platformId: string) {
		const viewPoint = getViewPoint(projectId, 'wall', platformId);
		if (viewPoint && cameraControls) {
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	// Aktuelle Plattform-Info
	let currentPlatformName = $derived(getPlatformContent(worldStore.state.currentPlatform)?.title || 'Unbekannt');
	let isOnMarktplatz = $derived(worldStore.state.currentPlatform === 'S');
	let isTransporting = $derived(worldStore.state.isTransporting);
	
	// Prüfe ob Taste aktiv ist
	function isKeyActive(key: string): boolean {
		if (key === 'h') return activeKeys.has('h') || activeKeys.has('home');
		if (key === 'c') return activeKeys.has('c');
		return activeKeys.has(key) || activeKeys.has(key === 'w' ? 'arrowup' : key === 's' ? 'arrowdown' : key === 'a' ? 'arrowleft' : key === 'd' ? 'arrowright' : '');
	}
	
	// Drag & Drop Funktionen
	function startDrag(e: MouseEvent | TouchEvent) {
		isDragging = true;
		
		if (e instanceof MouseEvent) {
			dragStartX = e.clientX - panelX;
			dragStartY = e.clientY + panelY;
		} else {
			dragStartX = e.touches[0].clientX - panelX;
			dragStartY = e.touches[0].clientY + panelY;
		}
		
		window.addEventListener('mousemove', onDrag);
		window.addEventListener('mouseup', stopDrag);
		window.addEventListener('touchmove', onDrag);
		window.addEventListener('touchend', stopDrag);
	}
	
	function onDrag(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		
		e.preventDefault();
		
		let clientX: number, clientY: number;
		if (e instanceof MouseEvent) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		}
		
		panelX = clientX - dragStartX;
		// Y ist invertiert (von unten gemessen)
		panelY = dragStartY - clientY;
		
		// Begrenze auf Bildschirm
		const maxX = window.innerWidth / 2 - 100;
		const maxY = window.innerHeight - 150;
		panelX = Math.max(-maxX, Math.min(maxX, panelX));
		panelY = Math.max(0, Math.min(maxY, panelY));
	}
	
	function stopDrag() {
		isDragging = false;
		window.removeEventListener('mousemove', onDrag);
		window.removeEventListener('mouseup', stopDrag);
		window.removeEventListener('touchmove', onDrag);
		window.removeEventListener('touchend', stopDrag);
	}
	
	// Doppelklick zum Zurücksetzen
	function resetPosition() {
		panelX = 0;
		panelY = 0;
	}
</script>

<!-- Kompakte 6-Tasten Navigation - DRAGGABLE -->
<div 
	bind:this={panelRef}
	class="fixed z-30 select-none"
	style="left: calc(80% + {panelX}px); bottom: calc(24px + {panelY}px); transform: translateX(-50%); top: auto !important;"
	class:opacity-50={isInputFocused}
	class:pointer-events-none={isInputFocused}
	class:cursor-grabbing={isDragging}
>
	<div style="display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 5px; border-radius: 16px; background: rgba(0,0,0,0.2); backdrop-filter: blur(16px); box-shadow: 0 0 30px rgba(0,0,0,0.5);">
        <!-- Drag Handle / Standort-Anzeige -->
		<div 
			class="w-full px-3 py-1 text-white/70 text-xs font-medium text-center cursor-grab rounded-t-lg hover:bg-white/10 transition-colors"
			class:cursor-grabbing={isDragging}
			onmousedown={startDrag}
			ontouchstart={startDrag}
			ondblclick={resetPosition}
			title="Ziehen zum Verschieben, Doppelklick zum Zurücksetzen"
			role="slider"
			aria-label="Navigations-Panel verschieben"
			aria-valuenow={panelX}
			tabindex="0"
		>
			<span class="select-none" style="color: white;">{currentPlatformName}</span>
		</div>
		<!-- Obere Reihe: H - W - C -->
		 <!-- Nächstes Poster + Nächste Plattform in einer Reihe -->
		{#if hasPosters}
			<div style="display: flex; gap: 30px; margin-top: 4px; margin-botton: 10px;">
				<!-- Nächstes Poster -->
				<button
					onclick={goToNextPoster}
					class="nav-key nav-key-wide"
					title="Nächstes Poster ({currentPosterIndex + 2}/{allPosters.length})"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
					</svg>
					<span style="font-size: 0.65rem; margin-left: 4px;">
						{currentPosterIndex + 2 > allPosters.length ? 1 : currentPosterIndex + 2}/{allPosters.length}
					</span>
				</button>
				
				<!-- Nächste Plattform (Skip-Forward Icon) -->
				<button
					onclick={goToNextPlatform}
					disabled={isTransporting}
					class="nav-key nav-key-play"
					class:nav-key-disabled={isTransporting}
					title="Zur nächsten Plattform: {nextPlatformName}"
				>
					<!-- Skip-Forward Icon -->
					<svg class="w-5 h-5" fill="currentColor" stroke="none" viewBox="0 0 24 24">
						<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
					</svg>
				</button>
			</div>
		{:else}
			<!-- Nur Plattform-Button wenn keine Poster vorhanden -->
			<div style="display: flex; gap: 12px; margin-top: 4px;">
				<button
					onclick={goToNextPlatform}
					disabled={isTransporting}
					class="nav-key nav-key-play"
					class:nav-key-disabled={isTransporting}
					title="Zur nächsten Plattform: {nextPlatformName}"
				>
					<!-- Skip-Forward Icon -->
					<svg class="w-5 h-5" fill="currentColor" stroke="none" viewBox="0 0 24 24">
						<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
					</svg>
				</button>
			</div>
		{/if}
		<div style="display: flex; gap: 12px;">
			<!-- H = Home -->
			<button
				onclick={goHome}
				disabled={isOnMarktplatz || isTransporting}
				class="nav-key {isKeyActive('h') ? 'nav-key-active' : ''}"
				class:nav-key-disabled={isOnMarktplatz || isTransporting}
				title="Zum Marktplatz (H)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			</button>
			
			<!-- W = Vorwärts -->
			<button
				onmousedown={() => handleButtonPress('w')}
				class="nav-key {isKeyActive('w') ? 'nav-key-active' : ''}"
				title="Vorwärts (W / ↑)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
				</svg>
			</button>
			
			<!-- C = Center/Circle -->
			<button
				onclick={goToCenter}
				class="nav-key {isKeyActive('c') ? 'nav-key-active' : ''}"
				title="Zurück zum Zentrum (C)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<circle cx="12" cy="12" r="9" />
					<circle cx="12" cy="12" r="3" />
				</svg>
			</button>
		</div>
		
		<!-- Untere Reihe: A - S - D -->
		<div style="display: flex; gap: 12px;">
			<!-- A = Links drehen -->
			<button
				onmousedown={() => handleButtonPress('a')}
				class="nav-key {isKeyActive('a') ? 'nav-key-active' : ''}"
				title="Blick nach links (A / ←)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			
			<!-- S = Rückwärts -->
			<button
				onmousedown={() => handleButtonPress('s')}
				class="nav-key {isKeyActive('s') ? 'nav-key-active' : ''}"
				title="Rückwärts (S / ↓)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			
			<!-- D = Rechts drehen -->
			<button
				onmousedown={() => handleButtonPress('d')}
				class="nav-key {isKeyActive('d') ? 'nav-key-active' : ''}"
				title="Blick nach rechts (D / →)"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
		
		<!-- Rocket-Button für Grafik-Einstellungen -->
		<div style="display: flex; justify-content: center; margin-top: 4px;">
			<button
				onclick={() => isQualityDialogOpen = true}
				class="nav-key nav-key-rocket"
				title="Grafik-Einstellungen ({performanceStore.qualityLevel === 'high' ? 'Hoch' : performanceStore.qualityLevel === 'medium' ? 'Mittel' : 'Niedrig'})"
			>
				<span style="font-size: 1.1rem;">🚀</span>
			</button>
		</div>
		
		
	</div>
</div>

<!-- Quality Dialog -->
<QualityDialog bind:isOpen={isQualityDialogOpen} />

<style>
	/* Schicke gläserne Navigations-Tasten */
	.nav-key {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		
		/* Gläserner Effekt */
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.15) 0%,
			rgba(255, 255, 255, 0.05) 50%,
			rgba(0, 0, 0, 0.1) 100%
		);
		backdrop-filter: blur(8px);
		
		/* Gläserner Rand */
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow: 
			0 2px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
		
		/* Layout */
		display: flex;
		align-items: center;
		justify-content: center;
		
		/* Text/Icon */
		color: white;
		
		/* Interaktion */
		transition: all 0.15s ease;
		cursor: pointer;
	}
	
	.nav-key:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.25) 0%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(0, 0, 0, 0.05) 100%
		);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-1px);
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 0 rgba(0, 0, 0, 0.2);
	}
	
	.nav-key:active:not(.nav-key-disabled) {
		transform: translateY(1px) scale(0.95);
		box-shadow: 
			0 1px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}
	
	.nav-key-active {
		background: linear-gradient(
			145deg,
			rgba(96, 165, 250, 0.4) 0%,
			rgba(96, 165, 250, 0.2) 50%,
			rgba(59, 130, 246, 0.3) 100%
		);
		border-color: rgba(96, 165, 250, 0.7);
		box-shadow: 
			0 0 15px rgba(96, 165, 250, 0.5),
			0 2px 8px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}
	
	.nav-key-disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	/* Breiter Button für "Nächstes Poster" */
	.nav-key-wide {
		width: auto;
		padding: 0 0.75rem;
		min-width: 5rem;
	}
	
	/* Play-Button für Plattform-Tour (grüner Akzent) */
	.nav-key-play {
		background: linear-gradient(
			145deg,
			rgba(74, 222, 128, 0.25) 0%,
			rgba(34, 197, 94, 0.15) 50%,
			rgba(22, 163, 74, 0.2) 100%
		);
		border-color: rgba(74, 222, 128, 0.5);
	}
	
	.nav-key-play:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(74, 222, 128, 0.4) 0%,
			rgba(34, 197, 94, 0.25) 50%,
			rgba(22, 163, 74, 0.3) 100%
		);
		border-color: rgba(74, 222, 128, 0.7);
		box-shadow: 
			0 0 15px rgba(74, 222, 128, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}
	
	/* Rocket-Button für Grafik-Einstellungen (orange Akzent) */
	.nav-key-rocket {
		background: linear-gradient(
			145deg,
			rgba(251, 146, 60, 0.25) 0%,
			rgba(234, 88, 12, 0.15) 50%,
			rgba(194, 65, 12, 0.2) 100%
		);
		border-color: rgba(251, 146, 60, 0.5);
	}
	
	.nav-key-rocket:hover {
		background: linear-gradient(
			145deg,
			rgba(251, 146, 60, 0.4) 0%,
			rgba(234, 88, 12, 0.25) 50%,
			rgba(194, 65, 12, 0.3) 100%
		);
		border-color: rgba(251, 146, 60, 0.7);
		box-shadow: 
			0 0 15px rgba(251, 146, 60, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}
	
	/* Keyboard-Indicator bei aktivem Fokus */
	.nav-key:focus-visible {
		outline: 2px solid rgba(96, 165, 250, 0.8);
		outline-offset: 2px;
	}
</style>
