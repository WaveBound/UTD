// ============================================================================
// GUIDES.JS - Guide Rendering & Configuration
// ============================================================================

// Find the best overall trait for a unit
function findOverallBestTraitForUnit(unit) {
    let bestTrait = null; 
    let maxScore = -1;
    const specificTraits = unitSpecificTraits[unit.id] || [];
    const allToCheck = [...traitsList, ...customTraits, ...specificTraits];
    allToCheck.filter(t => t.id !== 'none').forEach(trait => {
        const topBuilds = getTopBuildsForGuide(unit, trait);
        if (topBuilds.length > 0 && topBuilds[0].dps > maxScore) { 
            maxScore = topBuilds[0].dps; 
            bestTrait = trait; 
        }
    });
    return bestTrait;
}

// Get top 3 builds for a guide unit/trait combo
function getTopBuildsForGuide(unit, trait) {
    let results = [];
    let effectiveStats = { ...unit.stats };
    if (activeAbilityIds.has(unit.id) && unit.ability) Object.assign(effectiveStats, unit.ability);
    effectiveStats.id = unit.id;
    
    if(unit.tags) effectiveStats.tags = unit.tags;

    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
        effectiveStats.dot = 200; 
        effectiveStats.dotDuration = 4; 
        effectiveStats.dotStacks = 1; 
    }

    const isKiritoVR = (unit.id === 'kirito' && kiritoState.realm);

    let actualPlacement = Math.min(unit.placement, trait.limitPlace || unit.placement);
    const includeSubs = document.getElementById('guideSubStats')?.checked ?? true;
    const includeHead = document.getElementById('guideHeadPiece')?.checked ? 'auto' : 'none';
    const subCandidates = getValidSubCandidates();

    const validBuilds = getFilteredBuilds();
    const isLaw = unit.id === 'law';

    validBuilds.forEach(build => {
        if (isLaw) {
             let ctx = { dmgPoints: 99, spaPoints: 0, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
             effectiveStats.context = ctx;
             let cfg = getBestSubConfig(build, effectiveStats, includeSubs, includeHead, subCandidates, 'range');
             if (!results[build.name]) results[build.name] = { dps: -1, rangeCfg: cfg };
             else results[build.name].rangeCfg = cfg;
        } else {
            ['dmg', 'spa'].forEach(p => {
                let ctx = { dmgPoints: p === 'dmg' ? 99 : 0, spaPoints: p === 'spa' ? 99 : 0, wave: 25, isBoss: false, traitObj: trait, placement: actualPlacement, isSSS: true, isVirtualRealm: isKiritoVR };
                effectiveStats.context = ctx;
                let cfg = getBestSubConfig(build, effectiveStats, includeSubs, includeHead, subCandidates);
                if (!results[build.name]) results[build.name] = { dps: -1, dmgCfg: null, spaCfg: null };
                if (p === 'dmg') results[build.name].dmgCfg = cfg; else results[build.name].spaCfg = cfg;
            });
        }
    });

    return Object.entries(results).map(([name, data]) => {
        let finalCfg, prio;
        if (isLaw) {
            finalCfg = data.rangeCfg; 
            prio = 'range';
        } else {
            finalCfg = data.dmgCfg.res.total >= data.spaCfg.res.total ? data.dmgCfg : data.spaCfg;
            prio = data.dmgCfg.res.total >= data.spaCfg.res.total ? 'dmg' : 'spa';
        }
        
        let buildId = `guide-${unit.id}-${trait.id}-${name.replace(/[^a-zA-Z0-9]/g,'')}-${prio}`;
        cachedResults[buildId] = finalCfg.res;

        let set = SETS.find(s => s.id === globalBuilds.find(b => b.name === name)?.set);
        let build = globalBuilds.find(b => b.name === name);
        let mainStructs = [ { label: 'BODY', stat: build.bodyType }, { label: 'LEGS', stat: build.legType } ];
        let subStructs = [];
        
        if (finalCfg.assignments.selectedHead && finalCfg.assignments.selectedHead !== 'none') {
             let hName = 'Unknown';
             if(finalCfg.assignments.selectedHead === 'sun_god') hName = 'Sun God';
             else if(finalCfg.assignments.selectedHead === 'ninja') hName = 'Master Ninja';
             else if(finalCfg.assignments.selectedHead === 'reaper_necklace') hName = 'Reaper';
             else if(finalCfg.assignments.selectedHead === 'shadow_reaper_necklace') hName = 'S. Reaper';
             
             mainStructs.unshift({ label: 'HEAD', stat: hName, isHead: true });
        }

        if (finalCfg.assignments && Object.keys(finalCfg.assignments).length > 0) {
            if (finalCfg.assignments.head) subStructs.push({ label: 'HEAD', stat: finalCfg.assignments.head });
            if (finalCfg.assignments.body) subStructs.push({ label: 'BODY', stat: finalCfg.assignments.body });
            if (finalCfg.assignments.legs) subStructs.push({ label: 'LEGS', stat: finalCfg.assignments.legs });
        }
        let score = isLaw ? finalCfg.res.range : finalCfg.res.total;
        
        return { 
            id: buildId,
            name: name, 
            dps: score, 
            prio: prio, 
            set: set?.name || 'Unknown', 
            mainStructs: mainStructs, 
            subStructs: subStructs 
        };
    }).sort((a, b) => b.dps - a.dps).slice(0, 3);
}

