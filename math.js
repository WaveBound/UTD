function combineTraits(t1, t2) {
    if (t1.id === 'none' && t2.id === 'none') return t1;
    if (t1.id === 'none') return t2;
    if (t2.id === 'none') return t1;

    // Helper: Compound Multiplicative Stats (Damage, Range, BossDmg)
    // Logic: (1 + 200%) * (1 + 200%) = 3 * 3 = 9 (+800%)
    const compound = (v1, v2) => {
        const d1 = (v1 || 0) / 100;
        const d2 = (v2 || 0) / 100;
        return ((1 + d1) * (1 + d2) - 1) * 100;
    };

    // Helper: Compound Reduction Stats (SPA)
    // Logic: 1 - ((1 - 0.20) * (1 - 0.20)) = 1 - 0.64 = 0.36 (36% reduction)
    const compoundReduction = (v1, v2) => {
        const r1 = (v1 || 0) / 100;
        const r2 = (v2 || 0) / 100;
        return (1 - (1 - r1) * (1 - r2)) * 100;
    };

    let combined = {
        id: t1.id + "+" + t2.id,
        name: `${t1.name} + ${t2.name}`,
        isCustom: true,
        // STORE SUB TRAITS FOR UI DISPLAY
        subTraits: [t1, t2], 
        
        // Multiplicative Math
        dmg: compound(t1.dmg, t2.dmg),
        spa: compoundReduction(t1.spa, t2.spa),
        range: compound(t1.range, t2.range),
        bossDmg: compound(t1.bossDmg, t2.bossDmg),
        
        // Additive Math (Flat Stat Additions)
        critRate: (t1.critRate || 0) + (t2.critRate || 0),
        dotBuff: (t1.dotBuff || 0) + (t2.dotBuff || 0),

        isEternal: t1.isEternal || t2.isEternal,
        hasRadiation: t1.hasRadiation || t2.hasRadiation,
        allowDotStack: t1.allowDotStack || t2.allowDotStack,
        relicBuff: (t1.relicBuff ? t1.relicBuff - 1 : 0) + (t2.relicBuff ? t2.relicBuff - 1 : 0) + 1,
        
        limitPlace: (t1.limitPlace && t2.limitPlace) ? Math.min(t1.limitPlace, t2.limitPlace) : (t1.limitPlace || t2.limitPlace)
    };
    if(combined.relicBuff === 1) combined.relicBuff = undefined;
    return combined;
}

function getLevelStats(baseDmg, baseSpa, level, priority) {
    let dmgMult = 1, spaMult = 1;
    if (priority === 'dmg') {
        dmgMult = Math.pow(1.004525, level);
    } else {
        spaMult = Math.pow(0.995475, level);
    }
    return { 
        dmg: baseDmg * dmgMult, 
        spa: baseSpa * spaMult, 
        dmgMult, spaMult 
    };
}

