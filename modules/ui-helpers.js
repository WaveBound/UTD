// ============================================================================
// UI-HELPERS.JS - UI Interaction & Toggle Functions
// ============================================================================

// Reset and trigger database re-render
const resetAndRender = () => { 
    renderQueueIndex = 0; 
    renderDatabase(); 
};

// Generic checkbox toggle with callback
function toggleCheckbox(checkbox, callback, isHypothetical = false) {
    checkbox.parentNode.classList.toggle('is-checked', checkbox.checked);
    if (isHypothetical) setGuideMode(checkbox.checked ? 'fixed' : 'current');
    else callback();
}

// Toggle sub-stats checkbox
const toggleSubStats = (cb) => toggleCheckbox(cb, resetAndRender);

// Toggle head piece checkbox
const toggleHeadPiece = (cb) => toggleCheckbox(cb, resetAndRender);

// Toggle hypothetical/bugged relics checkbox
const toggleHypothetical = (cb) => toggleCheckbox(cb, null, true);

// Toggle guide sub-stats
const toggleGuideSubStats = (cb) => toggleCheckbox(cb, renderGuides);

// Toggle guide head piece
const toggleGuideHeadPiece = (cb) => toggleCheckbox(cb, renderGuides);

// Toggle Kirito mode (Realm/Card)
function toggleKiritoMode(mode, checkbox) {
    if (mode === 'realm') {
        kiritoState.realm = checkbox.checked;
        if (!checkbox.checked) kiritoState.card = false; 
    } else if (mode === 'card') {
        kiritoState.card = checkbox.checked;
    }
    
    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    } else {
        resetAndRender();
    }
}

// Calculate Helpers
const getFilteredBuilds = () => globalBuilds.filter(b => {
    if (currentGuideMode === 'current' && (!statConfig.applyRelicCrit && (b.cf > 0 || b.cm > 0)) || (!statConfig.applyRelicDot && b.dot > 0)) return false;
    if (!statConfig.applyRelicDmg && b.dmg > 10 || !statConfig.applyRelicSpa && b.spa > 10) return false;
    return true;
});

const getValidSubCandidates = () => SUB_CANDIDATES.filter(c => 
    !((!statConfig.applyRelicCrit && (c === 'cm' || c === 'cf')) || (!statConfig.applyRelicDot && c === 'dot'))
);

// Set Bambietta Element
function setBambiettaElement(element, selectEl) {
    bambiettaState.element = element;
    resetAndRender();
}

// Toggle unit selection
function toggleSelection(id) {
    const card = document.getElementById('card-' + id);
    const btn = card.querySelector('.select-btn');
    if (selectedUnitIds.has(id)) {
        selectedUnitIds.delete(id);
        card.classList.remove('is-selected');
        btn.innerText = "Select";
    } else {
        selectedUnitIds.add(id);
        card.classList.add('is-selected');
        btn.innerText = "Selected";
    }
    updateCompareBtn();
}

// Select/Deselect all units
const selectAllUnits = () => { 
    const alreadyAll = selectedUnitIds.size === unitDatabase.length; 
    alreadyAll ? selectedUnitIds.clear() : unitDatabase.forEach(u => selectedUnitIds.add(u.id)); 
    resetAndRender(); 
};

// Update compare button visibility
const updateCompareBtn = () => {
    const isDbPage = document.getElementById('dbPage').classList.contains('active');
    const btn = document.getElementById('compareBtn');
    const count = selectedUnitIds.size;
    document.getElementById('compareCount').innerText = count;
    btn.style.display = (count > 0 && isDbPage) ? 'block' : 'none';
    document.getElementById('selectAllBtn').innerText = (count === unitDatabase.length && count > 0) ? "Deselect All" : "Select All";
};

// Toggle ability for a unit
function toggleAbility(unitId, checkbox) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if(!unit) return;
    
    if (checkbox.checked) activeAbilityIds.add(unitId);
    else activeAbilityIds.delete(unitId);
    
    let currentStats = { ...unit.stats };
    if (checkbox.checked && unit.ability) {
        Object.assign(currentStats, unit.ability);
    }
    
    const filteredBuilds = getFilteredBuilds();
    const subCandidates = getValidSubCandidates();
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    const headsToProcess = includeHead ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'];

    const results = calculateUnitBuilds(unit, currentStats, filteredBuilds, subCandidates, headsToProcess, includeSubs);
    unitBuildsCache[unitId] = results;
    updateBuildListDisplay(unitId);
}

// Switch between pages
function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const isDb = pid === 'db';
    if (pid === 'db') {
        document.getElementById('dbPage').classList.add('active');
        document.getElementById('dbInjector').style.display = 'flex';
        document.getElementById('guidesToolbar').style.display = 'none';
        event.target.classList.add('active');
    } else if (pid === 'guides') {
        document.getElementById('guidesPage').classList.add('active');
        document.getElementById('guidesToolbar').style.display = 'flex';
        document.getElementById('dbInjector').style.display = 'none';
        event.target.classList.add('active');
        renderGuides();
    }
    
    document.getElementById('selectAllBtn').style.display = isDb ? 'block' : 'none';
    if (!isDb) document.getElementById('compareBtn').style.display = 'none'; else updateCompareBtn();
}

// Toggle deep dive section
const toggleDeepDive = (btn) => {
    const content = btn.nextElementSibling;
    const arrow = btn.querySelector('.dd-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
    }
};
