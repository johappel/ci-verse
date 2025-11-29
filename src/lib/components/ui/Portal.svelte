<script lang="ts" module>
    /**
     * Portal Action - Verschiebt ein Element ins #portal-root
     */
    export function portal(node: HTMLElement) {
        const portalRoot = document.getElementById('portal-root') || document.body;
        
        // Verschiebe den Node ins Portal
        portalRoot.appendChild(node);
        
        return {
            destroy() {
                // Beim Cleanup: Node aus Portal entfernen
                if (node.parentNode === portalRoot) {
                    portalRoot.removeChild(node);
                }
            }
        };
    }
</script>

<script lang="ts">
    /**
     * Portal Component - Wrapper der portal action nutzt
     */
    interface Props {
        children?: import('svelte').Snippet;
    }
    
    let { children }: Props = $props();
</script>

<div use:portal style="display: contents;">
    {#if children}
        {@render children()}
    {/if}
</div>
