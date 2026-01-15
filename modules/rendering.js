// --- START OF FILE rendering.js ---

// ============================================================================
// RENDERING.JS - UI Generation & Cache Management
// ============================================================================

function getKiritoControlsHtml(unit) {
    if (unit.id !== 'kirito') return '';
    const isRealm = kiritoState.realm;
    const isCard = kiritoState.card;
    
    // Classes for text and dynamic switch background
    const labelClass = isCard ? 'color-custom font-bold' : 'color-gray';
    const switchClass = isCard ? 'bg-custom' : '';

    return `<div class="unit-toolbar custom-toolbar kirito-toolbar">
        <div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${isRealm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>
        ${isRealm ? `<div class="toggle-wrapper animate-fade"><span class="${labelClass}">Magician Card</span><label><input type="checkbox" ${isCard ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch ${switchClass}"></div></label></div>` : ''}
    </div>`;
}

function getBambiettaControlsHtml(unit) {
    if (unit.id !== 'bambietta') return '';
    const currentEl = bambiettaState.element;
    const options = Object.keys(BAMBIETTA_MODES).map(k => 
        `<option value="${k}" ${currentEl === k ? 'selected' : ''}>${k} (${BAMBIETTA_MODES[k].desc})</option>`
    ).join('');
    
    return `
    <div class="unit-toolbar custom-toolbar">
        <div class="bambi-wrapper">
            <span class="bambi-label">Element:</span>
            <select onchange="setBambiettaElement(this.value, this)" class="bambi-select">
                ${options}
            </select>
        </div>
    </div>`;
}

function createBaseUnitCard(unit, options = {}) {
    const {
        id = '',
        additionalClasses = '',
        bannerContent = '', 
        tagsContent = '',   
        topControls = '',   
        bottomControls = '', 
        mainContent = ''    
    } = options;

    const card = document.createElement('div');
    card.className = `unit-card ${additionalClasses}`;
    if (id) card.id = id;

    const banner = `<div class="unit-banner">${bannerContent}</div>`;
    
    let tags = '';
    if (tagsContent) {
        tags = `<div class="unit-tags custom-tags">${tagsContent}</div>`;
    } else if (unit.tags && unit.tags.length > 0) {
        tags = `<div class="unit-tags">` + unit.tags.map(t => `<span class="unit-tag">${t}</span>`).join('') + `</div>`;
    }

    const unitSpecificControls = getKiritoControlsHtml(unit) + getBambiettaControlsHtml(unit);

    card.innerHTML = `
        ${banner}
        ${tags}
        ${topControls}
        ${unitSpecificControls}
        ${bottomControls}
        ${mainContent}
    `;
    return card;
}

function calculateBuildEfficiency(build, unitCost, unitMaxPlacement, unitId) {
    let traitLimit = null;
    
    if (build.traitName && build.traitName.includes('Ruler')) {
        traitLimit = 1;
    } else {
        const foundTrait = traitsList.find(t => t.name === build.traitName) || 
                           customTraits.find(t => t.name === build.traitName) ||
                           (unitSpecificTraits[unitId] || []).find(t => t.name === build.traitName);
        if (foundTrait && foundTrait.limitPlace) {
            traitLimit = foundTrait.limitPlace;
        }
    }

    const actualPlacement = traitLimit ? Math.min(unitMaxPlacement, traitLimit) : unitMaxPlacement;
    const actualTotalCost = unitCost * actualPlacement;
    
    if (actualTotalCost === 0) return 0;
    return (build.dps / actualTotalCost);
}

function generateBuildRowHTML(r, i, unitConfig = {}) {
    const baseUnitCost = unitConfig.totalCost || 50000;
    const maxPlacement = unitConfig.placement || 1;
    const sortMode = unitConfig.sortMode || 'dps';
    const unitId = unitConfig.unitId || '';

    let rankClass = i < 3 ? `rank-${i+1}` : 'rank-other';
    if(r.isCustom) rankClass += ' is-custom';
    
    const rawScore = calculateBuildEfficiency(r, baseUnitCost, maxPlacement, unitId);
    const effScore = rawScore.toFixed(3);

    let prioLabel = 'DMG STAT';
    let prioClass = 'prio-dmg';
    
    if (r.prio === 'spa') { prioLabel = 'SPA STAT'; prioClass = 'prio-spa'; }
    if (r.prio === 'range') { prioLabel = 'RANGE STAT'; prioClass = 'prio-range'; }

    const bodyVal = MAIN_STAT_VALS.body[r.mainStats.body];
    const legsVal = MAIN_STAT_VALS.legs[r.mainStats.legs];
    
    const mainBodyBadge = getBadgeHtml(r.mainStats.body, bodyVal);
    const mainLegsBadge = getBadgeHtml(r.mainStats.legs, legsVal);

    let headHtml = '';
    if (r.headUsed && r.headUsed !== 'none') {
        let headName = 'Unknown';
        let borderClass = 'border-unknown';
        let textClass = 'text-unknown';
        
        switch(r.headUsed) {
            case 'sun_god': 
                headName = 'Sun God'; borderClass = 'border-sungod'; textClass = 'text-sungod'; break;
            case 'ninja': 
                headName = 'Ninja'; borderClass = 'border-ninja'; textClass = 'text-ninja'; break;
            case 'reaper_necklace': 
                headName = 'Reaper'; borderClass = 'border-reaper'; textClass = 'text-reaper'; break; 
            case 'shadow_reaper_necklace': 
                headName = 'S. Reaper'; borderClass = 'border-sreaper'; textClass = 'text-sreaper'; break; 
        }
        
        headHtml = `
        <div class="stat-line">
            <span class="sl-label">HEAD</span> 
            <div class="badge-base ${borderClass}">
                <span class="${textClass}">${headName}</span>
            </div>
        </div>`;
    }

    let subInnerHtml = '';
    const s = r.subStats;
    const hasSubs = s.head || s.body || s.legs;

    if (hasSubs) {
        if (s.head) subInnerHtml += `<div class="stat-line"><span class="sl-label">SUB</span> ${getRichBadgeHtml(s.head)}</div>`;
        if (s.body) subInnerHtml += `<div class="stat-line"><span class="sl-label">BODY</span> ${getRichBadgeHtml(s.body)}</div>`;
        if (s.legs) subInnerHtml += `<div class="stat-line"><span class="sl-label">LEGS</span> ${getRichBadgeHtml(s.legs)}</div>`;
    } else {
        subInnerHtml = '<span class="badge-empty">None</span>';
    }

    let displayVal = format(r.dps);
    let displayLabel = "DPS";
    
    if (sortMode === 'range') {
        const val = (r.range !== undefined) ? r.range : 0;
        displayVal = val.toFixed(1);
        displayLabel = "RNG";
    } else if (sortMode === 'damage') {
        displayVal = format(r.dps);
        displayLabel = "DPS"; 
    } else if (r.prio === 'range' && sortMode === 'dps') {
        displayVal = format(r.dps);
        displayLabel = "DPS";
    }

    const effSortClass = sortMode === 'efficiency' ? 'is-efficiency-sort' : '';

    return `
        <div class="build-row ${rankClass} ${effSortClass}">
            <div class="br-header">
                <div class="br-header-info">
                    <span class="br-rank">#${i+1}</span>
                    <span class="br-set">${r.setName}</span>
                    <span class="br-sep">/</span>
                    <span class="br-trait">${r.traitName}</span>
                </div>
                <span class="prio-badge ${prioClass}">${prioLabel}</span>
            </div>
            <div class="br-grid">
                <div class="br-col main">
                    <div class="br-col-title">MAIN STAT</div>
                    ${headHtml}
                    <div class="stat-line"><span class="sl-label">BODY</span> ${mainBodyBadge}</div>
                    <div class="stat-line"><span class="sl-label">LEGS</span> ${mainLegsBadge}</div>
                </div>
                <div class="br-col sub">
                    <div class="br-col-header">
                        <div class="br-col-title">SUB STAT</div>
                        <button class="sub-list-btn" title="View Sub-Stat Priority" onclick="viewSubPriority('${r.id}')">≡</button>
                    </div>
                    ${subInnerHtml}
                </div>
                <div class="br-res-col">
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                    <div class="eff-score-line" onclick="event.stopPropagation(); openInfoPopup('efficiency')">
                        ${effScore} <span class="eff-label">Eff</span>
                    </div>
                    <div class="dps-container">
                        <span class="build-dps">${displayVal}</span>
                        <span class="dps-label">${displayLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateBuildListDisplay(unitId) {
    const card = document.getElementById('card-' + unitId);
    if (!card) return;
    
    const unitObj = unitDatabase.find(u => u.id === unitId);
    const unitCost = unitObj ? unitObj.totalCost : 50000;
    const unitPlace = unitObj ? unitObj.placement : 1;

    const searchInput = card.querySelector('.search-container input').value.toLowerCase();
    const prioSelect = card.querySelector('select[data-filter="prio"]').value;
    const setSelect = card.querySelector('select[data-filter="set"]').value;
    const headSelect = card.querySelector('select[data-filter="head"]').value;
    const sortSelect = card.querySelector('select[data-filter="sort"]').value; 

    const renderList = (builds) => {
        if(!builds || builds.length === 0) return '<div class="msg-empty">No valid builds found.</div>';

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

        if(filtered.length === 0) return '<div class="msg-empty">No matches found.</div>';
        
        if (sortSelect === 'efficiency') {
            filtered.sort((a, b) => {
                const effA = calculateBuildEfficiency(a, unitCost, unitPlace, unitId);
                const effB = calculateBuildEfficiency(b, unitCost, unitPlace, unitId);
                return effB - effA;
            });
        } else if (sortSelect === 'range') {
            filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
        } else if (sortSelect === 'damage') {
            filtered.sort((a, b) => {
                let scoreA = a.dps;
                let scoreB = b.dps;
                const isDmgA = a.mainStats.body === 'dmg' && a.mainStats.legs === 'dmg';
                const isDmgB = b.mainStats.body === 'dmg' && b.mainStats.legs === 'dmg';
                if (isDmgA) scoreA *= 1.2; 
                if (isDmgB) scoreB *= 1.2;
                return scoreB - scoreA;
            });
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

        const rowConfig = {
            totalCost: unitCost,
            placement: unitPlace,
            sortMode: sortSelect,
            unitId: unitId
        };

        return displaySlice.map((r, i) => generateBuildRowHTML(r, i, rowConfig)).join('');
    };

    const modes = ['bugged', 'fixed'];
    const types = ['base', 'abil'];
    
    types.forEach(type => {
        modes.forEach(mode => {
            for(let cfg=0; cfg<4; cfg++) {
                const containerId = `results-${type}-${mode}-${cfg}-${unitId}`;
                const container = document.getElementById(containerId);
                const buildData = unitBuildsCache[unitId]?.[type]?.[mode]?.[cfg] || [];
                if(container) container.innerHTML = renderList(buildData);
            }
        });
    });
}

function processUnitCache(unit) {
    unitBuildsCache[unit.id] = { 
        base: { bugged: [], fixed: [] }, 
        abil: { bugged: [], fixed: [] } 
    };

    const CONFIGS = [
        { head: false, subs: false }, { head: false, subs: true },
        { head: true,  subs: false }, { head: true,  subs: true }
    ];

    const performCalcSet = (mode, useAbility) => {
        const originalRelicDot = statConfig.applyRelicDot;
        const originalRelicCrit = statConfig.applyRelicCrit;
        
        if (mode === 'bugged') {
            statConfig.applyRelicDot = false; 
        } else {
            statConfig.applyRelicDot = true;
            statConfig.applyRelicCrit = true;
        }

        const currentSubCandidates = getValidSubCandidates();
        const currentFilteredBuilds = getFilteredBuilds();
        
        let currentStats = { ...unit.stats };
        if (useAbility && unit.ability) Object.assign(currentStats, unit.ability);
        if (unit.tags) currentStats.tags = unit.tags;
        
        if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
            currentStats.dot = 200; currentStats.dotDuration = 4; currentStats.dotStacks = 1; 
        }
        
        if (unit.id === 'bambietta') {
            const bMode = BAMBIETTA_MODES[bambiettaState.element];
            if (bMode) Object.assign(currentStats, bMode);
        }

        let dbKey = unit.id;
        if (unit.id === 'kirito' && kiritoState.card) dbKey = 'kirito_card';
        if (useAbility && unit.ability) dbKey += '_abil';

        const resultSet = [];

        for (let i = 0; i < 4; i++) {
            const cfg = CONFIGS[i];
            const headsToProcess = cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'];
            const includeSubs = cfg.subs;

            let staticList = null;

            const isDefaultBambi = (unit.id === 'bambietta' && bambiettaState.element === 'Dark');
            const canUseStatic = (unit.id !== 'bambietta') || isDefaultBambi;

            if (canUseStatic && window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
                const dbList = (mode === 'fixed') ? window.STATIC_BUILD_DB[dbKey].fixed : window.STATIC_BUILD_DB[dbKey].bugged;
                if(dbList && dbList[i]) staticList = dbList[i];
            }

            let calculatedResults = [];
            
            if (staticList) {
                calculatedResults = [...staticList];
                staticList.forEach(r => cachedResults[r.id] = r); 
            }

            let traitsForCalc = null; 
            if (staticList) {
                 const globalCustoms = typeof customTraits !== 'undefined' ? customTraits : [];
                 const unitCustoms = unitSpecificTraits[unit.id] || [];
                 traitsForCalc = [...globalCustoms, ...unitCustoms];
            }

            if (traitsForCalc === null || traitsForCalc.length > 0) {
                // FIXED: Passed 'mode' as the last argument to generate unique IDs
                const dynamicResults = calculateUnitBuilds(unit, currentStats, currentFilteredBuilds, currentSubCandidates, headsToProcess, includeSubs, traitsForCalc, useAbility, mode);
                calculatedResults = [...calculatedResults, ...dynamicResults];
            }
            
            resultSet.push(calculatedResults);
        }
        
        statConfig.applyRelicDot = originalRelicDot;
        statConfig.applyRelicCrit = originalRelicCrit;

        return resultSet;
    };

    unitBuildsCache[unit.id].base.bugged = performCalcSet('bugged', false);
    unitBuildsCache[unit.id].base.fixed = performCalcSet('fixed', false);

    if (unit.ability) {
        unitBuildsCache[unit.id].abil.bugged = performCalcSet('bugged', true);
        unitBuildsCache[unit.id].abil.fixed = performCalcSet('fixed', true);
    }
}

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

    let sortedUnits = [];
    
    unitDatabase.forEach(unit => {
        processUnitCache(unit);

        let maxScore = 0;
        
        // FIX: Check if ability is active for this unit to determine sorting score
        const useAbil = activeAbilityIds.has(unit.id) && unit.ability;
        const typeKey = useAbil ? 'abil' : 'base';
        
        // Use fixed/config-3 (Max Potential) for sorting
        const refList = unitBuildsCache[unit.id][typeKey].fixed[3]; 

        if (refList && refList.length > 0) {
            maxScore = unit.id === 'law' ? (refList[0].range || 0) : refList[0].dps;
        }
        sortedUnits.push({ unit: unit, maxScore: maxScore });
    });

    sortedUnits.sort((a, b) => b.maxScore - a.maxScore);

function processNextChunk() {
        const startTime = performance.now();
        const fragment = document.createDocumentFragment();
        
        let itemsAdded = 0;
        let staggerIndex = 0; 

        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;
            renderQueueIndex++;

            let traitButtonHtml = unit.meta ? `<button class="trait-guide-btn" onclick="openTraitGuide('${unit.id}')">📋 Rec. Traits</button>` : '';
            const bannerContent = `<div class="placement-badge">Max Place: ${unit.placement}</div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div>${traitButtonHtml}`;
            
            // Logic for dynamic ability labels (Sharpshooter / Phantom Captain)
            let abilityLabel = 'Ability';
            let toggleScript = '';

            if (unit.id === 'phantom_captain') {
                abilityLabel = 'Planes';
            } else if (unit.id === 'sharpshooter') {
                // Set initial label based on current active state
                abilityLabel = activeAbilityIds.has(unit.id) ? 'Sniper Mode' : 'Normal Mode';
                // Inline script to update label immediately on toggle
                toggleScript = `; this.parentElement.previousElementSibling.innerText = this.checked ? 'Sniper Mode' : 'Normal Mode'`;
            }
            
            const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>${abilityLabel}</span><label><input type="checkbox" class="ability-cb" ${activeAbilityIds.has(unit.id) ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)${toggleScript}"><div class="mini-switch"></div></label></div>` : '<div></div>';
            
            const topControls = `<div class="unit-toolbar"><div class="flex gap-md"><button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button><button class="calc-btn" onclick="openCalc('${unit.id}')">🖩 Custom Relics</button></div>${abilityToggleHtml}</div>`;

            let defaultSort = 'dps';
            if (unit.id === 'sjw' || unit.id === 'esdeath') {
                defaultSort = 'damage';
            } else if (unit.id === 'law') {
                defaultSort = 'range';
            }

            const bottomControls = `
                <div class="search-container">
                    <div class="search-row">
                        <input type="text" placeholder="Search..." class="search-input" onkeyup="filterList(this)">
                        
                        <select onchange="filterList(this)" data-filter="sort" class="search-select sort-select">
                            <option value="dps" ${defaultSort === 'dps' ? 'selected' : ''}>Sort: DPS</option>
                            <option value="damage" ${defaultSort === 'damage' ? 'selected' : ''}>Sort: Damage</option>
                            <option value="range" ${defaultSort === 'range' ? 'selected' : ''}>Sort: Range</option>
                            <option value="efficiency" ${defaultSort === 'efficiency' ? 'selected' : ''}>Sort: Efficiency</option>
                        </select>
                        
                        <select onchange="filterList(this)" data-filter="prio" class="search-select prio-select">
                            <option value="all">All Prio</option>
                            <option value="dmg">Dmg</option>
                            <option value="spa">SPA</option>
                            <option value="range">Range</option>
                        </select>
                    </div>
                    <div class="search-row">
                        <select onchange="filterList(this)" data-filter="set" class="search-select">
                            <option value="all">All Sets</option>
                            <option value="Master Ninja">Ninja Set</option>
                            <option value="Sun God">Sun God Set</option>
                            <option value="Laughing Captain">Laughing Set</option>
                            <option value="Ex Captain">Ex Set</option>
                            <option value="Shadow Reaper">Shadow Reaper</option>
                            <option value="Reaper Set">Reaper Set</option>
                        </select>
                        <select onchange="filterList(this)" data-filter="head" class="search-select">
                            <option value="all">All Heads</option>
                            <option value="sun_god">Sun God</option>
                            <option value="ninja">Ninja</option>
                            <option value="reaper_necklace">Reaper</option>
                            <option value="shadow_reaper_necklace">Shadow Reaper</option>
                            <option value="none">No Head</option>
                        </select>
                    </div>
                </div>`;

            let mainContent = '';
            ['base', 'abil'].forEach(type => {
                ['bugged', 'fixed'].forEach(mode => {
                    for(let cfg=0; cfg<4; cfg++) {
                        mainContent += `<div class="top-builds-list build-list-container mode-${type} mode-${mode} cfg-${cfg}" id="results-${type}-${mode}-${cfg}-${unit.id}"></div>`;
                    }
                });
            });

            let classes = '';
            if (activeAbilityIds.has(unit.id)) classes += ' use-ability'; 
            if (selectedUnitIds.has(unit.id)) classes += ' is-selected';

            const card = createBaseUnitCard(unit, {
                id: 'card-' + unit.id,
                additionalClasses: classes,
                bannerContent: bannerContent,
                topControls: topControls,
                bottomControls: bottomControls,
                mainContent: mainContent
            });

            // Keep dynamic style for staggered animation
            card.style.setProperty('--stagger-delay', `${staggerIndex * 50}ms`); 
            staggerIndex++; 

            fragment.appendChild(card);
            itemsAdded++;
            
            if (performance.now() - startTime > 12) {
                break;
            }
        }
        
        if (itemsAdded > 0) {
            container.appendChild(fragment);
            const startIdx = renderQueueIndex - itemsAdded;
            for(let i=startIdx; i < renderQueueIndex; i++) {
                updateBuildListDisplay(sortedUnits[i].unit.id);
            }
        }

        if (renderQueueIndex < sortedUnits.length) {
            renderQueueId = requestAnimationFrame(processNextChunk);
        } else {
            renderQueueId = null;
            updateCompareBtn();
            const showHead = document.getElementById('globalHeadPiece').checked;
            const showSubs = document.getElementById('globalSubStats').checked;
            if(showHead) document.body.classList.add('show-head');
            if(showSubs) document.body.classList.add('show-subs');
        }
    }

    processNextChunk();
}

function setGuideMode(mode) {
    currentGuideMode = mode;
    const isFixed = (mode === 'fixed');
    const labelText = isFixed ? "Fixed Relics" : "Bugged Relics";
    
    if(document.getElementById('hypoLabel')) document.getElementById('hypoLabel').innerText = labelText;
    if(document.getElementById('guideHypoLabel')) document.getElementById('guideHypoLabel').innerText = labelText;
    
    const warning = document.getElementById('guideWarning');
    if(warning) {
        if(mode === 'current') warning.classList.remove('hidden');
        else warning.classList.add('hidden');
    }
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
    
    let unitsHtml = `<div class="config-item ${tempGuideUnit === 'all' ? 'selected' : ''}" onclick="selectGuideUnit('all')"><div class="cp-avatar-placeholder">ALL</div><span>All Units</span></div>`;
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

function getGuideBuildsFromCache(unit, mode, configIndex) {
    if (!unitBuildsCache || !unitBuildsCache[unit.id]) return [];
    
    const hasAbility = unit.ability !== undefined;
    let source = unitBuildsCache[unit.id].base;
    if (hasAbility && unitBuildsCache[unit.id].abil && unitBuildsCache[unit.id].abil[mode]) {
        source = unitBuildsCache[unit.id].abil;
    }

    if (source && source[mode] && source[mode][configIndex]) {
        return source[mode][configIndex];
    }

    return [];
}

function processGuideTop3(rawBuilds, unit, traitFilterId) {
    if (!rawBuilds || rawBuilds.length === 0) return [];

    let filtered = [...rawBuilds];

    if (traitFilterId && traitFilterId !== 'auto') {
        let targetName = "";
        const tObj = traitsList.find(t => t.id === traitFilterId) || 
                     customTraits.find(t => t.id === traitFilterId) || 
                     (unitSpecificTraits[unit.id] || []).find(t => t.id === traitFilterId);
        if (tObj) targetName = tObj.name;
        if (targetName) filtered = filtered.filter(b => b.traitName === targetName);
    }

    if (unit.id === 'law') {
        filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
    } else {
        filtered.sort((a, b) => b.dps - a.dps);
    }

    return filtered.slice(0, 3);
}

function createGuideCard(unitObj, builds, modeClass) {
    const bestBuild = builds[0];
    
    let displayValStr = format(bestBuild.dps);
    let maxLabel = 'Max Potential';
    let typeClass = 'is-dps';

    if (unitObj.id === 'law') {
        const val = bestBuild.range !== undefined ? bestBuild.range : bestBuild.dps;
        displayValStr = val.toFixed(1); 
        maxLabel = 'Max Range';
        typeClass = 'is-range';
    }

    const bannerContent = `
        <div class="mp-container ${typeClass}">
            <span class="mp-label">${maxLabel}</span>
            <span class="mp-val">${displayValStr}</span>
        </div>
        ${getUnitImgHtml(unitObj, 'unit-avatar')}
        <div class="unit-title">
            <h2>${unitObj.name}</h2>
            <span>${unitObj.role} <span class="sss-tag">SSS</span></span>
        </div>`;

    const tagsContent = `
            <span class="guide-trait-tag text-xs-plus">Best: ${bestBuild.traitName}</span>
    `;

    const guideRowConfig = {
        totalCost: unitObj.totalCost || 50000,
        placement: unitObj.placement || 1,
        sortMode: 'dps',
        unitId: unitObj.id
    };

    const mainContent = `<div class="top-builds-list guide-list-wrapper">` + 
            builds.map((build, index) => generateBuildRowHTML(build, index, guideRowConfig)).join('') + 
            `</div>`;

    return createBaseUnitCard(unitObj, {
        additionalClasses: `calc-guide-card ${modeClass}`,
        bannerContent: bannerContent,
        tagsContent: tagsContent,
        mainContent: mainContent
    });
}

function renderGuides() {
    const guideGrid = document.getElementById('guideList');
    if (!guideGrid) return;
    
    guideGrid.innerHTML = '';
    
    const filterUnitId = document.getElementById('guideUnitSelect').value;
    const filterTraitId = document.getElementById('guideTraitSelect').value;

    const uName = filterUnitId === 'all' ? 'All Units' : unitDatabase.find(u => u.id === filterUnitId)?.name || 'Unknown';
    let tName = 'Auto Trait';
    if(filterTraitId !== 'auto') { 
        const found = traitsList.find(t => t.id === filterTraitId) || customTraits.find(t => t.id === filterTraitId); 
        if(found) tName = found.name; 
    }
    document.getElementById('dispGuideUnit').innerText = uName; 
    document.getElementById('dispGuideTrait').innerText = tName;

    let unitsToProcess = (filterUnitId === 'all') 
        ? unitDatabase 
        : unitDatabase.filter(u => u.id === filterUnitId);

    unitsToProcess.forEach(unit => {
        if (!unitBuildsCache[unit.id]) processUnitCache(unit);

        for(let cfg = 0; cfg < 4; cfg++) {
            const cfgClass = `cfg-${cfg}`;

            const buggedBuilds = getGuideBuildsFromCache(unit, 'bugged', cfg);
            const topBugged = processGuideTop3(buggedBuilds, unit, filterTraitId);
            if (topBugged.length) {
                guideGrid.appendChild(createGuideCard(unit, topBugged, `mode-bugged ${cfgClass}`));
            }

            const fixedBuilds = getGuideBuildsFromCache(unit, 'fixed', cfg);
            const topFixed = processGuideTop3(fixedBuilds, unit, filterTraitId);
            if (topFixed.length) {
                guideGrid.appendChild(createGuideCard(unit, topFixed, `mode-fixed ${cfgClass}`));
            }
        }
    });
    
    if (guideGrid.children.length === 0) {
        guideGrid.innerHTML = `<div class="msg-empty">No guides found. Database may still be calculating.</div>`;
    }
}