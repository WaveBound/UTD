// ============================================================================
// MATH.JS - Core Calculation Engine
// ============================================================================

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

function getLevelStats(baseDmg, baseSpa, dmgPoints, spaPoints) {
    const dmgMult = Math.pow(1.0045125, dmgPoints);
    const spaMult = Math.pow(0.9954875, spaPoints);
    return { 
        dmg: baseDmg * dmgMult, 
        spa: baseSpa * spaMult, 
        dmgMult, spaMult 
    };
}

// --- OPTIMIZATION HELPERS ---

const checkIsBetter = (res, currentBest, optimizeFor) => {
    if (optimizeFor === 'range') {
        if (res.range > currentBest.range) return true;
        if (res.range === currentBest.range && res.total > currentBest.total) return true;
        return false;
    }
    return res.total > currentBest.total;
};

// --- OPTIMIZED SUB CONFIG SEARCH (Exact Value Fix) ---
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

    // Helper: Apply stats and RETURN the values used
    const applyContextualStats = (b, pieceName, mainStat, pStat, sStat, ratio) => {
        let pWeight = ratio.p; 
        let sWeight = ratio.s; 
        
        // COLLISION CHECK (Max 6 rolls if Pure)
        // If the Primary Stat matches Main Stat, shift weight to Secondary
        if (pStat === mainStat) {
            sWeight = Math.min(6, sWeight + pWeight);
            pWeight = 0;
        } 
        // If the Secondary Stat matches Main Stat, shift weight to Primary
        else if (sStat === mainStat) {
            pWeight = Math.min(6, pWeight + sWeight);
            sWeight = 0;
        }

        // Edge Case: If it was a Pure Strategy (e.g., Dmg/Dmg) and matches Main Stat,
        // both weights become 0 (or shift back and forth). 
        // If pStat == sStat == mainStat, we cannot roll this stat at all.
        if (pStat === mainStat && sStat === mainStat) {
            pWeight = 0;
            sWeight = 0;
        }

        let pVal = 0;
        let sVal = 0;

        // 1. Apply Upgraded Stats
        if (pWeight > 0) {
            pVal = PERFECT_SUBS[pStat] * pWeight;
            b[pStat] = (b[pStat] || 0) + pVal;
        }
        if (sWeight > 0) {
            sVal = PERFECT_SUBS[sStat] * sWeight;
            b[sStat] = (b[sStat] || 0) + sVal;
        }

        // 2. FILL BASE STATS
        // Ensure other valid sub-stats exist at "Base Level 1" (1x Value)
        candidates.forEach(cand => {
            // Skip if this is the Main Stat (Collision)
            if (cand === mainStat) return;
            // Skip if this is the Primary Upgrade Target (Already added above)
            if (cand === pStat && pWeight > 0) return;
            // Skip if this is the Secondary Upgrade Target (Already added above)
            if (cand === sStat && sWeight > 0) return;

            // Add Base Value (1 roll worth of stats)
            const baseVal = PERFECT_SUBS[cand];
            b[cand] = (b[cand] || 0) + baseVal;
        });

        return { pStat, pVal, sStat, sVal };
    };

    const formatAssignment = (res) => {
        let arr = [];
        if (res.pVal > 0) arr.push({ type: res.pStat, val: res.pVal });
        if (res.sVal > 0) arr.push({ type: res.sStat, val: res.sVal });
        return arr;
    };

    headOptions.forEach(headType => {
        const actualIncludeHead = (headType !== 'none');
        stats.context.headPiece = headType;

        if (!includeSubs && !actualIncludeHead) {
            let res = calculateDPS(stats, build, stats.context);
            if(checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; globalBestAssignments = {}; globalBestHead = headType;
            }
            return;
        }

        let strategies = [];
        
        // 1. Pure Strategies (1 Base + 5 Upgrades = 6 Rolls)
        candidates.forEach(c => strategies.push({ p: c, s: c, ratio: { p: 6, s: 0 } }));

        // 2. Hybrid Strategies (1 Base A + 1 Base B + 5 Upgrades = 7 Rolls)
        const pairs = [
            ['dmg', 'cf'], ['dmg', 'spa'], ['dmg', 'range'], ['dmg', 'cm'],
            ['cf', 'cm'], ['spa', 'range']
        ];

        // Ratios summing to 7
        const ratios = [
            { p: 4, s: 3 }, 
            { p: 3, s: 4 }, 
            { p: 5, s: 2 }, 
            { p: 2, s: 5 }
        ];

        pairs.forEach(pair => {
            const [c1, c2] = pair;
            if (!candidates.includes(c1) || !candidates.includes(c2)) return;

            ratios.forEach(r => {
                strategies.push({ p: c1, s: c2, ratio: r });
            });
        });

        strategies.forEach(strat => {
            let testBuild = { ...build };
            let currentAssignments = {};

            if (actualIncludeHead) {
                // Heads don't have main stats, pass null
                const res = applyContextualStats(testBuild, 'head', null, strat.p, strat.s, strat.ratio);
                currentAssignments.head = formatAssignment(res);
            }

            if (includeSubs) {
                // Pass build.bodyType as the mainStat to block
                const res = applyContextualStats(testBuild, 'body', build.bodyType, strat.p, strat.s, strat.ratio);
                currentAssignments.body = formatAssignment(res);
            }

            if (includeSubs) {
                // Pass build.legType as the mainStat to block
                const res = applyContextualStats(testBuild, 'legs', build.legType, strat.p, strat.s, strat.ratio);
                currentAssignments.legs = formatAssignment(res);
            }

            let res = calculateDPS(stats, testBuild, stats.context);

            if (checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res;
                globalBestHead = headType;
                globalBestAssignments = currentAssignments;
                globalBestAssignments.selectedHead = headType;
            }
        });
    });

    globalBestAssignments.selectedHead = globalBestHead;
    return { res: globalBestRes, desc: "", assignments: globalBestAssignments };
};


