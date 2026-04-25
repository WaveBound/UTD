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
    if (callback) callback(checkbox);
}

// Helper to update body class based on checkbox state
const updateBodyClass = (className, isChecked) => {
    if (isChecked) document.body.classList.add(className);
    else document.body.classList.remove(className);
};

// --- DATABASE DYNAMIC LOADER ---

window.getActiveDbFilename = () => {
    const parts = [];
    if (window.mikuBuffActive) parts.push('miku');
    if (window.enlightenedGodBuffActive) parts.push('enlightened');
    if (window.bijuuLinkActive) parts.push('bijuu');
    if (window.ancientMageSupportActive) parts.push('amage');
    if (window.kingSailorBuffActive || window.kingSailorMarkActive) parts.push('ksailor');
    if (window.mageHillBuffActive) parts.push('magehill');
    else if (window.mageGroundBuffActive) parts.push('mageground');

    if (parts.length === 0) return 'db_base.js';
    return 'db_' + parts.join('_') + '.js';
};

window.currentLoadedDb = 'db_base.js';

window.loadDatabaseForCurrentBuffs = (callback) => {
    const dbName = window.getActiveDbFilename();
    if (window.currentLoadedDb === dbName) {
        if (callback) callback();
        return;
    }

    const scriptId = 'dynamic-db-script';
    let oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'databases/' + dbName;
    script.onload = () => {
        window.currentLoadedDb = dbName;
        if (callback) callback();
    };
    script.onerror = () => {
        console.error("Failed to load database: " + dbName);
        if (callback) callback();
    };
    document.head.appendChild(script);
};

// PERFORMANCE: High-speed set to track visible units without layout thrashing
window.visibleUnitIds = new Set();
window.isBuffUpdateRunning = false;

// Centralized debouncer for global buff changes
let buffUpdateTimer = null;
window.triggerGlobalBuffUpdate = () => {
    if (buffUpdateTimer) clearTimeout(buffUpdateTimer);
    buffUpdateTimer = setTimeout(() => {
        window.loadDatabaseForCurrentBuffs(() => {
            window.resetCachesForBuffChange();
            updateAllUnitsBuilds();
            if (document.getElementById('guidesPage').classList.contains('active')) renderGuides();
        });
    }, 50);
};

// Toggle Inventory Mode
window.toggleInventoryMode = (checkbox) => {
    const isChecked = checkbox.checked;
    inventoryMode = isChecked;

    // Visual toggle
    checkbox.parentNode.classList.toggle('is-checked', isChecked);

    // Sync other toggle
    const otherId = checkbox.id === 'globalInventoryMode' ? 'guideInventoryMode' : 'globalInventoryMode';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        otherCheckbox.parentNode.classList.toggle('is-checked', isChecked);
    }

    // Trigger full calculation re-render
    resetAndRender();
    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
};

// Add a global state for Miku buff
window.mikuBuffActive = false;

// Centralized cache reset helper
window.resetCachesForBuffChange = () => {
    window.unitBuildsCache = {};
    window.cachedResults = {};
};

// Toggle Miku Buff
window.toggleMikuBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.mikuBuffActive === isChecked) return;

    window.mikuBuffActive = isChecked;

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#4ade80' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(74, 222, 128, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    const otherId = checkbox.id === 'globalMikuBuff' ? 'guideMikuBuff' : 'globalMikuBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        const otherLabel = otherCheckbox.closest('.nav-toggle-label');
        updateVisuals(otherLabel, isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

// Add global states for Prodigy Mage buffs
window.mageHillBuffActive = false;
window.mageGroundBuffActive = false;

window.toggleMageHillBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.mageHillBuffActive === isChecked) return;
    window.mageHillBuffActive = isChecked;

    // Mutually Exclusive: Turn off Ground Buff
    if (isChecked && window.mageGroundBuffActive) {
        window.mageGroundBuffActive = false;
        ['globalMageGroundBuff', 'guideMageGroundBuff'].forEach(id => {
            const cb = document.getElementById(id);
            if (cb) {
                cb.checked = false;
                const lbl = cb.closest('.nav-toggle-label');
                if (lbl) {
                    lbl.classList.remove('is-checked');
                    const span = lbl.querySelector('span');
                    if (span) { span.style.color = ''; span.style.textShadow = ''; span.style.fontWeight = ''; }
                }
            }
        });
    }

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#fb923c' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(251, 146, 60, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);
    const otherId = checkbox.id === 'globalMageHillBuff' ? 'guideMageHillBuff' : 'globalMageHillBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        updateVisuals(otherCheckbox.closest('.nav-toggle-label'), isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

