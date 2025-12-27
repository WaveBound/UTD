let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(); 
let cachedResults = {}; 
let unitBuildsCache = {}; // Cache for calculated build arrays
let currentGuideMode = 'current';

let kiritoState = { realm: false, card: false };

let tempGuideUnit = 'all';
let tempGuideTrait = 'auto';

// --- BADGE GENERATION ---
function getBadgeHtml(statKeyOrName) {
    if (!statKeyOrName) return '<span style="font-size:0.65rem; color:#444;">-</span>';
    
    let type = statKeyOrName.toLowerCase();
    let label = statKeyOrName;
    let innerContent = label;

    if (type === 'dmg' || type === 'damage') { type = 'dmg'; label = 'Dmg'; innerContent = 'Dmg'; }
    else if (type === 'spa') { type = 'spa'; label = 'SPA'; innerContent = 'SPA'; }
    else if (type === 'cm' || type === 'crit dmg' || type === 'crit damage') { 
        type = 'cdmg'; 
        label = 'Crit Dmg'; 
        innerContent = '<span class="stat-cdmg-text">Crit Dmg</span>'; 
    }
    else if (type === 'cf' || type === 'crit rate') { type = 'crit'; label = 'Crit Rate'; innerContent = 'Crit Rate'; }
    else if (type === 'dot') { type = 'dot'; label = 'DoT'; innerContent = 'DoT'; }
    else if (type === 'buff potency' || type === 'buff') { type = 'dot'; label = 'Buff Potency'; innerContent = 'Buff Potency'; }
    else if (type === 'range' || type === 'rng') { type = 'range'; label = 'Range'; innerContent = 'Range'; }

    return `<span class="stat-badge stat-${type}">${innerContent}</span>`;
}

function formatStatBadge(text) {
    if(!text) return '';
    if (text.includes('<')) return text;
    const parts = text.split(/[\/>,]+/).map(p => p.trim()).filter(p => p);
    return parts.map(part => getBadgeHtml(part)).join(''); 
}

function getUnitImgHtml(unit, imgClass = '', iconSizeClass = '') {
    const el = unit.stats && unit.stats.element;
    const elIcon = el ? elementIcons[el] : null;
    if (!elIcon) return `<img src="${unit.img}" class="${imgClass}">`;
    return `<div class="unit-img-wrapper"><img src="${unit.img}" class="${imgClass}"><img src="${elIcon}" class="element-icon ${iconSizeClass}"></div>`;
}

// --- TOGGLES ---
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

function toggleKiritoMode(mode, checkbox) {
    if (mode === 'realm') {
        kiritoState.realm = checkbox.checked;
        if (!checkbox.checked) kiritoState.card = false; 
    } else if (mode === 'card') {
        kiritoState.card = checkbox.checked;
    }
    if (document.getElementById('guidesPage').classList.contains('active')) renderGuides();
    else renderDatabase();
}

// --- CALCULATION HELPERS ---
const getFilteredBuilds = () => globalBuilds.filter(b => {
    if (currentGuideMode === 'current' && (!statConfig.applyRelicCrit && (b.cf > 0 || b.cm > 0)) || (!statConfig.applyRelicDot && b.dot > 0)) return false;
    if (!statConfig.applyRelicDmg && b.dmg > 10 || !statConfig.applyRelicSpa && b.spa > 10) return false;
    return true;
});

const getSubCandidates = () => SUB_CANDIDATES.filter(c => !((!statConfig.applyRelicCrit && (c === 'cm' || c === 'cf')) || (!statConfig.applyRelicDot && c === 'dot') || (currentGuideMode === 'current' && c === 'cf')));

const applySubPiece = (testBuild, cand, mainStatType) => {
    let primaryTarget = cand;
    if (primaryTarget === mainStatType) {
        primaryTarget = (mainStatType === 'range') ? 'dmg' : 'range';
    }
    for (let k in PERFECT_SUBS) {
        if (k === mainStatType) continue;
        let multiplier = (k === primaryTarget) ? 6 : 1;
        testBuild[k] = (testBuild[k] || 0) + (PERFECT_SUBS[k] * multiplier);
    }
};

const getBestSubConfig = (build, stats, includeSubs, headMode, optimizeFor = 'dps') => {
    let mode = headMode;
    if (mode === true) mode = 'auto';
    if (mode === false) mode = 'none';

    let headOptions = [];
    if (mode === 'auto') headOptions = ['sun_god', 'ninja'];
    else if (mode && mode !== 'none') headOptions = [mode];
    else headOptions = ['none'];
    
    let globalBestRes = { total: -1, range: -1 };
    let globalBestAssignments = {};
    let globalBestHead = 'none';

    headOptions.forEach(headType => {
        const actualIncludeHead = (headType !== 'none');
        stats.context.headPiece = headType;

        if (!includeSubs && !actualIncludeHead) {
            let res = calculateDPS(stats, build, stats.context);
            if(checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; globalBestAssignments = {}; globalBestHead = headType;
            }
            return;
        }

        let candidates = getSubCandidates();
        if (candidates.length === 0 && actualIncludeHead) candidates.push('dmg');
        
        if (!includeSubs && actualIncludeHead) {
             candidates = ['dmg']; 
        }

        candidates.forEach(cand => {
            let testBuild = { ...build };
            
            if (includeSubs) { 
                applySubPiece(testBuild, cand, build.bodyType); 
                applySubPiece(testBuild, cand, build.legType); 
            }
            
            if (actualIncludeHead) {
                applySubPiece(testBuild, cand, null);
            }
            
            let res = calculateDPS(stats, testBuild, stats.context);
            
            if (checkIsBetter(res, globalBestRes, optimizeFor)) {
                globalBestRes = res; 
                globalBestHead = headType;
                
                let assignments = {};
                const getDisp = (k) => SUB_NAMES[k] || k;
                const resolve = (cand, main) => {
                    if (cand === main) return (main === 'range') ? 'dmg' : 'range';
                    return cand;
                };

                if (actualIncludeHead) { const val = getDisp(cand); assignments.head = val; }
                if (includeSubs) {
                    let bSub = resolve(cand, build.bodyType);
                    let lSub = resolve(cand, build.legType);
                    assignments.body = getDisp(bSub);
                    assignments.legs = getDisp(lSub);
                }
                globalBestAssignments = assignments;
            }
        });
    });

    globalBestAssignments.selectedHead = globalBestHead;
    return { res: globalBestRes, desc: "", assignments: globalBestAssignments };
};

