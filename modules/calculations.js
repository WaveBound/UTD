// ============================================================================
// CALCULATIONS.JS - Build Calculation Logic
// ============================================================================

// --- HELPERS ---

/**
 * Shared setup logic for both Standard and Inventory calculations.
 * Prepares unit stats, applies character-specific overrides (Kirito, etc.), and resolves traits.
 */
function initializeCalcContext(unit, specificTraitsOnly, isAbilityContext, mode) {
    // 1. Determine Traits
    let activeTraits = [];
    if (specificTraitsOnly && Array.isArray(specificTraitsOnly)) {
        activeTraits = specificTraitsOnly;
    } else {
        const specificTraits = unitSpecificTraits[unit.id] || [];
        activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    }

    // 2. Prepare Effective Stats
    let effectiveStats = { ...unit.stats };
    if (unit.tags) effectiveStats.tags = unit.tags;
    
    // Apply Ability Stats Overrides
    if (isAbilityContext && unit.ability) {
        Object.assign(effectiveStats, unit.ability);
    }
    
    effectiveStats.id = unit.id;

    // 3. Handle Unit Specific Logic (Kirito/Bambietta)
    const isKiritoVR = (unit.id === 'kirito' && kiritoState.realm);
    
    if (unit.id === 'kirito' && isKiritoVR && kiritoState.card) {
        effectiveStats.dot = 200; 
        effectiveStats.dotDuration = 4; 
        effectiveStats.dotStacks = 1; 
    }
    
    if (unit.id === 'bambietta' && typeof BAMBIETTA_MODES !== 'undefined') {
        const modeStats = BAMBIETTA_MODES[bambiettaState.element];
        if (modeStats) Object.assign(effectiveStats, modeStats);
    }

    // 4. Generate ID Tags
    let suffix = isAbilityContext ? '-ABILITY' : '-BASE';
    if (unit.id === 'kirito') { 
        if (kiritoState.realm) suffix += '-VR'; 
        if (kiritoState.card) suffix += '-CARD'; 
    }
    const modeTag = (mode === 'bugged') ? '-b-' : '-f-';

    return { activeTraits, effectiveStats, isKiritoVR, suffix, modeTag };
}

/**
 * Shared helper to construct the result object.
 */
function createResultEntry({ 
    id, buildName, traitName, res, prio, 
    mainStats, subStats, headUsed, isCustom, 
    relicIds = null 
}) {
    const avgMult = res.critData ? res.critData.avgMult : 1;
    
    const entry = {
        id: id,
        setName: buildName.split('(')[0].trim(),
        traitName: traitName,
        dps: res.total,
        dmgVal: res.dmgVal * avgMult, // Avg hit
        spa: res.spa,
        range: res.range,
        prio: prio,
        mainStats: mainStats, // { body, legs }
        subStats: subStats,
        headUsed: headUsed,
        isCustom: isCustom
    };

    if (relicIds) entry.relicIds = relicIds; // Inventory mode specific
    
    return entry;
}


// --- MAIN FUNCTIONS ---

