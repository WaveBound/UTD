const statConfig = {
    applyRelicDmg: true,  
    applyRelicSpa: true,  
    applyRelicCrit: false, 
    applyRelicDot: false   
};

const PERFECT_SUBS = {
    dmg: 4, spa: 1.5, cm: 4.5, cf: 2.5, dot: 5, range: 2
};

const SUB_CANDIDATES = ['dmg', 'spa', 'cm', 'cf', 'dot'];

const SUB_NAMES = {
    dmg: "Dmg", spa: "SPA", cm: "Crit Dmg", cf: "Crit Rate", dot: "DoT"
};

function formatStatBadge(text) {
    if(!text) return '';
    if (text.includes('<')) return text;
    
    return text.replace(/(Crit Dmg|Crit Damage)|(Crit Rate)|(Damage|Dmg)|(Spa|SPA)|(DoT|Buff Potency)|(Range|Rng)/gi, 
        (match, cdmg, crate, dmg, spa, dot, rng) => {
            if (cdmg) return '<span class="stat-badge stat-cdmg"><span class="stat-cdmg-text">Crit Dmg</span></span>';
            if (crate) return '<span class="stat-badge stat-crit">Crit Rate</span>';
            if (dmg) return '<span class="stat-badge stat-dmg">Dmg</span>';
            if (spa) return '<span class="stat-badge stat-spa">Spa</span>';
            if (dot) return '<span class="stat-badge stat-dot">' + match + '</span>';
            if (rng) return '<span class="stat-badge stat-range">Range</span>';
            return match;
        }
    );
}

// =========================================
// 1. DATA DEFINITIONS
// =========================================
const guideData = [
    {
        unit: "Miku",
        img: "",
        current: { trait: "Buff Potency", set: "Any", main: "Buff Potency", sub: "Buff Potency" },
        fixed: { trait: "Buff Potency", set: "Any", main: "Buff Potency", sub: "Buff Potency" }
    },
    {
        unit: "Supports",
        img: "",
        current: { trait: "Spa / Range", set: "Laughing / Swift", main: "Spa / Range", sub: "Spa / Rng / Dmg" },
        fixed: { trait: "Spa / Range", set: "Laughing / Swift", main: "Spa / Range", sub: "Spa / Rng" }
    },
    {
        unit: "Other DPS",
        img: "",
        current: { trait: "Damage > Spa", set: "Laughing / Ninja", main: "Damage > Spa", sub: "Crit Rate / Spa" },
        fixed: { trait: "Dependent on Kit", set: "Laughing Captain", main: "Dependent", sub: "Crit Rate" }
    },
    { unit: "Ace", img: "images/Ace.png", isCalculated: true },
    { unit: "SJW", img: "images/SJW.png", isCalculated: true },
    { unit: "Sasuke", img: "images/Sasuke.png", isCalculated: true },
    { unit: "Kirito", img: "images/Kirito.png", isCalculated: true },
    { unit: "Kenpachi", img: "images/Kenpachi.png", isCalculated: true },
    { unit: "Ragna", img: "images/Ragna.png", isCalculated: true },
    { unit: "Mob", img: "images/Mob.png", isCalculated: true },
    { unit: "Shanks", img: "images/Shanks.png", isCalculated: true }
];

const setBonuses = {
    laughing: { dmg: 5, spa: 5, cf: 0, cm: 0 },
    ninja: { dmg: 10, spa: 0, cf: 0, cm: 0 },
    ex: { dmg: 0, spa: 0, cf: 0, cm: 25 }, 
    none: { dmg: 0, spa: 0, cf: 0, cm: 0 }
};

const BODY_DMG  = { dmg: 60, dot: 0,  cm: 0,   desc: "Dmg",  type: "dmg" };
const BODY_DOT  = { dmg: 0,  dot: 75, cm: 0,   desc: "DoT",  type: "dot" };
const BODY_CDMG = { dmg: 0,  dot: 0,  cm: 120, desc: "Crit Dmg", type: "cm" };

const LEG_DMG   = { dmg: 60, spa: 0,    desc: "Dmg", type: "dmg" };
const LEG_SPA   = { dmg: 0,  spa: 22.5, desc: "Spa", type: "spa" };
const LEG_CRIT  = { dmg: 0,  spa: 0,    desc: "Crit Rate", type: "cf", cf: 37.5 }; 

const SETS = [
    { id: "ninja",    name: "Master Ninja",     bonus: { dmg: 10, spa: 0, cm: 0 } },
    { id: "laughing", name: "Laughing Captain", bonus: { dmg: 5, spa: 5, cm: 0 } },
    { id: "ex",       name: "Ex Captain",       bonus: { dmg: 0, spa: 0, cm: 25 } }
];

const globalBuilds = [];
SETS.forEach(set => {
    const bodies = [BODY_DMG, BODY_DOT, BODY_CDMG];
    const legs   = [LEG_DMG, LEG_SPA, LEG_CRIT];
    bodies.forEach(body => {
        legs.forEach(leg => {
            globalBuilds.push({
                name: `${set.name} (${body.desc}/${leg.desc})`,
                set:  set.id,
                dmg:  body.dmg + leg.dmg,
                spa:  leg.spa, 
                dot:  body.dot,
                cm:   body.cm, 
                cf:   (body.cf || 0) + (leg.cf || 0),
                bodyType: body.type,
                legType: leg.type
            });
        });
    });
});

const traitsList = [
    { id: "eternal", name: "Eternal", dmg: 0, spa: 20, desc: "-20% SPA, +Dmg/Wave", isEternal: true },
    { id: "fission", name: "Fission", dmg: 15, spa: 15, desc: "+15% Dmg/SPA", hasRadiation: true },
    { id: "ruler", name: "Ruler", dmg: 200, spa: 20, desc: "+200% Dmg, Limit 1", limitPlace: 1 },
    { id: "artificer", name: "Artificer", dmg: 0, spa: 0, desc: "+15% Relic Stats", relicBuff: 1.15 },
    { id: "wizard", name: "Wizard", dmg: 0, spa: 15, desc: "+30% DoT, -15% SPA", dotBuff: 30 },
    { id: "astral", name: "Astral", dmg: 0, spa: 20, desc: "DoT Stacks, Limit 1", limitPlace: 1, allowDotStack: true },
    { id: "duelist", name: "Duelist", dmg: 0, spa: 0, desc: "+Crit/Boss Dmg", critRate: 25, bossDmg: 35 },
    { id: "sacred", name: "Sacred", dmg: 25, spa: 10, desc: "+25% Dmg, -10% SPA" },
    { id: "none", name: "None", dmg: 0, spa: 0, desc: "No buffs" }
];

let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(); 

