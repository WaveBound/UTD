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


// --- PATCH NOTES ARCHIVE ---
const patchNotesData = [
    {
        version: "v2.9",
        date: "Jan 02, 2026",
        changes: [
            { type: "ITEM", text: "Added <b>Reaper Necklace</b> (-7.5% SPA, +15% Range)." },
            { type: "ITEM", text: "Added <b>Shadow Reaper Necklace</b> (+2.5% Dmg, +10% Range, +5% Crit Rate, +5% Crit Dmg)." },
            { type: "UI", text: "Renamed 'Short Mode' to <b>'Wave 1-30'</b> for clearer context on trait usage." }
        ]
    },
    {
        version: "v2.8",
        date: "Jan 02, 2026",
        changes: [
            { type: "UI", text: "Replaced Trait Banner with a clickable <b>'Trait Guide'</b> button." },
            { type: "Feature", text: "Added <b>Reasoning Notes</b> to suggested traits to explain why they are optimal." }
        ]
    },
    {
        version: "v2.7",
        date: "Dec 31, 2025",
        changes: [
            { type: "UNIT", text: "Added Genos Ability Toggle (+75% Passive) and Burn Multiplier (+45%)." },
            { type: "UI", text: "Fixed CSS typo causing syntax highlighting errors." }
        ]
    },
    {
        version: "v2.5",
        date: "Dec 31, 2025",
        changes: [
            { type: "Data", text: "Updated <b>Astral trait</b> description to 'DoT Stacks (All Units)' to reflect that it scales with total placement count." },
            { type: "Math", text: "Confirmed Astral calculation uses full unit placement for total DoT DPS." }
        ]
    },
    {
        version: "v2.4",
        date: "Dec 31, 2025",
        changes: [
            { type: "Hotfix", text: "Enabled <b>Crit Rate%</b> and <b>Crit Dmg%</b> relic stats in the default 'Bugged Relics' mode. These stats are now considered working in-game." },
            { type: "Bug", text: "Relic <b>DoT%</b> stats remain disabled in the default mode as they are still bugged." }
        ]
    },
    {
        version: "v2.3",
        date: "Dec 27, 2025",
        changes: [
            { type: "UI", text: "Fixed text overflow for 'Crit Dmg' in build cards." },
            { type: "Optimizer", text: "Added Auto-Head Piece selection. System now automatically tests 'Sun God' vs 'Ninja' heads for every build." },
            { type: "UI", text: "Added detailed calculation breakdown for Sun God and Ninja head passives in the DPS Breakdown modal." },
            { type: "Math", text: "Refined Sun God math: 7s Duration / (6 * SPA). Shows Range and Uptime scaling." }
        ]
    },
    {
        version: "v2.2",
        date: "Dec 27, 2025",
        changes: [
            { type: "Feature", text: "Added Specific Head Piece Selection logic (backend support)." },
            { type: "Math", text: "Implemented Sun God Passive: +Range% DMG." },
            { type: "Math", text: "Implemented Ninja Head Passive: +20% DoT Potency." }
        ]
    },
    {
        version: "v2.0",
        date: "Dec 26, 2025",
        changes: [
            { type: "Feature", text: "Added 'Configure View' to Build Guides for specific setups." },
            { type: "Feature", text: "Added new 'Add Custom Pair' Modal to easily build and assign custom trait combinations to the database." }
        ]
    },
    {
        version: "v1.8",
        date: "Dec 26, 2025",
        changes: [
            { type: "Feature", text: "Added Virtual Realm / Magician Card toggles directly to Build Guides card for Kirito." },
            { type: "Fix", text: "Fixed Virtual Realm + Magician Card stacking logic for Kirito (Now correctly uses 14 stacks)." }
        ]
    },
    {
        version: "v1.7",
        date: "Dec 26, 2025",
        changes: [
            { type: "Feature", text: "Added Virtual Realm / Magician Card toggles for Kirito (DB Page)." },
            { type: "Calculations", text: "Magician Card sets bleed to 200% over 4s." }
        ]
    },
    {
        version: "v1.6",
        date: "Dec 26, 2025",
        changes: [
            { type: "New Set", text: "Added 'Sun God' Set (+10% Dmg)." },
            { type: "Logic Update", text: "Sun God set bonus only applies to Ice, Light, and Water units." }
        ]
    }
];

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
    laughing: { dmg: 5, spa: 5, cf: 0, cm: 0, range: 0 },
    ninja: { dmg: 5, spa: 0, cf: 0, cm: 0, range: 0 },
    sun_god: { dmg: 5, spa: 0, cf: 0, cm: 0, range: 0 },
    ex: { dmg: 0, spa: 0, cf: 0, cm: 25, range: 0 },
    shadow_reaper: { dmg: 2.5, spa: 0, cf: 5, cm: 5, range: 10 },
    reaper_set: { dmg: 0, spa: 7.5, cf: 0, cm: 0, range: 15 },
    none: { dmg: 0, spa: 0, cf: 0, cm: 0, range: 0 }
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
    { id: "ex",       name: "Ex Captain",       bonus: { dmg: 0, spa: 0, cm: 25 } },
    { id: "shadow_reaper", name: "Shadow Reaper", bonus: { dmg: 2.5, range: 10, cf: 5, cm: 5 } },
    { id: "reaper_set",    name: "Reaper Set",    bonus: { spa: 7.5, range: 15 } }
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
    { id: "astral", name: "Astral", dmg: 0, spa: 20, range: 15, desc: "DoT Stacks (All Units)", allowDotStack: true },
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
        placement: 1, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 2950, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, passiveDmg: 0, element: "Light", dotDuration: 0, range: 28 }
    },
    {
        id: "sjw", name: "SJW (Monarch)", role: "Raw Dmg",
        img: "images/Sjw.png", 
        placement: 1, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 3350, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 5, passiveDmg: 15, element: "Dark", range: 35 }
    },
    {
        id: "ragna", name: "Ragna (Silverite)", role: "Burst / Hybrid",
        img: "images/Ragna.png", 
        placement: 1, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 1800, spa: 9, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 72, element: "Ice", range: 35 },
        ability: { dmg: 3600, spa: 15 } 
    },
    {
        id: "kirito", name: "Kirito", role: "Burst / Crit",
        img: "images/Kirito.png",
        placement: 3, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Eternal", 
            note: "Eternal provides highest DPS Potential, Ruler provides good dps to cost." 
        },
        stats: { dmg: 1200, spa: 7, crit: 50, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, hitCount: 14, reqCrits: 50, extraAttacks: 0, element: "Ice", range: 30 }
    },
    {
        id: "genos", name: "Cyborg (Fearless)", role: "DoT / Raw",
        img: "images/Genos.png", 
        placement: 3, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Eternal/Sacred", 
            note: "Standard DPS Selection." 
        },
        stats: { dmg: 1440, spa: 5.5, crit: 0, cdmg: 150, dot: 14, dotStacks: 1, spaCap: 4, passiveDmg: 0, element: "Fire", range: 32, burnMultiplier: 45 },
        ability: { passiveDmg: 75 }
    },
    {
        id: "kenpachi", name: "Kenpachi", role: "Raw Dmg / Slow",
        img: "images/Kenpachi.png",
        placement: 1, tags: ["Peroxide", "Reaper", "Rage"],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 2875, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.0, element: "Light", range: 27 }
    },
    {
        id: "sasuke", name: "Sasuke (Chakra)", role: "Raw Dmg",
        img: "images/Sasuke.png", 
        placement: 2, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Eternal/Sacred", 
            note: "Ruler for DPS, Eternal/Sacred for support." 
        },
        stats: { dmg: 2450, spa: 6.75, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Dark", range: 28 }
    },
    {
        id: "mob", name: "Pyscho (100%)", role: "Raw Dmg",
        img: "images/Mob.png", 
        placement: 2, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Standard DPS selection." 
        },
        stats: { dmg: 2600, spa: 6.5, crit: 0, cdmg: 150, dot: 20, dotStacks: 1, spaCap: 5.5, passiveDmg: 0, element: "Rose", dotDuration: 4, range: 35 }
    },
    {
        id: "shanks", name: "Shanks (Conqueror)", role: "Raw Dmg",
        img: "images/Shanks.png", 
        placement: 1, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 2750, spa: 12, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.5, passiveDmg: 0, element: "Rose", dotDuration: 0, range: 30}
    },
    {
        id: "law", name: "Rule (Room)", role: "Support / Dmg",
        img: "images/Law.png", 
        placement: 2, tags: [],
        meta: { 
            short: "Ruler/Sacred", 
            long: "Ruler/Sacred", 
            note: "Ruler/Sacred offer the most Spa%- / Rng%+" 
        },
        stats: { dmg: 1300, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 20, passiveSpa: 10, element: "Water", dotDuration: 0, range: 31.5 }
    },
    {
        id: "akainu", name: "Admiral (Magma)", role: "Support / Dmg",
        img: "images/Akainu.png", 
        placement: 3, tags: [],
        meta: { 
            short: "Eternal/Sacred", 
            long: "Eternal/Sacred", 
            note: "Eternal/Sacred offer the the best dps + support performance." 
        },
        stats: { dmg: 1100, spa: 5, crit: 0, cdmg: 150, dot: 60, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Fire", dotDuration: 7, range: 37}
    },
    {
        id: "ichigo", name: "Ichiko (Rage)", role: "Dmg",
        img: "images/Ichigo.png", 
        placement: 1, tags: ["Peroxide", "Reaper", "Rage", "Hollow"],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 3000, spa: 8, crit: 15, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 40, passiveSpa: 0, element: "Dark", dotDuration: 0, range: 38}
    },
    {
        id: "grimjaw", name: "Grommjaw (Panther)", role: "Dmg",
        img: "images/Grimjaw.png", 
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { 
            short: "Ruler", 
            long: "Eternal", 
            note: "Standard DPS selection." 
        },
        stats: { 
            dmg: 1590, spa: 9, crit: 0, cdmg: 150, dot: 50, dotStacks: 1, spaCap: 3, 
            passiveDmg: 6.67,  // Averaged
            passiveSpa: 4.17,  
            element: "Water", dotDuration: 4, range: 35
        }
    },
    {
        id: "stark", name: "Koyote (Number one)", role: "Dmg",
        img: "images/Stark.png", 
        placement: 1, tags: ["Peroxide", "Hollow"],
        meta: { 
            short: "Ruler", 
            long: "Ruler", 
            note: "Ruler is strictly best due to 1 placement count." 
        },
        stats: { dmg: 2800, spa: 6, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 6, passiveDmg: 0, passiveSpa: 0, element: "Ice", dotDuration: 0, range: 42}
    },
    {
        id: "ulquiorra", name: "Ultiiorra (Oblivion)", role: "Dmg",
        img: "images/Ulqiorra.png", 
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { 
            short: "Ruler", 
            long: "Eternal", 
            note: "Standard DPS selection." 
        },
        stats: { dmg: 1275, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 5, element: "Dark", dotDuration: 0, range: 37},
        ability: {
            buffDmg: 35, 
            passiveSpa: 7.5, 
            crit: 10 
        }
    },
    {
        id: "harribel", name: "Tierrabel (Hydro)", role: "Dmg",
        img: "images/Harribel.png", 
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { 
            short: "Ruler", 
            long: "Eternal", 
            note: "Standard DPS selection." 
        },
        stats: { dmg: 1490, spa: 8.5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Water", dotDuration: 0, range: 30},
        ability: {
            buffDmg: 35, 
            buffDuration: 80, 
            spaCap: 4, 
            hasToggle: true
        }
    },
    {
        id: "ace", name: "Ace", role: "Burn / DoT",
        img: "images/Ace.png",
        placement: 3, tags: [],
        meta: { 
            short: "Ruler", 
            long: "Ruler/Eternal/Astral", 
            note: "Eternal provides highest DPS Potential(similar to ruler), Ruler provides good dps to cost." 
        },
        stats: { dmg: 1500, spa: 9, crit: 0, cdmg: 150, dot: 100, dotStacks: 1, spaCap: 4, passiveDmg: 60, element: "Fire", dotDuration: 4, range: 30 }
    },
];