const checkIsBetter = (res, currentBest, optimizeFor) => {
    if (optimizeFor === 'range') {
        if (res.range > currentBest.range) return true;
        if (res.range === currentBest.range && res.total > currentBest.total) return true;
        return false;
    }
    return res.total > currentBest.total;
};

// --- DATA CALCULATION ---
function calculateUnitBuilds(unit, effectiveStats) {
    cachedResults = cachedResults || {};
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const activeTraits = [...traitsList, ...customTraits, ...specificTraits];
    const isAbilActive = activeAbilityIds.has(unit.id); 
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    
    const headsToProcess = includeHead ? ['sun_god', 'ninja'] : ['none'];

    effectiveStats.id = unit.id;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) {
        effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = unit.stats.hitCount || 14; 
    }

    let unitResults = [];
    const filteredBuilds = getFilteredBuilds();

    activeTraits.forEach(trait => {
        if (trait.id === 'none') return; 
        let actualPlacement = unit.placement;
        if (trait.limitPlace) actualPlacement = Math.min(unit.placement, trait.limitPlace);
        
        filteredBuilds.forEach(build => {
            headsToProcess.forEach(hMode => {
                let contextDmg = { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
                effectiveStats.context = contextDmg;
                let bestDmgConfig = getBestSubConfig(build, effectiveStats, includeSubs, hMode);
                let resDmg = bestDmgConfig.res;

                let contextSpa = { level: 99, priority: 'spa', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
                effectiveStats.context = contextSpa;
                let bestSpaConfig = getBestSubConfig(build, effectiveStats, includeSubs, hMode);
                let resSpa = bestSpaConfig.res;

                let suffix = isAbilActive ? '-ABILITY' : '-BASE';
                if (unit.id === 'kirito') { if (kiritoState.realm) suffix += '-VR'; if (kiritoState.card) suffix += '-CARD'; }
                let subsSuffix = includeSubs ? '-SUBS' : '-NOSUBS';
                let headSuffix = (hMode === 'sun_god') ? '-SUN' : (hMode === 'ninja' ? '-NINJA' : '-NOHEAD');
                let safeBuildName = build.name.replace(/[^a-zA-Z0-9]/g, '');

                if (!isNaN(resDmg.total)) {
                    let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-dmg${subsSuffix}${headSuffix}`;
                    cachedResults[id] = resDmg;
                    unitResults.push({ 
                        id: id, setName: build.name.split('(')[0].trim(), traitName: trait.name, dps: resDmg.total, spa: resDmg.spa, prio: "dmg",
                        mainStats: { body: build.bodyType, legs: build.legType },
                        subStats: bestDmgConfig.assignments,
                        headUsed: bestDmgConfig.assignments.selectedHead,
                        isCustom: trait.isCustom 
                    });
                }

                if (!isNaN(resSpa.total) && resSpa.total > 0 && Math.abs(resSpa.total - resDmg.total) > 1) {
                    let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-spa${subsSuffix}${headSuffix}`;
                    cachedResults[id] = resSpa;
                    unitResults.push({ 
                        id: id, setName: build.name.split('(')[0].trim(), traitName: trait.name, dps: resSpa.total, spa: resSpa.spa, prio: "spa",
                        mainStats: { body: build.bodyType, legs: build.legType },
                        subStats: bestSpaConfig.assignments,
                        headUsed: bestSpaConfig.assignments.selectedHead,
                        isCustom: trait.isCustom 
                    });
                }

                if (unit.id === 'law') {
                     let contextRange = { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
                     effectiveStats.context = contextRange;
                     let bestRangeConfig = getBestSubConfig(build, effectiveStats, includeSubs, hMode, 'range');
                     let resRange = bestRangeConfig.res;

                     if (!isNaN(resRange.total)) {
                        let id = `${unit.id}${suffix}-${trait.id}-${safeBuildName}-range${subsSuffix}${headSuffix}`;
                        cachedResults[id] = resRange;
                        unitResults.push({ 
                            id: id, setName: build.name.split('(')[0].trim(), traitName: trait.name, dps: resRange.total, spa: resRange.spa, range: resRange.range, prio: "range",
                            mainStats: { body: build.bodyType, legs: build.legType },
                            subStats: bestRangeConfig.assignments,
                            headUsed: bestRangeConfig.assignments.selectedHead,
                            isCustom: trait.isCustom 
                        });
                     }
                }
            });
        });
    });

    if (unit.id === 'law') unitResults.sort((a, b) => (b.range || 0) - (a.range || 0));
    else unitResults.sort((a, b) => b.dps - a.dps);
    
    return unitResults;
}

// Generate HTML for a single row
function generateBuildRowHTML(r, i) {
    let rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
    if(r.isCustom) rankClass += ' is-custom';
    
    let prioLabel = 'DMG STAT';
    let prioColor = '#ff5555';
    if (r.prio === 'spa') { prioLabel = 'SPA STAT'; prioColor = 'var(--custom)'; }
    if (r.prio === 'range') { prioLabel = 'RANGE STAT'; prioColor = '#4caf50'; }

    const mainBodyBadge = getBadgeHtml(r.mainStats.body);
    const mainLegsBadge = getBadgeHtml(r.mainStats.legs);

    let headHtml = '';
    if (r.headUsed && r.headUsed !== 'none') {
        let isSun = r.headUsed === 'sun_god';
        let headName = isSun ? 'Sun God' : 'Master Ninja';
        let headColor = isSun ? '#38bdf8' : '#ffffff'; 
        
        headHtml = `<div class="stat-line"><span class="sl-label">HEAD</span> <span style="display:inline-flex; align-items:center; justify-content:center; padding:0 4px; height:18px; border-radius:4px; font-size:0.6rem; font-weight:800; text-transform:uppercase; border:1px solid ${headColor}; white-space:nowrap; background:rgba(0,0,0,0.4); color:${headColor};">${headName}</span></div>`;
    }

    let subInnerHtml = '';
    const s = r.subStats;
    const hasSubs = s.head || s.body || s.legs;

    if (hasSubs) {
        if (s.head) subInnerHtml += `<div class="stat-line"><span class="sl-label">SUB</span> ${getBadgeHtml(s.head)}</div>`;
        if (s.body) subInnerHtml += `<div class="stat-line"><span class="sl-label">BODY</span> ${getBadgeHtml(s.body)}</div>`;
        if (s.legs) subInnerHtml += `<div class="stat-line"><span class="sl-label">LEGS</span> ${getBadgeHtml(s.legs)}</div>`;
    } else {
        subInnerHtml = '<span style="font-size:0.65rem; color:#555;">None</span>';
    }

    let displayVal = format(r.dps);
    let displayLabel = "DPS";
    if (r.prio === 'range') {
            displayVal = r.range.toFixed(1);
            displayLabel = "RANGE";
    }

    return `
        <div class="build-row ${rankClass}">
            <div class="br-header">
                <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                    <span class="br-rank">#${i+1}</span>
                    <span class="br-set">${r.setName}</span>
                    <span class="br-sep">/</span>
                    <span class="br-trait">${r.traitName}</span>
                </div>
                <span class="prio-badge" style="color:${prioColor}; border-color:${prioColor};">${prioLabel}</span>
            </div>
            <div class="br-grid">
                <div class="br-col">
                    <div class="br-col-title">MAIN STAT</div>
                    ${headHtml}
                    <div class="stat-line"><span class="sl-label">BODY</span> ${mainBodyBadge}</div>
                    <div class="stat-line"><span class="sl-label">LEGS</span> ${mainLegsBadge}</div>
                </div>
                <div class="br-col" style="border-left:1px solid rgba(255,255,255,0.05); padding-left:8px;">
                    <div class="br-col-title">SUB STAT</div>
                    ${subInnerHtml}
                </div>
                <div class="br-res-col">
                    <div class="dps-container">
                        <span class="build-dps">${displayVal}</span>
                        <span class="dps-label">${displayLabel}</span>
                    </div>
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                </div>
            </div>
        </div>
    `;
}

// Update the visible list based on filters
function updateBuildListDisplay(unitId) {
    const card = document.getElementById('card-' + unitId);
    if (!card) return;
    
    const listContainer = document.getElementById('results-' + unitId);
    if(!unitBuildsCache[unitId] || unitBuildsCache[unitId].length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; color:#666;">No valid builds found.</div>';
        return;
    }

    const searchInput = card.querySelector('.search-container input').value.toLowerCase();
    const prioSelect = card.querySelector('select[data-filter="prio"]').value;
    const setSelect = card.querySelector('select[data-filter="set"]').value;
    const headSelect = card.querySelector('select[data-filter="head"]').value;

    const allBuilds = unitBuildsCache[unitId];

    const filtered = allBuilds.filter(r => {
        let headSearchName = '';
        if (r.headUsed === 'sun_god') headSearchName = 'Sun God Head';
        else if (r.headUsed === 'ninja') headSearchName = 'Ninja Head';
        
        const searchText = (r.traitName + ' ' + r.setName + ' ' + r.prio + ' ' + headSearchName).toLowerCase();

        const textMatch = searchText.includes(searchInput);
        const prioMatch = prioSelect === 'all' || r.prio === prioSelect;
        const setMatch = setSelect === 'all' || r.setName === setSelect;
        const headMatch = headSelect === 'all' || (r.headUsed || 'none') === headSelect;

        return textMatch && prioMatch && setMatch && headMatch;
    });

    if(filtered.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; color:#666;">No matches found.</div>';
        return;
    }

    // SLICE TOP 50
    let displaySlice = filtered.slice(0, 50);

    // Force "Astral" to show for Kirito even if low ranked
    if(unitId === 'kirito' && searchInput === '') {
        const astralBuild = filtered.find(b => b.traitName === 'Astral');
        if(astralBuild && !displaySlice.includes(astralBuild)) {
            displaySlice.push(astralBuild);
        }
    }

    listContainer.innerHTML = displaySlice.map((r, i) => generateBuildRowHTML(r, i)).join('');
}

// --- INTERACTION HANDLERS ---
function toggleAbility(unitId, checkbox) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if(!unit) return;
    if (checkbox.checked) activeAbilityIds.add(unitId); else activeAbilityIds.delete(unitId);
    let currentStats = { ...unit.stats };
    if (checkbox.checked && unit.ability) Object.assign(currentStats, unit.ability);
    
    const results = calculateUnitBuilds(unit, currentStats);
    unitBuildsCache[unitId] = results;
    updateBuildListDisplay(unitId);
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
    const card = document.getElementById('card-' + id);
    const btn = card.querySelector('.select-btn');
    if (selectedUnitIds.has(id)) { selectedUnitIds.delete(id); card.classList.remove('is-selected'); btn.innerText = "Select"; } 
    else { selectedUnitIds.add(id); card.classList.add('is-selected'); btn.innerText = "Selected"; }
    updateCompareBtn();
}

const selectAllUnits = () => { const alreadyAll = selectedUnitIds.size === unitDatabase.length; alreadyAll ? selectedUnitIds.clear() : unitDatabase.forEach(u => selectedUnitIds.add(u.id)); renderDatabase(); };

function openComparison() {
    if(selectedUnitIds.size === 0) return;
    toggleModal('compareModal', true);
    const content = document.getElementById('compareContent');
    const selectedUnits = unitDatabase.filter(u => selectedUnitIds.has(u.id));
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    const comparisonHeadMode = includeHead ? 'auto' : 'none';

    const findBest = (unitObj, statsObj, availableTraits) => {
        let bestResult = { total: -1 }, bestTraitName = "", bestBuildName = "", bestSpa = 0, bestPrio = "";
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
                    let cfg = getBestSubConfig(build, statsObj, includeSubs, comparisonHeadMode);
                    let res = cfg.res;
                    if (res.total > bestResult.total) {
                        bestResult = res; bestPrio = p === 'dmg' ? "DMG" : "SPA"; bestTraitName = trait.name; bestBuildName = build.name; bestSpa = res.spa;
                    }
                });
            });
        });
        return bestResult.total !== -1 ? { u: unitObj, bestResult, bestTraitName, bestBuildName, bestSpa, bestPrio } : null;
    };

    let comparisonData = [];
    selectedUnits.forEach(u => {
        let effectiveStats = { ...u.stats };
        if (activeAbilityIds.has(u.id) && u.ability) Object.assign(effectiveStats, u.ability);
        if(u.id === 'kirito' && kiritoState.realm && kiritoState.card) { effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 14; }
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
        html += `<tr class="${rowClass}"><td><div class="comp-unit-wrap">${getUnitImgHtml(data.u, 'comp-img', 'small')}<div><div style="font-weight:bold; color:#fff;">${data.u.name}</div><span class="comp-sub">${data.isCustom ? 'Custom' : data.u.role}</span></div></div></td><td><div class="comp-highlight">${format(data.bestResult.total)}</div><span class="comp-sub">SPA: ${data.bestSpa.toFixed(3)}s</span></td><td><span class="comp-tag">${data.bestTraitName}</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">${data.bestBuildName} <span style="color:${data.bestPrio === 'SPA' ? 'var(--custom)' : 'var(--gold)'}; font-weight:bold; font-size:0.7rem;">[${data.bestPrio}]</span></div></td></tr>`;
    });
    html += `</tbody></table>`;
    content.innerHTML = html;
}

