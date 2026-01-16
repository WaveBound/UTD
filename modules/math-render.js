// --- START OF FILE math-render.js ---

// Render complete math breakdown
function renderMathContent(data) {
    if (!data || !data.lvStats || !data.critData) return '<div class="msg-empty">Data incomplete.</div>';

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

            traitRowsDmg += `<tr><td class="mt-cell-label mt-pl-md">${labelHtml}</td><td class="mt-cell-formula">${pct(tDmg)}</td><td class="mt-cell-val">${num(nextDmg)}</td></tr>`;
            runningDmg = nextDmg;

            const tSpa = t.spa || 0;
            const nextSpa = runningSpa * (1 - tSpa/100);
            traitRowsSpa += `<tr><td class="mt-cell-label mt-pl-md">↳ ${t.name}</td><td class="mt-cell-formula">-${fix(tSpa,1)}%</td><td class="mt-cell-val">${fix(nextSpa,3)}s</td></tr>`;
            runningSpa = nextSpa;
        });
    } else {
        const dmgAfterTrait = runningDmg * (1 + data.traitBuffs.dmg/100);
        traitRowsDmg = `<tr><td class="mt-cell-label">Trait Multiplier <button class="calc-info-btn" onclick="openInfoPopup('trait_logic')">?</button></td><td class="mt-cell-formula">${pct(data.traitBuffs.dmg)}</td><td class="mt-cell-val">${num(dmgAfterTrait)}</td></tr>`;
        const spaAfterTrait = runningSpa * (1 - data.traitBuffs.spa/100);
        traitRowsSpa = `<tr><td class="mt-cell-label">Trait Reduction</td><td class="mt-cell-formula">-${fix(data.traitBuffs.spa, 1)}%</td><td class="mt-cell-val">${fix(spaAfterTrait, 3)}s</td></tr>`;
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
        <tr class="mt-row-sungod">
            <td colspan="3" class="p-2">
                <div class="mt-flex-between mb-2">
                    <span class="text-gold mt-text-bold text-xs tracking-sm">SUN GOD PASSIVE</span>
                    <button class="calc-info-btn" onclick="openInfoPopup('sungod_passive')">?</button>
                </div>
                <div class="text-xs text-white mt-grid-2 mb-2">
                    <span class="opacity-70">Range Stat:</span> <span class="mt-font-mono mt-text-right mt-text-range">${fix(data.range,1)}</span>
                    <span class="opacity-70">Uptime:</span> <span class="mt-font-mono mt-text-right ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fix(uptimePct*100,1)}%</span>
                </div>
                <div class="mt-flex-between mt-border-top mt-pt-sm">
                    <span class="text-white text-xs text-bold">Avg Damage Buff</span>
                    <span class="text-gold text-sm mt-text-bold">+${num(data.headBuffs.dmg)}%</span>
                </div>
            </td>
        </tr>`;
    }

    let headDotRow = '';
    if (data.headBuffs && data.headBuffs.type === 'ninja') {
        const uptimePct = (data.headBuffs.uptime || 0);
        headDotRow = `
        <tr class="mt-row-ninja">
            <td colspan="3" class="p-2">
                <div class="mt-flex-between mb-2">
                    <span class="text-custom mt-text-bold text-xs tracking-sm">NINJA HEAD PASSIVE</span>
                    <button class="calc-info-btn" onclick="openInfoPopup('ninja_passive')">?</button>
                </div>
                <div class="text-xs text-white mt-flex-between mb-2">
                    <span class="opacity-70">Buff Uptime:</span>
                    <span class="mt-font-mono ${uptimePct >= 1 ? 'mt-text-green' : 'mt-text-orange'}">${fix(uptimePct*100,1)}%</span>
                </div>
                <div class="mt-flex-between mt-border-top mt-pt-sm">
                    <span class="text-white text-xs text-bold">Avg DoT Buff</span>
                    <span class="text-custom text-sm mt-text-bold">+${fix(data.headBuffs.dot, 2)}%</span>
                </div>
            </td>
        </tr>`;
    }
    
const statPointsHtml = (data.dmgPoints !== undefined) ? `
    <tr>
        <td class="mt-cell-label">Stat Points <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="mt-cell-formula">Dmg x${fix(data.lvStats.dmgMult, 2)} Spa x${fix(data.lvStats.spaMult, 2)}</td>
        <td class="mt-cell-val">${num(data.baseStats.dmg * data.lvStats.dmgMult)}</td>
    </tr>
    ` : `
    <tr>
        <td class="mt-cell-label">Level Scaling <button class="calc-info-btn" onclick="openInfoPopup('level_scale')">?</button></td>
        <td class="mt-cell-formula"><span class="op">×</span>${fix(levelMult, 3)}</td>
        <td class="mt-cell-val">${num(data.baseStats.dmg * levelMult)}</td>
    </tr>
    `;
    
    const dotColorClass = data.dot > 0 ? 'text-accent-end' : 'text-dark-dim';

    // NEW: SUMMON SECTION
    const summonSection = data.summonData ? `
    <div class="dd-section">
        <div class="dd-title text-accent-start"><span>Summon Logic (Planes)</span></div>
        <table class="calc-table">
            <tr><td class="mt-cell-label">Plane Base Damage</td><td class="mt-cell-val">${num(data.dmgVal * 0.5)}</td></tr>
            <tr><td class="mt-cell-label">Host SPA (Spawn Rate)</td><td class="mt-cell-val">${fix(data.summonData.hostSpa, 2)}s</td></tr>
            
            <tr><td class="mt-cell-label mt-pt-md text-white">Active Planes</td><td class="mt-cell-val mt-pt-md text-gold text-bold">${fix(data.summonData.count, 1)} / ${data.summonData.max}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Avg Duration</td><td class="mt-cell-val calc-sub">${data.summonData.avgDuration}s</td></tr>

            <tr><td class="mt-cell-label mt-pt-md">Avg Plane DPS (Individual)</td><td class="mt-cell-val mt-pt-md">${num(data.summonData.avgPlaneDps)}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Type A (Explosive)</td><td class="mt-cell-val calc-sub">${num(data.summonData.dpsA)}</td></tr>
            <tr><td class="mt-cell-label calc-sub">Type B (Mounted)</td><td class="mt-cell-val calc-sub">${num(data.summonData.dpsB)}</td></tr>

            <tr><td class="mt-cell-label text-white mt-pt-md">Total Summon DPS (x${data.placement})</td><td class="mt-cell-val mt-pt-md text-accent-start text-bold">${num(data.summon)}</td></tr>
        </table>
    </div>` : '';

    return `
        <div class="math-section">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Total DPS</span><b class="math-val-gold">${num(data.total)}</b></div>
            ${data.summon > 0 ? `<div class="math-row"><span>Planes Active</span><b class="text-accent-start">${fix(data.summonData.count, 1)}</b></div>` : ''}
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
            <div class="math-row"><span>Final Range</span><b class="math-val-range">${fix(data.range, 1)}</b></div>
        </div>

        <div class="math-section no-border-bottom mb-3">
            <div class="math-header opacity-70">Quick Breakdown</div>
            <div class="mq-box">
                <div><div class="mq-label">Hit DPS</div><div class="mq-val">${num(data.hit)}</div><div class="mq-sub">(${num(avgHitPerUnit)} avg ÷ ${fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div><div class="mq-label">DoT DPS</div><div class="mq-val ${dotColorClass}">${data.dot > 0 ? num(data.dot) : '-'}</div><div class="mq-sub">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div><div class="mq-label">Crit Rate / Dmg</div><div class="mq-val text-custom">${fix(data.critData.rate, 0)}% <span class="color-dim">|</span> x${fix(data.critData.cdmg/100, 2)}</div><div class="mq-sub">Avg Mult: x${fix(data.critData.avgMult, 3)}</div></div>
                ${data.summon > 0 ? `<div><div class="mq-label">Plane DPS</div><div class="mq-val text-accent-start">${num(data.summon)}</div><div class="mq-sub">Independent of Host Stats</div></div>` : `<div><div class="mq-label">Attack Rate</div><div class="mq-val text-accent-start">${fix(data.spa, 2)}s</div><div class="mq-sub">Base: ${data.baseStats.spa}s (Current Cap: ${data.spaCap}s)</div></div>`}
            </div>
        </div>

        <div class="deep-dive-trigger" onclick="toggleDeepDive(this)"><span>Full Calculation Log</span><span class="dd-arrow text-accent-start">▼</span></div>

        <div class="deep-dive-content hidden">
            <div class="dd-section">
                <div class="dd-title"><span>1. Base Damage Calculation</span></div>
                <table class="calc-table">
                    <tr>
                        <td class="mt-cell-label">Base Stats (Lv 1)</td>
                        <td class="mt-cell-formula"></td>
                        <td class="mt-cell-val">${num(data.baseStats.dmg)}</td>
                    </tr>
                    ${statPointsHtml}
                    ${data.isSSS ? `<tr><td class="mt-cell-label">SSS Rank Bonus</td><td class="mt-cell-formula"><span class="op">×</span>1.2</td><td class="mt-cell-val">${num(data.lvStats.dmg)}</td></tr>` : ''}
                    
                    ${traitRowsDmg}

                    <tr>
                        <td class="mt-cell-label text-accent-end">Relic Multiplier <button class="calc-info-btn" onclick="openInfoPopup('relic_multi')">?</button></td>
                        <td class="mt-cell-formula text-accent-end">${pct(data.relicBuffs.dmg)}</td>
                        <td class="mt-cell-val">${num(dmgAfterRelic)}</td>
                    </tr>
                    
                    ${headDmgHtml}

                    <tr>
                        <td class="mt-cell-label mt-pt-md">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="mt-cell-formula mt-pt-md mt-text-gold mt-text-bold">${pct(data.totalAdditivePct)}</td>
                        <td class="mt-cell-val calc-highlight mt-pt-md">${num(preConditionalDmg)}</td>
                    </tr>
                    <tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Base</td><td class="mt-cell-formula">${pct(baseSetDmg)}</td><td class="mt-cell-val"></td></tr>
                    ${tagDmg !== 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Tag Bonuses</td><td class="mt-cell-formula">${pct(tagDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${passiveDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">${pct(passiveDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${eternalDmg > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-accent-start opacity-70">↳ Eternal Stacks (Wave 12+)</td><td class="mt-cell-formula text-accent-start">${pct(eternalDmg)}</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${(data.abilityBuff || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-md text-custom opacity-70">↳ Ability Buffs</td><td class="mt-cell-formula text-custom">${pct(data.abilityBuff)}</td><td class="mt-cell-val"></td></tr>` : ''}

                    ${data.conditionalData ? `
                    <tr>
                        <td class="mt-cell-label mt-pt-md mt-text-orange mt-text-bold">${data.conditionalData.name}</td>
                        <td class="mt-cell-formula mt-pt-md mt-text-orange mt-text-bold">x${data.conditionalData.mult.toFixed(2)}</td>
                        <td class="mt-cell-val calc-highlight mt-pt-md">${num(data.dmgVal)}</td>
                    </tr>
                    ` : ''}

                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title"><span>2. Crit Averaging</span> <button class="calc-info-btn" onclick="openInfoPopup('crit_avg')">?</button></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Base Hit (Non-Crit)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${num(data.dmgVal)}</td></tr>
                    
                    <tr><td class="mt-cell-label mt-pl-sm mt-text-gold mt-text-bold">↳ Final Crit Rate</td><td class="mt-cell-formula"></td><td class="mt-cell-val mt-text-gold mt-text-bold">${fix(data.critData.rate, 1)}%</td></tr>
                    ${data.baseStats.crit > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Unit Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fix(data.baseStats.crit, 1)}%</td></tr>` : ''}
                    ${(data.traitObj.critRate || 0) > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Trait (${data.traitObj.name})</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fix(data.traitObj.critRate, 1)}%</td></tr>` : ''}
                    ${data.relicBuffs.cf > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Relics (Main+Sub)</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fix(data.relicBuffs.cf, 1)}%</td></tr>` : ''}
                    ${setTagCfTotal > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Set Bonus & Tags</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">${fix(setTagCfTotal, 1)}%</td></tr>` : ''}
                    
                    <tr><td class="mt-cell-label mt-pl-sm text-gray">↳ CDmg Base</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-gray font-normal">${fix(data.critData.baseCdmg,0)}</td></tr>
                    ${data.relicBuffs.cm > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Relics</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">+${fix(data.relicBuffs.cm, 1)}%</td></tr>` : ''}
                    ${setTagCmTotal > 0 ? `<tr><td class="mt-cell-label mt-pl-lg text-dim text-xs">• Set & Tags</td><td class="mt-cell-formula"></td><td class="mt-cell-val text-dim text-xs">+${fix(setTagCmTotal, 1)}%</td></tr>` : ''}

                    <tr><td class="mt-cell-label">Total Crit Damage</td><td class="mt-cell-formula">=</td><td class="mt-cell-val calc-highlight">${fix(data.critData.cdmg, 0)}%</td></tr>
                    <tr><td class="mt-cell-label text-right pr-2" colspan="2">Avg Damage Per Hit</td><td class="mt-cell-val calc-result">${num(data.dmgVal * data.critData.avgMult)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title"><span>3. SPA (Speed) Calculation</span> <button class="calc-info-btn" onclick="openInfoPopup('spa_calc')">?</button></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Base SPA (Lv 1)</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${data.baseStats.spa}s</td></tr>
                    <tr><td class="mt-cell-label">Stat Point Scaling</td><td class="mt-cell-formula"></td><td class="mt-cell-val">${fix(data.baseStats.spa * data.lvStats.spaMult, 3)}s</td></tr>
                    ${data.isSSS ? `<tr><td class="mt-cell-label">SSS Rank (-8%)</td><td class="mt-cell-formula"><span class="op">×</span>0.92</td><td class="mt-cell-val">${fix(data.lvStats.spa, 3)}s</td></tr>` : ''}
                    ${traitRowsSpa}
                    
                    <tr>
                        <td class="mt-cell-label mt-pt-md">Relic Multiplier</td>
                        <td class="mt-cell-formula mt-pt-md">-${fix(data.relicBuffs.spa, 1)}%</td>
                        <td class="mt-cell-val mt-pt-md">${fix(data.spaAfterRelic, 3)}s</td>
                    </tr>
                    <tr>
                        <td class="mt-cell-label mt-pt-md">Set Bonus + Passive + Abilities <button class="calc-info-btn" onclick="openInfoPopup('tag_logic')">?</button></td>
                        <td class="mt-cell-formula mt-pt-md">-${fix(data.setAndPassiveSpa, 1)}%</td>
                        <td class="mt-cell-val mt-pt-md">${fix(data.rawFinalSpa, 3)}s</td>
                    </tr>
                    <tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Set Base</td><td class="mt-cell-formula">-${fix(baseSetSpa, 1)}%</td><td class="mt-cell-val"></td></tr>
                    ${tagSpa !== 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Tag Bonuses</td><td class="mt-cell-formula">-${fix(tagSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}
                    ${passiveSpa > 0 ? `<tr><td class="mt-cell-label mt-pl-md opacity-70">↳ Unit Passive</td><td class="mt-cell-formula">-${fix(passiveSpa, 1)}%</td><td class="mt-cell-val"></td></tr>` : ''}

                    <tr><td class="mt-cell-label">Cap Check (${data.spaCap}s)</td><td class="mt-cell-formula">MAX</td><td class="mt-cell-val calc-result">${fix(data.spa, 3)}s</td></tr>
                </table>
            </div>

            ${data.extraAttacks ? `
            <div class="dd-section">
                 <div class="dd-title"><span>4. Attack Rate Multiplier</span> <button class="calc-info-btn" onclick="openInfoPopup('attack_rate')">?</button></div>
                 <table class="calc-table">
                    <tr><td class="mt-cell-label">Hits Per Attack</td><td class="mt-cell-val">${data.extraAttacks.hits}</td></tr>
                    <tr><td class="mt-cell-label">Crits Req. for Extra</td><td class="mt-cell-val">${data.extraAttacks.req}</td></tr>
                    <tr><td class="mt-cell-label">Attacks needed to Trig</td><td class="mt-cell-val">${fix(data.extraAttacks.attacksNeeded, 2)}</td></tr>
                    <tr><td class="mt-cell-label">Final Dps Mult</td><td class="mt-cell-val calc-highlight">x${fix(data.extraAttacks.mult, 3)}</td></tr>
                 </table>
            </div>` : ''}

${data.dot > 0 ? `
            <div class="dd-section">
                <div class="dd-title text-accent-end"><span>Status Effect (DoT)</span> <button class="calc-info-btn" onclick="openInfoPopup('dot_logic')">?</button></div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label calc-sub">Base Hit Ref</td><td class="mt-cell-val calc-sub">${num(data.dmgVal)}</td></tr>
                    
                    ${data.dotData.hasNative ? `
                        <tr><td class="mt-cell-label mt-pt-md">Native DoT (Burn/Bleed)</td><td class="mt-cell-val mt-pt-md">${num(data.dotData.nativeTick)}</td></tr>
                        <tr><td class="mt-cell-label calc-sub mt-pl-md">↳ Native DPS</td><td class="mt-cell-val calc-sub">${num(data.dotData.nativeDps)}</td></tr>
                    ` : ''}

                    ${data.dotData.hasRad ? `
                        <tr><td class="mt-cell-label mt-pt-md text-custom">Radiation (Fission)</td><td class="mt-cell-val mt-pt-md text-custom">${num(data.dotData.radTick)}</td></tr>
                        <tr><td class="mt-cell-label calc-sub mt-pl-md">↳ Radiation DPS</td><td class="mt-cell-val calc-sub">${num(data.dotData.radDps)}</td></tr>
                    ` : ''}

                    <tr><td class="mt-cell-label mt-pt-md border-dashed-top">Relic Multiplier</td><td class="mt-cell-val mt-pt-md border-dashed-top">x${fix(data.dotData.relicMult, 2)}</td></tr>
                    <tr><td class="mt-cell-label text-white border-dashed-top">Combined DoT DPS</td><td class="mt-cell-val text-accent-end border-dashed-top text-bold">${num(data.dot)}</td></tr>
                </table>
            </div>` : ''}
            
            ${summonSection}

            <div class="dd-section border-l-gold">
                <div class="dd-title text-gold">Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="mt-cell-label">Hit DPS (x${data.placement} Units)</td><td class="mt-cell-formula"><span class="op">×</span>${data.placement}</td><td class="mt-cell-val calc-highlight">${num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="mt-cell-label">DoT DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-end">${num(data.dot)}</td></tr>` : ''}
                    ${data.summon > 0 ? `<tr><td class="mt-cell-label">Plane DPS</td><td class="mt-cell-formula">+</td><td class="mt-cell-val text-accent-start">${num(data.summon)}</td></tr>` : ''}
                    <tr><td class="mt-cell-label mt-cell-val-lg text-white" colspan="2">TOTAL DPS</td><td class="mt-cell-val mt-text-gold mt-pt-md mt-cell-val-lg">${num(data.total)}</td></tr>
                </table>
            </div>
        </div>
    `;
}