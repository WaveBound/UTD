function combineTraits(t1, t2) {
    if (t1.id === 'none' && t2.id === 'none') return t1;
    if (t1.id === 'none') return t2;
    if (t2.id === 'none') return t1;

    const compound = (v1, v2) => {
        const d1 = (v1 || 0) / 100;
        const d2 = (v2 || 0) / 100;
        return ((1 + d1) * (1 + d2) - 1) * 100;
    };

    const compoundReduction = (v1, v2) => {
        const r1 = (v1 || 0) / 100;
        const r2 = (v2 || 0) / 100;
        return (1 - (1 - r1) * (1 - r2)) * 100;
    };

    let combined = {
        id: t1.id + "+" + t2.id,
        name: `${t1.name} + ${t2.name}`,
        isCustom: true,
        subTraits: [t1, t2], 
        
        dmg: compound(t1.dmg, t2.dmg),
        spa: compoundReduction(t1.spa, t2.spa),
        range: compound(t1.range, t2.range),
        bossDmg: compound(t1.bossDmg, t2.bossDmg),
        
        critRate: (t1.critRate || 0) + (t2.critRate || 0),
        dotBuff: (t1.dotBuff || 0) + (t2.dotBuff || 0),

        isEternal: t1.isEternal || t2.isEternal,
        hasRadiation: t1.hasRadiation || t2.hasRadiation,
        radiationDuration: Math.max(t1.radiationDuration || 0, t2.radiationDuration || 0),
        
        allowDotStack: t1.allowDotStack || t2.allowDotStack,
        allowPlacementStack: t1.allowPlacementStack || t2.allowPlacementStack,

        relicBuff: (t1.relicBuff ? t1.relicBuff - 1 : 0) + (t2.relicBuff ? t2.relicBuff - 1 : 0) + 1,
        
        limitPlace: (t1.limitPlace && t2.limitPlace) ? Math.min(t1.limitPlace, t2.limitPlace) : (t1.limitPlace || t2.limitPlace)
    };
    if(combined.relicBuff === 1) combined.relicBuff = undefined;
    return combined;
}

function getLevelStats(baseDmg, baseSpa, level, priority) {
    let dmgMult = 1, spaMult = 1;
    if (priority === 'dmg') {
        dmgMult = Math.pow(1.0045125, level);
    } else {
        spaMult = Math.pow(0.9954875, level);
    }
    return { 
        dmg: baseDmg * dmgMult, 
        spa: baseSpa * spaMult, 
        dmgMult, spaMult 
    };
}

// --- OPTIMIZATION HELPERS ---

const applySubPiece = (testBuild, cand, mainStatType) => {
    let primaryTarget = cand;
    if (primaryTarget === mainStatType) {
        primaryTarget = (mainStatType === 'range') ? 'dmg' : 'range';
    }
    for (let k in PERFECT_SUBS) {
        if (k === mainStatType) continue;
        let multiplier = (k === primaryTarget) ? 6 : 1;
        testBuild[k] = (testBuild[k] || 0) + (PERFECT_SUBS[k] * multiplier);
    }
};

const generateAssignments = (cand, build, includeSubs, includeHead) => {
    let assignments = {};
    const getDisp = (k) => SUB_NAMES[k] || k;
    const resolve = (cand, main) => {
        if (cand === main) return (main === 'range') ? 'dmg' : 'range';
        return cand;
    };

    if (includeHead) { const val = getDisp(cand); assignments.head = val; }
    if (includeSubs) {
        let bSub = resolve(cand, build.bodyType);
        let lSub = resolve(cand, build.legType);
        assignments.body = getDisp(bSub);
        assignments.legs = getDisp(lSub);
    }
    return assignments;
};

const checkIsBetter = (res, currentBest, optimizeFor) => {
    if (optimizeFor === 'range') {
        if (res.range > currentBest.range) return true;
        if (res.range === currentBest.range && res.total > currentBest.total) return true;
        return false;
    }
    return res.total > currentBest.total;
};

