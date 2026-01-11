// ============================================================================
// INIT.JS - Application Initialization
// ============================================================================

// Initialize application on window load
window.onload = () => { 
    // 1. SYNC CSS CLASSES IMMEDIATELY (Prevents Loading Flash)
    // Check the state of checkboxes and apply classes to body before rendering anything
    const globalHead = document.getElementById('globalHeadPiece');
    const globalSubs = document.getElementById('globalSubStats');
    const globalHypo = document.getElementById('globalHypothetical');

    if(globalHead && globalHead.checked) document.body.classList.add('show-head');
    if(globalSubs && globalSubs.checked) document.body.classList.add('show-subs');
    if(globalHypo && globalHypo.checked) document.body.classList.add('show-fixed-relics');

    // 2. Setup Guide Dropdowns
    populateGuideDropdowns(); 
    setGuideMode('current'); 

    // 3. Render Content
    renderPatchNotes(); 
    renderDatabase(); 
}