// Set guide mode (current vs fixed relics)
function setGuideMode(mode) {
    currentGuideMode = mode;
    if (mode === 'current') { 
        statConfig.applyRelicCrit = true; 
        statConfig.applyRelicDot = false; 
    } else { 
        statConfig.applyRelicCrit = true; 
        statConfig.applyRelicDot = true; 
    }

    const isFixed = (mode === 'fixed');
    const labelText = isFixed ? "Fixed Relics" : "Bugged Relics";
    
    ['globalHypothetical', 'guideHypoToggle'].forEach(id => {
        const cb = document.getElementById(id); 
        if(cb) { 
            cb.checked = isFixed; 
            cb.parentNode.classList.toggle('is-checked', isFixed); 
        }
    });
    
    document.getElementById('hypoLabel').innerText = labelText;
    document.getElementById('guideHypoLabel').innerText = labelText;
    document.getElementById('guideWarning').style.display = (mode === 'current') ? 'block' : 'none';
    renderGuides(); 
    resetAndRender(); 
}

// Populate guide dropdowns
function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    unitSelect.innerHTML = '<option value="all">All Units</option>';
    traitSelect.innerHTML = '<option value="auto">Auto (Best Trait)</option>';
    unitDatabase.forEach(unit => { unitSelect.add(new Option(unit.name, unit.id)); });
    traitsList.forEach(trait => { if (trait.id !== 'none') traitSelect.add(new Option(trait.name, trait.id)); });
}

// Open guide configuration modal
function openGuideConfig() {
    tempGuideUnit = document.getElementById('guideUnitSelect').value;
    tempGuideTrait = document.getElementById('guideTraitSelect').value;
    renderGuideConfigUI();
    toggleModal('guideConfigModal', true);
}

const closeGuideConfig = () => { toggleModal('guideConfigModal', false); };

const selectGuideUnit = (id) => { 
    tempGuideUnit = id; 
    renderGuideConfigUI(); 
};

const selectGuideTrait = (id) => { 
    tempGuideTrait = id; 
    renderGuideConfigUI(); 
};

