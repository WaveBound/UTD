// ============================================================================
// CALCULATOR.JS - Custom Calculator Modal Logic
// ============================================================================

// --- HELPER FUNCTIONS ---

// Update card sub-stats with blocking logic
function updateCardSubs(card, blockStatType) {
    const inputs = card.querySelectorAll('input.sub-val-input');
    
    const allCards = document.querySelectorAll('#calcModal .gear-card');
    let cardIndex = -1;
    for (let i = 0; i < allCards.length; i++) {
        if (allCards[i] === card) {
            cardIndex = i;
            break;
        }
    }
    
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');
    
    let starMult = 1;
    // Check classes instead of style.display
    if (cardIndex === 0) starMult = (!headStarsSelect.classList.contains('hidden')) ? parseFloat(headStarsSelect.value) : 1;      
    else if (cardIndex === 1) starMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;  
    else if (cardIndex === 2) starMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;  

    inputs.forEach(input => {
        const statType = input.dataset.stat;
        if (statType === blockStatType) {
            input.value = 0;
            input.parentElement.classList.add('disabled'); 
            input.disabled = true; 
        } else {
            input.value = parseFloat((PERFECT_SUBS[statType] * starMult).toFixed(3));
            input.parentElement.classList.remove('disabled');
            input.disabled = false;
        }
    });
}

// Update calculator UI with star multipliers
function updateCalcUI() {
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
                input.value = 0;
                return;
            }

            const type = input.dataset.stat;
            const base = PERFECT_SUBS[type];
            if (base) {
                input.value = parseFloat((base * mult).toFixed(3)); 
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
                
                let name = "Unknown";
                if(type==='dmg') name="Damage";
                if(type==='dot') name="DoT";
                if(type==='cm') name="Crit Dmg";
                if(type==='spa') name="SPA";
                if(type==='cf') name="Crit Rate";
                if(type==='range') name="Range";
                
                const sign = (type === 'spa') ? '-' : '+';
                opt.text = `${name} ${sign}${newVal}%`;
            }
        });
    };

    updateSelect('calcBodyMain', MAIN_STAT_VALS.body, bodyStarMult);
    updateSelect('calcLegsMain', MAIN_STAT_VALS.legs, legsStarMult);
}

// Helper: Enforce Max Value on Input
function enforceMax(el) {
    el.oninput = () => {
        let val = parseFloat(el.value);
        const max = parseFloat(el.max);
        const min = parseFloat(el.min);
        
        if (isNaN(val)) return;

        if (val < min) el.value = min;
        else if (val > max) el.value = max;
    };
    // Also enforce on blur to catch any edge cases
    el.onblur = () => {
        let val = parseFloat(el.value);
        const max = parseFloat(el.max);
        if (val > max) el.value = max;
    };
}

// --- MAIN FUNCTIONS ---

