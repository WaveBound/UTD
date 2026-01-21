// ============================================================================
// CALCULATOR.JS - Custom Calculator Modal Logic
// ============================================================================

// Scale sub-stats when stars change (Refactored to use shared utility)
function scaleCardSubs(cardIndex, newMult) {
    const card = document.querySelectorAll('#calcModal .gear-card')[cardIndex];
    if (!card) return;
    const inputs = card.querySelectorAll('input.sub-val-input');
    inputs.forEach(input => {
        if (!input.disabled && input.value !== '') {
             applyStarScalingToInput(input, newMult);
        }
    });
}

// Update card sub-stats with blocking logic
function updateCardSubs(card, blockStatType, force = false) {
    const inputs = card.querySelectorAll('input.sub-val-input');
    const allCards = document.querySelectorAll('#calcModal .gear-card');
    let cardIndex = -1;
    for (let i = 0; i < allCards.length; i++) { if (allCards[i] === card) { cardIndex = i; break; } }
    
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');
    
    let starMult = 1;
    if (cardIndex === 0) starMult = (!headStarsSelect.classList.contains('hidden')) ? parseFloat(headStarsSelect.value) : 1;      
    else if (cardIndex === 1) starMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;  
    else if (cardIndex === 2) starMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;  

    inputs.forEach(input => {
        const statType = input.dataset.stat;
        if (statType === blockStatType) {
            input.value = 0;
            input.parentElement.classList.add('disabled'); 
            input.disabled = true; 
            trackBaseStatValue(input, starMult); // Track 0 as base
        } else {
            if (force || input.disabled) {
                input.value = parseFloat((PERFECT_SUBS[statType] * starMult).toFixed(3));
                trackBaseStatValue(input, starMult);
            }
            input.parentElement.classList.remove('disabled');
            input.disabled = false;
        }
    });
}

// Update calculator UI with star multipliers
function updateCalcUI(force = false) {
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');
    
    const headStarMult = (!headStarsSelect.classList.contains('hidden')) ? parseFloat(headStarsSelect.value) : 1;
    const bodyStarMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;
    const legsStarMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;

    const gearCards = document.querySelectorAll('#calcModal .gear-card');
    
    gearCards.forEach((card, cardIndex) => {
        const inputs = card.querySelectorAll('input.sub-val-input');
        let mult = 1;
        if (cardIndex === 0) mult = headStarMult;     
        else if (cardIndex === 1) mult = bodyStarMult;  
        else if (cardIndex === 2) mult = legsStarMult;  
        
        inputs.forEach(input => {
            if (input.parentElement.classList.contains('disabled')) {
                input.value = 0; return;
            }
            const type = input.dataset.stat;
            const base = PERFECT_SUBS[type];
            if (base && force) {
                input.value = parseFloat((base * mult).toFixed(3)); 
                trackBaseStatValue(input, mult);
            }
        });
    });

    const updateSelect = (selId, mapping, mult) => {
        const sel = document.getElementById(selId);
        Array.from(sel.options).forEach(opt => {
            const type = opt.value;
            const base = mapping[type];
            if (base) {
                const newVal = parseFloat((base * mult).toFixed(1));
                const label = STAT_LABELS[type] || type;
                const sign = (type === 'spa') ? '-' : '+';
                opt.text = `${label} ${sign}${newVal}%`;
            }
        });
    };

    updateSelect('calcBodyMain', MAIN_STAT_VALS.body, bodyStarMult);
    updateSelect('calcLegsMain', MAIN_STAT_VALS.legs, legsStarMult);
}

function enforceMax(el) {
    el.oninput = () => {
        let val = parseFloat(el.value);
        const max = parseFloat(el.max);
        const min = parseFloat(el.min);
        if (isNaN(val)) return;
        if (val < min) el.value = min; else if (val > max) el.value = max;
    };
    el.onblur = () => {
        let val = parseFloat(el.value);
        const max = parseFloat(el.max);
        if (val > max) el.value = max;
    };
}

// --- MAIN FUNCTIONS ---

