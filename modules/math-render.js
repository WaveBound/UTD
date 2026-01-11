// ============================================================================
// MATH-RENDER.JS - Complex Math Breakdown Rendering
// ============================================================================

// Render complete math breakdown
function renderMathContent(data) {
    if (!data || !data.lvStats || !data.critData) return '<div style="padding:20px;">Data incomplete.</div>';

    const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    const num = (n) => n.toLocaleString(undefined, {maximumFractionDigits: 1});
    const fix = (n, d=2) => n.toFixed(d);
    
    const levelMult = data.lvStats.dmgMult; 
    const avgHitPerUnit = data.dmgVal * data.critData.avgMult;
    
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

            traitRowsDmg += `<tr><td class="col-label" style="padding-left:10px;">${labelHtml}</td><td class="col-formula">${pct(tDmg)}</td><td class="col-val">${num(nextDmg)}</td></tr>`;
            runningDmg = nextDmg;

            const tSpa = t.spa || 0;
            const nextSpa = runningSpa * (1 - tSpa/100);
            traitRowsSpa += `<tr><td class="col-label" style="padding-left:10px;">↳ ${t.name}</td><td class="col-formula">-${fix(tSpa,1)}%</td><td class="col-val">${fix(nextSpa,3)}s</td></tr>`;
            runningSpa = nextSpa;
        });
    } else {
        const dmgAfterTrait = runningDmg * (1 + data.traitBuffs.dmg/100);
        traitRowsDmg = `<tr><td class="col-label">Trait Multiplier <button class="calc-info-btn" onclick="openInfoPopup('trait_logic')">?</button></td><td class="col-formula">${pct(data.traitBuffs.dmg)}</td><td class="col-val">${num(dmgAfterTrait)}</td></tr>`;
        const spaAfterTrait = runningSpa * (1 - data.traitBuffs.spa/100);
        traitRowsSpa = `<tr><td class="col-label">Trait Reduction</td><td class="col-formula">-${fix(data.traitBuffs.spa, 1)}%</td><td class="col-val">${fix(spaAfterTrait, 3)}s</td></tr>`;
        runningDmg = dmgAfterTrait; runningSpa = spaAfterTrait;
    }

    const dmgAfterRelic = runningDmg * (1 + data.relicBuffs.dmg/100);
    const finalSpaStep = runningSpa * (1 - (data.relicBuffs.spa + data.totalSetStats.spa + (data.passiveSpaBuff||0))/100);

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

    let headDmgHtml = '';
    if (data.headBuffs && data.headBuffs.type === 'sun_god') {
        const uptimePct = (data.headBuffs.uptime || 0);
        const trigTime = fix(data.headBuffs.trigger, 2);
        headDmgHtml = `
        <tr style="background:rgba(255,215,0,0.08); border-left:3px solid var(--gold);">
            <td colspan="3" style="padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.75rem; color:var(--gold); font-weight:900; letter-spacing:0.5px;">SUN GOD PASSIVE</span>
                    <button class="calc-info-btn" onclick="openInfoPopup('sungod_passive')">?</button>
                </div>
                <div style="font-size:0.75rem; color:#eee; display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:6px;">
                    <span style="opacity:0.8;">Range Stat:</span> <span style="text-align:right; font-family:'Consolas', monospace; color:#ffa500;">${fix(data.range,1)}</span>
                    <span style="opacity:0.8;">Uptime:</span> <span style="text-align:right; font-family:'Consolas', monospace; color:${uptimePct >= 1 ? '#4ade80' : '#ffcc00'}">${fix(uptimePct*100,1)}%</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;">
                    <span style="color:#fff; font-size:0.75rem; font-weight:bold;">Avg Damage Buff</span>
                    <span style="color:var(--gold); font-size:0.85rem; font-weight:900;">+${num(data.headBuffs.dmg)}%</span>
                </div>
            </td>
        </tr>`;
    }

    let headDotRow = '';
    if (data.headBuffs && data.headBuffs.type === 'ninja') {
        const uptimePct = (data.headBuffs.uptime || 0);
        headDotRow = `
        <tr style="background:rgba(6,182,212,0.08); border-left:3px solid var(--custom);">
            <td colspan="3" style="padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.75rem; color:var(--custom); font-weight:900; letter-spacing:0.5px;">NINJA HEAD PASSIVE</span>
                    <button class="calc-info-btn" onclick="openInfoPopup('ninja_passive')">?</button>
                </div>
                <div style="font-size:0.75rem; color:#eee; display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="opacity:0.8;">Buff Uptime:</span>
                    <span style="font-family:'Consolas', monospace; color:${uptimePct >= 1 ? '#4ade80' : '#ffcc00'}">${fix(uptimePct*100,1)}%</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;">
                    <span style="color:#fff; font-size:0.75rem; font-weight:bold;">Avg DoT Buff</span>
                    <span style="color:var(--custom); font-size:0.85rem; font-weight:900;">+${fix(data.headBuffs.dot, 2)}%</span>
                </div>
            </td>
        </tr>`;
    }
    
    const statPointsHtml = (data.dmgPoints !== undefined) ? `
    <tr>
        <td class="col-label">Stat Points <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="col-formula">DMG: ${data.dmgPoints} | SPA: ${data.spaPoints}</td>
        <td class="col-val">${num(data.baseStats.dmg * levelMult)}</td>
    </tr>
    ` : `
    <tr>
        <td class="col-label">Level Scaling <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="col-formula"><span class="op">×</span>${fix(levelMult, 3)}</td>
        <td class="col-val">${num(data.baseStats.dmg * levelMult)}</td>
    </tr>
    `;

    return `
        <div class="math-section">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Total DPS</span><b style="color:var(--gold); font-size:1.1rem;">${num(data.total)}</b></div>
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
            <div class="math-row"><span>Final Range</span><b style="color:#ffa500;">${fix(data.range, 1)}</b></div>
        </div>

        <div class="math-section" style="border-bottom:none; margin-bottom:15px;">
            <div class="math-header" style="color:#fff; opacity:0.8;">Quick Breakdown</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; border:1px solid #333;">
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Hit DPS</div><div style="color:#fff; font-weight:bold; font-size:0.9rem;">${num(data.hit)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">(${num(avgHitPerUnit)} avg ÷ ${fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">DoT DPS</div><div style="color:${data.dot > 0 ? 'var(--accent-end)' : '#555'}; font-weight:bold; font-size:0.9rem;">${data.dot > 0 ? num(data.dot) : '-'}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Crit Rate / Dmg</div><div style="color:var(--custom); font-weight:bold; font-size:0.9rem;">${fix(data.critData.rate, 0)}% <span style="color:#444">|</span> x${fix(data.critData.cdmg/100, 2)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Avg Mult: x${fix(data.critData.avgMult, 3)}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Attack Rate</div><div style="color:var(--accent-start); font-weight:bold; font-size:0.9rem;">${fix(data.spa, 2)}s</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Base: ${data.baseStats.spa}s (Current Cap: ${data.spaCap}s)</div></div>
            </div>
        </div>

        <div class="deep-dive-trigger" onclick="toggleDeepDive(this)" style="background:rgba(255,255,255,0.1);"><span>Full Calculation Log</span><span class="dd-arrow" style="color:var(--accent-start);">▼</span></div>

        <div class="deep-dive-content" style="display:none;">
            <div class="dd-section">
                <div class="dd-title"><span>1. Base Damage Calculation</span></div>
                <table class="calc-table">
                    <tr>
                        <td class="col-label">Base Stats (Lv 1)</td>
                        <td class="col-formula"></td>
                        <td class="col-val">${num(data.baseStats.dmg)}</td>
                    </tr>
                    ${statPointsHtml}
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank Bonus</td><td class="col-formula"><span class="op">×</span>1.2</td><td class="col-val">${num(data.lvStats.dmg)}</td></tr>` : ''}
                    
                    ${traitRowsDmg}

                    <tr>
                        <td class="col-label" style="color:var(--accent-end);">Relic Multiplier <button class="calc-info-btn" onclick="openInfoPopup('relic_multi')">?</button></td>
                        <td class="col-formula" style="color:var(--accent-end);">${pct(data.relicBuffs.dmg)}</td>
                        <td class="col-val">${num(dmgAfterRelic)}</td>
                    </tr>
                    
                    ${headDmgHtml}

                    <tr>
                        <td class="col-label" style="padding-top:8px;">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="col-formula" style="padding-top:8px; color:var(--gold); font-weight:bold;">${pct(data.totalAdditivePct)}</td>
                        <td class="col-val calc-highlight" style="padding-top:8px;">${num(preConditionalDmg)}</td>
                    </tr>
                    <tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Set Base</td><td class="col-formula">${pct(baseSetDmg)}</td><td class="col-val"></td></tr>
                    ${tagDmg !== 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Tag Bonuses</td><td class="col-formula">${pct(tagDmg)}</td><td class="col-val"></td></tr>` : ''}
                    ${passiveDmg > 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Unit Passive</td><td class="col-formula">${pct(passiveDmg)}</td><td class="col-val"></td></tr>` : ''}
                    ${eternalDmg > 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7; color:var(--accent-start);">↳ Eternal Stacks (Wave 12+)</td><td class="col-formula" style="color:var(--accent-start);">${pct(eternalDmg)}</td><td class="col-val"></td></tr>` : ''}
                    ${(data.abilityBuff || 0) > 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7; color:var(--custom);">↳ Ability Buffs</td><td class="col-formula" style="color:var(--custom);">${pct(data.abilityBuff)}</td><td class="col-val"></td></tr>` : ''}

                    ${data.conditionalData ? `
                    <tr>
                        <td class="col-label" style="padding-top:8px; color:#ff7733; font-weight:bold;">${data.conditionalData.name}</td>
                        <td class="col-formula" style="padding-top:8px; color:#ff7733; font-weight:bold;">x${data.conditionalData.mult.toFixed(2)}</td>
                        <td class="col-val calc-highlight" style="padding-top:8px;">${num(data.dmgVal)}</td>
                    </tr>
                    ` : ''}

                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title"><span>2. Crit Averaging</span> <button class="calc-info-btn" onclick="openInfoPopup('crit_avg')">?</button></div>
                <table class="calc-table">
                    <tr><td class="col-label">Base Hit (Non-Crit)</td><td class="col-formula"></td><td class="col-val">${num(data.dmgVal)}</td></tr>
                    
                    <tr><td class="col-label" style="color:#ffd700; padding-left:8px; font-weight:bold;">↳ Final Crit Rate</td><td class="col-formula"></td><td class="col-val" style="color:#ffd700; font-weight:bold;">${fix(data.critData.rate, 1)}%</td></tr>
                    ${data.baseStats.crit > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Unit Base</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">${fix(data.baseStats.crit, 1)}%</td></tr>` : ''}
                    ${(data.traitObj.critRate || 0) > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Trait (${data.traitObj.name})</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">${fix(data.traitObj.critRate, 1)}%</td></tr>` : ''}
                    ${data.relicBuffs.cf > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Relics (Main+Sub)</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">${fix(data.relicBuffs.cf, 1)}%</td></tr>` : ''}
                    ${setTagCfTotal > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Set Bonus & Tags</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">${fix(setTagCfTotal, 1)}%</td></tr>` : ''}
                    
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ CDmg Base</td><td class="col-formula"></td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.baseCdmg,0)}</td></tr>
                    ${data.relicBuffs.cm > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Relics</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">+${fix(data.relicBuffs.cm, 1)}%</td></tr>` : ''}
                    ${setTagCmTotal > 0 ? `<tr><td class="col-label" style="color:#666; padding-left:20px; font-size:0.7rem;">• Set & Tags</td><td class="col-formula"></td><td class="col-val" style="color:#666; font-size:0.7rem;">+${fix(setTagCmTotal, 1)}%</td></tr>` : ''}

                    <tr><td class="col-label">Total Crit Damage</td><td class="col-formula">=</td><td class="col-val calc-highlight">${fix(data.critData.cdmg, 0)}%</td></tr>
                    <tr><td class="col-label" colspan="2" style="text-align:right; padding-right:10px;">Avg Damage Per Hit</td><td class="col-val calc-result">${num(data.dmgVal * data.critData.avgMult)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title"><span>3. SPA (Speed) Calculation</span> <button class="calc-info-btn" onclick="openInfoPopup('spa_calc')">?</button></div>
                <table class="calc-table">
                    <tr><td class="col-label">Base SPA (Lv 1)</td><td class="col-formula"></td><td class="col-val">${data.baseStats.spa}s</td></tr>
                    <tr><td class="col-label">Stat Point Scaling</td><td class="col-formula"></td><td class="col-val">${fix(data.baseStats.spa * data.lvStats.spaMult, 3)}s</td></tr>
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank (-8%)</td><td class="col-formula"><span class="op">×</span>0.92</td><td class="col-val">${fix(data.lvStats.spa, 3)}s</td></tr>` : ''}
                    ${traitRowsSpa}
                    
                    <tr>
                        <td class="col-label" style="padding-top:8px;">Relic Multiplier</td>
                        <td class="col-formula" style="padding-top:8px;">-${fix(data.relicBuffs.spa, 1)}%</td>
                        <td class="col-val" style="padding-top:8px;">${fix(data.spaAfterRelic, 3)}s</td>
                    </tr>
                    <tr>
                        <td class="col-label" style="padding-top:8px;">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="col-formula" style="padding-top:8px;">-${fix(data.setAndPassiveSpa, 1)}%</td>
                        <td class="col-val" style="padding-top:8px;">${fix(data.rawFinalSpa, 3)}s</td>
                    </tr>
                    <tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Set Base</td><td class="col-formula">-${fix(baseSetSpa, 1)}%</td><td class="col-val"></td></tr>
                    ${tagSpa !== 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Tag Bonuses</td><td class="col-formula">-${fix(tagSpa, 1)}%</td><td class="col-val"></td></tr>` : ''}
                    ${passiveSpa > 0 ? `<tr><td class="col-label" style="padding-left:10px; opacity:0.7;">↳ Unit Passive</td><td class="col-formula">-${fix(passiveSpa, 1)}%</td><td class="col-val"></td></tr>` : ''}

                    <tr><td class="col-label">Cap Check (${data.spaCap}s)</td><td class="col-formula">MAX</td><td class="col-val calc-result">${fix(data.spa, 3)}s</td></tr>
                </table>
            </div>

            ${data.extraAttacks ? `
            <div class="dd-section">
                 <div class="dd-title"><span>4. Attack Rate Multiplier</span> <button class="calc-info-btn" onclick="openInfoPopup('attack_rate')">?</button></div>
                 <table class="calc-table">
                    <tr><td class="col-label">Hits Per Attack</td><td class="col-val">${data.extraAttacks.hits}</td></tr>
                    <tr><td class="col-label">Crits Req. for Extra</td><td class="col-val">${data.extraAttacks.req}</td></tr>
                    <tr><td class="col-label">Attacks needed to Trig</td><td class="col-val">${fix(data.extraAttacks.attacksNeeded, 2)}</td></tr>
                    <tr><td class="col-label">Final Dps Mult</td><td class="col-val calc-highlight">x${fix(data.extraAttacks.mult, 3)}</td></tr>
                 </table>
            </div>` : ''}

            ${data.dot > 0 ? `
            <div class="dd-section">
                <div class="dd-title" style="color:var(--accent-end);"><span>${data.extraAttacks ? 5 : 4}. Status Effect (DoT)</span> <button class="calc-info-btn" onclick="openInfoPopup('dot_logic')">?</button></div>
                <table class="calc-table">
                    <tr><td class="col-label calc-sub">Base Hit Ref</td><td class="col-val calc-sub">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label">Base Tick %</td><td class="col-val">${fix(data.dotData.baseNoHead, 2)}%</td></tr>
                    ${headDotRow}
                    <tr><td class="col-label" style="font-weight:bold;">Total Tick %</td><td class="col-val" style="font-weight:bold;">${fix(data.dotData.base, 2)}%</td></tr>
                    <tr><td class="col-label">Relic Mult (x${fix(data.dotData.relicMult, 2)})</td><td class="col-val" style="color:var(--accent-end);">${fix(data.dotData.finalPct, 1)}%</td></tr>
                    <tr><td class="col-label" style="color:var(--custom);">Crit Avg Mult</td><td class="col-val" style="color:var(--custom);">x${fix(data.dotData.critMult, 3)}</td></tr>
                    <tr><td class="col-label">Total Damage (Lifetime)</td><td class="col-val">${num(data.dotData.finalTick)}</td></tr>
                    <tr><td class="col-label calc-sub">Time Basis</td><td class="col-val calc-sub">${fix(data.dotData.timeUsed, 2)}s</td></tr>
                    <tr><td class="col-label" style="color:#fff;">DoT DPS (1 Unit)</td><td class="col-val" style="color:var(--accent-end);">${num(data.singleUnitDoT)}</td></tr>
                    ${data.placement > 1 ? `<tr><td class="col-label" style="color:#fff; border-top:1px dashed #333;">Total DoT DPS (x${data.placement})</td><td class="col-val" style="color:var(--accent-end); border-top:1px dashed #333;">${num(data.dot)}</td></tr>` : ''}
                </table>
            </div>` : ''}

            <div class="dd-section" style="border-left-color:var(--gold);">
                <div class="dd-title" style="color:var(--gold);">Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="col-label">Hit DPS (x${data.placement} Units)</td><td class="col-formula"><span class="op">×</span>${data.placement}</td><td class="col-val calc-highlight">${num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="col-label">DoT DPS</td><td class="col-formula">+</td><td class="col-val" style="color:var(--accent-end);">${num(data.dot)}</td></tr>` : ''}
                    <tr><td class="col-label" colspan="2" style="font-size:1rem; color:#fff; padding-top:10px;">TOTAL DPS</td><td class="col-val" style="font-size:1.4rem; color:var(--gold); padding-top:10px;">${num(data.total)}</td></tr>
                </table>
            </div>
        </div>
    `;
}