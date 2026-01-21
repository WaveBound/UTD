//Helpers for formatting
const fmt = {
    pct: (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`,
    num: (n) => n.toLocaleString(undefined, {maximumFractionDigits: 1}),
    fix: (n, d=2) => n.toFixed(d)
};

function renderOverviewSection(data) {
    return `
        <div class="math-section" style="border-color: rgba(251, 191, 36, 0.3);">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Total DPS</span><b class="math-val-gold">${fmt.num(data.total)}</b></div>
            ${data.summon > 0 ? `<div class="math-row"><span>Planes Active</span><b class="text-accent-start">${fmt.fix(data.summonData.count, 1)}</b></div>` : ''}
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
            <div class="math-row"><span>Final Range</span><b class="math-val-range">${fmt.fix(data.range, 1)}</b></div>
        </div>`;
}

function renderQuickBreakdownSection(data, avgHitPerUnit, dotColorClass) {
    const dotLabelClass = data.dot > 0 ? 'text-accent-end' : '';
    return `
        <div class="math-section no-border-bottom mb-3">
            <div class="math-header opacity-70">Quick Breakdown</div>
            <div class="mq-box">
                <div style="border-color: rgba(251, 191, 36, 0.3);"><div class="mq-label mt-text-gold">Hit DPS</div><div class="mq-val mt-text-gold">${fmt.num(data.hit)}</div><div class="mq-sub">(${fmt.num(avgHitPerUnit)} avg ÷ ${fmt.fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div style="border-color: ${data.dot > 0 ? 'rgba(192, 132, 252, 0.3)' : '#333'};"><div class="mq-label ${dotLabelClass}">DoT DPS</div><div class="mq-val ${dotColorClass}">${data.dot > 0 ? fmt.num(data.dot) : '-'}</div><div class="mq-sub">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div style="border-color: rgba(216, 180, 254, 0.3);"><div class="mq-label text-custom">Crit Rate / Dmg</div><div class="mq-val text-custom">${fmt.fix(data.critData.rate, 0)}% <span class="color-dim">|</span> x${fmt.fix(data.critData.cdmg/100, 2)}</div><div class="mq-sub">Avg Mult: x${fmt.fix(data.critData.avgMult, 3)}</div></div>
                ${data.summon > 0 ? `<div style="border-color: rgba(96, 165, 250, 0.3);"><div class="mq-label text-accent-start">Plane DPS</div><div class="mq-val text-accent-start">${fmt.num(data.summon)}</div><div class="mq-sub">Independent of Host Stats</div></div>` : `<div style="border-color: rgba(96, 165, 250, 0.3);"><div class="mq-label text-accent-start">Attack Rate</div><div class="mq-val text-accent-start">${fmt.fix(data.spa, 2)}s</div><div class="mq-sub">Base: ${data.baseStats.spa}s (Current Cap: ${data.spaCap}s)</div></div>`}
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
                        <td class="mt-cell-label mt-pt-md">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="mt-cell-formula mt-pt-md mt-text-gold mt-text-bold">${fmt.pct(data.totalAdditivePct)}</td>
                        <td class="mt-cell-val calc-highlight mt-pt-md">${fmt.num(preConditionalDmg)}</td>
                    </tr>
                    <tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Base</td><td class="mt-cell-formula">${fmt.pct(baseSetDmg)}</td><td class="mt-cell-val"></td></tr>
                    ${tagDmg !== 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Tag Bonuses</td><td class="mt-cell-formula">${fmt.pct(tagDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${passiveDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">${fmt.pct(passiveDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${eternalDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-accent-start opacity-70">↳ Eternal Stacks (Wave 12+)</td><td class="mt-cell-formula text-accent-start">${fmt.pct(eternalDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.abilityBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-custom opacity-70">↳ Ability Buffs</td><td class="mt-cell-formula text-custom">${fmt.pct(data.abilityBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}

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
    
    const preRelicTotal = baseDot + traitDot + setDot + headDot;
    const relicMult = 1 + (relicDot / 100);
    const finalTickPct = preRelicTotal * relicMult;

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

    return `
    <div class="dd-section">
        <div class="dd-title text-accent-end"><span>6. Status Effect (DoT) Breakdown</span> <button class="calc-info-btn" onclick="openInfoPopup('dot_logic')">?</button></div>
        <table class="calc-table">
            <tr><td class="mt-cell-label">Hit Ref (Crit Avg)</td><td class="mt-cell-val" colspan="2">${fmt.num(data.dmgVal * db.critMult)}</td></tr>
            
            ${headDotRow}

            ${db.nativeDps > 0 ? `
            <!-- Native DoT Breakdown -->
            <tr><td class="mt-cell-label mt-pt-md mt-text-bold">Native Tick % Calculation</td><td class="mt-cell-formula mt-pt-md"></td><td class="mt-cell-val mt-pt-md mt-text-bold">${fmt.fix(finalTickPct, 1)}%</td></tr>
            
            ${baseDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs">${fmt.pct(baseDot)}</td></tr>` : ''}
            ${traitDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Trait Buff</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs">${fmt.pct(traitDot)}</td></tr>` : ''}
            ${setDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Bonus</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs">${fmt.pct(setDot)}</td></tr>` : ''}
            ${headDot > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Head Passive</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-xs">${fmt.pct(headDot)}</td></tr>` : ''}
            
            <tr><td class="mt-cell-label mt-pl-md text-accent-end">↳ Relic Multiplier</td><td class="mt-cell-formula">x${fmt.fix(relicMult, 2)}</td><td class="mt-cell-val text-accent-end">${fmt.pct(relicDot)}</td></tr>

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

// ... (renderMathContent function remains generally the same, but remove the old headDotRow logic block inside renderMathContent to avoid double definition, logic is now moved inside renderDotSection for better encapsulation)

function renderMathContent(data) {
    if (!data || !data.lvStats || !data.critData) return '<div class="msg-empty">Data incomplete.</div>';
    
    // ... [Previous variable definitions like levelMult, avgHitPerUnit, traitRows, etc. remain the same] ...
    
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
    // Defined inside renderDotSection, passed as empty string here if needed, or handled inside
    let headDotRow = ''; 
    // Logic moved inside renderDotSection to keep it grouped with DoT data.

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
        ${renderOverviewSection(data)}
        ${renderQuickBreakdownSection(data, avgHitPerUnit, dotColorClass)}
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
    return `
    <div class="dd-section">
        <div class="dd-title text-accent-start"><span>Summon Logic (Planes)</span></div>
        <table class="calc-table">
            <tr><td class="mt-cell-label">Plane Base Damage</td><td class="mt-cell-val">${fmt.num(data.dmgVal * 0.5)}</td></tr>
            <tr><td class="mt-cell-label">Host SPA (Spawn Rate)</td><td class="mt-cell-val">${fmt.fix(data.summonData.hostSpa, 2)}s</td></tr>
            
            <tr><td class="mt-cell-label mt-pt-md text-white">Active Planes</td><td class="mt-cell-val mt-pt-md text-gold text-bold">${fmt.fix(data.summonData.count, 1)} / ${data.summonData.max}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Avg Duration</td><td class="mt-cell-val calc-sub">${data.summonData.avgDuration}s</td></tr>

            <tr><td class="mt-cell-label mt-pt-md">Avg Plane DPS (Individual)</td><td class="mt-cell-val mt-pt-md">${fmt.num(data.summonData.avgPlaneDps)}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Type A (Explosive)</td><td class="mt-cell-val calc-sub">${fmt.num(data.summonData.dpsA)}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Type B (Mounted)</td><td class="mt-cell-val calc-sub">${fmt.num(data.summonData.dpsB)}</td></tr>

            <tr><td class="mt-cell-label text-white mt-pt-md">Total Summon DPS (x${data.placement})</td><td class="mt-cell-val mt-pt-md text-accent-start text-bold">${fmt.num(data.summon)}</td></tr>
        </table>
    </div>`;
}

function renderFinalSection(data) {
    const hitLabel = data.placement > 1 ? `Hit DPS (x${data.placement} Units)` : `Hit DPS`;
    const hitFormula = data.placement > 1 ? `<span class="op">×</span>${data.placement}` : ``;

    return `
            <div class="dd-section border-l-gold">
                <div class="dd-title text-gold">Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">${hitLabel}</td><td class="mt-cell-formula">${hitFormula}</td><td class="mt-cell-val calc-highlight">${fmt.num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="mt-cell-label">DoT DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-end">${fmt.num(data.dot)}</td></tr>` : ''}
                    ${data.summon > 0 ? `<tr><td class="mt-cell-label">Plane DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-start">${fmt.num(data.summon)}</td></tr>` : ''}
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
    const totalAdditiveRange = (data.totalSetStats.range || 0) + (data.passiveRange || 0);
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

                <tr class="mt-border-top"><td class="mt-cell-label mt-pt-sm text-white">Final Range Result</td><td class="mt-cell-formula"></td><td class="mt-cell-val mt-pt-sm mt-text-bold" style="color: #fbbf24">${fmt.fix(data.range, 2)}</td></tr>
            </table>
        </div>`;
}

// Render complete math breakdown
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

    // --- Pre-calculations for sections ---
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

    // --- Special HTML Blocks ---
    let headDmgHtml = '';
    if (data.headBuffs && data.headBuffs.type === 'sun_god') {
        const uptimePct = (data.headBuffs.uptime || 0);
        
        // UPDATED: New Grid Layout for Sun God Passive
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

    let headDotRow = '';
    if (data.headBuffs && data.headBuffs.type === 'ninja') {
        const uptimePct = (data.headBuffs.uptime || 0);
        headDotRow = `
        <tr class="mt-row-ninja"><td colspan="3" class="p-2"><div class="mt-flex-between mb-2"><span class="text-custom mt-text-bold text-xs tracking-sm">NINJA HEAD PASSIVE</span><button class="calc-info-btn" onclick="openInfoPopup('ninja_passive')">?</button></div>
        <div class="text-xs text-white mt-flex-between mb-2"><span class="opacity-70">Buff Uptime:</span><span class="mt-font-mono ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fmt.fix(uptimePct*100,1)}%</span></div>
        <div class="mt-flex-between mt-border-top mt-pt-sm"><span class="text-white text-xs text-bold">Avg DoT Buff</span><span class="text-custom text-sm mt-text-bold">+${fmt.fix(data.headBuffs.dot, 2)}%</span></div></td></tr>`;
    }

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

    // --- Build Full Output ---
    return `
        ${renderOverviewSection(data)}
        ${renderQuickBreakdownSection(data, avgHitPerUnit, dotColorClass)}
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