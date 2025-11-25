<script lang="ts">
    import { interactivity } from "@threlte/extras";

    // Aktiviere Interaktivität (Klicks, Hover) für 3D-Objekte
    // Muss innerhalb des Canvas-Kontexts aufgerufen werden
    const { pointerOverTarget } = interactivity();

    // Debug: Log wenn Interaktivität initialisiert ist
    console.log("Interactivity plugin initialized");
</script>
