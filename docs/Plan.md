# Projektplan: Comenius 3D-Universum

## Phase 1: Daten-Fundament (Backend)
- [ ] WordPress Installation aufsetzen.
- [ ] Plugins installieren: CPT UI, Advanced Custom Fields (ACF), WPGraphQL, WPGraphQL for ACF.
- [ ] **wp-setup.md** umsetzen: CPTs und Taxonomien registrieren.
- [ ] Dummy-Content einpflegen (basierend auf `example-data.json`).
- [ ] GraphQL Query testen (Abruf aller Projekte mit Relationen).

## Phase 2: System-Architektur (Svelte/Kit Init)
- [ ] SvelteKit Projekt initialisieren (Svelte 5 Preview/RC, TypeScript).
- [ ] Threlte installieren (`@threlte/core`, `@threlte/extras`).
- [ ] **svelte-stores.md** implementieren: Globaler State Manager mit Runes.
- [ ] API-Service schreiben: Fetch-Logic von WPGraphQL in den Store integrieren.

## Phase 3: Die 3D-Welt (Core Visuals)
- [ ] **Scene.svelte** aufsetzen (Licht, Kamera, Fog, OrbitControls).
- [ ] **Layout-Algorithmus** entwickeln: Funktion, die Projekte basierend auf Bereich (B1-B3) auf Ringen/Hexagonen platziert.
- [ ] **ProjectBuilding.svelte** erstellen: Basis-Geometrie und Interaktion (Hover/Click).
- [ ] Q-Ebene (**FloatingPlatform**) implementieren: Schwebende Plattformen über der Welt.

## Phase 4: Visuelle Logik & Metaphern
- [ ] **Verbindungen:** Bezier-Kurven (DataStreams) zwischen Q-Plattformen und Projekten.
- [ ] **Leitperspektiven (Atmosphäre):** Post-Processing und Material-Änderungen basierend auf Filtern implementieren.
- [ ] UI-Overlay (HUD): Filter-Menü für Perspektiven und Detail-Modal für Projekte.

## Phase 5: Polish & Deploy
- [ ] Performance-Optimierung (InstancedMesh falls nötig, Textur-Kompression).
- [ ] Mobile Controls prüfen.
- [ ] Deployment (z.B. Vercel oder statischer Export).