// ============================================================================
// INVENTORY.JS - Relic Inventory Management (Refactored)
// ============================================================================

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

// Refactored to use Constants dynamically
function getSlotOptions(slot, starMult = 1) {
    const opts = [];
    
    // Helper to format option
    const makeOpt = (key, baseVal) => ({ 
        value: key, 
        text: `${STAT_LABELS[getStatType(key)] || key.toUpperCase()} (${(baseVal * starMult).toFixed(1)}%)` 
    });

    if (slot === 'Head') {
        opts.push(makeOpt('potency', 45)); // Head specific constants
        opts.push(makeOpt('elemental', 30));
    } else if (slot === 'Body') {
        Object.entries(MAIN_STAT_VALS.body).forEach(([key, val]) => opts.push(makeOpt(key, val)));
    } else if (slot === 'Legs') {
        Object.entries(MAIN_STAT_VALS.legs).forEach(([key, val]) => opts.push(makeOpt(key, val)));
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

let inventoryGrid;
let highlightedRelicIds = new Set(); 

function initInventory() {
    inventoryGrid = document.getElementById('relicGrid');
    
    document.getElementById('openAddRelicBtn')?.addEventListener('click', openAddRelicModal);
    document.getElementById('addRelicConfirmBtn')?.addEventListener('click', addRelic);
    document.getElementById('addRelicCancelBtn')?.addEventListener('click', () => closeModal('addRelicModal'));
    
    setupModalInputs();
    loadInventory();
    renderInventory();
    updateInventoryToggleState();

    // Update static labels for Crit Dmg and Crit Rate
    document.querySelectorAll('.sub-label.sub-cm').forEach(el => el.textContent = 'Crit Dmg');
    document.querySelectorAll('.sub-label.sub-cf').forEach(el => el.textContent = 'Crit Rate');
}

function saveInventory() {
    try { localStorage.setItem(RELIC_STORAGE_KEY, JSON.stringify(relicInventory)); } catch (e) { console.error(e); }
}

function loadInventory() {
    try {
        const stored = localStorage.getItem(RELIC_STORAGE_KEY);
        relicInventory = stored ? JSON.parse(stored) : [];
    } catch (e) { relicInventory = []; }
}

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
            input.disabled = true; input.checked = false;
            label.classList.add('disabled'); label.classList.remove('is-checked');
            label.title = "Inventory is empty. Add relics to enable.";
        } else {
            input.disabled = false; label.classList.remove('disabled');
            label.title = "Calculate using ONLY relics from your Inventory";
            if (typeof inventoryMode !== 'undefined') {
                input.checked = inventoryMode;
                label.classList.toggle('is-checked', inventoryMode);
            }
        }
    });
}

function updateSetOptions(slot) {
    const setSelect = document.getElementById('newRelicSet');
    if (!setSelect) return;
    const currentSelection = setSelect.value;
    const invalidHeadSets = ['laughing', 'ex'];
    const filteredSets = SETS.filter(s => slot === 'Head' ? !invalidHeadSets.includes(s.id) : true);

    setSelect.innerHTML = filteredSets.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    if (filteredSets.some(s => s.id === currentSelection)) setSelect.value = currentSelection;
    else if (filteredSets.length > 0) setSelect.value = filteredSets[0].id;

    updateStarVisibility();
}

// Logic replaced by attachStatScaler in utils.js
// function capStatInput(...) {} 

function updateStarVisibility() {
    const setId = document.getElementById('newRelicSet').value;
    const starSelect = document.getElementById('newRelicStars');
    if (!starSelect) return;

    const showStars = (setId === 'shadow_reaper' || setId === 'reaper_set');
    if (showStars) starSelect.parentElement.classList.remove('hidden');
    else { starSelect.parentElement.classList.add('hidden'); starSelect.value = "1"; }
    
    // Trigger input validation/capping via simulated input or re-attach
    // Actually handled by the change listener in setupModalInputs calling updateSubStatValues
}

