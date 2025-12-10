<script lang="ts">
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms } from '$lib/logic/platforms';
	import { getViewPoint, getMarketplaceViewPoint, getCenterViewPoint } from '$lib/logic/viewpoints';
	import { performanceStore } from '$lib/logic/performanceStore.svelte';
	import QualityDialog from './QualityDialog.svelte';
	import HelpDialog from './HelpDialog.svelte';
	import { GaugeIcon, HelpCircleIcon, HomeIcon, ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CircleDotIcon, SkipBackIcon, SkipForwardIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-svelte';
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
	
	// Aktuelle Plattform-ID - gecacht für Performance (separates Signal!)
	let currentPlatformId = $derived(worldStore.currentPlatform);
	
	// Quality-Dialog State
	let isQualityDialogOpen = $state(false);
	
	// Help-Dialog State
	let isHelpDialogOpen = $state(false);
	
	// Draggable Panel Position
	let panelX = $state(0);  // Offset von Mitte
	let panelY = $state(0);  // Offset von unten
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let panelRef: HTMLDivElement | null = $state(null);
	
	// Bewegungs-Geschwindigkeiten
	const MOVE_SPEED = 2;      // Vorwärts/Rückwärts
	const ROTATE_SPEED = 0.3;  // Drehung in Radians
	
	// Keyboard-Listener
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignoriere wenn Textfeld fokussiert
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}
			
			const key = e.key.toLowerCase();
			
			// Alle relevanten Tasten
			if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'h', 'home', 'c', 'n', 'p', 'b', 'o', 'x', 'f1'].includes(key)) {
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
				} else if (key === 'b') {
					// B = Letztes/Vorheriges Poster
					goToPreviousPoster();
				} else if (key === 'p') {
					// P = Nächste Plattform
					goToNextPlatform();
				} else if (key === 'o') {
					// O = Vorherige Plattform
					goToPreviousPlatform();
				} else if (key === 'x') {
					// X = Quality-Einstellungen
					isQualityDialogOpen = true;
				} else if (key === 'f1') {
					// F1 = Hilfe
					isHelpDialogOpen = true;
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
	
	// Kamera-Bewegung
	function handleMovement(key: string) {
		const currentSmoothTime = cameraControls?.smoothTime > 0.3 ? cameraControls.smoothTime : 1;
		cameraControls!.smoothTime = 0.1;
		
		switch (key) {
			case 'w':
			case 'arrowup':
				cameraControls.forward(MOVE_SPEED, true);
				break;
			case 's':
			case 'arrowdown':
				cameraControls.forward(-MOVE_SPEED, true);
				break;
			case 'a':
			case 'arrowleft':
				cameraControls.rotate(ROTATE_SPEED, 0, true);
				break;
			case 'd':
			case 'arrowright':
				cameraControls.rotate(-ROTATE_SPEED, 0, true);
				break;
		}
		
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
		if (worldStore.isTransporting || isInputFocused) return;
		if (currentPlatformId !== 'S') {
			worldStore.startTransport('S');
		}
	}
	
	// Zurück zum Zentrum/InfoHexagon der aktuellen Plattform
	function goToCenter() {
		if (isInputFocused || !cameraControls) return;
		
		const viewPoint = getCenterViewPoint(currentPlatformId);
		if (viewPoint) {
			cameraControls.smoothTime = performanceStore.settings.cameraSmoothTime;
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
			
			// Poster-Index zurücksetzen
			currentPosterIndex = -1;
		}
	}
	
	// ============================================
	// PLATTFORM-TOUR
	// ============================================
	
	// Aktueller Index in der Plattform-Tour
	let currentPlatformIndex = $derived(
		platformTourOrder.indexOf(currentPlatformId as typeof platformTourOrder[number])
	);
	
	// Nächste Plattform
	let nextPlatformId = $derived.by(() => {
		const nextIndex = (currentPlatformIndex + 1) % platformTourOrder.length;
		return platformTourOrder[nextIndex];
	});
	
	// Vorherige Plattform
	let prevPlatformId = $derived.by(() => {
		const prevIndex = (currentPlatformIndex - 1 + platformTourOrder.length) % platformTourOrder.length;
		return platformTourOrder[prevIndex];
	});
	
	let nextPlatformName = $derived(worldStore.getPlatformContent(nextPlatformId)?.short || nextPlatformId);
	let prevPlatformName = $derived(worldStore.getPlatformContent(prevPlatformId)?.short || prevPlatformId);
	
	// Zur nächsten Plattform navigieren
	function goToNextPlatform() {
		if (worldStore.isTransporting || isInputFocused) return;
		currentPosterIndex = -1;
		worldStore.startTransport(nextPlatformId);
	}
	
	// Zur vorherigen Plattform navigieren
	function goToPreviousPlatform() {
		if (worldStore.isTransporting || isInputFocused) return;
		currentPosterIndex = -1;
		worldStore.startTransport(prevPlatformId);
	}
	
	// ============================================
	// POSTER-NAVIGATION
	// ============================================
	
	interface PosterTarget {
		type: 'booth' | 'wall' | 'reception' | 'leitlinie-left' | 'leitlinie-right';
		project?: ProjectData;
		position: number;
		label?: string;
		groupIndex?: number;
		posInGroup?: number;
		groupAngle?: number;
	}
	
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
	let allPosters = $derived.by(() => {
		const platformId = currentPlatformId;
		
		if (platformId === 'S') {
			const marketplace = worldStore.getMarketplaceContent();
			if (!marketplace) return [];
			const targets: PosterTarget[] = [
				{ type: 'reception', position: 0, label: 'Empfang' },
				...marketplace.wallPosters.slice(0, 4).map((_, i) => ({
					type: 'leitlinie-left' as const,
					position: i,
					label: `Leitlinie ${i + 1}`
				})),
				...marketplace.wallPosters.slice(4, 6).map((_, i) => ({
					type: 'leitlinie-right' as const,
					position: i,
					label: `Leitlinie ${i + 5}`
				}))
			];
			return targets;
		}
		
		const booths = worldStore.getBoothProjectsForPlatform(platformId);
		const walls = worldStore.getWallPostersForPlatform(platformId);
		const boothCount = booths.length;
		
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
		
		boothTargets.sort((a, b) => {
			const angleDiff = (a.groupAngle ?? 0) - (b.groupAngle ?? 0);
			if (Math.abs(angleDiff) > 0.01) return angleDiff;
			return (a.posInGroup ?? 0) - (b.posInGroup ?? 0);
		});
		
		const wallTargets: PosterTarget[] = walls.map(({ project }, i) => ({
			type: 'wall' as const,
			project,
			position: i
		}));
		
		return [...boothTargets, ...wallTargets];
	});
	
	// Poster-Index zurücksetzen wenn Plattform wechselt
	$effect(() => {
		const _platform = currentPlatformId;
		currentPosterIndex = -1;
	});
	
	let hasPosters = $derived(allPosters.length > 0);
	let posterCountDisplay = $derived(`${currentPosterIndex + 2 > allPosters.length ? 1 : currentPosterIndex + 2}/${allPosters.length}`);
	
	// Zum nächsten Poster navigieren
	function goToNextPoster() {
		if (isInputFocused || !cameraControls || allPosters.length === 0) return;
		
		currentPosterIndex = (currentPosterIndex + 1) % allPosters.length;
		navigateToPoster(currentPosterIndex);
	}
	
	// Zum vorherigen Poster navigieren
	function goToPreviousPoster() {
		if (isInputFocused || !cameraControls || allPosters.length === 0) return;
		
		currentPosterIndex = (currentPosterIndex - 1 + allPosters.length) % allPosters.length;
		navigateToPoster(currentPosterIndex);
	}
	
	// Navigation zu einem Poster (zentrale Funktion)
	function navigateToPoster(index: number) {
		const target = allPosters[index];
		const platformId = currentPlatformId;
		
		if (!target) return;
		
		if (target.type === 'reception') {
			navigateToReceptionWall();
		} else if (target.type === 'leitlinie-left' || target.type === 'leitlinie-right') {
			const absoluteIndex = target.type === 'leitlinie-left' ? target.position : target.position + 4;
			navigateToLeitlinie(absoluteIndex);
		} else if (target.type === 'booth' && target.project) {
			navigateToBooth(target.project.id, platformId);
		} else if (target.type === 'wall' && target.project) {
			navigateToWallPoster(target.project.id, platformId);
		}
	}
	
	function navigateToReceptionWall() {
		const viewPoint = getMarketplaceViewPoint('reception');
		if (viewPoint && cameraControls) {
			cameraControls.smoothTime = performanceStore.settings.cameraSmoothTime;
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
			cameraControls.smoothTime = performanceStore.settings.cameraSmoothTime;
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	function navigateToBooth(projectId: string, platformId: string) {
		const viewPoint = getViewPoint(projectId, 'booth', platformId);
		if (viewPoint && cameraControls) {
			cameraControls.smoothTime = performanceStore.settings.cameraSmoothTime;
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	function navigateToWallPoster(projectId: string, platformId: string) {
		const viewPoint = getViewPoint(projectId, 'wall', platformId);
		if (viewPoint && cameraControls) {
			cameraControls.smoothTime = performanceStore.settings.cameraSmoothTime;
			cameraControls.setLookAt(
				viewPoint.camera.x, viewPoint.camera.y, viewPoint.camera.z,
				viewPoint.target.x, viewPoint.target.y, viewPoint.target.z,
				true
			);
		}
	}
	
	// Aktuelle Plattform-Info
	let currentPlatformName = $derived(worldStore.getPlatformContent(currentPlatformId)?.title || 'Unbekannt');
	let isOnMarktplatz = $derived(currentPlatformId === 'S');
	let isTransporting = $derived(worldStore.isTransporting);
	
	// Prüfe ob Taste aktiv ist
	function isKeyActive(key: string): boolean {
		if (key === 'h') return activeKeys.has('h') || activeKeys.has('home');
		return activeKeys.has(key);
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
		panelY = dragStartY - clientY;
		
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
	
	function resetPosition() {
		panelX = 0;
		panelY = 0;
	}
</script>

<!-- Navigation Panel - 4x3 Grid + Shortcuts -->
<div 
	bind:this={panelRef}
	class="fixed z-30 select-none"
	style="left: calc(80% + {panelX}px); bottom: calc(24px + {panelY}px); transform: translateX(-50%); top: auto !important;"
	class:opacity-50={isInputFocused}
	class:pointer-events-none={isInputFocused}
	class:cursor-grabbing={isDragging}
>
	<div class="nav-container">
		<!-- Linker Bereich: Buttons -->
		<div class="nav-buttons">
			<!-- Drag Handle / Standort-Anzeige -->
			<div 
				class="nav-header"
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
				<span class="select-none">{currentPlatformName}</span>
			</div>
			
			<!-- Zeile 1: Home | Letztes Poster | Vorwärts | Nächstes Poster -->
			<div class="nav-row">
				<!-- Home -->
				<button
					onclick={goHome}
					disabled={isOnMarktplatz || isTransporting}
					class="nav-key"
					class:nav-key-active={isKeyActive('h')}
					class:nav-key-disabled={isOnMarktplatz || isTransporting}
					title="Zum Marktplatz (H)"
				>
					<HomeIcon size={18} />
				</button>
				
				<!-- Letztes Poster -->
				<button
					onclick={goToPreviousPoster}
					disabled={!hasPosters}
					class="nav-key nav-key-yellow"
					class:nav-key-active={isKeyActive('b')}
					class:nav-key-disabled={!hasPosters}
					title="Letztes Poster (B)"
				>
					<SkipBackIcon size={18} />
				</button>
				
				<!-- Vorwärts -->
				<button
					onmousedown={() => handleButtonPress('w')}
					class="nav-key nav-key-green"
					class:nav-key-active={isKeyActive('w')}
					title="Vorwärts (W / ↑)"
				>
					<ChevronUpIcon size={20} strokeWidth={3} />
				</button>
				
				<!-- Nächstes Poster -->
				<button
					onclick={goToNextPoster}
					disabled={!hasPosters}
					class="nav-key nav-key-yellow"
					class:nav-key-active={isKeyActive('n')}
					class:nav-key-disabled={!hasPosters}
					title="Nächstes Poster (N)"
				>
					<SkipForwardIcon size={18} />
				</button>
			</div>
			
			<!-- Zeile 2: Quality | Links | Zentrum | Rechts -->
			<div class="nav-row">
				<!-- Quality Settings -->
				<button
					onclick={() => isQualityDialogOpen = true}
					class="nav-key"
					class:nav-key-active={isKeyActive('x')}
					title="Grafik-Einstellungen (X)"
				>
					<GaugeIcon size={18} />
				</button>
				
				<!-- Links drehen -->
				<button
					onmousedown={() => handleButtonPress('a')}
					class="nav-key nav-key-green"
					class:nav-key-active={isKeyActive('a')}
					title="Nach links drehen (A / ←)"
				>
					<ChevronLeftIcon size={20} strokeWidth={3} />
				</button>
				
				<!-- Zentrum -->
				<button
					onclick={goToCenter}
					class="nav-key nav-key-orange"
					class:nav-key-active={isKeyActive('c')}
					title="Zum Zentrum (C)"
				>
					<CircleDotIcon size={18} />
				</button>
				
				<!-- Rechts drehen -->
				<button
					onmousedown={() => handleButtonPress('d')}
					class="nav-key nav-key-green"
					class:nav-key-active={isKeyActive('d')}
					title="Nach rechts drehen (D / →)"
				>
					<ChevronRightIcon size={20} strokeWidth={3} />
				</button>
			</div>
			
			<!-- Zeile 3: Hilfe | Letzte Plattform | Rückwärts | Nächste Plattform -->
			<div class="nav-row">
				<!-- Hilfe -->
				<button
					onclick={() => isHelpDialogOpen = true}
					class="nav-key"
					class:nav-key-active={isKeyActive('f1')}
					title="Hilfe (F1)"
				>
					<HelpCircleIcon size={18} />
				</button>
				
				<!-- Letzte Plattform -->
				<button
					onclick={goToPreviousPlatform}
					disabled={isTransporting}
					class="nav-key"
					class:nav-key-active={isKeyActive('o')}
					class:nav-key-disabled={isTransporting}
					title="Zur vorherigen Plattform: {prevPlatformName} (O)"
				>
					<ChevronsLeftIcon size={18} />
				</button>
				
				<!-- Rückwärts -->
				<button
					onmousedown={() => handleButtonPress('s')}
					class="nav-key nav-key-green"
					class:nav-key-active={isKeyActive('s')}
					title="Rückwärts (S / ↓)"
				>
					<ChevronDownIcon size={20} strokeWidth={3} />
				</button>
				
				<!-- Nächste Plattform -->
				<button
					onclick={goToNextPlatform}
					disabled={isTransporting}
					class="nav-key"
					class:nav-key-active={isKeyActive('p')}
					class:nav-key-disabled={isTransporting}
					title="Zur nächsten Plattform: {nextPlatformName} (P)"
				>
					<ChevronsRightIcon size={18} />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Quality Dialog -->
<QualityDialog bind:isOpen={isQualityDialogOpen} />

<!-- Help Dialog -->
<HelpDialog bind:isOpen={isHelpDialogOpen} />

<style>
	.nav-container {
		display: flex;
		gap: 12px;
		padding: 8px;
		border-radius: 16px;
		background: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(16px);
		box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
	}
	
	.nav-buttons {
		display: flex;
		flex-direction: column;
		gap: 6px;
		/* Breite fixieren auf Button-Grid: 4 Buttons à 2.5rem + 3 Gaps à 4px */
		width: calc(4 * 2.5rem + 3 * 4px);
	}
	
	.nav-header {
		padding: 6px 8px;
		text-align: center;
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: grab;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: background 0.15s;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
		box-sizing: border-box;
	}
	
	.nav-header:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.nav-row {
		display: flex;
		gap: 4px;
	}
	
	/* Basis-Tasten */
	.nav-key {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.6rem;
		
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.12) 0%,
			rgba(255, 255, 255, 0.04) 50%,
			rgba(0, 0, 0, 0.08) 100%
		);
		backdrop-filter: blur(8px);
		
		border: 1px solid rgba(255, 255, 255, 0.25);
		box-shadow: 
			0 2px 6px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		
		display: flex;
		align-items: center;
		justify-content: center;
		
		color: white;
		
		transition: all 0.15s ease;
		cursor: pointer;
	}
	
	.nav-key:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.2) 0%,
			rgba(255, 255, 255, 0.08) 50%,
			rgba(0, 0, 0, 0.04) 100%
		);
		border-color: rgba(255, 255, 255, 0.4);
		transform: translateY(-1px);
		box-shadow: 
			0 4px 10px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}
	
	.nav-key:active:not(.nav-key-disabled) {
		transform: translateY(1px) scale(0.95);
		box-shadow: 
			0 1px 3px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
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
			0 0 12px rgba(96, 165, 250, 0.5),
			0 2px 6px rgba(0, 0, 0, 0.2);
	}
	
	.nav-key-disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	
	/* Gelbe Tasten (Poster + Vorwärts) */
	.nav-key-yellow {
		background: linear-gradient(
			145deg,
			rgba(250, 204, 21, 0.25) 0%,
			rgba(234, 179, 8, 0.15) 50%,
			rgba(202, 138, 4, 0.2) 100%
		);
		border-color: rgba(250, 204, 21, 0.5);
	}
	
	.nav-key-yellow:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(250, 204, 21, 0.4) 0%,
			rgba(234, 179, 8, 0.25) 50%,
			rgba(202, 138, 4, 0.3) 100%
		);
		border-color: rgba(250, 204, 21, 0.7);
		box-shadow: 
			0 0 12px rgba(250, 204, 21, 0.4),
			0 4px 10px rgba(0, 0, 0, 0.3);
	}
	
	/* Grüne Tasten (Plattform + Rückwärts) */
	.nav-key-green {
		background: linear-gradient(
			145deg,
			rgba(74, 222, 128, 0.25) 0%,
			rgba(34, 197, 94, 0.15) 50%,
			rgba(22, 163, 74, 0.2) 100%
		);
		border-color: rgba(74, 222, 128, 0.5);
	}
	
	.nav-key-green:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(74, 222, 128, 0.4) 0%,
			rgba(34, 197, 94, 0.25) 50%,
			rgba(22, 163, 74, 0.3) 100%
		);
		border-color: rgba(74, 222, 128, 0.7);
		box-shadow: 
			0 0 12px rgba(74, 222, 128, 0.4),
			0 4px 10px rgba(0, 0, 0, 0.3);
	}
	
	/* Orange Taste (Zentrum) */
	.nav-key-orange {
		background: linear-gradient(
			145deg,
			rgba(251, 146, 60, 0.3) 0%,
			rgba(234, 88, 12, 0.2) 50%,
			rgba(194, 65, 12, 0.25) 100%
		);
		border-color: rgba(251, 146, 60, 0.6);
	}
	
	.nav-key-orange:hover:not(.nav-key-disabled) {
		background: linear-gradient(
			145deg,
			rgba(251, 146, 60, 0.45) 0%,
			rgba(234, 88, 12, 0.3) 50%,
			rgba(194, 65, 12, 0.35) 100%
		);
		border-color: rgba(251, 146, 60, 0.8);
		box-shadow: 
			0 0 15px rgba(251, 146, 60, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.3);
	}
	
	/* Keyboard Focus */
	.nav-key:focus-visible {
		outline: 2px solid rgba(96, 165, 250, 0.8);
		outline-offset: 2px;
	}
</style>
