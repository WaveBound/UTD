let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(); 
let cachedResults = {}; 
let currentGuideMode = 'current';

// New State for Kirito
let kiritoState = {
    realm: false,
    card: false
};

function formatStatBadge(text) {
    if(!text) return '';
    if (text.includes('<')) return text;
    
    // Updated Logic: Split by separators and remove them
    const parts = text.split(/[\/>,]+/).map(p => p.trim()).filter(p => p);

    return parts.map(part => {
        return part.replace(/(Crit Dmg|Crit Damage)|(Crit Rate)|(Damage|Dmg)|(Spa|SPA)|(DoT|Buff Potency)|(Range|Rng)/gi, 
            (match, cdmg, crate, dmg, spa, dot, rng) => {
                if (cdmg) return '<span class="stat-badge stat-cdmg"><span class="stat-cdmg-text">Crit Dmg</span></span>';
                if (crate) return '<span class="stat-badge stat-crit">Crit Rate</span>';
                if (dmg) return '<span class="stat-badge stat-dmg">Dmg</span>';
                if (spa) return '<span class="stat-badge stat-spa">Spa</span>';
                if (dot) return '<span class="stat-badge stat-dot">' + match + '</span>';
                if (rng) return '<span class="stat-badge stat-range">Range</span>';
                return match;
            }
        );
    }).join(''); // Joined with no spacer because CSS gap handles spacing
}

function populateInjectorUnitSelect() {
    const sel = document.getElementById('injectorUnitSelect');
    sel.length = 1; 
    unitDatabase.forEach(u => {
        sel.add(new Option(u.name, u.id));
    });
}

function addCustomTrait() {
    const id1 = document.getElementById('db_t1').value;
    const id2 = document.getElementById('db_t2').value;
    const targetUnitId = document.getElementById('injectorUnitSelect').value;
    const t1 = traitsList.find(t => t.id === id1);
    const t2 = traitsList.find(t => t.id === id2);
    
    if (t1 && t2) {
        const combo = combineTraits(t1, t2);
        if (targetUnitId === 'all') {
            const allTraits = [...traitsList, ...customTraits];
            const alreadyExists = allTraits.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') {
                customTraits.push(combo);
                alert(`Added global custom trait: ${combo.name}`);
            } else alert("Trait combination already exists!");
        } else {
            if (!unitSpecificTraits[targetUnitId]) unitSpecificTraits[targetUnitId] = [];
            const unitList = unitSpecificTraits[targetUnitId];
            const alreadyExists = unitList.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') {
                unitList.push(combo);
                const uName = unitDatabase.find(u => u.id === targetUnitId).name;
                alert(`Added custom trait to ${uName}: ${combo.name}`);
            } else alert("Trait combination already exists for this unit!");
        }
        renderDatabase();
        if(document.getElementById('guidesPage').classList.contains('active')) renderGuides();
    }
}

function toggleCheckbox(checkbox, callback, isHypothetical = false) {
    checkbox.parentNode.classList.toggle('is-checked', checkbox.checked);
    if (isHypothetical) setGuideMode(checkbox.checked ? 'fixed' : 'current');
    else callback();
}

const toggleSubStats = (cb) => toggleCheckbox(cb, renderDatabase);
const toggleHeadPiece = (cb) => toggleCheckbox(cb, renderDatabase);
const toggleHypothetical = (cb) => toggleCheckbox(cb, null, true);
const toggleGuideSubStats = (cb) => toggleCheckbox(cb, renderGuides);
const toggleGuideHeadPiece = (cb) => toggleCheckbox(cb, renderGuides);

// New Function to handle Kirito's specific toggles (Handles both DB and Guide pages)
function toggleKiritoMode(mode, checkbox) {
    if (mode === 'realm') {
        kiritoState.realm = checkbox.checked;
        if (!checkbox.checked) kiritoState.card = false; // Reset card if realm is off
    } else if (mode === 'card') {
        kiritoState.card = checkbox.checked;
    }

    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    } else {
        renderDatabase();
    }
}

const getFilteredBuilds = () => globalBuilds.filter(b => {
    if (currentGuideMode === 'current' && (!statConfig.applyRelicCrit && (b.cf > 0 || b.cm > 0)) || (!statConfig.applyRelicDot && b.dot > 0)) return false;
    if (!statConfig.applyRelicDmg && b.dmg > 10 || !statConfig.applyRelicSpa && b.spa > 10) return false;
    return true;
});

const getSubCandidates = () => SUB_CANDIDATES.filter(c => !((!statConfig.applyRelicCrit && (c === 'cm' || c === 'cf')) || (!statConfig.applyRelicDot && c === 'dot') || (currentGuideMode === 'current' && c === 'cf')));

const applySubPiece = (testBuild, cand, mainStatType) => {
    let primaryTarget = cand;
    if (primaryTarget === mainStatType) {
        primaryTarget = 'range';
    }
    for (let k in PERFECT_SUBS) {
        if (k === mainStatType) continue;
        let multiplier = (k === primaryTarget) ? 6 : 1;
        testBuild[k] = (testBuild[k] || 0) + (PERFECT_SUBS[k] * multiplier);
    }
};