// Main calculation function for unit builds
function calculateUnitBuilds(unit, _stats, filteredBuilds, subCandidates, headsToProcess, includeSubs, specificTraitsOnly = null, isAbilityContext = false, mode = 'fixed') {
    
    // Branch to Inventory Mode if enabled
    if (inventoryMode && relicInventory && relicInventory.length > 0) {
        return calculateInventoryBuilds(unit, null, specificTraitsOnly, isAbilityContext, mode, headsToProcess, includeSubs);
    }
    
    cachedResults = cachedResults || {};
    
    // Use Shared Initialization
    const { activeTraits, effectiveStats, isKiritoVR, suffix, modeTag } = initializeCalcContext(unit, specificTraitsOnly, isAbilityContext, mode);
    
    let unitResults = [];

    // Pre-calculate DoT capability to filter builds
    const hasNativeDoT = (effectiveStats.dot > 0) || (effectiveStats.burnMultiplier > 0) || isKiritoVR;
    let unitSubCandidates = [...subCandidates];
    if (!hasNativeDoT) {
        unitSubCandidates = unitSubCandidates.filter(c => c !== 'dot');
    }
    
    const subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return; 
        
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);

        const traitAddsDot = trait.dotBuff > 0 || trait.hasRadiation || trait.allowDotStack;
        const isDotPossible = hasNativeDoT || traitAddsDot;
        const currentCandidates = (traitAddsDot) ? subCandidates : unitSubCandidates;
        
        // Filter builds based on DoT relevance
        const relevantBuilds = (!isDotPossible) 
            ? filteredBuilds.filter(b => b.bodyType !== 'dot') 
            : filteredBuilds;

        relevantBuilds.forEach(build => {
            
            // Filter heads if DoT not possible (Ninja head is DoT specific)
            let relevantHeads = headsToProcess;
            if (!isDotPossible) {
                relevantHeads = headsToProcess.filter(h => h !== 'ninja');
            }

            relevantHeads.forEach(headMode => {
                const baseContext = { wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                
                // Helper to run optimization
                const runOpt = (dmgP, spaP, rangeP, optType) => {
                    effectiveStats.context = { ...baseContext, dmgPoints: dmgP, spaPoints: spaP, rangePoints: rangeP };
                    return getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, optType);
                };

                // Run Calculations
                const cfgDmg = runOpt(99, 0, 0, 'dps');
                const cfgSpa = runOpt(0, 99, 0, 'dps');
                const cfgRaw = runOpt(99, 0, 0, 'raw_dmg');
                const cfgRange = runOpt(0, 0, 99, 'range');

                const safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');
                const headSuffix = `-${headMode}`;
                const baseId = `${unit.id}${suffix}-${trait.id}-${safeBuildName}`;

                const processResult = (config, prioStr, forcePush = false) => {
                    const res = config.res;
                    if (isNaN(res.total)) return;
                    
                    // ID Structure: [Unit][Context][Trait][Build][Prio][Subs][Head][MODE]
                    const fullId = `${baseId}-${prioStr}${subsSuffix}${headSuffix}${modeTag}`;
                    cachedResults[fullId] = res;

                    const entry = createResultEntry({
                        id: fullId,
                        buildName: build.name,
                        traitName: trait.name,
                        res: res,
                        prio: prioStr,
                        mainStats: { body: build.bodyType, legs: build.legType },
                        subStats: config.assignments,
                        headUsed: config.assignments.selectedHead,
                        isCustom: trait.isCustom
                    });
                    
                    unitResults.push(entry);
                    return entry;
                };

                // 1. Always push DPS (Dmg Prio)
                const dmgEntry = processResult(cfgDmg, "dmg");

                // 2. Push DPS (Spa Prio) if notably different
                const spaEntry = cfgSpa.res;
                if (Math.abs(spaEntry.total - dmgEntry.dps) > 1) {
                    processResult(cfgSpa, "spa");
                }

                // 3. Push Raw Dmg if different
                const avgHitDmg = dmgEntry.dmgVal; // Already averaged in createResultEntry
                const avgHitRaw = cfgRaw.res.dmgVal * (cfgRaw.res.critData ? cfgRaw.res.critData.avgMult : 1);
                if (Math.abs(avgHitRaw - avgHitDmg) > 10) {
                    processResult(cfgRaw, "raw_dmg");
                }

                // 4. Push Range
                if (unit.id === 'law' || Math.abs(cfgRange.res.range - dmgEntry.range) > 0.1) {
                    processResult(cfgRange, "range");
                }

            }); // End Heads
        }); // End Builds
    }); // End Traits

    unitResults.sort((a, b) => b.dps - a.dps);
    return unitResults;
}