// Open custom calculator modal
function openCalc(unitId) {
    currentCalcUnitId = unitId;
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    document.getElementById('calcUnitImg').src = unit.img;
    document.getElementById('calcUnitName').innerText = unit.name;
    document.getElementById('calcUnitRole').innerText = unit.role + (unit.stats.element ? ` • ${unit.stats.element}` : '');
    
    const traitSelect = document.getElementById('calcTrait');
    traitSelect.innerHTML = '';
    const allTraits = [...traitsList, ...customTraits, ...(unitSpecificTraits[unitId] || [])];
    const uniqueTraits = allTraits.filter((t, index, self) => 
        index === self.findIndex((x) => x.id === t.id) && t.id !== 'none'
    );
    uniqueTraits.forEach(t => {
        traitSelect.add(new Option(t.name, t.id));
    });

    const setSelect = document.getElementById('calcSet');
    if (setSelect.options.length === 0) { 
        SETS.forEach(s => {
            setSelect.add(new Option(s.name, s.id));
        });
    }

    const headSelect = document.getElementById('calcHead');
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');

    const updateHeadStarVisibility = () => {
        const headVal = headSelect.value;
        const showStars = (headVal === 'reaper_necklace' || headVal === 'shadow_reaper_necklace');
        
        // Use classes instead of style.display
        if (showStars) headStarsSelect.classList.remove('hidden');
        else headStarsSelect.classList.add('hidden');

        if (!showStars) headStarsSelect.value = '1.05';
        updateCalcUI();
    };

    const updateBodyStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        
        if (showStars) bodyStarsSelect.classList.remove('hidden');
        else bodyStarsSelect.classList.add('hidden');

        if (!showStars) bodyStarsSelect.value = '1.05';
        updateCalcUI();
    };

    const updateLegsStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        
        if (showStars) legsStarsSelect.classList.remove('hidden');
        else legsStarsSelect.classList.add('hidden');

        if (!showStars) legsStarsSelect.value = '1.05';
        updateCalcUI();
    };

    headSelect.onchange = updateHeadStarVisibility;
    setSelect.onchange = () => {
        updateBodyStarVisibility();
        updateLegsStarVisibility();
    };
    headStarsSelect.onchange = updateCalcUI;
    bodyStarsSelect.onchange = updateCalcUI;
    legsStarsSelect.onchange = updateCalcUI;

    // RESET POINTS INPUTS
    document.getElementById('calcDmgPoints').value = 0;
    document.getElementById('calcSpaPoints').value = 0;
    document.getElementById('calcRangePoints').value = 0; 

    // RESET RANK INPUTS (Default to SSS max values)
    document.getElementById('calcRankDmg').value = 20;
    document.getElementById('calcRankSpa').value = 8;
    document.getElementById('calcRankRange').value = 20;
    
    if (unit.meta && unit.meta.long) {
        traitSelect.value = unit.meta.long;
    } else if (unit.meta && unit.meta.short) {
        traitSelect.value = unit.meta.short;
    }

    // Hide result area initially via class
    document.getElementById('calcResultArea').classList.add('hidden');

    const calcBodyMain = document.getElementById('calcBodyMain');
    const calcLegsMain = document.getElementById('calcLegsMain');

    calcBodyMain.onchange = () => {
        const main = calcBodyMain.value;
        const card = document.querySelectorAll('#calcModal .gear-card')[1];
        updateCardSubs(card, main);
        updateCalcUI(); 
    };

    calcLegsMain.onchange = () => {
        const main = calcLegsMain.value;
        const card = document.querySelectorAll('#calcModal .gear-card')[2];
        updateCardSubs(card, main);
        updateCalcUI();
    };

    // Initial locking
    updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[1], calcBodyMain.value);
    updateCardSubs(document.querySelectorAll('#calcModal .gear-card')[2], calcLegsMain.value);
    
    updateHeadStarVisibility();
    updateBodyStarVisibility();
    updateLegsStarVisibility();
    updateCalcUI();

    // Attach input listeners for sub-stat capping (Gear Cards)
    const subStatInputs = document.querySelectorAll('#calcModal .gear-subs input.sub-val-input');
    subStatInputs.forEach(inputElement => {
        inputElement.oninput = () => {
            let value = parseFloat(inputElement.value);
            // Ensure value is not negative
            if (value < 0) {
                inputElement.value = 0;
                value = 0;
            }

            const statKey = inputElement.dataset.stat;
            const baseMaxValue = MAX_SUB_STAT_VALUES[statKey];

            // Determine which star multiplier to use based on the parent gear card
            let starMult = 1;
            const parentCard = inputElement.closest('.gear-card');
            if (parentCard) {
                const allCards = document.querySelectorAll('#calcModal .gear-card');
                const cardIndex = Array.from(allCards).indexOf(parentCard);

                const headStarsSelect = document.getElementById('calcHeadStars');
                const bodyStarsSelect = document.getElementById('calcBodyStars');
                const legsStarsSelect = document.getElementById('calcLegsStars');

                if (cardIndex === 0) starMult = (!headStarsSelect.classList.contains('hidden')) ? parseFloat(headStarsSelect.value) : 1;      
                else if (cardIndex === 1) starMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;  
                else if (cardIndex === 2) starMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;  
            }

            const dynamicMaxValue = baseMaxValue * starMult;

            if (baseMaxValue !== undefined && value > dynamicMaxValue) {
                inputElement.value = dynamicMaxValue.toFixed(3); // Apply capping with star multiplier
            }
        };
    });

    // Apply capping logic to Points and Ranks
    [
        document.getElementById('calcDmgPoints'),
        document.getElementById('calcSpaPoints'),
        document.getElementById('calcRangePoints'),
        document.getElementById('calcRankDmg'),
        document.getElementById('calcRankSpa'),
        document.getElementById('calcRankRange')
    ].forEach(enforceMax);

    toggleModal('calcModal', true);
}

