<script lang="ts">
    /**
     * PartnerDialog - Dialog für Partner-Einrichtungen (Nexus Terminal)
     * 
     * Zeigt Informationen über die Vernetzung mit Partner-Einrichtungen
     * bevor der externe Link geöffnet wird.
     */
    import { base } from '$app/paths';
    import { worldStore } from '$lib/logic/store.svelte';
    import GlassDialog from './GlassDialog.svelte';
    import { ExternalLink, Globe, Building2, Users, BookOpen, Landmark, GraduationCap, Network } from 'lucide-svelte';
    import type { PartnerCategory } from '$lib/types/project';

    // Reaktiv vom Store
    let isOpen = $derived(worldStore.state.isPartnerDialogOpen);
    let partner = $derived(worldStore.state.selectedPartner);

    function handleClose() {
        worldStore.closePartnerDialog();
    }

    function handleVisitWebsite() {
        if (partner?.url) {
            window.open(partner.url, '_blank');
        }
        handleClose();
    }

    // Kategorie-Icons und Labels
    function getCategoryInfo(category: PartnerCategory): { icon: typeof Globe; label: string; description: string } {
        switch (category) {
            case 'ministry':
                return { 
                    icon: Landmark, 
                    label: 'Ministerium',
                    description: 'Staatliche Bildungspolitik und Förderprogramme'
                };
            case 'church':
                return { 
                    icon: Building2, 
                    label: 'Kirche',
                    description: 'Kirchliche Strukturen und Entscheidungsträger'
                };
            case 'university':
                return { 
                    icon: GraduationCap, 
                    label: 'Hochschule',
                    description: 'Wissenschaftliche Forschung und Lehre'
                };
            case 'institute':
                return { 
                    icon: BookOpen, 
                    label: 'Institut',
                    description: 'Fachliche Expertise und Materialentwicklung'
                };
            case 'international':
                return { 
                    icon: Globe, 
                    label: 'International',
                    description: 'Europäische und internationale Zusammenarbeit'
                };
            case 'association':
                return { 
                    icon: Users, 
                    label: 'Verband',
                    description: 'Fachverbände und Netzwerke'
                };
            default:
                return { 
                    icon: Network, 
                    label: 'Partner',
                    description: 'Bildungspartner'
                };
        }
    }

    // Netzwerk-Statistik (aus dem Store)
    const networkStats = $derived({
        total: worldStore.partnerConnections.length,
        categories: {
            ministry: worldStore.partnerConnections.filter(p => p.category === 'ministry').length,
            church: worldStore.partnerConnections.filter(p => p.category === 'church').length,
            university: worldStore.partnerConnections.filter(p => p.category === 'university').length,
            institute: worldStore.partnerConnections.filter(p => p.category === 'institute').length,
            international: worldStore.partnerConnections.filter(p => p.category === 'international').length,
            association: worldStore.partnerConnections.filter(p => p.category === 'association').length
        }
    });
</script>

<GlassDialog 
    {isOpen} 
    onClose={handleClose}
    title={partner?.name || 'Partner-Einrichtung'}
    subtitle="Bildungsnetzwerk"
    icon={Network}
    width="520px"
    height="auto"
