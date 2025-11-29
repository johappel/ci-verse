# Dialog-Komponenten Guide

## Überblick

Dieses Dokument beschreibt die Implementierung von Dialog-Komponenten in einer Threlte/Three.js + SvelteKit Umgebung. Es dokumentiert die Lösungen für die z-index und Rendering-Probleme, die bei der Kombination von WebGL-Canvas und HTML-Overlays auftreten.

---

## Das Problem

### Symptome
- Dialog-Elemente sind im DOM vorhanden, aber **nicht sichtbar**
- CSS-Manipulationen (z-index, visibility, opacity) haben **keine Wirkung**
- Der Dialog-Rahmen erscheint, aber der **Inhalt bleibt unsichtbar**

### Ursachen

1. **Stacking Context durch WebGL Canvas**
   - Der Three.js `<canvas>` mit `position: fixed` erstellt einen eigenen Stacking Context
   - Normale z-index Regeln funktionieren nicht über Stacking Context Grenzen hinweg

2. **Tailwind CSS im Portal**
   - Elemente die per JavaScript ins DOM verschoben werden (Portal-Pattern) verlieren Tailwind-Klassen
   - Scoped Styles in Svelte funktionieren nur innerhalb des Original-Components

3. **Svelte 5 Snippets und DOM-Manipulation**
   - `{@render children()}` funktioniert nicht korrekt wenn der Parent-Node per `appendChild()` verschoben wird
   - Svelte verliert den Überblick über den DOM-Baum

---

## Die Lösung

### 1. Kein Portal verwenden

**❌ Vermeiden:**
```svelte
<!-- Portal verschiebt DOM-Nodes - bricht Svelte Snippets -->
<div use:portal>
    {@render children()}
</div>
```

**✅ Stattdessen:**
```svelte
<!-- Direkt rendern mit hohem z-index und isolation -->
<div style="
    position: fixed;
    z-index: 99999;
    isolation: isolate;
">
    {@render children()}
</div>
```

### 2. Dialog außerhalb des `<main>` Elements platzieren

In `+page.svelte`:

```svelte
<main class="w-screen h-screen overflow-hidden relative">
    <!-- 3D Canvas -->
    <Scene />
    
    <!-- Andere UI-Elemente -->
    <NavigationControls />
</main>

<!-- Dialog AUSSERHALB von main für korrekten Stacking Context -->
{#if !isLoading}
    <ChatModal />
{/if}
```

### 3. Nur Inline-Styles verwenden

**❌ Tailwind-Klassen funktionieren nicht zuverlässig:**
```svelte
<div class="fixed inset-0 flex items-center justify-center bg-black/30">
```

**✅ Inline-Styles sind sicher:**
```svelte
<div style="
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
">
```

### 4. `isolation: isolate` verwenden

Erstellt einen neuen Stacking Context und verhindert Konflikte mit dem Canvas:

```svelte
<div style="
    position: fixed;
    z-index: 99999;
    isolation: isolate;
">
```

---

## GlassDialog Komponente

### Struktur

```
GlassDialog.svelte
├── Backdrop (fixed, fullscreen)
│   ├── Overlay (semi-transparent blur)
│   └── Dialog Box (centered, draggable)
│       ├── Header (title, close button)
│       └── Content ({@render children()})
```

### Props Interface

```typescript
interface Props {
    isOpen: boolean;           // Dialog sichtbar?
    onClose: () => void;       // Callback zum Schließen
    title?: string;            // Header-Titel
    subtitle?: string;         // Untertitel
    icon?: Component;          // Lucide-Icon für Header
    width?: string;            // z.B. "450px"
    height?: string;           // z.B. "600px" oder "auto"
    children?: Snippet;        // Dialog-Inhalt
}
```

### Wichtige Style-Eigenschaften

```css
/* Backdrop */
position: fixed;
width: 100vw;
height: 100vh;
z-index: 99999;
isolation: isolate;

/* Overlay */
background: rgba(0, 0, 0, 0.3);
backdrop-filter: blur(2px);

/* Dialog Box */
background: rgba(15, 23, 42, 0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 1rem;
```

---

## Draggable Dialog

### State Management

```typescript
let dialogX = $state(0);
let dialogY = $state(0);
let isDragging = $state(false);
let dragStartX = $state(0);
let dragStartY = $state(0);

// Reset bei jedem Öffnen
$effect(() => {
    if (isOpen) {
        dialogX = 0;
        dialogY = 0;
    }
});
```

### Drag Events