// Inventory Mode Calculation
function calculateInventoryBuilds(unit, _stats, specificTraitsOnly, isAbilityContext, mode, headsToProcess, includeSubs) {
    cachedResults = cachedResults || {};
    
    // Use Shared Initialization
    const { activeTraits, effectiveStats, isKiritoVR, suffix, modeTag } = initializeCalcContext(unit, specificTraitsOnly, isAbilityContext, mode);
    
    let unitResults = [];

    // 1. Separate Inventory by Slot
    const allowHeads = headsToProcess.some(h => h !== 'none');
    
    let heads = allowHeads ? relicInventory.filter(r => r.slot === 'Head') : [];
    const bodies = relicInventory.filter(r => r.slot === 'Body');
    const legs = relicInventory.filter(r => r.slot === 'Legs');

    // Add 'None' options
    heads.push({ id: 'none', slot: 'Head', setKey: 'none', stars: 1, mainStat: 'none', subs: {} });
    if(bodies.length === 0) bodies.push({ id: 'none-b', slot: 'Body', setKey: 'none', stars: 1, mainStat: null, subs: {} }); 
    if(legs.length === 0) legs.push({ id: 'none-l', slot: 'Legs', setKey: 'none', stars: 1, mainStat: null, subs: {} }); 

    // Config tags for IDs
    const cfgTag = `-${allowHeads ? 'H' : 'nH'}-${includeSubs ? 'S' : 'nS'}`;

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return;
        
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);

        const baseContext = { 
            wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, 
            isVirtualRealm: isKiritoVR
        };

        heads.forEach(head => {
            bodies.forEach(body => {
                legs.forEach(leg => {
                    
                    // A. Determine Set Bonus & Star Multiplier
                    let activeSetKey = 'none';
                    let starMult = 1;
                    
                    if (body.setKey !== 'none' && body.setKey === leg.setKey) {
                        activeSetKey = body.setKey;
                        starMult = Math.min(body.stars || 1, leg.stars || 1);
                    }

                    // B. Construct Total Stats Object (Main + Subs)
                    let totalStats = { set: activeSetKey, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0 };
                    const addStat = (type, val) => { if (totalStats[type] !== undefined) totalStats[type] += val; };
                    
                    const getMainVal = (relic) => {
                        let base = 0;
                        if(!relic.mainStat || relic.mainStat === 'none') return 0;
                        if(relic.slot === 'Body') base = MAIN_STAT_VALS.body[relic.mainStat] || 0;
                        if(relic.slot === 'Legs') base = MAIN_STAT_VALS.legs[relic.mainStat] || 0;
                        return base * (relic.stars || 1);
                    };

                    [body, leg].forEach(r => {
                        if (r.id.startsWith('none')) return;
                        addStat(r.mainStat, getMainVal(r));
                        if (includeSubs) Object.entries(r.subs).forEach(([k, v]) => addStat(k, v));
                    });

                    if (head.id !== 'none' && includeSubs) {
                        Object.entries(head.subs).forEach(([k, v]) => addStat(k, v));
                    }

                    // C. Run Calculation Loops (DMG, SPA, RANGE)
                    const calcVariations = [
                        { id: 'dmg',   dmgPts: 99, spaPts: 0,  rangePts: 0 },
                        { id: 'spa',   dmgPts: 0,  spaPts: 99, rangePts: 0 },
                        { id: 'range', dmgPts: 0,  spaPts: 0,  rangePts: 99 } 
                    ];

                    calcVariations.forEach(prio => {
                        effectiveStats.context = { 
                            ...baseContext, 
                            dmgPoints: prio.dmgPts, spaPoints: prio.spaPts, rangePoints: prio.rangePts,
                            headPiece: head.setKey === 'none' ? 'none' : head.setKey, 
                            starMult: starMult 
                        };
                        
                        let res = calculateDPS(effectiveStats, totalStats, effectiveStats.context);

                        const uniqueCombId = `${head.id}_${body.id}_${leg.id}`; 
                        const id = `${unit.id}${suffix}-${trait.id}-INV-${uniqueCombId}${modeTag}${cfgTag}-${prio.id}`;

                        cachedResults[id] = res;

                        // UI Formatting
                        const formatSubs = (relic) => Object.entries(relic.subs).map(([k,v]) => ({ type: k, val: v }));
                        let subStatsUI = {
                            head: (includeSubs && head.id !== 'none') ? formatSubs(head) : null,
                            body: (includeSubs && body.id !== 'none-b') ? formatSubs(body) : null,
                            legs: (includeSubs && leg.id !== 'none-l') ? formatSubs(leg) : null,
                            selectedHead: head.setKey
                        };

                        const setName = activeSetKey !== 'none' ? SETS.find(s=>s.id===activeSetKey)?.name : "Mixed Set";

                        unitResults.push(createResultEntry({
                            id: id,
                            buildName: setName,
                            traitName: trait.name,
                            res: res,
                            prio: prio.id,
                            mainStats: { body: body.mainStat, legs: leg.mainStat },
                            subStats: subStatsUI,
                            headUsed: head.setKey,
                            isCustom: trait.isCustom,
                            relicIds: { head: head.id, body: body.id, legs: leg.id }
                        }));
                    }); // end variation loop

                }); // end leg
            }); // end body
        }); // end head
    }); // end trait

    unitResults.sort((a, b) => b.dps - a.dps);
    return unitResults;
}

