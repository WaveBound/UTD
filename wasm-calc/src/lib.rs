use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// --- STRUCTS ---

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UnitStats {
    pub id: String,
    pub dmg: f64,
    pub spa: f64,
    pub crit: f64, // 0-100
    pub cdmg: f64, // Base 150 usually
    #[serde(default)]
    pub dot: f64,
    #[serde(default)]
    pub dotStacks: f64,
    #[serde(default)]
    pub spaCap: f64,
    #[serde(default)]
    pub passiveDmg: f64,
    #[serde(default)]
    pub passiveSpa: f64,
    #[serde(default)]
    pub element: String,
    #[serde(default)]
    pub range: f64,
    #[serde(default)]
    pub hitCount: f64,
    #[serde(default)]
    pub reqCrits: f64,
    #[serde(default)]
    pub extraAttacks: f64,
    #[serde(default)]
    pub burnMultiplier: f64,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub dotDuration: f64,
    #[serde(default)]
    pub buffDmg: f64,
    #[serde(default)]
    pub passiveRange: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Trait {
    pub id: String,
    pub name: String,
    pub dmg: f64,
    pub spa: f64,
    #[serde(default)]
    pub range: f64,
    #[serde(default)]
    pub bossDmg: f64,
    #[serde(default)]
    pub critRate: f64,
    #[serde(default)]
    pub dotBuff: f64,
    #[serde(default)]
    pub isEternal: bool,
    #[serde(default)]
    pub hasRadiation: bool,
    #[serde(default)]
    pub radiationDuration: f64,
    #[serde(default)]
    pub allowDotStack: bool,
    #[serde(default)]
    pub allowPlacementStack: bool,
    #[serde(default)]
    pub relicBuff: Option<f64>,
    #[serde(default)]
    pub limitPlace: Option<f64>,
    #[serde(default)]
    pub isCustom: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RelicStats {
    pub set: String, // "set_id" in rust, mapped to "set" in JS
    pub dmg: f64,
    pub spa: f64,
    pub range: f64,
    pub cm: f64,
    pub cf: f64,
    pub dot: f64,
}

impl RelicStats {
    pub fn new(set_id: &str) -> Self {
        RelicStats {
            set: set_id.to_string(),
            dmg: 0.0,
            spa: 0.0,
            range: 0.0,
            cm: 0.0,
            cf: 0.0,
            dot: 0.0,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Context {
    pub dmgPoints: f64,
    pub spaPoints: f64,
    pub wave: f64,
    pub isBoss: bool,
    pub placement: f64,
    pub isSSS: bool,
    pub headPiece: String, // "none", "sun_god", etc.
    pub isVirtualRealm: bool,
    #[serde(default)]
    pub starMult: f64, // Defaults to 1.0 usually
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BuildTemplate {
    pub name: String,
    pub set: String,
    pub bodyType: String,
    pub legType: String,
    pub dmg: f64,
    pub spa: f64,
    pub dot: f64,
    pub cm: f64,
    pub cf: f64,
    pub range: f64,
}

// Result struct to return to JS
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OptimizationResult {
    pub id: String,
    pub setName: String,
    pub traitName: String,
    pub dps: f64,
    pub spa: f64,
    #[serde(default)]
    pub range: f64,
    pub prio: String,
    pub mainStats: MainStatsDesc,
    pub subStats: SubStatsDesc,
    pub headUsed: String,
    pub isCustom: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MainStatsDesc {
    pub body: String,
    pub legs: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SubStatsDesc {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head: Option<Vec<SubStatAssignment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<Vec<SubStatAssignment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legs: Option<Vec<SubStatAssignment>>,
    #[serde(default)]
    pub selectedHead: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SubStatAssignment {
    #[serde(rename = "type")]
    pub type_: String, // "dmg", "spa"
    pub val: f64,
}

// --- CONSTANTS ---

// Hardcoded perfect subs
pub fn get_perfect_sub(key: &str) -> f64 {
    match key {
        "dmg" => 4.0,
        "spa" => 1.5,
        "cm" => 4.5,
        "cf" => 2.5,
        "dot" => 5.0,
        "range" => 2.0,
        _ => 0.0,
    }
}

pub fn get_set_bonus(set_id: &str) -> RelicStats {
    let mut stats = RelicStats::new(set_id);
    match set_id {
        "laughing" => { stats.dmg = 5.0; stats.spa = 5.0; },
        "ninja" => { stats.dmg = 5.0; },
        "sun_god" => { stats.dmg = 5.0; },
        "ex" => { stats.cf = 10.0; stats.cm = 25.0; },
        "shadow_reaper" => { stats.dmg = 2.5; stats.range = 10.0; stats.cf = 5.0; stats.cm = 5.0; },
        "reaper_set" => { stats.spa = 7.5; stats.range = 15.0; },
        _ => {}
    }
    stats
}

// --- LOGIC ---

// Helper to level scale
fn get_level_stats(base_dmg: f64, base_spa: f64, dmg_points: f64, spa_points: f64) -> (f64, f64, f64) {
    let dmg_mult = 1.0045125_f64.powf(dmg_points);
    let spa_mult = 0.9954875_f64.powf(spa_points);
    (base_dmg * dmg_mult, base_spa * spa_mult, dmg_mult)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CalcResultRaw {
    pub total: f64,
    pub hit: f64,
    pub dot: f64,
    pub spa: f64,
    pub range: f64,
}

pub fn calculate_dps(u_stats: &UnitStats, relic_stats: &RelicStats, trait_obj: &Trait, context: &Context) -> CalcResultRaw {
    let mut lv_dmg: f64;
    let mut lv_spa: f64;
    let dmg_mult_val: f64;

    let res = get_level_stats(u_stats.dmg, u_stats.spa, context.dmgPoints, context.spaPoints);
    lv_dmg = res.0;
    lv_spa = res.1;
    dmg_mult_val = res.2;

    if context.isSSS {
        lv_dmg *= 1.2;
        lv_spa *= 0.92;
    }

    // Trait setup
    let mut passive_pct = u_stats.passiveDmg + u_stats.buffDmg;
    let passive_spa_pct = u_stats.passiveSpa;
    let mut trait_dmg_pct = trait_obj.dmg;
    let trait_spa_pct = trait_obj.spa;
    let trait_crit_rate = trait_obj.critRate;
    let mut trait_range_pct = trait_obj.range;
    let trait_dot_buff = trait_obj.dotBuff;

    // Eternal Logic
    let mut eternal_dmg_buff = 0.0;
    if trait_obj.isEternal {
        let wave_cap = if context.wave > 12.0 { 12.0 } else { context.wave };
        eternal_dmg_buff = wave_cap * 5.0;
        passive_pct += eternal_dmg_buff;
        trait_range_pct += wave_cap * 2.5;
    }

    if trait_obj.bossDmg > 0.0 && context.isBoss {
        trait_dmg_pct += trait_obj.bossDmg;
    }

    // Set Bonus
    let mut s_bonus = get_set_bonus(&relic_stats.set);
    let star_mult = if context.starMult > 0.0 { context.starMult } else { 1.0 };
    if star_mult != 1.0 {
        s_bonus.dmg *= star_mult;
        s_bonus.spa *= star_mult;
        s_bonus.range *= star_mult;
        s_bonus.cm *= star_mult;
        s_bonus.cf *= star_mult;
        s_bonus.dot *= star_mult;
    }

    // Head Piece / Tag Logic
    if context.headPiece == "reaper_necklace" {
        s_bonus.spa += 7.5;
        s_bonus.range += 15.0;
    } else if context.headPiece == "shadow_reaper_necklace" {
        s_bonus.dmg += 2.5;
        s_bonus.range += 10.0;
        s_bonus.cf += 5.0;
        s_bonus.cm += 5.0;
    }

    // Elemental Set Bonuses
    if relic_stats.set == "ninja" {
        if ["Dark", "Rose", "Fire"].contains(&u_stats.element.as_str()) {
            s_bonus.dmg += 10.0;
        }
    } else if relic_stats.set == "sun_god" {
        if ["Ice", "Light", "Water"].contains(&u_stats.element.as_str()) {
            s_bonus.dmg += 10.0;
        }
    }

    // Tag Set Bonuses (Shadow/Reaper)
    if relic_stats.set == "shadow_reaper" {
        if u_stats.tags.contains(&"Peroxide".to_string()) { s_bonus.spa += 10.0; }
        if u_stats.tags.contains(&"Reaper".to_string()) { s_bonus.dmg += 25.0; s_bonus.spa += 12.5; }
        if u_stats.tags.contains(&"Rage".to_string()) { s_bonus.dmg += 15.0; s_bonus.spa += 8.5; s_bonus.dot += 10.0; }
        if u_stats.tags.contains(&"Hollow".to_string()) { s_bonus.cf += 20.0; s_bonus.cm += 12.5; }
    } else if relic_stats.set == "reaper_set" {
        if u_stats.tags.contains(&"Peroxide".to_string()) { s_bonus.dmg += 10.0; s_bonus.dot += 5.0; s_bonus.cm += 8.5; }
        if u_stats.tags.contains(&"Reaper".to_string()) { s_bonus.range += 15.0; }
        if u_stats.tags.contains(&"Rage".to_string()) { s_bonus.cm += 25.0; s_bonus.cf += 10.0; s_bonus.range += 10.0; }
        if u_stats.tags.contains(&"Hollow".to_string()) { s_bonus.dmg += 12.5; s_bonus.spa += 7.5; s_bonus.range += 15.0; }
    }

    // Relic Base Stats
    // Assuming stat config is always true for now as in data.js
    let mut base_r_dmg = relic_stats.dmg;
    let mut base_r_spa = relic_stats.spa;
    let mut base_r_cm = relic_stats.cm;
    let mut base_r_cf = relic_stats.cf;
    let mut base_r_dot = relic_stats.dot;
    let mut base_r_range = relic_stats.range;

    if let Some(mult) = trait_obj.relicBuff {
        base_r_dmg *= mult;
        base_r_spa *= mult;
        base_r_cm *= mult;
        base_r_cf *= mult;
        base_r_dot *= mult;
        base_r_range *= mult;
    }

    // Final SPA
    let after_trait_spa = lv_spa * (1.0 - trait_spa_pct / 100.0);
    let spa_after_relic = after_trait_spa * (1.0 - base_r_spa / 100.0);
    let set_and_passive_spa = s_bonus.spa + passive_spa_pct;
    let raw_final_spa = spa_after_relic * (1.0 - set_and_passive_spa / 100.0);
    let cap = if u_stats.spaCap > 0.0 { u_stats.spaCap } else { 0.1 };
    let final_spa = if raw_final_spa < cap { cap } else { raw_final_spa };

    // Final Range
    let level_range = u_stats.range * dmg_mult_val;
    let set_range = s_bonus.range;
    let range_mult = 1.0 + (trait_range_pct + base_r_range + u_stats.passiveRange + set_range) / 100.0;
    let final_range = level_range * range_mult;

    // Head Piece Passives
    let mut head_dmg_buff = 0.0;
    let mut head_dot_buff = 0.0;

    if context.headPiece == "sun_god" {
        // attacks=6, duration=7
        let time_to_trigger = 6.0 * final_spa;
        let uptime = 7.0 / (7.0 + time_to_trigger);
        head_dmg_buff += final_range * uptime;
    } else if context.headPiece == "ninja" {
        // attacks=5, duration=10
        let time_to_trigger = 5.0 * final_spa;
        let uptime = 10.0 / (10.0 + time_to_trigger);
        head_dot_buff += 20.0 * uptime;
    }

    // Final Damage
    let trait_mult = 1.0 + trait_dmg_pct / 100.0;
    let relic_mult = 1.0 + base_r_dmg / 100.0;
    let additive_total = s_bonus.dmg + passive_pct + head_dmg_buff;
    let set_passive_mult = 1.0 + additive_total / 100.0;
    
    let cond_mult = if u_stats.burnMultiplier > 0.0 { 1.0 + u_stats.burnMultiplier / 100.0 } else { 1.0 };
    
    let final_dmg = lv_dmg * trait_mult * relic_mult * set_passive_mult * cond_mult;

    // Crit
    let total_cm_buff = s_bonus.cm + base_r_cm;
    let final_cdmg = u_stats.cdmg + total_cm_buff;
    let mut r_cf = base_r_cf + s_bonus.cf;
    if u_stats.id == "kirito" { r_cf = 0.0; } // Kirito specific override
    
    let raw_crit = u_stats.crit + trait_crit_rate + r_cf;
    let final_crit_rate = if raw_crit > 100.0 { 100.0 } else { raw_crit };
    
    let avg_crit_mult = 1.0 + (final_cdmg / 100.0 * final_crit_rate / 100.0);
    let avg_hit = final_dmg * avg_crit_mult;

    // Attack Multiplier (Kirito Extra Attacks)
    let mut attack_multiplier = 1.0;
    if u_stats.reqCrits > 0.0 && u_stats.hitCount > 0.0 {
        let crits_per_attack = u_stats.hitCount * (final_crit_rate / 100.0);
        if crits_per_attack > 0.0 {
            let attacks_to_trigger = u_stats.reqCrits / crits_per_attack;
            if attacks_to_trigger > 0.0 {
                 let bonus_ratio = u_stats.extraAttacks / attacks_to_trigger;
                 attack_multiplier = 1.0 + bonus_ratio;
            }
        }
    }

    let hit_dps_total = (avg_hit / final_spa) * context.placement * attack_multiplier;

    // DoT
    let mut dot_dps_total = 0.0;
    let total_dot_buffs = trait_dot_buff + head_dot_buff + s_bonus.dot;
    let dot_crit_mult = if context.isVirtualRealm { avg_crit_mult } else { 1.0 };

    if u_stats.dot > 0.0 || trait_obj.hasRadiation {
        let mut internal_stacks = 1.0;
        if trait_obj.allowDotStack && u_stats.id == "kirito" && context.isVirtualRealm {
            if u_stats.hitCount > 0.0 { internal_stacks = u_stats.hitCount; }
            else { internal_stacks = u_stats.dotStacks; }
        }

        let base_dot_pct = u_stats.dot + total_dot_buffs;
        let relic_dot_mult = 1.0 + base_r_dot / 100.0;
        let single_tick_pct = base_dot_pct * relic_dot_mult;
        
        let total_dot_pct = single_tick_pct * internal_stacks;
        let total_dot_dmg = final_dmg * (total_dot_pct / 100.0) * dot_crit_mult;

        let mut time_basis = final_spa;
        if !trait_obj.allowDotStack && u_stats.dotDuration > 0.0 {
            if u_stats.dotDuration > final_spa { time_basis = u_stats.dotDuration; }
        } else if trait_obj.hasRadiation && trait_obj.radiationDuration > 0.0 {
             if trait_obj.radiationDuration > final_spa { time_basis = trait_obj.radiationDuration; }
        }
        
        if time_basis <= 0.0 { time_basis = 0.1; }

        let one_unit_dot_dps = total_dot_dmg / time_basis;
        let can_stack = trait_obj.allowDotStack || trait_obj.allowPlacementStack;
        
        dot_dps_total = one_unit_dot_dps * if can_stack { context.placement } else { 1.0 };
    }

    CalcResultRaw {
        total: hit_dps_total + dot_dps_total,
        hit: hit_dps_total,
        dot: dot_dps_total,
        spa: final_spa,
        range: final_range,
    }
}

// --- OPTIMIZATION LOGIC ---

struct Strategy {
    p: String,
    s: String,
    ratio_p: f64,
    ratio_s: f64,
}

fn apply_contextual_stats(
    relic_stats: &mut RelicStats, 
    piece_name: &str, 
    main_stat: Option<&str>, 
    p_stat: &str, 
    s_stat: &str, 
    ratio_p: f64, 
    ratio_s: f64, 
    assignments: &mut Vec<SubStatAssignment>
) {
    let mut p_weight = ratio_p;
    let mut s_weight = ratio_s;

    // Collision check
    if let Some(ms) = main_stat {
        if p_stat == ms {
            s_weight = (s_weight + p_weight).min(6.0);
            p_weight = 0.0;
        } else if s_stat == ms {
            p_weight = (p_weight + s_weight).min(6.0);
            s_weight = 0.0;
        }
    }

    if p_weight > 0.0 {
        let val = get_perfect_sub(p_stat) * p_weight;
        match p_stat {
            "dmg" => relic_stats.dmg += val,
            "spa" => relic_stats.spa += val,
            "cm" => relic_stats.cm += val,
            "cf" => relic_stats.cf += val,
            "dot" => relic_stats.dot += val,
            "range" => relic_stats.range += val,
            _ => {}
        }
        assignments.push(SubStatAssignment { type_: p_stat.to_string(), val });
    }

    if s_weight > 0.0 {
        let val = get_perfect_sub(s_stat) * s_weight;
        match s_stat {
            "dmg" => relic_stats.dmg += val,
            "spa" => relic_stats.spa += val,
            "cm" => relic_stats.cm += val,
            "cf" => relic_stats.cf += val,
            "dot" => relic_stats.dot += val,
            "range" => relic_stats.range += val,
            _ => {}
        }
        assignments.push(SubStatAssignment { type_: s_stat.to_string(), val });
    }
}

fn check_is_better(res: &CalcResultRaw, current_best: &CalcResultRaw, optimize_for: &str) -> bool {
    if optimize_for == "range" {
        if res.range > current_best.range { return true; }
        if (res.range - current_best.range).abs() < 0.001 && res.total > current_best.total { return true; }
        return false;
    }
    // Default DPS
    res.total > current_best.total
}

struct BestConfig {
    res: CalcResultRaw,
    sub_stats: SubStatsDesc,
}

fn get_best_sub_config(
    build: &BuildTemplate,
    u_stats: &UnitStats,
    trait_obj: &Trait,
    base_context: &Context,
    include_subs: bool,
    head_mode: &str, // "auto", "none", or specific ID
    candidates: &Vec<String>,
    optimize_for: &str
) -> BestConfig {
    let mut head_options = Vec::new();
    if head_mode == "auto" {
        head_options.push("sun_god");
        head_options.push("ninja");
        head_options.push("reaper_necklace");
        head_options.push("shadow_reaper_necklace");
    } else if head_mode != "none" {
        head_options.push(head_mode);
    } else {
        head_options.push("none");
    }

    let mut global_best_res = CalcResultRaw { total: -1.0, hit: 0.0, dot: 0.0, spa: 0.0, range: -1.0 };
    let mut global_best_subs = SubStatsDesc { head: None, body: None, legs: None, selectedHead: "none".to_string() };

    // Strategies
    let mut strategies = Vec::new();
    // Pure
    for c in candidates {
        strategies.push(Strategy { p: c.clone(), s: c.clone(), ratio_p: 6.0, ratio_s: 0.0 });
    }
    // Hybrid
    let pairs = vec![
        ("dmg", "cf"), ("dmg", "spa"), ("dmg", "range"), ("dmg", "cm"),
        ("cf", "cm"), ("spa", "range")
    ];
    let ratios = vec![
        (4.0, 3.0), (3.0, 4.0), (5.0, 2.0), (2.0, 5.0)
    ];

    for (c1, c2) in pairs {
        if candidates.contains(&c1.to_string()) && candidates.contains(&c2.to_string()) {
            for (r1, r2) in &ratios {
                strategies.push(Strategy { p: c1.to_string(), s: c2.to_string(), ratio_p: *r1, ratio_s: *r2 });
            }
        }
    }

    for head_type in head_options {
        let mut context = base_context.clone();
        context.headPiece = head_type.to_string();
        let actual_include_head = head_type != "none";

        // optimization if no subs and no head
        if !include_subs && !actual_include_head {
            let mut relic_stats = RelicStats::new(&build.set);
            // Apply main stats from build template
            relic_stats.dmg += build.dmg;
            relic_stats.spa += build.spa;
            relic_stats.dot += build.dot;
            relic_stats.cm += build.cm;
            relic_stats.cf += build.cf;
            relic_stats.range += build.range;

            let res = calculate_dps(u_stats, &relic_stats, trait_obj, &context);
            if check_is_better(&res, &global_best_res, optimize_for) {
                global_best_res = res;
                global_best_subs = SubStatsDesc { head: None, body: None, legs: None, selectedHead: head_type.to_string() };
            }
            continue;
        }

        // Loop strategies
        for strat in &strategies {
            let mut relic_stats = RelicStats::new(&build.set);
            // Add base build stats
            relic_stats.dmg += build.dmg;
            relic_stats.spa += build.spa;
            relic_stats.dot += build.dot;
            relic_stats.cm += build.cm;
            relic_stats.cf += build.cf;
            relic_stats.range += build.range;

            let mut current_subs = SubStatsDesc { head: None, body: None, legs: None, selectedHead: head_type.to_string() };

            if actual_include_head {
                let mut assigns = Vec::new();
                apply_contextual_stats(&mut relic_stats, "head", None, &strat.p, &strat.s, strat.ratio_p, strat.ratio_s, &mut assigns);
                current_subs.head = Some(assigns);
            }

            if include_subs {
                 let mut body_assigns = Vec::new();
                 apply_contextual_stats(&mut relic_stats, "body", Some(&build.bodyType), &strat.p, &strat.s, strat.ratio_p, strat.ratio_s, &mut body_assigns);
                 current_subs.body = Some(body_assigns);

                 let mut legs_assigns = Vec::new();
                 apply_contextual_stats(&mut relic_stats, "legs", Some(&build.legType), &strat.p, &strat.s, strat.ratio_p, strat.ratio_s, &mut legs_assigns);
                 current_subs.legs = Some(legs_assigns);
            }

            let res = calculate_dps(u_stats, &relic_stats, trait_obj, &context);
            if check_is_better(&res, &global_best_res, optimize_for) {
                global_best_res = res;
                global_best_subs = current_subs;
            }
        }
    }

    BestConfig { res: global_best_res, sub_stats: global_best_subs }
}

#[wasm_bindgen]
pub fn find_best_builds(
    unit_json: &str,
    active_traits_json: &str,
    builds_json: &str,
    sub_candidates_json: &str,
    heads_json: &str,
    include_subs: bool
) -> Result<String, JsValue> {
    
    // Deserialize inputs
    let unit: UnitStats = serde_json::from_str(unit_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let traits: Vec<Trait> = serde_json::from_str(active_traits_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let builds: Vec<BuildTemplate> = serde_json::from_str(builds_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sub_candidates: Vec<String> = serde_json::from_str(sub_candidates_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let heads_to_process: Vec<String> = serde_json::from_str(heads_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Determine if unit has native DoT
    // Logic from calculations.js
    let has_native_dot = unit.dot > 0.0 || unit.burnMultiplier > 0.0 || unit.id == "kirito";
    
    // Filter subs for non-dot units
    let unit_sub_candidates: Vec<String> = if !has_native_dot {
        sub_candidates.iter().filter(|&c| c != "dot").cloned().collect()
    } else {
        sub_candidates.clone()
    };

    let mut results: Vec<OptimizationResult> = Vec::new();

    for trait_obj in traits {
        if trait_obj.id == "none" { continue; }

        let actual_placement = if let Some(limit) = trait_obj.limitPlace {
            if limit < unit.placement { limit } else { unit.placement }
        } else {
            unit.placement
        };

        let trait_adds_dot = trait_obj.dotBuff > 0.0 || trait_obj.hasRadiation || trait_obj.allowDotStack;
        let is_dot_possible = has_native_dot || trait_adds_dot;

        let current_candidates = if trait_adds_dot { &sub_candidates } else { &unit_sub_candidates };

        // Filter builds
        let relevant_builds: Vec<&BuildTemplate> = if !is_dot_possible {
            builds.iter().filter(|b| b.bodyType != "dot").collect()
        } else {
            builds.iter().collect()
        };

        for build in relevant_builds {
            let relevant_heads: Vec<&String> = if !is_dot_possible {
                heads_to_process.iter().filter(|&h| h != "ninja").collect()
            } else {
                heads_to_process.iter().collect()
            };

            for head_mode in relevant_heads {
                // DMG PRIO
                let context_dmg = Context {
                    dmgPoints: 99.0, spaPoints: 0.0, wave: 25.0, isBoss: false, placement: actual_placement, isSSS: true, headPiece: "none".to_string(), isVirtualRealm: unit.id == "kirito", starMult: 1.05
                };
                
                let best_dmg = get_best_sub_config(build, &unit, &trait_obj, &context_dmg, include_subs, head_mode, current_candidates, "dps");
                
                if best_dmg.res.total > 0.0 {
                    let id = format!("{}-{}-{}-dmg-{}", unit.id, trait_obj.id, build.name, head_mode); 
                    results.push(OptimizationResult {
                        id: id.clone(),
                        setName: build.name.split('(').next().unwrap_or("").trim().to_string(),
                        traitName: trait_obj.name.clone(),
                        dps: best_dmg.res.total,
                        spa: best_dmg.res.spa,
                        range: best_dmg.res.range,
                        prio: "dmg".to_string(),
                        mainStats: MainStatsDesc { body: build.bodyType.clone(), legs: build.legType.clone() },
                        subStats: best_dmg.sub_stats,
                        headUsed: best_dmg.sub_stats.selectedHead.clone(),
                        isCustom: trait_obj.isCustom
                    });
                }

                // SPA PRIO
                let context_spa = Context {
                    dmgPoints: 0.0, spaPoints: 99.0, wave: 25.0, isBoss: false, placement: actual_placement, isSSS: true, headPiece: "none".to_string(), isVirtualRealm: unit.id == "kirito", starMult: 1.05
                };

                let best_spa = get_best_sub_config(build, &unit, &trait_obj, &context_spa, include_subs, head_mode, current_candidates, "dps");
                
                // Diff check to avoid duplicate results
                if best_spa.res.total > 0.0 && (best_spa.res.total - best_dmg.res.total).abs() > 1.0 {
                    let id = format!("{}-{}-{}-spa-{}", unit.id, trait_obj.id, build.name, head_mode);
                    results.push(OptimizationResult {
                        id: id.clone(),
                        setName: build.name.split('(').next().unwrap_or("").trim().to_string(),
                        traitName: trait_obj.name.clone(),
                        dps: best_spa.res.total,
                        spa: best_spa.res.spa,
                        range: best_spa.res.range,
                        prio: "spa".to_string(),
                        mainStats: MainStatsDesc { body: build.bodyType.clone(), legs: build.legType.clone() },
                        subStats: best_spa.sub_stats,
                        headUsed: best_spa.sub_stats.selectedHead.clone(),
                        isCustom: trait_obj.isCustom
                    });
                }

                // RANGE PRIO (Law Only)
                if unit.id == "law" {
                     let context_range = Context {
                        dmgPoints: 99.0, spaPoints: 0.0, wave: 25.0, isBoss: false, placement: actual_placement, isSSS: true, headPiece: "none".to_string(), isVirtualRealm: false, starMult: 1.05
                    };
                    let best_range = get_best_sub_config(build, &unit, &trait_obj, &context_range, include_subs, head_mode, current_candidates, "range");
                    
                    if best_range.res.total > 0.0 {
                        let id = format!("{}-{}-{}-range-{}", unit.id, trait_obj.id, build.name, head_mode);
                        results.push(OptimizationResult {
                            id: id.clone(),
                            setName: build.name.split('(').next().unwrap_or("").trim().to_string(),
                            traitName: trait_obj.name.clone(),
                            dps: best_range.res.total,
                            spa: best_range.res.spa,
                            range: best_range.res.range,
                            prio: "range".to_string(),
                            mainStats: MainStatsDesc { body: build.bodyType.clone(), legs: build.legType.clone() },
                            subStats: best_range.sub_stats,
                            headUsed: best_range.sub_stats.selectedHead.clone(),
                            isCustom: trait_obj.isCustom
                        });
                    }
                }
            }
        }
    }

    // Sort results
    if unit.id == "law" {
        results.sort_by(|a, b| b.range.partial_cmp(&a.range).unwrap());
    } else {
        results.sort_by(|a, b| b.dps.partial_cmp(&a.dps).unwrap());
    }

    serde_json::to_string(&results).map_err(|e| JsValue::from_str(&e.to_string()))
}