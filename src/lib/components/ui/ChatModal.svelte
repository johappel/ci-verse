<script lang="ts">
    /**
     * ChatModal - KI-Chat Dialog für das Comenius-Institut
     * 
     * Aktuell: Mock-Daten mit simulierten Antworten
     * Später: n8n-Webhook Integration (chatWebhook aus MarketplaceStand)
     */
    import { worldStore } from "$lib/logic/store.svelte";
    import { Send, Bot, User, Loader2 } from "lucide-svelte";
    import GlassDialog from "./GlassDialog.svelte";

    interface Props {
        isOpen?: boolean;
        onClose?: () => void;
        webhookUrl?: string;
    }

    let { 
        isOpen = undefined,
        onClose = undefined,
        webhookUrl = undefined
    }: Props = $props();

    // Verwende Props falls vorhanden, sonst Store
    let isModalOpen = $derived(isOpen !== undefined ? isOpen : worldStore.state.isChatOpen);

    function handleClose() {
        if (onClose) {
            onClose();
        } else {
            worldStore.closeChat();
        }
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

        // TODO: Später durch n8n-Webhook ersetzen
        // const webhook = 'https://n8n.comenius.de/webhook/ci-chat';
        // const response = await fetch(webhook, { method: 'POST', body: JSON.stringify({ message: query }) });
        
        // Mock: Simulierte Verzögerung
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

        const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: getResponse(query),
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
    <div class="flex flex-col h-full">
        <!-- Messages -->
        <div 
            bind:this={messagesContainer}
            class="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {#each messages as message (message.id)}
                <div 
                    class="flex gap-3"
                    class:flex-row-reverse={message.role === 'user'}
                >
                    <!-- Avatar -->
                    <div 
                        class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center {message.role === 'assistant' ? 'bg-cyan-600/50' : 'bg-slate-600/50'}"
                        style="border: 1px solid rgba(255,255,255,0.1);"
                    >
                        {#if message.role === 'assistant'}
                            <Bot class="w-5 h-5 text-cyan-300" />
                        {:else}
                            <User class="w-5 h-5 text-white" />
                        {/if}
                    </div>

                    <!-- Message Bubble -->
                    <div 
                        class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed {message.role === 'assistant' ? 'bg-cyan-900/40 text-white rounded-bl-sm' : 'bg-slate-700/50 text-slate-100 rounded-br-sm'}"
                        style="border: 1px solid rgba(255,255,255,0.08);"
                    >
                        <!-- Render Markdown-like formatting -->
                        {@html message.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
                            .replace(/\n/g, '<br>')
                        }
                    </div>
                </div>
            {/each}

            <!-- Loading Indicator -->
            {#if isLoading}
                <div class="flex gap-3">
                    <div class="w-8 h-8 rounded-full bg-cyan-600/50 flex items-center justify-center" style="border: 1px solid rgba(255,255,255,0.1);">
                        <Bot class="w-5 h-5 text-cyan-300" />
                    </div>
                    <div class="bg-cyan-900/40 rounded-2xl rounded-bl-sm px-4 py-3" style="border: 1px solid rgba(255,255,255,0.08);">
                        <Loader2 class="w-5 h-5 text-cyan-300 animate-spin" />
                    </div>
                </div>
            {/if}
        </div>

        <!-- Input -->
        <div class="p-4 border-t border-white/10">
            <div class="flex gap-2">
                <input
                    type="text"
                    bind:value={inputValue}
                    onkeydown={handleKeydown}
                    placeholder="Ihre Frage..."
                    class="flex-1 bg-slate-800/50 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-white/10"
                    disabled={isLoading}
                />
                <button
                    onclick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    class="px-4 py-3 bg-cyan-600/50 hover:bg-cyan-500/50 disabled:bg-slate-600/30 disabled:cursor-not-allowed text-white rounded-xl transition-colors border border-cyan-400/30"
                    aria-label="Nachricht senden"
                >
                    <Send class="w-5 h-5" />
                </button>
            </div>
            <p class="text-xs text-slate-500 mt-2 text-center">
                Demo-Modus • Später mit n8n-KI verbunden
            </p>
        </div>
    </div>
</GlassDialog>