window.toggleMageGroundBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.mageGroundBuffActive === isChecked) return;
    window.mageGroundBuffActive = isChecked;

    // Mutually Exclusive: Turn off Hill Buff
    if (isChecked && window.mageHillBuffActive) {
        window.mageHillBuffActive = false;
        ['globalMageHillBuff', 'guideMageHillBuff'].forEach(id => {
            const cb = document.getElementById(id);
            if (cb) {
                cb.checked = false;
                const lbl = cb.closest('.nav-toggle-label');
                if (lbl) {
                    lbl.classList.remove('is-checked');
                    const span = lbl.querySelector('span');
                    if (span) { span.style.color = ''; span.style.textShadow = ''; span.style.fontWeight = ''; }
                }
            }
        });
    }

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#f472b6' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(244, 114, 182, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);
    const otherId = checkbox.id === 'globalMageGroundBuff' ? 'guideMageGroundBuff' : 'globalMageGroundBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        updateVisuals(otherCheckbox.closest('.nav-toggle-label'), isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

// Add a global state for Ancient Mage buff
window.ancientMageSupportActive = false;

// Toggle Ancient Mage Buff
window.toggleAncientMageSupport = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.ancientMageSupportActive === isChecked) return;

    window.ancientMageSupportActive = isChecked;

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#60a5fa' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(96, 165, 250, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    const otherId = checkbox.id === 'globalAMSupport' ? 'guideAMSupport' : 'globalAMSupport';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        updateVisuals(otherCheckbox.closest('.nav-toggle-label'), isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

// Add a global state for Enlightened God buff
window.enlightenedGodBuffActive = false;

// Toggle Enlightened God Buff
window.toggleEnlightenedGodBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.enlightenedGodBuffActive === isChecked) return;

    window.enlightenedGodBuffActive = isChecked;

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#fbbf24' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(251, 191, 36, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    const otherId = checkbox.id === 'globalEnlightenedBuff' ? 'guideEnlightenedBuff' : 'globalEnlightenedBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        const otherLabel = otherCheckbox.closest('.nav-toggle-label');
        updateVisuals(otherLabel, isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

// Add a global state for Bijuu Link buff
window.bijuuLinkActive = false;

// Toggle Bijuu Link Buff
window.toggleBijuuLink = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.bijuuLinkActive === isChecked) return;

    window.bijuuLinkActive = isChecked;

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#f87171' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(248, 113, 113, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    const otherId = checkbox.id === 'globalBijuuBuff' ? 'guideBijuuBuff' : 'globalBijuuBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        updateVisuals(otherCheckbox.closest('.nav-toggle-label'), isChecked);
    }

    window.triggerGlobalBuffUpdate();
};

// Add a global state for King Sailor buff
window.kingSailorBuffActive = false;
window.kingSailorMarkActive = false;

