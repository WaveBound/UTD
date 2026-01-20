// ============================================================================
// INVENTORY.JS - Relic Inventory Management (Optimized & Persisted)
// ============================================================================

// --- Constants & Config ---
const RELIC_STORAGE_KEY = 'uto_relic_inventory_v1';

const RELIC_COLORS = {
    'ninja': 'linear-gradient(135deg, #eee, #999)',
    'sun_god': 'linear-gradient(135deg, #eee, #999)',
    'laughing': 'linear-gradient(135deg, #eee, #999)',
    'ex': 'linear-gradient(135deg, #eee, #999)',
    'shadow_reaper': 'linear-gradient(135deg, #eee, #999)',
    'reaper_set': 'linear-gradient(135deg, #eee, #999)',
    'default': 'linear-gradient(135deg, #eee, #999)'
};

function getSlotOptions(slot, starMult = 1) {
    const opts = [];
    if (slot === 'Head') {
        opts.push({ value: 'potency', text: `Potency (${(75 * starMult).toFixed(1)}%)` });
        opts.push({ value: 'elemental', text: `Elemental Dmg (${(30 * starMult).toFixed(1)}%)` });
    } else if (slot === 'Body') {
        opts.push({ value: 'dmg', text: `Damage (${(BODY_DMG.dmg * starMult).toFixed(1)}%)` });
        opts.push({ value: 'dot', text: `DoT (${(BODY_DOT.dot * starMult).toFixed(1)}%)` });
        opts.push({ value: 'cm', text: `Crit Dmg (${(BODY_CDMG.cm * starMult).toFixed(1)}%)` });
    } else if (slot === 'Legs') {
        opts.push({ value: 'dmg', text: `Damage (${(LEG_DMG.dmg * starMult).toFixed(1)}%)` });
        opts.push({ value: 'spa', text: `SPA (${(LEG_SPA.spa * starMult).toFixed(1)}%)` });
        opts.push({ value: 'cf', text: `Crit Rate (${(LEG_CRIT.cf * starMult).toFixed(1)}%)` });
        opts.push({ value: 'range', text: `Range (${(LEG_RANGE.range * starMult).toFixed(1)}%)` });
    }
    return opts;
}

const STAT_MAPPING = {
    'subDmg': 'dmg', 'subSpa': 'spa', 'subCdmg': 'cm', 
    'subCrit': 'cf', 'subDot': 'dot', 'subRange': 'range'
};

const REVERSE_STAT_MAPPING = {
    'dmg': 'subDmg', 'spa': 'subSpa', 'range': 'subRange',
    'cm': 'subCdmg', 'cf': 'subCrit', 'dot': 'subDot'
};

// --- DOM Elements ---
let inventoryGrid;
let highlightedRelicIds = new Set(); // State to track highlighting

function initInventory() {
    inventoryGrid = document.getElementById('relicGrid');
    
    document.getElementById('openAddRelicBtn')?.addEventListener('click', openAddRelicModal);
    document.getElementById('addRelicConfirmBtn')?.addEventListener('click', addRelic);
    document.getElementById('addRelicCancelBtn')?.addEventListener('click', () => closeModal('addRelicModal'));
    
    setupModalInputs();
    
    loadInventory();
    renderInventory();
    
    updateInventoryToggleState();
}

// --- Storage Helpers ---

function saveInventory() {
    try {
        localStorage.setItem(RELIC_STORAGE_KEY, JSON.stringify(relicInventory));
    } catch (e) {
        console.error("Failed to save inventory:", e);
    }
}

function loadInventory() {
    try {
        const stored = localStorage.getItem(RELIC_STORAGE_KEY);
        if (stored) {
            relicInventory = JSON.parse(stored);
        } else {
            relicInventory = []; 
        }
    } catch (e) {
        console.error("Failed to load inventory:", e);
        relicInventory = [];
    }
}

// --- Logic Helpers ---

function updateInventoryToggleState() {
    const isEmpty = (!relicInventory || relicInventory.length === 0);
    const toggleIds = ['globalInventoryMode', 'guideInventoryMode'];

    if (isEmpty && typeof inventoryMode !== 'undefined' && inventoryMode) {
        inventoryMode = false;
        if (typeof resetAndRender === 'function') resetAndRender();
    }

    toggleIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        
        const label = input.parentNode;
        
        if (isEmpty) {
            input.disabled = true;
            input.checked = false;
            label.classList.add('disabled');
            label.classList.remove('is-checked');
            label.title = "Inventory is empty. Add relics to enable.";
        } else {
            input.disabled = false;
            label.classList.remove('disabled');
            label.title = "Calculate using ONLY relics from your Inventory";
            
            if (typeof inventoryMode !== 'undefined') {
                input.checked = inventoryMode;
                if(inventoryMode) label.classList.add('is-checked');
                else label.classList.remove('is-checked');
            }
        }
    });
}