const getBestSubConfig = (build, stats, includeSubs, includeHead) => {
    if (!includeSubs && !includeHead) return { res: calculateDPS(stats, build, stats.context), desc: "" };
    
    let bestRes = { total: -1 };
    let bestCandKey = null;

    const candidates = getSubCandidates();
    if (candidates.length === 0 && includeHead) candidates.push('dmg');
    
    candidates.forEach(cand => {
        let testBuild = { ...build };
        if (includeSubs) { 
            applySubPiece(testBuild, cand, build.bodyType); 
            applySubPiece(testBuild, cand, build.legType); 
        }
        if (includeHead) applySubPiece(testBuild, cand, null);
        
        let res = calculateDPS(stats, testBuild, stats.context);
        if (res.total > bestRes.total) { 
            bestRes = res; 
            bestCandKey = cand;
        }
    });

    let descParts = [];
    let assignments = {};
    const getDisp = (k) => SUB_NAMES[k] || k;
    const resolve = (cand, main) => (cand === main ? 'range' : cand);

    if (bestCandKey) {
        if (includeHead) {
            const val = getDisp(bestCandKey);
            descParts.push(`Head: ${val}`);
            assignments.head = val;
        }
        if (includeSubs) {
            let bSub = resolve(bestCandKey, build.bodyType);
            let lSub = resolve(bestCandKey, build.legType);
            const bVal = getDisp(bSub);
            const lVal = getDisp(lSub);
            
            descParts.push(`Body: ${bVal}`);
            descParts.push(`Legs: ${lVal}`);
            
            assignments.body = bVal;
            assignments.legs = lVal;
        }
    }
    
    return { 
        res: bestRes, 
        desc: descParts.join(' <span style="color:#555">|</span> '), 
        assignments: assignments 
    };
};

// --- RENDER DB RESULTS ---
function getUnitResultsHTML(unit, effectiveStats) {
    cachedResults = cachedResults || {};
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    const isAbilActive = activeAbilityIds.has(unit.id); 
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    effectiveStats.id = unit.id;

    // --- KIRITO SPECIFIC LOGIC ---
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200;       // 200% DoT
        effectiveStats.dotDuration = 4; // 4 Seconds
        // Explicitly set stacks to hitCount (14) for Astral calculations
        effectiveStats.dotStacks = unit.stats.hitCount || 14; 
    }

    let unitResults = [];

    const formatBuildName = (name) => {
        let s = name.replace(/Crit Rate/g, '##CR##').replace(/Crit Dmg/g, '##CD##').replace(/Dmg/g, '##D##').replace(/DoT/g, '##DT##').replace(/Spa/g, '##S##').replace(/Range/g, '##R##');
        return s.replace(/##CR##/g, "<span style='color:var(--gold)'>Crit Rate</span>").replace(/##CD##/g, "<span style='background: linear-gradient(to right, #a855f7, #ff5555); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;'>Crit Dmg</span>").replace(/##D##/g, "<span style='color:#F5564F'>Dmg</span>").replace(/##DT##/g, "<span style='color:#4ade80'>DoT</span>").replace(/##S##/g, "<span style='color:#68E7F5'>Spa</span>").replace(/##R##/g, "<span style='color:#ffa500'>Range</span>");
    };

    const filteredBuilds = getFilteredBuilds();

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return; 
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);
        filteredBuilds.forEach(build => {
            let contextDmg = { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
            effectiveStats.context = contextDmg;
            let bestDmgConfig = getBestSubConfig(build, effectiveStats, includeSubs, includeHead);
            let resDmg = bestDmgConfig.res;

            let contextSpa = { level: 99, priority: 'spa', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
            effectiveStats.context = contextSpa;
            let bestSpaConfig = getBestSubConfig(build, effectiveStats, includeSubs, includeHead);
            let resSpa = bestSpaConfig.res;

            let suffix = isAbilActive ? '-ABILITY' : '-BASE';
            
            // Add Kirito specific suffix for caching
            if (unit.id === 'kirito') {
                if (kiritoState.realm) suffix += '-VR';
                if (kiritoState.card) suffix += '-CARD';
            }

            let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
            let headSuffix = includeHead ? '-HEAD' : '-NOHEAD';
            let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');
            
            if (!isNaN(resDmg.total)) {
                let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-dmg${subsSuffix}${headSuffix}`;
                cachedResults[id] = resDmg;
                unitResults.push({ id: id, buildName: formatBuildName(build.name), traitName: trait.name, dps: resDmg.total, spa: resDmg.spa, prio: "Dmg Stat", subVariant: bestDmgConfig.desc, isCustom: trait.isCustom });
            }
            if (!isNaN(resSpa.total) && resSpa.total > 0 && Math.abs(resSpa.total - resDmg.total) > 1) {
                let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-spa${subsSuffix}${headSuffix}`;
                cachedResults[id] = resSpa;
                unitResults.push({ id: id, buildName: formatBuildName(build.name), traitName: trait.name, dps: resSpa.total, spa: resSpa.spa, prio: "Spa Stat", subVariant: bestSpaConfig.desc, isCustom: trait.isCustom });
            }
        });
    });

    unitResults.sort((a, b) => b.dps - a.dps);
    if(unitResults.length === 0) return '<div style="padding:10px; color:#666;">No valid builds found.</div>';

    return unitResults.slice(0, 200).map((r, i) => {
        let rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
        if(r.isCustom) rankClass += ' is-custom';
        const searchText = (r.traitName + ' ' + r.buildName.replace(/<[^>]*>?/gm, '') + ' ' + r.prio).toLowerCase();
        const prioType = r.prio === 'Dmg Stat' ? 'dmg' : 'spa';

        return `
            <div class="build-row ${rankClass}" data-filter-text="${searchText}" data-prio-type="${prioType}">
                <div class="rank-number">#${i+1}</div>
                <div class="build-info" style="flex-grow:1;">
                    <span class="trait-tag" title="${r.traitName}">${r.traitName}</span>
                    <span class="build-name">${r.buildName}</span>
                    ${r.subVariant ? `<div class="build-variant"><span>${r.subVariant}</span></div>` : ''}
                    <div class="build-stats-row">
                        <span class="build-stat">SPA: ${r.spa.toFixed(2)}s</span>
                        <span class="build-stat" style="color:${r.prio === 'Dmg Stat' ? 'var(--gold)' : 'var(--custom)'};">[${r.prio}]</span>
                    </div>
                </div>
                <div class="build-right">
                    <div class="dps-container">
                        <span class="build-dps">${format(r.dps)}</span>
                        <span class="dps-label">DPS</span>
                    </div>
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                </div>
            </div>
        `;
    }).join('');
}

