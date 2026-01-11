// ============================================================================
// INIT.JS - Application Initialization
// ============================================================================

// Initialize application on window load
window.onload = async () => { 
    // Attempt to load Wasm Service
    try {
        const WasmService = await import('./wasm-service.js');
        window.WasmService = WasmService;
        await WasmService.initWasm();
    } catch (e) {
        console.warn("WasmService failed to load (likely environment restrictions). Using JS Fallback.");
    }

    populateGuideDropdowns(); 
    setGuideMode('current'); 
    renderPatchNotes(); 
    renderDatabase(); 
}