function updateSetOptions(slot) {
    const setSelect = document.getElementById('newRelicSet');
    if (!setSelect) return;

    const currentSelection = setSelect.value;
    const invalidHeadSets = ['laughing', 'ex'];

    const filteredSets = SETS.filter(s => {
        if (slot === 'Head') {
            return !invalidHeadSets.includes(s.id);
        }
        return true; 
    });

    setSelect.innerHTML = filteredSets.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    if (filteredSets.some(s => s.id === currentSelection)) {
        setSelect.value = currentSelection;
    } else if (filteredSets.length > 0) {
        setSelect.value = filteredSets[0].id;
    }

    updateStarVisibility();
}

function capStatInput(input, statKey) {
    let val = parseFloat(input.value);
    if (val < 0) { input.value = 0; return; }
    
    const baseMax = MAX_SUB_STAT_VALUES[statKey];
    if (baseMax === undefined) return;

    const starMult = parseFloat(document.getElementById('newRelicStars').value) || 1;
    const limit = baseMax * starMult;

    if (val > limit) input.value = limit.toFixed(3);
}

function enforceSubStatLimits() {
    Object.keys(STAT_MAPPING).forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.disabled && input.value !== '') capStatInput(input, STAT_MAPPING[id]);
    });
}

function updateStarVisibility() {
    const setId = document.getElementById('newRelicSet').value;
    const starSelect = document.getElementById('newRelicStars');
    if (!starSelect) return;

    const showStars = (setId === 'shadow_reaper' || setId === 'reaper_set');
    
    if (showStars) {
        starSelect.parentElement.classList.remove('hidden');
    } else {
        starSelect.parentElement.classList.add('hidden');
        starSelect.value = "1"; 
    }
    
    enforceSubStatLimits();
}

function lockConflictingSubStat(mainStatValue) {
    const targetId = REVERSE_STAT_MAPPING[mainStatValue];
    
    Object.keys(STAT_MAPPING).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const shouldDisable = (id === targetId);
        el.disabled = shouldDisable;
        el.parentElement.classList.toggle('disabled', shouldDisable);
        if (shouldDisable) {
            el.value = '';
            el.removeAttribute('data-base-val'); // Clear tracking on disable
        }
    });
}

// Updated Sub-Stat Scaling using Shared Utility
function updateSubStatValues(newMult) {
    Object.keys(STAT_MAPPING).forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.disabled && input.value !== '') {
            applyStarScalingToInput(input, newMult);
        }
    });
}

function updateMainStatOptions(slot) {
    const starSelect = document.getElementById('newRelicStars');
    const starVal = starSelect ? (parseFloat(starSelect.value) || 1) : 1;
    
    const select = document.getElementById('newRelicMainStat');
    const currentVal = select.value;
    
    const opts = getSlotOptions(slot, starVal);
    select.innerHTML = opts.map(o => `<option value="${o.value}">${o.text}</option>`).join('');
    
    if (opts.some(o => o.value === currentVal)) {
        select.value = currentVal;
    } else if (opts.length > 0) {
        select.value = opts[0].value;
        lockConflictingSubStat(opts[0].value);
    }
}

// --- Setup ---

function setupModalInputs() {
    // 1. Inputs
    const slotSelect = document.getElementById('newRelicSlot');
    const mainStatSelect = document.getElementById('newRelicMainStat');
    const setSelect = document.getElementById('newRelicSet');
    const starSelect = document.getElementById('newRelicStars');

    if (slotSelect && mainStatSelect && setSelect) {
        updateSetOptions(slotSelect.value);

        slotSelect.addEventListener('change', () => {
            updateMainStatOptions(slotSelect.value);
            updateSetOptions(slotSelect.value); 
        });
        
        mainStatSelect.addEventListener('change', () => lockConflictingSubStat(mainStatSelect.value));
        setSelect.addEventListener('change', updateStarVisibility);

        updateMainStatOptions(slotSelect.value);
        updateStarVisibility();
    }

    if (starSelect) {
        starSelect.innerHTML = `
          <option value="1">1★</option>
          <option value="1.025">2★</option>
          <option value="1.05">3★</option>`;
          
        starSelect.addEventListener('change', () => {
            const newMult = parseFloat(starSelect.value) || 1;
            
            // Update Main Stat Text
            const slot = document.getElementById('newRelicSlot').value;
            updateMainStatOptions(slot);

            // Scale Sub Stats (SHARED LOGIC)
            updateSubStatValues(newMult);

            // Enforce Limits
            enforceSubStatLimits();
        });
    }

    // 2. Attach Sub-Stat Cap Listeners (Once)
    Object.keys(STAT_MAPPING).forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.oninput = () => {
                capStatInput(input, STAT_MAPPING[id]);
                
                // NEW: Track Base Value
                const starMult = parseFloat(document.getElementById('newRelicStars').value) || 1;
                trackBaseStatValue(input, starMult);
            };
        }
    });
}