function openCalc(unitId) {
    currentCalcUnitId = unitId;
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    document.getElementById('calcUnitImg').src = unit.img;
    document.getElementById('calcUnitName').innerText = unit.name;
    document.getElementById('calcUnitRole').innerText = unit.role + (unit.stats.element ? ` • ${unit.stats.element}` : '');
    
    const traitSelect = document.getElementById('calcTrait');
    traitSelect.innerHTML = '';
    
    // Unified Trait List construction (Global + Custom + Unit Specific)
    const allTraits = [...traitsList, ...customTraits, ...(unitSpecificTraits[unitId] || [])];
    const uniqueTraits = allTraits.filter((t, index, self) => index === self.findIndex((x) => x.id === t.id) && t.id !== 'none');
    
    uniqueTraits.forEach(t => traitSelect.add(new Option(t.name, t.id)));

    const setSelect = document.getElementById('calcSet');
    if (setSelect.options.length === 0) SETS.forEach(s => setSelect.add(new Option(s.name, s.id)));

    const headSelect = document.getElementById('calcHead');
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');

    const updateHeadStarVisibility = () => {
        const headVal = headSelect.value;
        const showStars = (headVal === 'reaper_necklace' || headVal === 'shadow_reaper_necklace');
        headStarsSelect.classList.toggle('hidden', !showStars);
        if (!showStars) headStarsSelect.value = '1';
        updateCalcUI();
    };

    const updateBodyStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        bodyStarsSelect.classList.toggle('hidden', !showStars);
        if (!showStars) bodyStarsSelect.value = '1';
        updateCalcUI();
    };

    const updateLegsStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        legsStarsSelect.classList.toggle('hidden', !showStars);
        if (!showStars) legsStarsSelect.value = '1';
        updateCalcUI();
    };

    headSelect.onchange = updateHeadStarVisibility;
    setSelect.onchange = () => { updateBodyStarVisibility(); updateLegsStarVisibility(); };

    headStarsSelect.onchange = () => { scaleCardSubs(0, parseFloat(headStarsSelect.value)||1); updateCalcUI(); };
    bodyStarsSelect.onchange = () => { scaleCardSubs(1, parseFloat(bodyStarsSelect.value)||1); updateCalcUI(); };
    legsStarsSelect.onchange = () => { scaleCardSubs(2, parseFloat(legsStarsSelect.value)||1); updateCalcUI(); };

    document.getElementById('calcDmgPoints').value = 0;
    document.getElementById('calcSpaPoints').value = 0;
    document.getElementById('calcRangePoints').value = 0; 
    document.getElementById('calcRankDmg').value = 20;
    document.getElementById('calcRankSpa').value = 8;
    document.getElementById('calcRankRange').value = 20;
    traitSelect.value = 'ruler';

    document.getElementById('calcResultArea').classList.add('hidden');

    const calcBodyMain = document.getElementById('calcBodyMain');
    const calcLegsMain = document.getElementById('calcLegsMain');

    calcBodyMain.onchange = () => { 
        updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[1], calcBodyMain.value);
        updateCalcUI(); 
    };
    calcLegsMain.onchange = () => { 
        updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[2], calcLegsMain.value);
        updateCalcUI(); 
    };

    updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[1], calcBodyMain.value, true);
    updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[2], calcLegsMain.value, true);
    
    updateHeadStarVisibility();
    updateBodyStarVisibility();
    updateLegsStarVisibility();
    updateCalcUI(true);

    // Attach input listeners using SHARED Logic
    const subStatInputs = document.querySelectorAll('#calcModal .gear-subs input.sub-val-input');
    subStatInputs.forEach(inputElement => {
        // Dynamic getter for specific card's star multiplier
        const getMyMult = () => {
            const parentCard = inputElement.closest('.gear-card');
            if (!parentCard) return 1;
            const allCards = document.querySelectorAll('#calcModal .gear-card');
            const cardIndex = Array.from(allCards).indexOf(parentCard);
            const hS = document.getElementById('calcHeadStars');
            const bS = document.getElementById('calcBodyStars');
            const lS = document.getElementById('calcLegsStars');
            if (cardIndex === 0) return (!hS.classList.contains('hidden')) ? parseFloat(hS.value) : 1;      
            if (cardIndex === 1) return (!bS.classList.contains('hidden')) ? parseFloat(bS.value) : 1;  
            if (cardIndex === 2) return (!lS.classList.contains('hidden')) ? parseFloat(lS.value) : 1;  
            return 1;
        };

        // Attach shared scaler logic
        attachStatScaler(inputElement, getMyMult);
    });

    [
        document.getElementById('calcDmgPoints'), document.getElementById('calcSpaPoints'), document.getElementById('calcRangePoints'),
        document.getElementById('calcRankDmg'), document.getElementById('calcRankSpa'), document.getElementById('calcRankRange')
    ].forEach(enforceMax);

    toggleModal('calcModal', true);
}

function runCustomCalc() {
    try {
        const unit = unitDatabase.find(u => u.id === currentCalcUnitId);
        if (!unit) { alert("Error: Unit not found."); return; }

        const dmgPoints = parseInt(document.getElementById('calcDmgPoints').value) || 0;
        const spaPoints = parseInt(document.getElementById('calcSpaPoints').value) || 0;
        const rangePoints = parseInt(document.getElementById('calcRangePoints').value) || 0;

        const rankDmg = parseFloat(document.getElementById('calcRankDmg').value) || 0;
        const rankSpa = parseFloat(document.getElementById('calcRankSpa').value) || 0;
        const rankRange = parseFloat(document.getElementById('calcRankRange').value) || 0;

        const traitId = document.getElementById('calcTrait').value;
        const setId = document.getElementById('calcSet').value;
        const headId = document.getElementById('calcHead').value;
        
        const bodyMain = document.getElementById('calcBodyMain').value;
        const legsMain = document.getElementById('calcLegsMain').value;

        const bodyStarsSelect = document.getElementById('calcBodyStars');
        const legsStarsSelect = document.getElementById('calcLegsStars');
        const bodyStarMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;
        const legsStarMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;

        let totalStats = { set: setId, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0 };

        const addMain = (type, slot, mult) => {
            const base = MAIN_STAT_VALS[slot][type];
            if (base) totalStats[type] += base * mult;
        };
        addMain(bodyMain, 'body', bodyStarMult);
        addMain(legsMain, 'legs', legsStarMult);

        const subInputs = document.querySelectorAll('#calcModal .gear-subs input');
        subInputs.forEach(input => {
            const stat = input.dataset.stat;
            const value = parseFloat(input.value) || 0;
            if (stat && value > 0) totalStats[stat] += value;
        });

        // USE UNIFIED CONTEXT BUILDER
        const { effectiveStats, context } = buildCalculationContext(unit, traitId, {
            isAbility: activeAbilityIds.has(unit.id),
            dmgPoints, spaPoints, rangePoints,
            headPiece: headId,
            starMult: bodyStarMult,
            rankData: { dmg: rankDmg, spa: rankSpa, range: rankRange }
        });

        const result = calculateDPS(effectiveStats, totalStats, context);
        document.getElementById('calcResultContent').innerHTML = renderMathContent(result);
        document.getElementById('calcResultArea').classList.remove('hidden');
        
        const scrollArea = document.querySelector('#calcModal .modal-body');
        if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });

    } catch (error) { console.error(error); alert("Calculation Error: " + error.message); }
}