// --- OPTIMIZED SUB CONFIG SEARCH ---
const getBestSubConfig = (build, stats, includeSubs, headMode, candidates, optimizeFor = 'dps') => {
    let mode = headMode;
    if (mode === true) mode = 'auto';
    if (mode === false) mode = 'none';

    let headOptions = [];
    if (mode === 'auto') {
        headOptions = ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'];
    } else if (mode && mode !== 'none') {
        headOptions = [mode];
    } else {
        headOptions = ['none'];
    }
    
    let globalBestRes = { total: -1, range: -1 };
    let globalBestAssignments = {};
    let globalBestHead = 'none';

    headOptions.forEach(headType => {
        const actualIncludeHead = (headType !== 'none');
        stats.context.headPiece = headType;

        // Base Case: No subs, just head check
        if (!includeSubs && !actualIncludeHead) {
            let res = calculateDPS(stats, build, stats.context);
            if(checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; globalBestAssignments = {}; globalBestHead = headType;
            }
            return;
        }

        let currentCandidates = [...candidates];
        if (currentCandidates.length === 0 && actualIncludeHead) currentCandidates.push('dmg');
        if (!includeSubs && actualIncludeHead) currentCandidates = ['dmg', 'spa']; 

        // 1. Pure Strategy Loop
        currentCandidates.forEach(cand => {
            let testBuild = { ...build };
            
            if (includeSubs) { 
                applySubPiece(testBuild, cand, build.bodyType); 
                applySubPiece(testBuild, cand, build.legType); 
            }
            
            if (actualIncludeHead) {
                applySubPiece(testBuild, cand, null); 
            }
            
            let res = calculateDPS(stats, testBuild, stats.context);
            
            if (checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; 
                globalBestHead = headType;
                globalBestAssignments = generateAssignments(cand, build, includeSubs, actualIncludeHead);
                globalBestAssignments.selectedHead = headType;
            }

            // 2. Hybrid Strategy Optimization (Aggressively Pruned)
            if (actualIncludeHead) {
                let usefulPairs = [];
                if (cand === 'spa') usefulPairs = ['dmg', 'range'];
                else if (cand === 'range') usefulPairs = ['dmg', 'spa'];

                usefulPairs.forEach(subCand => {
                    if (!currentCandidates.includes(subCand)) return; 

                    let hybridBuild = { ...build };

                    if (includeSubs) { 
                        applySubPiece(hybridBuild, cand, build.bodyType); 
                        applySubPiece(hybridBuild, cand, build.legType); 
                    }

                    hybridBuild[cand] = (hybridBuild[cand] || 0) + (PERFECT_SUBS[cand] * 3);
                    hybridBuild[subCand] = (hybridBuild[subCand] || 0) + (PERFECT_SUBS[subCand] * 3);

                    let hybridRes = calculateDPS(stats, hybridBuild, stats.context);

                    if (checkIsBetter(hybridRes, globalBestRes, optimizeFor)) {
                        globalBestRes = hybridRes;
                        globalBestHead = headType;
                        
                        let assign = generateAssignments(cand, build, includeSubs, false);
                        const getDisp = (k) => SUB_NAMES[k] || k;
                        assign.head = `${getDisp(cand)}/${getDisp(subCand)}`; 
                        assign.selectedHead = headType;
                        globalBestAssignments = assign;
                    }
                });
            }
        });
    });

    globalBestAssignments.selectedHead = globalBestHead;
    return { res: globalBestRes, desc: "", assignments: globalBestAssignments };
};


// --- CORE CALCULATION LOGIC ---

