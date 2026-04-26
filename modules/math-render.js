//Helpers for formatting
const fmt = {
    pct: (n) => `${(n||0) >= 0 ? '+' : ''}${(n||0).toFixed(1)}%`,
    num: (n) => (n||0).toLocaleString(undefined, {maximumFractionDigits: 1}),
    fix: (n, d=2) => (n !== undefined && n !== null) ? n.toFixed(d) : (0).toFixed(d)
};

function renderOverviewSection(data) {
    const isNutaru = data.baseStats.id === 'nutaru_beast';
    return `
        <div class="math-section" style="border-color: rgba(251, 191, 36, 0.3);">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Active Trait</span><b class="text-custom">${data.traitObj.name}</b></div>
            <div class="math-row"><span>Total DPS</span><b class="math-val-gold">${fmt.num(data.total)}</b></div>
            ${data.summon > 0 ? `<div class="math-row"><span>${isNutaru ? 'Clones' : 'Planes'} Active</span><b class="text-accent-start">${fmt.fix(data.summonData.count, 1)}</b></div>` : ''}
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
            <div class="math-row"><span>Unit Type</span><b class="text-custom">${data.baseStats.placementType || 'Ground'}</b></div>
            <div class="math-row"><span>Final Range</span><b class="math-val-range">${fmt.fix(data.range, 1)}</b></div>
        </div>`;
}

function renderBuffSummarySection(data) {
    const statPointsPct = (data.lvStats.dmgMult - 1) * 100;
    const totalMult = data.dmgVal / data.baseStats.dmg;
    return `
        <div class="math-section" style="border-color: rgba(74, 222, 128, 0.3);">
            <div class="math-header">Total Buff Summary</div>
            <div class="math-row"><span>Relic Stats</span><b class="text-accent-end">${fmt.pct(data.relicBuffs.dmg)}</b></div>
            <div class="math-row"><span>Trait Bonus</span><b class="text-custom">${fmt.pct(data.traitBuffs.dmg)}</b></div>
            <div class="math-row"><span>Stat Points</span><b class="text-white">${fmt.pct(statPointsPct)}</b></div>
            <div class="math-row"><span>Additive Bucket</span><b class="mt-text-gold">${fmt.pct(data.totalAdditivePct)}</b></div>
            <div class="math-row mt-border-top mt-pt-sm"><span>Total Multiplier</span><b class="text-white">x${fmt.fix(totalMult, 2)}</b></div>
        </div>`;
}

