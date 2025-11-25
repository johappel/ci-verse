# Routing Strategie

Obwohl es eine SPA ist, nutzen wir URL-Parameter (Query Params), damit Zustände teilbar sind.

### `/` (Home)
Zeigt die Standard-Welt.

### `/?view=digitality`
Lädt die Welt direkt mit der ausgewählten Leitperspektive (Deep-Linking für Newsletter!).

### `/?project=rpi-kita`
Öffnet beim Laden direkt das Modal für das spezifische Projekt und zoomt die Kamera dorthin.

**Implementation:**
In `+page.svelte` lesen wir `$page.url.searchParams` und schreiben sie beim Mounten in den `WorldStore`.