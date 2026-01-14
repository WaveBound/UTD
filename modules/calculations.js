// ============================================================================
// CALCULATIONS.JS - Build Calculation Logic
// ============================================================================

// Main calculation function for unit builds
// UPDATED: Added specificTraitsOnly parameter to allow partial calculations (Hybrid Static/Dynamic)
function calculateUnitBuilds(unit, effectiveStats, filteredBuilds, subCandidates, headsToProcess, includeSubs, specificTraitsOnly = null) {
    cachedResults = cachedResults || {};
    
    // Determine which traits to calculate
    let activeTraits = [];
    
    if (specificTraitsOnly && Array.isArray(specificTraitsOnly)) {
        activeTraits = specificTraitsOnly;
    } else {
        const specificTraits = unitSpecificTraits[unit.id] || [];
        activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    }

    const isAbilActive = activeAbilityIds.has(unit.id); 
    
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
                effectiveStats.context = { ...baseContext, dmgPoints: 99, spaPoints: 0 };
                let bestDmgConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'dps');
                let resDmg = bestDmgConfig.res;

                // 2. DPS Optimization (SPA Points)
                effectiveStats.context = { ...baseContext, dmgPoints: 0, spaPoints: 99 };
                let bestSpaConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'dps');
                let resSpa = bestSpaConfig.res;

                // 3. Raw Damage Optimization (Hit Dmg)
                effectiveStats.context = { ...baseContext, dmgPoints: 99, spaPoints: 0 };
                let bestRawConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'raw_dmg');
                let resRaw = bestRawConfig.res;

                // 4. Range Optimization
                effectiveStats.context = { ...baseContext, dmgPoints: 99, spaPoints: 0 };
                let bestRangeConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'range');
                let resRange = bestRangeConfig.res;

                let suffix = isAbilActive ? '-ABILITY' : '-BASE';
                if (unit.id === 'kirito') { 
                    if (kiritoState.realm) suffix += '-VR'; 
                    if (kiritoState.card) suffix += '-CARD'; 
                }
                
                let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
                let headSuffix = `-${headMode}`; 
                let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');

                const pushResult = (res, config, prioStr) => {
                     if (!isNaN(res.total)) {
                        let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-${prioStr}${subsSuffix}${headSuffix}`;
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