function renderSourceTotalsSection(data) {
    // 1. Relic & Tag Breakdown
    const relicMainSub = data.relicBuffs.dmg || 0;
    const setBaseDmg = (data.totalSetStats.dmg || 0) - (data.tagBuffs.dmg || 0);
    const tagDmg = data.tagBuffs.dmg || 0;
    const gearTotalDmg = relicMainSub + setBaseDmg + tagDmg;

    const gearSpa = (data.relicBuffs.spa || 0) + (data.totalSetStats.spa || 0);
    const gearRange = (data.relicBuffs.range || 0) + (data.totalSetStats.range || 0);
    const gearCrit = (data.relicBuffs.cf || 0) + (data.totalSetStats.cf || 0);

    // 2. Trait Logic (Isolate Base Multipliers)
    const traitDmg = data.traitBuffs.dmg || 0;
    const traitSpa = data.traitBuffs.spa || 0;
    const traitRange = data.traitBuffs.range || 0;
    const traitCrit = data.traitObj.critRate || 0; 

    // 3. Passive & Global Breakdown (Isolate specific sources)
    const unitInnateDmg = (data.passiveBuff || 0) - (data.headBuffs.dmg || 0) - (data.abilityBuff || 0);
    const abilityDmg = data.abilityBuff || 0;
    const accessoryDmg = data.headBuffs.dmg || 0;
    const mikuDmg = data.mikuBuff || 0;
    const enlightDmg = data.enlightBuff || 0;
    const bijuuDmg = data.bijuuBuff || 0;
    const kingMarkDmg = data.kingMarkDmg || 0;
    const passiveTotalDmg = unitInnateDmg + abilityDmg + accessoryDmg + mikuDmg + enlightDmg + bijuuDmg + kingMarkDmg;

   const passiveTotalSpa = (data.passiveSpaBuff || 0) + (data.enlightSpa || 0) + (data.bijuuSpa || 0) + (data.kingMarkSpa || 0) + (data.mageHillSpa || 0);
    const passiveTotalRange = (data.baseStats.passiveRange || 0) + (data.eternalRangeBuff || 0) + (data.enlightBuff || 0) + (data.bijuuBuff || 0);
    const passiveTotalCrit = (data.amCritRate || 0) + (data.ksCrit || 0) + (data.mageGroundCrit || 0);
    const passiveTotalCdmg = (data.amCritDmg || 0) + (data.ksCdmg || 0);


    return `
        <div class="math-section" style="border-color: rgba(255, 255, 255, 0.15); background: #000; flex: 1; margin-bottom: 0; padding: 14px; border-radius: 8px; box-shadow: inset 0 0 20px rgba(255,255,255,0.02);">
            <div class="math-header" style="color: #fff; font-size: 0.85rem; margin-bottom: 15px; letter-spacing: 1.5px; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">SOURCE TOTALS</div>
            
            <div style="margin-bottom: 16px; border-left: 3px solid #f472b6; padding-left: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #f472b6; letter-spacing: 0.5px;">RELICS & TAGS</span>
                    <b style="color: #f472b6; font-size: 0.9rem;">${fmt.pct(gearTotalDmg)}</b>
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; margin-bottom: 6px;">
                    <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: #999;"><span>Gear Main + Subs</span><span class="text-white">${fmt.pct(relicMainSub)}</span></div>
                    <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: #999;"><span>Relic Set Base</span><span class="text-white">${fmt.pct(setBaseDmg)}</span></div>
                    ${tagDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.7rem; color: #f472b6; font-weight: 700;"><span>Unit Tag Bonuses</span><span>${fmt.pct(tagDmg)}</span></div>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 0.65rem; color: #777; border-top: 1px solid rgba(244, 114, 182, 0.1); padding-top: 4px;">
                    <div style="display:flex; justify-content:space-between;"><span>SPA</span><b class="text-white">-${gearSpa.toFixed(1)}%</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>Range</span><b class="text-white">${fmt.pct(gearRange)}</b></div>
                    <div style="display:flex; justify-content:space-between; grid-column: span 2;"><span>Crit Rate Bonus</span><b class="text-white">+${gearCrit.toFixed(1)}%</b></div>
                </div>
            </div>

            <div style="margin-bottom: 16px; border-left: 3px solid #4ade80; padding-left: 10px; background: rgba(74, 222, 128, 0.03); padding-top: 6px; padding-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #4ade80; letter-spacing: 0.5px;">TRAIT: ${data.traitObj.name.toUpperCase()}</span>
                    <b style="color: #4ade80; font-size: 0.85rem;">${fmt.pct(traitDmg)}</b>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 0.7rem; color: #999;">
                    <div style="display:flex; justify-content:space-between;"><span>SPA</span><b class="text-white">-${traitSpa.toFixed(1)}%</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>Range</span><b class="text-white">${fmt.pct(traitRange)}</b></div>
                    ${traitCrit > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Crit</span><b class="text-white">+${traitCrit}%</b></div>` : ''}
                </div>
            </div>

            <div style="border-left: 3px solid #fbbf24; padding-left: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: #fbbf24; letter-spacing: 0.5px;">PASSIVES & GLOBAL</span>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                        <b style="color: #fbbf24; font-size: 0.9rem;">${fmt.pct(passiveTotalDmg)}</b>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px;">` +
                    (data.baseStats.id === 'nutaru_beast' ? `
                        <div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Clone Despawn</span><span class="text-white">+40.0%</span></div>
                        ${data.isAbility ? `
                            <div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Beast Form</span><span class="text-white">+30.0%</span></div>
                            <div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Attack Cycle</span><span class="text-white">+50.0%</span></div>
                        ` : ''}
                    ` : `
                        ${unitInnateDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Unit Passive</span><span class="text-white">${fmt.pct(unitInnateDmg)}</span></div>` : ''}
                    `) + `
                    ${abilityDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Active Ability</span><span class="text-white">${fmt.pct(abilityDmg)}</span></div>` : ''}
                    ${accessoryDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #999;"><span>Accessory</span><span class="text-white">${fmt.pct(accessoryDmg)}</span></div>` : ''}
                    ${mikuDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #fbbf24;"><span>↳ Miku Buff</span><span>${fmt.pct(mikuDmg)}</span></div>` : ''}
                    ${enlightDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #fbbf24;"><span>↳ Enlightened God</span><span>${fmt.pct(enlightDmg)}</span></div>` : ''}
                    ${bijuuDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #fbbf24;"><span>↳ Bijuu Link</span><span>${fmt.pct(bijuuDmg)}</span></div>` : ''}
                    ${kingMarkDmg > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #fbbf24;"><span>↳ Unrivaled Mark</span><span>${fmt.pct(kingMarkDmg)}</span></div>` : ''}
                    ${data.amSupportActive ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #60a5fa;"><span>↳ Ancient Mage</span><span>Active</span></div>` : ''}
                    ${(data.mageHillSpa || 0) > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #fb923c;"><span>↳ Fern (Hill)</span><span>Active</span></div>` : ''}
                    ${(data.mageGroundCrit || 0) > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 0.65rem; color: #f472b6;"><span>↳ Fern (Ground)</span><span>Active</span></div>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 0.65rem; color: #777;">
                    <div style="display:flex; justify-content:space-between;"><span>SPA Red.</span><b class="text-white">-${passiveTotalSpa.toFixed(1)}%</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>Range</span><b class="text-white">${fmt.pct(passiveTotalRange)}</b></div>
                    ${passiveTotalCrit > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Crit Rate</span><b style="color:#60a5fa;">+${passiveTotalCrit}%</b></div>` : ''}
                    ${passiveTotalCdmg > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Crit Dmg</span><b style="color:#60a5fa;">+${passiveTotalCdmg}%</b></div>` : ''}
                </div>
            </div>
        </div>`;
}

function renderActiveBuffsSection(data) {
    const buffs = [];
    
    // 1. Global Buffs
    if (data.mikuBuff > 0) buffs.push({ name: "Miku Buff", desc: "Active: +100% Damage", color: "#4ade80" });
    if (data.enlightBuff > 0) buffs.push({ name: "Enlightened", desc: "Active: +20% Dmg, -20% SPA, +20% Range", color: "#fbbf24" });
    if (data.bijuuBuff > 0) buffs.push({ name: "Bijuu Link", desc: "Active: +25% Dmg, +25% Range, -15% SPA", color: "#f87171" });
    if (data.amSupportActive) buffs.push({ name: "Ancient Mage", desc: "Active: +20% Crit Rate/Dmg", color: "#60a5fa" });
    if (data.ksCrit > 0) buffs.push({ name: "King Sailor", desc: "Active: +10% Crit Rate, +20% Crit Dmg", color: "#60a5fa" });
    if (data.mageHillSpa > 0) buffs.push({ name: "Fern (Hill)", desc: "Active: -30% SPA", color: "#fb923c" });
    if (data.mageGroundCrit > 0) buffs.push({ name: "Fern (Ground)", desc: "Active: +45% Crit Rate", color: "#f472b6" });
    
    // 2. Trait "Passives"
    if (data.traitObj.isEternal) buffs.push({ name: "Eternal Stacks", desc: "Applied: +5% Dmg & +2.5% Rng / Wave (Max 12)", color: "#c084fc" });
    if (data.traitObj.hasRadiation) buffs.push({ name: "Radiation", desc: "Fission Trait: Enemies take +20% Damage", color: "#f87171" });
    
    // 3. Conditionals
    if (data.conditionalData) buffs.push({ name: data.conditionalData.name, desc: `Target condition met: x${data.conditionalData.mult.toFixed(2)} Dmg`, color: "#fb923c" });

    // 4. Special Attack Mechanics (FuA, Multi-hit, etc.)
    if (data.extraAttacks) buffs.push({ name: data.extraAttacks.label || "Attack Rate", desc: `${data.extraAttacks.hits}: Final x${data.extraAttacks.mult.toFixed(3)} DPS Mult`, color: "#60a5fa" });

    // 5. Unit Innate Passives (Fetched from Database via refreshUnitMap helper)
    const unit = typeof getUnitById === 'function' ? getUnitById(data.baseStats.id) : null;
    if (unit && unit.passives) {
        unit.passives.forEach(p => {
            buffs.push({ name: p.name, desc: p.desc, color: "#fff" });
        });
    }

    if (buffs.length === 0) return '';

    const itemsHtml = buffs.map(b => `
        <div class="math-row" style="align-items: baseline; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
            <div style="flex: 0 0 110px; line-height: 1.3;"><b style="color: ${b.color}; font-size: 0.75rem; text-transform: uppercase;">${b.name}</b></div>
            <div style="flex: 1; font-size: 0.75rem; color: #999; line-height: 1.3;">${b.desc}</div>
        </div>
    `).join('');

    return `
        <div class="math-section" style="margin-bottom: 15px; border-color: rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px;">
            <div class="math-header" style="font-size: 0.7rem; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span>Applied Passives & Global Buffs</span>
                ${unit ? `<button class="calc-info-btn" onclick="openUnitInfo('${unit.id}')" title="View Full Unit Passives">?</button>` : ''}
            </div>
            <div style="display: flex; flex-direction: column;">
                ${itemsHtml}
            </div>
        </div>`;
}

function renderQuickBreakdownSection(data, avgHitPerUnit, dotColorClass) {
    const dotLabelClass = data.dot > 0 ? 'text-accent-end' : '';
    const isNutaru = data.baseStats.id === 'nutaru_beast';
    return `
        <div class="math-section no-border-bottom mb-3">
            <div class="math-header opacity-70">Quick Breakdown</div>
            <div class="mq-box">
                <div style="border-color: rgba(251, 191, 36, 0.3);"><div class="mq-label mt-text-gold">Hit DPS</div><div class="mq-val mt-text-gold">${fmt.num(data.hit)}</div><div class="mq-sub">(${fmt.num(avgHitPerUnit)} avg ÷ ${fmt.fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div style="border-color: ${data.dot > 0 ? 'rgba(192, 132, 252, 0.3)' : '#333'};"><div class="mq-label ${dotLabelClass}">DoT DPS</div><div class="mq-val ${dotColorClass}">${data.dot > 0 ? fmt.num(data.dot) : '-'}</div><div class="mq-sub">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div style="border-color: rgba(216, 180, 254, 0.3);"><div class="mq-label text-custom">Crit Rate / Dmg</div><div class="mq-val text-custom">${fmt.fix(data.critData.rate, 0)}% <span class="color-dim">|</span> x${fmt.fix(data.critData.cdmg/100, 2)}</div><div class="mq-sub">Avg Mult: x${fmt.fix(data.critData.avgMult, 3)}</div></div>
                ${data.summon > 0 ? `<div style="border-color: rgba(96, 165, 250, 0.3);"><div class="mq-label text-accent-start">${isNutaru ? 'Clone' : 'Plane'} DPS</div><div class="mq-val text-accent-start">${fmt.num(data.summon)}</div><div class="mq-sub">Independent of Host Stats</div></div>` : `<div style="border-color: rgba(96, 165, 250, 0.3);"><div class="mq-label text-accent-start">Attack Rate</div><div class="mq-val text-accent-start">${fmt.fix(data.spa, 2)}s</div><div class="mq-sub">Base: ${data.baseStats.spa}s (Current Cap: ${data.spaCap}s)</div></div>`}
            </div>
        </div>`;
}

function renderBaseDamageSection(data, levelMult, traitRowsDmg, dmgAfterRelic, headDmgHtml, preConditionalDmg, baseSetDmg, tagDmg, passiveDmg, eternalDmg, statPointsHtml) {
    return `
            <div class="dd-section">
                <div class="dd-title mt-text-red"><span>1. Base Damage Calculation</span></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Base Stats (Lv 1)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${fmt.num(data.baseStats.dmg)}</td></tr>
                    ${statPointsHtml}
                    ${data.isSSS ? `<tr><td class="mt-cell-label">SSS Rank Bonus</td><td class="mt-cell-formula"><span class="op">×</span>1.2</td><td class="mt-cell-val">${fmt.num(data.lvStats.dmg)}</td></tr>` : ''}
                    
                    ${traitRowsDmg}

                    <tr><td class="mt-cell-label text-accent-end">Relic Multiplier <button class="calc-info-btn" onclick="openInfoPopup('relic_multi')">?</button></td><td class="mt-cell-formula text-accent-end">${fmt.pct(data.relicBuffs.dmg)}</td><td class="mt-cell-val">${fmt.num(dmgAfterRelic)}</td></tr>
                    
                    ${headDmgHtml}

                    <tr>
                        <td class="mt-cell-label mt-pt-md">Buff Data <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="mt-cell-formula mt-pt-md mt-text-gold mt-text-bold">${fmt.pct(data.totalAdditivePct)}</td>
                        <td class="mt-cell-val calc-highlight mt-pt-md">${fmt.num(preConditionalDmg)}</td>
                    </tr>
                    <tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Base</td><td class="mt-cell-formula">${fmt.pct(baseSetDmg)}</td><td class="mt-cell-val"></td></tr>
                    ${tagDmg !== 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Tag Bonuses</td><td class="mt-cell-formula">${fmt.pct(tagDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${passiveDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">${fmt.pct(passiveDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${eternalDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-accent-start opacity-70">↳ Eternal Stacks (Wave 12+)</td><td class="mt-cell-formula text-accent-start">${fmt.pct(eternalDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.abilityBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-custom opacity-70">↳ Ability Buffs</td><td class="mt-cell-formula text-custom">${fmt.pct(data.abilityBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}

                    ${(data.mikuBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-accent-end opacity-70">↳ Miku Buff</td><td class="mt-cell-formula text-accent-end">${fmt.pct(data.mikuBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.enlightBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-gold opacity-70">↳ Enlightened God</td><td class="mt-cell-formula text-gold">${fmt.pct(data.enlightBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.bijuuBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-error opacity-70">↳ Bijuu Link</td><td class="mt-cell-formula text-error">${fmt.pct(data.bijuuBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}

                    ${data.conditionalData ? `
                    <tr><td class="mt-cell-label mt-pt-md mt-text-orange mt-text-bold">${data.conditionalData.name}</td><td class="mt-cell-formula mt-pt-md mt-text-orange mt-text-bold">x${data.conditionalData.mult.toFixed(2)}</td><td class="mt-cell-val calc-highlight mt-pt-md">${fmt.num(data.dmgVal)}</td></tr>` : ''}
                </table>
            </div>`;
}

function renderCritSection(data, setTagCfTotal, setTagCmTotal) {
    return `
            <div class="dd-section">
                <div class="dd-title" style="color: #c084fc"><span>2. Crit Averaging</span> <button class="calc-info-btn" onclick="openInfoPopup('crit_avg')">?</button></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Base Hit (Non-Crit)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${fmt.num(data.dmgVal)}</td></tr>
                    
                    <tr><td class="mt-cell-label mt-pl-sm mt-text-gold mt-text-bold">↳ Final Crit Rate</td><td class="mt-cell-formula"></td><td class="mt-cell-val mt-text-gold mt-text-bold">${fmt.fix(data.critData.rate, 1)}%</td></tr>
                    ${data.baseStats.crit > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Unit Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fmt.fix(data.baseStats.crit, 1)}%</td></tr>` : ''}
                    ${(data.traitObj.critRate || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Trait (${data.traitObj.name})</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fmt.fix(data.traitObj.critRate, 1)}%</td></tr>` : ''}
                    ${data.relicBuffs.cf > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Relics (Main+Sub)</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fmt.fix(data.relicBuffs.cf, 1)}%</td></tr>` : ''}
                    ${setTagCfTotal > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Set Bonus & Tags</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fmt.fix(setTagCfTotal, 1)}%</td></tr>` : ''}
                    ${(data.mageGroundCrit || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs" style="color:#f472b6">• Fern (Ground)</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs" style="color:#f472b6">+${fmt.fix(data.mageGroundCrit, 1)}%</td></tr>` : ''}
                    
                    <tr><td class="mt-cell-label mt-pl-sm text-gray">↳ CDmg Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-gray font-normal">${fmt.fix(data.critData.baseCdmg,0)}</td></tr>
                    ${data.relicBuffs.cm > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Relics</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">+${fmt.fix(data.relicBuffs.cm, 1)}%</td></tr>` : ''}
                    ${setTagCmTotal > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Set & Tags</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">+${fmt.fix(setTagCmTotal, 1)}%</td></tr>` : ''}

                    <tr><td class="mt-cell-label">Total Crit Damage</td><td class="mt-cell-formula">=</td><td class="mt-cell-val calc-highlight">${fmt.fix(data.critData.cdmg, 0)}%</td></tr>
                    
                    <!-- UPDATED: Avg Damage Row without border/block (Relies on new CSS) -->
                    <tr>
                        <td class="mt-cell-label text-right pr-2">Avg Damage Per Hit</td>
                        <td class="mt-cell-formula"></td>
                        <td class="mt-cell-val calc-result text-right">${fmt.num(data.dmgVal * data.critData.avgMult)}</td>
                    </tr>
                </table>
            </div>`;
}

function renderSpaSection(data, traitRowsSpa, baseSetSpa, tagSpa, passiveSpa) {
    return `
            <div class="dd-section">
                <div class="dd-title mt-text-custom"><span>3. SPA (Speed) Calculation</span> <button class="calc-info-btn" onclick="openInfoPopup('spa_calc')">?</button></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Base SPA (Lv 1)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${data.baseStats.spa}s</td></tr>
                    <tr><td class="mt-cell-label">Stat Point Scaling</td><td class="mt-cell-formula">x${fmt.fix(data.lvStats.spaMult, 3)}</td><td class="mt-cell-val">${fmt.fix(data.baseStats.spa * data.lvStats.spaMult, 3)}s</td></tr>
                    ${data.isSSS ? `<tr><td class="mt-cell-label">SSS Rank (-8%)</td><td class="mt-cell-formula"><span class="op">×</span>0.92</td><td class="mt-cell-val">${fmt.fix(data.lvStats.spa, 3)}s</td></tr>` : ''}
                    ${traitRowsSpa}
                    
                    <tr><td class="mt-cell-label mt-pt-md">Relic Multiplier</td><td class="mt-cell-formula mt-pt-md">-${fmt.fix(data.relicBuffs.spa, 1)}%</td><td class="mt-cell-val mt-pt-md">${fmt.fix(data.spaAfterRelic, 3)}s</td></tr>
                    <tr><td class="mt-cell-label mt-pt-md">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td><td class="mt-cell-formula mt-pt-md">-${fmt.fix(data.setAndPassiveSpa, 1)}%</td><td class="mt-cell-val mt-pt-md">${fmt.fix(data.rawFinalSpa, 3)}s</td></tr>
                    <tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Base</td><td class="mt-cell-formula">-${fmt.fix(baseSetSpa, 1)}%</td><td class="mt-cell-val"></td></tr>
                    ${tagSpa !== 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Tag Bonuses</td><td class="mt-cell-formula">-${fmt.fix(tagSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${passiveSpa > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">-${fmt.fix(passiveSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.enlightSpa || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-gold opacity-70">↳ Enlightened God</td><td class="mt-cell-formula text-gold">-${fmt.fix(data.enlightSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.bijuuSpa || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-error opacity-70">↳ Bijuu Link</td><td class="mt-cell-formula text-error">-${fmt.fix(data.bijuuSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.mageHillSpa || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70" style="color:#fb923c">↳ Fern (Hill)</td><td class="mt-cell-formula" style="color:#fb923c">-${fmt.fix(data.mageHillSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}

                    <tr><td class="mt-cell-label">Cap Check (${data.spaCap}s)</td><td class="mt-cell-formula">MAX</td><td class="mt-cell-val calc-result">${fmt.fix(data.spa, 3)}s</td></tr>
                </table>
            </div>`;
}

function renderDotSection(data, headDotRow) {
    if (data.dot <= 0) return '';
    const db = data.dotData;
    const getFormula = (total, time) => {
        if (time === 0) return '';
        const label = Math.abs(time - data.spa) < 0.001 ? 'SPA' : 'Interval';
        return `<span class="text-dim">(${fmt.num(total)} / ${fmt.fix(time, 1)}s ${label})</span>`;
    };

    // Breakdown Logic
    const baseDot = data.baseStats.dot || 0;
    const traitDot = data.traitObj.dotBuff || 0;
    const setDot = data.totalSetStats.dot || 0;
    const headDot = data.headBuffs.dot || 0;
    const relicDot = data.relicBuffs.dot || 0;
    
    // REFINED LOGIC: Base % * (1 + Trait/100) * (1 + Gear/100)
    const gearBonus = relicDot + setDot + headDot;
    const traitMultiplier = 1 + (traitDot / 100);
    const gearMultiplier = 1 + (gearBonus / 100);
    const finalTickPct = baseDot * traitMultiplier * gearMultiplier;

    // --- RE-DEFINE HEAD ROW LOGIC HERE TO MATCH SUN GOD STYLE ---
    if (data.headBuffs && data.headBuffs.type === 'ninja') {
        const uptimePct = (data.headBuffs.uptime || 0);
        
        // This structure now matches the Sun God box layout exactly
        headDotRow = `
        <tr class="mt-row-ninja"><td colspan="3" class="p-2">
            <div class="mt-flex-between mb-2">
                <span class="text-custom mt-text-bold text-xs tracking-sm">NINJA HEAD PASSIVE</span>
                <button class="calc-info-btn" onclick="openInfoPopup('ninja_passive')">?</button>
            </div>
            
            <div class="mt-flex-between text-xs text-white mb-1">
                <span class="opacity-70">Active Duration:</span>
                <span class="mt-font-mono mt-text-right text-white">10.0s</span>
            </div>
            <div class="mt-flex-between text-xs text-white mb-3">
                <span class="opacity-70">Uptime:</span>
                <span class="mt-font-mono mt-text-right ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fmt.fix(uptimePct*100,1)}%</span>
            </div>

            <div class="mt-flex-between mt-border-top mt-pt-sm">
                <span class="text-white text-xs text-bold">Avg DoT Buff</span>
                <span class="text-custom text-sm mt-text-bold"> +${fmt.fix(data.headBuffs.dot, 2)}%</span>
            </div>
        </td></tr>`;
    }
    // -----------------------------------------------------------

    // --- REANIMATED HEAD PASSIVE (DoT Section) ---
    if (data.headBuffs && data.headBuffs.type === 'reanimated') {
        const uptimePct = (data.headBuffs.uptime || 0);
        
        headDotRow = `
        <tr class="mt-row-sungod"><td colspan="3" class="p-2">
            <div class="mt-flex-between mb-2">
                <span class="text-accent-end mt-text-bold text-xs tracking-sm">REANIMATED NINJA PASSIVE</span>
                <button class="calc-info-btn" onclick="openInfoPopup('reanimated_passive')">?</button>
            </div>
            
            <div class="mt-flex-between text-xs text-white mb-1">
                <span class="opacity-70">Range Stat:</span>
                <span class="mt-font-mono mt-text-right mt-text-range">${fmt.fix(data.range,1)}</span>
            </div>
            <div class="mt-flex-between text-xs text-white mb-1">
                <span class="opacity-70">Trigger:</span>
                <span class="mt-font-mono mt-text-right text-white">Every 5th Attack (${fmt.fix(data.headBuffs.trigger,1)}s)</span>
            </div>
            <div class="mt-flex-between text-xs text-white mb-1">
                <span class="opacity-70">Buff Duration:</span>
                <span class="mt-font-mono mt-text-right text-white">10.0s</span>
            </div>
            <div class="mt-flex-between text-xs text-white mb-3">
                <span class="opacity-70">Uptime:</span>
                <span class="mt-font-mono mt-text-right ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fmt.fix(uptimePct*100,1)}%</span>
            </div>

            <div class="mt-flex-between mt-border-top mt-pt-sm">
                <span class="text-white text-xs text-bold">Avg DoT Buff</span>
                <span class="text-accent-end text-sm mt-text-bold"> +${fmt.fix(data.headBuffs.dot, 2)}%</span>
            </div>
        </td></tr>`;
    }
    // -----------------------------------------------------------
    
    return `
    <div class="dd-section">
        <div class="dd-title text-accent-end"><span>6. Status Effect (DoT) Breakdown</span> <button class="calc-info-btn" onclick="openInfoPopup('dot_logic')">?</button></div>
        <table class="calc-table">
            <tr><td class="mt-cell-label">Hit Ref (Crit Avg)</td><td class="mt-cell-val" colspan="2">${fmt.num(data.dmgVal * db.critMult)}</td></tr>
            
            ${headDotRow}

            ${db.nativeDps > 0 ? `
            <!-- Native DoT Breakdown -->
            <tr><td class="mt-cell-label mt-pt-md mt-text-bold">Native Tick % Calculation</td><td class="mt-cell-formula mt-pt-md"></td><td class="mt-cell-val mt-pt-md mt-text-bold">${fmt.fix(finalTickPct, 1)}%</td></tr>
            
            ${baseDot > 0 ? `<tr><td class="mt-cell-label mt-pl-sm opacity-70">↳ Unit Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs text-white">${fmt.num(baseDot)}%</td></tr>` : ''}
            
            <!-- Trait Stage -->
            <tr><td class="mt-cell-label mt-pl-sm mt-text-bold text-custom">1. Trait Multiplier (${data.traitObj.name})</td><td class="mt-cell-formula mt-text-bold text-custom"><span class="op">×</span>${fmt.fix(traitMultiplier, 2)}</td><td class="mt-cell-val text-custom text-bold">${fmt.pct(traitDot)}</td></tr>
            
            <!-- Gear Stage -->
            <tr><td class="mt-cell-label mt-pl-sm mt-text-bold text-accent-end">2. Gear Multiplier (Relics/Set/Head)</td><td class="mt-cell-formula mt-text-bold text-accent-end"><span class="op">×</span>${fmt.fix(gearMultiplier, 2)}</td><td class="mt-cell-val text-accent-end text-bold">${fmt.pct(gearBonus)}</td></tr>
            
            ${relicDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-dim text-xs">• Relic Stats (Main+Sub)</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs text-dim">${fmt.pct(relicDot)}</td></tr>` : ''}
            ${setDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-dim text-xs">• Set Bonus</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs text-dim">${fmt.pct(setDot)}</td></tr>` : ''}
            ${headDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-dim text-xs">• Head Passive</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs text-dim">${fmt.pct(headDot)}</td></tr>` : ''}
            
            <tr><td class="mt-cell-label mt-pt-md">Final Native Tick</td><td class="mt-cell-formula">=</td><td class="mt-cell-val calc-highlight">${fmt.fix(finalTickPct, 2)}%</td></tr>
          ${db.isMultiHit ? `<tr><td class="mt-cell-label mt-pl-md text-custom">↳ Multi-Hit Proc (Astral)</td><td class="mt-cell-formula">x${data.baseStats.hitCount}</td><td class="mt-cell-val text-custom">Active</td></tr>` : ''}
            <tr>
                <td class="mt-cell-label mt-pt-sm">Native DoT DPS</td>
                <td class="mt-cell-formula mt-pt-sm">${getFormula(db.nativeTotalDmg, db.nativeInterval)}</td>
                <td class="mt-cell-val mt-pt-sm">${fmt.num(db.nativeDps)}</td>
            </tr>
            ` : ''}

            ${db.radDps > 0 ? `
            <tr>
                <td class="mt-cell-label text-accent-start mt-pt-md">Radiation DoT (${data.traitObj.radiationPct || 20}% / 10s)</td>
                <td class="mt-cell-formula mt-pt-md">${getFormula(db.radTotalDmg, db.radInterval)}</td>
                <td class="mt-cell-val text-accent-start mt-pt-md">${fmt.num(db.radDps)} DPS</td>
            </tr>
            ` : ''}

            <tr class="mt-border-top">
                <td class="mt-cell-label text-white mt-pt-md">Total DoT (1 Unit)</td>
                <td class="mt-cell-formula mt-pt-md"></td>
                <td class="mt-cell-val text-white mt-pt-md">${fmt.num(db.nativeDps + db.radDps)}</td>
            </tr>
            ${data.placement > 1 ? `
            <tr>
                <td class="mt-cell-label text-gold">Total x${data.placement} Units ${data.hasStackingDoT ? '' : '<small class="opacity-50">(Non-Stacking)</small>'}</td>
                <td class="mt-cell-formula">${data.hasStackingDoT ? '×' + data.placement : 'MAX'}</td>
                <td class="mt-cell-val text-gold">${fmt.num(data.dot)}</td>
            </tr>` : ''}
        </table>
    </div>`;
}

function renderMathContent(data) {
    if (!data || !data.lvStats || !data.critData) return '<div class="msg-empty">Data incomplete.</div>';
    
    const levelMult = data.lvStats.dmgMult; 
    const avgHitPerUnit = data.dmgVal * data.critData.avgMult;
    
    // --- Trait Row Logic ---
    let traitRowsDmg = '';
    let traitRowsSpa = '';
    let runningDmg = data.isSSS ? data.lvStats.dmg : (data.baseStats.dmg * levelMult); 
    if (data.isSSS) runningDmg = data.lvStats.dmg; 
    let runningSpa = data.isSSS ? data.lvStats.spa : (data.baseStats.spa * data.lvStats.spaMult);

    if (data.traitObj && data.traitObj.subTraits && data.traitObj.subTraits.length > 0) {
        data.traitObj.subTraits.forEach((t, i) => {
            const tDmg = t.dmg || 0;
            const nextDmg = runningDmg * (1 + tDmg/100);
            let labelHtml = `↳ ${t.name}`;
            if (i === 0) labelHtml += ` <button class="calc-info-btn" onclick="openInfoPopup('trait_logic')">?</button>`;
            traitRowsDmg += `<tr><td class="mt-cell-label mt-pl-md">${labelHtml}</td><td class="mt-cell-formula">${fmt.pct(tDmg)}</td><td class="mt-cell-val">${fmt.num(nextDmg)}</td></tr>`;
            runningDmg = nextDmg;

            const tSpa = t.spa || 0;
            const nextSpa = runningSpa * (1 - tSpa/100);
            traitRowsSpa += `<tr><td class="mt-cell-label mt-pl-md">↳ ${t.name}</td><td class="mt-cell-formula">-${fmt.fix(tSpa,1)}%</td><td class="mt-cell-val">${fmt.fix(nextSpa,3)}s</td></tr>`;
            runningSpa = nextSpa;
        });
    } else {
        const dmgAfterTrait = runningDmg * (1 + data.traitBuffs.dmg/100);
        traitRowsDmg = `<tr><td class="mt-cell-label">Trait Multiplier <button class="calc-info-btn" onclick="openInfoPopup('trait_logic')">?</button></td><td class="mt-cell-formula">${fmt.pct(data.traitBuffs.dmg)}</td><td class="mt-cell-val">${fmt.num(dmgAfterTrait)}</td></tr>`;
        const spaAfterTrait = runningSpa * (1 - data.traitBuffs.spa/100);
        traitRowsSpa = `<tr><td class="mt-cell-label">Trait Reduction</td><td class="mt-cell-formula">-${fmt.fix(data.traitBuffs.spa, 1)}%</td><td class="mt-cell-val">${fmt.fix(spaAfterTrait, 3)}s</td></tr>`;
        runningDmg = dmgAfterTrait; runningSpa = spaAfterTrait;
    }

    const dmgAfterRelic = runningDmg * (1 + data.relicBuffs.dmg/100);
    const baseSetDmg = (data.totalSetStats.dmg || 0) - (data.tagBuffs.dmg || 0);
    const tagDmg = (data.tagBuffs.dmg || 0);
    const eternalDmg = data.eternalBuff || 0;
    const passiveDmg = (data.passiveBuff || 0) - (data.headBuffs.dmg || 0) - (data.abilityBuff || 0) - eternalDmg; 
    const baseSetSpa = (data.totalSetStats.spa || 0) - (data.tagBuffs.spa || 0);
    const tagSpa = (data.tagBuffs.spa || 0);
    const passiveSpa = (data.passiveSpaBuff || 0);
    const baseSetCf = (data.totalSetStats.cf || 0) - (data.tagBuffs.cf || 0);
    const tagCf = (data.tagBuffs.cf || 0);
    const setTagCfTotal = baseSetCf + tagCf;
    const baseSetCm = (data.totalSetStats.cdmg || data.totalSetStats.cm || 0) - (data.tagBuffs.cdmg || data.tagBuffs.cm || 0);
    const tagCm = (data.tagBuffs.cdmg || data.tagBuffs.cm || 0);
    const setTagCmTotal = baseSetCm + tagCm;
    const preConditionalDmg = data.dmgVal / (data.conditionalData ? data.conditionalData.mult : 1);

    // --- SUN GOD HTML (Base Damage Section) ---
    let headDmgHtml = '';
    if (data.headBuffs && data.headBuffs.type === 'sun_god') {
        const uptimePct = (data.headBuffs.uptime || 0);
        headDmgHtml = `
        <tr class="mt-row-sungod"><td colspan="3" class="p-2">
            <div class="mt-flex-between mb-2"><span class="text-gold mt-text-bold text-xs tracking-sm">SUN GOD PASSIVE</span><button class="calc-info-btn" onclick="openInfoPopup('sungod_passive')">?</button></div>
            
            <div class="mt-flex-between text-xs text-white mb-1">
                <span class="opacity-70">Range Stat:</span>
                <span class="mt-font-mono mt-text-right mt-text-range">${fmt.fix(data.range,1)}</span>
            </div>
            <div class="mt-flex-between text-xs text-white mb-3">
                <span class="opacity-70">Uptime:</span>
                <span class="mt-font-mono mt-text-right ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fmt.fix(uptimePct*100,1)}%</span>
            </div>

            <div class="mt-flex-between mt-border-top mt-pt-sm"><span class="text-white text-xs text-bold">Avg Damage Buff</span><span class="text-gold text-sm mt-text-bold"> +${fmt.num(data.headBuffs.dmg)}%</span></div>
        </td></tr>`;
    }

    // --- NINJA HTML (DoT Section) ---
    let headDotRow = ''; 

    const statPointsHtml = (data.dmgPoints !== undefined) ? `
    <tr>
        <td class="mt-cell-label">Stat Points (Dmg) <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="mt-cell-formula">x${fmt.fix(data.lvStats.dmgMult, 2)}</td>
        <td class="mt-cell-val">${fmt.num(data.baseStats.dmg * data.lvStats.dmgMult)}</td>
    </tr>` 
    : `
    <tr>
        <td class="mt-cell-label">Level Scaling <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="mt-cell-formula"><span class="op">×</span>${fmt.fix(levelMult, 3)}</td>
        <td class="mt-cell-val">${fmt.num(data.baseStats.dmg * levelMult)}</td>
    </tr>`;

    const dotColorClass = data.dot > 0 ? 'text-accent-end' : 'text-dark-dim';

    return `
        <div class="breakdown-top-wrapper" style="position:relative; margin-bottom: 12px;">
            <div class="breakdown-top-panels" style="display: flex; gap: 12px; align-items: stretch;">
                <div class="breakdown-panel breakdown-panel--left" style="flex:1; min-width:0;">${renderSourceTotalsSection(data)}</div>
                <div class="breakdown-panel breakdown-panel--right" style="display: flex; flex-direction: column; gap: 12px; flex: 1.1; min-width:0;">
                    ${renderOverviewSection(data)}
                    ${renderBuffSummarySection(data)}
                </div>
            </div>
            <button class="breakdown-swap-btn" onclick="swapBreakdownPanels(this)" title="Toggle panel view" aria-label="Swap panels">
                <span class="swap-icon" style="display:inline-flex;align-items:center;gap:4px;">&#8644; <span class="swap-label">Details</span></span>
            </button>
        </div>
        <style>
            .breakdown-swap-btn {
                display: none;
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(255,255,255,0.08);
                border: 1px solid rgba(255,255,255,0.15);
                color: #ddd;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.5px;
                padding: 4px 10px;
                border-radius: 20px;
                cursor: pointer;
                z-index: 10;
                transition: background 0.2s;
            }
            .breakdown-swap-btn:hover { background: rgba(255,255,255,0.15); }
            @media (max-width: 500px) {
                .breakdown-swap-btn { display: inline-flex; align-items: center; }
                .breakdown-top-panels { flex-direction: column !important; }
                .breakdown-panel { width: 100% !important; }
                .breakdown-panel--right { display: none !important; }
                .breakdown-panel--left { display: block !important; }
                .breakdown-panel.is-hidden { display: none !important; }
                .breakdown-panel.is-visible { display: flex !important; }
                .breakdown-panel--right.is-visible { display: flex !important; flex-direction: column; gap: 12px; }
                .breakdown-panel--left.is-visible { display: block !important; }
            }
        </style>
        ${renderQuickBreakdownSection(data, avgHitPerUnit, dotColorClass)}
        ${renderActiveBuffsSection(data)}
        <div class="deep-dive-trigger" onclick="toggleDeepDive(this)"><span>Full Calculation Log</span><span class="dd-arrow text-accent-start">▼</span></div>
        <div class="deep-dive-content hidden">
            ${renderBaseDamageSection(data, levelMult, traitRowsDmg, dmgAfterRelic, headDmgHtml, preConditionalDmg, baseSetDmg, tagDmg, passiveDmg, eternalDmg, statPointsHtml)}
            ${renderCritSection(data, setTagCfTotal, setTagCmTotal)}
            ${renderSpaSection(data, traitRowsSpa, baseSetSpa, tagSpa, passiveSpa)}
            ${renderRangeSection(data)}
            ${data.extraAttacks ? `<div class="dd-section"><div class="dd-title mt-text-green"><span>5. Attack Rate Multiplier</span> <button class="calc-info-btn" onclick="openInfoPopup('attack_rate')">?</button></div><table class="calc-table"><tr><td class="mt-cell-label">Hits Per Attack</td><td class="mt-cell-val">${data.extraAttacks.hits}</td></tr><tr><td class="mt-cell-label">Crits Req. for Extra</td><td class="mt-cell-val">${data.extraAttacks.req}</td></tr><tr><td class="mt-cell-label">Attacks needed to Trig</td><td class="mt-cell-val">${fmt.fix(data.extraAttacks.attacksNeeded, 2)}</td></tr><tr><td class="mt-cell-label">Final Dps Mult</td><td class="mt-cell-val calc-highlight">x${fmt.fix(data.extraAttacks.mult, 3)}</td></tr></table></div>` : ''}
            ${renderDotSection(data, headDotRow)}
            ${renderSummonSection(data)}
            ${renderFinalSection(data)}
        </div>
    `;
}

function renderSummonSection(data) {
    if (!data.summonData) return '';
    const isNutaru = data.baseStats.id === 'nutaru_beast';
    return `
    <div class="dd-section">
        <div class="dd-title text-accent-start"><span>${isNutaru ? 'Clones' : 'Summon Logic (Planes)'}</span></div>
        <table class="calc-table">
            <tr><td class="mt-cell-label">${isNutaru ? 'Single Clone Dmg' : 'Plane Base Damage'}</td><td class="mt-cell-val">${isNutaru ? fmt.num(data.dmgVal * 0.75) : fmt.num(data.dmgVal * 0.5)}</td></tr>
            <tr><td class="mt-cell-label">${isNutaru ? 'Summon Rate' : 'Host SPA (Spawn Rate)'}</td><td class="mt-cell-val">${fmt.fix(data.summonData.hostSpa * (isNutaru ? 8 : 1), 2)}s</td></tr>
            
            <tr><td class="mt-cell-label mt-pt-md text-white">Active ${isNutaru ? 'Clones' : 'Planes'}</td><td class="mt-cell-val mt-pt-md text-gold text-bold">${fmt.fix(data.summonData.count, 1)} / ${data.summonData.max}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Avg Duration</td><td class="mt-cell-val calc-sub">${data.summonData.avgDuration}s</td></tr>

            <tr><td class="mt-cell-label mt-pt-md">Avg ${isNutaru ? 'Clone' : 'Plane'} DPS (Individual)</td><td class="mt-cell-val mt-pt-md">${fmt.num(data.summonData.avgPlaneDps)}</td></tr>
            ${isNutaru ? `<tr><td class="mt-cell-label calc-sub">Clone Attack Rate</td><td class="mt-cell-val calc-sub">8.0s</td></tr>` : 
            `<tr><td class="mt-cell-label calc-sub">Type A (Explosive)</td><td class="mt-cell-val calc-sub">${fmt.num(data.summonData.dpsA)}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Type B (Mounted)</td><td class="mt-cell-val calc-sub">${fmt.num(data.summonData.dpsB)}</td></tr>`}

            <tr><td class="mt-cell-label text-white mt-pt-md">Total ${isNutaru ? 'Clone' : 'Summon'} DPS (x${data.placement})</td><td class="mt-cell-val mt-pt-md text-accent-start text-bold">${fmt.num(data.summon)}</td></tr>
        </table>
    </div>`;
}

function renderFinalSection(data) {
    const hitLabel = data.placement > 1 ? `Hit DPS (x${data.placement} Units)` : `Hit DPS`;
    const hitFormula = data.placement > 1 ? `<span class="op">×</span>${data.placement}` : ``;
    const isNutaru = data.baseStats.id === 'nutaru_beast';

    return `
            <div class="dd-section border-l-gold">
                <div class="dd-title text-gold">Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">${hitLabel}</td><td class="mt-cell-formula">${hitFormula}</td><td class="mt-cell-val calc-highlight">${fmt.num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="mt-cell-label">DoT DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-end">${fmt.num(data.dot)}</td></tr>` : ''}
                    ${data.summon > 0 ? `<tr><td class="mt-cell-label">${isNutaru ? 'Clone' : 'Plane'} DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-start">${fmt.num(data.summon)}</td></tr>` : ''}
                    <tr>
                        <td class="mt-cell-label text-white mt-pt-md" style="font-size: 1.1rem; font-weight: 800;">TOTAL DPS</td>
                        <td class="mt-cell-formula"></td>
                        <td class="mt-cell-val mt-text-gold mt-pt-md" style="font-size: 1.2rem;">${fmt.num(data.total)}</td>
                    </tr>
                </table>
            </div>`;
}

function renderRangeSection(data) {
    const mTrait = 1 + (data.traitBuffs.range / 100);
    const mRelic = 1 + (data.relicBuffs.range / 100);
    const totalAdditiveRange = (data.totalSetStats.range || 0) + (data.passiveRange || 0) + (data.enlightBuff || 0);
    const mAdditive = 1 + (totalAdditiveRange / 100);
    const basePassiveRange = (data.passiveRange || 0) - (data.eternalRangeBuff || 0);
    const setRange = data.totalSetStats.range || 0;
    const hasEternal = (data.eternalRangeBuff || 0) > 0;
    const additiveLabel = hasEternal ? "Set Bonus + Passive + Eternal" : "Set Bonus + Passive";

    return `
        <div class="dd-section">
            <div class="dd-title" style="color: #fbbf24"><span>4. Range Calculation</span> <button class="calc-info-btn" onclick="openInfoPopup('stat_range')">?</button></div>
            <table class="calc-table">
                <tr><td class="mt-cell-label">Base Range (Lv 1)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${data.baseStats.range || 0}</td></tr>
                
                <tr><td class="mt-cell-label">Scaling (Level + Points)</td><td class="mt-cell-formula"><span class="op">×</span>${fmt.fix(data.lvStats.rangeMult, 3)}</td><td class="mt-cell-val">${fmt.fix(data.lvStats.range / (data.isSSS ? 1.2 : 1), 2)}</td></tr>
                
                ${data.isSSS ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ SSS Rank Bonus</td><td class="mt-cell-formula"><span class="op">×</span>1.2</td><td class="mt-cell-val">${fmt.fix(data.lvStats.range, 2)}</td></tr>` : ''}

                <tr class="mt-border-top"><td class="mt-cell-label mt-pt-md">Trait Multiplier</td><td class="mt-cell-formula mt-pt-md">x${fmt.fix(mTrait, 2)}</td><td class="mt-cell-val mt-pt-md">${fmt.pct(data.traitBuffs.range)}</td></tr>
                
                <tr><td class="mt-cell-label">Relic Substats</td><td class="mt-cell-formula">x${fmt.fix(mRelic, 2)}</td><td class="mt-cell-val">${fmt.pct(data.relicBuffs.range)}</td></tr>
                
                <tr><td class="mt-cell-label mt-pt-md">${additiveLabel}</td><td class="mt-cell-formula mt-pt-md">x${fmt.fix(mAdditive, 2)}</td><td class="mt-cell-val mt-pt-md">${fmt.pct(totalAdditiveRange)}</td></tr>
                
                ${setRange > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Bonus</td><td class="mt-cell-formula">${fmt.pct(setRange)}</td><td class="mt-cell-val"></td></tr>` : ''}
                ${basePassiveRange > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">${fmt.pct(basePassiveRange)}</td><td class="mt-cell-val"></td></tr>` : ''}
                ${(data.eternalRangeBuff > 0) ? `<tr><td class="mt-cell-label mt-pl-md text-accent-start opacity-70">↳ Eternal Stacks</td><td class="mt-cell-formula text-accent-start">${fmt.pct(data.eternalRangeBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}
                ${(data.enlightBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-gold opacity-70">↳ Enlightened God</td><td class="mt-cell-formula text-gold">${fmt.pct(data.enlightBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}
                ${(data.bijuuBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-error opacity-70">↳ Bijuu Link</td><td class="mt-cell-formula text-error">${fmt.pct(data.bijuuBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}

                <tr class="mt-border-top"><td class="mt-cell-label mt-pt-sm text-white">Final Range Result</td><td class="mt-cell-formula"></td><td class="mt-cell-val mt-pt-sm mt-text-bold" style="color: #fbbf24">${fmt.fix(data.range, 2)}</td></tr>
            </table>
        </div>`;
}