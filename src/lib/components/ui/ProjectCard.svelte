<script lang="ts">
    import { worldStore } from "$lib/logic/store.svelte";
    import { mockStaff } from "$lib/data/mockProjects";
    import { fade, fly } from "svelte/transition";

    // Hole das aktuell aktive Projekt aus dem Store
    let project = $derived(
        worldStore.state.selectedId
            ? worldStore.state.projects.find(
                  (p) => p.id === worldStore.state.selectedId,
              )
            : null,
    );

    // Berechne ähnliche Projekte für den Footer
    let relatedProjects = $derived(
        project ? worldStore.getRelated(project.id).slice(0, 3) : [],
    );

    // Finde Staff-Details
    let staffDetails = $derived(
        project
            ? project.staff
                  .map((staffId) => mockStaff.find((s) => s.id === staffId))
                  .filter((s) => s !== undefined)
            : [],
    );

    function close() {
        worldStore.selectProject(null);
    }

    function openRelated(id: string) {
        worldStore.selectProject(id);
    }
</script>

{#if project}
    <!-- Backdrop mit Glass Effect -->
    <div
        class="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
        onclick={close}
        role="button"
        tabindex="-1"
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Die Card -->
    <article
        class="fixed inset-0 m-auto w-[90%] max-w-3xl h-fit max-h-[90vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col md:flex-row"
        transition:fly={{ y: 50, duration: 300 }}
    >
        <!-- Linke Spalte: Visual & Vorschau -->
        <div
            class="w-full md:w-5/12 bg-slate-100 relative group overflow-hidden"
        >
            <!-- Der "Website Look" -->
            <img
                src={project.screenshotUrl ||
                    project.logoUrl ||
                    "/placeholder.svg"}
                alt="Vorschau {project.title}"
                class="w-full h-full object-cover"
            />
            <!-- Logo Overlay -->
            <div
                class="absolute top-4 left-4 bg-white/90 backdrop-blur p-2 rounded shadow-sm"
            >
                <div
                    class="w-12 h-12 flex items-center justify-center text-2xl font-bold"
                    style="color: {project.color}"
                >
                    {project.title.slice(0, 1)}
                </div>
            </div>
        </div>

        <!-- Rechte Spalte: Info & Content -->
        <div class="w-full md:w-7/12 p-6 flex flex-col justify-between">
            <div>
                <!-- Header -->
                <div class="flex justify-between items-start mb-2">
                    <span
                        class="text-xs font-bold uppercase tracking-wider text-blue-600"
                    >
                        {project.departments.join(", ")}
                    </span>
                    <button
                        onclick={close}
                        class="text-gray-400 hover:text-black transition-colors"
                        >✕</button
                    >
                </div>

                <h2 class="text-2xl font-bold mb-3 text-slate-800">
                    {project.title}
                </h2>
                <p class="text-slate-600 leading-relaxed mb-6">
                    {project.shortTeaser || "Keine Beschreibung verfügbar."}
                </p>

                <!-- Metadaten Grid -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <!-- Zielgruppe -->
                    {#if project.targetGroups.length > 0}
                        <div>
                            <h4 class="text-xs text-gray-400 uppercase mb-1">
                                Für Wen?
                            </h4>
                            <div class="flex flex-wrap gap-1">
                                {#each project.targetGroups as group}
                                    <span
                                        class="px-2 py-1 bg-gray-100 text-xs rounded-full"
                                        >{group}</span
                                    >
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Personen -->
                    {#if staffDetails.length > 0}
                        <div>
                            <h4 class="text-xs text-gray-400 uppercase mb-1">
                                Kontakt
                            </h4>
                            <div class="flex -space-x-2">
                                {#each staffDetails as person}
                                    <img
                                        src={person.avatarUrl}
                                        alt={person.name}
                                        title={person.name}
                                        class="w-8 h-8 rounded-full border-2 border-white ring-1 ring-gray-200"
                                    />
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Perspektiven Tags -->
                {#if project.perspectives.length > 0}
                    <div class="mb-4">
                        <h4 class="text-xs text-gray-400 uppercase mb-2">
                            Leitperspektiven
                        </h4>
                        <div class="flex flex-wrap gap-2">
                            {#each project.perspectives as persp}
                                <span
                                    class="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                                >
                                    {persp}
                                </span>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Footer Action Area -->
            <div class="space-y-4">
                <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block w-full text-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-200"
                >
                    Zur Projekt-Website reisen →
                </a>

                <!-- Ähnliche Projekte -->
                {#if relatedProjects.length > 0}
                    <div class="pt-4 border-t border-gray-100">
                        <span class="text-xs text-gray-400 block mb-2"
                            >Verwandte Themen entdecken:</span
                        >
                        <div class="flex gap-2 overflow-x-auto pb-2">
                            {#each relatedProjects as rel}
                                <button
                                    onclick={() => openRelated(rel.id)}
                                    class="flex-shrink-0 w-20 h-20 bg-gray-50 rounded hover:ring-2 ring-blue-500 overflow-hidden text-xs text-center p-2 transition-all"
                                >
                                    <div
                                        class="w-full h-10 flex items-center justify-center text-xl font-bold mb-1"
                                        style="color: {rel.color}"
                                    >
                                        {rel.title.slice(0, 1)}
                                    </div>
                                    <span class="line-clamp-2 leading-tight"
                                        >{rel.title}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </article>
{/if}
