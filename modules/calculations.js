// ============================================================================
// CALCULATIONS.JS - Build Calculation Logic
// ============================================================================

// Main calculation function for unit builds
// UPDATED: Added 'mode' parameter to prevent cache overwrites between bugged/fixed states
// UPDATED: Now supports Inventory Mode branching
function calculateUnitBuilds(unit, effectiveStats, filteredBuilds, subCandidates, headsToProcess, includeSubs, specificTraitsOnly = null, isAbilityContext = false, mode = 'fixed') {
    
    // NEW: Branch to Inventory Mode if enabled
    if (inventoryMode && relicInventory && relicInventory.length > 0) {
        // UPDATED: Now passes headsToProcess and includeSubs to inventory logic
        return calculateInventoryBuilds(unit, effectiveStats, specificTraitsOnly, isAbilityContext, mode, headsToProcess, includeSubs);
    }
    
    cachedResults = cachedResults || {};
    
    // Determine which traits to calculate
    let activeTraits = [];
    
    if (specificTraitsOnly && Array.isArray(specificTraitsOnly)) {
        activeTraits = specificTraitsOnly;
    } else {
        const specificTraits = unitSpecificTraits[unit.id] || [];
        activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    }
    
    effectiveStats.id = unit.id;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200; 
        effectiveStats.dotDuration = 4; 
        effectiveStats.dotStacks = 1; 
    }
    if(unit.tags) effectiveStats.tags = unit.tags;

    const isKiritoVR = (unit.id === 'kirito' && kiritoState.realm);
    let unitResults = [];

    // Check if unit has Native DoT (Base, Burn Multiplier, or Active Ability/State)
    const hasNativeDoT = (effectiveStats.dot > 0) || (effectiveStats.burnMultiplier > 0) || isKiritoVR;
    
    let unitSubCandidates = [...subCandidates];
    if (!hasNativeDoT) {
        unitSubCandidates = unitSubCandidates.filter(c => c !== 'dot');
    }

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return; 
        
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);

        const traitAddsDot = trait.dotBuff > 0 || trait.hasRadiation || trait.allowDotStack;
        const isDotPossible = hasNativeDoT || traitAddsDot;
        const currentCandidates = (traitAddsDot) ? subCandidates : unitSubCandidates;
        
        const relevantBuilds = (!isDotPossible) 
            ? filteredBuilds.filter(b => b.bodyType !== 'dot') 
            : filteredBuilds;

        relevantBuilds.forEach(build => {
            
            let relevantHeads = headsToProcess;
            if (!isDotPossible) {
                relevantHeads = headsToProcess.filter(h => h !== 'ninja');
            }

            relevantHeads.forEach(headMode => {
                // Shared Context Base
                const baseContext = { wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                
                // 1. DPS Optimization (Dmg Points)
                // Use 99 Dmg, 0 Spa, 0 Range
                effectiveStats.context = { ...baseContext, dmgPoints: 99, spaPoints: 0, rangePoints: 0 };
                let bestDmgConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'dps');
                let resDmg = bestDmgConfig.res;

                // 2. DPS Optimization (SPA Points)
                // Use 0 Dmg, 99 Spa, 0 Range
                effectiveStats.context = { ...baseContext, dmgPoints: 0, spaPoints: 99, rangePoints: 0 };
                let bestSpaConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'dps');
                let resSpa = bestSpaConfig.res;

                // 3. Raw Damage Optimization (Hit Dmg)
                effectiveStats.context = { ...baseContext, dmgPoints: 99, spaPoints: 0, rangePoints: 0 };
                let bestRawConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'raw_dmg');
                let resRaw = bestRawConfig.res;

                // 4. Range Optimization
                // Use 0 Dmg, 0 Spa, 99 Range (Decoupled logic)
                effectiveStats.context = { ...baseContext, dmgPoints: 0, spaPoints: 0, rangePoints: 99 };
                let bestRangeConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'range');
                let resRange = bestRangeConfig.res;

                // UPDATED: Suffix relies on calculation context
                let suffix = isAbilityContext ? '-ABILITY' : '-BASE';
                if (unit.id === 'kirito') { 
                    if (kiritoState.realm) suffix += '-VR'; 
                    if (kiritoState.card) suffix += '-CARD'; 
                }
                
                let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
                let headSuffix = `-${headMode}`; 
                
                // UPDATED: Generate unique ID based on mode to prevent cache collisions
                // This ensures "Fixed" calc doesn't overwrite "Bugged" calc in the global cache
                let modeTag = (mode === 'bugged') ? '-b-' : '-f-';
                
                let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');

                const pushResult = (res, config, prioStr) => {
                     if (!isNaN(res.total)) {
                        // ID Structure: [Unit][Context][Trait][Build][Prio][Subs][Head][MODE]
                        let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-${prioStr}${subsSuffix}${headSuffix}${modeTag}`;
                        
                        cachedResults[id] = res;
                        
                        unitResults.push({ 
                            id: id, 
                            setName: build.name.split('(')[0].trim(), 
                            traitName: trait.name, 
                            dps: res.total, 
                            dmgVal: res.dmgVal * (res.critData ? res.critData.avgMult : 1), // Store avg hit
                            spa: res.spa, 
                            range: res.range,
                            prio: prioStr,
                            mainStats: { body: build.bodyType, legs: build.legType },
                            subStats: config.assignments,
                            headUsed: config.assignments.selectedHead, 
                            isCustom: trait.isCustom 
                        });
                    }
                };

                // Push DPS (Dmg)
                pushResult(resDmg, bestDmgConfig, "dmg");

                // Push DPS (Spa) - Only if notably different
                if (Math.abs(resSpa.total - resDmg.total) > 1) {
                    pushResult(resSpa, bestSpaConfig, "spa");
                }

                // Push Raw Damage - Only if notably different from DPS build
                const avgHitDmg = resDmg.dmgVal * (resDmg.critData ? resDmg.critData.avgMult : 1);
                const avgHitRaw = resRaw.dmgVal * (resRaw.critData ? resRaw.critData.avgMult : 1);
                
                if (Math.abs(avgHitRaw - avgHitDmg) > 10) {
                     pushResult(resRaw, bestRawConfig, "raw_dmg");
                }

                // Push Range - Always for Law, or if different for others
                if (unit.id === 'law') {
                    pushResult(resRange, bestRangeConfig, "range");
                } else if (Math.abs(resRange.range - resDmg.range) > 0.1) {
                    pushResult(resRange, bestRangeConfig, "range");
                }

            }); // End relevantHeads loop
        });
    });

    // Default Sort (DPS)
    unitResults.sort((a, b) => b.dps - a.dps);
    
    return unitResults;
}

// ============================================================================
// INVENTORY MODE CALCULATION
// ============================================================================

// UPDATED: Now accepts `headsToProcess` and `includeSubs` to respect UI toggles
function calculateInventoryBuilds(unit, effectiveStats, specificTraitsOnly, isAbilityContext, mode, headsToProcess, includeSubs) {
    cachedResults = cachedResults || {};
    let unitResults = [];

    // 1. Separate Inventory by Slot
    
    // Logic: If headsToProcess contains only 'none' (Toggle OFF), filter out real heads.
    // If headsToProcess has other values (Toggle ON), include real heads.
    const allowHeads = headsToProcess.some(h => h !== 'none');
    
    let heads = [];
    if (allowHeads) {
        heads = relicInventory.filter(r => r.slot === 'Head');
    }
    
    const bodies = relicInventory.filter(r => r.slot === 'Body');
    const legs = relicInventory.filter(r => r.slot === 'Legs');

    // Add 'None' options for optional slots if empty OR always to compare
    heads.push({ id: 'none', slot: 'Head', setKey: 'none', stars: 1, mainStat: 'none', subs: {} });
    
    // FIX: Using null for mainStat ensures rendering.js treats it as an empty badge, not 'DMG'
    if(bodies.length === 0) bodies.push({ id: 'none-b', slot: 'Body', setKey: 'none', stars: 1, mainStat: null, subs: {} }); 
    if(legs.length === 0) legs.push({ id: 'none-l', slot: 'Legs', setKey: 'none', stars: 1, mainStat: null, subs: {} }); 

    // 2. Determine Traits
    let activeTraits = [];
    if (specificTraitsOnly && Array.isArray(specificTraitsOnly)) {
        activeTraits = specificTraitsOnly;
    } else {
        const specificTraits = unitSpecificTraits[unit.id] || [];
        activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    }

    effectiveStats.id = unit.id;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 1;
    }
    if(unit.tags) effectiveStats.tags = unit.tags;
    const isKiritoVR = (unit.id === 'kirito' && kiritoState.realm);

    // 3. Loop Combinations (Head x Body x Legs x Traits)
    activeTraits.forEach(trait => {
        if (trait.id === 'none') return;
        
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);

        // Optimization: Pre-calc base context
        const baseContext = { 
            wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, 
            isVirtualRealm: isKiritoVR
        };

        heads.forEach(head => {
            bodies.forEach(body => {
                legs.forEach(leg => {
                    
                    // A. Determine Set Bonus
                    // Logic: Only apply if Body and Legs share the same Set Key
                    let activeSetKey = 'none';
                    let starMult = 1;
                    
                    if (body.setKey !== 'none' && body.setKey === leg.setKey) {
                        activeSetKey = body.setKey;
                        // Use minimum stars for set bonus scaling (standard game logic assumption)
                        starMult = Math.min(body.stars || 1, leg.stars || 1);
                    }

                    // B. Construct Total Stats Object (Main + Subs)
                    let totalStats = {
                        set: activeSetKey,
                        dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0
                    };

                    // Helper to sum stats
                    const addStat = (type, val) => {
                        if (totalStats[type] !== undefined) totalStats[type] += val;
                    };

                    // Helper to calc main stat value with stars
                    const getMainVal = (relic) => {
                        let base = 0;
                        if(!relic.mainStat || relic.mainStat === 'none') return 0; // Handled null/none
                        if(relic.slot === 'Body') base = MAIN_STAT_VALS.body[relic.mainStat] || 0;
                        if(relic.slot === 'Legs') base = MAIN_STAT_VALS.legs[relic.mainStat] || 0;
                        return base * (relic.stars || 1);
                    };

                    // Add Body Stats
                    if (body.id !== 'none-b') {
                        addStat(body.mainStat, getMainVal(body));
                        if (includeSubs) {
                            Object.entries(body.subs).forEach(([k, v]) => addStat(k, v));
                        }
                    }

                    // Add Leg Stats
                    if (leg.id !== 'none-l') {
                        addStat(leg.mainStat, getMainVal(leg));
                        if (includeSubs) {
                            Object.entries(leg.subs).forEach(([k, v]) => addStat(k, v));
                        }
                    }

                    // Add Head Subs (Head main stat is ignored for math usually, handled by type/passive)
                    if (head.id !== 'none') {
                        if (includeSubs) {
                            Object.entries(head.subs).forEach(([k, v]) => addStat(k, v));
                        }
                    }

                    // C. Run Calculation Loops (DMG, SPA, RANGE)
                    // We must calculate all 3 priorities so filtering works
                    const calcVariations = [
                        { id: 'dmg',   dmgPts: 99, spaPts: 0,  rangePts: 0 },
                        { id: 'spa',   dmgPts: 0,  spaPts: 99, rangePts: 0 },
                        { id: 'range', dmgPts: 0,  spaPts: 0,  rangePts: 99 } 
                    ];

                    calcVariations.forEach(prio => {

                        effectiveStats.context = { 
                            ...baseContext, 
                            dmgPoints: prio.dmgPts,
                            spaPoints: prio.spaPts,
                            rangePoints: prio.rangePts,
                            headPiece: head.setKey === 'none' ? 'none' : head.setKey, 
                            starMult: starMult 
                        };
                        
                        let res = calculateDPS(effectiveStats, totalStats, effectiveStats.context);

                        // D. ID Generation & Caching
                        let suffix = isAbilityContext ? '-ABILITY' : '-BASE';
                        if (unit.id === 'kirito') { if (kiritoState.realm) suffix += '-VR'; if (kiritoState.card) suffix += '-CARD'; }
                        let modeTag = (mode === 'bugged') ? '-b-' : '-f-';
                        let uniqueCombId = `${head.id}_${body.id}_${leg.id}`; 
                        
                        // Add config tags to ID so different toggles cache separately
                        let cfgTag = `-${allowHeads ? 'H' : 'nH'}-${includeSubs ? 'S' : 'nS'}`;
                        // Add priority to ID to ensure uniqueness
                        let id = `${unit.id}${suffix}-${trait.id}-INV-${uniqueCombId}${modeTag}${cfgTag}-${prio.id}`;

                        cachedResults[id] = res;

                        // E. Format Sub-stats for UI
                        const formatSubs = (relic) => Object.entries(relic.subs).map(([k,v]) => ({ type: k, val: v }));
                        
                        let subStatsUI = {
                            head: (includeSubs && head.id !== 'none') ? formatSubs(head) : null,
                            body: (includeSubs && body.id !== 'none-b') ? formatSubs(body) : null,
                            legs: (includeSubs && leg.id !== 'none-l') ? formatSubs(leg) : null,
                            selectedHead: head.setKey
                        };

                        // F. Push Result
                        unitResults.push({
                            id: id,
                            setName: (activeSetKey !== 'none' ? SETS.find(s=>s.id===activeSetKey)?.name : "Mixed Set"),
                            traitName: trait.name,
                            dps: res.total,
                            dmgVal: res.dmgVal * (res.critData ? res.critData.avgMult : 1),
                            spa: res.spa,
                            range: res.range,
                            prio: prio.id, // Now 'dmg', 'spa', or 'range'
                            mainStats: { body: body.mainStat, legs: leg.mainStat },
                            subStats: subStatsUI,
                            headUsed: head.setKey,
                            isCustom: trait.isCustom,
                            // Store IDs for highlighting
                            relicIds: {
                                head: head.id,
                                body: body.id,
                                legs: leg.id
                            }
                        });
                    }); // end variation loop

                }); // end leg
            }); // end body
        }); // end head
    }); // end trait

    unitResults.sort((a, b) => b.dps - a.dps);
    return unitResults;
}