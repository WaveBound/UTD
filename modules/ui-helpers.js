// ============================================================================
// UI-HELPERS.JS - UI Interaction & Toggle Functions
// ============================================================================

// Reset and trigger database re-render (Used for deep logic changes like Kirito Realm)
const resetAndRender = () => { 
    renderQueueIndex = 0; 
    renderDatabase(); 
};

function filterList(element) {
    const card = element.closest('.unit-card');
    if (!card) return;
    const unitId = card.id.replace('card-', '');

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

// NEW: Toggle Inventory Mode
const toggleInventoryMode = (checkbox) => {
    const isChecked = checkbox.checked;
    inventoryMode = isChecked;
    
    // Visual toggle
    checkbox.parentNode.classList.toggle('is-checked', isChecked);

    // Sync other toggle
    const otherId = checkbox.id === 'globalInventoryMode' ? 'guideInventoryMode' : 'globalInventoryMode';
    const otherCheckbox = document.getElementById(otherId);
    if(otherCheckbox) {
        otherCheckbox.checked = isChecked;
        otherCheckbox.parentNode.classList.toggle('is-checked', isChecked);
    }

    // Trigger full calculation re-render
    resetAndRender();
    if(document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
};

// Map old names to new unified functions for compatibility
const toggleGuideSubStats = toggleSubStats;
const toggleGuideHeadPiece = toggleHeadPiece;

// Toggle Kirito mode (Realm/Card) - OPTIMIZED to prevent full page reload
function toggleKiritoMode(mode, checkbox) {
    if (mode === 'realm') {
        kiritoState.realm = checkbox.checked;
        if (!checkbox.checked) kiritoState.card = false; 
    } else if (mode === 'card') {
        kiritoState.card = checkbox.checked;
    }
    
    const unit = unitDatabase.find(u => u.id === 'kirito');
    if (!unit) return;

    if (typeof processUnitCache === 'function') {
        processUnitCache(unit);
    } else {
        console.error("processUnitCache not found, full reload triggered.");
        resetAndRender();
        return;
    }

    const card = document.getElementById('card-kirito');
    if (card && typeof getKiritoControlsHtml === 'function') {
        const toolbars = card.querySelectorAll('.unit-toolbar');
        toolbars.forEach(tb => {
            if (tb.innerText.includes('Virtual Realm')) {
                tb.outerHTML = getKiritoControlsHtml(unit);
            }
        });
    }

    updateBuildListDisplay('kirito');
    
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
    bambiettaState.element = element;
    const unit = unitDatabase.find(u => u.id === 'bambietta');
    if (!unit) return;

    if (typeof processUnitCache === 'function') {
        processUnitCache(unit);
    } else {
        console.error("processUnitCache not found, full reload triggered.");
        resetAndRender();
        return;
    }

    updateBuildListDisplay(unit.id);
    
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
    
    if (count > 0 && isDbPage) {
        btn.classList.add('is-visible');
    } else {
        btn.classList.remove('is-visible');
    }

    document.getElementById('selectAllBtn').innerText = (count === unitDatabase.length && count > 0) ? "Deselect All" : "Select All";
};

// Toggle ability for a unit
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
    
    // Toggle Toolbars
    const dbToolbar = document.getElementById('dbInjector');
    const guidesToolbar = document.getElementById('guidesToolbar');
    const invToolbar = document.getElementById('inventoryToolbar');

    if(dbToolbar) dbToolbar.classList.add('hidden');
    if(guidesToolbar) guidesToolbar.classList.add('hidden');
    if(invToolbar) invToolbar.classList.add('hidden');

    const isDb = pid === 'db';
    if (pid === 'db') {
        document.getElementById('dbPage').classList.add('active');
        if(dbToolbar) dbToolbar.classList.remove('hidden');
        if(event && event.target) event.target.classList.add('active');
    } else if (pid === 'guides') {
        document.getElementById('guidesPage').classList.add('active');
        if(guidesToolbar) guidesToolbar.classList.remove('hidden');
        if(event && event.target) event.target.classList.add('active');
        renderGuides();
    } else if (pid === 'inventory') {
        document.getElementById('inventoryPage').classList.add('active');
        if(invToolbar) invToolbar.classList.remove('hidden');
        // Find the specific button for inventory to add active class
        const invBtn = document.querySelector(`button[onclick*="switchPage('inventory')"]`) || 
                       document.querySelector(`button[onclick*="resetAndOpenInventory()"]`);
        if(invBtn) invBtn.classList.add('active');
    }
    
    const selectAllBtn = document.getElementById('selectAllBtn');
    if(isDb) selectAllBtn.classList.remove('hidden');
    else selectAllBtn.classList.add('hidden');

    const compareBtn = document.getElementById('compareBtn');
    if (!isDb) {
        compareBtn.classList.remove('is-visible');
    } else {
        updateCompareBtn();
    }
}

// NEW: Wrapper to clear highlights when clicking main nav button
function resetAndOpenInventory() {
    if (typeof clearInventoryHighlights === 'function') {
        clearInventoryHighlights();
    }
    switchPage('inventory');
}

// Toggle deep dive section
const toggleDeepDive = (btn) => {
    const content = btn.nextElementSibling;
    const arrow = btn.querySelector('.dd-arrow');
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.textContent = '▼';
    } else {
        content.classList.add('hidden');
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
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                toolbar.classList.add('is-sticky');
            } else {
                toolbar.classList.remove('is-sticky');
            }
        }, { threshold: [1] });

        observer.observe(sentinel);
    }
});