function toggleAbility(unitId, checkbox) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if(!unit) return;
    if (checkbox.checked) activeAbilityIds.add(unitId);
    else activeAbilityIds.delete(unitId);
    let currentStats = { ...unit.stats };
    if (checkbox.checked && unit.ability) Object.assign(currentStats, unit.ability);
    const html = getUnitResultsHTML(unit, currentStats);
    document.getElementById('results-' + unitId).innerHTML = html;
    const searchInput = checkbox.closest('.unit-card').querySelector('.search-container input');
    if(searchInput && searchInput.value) filterList(searchInput);
}

const updateCompareBtn = () => {
    const isDbPage = document.getElementById('dbPage').classList.contains('active');
    const btn = document.getElementById('compareBtn');
    const count = selectedUnitIds.size;
    document.getElementById('compareCount').innerText = count;
    btn.style.display = (count > 0 && isDbPage) ? 'block' : 'none';
    document.getElementById('selectAllBtn').innerText = (count === unitDatabase.length && count > 0) ? "Deselect All" : "Select All";
};

function toggleSelection(id) {
    if (selectedUnitIds.has(id)) {
        selectedUnitIds.delete(id);
        document.getElementById('card-' + id).classList.remove('is-selected');
    } else {
        selectedUnitIds.add(id);
        document.getElementById('card-' + id).classList.add('is-selected');
    }
    updateCompareBtn();
}

const selectAllUnits = () => { const alreadyAll = selectedUnitIds.size === unitDatabase.length; alreadyAll ? selectedUnitIds.clear() : unitDatabase.forEach(u => selectedUnitIds.add(u.id)); renderDatabase(); };

