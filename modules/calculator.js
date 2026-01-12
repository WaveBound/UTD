// ============================================================================
// CALCULATOR.JS - Custom Calculator Modal Logic
// ============================================================================

// --- HELPER FUNCTIONS (Defined globally so openCalc can use them) ---

// Update card sub-stats with blocking logic
function updateCardSubs(card, blockStatType) {
    const inputs = card.querySelectorAll('input.sub-val-input');
    
    // Determine which card this is and get appropriate star multiplier
    const allCards = document.querySelectorAll('#calcModal .gear-card');
    let cardIndex = -1;
    for (let i = 0; i < allCards.length; i++) {
        if (allCards[i] === card) {
            cardIndex = i;
            break;
        }
    }
    
    // Get star multiplier only if the selector is visible
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');
    
    let starMult = 1;
    if (cardIndex === 0) starMult = (headStarsSelect.style.display !== 'none') ? parseFloat(headStarsSelect.value) : 1;      
    else if (cardIndex === 1) starMult = (bodyStarsSelect.style.display !== 'none') ? parseFloat(bodyStarsSelect.value) : 1;  
    else if (cardIndex === 2) starMult = (legsStarsSelect.style.display !== 'none') ? parseFloat(legsStarsSelect.value) : 1;  

    inputs.forEach(input => {
        const statType = input.dataset.stat;
        
        // CHECK: If this input's stat type matches the blocked Main Stat
        if (statType === blockStatType) {
            input.value = 0;
            input.style.opacity = '0.3';
            input.parentElement.style.opacity = '0.5';
            input.parentElement.classList.add('disabled'); // Add class to prevent manual editing
            input.disabled = true; // Disable HTML interaction
        } else {
            // Only auto-fill if not previously manually edited (simplified logic: just reset for now)
            input.value = parseFloat((PERFECT_SUBS[statType] * starMult).toFixed(3));
            input.style.opacity = '1';
            input.parentElement.style.opacity = '1';
            input.parentElement.classList.remove('disabled');
            input.disabled = false;
        }
    });
}