// Render guide configuration UI
function renderGuideConfigUI() {
    const unitGrid = document.getElementById('guideConfigUnitGrid');
    const traitList = document.getElementById('guideConfigTraitList');
    
    let unitsHtml = `<div class="config-item ${tempGuideUnit === 'all' ? 'selected' : ''}" onclick="selectGuideUnit('all')"><div style="width:50px; height:50px; border-radius:50%; border:2px solid #555; background:#000; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff;">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => { 
        unitsHtml += `<div class="config-item ${tempGuideUnit === u.id ? 'selected' : ''}" onclick="selectGuideUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`; 
    });
    unitGrid.innerHTML = unitsHtml;

    let availableTraits = [...traitsList];
    if (tempGuideUnit !== 'all') { 
        const specific = unitSpecificTraits[tempGuideUnit] || []; 
        availableTraits = [...availableTraits, ...specific]; 
    } else { 
        availableTraits = [...availableTraits, ...customTraits]; 
    }
    availableTraits = availableTraits.filter((t, index, self) => 
        index === self.findIndex((x) => x.id === t.id) && t.id !== 'none'
    );
    
    let traitsHtml = `<div class="config-chip ${tempGuideTrait === 'auto' ? 'selected' : ''}" onclick="selectGuideTrait('auto')">Auto (Best)</div>`;
    availableTraits.forEach(t => { 
        traitsHtml += `<div class="config-chip ${tempGuideTrait === t.id ? 'selected' : ''}" onclick="selectGuideTrait('${t.id}')">${t.name}</div>`; 
    });
    traitList.innerHTML = traitsHtml;
}

// Apply guide configuration
const applyGuideConfig = () => {
    document.getElementById('guideUnitSelect').value = tempGuideUnit;
    document.getElementById('guideTraitSelect').value = tempGuideTrait;
    renderGuides(); 
    closeGuideConfig();
};