>
    {#if partner}
        {@const categoryInfo = getCategoryInfo(partner.category)}
        
        <div style="
            padding: 1.5rem;
            color: white;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        ">
            <!-- Header mit Logo und Kategorie -->
            <div style="
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            ">
                <!-- Partner-Logo -->
                <div style="
                    width: 80px;
                    height: 80px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                ">
                    {#if partner.logoUrl}
                        <img 
                            src={partner.logoUrl?.startsWith('/') ? base + partner.logoUrl : partner.logoUrl} 
                            alt={partner.name}
                            style="
                                max-width: 70px;
                                max-height: 70px;
                                object-fit: contain;
                            "
                        />
                    {:else}
                        {#if partner.category === 'ministry'}
                            <Landmark size={40} color={partner.color} />
                        {:else if partner.category === 'church'}
                            <Building2 size={40} color={partner.color} />
                        {:else if partner.category === 'university'}
                            <GraduationCap size={40} color={partner.color} />
                        {:else if partner.category === 'institute'}
                            <BookOpen size={40} color={partner.color} />
                        {:else if partner.category === 'international'}
                            <Globe size={40} color={partner.color} />
                        {:else if partner.category === 'association'}
                            <Users size={40} color={partner.color} />
                        {:else}
                            <Network size={40} color={partner.color} />
                        {/if}
                    {/if}
                </div>

                <!-- Kategorie-Badge -->
                <div style="flex: 1;">
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 4px 10px;
                        border-radius: 20px;
                        background: {partner.color}22;
                        border: 1px solid {partner.color}44;
                        margin-bottom: 8px;
                    ">
                        {#if partner.category === 'ministry'}
                            <Landmark size={14} color={partner.color} />
                        {:else if partner.category === 'church'}
                            <Building2 size={14} color={partner.color} />
                        {:else if partner.category === 'university'}
                            <GraduationCap size={14} color={partner.color} />
                        {:else if partner.category === 'institute'}
                            <BookOpen size={14} color={partner.color} />
                        {:else if partner.category === 'international'}
                            <Globe size={14} color={partner.color} />
                        {:else if partner.category === 'association'}
                            <Users size={14} color={partner.color} />
                        {:else}
                            <Network size={14} color={partner.color} />
                        {/if}
                        <span style="font-size: 12px; color: {partner.color}; font-weight: 500;">
                            {categoryInfo.label}
                        </span>
                    </div>
                    <p style="
                        font-size: 14px;
                        color: rgba(255, 255, 255, 0.7);
                        margin: 0;
                        line-height: 1.5;
                    ">
                        {categoryInfo.description}
                    </p>
                </div>
            </div>

            <!-- Vernetzungs-Beschreibung -->
            <div style="
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 1rem;
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #60a5fa;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <Network size={16} />
                    Warum diese Verbindung?
                </h4>
                <p style="
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.85);
                ">
                    Das Comenius-Institut arbeitet als Evangelische Arbeitsstätte für Erziehungswissenschaft 
                    eng mit verschiedenen Bildungsakteuren zusammen. Unsere Vernetzung mit 
                    <strong style="color: white;">{partner.shortName}</strong> ermöglicht:
                </p>
                <ul style="
                    margin: 12px 0 0 0;
                    padding-left: 20px;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.75);
                    line-height: 1.8;
                ">
                    {#if partner.category === 'ministry'}
                        <li>Mitgestaltung bildungspolitischer Diskurse</li>
                        <li>Zugang zu Förderprogrammen und Ressourcen</li>
                        <li>Evidenzbasierte Politikberatung</li>
                    {:else if partner.category === 'church'}
                        <li>Abstimmung kirchlicher Bildungsstrategien</li>
                        <li>Gemeinsame Materialentwicklung</li>
                        <li>Synodiale Berichterstattung</li>
                    {:else if partner.category === 'university'}
                        <li>Wissenschaftliche Kooperationsprojekte</li>
                        <li>Forschungstransfer in die Praxis</li>
                        <li>Nachwuchsförderung</li>
                    {:else if partner.category === 'institute'}
                        <li>Fachlicher Austausch und Best Practices</li>
                        <li>Gemeinsame Fortbildungsangebote</li>
                        <li>Koordinierte Projektarbeit</li>
                    {:else if partner.category === 'international'}
                        <li>Europäische Bildungsprojekte (Erasmus+)</li>
                        <li>Internationaler Wissenstransfer</li>
                        <li>Interkulturelle Perspektiven</li>
                    {:else if partner.category === 'association'}
                        <li>Multiplikation von Bildungskonzepten</li>
                        <li>Interessenvertretung</li>
                        <li>Netzwerkveranstaltungen</li>
                    {:else}
                        <li>Wissensaustausch und Kooperation</li>
                        <li>Gemeinsame Projekte</li>
                    {/if}
                </ul>
            </div>

            <!-- Netzwerk-Überblick -->
            <div style="
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            ">
                <span style="
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    padding: 4px 0;
                ">
                    Wir sind in vielfältig vernetzt. An dieser Station sind nur einige Partner exemplarisch in der Liste der Verbindungen zu unterschiedlichen Bildungskontexten:
                </span>
                {#each Object.entries(networkStats.categories) as [cat, count]}
                    {#if count > 0}
                        {@const info = getCategoryInfo(cat as PartnerCategory)}
                        <span style="
                            font-size: 11px;
                            padding: 2px 8px;
                            border-radius: 10px;
                            background: rgba(255, 255, 255, 0.05);
                            color: rgba(255, 255, 255, 0.6);
                        ">
                            {count}× {info.label}
                        </span>
                        
                    {/if}
                {/each}
                <span style="font-size: 12px;">{networkStats.total} Verbindungen</span>
            </div>

            <!-- Action Buttons -->
            <div style="
                display: flex;
                gap: 12px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <button
                    onclick={handleClose}
                    style="
                        flex: 1;
                        padding: 12px 16px;
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        background: rgba(255, 255, 255, 0.05);
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    "
                    onmouseenter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onmouseleave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    Schließen
                </button>
                <button
                    onclick={handleVisitWebsite}
                    style="
                        flex: 2;
                        padding: 12px 16px;
                        border-radius: 8px;
                        border: none;
                        background: {partner.color};
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        transition: all 0.2s;
                        box-shadow: 0 4px 12px {partner.color}44;
                    "
                    onmouseenter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onmouseleave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <ExternalLink size={16} />
                    Website besuchen
                </button>
            </div>
        </div>
    {/if}
</GlassDialog>