// --- Modal Actions ---

function openAddRelicModal() {
    document.querySelectorAll('#addRelicModal input[type="number"]').forEach(inp => {
        inp.value = '';
        inp.removeAttribute('data-base-val'); // Reset base value tracking
        inp.disabled = false;
        inp.parentElement.classList.remove('disabled');
    });
    
    const slotSelect = document.getElementById('newRelicSlot');
    if (slotSelect) {
        slotSelect.value = 'Head';
        updateMainStatOptions('Head');
        updateSetOptions('Head'); 
    }
    
    const starSelect = document.getElementById('newRelicStars');
    if (starSelect) starSelect.value = "1";

    updateStarVisibility();
    toggleModal('addRelicModal', true);
}

function addRelic() {
    const subs = {};
    Object.keys(STAT_MAPPING).forEach(id => {
        const val = parseFloat(document.getElementById(id).value) || 0;
        if (val > 0) subs[STAT_MAPPING[id]] = val;
    });

    const slot = document.getElementById('newRelicSlot').value;
    let setKey = document.getElementById('newRelicSet').value;

    if (slot === 'Head') {
        if (setKey === 'shadow_reaper') setKey = 'shadow_reaper_necklace';
        if (setKey === 'reaper_set') setKey = 'reaper_necklace';
    }

    const newRelic = {
        id: Date.now().toString(),
        slot: slot,
        setKey: setKey,
        stars: parseFloat(document.getElementById('newRelicStars').value) || 1,
        mainStat: document.getElementById('newRelicMainStat').value,
        subs: subs
    };

    relicInventory.push(newRelic);
    
    saveInventory();
    renderInventory();
    updateInventoryToggleState();

    if (typeof resetAndRender === 'function') {
        resetAndRender();
    }
    
    closeModal('addRelicModal');
}

function deleteRelic(id) {
    if (confirm('Delete this relic?')) {
        relicInventory = relicInventory.filter(r => r.id !== id);
        
        saveInventory();
        renderInventory();
        updateInventoryToggleState();

        if (typeof resetAndRender === 'function') {
            resetAndRender();
        }
    }
}

// --- Visuals & Rendering ---

function getRelicVisuals(setKey, slot) {
    let visualKey = setKey;
    if (visualKey === 'shadow_reaper_necklace') visualKey = 'shadow_reaper';
    if (visualKey === 'reaper_necklace') visualKey = 'reaper_set';

    const customImages = {
        'ninja': { 'Head': 'MasterNinjaMask.png', 'Body': 'MasterNinjaTop.png', 'Legs': 'MasterNinjaBottom.png' },
        'sun_god': { 'Head': 'SunGodMask.png', 'Body': 'SunGodTop.png', 'Legs': 'SunGodBottom.png' },
        'laughing': { 'Head': 'LaughingMask.png', 'Body': 'LaughingTop.png', 'Legs': 'LaughingBottom.png' },
        'ex': { 'Head': 'ExMask.png', 'Body': 'ExTop.png', 'Legs': 'ExBottom.png' },
        'shadow_reaper': { 'Head': 'ShadowReaperMask.png', 'Body': 'ShadowReaperTop.png', 'Legs': 'ShadowReaperBottom.png' },
        'reaper_set': { 'Head': 'ReaperMask.png', 'Body': 'ReaperTop.png', 'Legs': 'ReaperBottom.png' }
    };

    if (customImages[visualKey] && customImages[visualKey][slot]) {
        return {
            src: `images/Relic/${customImages[visualKey][slot]}`,
            bg: RELIC_COLORS[visualKey] || RELIC_COLORS.default
        };
    }

    return {
        src: `images/relics/${visualKey}_${slot.toLowerCase()}.png`,
        bg: RELIC_COLORS[visualKey] || RELIC_COLORS.default
    };
}