// Main guides rendering function
function renderGuides() {
    const guideGrid = document.getElementById('guideList');
    guideGrid.innerHTML = '';
    const selectedUnitId = document.getElementById('guideUnitSelect').value;
    const selectedTraitId = document.getElementById('guideTraitSelect').value;
    const uName = selectedUnitId === 'all' ? 'All Units' : unitDatabase.find(u => u.id === selectedUnitId)?.name || 'Unknown';
    let tName = 'Auto Trait';
    if(selectedTraitId !== 'auto') { 
        const found = traitsList.find(t => t.id === selectedTraitId) || customTraits.find(t => t.id === selectedTraitId); 
        if(found) tName = found.name; 
    }
    document.getElementById('dispGuideUnit').innerText = uName; 
    document.getElementById('dispGuideTrait').innerText = tName;

    // Render generic guides first
    const genericGuides = guideData.filter(d => !d.isCalculated);
    genericGuides.forEach(row => {
        if (selectedUnitId !== 'all' && unitDatabase.some(u => u.id === selectedUnitId)) return;
        const data = row[currentGuideMode]; 
        const card = document.createElement('div'); 
        card.className = 'guide-card';
        const imgHtml = row.img ? `<img src="${row.img}">` : '';
        const mainBadgeHtml = formatStatBadge(data.main); 
        const subBadgeHtml = formatStatBadge(data.sub);
        
        card.innerHTML = `
            <div class="guide-card-header"><div class="guide-unit-info">${imgHtml}<div><span style="display:block; line-height:1;">${row.unit}</span><span class="guide-trait-tag">${data.trait}</span></div></div></div>
            <div class="guide-card-body">
                <div class="build-row rank-1" style="pointer-events:none;">
                    <div class="br-header"><div style="display:flex; align-items:center; gap:8px;"><span class="br-rank">#1</span><span class="br-set">${data.set}</span></div></div>
                                        <div class="br-grid">
                                            <div class="br-col" style="flex:1;">
                                                <div class="br-col-title">MAIN STAT</div>
                                                <div class="stat-line">${mainBadgeHtml}</div>
                                            </div>
                                            <div class="br-col" style="flex:1; border-left:1px solid rgba(255,255,255,0.05); padding-left:10px;">
                                                <div class="br-col-title">SUB STAT</div>
                                                <div class="stat-line">${subBadgeHtml}</div>
                                            </div>
                                        </div>
                </div>
            </div>`;
        guideGrid.appendChild(card);
    });

    // Render calculated guides
    let unitsToDisplay = [];
    if (selectedUnitId !== 'all') { 
        const unit = unitDatabase.find(u => u.id === selectedUnitId); 
        if (unit) unitsToDisplay.push(unit); 
    } else { 
        unitsToDisplay = unitDatabase; 
    }
    
    let calculatedUnits = unitsToDisplay.map(unit => {
        let traitToUse = null;
        if (selectedTraitId === 'auto') {
            traitToUse = findOverallBestTraitForUnit(unit);
        } else {
            traitToUse = traitsList.find(t => t.id === selectedTraitId) || 
                         customTraits.find(t => t.id === selectedTraitId);
            if (!traitToUse && unitSpecificTraits[unit.id]) {
                traitToUse = unitSpecificTraits[unit.id].find(t => t.id === selectedTraitId);
            }
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
        
        let kiritoGuideControls = '';
        if (item.unit.id === 'kirito') {
            const isRealm = kiritoState.realm; 
            const isCard = kiritoState.card;
            kiritoGuideControls = `<div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02); padding-left:15px; padding-right:15px;"><div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>${isRealm ? `<div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;"><span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div></label></div>` : ''}</div>`;
        }
        
        let buildsHtml = item.topBuilds.map((build, index) => {
            let rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : 'rank-3');
            let cleanSetName = build.name.split('(')[0].trim();
            
            let mainHtml = build.mainStructs.map(s => {
                if(s.isHead) {
                     let headColor = '#ffffff';
                     if(s.stat === 'Sun God') headColor = '#38bdf8';
                     else if(s.stat === 'Reaper') headColor = '#ef4444';
                     else if(s.stat === 'S. Reaper') headColor = '#a855f7';
                     
                     return `<div class="stat-line"><span class="sl-label">HEAD</span> <span style="display:inline-flex; align-items:center; justify-content:center; padding:0 4px; height:18px; border-radius:4px; font-size:0.6rem; font-weight:800; text-transform:uppercase; border:1px solid ${headColor}; white-space:nowrap; background:rgba(0,0,0,0.4); color:${headColor};">${s.stat}</span></div>`;
                }
                let val = null;
                if(s.label === 'BODY' && MAIN_STAT_VALS.body[s.stat]) val = MAIN_STAT_VALS.body[s.stat];
                if(s.label === 'LEGS' && MAIN_STAT_VALS.legs[s.stat]) val = MAIN_STAT_VALS.legs[s.stat];
                
                return `<div class="stat-line"><span class="sl-label">${s.label}</span>${getBadgeHtml(s.stat, val)}</div>`;
            }).join('');
            
            // FIX: Use getRichBadgeHtml for the sub-stats
            let subHtml = build.subStructs.map(s => {
                return `<div class="stat-line"><span class="sl-label">${s.label}</span>${getRichBadgeHtml(s.stat)}</div>`;
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
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span class="prio-badge" style="color:${prioColor}; border-color:${prioColor};">${prioLabel}</span>
                        </div>
                    </div>
                    <div class="br-grid">
                        <div class="br-col" style="flex:1;">
                            <div class="br-col-title">MAIN STAT</div>
                            ${mainHtml}
                        </div>
                        <div class="br-col" style="flex:1; border-left:1px solid rgba(255,255,255,0.05); padding-left:10px;">
                            <div class="br-col-title">SUB STAT</div>
                            ${subHtml}
                        </div>
                        <div class="br-res-col" style="position:relative;">
                            <button class="info-btn" onclick="showMath('${build.id}')" style="position:absolute; bottom:7px; left:12px; width:18px; height:18px; font-size:0.6rem; line-height:1;">?</button>
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