function closeCompare() { toggleModal('compareModal', false); }

function renderDatabase() {
    const container = document.getElementById('dbPage');
    container.innerHTML = '';
    cachedResults = {}; 
    unitBuildsCache = {}; 
    
    unitDatabase.forEach(unit => {
        const isAbilActive = activeAbilityIds.has(unit.id);
        let currentStats = { ...unit.stats };
        if (isAbilActive && unit.ability) Object.assign(currentStats, unit.ability);
        
        let kiritoControlsHtml = '';
        if (unit.id === 'kirito') {
            const isRealm = kiritoState.realm;
            const isCard = kiritoState.card;
            kiritoControlsHtml = `<div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02);"><div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>${isRealm ? `<div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;"><span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div></label></div>` : ''}</div>`;
        }

        const results = calculateUnitBuilds(unit, currentStats);
        unitBuildsCache[unit.id] = results;

        const card = document.createElement('div');
        card.className = 'unit-card';
        card.id = 'card-' + unit.id;
        if(selectedUnitIds.has(unit.id)) card.classList.add('is-selected');
        const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>Ability</span><label><input type="checkbox" class="ability-cb" ${isAbilActive ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)"><div class="mini-switch"></div></label></div>` : '<div></div>';
        const toolbarHtml = `<div class="unit-toolbar"><button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button>${abilityToggleHtml}</div>`;
        
        const searchControls = `
        <div class="search-container" style="flex-direction:column; gap:8px;">
            <div style="display:flex; gap:5px; width:100%;">
                <input type="text" placeholder="Search traits..." style="flex-grow:1; padding:6px; border-radius:5px; border:1px solid #333; background:#111; color:#fff; font-size:0.8rem;" onkeyup="filterList(this)">
                <select onchange="filterList(this)" data-filter="prio" style="width:75px; padding:0 0 0 4px; font-size:0.7rem; height:30px;">
                    <option value="all">All Prio</option>
                    <option value="dmg">Dmg</option>
                    <option value="spa">SPA</option>
                    <option value="range">Range</option>
                </select>
            </div>
            <div style="display:flex; gap:5px; width:100%;">
                <select onchange="filterList(this)" data-filter="set" style="flex:1; padding:0 0 0 4px; font-size:0.7rem; height:30px;">
                    <option value="all">All Sets</option>
                    <option value="Master Ninja">Ninja Set</option>
                    <option value="Sun God">Sun God Set</option>
                    <option value="Laughing Captain">Laughing Set</option>
                    <option value="Ex Captain">Ex Set</option>
                </select>
                <select onchange="filterList(this)" data-filter="head" style="flex:1; padding:0 0 0 4px; font-size:0.7rem; height:30px;">
                    <option value="all">All Heads</option>
                    <option value="sun_god">Sun God</option>
                    <option value="ninja">Ninja</option>
                    <option value="none">No Head</option>
                </select>
            </div>
        </div>`;

        card.innerHTML = `<div class="unit-banner"><div class="placement-badge">Max Place: ${unit.placement}</div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div></div>${toolbarHtml}${kiritoControlsHtml}${searchControls}<div class="top-builds-list" id="results-${unit.id}"></div>`;
        container.appendChild(card);
        
        updateBuildListDisplay(unit.id);
    });
    updateCompareBtn();
}