function calculateMainValue(relic) {
    let val = 0;
    if (relic.mainStat === 'potency') val = 75;
    else if (relic.mainStat === 'elemental') val = 30;
    else if (MAIN_STAT_VALS.body[relic.mainStat]) val = MAIN_STAT_VALS.body[relic.mainStat];
    else if (MAIN_STAT_VALS.legs[relic.mainStat]) val = MAIN_STAT_VALS.legs[relic.mainStat];

    return val * (relic.stars || 1);
}

function viewInventoryItems(headId, bodyId, legsId) {
    highlightedRelicIds.clear();
    
    if (headId && headId !== 'none') highlightedRelicIds.add(headId);
    if (bodyId && bodyId !== 'none-b') highlightedRelicIds.add(bodyId);
    if (legsId && legsId !== 'none-l') highlightedRelicIds.add(legsId);

    switchPage('inventory');
    renderInventory();

    if (inventoryGrid) inventoryGrid.scrollTop = 0;
}
window.viewInventoryItems = viewInventoryItems; 

function clearInventoryHighlights() {
    highlightedRelicIds.clear();
    renderInventory();
}
window.clearInventoryHighlights = clearInventoryHighlights;

function renderInventory() {
    if (!inventoryGrid) return;
    inventoryGrid.innerHTML = '';
    
    if (!relicInventory || relicInventory.length === 0) {
        inventoryGrid.innerHTML = '<div class="inventory-empty-msg">No relics in inventory. Add one to get started!</div>';
        return;
    }

    const frag = document.createDocumentFragment();

    const sortedInventory = [...relicInventory].sort((a, b) => {
        const aH = highlightedRelicIds.has(a.id);
        const bH = highlightedRelicIds.has(b.id);
        if (aH && !bH) return -1;
        if (!aH && bH) return 1;
        return 0; 
    });

    sortedInventory.forEach(relic => {
        const card = document.createElement('div');
        const isHighlighted = highlightedRelicIds.has(relic.id);
        
        card.className = 'relic-card-clean' + (isHighlighted ? ' relic-highlighted' : '');
        
        const visuals = getRelicVisuals(relic.setKey, relic.slot);
        
        let lookupKey = relic.setKey;
        if (lookupKey === 'shadow_reaper_necklace') lookupKey = 'shadow_reaper';
        if (lookupKey === 'reaper_necklace') lookupKey = 'reaper_set';

        let starCount = 0;
        if (lookupKey === 'shadow_reaper' || lookupKey === 'reaper_set') {
            if(relic.stars >= 1.05) starCount = 3;
            else if(relic.stars >= 1.025) starCount = 2;
            else if(relic.stars >= 1) starCount = 1; 
        }

        const setObj = SETS.find(s => s.id === lookupKey) || SETS[0];
        
        const mainVal = calculateMainValue(relic);
        const mainBadge = getBadgeHtml(relic.mainStat, mainVal);
        
        const subList = Object.entries(relic.subs)
            .map(([k, v]) => ({ type: k, val: v }))
            .sort((a,b) => (b.type === 'dmg' ? 1 : 0) - (a.type === 'dmg' ? 1 : 0)); // simple priority sort
            
        const subHtml = subList.length 
            ? subList.map(s => getBadgeHtml(s.type, s.val)).join('') 
            : '<span class="rc-empty-subs">No Sub Stats</span>';

        card.innerHTML = `
            <div class="rc-header">
                <div class="rc-set-info">
                    <span class="rc-set-name">${setObj.name}</span>
                    <span class="rc-stars">${starCount > 0 ? "★".repeat(starCount) : ""}</span>
                </div>
                <button class="rc-delete-btn" title="Delete">×</button>
            </div>
            <div class="rc-visual-container">
                <div class="rc-image-wrapper" style="background: ${visuals.bg}">
                    <img src="${visuals.src}" class="rc-image" onerror="console.warn('Missing Relic Image:', this.src); this.style.display='none'">
                    <div class="rc-slot-badge">${relic.slot}</div>
                </div>
            </div>
            <div class="rc-stats-container">
                <div class="rc-main-stat">
                    <div class="rc-label" style="font-size: 0.75rem;">MAIN STAT</div>
                    <div class="rc-main-badge-wrapper">${mainBadge}</div>
                </div>
                <div class="rc-separator"></div>
                <div class="rc-sub-stats">
                    <div class="rc-label" style="font-size: 0.75rem;">SUB STATS</div>
                    <div class="rc-subs-grid">${subHtml}</div>
                </div>
            </div>
        `;

        card.querySelector('.rc-delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRelic(relic.id);
        });

        frag.appendChild(card);
    });
    
    inventoryGrid.appendChild(frag);
}