// Run custom calculation
function runCustomCalc() {
    try {
        const unit = unitDatabase.find(u => u.id === currentCalcUnitId);
        if (!unit) { 
            alert("Error: Unit not found."); 
            return; 
        }

        const dmgPoints = parseInt(document.getElementById('calcDmgPoints').value) || 0;
        const spaPoints = parseInt(document.getElementById('calcSpaPoints').value) || 0;
        const rangePoints = parseInt(document.getElementById('calcRangePoints').value) || 0;

        // NEW: Rank Inputs
        const rankDmg = parseFloat(document.getElementById('calcRankDmg').value) || 0;
        const rankSpa = parseFloat(document.getElementById('calcRankSpa').value) || 0;
        const rankRange = parseFloat(document.getElementById('calcRankRange').value) || 0;

        const traitId = document.getElementById('calcTrait').value;
        const setId = document.getElementById('calcSet').value;
        const headId = document.getElementById('calcHead').value;
        
        const bodyMain = document.getElementById('calcBodyMain').value;
        const legsMain = document.getElementById('calcLegsMain').value;

        const headStarsSelect = document.getElementById('calcHeadStars');
        const bodyStarsSelect = document.getElementById('calcBodyStars');
        const legsStarsSelect = document.getElementById('calcLegsStars');
        
        // Check classes instead of style
        const headStarMult = (!headStarsSelect.classList.contains('hidden')) ? parseFloat(headStarsSelect.value) : 1;
        const bodyStarMult = (!bodyStarsSelect.classList.contains('hidden')) ? parseFloat(bodyStarsSelect.value) : 1;
        const legsStarMult = (!legsStarsSelect.classList.contains('hidden')) ? parseFloat(legsStarsSelect.value) : 1;

        let totalStats = {
            set: setId, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0
        };

        const addMain = (type, slot, mult) => {
            const base = MAIN_STAT_VALS[slot][type];
            if (base) {
                totalStats[type] += base * mult;
            }
        };
        addMain(bodyMain, 'body', bodyStarMult);
        addMain(legsMain, 'legs', legsStarMult);

        const subInputs = document.querySelectorAll('#calcModal .gear-subs input');
        subInputs.forEach(input => {
            const stat = input.dataset.stat;
            const value = parseFloat(input.value) || 0;
            if (stat && value > 0) {
                totalStats[stat] += value;
            }
        });

        let traitObj = traitsList.find(t => t.id === traitId) || 
                       customTraits.find(t => t.id === traitId) || 
                       (unitSpecificTraits[unit.id] || []).find(t => t.id === traitId);
        if (!traitObj) traitObj = traitsList.find(t => t.id === 'ruler');

        let effectiveStats = { ...unit.stats };
        if (activeAbilityIds.has(unit.id) && unit.ability) {
            Object.assign(effectiveStats, unit.ability);
        }
        if(unit.tags) effectiveStats.tags = unit.tags;

        const isKiritoVR = (unit.id === 'kirito' && kiritoState.realm);
        if (unit.id === 'kirito' && isKiritoVR && kiritoState.card) { 
            effectiveStats.dot = 200; 
            effectiveStats.dotDuration = 4; 
            effectiveStats.dotStacks = 1; 
        }

        const context = {
            dmgPoints: dmgPoints,
            spaPoints: spaPoints,
            rangePoints: rangePoints, 
            wave: 25,
            isBoss: false,
            traitObj: traitObj,
            placement: Math.min(unit.placement, traitObj.limitPlace || unit.placement),
            // UPDATED: Pass Rank Data explicitly, disable isSSS boolean flag
            rankData: { dmg: rankDmg, spa: rankSpa, range: rankRange },
            isSSS: false, // math.js will use rankData instead
            headPiece: headId,
            isVirtualRealm: isKiritoVR,
            starMult: bodyStarMult
        };

        const result = calculateDPS(effectiveStats, totalStats, context);

        const content = document.getElementById('calcResultContent');
        content.innerHTML = renderMathContent(result);
        
        // Show result area via class removal
        const resultArea = document.getElementById('calcResultArea');
        resultArea.classList.remove('hidden');
        
        const scrollArea = document.querySelector('.modal-scroll-area');
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert("Calculation Error: " + error.message);
    }
}