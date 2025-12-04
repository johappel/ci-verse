<script lang="ts">
    import { base } from '$app/paths';
    import { worldStore } from "$lib/logic/store.svelte";
    import { mockStaff } from "$lib/data/mockProjects";
    import GlassDialog from "./GlassDialog.svelte";
    import { FileText, ExternalLink, Users, Target, Compass } from "lucide-svelte";

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
    let screenshotUrl = $derived(displayData?.screenshotUrl?.startsWith('/') ? base + displayData.screenshotUrl : displayData?.screenshotUrl);
    let projectColor = $derived(displayData?.color || project?.color || '#3b82f6');
    let slogan = $derived(displayData?.slogan);

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
    width="700px"
    height="auto"
>
    {#if project}
    <div style="overflow-y: auto; max-height: 70vh; padding: 20px;">
        
        <!-- Hero-Bereich: Text links, Screenshot rechts -->
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            
            <!-- Linke Seite: Slogan, Beschreibung, Button -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                {#if slogan}
                    <p style="font-size: 15px; font-style: italic; color: {projectColor}; margin: 0 0 12px 0; line-height: 1.4;">
                        „{slogan}"
                    </p>
                {/if}
                
                <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; flex: 1;">
                    {project.shortTeaser || "Keine Beschreibung verfügbar."}
                </p>

                {#if project.externalUrl}
                    <button
                        onclick={openExternalUrl}
                        style="
                            padding: 10px 18px;
                            border-radius: 8px;
                            font-weight: 500;
                            color: white;
                            font-size: 13px;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            border: 1px solid {projectColor}60;
                            background: linear-gradient(135deg, {projectColor}90, {projectColor}50);
                            cursor: pointer;
                            width: fit-content;
                            transition: transform 0.15s, box-shadow 0.15s;
                        "
                        onmouseenter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onmouseleave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <ExternalLink size={15} />
                        <span>Zur Website</span>
                    </button>
                {/if}
            </div>

            <!-- Rechte Seite: Screenshot -->
            {#if screenshotUrl}
                <div style="width: 200px; flex-shrink: 0;">
                    <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        <!-- Mini Browser-Header -->
                        <div style="background: rgba(30,41,59,0.9); padding: 6px 8px; display: flex; align-items: center; gap: 6px;">
                            <div style="display: flex; gap: 4px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(239,68,68,0.6);"></div>
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(234,179,8,0.6);"></div>
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(34,197,94,0.6);"></div>
                            </div>
                            <div style="flex: 1; background: rgba(51,65,85,0.5); border-radius: 3px; padding: 2px 6px; font-size: 9px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                {project.externalUrl || 'Website'}
                            </div>
                        </div>
                        <img
                            src={screenshotUrl}
                            alt="Vorschau {project.title}"
                            style="width: 100%; aspect-ratio: 4/3; object-fit: cover; object-position: top; display: block;"
                        />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Metadaten-Bereich -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);">
            
            <!-- Zielgruppe -->
            {#if project.targetGroups.length > 0}
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div style="padding: 6px; border-radius: 6px; background: rgba(30,41,59,0.5); color: {projectColor};">
                        <Target size={14} />
                    </div>
                    <div>
                        <h4 style="font-size: 10px; color: #64748b; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px;">Zielgruppe</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            {#each project.targetGroups as group}
                                <span style="padding: 3px 8px; background: rgba(30,41,59,0.5); color: #cbd5e1; font-size: 11px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                                    {group}
                                </span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Perspektiven -->
            {#if project.perspectives.length > 0}
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div style="padding: 6px; border-radius: 6px; background: rgba(30,41,59,0.5); color: {projectColor};">
                        <Compass size={14} />
                    </div>
                    <div>
                        <h4 style="font-size: 10px; color: #64748b; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px;">Perspektiven</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            {#each project.perspectives as persp}
                                <span style="padding: 3px 8px; font-size: 11px; border-radius: 4px; background: {projectColor}15; color: {projectColor}; border: 1px solid {projectColor}30;">
                                    {persp}
                                </span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Ansprechpartner -->
        {#if staffDetails.length > 0}
            <div style="padding-top: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <Users size={14} style="color: #64748b;" />
                    <h4 style="font-size: 10px; color: #64748b; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">Ansprechpartner</h4>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    {#each staffDetails as person}
                        <div style="display: flex; align-items: center; gap: 8px; background: rgba(30,41,59,0.3); border-radius: 20px; padding: 3px 12px 3px 3px; border: 1px solid rgba(255,255,255,0.05);">
                            <img
                                src={person.avatarUrl}
                                alt={person.name}
                                style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); object-fit: cover;"
                            />
                            <span style="font-size: 12px; color: #cbd5e1;">{person.name}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
    {/if}
</GlassDialog>