// Update calculator UI with star multipliers
function updateCalcUI() {
    // Get individual star multipliers for each piece - only if visible
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');
    
    const headStarMult = (headStarsSelect.style.display !== 'none') ? parseFloat(headStarsSelect.value) : 1;
    const bodyStarMult = (bodyStarsSelect.style.display !== 'none') ? parseFloat(bodyStarsSelect.value) : 1;
    const legsStarMult = (legsStarsSelect.style.display !== 'none') ? parseFloat(legsStarsSelect.value) : 1;

    // Update sub stat inputs - apply appropriate multiplier based on gear card
    const gearCards = document.querySelectorAll('#calcModal .gear-card');
    
    gearCards.forEach((card, cardIndex) => {
        const inputs = card.querySelectorAll('input.sub-val-input');
        let mult = 1;
        if (cardIndex === 0) mult = headStarMult;      // Head piece
        else if (cardIndex === 1) mult = bodyStarMult;  // Body piece
        else if (cardIndex === 2) mult = legsStarMult;  // Legs piece
        
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

    // Update main stat dropdowns
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

// --- MAIN FUNCTIONS ---

// Open custom calculator modal
function openCalc(unitId) {
    currentCalcUnitId = unitId;
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    // Populate header info
    document.getElementById('calcUnitImg').src = unit.img;
    document.getElementById('calcUnitName').innerText = unit.name;
    document.getElementById('calcUnitRole').innerText = unit.role + (unit.stats.element ? ` • ${unit.stats.element}` : '');
    
    // Populate dropdowns
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

    // Star level toggle logic - individual selectors for each piece
    const headSelect = document.getElementById('calcHead');
    
    const headStarsSelect = document.getElementById('calcHeadStars');
    const bodyStarsSelect = document.getElementById('calcBodyStars');
    const legsStarsSelect = document.getElementById('calcLegsStars');

    // Update star visibility based on head piece selection
    const updateHeadStarVisibility = () => {
        const headVal = headSelect.value;
        const showStars = (headVal === 'reaper_necklace' || headVal === 'shadow_reaper_necklace');
        headStarsSelect.style.display = showStars ? 'block' : 'none';
        if (!showStars) headStarsSelect.value = '1.05';
        updateCalcUI();
    };

    // Update star visibility based on relic set selection
    const updateBodyStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        bodyStarsSelect.style.display = showStars ? 'block' : 'none';
        if (!showStars) bodyStarsSelect.value = '1.05';
        updateCalcUI();
    };

    // Update star visibility based on relic set selection (same as body)
    const updateLegsStarVisibility = () => {
        const setVal = setSelect.value;
        const showStars = (setVal === 'shadow_reaper' || setVal === 'reaper_set');
        legsStarsSelect.style.display = showStars ? 'block' : 'none';
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

    // Reset inputs
    document.getElementById('calcDmgPoints').value = 0;
    document.getElementById('calcSpaPoints').value = 0;
    
    // Auto-select meta trait
    if (unit.meta && unit.meta.long) {
        traitSelect.value = unit.meta.long;
    } else if (unit.meta && unit.meta.short) {
        traitSelect.value = unit.meta.short;
    }

    document.getElementById('calcResultArea').style.display = 'none';

    // Set Up Listeners for Auto-fill based on Main Stat changes
    const calcBodyMain = document.getElementById('calcBodyMain');
    const calcLegsMain = document.getElementById('calcLegsMain');

    calcBodyMain.onchange = () => {
        const main = calcBodyMain.value;
        const card = document.querySelectorAll('#calcModal .gear-card')[1];
        updateCardSubs(card, main);
        updateCalcUI(); // Ensure star scaling applies
    };

    calcLegsMain.onchange = () => {
        const main = calcLegsMain.value;
        const card = document.querySelectorAll('#calcModal .gear-card')[2];
        updateCardSubs(card, main);
        updateCalcUI();
    };
    
    // Initial UI Update
    updateHeadStarVisibility();
    updateBodyStarVisibility();
    updateLegsStarVisibility();
    updateCalcUI();

    // FINALLY: Show the Modal
    toggleModal('calcModal', true);
}

const closeCalc = () => {
    toggleModal('calcModal', false);
};

// Run custom calculation
function runCustomCalc() {
    try {
        const unit = unitDatabase.find(u => u.id === currentCalcUnitId);
        if (!unit) { 
            alert("Error: Unit not found."); 
            return; 
        }

        // Gather inputs
        const dmgPoints = parseInt(document.getElementById('calcDmgPoints').value) || 0;
        const spaPoints = parseInt(document.getElementById('calcSpaPoints').value) || 0;
        const traitId = document.getElementById('calcTrait').value;
        const setId = document.getElementById('calcSet').value;
        const headId = document.getElementById('calcHead').value;
        
        const bodyMain = document.getElementById('calcBodyMain').value;
        const legsMain = document.getElementById('calcLegsMain').value;

        // Capture individual star multipliers - only if visible
        const headStarsSelect = document.getElementById('calcHeadStars');
        const bodyStarsSelect = document.getElementById('calcBodyStars');
        const legsStarsSelect = document.getElementById('calcLegsStars');
        
        const headStarMult = (headStarsSelect.style.display !== 'none') ? parseFloat(headStarsSelect.value) : 1;
        const bodyStarMult = (bodyStarsSelect.style.display !== 'none') ? parseFloat(bodyStarsSelect.value) : 1;
        const legsStarMult = (legsStarsSelect.style.display !== 'none') ? parseFloat(legsStarsSelect.value) : 1;

        // Initialize total relic stats
        let totalStats = {
            set: setId, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0
        };

        // Add main stat values with appropriate star multipliers
        const addMain = (type, slot, mult) => {
            const base = MAIN_STAT_VALS[slot][type];
            if (base) {
                totalStats[type] += base * mult;
            }
        };
        addMain(bodyMain, 'body', bodyStarMult);
        addMain(legsMain, 'legs', legsStarMult);

        // Add all sub stat values
        const subInputs = document.querySelectorAll('#calcModal .gear-subs input');
        subInputs.forEach(input => {
            const stat = input.dataset.stat;
            const value = parseFloat(input.value) || 0;
            if (stat && value > 0) {
                totalStats[stat] += value;
            }
        });

        // Find trait object
        let traitObj = traitsList.find(t => t.id === traitId) || 
                       customTraits.find(t => t.id === traitId) || 
                       (unitSpecificTraits[unit.id] || []).find(t => t.id === traitId);
        if (!traitObj) traitObj = traitsList.find(t => t.id === 'ruler');

        // Prepare unit stats & context
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
            wave: 25,
            isBoss: false,
            traitObj: traitObj,
            placement: Math.min(unit.placement, traitObj.limitPlace || unit.placement),
            isSSS: true,
            headPiece: headId,
            isVirtualRealm: isKiritoVR,
            starMult: bodyStarMult
        };

        // Calculate & render
        const result = calculateDPS(effectiveStats, totalStats, context);

        const content = document.getElementById('calcResultContent');
        content.innerHTML = renderMathContent(result);
        
        const resultArea = document.getElementById('calcResultArea');
        resultArea.style.display = 'block';
        
        const scrollArea = document.querySelector('.modal-scroll-area');
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert("Calculation Error: " + error.message);
    }
}