```typescript
function startDrag(e: MouseEvent | TouchEvent) {
    isDragging = true;
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    dragStartX = clientX - dialogX;
    dragStartY = clientY - dialogY;
    
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag);
    window.addEventListener('touchend', stopDrag);
}

function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
    const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
    
    dialogX = clientX - dragStartX;
    dialogY = clientY - dragStartY;
    
    // Begrenzung auf Bildschirm
    const maxX = window.innerWidth / 2 - 50;
    const maxY = window.innerHeight / 2 - 50;
    dialogX = Math.max(-maxX, Math.min(maxX, dialogX));
    dialogY = Math.max(-maxY, Math.min(maxY, dialogY));
}

function stopDrag() {
    isDragging = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', stopDrag);
}
```

### Transform anwenden

```svelte
<div style="transform: translate({dialogX}px, {dialogY}px);">
```

---

## Store Integration

### WorldStore Methoden

```typescript
// In store.svelte.ts
openChat() {
    this.state.isChatOpen = true;
}

closeChat() {
    this.state.isChatOpen = false;
}
```

### Verwendung im Dialog

```svelte
<script>
    import { worldStore } from '$lib/logic/store.svelte';
    
    // Reaktiv vom Store
    let isModalOpen = $derived(worldStore.state.isChatOpen);
    
    function handleClose() {
        worldStore.closeChat();
    }
</script>

<GlassDialog isOpen={isModalOpen} onClose={handleClose}>
    <!-- Content -->
</GlassDialog>
```

---

## Escape-Key und Backdrop-Click

### Stability Delay

Verhindert sofortiges Schließen durch Events die während des Öffnens gefeuert werden:

```typescript
let isStable = $state(false);

$effect(() => {
    if (isOpen) {
        isStable = false;
        const timer = setTimeout(() => {
            isStable = true;
        }, 100);
        return () => clearTimeout(timer);
    }
});

function handleKeydown(e: KeyboardEvent) {
    if (!isStable) return;
    if (e.key === 'Escape') {
        onClose();
    }
}

function handleBackdropClick(e: MouseEvent) {
    if (!isStable) return;
    if (e.target === e.currentTarget) {
        onClose();
    }
}
```

---

## Checkliste für neue Dialoge

1. [ ] Dialog-Komponente außerhalb von `<main>` platzieren
2. [ ] Nur Inline-Styles verwenden (kein Tailwind)
3. [ ] `position: fixed` mit `z-index: 99999`
4. [ ] `isolation: isolate` für Stacking Context
5. [ ] `width: 100vw; height: 100vh` statt `inset: 0`
6. [ ] Store-Methoden für open/close implementieren
7. [ ] Stability delay für Escape/Backdrop-Click
8. [ ] Drag-Funktionalität mit Event-Cleanup

---

## Bekannte Einschränkungen

1. **Kein Portal-Pattern möglich** - Svelte 5 Snippets brechen
2. **Tailwind-Klassen unsicher** - Inline-Styles bevorzugen
3. **Animations müssen global sein** - `@keyframes` in `app.css` definieren
4. **backdrop-filter** - Funktioniert nur mit soliden z-index Werten

---

## Dateistruktur

```
src/lib/components/ui/
├── GlassDialog.svelte      # Basis-Dialog mit Glasmorphismus
├── ChatModal.svelte        # KI-Chat Dialog
├── ProjectCard.svelte      # Projekt-Detail Dialog
├── ContentCard.svelte      # Content-Detail Dialog
├── RssFeedPanel.svelte     # RSS-Feed Dialog
└── EventsPanel.svelte      # Events Dialog
```

---

## Beispiel: Neuen Dialog erstellen

```svelte
<!-- MyDialog.svelte -->
<script lang="ts">
    import { worldStore } from '$lib/logic/store.svelte';
    import GlassDialog from './GlassDialog.svelte';
    import { SomeIcon } from 'lucide-svelte';
    
    let isOpen = $derived(worldStore.state.isMyDialogOpen);
    
    function handleClose() {
        worldStore.closeMyDialog();
    }
</script>

<GlassDialog 
    {isOpen} 
    onClose={handleClose}
    title="Mein Dialog"
    subtitle="Beschreibung"
    icon={SomeIcon}
    width="500px"
    height="400px"
>
    <div style="padding: 1rem; color: white;">
        <!-- Dialog-Inhalt hier -->
        <p>Hallo Welt!</p>
    </div>
</GlassDialog>
```

In `+page.svelte`:
```svelte
</main>

<!-- Nach main -->
{#if !isLoading}
    <MyDialog />
{/if}
```
