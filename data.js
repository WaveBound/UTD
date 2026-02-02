// ============================================================================
// DATA.JS - Static Data & Configuration
// ============================================================================

const GAME_STATE = {
    BUG_DOT_RELICS: true,   // Set to true if Relic DoT is currently broken/ignored in-game
    BUG_CRIT_RELICS: false  // Set to true if Relic Crit is currently broken (Fixed in v2.4)
};

const SUPER_ROKU_NEARBY = false; // Toggle: +20% Damage if placed within range of a "Saiyan unit"

const statConfig = {
    applyRelicDmg: true,  
    applyRelicSpa: true,  
    applyRelicCrit: !GAME_STATE.BUG_CRIT_RELICS, 
    applyRelicDot: !GAME_STATE.BUG_DOT_RELICS   
};

const PERFECT_SUBS = {
    dmg: 4, spa: 1.5, cm: 4.5, cf: 2.5, dot: 5, range: 2 
};

const SUB_CANDIDATES = ['dmg', 'spa', 'cm', 'cf', 'dot', 'range'];

const SUB_NAMES = {
    dmg: "Dmg", spa: "SPA", cm: "Crit Dmg", cf: "Crit Rate", dot: "DoT", range: "Range"
};

const patchNotesData = [
    {
        version: "v4.4",
        date: "Feb 02, 2026",
        changes: [
            { type: "Unit", text: "<b>New Unit:</b> Added <b>Rohan & Robot</b>." },
            { type: "Item", text: "<b>New Relic Sets:</b> Added <b>Super Roku</b> and <b>Bio-Android</b> sets." }
        ]
    },
    {
        version: "v4.3",
        date: "Jan 30, 2026",
        changes: [
            { type: "Feature", text: "<b>Trait Tier List:</b> Added 'Virtual Realm' category to the global tier list and individual unit guides." },
            { type: "Unit", text: "<b>Kirito:</b> Added specific trait recommendation (Astral) for Virtual Realm mode." }
        ]
    },
    {
        version: "v4.2",
        date: "Jan 29, 2026",
        changes: [
            { type: "Feature", text: "<b>Trait Tier List:</b> Added a global view to see all unit trait recommendations in a tier list format, sorted by DPS potential." },
            { type: "UI", text: "<b>Trait Guide:</b> Updated the visual style of trait suggestions. Now uses high-quality images with rainbow borders." },
            { type: "Balance", text: "<b>Ace:</b> Updated Infinite Mode recommendations to prioritize Ruler." },
            { type: "Fix", text: "<b>Visuals:</b> Fixed image scaling for Mob and Shanks in the tier list view." }
        ]
    },
    {
        version: "v4.1",
        date: "Jan 29, 2026",
        changes: [
            { type: "Feature", text: "<b>Miku Buff:</b> Added a global toggle to apply Miku's +100% Damage Buff to all calculations." },
            { type: "UI", text: "<b>Breakdown Label:</b> Renamed 'Set Bonus + Passive + Abilities' to 'Buff Data' in the calculation breakdown for clarity." }
        ]
    },
    {
        version: "v4.0",
        date: "Jan 20, 2026",
        changes: [
            { type: "QoL", text: "<b>Calculator Persistence:</b> Changing Sets, Traits, or Main Stats in the Custom Relic Modal/Add Relic Modal no longer resets your manually entered Sub-Stat values." },
            { type: "UI", text: "<b>Mobile Comparison:</b> Redesigned the Compare Modal for mobile devices. It now displays units as stacked cards for better readability." },
            { type: "System", text: "<b>Feedback Form:</b> Added a Discord Username field to the Feedback/Report modal so we can follow up on specific issues." }
        ]
    },
    {
        version: "v3.9",
        date: "Jan 19, 2026",
        changes: [
            { type: "UI", text: "<b>Modals:</b> Updated all popups to have a consistent look and feel. Also stopped text from highlighting randomly when you're just clicking buttons." },
            { type: "Feature", text: "<b>Custom Pairs/Configure View:</b> You can select multiple specific units at once." },
            { type: "Fix", text: "<b>Mobile Fixes:</b> The menu button now properly hides when you open a window, plus some other small visual cleanups." }
        ]
    },
    {
        version: "v3.8",
        date: "Jan 17, 2026",
        changes: [
            { type: "UI", text: "<b>DPS Breakdown:</b> Added Range Breakdown box." },
            { type: "Fix", text: "<b>DoT Logic:</b> Fixed DoT calculations." },
            { type: "Fix", text: "<b>Range Math:</b> Fixed an issue where Range Scaling Points (99 pts) were not being applied in the breakdown view." },
            { type: "Math", text: "<b>Fission:</b> Updated Fission calculations." },
            { type: "Buff", text: "<b>Sacred:</b> Now provides <b>-15% Total Cost</b> reduction." },
            { type: "Fix", text: "<b>Set Stacking:</b> Fixed Set Bonus stacking logic for Reaper/Shadow Reaper necklaces." },
            { type: "Math", text: "<b>Eternal:</b> Range bonus is now additive with Passives/Sets instead of multiplicative." }
        ]
    },
    {
        version: "v3.7",
        date: "Jan 16, 2026",
        changes: [
            { type: "Feature", text: "<b>Relic Inventory:</b> You can now save your actual in-game relics to a persistent inventory tab." },
            { type: "Feature", text: "<b>Inventory Calculation:</b> Toggle 'Inventory Mode' to calculate the best build using ONLY the items you own." },
            { type: "Fix", text: "<b>Range Priority:</b> Fixed logic where Range Optimization was incorrectly applying Damage Level Scaling points." }
        ]
    },
    {
        version: "v3.6",
        date: "Jan 15, 2026",
        changes: [
            { type: "Units", text: "<b>Unit Update:</b> Added Phantom Captain And Sharpshooter" }
        ]
    },
    {
        version: "v3.5",
        date: "Jan 13, 2026",
        changes: [
            { type: "Ui", text: "<b>Mobile:</b> Added a mobile menu toggle button and improved responsive layout." },
            { type: "Feature", text: "<b>Efficiency Score:</b> Added an 'Efficiency' metric to all builds. This displays <b>DPS per Cost</b> (Efficiency), helping to identify the most economic builds." },
            { type: "Fix", text: "<b>Bambietta Logic:</b> Fixed the Element Selector. Switching elements now instantly recalculates stats and updates the build list correctly." }
        ]
    },
    {
        version: "v3.4",
        date: "Jan 12, 2026",
        changes: [
            { type: "System", text: "<b>Header Popup/PopDown:</b> Implemented a Button To Close/Open The Header." },
            { type: "Ui", text: "<b>Build Guide Tab:</b> Changed The Cards To Look Like The Ones In Unit Database And Removed Miku/Support/Other DPS Cards." }
        ]
    },
    {
        version: "v3.3",
        date: "Jan 11, 2026",
        changes: [
            { type: "System", text: "<b>Static Database Engine:</b> Implemented a pre-calculated build database. Page load times are now drastically faster." },
            { type: "Fix", text: "<b>Filter Logic:</b> Changing filters (Set, Head, Prio) no longer triggers a full recalculation. Lists now filter instantly without reloading." }
        ]
    },
    {
        version: "v3.2",
        date: "Jan 10, 2026",
        changes: [
            { type: "Fix", text: "<b>Comparison Fix:</b> Resolved an issue where builds with slightly higher DPS (e.g., using S. Reaper Head) were hiding viable alternatives (e.g., Sun God Head) from the list." },
            { type: "Feature", text: "<b>Star Multipliers:</b> Individual star level selectors added to each gear piece (Head, Body, Legs) in custom calculator." },
            { type: "Bugfix", text: "<b>Calculator Fixes:</b> Resolved star multiplier application and visibility logic errors." }
        ]
    },
    {
        version: "v3.1",
        date: "Jan 08, 2026",
        changes: [
            { type: "Feature", text: "<b>Meta Comparison:</b> Added visual bar charts and % difference to the Compare Modal." },
            { type: "Refactor", text: "<b>Game State Logic:</b> Centralized bug tracking. Toggling 'Bugged Relics' now accurately reflects current patch status." }
        ]
    },
    {
        version: "v3.0",
        date: "Jan 06, 2026",
        changes: [
            { type: "UI", text: "<b>Custom Calculator Rework:</b> New visual 'Gear Card' dashboard for easier build creation." },
            { type: "QoL", text: "<b>Auto-Fill Logic:</b> Sub-stats in calculator now auto-fill to perfect values based on relic type." }
        ]
    },
    {
        version: "v2.9",
        date: "Jan 02, 2026",
        changes: [
            { type: "ITEM", text: "Added <b>Reaper Necklace</b> (-7.5% SPA, +15% Range)." },
            { type: "ITEM", text: "Added <b>Shadow Reaper Necklace</b> (+2.5% Dmg, +10% Range, +5% Crit Rate, +5% Crit Dmg)." }
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
    { unit: "Ace", img: "images/units/Ace.png", isCalculated: true },
    { unit: "SJW", img: "images/units/SJW.png", isCalculated: true },
    { unit: "Sasuke", img: "images/units/Sasuke.png", isCalculated: true },
    { unit: "Kirito", img: "images/units/Kirito.png", isCalculated: true },
    { unit: "Kenpachi", img: "images/units/Kenpachi.png", isCalculated: true },
    { unit: "Ragna", img: "images/units/Ragna.png", isCalculated: true },
    { unit: "Mob", img: "images/units/Mob.png", isCalculated: true },
    { unit: "Shanks", img: "images/units/Shanks.png", isCalculated: true },
    { unit: "Genos", img: "images/units/Genos.png", isCalculated: true }
];

const BAMBIETTA_MODES = {
    "Water": { element: "Water", dot: 0, desc: "Slow", dotDuration: 0 },
    "Wind": { element: "Wind", dot: 50, dotDuration: 5, desc: "Windsheer" },
    "Rose": { element: "Rose", dot: 50, dotDuration: 5, desc: "Bleed" },
    "Fire": { element: "Fire", dot: 50, dotDuration: 5, desc: "Burn" },
    "Light": { element: "Light", dot: 50, dotDuration: 5, desc: "Radiation" },
    "Dark": { element: "Dark", dot: 0, desc: "Stun", dotDuration: 0 },
    "Ice": { element: "Ice", dot: 0, desc: "Freeze", dotDuration: 0 }
};

const setBonuses = {
    laughing: { dmg: 5, spa: 5, cf: 0, cm: 0, range: 0 },
    ninja: { dmg: 5, spa: 0, cf: 0, cm: 0, range: 0 },
    sun_god: { dmg: 5, spa: 0, cf: 0, cm: 0, range: 0 },
    ex: { dmg: 0, spa: 0, cf: 10, cm: 25, range: 0 },
    shadow_reaper: { dmg: 2.5, spa: 0, cf: 5, cm: 5, range: 10 },
    reaper_set: { dmg: 0, spa: 7.5, cf: 0, cm: 0, range: 15 },
    super_roku: { dmg: 10, spa: 0, cf: 15, cm: 0, range: 0 },
    bio_android: { dmg: 5, spa: 5, cf: 5, cm: 5, range: 5 },
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
    { id: "ex",       name: "Ex Captain",       bonus: { dmg: 0, spa: 0, cm: 25, cf: 10 } },
    { id: "shadow_reaper", name: "Shadow Reaper", bonus: { dmg: 2.5, range: 10, cf: 5, cm: 5 } },
    { id: "reaper_set",    name: "Reaper Set",    bonus: { spa: 7.5, range: 15 } },
    { id: "super_roku",    name: "Super Roku",    bonus: { dmg: 10, cf: 15 } },
    { id: "bio_android",   name: "Bio-Android",   bonus: { dmg: 5, spa: 5, range: 5, cf: 5, cm: 5 } }
];

const globalBuilds = SETS.flatMap(set => 
    [BODY_DMG, BODY_DOT, BODY_CDMG].flatMap(body => 
        [LEG_DMG, LEG_SPA, LEG_CRIT, LEG_RANGE].map(leg => ({
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
        }))
    )
);

const traitsList = [
    { id: "ruler", name: "Ruler", dmg: 200, spa: 20, range: 30, desc: "+200% Dmg, Limit 1", limitPlace: 1 },
    { id: "fission", name: "Fission", dmg: 15, spa: 15, range: 25, hasRadiation: true, radiationPct: 20,},
    { id: "eternal", name: "Eternal", dmg: 0, spa: 20, range: 0, desc: "-20% SPA, +Dmg/Rng/Wave", isEternal: true },
    { id: "sacred", name: "Sacred", dmg: 25, spa: 10, range: 25, desc: "+25% Dmg, -10% SPA, -15% Cost", costReduction: 15 },
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
        id: "Maid", name: "Scarlet Maid (World)", role: "Damage / Support",
        img: "images/units/Maid.png", 
        totalCost: 76000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 2950, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, passiveDmg: 0, element: "Light", dotDuration: 0, range: 28 }
    },
    {
        id: "sjw", name: "SJW (Monarch)", role: "Damage",
        img: "images/units/Sjw.png", 
        totalCost: 93000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 3350, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 5, passiveDmg: 25, element: "Dark", range: 35 }
    },
    {
        id: "ragna", name: "Ragna (Silverite)", role: "Burst / Hybrid",
        img: "images/units/Ragna.png",
        totalCost: 72000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 1800, spa: 9, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 12, element: "Ice", range: 35 },
        ability: { dmg: 3600, spa: 15, passiveDmg: 72, } 
    },
    {
        id: "kirito", name: "Kirito", role: "Burst / Crit",
        img: "images/units/Kirito.png",
        totalCost: 30400,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Eternal", virtual: "Astral", note: "Eternal provides highest DPS Potential, Ruler provides good dps to cost." },
        stats: { dmg: 1200, spa: 7, crit: 50, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, hitCount: 14, reqCrits: 50, extraAttacks: 0, element: "Ice", range: 30 }
    },
    {
        id: "genos", name: "Cyborg (Fearless)", role: "DoT / Damage",
        img: "images/units/Genos.png", 
        totalCost: 26900,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Eternal/Sacred", note: "Standard DPS Selection." },
        stats: { dmg: 1440, spa: 5.5, crit: 0, cdmg: 150, dot: 14, dotStacks: 1, spaCap: 4, passiveDmg: 0, element: "Fire", range: 32, burnMultiplier: 45 },
        ability: { passiveDmg: 75 }
    },
    {
        id: "kenpachi", name: "Kenpachi", role: "Damage / Slow",
        img: "images/units/Kenpachi.png",
        totalCost: 60000,
        placement: 1, tags: ["Peroxide", "Reaper", "Rage"],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 2875, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.0, element: "Light", range: 27 }
    },
    {
        id: "sasuke", name: "Sasuke (Chakra)", role: "Damage",
        img: "images/units/Sasuke.png", 
        totalCost: 40000,
        placement: 2, tags: [],
        meta: { short: "Ruler", long: "Eternal/Sacred", note: "Ruler for DPS, Eternal/Sacred for support." },
        stats: { dmg: 2450, spa: 6.75, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Dark", range: 28 }
    },
    {
        id: "mob", name: "Pyscho (100%)", role: "Damage",
        img: "images/units/Mob.png", 
        totalCost: 56000,
        placement: 2, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Standard DPS selection." },
        stats: { dmg: 2600, spa: 6.5, crit: 0, cdmg: 150, dot: 20, dotStacks: 1, spaCap: 5.5, passiveDmg: 0, element: "Rose", dotDuration: 4, range: 35 }
    },
    {
        id: "shanks", name: "Shanks (Conqueror)", role: "Damage",
        img: "images/units/Shanks.png", 
        totalCost: 64000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 2750, spa: 12, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.5, passiveDmg: 0, element: "Rose", dotDuration: 0, range: 30}
    },
    {
        id: "law", name: "Rule (Room)", role: "Support / Damage",
        img: "images/units/Law.png", 
        totalCost: 84000,
        placement: 2, tags: [],
        meta: { short: "Ruler/Sacred", long: "Ruler/Sacred", note: "Ruler/Sacred offer the most Spa%- / Rng%+" },
        stats: { dmg: 1300, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 20, passiveSpa: 10, element: "Water", dotDuration: 0, range: 31.5 }
    },
    {
        id: "akainu", name: "Admiral (Magma)", role: "Support / Damage",
        img: "images/units/Akainu.png", 
        totalCost: 108000,
        placement: 3, tags: [],
        meta: { short: "Eternal/Sacred", long: "Eternal/Sacred", note: "Eternal/Sacred offer the the best dps + support performance." },
        stats: { dmg: 1100, spa: 5, crit: 0, cdmg: 150, dot: 60, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Fire", dotDuration: 7, range: 37}
    },
    {
        id: "ichigo", name: "Ichiko (Rage)", role: "Damage",
        img: "images/units/Ichigo.png", 
        totalCost: 108000,
        placement: 1, tags: ["Peroxide", "Reaper", "Rage", "Hollow"],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 3000, spa: 8, crit: 15, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 7, passiveDmg: 50, passiveSpa: 0, element: "Dark", dotDuration: 0, range: 38}
    },
    {
        id: "grimjaw", name: "Grommjaw (Panther)", role: "Damage",
        img: "images/units/Grimjaw.png", 
        totalCost: 40000,
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Eternal", note: "Standard DPS selection." },
        stats: { dmg: 1590, spa: 9, crit: 0, cdmg: 150, dot: 50, dotStacks: 1, spaCap: 3, passiveDmg: 6.67, passiveSpa: 4.17, element: "Water", dotDuration: 10, range: 35 }
    },
    {
        id: "stark", name: "Koyote (Number one)", role: "Damage",
        img: "images/units/Stark.png", 
        totalCost: 44000,
        placement: 1, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 2800, spa: 6, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 6, passiveDmg: 0, passiveSpa: 0, element: "Ice", dotDuration: 0, range: 42}
    },
    {
        id: "ulquiorra", name: "Ultiiorra (Oblivion)", role: "Damage",
        img: "images/units/Ulqiorra.png", 
        totalCost: 31760,
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Eternal", note: "Standard DPS selection." },
        stats: { dmg: 1275, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 5, element: "Dark", dotDuration: 0, range: 37},
        ability: { buffDmg: 65, passiveSpa: 2.5, crit: 10 }
    },
    {
        id: "harribel", name: "Tierrabel (Hydro)", role: "Damage",
        img: "images/units/Harribel.png", 
        totalCost: 30964,
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Eternal", note: "Standard DPS selection." },
        stats: { dmg: 1490, spa: 8.5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Water", dotDuration: 0, range: 30},
        ability: { buffDmg: 35, buffDuration: 80, spaCap: 4, hasToggle: true }
    },
    {
        id: "ace", name: "Ace", role: "Damage / Burn(DoT)",
        img: "images/units/Ace.png",
        totalCost: 39000,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler provides good dps to cost." },
        stats: { dmg: 1500, spa: 9, crit: 0, cdmg: 150, dot: 100, dotStacks: 1, spaCap: 6, passiveDmg: 60, element: "Fire", dotDuration: 4, range: 30 }
    }, 
    {
        id: "Jingliu", name: "Jingliu", role: "Damage",
        img: "images/units/Jingliu.png",
        totalCost: 33725,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Eternal/Sacred", note: "Eternal provides highest DPS Potential, Ruler provides good dps to cost." },
        stats: { dmg: 1700, spa: 6, crit: 50, cdmg: 200, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 35, element: "Ice", dotDuration: 0, range: 40 }
    },
    {
        id: "megumin", name: "Megumin", role: "Damage / Burn(Dot)",
        img: "images/units/Megumin.png",
        totalCost: 136000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 7530, spa: 14, crit: 0, cdmg: 150, dot: 50, dotStacks: 1, spaCap: 4, passiveDmg: 0, element: "Fire", dotDuration: 10, range: 50 },
        ability: { passiveDmg: 50, passiveSpa: 50 } 
    },
    {
        id: "bambietta", name: "Bambietta", role: "Damage / (Support/Dot)",
        img: "images/units/Bambietta.png",
        totalCost: 40000,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Eternal", note: "Eternal provides highest DPS Potential, Ruler provides good dps to cost." },
        stats: { dmg: 1250, spa: 6.5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, element: "Dark", dotDuration: 0, range: 38, hasElementSelect: true }
    },
    {
        id: "esdeath", name: "Esdeath", role: "Damage / Support",
        img: "images/units/Esdeath.png",
        totalCost: 92000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Passive avg 37.5% Dmg (Cycles 0-75%). Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 1975, spa: 7.5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 37.5, element: "Ice", dotDuration: 0, range: 50 }
    },
    {
        id: "phantom_captain", name: "Phantom Captain", role: "Summon / Dmg",
        img: "images/units/Phantom.png",
        totalCost: 68000,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Needs low SPA (High Speed) to maintain max 9 planes." },
        stats: { dmg: 3600, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 0, element: "Light", dotDuration: 0, range: 55 },
        ability: {
            summonStats: {
                maxCount: 9,
                dmgPct: 50, // 50% of Host Dmg
                // Plane Type A: Explosive
                planeA: { spa: 12, duration: 36 },
                // Plane Type B: Mounted
                planeB: { spa: 7.5, duration: 45 },
                // Buff: First 10s
                buffWindow: 10,
                buffCrit: 30, // 30% CR
                buffCdmg: 200 // 200% CDmg
            }
        }
    },
    {
        id: "sharpshooter", name: "Sharpshooter", role: "Damage / Support",
        img: "images/units/Sharpshooter.png",
        totalCost: 68000,
        placement: 2, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Toggle Ability for Sniper Mode (Global Range)." },
        stats: { 
            dmg: 1450, spa: 6, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, 
            element: "Fire", dotDuration: 0, range: 50,
            passiveDmg: 125, // Normal Mode: 2.25x Dmg
            passiveSpa: 0
        }, 
        ability: { 
            passiveDmg: 10,  // Sniper Mode: 1.1x Dmg
            passiveSpa: 10,  // Sniper Mode: 0.9x SPA (10% reduction)
            range: 120  // Sniper Mode: 200 Range
        }
    },
    {
        id: "rohan", name: "Rohan & Robot", role: "Damage",
        img: "images/units/Rohan.png",
        totalCost: 54000,
        placement: 2, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Ability activates Unleashed mode." },
        stats: { dmg: 1820, spa: 7.5, crit: 15, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 30, passiveSpa: 5, element: "Light", dotDuration: 0, range: 55 },
        ability: { dmg: 2445, spa: 8.5, range: 58, spaCap: 2 }
    },
    {
        id: "vegeta", name: "Fallen Prince", role: "Damage",
        img: "images/units/Vegeta.png",
        totalCost: 35112,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Eternal", note: "Toggle Boss Stacks for max damage." },
        stats: { dmg: 2275, spa: 8, crit: 45, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3, passiveDmg: 0, passiveSpa: 15, passiveRange: 15, element: "Dark", dotDuration: 0, range: 44 },
        ability: { passiveDmg: 150 }
    },
    {
        id: "super_roku", name: "Super Roku", role: "Damage",
        img: "images/units/SuperRoku.png",
        totalCost: 48000,
        placement: 2, tags: ["Saiyan"],
        meta: { short: "Ruler", long: "Ruler", note: "Toggle Same Enemy for boss DPS calculation." },
        stats: { dmg: 1950, spa: 6.5, crit: 10, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Light", dotDuration: 0, range: 41 },
        ability: {} 
    },
    {
        id: "trunks", name: "The Drink", role: "Damage / DoT",
        img: "images/units/Trunks.png",
        totalCost: 40000,
        placement: 4, tags: [],
        meta: { short: "Ruler", long: "Ruler", note: "Passive averages to +25% Damage." },
        stats: { dmg: 1810, spa: 8.5, crit: 0, cdmg: 150, dot: 25, dotStacks: 1, spaCap: 2, passiveDmg: 45, element: "Water", dotDuration: 5, range: 45 },
    }
];

const creditsData = [
    { role: "Owner", name: "xKing.", id: "xking.", userId: "347578773857632258", pfp: "images/pfp/xking.png", type: "owner" },
    { role: "Helper", name: "xAuroraFlare", id: "xauroraflare", userId: "216293393888837632", pfp: "images/pfp/xauroraflare.gif", type: "helper" }
];