const filterList = (e) => { 
    const unitId = e.closest('.unit-card').id.replace('card-', '');
    updateBuildListDisplay(unitId);
};

const toggleDeepDive = () => { const c = document.getElementById('deepDiveContent'), a = document.getElementById('ddArrow'); c.style.display === 'none' ? (c.style.display = 'block', a.innerText = '▲') : (c.style.display = 'none', a.innerText = '▼'); };

// --- MATH MODAL LOGIC (UPDATED WITH BETTER VISUALS) ---
function renderMathContent(data) {
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
            traitRowsDmg += `<tr><td class="col-label" style="padding-left:10px;">↳ ${t.name}</td><td class="col-formula">${pct(tDmg)}</td><td class="col-val">${num(nextDmg)}</td></tr>`;
            runningDmg = nextDmg;

            const tSpa = t.spa || 0;
            const nextSpa = runningSpa * (1 - tSpa/100);
            traitRowsSpa += `<tr><td class="col-label" style="padding-left:10px;">↳ ${t.name}</td><td class="col-formula">-${fix(tSpa,1)}%</td><td class="col-val">${fix(nextSpa,3)}s</td></tr>`;
            runningSpa = nextSpa;
        });
    } else {
        const dmgAfterTrait = runningDmg * (1 + data.traitBuffs.dmg/100);
        traitRowsDmg = `<tr><td class="col-label">Trait Multiplier</td><td class="col-formula">${pct(data.traitBuffs.dmg)}</td><td class="col-val">${num(dmgAfterTrait)}</td></tr>`;
        const spaAfterTrait = runningSpa * (1 - data.traitBuffs.spa/100);
        traitRowsSpa = `<tr><td class="col-label">Trait Reduction</td><td class="col-formula">-${fix(data.traitBuffs.spa, 1)}%</td><td class="col-val">${fix(spaAfterTrait, 3)}s</td></tr>`;
        runningDmg = dmgAfterTrait; runningSpa = spaAfterTrait;
    }

    const dmgAfterRelic = runningDmg * (1 + data.relicBuffs.dmg/100);
    const finalSpaStep = runningSpa * (1 - (data.relicBuffs.spa + data.setBuffs.spa + (data.passiveSpaBuff||0))/100);

    // HEAD PIECE BREAKDOWN - DMG
    let headDmgHtml = '';
    if (data.headBuffs && data.headBuffs.type === 'sun_god') {
        const uptimePct = (data.headBuffs.uptime || 0);
        const spaVal = fix(data.spa, 2);
        const trigTime = fix(data.headBuffs.trigger, 2);
        headDmgHtml = `
        <tr style="background:rgba(255,215,0,0.08); border-left:3px solid var(--gold);">
            <td colspan="3" style="padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.75rem; color:var(--gold); font-weight:900; letter-spacing:0.5px;">SUN GOD PASSIVE</span>
                    <span title="The Sun God Head grants a Damage Buff equal to your Range stat.\nIt triggers every 6 attacks and lasts for 7 seconds.\nUptime = 7s / (6 * SPA)." 
                          style="cursor:help; font-size:0.7rem; background:rgba(0,0,0,0.5); color:#fff; width:16px; height:16px; border-radius:50%; text-align:center; line-height:16px;">?</span>
                </div>
                <div style="font-size:0.75rem; color:#eee; display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:6px;">
                    <span style="opacity:0.8;">Trigger Rate:</span> <span style="text-align:right; font-family:'Consolas', monospace;">Every ${trigTime}s</span>
                    <span style="opacity:0.8;">Buff Duration:</span> <span style="text-align:right; font-family:'Consolas', monospace;">7.00s</span>
                    <span style="opacity:0.8;">Uptime %:</span> <span style="text-align:right; font-family:'Consolas', monospace; color:${uptimePct >= 1 ? '#4ade80' : '#ffcc00'}">${fix(uptimePct*100,1)}%</span>
                    <span style="opacity:0.8;">Range Stat:</span> <span style="text-align:right; font-family:'Consolas', monospace; color:#ffa500;">${fix(data.range,1)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;">
                    <span style="color:#fff; font-size:0.75rem; font-weight:bold;">Avg Damage Buff</span>
                    <span style="color:var(--gold); font-size:0.85rem; font-weight:900;">+${num(data.headBuffs.dmg)}%</span>
                </div>
            </td>
        </tr>`;
    }

    // HEAD PIECE BREAKDOWN - DOT
    let headDotRow = '';
    if (data.headBuffs && data.headBuffs.type === 'ninja') {
        const uptimePct = (data.headBuffs.uptime || 0);
        const spaVal = fix(data.spa, 2);
        const trigTime = fix(data.headBuffs.trigger, 2);
        headDotRow = `
        <tr style="background:rgba(6,182,212,0.08); border-left:3px solid var(--custom);">
            <td colspan="2" style="padding:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.75rem; color:var(--custom); font-weight:900; letter-spacing:0.5px;">NINJA HEAD PASSIVE</span>
                    <span title="Master Ninja Head grants +20% DoT Potency.\nIt triggers every 5 attacks and lasts for 10 seconds.\nUptime = 10s / (5 * SPA)." 
                          style="cursor:help; font-size:0.7rem; background:rgba(0,0,0,0.5); color:#fff; width:16px; height:16px; border-radius:50%; text-align:center; line-height:16px;">?</span>
                </div>
                <div style="font-size:0.75rem; color:#eee; display:grid; grid-template-columns:1fr 1fr; gap:4px;">
                    <span style="opacity:0.8;">Trigger Rate:</span> <span style="text-align:right; font-family:'Consolas', monospace;">Every ${trigTime}s</span>
                    <span style="opacity:0.8;">Duration:</span> <span style="text-align:right; font-family:'Consolas', monospace;">10.00s</span>
                    <span style="opacity:0.8;">Uptime:</span> <span style="text-align:right; font-family:'Consolas', monospace; color:${uptimePct >= 1 ? '#4ade80' : '#ffcc00'}">${fix(uptimePct*100,1)}%</span>
                </div>
            </td>
            <td class="col-val" style="color:var(--custom); vertical-align:middle; font-size:0.85rem;">+${fix(data.headBuffs.dot, 2)}%</td>
        </tr>`;
    }

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
                    ${traitRowsDmg}
                    <tr><td class="col-label" style="color:var(--accent-end);">Relic Stat Multiplier</td><td class="col-formula" style="color:var(--accent-end);">${pct(data.relicBuffs.dmg)}</td><td class="col-val">${num(dmgAfterRelic)}</td></tr>
                    
                    ${headDmgHtml}

                    <tr><td class="col-label">Set Bonus + Passive + Head</td><td class="col-formula">${pct(data.setBuffs.dmg + data.passiveBuff)}</td><td class="col-val calc-highlight">${num(data.dmgVal)}</td></tr>
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
                    ${traitRowsSpa}
                    <tr><td class="col-label">Relic, Set & Passive</td><td class="col-formula">-${fix(data.relicBuffs.spa + data.setBuffs.spa + (data.passiveSpaBuff || 0), 1)}%</td><td class="col-val">${fix(finalSpaStep, 3)}s</td></tr>
                    <tr><td class="col-label">Cap Check (${data.baseStats.spaCap}s)</td><td class="col-formula">MAX</td><td class="col-val calc-result">${fix(data.spa, 3)}s</td></tr>
                </table>
            </div>

            ${data.dot > 0 ? `
            <div class="dd-section">
                <div class="dd-title" style="color:var(--accent-end);">4. Status Effect (DoT)</div>
                <table class="calc-table">
                    <tr><td class="col-label calc-sub">Base Hit Ref</td><td class="col-val calc-sub">${num(data.dmgVal)}</td></tr>
                    <tr><td class="col-label">Base Tick %</td><td class="col-val">${fix(data.dotData.baseNoHead, 2)}%</td></tr>
                    ${headDotRow}
                    <tr><td class="col-label" style="font-weight:bold;">Total Tick %</td><td class="col-val" style="font-weight:bold;">${fix(data.dotData.base, 2)}%</td></tr>
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

// --- MODALS ---
const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = show ? 'flex' : 'none';
};

const showMath = (id) => { const data = cachedResults[id]; if(!data) return; const content = document.getElementById('mathContent'); content.innerHTML = renderMathContent(data); toggleModal('mathModal', true); };
const closeMath = () => toggleModal('mathModal', false);
const openPatchNotes = () => toggleModal('patchModal', true);
const closePatchNotes = () => toggleModal('patchModal', false);

function setGuideMode(mode) {
    currentGuideMode = mode;
    if (mode === 'current') { statConfig.applyRelicCrit = false; statConfig.applyRelicDot = false; } 
    else { statConfig.applyRelicCrit = true; statConfig.applyRelicDot = true; }

    const isFixed = (mode === 'fixed');
    const labelText = isFixed ? "Fixed Relics" : "Bugged Relics";
    
    ['globalHypothetical', 'guideHypoToggle'].forEach(id => {
        const cb = document.getElementById(id); if(cb) { cb.checked = isFixed; cb.parentNode.classList.toggle('is-checked', isFixed); }
    });
    
    document.getElementById('hypoLabel').innerText = labelText;
    document.getElementById('guideHypoLabel').innerText = labelText;
    document.getElementById('guideWarning').style.display = (mode === 'current') ? 'block' : 'none';
    renderGuides(); renderDatabase(); 
}

function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    unitSelect.innerHTML = '<option value="all">All Units</option>';
    traitSelect.innerHTML = '<option value="auto">Auto (Best Trait)</option>';
    unitDatabase.forEach(unit => { unitSelect.add(new Option(unit.name, unit.id)); });
    traitsList.forEach(trait => { if (trait.id !== 'none') traitSelect.add(new Option(trait.name, trait.id)); });
}

function openGuideConfig() {
    tempGuideUnit = document.getElementById('guideUnitSelect').value;
    tempGuideTrait = document.getElementById('guideTraitSelect').value;
    renderGuideConfigUI();
    toggleModal('guideConfigModal', true);
}
function closeGuideConfig() { toggleModal('guideConfigModal', false); }
function selectGuideUnit(id) { tempGuideUnit = id; renderGuideConfigUI(); }
function selectGuideTrait(id) { tempGuideTrait = id; renderGuideConfigUI(); }

function renderGuideConfigUI() {
    const unitGrid = document.getElementById('guideConfigUnitGrid');
    const traitList = document.getElementById('guideConfigTraitList');
    let unitsHtml = `<div class="config-item ${tempGuideUnit === 'all' ? 'selected' : ''}" onclick="selectGuideUnit('all')"><div style="width:50px; height:50px; border-radius:50%; border:2px solid #555; background:#000; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff;">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => { unitsHtml += `<div class="config-item ${tempGuideUnit === u.id ? 'selected' : ''}" onclick="selectGuideUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`; });
    unitGrid.innerHTML = unitsHtml;

    let availableTraits = [...traitsList];
    if (tempGuideUnit !== 'all') { const specific = unitSpecificTraits[tempGuideUnit] || []; availableTraits = [...availableTraits, ...specific]; } else { availableTraits = [...availableTraits, ...customTraits]; }
    availableTraits = availableTraits.filter((t, index, self) => index === self.findIndex((x) => x.id === t.id) && t.id !== 'none');
    let traitsHtml = `<div class="config-chip ${tempGuideTrait === 'auto' ? 'selected' : ''}" onclick="selectGuideTrait('auto')">Auto (Best)</div>`;
    availableTraits.forEach(t => { traitsHtml += `<div class="config-chip ${tempGuideTrait === t.id ? 'selected' : ''}" onclick="selectGuideTrait('${t.id}')">${t.name}</div>`; });
    traitList.innerHTML = traitsHtml;
}
function applyGuideConfig() {
    document.getElementById('guideUnitSelect').value = tempGuideUnit;
    document.getElementById('guideTraitSelect').value = tempGuideTrait;
    renderGuides(); closeGuideConfig();
}