function lockConflictingSubStat(mainStatValue) {
    // Normalize mainStatValue (e.g. 'crit rate' -> 'cf' if needed, though values are keys)
    const normKey = normalizeStatKey(mainStatValue);
    const targetId = REVERSE_STAT_MAPPING[normKey];
    
    Object.keys(STAT_MAPPING).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const shouldDisable = (id === targetId);
        el.disabled = shouldDisable;
        el.parentElement.classList.toggle('disabled', shouldDisable);
        if (shouldDisable) {
            el.value = '';
            el.removeAttribute('data-base-val');
        }
    });
}

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
        starSelect.innerHTML = `<option value="1">1★</option><option value="1.025">2★</option><option value="1.05">3★</option>`;
        starSelect.addEventListener('change', () => {
            const newMult = parseFloat(starSelect.value) || 1;
            updateMainStatOptions(document.getElementById('newRelicSlot').value);
            updateSubStatValues(newMult);
        });
    }

    // SHARED INPUT SCALING LOGIC
    // Define a getter for the current multiplier
    const getModalStarMult = () => parseFloat(document.getElementById('newRelicStars').value) || 1;

    Object.keys(STAT_MAPPING).forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Attach shared scaler from utils.js
            attachStatScaler(input, getModalStarMult);
        }
    });
}

// --- Modal Actions ---

