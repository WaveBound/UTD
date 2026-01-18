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
        // Radiation specific compound logic
        radiationPct: (t1.radiationPct || 0) + (t2.radiationPct || 0),
        radiationDuration: Math.max(t1.radiationDuration || 0, t2.radiationDuration || 0),
        
        allowDotStack: t1.allowDotStack || t2.allowDotStack,
        allowPlacementStack: t1.allowPlacementStack || t2.allowPlacementStack,

        relicBuff: (t1.relicBuff ? t1.relicBuff - 1 : 0) + (t2.relicBuff ? t2.relicBuff - 1 : 0) + 1,
        
        limitPlace: (t1.limitPlace && t2.limitPlace) ? Math.min(t1.limitPlace, t2.limitPlace) : (t1.limitPlace || t2.limitPlace),

        costReduction: (t1.costReduction || 0) + (t2.costReduction || 0)
    };

    if(combined.relicBuff === 1) combined.relicBuff = undefined;
    return combined;
}

/**
 * Calculates scaling based on stat points.
 * Updated: Decoupled Range from Dmg Points. Now accepts rangePoints.
 */
function getLevelStats(baseDmg, baseSpa, baseRange, dmgPoints, spaPoints, rangePoints) {
    const dmgMult = Math.pow(1.0045125, dmgPoints);
    const spaMult = Math.pow(0.9954875, spaPoints);
    // Range now scales off its own points, defaulting to 0 if not provided
    const rangeMult = Math.pow(1.0045125, rangePoints || 0);
    
    return { 
        dmg: baseDmg * dmgMult, 
        spa: baseSpa * spaMult, 
        range: baseRange * rangeMult, 
        dmgMult, 
        spaMult,
        rangeMult
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

// --- OPTIMIZED SUB CONFIG SEARCH ---
const getBestSubConfig = (build, stats, includeSubs, headMode, candidates, optimizeFor = 'dps') => {
    let mode = headMode;
    if (mode === true) mode = 'auto';
    if (mode === false) mode = 'none';

    let headOptions = (mode === 'auto') 
        ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] 
        : (mode && mode !== 'none' ? [mode] : ['none']);
    
    let globalBestRes = { total: -1, range: -1 };
    let globalBestAssignments = {}; 
    let globalBestHead = 'none';

    // Helper: Apply stats and RETURN the values used
    const applyContextualStats = (b, pieceName, mainStat, pStat, sStat, ratio) => {
        let pWeight = ratio.p; 
        let sWeight = ratio.s; 
        
        // COLLISION CHECK
        if (pStat === mainStat) {
            sWeight = Math.min(6, sWeight + pWeight);
            pWeight = 0;
        } else if (sStat === mainStat) {
            pWeight = Math.min(6, pWeight + sWeight);
            sWeight = 0;
        }

        if (pStat === mainStat && sStat === mainStat) {
            pWeight = 0; sWeight = 0;
        }

        let pVal = 0, sVal = 0;

        if (pWeight > 0) {
            pVal = PERFECT_SUBS[pStat] * pWeight;
            b[pStat] = (b[pStat] || 0) + pVal;
        }
        if (sWeight > 0) {
            sVal = PERFECT_SUBS[sStat] * sWeight;
            b[sStat] = (b[sStat] || 0) + sVal;
        }

        candidates.forEach(cand => {
            if (cand === mainStat || (cand === pStat && pWeight > 0) || (cand === sStat && sWeight > 0)) return;
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

        // UPDATED: If subs are disabled, we calculate the build immediately (pure set/head passive)
        if (!includeSubs) {
            let res = calculateDPS(stats, build, stats.context);
            // FIX: Attach stats to result so unified processor can see them
            res.totalStats = build;
            
            if(checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; globalBestAssignments = {}; globalBestHead = headType;
            }
            return;
        }

        let strategies = [];
        candidates.forEach(c => strategies.push({ p: c, s: c, ratio: { p: 6, s: 0 } }));

        const pairs = [
            ['dmg', 'cf'], ['dmg', 'spa'], ['dmg', 'range'], ['dmg', 'cm'],
            ['cf', 'cm'], ['spa', 'range']
        ];
        const ratios = [{ p: 4, s: 3 }, { p: 3, s: 4 }, { p: 5, s: 2 }, { p: 2, s: 5 }];

        pairs.forEach(pair => {
            const [c1, c2] = pair;
            if (!candidates.includes(c1) || !candidates.includes(c2)) return;
            ratios.forEach(r => strategies.push({ p: c1, s: c2, ratio: r }));
        });

        strategies.forEach(strat => {
            let testBuild = { ...build };
            let currentAssignments = {};

            if (actualIncludeHead) {
                const res = applyContextualStats(testBuild, 'head', null, strat.p, strat.s, strat.ratio);
                currentAssignments.head = formatAssignment(res);
            }

            const resBody = applyContextualStats(testBuild, 'body', build.bodyType, strat.p, strat.s, strat.ratio);
            currentAssignments.body = formatAssignment(resBody);
            
            const resLegs = applyContextualStats(testBuild, 'legs', build.legType, strat.p, strat.s, strat.ratio);
            currentAssignments.legs = formatAssignment(resLegs);

            let res = calculateDPS(stats, testBuild, stats.context);
            // FIX: Attach totalStats to result
            res.totalStats = testBuild;

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

/**
 * Calculates all set bonuses and tag buffs.
 */
function _calcSetAndTagBonuses(relicStats, uStats, headPiece) {
    let sBonus = { ...(setBonuses[relicStats.set] || setBonuses.none) };
    let tagBuffs = { dmg: 0, spa: 0, cm: 0, cf: 0, range: 0, dot: 0 };
    
    // Apply Head Piece Static Bonuses
    if (headPiece === 'reaper_necklace') {
        if (relicStats.set !== 'reaper_set') {
            sBonus.spa = (sBonus.spa || 0) + 7.5;
            sBonus.range = (sBonus.range || 0) + 15;
        }
    } else if (headPiece === 'shadow_reaper_necklace') {
        if (relicStats.set !== 'shadow_reaper') {
            sBonus.dmg = (sBonus.dmg || 0) + 2.5;
            sBonus.range = (sBonus.range || 0) + 10;
            sBonus.cf = (sBonus.cf || 0) + 5;
            sBonus.cm = (sBonus.cm || 0) + 5;
        }
    }

    const unitElement = uStats.element || "None";
    const tags = uStats.tags || [];

    // Elemental Set Bonuses
    if (relicStats.set === 'ninja' && ["Dark", "Rose", "Fire"].includes(unitElement)) {
        sBonus.dmg += 10;
    } else if (relicStats.set === 'sun_god' && ["Ice", "Light", "Water"].includes(unitElement)) {
        sBonus.dmg += 10;
    }

    // Tag Specific Bonuses
    const applyTagBuff = (bonusName, tagName, stats) => {
         if (relicStats.set === bonusName && tags.includes(tagName)) {
             for(let k in stats) {
                 sBonus[k] = (sBonus[k] || 0) + stats[k];
                 tagBuffs[k] = (tagBuffs[k] || 0) + stats[k];
             }
         }
    };

    // Shadow Reaper Tag Logic
    applyTagBuff('shadow_reaper', 'Peroxide', { spa: 10 });
    applyTagBuff('shadow_reaper', 'Reaper', { dmg: 25, spa: 12.5 });
    applyTagBuff('shadow_reaper', 'Rage', { dmg: 15, spa: 8.5, dot: 10 });
    applyTagBuff('shadow_reaper', 'Hollow', { cf: 20, cm: 12.5 });

    // Reaper Set Tag Logic
    applyTagBuff('reaper_set', 'Peroxide', { dmg: 10, dot: 5, cm: 8.5 });
    applyTagBuff('reaper_set', 'Reaper', { range: 15 });
    applyTagBuff('reaper_set', 'Rage', { cm: 25, cf: 10, range: 10 });
    applyTagBuff('reaper_set', 'Hollow', { dmg: 12.5, spa: 7.5, range: 15 });

    return { sBonus, tagBuffs };
}

/**
 * Calculates Head Piece dynamic buffs (uptime dependent).
 */
function _calcHeadDynamicBuffs(headPiece, finalSpa, finalRange) {
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
    return { headDmgBuff, headDotBuff, headCalc };
}

/**
 * Calculates Summon / Plane DPS.
 */
function _calcSummonDPS(uStats, finalDmg, finalSpa, placement) {
    if (!uStats.summonStats) return { summonDpsTotal: 0, summonData: null };

    const s = uStats.summonStats;
    const planeBaseDmg = finalDmg * (s.dmgPct / 100);
    
    const calcPlaneTypeDPS = (typeStats) => {
        const attacksPerLife = Math.floor(typeStats.duration / typeStats.spa) + 1;
        let totalDamageOverLife = 0;
        for (let i = 0; i < attacksPerLife; i++) {
            const time = i * typeStats.spa;
            let isBuffed = time < s.buffWindow;
            let pCr = isBuffed ? s.buffCrit : 0;
            let pCdmg = isBuffed ? s.buffCdmg : 150;
            let pMult = (1 + ((pCdmg/100) * (pCr/100)));
            totalDamageOverLife += planeBaseDmg * pMult;
        }
        return totalDamageOverLife / typeStats.duration; 
    };

    const dpsA = calcPlaneTypeDPS(s.planeA);
    const dpsB = calcPlaneTypeDPS(s.planeB);
    const avgOnePlaneDps = (dpsA + dpsB) / 2;
    const avgDuration = (s.planeA.duration + s.planeB.duration) / 2;
    const theoreticalCount = avgDuration / finalSpa;
    const actualCount = Math.min(theoreticalCount, s.maxCount);
    
    return {
        summonDpsTotal: (avgOnePlaneDps * actualCount) * placement,
        summonData: {
            count: actualCount,
            max: s.maxCount,
            avgPlaneDps: avgOnePlaneDps,
            hostSpa: finalSpa,
            avgDuration: avgDuration,
            dpsA: dpsA,
            dpsB: dpsB
        }
    };
}

function _calcDoTDPS(uStats, traitObj, totalDotBuffs, baseR_Dot, finalDmg, finalSpa, placement, isVirtualRealm, avgCritMult) {
    let dotDpsTotal = 0;
    const dotCritMult = isVirtualRealm ? avgCritMult : 1;

    let dotBreakdown = { 
        nativeDps: 0,
        radDps: 0,
        base: uStats.dot + totalDotBuffs, 
        relicMult: 1 + (baseR_Dot / 100), 
        critMult: dotCritMult,
        nativeInterval: 0,
        nativeTotalDmg: 0,
        radInterval: 0,
        radTotalDmg: 0
    };

    const canStack = (traitObj.allowDotStack || traitObj.allowPlacementStack);

    // 1. NATIVE DOT (Burn, Bleed, etc.)
    if (uStats.dot > 0) {
        const nativeTickPct = (uStats.dot + totalDotBuffs) * dotBreakdown.relicMult;
        const totalNativeDmg = finalDmg * (nativeTickPct / 100) * dotCritMult;
        
        const duration = uStats.dotDuration || 0;
        // Interval Logic: First attack after duration expires
        const interval = canStack ? finalSpa : (duration > 0 ? Math.ceil(duration / finalSpa) * finalSpa : finalSpa);
        
        dotBreakdown.nativeTotalDmg = totalNativeDmg;
        dotBreakdown.nativeInterval = interval;
        dotBreakdown.nativeDps = totalNativeDmg / interval;
    }

    // 2. RADIATION DOT (Fission Trait)
    if (traitObj.hasRadiation) {
        const radPct = traitObj.radiationPct || 20;
        const duration = traitObj.radiationDuration || 10;
        const totalRadDmg = finalDmg * (radPct / 100) * dotCritMult;
        
        // Interval Logic: First attack after the 10s duration expires (e.g., 6.2 -> 12.4)
        const interval = canStack ? finalSpa : Math.ceil(duration / finalSpa) * finalSpa;

        dotBreakdown.radTotalDmg = totalRadDmg;
        dotBreakdown.radInterval = interval;
        dotBreakdown.radDps = totalRadDmg / interval;
    }

    const combinedOneUnitDps = dotBreakdown.nativeDps + dotBreakdown.radDps;
    dotDpsTotal = combinedOneUnitDps * (canStack ? placement : 1);

    return { dotDpsTotal, dotBreakdown };
}

function calculateDPS(uStats, relicStats, context) {
    // Destructure rangePoints from context
    const { dmgPoints, spaPoints, rangePoints, wave, isBoss, traitObj, placement, isSSS, headPiece, isVirtualRealm, starMult } = context;

    // 1. Level Scaling (Now uses rangePoints for Range scaling)
    let lvStats = getLevelStats(uStats.dmg, uStats.spa, uStats.range || 0, dmgPoints, spaPoints, rangePoints);
    
    // UPDATED: Rank Scaling (Custom or SSS)
    // If rankData exists, use it. Otherwise, fallback to hardcoded SSS values if isSSS is true.
    let rDmg = 0, rSpa = 0, rRange = 0;

    if (context.rankData) {
        // Custom Rank Data from Calculator
        rDmg = context.rankData.dmg || 0;
        rSpa = context.rankData.spa || 0;
        rRange = context.rankData.range || 0;
    } else if (isSSS) {
        // Standard App SSS Defaults
        rDmg = 20;  // +20%
        rSpa = 8;   // -8% (represented as positive reduction)
        rRange = 20; // +20%
    }

    if (rDmg !== 0) lvStats.dmg *= (1 + rDmg/100);
    if (rSpa !== 0) lvStats.spa *= (1 - rSpa/100);
    if (rRange !== 0) lvStats.range *= (1 + rRange/100);

    // 2. Trait & Passive Setup
    let passivePcent = (uStats.passiveDmg || 0) + (uStats.buffDmg || 0);
    let passiveSpaPcent = uStats.passiveSpa || 0;
    let traitDmgPct = traitObj.dmg + (traitObj.bossDmg && isBoss ? traitObj.bossDmg : 0);
    let traitSpaPct = traitObj.spa; 
    let traitCritRate = traitObj.critRate || 0;
    let traitRangePct = traitObj.range || 0;
    let traitDotBuff = traitObj.dotBuff || 0;

    let eternalDmgBuff = 0;
    let eternalRangeBuff = 0;
    if (traitObj.isEternal) {
        const waveCap = Math.min(wave, 12);
        eternalDmgBuff = waveCap * 5; 
        passivePcent += eternalDmgBuff; 
        eternalRangeBuff = waveCap * 2.5; 
    }

    // 3. Set Bonus Logic
    let { sBonus, tagBuffs } = _calcSetAndTagBonuses(relicStats, uStats, headPiece);
    if (starMult && starMult !== 1) {
        for (let key in sBonus) {
            if (typeof sBonus[key] === 'number') sBonus[key] *= starMult;
        }
    }
    if (sBonus.dot === undefined) sBonus.dot = 0;

    // 4. Relic Base Stats
    const getRelicStat = (stat, apply) => apply ? relicStats[stat] : 0;
    let baseR_Dmg = getRelicStat('dmg', statConfig.applyRelicDmg);
    let baseR_Spa = getRelicStat('spa', statConfig.applyRelicSpa);
    let baseR_Cm  = getRelicStat('cm', statConfig.applyRelicCrit); 
    let baseR_Cf  = relicStats.cf; 
    let baseR_Dot = getRelicStat('dot', statConfig.applyRelicDot);
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
    // Updated: Range sources now multiply distinct buckets (Trait * Relic * Set * Passive)
    const mTrait = 1 + (traitRangePct / 100);
    const mRelic = 1 + (baseR_Range / 100); // Substats (includes Artificer scaling)
    
    const totalPassiveRange = (uStats.passiveRange || 0) + eternalRangeBuff;
    const totalAdditiveRange = (sBonus.range || 0) + totalPassiveRange;
    const mAdditiveRange = 1 + (totalAdditiveRange / 100);
    
    const finalRange = lvStats.range * mTrait * mRelic * mAdditiveRange;

    // 7. HEAD PIECE PASSIVES
    const { headDmgBuff, headDotBuff, headCalc } = _calcHeadDynamicBuffs(headPiece, finalSpa, finalRange);

    // 8. FINAL DAMAGE CALCULATION
    const additiveTotal = sBonus.dmg + passivePcent + headDmgBuff;
    const conditionalMult = uStats.burnMultiplier ? (1 + uStats.burnMultiplier / 100) : 1;
    const finalDmg = lvStats.dmg * (1 + traitDmgPct / 100) * (1 + baseR_Dmg / 100) * (1 + additiveTotal / 100) * conditionalMult;

    // 9. CRIT CALCULATION
    const totalCmBuff = (sBonus.cm || 0) + baseR_Cm; 
    const finalCdmgStat = uStats.cdmg + totalCmBuff; 
    let rCf = (uStats.id === 'kirito') ? 0 : (baseR_Cf + (sBonus.cf || 0)); 
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
            attackMultiplier = 1 + (uStats.extraAttacks / attacksToTrigger);
            extraAttacksData = { req: uStats.reqCrits, hits: uStats.hitCount, extra: uStats.extraAttacks, attacksNeeded: attacksToTrigger, mult: attackMultiplier };
        }
    }
    const hitDpsTotal = (avgHit / finalSpa) * placement * attackMultiplier;

    // 11. SUMMON / PLANE CALCULATION
    const { summonDpsTotal, summonData } = _calcSummonDPS(uStats, finalDmg, finalSpa, placement);

    // 12. DoT CALCULATION
    let totalDotBuffs = traitDotBuff + headDotBuff + sBonus.dot;
    const { dotDpsTotal, dotBreakdown } = _calcDoTDPS(uStats, traitObj, totalDotBuffs, baseR_Dot, finalDmg, finalSpa, placement, isVirtualRealm, avgCritMult);
    dotBreakdown.baseNoHead = uStats.dot + traitDotBuff + sBonus.dot; // Correct back for display

   return {
        total: hitDpsTotal + dotDpsTotal + summonDpsTotal,
        hit: hitDpsTotal,
        dot: dotDpsTotal,
        summon: summonDpsTotal,
        summonData,
        spa: finalSpa,
        spaCap: cap,
        range: finalRange,
        passiveRange: totalPassiveRange,
        dmgVal: finalDmg,
        lvStats,
        traitBuffs: { dmg: traitDmgPct, spa: traitSpaPct, range: traitRangePct },
        traitObj,
        relicBuffs: { dmg: baseR_Dmg, spa: baseR_Spa, dot: baseR_Dot, range: baseR_Range, cf: baseR_Cf, cm: baseR_Cm }, 
        setBuffs: { dmg: sBonus.dmg, spa: sBonus.spa }, 
        totalSetStats: sBonus,
        tagBuffs,
        passiveBuff: passivePcent + headDmgBuff, 
        passiveSpaBuff: passiveSpaPcent,
        eternalBuff: eternalDmgBuff,
        eternalRangeBuff: eternalRangeBuff,
        totalAdditivePct: additiveTotal,
        conditionalData: uStats.burnMultiplier ? { name: "Target: Burn", val: uStats.burnMultiplier, mult: conditionalMult } : null,
        headBuffs: { dmg: headDmgBuff, dot: headDotBuff, type: headPiece, ...headCalc },
        dotData: dotBreakdown,
        critData: { rate: finalCritRate, cdmg: finalCdmgStat, baseCdmg: uStats.cdmg, relicCmPct: baseR_Cm, setCm: sBonus.cm, totalCmBuff, preRelicCdmg: uStats.cdmg, avgMult: avgCritMult },
        placement,
        isSSS,
        rawFinalSpa,
        spaAfterRelic, 
        setAndPassiveSpa, 
        baseStats: uStats,
        dmgPoints: context.dmgPoints,
        spaPoints: context.spaPoints,
        rangePoints: context.rangePoints,
        singleUnitDoT: dotDpsTotal / (traitObj.allowDotStack || traitObj.allowPlacementStack ? placement : 1), 
        hasStackingDoT: traitObj.allowDotStack || traitObj.allowPlacementStack,
        extraAttacks: extraAttacksData,
        abilityBuff: uStats.buffDmg || 0 
    };
}