function reconstructMathData(liteData) {
    if (!liteData || !liteData.id) throw new Error("Invalid data for reconstruction");

    const unit = unitDatabase.find(u => liteData.id.startsWith(u.id));
    if (!unit) return null;

    // 1. Identify Context from ID Tags
    const isAbility = liteData.id.includes('ABILITY');
    const isVR = liteData.id.includes('VR');
    const isCard = liteData.id.includes('CARD');
    const isBuggedMode = liteData.id.includes('-b-');
    const isFixedMode = liteData.id.includes('-f-');
    const isNoSubsMode = liteData.id.includes('-NOSUBS');

    // Reuse Shared Initialization logic if possible, or manual recreation for pure math reconstruction
    // Here we manually reconstruct because we need to inject the specific mode (bugged/fixed) extracted from ID
    // independent of the current global toggle state.
    
    let effectiveStats = { ...unit.stats };
    effectiveStats.id = unit.id;
    if (unit.tags) effectiveStats.tags = unit.tags;
    
    if (isAbility && unit.ability) Object.assign(effectiveStats, unit.ability);
    
    if (unit.id === 'kirito' && isVR && isCard) {
        effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 1;
    }
    
    if (unit.id === 'bambietta' && typeof BAMBIETTA_MODES !== 'undefined') {
        // Assume default or try to infer, mostly 'Dark' for static reconstruction unless encoded
        Object.assign(effectiveStats, BAMBIETTA_MODES["Dark"]);
    }

    let trait = traitsList.find(t => t.name === liteData.traitName) || 
                (typeof customTraits !== 'undefined' ? customTraits.find(t => t.name === liteData.traitName) : null) ||
                (unitSpecificTraits[unit.id] || []).find(t => t.name === liteData.traitName);
    
    if (!trait) trait = traitsList.find(t => t.id === 'ruler');

    const setEntry = SETS.find(s => s.name === liteData.setName) || SETS[2]; 
    
    let totalStats = { set: setEntry.id, dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0 };

    const mapStatKey = (k) => {
        if (k === 'cdmg' || k === 'crit dmg') return 'cm';
        if (k === 'crit' || k === 'crit rate') return 'cf';
        return k;
    };

    if (liteData.mainStats) {
        if (liteData.mainStats.body) { const k = mapStatKey(liteData.mainStats.body); if (MAIN_STAT_VALS.body[k]) totalStats[k] += MAIN_STAT_VALS.body[k]; }
        if (liteData.mainStats.legs) { const k = mapStatKey(liteData.mainStats.legs); if (MAIN_STAT_VALS.legs[k]) totalStats[k] += MAIN_STAT_VALS.legs[k]; }
    }

    // Determine Logic State based on ID
    let applyDot = statConfig.applyRelicDot;
    let applyCrit = statConfig.applyRelicCrit;

    if (isBuggedMode) { applyDot = false; applyCrit = true; } 
    else if (isFixedMode) { applyDot = true; applyCrit = true; }

    // 1. Add explicitly stored sub-stats
    if (liteData.subStats) {
        ['head', 'body', 'legs'].forEach(slot => {
            if (liteData.subStats[slot] && Array.isArray(liteData.subStats[slot])) {
                liteData.subStats[slot].forEach(sub => {
                    if (sub.type && sub.val) {
                        const k = mapStatKey(sub.type);
                        totalStats[k] = (totalStats[k] || 0) + sub.val;
                    }
                });
            }
        });
    }

    // 2. FILL MISSING BASE STATS (Auto-fill for Static DB)
    const candidates = ['dmg', 'spa', 'range', 'cm', 'cf', 'dot'];
    const validCandidates = candidates.filter(c => {
         if (!applyDot && c === 'dot') return false;
         if (!applyCrit && (c === 'cm' || c === 'cf')) return false;
         return true;
    });

    const addBaseFills = (slot, mainStatType) => {
        const existingTypes = new Set();
        if (liteData.subStats && liteData.subStats[slot] && Array.isArray(liteData.subStats[slot])) {
             liteData.subStats[slot].forEach(s => existingTypes.add(mapStatKey(s.type)));
        }
        const mappedMain = mapStatKey(mainStatType);

        validCandidates.forEach(cand => {
             if (cand === mappedMain) return;
             if (existingTypes.has(cand)) return;
             totalStats[cand] = (totalStats[cand] || 0) + PERFECT_SUBS[cand];
        });
    };

    if (!isNoSubsMode && liteData.headUsed && liteData.headUsed !== 'none') {
        addBaseFills('head', null); 
    }
    if (!isNoSubsMode && liteData.mainStats) {
        addBaseFills('body', liteData.mainStats.body);
        addBaseFills('legs', liteData.mainStats.legs);
    }

    const isSpaPrio = liteData.prio === 'spa';
    const isRangePrio = liteData.prio === 'range';
    let dmgPts = 99, spaPts = 0, rangePts = 0;
    
    if (isSpaPrio) { dmgPts = 0; spaPts = 99; }
    else if (isRangePrio) { dmgPts = 0; spaPts = 0; rangePts = 99; }
    
    let actualPlacement = unit.placement;
    if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);

    const context = {
        dmgPoints: dmgPts, spaPoints: spaPts, rangePoints: rangePts,
        wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true,
        headPiece: liteData.headUsed || (liteData.subStats && liteData.subStats.selectedHead) || 'none',
        isVirtualRealm: (unit.id === 'kirito' && isVR)
    };

    // Swap config temporarily
    const previousDotState = statConfig.applyRelicDot;
    const previousCritState = statConfig.applyRelicCrit;
    statConfig.applyRelicDot = applyDot;
    statConfig.applyRelicCrit = applyCrit;

    const result = calculateDPS(effectiveStats, totalStats, context);

    statConfig.applyRelicDot = previousDotState;
    statConfig.applyRelicCrit = previousCritState;

    return result;
}

window.reconstructMathData = reconstructMathData;