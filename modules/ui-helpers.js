// ============================================================================
// UI-HELPERS.JS - UI Interaction & Toggle Functions
// ============================================================================

// Reset and trigger database re-render (Used for deep logic changes like Kirito Realm)
const resetAndRender = () => { 
    renderQueueIndex = 0; 
    renderDatabase(); 
};

function filterList(element) {
    // 1. Find the parent unit card component
    const card = element.closest('.unit-card');
    if (!card) return;

    // 2. Extract the Unit ID from the card's HTML ID (e.g., "card-miku" -> "miku")
    const unitId = card.id.replace('card-', '');

    // 3. Trigger the display update function located in rendering.js
    if (typeof updateBuildListDisplay === 'function') {
        updateBuildListDisplay(unitId);
    }
}

// Generic checkbox toggle with callback
function toggleCheckbox(checkbox, callback) {
    checkbox.parentNode.classList.toggle('is-checked', checkbox.checked);
    if(callback) callback(checkbox);
}

// Helper to update body class based on checkbox state
const updateBodyClass = (className, isChecked) => {
    if (isChecked) document.body.classList.add(className);
    else document.body.classList.remove(className);
};

// Toggle sub-stats (INSTANT CSS) - Used by both DB and Guide toggles
const toggleSubStats = (cb) => toggleCheckbox(cb, (el) => {
    // Sync the other checkbox (DB <-> Guide)
    const otherId = el.id === 'globalSubStats' ? 'guideSubStats' : 'globalSubStats';
    const otherCb = document.getElementById(otherId);
    if(otherCb) {
        otherCb.checked = el.checked;
        otherCb.parentNode.classList.toggle('is-checked', el.checked);
    }
    updateBodyClass('show-subs', el.checked);
});

// Toggle head piece (INSTANT CSS) - Used by both DB and Guide toggles
const toggleHeadPiece = (cb) => toggleCheckbox(cb, (el) => {
    // Sync the other checkbox (DB <-> Guide)
    const otherId = el.id === 'globalHeadPiece' ? 'guideHeadPiece' : 'globalHeadPiece';
    const otherCb = document.getElementById(otherId);
    if(otherCb) {
        otherCb.checked = el.checked;
        otherCb.parentNode.classList.toggle('is-checked', el.checked);
    }
    updateBodyClass('show-head', el.checked);
});

// Toggle hypothetical/bugged relics checkbox (INSTANT CSS)
const toggleHypothetical = (checkbox) => {
    const isChecked = checkbox.checked;
    
    // Update visual state of the specific clicked toggle
    checkbox.parentNode.classList.toggle('is-checked', isChecked);
    
    // Sync the other toggle (Header vs Guide Toolbar)
    const otherId = checkbox.id === 'globalHypothetical' ? 'guideHypoToggle' : 'globalHypothetical';
    const otherCheckbox = document.getElementById(otherId);
    if(otherCheckbox) {
        otherCheckbox.checked = isChecked;
        otherCheckbox.parentNode.classList.toggle('is-checked', isChecked);
    }

    // Apply class to body to flip visibility via CSS
    updateBodyClass('show-fixed-relics', isChecked);

    // Update Label Text
    const labelText = isChecked ? "Fixed Relics" : "Bugged Relics";
    const lbl1 = document.getElementById('hypoLabel');
    const lbl2 = document.getElementById('guideHypoLabel');
    if(lbl1) lbl1.innerText = labelText;
    if(lbl2) lbl2.innerText = labelText;
};

// Map old names to new unified functions for compatibility
const toggleGuideSubStats = toggleSubStats;
const toggleGuideHeadPiece = toggleHeadPiece;

