<script lang="ts">
    import { worldStore } from "$lib/logic/store.svelte";
    import { mockStaff } from "$lib/data/mockProjects";
    import GlassDialog from "./GlassDialog.svelte";
    import { FileText } from "lucide-svelte";

    // Hole das aktuell aktive Projekt aus dem Store
    let project = $derived(
        worldStore.state.selectedId
            ? worldStore.state.projects.find(
                  (p) => p.id === worldStore.state.selectedId,
              )
            : null,
    );

    // Display-Daten
    let displayData = $derived(project?.display);
    let screenshotUrl = $derived(displayData?.screenshotUrl);
    let posterImage = $derived(displayData?.posterImage);
    let logoUrl = $derived(displayData?.logoUrl);
    let projectColor = $derived(displayData?.color || project?.color || '#3b82f6');
    let slogan = $derived(displayData?.slogan);

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

    function openExternalUrl() {
        if (project?.externalUrl) {
            window.open(project.externalUrl, '_blank');
        }
    }
</script>

<GlassDialog
    isOpen={!!project}
    onClose={close}
    title={project?.title || ''}
    subtitle={project?.departments.join(' · ') || ''}
    icon={FileText}
    width="900px"
    height="auto"
>
    {#if project}
    <div class="overflow-y-auto max-h-[70vh]">
        <div class="flex flex-col md:flex-row">
            
            <!-- Linke Spalte: Screenshot & Slogan -->
            <div class="w-full md:w-1/2 p-6">
                <!-- Screenshot (Website-Vorschau) -->
                {#if screenshotUrl}
                    <div class="relative rounded-xl overflow-hidden border border-white/10 shadow-lg mb-4">
                        <!-- Browser-Mockup Header -->
                        <div class="bg-slate-800/80 px-3 py-2 flex items-center gap-2">
                            <div class="flex gap-1.5">
                                <div class="w-3 h-3 rounded-full bg-red-500/60"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                                <div class="w-3 h-3 rounded-full bg-green-500/60"></div>
                            </div>
                            <div class="flex-1 bg-slate-700/50 rounded px-3 py-1 text-xs text-slate-400 truncate">
                                {project.externalUrl || 'Website'}
                            </div>
                        </div>
                        <!-- Screenshot Image -->
                        <img
                            src={screenshotUrl}
                            alt="Website-Vorschau {project.title}"
                            class="w-full aspect-video object-cover"
                        />
                    </div>
                {/if}

                <!-- Slogan -->
                {#if slogan}
                    <p class="text-lg italic text-slate-300 mb-4" style="color: {projectColor};">
                        „{slogan}"
                    </p>
                {/if}

                <!-- Externe URL Button -->
                {#if project.externalUrl}
                    <button
                        onclick={openExternalUrl}
                        class="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2 border"
                        style="background: linear-gradient(135deg, {projectColor}80, {projectColor}40); border-color: {projectColor}60;"
                    >
                        <span>Zur Projekt-Website</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                {/if}
            </div>

            <!-- Rechte Spalte: Info & Details -->
            <div class="w-full md:w-1/2 p-6 border-t md:border-t-0 md:border-l border-white/10">
                <!-- Beschreibung -->
                <div class="mb-6">
                    <h3 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Über das Projekt</h3>
                    <p class="text-slate-200 leading-relaxed">
                        {project.shortTeaser || "Keine Beschreibung verfügbar."}
                    </p>
                </div>

                <!-- Metadaten Grid -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <!-- Zielgruppe -->
                    {#if project.targetGroups.length > 0}
                        <div>
                            <h4 class="text-xs text-slate-500 uppercase mb-2">Zielgruppe</h4>
                            <div class="flex flex-wrap gap-1">
                                {#each project.targetGroups as group}
                                    <span class="px-2 py-1 bg-slate-800/50 text-slate-300 text-xs rounded-full border border-white/10">
                                        {group}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Perspektiven Tags -->
                    {#if project.perspectives.length > 0}
                        <div>
                            <h4 class="text-xs text-slate-500 uppercase mb-2">Leitperspektiven</h4>
                            <div class="flex flex-wrap gap-1">
                                {#each project.perspectives as persp}
                                    <span 
                                        class="px-2 py-1 text-xs rounded-full border"
                                        style="background: {projectColor}20; color: {projectColor}; border-color: {projectColor}40;"
                                    >
                                        {persp}
                                    </span>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Kontakt/Staff -->
                {#if staffDetails.length > 0}
                    <div class="mb-6">
                        <h4 class="text-xs text-slate-500 uppercase mb-2">Ansprechpartner</h4>
                        <div class="flex flex-wrap gap-3">
                            {#each staffDetails as person}
                                <div class="flex items-center gap-2 bg-slate-800/30 rounded-full pr-3 border border-white/10">
                                    <img
                                        src={person.avatarUrl}
                                        alt={person.name}
                                        class="w-8 h-8 rounded-full border-2 border-white/10"
                                    />
                                    <div class="text-sm">
                                        <span class="text-slate-200">{person.name}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Ähnliche Projekte -->
                {#if relatedProjects.length > 0}
                    <div class="pt-4 border-t border-white/10">
                        <h4 class="text-xs text-slate-500 uppercase mb-3">Verwandte Projekte</h4>
                        <div class="flex gap-2">
                            {#each relatedProjects as rel}
                                <button
                                    onclick={() => openRelated(rel.id)}
                                    class="flex-1 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/40 transition-colors text-left group border border-white/10"
                                >
                                    <div 
                                        class="text-lg font-bold mb-1 group-hover:scale-110 transition-transform inline-block"
                                        style="color: {rel.display?.color || rel.color || '#3b82f6'};"
                                    >
                                        {rel.title.slice(0, 1)}
                                    </div>
                                    <div class="text-xs text-slate-400 line-clamp-2">{rel.title}</div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    {/if}
</GlassDialog>
