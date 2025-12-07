<script lang="ts">
    import { performanceStore, type QualityLevel } from '$lib/logic/performanceStore.svelte';
    
    let isBenchmarking = $state(false);
    let benchmarkProgress = $state(0);
    let benchmarkFPSHistory: number[] = [];
    let showResult = $state(false);
    let hasStarted = $state(false);
    
    $effect(() => {
        if (performanceStore.needsAutoBenchmark && performanceStore.shadersReady && !hasStarted) {
            hasStarted = true;
            setTimeout(() => startBenchmark(), 1500);
        }
    });
    
    async function startBenchmark() {
        if (isBenchmarking) return;
        
        isBenchmarking = true;
        benchmarkProgress = 0;
        benchmarkFPSHistory = [];
        
        const duration = 3000;
        const startTime = performance.now();
        
        const collectFPS = () => {
            if (!isBenchmarking) return;
            
            const elapsed = performance.now() - startTime;
            benchmarkProgress = Math.min(100, (elapsed / duration) * 100);
            benchmarkFPSHistory.push(performanceStore.currentFPS);
            
            if (elapsed < duration) {
                requestAnimationFrame(collectFPS);
            } else {
                finishBenchmark();
            }
        };
        
        performanceStore.startBenchmark();
        await new Promise(r => setTimeout(r, 100));
        collectFPS();
    }
    
    function finishBenchmark() {
        isBenchmarking = false;
        benchmarkProgress = 100;
        performanceStore.stopBenchmark();
        
        if (benchmarkFPSHistory.length > 5) {
            const validFPS = benchmarkFPSHistory.slice(5);
            if (validFPS.length > 0) {
                const result = {
                    minFPS: Math.min(...validFPS),
                    avgFPS: Math.round(validFPS.reduce((a, b) => a + b, 0) / validFPS.length),
                    maxFPS: Math.max(...validFPS)
                };
                showResult = true;
                setTimeout(() => performanceStore.finishAutoBenchmark(result), 2000);
            }
        } else {
            performanceStore.skipAutoBenchmark();
        }
    }
    
    function skipBenchmark() {
        if (isBenchmarking) performanceStore.stopBenchmark();
        performanceStore.skipAutoBenchmark();
    }
    
    function getFPSColor(fps: number): string {
        if (fps >= 50) return '#4ade80';
        if (fps >= 30) return '#facc15';
        return '#ef4444';
    }
    
    function getQualityLabel(level: QualityLevel): string {
        switch (level) {
            case 'high': return '🔥 Beste Grafik';
            case 'medium': return '⚡ Ausgewogen';
            case 'low': return '🌿 Performance';
        }
    }
</script>

{#if performanceStore.needsAutoBenchmark}
<div class="overlay">
    <div class="dialog">
        <div class="header">
            <span class="icon">🚀</span>
            <h2>Performance-Erkennung</h2>
            <p>Wir ermitteln die optimalen Grafik-Einstellungen für Ihr Gerät</p>
        </div>
        
        {#if !showResult}
        <div class="content">
            {#if isBenchmarking}
                <div class="fps-display">{performanceStore.currentFPS} FPS</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {benchmarkProgress}%"></div>
                </div>
                <p class="hint">Kamera-Fahrt wird durchgeführt...</p>
            {:else}
                <div class="waiting">
                    <span class="pulse">⏳</span>
                    Warte auf Shader-Kompilierung...
                </div>
            {/if}
        </div>
        {:else if performanceStore.autoBenchmarkResult}
        <div class="content">
            <div class="results-grid">
                <div class="result-box">
                    <div class="label">Min</div>
                    <div class="value" style="color: {getFPSColor(performanceStore.autoBenchmarkResult.minFPS)}">
                        {performanceStore.autoBenchmarkResult.minFPS}
                    </div>
                </div>
                <div class="result-box main">
                    <div class="label">Durchschnitt</div>
                    <div class="value big" style="color: {getFPSColor(performanceStore.autoBenchmarkResult.avgFPS)}">
                        {performanceStore.autoBenchmarkResult.avgFPS}
                    </div>
                </div>
                <div class="result-box">
                    <div class="label">Max</div>
                    <div class="value" style="color: {getFPSColor(performanceStore.autoBenchmarkResult.maxFPS)}">
                        {performanceStore.autoBenchmarkResult.maxFPS}
                    </div>
                </div>
            </div>
            
            <div class="recommendation">
                <div class="rec-label">Optimale Einstellung</div>
                <div class="rec-value">{getQualityLabel(performanceStore.autoBenchmarkResult.recommended)}</div>
            </div>
        </div>
        {/if}
        
        <button class="skip-btn" onclick={skipBenchmark}>Überspringen</button>
    </div>
</div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
    }
    
    .dialog {
        width: 90vw;
        max-width: 400px;
        background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 1.5rem;
        text-align: center;
    }
    
    .header { margin-bottom: 1.5rem; }
    .header .icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    .header h2 { color: white; font-size: 1.25rem; margin: 0 0 0.5rem 0; }
    .header p { color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; margin: 0; }
    
    .content { margin-bottom: 1.5rem; }
    
    .fps-display {
        font-size: 2rem;
        color: #22d3ee;
        font-family: monospace;
        margin-bottom: 0.5rem;
    }
    
    .progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #60a5fa, #22d3ee);
        transition: width 0.1s;
    }
    
    .hint { color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; margin: 0; }
    
    .waiting {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: rgba(255, 255, 255, 0.6);
    }
    
    .pulse { animation: pulse 1.5s infinite; }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .result-box {
        background: rgba(0, 0, 0, 0.3);
        padding: 0.75rem;
        border-radius: 0.5rem;
    }
    
    .result-box .label { color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; }
    .result-box .value { font-weight: 600; font-family: monospace; }
    .result-box .value.big { font-size: 1.25rem; font-weight: 700; }
    
    .recommendation {
        background: rgba(96, 165, 250, 0.2);
        border: 1px solid rgba(96, 165, 250, 0.4);
        padding: 1rem;
        border-radius: 0.5rem;
    }
    
    .rec-label { color: rgba(255, 255, 255, 0.6); font-size: 0.75rem; margin-bottom: 0.25rem; }
    .rec-value { color: white; font-size: 1.125rem; font-weight: 600; }
    
    .skip-btn {
        padding: 0.5rem 1rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.6);
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
    }
    
    .skip-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
</style>
