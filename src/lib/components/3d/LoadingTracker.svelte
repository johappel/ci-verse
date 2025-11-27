<script lang="ts">
	import { useProgress } from '@threlte/extras';
	
	// useProgress muss innerhalb Canvas-Kontext sein
	const { active, item, loaded, total, progress, finishedOnce } = useProgress();
	
	// Exportiere die Werte als Props für Parent-Komponente
	let { onProgress }: { onProgress?: (data: { 
		active: boolean; 
		progress: number; 
		loaded: number; 
		total: number;
		item: string | undefined;
		finishedOnce: boolean;
	}) => void } = $props();
	
	// Sende Updates an Parent
	$effect(() => {
		onProgress?.({
			active: $active,
			progress: $progress,
			loaded: $loaded,
			total: $total,
			item: $item,
			finishedOnce: $finishedOnce
		});
	});
</script>

<!-- Invisible component - just tracks loading -->