// --- CUSTOM PAIR MODAL ---
function openCustomPairModal() {
    cpUnit = 'all'; cpT1 = 'ruler'; cpT2 = 'none';
    renderCustomPairUI();
    toggleModal('customPairModal', true);
}
function closeCustomPairModal() { toggleModal('customPairModal', false); }
function selectCpUnit(id) { cpUnit = id; renderCustomPairUI(); }
function selectCpT1(id) { cpT1 = id; renderCustomPairUI(); }
function selectCpT2(id) { cpT2 = id; renderCustomPairUI(); }

function renderCustomPairUI() {
    const unitGrid = document.getElementById('cpUnitGrid');
    const t1List = document.getElementById('cpTrait1List');
    const t2List = document.getElementById('cpTrait2List');
    
    let unitsHtml = `<div class="config-item ${cpUnit === 'all' ? 'selected' : ''}" onclick="selectCpUnit('all')"><div style="width:50px; height:50px; border-radius:50%; border:2px solid #555; background:#000; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff;">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => { unitsHtml += `<div class="config-item ${cpUnit === u.id ? 'selected' : ''}" onclick="selectCpUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`; });
    unitGrid.innerHTML = unitsHtml;

    const standardTraits = traitsList.filter(t => t.id !== 'none');
    let t1Html = '';
    standardTraits.forEach(t => { t1Html += `<div class="config-chip ${cpT1 === t.id ? 'selected' : ''}" onclick="selectCpT1('${t.id}')">${t.name}</div>`; });
    t1List.innerHTML = t1Html;

    let t2Html = `<div class="config-chip ${cpT2 === 'none' ? 'selected' : ''}" onclick="selectCpT2('none')">None</div>`;
    standardTraits.forEach(t => { t2Html += `<div class="config-chip ${cpT2 === t.id ? 'selected' : ''}" onclick="selectCpT2('${t.id}')">${t.name}</div>`; });
    t2List.innerHTML = t2Html;

    const uName = cpUnit === 'all' ? 'All Units' : unitDatabase.find(u => u.id === cpUnit).name;
    const t1Name = traitsList.find(t => t.id === cpT1).name;
    const t2Name = (cpT2 === 'none') ? '(None)' : traitsList.find(t => t.id === cpT2).name;
    document.getElementById('cpPreviewText').innerHTML = `${uName} <span style="color:#666">+</span> <span style="color:var(--accent-start)">${t1Name}</span> <span style="color:#666">+</span> <span style="color:var(--accent-end)">${t2Name}</span>`;
}