// Toggle Kirito mode (Realm/Card) - OPTIMIZED to prevent full page reload
function toggleKiritoMode(mode, checkbox) {
    // 1. Update State
    if (mode === 'realm') {
        kiritoState.realm = checkbox.checked;
        if (!checkbox.checked) kiritoState.card = false; 
    } else if (mode === 'card') {
        kiritoState.card = checkbox.checked;
    }
    
    // 2. Identify Kirito Unit
    const unit = unitDatabase.find(u => u.id === 'kirito');
    if (!unit) return;

    // 3. Recalculate Cache ONLY for Kirito
    if (typeof processUnitCache === 'function') {
        processUnitCache(unit);
    } else {
        console.error("processUnitCache not found, full reload triggered.");
        resetAndRender();
        return;
    }

    // 4. Update DOM: Toolbar controls (Syncs switches if Realm turns off Card)
    const card = document.getElementById('card-kirito');
    if (card && typeof getKiritoControlsHtml === 'function') {
        // Find the specific toolbar containing the Kirito toggles and replace it
        const toolbars = card.querySelectorAll('.unit-toolbar');
        toolbars.forEach(tb => {
            if (tb.innerText.includes('Virtual Realm')) {
                // Generate fresh HTML based on new state and replace just this section
                tb.outerHTML = getKiritoControlsHtml(unit);
            }
        });
    }

    // 5. Update DOM: Build List (The numbers/stats)
    updateBuildListDisplay('kirito');
    
    // 6. If viewing Guides, update the Guides UI explicitly
    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
}

// Calculate Helpers
const getFilteredBuilds = () => globalBuilds.filter(b => {
    if (!statConfig.applyRelicCrit && (b.cf > 0 || b.cm > 0)) return false;
    if (!statConfig.applyRelicDot && b.dot > 0) return false;
    
    if (!statConfig.applyRelicDmg && b.dmg > 10 || !statConfig.applyRelicSpa && b.spa > 10) return false;
    return true;
});

const getValidSubCandidates = () => SUB_CANDIDATES.filter(c => 
    !((!statConfig.applyRelicCrit && (c === 'cm' || c === 'cf')) || (!statConfig.applyRelicDot && c === 'dot'))
);

// Set Bambietta Element (OPTIMIZED for Single Unit Update)
function setBambiettaElement(element, selectEl) {
    // 1. Update State
    bambiettaState.element = element;
    
    // 2. Find Bambietta
    const unit = unitDatabase.find(u => u.id === 'bambietta');
    if (!unit) return;

    // 3. Recalculate Cache ONLY for Bambietta
    // We utilize the global helper from rendering.js
    if (typeof processUnitCache === 'function') {
        processUnitCache(unit);
    } else {
        console.error("processUnitCache not found, full reload triggered.");
        resetAndRender();
        return;
    }

    // 4. Update ONLY Bambietta's DOM
    // This refreshes the build lists inside the card without creating a new card
    updateBuildListDisplay(unit.id);
    
    // 5. If Guides page is active, refresh guides (fast enough)
    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
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
    const shouldSelectAll = selectedUnitIds.size < unitDatabase.length;
    if (shouldSelectAll) {
        unitDatabase.forEach(u => selectedUnitIds.add(u.id));
    } else {
        selectedUnitIds.clear();
    }
    unitDatabase.forEach(u => {
        const card = document.getElementById('card-' + u.id);
        if (card) {
            const btn = card.querySelector('.select-btn');
            if (shouldSelectAll) {
                card.classList.add('is-selected');
                if (btn) btn.innerText = "Selected";
            } else {
                card.classList.remove('is-selected');
                if (btn) btn.innerText = "Select";
            }
        }
    });
    document.getElementById('selectAllBtn').innerText = shouldSelectAll ? "Deselect All" : "Select All";
    updateCompareBtn(); 
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

// Toggle ability for a unit (INSTANT CSS SWITCH)
function toggleAbility(unitId, checkbox) {
    const card = document.getElementById('card-' + unitId);
    if (!card) return;
    checkbox.parentNode.classList.toggle('is-checked', checkbox.checked);
    if (checkbox.checked) {
        card.classList.add('use-ability');
        activeAbilityIds.add(unitId);
    } else {
        card.classList.remove('use-ability');
        activeAbilityIds.delete(unitId);
    }
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

// Toggle Header visibility
function toggleHeader() {
    document.body.classList.toggle('header-collapsed');
}

// Sticky detection observer with Fixed Positioning Swap
document.addEventListener('DOMContentLoaded', () => {
    const sentinel = document.getElementById('sticky-sentinel');
    const toolbar = document.getElementById('headerToolbarSection');

    if (sentinel && toolbar) {
        const observer = new IntersectionObserver(([entry]) => {
            // If sentinel scrolls out of view (scrolling down)
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                // Switch toolbar to fixed
                toolbar.classList.add('is-sticky');
            } else {
                // Back at the top
                toolbar.classList.remove('is-sticky');
            }
        }, { threshold: [1] });

        observer.observe(sentinel);
    }
});