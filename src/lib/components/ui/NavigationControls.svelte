<script lang="ts">
	import { worldStore } from '$lib/logic/store.svelte';
	import { platforms } from '$lib/logic/platforms';
	
	// Kamera-Referenz wird von außen gesetzt
	let { cameraControls }: { cameraControls?: any } = $props();
	
	// Prüfe ob ein Textfeld fokussiert ist
	let isInputFocused = $state(false);
	
	// Aktive Tasten für visuelles Feedback
	let activeKeys = $state<Set<string>>(new Set());
	
	// Bewegungs-Geschwindigkeiten
	const MOVE_SPEED = 2;      // Vorwärts/Rückwärts
	const ROTATE_SPEED = 0.03; // Drehung in Radians
	
	// Keyboard-Listener
	$effect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Ignoriere wenn Textfeld fokussiert
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
				return;
			}
			
			const key = e.key.toLowerCase();
			
			if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'h', 'home', 'c'].includes(key)) {
				e.preventDefault();
				activeKeys.add(key);
				activeKeys = activeKeys; // Trigger reactivity
				
				// Home-Taste für Marktplatz
				if (key === 'h' || key === 'home') {
					goHome();
				} else if (key === 'c') {
					goToCenter();
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
		if (!cameraControls) return;
		
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
				cameraControls.rotate(-ROTATE_SPEED, 0, true);
				break;
			case 'd':
			case 'arrowright':
				// D = Kamera dreht nach LINKS (Blick bewegt sich nach rechts)
				cameraControls.rotate(ROTATE_SPEED, 0, true);
				break;
		}
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
		
		const currentPlatform = platforms[worldStore.state.currentPlatform];
		if (currentPlatform) {
			// Kamera zum InfoHexagon der aktuellen Plattform bewegen
			const pos = currentPlatform.position;
			cameraControls.setLookAt(
				pos[0], pos[1] + 12, pos[2] + 15,  // Kamera-Position
				pos[0], pos[1] + 2, pos[2],        // Blickziel (InfoHexagon)
				true                                // animiert
			);
		}
	}
	
	// Aktuelle Plattform-Info
	let currentPlatformName = $derived(platforms[worldStore.state.currentPlatform]?.name || 'Unbekannt');
	let isOnMarktplatz = $derived(worldStore.state.currentPlatform === 'S');
	let isTransporting = $derived(worldStore.state.isTransporting);
	
	// Prüfe ob Taste aktiv ist
	function isKeyActive(key: string): boolean {
		if (key === 'h') return activeKeys.has('h') || activeKeys.has('home');
		if (key === 'c') return activeKeys.has('c');
		return activeKeys.has(key) || activeKeys.has(key === 'w' ? 'arrowup' : key === 's' ? 'arrowdown' : key === 'a' ? 'arrowleft' : key === 'd' ? 'arrowright' : '');
	}
</script>

<!-- Kompakte 6-Tasten Navigation -->
<div 
	class="fixed left-1/2 -translate-x-1/2 z-30"
	style="bottom: 24px !important; top: auto !important;"
	class:opacity-50={isInputFocused}
	class:pointer-events-none={isInputFocused}
>
	<div class="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/25 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
		<!-- Obere Reihe: H - W - C -->
		<div class="flex gap-1">
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
		<div class="flex gap-1">
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
		
		<!-- Standort-Anzeige (kompakt unter den Tasten) -->
		<div class="mt-1 px-3 py-1 text-white/80 text-xs flex items-center gap-1.5">
			<span class="text-white/50">📍</span>
			<span class="font-medium">{currentPlatformName}</span>
		</div>
	</div>
</div>

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
	
	/* Keyboard-Indicator bei aktivem Fokus */
	.nav-key:focus-visible {
		outline: 2px solid rgba(96, 165, 250, 0.8);
		outline-offset: 2px;
	}
</style>
