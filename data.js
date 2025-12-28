const statConfig = {
    applyRelicDmg: true,  
    applyRelicSpa: true,  
    applyRelicCrit: false, 
    applyRelicDot: false   
};

const PERFECT_SUBS = {
    dmg: 4, spa: 1.5, cm: 4.5, cf: 2.5, dot: 5, range: 2 
};

// Valid sub-stats to test
const SUB_CANDIDATES = ['dmg', 'spa', 'cm', 'cf', 'dot', 'range'];

// Display names for sub-stats
const SUB_NAMES = {
    dmg: "Dmg", spa: "SPA", cm: "Crit Dmg", cf: "Crit Rate", dot: "DoT", range: "Range"
};

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
    { unit: "Shanks", img: "images/Shanks.png", isCalculated: true },
    { unit: "Genos", img: "images/Genos.png", isCalculated: true }
];

const setBonuses = {
    laughing: { dmg: 5, spa: 5, cf: 0, cm: 0 },
    ninja: { dmg: 5, spa: 0, cf: 0, cm: 0 },
    sun_god: { dmg: 5, spa: 0, cf: 0, cm: 0 },
    ex: { dmg: 0, spa: 0, cf: 0, cm: 25 }, 
    none: { dmg: 0, spa: 0, cf: 0, cm: 0 }
};

const BODY_DMG  = { dmg: 60, dot: 0,  cm: 0,   desc: "Dmg",  type: "dmg" };
const BODY_DOT  = { dmg: 0,  dot: 75, cm: 0,   desc: "DoT",  type: "dot" };
const BODY_CDMG = { dmg: 0,  dot: 0,  cm: 120, desc: "Crit Dmg", type: "cm" };

const LEG_DMG   = { dmg: 60, spa: 0,    desc: "Dmg", type: "dmg" };
const LEG_SPA   = { dmg: 0,  spa: 22.5, desc: "Spa", type: "spa" };
const LEG_CRIT  = { dmg: 0,  spa: 0,    desc: "Crit Rate", type: "cf", cf: 37.5 }; 
const LEG_RANGE = { dmg: 0,  spa: 0,    desc: "Range", type: "range", range: 30 };

const SETS = [
    { id: "ninja",    name: "Master Ninja",     bonus: { dmg: 5, spa: 0, cm: 0 } },
    { id: "sun_god",  name: "Sun God",          bonus: { dmg: 5, spa: 0, cm: 0 } },
    { id: "laughing", name: "Laughing Captain", bonus: { dmg: 5, spa: 5, cm: 0 } },
    { id: "ex",       name: "Ex Captain",       bonus: { dmg: 0, spa: 0, cm: 25 } }
];

const globalBuilds = [];
SETS.forEach(set => {
    const bodies = [BODY_DMG, BODY_DOT, BODY_CDMG];
    const legs   = [LEG_DMG, LEG_SPA, LEG_CRIT, LEG_RANGE];
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
                range: (leg.range || 0),
                bodyType: body.type,
                legType: leg.type
            });
        });
    });
});

const traitsList = [
    { id: "ruler", name: "Ruler", dmg: 200, spa: 20, range: 30, desc: "+200% Dmg, Limit 1", limitPlace: 1 },
    { id: "fission", name: "Fission", dmg: 15, spa: 15, range: 25, dotBuff: 20, radiationDuration: 10, desc: "+15% Dmg/SPA, Rad DoT", hasRadiation: true },
    { id: "eternal", name: "Eternal", dmg: 0, spa: 20, range: 0, desc: "-20% SPA, +Dmg/Rng/Wave", isEternal: true },
    { id: "sacred", name: "Sacred", dmg: 25, spa: 10, range: 25, desc: "+25% Dmg, -10% SPA" },
    { id: "astral", name: "Astral", dmg: 0, spa: 20, range: 15, desc: "DoT Stacks, Limit 1", limitPlace: 1, allowDotStack: true },
    { id: "wizard", name: "Wizard", dmg: 0, spa: 15, range: 20, desc: "+30% DoT, -15% SPA", dotBuff: 30 },
    { id: "artificer", name: "Artificer", dmg: 0, spa: 0, range: 0, desc: "+15% Relic Stats", relicBuff: 1.15 },
    { id: "duelist", name: "Duelist", dmg: 0, spa: 0, range: 0, desc: "+Crit/Boss Dmg", critRate: 25, bossDmg: 35 },
    { id: "none", name: "None", dmg: 0, spa: 0, range: 0, desc: "No buffs" }
];

