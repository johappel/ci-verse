<script lang="ts">
    import { worldStore } from "$lib/logic/store.svelte";
    import type { Perspective } from "$lib/types/project";

    const perspectives: { value: Perspective; label: string; icon: string }[] =
        [
            { value: "default", label: "Übersicht", icon: "🌐" },
            { value: "digitality", label: "Digitalität", icon: "💻" },
            { value: "sustainability", label: "Nachhaltigkeit", icon: "🌱" },
            { value: "justice", label: "Gerechtigkeit", icon: "⚖️" },
            { value: "structure", label: "Struktur", icon: "🏗️" },
        ];

    function selectPerspective(persp: Perspective) {
        worldStore.setPerspective(persp);
    }
</script>

<div class="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-6">
    <nav
        class="bg-white/90 backdrop-blur-xl rounded-full shadow-2xl px-4 py-3 flex gap-2 border border-gray-200/50"
    >
        {#each perspectives as persp}
            <button
                onclick={() => selectPerspective(persp.value)}
                class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
          {worldStore.state.activePerspective === persp.value
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'}"
            >
                <span class="text-base">{persp.icon}</span>
                <span class="hidden md:inline">{persp.label}</span>
            </button>
        {/each}
    </nav>
</div>