// --- CORE CALCULATION LOGIC ---

function calculateDPS(uStats, relicStats, context) {
    const { dmgPoints, spaPoints, wave, isBoss, traitObj, placement, isSSS, headPiece, isVirtualRealm, starMult } = context;

    // 1. Level Scaling
    let lvStats = getLevelStats(uStats.dmg, uStats.spa, dmgPoints, spaPoints);
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
        eternalDmgBuff = waveCap * 5; 
        passivePcent += eternalDmgBuff; 
        traitRangePct += waveCap * 2.5; 
    }
    
    if (traitObj.bossDmg && isBoss) traitDmgPct += traitObj.bossDmg;

    // 3. Set Bonus Logic
    let sBonus = { ...(setBonuses[relicStats.set] || setBonuses.none) };
    
    if (starMult && starMult !== 1) {
        for (let key in sBonus) {
            if (typeof sBonus[key] === 'number') {
                sBonus[key] = sBonus[key] * starMult;
            }
        }
    }

    if (sBonus.dot === undefined) sBonus.dot = 0;
    let tagBuffs = { dmg: 0, spa: 0, cm: 0, cf: 0, range: 0, dot: 0 };

    const unitElement = uStats.element || "None";
    const tags = uStats.tags || [];

    if (headPiece === 'reaper_necklace') {
        sBonus.spa = (sBonus.spa || 0) + 7.5;
        sBonus.range = (sBonus.range || 0) + 15;
    } else if (headPiece === 'shadow_reaper_necklace') {
        sBonus.dmg = (sBonus.dmg || 0) + 2.5;
        sBonus.range = (sBonus.range || 0) + 10;
        sBonus.cf = (sBonus.cf || 0) + 5;
        sBonus.cm = (sBonus.cm || 0) + 5;
    }

    if (relicStats.set === 'ninja') {
        if (["Dark", "Rose", "Fire"].includes(unitElement)) {
            sBonus.dmg += 10;
        }
    } else if (relicStats.set === 'sun_god') {
        if (["Ice", "Light", "Water"].includes(unitElement)) {
            sBonus.dmg += 10;
        }
    }

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
    // UPDATED: Range does NOT scale with DMG Points (lvStats.dmgMult). 
    // It only scales with SSS (1.2x) if active.
    const levelRange = baseRange * (isSSS ? 1.2 : 1); 
    
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
        const timeToTrigger = headCalc.attacks * finalSpa;
        headCalc.trigger = timeToTrigger;
        headCalc.uptime = headCalc.duration / (headCalc.duration + timeToTrigger);
        headDmgBuff += finalRange * headCalc.uptime;

    } else if (headPiece === 'ninja') {
        headCalc.attacks = 5;
        headCalc.duration = 10;
        const timeToTrigger = headCalc.attacks * finalSpa;
        headCalc.trigger = timeToTrigger;
        headCalc.uptime = headCalc.duration / (headCalc.duration + timeToTrigger);
        headDotBuff += 20 * headCalc.uptime;
    }

    // 8. FINAL DAMAGE CALCULATION
    const traitMult = (1 + traitDmgPct / 100);
    const relicMult = (1 + baseR_Dmg / 100);
    
    const additiveTotal = sBonus.dmg + passivePcent + headDmgBuff;
    const setAndPassiveMult = (1 + additiveTotal / 100);
    
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
        const internalStacks = (traitObj.allowDotStack && uStats.id === 'kirito' && isVirtualRealm) ? (uStats.hitCount || uStats.dotStacks || 1) : 1;
        
        const baseDotPct = uStats.dot + totalDotBuffs;
        const relicDotMult = 1 + (baseR_Dot / 100);
        const singleTickPct = baseDotPct * relicDotMult;
        
        dotBreakdown.relicMult = relicDotMult;
        dotBreakdown.finalPct = singleTickPct;

        const totalDoTPct = singleTickPct * internalStacks;
        const totalDoTDmg = finalDmg * (totalDoTPct / 100) * dotCritMult;
        
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
        relicBuffs: { dmg: baseR_Dmg, spa: baseR_Spa, dot: baseR_Dot, range: baseR_Range, cf: baseR_Cf, cm: baseR_Cm }, 
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
        placement: placement,
        isSSS: isSSS,
        rawFinalSpa: rawFinalSpa,
        spaAfterRelic: spaAfterRelic, 
        setAndPassiveSpa: setAndPassiveSpa, 
        baseStats: uStats,
        dmgPoints: context.dmgPoints,
        spaPoints: context.spaPoints,
        singleUnitDoT: dotDpsTotal / (traitObj.allowDotStack || traitObj.allowPlacementStack ? placement : 1), 
        hasStackingDoT: traitObj.allowDotStack || traitObj.allowPlacementStack,
        extraAttacks: extraAttacksData,
        abilityBuff: uStats.buffDmg || 0 
    };
}