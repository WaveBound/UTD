// ============================================================================
// CONSTANTS.JS - Configuration & Static Data
// ============================================================================

// Main Stat Values for Calculator UI
const MAIN_STAT_VALS = {
    body: { dmg: 60, dot: 75, cm: 120 },
    legs: { dmg: 60, spa: 22.5, cf: 37.5, range: 30 }
};

// Stat Name Mappings
const NAME_TO_CODE = {
    "Dmg": "dmg", "Damage": "dmg",
    "SPA": "spa",
    "Crit Dmg": "cm", "Crit Damage": "cm",
    "Crit Rate": "cf", "Crit": "cf", // Added "Crit" mapping
    "DoT": "dot", "Buff Potency": "dot",
    "Range": "range"
};

// Styling Configuration for Stats
// UPDATED: Abbreviated labels for Crit Rate and Crit Dmg to fit UI
const STAT_INFO = {
    dmg:   { label: 'Dmg',       color: '#ff8888', border: 'rgba(255,50,50,0.3)' },
    spa:   { label: 'SPA',       color: '#88ccff', border: 'rgba(50,150,255,0.3)' },
    cdmg:  { label: 'CDmg',      color: '#d8b4fe', border: '#a855f7', special: '<span class="stat-cdmg-text" style="letter-spacing:-0.5px;">CDmg</span>' },
    crit:  { label: 'Crit',      color: '#ffd700', border: 'rgba(255, 215, 0, 0.3)' },
    dot:   { label: 'DoT',       color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)' },
    range: { label: 'Range',     color: '#ffa500', border: 'rgba(255, 140, 0, 0.3)' }
};

// Info Definitions for Popups
const infoDefinitions = {
    'level_scale': {
        title: "Level Scaling Formula",
        formula: `
        <span class="ip-var">Dmg</span> = <span class="ip-var">Base</span> * (1.0045125 ^ <span class="ip-var">Lv</span>)<br>
        <span class="ip-var">SPA</span> = <span class="ip-var">Base</span> * (0.9954875 ^ <span class="ip-var">Lv</span>)
        `,
        desc: "Damage increases exponentially by approx <span style='color:#fff'>0.45%</span> per level.<br>SPA decreases by approx <span style='color:#fff'>0.45%</span> per level.<br><br><b>SSS Rank:</b> Adds a flat multiplier (<span class='ip-num'>x1.2</span> Dmg, <span class='ip-num'>x0.92</span> SPA) applied <i>after</i> level scaling."
    },
    'trait_logic': {
        title: "Trait Multipliers",
        formula: `<span class="ip-var">Combined</span> = (1 + <span class="ip-var">T1</span>%) * (1 + <span class="ip-var">T2</span>%)`,
        desc: "Traits are direct multipliers to your Base Stats.<br><br><b>Double Traits:</b> When using a Custom Pair, the traits are <b>Compounded</b> (multiplied together), not just added.<br><i>Example:</i> A <span class='ip-num'>+200%</span> Trait (x3.0) and a <span class='ip-num'>+15%</span> Trait (x1.15) result in a <b style='color:#fff'>x3.45</b> total multiplier (+245%), making double traits extremely powerful."
    },
    'relic_multi': {
        title: "Relic Stat Logic",
        formula: `<span class="ip-hl">Sum</span> (<span class="ip-var">MainStats</span> + <span class="ip-var">SubStats</span>)`,
        desc: "Relic Stats are additive with each other, but <b>Multiplicative</b> to Base Stats and Set Bonuses.<br>They are calculated in their own separate bucket."
    },
    'tag_logic': {
        title: "Additive Bucket",
        formula: `<span class="ip-var">SetBase</span> + <span class="ip-var">TagBuffs</span> + <span class="ip-var">Passive</span>`,
        desc: "<b>Set Bonuses</b>, <b>Unit Passives</b>, and <b>Ability Buffs</b> are all <b>Additive</b> with each other.<br>They are summed together before multiplying the base damage."
    },
    'spa_calc': {
        title: "SPA (Speed) Calculation",
        formula: `<span class="ip-var">Base</span> * <span class="ip-hl">LvScale</span> * (1 - <span class="ip-var">Trait</span>%) * (1 - <span class="ip-var">Relic</span>%)`,
        desc: "Speed reductions are calculated in stages.<br>1. <b>Traits</b> are multiplicative reductions (stronger).<br>2. <b>Relics/Sets</b> are additive reductions (summed together first).<br>3. <b>Cap:</b> The final value cannot go lower than the unit's specific SPA Cap."
    },
    'sungod_passive': {
        title: "Sun God Head Passive",
        formula: `<span class="ip-var">Cycle</span> = <span class="ip-num">7s</span> + (6 * <span class="ip-var">SPA</span>)`,
        desc: "The Sun God Head grants a temporary Damage % Buff equal to your total Range.<br><br><b>Trigger:</b> Every 6 Attacks.<br><b>Duration:</b> 7 Seconds.<br><br>Because the buff must expire before the counter restarts, 100% uptime is impossible."
    },
    'ninja_passive': {
        title: "Ninja Head Passive",
        formula: `<span class="ip-var">Cycle</span> = <span class="ip-num">10s</span> + (5 * <span class="ip-var">SPA</span>)`,
        desc: "The Master Ninja Head grants <span class='ip-num'>+20%</span> Damage over Time (DoT) effectiveness.<br><br>Because the buff must expire before the counter restarts, 100% uptime is impossible."
    },
    'crit_avg': {
        title: "Crit Averaging",
        formula: `<span class="ip-var">AvgHit</span> = <span class="ip-var">Base</span> * (1 + (<span class="ip-var">Rate</span>% * <span class="ip-var">CDmg</span>%))`,
        desc: "Since Crits are probabilistic, we calculate the <b>Average Damage</b> per hit over a long period.<br><br><b>Crit Rate:</b> Hard capped at 100%.<br><b>Crit Dmg:</b> Base 150% + Additions."
    },
    'dot_logic': {
        title: "Damage Over Time (DoT)",
        formula: `<span class="ip-var">Total</span> = (<span class="ip-var">Hit</span> * <span class="ip-var">Tick</span>%) * <span class="ip-var">Stacks</span>`,
        desc: "<b>Tick %:</b> The percentage of the hit damage dealt per tick.<br><b>Stacks:</b> How many times the DoT applies.<br><b>Time Basis:</b> We convert total DoT damage into DPS by dividing by the time it takes to apply (SPA)."
    },
    'attack_rate': {
        title: "Attack Rate & Multi-Hit",
        formula: `<span class="ip-var">Mult</span> = 1 + (<span class="ip-var">Extra</span> / <span class="ip-var">Needed</span>)`,
        desc: "Used for units like Kirito who trigger extra attacks upon critting.<br>If a unit hits multiple times per 'Attack Cycle' (SPA), we multiply the final DPS to account for the extra hits generated per second."
    }
};