let savedScrollPosition = 0;

function updateBodyScroll() {
    const visibleModals = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.classList.contains('is-visible'));
    const visiblePopups = document.getElementById('mathInfoPopup');
    const body = document.body;

    if (visibleModals || visiblePopups) {
        if (!body.classList.contains('scroll-locked')) {
            savedScrollPosition = window.scrollY;
            body.style.setProperty('--scroll-offset', `-${savedScrollPosition}px`);
            body.classList.add('scroll-locked');
        }
    } else {
        if (body.classList.contains('scroll-locked')) {
            body.classList.remove('scroll-locked');
            body.style.removeProperty('--scroll-offset');
            window.scrollTo(0, savedScrollPosition);
        }
    }
}

// Render Credits from Data
function renderCredits() {
    const container = document.getElementById('creditsContainer');
    if (!container || typeof creditsData === 'undefined') return;

    const discordIcon = `<svg class="discord-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.486 13.486 0 0 0-.64 1.28 18.27 18.27 0 0 0-4.998 0 13.49 13.49 0 0 0-.644-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>`;

    container.innerHTML = creditsData.map(c => `
        <div class="credit-badge ${c.type}" onclick="handleCreditClick('${c.id}')" title="Copy Username">
            <div class="badge-role">${c.role}</div>
            <div class="badge-content">
                ${c.pfp ? `<img src="${c.pfp}" class="badge-pfp" alt="${c.name}">` : ''}
                <span class="badge-name">${c.name}</span>
                ${discordIcon}
            </div>
        </div>
    `).join('');
}

// Handle Credit Click (Copy Only)
window.handleCreditClick = function(username) {
    copyDiscordToClipboard(username);
};

// Copy Discord Username
window.copyDiscordToClipboard = function(username) {
    navigator.clipboard.writeText(username).then(() => {
        showToast(`Copied "${username}" to clipboard! Paste in Discord to message.`);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy username.');
    });
};

// Simple Toast Notification
function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Toast Styles
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '50px',
        zIndex: '9999',
        fontSize: '0.9rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeInOut 3s forwards'
    });

    // Keyframes style (if not exists)
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.innerHTML = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                10% { opacity: 1; transform: translate(-50%, 0); }
                90% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        if(toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}