function calculateDPS(uStats, relicStats, context) {
    const { level, priority, wave, isBoss, traitObj, placement, isSSS, headPiece, isVirtualRealm } = context;

    // 1. Level Scaling
    let lvStats = getLevelStats(uStats.dmg, uStats.spa, level, priority);
    if (isSSS) {
        lvStats.dmg *= 1.2;
        lvStats.spa *= 0.92;
    }

    // 2. Trait & Passive Setup
    let passivePcent = (uStats.passiveDmg || 0) + (uStats.buffDmg || 0);
    let passiveSpaPcent = uStats.passiveSpa || 0;
    let traitDmgPct = traitObj.dmg;
    let traitSpaPct = traitObj.spa; 
    let traitCritRate = traitObj.critRate || 0;
    let traitRangePct = traitObj.range || 0;
    let traitDotBuff = traitObj.dotBuff || 0;

    // --- ETERNAL SCALING LOGIC ---
    let eternalDmgBuff = 0;
    if (traitObj.isEternal) {
        const waveCap = Math.min(wave, 12);
        eternalDmgBuff = waveCap * 5; // +5% Dmg per wave
        passivePcent += eternalDmgBuff; // Add to bucket for calculation
        traitRangePct += waveCap * 2.5; // +1% Range per wave
    }
    
    if (traitObj.bossDmg && isBoss) traitDmgPct += traitObj.bossDmg;

    // 3. Set Bonus Logic
    let sBonus = { ...(setBonuses[relicStats.set] || setBonuses.none) };
    if (sBonus.dot === undefined) sBonus.dot = 0;
    let tagBuffs = { dmg: 0, spa: 0, cm: 0, cf: 0, range: 0, dot: 0 };

    const unitElement = uStats.element || "None";
    const tags = uStats.tags || [];

    // --- APPLY HEAD PIECE STATS AS SET BONUS ---
    if (headPiece === 'reaper_necklace') {
        sBonus.spa = (sBonus.spa || 0) + 7.5;
        sBonus.range = (sBonus.range || 0) + 15;
    } else if (headPiece === 'shadow_reaper_necklace') {
        sBonus.dmg = (sBonus.dmg || 0) + 2.5;
        sBonus.range = (sBonus.range || 0) + 10;
        sBonus.cf = (sBonus.cf || 0) + 5;
        sBonus.cm = (sBonus.cm || 0) + 5;
    }

    // --- STANDARD CONDITIONAL SETS ---
    if (relicStats.set === 'ninja') {
        if (["Dark", "Rose", "Fire"].includes(unitElement)) {
            sBonus.dmg += 10;
        }
    } else if (relicStats.set === 'sun_god') {
        if (["Ice", "Light", "Water"].includes(unitElement)) {
            sBonus.dmg += 10;
        }
    }

    // --- NEW TAG-BASED CONDITIONAL SETS ---
    if (relicStats.set === 'shadow_reaper') {
        if (tags.includes('Peroxide')) { sBonus.spa += 10; tagBuffs.spa += 10; }
        if (tags.includes('Reaper')) { sBonus.dmg += 25; tagBuffs.dmg += 25; sBonus.spa += 12.5; tagBuffs.spa += 12.5; }
        if (tags.includes('Rage')) { sBonus.dmg += 15; tagBuffs.dmg += 15; sBonus.spa += 8.5; tagBuffs.spa += 8.5; sBonus.dot += 10; tagBuffs.dot += 10; }
        if (tags.includes('Hollow')) { sBonus.cf = (sBonus.cf || 0) + 20; tagBuffs.cf += 20; sBonus.cm = (sBonus.cm || 0) + 12.5; tagBuffs.cm += 12.5; }
    } 
    else if (relicStats.set === 'reaper_set') {
        if (tags.includes('Peroxide')) { sBonus.dmg += 10; tagBuffs.dmg += 10; sBonus.dot += 5; tagBuffs.dot += 5; sBonus.cm = (sBonus.cm || 0) + 8.5; tagBuffs.cm += 8.5; }
        if (tags.includes('Reaper')) { sBonus.range = (sBonus.range || 0) + 15; tagBuffs.range += 15; }
        if (tags.includes('Rage')) { sBonus.cm = (sBonus.cm || 0) + 25; tagBuffs.cm += 25; sBonus.cf = (sBonus.cf || 0) + 10; tagBuffs.cf += 10; sBonus.range = (sBonus.range || 0) + 10; tagBuffs.range += 10; }
        if (tags.includes('Hollow')) { sBonus.dmg += 12.5; tagBuffs.dmg += 12.5; sBonus.spa += 7.5; tagBuffs.spa += 7.5; sBonus.range = (sBonus.range || 0) + 15; tagBuffs.range += 15; }
    }

    // 4. Relic Base Stats
    let baseR_Dmg = statConfig.applyRelicDmg ? relicStats.dmg : 0;
    let baseR_Spa = statConfig.applyRelicSpa ? relicStats.spa : 0;
    let baseR_Cm  = statConfig.applyRelicCrit ? relicStats.cm : 0; 
    let baseR_Cf  = relicStats.cf; 
    let baseR_Dot = statConfig.applyRelicDot ? relicStats.dot : 0;
    let baseR_Range = relicStats.range || 0;

    if (traitObj.relicBuff) {
        const mult = traitObj.relicBuff; 
        baseR_Dmg *= mult; baseR_Spa *= mult; baseR_Cm  *= mult; 
        baseR_Dot *= mult; baseR_Cf  *= mult; baseR_Range *= mult;
    }

    // 5. CALCULATE FINAL SPA (Speed)
    const afterTraitSpa = lvStats.spa * (1 - traitSpaPct / 100);
    const spaAfterRelic = afterTraitSpa * (1 - baseR_Spa / 100); 
    let setAndPassiveSpa = sBonus.spa + passiveSpaPcent; 
    const rawFinalSpa = spaAfterRelic * (1 - setAndPassiveSpa / 100); 
    const cap = uStats.spaCap || 0.1;
    const finalSpa = Math.max(rawFinalSpa, cap);

    // 6. CALCULATE FINAL RANGE
    const baseRange = uStats.range || 0;
    const levelRange = baseRange * lvStats.dmgMult; 
    const passiveRange = uStats.passiveRange || 0;
    const setRange = sBonus.range || 0; 
    const rangeMult = 1 + (traitRangePct + baseR_Range + passiveRange + setRange) / 100;
    const finalRange = levelRange * rangeMult;

    // 7. HEAD PIECE PASSIVES (Conditional Triggers)
    let headDmgBuff = 0;
    let headDotBuff = 0;
    let headCalc = { type: headPiece, uptime: 0, trigger: 0, duration: 0, attacks: 0 };

    if (headPiece === 'sun_god') {
        headCalc.attacks = 6;
        headCalc.duration = 7;
        
        // CORRECTION: Cycle Logic (Non-Overlapping)
        const timeToTrigger = headCalc.attacks * finalSpa;
        
        headCalc.trigger = timeToTrigger;
        headCalc.uptime = headCalc.duration / (headCalc.duration + timeToTrigger);
        
        headDmgBuff += finalRange * headCalc.uptime;

    } else if (headPiece === 'ninja') {
        headCalc.attacks = 5;
        headCalc.duration = 10;
        
        // CORRECTION: Cycle Logic
        const timeToTrigger = headCalc.attacks * finalSpa;
        
        headCalc.trigger = timeToTrigger;
        headCalc.uptime = headCalc.duration / (headCalc.duration + timeToTrigger);
        
        headDotBuff += 20 * headCalc.uptime;
    }

    // 8. FINAL DAMAGE CALCULATION
    const traitMult = (1 + traitDmgPct / 100);
    const relicMult = (1 + baseR_Dmg / 100);
    
    // Additive Bucket: Set Bonus + Unit Passive + Head Piece
    const additiveTotal = sBonus.dmg + passivePcent + headDmgBuff;
    const setAndPassiveMult = (1 + additiveTotal / 100);
    
    // NEW: Conditional Multiplier (e.g., Burn Multiplier)
    let conditionalMult = 1;
    if (uStats.burnMultiplier) {
        conditionalMult = 1 + (uStats.burnMultiplier / 100);
    }

    const finalDmg = lvStats.dmg * traitMult * relicMult * setAndPassiveMult * conditionalMult;

    // 9. CRIT CALCULATION
    let totalCmBuff = (sBonus.cm || 0) + baseR_Cm; 
    const finalCdmgStat = uStats.cdmg + totalCmBuff; 
    let rCf  = baseR_Cf + (sBonus.cf || 0); 
    if (uStats.id === 'kirito') rCf = 0; 

    const finalCritRate = Math.min(uStats.crit + traitCritRate + rCf, 100);
    const avgCritMult = (1 + ((finalCdmgStat / 100) * (finalCritRate / 100)));
    const avgHit = finalDmg * avgCritMult;
    
    // 10. ATTACK MULTIPLIER
    let attackMultiplier = 1;
    let extraAttacksData = null;

    if (uStats.reqCrits && uStats.hitCount) {
        const critsPerAttack = uStats.hitCount * (finalCritRate / 100);
        if (critsPerAttack > 0) {
            const attacksToTrigger = uStats.reqCrits / critsPerAttack;
            const bonusRatio = uStats.extraAttacks / attacksToTrigger;
            attackMultiplier = 1 + bonusRatio;
            extraAttacksData = {
                req: uStats.reqCrits, hits: uStats.hitCount, extra: uStats.extraAttacks, attacksNeeded: attacksToTrigger, mult: attackMultiplier
            };
        }
    }

    const hitDpsTotal = (avgHit / finalSpa) * placement * attackMultiplier;

    // 11. DoT CALCULATION
    let dotDpsTotal = 0;
    let totalDotBuffs = traitDotBuff + headDotBuff + sBonus.dot;
    const dotCritMult = isVirtualRealm ? avgCritMult : 1;
    
    let dotBreakdown = { 
        base: uStats.dot + totalDotBuffs, 
        baseNoHead: uStats.dot + traitDotBuff + sBonus.dot, 
        relicMult: 1, finalPct: 0, critMult: dotCritMult, internal: 1, finalTick: 0, timeUsed: finalSpa 
    };
    
    if (uStats.dot > 0 || traitObj.hasRadiation) {
        // STRICT LOGIC: Multi-hit stacking (internalStacks > 1) is exclusive to Astral Kirito in Virtual Realm
        // We prioritizing uStats.hitCount (14) over uStats.dotStacks (which might be 1 via Magician Card)
        const internalStacks = (traitObj.allowDotStack && uStats.id === 'kirito' && isVirtualRealm) ? (uStats.hitCount || uStats.dotStacks || 1) : 1;
        
        const baseDotPct = uStats.dot + totalDotBuffs;
        const relicDotMult = 1 + (baseR_Dot / 100);
        const singleTickPct = baseDotPct * relicDotMult;
        
        dotBreakdown.relicMult = relicDotMult;
        dotBreakdown.finalPct = singleTickPct;

        const totalDoTPct = singleTickPct * internalStacks;
        const totalDoTDmg = finalDmg * (totalDoTPct / 100) * dotCritMult;
        
        // Time Basis
        let timeBasis = finalSpa; 
        if (!traitObj.allowDotStack && uStats.dotDuration && uStats.dotDuration > 0) {
                timeBasis = Math.max(uStats.dotDuration, finalSpa);
        } else if (traitObj.hasRadiation && traitObj.radiationDuration) {
                timeBasis = Math.max(traitObj.radiationDuration, finalSpa);
        }

        const oneUnitDoTDps = totalDoTDmg / timeBasis;
        const canStackPlacement = traitObj.allowDotStack || traitObj.allowPlacementStack;
        dotDpsTotal = oneUnitDoTDps * (canStackPlacement ? placement : 1); 

        dotBreakdown.internal = internalStacks;
        dotBreakdown.finalTick = totalDoTDmg;
        dotBreakdown.timeUsed = timeBasis;
    }

    return {
        total: hitDpsTotal + dotDpsTotal,
        hit: hitDpsTotal,
        dot: dotDpsTotal,
        spa: finalSpa,
        spaCap: cap,
        range: finalRange,
        dmgVal: finalDmg,
        lvStats: lvStats,
        traitBuffs: { dmg: traitDmgPct, spa: traitSpaPct, range: traitRangePct },
        traitObj: traitObj,
        relicBuffs: { dmg: baseR_Dmg, spa: baseR_Spa, dot: baseR_Dot, range: baseR_Range }, 
        setBuffs: { dmg: sBonus.dmg, spa: sBonus.spa }, 
        totalSetStats: sBonus,
        tagBuffs: tagBuffs,
        passiveBuff: passivePcent + headDmgBuff, 
        passiveSpaBuff: passiveSpaPcent,
        eternalBuff: eternalDmgBuff,
        totalAdditivePct: additiveTotal,
        conditionalData: uStats.burnMultiplier ? { name: "Target: Burn", val: uStats.burnMultiplier, mult: conditionalMult } : null,
        headBuffs: { 
            dmg: headDmgBuff, 
            dot: headDotBuff, 
            type: headPiece, 
            uptime: headCalc.uptime,
            attacks: headCalc.attacks,
            duration: headCalc.duration,
            trigger: headCalc.trigger
        },
        dotData: dotBreakdown,
        critData: { 
            rate: finalCritRate, cdmg: finalCdmgStat, baseCdmg: uStats.cdmg, relicCmPct: baseR_Cm, setCm: sBonus.cm, totalCmBuff: totalCmBuff, preRelicCdmg: uStats.cdmg, avgMult: avgCritMult 
        },
        priority: priority,
        placement: placement,
        isSSS: isSSS,
        rawFinalSpa: rawFinalSpa,
        spaAfterRelic: spaAfterRelic, 
        setAndPassiveSpa: setAndPassiveSpa, 
        baseStats: uStats,
        level: level,
        singleUnitDoT: dotDpsTotal / (traitObj.allowDotStack || traitObj.allowPlacementStack ? placement : 1), 
        hasStackingDoT: traitObj.allowDotStack || traitObj.allowPlacementStack,
        extraAttacks: extraAttacksData,
        abilityBuff: uStats.buffDmg || 0 
    };
}