// Toggle King Sailor Buff
window.toggleKingSailorBuff = (checkbox) => {
    const isChecked = checkbox.checked;
    if (window.kingSailorBuffActive === isChecked) return;
    if (window.kingSailorMarkActive === isChecked) return;

    window.kingSailorBuffActive = isChecked;
    window.kingSailorMarkActive = isChecked;

    const updateVisuals = (lbl, checked) => {
        if (!lbl) return;
        lbl.classList.toggle('is-checked', checked);
        const span = lbl.querySelector('span');
        if (span) {
            span.style.color = checked ? '#60a5fa' : '';
            span.style.textShadow = checked ? '0 0 10px rgba(96, 165, 250, 0.5)' : '';
            span.style.fontWeight = checked ? 'bold' : '';
        }
    };

    const label = checkbox.closest('.nav-toggle-label');
    updateVisuals(label, isChecked);

    const otherId = checkbox.id === 'globalKSBuff' ? 'guideKSBuff' : 'globalKSBuff';
    const otherCheckbox = document.getElementById(otherId);
    if (otherCheckbox) {
        otherCheckbox.checked = isChecked;
        updateVisuals(otherCheckbox.closest('.nav-toggle-label'), isChecked);
    }

    window.triggerGlobalBuffUpdate();
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

    if (unitBuildsCache[unit.id]) {
        unitBuildsCache[unit.id] = { base: { fixed: [null, null, null, null] }, abil: { fixed: [null, null, null, null] } };
    }

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

// Set Ancient Mage Mode
window.setAncientMageMode = (mode, input) => {
    ancientMageState.mode = mode;

    const unit = unitDatabase.find(u => u.id === 'ancient_mage');
    if (!unit) return;

    unitBuildsCache[unit.id] = {
        base: { fixed: [null, null, null, null] },
        abil: { fixed: [null, null, null, null] }
    };

    updateBuildListDisplay(unit.id);
    if (document.getElementById('guidesPage').classList.contains('active')) renderGuides();
};

// Specialist Toggle for Ancient Mage
window.toggleAMSpecialist = (checkbox) => {
    ancientMageState.mode = checkbox.checked ? "Specialist" : "DPS";

    const unit = unitDatabase.find(u => u.id === 'ancient_mage');
    if (!unit) return;

    unitBuildsCache[unit.id] = {
        base: { fixed: [null, null, null, null] },
        abil: { fixed: [null, null, null, null] }
    };

    setTimeout(() => {
        updateBuildListDisplay(unit.id);
        if (document.getElementById('guidesPage').classList.contains('active')) renderGuides();
    }, 10);
};

// Set Robot 17 & 18 Mode
function setRobot1718Mode(mode, selectEl) {
    robot1718State.mode = mode;
    const unit = unitDatabase.find(u => u.id === 'robot1718');
    if (!unit) return;

    if (unitBuildsCache[unit.id]) {
        unitBuildsCache[unit.id] = { base: { fixed: [null, null, null, null] }, abil: { fixed: [null, null, null, null] } };
    }

    if (typeof processUnitCache === 'function') {
        processUnitCache(unit);
    } else {
        resetAndRender();
        return;
    }

    updateBuildListDisplay(unit.id);

    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
}

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
    updateBuildListDisplay(unitId);
}

let activeBuildUpdateFrame = null;

/**
 * Optimized way to refresh build lists on all currently rendered unit cards.
 */
function updateAllUnitsBuilds() {
    if (activeBuildUpdateFrame) cancelAnimationFrame(activeBuildUpdateFrame);

    const queue = Array.from(window.visibleUnitIds);

    document.querySelectorAll('.unit-card.lazy-build-load').forEach(card => {
        card.querySelectorAll('.top-builds-list').forEach(c => {
            if (c.innerHTML !== '') c.innerHTML = '';
        });
    });

    window.isBuffUpdateRunning = true;

    function processBatch() {
        const frameStart = performance.now();

        while (queue.length > 0) {
            const unitId = queue.shift();
            updateBuildListDisplay(unitId, true, 30);

            if (performance.now() - frameStart > 4) {
                activeBuildUpdateFrame = requestAnimationFrame(processBatch);
                return;
            }
        }

        activeBuildUpdateFrame = null;
        window.isBuffUpdateRunning = false;
    }

    activeBuildUpdateFrame = requestAnimationFrame(processBatch);
}

function injectDbToolbarButtons() {
    const toolbar = document.getElementById('dbInjector');
    if (!toolbar) return;

    const toolbarButtons = toolbar.querySelectorAll('button, .action-btn');
    toolbarButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('trait tier list') || text.includes('trait stats')) {
            btn.classList.add('hide-on-desktop');
        }
    });

    if (!document.getElementById('pc-toolbar-fix')) {
        const style = document.createElement('style');
        style.id = 'pc-toolbar-fix';
        style.innerHTML = `@media (min-width: 1024px) { .hide-on-desktop { display: none !important; } }`;
        document.head.appendChild(style);
    }
}