// =========================================
// SORTED UNIT DATABASE
// =========================================
const unitDatabase = [
    // --- 1. Top Meta Carries ---
    {
        id: "Maid", name: "Scarlet Maid (World)", role: "Dmg / Support",
        img: "images/Maid.png", 
        placement: 1,
        stats: { dmg: 2950, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, passiveDmg: 0, element: "Light", dotDuration: 0 }
    },
    {
        id: "sjw", name: "SJW (Monarch)", role: "Raw Dmg",
        img: "images/Sjw.png", 
        placement: 1,
        stats: { dmg: 3250, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 5, passiveDmg: 15, element: "Dark" }
    },
    {
        id: "ragna", name: "Ragna (Silverite)", role: "Burst / Hybrid",
        img: "images/Ragna.png", 
        placement: 1,
        stats: { dmg: 1800, spa: 9, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 0, element: "Ice" },
        ability: { dmg: 3960, spa: 15 } 
    },
    {
        id: "ace", name: "Ace", role: "Burn / DoT",
        img: "images/Ace.png",
        placement: 3,
        stats: { dmg: 1500, spa: 9, crit: 0, cdmg: 150, dot: 100, dotStacks: 5, spaCap: 6, passiveDmg: 60, element: "Fire", dotDuration: 4 }
    },
    {
        id: "kirito", name: "Kirito", role: "Burst / Crit",
        img: "images/Kirito.png",
        placement: 3,
        stats: { dmg: 1200, spa: 7, crit: 50, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, hitCount: 14, reqCrits: 50, extraAttacks: 0, element: "Ice" }
    },
    {
        id: "kenpachi", name: "Kenpachi", role: "Raw Dmg / Slow",
        img: "images/Kenpachi.png",
        placement: 1,
        stats: { dmg: 2900, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.0, element: "Light" }
    },
    {
        id: "sasuke", name: "Sasuke (Chakra)", role: "Raw Dmg",
        img: "images/Sasuke.png", 
        placement: 2,
        stats: { dmg: 2450, spa: 6.75, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Dark" }
    },
    {
        id: "mob", name: "Pyscho (100%)", role: "Raw Dmg",
        img: "images/Mob.png", 
        placement: 2,
        stats: { dmg: 2600, spa: 6.5, crit: 0, cdmg: 150, dot: 20, dotStacks: 1, spaCap: 5.5, passiveDmg: 0, element: "Rose", dotDuration: 4 }
    },
    {
        id: "shanks", name: "Shanks (Conqueror)", role: "Raw Dmg",
        img: "images/Shanks.png", 
        placement: 1,
        stats: { dmg: 2750, spa: 12, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.5, passiveDmg: 0, element: "Rose", dotDuration: 0}
    },
    {
        id: "genos", name: "Cyborg (Fearless)", role: "Dmg / Burn",
        img: "images/Genos.png", 
        placement: 3,
        stats: { dmg: 1450, spa: 5.5, crit: 0, cdmg: 150, dot: 14, dotStacks: 7, spaCap: 4, passiveDmg: 0, element: "Fire", dotDuration: 7 }
    }
];

// =========================================
// 2. LOGIC
// =========================================

function combineTraits(t1, t2) {
    if (t1.id === 'none' && t2.id === 'none') return t1;
    if (t1.id === 'none') return t2;
    if (t2.id === 'none') return t1;

    let combined = {
        id: t1.id + "+" + t2.id,
        name: `${t1.name} + ${t2.name}`,
        isCustom: true, 
        dmg: t1.dmg + t2.dmg,
        spa: t1.spa + t2.spa,
        isEternal: t1.isEternal || t2.isEternal,
        hasRadiation: t1.hasRadiation || t2.hasRadiation,
        allowDotStack: t1.allowDotStack || t2.allowDotStack,
        relicBuff: (t1.relicBuff ? t1.relicBuff - 1 : 0) + (t2.relicBuff ? t2.relicBuff - 1 : 0) + 1,
        dotBuff: (t1.dotBuff || 0) + (t2.dotBuff || 0),
        critRate: (t1.critRate || 0) + (t2.critRate || 0),
        bossDmg: (t1.bossDmg || 0) + (t2.bossDmg || 0),
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
        lvStats.dmg *= 1.16;
        lvStats.spa *= 0.92;
    }

    let passivePcent = uStats.passiveDmg || 0;
    let traitDmgPct = traitObj.dmg;
    let traitSpaPct = traitObj.spa; 
    let traitCritRate = traitObj.critRate || 0;

    if (traitObj.isEternal) {
        passivePcent += Math.min(wave, 25) * 2;
    }
    if (traitObj.bossDmg && isBoss) traitDmgPct += traitObj.bossDmg;

    let sBonus = setBonuses[relicStats.set] || setBonuses.none;
    
    if (relicStats.set === 'ninja') {
        const unitElement = uStats.element || "None";
        const allowedElements = ["Dark", "Rose", "Fire"];
        if (!allowedElements.includes(unitElement)) {
            sBonus = setBonuses.none;
        }
    }

    let baseR_Dmg = statConfig.applyRelicDmg ? relicStats.dmg : 0;
    let baseR_Spa = statConfig.applyRelicSpa ? relicStats.spa : 0;
    let baseR_Cm  = statConfig.applyRelicCrit ? relicStats.cm : 0; 
    let baseR_Cf  = relicStats.cf; 
    let baseR_Dot = statConfig.applyRelicDot ? relicStats.dot : 0;

    if (traitObj.relicBuff) {
        const mult = traitObj.relicBuff; 
        baseR_Dmg *= mult; 
        baseR_Spa *= mult; 
        baseR_Cm  *= mult; 
        baseR_Dot *= mult; 
        baseR_Cf  *= mult;
    }

    const traitMult = (1 + traitDmgPct / 100);
    const relicMult = (1 + baseR_Dmg / 100);
    const setAndPassiveMult = (1 + (sBonus.dmg + passivePcent) / 100);
    const finalDmg = lvStats.dmg * traitMult * relicMult * setAndPassiveMult;

    const afterTraitSpa = lvStats.spa * (1 - traitSpaPct / 100);
    let rSpaTotal = baseR_Spa + sBonus.spa;
    const rawFinalSpa = afterTraitSpa * (1 - rSpaTotal / 100);
    const cap = uStats.spaCap || 0.1;
    const finalSpa = Math.max(rawFinalSpa, cap);

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
        dmgVal: finalDmg,
        lvStats: lvStats,
        traitBuffs: { dmg: traitDmgPct, spa: traitSpaPct },
        relicBuffs: { dmg: baseR_Dmg, spa: baseR_Spa, dot: baseR_Dot }, 
        setBuffs: { dmg: sBonus.dmg, spa: sBonus.spa }, 
        passiveBuff: passivePcent,
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

// =========================================
// 3. UI LOGIC
// =========================================

const MAX_VALS = {
    dmg: 24, spa: 9, dot: 30, crit: 15, cdmg: 27, range: 12, ha: 0       
};

const SUB_OPTIONS = [
    {val: "none", label: "None"},
    {val: "dmg", label: "Damage (4%)"},
    {val: "spa", label: "SPA (1.5%)"},
    {val: "dot", label: "DoT (5%)"},
    {val: "crit", label: "Crit Rate (2.5%)"},
    {val: "cdmg", label: "Crit Dmg (4.5%)"},
    {val: "range", label: "Range (2%)"}
];

let cachedResults = {}; 
let currentGuideMode = 'current';

function populateInjectorUnitSelect() {
    const sel = document.getElementById('injectorUnitSelect');
    sel.length = 1; 
    unitDatabase.forEach(u => {
        sel.add(new Option(u.name, u.id));
    });
}

function addCustomTrait() {
    const id1 = document.getElementById('db_t1').value;
    const id2 = document.getElementById('db_t2').value;
    const targetUnitId = document.getElementById('injectorUnitSelect').value;
    const t1 = traitsList.find(t => t.id === id1);
    const t2 = traitsList.find(t => t.id === id2);
    
    if (t1 && t2) {
        const combo = combineTraits(t1, t2);
        if (targetUnitId === 'all') {
            const allTraits = [...traitsList, ...customTraits];
            const alreadyExists = allTraits.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') {
                customTraits.push(combo);
                alert(`Added global custom trait: ${combo.name}`);
            } else alert("Trait combination already exists!");
        } else {
            if (!unitSpecificTraits[targetUnitId]) unitSpecificTraits[targetUnitId] = [];
            const unitList = unitSpecificTraits[targetUnitId];
            const alreadyExists = unitList.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') {
                unitList.push(combo);
                const uName = unitDatabase.find(u => u.id === targetUnitId).name;
                alert(`Added custom trait to ${uName}: ${combo.name}`);
            } else alert("Trait combination already exists for this unit!");
        }
        renderDatabase();
        if(document.getElementById('guidesPage').classList.contains('active')) renderGuides();
    }
}

