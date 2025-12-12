<script lang="ts">
    /**
     * ChatModal - KI-Chat Dialog für das Comenius-Institut
     * 
     * Sendet Nachrichten an n8n-Webhook und empfängt KI-Antworten.
     * Fallback auf Mock-Daten wenn kein Webhook konfiguriert.
     */
    import { worldStore } from "$lib/logic/store.svelte";
    import { Send, Bot, User, Loader2 } from "lucide-svelte";
    import GlassDialog from "./GlassDialog.svelte";

    // Direkt vom Store - reaktiv durch $derived
    let isModalOpen = $derived(worldStore.state.isChatOpen);
    
    // chatWebhook URL aus dem Store (vom Institution-Stand)
    let chatWebhook = $derived(worldStore.state.chatWebhook);
    
    // Debug: Beobachte Änderungen
    $effect(() => {
        console.log('ChatModal: isModalOpen changed to', isModalOpen);
    });

    function handleClose() {
        console.log('ChatModal handleClose called');
        console.trace('Close called from:');
        worldStore.closeChat();
    }

    interface ChatMessage {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }

    // Chat-State
    let messages = $state<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Willkommen beim Comenius-Institut! 👋\n\nIch bin Ihr digitaler Assistent und helfe Ihnen gerne bei Fragen zu unseren Projekten, Angeboten und der religiösen Bildung.\n\nWie kann ich Ihnen heute helfen?',
            timestamp: new Date()
        }
    ]);
    let inputValue = $state('');
    let isLoading = $state(false);
    let messagesContainer = $state<HTMLDivElement | null>(null);

    // Mock-Antworten für Demo
    const mockResponses: Record<string, string> = {
        'projekt': 'Wir haben über 15 aktive Projekte in verschiedenen Bildungsbereichen:\n\n🎓 **Frühkindliche Bildung** (B1): Religionspädagogik in der Kita, Godly Play\n📚 **Schule & Jugend** (B2): Konfi-App, Schulseelsorge\n👥 **Erwachsenenbildung** (B3): Ehrenamtsakademie, Seniorenbildung\n\nWelcher Bereich interessiert Sie besonders?',
        'kita': 'Im Bereich **Frühkindliche Bildung** bieten wir:\n\n• **Religionspädagogik in der Kita** - Spielerische religiöse Bildung\n• **Godly Play** - Biblische Geschichten entdecken\n• **Kita-Qualitätsentwicklung** - Systematische QE\n\nMöchten Sie mehr über ein bestimmtes Projekt erfahren?',
        'digital': 'Unsere **Digitalisierungsprojekte** umfassen:\n\n💻 **Konfi-App** - Digitale Konfirmandenarbeit\n🤖 **KI-Werkstatt** - KI-Tools in der Bildung\n🔒 **Datenschutz-Helpdesk** - DSGVO-Beratung\n📱 **Digitales Gemeindemanagement** - efabi.net\n\nDigitale Bildung ist einer unserer Schwerpunkte!',
        'kontakt': 'Sie erreichen uns unter:\n\n📧 **E-Mail**: info@comenius.de\n📞 **Telefon**: +49 251 98101-0\n📍 **Adresse**: Schreiberstraße 12, 48149 Münster\n\nOder besuchen Sie unsere Website: comenius.de',
        'default': 'Das ist eine interessante Frage! Als KI-Assistent des Comenius-Instituts kann ich Ihnen bei Fragen zu religiöser Bildung, unseren Projekten und Angeboten helfen.\n\nProbieren Sie Fragen wie:\n• "Welche Projekte gibt es?"\n• "Was bietet ihr für Kitas?"\n• "Erzähl mir über eure Digitalangebote"\n• "Wie kann ich euch kontaktieren?"'
    };

    function getResponse(input: string): string {
        const lower = input.toLowerCase();
        if (lower.includes('projekt') || lower.includes('angebot')) return mockResponses.projekt;
        if (lower.includes('kita') || lower.includes('kind') || lower.includes('früh')) return mockResponses.kita;
        if (lower.includes('digital') || lower.includes('ki') || lower.includes('app')) return mockResponses.digital;
        if (lower.includes('kontakt') || lower.includes('adresse') || lower.includes('mail')) return mockResponses.kontakt;
        return mockResponses.default;
    }

    async function sendMessage() {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date()
        };

        messages = [...messages, userMessage];
        const query = inputValue;
        inputValue = '';
        isLoading = true;

        // Scroll to bottom
        setTimeout(() => {
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
        }, 50);

        let responseContent: string;

        if (chatWebhook) {
            // n8n-Webhook über WordPress-Proxy (umgeht CORS)
            try {
                const wpUrl = import.meta.env.VITE_WP_URL || window.location.origin;
                const proxyUrl = `${wpUrl}/wp-json/civerse/v1/chat-proxy?webhook=${encodeURIComponent(chatWebhook)}&q=${encodeURIComponent(query)}`;
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Antwort ist HTML - direkt übernehmen
                    responseContent = data.response || data.message || data.text || 'Keine Antwort erhalten.';
                } else {
                    responseContent = 'Entschuldigung, es gab ein Problem mit der Verbindung. Bitte versuchen Sie es später erneut.';
                }
            } catch (error) {
                console.error('Chat webhook error:', error);
                responseContent = 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.';
            }
        } else {
            // Fallback: Mock-Antworten
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
            responseContent = getResponse(query);
        }

        const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
        };

        messages = [...messages, assistantMessage];
        isLoading = false;

        // Scroll to bottom
        setTimeout(() => {
            messagesContainer?.scrollTo({ top: messagesContainer.scrollHeight, behavior: 'smooth' });
        }, 50);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