function openAddRelicModal() {
    document.querySelectorAll('#addRelicModal input[type="number"]').forEach(inp => {
        inp.value = '';
        inp.removeAttribute('data-base-val');
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

    if (typeof resetAndRender === 'function') resetAndRender();
    closeModal('addRelicModal');
}

function deleteRelic(id) {
    if (confirm('Delete this relic?')) {
        relicInventory = relicInventory.filter(r => r.id !== id);
        saveInventory();
        renderInventory();
        updateInventoryToggleState();
        if (typeof resetAndRender === 'function') resetAndRender();
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
        return { src: `images/Relic/${customImages[visualKey][slot]}`, bg: RELIC_COLORS[visualKey] || RELIC_COLORS.default };
    }
    return { src: `images/relic/${visualKey}_${slot.toLowerCase()}.png`, bg: RELIC_COLORS[visualKey] || RELIC_COLORS.default };
}

function calculateMainValue(relic) {
    let base = 0;
    if (relic.mainStat === 'potency') base = 45;
    else if (relic.mainStat === 'elemental') base = 30;
    else if (MAIN_STAT_VALS.body[relic.mainStat]) base = MAIN_STAT_VALS.body[relic.mainStat];
    else if (MAIN_STAT_VALS.legs[relic.mainStat]) base = MAIN_STAT_VALS.legs[relic.mainStat];
    return base * (relic.stars || 1);
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
window.clearInventoryHighlights = () => { highlightedRelicIds.clear(); renderInventory(); };

function renderInventory() {
    if (!inventoryGrid) return;
    inventoryGrid.innerHTML = '';
    
    if (!relicInventory || relicInventory.length === 0) {
        inventoryGrid.innerHTML = '<div class="inventory-empty-msg">No relics in inventory. Add one to get started!</div>';
        return;
    }

    const frag = document.createDocumentFragment();

    const sortedInventory = [...relicInventory].sort((a, b) => {
        const aH = highlightedRelicIds.has(a.id), bH = highlightedRelicIds.has(b.id);
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
        // Unified Badge Usage
        const mainBadge = getBadgeHtml(relic.mainStat, mainVal);
        
        // Prepare Sub Stats for Rich Badge
        const subData = Object.entries(relic.subs).map(([k, v]) => ({ type: k, val: v }));
        const subBadges = subData.map(s => getBadgeHtml(s.type, s.val)).join('');

        card.innerHTML = `
            <div class="rc-header">
                <div class="rc-set-info"><span class="rc-set-name">${setObj.name}</span><span class="rc-stars">${starCount > 0 ? "★".repeat(starCount) : ""}</span></div>
                <button class="rc-opt-btn" title="Check Optimality" style="background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; transition: background 0.2s;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                </button>
                <button class="rc-delete-btn" title="Delete">×</button>
            </div>
            <div class="rc-visual-container">
                <div class="rc-image-wrapper" style="background: ${visuals.bg}">
                    <img src="${visuals.src}" class="rc-image" onerror="this.style.display='none'">
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
                    <div class="rc-subs-grid" style="display: flex; flex-wrap: wrap; gap: 4px;">${subBadges}</div>
                </div>
            </div>
        `;

        card.querySelector('.rc-delete-btn').addEventListener('click', (e) => { e.stopPropagation(); deleteRelic(relic.id); });
        card.querySelector('.rc-opt-btn').addEventListener('click', (e) => { e.stopPropagation(); checkOptimality(relic.id); });
        frag.appendChild(card);
    });
    
    inventoryGrid.appendChild(frag);
}

function checkOptimality(relicId) {
    const relic = relicInventory.find(r => r.id === relicId);
    if (!relic) return;

    // Build Modal Content
    const unitOptions = unitDatabase.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const traitOptions = traitsList.filter(t => t.id !== 'none').map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    const content = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <div class="text-sm text-dim mb-1">Analyzing Relic:</div>
                <div class="text-white text-bold">${SETS.find(s=>s.id===relic.setKey)?.name || relic.setKey} (${relic.slot})</div>
                <div class="text-xs text-gold">${relic.mainStat.toUpperCase()} ${relic.stars}★</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="input-group" style="margin: 0;">
                    <label style="font-size: 0.75rem; color: #aaa;">Compare Context (Unit)</label>
                    <select id="optUnitSelect" class="modal-select" style="padding: 4px;">${unitOptions}</select>
                </div>
                <div class="input-group" style="margin: 0;">
                    <label style="font-size: 0.75rem; color: #aaa;">Trait</label>
                    <select id="optTraitSelect" class="modal-select" style="padding: 4px;">${traitOptions}</select>
                </div>
            </div>
        </div>
        <div id="optResultArea" class="hidden" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="position: relative; width: 70px; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.05); border: 2px solid #555;" id="optCircle">
                <span id="optPercent" style="font-size: 1.2rem; font-weight: bold; color: #fff;">0%</span>
                <small style="font-size: 0.6rem; color: #aaa; text-transform: uppercase;">Optimality</small>
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Current DPS:</span> <span id="optCurrent" class="text-white">-</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Potential DPS:</span> <span id="optMax" class="text-gold">-</span></div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);"><span class="text-xs text-dim">Best Stat for Slot:</span> <span id="optBestStat" class="text-xs text-accent-start">-</span></div>
                <div id="optSuggestion" class="text-xs text-dim mt-1" style="margin-top: 6px; font-style: italic;"></div>
            </div>
        </div>
    `;

    showUniversalModal({
        title: 'RELIC OPTIMALITY',
        content: content,
        footerButtons: `<button class="action-btn" onclick="runOptimalityCalc('${relicId}')">Calculate</button><button class="action-btn secondary" onclick="closeModal('universalModal')">Close</button>`,
        size: 'modal-sm'
    });

    // Set default unit if selected
    if (currentCalcUnitId) document.getElementById('optUnitSelect').value = currentCalcUnitId;
    else if (selectedUnitIds.size > 0) document.getElementById('optUnitSelect').value = Array.from(selectedUnitIds)[0];
}

window.runOptimalityCalc = function(relicId) {
    const relic = relicInventory.find(r => r.id === relicId);
    if (!relic) return;

    const unitId = document.getElementById('optUnitSelect').value;
    const traitId = document.getElementById('optTraitSelect').value;
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    // 1. Setup Context
    const { effectiveStats, context } = buildCalculationContext(unit, traitId, {
        isAbility: activeAbilityIds.has(unitId),
        headPiece: (relic.slot === 'Head') ? relic.setKey : 'none'
    });

    const starMult = relic.stars || 1;

    // 2. Calculate CURRENT DPS
    const buildCurrentStats = () => {
        let stats = { set: relic.setKey, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0 };
        const mainBase = relic.slot === 'Body' ? MAIN_STAT_VALS.body[relic.mainStat] : MAIN_STAT_VALS.legs[relic.mainStat];
        if (mainBase) stats[relic.mainStat] = mainBase * starMult;
        Object.entries(relic.subs).forEach(([k, v]) => { if (stats[k] !== undefined) stats[k] += v; });
        return stats;
    };
    const currentRes = calculateDPS(effectiveStats, buildCurrentStats(), context);

    // 3. Find BENCHMARK (Absolute Best possible piece for this unit)
    let maxScore = 0;
    let bestConfig = { set: '', main: '', sub: '', filler: [] };

    const candidates = ['dmg', 'spa', 'range', 'cm', 'cf', 'dot'].filter(c => {
        if (c === 'dot' && !statConfig.applyRelicDot) return false;
        if ((c === 'cm' || c === 'cf') && !statConfig.applyRelicCrit) return false;
        return true;
    });

    // Scan every set to find the absolute ceiling for this unit
    SETS.forEach(set => {
        candidates.forEach(masterStat => {
            let benchStats = { set: set.id, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0 };
            
            const slotMains = relic.slot === 'Body' ? MAIN_STAT_VALS.body : MAIN_STAT_VALS.legs;
            let bestMain = 'dmg';
            let bestMainDps = 0;
            
            Object.keys(slotMains).forEach(mKey => {
                let temp = { ...benchStats, [mKey]: slotMains[mKey] * starMult };
                let res = calculateDPS(effectiveStats, temp, context);
                if (res.total > bestMainDps) { bestMainDps = res.total; bestMain = mKey; }
            });
            benchStats[bestMain] = slotMains[bestMain] * starMult;

            // Apply 1 Master Stat (6 Rolls)
            benchStats[masterStat] += MAX_SUB_STAT_VALUES[masterStat] * starMult;

            // Apply 3 Filler Stats (1 Roll Each) for a "Legal" God Roll
            let fillers = candidates.filter(c => c !== masterStat && c !== bestMain);
            let fillerDpsMap = fillers.map(fKey => {
                let temp = { ...benchStats, [fKey]: PERFECT_SUBS[fKey] * starMult };
                return { key: fKey, dps: calculateDPS(effectiveStats, temp, context).total };
            }).sort((a,b) => b.dps - a.dps);

            const top3Fillers = fillerDpsMap.slice(0, 3);
            top3Fillers.forEach(f => benchStats[f.key] += PERFECT_SUBS[f.key] * starMult);

            let finalBenchRes = calculateDPS(effectiveStats, benchStats, context);
            if (finalBenchRes.total > maxScore) {
                maxScore = finalBenchRes.total;
                bestConfig = { set: set.name, main: bestMain, sub: masterStat, filler: top3Fillers };
            }
        });
    });

    // 4. Update UI Display
const pct = (currentRes.total / maxScore) * 100;
document.getElementById('optResultArea').classList.remove('hidden');
document.getElementById('optPercent').innerText = pct.toFixed(1) + '%';
document.getElementById('optCurrent').innerText = format(currentRes.total);
document.getElementById('optMax').innerText = format(maxScore);

// Calculate exact values for the God-Roll
const mainVal = (relic.slot === 'Body' ? MAIN_STAT_VALS.body[bestConfig.main] : MAIN_STAT_VALS.legs[bestConfig.main]) * starMult;
const masterVal = MAX_SUB_STAT_VALUES[bestConfig.sub] * starMult;

// Create styled badges for every stat using the unified helper
const mainBadge = getBadgeHtml(bestConfig.main, mainVal);
const masterBadge = getBadgeHtml(bestConfig.sub, masterVal);
const fillerHtml = bestConfig.filler.map(f => {
    const val = PERFECT_SUBS[f.key] * starMult;
    return getBadgeHtml(f.key, val);
}).join('');

document.getElementById('optBestStat').innerHTML = `
    <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
        <div class="text-xs text-dim mb-2" style="letter-spacing:1px; font-weight: 800; opacity: 0.6;">BENCHMARK GOD-ROLL (100%):</div>
        <div style="display:flex; flex-direction:column; gap:8px; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
            <div class="text-white text-bold" style="font-size: 13px; margin-bottom: 2px;">${bestConfig.set} (${relic.slot})</div>
            
            <div class="text-xs" style="display:flex; align-items:center; gap:8px;">
                <span style="width: 50px; opacity: 0.7;">Main:</span> ${mainBadge}
            </div>
            
            <div class="text-xs" style="display:flex; align-items:center; gap:8px;">
                <span style="width: 50px; opacity: 0.7;">Master:</span> ${masterBadge}
            </div>
            
            <div class="text-xs" style="display:flex; align-items:flex-start; gap:8px;">
                <span style="width: 50px; opacity: 0.7; margin-top: 3px;">Base:</span> 
                <div style="display:flex; flex-wrap:wrap; gap:4px;">${fillerHtml}</div>
            </div>
        </div>
    </div>
`;

const circle = document.getElementById('optCircle');
const color = pct >= 95 ? '#4ade80' : pct >= 80 ? '#fbbf24' : '#f87171';
circle.style.borderColor = color;
document.getElementById('optPercent').style.color = color;
};

function renderInventory() {
    if (!inventoryGrid) return;
    inventoryGrid.innerHTML = '';
    
    if (!relicInventory || relicInventory.length === 0) {
        inventoryGrid.innerHTML = '<div class="inventory-empty-msg">No relics in inventory. Add one to get started!</div>';
        return;
    }

    const frag = document.createDocumentFragment();
    relicInventory.forEach(relic => {
        const card = document.createElement('div');
        card.className = 'relic-card-clean' + (highlightedRelicIds.has(relic.id) ? ' relic-highlighted' : '');
        
        const visuals = getRelicVisuals(relic.setKey, relic.slot);
        const setObj = SETS.find(s => s.id === (relic.setKey.includes('reaper') ? (relic.setKey.includes('shadow') ? 'shadow_reaper' : 'reaper_set') : relic.setKey)) || SETS[0];
        
        const starCount = relic.stars >= 1.05 ? 3 : relic.stars >= 1.025 ? 2 : 1;
        const mainBadge = getBadgeHtml(relic.mainStat, calculateMainValue(relic));
        const subBadges = Object.entries(relic.subs).map(([k, v]) => getBadgeHtml(k, v)).join('');

        card.innerHTML = `
            <div class="rc-header">
                <div class="rc-set-info"><span class="rc-set-name">${setObj.name}</span><span class="rc-stars">${starCount > 0 ? "★".repeat(starCount) : ""}</span></div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="rc-opt-btn" onclick="event.stopPropagation(); checkOptimality('${relic.id}')">
                        <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                        OPTIMALITY
                    </button>
                    <button class="rc-delete-btn" onclick="event.stopPropagation(); deleteRelic('${relic.id}')">×</button>
                </div>
            </div>
            <div class="rc-visual-container">
                <div class="rc-image-wrapper" style="background: ${visuals.bg}">
                    <img src="${visuals.src}" class="rc-image">
                    <div class="rc-slot-badge">${relic.slot}</div>
                </div>
            </div>
            <div class="rc-stats-container">
                <div class="rc-main-stat"><div class="rc-label">MAIN STAT</div>${mainBadge}</div>
                <div class="rc-separator"></div>
                <div class="rc-sub-stats"><div class="rc-label">SUB STATs</div><div class="rc-subs-grid">${subBadges}</div></div>
            </div>
        `;
        frag.appendChild(card);
    });
    inventoryGrid.appendChild(frag);
}