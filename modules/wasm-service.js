let wasmModule = null;
let isWasmReady = false;

// Initialize Wasm
export async function initWasm() {
    try {
        // Dynamic import to avoid crashing if file doesn't exist locally
        const module = await import('../wasm-calc/pkg/wasm_calc.js');
        await module.default(); // Initialize the Wasm memory
        wasmModule = module;
        isWasmReady = true;
        console.log("%c[System] Wasm Engine Loaded", "color: #4ade80; font-weight:bold;");
    } catch (e) {
        console.log("%c[System] Wasm Engine Missing - Using Legacy JS", "color: #fbbf24;");
        // Silent fail - we just stay in JS mode
    }
}

export function isReady() { 
    return isWasmReady; 
}

export function calculateBuildsWasm(unit, traits, builds, subs, heads, includeSubs) {
    if (!isWasmReady || !wasmModule) return null;

    try {
        // Rust expects JSON strings
        const unitJson = JSON.stringify(unit);
        const traitsJson = JSON.stringify(traits);
        const buildsJson = JSON.stringify(builds);
        const subsJson = JSON.stringify(subs);
        const headsJson = JSON.stringify(heads);

        const jsonResult = wasmModule.find_best_builds(
            unitJson, 
            traitsJson, 
            buildsJson, 
            subsJson, 
            headsJson, 
            includeSubs
        );

        return JSON.parse(jsonResult);
    } catch (e) {
        console.error("Wasm Calculation Error:", e);
        return null;
    }
}
