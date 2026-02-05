// ============================================================================
// UI-HELPERS.JS - UI Interaction & Toggle Functions
// ============================================================================

// Reset and trigger database re-render
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

// --- GENERIC SYNCED TOGGLE LOGIC ---

/**
 * Syncs a checkbox with another checkbox ID and toggles a body class.
 * Replaces toggleSubStats, toggleHeadPiece, etc.
 * @param {HTMLInputElement} triggerEl - The checkbox clicked
 * @param {string} targetId - The ID of the matching checkbox in the other menu (Header vs Guide)
 * @param {string} cssClass - The class to toggle on document.body
 */
const syncVisualToggle = (triggerEl, targetId, cssClass) => {
    toggleCheckbox(triggerEl, (el) => {
        const otherCb = document.getElementById(targetId);
        if(otherCb) {
            otherCb.checked = el.checked;
            otherCb.parentNode.classList.toggle('is-checked', el.checked);
        }
        updateBodyClass(cssClass, el.checked);
    });
};

// Wrappers for HTML onclick handlers
const toggleSubStats = (cb) => {
    const target = cb.id === 'globalSubStats' ? 'guideSubStats' : 'globalSubStats';
    syncVisualToggle(cb, target, 'show-subs');
};

const toggleHeadPiece = (cb) => {
    const target = cb.id === 'globalHeadPiece' ? 'guideHeadPiece' : 'globalHeadPiece';
    syncVisualToggle(cb, target, 'show-head');
};

// Map old names for compatibility
const toggleGuideSubStats = toggleSubStats;
const toggleGuideHeadPiece = toggleHeadPiece;

// Toggle hypothetical/bugged relics checkbox
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

// Toggle Inventory Mode
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

// Add a global state for Miku buff
window.mikuBuffActive = false;

// Toggle Miku Buff
window.toggleMikuBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    window.mikuBuffActive = isChecked;
    
    // Helper for visual updates
    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#4ade80' : ''; // Bright Green
            span.style.textShadow = checked ? '0 0 10px rgba(74, 222, 128, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    // Visual toggle current
    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    // Sync other toggle
    const otherId = checkbox.id === 'globalMikuBuff' ? 'guideMikuBuff' : 'globalMikuBuff';
    const otherCheckbox = document.getElementById(otherId);
    if(otherCheckbox) {
        otherCheckbox.checked = isChecked;
        const otherLabel = otherCheckbox.closest('.nav-toggle-label');
        updateVisuals(otherLabel, isChecked);
    }

    // Trigger full calculation re-render (Deferred to allow UI update)
    // Using setTimeout to ensure the visual switch toggle paints 
    // before the heavy calculation thread locks the browser.
    setTimeout(() => {
        resetAndRender();
        if(document.getElementById('guidesPage').classList.contains('active')) {
            renderGuides();
        }
    }, 50);
};


// Toggle Kirito mode (Realm/Card)
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

// Set Bambietta Element
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

function injectDbToolbarButtons() {
    const dbToolbar = document.getElementById('dbInjector');
    if (!dbToolbar) return;

    // Inject Trait Tier List Button (Dynamic)
    if (!document.getElementById('btnTraitTierList')) {
        const btn = document.createElement('button');
        btn.id = 'btnTraitTierList';
        btn.className = 'nav-btn';
        btn.style.cssText = 'border: 1px solid var(--accent-start); color: var(--accent-start); margin-left: 10px;';
        btn.innerHTML = 'Trait Tier List';
        btn.onclick = () => window.openTraitTierList && window.openTraitTierList();
        dbToolbar.appendChild(btn);
    }
    // Inject Trait Stats Guide Button
    if (!document.getElementById('btnTraitStatsGuide')) {
        const btn = document.createElement('button');
        btn.id = 'btnTraitStatsGuide';
        btn.className = 'nav-btn';
        btn.style.cssText = 'border: 1px solid var(--accent-end); color: var(--accent-end); margin-left: 10px;';
        btn.innerHTML = 'Trait Stats';
        btn.onclick = () => window.openAllTraitsGuide && window.openAllTraitsGuide();
        dbToolbar.appendChild(btn);
    }
}

