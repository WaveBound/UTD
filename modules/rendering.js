// ============================================================================
// RENDERING.JS - HTML Generation & Display Functions
// ============================================================================

// --- PART 1: DETAILED LIST RENDERING (DATABASE TAB) ---

// Generate HTML for a single build row
function generateBuildRowHTML(r, i) {
    let rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
    if(r.isCustom) rankClass += ' is-custom';
    
    let prioLabel = 'DMG STAT';
    let prioColor = '#ff5555';
    if (r.prio === 'spa') { prioLabel = 'SPA STAT'; prioColor = 'var(--custom)'; }
    if (r.prio === 'range') { prioLabel = 'RANGE STAT'; prioColor = '#4caf50'; }

    const bodyVal = MAIN_STAT_VALS.body[r.mainStats.body];
    const legsVal = MAIN_STAT_VALS.legs[r.mainStats.legs];
    
    const mainBodyBadge = getBadgeHtml(r.mainStats.body, bodyVal);
    const mainLegsBadge = getBadgeHtml(r.mainStats.legs, legsVal);

    let headHtml = '';
    if (r.headUsed && r.headUsed !== 'none') {
        let headName = 'Unknown';
        let headColor = '#ffffff';
        switch(r.headUsed) {
            case 'sun_god': headName = 'Sun God'; headColor = '#38bdf8'; break;
            case 'ninja': headName = 'Master Ninja'; headColor = '#ffffff'; break;
            case 'reaper_necklace': headName = 'Reaper'; headColor = '#ef4444'; break; 
            case 'shadow_reaper_necklace': headName = 'S. Reaper'; headColor = '#a855f7'; break; 
        }
        headHtml = `<div class="stat-line"><span class="sl-label">HEAD</span> <span style="display:inline-flex; align-items:center; justify-content:center; padding:0 4px; height:18px; border-radius:4px; font-size:0.6rem; font-weight:800; text-transform:uppercase; border:1px solid ${headColor}; white-space:nowrap; background:rgba(0,0,0,0.4); color:${headColor};">${headName}</span></div>`;
    }

    let subInnerHtml = '';
    const s = r.subStats;
    const hasSubs = s.head || s.body || s.legs;

    if (hasSubs) {
        if (s.head) subInnerHtml += `<div class="stat-line"><span class="sl-label">SUB</span> ${getRichBadgeHtml(s.head)}</div>`;
        if (s.body) subInnerHtml += `<div class="stat-line"><span class="sl-label">BODY</span> ${getRichBadgeHtml(s.body)}</div>`;
        if (s.legs) subInnerHtml += `<div class="stat-line"><span class="sl-label">LEGS</span> ${getRichBadgeHtml(s.legs)}</div>`;
    } else {
        subInnerHtml = '<span style="font-size:0.65rem; color:#555;">None</span>';
    }

    let displayVal = format(r.dps);
    let displayLabel = "DPS";
    
    if (r.prio === 'range') {
        const val = (r.range !== undefined) ? r.range : r.dps;
        displayVal = val.toFixed(1);
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
                <div class="br-col" style="flex:0.85;">
                    <div class="br-col-title">MAIN STAT</div>
                    ${headHtml}
                    <div class="stat-line"><span class="sl-label">BODY</span> ${mainBodyBadge}</div>
                    <div class="stat-line"><span class="sl-label">LEGS</span> ${mainLegsBadge}</div>
                </div>
                <div class="br-col" style="flex:1.25; border-left:1px solid rgba(255,255,255,0.05); padding-left:18px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="br-col-title">SUB STAT</div>
                        <button class="sub-list-btn" title="View Sub-Stat Priority" onclick="viewSubPriority('${r.id}')">≡</button>
                    </div>
                    ${subInnerHtml}
                </div>
                <div class="br-res-col" style="position:relative;">
                    <button class="info-btn" onclick="showMath('${r.id}')" style="position:absolute; bottom:5px; left:15px; width:18px; height:18px; font-size:0.6rem; line-height:1;">?</button>
                    <div class="dps-container">
                        <span class="build-dps">${displayVal}</span>
                        <span class="dps-label">${displayLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update the visible build list based on filters
function updateBuildListDisplay(unitId) {
    const card = document.getElementById('card-' + unitId);
    if (!card) return;
    
    const searchInput = card.querySelector('.search-container input').value.toLowerCase();
    const prioSelect = card.querySelector('select[data-filter="prio"]').value;
    const setSelect = card.querySelector('select[data-filter="set"]').value;
    const headSelect = card.querySelector('select[data-filter="head"]').value;

    const renderList = (builds) => {
        if(!builds || builds.length === 0) return '<div style="padding:10px; color:#666;">No valid builds found.</div>';

        let filtered = builds.filter(r => {
            let headSearchName = '';
            if (r.headUsed === 'sun_god') headSearchName = 'Sun God Head';
            else if (r.headUsed === 'ninja') headSearchName = 'Ninja Head';
            else if (r.headUsed === 'reaper_necklace') headSearchName = 'Reaper Necklace';
            else if (r.headUsed === 'shadow_reaper_necklace') headSearchName = 'Shadow Reaper Necklace';
            
            const searchText = (r.traitName + ' ' + r.setName + ' ' + r.prio + ' ' + headSearchName).toLowerCase();

            const textMatch = searchText.includes(searchInput);
            const prioMatch = prioSelect === 'all' || r.prio === prioSelect;
            const setMatch = setSelect === 'all' || r.setName === setSelect;
            const headMatch = headSelect === 'all' || (r.headUsed || 'none') === headSelect;

            return textMatch && prioMatch && setMatch && headMatch;
        });

        if(filtered.length === 0) return '<div style="padding:10px; color:#666;">No matches found.</div>';
        
        if (unitId === 'law') {
            filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
        } else {
            filtered.sort((a, b) => b.dps - a.dps);
        }

        let displaySlice = filtered.slice(0, 10);
        
        if(unitId === 'kirito' && searchInput === '') {
            const astralBuild = filtered.find(b => b.traitName === 'Astral');
            if(astralBuild && !displaySlice.includes(astralBuild)) {
                displaySlice.push(astralBuild);
            }
        }

        return displaySlice.map((r, i) => generateBuildRowHTML(r, i)).join('');
    };

    // We now have 4 configs (0..3) for each of the 4 combinations of (Base/Abil) and (Bugged/Fixed)
    // Total 16 containers to update per card
    const modes = ['bugged', 'fixed'];
    const types = ['base', 'abil'];
    
    types.forEach(type => {
        modes.forEach(mode => {
            // Loop Configs 0 to 3
            for(let cfg=0; cfg<4; cfg++) {
                const containerId = `results-${type}-${mode}-${cfg}-${unitId}`;
                const container = document.getElementById(containerId);
                
                // Get the specific data array
                // unitBuildsCache[id][type][mode] is now an ARRAY of 4 arrays
                const buildData = unitBuildsCache[unitId]?.[type]?.[mode]?.[cfg] || [];
                
                if(container) container.innerHTML = renderList(buildData);
            }
        });
    });
}

// Render database with async chunking
function renderDatabase() {
    const container = document.getElementById('dbPage');
    
    if (renderQueueIndex === 0) {
        container.innerHTML = '';
        if (!window.STATIC_BUILD_DB) cachedResults = {}; 
        unitBuildsCache = {};
    }

    if (renderQueueId) {
        cancelAnimationFrame(renderQueueId);
        renderQueueId = null;
    }

    // --- CONFIGURATION DEFINITIONS ---
    // 0: Head=F, Subs=F
    // 1: Head=F, Subs=T
    // 2: Head=T, Subs=F
    // 3: Head=T, Subs=T
    const CONFIGS = [
        { head: false, subs: false },
        { head: false, subs: true },
        { head: true,  subs: false },
        { head: true,  subs: true }
    ];

    let sortedUnits = [];
    
    unitDatabase.forEach(unit => {
        // Initialize cache structure: [Base/Abil] -> [Bugged/Fixed] -> Array of 4 Config Results
        unitBuildsCache[unit.id] = { 
            base: { bugged: [], fixed: [] }, 
            abil: { bugged: [], fixed: [] } 
        };

        // Helper to calculate or load data
        // Returns an ARRAY of 4 Result Arrays (one for each config)
        const performCalcSet = (mode, useAbility) => {
            const originalRelicDot = statConfig.applyRelicDot;
            const originalRelicCrit = statConfig.applyRelicCrit;
            
            // Set Relic Config for the Mode
            if (mode === 'bugged') {
                statConfig.applyRelicDot = false; 
            } else {
                statConfig.applyRelicDot = true;
                statConfig.applyRelicCrit = true;
            }

            // Common Data prep
            const currentSubCandidates = getValidSubCandidates();
            const currentFilteredBuilds = getFilteredBuilds();
            let currentStats = { ...unit.stats };
            if (useAbility && unit.ability) Object.assign(currentStats, unit.ability);
            if(unit.tags) currentStats.tags = unit.tags;
            
            if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
                currentStats.dot = 200; currentStats.dotDuration = 4; currentStats.dotStacks = 1; 
            }
            if (unit.id === 'bambietta') {
                const bMode = BAMBIETTA_MODES[bambiettaState.element];
                if (bMode) Object.assign(currentStats, bMode);
            }

            // Determine DB Key
            let dbKey = unit.id;
            if (unit.id === 'kirito' && kiritoState.card) dbKey = 'kirito_card';
            if (useAbility && unit.ability) dbKey += '_abil';

            const resultSet = [];

            // LOOP THROUGH THE 4 CONFIGURATIONS
            for (let i = 0; i < 4; i++) {
                const cfg = CONFIGS[i];
                const headsToProcess = cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'];
                const includeSubs = cfg.subs;

                let staticList = null;
                // Check if Static DB exists and matches logic
                if (window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
                    // Static DB structure: { bugged: [ [Cfg0], [Cfg1]... ], fixed: ... }
                    const dbList = (mode === 'fixed') ? window.STATIC_BUILD_DB[dbKey].fixed : window.STATIC_BUILD_DB[dbKey].bugged;
                    if(dbList && dbList[i]) staticList = dbList[i];
                }

                let calculatedResults = [];
                if (staticList) {
                    calculatedResults = [...staticList];
                    staticList.forEach(r => cachedResults[r.id] = r); // Cache for 'math' modal
                }

                // Determine dynamic traits
                let traitsForCalc = null; 
                if (staticList) {
                     const globalCustoms = typeof customTraits !== 'undefined' ? customTraits : [];
                     const unitCustoms = unitSpecificTraits[unit.id] || [];
                     traitsForCalc = [...globalCustoms, ...unitCustoms];
                }

                // Run Calculation (if needed)
                if (traitsForCalc === null || traitsForCalc.length > 0) {
                    const dynamicResults = calculateUnitBuilds(unit, currentStats, currentFilteredBuilds, currentSubCandidates, headsToProcess, includeSubs, traitsForCalc);
                    calculatedResults = [...calculatedResults, ...dynamicResults];
                }
                
                resultSet.push(calculatedResults);
            }
            
            // Restore Global State
            statConfig.applyRelicDot = originalRelicDot;
            statConfig.applyRelicCrit = originalRelicCrit;

            return resultSet;
        };

        // --- 1. CALCULATE BASE STATS (Returns Array of 4 Configs) ---
        unitBuildsCache[unit.id].base.bugged = performCalcSet('bugged', false);
        unitBuildsCache[unit.id].base.fixed = performCalcSet('fixed', false);

        // --- 2. CALCULATE ABILITY STATS (If Unit has Ability) ---
        if (unit.ability) {
            unitBuildsCache[unit.id].abil.bugged = performCalcSet('bugged', true);
            unitBuildsCache[unit.id].abil.fixed = performCalcSet('fixed', true);
        }

        // Sorting Score: Use Fixed Relics + Config 3 (Head+Subs) as reference
        let maxScore = 0;
        // Default to Full Config (Index 3) for sorting
        const refList = unitBuildsCache[unit.id].base.fixed[3]; 
        if (refList && refList.length > 0) {
            maxScore = unit.id === 'law' ? (refList[0].range || 0) : refList[0].dps;
        }
        sortedUnits.push({ unit: unit, maxScore: maxScore });
    });

    sortedUnits.sort((a, b) => b.maxScore - a.maxScore);

    function processNextChunk() {
        const startTime = performance.now();
        
        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;
            renderQueueIndex++;

            let kiritoControlsHtml = '';
            if (unit.id === 'kirito') {
                const isRealm = kiritoState.realm;
                const isCard = kiritoState.card;
                kiritoControlsHtml = `<div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02);"><div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>${isRealm ? `<div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;"><span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div></label></div>` : ''}</div>`;
            }

            let bambiettaControlsHtml = '';
            if (unit.id === 'bambietta') {
                const currentEl = bambiettaState.element;
                const options = Object.keys(BAMBIETTA_MODES).map(k => 
                    `<option value="${k}" ${currentEl === k ? 'selected' : ''}>${k} (${BAMBIETTA_MODES[k].desc})</option>`
                ).join('');
                bambiettaControlsHtml = `
                <div class="unit-toolbar" style="border-bottom:none; padding-top:5px; padding-bottom:10px; background:rgba(255,255,255,0.02);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.75rem; font-weight:bold; text-transform:uppercase; color:#aaa;">Element:</span>
                        <select onchange="setBambiettaElement(this.value, this)" style="width:auto; padding:4px; font-size:0.75rem;">
                            ${options}
                        </select>
                    </div>
                </div>`;
            }

            const card = document.createElement('div');
            card.className = 'unit-card';
            if (activeAbilityIds.has(unit.id)) card.classList.add('use-ability'); 
            card.id = 'card-' + unit.id;
            card.style.animation = "fadeIn 0.3s ease";
            
            if(selectedUnitIds.has(unit.id)) card.classList.add('is-selected');
            const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>Ability</span><label><input type="checkbox" class="ability-cb" ${activeAbilityIds.has(unit.id) ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)"><div class="mini-switch"></div></label></div>` : '<div></div>';
            
            const toolbarHtml = `
            <div class="unit-toolbar">
                <div style="display:flex; gap:10px;">
                    <button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button>
                    <button class="calc-btn" onclick="openCalc('${unit.id}')">🖩 Custom Relics</button>
                </div>
                ${abilityToggleHtml}
            </div>`;
            
            let tagsHtml = '';
            if (unit.tags && unit.tags.length > 0) {
                tagsHtml = `<div class="unit-tags">` + 
                        unit.tags.map(t => `<span class="unit-tag">${t}</span>`).join('') + 
                        `</div>`;
            }

            let traitButtonHtml = '';
            if (unit.meta) {
                traitButtonHtml = `<button class="trait-guide-btn" onclick="openTraitGuide('${unit.id}')">📋 Rec. Traits</button>`;
            }

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
                        <option value="Shadow Reaper">Shadow Reaper</option>
                        <option value="Reaper Set">Reaper Set</option>
                    </select>
                    <select onchange="filterList(this)" data-filter="head" style="flex:1; padding:0 0 0 4px; font-size:0.7rem; height:30px;">
                        <option value="all">All Heads</option>
                        <option value="sun_god">Sun God</option>
                        <option value="ninja">Ninja</option>
                        <option value="reaper_necklace">Reaper</option>
                        <option value="shadow_reaper_necklace">Shadow Reaper</option>
                        <option value="none">No Head</option>
                    </select>
                </div>
            </div>`;

            // --- GENERATE ALL 16 RESULT CONTAINERS ---
            // Naming convention: results-[base/abil]-[bugged/fixed]-[cfg0-3]-[unitId]
            // CSS Classes: mode-[bugged/fixed] mode-[base/abil] cfg-[0-3]
            let resultsHtml = '';
            
            // Base vs Abil
            ['base', 'abil'].forEach(type => {
                // Bugged vs Fixed
                ['bugged', 'fixed'].forEach(mode => {
                    // Configs 0-3
                    for(let cfg=0; cfg<4; cfg++) {
                        resultsHtml += `<div class="top-builds-list build-list-container mode-${type} mode-${mode} cfg-${cfg}" id="results-${type}-${mode}-${cfg}-${unit.id}"></div>`;
                    }
                });
            });

            card.innerHTML = `
                <div class="unit-banner"><div class="placement-badge">Max Place: ${unit.placement}</div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div>${traitButtonHtml}</div>
                ${tagsHtml}
                ${toolbarHtml}
                ${kiritoControlsHtml}
                ${bambiettaControlsHtml}
                ${searchControls}
                ${resultsHtml}
            `;
            container.appendChild(card);
            
            updateBuildListDisplay(unit.id);

            if (performance.now() - startTime > 10) {
                renderQueueId = requestAnimationFrame(processNextChunk);
                return;
            }
        }
        renderQueueId = null;
        updateCompareBtn();
        
        // Ensure UI toggles match DOM state immediately after render
        const showHead = document.getElementById('globalHeadPiece').checked;
        const showSubs = document.getElementById('globalSubStats').checked;
        if(showHead) document.body.classList.add('show-head');
        if(showSubs) document.body.classList.add('show-subs');
    }

    processNextChunk();
}

// --- PART 2: GUIDE RENDERING (GUIDES TAB) ---

function setGuideMode(mode) {
    currentGuideMode = mode;
    const isFixed = (mode === 'fixed');
    const labelText = isFixed ? "Fixed Relics" : "Bugged Relics";
    
    // Update both toggle labels (one on DB bar, one on Guides bar)
    if(document.getElementById('hypoLabel')) document.getElementById('hypoLabel').innerText = labelText;
    if(document.getElementById('guideHypoLabel')) document.getElementById('guideHypoLabel').innerText = labelText;
    
    // Toggle warning visibility
    const warning = document.getElementById('guideWarning');
    if(warning) warning.style.display = (mode === 'current') ? 'block' : 'none';
}

function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    if (!unitSelect || !traitSelect) return;

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

const closeGuideConfig = () => { toggleModal('guideConfigModal', false); };
const selectGuideUnit = (id) => { tempGuideUnit = id; renderGuideConfigUI(); };
const selectGuideTrait = (id) => { tempGuideTrait = id; renderGuideConfigUI(); };

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
    availableTraits = availableTraits.filter((t, index, self) => index === self.findIndex((x) => x.id === t.id) && t.id !== 'none');
    
    let traitsHtml = `<div class="config-chip ${tempGuideTrait === 'auto' ? 'selected' : ''}" onclick="selectGuideTrait('auto')">Auto (Best)</div>`;
    availableTraits.forEach(t => { 
        traitsHtml += `<div class="config-chip ${tempGuideTrait === t.id ? 'selected' : ''}" onclick="selectGuideTrait('${t.id}')">${t.name}</div>`; 
    });
    traitList.innerHTML = traitsHtml;
}

const applyGuideConfig = () => {
    document.getElementById('guideUnitSelect').value = tempGuideUnit;
    document.getElementById('guideTraitSelect').value = tempGuideTrait;
    renderGuides(); 
    closeGuideConfig();
};

// Updated: Now accepts specific config index (0-3)
function getGuideBuildsFromCache(unit, mode, configIndex) {
    if (!unitBuildsCache || !unitBuildsCache[unit.id]) return [];
    
    // Prioritize Ability builds if available (Standard for Guides)
    const hasAbility = unit.ability !== undefined;
    
    let source = unitBuildsCache[unit.id].base;
    if (hasAbility && unitBuildsCache[unit.id].abil && unitBuildsCache[unit.id].abil[mode]) {
        source = unitBuildsCache[unit.id].abil;
    }

    // Return specific config array (0=NoStats, 1=Subs, 2=Head, 3=Both)
    if (source && source[mode] && source[mode][configIndex]) {
        return source[mode][configIndex];
    }

    return [];
}

function processGuideTop3(rawBuilds, unit, traitFilterId) {
    if (!rawBuilds || rawBuilds.length === 0) return [];

    let filtered = [...rawBuilds];

    // 1. Filter by Trait Config
    if (traitFilterId && traitFilterId !== 'auto') {
        let targetName = "";
        const tObj = traitsList.find(t => t.id === traitFilterId) || 
                     customTraits.find(t => t.id === traitFilterId) || 
                     (unitSpecificTraits[unit.id] || []).find(t => t.id === traitFilterId);
        if (tObj) targetName = tObj.name;
        if (targetName) filtered = filtered.filter(b => b.traitName === targetName);
    }

    // 2. Sort (Range for Law, DPS for others)
    if (unit.id === 'law') {
        filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
    } else {
        filtered.sort((a, b) => b.dps - a.dps);
    }

    // 3. Slice Top 3
    return filtered.slice(0, 3);
}

function renderGuides() {
    const guideGrid = document.getElementById('guideList');
    if (!guideGrid) return;
    
    guideGrid.innerHTML = '';
    
    const filterUnitId = document.getElementById('guideUnitSelect').value;
    const filterTraitId = document.getElementById('guideTraitSelect').value;

    // Update Header Text
    const uName = filterUnitId === 'all' ? 'All Units' : unitDatabase.find(u => u.id === filterUnitId)?.name || 'Unknown';
    let tName = 'Auto Trait';
    if(filterTraitId !== 'auto') { 
        const found = traitsList.find(t => t.id === filterTraitId) || customTraits.find(t => t.id === filterTraitId); 
        if(found) tName = found.name; 
    }
    document.getElementById('dispGuideUnit').innerText = uName; 
    document.getElementById('dispGuideTrait').innerText = tName;

    // 1. RENDER STATIC GUIDES (Miku, Supports, etc.)
    // Only show these if "All Units" is selected
    // Note: We add ALL config classes (cfg-0..3) so these static manual guides act as fallbacks 
    // and remain visible regardless of the specific Head/Sub toggle state.
    if (filterUnitId === 'all') {
        const staticGuides = guideData.filter(g => !g.isCalculated);
        staticGuides.forEach(g => {
            // Render Bugged (Current) Version - visible in all configs
            guideGrid.appendChild(createStaticCard(g, 'current', 'mode-bugged cfg-0 cfg-1 cfg-2 cfg-3'));
            // Render Fixed Version - visible in all configs
            guideGrid.appendChild(createStaticCard(g, 'fixed', 'mode-fixed cfg-0 cfg-1 cfg-2 cfg-3'));
        });
    }

    // 2. RENDER CALCULATED UNITS (From Database Cache)
    let unitsToProcess = (filterUnitId === 'all') 
        ? unitDatabase 
        : unitDatabase.filter(u => u.id === filterUnitId);

    unitsToProcess.forEach(unit => {
        // Loop through all 4 configs: 0 (None), 1 (Subs), 2 (Head), 3 (Both)
        for(let cfg = 0; cfg < 4; cfg++) {
            const cfgClass = `cfg-${cfg}`;

            // Render Bugged (Current)
            const buggedBuilds = getGuideBuildsFromCache(unit, 'bugged', cfg);
            const topBugged = processGuideTop3(buggedBuilds, unit, filterTraitId);
            if (topBugged.length) {
                guideGrid.appendChild(createCalculatedCard(unit, topBugged, `mode-bugged ${cfgClass}`));
            }

            // Render Fixed
            const fixedBuilds = getGuideBuildsFromCache(unit, 'fixed', cfg);
            const topFixed = processGuideTop3(fixedBuilds, unit, filterTraitId);
            if (topFixed.length) {
                guideGrid.appendChild(createCalculatedCard(unit, topFixed, `mode-fixed ${cfgClass}`));
            }
        }
    });
    
    if (guideGrid.children.length === 0) {
        guideGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;">No guides found. Database may still be calculating.</div>`;
    }
}

// Helper: Static Card for Miku/Supports
function createStaticCard(data, key, modeClass) {
    const info = data[key];
    const card = document.createElement('div'); 
    card.className = `guide-card ${modeClass}`;
    
    const imgHtml = data.img ? `<img src="${data.img}">` : '';
    const mainBadge = formatStatBadge(info.main); 
    const subBadge = formatStatBadge(info.sub);
    
    card.innerHTML = `
        <div class="guide-card-header">
            <div class="guide-unit-info">${imgHtml}<div><span style="display:block; line-height:1;">${data.unit}</span><span class="guide-trait-tag">${info.trait}</span></div></div>
        </div>
        <div class="guide-card-body">
            <div class="build-row rank-1" style="pointer-events:none;">
                <div class="br-header"><div style="display:flex; align-items:center; gap:8px;"><span class="br-rank">#1</span><span class="br-set">${info.set}</span></div></div>
                <div class="br-grid">
                    <div class="br-col" style="flex:1;">
                        <div class="br-col-title">MAIN STAT</div>
                        <div class="stat-line">${mainBadge}</div>
                    </div>
                    <div class="br-col" style="flex:1; border-left:1px solid rgba(255,255,255,0.05); padding-left:10px;">
                        <div class="br-col-title">SUB STAT</div>
                        <div class="stat-line">${subBadge}</div>
                    </div>
                </div>
            </div>
        </div>`;
    return card;
}

// Helper: Calculated Card for DB Units
function createCalculatedCard(unit, builds, modeClass) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `guide-card ${modeClass}`;
    
    const bestBuild = builds[0];
    
    // Display Value
    let displayValStr = format(bestBuild.dps);
    let maxLabel = 'MAX POTENTIAL';
    if (unit.id === 'law') {
        const val = bestBuild.range !== undefined ? bestBuild.range : bestBuild.dps;
        displayValStr = val.toFixed(1); 
        maxLabel = 'MAX RANGE';
    }

    // Special Unit Controls (Kirito/Realm toggles inside guide view)
    let extraControls = '';
    if (unit.id === 'kirito') {
        const isRealm = kiritoState.realm; 
        const isCard = kiritoState.card;
        extraControls = `<div class="unit-toolbar" style="border-bottom:none; padding:5px 15px 10px; flex-wrap:wrap; justify-content:flex-start; gap:15px; background:rgba(255,255,255,0.02);"><div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>${isRealm ? `<div class="toggle-wrapper" style="animation:fadeIn 0.3s ease;"><span style="color:${isCard ? 'var(--custom)' : '#888'}; font-weight:${isCard ? 'bold' : 'normal'};">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch" style="${isCard ? 'background:var(--custom);' : ''}"></div></label></div>` : ''}</div>`;
    }

    const rowsHtml = builds.map((build, index) => {
        const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : 'rank-3');
        const isCustom = build.isCustom ? 'is-custom' : '';
        
        let prioLabel = build.prio === 'dmg' ? 'DMG STAT' : (build.prio === 'range' ? 'RANGE STAT' : 'SPA STAT');
        let prioColor = build.prio === 'dmg' ? '#ff5555' : (build.prio === 'range' ? '#4caf50' : 'var(--custom)');
        
        let rowVal = format(build.dps);
        let rowLabel = 'DPS';
        if(build.prio === 'range') {
            const rVal = build.range !== undefined ? build.range : build.dps;
            rowVal = rVal.toFixed(1);
            rowLabel = 'RANGE';
        }

        let headHtml = '';
        if (build.headUsed && build.headUsed !== 'none') {
            let hName='Unknown', hColor='#fff';
            if(build.headUsed === 'sun_god') { hName='Sun God'; hColor='#38bdf8'; }
            else if(build.headUsed === 'ninja') { hName='Master Ninja'; hColor='#fff'; }
            else if(build.headUsed === 'reaper_necklace') { hName='Reaper'; hColor='#ef4444'; }
            else if(build.headUsed === 'shadow_reaper_necklace') { hName='S. Reaper'; hColor='#a855f7'; }
            headHtml = `<div class="stat-line"><span class="sl-label">HEAD</span> <span style="display:inline-flex; align-items:center; justify-content:center; padding:0 4px; height:18px; border-radius:4px; font-size:0.6rem; font-weight:800; text-transform:uppercase; border:1px solid ${hColor}; white-space:nowrap; background:rgba(0,0,0,0.4); color:${hColor};">${hName}</span></div>`;
        }

        let mainHtml = headHtml;
        if(build.mainStats) {
            mainHtml += `<div class="stat-line"><span class="sl-label">BODY</span>${getBadgeHtml(build.mainStats.body, MAIN_STAT_VALS.body[build.mainStats.body])}</div>`;
            mainHtml += `<div class="stat-line"><span class="sl-label">LEGS</span>${getBadgeHtml(build.mainStats.legs, MAIN_STAT_VALS.legs[build.mainStats.legs])}</div>`;
        }

        let subHtml = '';
        if (build.subStats) {
            if(build.subStats.head) subHtml += `<div class="stat-line"><span class="sl-label">HEAD</span>${getRichBadgeHtml(build.subStats.head)}</div>`;
            if(build.subStats.body) subHtml += `<div class="stat-line"><span class="sl-label">BODY</span>${getRichBadgeHtml(build.subStats.body)}</div>`;
            if(build.subStats.legs) subHtml += `<div class="stat-line"><span class="sl-label">LEGS</span>${getRichBadgeHtml(build.subStats.legs)}</div>`;
        }
        if(!subHtml) subHtml = '<span style="font-size:0.65rem; color:#555;">None</span>';

        return `
            <div class="build-row ${rankClass} ${isCustom}">
                <div class="br-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="br-rank">#${index+1}</span>
                        <span class="br-set">${build.setName}</span>
                    </div>
                    <span class="prio-badge" style="color:${prioColor}; border-color:${prioColor};">${prioLabel}</span>
                </div>
                <div class="br-grid">
                    <div class="br-col" style="flex:1;">
                        <div class="br-col-title">MAIN STAT</div>
                        ${mainHtml}
                    </div>
                    <div class="br-col" style="flex:1; border-left:1px solid rgba(255,255,255,0.05); padding-left:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div class="br-col-title">SUB STAT</div>
                            <button class="sub-list-btn" title="View Sub-Stat Priority" onclick="viewSubPriority('${build.id}')">≡</button>
                        </div>
                        ${subHtml}
                    </div>
                    <div class="br-res-col" style="position:relative;">
                        <button class="info-btn" onclick="showMath('${build.id}')" style="position:absolute; bottom:7px; left:12px; width:18px; height:18px; font-size:0.6rem; line-height:1;">?</button>
                        <div class="dps-container">
                            <span class="build-dps" style="font-size:0.9rem;">${rowVal}</span>
                            <span class="dps-label">${rowLabel}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    cardDiv.innerHTML = `
        <div class="guide-card-header">
            <div class="guide-unit-info">
                ${getUnitImgHtml(unit, '', 'small')}
                <div>
                    <span style="display:block; line-height:1;">${unit.name}</span>
                    <span class="guide-trait-tag">${bestBuild.traitName}</span>
                </div>
            </div>
            <div class="guide-dps-box">
                <span class="guide-dps-val">${displayValStr}</span>
                <span style="font-size:0.6rem; color:#666; font-weight:bold; letter-spacing:1px;">${maxLabel}</span>
            </div>
        </div>
        ${extraControls}
        <div class="guide-card-body">${rowsHtml}</div>`;
    
    return cardDiv;
}