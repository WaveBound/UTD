// ============================================================================
// INIT.JS - Application Initialization
// ============================================================================

window.onload = () => { 
    // 1. SYNC CSS CLASSES IMMEDIATELY
    // Check state of checkboxes and apply classes to body before rendering
    const globalHead = document.getElementById('globalHeadPiece');
    const globalSubs = document.getElementById('globalSubStats');
    const globalHypo = document.getElementById('globalHypothetical');

    if(globalHead && globalHead.checked) document.body.classList.add('show-head');
    if(globalSubs && globalSubs.checked) document.body.classList.add('show-subs');
    if(globalHypo && globalHypo.checked) document.body.classList.add('show-fixed-relics');

    // 2. Setup Guide Dropdowns
    if(typeof populateGuideDropdowns === 'function') {
        populateGuideDropdowns(); 
    }
    
    setGuideMode('current'); 

    // 3. Render Content
    if(typeof renderCredits === 'function') {
        renderCredits();
    }
    
    // 4. Initialize Database
    renderDatabase(); 
    
    // 5. Initialize Inventory
    if (typeof initInventory === 'function') {
        initInventory();
    }
}