// Switch between pages
function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const dbToolbar = document.getElementById('dbInjector');
    const guidesToolbar = document.getElementById('guidesToolbar');
    const invToolbar = document.getElementById('inventoryToolbar');

    if(dbToolbar) dbToolbar.classList.add('hidden');
    if(guidesToolbar) guidesToolbar.classList.add('hidden');
    if(invToolbar) invToolbar.classList.add('hidden');

    const isDb = pid === 'db';
    if (pid === 'db') {
        document.getElementById('dbPage').classList.add('active');
        if(dbToolbar) {
            dbToolbar.classList.remove('hidden');
            injectDbToolbarButtons();
        }
        if(event && event.target) event.target.classList.add('active');
    } else if (pid === 'guides') {
        document.getElementById('guidesPage').classList.add('active');
        if(guidesToolbar) guidesToolbar.classList.remove('hidden');
        if(event && event.target) event.target.classList.add('active');
        renderGuides();
    } else if (pid === 'inventory') {
        document.getElementById('inventoryPage').classList.add('active');
        if(invToolbar) invToolbar.classList.remove('hidden');
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

function toggleHeader() {
    document.body.classList.toggle('header-collapsed');
}

// Sticky detection observer
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

    injectDbToolbarButtons();
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

function renderCredits() {
    const container = document.getElementById('creditsContainer');
    if (!container || typeof creditsData === 'undefined') return;

    // Standard Discord Logo (Visual only)
    const discordLogo = `<svg class="discord-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.7;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.486 13.486 0 0 0-.64 1.28 18.27 18.27 0 0 0-4.998 0 13.49 13.49 0 0 0-.644-1.28.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>`;

    // External Link Icon (The "Little Button")
    const linkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-link-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

    container.innerHTML = creditsData.map(c => {
        // Updated Link Button Logic:
        // 1. Keep the standard HTML anchor tag (Best for Mobile Universal Links).
        // 2. Add onclick="handleDiscordLink" (Best for Desktop Protocol triggering).
        const linkButtonHtml = c.userId 
            ? `<a href="https://discord.com/users/${c.userId}" target="_blank" rel="noopener noreferrer" class="discord-link-btn" onclick="handleDiscordLink('${c.userId}', event)" title="Open Discord Profile" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; color: inherit;">${linkIcon}</a>`
            : '';

        return `
        <div class="credit-badge ${c.type}" onclick="handleCreditClick('${c.id}')" title="Copy Username: ${c.id}">
            <div class="badge-role">${c.role}</div>
            <div class="badge-content">
                ${c.pfp ? `<img src="${c.pfp}" class="badge-pfp" alt="${c.name}">` : ''}
                <span class="badge-name">${c.name}</span>
                ${discordLogo}
                ${linkButtonHtml}
            </div>
        </div>
        `;
    }).join('');
}

// 1. Copy Function (Triggered when clicking the Badge body)
window.handleCreditClick = function(username) {
    copyDiscordToClipboard(username);
};

// 2. Hybrid Link Function (Triggered when clicking the Link Icon)
window.handleDiscordLink = function(userId, event) {
    // Stop event bubbling (prevents "Copy Username" toast)
    event.stopPropagation();

    // Check if the user is on Mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // MOBILE STRATEGY:
        // Do nothing in JS. Let the standard HTML <a> tag handle the navigation.
        // Mobile OSs (iOS/Android) are smart enough to see "https://discord.com/users/..."
        // and open the installed Discord App automatically via Universal Links.
        return;
    } else {
        // DESKTOP STRATEGY:
        // Desktop browsers usually treat "https://" as a website link and just open a tab.
        // To launch the App, we must explicitly trigger the "discord://" protocol.
        
        // This line attempts to launch the Desktop App:
        window.location.href = `discord://-/users/${userId}`;

        // NOTE: We do NOT use event.preventDefault().
        // Why? Because if the user *doesn't* have the Desktop App installed, the protocol line above does nothing.
        // By allowing the <a> tag's default behavior (opening the href in _blank), we ensure
        // a New Tab opens with the web profile as a failsafe.
        // Result: User gets "Open Discord?" prompt AND a web tab. This is standard behavior for deep links.
    }
};

window.copyDiscordToClipboard = function(username) {
    navigator.clipboard.writeText(username).then(() => {
        showToast(`Copied "${username}" to clipboard! Paste in Discord to message.`);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy username.');
    });
};

function showToast(message) {
    let toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
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