</script>

<GlassDialog 
    isOpen={isModalOpen} 
    onClose={handleClose}
    title="Comenius Assistent"
    subtitle="KI-gestützte Auskunft"
    icon={Bot}
    width="450px"
    height="600px"
>
    <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Messages -->
        <div 
            bind:this={messagesContainer}
            style="flex: 1; overflow-y: auto; padding: 1rem;"
        >
            {#each messages as message (message.id)}
                <div 
                    style="
                        display: flex;
                        gap: 0.75rem;
                        margin-bottom: 1rem;
                        flex-direction: {message.role === 'user' ? 'row-reverse' : 'row'};
                    "
                >
                    <!-- Avatar -->
                    <div style="
                        width: 2rem;
                        height: 2rem;
                        border-radius: 9999px;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: {message.role === 'assistant' ? 'rgba(8, 145, 178, 0.5)' : 'rgba(71, 85, 105, 0.5)'};
                        border: 1px solid rgba(255,255,255,0.1);
                    ">
                        {#if message.role === 'assistant'}
                            <Bot style="width: 1.25rem; height: 1.25rem; color: #67e8f9;" />
                        {:else}
                            <User style="width: 1.25rem; height: 1.25rem; color: white;" />
                        {/if}
                    </div>

                    <!-- Message Bubble -->
                    <div style="
                        max-width: 80%;
                        border-radius: 1rem;
                        padding: 0.625rem 1rem;
                        font-size: 0.875rem;
                        line-height: 1.625;
                        background: {message.role === 'assistant' ? 'rgba(22, 78, 99, 0.4)' : 'rgba(51, 65, 85, 0.5)'};
                        color: {message.role === 'assistant' ? 'white' : '#f1f5f9'};
                        border: 1px solid rgba(255,255,255,0.08);
                        border-bottom-left-radius: {message.role === 'assistant' ? '0.125rem' : '1rem'};
                        border-bottom-right-radius: {message.role === 'user' ? '0.125rem' : '1rem'};
                    ">
                        <!-- Render Markdown-like formatting -->
                        {@html message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #67e8f9;">$1</strong>')
                            .replace(/\n/g, '<br>')
                        }
                    </div>
                </div>
            {/each}

            <!-- Loading Indicator -->
            {#if isLoading}
                <div style="display: flex; gap: 0.75rem;">
                    <div style="
                        width: 2rem;
                        height: 2rem;
                        border-radius: 9999px;
                        background: rgba(8, 145, 178, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid rgba(255,255,255,0.1);
                    ">
                        <Bot style="width: 1.25rem; height: 1.25rem; color: #67e8f9;" />
                    </div>
                    <div style="
                        background: rgba(22, 78, 99, 0.4);
                        border-radius: 1rem;
                        border-bottom-left-radius: 0.125rem;
                        padding: 0.75rem 1rem;
                        border: 1px solid rgba(255,255,255,0.08);
                    ">
                        <Loader2 style="width: 1.25rem; height: 1.25rem; color: #67e8f9; animation: spin 1s linear infinite;" />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Input -->
        <div style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; gap: 0.5rem;">
                <input
                    type="text"
                    bind:value={inputValue}
                    onkeydown={handleKeydown}
                    placeholder="Ihre Frage..."
                    disabled={isLoading}
                    style="
                        flex: 1;
                        background: rgba(30, 41, 59, 0.5);
                        color: white;
                        border-radius: 0.75rem;
                        padding: 0.75rem 1rem;
                        font-size: 0.875rem;
                        border: 1px solid rgba(255,255,255,0.1);
                        outline: none;
                    "
                />
                <button
                    onclick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    style="
                        padding: 0.75rem 1rem;
                        background: {!inputValue.trim() || isLoading ? 'rgba(71, 85, 105, 0.3)' : 'rgba(8, 145, 178, 0.5)'};
                        color: white;
                        border-radius: 0.75rem;
                        border: 1px solid rgba(34, 211, 238, 0.3);
                        cursor: {!inputValue.trim() || isLoading ? 'not-allowed' : 'pointer'};
                        transition: background-color 0.15s;
                    "
                    aria-label="Nachricht senden"
                >
                    <Send style="width: 1.25rem; height: 1.25rem;" />
                </button>
            </div>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; text-align: center;">
                {chatWebhook ? '🟢 KI-Assistent aktiv' : '🟡 Demo-Modus'}
            </p>
        </div>
    </div>
</GlassDialog>