function confirmAddCustomPair() {
    const t1 = traitsList.find(t => t.id === cpT1);
    const t2 = traitsList.find(t => t.id === cpT2); 

    if (t1 && t2) {
        const combo = combineTraits(t1, t2);
        if (cpUnit === 'all') {
            const allTraits = [...traitsList, ...customTraits];
            const alreadyExists = allTraits.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') { customTraits.push(combo); alert(`Added global custom trait: ${combo.name}`); } 
            else alert("Trait combination already exists!");
        } else {
            if (!unitSpecificTraits[cpUnit]) unitSpecificTraits[cpUnit] = [];
            const unitList = unitSpecificTraits[cpUnit];
            const alreadyExists = unitList.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') { unitList.push(combo); alert(`Added custom trait to unit.`); } 
            else alert("Trait combination already exists for this unit!");
        }
        renderDatabase();
        if(document.getElementById('guidesPage').classList.contains('active')) renderGuides();
        closeCustomPairModal();
    }
}

// --- GUIDES RENDER ---
function getTopBuildsForGuide(unit, trait) {
    let results = [];
    let effectiveStats = { ...unit.stats };
    if (activeAbilityIds.has(unit.id) && unit.ability) Object.assign(effectiveStats, unit.ability);
    effectiveStats.id = unit.id;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = unit.stats.hitCount || 14; }

    let actualPlacement = Math.min(unit.placement, trait.limitPlace || unit.placement);
    const includeSubs = document.getElementById('guideSubStats')?.checked ?? true;
    const includeHead = document.getElementById('guideHeadPiece')?.checked ? 'auto' : 'none';

    const validBuilds = getFilteredBuilds();
    const isLaw = unit.id === 'law';

    validBuilds.forEach(build => {
        if (isLaw) {
             let ctx = { level: 99, priority: 'dmg', wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
             effectiveStats.context = ctx;
             let cfg = getBestSubConfig(build, effectiveStats, includeSubs, includeHead, 'range');
             if (!results[build.name]) results[build.name] = { dps: -1, rangeCfg: cfg };
             else results[build.name].rangeCfg = cfg;
        } else {
            ['dmg', 'spa'].forEach(p => {
                let ctx = { level: 99, priority: p, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true };
                effectiveStats.context = ctx;
                let cfg = getBestSubConfig(build, effectiveStats, includeSubs, includeHead);
                if (!results[build.name]) results[build.name] = { dps: -1, dmgCfg: null, spaCfg: null };
                if (p === 'dmg') results[build.name].dmgCfg = cfg; else results[build.name].spaCfg = cfg;
            });
        }
    });

    return Object.entries(results).map(([name, data]) => {
        let finalCfg, prio;
        if (isLaw) {
            finalCfg = data.rangeCfg; prio = 'range';
        } else {
            finalCfg = data.dmgCfg.res.total >= data.spaCfg.res.total ? data.dmgCfg : data.spaCfg;
            prio = data.dmgCfg.res.total >= data.spaCfg.res.total ? 'dmg' : 'spa';
        }
        let set = SETS.find(s => s.id === globalBuilds.find(b => b.name === name)?.set);
        let build = globalBuilds.find(b => b.name === name);
        let mainStructs = [ { label: 'BODY', stat: build.bodyType }, { label: 'LEGS', stat: build.legType } ];
        let subStructs = [];
        
        if (finalCfg.assignments.selectedHead && finalCfg.assignments.selectedHead !== 'none') {
             let hName = finalCfg.assignments.selectedHead === 'sun_god' ? 'Sun God' : 'Master Ninja';
             mainStructs.unshift({ label: 'HEAD', stat: hName, isHead: true });
        }

        if (finalCfg.assignments && Object.keys(finalCfg.assignments).length > 0) {
            if (finalCfg.assignments.head) subStructs.push({ label: 'HEAD', stat: finalCfg.assignments.head });
            if (finalCfg.assignments.body) subStructs.push({ label: 'BODY', stat: finalCfg.assignments.body });
            if (finalCfg.assignments.legs) subStructs.push({ label: 'LEGS', stat: finalCfg.assignments.legs });
        }
        let score = isLaw ? finalCfg.res.range : finalCfg.res.total;
        return { name: name, dps: score, prio: prio, set: set?.name || 'Unknown', mainStructs: mainStructs, subStructs: subStructs };
    }).sort((a, b) => b.dps - a.dps).slice(0, 3);
}