function toggleSubStats(checkbox) {
    if(checkbox.checked) checkbox.parentNode.classList.add('is-checked');
    else checkbox.parentNode.classList.remove('is-checked');
    renderDatabase(); 
}

function toggleHeadPiece(checkbox) {
    if(checkbox.checked) checkbox.parentNode.classList.add('is-checked');
    else checkbox.parentNode.classList.remove('is-checked');
    renderDatabase(); 
}

function toggleHypothetical(checkbox) {
    if(checkbox.checked) {
        checkbox.parentNode.classList.add('is-checked');
        setGuideMode('fixed');
    } else {
        checkbox.parentNode.classList.remove('is-checked');
        setGuideMode('current');
    }
}

function toggleGuideSubStats(checkbox) {
    if(checkbox.checked) checkbox.parentNode.classList.add('is-checked');
    else checkbox.parentNode.classList.remove('is-checked');
    renderGuides();
}

function toggleGuideHeadPiece(checkbox) {
    if(checkbox.checked) checkbox.parentNode.classList.add('is-checked');
    else checkbox.parentNode.classList.remove('is-checked');
    renderGuides();
}

// --- RENDER DB RESULTS ---
function getUnitResultsHTML(unit, effectiveStats) {
    cachedResults = cachedResults || {};
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    const isAbilActive = activeAbilityIds.has(unit.id); 
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    effectiveStats.id = unit.id;

    const filteredBuilds = globalBuilds.filter(b => {
        // --- MODIFIED HERE ---
        // In 'bugged' mode, Crit Rate (cf) should also be ignored.
        if (currentGuideMode === 'current') {
            if (!statConfig.applyRelicDot && b.dot > 0) return false;
            if (!statConfig.applyRelicCrit && b.cf > 0) return false; // Crit Rate ignored
            if (!statConfig.applyRelicCrit && b.cm > 0) return false;  // Crit Damage ignored
        } else {
            if (!statConfig.applyRelicCrit && b.cm > 0) return false;
            if (!statConfig.applyRelicDot && b.dot > 0) return false;
        }
        // --- END MODIFICATION ---

        if (!statConfig.applyRelicDmg && b.dmg > 10) return false; 
        if (!statConfig.applyRelicSpa && b.spa > 10) return false; 
        return true;
    });

    let unitResults = [];
    
    const getBestSubConfiguration = (build, priority, context) => {
        if (!includeSubs && !includeHead) return { res: calculateDPS(effectiveStats, build, context), desc: "" };
        let bestRes = { total: -1 };
        let bestDesc = "";
        const candidatesToTest = SUB_CANDIDATES.filter(cand => {
            if (!statConfig.applyRelicCrit && cand === 'cm') return false; 
            if (!statConfig.applyRelicDot && cand === 'dot') return false;
            if (currentGuideMode === 'current' && cand === 'cf') return false; // Crit Rate ignored in bugged mode
            return true;
        });
        if (candidatesToTest.length === 0 && includeHead) candidatesToTest.push('dmg');

        candidatesToTest.forEach(cand => {
            let testBuild = { ...build };
            const applyPieceStats = () => {
                    for (let k in PERFECT_SUBS) {
                    let mult = (k === cand) ? 6 : 1; 
                    testBuild[k] += PERFECT_SUBS[k] * mult;
                }
            };
            if (includeSubs) {
                if(testBuild.bodyType !== cand) applyPieceStats();
                else for (let k in PERFECT_SUBS) { if(k !== testBuild.bodyType) testBuild[k] += PERFECT_SUBS[k]; }
                if(testBuild.legType !== cand) applyPieceStats();
                else for (let k in PERFECT_SUBS) { if(k !== testBuild.legType) testBuild[k] += PERFECT_SUBS[k]; }
            }
            if (includeHead) applyPieceStats();

            let res = calculateDPS(effectiveStats, testBuild, context);
            if (res.total > bestRes.total) { bestRes = res; bestDesc = SUB_NAMES[cand]; }
        });
        let descStr = "";
        if(includeSubs) descStr += `Maxed: ${bestDesc}`;
        if(includeHead) descStr += `${includeSubs ? ' + ' : ''}Head: ${bestDesc}`;
        return { res: bestRes, desc: descStr };
    };

    const formatBuildName = (name) => {
        let s = name.replace(/Crit Rate/g, '##CR##').replace(/Crit Dmg/g, '##CD##').replace(/Dmg/g, '##D##').replace(/DoT/g, '##DT##').replace(/Spa/g, '##S##');
        return s.replace(/##CR##/g, "<span style='color:var(--gold)'>Crit Rate</span>")
            .replace(/##CD##/g, "<span style='background: linear-gradient(to right, #a855f7, #ff5555); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;'>Crit Dmg</span>")
            .replace(/##D##/g, "<span style='color:#F5564F'>Dmg</span>")
            .replace(/##DT##/g, "<span style='color:#4ade80'>DoT</span>")
            .replace(/##S##/g, "<span style='color:#68E7F5'>Spa</span>");
    };

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return; 
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);
        filteredBuilds.forEach(build => {
            let contextDmg = { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
            let bestDmgConfig = getBestSubConfiguration(build, 'dmg', contextDmg);
            let resDmg = bestDmgConfig.res;

            let contextSpa = { level: 99, priority: 'spa', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
            let bestSpaConfig = getBestSubConfiguration(build, 'spa', contextSpa);
            let resSpa = bestSpaConfig.res;

            let suffix = isAbilActive ? '-ABILITY' : '-BASE';
            let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
            let headSuffix = includeHead ? '-HEAD' : '-NOHEAD';
            let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');
            
            if (!isNaN(resDmg.total)) {
                let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-dmg${subsSuffix}${headSuffix}`;
                cachedResults[id] = resDmg;
                unitResults.push({
                    id: id, buildName: formatBuildName(build.name), traitName: trait.name, dps: resDmg.total, spa: resDmg.spa, prio: "Dmg Stat", subVariant: bestDmgConfig.desc, isCustom: trait.isCustom
                });
            }
            if (!isNaN(resSpa.total) && resSpa.total > 0) { 
                if (Math.abs(resSpa.total - resDmg.total) > 1) {
                    let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-spa${subsSuffix}${headSuffix}`;
                    cachedResults[id] = resSpa;
                    unitResults.push({
                        id: id, buildName: formatBuildName(build.name), traitName: trait.name, dps: resSpa.total, spa: resSpa.spa, prio: "Spa Stat", subVariant: bestSpaConfig.desc, isCustom: trait.isCustom
                    });
                }
            }
        });
    });

    unitResults.sort((a, b) => b.dps - a.dps);
    if(unitResults.length === 0) return '<div style="padding:10px; color:#666;">No valid builds found.</div>';

    return unitResults.slice(0, 50).map((r, i) => {
        let rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
        if(r.isCustom) rankClass += ' is-custom';
        const searchText = (r.traitName + ' ' + r.buildName.replace(/<[^>]*>?/gm, '') + ' ' + r.prio).toLowerCase();
        const prioType = r.prio === 'Dmg Stat' ? 'dmg' : 'spa';

        return `
            <div class="build-row ${rankClass}" data-filter-text="${searchText}" data-prio-type="${prioType}">
                <div class="rank-number">#${i+1}</div>
                <div class="build-info" style="flex-grow:1;">
                    <span class="trait-tag" title="${r.traitName}">${r.traitName}</span>
                    <span class="build-name">${r.buildName}</span>
                    ${r.subVariant ? `<div class="build-variant"><span>${r.subVariant}</span></div>` : ''}
                    <div class="build-stats-row">
                        <span class="build-stat">SPA: ${r.spa.toFixed(2)}s</span>
                        <span class="build-stat" style="color:${r.prio === 'Dmg Stat' ? 'var(--gold)' : 'var(--custom)'};">[${r.prio}]</span>
                    </div>
                </div>
                <div class="build-right">
                    <span class="build-dps">${format(r.dps)}</span>
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleAbility(unitId, checkbox) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if(!unit) return;
    if (checkbox.checked) activeAbilityIds.add(unitId);
    else activeAbilityIds.delete(unitId);
    let currentStats = { ...unit.stats };
    if (checkbox.checked && unit.ability) Object.assign(currentStats, unit.ability);
    const html = getUnitResultsHTML(unit, currentStats);
    document.getElementById('results-' + unitId).innerHTML = html;
    const searchInput = checkbox.closest('.unit-card').querySelector('.search-container input');
    if(searchInput && searchInput.value) filterList(searchInput);
}

function toggleSelection(id) {
    if (selectedUnitIds.has(id)) {
        selectedUnitIds.delete(id);
        document.getElementById('card-' + id).classList.remove('is-selected');
    } else {
        selectedUnitIds.add(id);
        document.getElementById('card-' + id).classList.add('is-selected');
    }
    updateCompareBtn();
}

function selectAllUnits() {
    const alreadyAll = selectedUnitIds.size === unitDatabase.length;
    if (alreadyAll) selectedUnitIds.clear();
    else unitDatabase.forEach(u => selectedUnitIds.add(u.id));
    renderDatabase(); 
}

function updateCompareBtn() {
    const isDbPage = document.getElementById('dbPage').classList.contains('active');
    const btn = document.getElementById('compareBtn');
    const count = selectedUnitIds.size;
    document.getElementById('compareCount').innerText = count;
    if(count > 0 && isDbPage) btn.style.display = 'block';
    else btn.style.display = 'none';

    const selBtn = document.getElementById('selectAllBtn');
    if(count === unitDatabase.length && count > 0) selBtn.innerText = "Deselect All";
    else selBtn.innerText = "Select All";
}

function openComparison() {
    if(selectedUnitIds.size === 0) return;
    const modal = document.getElementById('compareModal');
    const content = document.getElementById('compareContent');
    modal.style.display = 'flex';
    const selectedUnits = unitDatabase.filter(u => selectedUnitIds.has(u.id));
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    
    let html = `
        <table class="compare-table">
            <thead><tr><th style="width:25%">Unit</th><th>DPS</th><th>Best Meta Build</th></tr></thead>
            <tbody>
    `;

    const findBest = (unitObj, statsObj, availableTraits, isCustomList) => {
        let bestResult = { total: -1 }; 
        let bestTraitName = "", bestBuildName = "", bestSpa = 0, bestPrio = "", bestVariant = "";
        statsObj.id = unitObj.id;

        const getBestSubConfiguration = (build, priority, context) => {
            if (!includeSubs && !includeHead) return { res: calculateDPS(statsObj, build, context), desc: "" };
            let bRes = { total: -1 }; let bDesc = "";
            const candidatesToTest = SUB_CANDIDATES.filter(cand => {
                if (!statConfig.applyRelicCrit && cand === 'cm') return false; 
                if (!statConfig.applyRelicDot && cand === 'dot') return false;
                if (currentGuideMode === 'current' && cand === 'cf') return false; // Crit Rate ignored in bugged mode
                return true;
            });
            if (candidatesToTest.length === 0 && includeHead) candidatesToTest.push('dmg');

            candidatesToTest.forEach(cand => {
                let testBuild = { ...build };
                const applyPieceStats = () => {
                        for (let k in PERFECT_SUBS) {
                        let mult = (k === cand) ? 6 : 1; 
                        testBuild[k] += PERFECT_SUBS[k] * mult;
                    }
                };
                if (includeSubs) {
                    if(testBuild.bodyType !== cand) applyPieceStats();
                    else for (let k in PERFECT_SUBS) { if(k !== testBuild.bodyType) testBuild[k] += PERFECT_SUBS[k]; }
                    if(testBuild.legType !== cand) applyPieceStats();
                    else for (let k in PERFECT_SUBS) { if(k !== testBuild.legType) testBuild[k] += PERFECT_SUBS[k]; }
                }
                if (includeHead) applyPieceStats();
                let res = calculateDPS(statsObj, testBuild, context);
                if (res.total > bRes.total) { bRes = res; bDesc = SUB_NAMES[cand]; }
            });
            let descStr = "";
            if(includeSubs) descStr += `Maxed: ${bDesc}`;
            if(includeHead) descStr += `${includeSubs ? ' + ' : ''}Head: ${bDesc}`;
            return { res: bRes, desc: descStr };
        };

        availableTraits.forEach(trait => {
            if(trait.id === 'none') return;
            let place = Math.min(unitObj.placement, trait.limitPlace || unitObj.placement);
            let baseCtx = { level: 99, wave: 25, isBoss: false, traitObj: trait, placement: place, isSSS: true };
            globalBuilds.forEach(build => {
                // --- MODIFIED HERE ---
                if (currentGuideMode === 'current') {
                    if (!statConfig.applyRelicCrit && build.cm > 0) return;
                    if (!statConfig.applyRelicCrit && build.cf > 0) return; // Crit Rate ignored
                    if (!statConfig.applyRelicDot && build.dot > 0) return;
                } else {
                    if (!statConfig.applyRelicCrit && build.cm > 0) return;
                    if (!statConfig.applyRelicDot && build.dot > 0) return;
                }
                // --- END MODIFICATION ---

                if (!statConfig.applyRelicDmg && build.dmg > 10) return; 
                if (!statConfig.applyRelicSpa && build.spa > 10) return; 
                let ctxSpa = { ...baseCtx, priority: 'spa' };
                let bestSpaConfig = getBestSubConfiguration(build, 'spa', ctxSpa);
                let resSpa = bestSpaConfig.res;
                let ctxDmg = { ...baseCtx, priority: 'dmg' };
                let bestDmgConfig = getBestSubConfiguration(build, 'dmg', ctxDmg);
                let resDmg = bestDmgConfig.res;
                if (resSpa.total > bestResult.total) {
                    bestResult = resSpa; bestPrio = "SPA"; bestTraitName = trait.name; bestBuildName = build.name; bestSpa = resSpa.spa; bestVariant = bestSpaConfig.desc;
                }
                if (resDmg.total > bestResult.total) {
                    bestResult = resDmg; bestPrio = "DMG"; bestTraitName = trait.name; bestBuildName = build.name; bestSpa = resDmg.spa; bestVariant = bestDmgConfig.desc;
                }
            });
        });

        if (bestResult.total !== -1) {
            return {
                u: unitObj, bestResult: bestResult, bestTraitName: bestTraitName, bestBuildName: bestBuildName, bestSpa: bestSpa, bestPrio: bestPrio, bestVariant: bestVariant, isCustom: isCustomList
            };
        }
        return null;
    };

    let comparisonData = [];
    selectedUnits.forEach(u => {
        let effectiveStats = { ...u.stats };
        let displayRole = u.role;
        if (activeAbilityIds.has(u.id) && u.ability) { Object.assign(effectiveStats, u.ability); displayRole = "Ability Active"; }
        const standardBest = findBest(u, effectiveStats, traitsList, false);
        if(standardBest) { standardBest.displayRole = displayRole; comparisonData.push(standardBest); }
        const specificTraits = unitSpecificTraits[u.id] || [];
        const allCustoms = [...customTraits, ...specificTraits];
        if(allCustoms.length > 0) {
            const customBest = findBest(u, effectiveStats, allCustoms, true);
            if(customBest) { customBest.displayRole = displayRole; comparisonData.push(customBest); }
        }
    });

    comparisonData.sort((a, b) => b.bestResult.total - a.bestResult.total);

    comparisonData.forEach(data => {
        const rowClass = data.isCustom ? 'comp-row-custom' : '';
        html += `
            <tr class="${rowClass}">
                <td>
                    <div class="comp-unit-wrap"><img src="${data.u.img}" class="comp-img"><div><div style="font-weight:bold; color:#fff;">${data.u.name}</div><span class="comp-sub" style="${data.isCustom ? 'color:rgba(6,182,212,0.7);' : ''}">${data.displayRole}</span></div></div>
                </td>
                <td>
                    <div class="comp-highlight">${format(data.bestResult.total)}</div><span class="comp-sub" style="${data.isCustom ? 'color:rgba(6,182,212,0.7);' : ''}">SPA: ${data.bestSpa.toFixed(3)}s</span>
                </td>
                <td>
                    <span class="comp-tag" style="${data.isCustom ? 'color:var(--custom); border-color:var(--custom);' : ''}">${data.bestTraitName}</span>
                    <div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">${data.bestBuildName} ${data.bestVariant ? `<span style="color:var(--success); font-weight:bold; margin-left:5px;">(${data.bestVariant})</span>` : ''} <span style="color:${data.bestPrio === 'SPA' ? 'var(--custom)' : 'var(--gold)'}; font-weight:bold; font-size:0.7rem;">[${data.bestPrio}]</span></div>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function closeCompare() { document.getElementById('compareModal').style.display = 'none'; }

function renderDatabase() {
    const container = document.getElementById('dbPage');
    container.innerHTML = '';
    cachedResults = {}; 
    unitDatabase.forEach(unit => {
        const isAbilActive = activeAbilityIds.has(unit.id);
        let currentStats = { ...unit.stats };
        if (isAbilActive && unit.ability) Object.assign(currentStats, unit.ability);
        const listHtml = getUnitResultsHTML(unit, currentStats);
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.id = 'card-' + unit.id;
        if(selectedUnitIds.has(unit.id)) card.classList.add('is-selected');
        let abilityToggleHtml = '';
        if (unit.ability) {
            abilityToggleHtml = `
                <div class="toggle-wrapper"><span>Ability</span><label><input type="checkbox" class="ability-cb" ${isAbilActive ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)"><div class="mini-switch"></div></label></div>
            `;
        } else { abilityToggleHtml = `<div></div>`; }

        const toolbarHtml = `
            <div class="unit-toolbar"><button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button>${abilityToggleHtml}</div>
        `;
        card.innerHTML = `
            <div class="unit-banner"><div class="placement-badge">Max Place: ${unit.placement}</div><img src="${unit.img}" class="unit-avatar"><div class="unit-title"><h2>${unit.name} <span class="sss-tag">SSS</span></h2><span>${unit.role}</span></div></div>
            ${toolbarHtml}
            <div class="search-container" style="display:flex; gap:8px;">
                <input type="text" placeholder="Search..." style="flex-grow:1; width:auto; padding:6px; border-radius:5px; border:1px solid #333; background:#111; color:#fff; font-size:0.8rem;" onkeyup="filterList(this)">
                <select onchange="filterList(this)" style="width:90px; padding:0 0 0 5px; font-size:0.75rem; height:30px;"><option value="all">All Prio</option><option value="dmg">Dmg Stat</option><option value="spa">SPA Stat</option></select>
            </div>
            <div class="top-builds-list" id="results-${unit.id}">${listHtml}</div>
        `;
        container.appendChild(card);
    });
    updateCompareBtn();
}

function filterList(element) {
    const searchContainer = element.closest('.search-container');
    const inputVal = searchContainer.querySelector('input').value.toLowerCase();
    const selectVal = searchContainer.querySelector('select').value; 
    const card = element.closest('.unit-card');
    const list = card.querySelector('.top-builds-list');
    const rows = list.getElementsByClassName('build-row');
    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].dataset.filterText; 
        const rowPrio = rows[i].dataset.prioType; 
        const textMatch = rowText && rowText.includes(inputVal);
        const prioMatch = (selectVal === 'all') || (selectVal === rowPrio);
        rows[i].style.display = (textMatch && prioMatch) ? "flex" : "none";
    }
}

function toggleDeepDive() {
    const content = document.getElementById('deepDiveContent');
    const arrow = document.getElementById('ddArrow');
    if(content.style.display === 'none') {
        content.style.display = 'block';
        arrow.innerText = '▲';
    } else {
        content.style.display = 'none';
        arrow.innerText = '▼';
    }
}

// --- MATH MODAL LOGIC ---
function renderMathContent(data) {
    const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    const num = (n) => n.toLocaleString(undefined, {maximumFractionDigits: 1});
    const fix = (n, d=2) => n.toFixed(d);

    const levelMult = data.lvStats.dmgMult; 
    const avgHitPerUnit = data.dmgVal * data.critData.avgMult;
    
    const dmgAfterTrait = data.lvStats.dmg * (1 + data.traitBuffs.dmg/100);
    const dmgAfterRelic = dmgAfterTrait * (1 + data.relicBuffs.dmg/100);

    return `
        <div class="math-section">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Total DPS</span><b style="color:var(--gold); font-size:1.1rem;">${num(data.total)}</b></div>
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
        </div>

        <div class="math-section" style="border-bottom:none; margin-bottom:15px;">
            <div class="math-header" style="color:#fff; opacity:0.8;">Quick Breakdown</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; border:1px solid #333;">
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Hit DPS</div><div style="color:#fff; font-weight:bold; font-size:0.9rem;">${num(data.hit)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">(${num(avgHitPerUnit)} avg ÷ ${fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">DoT DPS</div><div style="color:${data.dot > 0 ? 'var(--accent-end)' : '#555'}; font-weight:bold; font-size:0.9rem;">${data.dot > 0 ? num(data.dot) : '-'}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Crit Rate / Dmg</div><div style="color:var(--custom); font-weight:bold; font-size:0.9rem;">${fix(data.critData.rate, 0)}% <span style="color:#444">|</span> x${fix(data.critData.cdmg/100, 2)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Avg Mult: x${fix(data.critData.avgMult, 3)}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Attack Rate</div><div style="color:var(--accent-start); font-weight:bold; font-size:0.9rem;">${fix(data.spa, 2)}s</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Base: ${data.baseStats.spa}s (Cap: ${data.baseStats.spaCap}s)</div></div>
            </div>
        </div>

        <div class="deep-dive-trigger" onclick="toggleDeepDive()" style="background:rgba(255,255,255,0.1);"><span>Full Calculation Log</span><span id="ddArrow" style="color:var(--accent-start);">▼</span></div>

        <div id="deepDiveContent" style="display:none;">
            <div class="dd-section">
                <div class="dd-title">1. Base Damage Calculation</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base Stats (Lv 1)</td><td class="col-formula"></td><td class="col-val">${num(data.baseStats.dmg)}</td></tr>
                    <tr><td class="col-label">Level Scaling (Lv ${data.level})</td><td class="col-formula"><span class="op">×</span>${fix(levelMult, 3)}</td><td class="col-val">${num(data.baseStats.dmg * levelMult)}</td></tr>
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank Bonus</td><td class="col-formula"><span class="op">×</span>1.16</td><td class="col-val">${num(data.lvStats.dmg)}</td></tr>` : ''}
                    <tr><td class="col-label">Trait Multiplier</td><td class="col-formula">${pct(data.traitBuffs.dmg)}</td><td class="col-val">${num(dmgAfterTrait)}</td></tr>
                    <tr><td class="col-label" style="color:var(--accent-end);">Relic Stat Multiplier</td><td class="col-formula" style="color:var(--accent-end);">${pct(data.relicBuffs.dmg)}</td><td class="col-val">${num(dmgAfterRelic)}</td></tr>
                    <tr><td class="col-label">Set Bonus + Passive</td><td class="col-formula">${pct(data.setBuffs.dmg + data.passiveBuff)}</td><td class="col-val calc-highlight">${num(data.dmgVal)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title">2. Crit Averaging</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base Hit (Non-Crit)</td><td class="col-formula"></td><td class="col-val">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ Crit Rate</td><td class="col-formula"></td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.rate, 1)}%</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ CDmg Base</td><td class="col-formula"></td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.baseCdmg,0)}</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ Set Bonus</td><td class="col-formula">+</td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.setCdmg,0)}</td></tr>
                    <tr><td class="col-label" style="color:var(--accent-start); padding-left:8px;">↳ Relic Stat (Multi)</td><td class="col-formula" style="color:var(--accent-start); font-size:0.7rem;">x(1+%)</td><td class="col-val" style="color:var(--accent-start); font-weight:normal;">${data.critData.relicCmPct}%</td></tr>
                    <tr><td class="col-label">Total Crit Damage</td><td class="col-formula">=</td><td class="col-val calc-highlight">${fix(data.critData.cdmg, 0)}%</td></tr>
                    <tr><td class="col-label" colspan="2" style="text-align:right; padding-right:10px;">Avg Damage Per Hit</td><td class="col-val calc-result">${num(data.dmgVal * data.critData.avgMult)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title">3. SPA (Speed) Calculation</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base SPA (Lv 1)</td><td class="col-formula"></td><td class="col-val">${data.baseStats.spa}s</td></tr>
                    <tr><td class="col-label">Level Reductions</td><td class="col-formula"><span class="op">×</span>${fix(data.lvStats.spaMult, 3)}</td><td class="col-val">${fix(data.baseStats.spa * data.lvStats.spaMult, 3)}s</td></tr>
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank (-8%)</td><td class="col-formula"><span class="op">×</span>0.92</td><td class="col-val">${fix(data.lvStats.spa, 3)}s</td></tr>` : ''}
                    <tr><td class="col-label">Trait Reduction</td><td class="col-formula">-${fix(data.traitBuffs.spa, 1)}%</td><td class="col-val">${fix(data.lvStats.spa * (1 - data.traitBuffs.spa/100), 3)}s</td></tr>
                    <tr><td class="col-label">Relic & Set Reduction</td><td class="col-formula">-${fix(data.relicBuffs.spa + data.setBuffs.spa, 1)}%</td><td class="col-val">${fix(data.rawFinalSpa, 3)}s</td></tr>
                    <tr><td class="col-label">Cap Check (${data.baseStats.spaCap}s)</td><td class="col-formula">MAX</td><td class="col-val calc-result">${fix(data.spa, 3)}s</td></tr>
                </table>
            </div>

            ${data.dot > 0 ? `
            <div class="dd-section">
                <div class="dd-title" style="color:var(--accent-end);">4. Status Effect (DoT)</div>
                <table class="calc-table">
                    <tr><td class="col-label calc-sub">Base Hit Ref</td><td class="col-val calc-sub">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label">Tick % (Base+Trait)</td><td class="col-val">${data.dotData.base}%</td></tr>
                    <tr><td class="col-label">Relic Mult (x${fix(data.dotData.relicMult, 2)})</td><td class="col-val" style="color:var(--accent-end);">${fix(data.dotData.finalPct, 1)}%</td></tr>
                    <tr><td class="col-label">Active Stacks</td><td class="col-val">x${data.dotData.internal}</td></tr>
                    <tr><td class="col-label" style="color:var(--custom);">Crit Avg Mult</td><td class="col-val" style="color:var(--custom);">x${fix(data.critData.avgMult, 3)}</td></tr>
                    <tr><td class="col-label">Total Damage (Lifetime)</td><td class="col-val">${num(data.dotData.finalTick)}</td></tr>
                    <tr><td class="col-label calc-sub">Time Basis</td><td class="col-val calc-sub">${fix(data.dotData.timeUsed, 2)}s</td></tr>
                    <tr><td class="col-label" style="color:#fff;">DoT DPS (1 Unit)</td><td class="col-val" style="color:var(--accent-end);">${num(data.singleUnitDoT)}</td></tr>
                </table>
            </div>` : ''}

            <div class="dd-section" style="border-left-color:var(--gold);">
                <div class="dd-title" style="color:var(--gold);">5. Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="col-label">Hit DPS (x${data.placement} Units)</td><td class="col-formula"><span class="op">×</span>${data.placement}</td><td class="col-val calc-highlight">${num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="col-label">DoT DPS</td><td class="col-formula">+</td><td class="col-val" style="color:var(--accent-end);">${num(data.dot)}</td></tr>` : ''}
                    <tr><td class="col-label" colspan="2" style="font-size:1rem; color:#fff; padding-top:10px;">TOTAL DPS</td><td class="col-val" style="font-size:1.4rem; color:var(--gold); padding-top:10px;">${num(data.total)}</td></tr>
                </table>
            </div>
        </div>
    `;
}

function showMath(id) {
    const data = cachedResults[id];
    if(!data) return;
    const modal = document.getElementById('mathModal');
    const content = document.getElementById('mathContent');
    modal.style.display = "flex";
    content.innerHTML = renderMathContent(data);
}

function closeMath() { document.getElementById('mathModal').style.display = "none"; }

function setGuideMode(mode) {
    currentGuideMode = mode;
    if (mode === 'current') {
        statConfig.applyRelicCrit = false;
        statConfig.applyRelicDot = false;
    } else {
        statConfig.applyRelicCrit = true;
        statConfig.applyRelicDot = true;
    }
    const buttons = document.querySelectorAll('.guide-toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase().includes(mode === 'current' ? 'current' : 'hypothetical'));
    if(activeBtn) activeBtn.classList.add('active');
    
    const hypoCb = document.getElementById('globalHypothetical');
    const hypoLabel = document.getElementById('hypoLabel');

    if(hypoCb) {
        hypoCb.checked = (mode === 'fixed');
        if(mode === 'fixed') {
            hypoCb.parentNode.classList.add('is-checked');
            if(hypoLabel) hypoLabel.innerText = "Fixed Relics";
        } else {
            hypoCb.parentNode.classList.remove('is-checked');
            if(hypoLabel) hypoLabel.innerText = "Bugged Relics";
        }
    }
    
    const warning = document.getElementById('guideWarning');
    warning.style.display = (mode === 'current') ? 'block' : 'none';
    renderGuides(); 
    renderDatabase(); 
}

function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    unitDatabase.forEach(unit => { unitSelect.add(new Option(unit.name, unit.id)); });
    traitsList.forEach(trait => { 
        if (trait.id !== 'none') traitSelect.add(new Option(trait.name, trait.id)); 
    });
}

function getTopBuildsForGuide(unit, trait) {
    let results = [];
    let effectiveStats = { ...unit.stats };
    if (activeAbilityIds.has(unit.id) && unit.ability) Object.assign(effectiveStats, unit.ability);
    effectiveStats.id = unit.id;
    let actualPlacement = Math.min(unit.placement, trait.limitPlace || unit.placement);
    let context = { level: 99, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
    const guideCb = document.getElementById('guideSubStats');
    const includeSubs = guideCb ? guideCb.checked : true;
    const guideHeadCb = document.getElementById('guideHeadPiece');
    const includeHead = guideHeadCb ? guideHeadCb.checked : false;

    const validBuilds = globalBuilds.filter(b => {
            // --- MODIFIED HERE ---
        if (currentGuideMode === 'current') {
            if (!statConfig.applyRelicCrit && b.cm > 0) return false;
            if (!statConfig.applyRelicCrit && b.cf > 0) return false; // Crit Rate ignored
            if (!statConfig.applyRelicDot && b.dot > 0) return false;
        } else {
            if (!statConfig.applyRelicCrit && b.cm > 0) return false;
            if (!statConfig.applyRelicDot && b.dot > 0) return false;
        }
        // --- END MODIFICATION ---

            if (!statConfig.applyRelicDmg && b.dmg > 10) return false; 
            if (!statConfig.applyRelicSpa && b.spa > 10) return false; 
            return true;
    });

    const getBestSubConfigurationForGuide = (build, priority, context) => {
        if (!includeSubs && !includeHead) return { res: calculateDPS(effectiveStats, build, context), subStat: null, headStat: null };
        let bestRes = { total: -1 }; let bestName = "";
        const currentSubCandidates = SUB_CANDIDATES.filter(cand => {
            if (!statConfig.applyRelicCrit && cand === 'cm') return false; 
            if (!statConfig.applyRelicDot && cand === 'dot') return false;
            if (currentGuideMode === 'current' && cand === 'cf') return false; // Crit Rate ignored in bugged mode
            return true;
        });
        if (currentSubCandidates.length === 0 && includeHead) currentSubCandidates.push('dmg');

        currentSubCandidates.forEach(cand => {
            let testBuild = { ...build };
            const applyPieceStats = () => {
                    for (let k in PERFECT_SUBS) {
                    let mult = (k === cand) ? 6 : 1; 
                    testBuild[k] += PERFECT_SUBS[k] * mult;
                }
            };
            if (includeSubs) {
                if(testBuild.bodyType !== cand) applyPieceStats();
                else for (let k in PERFECT_SUBS) { if(k !== testBuild.bodyType) testBuild[k] += PERFECT_SUBS[k]; }
                if(testBuild.legType !== cand) applyPieceStats();
                else for (let k in PERFECT_SUBS) { if(k !== testBuild.legType) testBuild[k] += PERFECT_SUBS[k]; }
            }
            if (includeHead) applyPieceStats();
            let res = calculateDPS(effectiveStats, testBuild, context);
            if (res.total > bestRes.total) { bestRes = res; bestName = SUB_NAMES[cand]; }
        });
        return { res: bestRes, subStat: includeSubs ? bestName : null, headStat: includeHead ? bestName : null };
    };

    validBuilds.forEach(build => {
        context.priority = 'dmg';
        let bestDmgConfig = getBestSubConfigurationForGuide(build, 'dmg', context);
        context.priority = 'spa';
        let bestSpaConfig = getBestSubConfigurationForGuide(build, 'spa', context);
        
        // Determine which stat priority yielded higher DPS
        let finalConfig, finalPrio;
        if (bestDmgConfig.res.total >= bestSpaConfig.res.total) {
            finalConfig = bestDmgConfig;
            finalPrio = 'dmg';
        } else {
            finalConfig = bestSpaConfig;
            finalPrio = 'spa';
        }

        results.push({
            name: build.name, dps: finalConfig.res.total, prio: finalPrio, set: SETS.find(s => s.id === build.set).name, rawBuild: build,
            subData: { sub: finalConfig.subStat, head: finalConfig.headStat }
        });
    });

    results.sort((a,b) => b.dps - a.dps);
    return results.slice(0, 5).map(b => {
        const getStatName = (type) => {
            if (type === 'dmg') return 'Dmg'; if (type === 'dot') return 'DoT'; if (type === 'cm') return 'Crit Dmg';
            if (type === 'spa') return 'SPA'; if (type === 'cf') return 'Crit Rate'; return 'N/A';
        };
        const topStat = getStatName(b.rawBuild.bodyType);
        const legStat = getStatName(b.rawBuild.legType);
        let subHtml = '';
        if (b.subData.sub) subHtml += `<div class="g-row"><span class="g-lbl">SUBS</span>${formatStatBadge(b.subData.sub)}</div>`;
        if (b.subData.head) subHtml += `<div class="g-row"><span class="g-lbl">HEAD</span>${formatStatBadge(b.subData.head)}</div>`;
        if (!subHtml) subHtml = '<span style="color:#666; font-size:0.75rem">None</span>';
        return { name: b.name, dps: b.dps, prio: b.prio, set: b.set, main: `<div class="g-row"><span class="g-lbl">TOP</span>${formatStatBadge(topStat)}</div><div class="g-row"><span class="g-lbl">LEG</span>${formatStatBadge(legStat)}</div>`, sub: subHtml };
    });
}

function renderGuides() {
    const tableBody = document.getElementById('guideTableBody');
    tableBody.innerHTML = '';
    const selectedUnitId = document.getElementById('guideUnitSelect').value;
    const selectedTraitId = document.getElementById('guideTraitSelect').value;

    const genericGuides = guideData.filter(d => !d.isCalculated);
    genericGuides.forEach(row => {
        if (selectedUnitId !== 'all' && unitDatabase.some(u => u.id === selectedUnitId)) return;
        const data = row[currentGuideMode]; 
        const tr = document.createElement('tr');
        tr.className = 'guide-row';
        const imgHtml = row.img ? `<img src="${row.img}" style="width:35px; height:35px; border-radius:50%; margin-right:8px; border:2px solid #fff; vertical-align:middle;">` : '';
        // Added mobile-value wrapper div
        tr.innerHTML = `<td data-label="Unit"><div style="display:flex; align-items:center;">${imgHtml}<span style="font-weight:bold; color:#fff;">${row.unit}</span></div></td><td data-label="Trait"><div class="mobile-value" style="color:var(--accent-end); font-weight:bold; font-size:0.8rem;">${data.trait}</div></td><td data-label="Set"><div class="mobile-value">${data.set}</div></td><td data-label="DPS"><div class="mobile-value" style="color:#666; font-size:0.8rem;">-</div></td><td data-label="Main"><div class="mobile-value">${formatStatBadge(data.main)}</div></td><td data-label="Sub"><div class="mobile-value">${formatStatBadge(data.sub)}</div></td>`;
        tableBody.appendChild(tr);
    });

    let unitsToDisplay = [];
    if (selectedUnitId !== 'all') {
        const unit = unitDatabase.find(u => u.id === selectedUnitId);
        if (unit) unitsToDisplay.push(unit);
    } else { unitsToDisplay = unitDatabase; }

    let calculatedUnits = unitsToDisplay.map(unit => {
        let traitToUse = null;
        if (selectedTraitId === 'auto') traitToUse = findOverallBestTraitForUnit(unit);
        else {
            traitToUse = traitsList.find(t => t.id === selectedTraitId);
            if (!traitToUse) traitToUse = customTraits.find(t => t.id === selectedTraitId);
            if (!traitToUse && unitSpecificTraits[unit.id]) traitToUse = unitSpecificTraits[unit.id].find(t => t.id === selectedTraitId);
        }
        if (!traitToUse) return null;
        const topBuilds = getTopBuildsForGuide(unit, traitToUse);
        if (topBuilds.length === 0) return null;
        return { unit: unit, trait: traitToUse, topBuilds: topBuilds, maxDps: topBuilds[0].dps };
    }).filter(item => item !== null);

    calculatedUnits.sort((a, b) => b.maxDps - a.maxDps);

    calculatedUnits.forEach(item => {
        const showCount = (selectedUnitId === 'all') ? 1 : 5;
        item.topBuilds.slice(0, showCount).forEach((build, index) => {
            const tr = document.createElement('tr');
            tr.className = 'guide-row';
            const imgHtml = item.unit.img ? `<img src="${item.unit.img}" style="width:35px; height:35px; border-radius:50%; margin-right:8px; border:2px solid #fff; vertical-align:middle;">` : '';
            const showUnitInfo = (selectedUnitId !== 'all') ? true : (index === 0); 
            let rankColor = index === 0 ? 'var(--gold)' : (index === 1 ? 'var(--silver)' : 'var(--bronze)');
            
            const prioLabel = build.prio === 'dmg' ? 'DMG' : 'SPA';
            const prioStyle = build.prio === 'dmg' 
                ? 'color:var(--gold); border-color:var(--gold); background:rgba(255, 215, 0, 0.1);' 
                : 'color:var(--custom); border-color:var(--custom); background:rgba(6, 182, 212, 0.1);';
            
            const prioHtml = `<div style="font-size:0.6rem; margin-top:4px; font-weight:bold; border:1px solid; border-radius:4px; display:inline-block; padding:1px 5px; ${prioStyle}">LVL: ${prioLabel}</div>`;

            // Added mobile-value wrapper div
            tr.innerHTML = `<td data-label="Unit"><div style="display:flex; align-items:center;">${showUnitInfo ? imgHtml : '<div style="width:43px; display:inline-block;"></div>'}<span style="font-weight:bold; color:#fff; ${showUnitInfo ? '' : 'opacity:0;'}">${item.unit.name}</span></div></td><td data-label="Trait"><div class="mobile-value" style="color:var(--accent-end); font-weight:bold; font-size:0.8rem;">${showUnitInfo ? item.trait.name : ''}</div></td><td data-label="Build"><div class="mobile-value"><span style="font-weight:bold; color:${rankColor};">${index + 1}. ${build.name}</span></div></td><td data-label="DPS"><div class="mobile-value" style="font-weight:900; color:var(--accent-start); font-size:1.15rem; font-family:'Consolas', monospace; text-shadow: 0 0 8px rgba(59, 130, 246, 0.2); line-height:1.1; text-align:right;">${format(build.dps)}<br>${prioHtml}</div></td><td data-label="Main"><div class="mobile-value">${build.main}</div></td><td data-label="Sub"><div class="mobile-value">${build.sub}</div></td>`;
            tableBody.appendChild(tr);
        });
    });
}

function findOverallBestTraitForUnit(unit) {
    let bestTrait = null; let maxDps = -1;
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const allToCheck = [...traitsList, ...customTraits, ...specificTraits];
    allToCheck.filter(t => t.id !== 'none').forEach(trait => {
        const topBuilds = getTopBuildsForGuide(unit, trait);
        if (topBuilds.length > 0 && topBuilds[0].dps > maxDps) {
            maxDps = topBuilds[0].dps; bestTrait = trait;
        }
    });
    return bestTrait;
}

function initCalcDropdown() {
    const dbSel1 = document.getElementById('db_t1');
    const dbSel2 = document.getElementById('db_t2');
    traitsList.forEach(t => {
        const o3 = new Option(t.name, t.id); const o4 = new Option(t.name, t.id);
        dbSel1.add(o3); dbSel2.add(o4);
    });
    dbSel1.value = 'astral'; dbSel2.value = 'none';
}

function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pid+'Page').classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    // Find button that matches
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(b => {
        if(b.getAttribute('onclick') && b.getAttribute('onclick').includes(pid)) {
            b.classList.add('active');
        }
    });

    const dbToolbar = document.getElementById('dbInjector');
    const guidesToolbar = document.getElementById('guidesToolbar');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const compareBtn = document.getElementById('compareBtn');
    
    // Hide/Show toolbars based on page
    if(pid === 'db') {
        dbToolbar.style.display = 'flex'; 
        guidesToolbar.style.display = 'none';
        selectAllBtn.style.display = 'block'; 
        updateCompareBtn(); // Show compare if units selected
    } else {
        dbToolbar.style.display = 'none'; 
        guidesToolbar.style.display = 'flex';
        selectAllBtn.style.display = 'none'; 
        compareBtn.style.display = 'none';
    }
    
    if (pid === 'guides') renderGuides();
}

function format(n) {
    if(n >= 1e9) return (n/1e9).toFixed(2) + 'B';
    if(n >= 1e6) return (n/1e6).toFixed(2) + 'M';
    if(n >= 1e3) return (n/1e3).toFixed(1) + 'k';
    return n.toLocaleString(undefined, {maximumFractionDigits:0});
}

window.onload = function() {
    initCalcDropdown();
    populateGuideDropdowns(); 
    populateInjectorUnitSelect(); 
    setGuideMode('current'); 
};