function calculateDPS(uStats, relicStats, context) {
    const { level, priority, wave, isBoss, traitObj, placement, isSSS } = context;

    let lvStats = getLevelStats(uStats.dmg, uStats.spa, level, priority);

    if (isSSS) {
        lvStats.dmg *= 1.2;
        lvStats.spa *= 0.92;
    }

    let passivePcent = uStats.passiveDmg || 0;
    let passiveSpaPcent = uStats.passiveSpa || 0;
    let traitDmgPct = traitObj.dmg;
    let traitSpaPct = traitObj.spa; 
    let traitCritRate = traitObj.critRate || 0;
    let traitRangePct = traitObj.range || 0;

    if (traitObj.isEternal) {
        passivePcent += Math.min(wave, 25) * 2;
    }
    if (traitObj.bossDmg && isBoss) traitDmgPct += traitObj.bossDmg;

    // --- SET BONUS LOGIC ---
    let sBonus = { ...(setBonuses[relicStats.set] || setBonuses.none) };
    const unitElement = uStats.element || "None";

    if (relicStats.set === 'ninja') {
        const allowedElements = ["Dark", "Rose", "Fire"];
        if (allowedElements.includes(unitElement)) sBonus.dmg += 10; 
    } else if (relicStats.set === 'sun_god') {
        const allowedElements = ["Ice", "Light", "Water"];
        if (allowedElements.includes(unitElement)) sBonus.dmg += 10;
    }

    let baseR_Dmg = statConfig.applyRelicDmg ? relicStats.dmg : 0;
    let baseR_Spa = statConfig.applyRelicSpa ? relicStats.spa : 0;
    let baseR_Cm  = statConfig.applyRelicCrit ? relicStats.cm : 0; 
    let baseR_Cf  = relicStats.cf; 
    let baseR_Dot = statConfig.applyRelicDot ? relicStats.dot : 0;
    let baseR_Range = relicStats.range || 0;

    if (traitObj.relicBuff) {
        const mult = traitObj.relicBuff; 
        baseR_Dmg *= mult; 
        baseR_Spa *= mult; 
        baseR_Cm  *= mult; 
        baseR_Dot *= mult; 
        baseR_Cf  *= mult;
        baseR_Range *= mult;
    }

    const traitMult = (1 + traitDmgPct / 100);
    const relicMult = (1 + baseR_Dmg / 100);
    const setAndPassiveMult = (1 + (sBonus.dmg + passivePcent) / 100);
    const finalDmg = lvStats.dmg * traitMult * relicMult * setAndPassiveMult;

    const afterTraitSpa = lvStats.spa * (1 - traitSpaPct / 100);
    let rSpaTotal = baseR_Spa + sBonus.spa + passiveSpaPcent;
    const rawFinalSpa = afterTraitSpa * (1 - rSpaTotal / 100);
    const cap = uStats.spaCap || 0.1;
    const finalSpa = Math.max(rawFinalSpa, cap);

    // Range Calculation
    const baseRange = uStats.range || 0;
    const passiveRange = uStats.passiveRange || 0;
    const rangeMult = 1 + (traitRangePct + baseR_Range + passiveRange) / 100;
    const finalRange = baseRange * rangeMult;

    let setCm = sBonus.cm || 0; 
    const preRelicCdmg = uStats.cdmg + setCm;
    const finalCdmgStat = preRelicCdmg * (1 + baseR_Cm / 100);
    let rCf  = baseR_Cf + (sBonus.cf || 0); 
    if (uStats.id === 'kirito') rCf = 0; 

    const finalCritRate = Math.min(uStats.crit + traitCritRate + rCf, 100);
    const avgCritMult = (1 + ((finalCdmgStat / 100) * (finalCritRate / 100)));
    const avgHit = finalDmg * avgCritMult;
    
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

    let dotDpsTotal = 0;
    let dotBreakdown = { base: uStats.dot + (traitObj.dotBuff || 0), relicMult: 1, finalPct: 0, critMult: avgCritMult, internal: 1, finalTick: 0, timeUsed: finalSpa };
    
    if (uStats.dot > 0 || traitObj.hasRadiation) {
        let extraDotBuff = traitObj.dotBuff || 0;
        const internalStacks = (traitObj.allowDotStack) ? uStats.dotStacks : 1;
        const baseDotPct = uStats.dot + extraDotBuff;
        const relicDotMult = 1 + (baseR_Dot / 100);
        const singleTickPct = baseDotPct * relicDotMult;
        
        dotBreakdown.relicMult = relicDotMult;
        dotBreakdown.finalPct = singleTickPct;

        const totalDoTPct = singleTickPct * internalStacks;
        const totalDoTDmg = finalDmg * (totalDoTPct / 100) * avgCritMult;
        
        let timeBasis = finalSpa; 
        if (!traitObj.allowDotStack && uStats.dotDuration && uStats.dotDuration > 0) {
                timeBasis = Math.max(uStats.dotDuration, finalSpa);
        }

        const oneUnitDoTDps = totalDoTDmg / timeBasis;
        if (traitObj.allowDotStack) {
            dotDpsTotal = oneUnitDoTDps * placement;
        } else {
            dotDpsTotal = oneUnitDoTDps * 1; 
        }
        dotBreakdown.internal = internalStacks;
        dotBreakdown.finalTick = totalDoTDmg;
        dotBreakdown.timeUsed = timeBasis;
    }

    return {
        total: hitDpsTotal + dotDpsTotal,
        hit: hitDpsTotal,
        dot: dotDpsTotal,
        spa: finalSpa,
        range: finalRange,
        dmgVal: finalDmg,
        lvStats: lvStats,
        traitBuffs: { dmg: traitDmgPct, spa: traitSpaPct, range: traitRangePct },
        // IMPORTANT: Return full traitObj so UI can read subTraits
        traitObj: traitObj,
        relicBuffs: { dmg: baseR_Dmg, spa: baseR_Spa, dot: baseR_Dot, range: baseR_Range }, 
        setBuffs: { dmg: sBonus.dmg, spa: sBonus.spa }, 
        passiveBuff: passivePcent,
        passiveSpaBuff: passiveSpaPcent,
        dotData: dotBreakdown,
        critData: { 
            rate: finalCritRate, cdmg: finalCdmgStat, baseCdmg: uStats.cdmg, relicCmPct: baseR_Cm, setCdmg: setCm, preRelicCdmg: preRelicCdmg, avgMult: avgCritMult 
        },
        priority: priority,
        placement: placement,
        isSSS: isSSS,
        rawFinalSpa: rawFinalSpa,
        baseStats: uStats,
        level: level,
        singleUnitDoT: dotDpsTotal / (traitObj.allowDotStack ? placement : 1), 
        hasStackingDoT: traitObj.allowDotStack,
        extraAttacks: extraAttacksData
    };
}