function renderGuides() {
    const guideGrid = document.getElementById('guideList');
    guideGrid.innerHTML = '';
    const selectedUnitId = document.getElementById('guideUnitSelect').value;
    const selectedTraitId = document.getElementById('guideTraitSelect').value;
    const uName = selectedUnitId === 'all' ? 'All Units' : unitDatabase.find(u => u.id === selectedUnitId)?.name || 'Unknown';
    let tName = 'Auto Trait';
    if(selectedTraitId !== 'auto') { const found = traitsList.find(t => t.id === selectedTraitId) || customTraits.find(t => t.id === selectedTraitId); if(found) tName = found.name; }
    document.getElementById('dispGuideUnit').innerText = uName; document.getElementById('dispGuideTrait').innerText = tName;

    const genericGuides = guideData.filter(d => !d.isCalculated);
    genericGuides.forEach(row => {
        if (selectedUnitId !== 'all' && unitDatabase.some(u => u.id === selectedUnitId)) return;
        const data = row[currentGuideMode]; 
        const card = document.createElement('div'); card.className = 'guide-card';
        const imgHtml = row.img ? `<img src="${row.img}">` : '';
        const mainBadgeHtml = formatStatBadge(data.main); const subBadgeHtml = formatStatBadge(data.sub);
        card.innerHTML = `<div class="guide-card-header"><div class="guide-unit-info">${imgHtml}<div><span style="display:block; line-height:1;">${row.unit}</span><span class="guide-trait-tag">${data.trait}</span></div></div></div><div class="guide-card-body"><div class="build-row rank-1" style="pointer-events:none;"><div class="br-header"><div style="display:flex; align-items:center; gap:8px;"><span class="br-rank">#1</span><span class="br-set">${data.set}</span></div></div><div class="br-grid"><div class="br-col"><div class="br-col-title">MAIN STAT</div><div class="stat-line">${mainBadgeHtml}</div></div><div class="br-col"><div class="br-col-title">SUB STAT</div><div class="stat-line">${subBadgeHtml}</div></div></div></div></div>`;
        guideGrid.appendChild(card);
    });

    let unitsToDisplay = [];
    if (selectedUnitId !== 'all') { const unit = unitDatabase.find(u => u.id === selectedUnitId); if (unit) unitsToDisplay.push(unit); } else { unitsToDisplay = unitDatabase; }
    let calculatedUnits = unitsToDisplay.map(unit => {
        let traitToUse = null;
        if (selectedTraitId === 'auto') traitToUse = findOverallBestTraitForUnit(unit);
        else {
            traitToUse = traitsList.find(t => t.id === selectedTraitId) || customTraits.find(t => t.id === selectedTraitId);
            if (!traitToUse && unitSpecificTraits[unit.id]) traitToUse = unitSpecificTraits[unit.id].find(t => t.id === selectedTraitId);
        }
        if (!traitToUse) return null;
        const topBuilds = getTopBuildsForGuide(unit, traitToUse);
        if (topBuilds.length === 0) return null;
        return { unit: unit, trait: traitToUse, topBuilds: topBuilds, maxDps: topBuilds[0].dps };
    }).filter(item => item !== null);

    calculatedUnits.sort((a, b) => b.maxDps - a.maxDps);

    calculatedUnits.forEach(item => {
        const card = document.createElement('div'); card.className = 'guide-card';
        let kiritoGuideControls = '';
        if (item.unit.id === 'kirito') {
            const isRealm = kiritoState.realm; const isCard = kiritoState.card;
            kiritoGuideControls = `<div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02); padding-left:15px; padding-right:15px;"><div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>${isRealm ? `<div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;"><span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div></label></div>` : ''}</div>`;
        }
        let buildsHtml = item.topBuilds.map((build, index) => {
            let rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : 'rank-3');
            let cleanSetName = build.name.split('(')[0].trim();
            
            let mainHtml = build.mainStructs.map(s => {
                if(s.isHead) {
                     let headColor = s.stat === 'Sun God' ? '#38bdf8' : '#ffffff';
                     return `<div class="stat-line" style="margin-bottom:4px;"><span class="sl-label">HEAD</span> <span style="display:inline-flex; align-items:center; justify-content:center; padding:0 4px; height:18px; border-radius:4px; font-size:0.6rem; font-weight:800; text-transform:uppercase; border:1px solid ${headColor}; white-space:nowrap; background:rgba(0,0,0,0.4); color:${headColor};">${s.stat}</span></div>`;
                }
                return `<div class="stat-line"><span class="sl-label">${s.label}</span>${getBadgeHtml(s.stat)}</div>`;
            }).join('');
            
            let subHtml = build.subStructs.map(s => {
                return `<div class="stat-line"><span class="sl-label">${s.label}</span>${getBadgeHtml(s.stat)}</div>`;
            }).join('');
            if(!subHtml) subHtml = '<span style="font-size:0.65rem; color:#555;">None</span>';

            let prioLabel = build.prio === 'dmg' ? 'DMG STAT' : (build.prio === 'range' ? 'RANGE STAT' : 'SPA STAT');
            let prioColor = build.prio === 'dmg' ? '#ff5555' : (build.prio === 'range' ? '#4caf50' : 'var(--custom)');
            let label = build.prio === 'range' ? 'RANGE' : 'DPS';
            return `
                <div class="build-row ${rankClass}">
                    <div class="br-header">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span class="br-rank">#${index+1}</span>
                            <span class="br-set">${cleanSetName}</span>
                        </div>
                        <span class="prio-badge" style="color:${prioColor}; border-color:${prioColor};">${prioLabel}</span>
                    </div>
                    <div class="br-grid">
                        <div class="br-col">
                            <div class="br-col-title">MAIN STAT</div>
                            ${mainHtml}
                        </div>
                        <div class="br-col" style="border-left:1px solid rgba(255,255,255,0.05); padding-left:8px;">
                            <div class="br-col-title">SUB STAT</div>
                            ${subHtml}
                        </div>
                        <div class="br-res-col">
                            <div class="dps-container">
                                <span class="build-dps" style="font-size:0.9rem;">${format(build.dps)}</span>
                                <span class="dps-label">${label}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
        let maxLabel = item.unit.id === 'law' ? 'MAX RANGE' : 'MAX POTENTIAL';
        card.innerHTML = `<div class="guide-card-header"><div class="guide-unit-info">${getUnitImgHtml(item.unit, '', 'small')}<div><span style="display:block; line-height:1;">${item.unit.name}</span><span class="guide-trait-tag">${item.trait.name}</span></div></div><div class="guide-dps-box"><span class="guide-dps-val">${format(item.maxDps)}</span><span style="font-size:0.6rem; color:#666; font-weight:bold; letter-spacing:1px;">${maxLabel}</span></div></div>${kiritoGuideControls}<div class="guide-card-body">${buildsHtml}</div>`;
        guideGrid.appendChild(card);
    });
}

function findOverallBestTraitForUnit(unit) {
    let bestTrait = null; let maxScore = -1;
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const allToCheck = [...traitsList, ...customTraits, ...specificTraits];
    allToCheck.filter(t => t.id !== 'none').forEach(trait => {
        const topBuilds = getTopBuildsForGuide(unit, trait);
        if (topBuilds.length > 0 && topBuilds[0].dps > maxScore) { maxScore = topBuilds[0].dps; bestTrait = trait; }
    });
    return bestTrait;
}

function switchPage(pid) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pid+'Page').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick')?.includes(pid)));
    const isDb = pid === 'db';
    document.getElementById('dbInjector').style.display = isDb ? 'flex' : 'none';
    document.getElementById('guidesToolbar').style.display = isDb ? 'none' : 'flex';
    document.getElementById('selectAllBtn').style.display = isDb ? 'block' : 'none';
    if (!isDb) document.getElementById('compareBtn').style.display = 'none'; else updateCompareBtn();
    if (pid === 'guides') renderGuides();
}

const format = (n) => n >= 1e9 ? (n/1e9).toFixed(2) + 'B' : n >= 1e6 ? (n/1e6).toFixed(2) + 'M' : n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : n.toLocaleString(undefined, {maximumFractionDigits:0});

window.onload = () => { populateGuideDropdowns(); setGuideMode('current'); }