function openComparison() {
    if(selectedUnitIds.size === 0) return;
    const modal = document.getElementById('compareModal'), content = document.getElementById('compareContent');
    modal.style.display = 'flex';
    const selectedUnits = unitDatabase.filter(u => selectedUnitIds.has(u.id));
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    
    const findBest = (unitObj, statsObj, availableTraits) => {
        let bestResult = { total: -1 }, bestTraitName = "", bestBuildName = "", bestSpa = 0, bestPrio = "", bestVariant = "";
        statsObj.id = unitObj.id;
        const filteredBuilds = getFilteredBuilds();
        
        availableTraits.forEach(trait => {
            if(trait.id === 'none') return;
            let place = Math.min(unitObj.placement, trait.limitPlace || unitObj.placement);
            filteredBuilds.forEach(build => {
                [{ p: 'spa', ctx: { level: 99, priority: 'spa', wave: 25, isBoss: false, traitObj: trait, placement: place, isSSS: true } },
                 { p: 'dmg', ctx: { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: place, isSSS: true } }
                ].forEach(({p, ctx}) => {
                    statsObj.context = ctx;
                    let cfg = getBestSubConfig(build, statsObj, includeSubs, includeHead), res = cfg.res;
                    if (res.total > bestResult.total) {
                        bestResult = res;
                        bestPrio = p === 'dmg' ? "DMG" : "SPA";
                        bestTraitName = trait.name;
                        bestBuildName = build.name;
                        bestSpa = res.spa;
                        bestVariant = cfg.desc;
                    }
                });
            });
        });
        return bestResult.total !== -1 ? { u: unitObj, bestResult, bestTraitName, bestBuildName, bestSpa, bestPrio, bestVariant } : null;
    };

    let comparisonData = [];
    selectedUnits.forEach(u => {
        let effectiveStats = { ...u.stats };
        if (activeAbilityIds.has(u.id) && u.ability) Object.assign(effectiveStats, u.ability);
        
        // Custom logic for Comparison with Kirito settings (UPDATED TO 14 STACKS)
        if(u.id === 'kirito' && kiritoState.realm && kiritoState.card) {
             effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 14;
        }

        const std = findBest(u, effectiveStats, traitsList);
        if(std) comparisonData.push(std);
        const customSet = [...customTraits, ...(unitSpecificTraits[u.id] || [])];
        const cst = customSet.length > 0 ? findBest(u, effectiveStats, customSet) : null;
        if(cst) { cst.isCustom = true; comparisonData.push(cst); }
    });

    comparisonData.sort((a, b) => b.bestResult.total - a.bestResult.total);
    let html = `<table class="compare-table"><thead><tr><th style="width:25%">Unit</th><th>DPS</th><th>Best Meta Build</th></tr></thead><tbody>`;
    comparisonData.forEach(data => {
        const rowClass = data.isCustom ? 'comp-row-custom' : '';
        html += `<tr class="${rowClass}"><td><div class="comp-unit-wrap"><img src="${data.u.img}" class="comp-img"><div><div style="font-weight:bold; color:#fff;">${data.u.name}</div><span class="comp-sub">${data.isCustom ? 'Custom' : data.u.role}</span></div></div></td><td><div class="comp-highlight">${format(data.bestResult.total)}</div><span class="comp-sub">SPA: ${data.bestSpa.toFixed(3)}s</span></td><td><span class="comp-tag">${data.bestTraitName}</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">${data.bestBuildName} ${data.bestVariant ? `<span style="color:var(--success); font-weight:bold; margin-left:5px;">(${data.bestVariant})</span>` : ''} <span style="color:${data.bestPrio === 'SPA' ? 'var(--custom)' : 'var(--gold)'}; font-weight:bold; font-size:0.7rem;">[${data.bestPrio}]</span></div></td></tr>`;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function closeCompare() { document.getElementById('compareModal').style.display = 'none'; }

function renderDatabase() {
    const container = document.getElementById('dbPage');
    container.innerHTML = '';
    cachedResults = {}; 
    unitDatabase.forEach(unit => {
        const isAbilActive = activeAbilityIds.has(unit.id);
        let currentStats = { ...unit.stats };
        if (isAbilActive && unit.ability) Object.assign(currentStats, unit.ability);
        
        // Render Kirito Controls
        let kiritoControlsHtml = '';
        if (unit.id === 'kirito') {
            const isRealm = kiritoState.realm;
            const isCard = kiritoState.card;
            kiritoControlsHtml = `
                <div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02);">
                    <div class="toggle-wrapper">
                        <span>Virtual Realm</span>
                        <label>
                            <input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)">
                            <div class="mini-switch"></div>
                        </label>
                    </div>
                    ${isRealm ? `
                    <div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;">
                        <span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span>
                        <label>
                            <input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)">
                            <div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div>
                        </label>
                    </div>` : ''}
                </div>
            `;
        }

        const listHtml = getUnitResultsHTML(unit, currentStats);
        const card = document.createElement('div');
        card.className = 'unit-card';
        card.id = 'card-' + unit.id;
        if(selectedUnitIds.has(unit.id)) card.classList.add('is-selected');
        const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>Ability</span><label><input type="checkbox" class="ability-cb" ${isAbilActive ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)"><div class="mini-switch"></div></label></div>` : '<div></div>';
        const toolbarHtml = `<div class="unit-toolbar"><button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button>${abilityToggleHtml}</div>`;
        
        card.innerHTML = `<div class="unit-banner"><div class="placement-badge">Max Place: ${unit.placement}</div><img src="${unit.img}" class="unit-avatar"><div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div></div>${toolbarHtml}${kiritoControlsHtml}<div class="search-container" style="display:flex; gap:8px;"><input type="text" placeholder="Search..." style="flex-grow:1; width:auto; padding:6px; border-radius:5px; border:1px solid #333; background:#111; color:#fff; font-size:0.8rem;" onkeyup="filterList(this)"><select onchange="filterList(this)" style="width:90px; padding:0 0 0 5px; font-size:0.75rem; height:30px;"><option value="all">All Prio</option><option value="dmg">Dmg Stat</option><option value="spa">SPA Stat</option></select></div><div class="top-builds-list" id="results-${unit.id}">${listHtml}</div>`;
        container.appendChild(card);
    });
    updateCompareBtn();
}

const filterList = (e) => { const sc = e.closest('.search-container'); const iv = sc.querySelector('input').value.toLowerCase(); const sv = sc.querySelector('select').value; const rows = e.closest('.unit-card').querySelector('.top-builds-list').getElementsByClassName('build-row'); for(let i = 0; i < rows.length; i++) { const tm = rows[i].dataset.filterText && rows[i].dataset.filterText.includes(iv); const pm = sv === 'all' || sv === rows[i].dataset.prioType; rows[i].style.display = (tm && pm) ? "flex" : "none"; } };

const toggleDeepDive = () => { const c = document.getElementById('deepDiveContent'), a = document.getElementById('ddArrow'); c.style.display === 'none' ? (c.style.display = 'block', a.innerText = '▲') : (c.style.display = 'none', a.innerText = '▼'); };

// --- MATH MODAL LOGIC ---
function renderMathContent(data) {
    const pct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    const num = (n) => n.toLocaleString(undefined, {maximumFractionDigits: 1});
    const fix = (n, d=2) => n.toFixed(d);

    const levelMult = data.lvStats.dmgMult; 
    const avgHitPerUnit = data.dmgVal * data.critData.avgMult;
    
    const dmgAfterTrait = data.lvStats.dmg * (1 + data.traitBuffs.dmg/100);
    const dmgAfterRelic = dmgAfterTrait * (1 + data.relicBuffs.dmg/100);

    return `
        <div class="math-section">
            <div class="math-header">Snapshot Overview</div>
            <div class="math-row"><span>Total DPS</span><b style="color:var(--gold); font-size:1.1rem;">${num(data.total)}</b></div>
            <div class="math-row"><span>Placement</span><b>${data.placement} Unit(s)</b></div>
        </div>

        <div class="math-section" style="border-bottom:none; margin-bottom:15px;">
            <div class="math-header" style="color:#fff; opacity:0.8;">Quick Breakdown</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; border:1px solid #333;">
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Hit DPS</div><div style="color:#fff; font-weight:bold; font-size:0.9rem;">${num(data.hit)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">(${num(avgHitPerUnit)} avg ÷ ${fix(data.spa,2)}s) × ${data.placement}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">DoT DPS</div><div style="color:${data.dot > 0 ? 'var(--accent-end)' : '#555'}; font-weight:bold; font-size:0.9rem;">${data.dot > 0 ? num(data.dot) : '-'}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">${data.dot > 0 ? (data.hasStackingDoT ? `Stacking: x${data.placement} units` : `Limited: x1 unit only`) : 'No DoT'}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Crit Rate / Dmg</div><div style="color:var(--custom); font-weight:bold; font-size:0.9rem;">${fix(data.critData.rate, 0)}% <span style="color:#444">|</span> x${fix(data.critData.cdmg/100, 2)}</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Avg Mult: x${fix(data.critData.avgMult, 3)}</div></div>
                <div><div style="font-size:0.65rem; color:#888; text-transform:uppercase;">Attack Rate</div><div style="color:var(--accent-start); font-weight:bold; font-size:0.9rem;">${fix(data.spa, 2)}s</div><div style="font-size:0.7rem; color:#bbb; margin-top:2px;">Base: ${data.baseStats.spa}s (Cap: ${data.baseStats.spaCap}s)</div></div>
            </div>
        </div>

        <div class="deep-dive-trigger" onclick="toggleDeepDive()" style="background:rgba(255,255,255,0.1);"><span>Full Calculation Log</span><span id="ddArrow" style="color:var(--accent-start);">▼</span></div>

        <div id="deepDiveContent" style="display:none;">
            <div class="dd-section">
                <div class="dd-title">1. Base Damage Calculation</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base Stats (Lv 1)</td><td class="col-formula"></td><td class="col-val">${num(data.baseStats.dmg)}</td></tr>
                    <tr><td class="col-label">Level Scaling (Lv ${data.level})</td><td class="col-formula"><span class="op">×</span>${fix(levelMult, 3)}</td><td class="col-val">${num(data.baseStats.dmg * levelMult)}</td></tr>
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank Bonus</td><td class="col-formula"><span class="op">×</span>1.2</td><td class="col-val">${num(data.lvStats.dmg)}</td></tr>` : ''}
                    <tr><td class="col-label">Trait Multiplier</td><td class="col-formula">${pct(data.traitBuffs.dmg)}</td><td class="col-val">${num(dmgAfterTrait)}</td></tr>
                    <tr><td class="col-label" style="color:var(--accent-end);">Relic Stat Multiplier</td><td class="col-formula" style="color:var(--accent-end);">${pct(data.relicBuffs.dmg)}</td><td class="col-val">${num(dmgAfterRelic)}</td></tr>
                    <tr><td class="col-label">Set Bonus + Passive</td><td class="col-formula">${pct(data.setBuffs.dmg + data.passiveBuff)}</td><td class="col-val calc-highlight">${num(data.dmgVal)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title">2. Crit Averaging</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base Hit (Non-Crit)</td><td class="col-formula"></td><td class="col-val">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ Crit Rate</td><td class="col-formula"></td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.rate, 1)}%</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ CDmg Base</td><td class="col-formula"></td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.baseCdmg,0)}</td></tr>
                    <tr><td class="col-label" style="color:#888; padding-left:8px;">↳ Set Bonus</td><td class="col-formula">+</td><td class="col-val" style="color:#888; font-weight:normal;">${fix(data.critData.setCdmg,0)}</td></tr>
                    <tr><td class="col-label" style="color:var(--accent-start); padding-left:8px;">↳ Relic Stat (Multi)</td><td class="col-formula" style="color:var(--accent-start); font-size:0.7rem;">x(1+%)</td><td class="col-val" style="color:var(--accent-start); font-weight:normal;">${data.critData.relicCmPct}%</td></tr>
                    <tr><td class="col-label">Total Crit Damage</td><td class="col-formula">=</td><td class="col-val calc-highlight">${fix(data.critData.cdmg, 0)}%</td></tr>
                    <tr><td class="col-label" colspan="2" style="text-align:right; padding-right:10px;">Avg Damage Per Hit</td><td class="col-val calc-result">${num(data.dmgVal * data.critData.avgMult)}</td></tr>
                </table>
            </div>

            <div class="dd-section">
                <div class="dd-title">3. SPA (Speed) Calculation</div>
                <table class="calc-table">
                    <tr><td class="col-label">Base SPA (Lv 1)</td><td class="col-formula"></td><td class="col-val">${data.baseStats.spa}s</td></tr>
                    <tr><td class="col-label">Level Reductions</td><td class="col-formula"><span class="op">×</span>${fix(data.lvStats.spaMult, 3)}</td><td class="col-val">${fix(data.baseStats.spa * data.lvStats.spaMult, 3)}s</td></tr>
                    ${data.isSSS ? `<tr><td class="col-label">SSS Rank (-8%)</td><td class="col-formula"><span class="op">×</span>0.92</td><td class="col-val">${fix(data.lvStats.spa, 3)}s</td></tr>` : ''}
                    <tr><td class="col-label">Trait Reduction</td><td class="col-formula">-${fix(data.traitBuffs.spa, 1)}%</td><td class="col-val">${fix(data.lvStats.spa * (1 - data.traitBuffs.spa/100), 3)}s</td></tr>
                    <tr><td class="col-label">Relic & Set Reduction</td><td class="col-formula">-${fix(data.relicBuffs.spa + data.setBuffs.spa, 1)}%</td><td class="col-val">${fix(data.rawFinalSpa, 3)}s</td></tr>
                    <tr><td class="col-label">Cap Check (${data.baseStats.spaCap}s)</td><td class="col-formula">MAX</td><td class="col-val calc-result">${fix(data.spa, 3)}s</td></tr>
                </table>
            </div>

            ${data.dot > 0 ? `
            <div class="dd-section">
                <div class="dd-title" style="color:var(--accent-end);">4. Status Effect (DoT)</div>
                <table class="calc-table">
                    <tr><td class="col-label calc-sub">Base Hit Ref</td><td class="col-val calc-sub">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label">Tick % (Base+Trait)</td><td class="col-val">${data.dotData.base}%</td></tr>
                    <tr><td class="col-label">Relic Mult (x${fix(data.dotData.relicMult, 2)})</td><td class="col-val" style="color:var(--accent-end);">${fix(data.dotData.finalPct, 1)}%</td></tr>
                    <tr><td class="col-label">Active Stacks</td><td class="col-val">x${data.dotData.internal}</td></tr>
                    <tr><td class="col-label" style="color:var(--custom);">Crit Avg Mult</td><td class="col-val" style="color:var(--custom);">x${fix(data.critData.avgMult, 3)}</td></tr>
                    <tr><td class="col-label">Total Damage (Lifetime)</td><td class="col-val">${num(data.dotData.finalTick)}</td></tr>
                    <tr><td class="col-label calc-sub">Time Basis</td><td class="col-val calc-sub">${fix(data.dotData.timeUsed, 2)}s</td></tr>
                    <tr><td class="col-label" style="color:#fff;">DoT DPS (1 Unit)</td><td class="col-val" style="color:var(--accent-end);">${num(data.singleUnitDoT)}</td></tr>
                </table>
            </div>` : ''}

            <div class="dd-section" style="border-left-color:var(--gold);">
                <div class="dd-title" style="color:var(--gold);">5. Final Synthesis</div>
                <table class="calc-table">
                    <tr><td class="col-label">Hit DPS (x${data.placement} Units)</td><td class="col-formula"><span class="op">×</span>${data.placement}</td><td class="col-val calc-highlight">${num(data.hit)}</td></tr>
                    ${data.dot > 0 ? `<tr><td class="col-label">DoT DPS</td><td class="col-formula">+</td><td class="col-val" style="color:var(--accent-end);">${num(data.dot)}</td></tr>` : ''}
                    <tr><td class="col-label" colspan="2" style="font-size:1rem; color:#fff; padding-top:10px;">TOTAL DPS</td><td class="col-val" style="font-size:1.4rem; color:var(--gold); padding-top:10px;">${num(data.total)}</td></tr>
                </table>
            </div>
        </div>
    `;
}

const showMath = (id) => { const data = cachedResults[id]; if(!data) return; const modal = document.getElementById('mathModal'), content = document.getElementById('mathContent'); modal.style.display = "flex"; content.innerHTML = renderMathContent(data); };
const closeMath = () => document.getElementById('mathModal').style.display = "none";
const openPatchNotes = () => document.getElementById('patchModal').style.display = 'flex';
const closePatchNotes = () => document.getElementById('patchModal').style.display = 'none';

function setGuideMode(mode) {
    currentGuideMode = mode;
    if (mode === 'current') {
        statConfig.applyRelicCrit = false;
        statConfig.applyRelicDot = false;
    } else {
        statConfig.applyRelicCrit = true;
        statConfig.applyRelicDot = true;
    }
    const buttons = document.querySelectorAll('.guide-toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(buttons).find(btn => btn.innerText.toLowerCase().includes(mode === 'current' ? 'current' : 'hypothetical'));
    if(activeBtn) activeBtn.classList.add('active');
    
    const hypoCb = document.getElementById('globalHypothetical');
    const hypoLabel = document.getElementById('hypoLabel');

    if(hypoCb) {
        hypoCb.checked = (mode === 'fixed');
        if(mode === 'fixed') {
            hypoCb.parentNode.classList.add('is-checked');
            if(hypoLabel) hypoLabel.innerText = "Fixed Relics";
        } else {
            hypoCb.parentNode.classList.remove('is-checked');
            if(hypoLabel) hypoLabel.innerText = "Bugged Relics";
        }
    }
    
    const warning = document.getElementById('guideWarning');
    warning.style.display = (mode === 'current') ? 'block' : 'none';
    renderGuides(); 
    renderDatabase(); 
}

function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    unitDatabase.forEach(unit => { unitSelect.add(new Option(unit.name, unit.id)); });
    traitsList.forEach(trait => { 
        if (trait.id !== 'none') traitSelect.add(new Option(trait.name, trait.id)); 
    });
}

function getTopBuildsForGuide(unit, trait) {
    let results = [];
    let effectiveStats = { ...unit.stats };
    if (activeAbilityIds.has(unit.id) && unit.ability) Object.assign(effectiveStats, unit.ability);
    effectiveStats.id = unit.id;
    
    // --- NEW: APPLY KIRITO LOGIC TO GUIDES ---
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200;       // 200% DoT
        effectiveStats.dotDuration = 4; // 4 Seconds
        effectiveStats.dotStacks = unit.stats.hitCount || 14; 
    }
    // -----------------------------------------

    let actualPlacement = Math.min(unit.placement, trait.limitPlace || unit.placement);
    const includeSubs = document.getElementById('guideSubStats')?.checked ?? true;
    const includeHead = document.getElementById('guideHeadPiece')?.checked ?? false;

    const validBuilds = getFilteredBuilds();
    validBuilds.forEach(build => {
        ['dmg', 'spa'].forEach(p => {
            let ctx = { level: 99, priority: p, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
            effectiveStats.context = ctx;
            let cfg = getBestSubConfig(build, effectiveStats, includeSubs, includeHead);
            if (!results[build.name]) results[build.name] = { dps: -1, dmgCfg: null, spaCfg: null };
            if (p === 'dmg') results[build.name].dmgCfg = cfg;
            else results[build.name].spaCfg = cfg;
        });
    });

    return Object.entries(results).map(([name, data]) => {
        let finalCfg = data.dmgCfg.res.total >= data.spaCfg.res.total ? data.dmgCfg : data.spaCfg;
        let prio = data.dmgCfg.res.total >= data.spaCfg.res.total ? 'dmg' : 'spa';
        let set = SETS.find(s => s.id === globalBuilds.find(b => b.name === name)?.set);
        let build = globalBuilds.find(b => b.name === name);
        const getStatName = (t) => ({ dmg: 'Dmg', dot: 'DoT', cm: 'Crit Dmg', spa: 'SPA', cf: 'Crit Rate' }[t] || 'N/A');

        // Create structured data instead of just raw strings
        let mainStructs = [
            { label: 'BODY', stat: getStatName(build.bodyType) },
            { label: 'LEGS', stat: getStatName(build.legType) }
        ];

        let subStructs = [];
        if (finalCfg.assignments && Object.keys(finalCfg.assignments).length > 0) {
            if (finalCfg.assignments.head) subStructs.push({ label: 'HEAD', stat: finalCfg.assignments.head });
            if (finalCfg.assignments.body) subStructs.push({ label: 'BODY', stat: finalCfg.assignments.body });
            if (finalCfg.assignments.legs) subStructs.push({ label: 'LEGS', stat: finalCfg.assignments.legs });
        }
        
        return { 
            name: name, 
            dps: finalCfg.res.total, 
            prio: prio, 
            set: set?.name || 'Unknown', 
            mainStructs: mainStructs,
            subStructs: subStructs
        };
    }).sort((a, b) => b.dps - a.dps).slice(0, 3); // Top 3 builds
}

function renderGuides() {
    const guideGrid = document.getElementById('guideList');
    guideGrid.innerHTML = '';
    const selectedUnitId = document.getElementById('guideUnitSelect').value;
    const selectedTraitId = document.getElementById('guideTraitSelect').value;

    // --- GENERIC GUIDES ---
    const genericGuides = guideData.filter(d => !d.isCalculated);
    genericGuides.forEach(row => {
        if (selectedUnitId !== 'all' && unitDatabase.some(u => u.id === selectedUnitId)) return;
        const data = row[currentGuideMode]; 
        
        const card = document.createElement('div');
        card.className = 'guide-card';
        
        const imgHtml = row.img ? `<img src="${row.img}">` : '';
        
        // Format manual text into badges if possible
        const mainBadgeHtml = formatStatBadge(data.main);
        const subBadgeHtml = formatStatBadge(data.sub);

        card.innerHTML = `
            <div class="guide-card-header">
                <div class="guide-unit-info">
                    ${imgHtml}
                    <div>
                        <span style="display:block; line-height:1;">${row.unit}</span>
                        <span style="font-size:0.7rem; color:var(--accent-end); font-weight:bold;">${data.trait}</span>
                    </div>
                </div>
            </div>
            <div class="guide-card-body">
                <div class="guide-entry">
                    <div class="ge-header">
                        <span class="ge-rank" style="color:#aaa;">#1</span>
                        <span class="ge-set">${data.set}</span>
                    </div>
                    <div class="ge-stats-row">
                        <div class="ge-group">
                            <span class="ge-lbl">MAIN</span>
                            <div class="ge-badges">${mainBadgeHtml}</div>
                        </div>
                        <div class="ge-sep"></div>
                        <div class="ge-group">
                            <span class="ge-lbl">SUB</span>
                            <div class="ge-badges">${subBadgeHtml}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        guideGrid.appendChild(card);
    });

    // --- CALCULATED UNITS ---
    let unitsToDisplay = [];
    if (selectedUnitId !== 'all') {
        const unit = unitDatabase.find(u => u.id === selectedUnitId);
        if (unit) unitsToDisplay.push(unit);
    } else { unitsToDisplay = unitDatabase; }

    let calculatedUnits = unitsToDisplay.map(unit => {
        let traitToUse = null;
        if (selectedTraitId === 'auto') traitToUse = findOverallBestTraitForUnit(unit);
        else {
            traitToUse = traitsList.find(t => t.id === selectedTraitId);
            if (!traitToUse) traitToUse = customTraits.find(t => t.id === selectedTraitId);
            if (!traitToUse && unitSpecificTraits[unit.id]) traitToUse = unitSpecificTraits[unit.id].find(t => t.id === selectedTraitId);
        }
        if (!traitToUse) return null;
        const topBuilds = getTopBuildsForGuide(unit, traitToUse);
        if (topBuilds.length === 0) return null;
        return { unit: unit, trait: traitToUse, topBuilds: topBuilds, maxDps: topBuilds[0].dps };
    }).filter(item => item !== null);

    calculatedUnits.sort((a, b) => b.maxDps - a.maxDps);

    calculatedUnits.forEach(item => {
        const card = document.createElement('div');
        card.className = 'guide-card';

        // --- NEW: KIRITO CONTROLS INJECTED INTO CARD ---
        let kiritoGuideControls = '';
        if (item.unit.id === 'kirito') {
            const isRealm = kiritoState.realm;
            const isCard = kiritoState.card;
            kiritoGuideControls = `
                <div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02); padding-left:15px; padding-right:15px;">
                    <div class="toggle-wrapper">
                        <span>Virtual Realm</span>
                        <label>
                            <input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)">
                            <div class="mini-switch"></div>
                        </label>
                    </div>
                    ${isRealm ? `
                    <div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;">
                        <span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span>
                        <label>
                            <input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)">
                            <div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div>
                        </label>
                    </div>` : ''}
                </div>
            `;
        }
        // ------------------------------------------------

        let buildsHtml = item.topBuilds.map((build, index) => {
            let rankColor = index === 0 ? 'var(--gold)' : (index === 1 ? 'var(--silver)' : 'var(--bronze)');
            
            // Format badges using the new structure with labels
            let mainHtml = build.mainStructs.map(s => {
                return `<div class="stat-pair"><span class="stat-prefix">${s.label}</span>${formatStatBadge(s.stat)}</div>`;
            }).join('');

            let subHtml = build.subStructs.length > 0 
                ? build.subStructs.map(s => `<div class="stat-pair"><span class="stat-prefix">${s.label}</span>${formatStatBadge(s.stat)}</div>`).join('') 
                : '<span style="font-size:0.65rem; color:#555;">None</span>';

            return `
                <div class="guide-entry">
                    <div class="ge-header">
                        <span class="ge-rank" style="color:${rankColor}">#${index+1}</span>
                        <span class="ge-set">${build.name}</span>
                    </div>
                    <div class="ge-stats-row">
                        <div class="ge-group">
                            <span class="ge-lbl">MAIN Stat</span>
                            <div class="ge-badges">${mainHtml}</div>
                        </div>
                        <div class="ge-sep"></div>
                        <div class="ge-group">
                            <span class="ge-lbl">SUB Stat</span>
                            <div class="ge-badges">${subHtml}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="guide-card-header">
                <div class="guide-unit-info">
                    <img src="${item.unit.img}">
                    <div>
                        <span style="display:block; line-height:1;">${item.unit.name}</span>
                        <span style="font-size:0.75rem; color:var(--accent-end); font-weight:bold;">${item.trait.name}</span>
                    </div>
                </div>
                <div class="guide-dps-box">
                    <span class="guide-dps-val">${format(item.maxDps)}</span>
                    <span style="font-size:0.6rem; color:#666; font-weight:bold;">DPS</span>
                </div>
            </div>
            ${kiritoGuideControls}
            <div class="guide-card-body">
                ${buildsHtml}
            </div>
        `;
        guideGrid.appendChild(card);
    });
}

function findOverallBestTraitForUnit(unit) {
    let bestTrait = null; let maxDps = -1;
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const allToCheck = [...traitsList, ...customTraits, ...specificTraits];
    allToCheck.filter(t => t.id !== 'none').forEach(trait => {
        const topBuilds = getTopBuildsForGuide(unit, trait);
        if (topBuilds.length > 0 && topBuilds[0].dps > maxDps) {
            maxDps = topBuilds[0].dps; bestTrait = trait;
        }
    });
    return bestTrait;
}

const initCalcDropdown = () => { const s1 = document.getElementById('db_t1'), s2 = document.getElementById('db_t2'); traitsList.forEach(t => { s1.add(new Option(t.name, t.id)); s2.add(new Option(t.name, t.id)); }); s1.value = 'astral'; s2.value = 'none'; };

function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pid+'Page').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(pid)));
    const isDb = pid === 'db';
    document.getElementById('dbInjector').style.display = isDb ? 'flex' : 'none';
    document.getElementById('guidesToolbar').style.display = isDb ? 'none' : 'flex';
    document.getElementById('selectAllBtn').style.display = isDb ? 'block' : 'none';
    if (!isDb) document.getElementById('compareBtn').style.display = 'none';
    else updateCompareBtn();
    if (pid === 'guides') renderGuides();
}

const format = (n) => n >= 1e9 ? (n/1e9).toFixed(2) + 'B' : n >= 1e6 ? (n/1e6).toFixed(2) + 'M' : n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : n.toLocaleString(undefined, {maximumFractionDigits:0});

window.onload = () => { initCalcDropdown(); populateGuideDropdowns(); populateInjectorUnitSelect(); setGuideMode('current'); };