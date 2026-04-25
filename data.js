// ============================================================================
// DATA.JS - Static Data & Configuration
// ============================================================================

const GAME_STATE = {
    BUG_DOT_RELICS: false,  // Set to true if Relic DoT is currently broken/ignored in-game
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
        version: "v5.0",
        date: "Apr 25, 2026",
        changes: [
            { type: "Math", text: "<b>Builds:</b> Builds now automatically adjust when using any buff abilities." }
        ]
    },
    {
        version: "v4.9",
        date: "Apr 22, 2026",
        changes: [
            { type: "Unit", text: "<b>New Unit:</b> Added <b>Ant King (Savage)</b> with stacking damage and radiation passives." },
            { type: "Balance", text: "<b>Ant King:</b> Includes toggleable 'Monarch's Devotion' for pairing with Jinoo." }
        ]
    },
    {
        version: "v4.8",
        date: "Apr 18, 2026",
        changes: [
            { type: "Unit", text: "<b>New Units:</b> Added <b>Majestic Armor, Unparalleled Armor, Ancient Shinob, King Sailor, Ancient Mage, Sasuke (Great War)</b>, and <b>Crow Shinobi</b>." },
            { type: "UI", text: "<b>Fix:</b> Removed the mobile menu button from the desktop view." },
            { type: "Math", text: "<b>DPS Breakdown:</b> Enhanced the breakdown to show the currently applied Relic Set bonus." },
            { type: "Math", text: "<b>Source Totals:</b> Added a new 'Source Totals' dashboard to the DPS breakdown for better visibility into buff origins." }
        ]
    },
    {
        version: "v4.7",
        date: "Apr 17, 2026",
        changes: [
            { type: "UI", text: "<b>UI Rework:</b> Major redesign of the dashboard and unit cards for better navigation." },
            { type: "Unit", text: "<b>New Unit:</b> Added <b>Underworld God (Syncro)</b>." },
            { type: "QoL", text: "<b>DPS Breakdown:</b> Added a quick-access button to view full unit passive descriptions directly from the math log." }
        ]
    },
    {
        version: "v4.6",
        date: "Apr 14, 2026",
        changes: [
            { type: "Fix", text: "<b>Relic DoT:</b> Enabled by default for all calculations (Bugged Relic toggle removed)." },
            { type: "Fix", text: "<b>Wizard Trait:</b> Re-enabled the +30% DoT Bonus functional logic." },
            { type: "Trait", text: "<b>Fission:</b> Updated description to include the +20% Radiation damage bonus." }
        ]
    },
    {
        version: "v4.5",
        date: "Feb 03, 2026",
        changes: [
            { type: "Math", text: "<b>Artificer:</b> Corrected the formula for how Artificer's relic stat bonus is calculated." }
        ]
    },
    {
        version: "v4.4",
        date: "Feb 02, 2026",
        changes: [
            { type: "Unit", text: "<b>New Units:</b> Added <b>Rohan & Robot</b>, <b>Cell</b>, <b>Trunks</b>, and <b>Vegeta</b>." },
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
    { unit: "SJW", img: "images/units/Sjw.png", isCalculated: true },
    { unit: "Sasuke", img: "images/units/Sasuke.png", isCalculated: true },
    { unit: "Kirito", img: "images/units/Kirito.png", isCalculated: true },
    { unit: "Kenpachi", img: "images/units/Kenpachi.png", isCalculated: true },
    { unit: "Ragna", img: "images/units/Ragna.png", isCalculated: true },
    { unit: "Mob", img: "images/units/Mob.png", isCalculated: true },
    { unit: "Shanks", img: "images/units/Shanks.png", isCalculated: true },
    { unit: "Genos", img: "images/units/Genos.png", isCalculated: true },
    { unit: "Water God (Primordial)", img: "images/units/WaterGod.png", isCalculated: true },
    { unit: "First Emperor", img: "images/units/FirstEmperor.png", isCalculated: true },
    { unit: "ancient_shinob", img: "images/units/AncientShinob.png", isCalculated: true },
    { unit: "underworld_god", img: "images/units/UnderworldGod.png", isCalculated: true },
    { unit: "majestic_armor", img: "images/units/MajesticArmor.png", isCalculated: true },
    { unit: "unparalleled_armor", img: "images/units/UnparalleledArmor.png", isCalculated: true },
    { unit: "sasuke_great_war", img: "images/units/SasukeGreatWar.png", isCalculated: true },
    { unit: "nutaru_beast", img: "images/units/NutaruBeast.png", isCalculated: true },
    { unit: "Crow Shinobi", img: "images/units/CrowShinobi.png", isCalculated: true },
    { unit: "ant_king_savage", img: "images/units/AntKing.png", isCalculated: true },
    { unit: "prodigy_mage", img: "images/units/ProdigyMage.png", isCalculated: true }
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
    bio_android: { dmg: 10, spa: 5, cf: 5, cm: 15, range: 5 },
    biju_set: { dmg: 10, spa: 0, cf: 0, cm: 0, range: 0 },
    rebellious_set: { dmg: 0, spa: 0, cf: 0, cm: 0, range: 0 },
    reanimated_ninja: { dmg: 10, spa: 0, cf: 0, cm: 0, range: 0, dot: 30 },
    great_mage: { dmg: 0, spa: 0, cf: 0, cm: 0, range: 10 },
    none: { dmg: 0, spa: 0, cf: 0, cm: 0, range: 0 }
};

const BODY_DMG = { dmg: 60, dot: 0, cm: 0, desc: "Dmg", type: "dmg" };
const BODY_DOT = { dmg: 0, dot: 75, cm: 0, desc: "DoT", type: "dot" };
const BODY_CDMG = { dmg: 0, dot: 0, cm: 120, desc: "Crit Dmg", type: "cm" };

const LEG_DMG = { dmg: 60, spa: 0, desc: "Dmg", type: "dmg" };
const LEG_SPA = { dmg: 0, spa: 22.5, desc: "Spa", type: "spa" };
const LEG_CRIT = { dmg: 0, spa: 0, desc: "Crit Rate", type: "cf", cf: 37.5 };
const LEG_RANGE = { dmg: 0, spa: 0, desc: "Range", type: "range", range: 30 };

const SETS = [
    { id: "ninja", name: "Master Ninja", bonus: { dmg: 5, spa: 0, cm: 0 } },
    { id: "sun_god", name: "Sun God", bonus: { dmg: 5, spa: 0, cm: 0 } },
    { id: "laughing", name: "Laughing Captain", bonus: { dmg: 5, spa: 5, cm: 0 } },
    { id: "ex", name: "Ex Captain", bonus: { dmg: 0, spa: 0, cm: 25, cf: 10 } },
    { id: "shadow_reaper", name: "Shadow Reaper", bonus: { dmg: 2.5, range: 10, cf: 5, cm: 5 } },
    { id: "reaper_set", name: "Reaper Set", bonus: { spa: 7.5, range: 15 } },
    { id: "super_roku", name: "Super Roku", bonus: { dmg: 10, cf: 15 } },
    { id: "bio_android", name: "Bio-Android", bonus: { dmg: 10, spa: 5, range: 5, cf: 5, cm: 15 } },
    { id: "biju_set", name: "Biju Set", bonus: { dmg: 10 } },
    { id: "rebellious_set", name: "Rebellious Shinobi", bonus: { dmg: 0 } },
    { id: "reanimated_ninja", name: "Reanimated Ninja", bonus: { dmg: 10, dot: 30 } },
    { id: "great_mage", name: "Great Mage", bonus: { range: 10 } }
];

const globalBuilds = SETS.flatMap(set =>
    [BODY_DMG, BODY_DOT, BODY_CDMG].flatMap(body =>
        [LEG_DMG, LEG_SPA, LEG_CRIT, LEG_RANGE].map(leg => ({
            name: `${set.name} (${body.desc}/${leg.desc})`,
            set: set.id,
            dmg: body.dmg + leg.dmg,
            spa: leg.spa,
            dot: body.dot,
            cm: body.cm,
            cf: (body.cf || 0) + (leg.cf || 0),
            range: (leg.range || 0),
            bodyType: body.type,
            legType: leg.type
        }))
    )
);

const traitsList = [
    { id: "ruler", name: "Ruler", dmg: 200, spa: 20, range: 30, desc: "+200% Dmg, Limit 1", limitPlace: 1 },
    { id: "fission", name: "Fission", dmg: 15, spa: 15, range: 25, hasRadiation: true, radiationPct: 20, desc: "+15% Dmg/SPA, +25% Range, radiation causes enemies to take +20% Dmg" },
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
        placement: 2, tags: ["Team 7", "Ninjaverse", "Hero", "Bloodline"],
        meta: { short: "Ruler", long: "Eternal/Sacred", note: "Ruler for DPS, Eternal/Sacred for support." },
        stats: { dmg: 2450, spa: 6.75, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 25, element: "Dark", range: 28 }
    },
    {
        id: "mob", name: "Psycho (100%)", role: "Damage",
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
        stats: { dmg: 2750, spa: 12, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2.5, passiveDmg: 0, element: "Rose", dotDuration: 0, range: 30 }
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
        stats: { dmg: 1100, spa: 5, crit: 0, cdmg: 150, dot: 60, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Fire", dotDuration: 7, range: 37 }
    },
    {
        id: "ichigo", name: "Ichiko (Rage)", role: "Damage",
        img: "images/units/Ichigo.png",
        totalCost: 108000,
        placement: 1, tags: ["Peroxide", "Reaper", "Rage", "Hollow"],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 3000, spa: 8, crit: 15, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 7, passiveDmg: 50, passiveSpa: 0, element: "Dark", dotDuration: 0, range: 38 }
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
        stats: { dmg: 2800, spa: 6, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 6, passiveDmg: 0, passiveSpa: 0, element: "Ice", dotDuration: 0, range: 42 }
    },
    {
        id: "ulquiorra", name: "Ultiiorra (Oblivion)", role: "Damage",
        img: "images/units/Ulqiorra.png",
        totalCost: 31760,
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Eternal", note: "Standard DPS selection." },
        stats: { dmg: 1275, spa: 5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 5, element: "Dark", dotDuration: 0, range: 37 },
        ability: { buffDmg: 65, passiveSpa: 2.5, crit: 10 }
    },
    {
        id: "harribel", name: "Tierrabel (Hydro)", role: "Damage",
        img: "images/units/Harribel.png",
        totalCost: 30964,
        placement: 3, tags: ["Peroxide", "Hollow"],
        meta: { short: "Ruler", long: "Eternal", note: "Standard DPS selection." },
        stats: { dmg: 1490, spa: 8.5, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 2, passiveDmg: 0, passiveSpa: 0, element: "Water", dotDuration: 0, range: 30 },
        ability: { buffDmg: 35, buffDuration: 80, spaCap: 4, hasToggle: true }
    },
    {
        id: "ace", name: "Ace", role: "Damage / Burn(DoT)",
        img: "images/units/Ace.png",
        totalCost: 39000,
        placement: 3, tags: [],
        meta: { short: "Ruler", long: "Ruler/Astral", note: "Ruler provides good dps to cost." },
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
        stats: { dmg: 8750, spa: 14, crit: 0, cdmg: 150, dot: 50, dotStacks: 1, spaCap: 4, passiveDmg: 0, element: "Fire", dotDuration: 10, range: 50 },
        ability: { passiveDmg: 50, passiveSpa: -50 }
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
        id: "cell", name: "Cell", role: "Damage / Summon",
        img: "images/units/Cell.png",
        totalCost: 56000,
        placement: 1, tags: ["Bio-Android"],
        meta: { short: "Ruler", long: "Ruler", note: "Ruler is strictly best due to 1 placement count. Base form is True Form. Toggle for Perfect Form (Summon)." },
        stats: {
            baseName: "True Form",
            dmg: 3250, spa: 10, crit: 0, cdmg: 150, dot: 0, spaCap: 4.1,
            passiveDmg: 70, element: "Wind", range: 43
        },
        ability: {
            abilityName: "Perfect Form",
            dmg: 3025, spa: 9.5, spaCap: 2.5, range: 43,
            passiveDmg: 50,
            summonStats: {
                attacksToSpawn: 3, maxCount: 3, dmgPct: 50, buffWindow: 0,
                planeA: { spa: 7.5, duration: 30 },
                planeB: { spa: 7.5, duration: 30 }
            }
        }
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
    },
    {
        id: "water_god", name: "Water God (Primordial)", role: "Damage",
        img: "images/units/WaterGod.png",
        totalCost: 72600,
        placement: 3, tags: [],
        meta: {
            short: "Ruler/Sacred",
            long: "Sacred/Fission",
            note: "God Of The Seas: +20% DoT/Affliction. Crit increases 5% per attack (Cap 30/50%). Double attack at cap."
        },
        stats: { dmg: 2500, spa: 9, crit: 50, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 3.5, passiveDmg: 0, element: "Water", dotDuration: 0, range: 30, followUp: true },
        ability: { buffDmg: 50, abilityName: "Primordial Wave", noToggle: true, cooldown: 60, desc: "Water God summons a Primordial Wave down The Path that deals 200% Damage to all Enemies on That Path." },
        passives: [
            { name: "God Of The Seas", desc: "Applies +20% DoT and Affliction Time (+30% at E4). Increases Crit Rate by 5% per attack up to 30% (50% at E2). Performs FuA at cap." },
            { name: "Primordial Power", desc: "Inflicts 'Time Snail' (3s): +20% DoT Duration, 30% Slow, and buffs Water God Damage by 5% per enemy effected (max +50%)." }
        ],
        etherealization: [
            "+10 Stat Points",
            "Crit rate cap increased to 50%<br>(God Of The Seas)",
            "+10 Stat Points",
            "DoT and Affliction Time increased by 10%<br>(God Of The Seas)",
            "+10 Stat Points",
            "+75% Damage per placement"
        ]
    },
    {
        id: "first_emperor", name: "First Emperor", role: "Damage",
        img: "images/units/FirstEmperor.png",
        totalCost: 89500,
        placement: 1, tags: [],
        meta: { short: "Ruler", long: "Ruler", noz: "Attack Form: Demon art : Axe. Ruler is strictly best due to 1 placement count." },
        stats: { dmg: 3200, spa: 7, crit: 0, cdmg: 150, dot: 120, dotStacks: 1, spaCap: 3, passiveDmg: 0, element: "Rose", dotDuration: 10, range: 32 },
        passives: [
            { name: "Guidance of the Original Monarch", desc: "Everytime First Emperor switches Demonic Arts, all Units in First Emperor's Range will perform an Attack. [On E6] Units Performing an Attack will gain 15% of First Emperor's Damage for 10 seconds." },
            { name: "Flow Disruptor", desc: "When First Emperor Attacks a Sprinter Enemy, The Enemy gets slowed by 30% for 3 seconds." },
            { name: "The King's Advantage", desc: "First Emperor deals +25% Damage to non shielded Enemies." },
            { name: "Indomitable Willpower", desc: "When First Emperor is Stunned, he resists the Stun and applies a 3 Seconds Stun on his next Attack." }
        ],
        ability: {
            abilityName: "Demonic Art Swap",
            noToggle: true,
            desc: "When First Emperor Reaches his Final Upgrade, he unlocks the Ability to Change his Demonic Art. Starts with <b class='mt-text-gold'>Blade</b>.<br><br>" +
                "<span style='display: block; margin-top: 10px;'><b class='mt-text-gold'>Blade:</b> +60% Damage (+80% on E2) for 25s on switch.</span>" +
                "<span style='display: block; margin-top: 6px;'><b class='mt-text-orange'>Axe:</b> Attacks Slow Enemies by 40% for 5s. Confusion for 3s on first hit.</span>" +
                "<span style='display: block; margin-top: 6px;'><b class='text-accent-start'>Crossbow:</b> +1000% Range, Sets Priority to Strongest. Attacks apply Stun for 2s, but -20% Attack Speed. <span class='text-dim'>[On E6: +30% Damage]</span></span>" +
                "<span style='display: block; margin-top: 6px;'><b class='mt-text-green'>Spear:</b> Attacks get rid of old Bleed and apply new Bleed (100% Damage, 120% on E2) over 10 ticks.</span>" +
                "<span style='display: block; margin-top: 6px;'><b class='text-accent-end'>Armor:</b> Sets Priority to Last and moves to Closest Path point. Confusion for 1.5s (2.5s on E4) to Non-Boss enemies walking into him. <span class='text-dim'>[On E4: deals 50% Damage to confused enemies]</span></span>"
        },
        etherealization: [
            "+10 Stat Points",
            "\"Demon Art: Blade\" Damage Buff Increased to +80%",
            "+10 Stat Points",
            "\"Demon Art: Armor\" now deals 50% Damage, Confusion Duration Increase To 2.5s",
            "+10 Stat Points",
            "\"Guidance of the Original Monarch\" Passive now Buffs Units and \"Demon Art: Crossbow\" gives +30% Damage."
        ]
    },
    {
        id: "underworld_god",
        name: "Underworld God (Syncro)",
        role: "Damage / Support",
        img: "images/units/UnderworldGod.png",
        totalCost: 89400,
        placement: 2,
        tags: ["Divinity"],
        meta: { short: "Ruler", long: "Ruler", note: "Divine Blood converts debuffs to buffs. Eldest Brother provides up to +90% Damage via Divinity tags." },
        stats: { dmg: 7500, spa: 10, crit: 0, cdmg: 150, dot: 0, dotStacks: 1, spaCap: 4, passiveDmg: 90, passiveSpa: 15, element: "Wind", range: 40 },
        passives: [
            { name: "Divine Blood", desc: "Whenever Underworld God receives a negative buff, he converts it into a positive buff. [On E4]: These buffs last indefinitely." },
            { name: "As The Eldest Brother", desc: "Each unit with the 'Divinity' tag in range buffs this unit by +15% Damage, up to 60% (90% on E2)." },
            { name: "Sibling Combined Might", desc: "Passively has +35% (+60% on E6) Hyper Armor Damage. Performs a 75% Damage follow-up attack when hitting an Armored Enemy for the first time." },
            { name: "Primordial Power", desc: "Passively applies +20% DoT and Affliction Time. Inflicts 'Time Snail' (3s): +20% DoT Duration, 30% Slow, and +1% Attack Speed per afflicted enemy in range (max 15%)." }
        ],
        etherealization: [
            "+10 Stat Points",
            "As The Eldest Brother: Max Damage buff increased to 90%",
            "+10 Stat Points",
            "Divine Blood: Converted positive buffs now last indefinitely",
            "+10 Stat Points",
            "Sibling Combined Might: Hyper Armor Damage increased to 60%"
        ]
    },
    {
        id: "ancient_shinob",
        name: "Ancient Shinob",
        role: "Damage / Debuff",
        img: "images/units/AncientShinob.png",
        totalCost: 96450,
        placement: 3,
        tags: ["Sage", "Bloodline", "Villain", "Ninjaverse"],
        meta: { short: "Ruler", long: "Ruler", note: "Reanimation triples damage but forces 1 placement. Samurai Technique (E2) adds burst damage." },
        stats: {
            dmg: 11750,
            spa: 25,
            range: 45,
            spaCap: 5,
            crit: 0,
            cdmg: 150,
            passiveDmg: 50, // 30% (The Wisest) + 20% (Ancient Techniques Debuff)
            dot: 12.5,     // 25% Burn every other attack = 12.5% avg
            dotDuration: 6,
            dotStacks: 1,
            element: "Water"
        },
        ability: {
            abilityName: "Reanimation",
            desc: "Removes all placements and sets limit to 1. Re-Place Bonus: +150% Damage (+200% total at E6).",
            passiveDmg: 200, // +200% on top of 100% base = 300% (35,250 dmg)
            limitPlace: 1
        },
        passives: [
            { name: "The Wisest", desc: "Every 5s gain +2% Damage (+5% at E4). Max: 30%." },
            { name: "Ancient Techniques of Old", desc: "Alternating attacks. Atk 1: Confuse (2s). Atk 2: Burn (25% Dmg over 6s). Enemies hit take +20% Damage." },
            { name: "Samurai Technique", desc: "[E2] Gain +15% Damage for 15s upon use." },
            { name: "Weapon Proficiency", desc: "Stun Immunity. Every 5 attacks cycles weapons (modifiers ignored in DPS calc)." }
        ],
        etherealization: [
            "+10 Stat Points",
            "\"Samurai Technique\" Passive adds +15% Damage for 15s.",
            "+10 Stat Points",
            "\"The Wisest\" Passive Buff increased to +5%.",
            "+10 Stat Points",
            "\"Reanimation\" Damage increased to +200%."
        ]
    },
    {
        id: "majestic_armor",
        name: "Majestic Armor (Syncro)",
        role: "Damage / DoT",
        img: "images/units/MajesticArmor.png",
        totalCost: 140910,
        placement: 2,
        tags: ["Team 7", "Ninjaverse", "Hero", "Bloodline"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "High base crit and powerful dual-element DoT makes this unit an extremely efficient hybrid."
        },
        stats: {
            dmg: 13000, spa: 12, range: 40, spaCap: 5,
            crit: 50, // 0 + 50 from Passive
            cdmg: 250, // 150 + 100 from Passive
            dot: 60,
            dotDuration: 6,
            dotStacks: 1,
            element: "Dark",
            passiveDmg: 0
        },
        passives: [
            { name: "Combined Might", desc: "On attack apply either black burn or wind shear for 60% over 6 ticks." },
            { name: "Unlikely Alliance", desc: "On placement gain +50% Crit rate and +100% Critical damage." }
        ]
    },
    {
        id: "unparalleled_armor",
        name: "Unparalleled Armor (Syncro)",
        role: "Damage / Buffer",
        img: "images/units/UnparalleledArmor.png",
        totalCost: 168360,
        placement: 1,
        tags: ["Sage", "Bloodline", "Villain", "Ninjaverse"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "Global Buffer: Bijuu Link (Toggle) provides massive scaling to all units."
        },
        stats: {
            dmg: 24000, spa: 12, range: 35, spaCap: 4,
            crit: 0, cdmg: 150, dot: 0,
            element: "Water", passiveDmg: 0, hyper: 60
        },
        passives: [
            { name: "Unparalleled Combination", desc: "On placement gain +60% Hyper Armor Damage." },
            { name: "Bijuu Link", desc: "Energy overflows to allies in range, giving them glowing red cloaks (+25% Dmg, +25% Range, -15% SPA)." },
            { name: "Power of ancient shinobi", desc: "On attack apply either stun or confuse for 3 seconds." }
        ]
    },
    {
        id: "sasuke_great_war",
        name: "Sasku (Great War)",
        role: "Damage / Debuff",
        img: "images/units/SasukeGreatWar.png",
        totalCost: 69000,
        placement: 3,
        tags: ["Sage", "Bloodline", "Villain", "Ninjaverse"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "The suggested Ruler trait is intended for fusing to create Majestic Armor (Syncro)."
        },
        stats: {
            dmg: 3000, spa: 9, range: 40, spaCap: 4,
            crit: 0, cdmg: 150,
            dot: 60, dotDuration: 10, dotStacks: 1,
            element: "Dark",
            passiveDmg: 50 // Avg: Clanhood (20%) + Spirited Cage (15%) + Hatred (15%)
        },
        passives: [
            { name: "Spirited Cage", desc: "Stunning enemies builds charges. At full charge: +50% True Damage and Stun Immunity for 10s." },
            { name: "Clanhood", desc: "Gain +10% Damage for every 'Bloodline' tag unit in range." },
            { name: "Dimensional Warp", desc: "Execute enemies below 30% HP (40% at E2). Bosses take 300% instant damage + 3% Burn/s." },
            { name: "Pure Hatred", desc: "Enemies entering range take +15% Damage. Dark enemies are stunned for 3s." },
            { name: "Combat Arts", desc: "Almighty Push (40s CD): 200% Dmg + Push. Almighty Pull (50s CD): 5s Stun. Amenatejikara: Crit Buffs." }
        ],
        etherealization: [
            "+10 Stat Points",
            "Dimensional Warp trigger requirement increased to 40% Health.",
            "+10 Stat Points",
            "Spirited Cage charge requirement reduced to 3 stuns.",
            "+10 Stat Points",
            "Full Susanoo: Damage Bonus increased to +150%."
        ]
    },
    {
        id: "king_sailor",
        name: "King Sailor",
        role: "Damage / Global Buffer",
        img: "images/units/KingSailor.png",
        totalCost: 91800,
        placement: 2,
        tags: ["Magi", "King", "Hero", "Uncontrollable Power"],
        meta: { short: "Ruler", long: "Ruler", note: "Manipulator of Fate: +50% Dmg / -25% SPA. Baal's Lightning provides +20% Follow-up damage." },
        stats: {
            dmg: 6325, spa: 15, range: 45, spaCap: 4,
            crit: 20, cdmg: 175, followUp: 20,
            element: "Water", passiveDmg: 50, passiveSpa: 25
        },
        passives: [
            { name: "Manipulator of Fate", desc: "Gain +50% Damage and -25% Attack Speed based on shared tags with allies." },
            { name: "Baal's Lightning", desc: "Every attack chains to 7 enemies for 20% damage (E4). Range extended by 10%." },
            { name: "Unrivaled Mark", desc: "Global Buff: Magi (+50% Dmg, -15% SPA), Uncontrollable (+30% Dmg, -10% SPA), Water (+20% Dmg, -10% SPA)." },
            { name: "Rukh's Judgement", desc: "When attacking an enemy inflicted by chain lightning in the last 10s: +10% Crit Damage and +5% Crit Chance for 15s. [On E6]: both buffs increased by 15%." }
        ],
        etherealization: [
            "+10 Stat Points",
            "\"Baal's Lightning\" Chains up to 7 enemies",
            "+10 Stat Points",
            "\"Baal's Lightning\" Damage increased to 20%",
            "+10 Stat Points",
            "\"Rukh's Judgement\" Buffs increased by 15% each."
        ]
    },
    {
        id: "nutaru_beast",
        name: "Nutaru (Beast)",
        role: "Damage / Summon",
        img: "images/units/NutaruBeast.png",
        totalCost: 71910,
        placement: 2,
        tags: ["Team 7", "Ninjaverse", "Main character", "Sage", "Hero", "Bloodline"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "Dynamic Attacker: Swapping to Beast Mode increases SPA Cap to 3.0 but grants massive Crit and Cycle damage."
        },
        stats: {
            dmg: 3300, spa: 8, range: 45, spaCap: 2.5,
            crit: 0, cdmg: 150, dot: 0,
            element: "Wind",
            passiveDmg: 40 // Average uptime for clone disappearance buff
        },
        ability: {
            abilityName: "Beast Mode",
            desc: "[E6] Unleash the Beast: +30% Dmg, +50% CDmg, +35% Crit Rate, +50% Cycle Dmg. SPA Cap: 3.0s. Clones deal 25% more Damage.",
            passiveDmg: 120, // 30 (Beast) + 40 (Clone Loss) + 50 (Cycle)
            crit: 35,
            cdmg: 200,
            spaCap: 3.0,
            summonStats: {
                attacksToSpawn: 8, maxCount: 3, dmgPct: 75, buffWindow: 0,
                planeA: { spa: 8, duration: 20 },
                planeB: { spa: 8, duration: 20 }
            }
        },
        passives: [
            { name: "Shadow Clone", desc: "Every 8 attacks, summon a clone (Max 3 at E2) for 20s. Clones deal 75% Dmg. Gain +20% Dmg (Max 40%) when clones expire." },
            { name: "Chakra Control", desc: "+5% Chakra per attack. Auto-enters Beast Mode at 100%. Beast Mode lasts 100s." },
            { name: "Beast Cycle", desc: "Cycles: Beast Slam -> Beast Ball -> Massive Beast Ball. Completion grants +50% Damage for the mode duration." }
        ],
        etherealization: [
            "+10 Stat Points",
            "Shadow Clone cap increased to 3.",
            "+10 Stat Points",
            "Clones gain +25% Damage while Beast Mode is active.",
            "+10 Stat Points",
            "Beast Mode Crit Rate increased to 35%. Summons gain +60% Damage."
        ]
    },
    {
        id: "crow_shinobi",
        name: "Crow Shinobi",
        role: "Damage / Debuff",
        img: "images/units/CrowShinobi.png",
        totalCost: 68450,
        placement: 3,
        tags: ["Ninjaverse", "Bloodline", "Hero"],
        meta: {
            short: "Ruler",
            long: "Eternal",
            note: "Powerful DoT and crowd control. Below 60% HP, Amaterasu becomes significantly more lethal."
        },
        stats: {
            dmg: 3050, spa: 8, range: 46, spaCap: 2.5,
            crit: 0, cdmg: 150, dot: 60, dotDuration: 10, dotStacks: 1,
            element: "Fire"
        },
        passives: [
            { name: "Elusive Crow Distraction", desc: "Every 5 attacks (4 at E2) confuses enemies for 2 seconds (3s at E2)." },
            { name: "Flame Sealing Technique", desc: "On Kill (Enemy with Black Burn): 30% chance to stun nearby enemies for 4s." },
            { name: "Amaterasu", desc: "Attacks apply Black Burn (60% Dmg over 10 ticks). Re-applying to a burning target inflicts 'Time Snail': +20% DoT/Affliction and 30% Slow. Enemies below 60% HP take 3% (6% at E6) unit damage per second until death." }
        ],
        ability: {
            abilityName: "Moon God: Counter Crash",
            desc: "Summons a meteor dealing 150% (250% at E4) damage and removes all enemy modifiers. Cooldown: 60s.",
            noToggle: true,
            cooldown: 60
        },
        etherealization: [
            "+10 Stat Points",
            "Elusive Crow: Proc at 4 attacks, 3s duration",
            "+10 Stat Points",
            "Counter Crash: Damage increased to 250%",
            "+10 Stat Points",
            "Amaterasu: Execute Burn increased to 6%"
        ]
    },
    {
        id: "ancient_mage",
        name: "Ancient Mage",
        role: "Damage / Utility / Support",
        img: "images/units/AncientMage.png",
        totalCost: 66700,
        placement: 1,
        tags: ["Sage", "Bloodline", "Hero", "Main character"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "Dynamic Class System. Specialist mode maximizes DoT, while DPS mode provides the highest raw hit damage."
        },
        stats: {
            dmg: 5500, spa: 8, range: 45, spaCap: 4,
            crit: 0, cdmg: 150, dot: 60, dotDuration: 10,
            element: "Light",
            passiveDmg: 40,  // Base Experience (20) + DPS (20)
            passiveSpa: -40, // DPS Speed Penalty
            bossDmg: 50,     // DPS Boss Killer
            dotBuff: 20      // Lower DoT effectiveness in DPS mode
        },
        modes: {
            "DPS": { desc: "Combat focus: +20% Dmg, -40% Atk Speed, +50% Boss Dmg. Applies Wind Shear (60% DoT over 10s)." },
            "Specialist": { desc: "Magic focus: +40% DoT, +50% True Damage. Swaps Wind Shear for Burn (60% DoT over 10s)." },
            "Support": { desc: "Stop attacking and buffs units in range: +15% Effect Res, +20% Crit Damage, +20% Crit Rate. When buffed unit attacks: Follow-up attack (Follow Up Cooldown: 30s)." },
            "Utility": { desc: "Attack apply stun for 2s. If already stunned: Enemies will take +20% damage (cannot apply multiple times). Apply slow (75% Speed for 5s)." }
        },
        passives: [
            { name: "Millennia Old Experience", desc: "Every attack: Enemies take +20% Damage (Debuff) and Wind Shear (60% Dmg over 10 ticks). Specialist Mode swaps Wind Shear for Burn and increases DoT effectiveness." },
            { name: "The Last Great Mage", desc: "Gains Stun Immunity while not attacking (Always active at E4)." }
        ],
        ability: {
            abilityName: "Specialist",
            desc: "Magic focus: +40% DoT, +50% True Damage. Swaps Wind Shear for Burn (60% DoT over 10s).",
            passiveDmg: 20,  // Base Experience
            passiveSpa: 0,
            bossDmg: 0,
            dotBuff: 60,     // Specialist focus
            hyper: 50,       // Specialist focus
            cooldown: 60
        },
        etherealization: [
            "+10 Stat Points",
            "Gain +20% DOT effectiveness.",
            "+10 Stat Points",
            "The Last Great Mage: Stun Immunity is always active.",
            "+10 Stat Points",
            "Battle Adaptation: Cooldown reduced to 45s."
        ]
    },
    {
        id: "prodigy_mage",
        name: "Prodigy Mage",
        role: "Damage / Support",
        img: "images/units/ProdigyMage.png",
        totalCost: 46200,
        placement: 3,
        tags: ["Hero"],
        meta: {
            short: "Sacred/Eternal",
            long: "Sacred/Eternal",
            note: "Battle Dominant: Applies powerful Slow and Wind Shear DoT. Party's Tactician allows flexible buffs for Hill or Ground allies."
        },
        stats: {
            dmg: 2450, spa: 6, range: 44, spaCap: 3,
            crit: 0, cdmg: 150,
            dot: 0, dotDuration: 0, dotStacks: 0,
            element: "Rose",
            passiveDmg: 0
        },
        passives: [
            { name: "Battle Dominant", desc: "Every attack: apply slow (30% Speed for 5s). [E4]: Attacking slowed units applies Stun for 2.5s." },
            { name: "Travel Buddies", desc: "If Ancient Mage is in Range: -20% Attack Speed.<br>If Dragon Slayer is in range: +25% Range.<br>[E2]: Buffs increased by 5%." }
        ],
        ability: {
            abilityName: "Party’s Tactician",
            noToggle: true,
            desc: "Select any unit in range to ally with.<br>Hill Unit Selected: -30% Attack Speed on Both units.<br>Ground Unit Selected: +45% Crit Rate On Both Units."
        },
        etherealization: [
            "+10 Stat Points",
            "\"Travel Buddies\" Passive Buff Increased by 5% each.",
            "+10 Stat Points",
            "Attacking Slowed enemies applies Stun for 2.5s.",
            "+10 Stat Points",
            "Upgrade Cost decreased by 20%."
        ]
    },
    {
        id: "ant_king_savage",
        name: "Ant King (Savage)",
        role: "Damage / Debuff",
        img: "images/units/AntKing.png",
        totalCost: 63000,
        placement: 2,
        tags: ["Leveling", "King"],
        meta: {
            short: "Ruler",
            long: "Ruler",
            note: "Predatory Gluttony: Gain +30% True Damage and +30% (+50% at E6) Damage via kill-stacking. Reset after 10s without kill."
        },
        stats: {
            dmg: 4300, spa: 8, range: 40, spaCap: 2,
            crit: 0, cdmg: 150,
            dot: 80, dotDuration: 6, dotStacks: 1,
            element: "Dark",
            passiveDmg: 50, // Max Gluttony Stacks
            hyper: 30       // True Damage
        },
        passives: [
            { name: "Predatory Gluttony", desc: "Gain +30% True Damage. Every Kill: Gain +1% Damage (Cap +30% [+50% at E6]). Boss Kill instantly caps. Resets after 10s without getting a kill." },
            { name: "Paralyzing Venom", desc: "Applies Radiation for 80% Damage over 6 ticks. Applies 15% (20% at E2) Slow while active." },
            { name: "Monarch's Devotion", desc: "When 'Jinoo' is in range: +20% Damage, +10% Range. [On E4]: Buffs all other units in range by +10% Damage." }
        ],
        ability: {
            abilityName: "Monarch's Devotion",
            desc: "Simulate 'Jinoo' presence in range: +20% Damage, +10% Range.",
            buffDmg: 20,
            passiveRange: 10,
            hasToggle: true
        },
        etherealization: [
            "+10 Stat Points",
            "\"Paralyzing Venom\" Slow increased to 20%.",
            "+10 Stat Points",
            "\"Monarch's Devotion\" gives all units in range +10% Damage.",
            "+10 Stat Points",
            "\"Predatory Gluttony\" Damage Cap increased to +50%."
        ]
    }
];

const creditsData = [
    { role: "Owner", name: "xKing.", id: "xking.", userId: "347578773857632258", pfp: "images/pfp/xking.png", type: "owner" },
    { role: "Helper", name: "xAuroraFlare", id: "xauroraflare", userId: "216293393888837632", pfp: "images/pfp/xauroraflare.gif", type: "helper" }
];