// Switch between pages
function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    document.querySelectorAll('.dashboard-sidebar .nav-btn').forEach(btn => {
        const onClickAttr = btn.getAttribute('onclick') || '';
        if (onClickAttr.includes(`switchPage('${pid}')`) || (pid === 'inventory' && onClickAttr.includes('resetAndOpenInventory'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const dbToolbar = document.getElementById('dbInjector');
    const guidesToolbar = document.getElementById('guidesToolbar');
    const invToolbar = document.getElementById('inventoryToolbar');

    if (dbToolbar) dbToolbar.classList.add('hidden');
    if (guidesToolbar) guidesToolbar.classList.add('hidden');
    if (invToolbar) invToolbar.classList.add('hidden');

    if (pid === 'db') {
        document.getElementById('dbPage').classList.add('active');
        if (dbToolbar) {
            dbToolbar.classList.remove('hidden');
            injectDbToolbarButtons();
        }
    } else if (pid === 'guides') {
        document.getElementById('guidesPage').classList.add('active');
        if (guidesToolbar) guidesToolbar.classList.remove('hidden');
        renderGuides();
    } else if (pid === 'inventory') {
        document.getElementById('inventoryPage').classList.add('active');
        if (invToolbar) invToolbar.classList.remove('hidden');
        const invBtn = document.querySelector(`button[onclick*="switchPage('inventory')"]`) ||
            document.querySelector(`button[onclick*="resetAndOpenInventory()"]`);
        if (invBtn) invBtn.classList.add('active');
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
    if (!content || !arrow) return;

    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        arrow.textContent = '▼';
        btn.classList.add('active');
    } else {
        content.classList.add('hidden');
        arrow.textContent = '▶';
        btn.classList.remove('active');
    }
};

window.swapBreakdownPanels = (btn) => {
    const wrapper = btn.closest('.breakdown-top-wrapper');
    if (!wrapper) return;
    const left = wrapper.querySelector('.breakdown-panel--left');
    const right = wrapper.querySelector('.breakdown-panel--right');
    if (!left || !right) return;

    const leftVisible = !left.classList.contains('is-hidden');
    if (leftVisible) {
        left.classList.add('is-hidden');
        left.classList.remove('is-visible');
        right.classList.add('is-visible');
        right.classList.remove('is-hidden');
        const label = btn.querySelector('.swap-label');
        if (label) label.textContent = 'Source';
    } else {
        left.classList.remove('is-hidden');
        left.classList.add('is-visible');
        right.classList.remove('is-visible');
        right.classList.add('is-hidden');
        const label = btn.querySelector('.swap-label');
        if (label) label.textContent = 'Details';
    }
};

function toggleHeader() {
    document.body.classList.toggle('header-collapsed');
}

// Toggle between Main and Sub stats on Mobile Build Cards
window.toggleRelicStatDisplay = (btn) => {
    const row = btn.closest('.build-row');
    if (row) row.classList.toggle('show-subs-mobile');
};

// Toggle Mobile Menu (Sidebar Drawer)
window.toggleMobileMenu = (show = null) => {
    const body = document.body;
    const shouldOpen = show !== null ? show : !body.classList.contains('mobile-menu-open');

    body.classList.toggle('mobile-menu-open', shouldOpen);

    if (typeof updateBodyScroll === 'function') updateBodyScroll();
};

// Initialize Mobile UI Elements (Backdrop & FAB)
const initMobileUI = () => {
    if (!document.querySelector('.mobile-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.onclick = () => toggleMobileMenu(false);
        document.body.appendChild(overlay);
    }

    if (!document.querySelector('.mobile-fab')) {
        const fab = document.createElement('button');
        fab.className = 'mobile-fab';
        fab.innerHTML = '<span>☰</span>';
        fab.onclick = () => toggleMobileMenu(true);
        document.body.appendChild(fab);
    }
};

/**
 * Injects the King Sailor button into the header next to Miku's
 * if it hasn't been manually added to the HTML yet.
 */
function injectGlobalButtons() {
    if (document.getElementById('globalKSBuff')) return;

    const mikuBtn = document.getElementById('globalMikuBuff');
    if (!mikuBtn) return;

    const container = mikuBtn.closest('.nav-toggle-label').parentElement;
    if (!container) return;

    const ksHtml = `
        <label class="nav-toggle-label" title="King Sailor Buff: +10% Crit Rate, +20% Crit Damage">
            <input type="checkbox" id="globalKSBuff" onchange="toggleKingSailorBuff(this)">
            <div class="nav-switch"></div>
            <span>King Sailor Buff</span>
        </label>
    `;

    mikuBtn.closest('.nav-toggle-label').insertAdjacentHTML('afterend', ksHtml);
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
    initMobileUI();
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

// 1. Copy Function
window.handleCreditClick = function (username) {
    copyDiscordToClipboard(username);
};

// 2. Hybrid Link Function
window.handleDiscordLink = function (userId, event) {
    event.stopPropagation();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        return;
    } else {
        window.location.href = `discord://-/users/${userId}`;
    }
};

window.copyDiscordToClipboard = function (username) {
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
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}