const elementIcons = {
    "Water": "images/elements/Water.png",
    "Fire": "images/elements/Fire.png",
    "Light": "images/elements/Light.png",
    "Dark": "images/elements/Dark.png",
    "Ice": "images/elements/Ice.png",
    "Rose": "images/elements/Rose.png"
};

const unitDatabase = [
    {
        id: "Maid", name: "Scarlet Maid (World)", role: "Dmg / Support",
        img: "images/Maid.png", 
        placement: 1,
        stats: { dmg: 2950, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, passiveDmg: 0, element: "Light", dotDuration: 0, range: 28 }
    },
    {
        id: "sjw", name: "SJW (Monarch)", role: "Raw Dmg",
        img: "images/Sjw.png", 
        placement: 1,
        stats: { dmg: 3350, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 5, passiveDmg: 15, element: "Dark", range: 35 }
    },
    {
        id: "ragna", name: "Ragna (Silverite)", role: "Burst / Hybrid",
        img: "images/Ragna.png", 
        placement: 1,
        stats: { dmg: 1800, spa: 9, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 72, element: "Ice", range: 35 },
        ability: { dmg: 3600, spa: 15 } 
    },
    {
        id: "ace", name: "Ace", role: "Burn / DoT",
        img: "images/Ace.png",
        placement: 3,
        stats: { dmg: 1500, spa: 9, crit: 0, cdmg: 150, dot: 100, dotStacks: 5, spaCap: 6, passiveDmg: 60, element: "Fire", dotDuration: 4, range: 30 }
    },
    {
        id: "kirito", name: "Kirito", role: "Burst / Crit",
        img: "images/Kirito.png",
        placement: 3,
        stats: { dmg: 1200, spa: 7, crit: 50, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, hitCount: 14, reqCrits: 50, extraAttacks: 0, element: "Ice", range: 30 }
    },
    {
        id: "kenpachi", name: "Kenpachi", role: "Raw Dmg / Slow",
        img: "images/Kenpachi.png",
        placement: 1,
        stats: { dmg: 2875, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.0, element: "Light", range: 27 }
    },
    {
        id: "sasuke", name: "Sasuke (Chakra)", role: "Raw Dmg",
        img: "images/Sasuke.png", 
        placement: 2,
        stats: { dmg: 2450, spa: 6.75, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Dark", range: 28 }
    },
    {
        id: "mob", name: "Pyscho (100%)", role: "Raw Dmg",
        img: "images/Mob.png", 
        placement: 2,
        stats: { dmg: 2600, spa: 6.5, crit: 0, cdmg: 150, dot: 20, dotStacks: 1, spaCap: 5.5, passiveDmg: 0, element: "Rose", dotDuration: 4, range: 35 }
    },
    {
        id: "shanks", name: "Shanks (Conqueror)", role: "Raw Dmg",
        img: "images/Shanks.png", 
        placement: 1,
        stats: { dmg: 2750, spa: 12, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.5, passiveDmg: 0, element: "Rose", dotDuration: 0, range: 30}
    },
    {
        id: "genos", name: "Cyborg (Fearless)", role: "Dmg / Burn",
        img: "images/Genos.png", 
        placement: 3,
        stats: { dmg: 1450, spa: 5.5, crit: 0, cdmg: 150, dot: 14, dotStacks: 7, spaCap: 4, passiveDmg: 0, element: "Fire", dotDuration: 7, range: 32 }
    },
    {
        id: "law", name: "Rule (Room)", role: "Support / Dmg",
        img: "images/Law.png", 
        placement: 2,
        stats: { dmg: 1300, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 20, passiveSpa: 10, element: "Water", dotDuration: 0, range: 31.5 }
    },
    {
        id: "akainu", name: "Admiral (Magma)", role: "Support / Dmg",
        img: "images/Akainu.png", 
        placement: 3,
        stats: { dmg: 1100, spa: 5, crit: 0, cdmg: 150, dot: 60, dotStacks: 4, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Fire", dotDuration: 7, range: 37}
    }
];
