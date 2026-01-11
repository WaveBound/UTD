// ============================================================================
// CALCULATIONS.JS - Build Calculation Logic
// ============================================================================

// Main calculation function for unit builds
function calculateUnitBuilds(unit, effectiveStats, filteredBuilds, subCandidates, headsToProcess, includeSubs) {
    cachedResults = cachedResults || {};
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    const isAbilActive = activeAbilityIds.has(unit.id); 
    
    effectiveStats.id = unit.id;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200; 
        effectiveStats.dotDuration = 4; 
        effectiveStats.dotStacks = 1; 
    }
    if(unit.tags) effectiveStats.tags = unit.tags;

    // --- WASM INTEGRATION ---
    if (window.WasmService && window.WasmService.isReady()) {
        const wasmResults = window.WasmService.calculateBuildsWasm(
            effectiveStats, 
            activeTraits, 
            filteredBuilds, 
            subCandidates, 
            headsToProcess, 
            includeSubs
        );
        
        if (wasmResults) {
            // Cache the results for the UI to use (e.g. detailed math modal)
            wasmResults.forEach(r => {
                // We need to reconstruct the "raw result" object that the UI expects for `cachedResults`
                // Rust returns a simplified OptimizationResult. 
                // However, the UI uses cachedResults[id] to show the "Math Breakdown".
                // Since Wasm doesn't return the full breakdown (to save bandwidth), 
                // we might need to re-calculate ONLY the specific build when the user clicks "?".
                // 
                // Current UI: `showMath(id)` looks up `cachedResults[id]`.
                // Strategy: We can lazily calculate the full breakdown in JS when requested, 
                // OR we can store a "lite" version here.
                
                // For now, we store what we have. If showMath fails, we might need a fallback there.
                // But the primary goal is fast listing.
                cachedResults[r.id] = {
                    total: r.dps,
                    spa: r.spa,
                    range: r.range,
                    // Mocking other fields to prevent UI crash if it reads them
                    hit: 0, dot: 0, 
                    // To enable full math breakdown, we would need to run the specific calc in JS
                    // This is acceptable: List generation is fast (Rust), Breakdown is on-demand (JS).
                    isWasmDerived: true,
                    // Store enough data to reconstruct context if needed
                    context: { /* would need to reconstruct */ }
                };
            });
            return wasmResults;
        }
    }
    // ------------------------

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
        
        // Determine if DoT is possible for this specific configuration
        const isDotPossible = hasNativeDoT || traitAddsDot;

        // Use global candidates if trait adds DoT, otherwise use filtered list
        const currentCandidates = (traitAddsDot) ? subCandidates : unitSubCandidates;
        
        // Filter Builds: Skip 'DoT' Body builds if DoT is impossible
        const relevantBuilds = (!isDotPossible) 
            ? filteredBuilds.filter(b => b.bodyType !== 'dot') 
            : filteredBuilds;

        relevantBuilds.forEach(build => {
            
            // Filter Heads: Skip 'Ninja' head (Pure DoT) if DoT is impossible
            let relevantHeads = headsToProcess;
            if (!isDotPossible) {
                relevantHeads = headsToProcess.filter(h => h !== 'ninja');
            }

            relevantHeads.forEach(headMode => {

                // DMG Priority Context
                let contextDmg = { dmgPoints: 99, spaPoints: 0, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                effectiveStats.context = contextDmg;
                // Pass the specific 'headMode' instead of letting the math engine choose 'auto'
                let bestDmgConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates);
                let resDmg = bestDmgConfig.res;

                // SPA Priority Context
                let contextSpa = { dmgPoints: 0, spaPoints: 99, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                effectiveStats.context = contextSpa;
                let bestSpaConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates);
                let resSpa = bestSpaConfig.res;

                // Generate IDs and cache results
                let suffix = isAbilActive ? '-ABILITY' : '-BASE';
                if (unit.id === 'kirito') { 
                    if (kiritoState.realm) suffix += '-VR'; 
                    if (kiritoState.card) suffix += '-CARD'; 
                }
                
                let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
                let headSuffix = `-${headMode}`; 
                let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');

                // DMG Priority Result
                if (!isNaN(resDmg.total)) {
                    let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-dmg${subsSuffix}${headSuffix}`;
                    cachedResults[id] = resDmg;
                    unitResults.push({ 
                        id: id, 
                        setName: build.name.split('(')[0].trim(), 
                        traitName: trait.name, 
                        dps: resDmg.total, 
                        spa: resDmg.spa, 
                        prio: "dmg",
                        mainStats: { body: build.bodyType, legs: build.legType },
                        subStats: bestDmgConfig.assignments,
                        headUsed: bestDmgConfig.assignments.selectedHead, 
                        isCustom: trait.isCustom 
                    });
                }

                // SPA Priority Result
                if (!isNaN(resSpa.total) && resSpa.total > 0 && Math.abs(resSpa.total - resDmg.total) > 1) {
                    let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-spa${subsSuffix}${headSuffix}`;
                    cachedResults[id] = resSpa;
                    unitResults.push({ 
                        id: id, 
                        setName: build.name.split('(')[0].trim(), 
                        traitName: trait.name, 
                        dps: resSpa.total, 
                        spa: resSpa.spa, 
                        prio: "spa",
                        mainStats: { body: build.bodyType, legs: build.legType },
                        subStats: bestSpaConfig.assignments,
                        headUsed: bestSpaConfig.assignments.selectedHead,
                        isCustom: trait.isCustom 
                    });
                }

                // Range Priority (Law only)
                if (unit.id === 'law') {
                    let contextRange = { dmgPoints: 99, spaPoints: 0, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                    effectiveStats.context = contextRange;
                    let bestRangeConfig = getBestSubConfig(build, effectiveStats, includeSubs, headMode, currentCandidates, 'range');
                    let resRange = bestRangeConfig.res;

                    if (!isNaN(resRange.total)) {
                        let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-range${subsSuffix}${headSuffix}`;
                        cachedResults[id] = resRange;
                        unitResults.push({ 
                            id: id, 
                            setName: build.name.split('(')[0].trim(), 
                            traitName: trait.name, 
                            dps: resRange.total, 
                            spa: resRange.spa, 
                            range: resRange.range, 
                            prio: "range",
                            mainStats: { body: build.bodyType, legs: build.legType },
                            subStats: bestRangeConfig.assignments,
                            headUsed: bestRangeConfig.assignments.selectedHead,
                            isCustom: trait.isCustom 
                        });
                    }
                }

            }); // End relevantHeads loop

        });
    });

    // Sort results based on unit type
    if (unit.id === 'law') {
        unitResults.sort((a, b) => (b.range || 0) - (a.range || 0));
    } else {
        unitResults.sort((a, b) => b.dps - a.dps);
    }
    
    return unitResults;
}