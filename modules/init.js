// ============================================================================
// INIT.JS - Application Initialization
// ============================================================================

// Initialize application on window load
window.onload = () => { 
    populateGuideDropdowns(); 
    setGuideMode('current'); 
    renderPatchNotes(); 
    renderDatabase(); 
}
