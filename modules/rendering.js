// ============================================================================
// RENDERING.JS - UI Generation & Cache Management
// ============================================================================

const unitControls = {
    kirito: (unit) => {
        const { realm, card } = kiritoState;
        const labelClass = card ? 'color-custom font-bold' : 'color-gray';
        const switchClass = card ? 'bg-custom' : '';
        return `<div class="unit-toolbar custom-toolbar kirito-toolbar">
            <div class="toggle-wrapper"><span>Virtual Realm</span><label><input type="checkbox" ${realm ? 'checked' : ''} onchange="toggleKiritoMode('realm', this)"><div class="mini-switch"></div></label></div>
            ${realm ? `<div class="toggle-wrapper animate-fade"><span class="${labelClass}">Magician Card</span><label><input type="checkbox" ${card ? 'checked' : ''} onchange="toggleKiritoMode('card', this)"><div class="mini-switch ${switchClass}"></div></label></div>` : ''}
        </div>`;
    },
    bambietta: (unit) => {
        const currentEl = bambiettaState.element;
        const options = Object.keys(BAMBIETTA_MODES).map(k => 
            `<option value="${k}" ${currentEl === k ? 'selected' : ''}>${k} (${BAMBIETTA_MODES[k].desc})</option>`
        ).join('');
        return `<div class="unit-toolbar custom-toolbar"><div class="bambi-wrapper"><span class="bambi-label">Element:</span><select onchange="setBambiettaElement(this.value, this)" class="bambi-select">${options}</select></div></div>`;
    }
};

function getUnitControlsHtml(unit) {
    return unitControls[unit.id] ? unitControls[unit.id](unit) : '';
}

function createBaseUnitCard(unit, options = {}) {
    const { id = '', additionalClasses = '', bannerContent = '', tagsContent = '', topControls = '', bottomControls = '', mainContent = '' } = options;
    const card = document.createElement('div');
    card.className = `unit-card ${additionalClasses}`;
    if (id) card.id = id;

    const banner = `<div class="unit-banner">${bannerContent}</div>`;
    const tags = tagsContent ? `<div class="unit-tags custom-tags">${tagsContent}</div>` : 
                 (unit.tags && unit.tags.length > 0 ? `<div class="unit-tags">${unit.tags.map(t => `<span class="unit-tag">${t}</span>`).join('')}</div>` : '');

    card.innerHTML = `${banner}${tags}${topControls}${getUnitControlsHtml(unit)}${bottomControls}${mainContent}`;
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
        if (foundTrait && foundTrait.limitPlace) traitLimit = foundTrait.limitPlace;
    }
    const actualPlacement = traitLimit ? Math.min(unitMaxPlacement, traitLimit) : unitMaxPlacement;
    const actualTotalCost = unitCost * actualPlacement;
    return actualTotalCost === 0 ? 0 : (build.dps / actualTotalCost);
}

function getHeadBadgeHtml(headUsed) {
    if (!headUsed || headUsed === 'none') return '';
    const config = {
        'sun_god': { name: 'Sun God', border: 'border-sungod', text: 'text-sungod' },
        'ninja': { name: 'Ninja', border: 'border-ninja', text: 'text-ninja' },
        'reaper_necklace': { name: 'Reaper', border: 'border-reaper', text: 'text-reaper' },
        'shadow_reaper_necklace': { name: 'S. Reaper', border: 'border-sreaper', text: 'text-sreaper' }
    };
    const h = config[headUsed] || { name: 'Unknown', border: 'border-unknown', text: 'text-unknown' };
    return `<div class="stat-line"><span class="sl-label">HEAD</span><div class="badge-base ${h.border}"><span class="${h.text}">${h.name}</span></div></div>`;
}

function generateBuildRowHTML(r, i, unitConfig = {}) {
    const { totalCost = 50000, placement = 1, sortMode = 'dps', unitId = '' } = unitConfig;
    
    let rankClass = (i < 3 ? `rank-${i+1}` : 'rank-other') + (r.isCustom ? ' is-custom' : '');
    const effScore = calculateBuildEfficiency(r, totalCost, placement, unitId).toFixed(3);

    // PRIORITY BADGE LOGIC
    const prioConfig = {
        'spa': { label: 'SPA STAT', cls: 'prio-spa' },
        'range': { label: 'RANGE STAT', cls: 'prio-range' },
        'default': { label: 'DMG STAT', cls: 'prio-dmg' }
    };

    let prioHtml = '';

    // FIX: Check for relicIds existence to detect Inventory Mode items
    if (r.relicIds) {
        // Inventory Mode: Double Badge (Inventory Button + Stat Type)
        const hId = r.relicIds.head || 'none';
        const bId = r.relicIds.body || 'none-b';
        const lId = r.relicIds.legs || 'none-l';
        
        // Determine the label based on the calculated priority ('dmg', 'spa', 'range')
        const currentPrio = r.prio || 'default';
        const secCfg = prioConfig[currentPrio] || prioConfig['default'];
        
        // Online Image Backpack Icon (Clean White)
        const invBadge = `<button class="prio-badge prio-inv clickable" onclick="viewInventoryItems('${hId}', '${bId}', '${lId}')" title="Locate in Inventory">
            <img src="https://img.icons8.com/fluency-systems-filled/48/ffffff/backpack.png" alt="Inv">
        </button>`;
        const statBadge = `<span class="prio-badge ${secCfg.cls}">${secCfg.label}</span>`;
        
        prioHtml = `<div class="br-badges">${invBadge}${statBadge}</div>`;
    } else {
        // Standard Mode: Single Badge
        const pCfg = prioConfig[r.prio] || prioConfig['default'];
        prioHtml = `<span class="prio-badge ${pCfg.cls}">${pCfg.label}</span>`;
    }

    const mainBodyBadge = getBadgeHtml(r.mainStats.body, MAIN_STAT_VALS.body[r.mainStats.body]);
    const mainLegsBadge = getBadgeHtml(r.mainStats.legs, MAIN_STAT_VALS.legs[r.mainStats.legs]);
    const headHtml = getHeadBadgeHtml(r.headUsed);

    const s = r.subStats || {};
    
    const headRow = (r.headUsed && r.headUsed !== 'none') 
        ? `<div class="stat-line"><span class="sl-label">SUB</span> ${getRichBadgeHtml(s.head || [])}</div>` 
        : '';

    const bodyRow = `<div class="stat-line"><span class="sl-label">BODY</span> ${getRichBadgeHtml(s.body || [])}</div>`;
    const legsRow = `<div class="stat-line"><span class="sl-label">LEGS</span> ${getRichBadgeHtml(s.legs || [])}</div>`;

    const subInnerHtml = `${headRow}${bodyRow}${legsRow}`;

    let displayVal = format(r.dps), displayLabel = "DPS";
    if (sortMode === 'range') { displayVal = (r.range || 0).toFixed(1); displayLabel = "RNG"; }
    
    return `
        <div class="build-row ${rankClass} ${sortMode === 'efficiency' ? 'is-efficiency-sort' : ''}">
            <div class="br-header">
                <div class="br-header-info"><span class="br-rank">#${i+1}</span><span class="br-set">${r.setName}</span><span class="br-sep">/</span><span class="br-trait">${r.traitName}</span></div>
                ${prioHtml}
            </div>
            <div class="br-grid">
                <div class="br-col main"><div class="br-col-title">MAIN STAT</div>${headHtml}<div class="stat-line"><span class="sl-label">BODY</span> ${mainBodyBadge}</div><div class="stat-line"><span class="sl-label">LEGS</span> ${mainLegsBadge}</div></div>
                <div class="br-col sub">
                    <div class="br-col-header"><div class="br-col-title">SUB STAT</div><button class="sub-list-btn" title="View Sub-Stat Priority" onclick="viewSubPriority('${r.id}')">≡</button></div>
                    ${subInnerHtml}
                </div>
                <div class="br-res-col">
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                    <div class="eff-score-line" onclick="event.stopPropagation(); openInfoPopup('efficiency')">${effScore} <span class="eff-label">Eff</span></div>
                    <div class="dps-container"><span class="build-dps">${displayVal}</span><span class="dps-label">${displayLabel}</span></div>
                </div>
            </div>
        </div>`;
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
            let headSearchName = ({'sun_god':'Sun God Head','ninja':'Ninja Head','reaper_necklace':'Reaper Necklace','shadow_reaper_necklace':'Shadow Reaper Necklace'})[r.headUsed] || '';
            const searchText = (r.traitName + ' ' + r.setName + ' ' + r.prio + ' ' + headSearchName).toLowerCase();
            
            // UPDATED FILTER LOGIC:
            // Allow matching if prio is exact OR if it's "INV" (legacy check, though mostly unused now) 
            // OR if we are in Inventory Mode, we show specific variations so the prio check works normally.
            const prioMatch = (prioSelect === 'all' || r.prio === prioSelect);

            return searchText.includes(searchInput) && prioMatch && 
                   (setSelect === 'all' || r.setName === setSelect) && (headSelect === 'all' || (r.headUsed || 'none') === headSelect);
        });

        if(filtered.length === 0) return '<div class="msg-empty">No matches found.</div>';
        
        if (sortSelect === 'efficiency') {
            filtered.sort((a, b) => calculateBuildEfficiency(b, unitCost, unitPlace, unitId) - calculateBuildEfficiency(a, unitCost, unitPlace, unitId));
        } else if (sortSelect === 'range') {
            filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
        } else if (sortSelect === 'damage') {
            filtered.sort((a, b) => {
                let scoreA = a.dps * (a.mainStats.body === 'dmg' && a.mainStats.legs === 'dmg' ? 1.2 : 1);
                let scoreB = b.dps * (b.mainStats.body === 'dmg' && b.mainStats.legs === 'dmg' ? 1.2 : 1);
                return scoreB - scoreA;
            });
        } else {
            filtered.sort((a, b) => b.dps - a.dps);
        }

        let displaySlice = filtered.slice(0, 10);
        if(unitId === 'kirito' && searchInput === '') {
            const astralBuild = filtered.find(b => b.traitName === 'Astral');
            if(astralBuild && !displaySlice.includes(astralBuild)) displaySlice.push(astralBuild);
        }

        return displaySlice.map((r, i) => generateBuildRowHTML(r, i, { totalCost: unitCost, placement: unitPlace, sortMode: sortSelect, unitId })).join('');
    };

    ['base', 'abil'].forEach(type => {
        ['bugged', 'fixed'].forEach(mode => {
            for(let cfg=0; cfg<4; cfg++) {
                const container = document.getElementById(`results-${type}-${mode}-${cfg}-${unitId}`);
                const buildData = unitBuildsCache[unitId]?.[type]?.[mode]?.[cfg] || [];
                if(container) container.innerHTML = renderList(buildData);
            }
        });
    });
}

function processUnitCache(unit) {
    unitBuildsCache[unit.id] = { base: { bugged: [], fixed: [] }, abil: { bugged: [], fixed: [] } };
    const CONFIGS = [{ head: false, subs: false }, { head: false, subs: true }, { head: true,  subs: false }, { head: true,  subs: true }];

    const performCalcSet = (mode, useAbility) => {
        const originalRelicDot = statConfig.applyRelicDot, originalRelicCrit = statConfig.applyRelicCrit;
        statConfig.applyRelicDot = (mode === 'fixed');

        let currentStats = { ...unit.stats };
        if (useAbility && unit.ability) Object.assign(currentStats, unit.ability);
        if (unit.tags) currentStats.tags = unit.tags;
        
        if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { currentStats.dot = 200; currentStats.dotDuration = 4; currentStats.dotStacks = 1; }
        if (unit.id === 'bambietta' && BAMBIETTA_MODES[bambiettaState.element]) Object.assign(currentStats, BAMBIETTA_MODES[bambiettaState.element]);

        let dbKey = unit.id + (unit.id === 'kirito' && kiritoState.card ? 'kirito_card' : '') + (useAbility && unit.ability ? '_abil' : '');
        const resultSet = [];

        // Determine calculation logic: Normal vs Inventory
        const useInventory = (inventoryMode === true);

        for (let i = 0; i < 4; i++) {
            const cfg = CONFIGS[i];
            let calculatedResults = [];
            
            // If Inventory Mode is OFF, try to load static DB first
            if (!useInventory) {
                const canUseStatic = (unit.id !== 'bambietta') || (bambiettaState.element === 'Dark');
                if (canUseStatic && window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
                    const dbList = window.STATIC_BUILD_DB[dbKey][mode];
                    if(dbList && dbList[i]) {
                        calculatedResults = [...dbList[i]];
                        calculatedResults.forEach(r => cachedResults[r.id] = r);
                    }
                }
            }

            const traitsForCalc = (calculatedResults.length > 0) ? [...(typeof customTraits !== 'undefined' ? customTraits : []), ...(unitSpecificTraits[unit.id] || [])] : null;
            
            if (traitsForCalc === null || traitsForCalc.length > 0 || useInventory) {
                // calculateUnitBuilds now handles the Inventory Mode branch internally
                const dynamicResults = calculateUnitBuilds(unit, currentStats, getFilteredBuilds(), getValidSubCandidates(), cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'], cfg.subs, traitsForCalc, useAbility, mode);
                calculatedResults = [...calculatedResults, ...dynamicResults];
            }
            resultSet.push(calculatedResults);
        }
        
        statConfig.applyRelicDot = originalRelicDot; statConfig.applyRelicCrit = originalRelicCrit;
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
    if (renderQueueId) { cancelAnimationFrame(renderQueueId); renderQueueId = null; }

    const sortedUnits = unitDatabase.map(unit => {
        processUnitCache(unit);
        // Use index 3 (Full Config) for initial sort, or 0 if others are empty
        const refList = unitBuildsCache[unit.id][activeAbilityIds.has(unit.id) && unit.ability ? 'abil' : 'base'].fixed[3];
        return { unit, maxScore: (refList && refList.length > 0) ? (unit.id === 'law' ? (refList[0].range || 0) : refList[0].dps) : 0 };
    }).sort((a, b) => b.maxScore - a.maxScore);

    function processNextChunk() {
        const startTime = performance.now();
        const fragment = document.createDocumentFragment();
        let itemsAdded = 0;
        let staggerIndex = 0; 

        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;
            renderQueueIndex++;

            let abilityLabel = 'Ability';
            let toggleScript = '';
            if (unit.id === 'phantom_captain') abilityLabel = 'Planes';
            else if (unit.id === 'megumin') abilityLabel = 'Passive';
            else if (unit.id === 'sharpshooter') {
                abilityLabel = activeAbilityIds.has(unit.id) ? 'Sniper Mode' : 'Normal Mode';
                toggleScript = `; this.parentElement.previousElementSibling.innerText = this.checked ? 'Sniper Mode' : 'Normal Mode'`;
            }
            
            const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>${abilityLabel}</span><label><input type="checkbox" class="ability-cb" ${activeAbilityIds.has(unit.id) ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)${toggleScript}"><div class="mini-switch"></div></label></div>` : '<div></div>';
            const topControls = `<div class="unit-toolbar"><div class="flex gap-md"><button class="select-btn" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button><button class="calc-btn" onclick="openCalc('${unit.id}')">🖩 Custom Relics</button></div>${abilityToggleHtml}</div>`;
            
            let defaultSort = 'dps';
            if (['sjw', 'esdeath'].includes(unit.id)) defaultSort = 'damage';
            else if (unit.id === 'law') defaultSort = 'range';

            const bottomControls = `
                <div class="search-container">
                    <div class="search-row"><input type="text" placeholder="Search..." class="search-input" onkeyup="filterList(this)">
                        <select onchange="filterList(this)" data-filter="sort" class="search-select sort-select">
                            <option value="dps" ${defaultSort === 'dps' ? 'selected' : ''}>Sort: DPS</option>
                            <option value="damage" ${defaultSort === 'damage' ? 'selected' : ''}>Sort: Damage</option>
                            <option value="range" ${defaultSort === 'range' ? 'selected' : ''}>Sort: Range</option>
                            <option value="efficiency" ${defaultSort === 'efficiency' ? 'selected' : ''}>Sort: Efficiency</option>
                        </select>
                        <select onchange="filterList(this)" data-filter="prio" class="search-select prio-select"><option value="all">All Prio</option><option value="dmg">Dmg</option><option value="spa">SPA</option><option value="range">Range</option></select>
                    </div>
                    <div class="search-row">
                        <select onchange="filterList(this)" data-filter="set" class="search-select"><option value="all">All Sets</option><option value="Master Ninja">Ninja Set</option><option value="Sun God">Sun God Set</option><option value="Laughing Captain">Laughing Set</option><option value="Ex Captain">Ex Set</option><option value="Shadow Reaper">Shadow Reaper</option><option value="Reaper Set">Reaper Set</option></select>
                        <select onchange="filterList(this)" data-filter="head" class="search-select"><option value="all">All Heads</option><option value="sun_god">Sun God</option><option value="ninja">Ninja</option><option value="reaper_necklace">Reaper</option><option value="shadow_reaper_necklace">Shadow Reaper</option><option value="none">No Head</option></select>
                    </div>
                </div>`;

            let mainContent = '';
            ['base', 'abil'].forEach(type => { ['bugged', 'fixed'].forEach(mode => { for(let cfg=0; cfg<4; cfg++) mainContent += `<div class="top-builds-list build-list-container mode-${type} mode-${mode} cfg-${cfg}" id="results-${type}-${mode}-${cfg}-${unit.id}"></div>`; }); });

            const card = createBaseUnitCard(unit, {
                id: 'card-' + unit.id,
                additionalClasses: (activeAbilityIds.has(unit.id) ? ' use-ability' : '') + (selectedUnitIds.has(unit.id) ? ' is-selected' : ''),
                bannerContent: `<div class="placement-badge">Max Place: ${unit.placement}</div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div>${unit.meta ? `<button class="trait-guide-btn" onclick="openTraitGuide('${unit.id}')">📋 Rec. Traits</button>` : ''}`,
                topControls, bottomControls, mainContent
            });

            card.style.setProperty('--stagger-delay', `${staggerIndex * 50}ms`); 
            staggerIndex++; fragment.appendChild(card); itemsAdded++;
            if (performance.now() - startTime > 12) break;
        }
        
        if (itemsAdded > 0) {
            container.appendChild(fragment);
            for(let i = renderQueueIndex - itemsAdded; i < renderQueueIndex; i++) updateBuildListDisplay(sortedUnits[i].unit.id);
        }

        if (renderQueueIndex < sortedUnits.length) renderQueueId = requestAnimationFrame(processNextChunk);
        else {
            renderQueueId = null; updateCompareBtn();
            // Force re-apply visibility classes if Inventory Mode is off, or generally apply them
            if(document.getElementById('globalHeadPiece').checked) document.body.classList.add('show-head');
            if(document.getElementById('globalSubStats').checked) document.body.classList.add('show-subs');
        }
    }
    processNextChunk();
}

function setGuideMode(mode) {
    currentGuideMode = mode;
    const isFixed = (mode === 'fixed');
    if(document.getElementById('hypoLabel')) document.getElementById('hypoLabel').innerText = isFixed ? "Fixed Relics" : "Bugged Relics";
    if(document.getElementById('guideHypoLabel')) document.getElementById('guideHypoLabel').innerText = isFixed ? "Fixed Relics" : "Bugged Relics";
    const warning = document.getElementById('guideWarning');
    if(warning) warning.classList[mode === 'current' ? 'remove' : 'add']('hidden');
}

function populateGuideDropdowns() {
    const unitSelect = document.getElementById('guideUnitSelect');
    const traitSelect = document.getElementById('guideTraitSelect');
    if (!unitSelect || !traitSelect) return;
    unitSelect.innerHTML = '<option value="all">All Units</option>';
    traitSelect.innerHTML = '<option value="auto">Auto (Best Trait)</option>';
    unitDatabase.forEach(unit => unitSelect.add(new Option(unit.name, unit.id)));
    traitsList.forEach(trait => { if (trait.id !== 'none') traitSelect.add(new Option(trait.name, trait.id)); });
}

function openGuideConfig() {
    tempGuideUnit = document.getElementById('guideUnitSelect').value;
    tempGuideTrait = document.getElementById('guideTraitSelect').value;
    renderGuideConfigUI();
    toggleModal('guideConfigModal', true);
}

const closeGuideConfig = () => toggleModal('guideConfigModal', false);
const selectGuideUnit = (id) => { tempGuideUnit = id; renderGuideConfigUI(); };
const selectGuideTrait = (id) => { tempGuideTrait = id; renderGuideConfigUI(); };

function renderGuideConfigUI() {
    const unitGrid = document.getElementById('guideConfigUnitGrid');
    const traitList = document.getElementById('guideConfigTraitList');
    
    let unitsHtml = `<div class="config-item ${tempGuideUnit === 'all' ? 'selected' : ''}" onclick="selectGuideUnit('all')"><div class="cp-avatar-placeholder">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => unitsHtml += `<div class="config-item ${tempGuideUnit === u.id ? 'selected' : ''}" onclick="selectGuideUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`);
    unitGrid.innerHTML = unitsHtml;

    let availableTraits = [...traitsList, ...(tempGuideUnit !== 'all' ? (unitSpecificTraits[tempGuideUnit] || []) : customTraits)];
    availableTraits = availableTraits.filter((t, index, self) => index === self.findIndex((x) => x.id === t.id) && t.id !== 'none');
    
    let traitsHtml = `<div class="config-chip ${tempGuideTrait === 'auto' ? 'selected' : ''}" onclick="selectGuideTrait('auto')">Auto (Best)</div>`;
    availableTraits.forEach(t => traitsHtml += `<div class="config-chip ${tempGuideTrait === t.id ? 'selected' : ''}" onclick="selectGuideTrait('${t.id}')">${t.name}</div>`);
    traitList.innerHTML = traitsHtml;
}

const applyGuideConfig = () => {
    document.getElementById('guideUnitSelect').value = tempGuideUnit;
    document.getElementById('guideTraitSelect').value = tempGuideTrait;
    renderGuides(); closeGuideConfig();
};

function getGuideBuildsFromCache(unit, mode, configIndex) {
    if (!unitBuildsCache || !unitBuildsCache[unit.id]) return [];
    let source = unitBuildsCache[unit.id].base;
    if (unit.ability !== undefined && unitBuildsCache[unit.id].abil && unitBuildsCache[unit.id].abil[mode]) source = unitBuildsCache[unit.id].abil;
    return source?.[mode]?.[configIndex] || [];
}

function processGuideTop3(rawBuilds, unit, traitFilterId) {
    if (!rawBuilds || rawBuilds.length === 0) return [];
    let filtered = [...rawBuilds];
    if (traitFilterId && traitFilterId !== 'auto') {
        let targetName = "";
        const tObj = traitsList.find(t => t.id === traitFilterId) || customTraits.find(t => t.id === traitFilterId) || (unitSpecificTraits[unit.id] || []).find(t => t.id === traitFilterId);
        if (tObj) targetName = tObj.name;
        if (targetName) filtered = filtered.filter(b => b.traitName === targetName);
    }
    filtered.sort(unit.id === 'law' ? (a, b) => (b.range || 0) - (a.range || 0) : (a, b) => b.dps - a.dps);
    return filtered.slice(0, 3);
}

function createGuideCard(unitObj, builds, modeClass) {
    const bestBuild = builds[0];
    const isRange = unitObj.id === 'law';
    const bannerContent = `<div class="mp-container ${isRange ? 'is-range' : 'is-dps'}"><span class="mp-label">${isRange ? 'Max Range' : 'Max Potential'}</span><span class="mp-val">${isRange ? (bestBuild.range || 0).toFixed(1) : format(bestBuild.dps)}</span></div>
        ${getUnitImgHtml(unitObj, 'unit-avatar')}<div class="unit-title"><h2>${unitObj.name}</h2><span>${unitObj.role} <span class="sss-tag">SSS</span></span></div>`;

    const mainContent = `<div class="top-builds-list guide-list-wrapper">` + builds.map((build, index) => generateBuildRowHTML(build, index, { totalCost: unitObj.totalCost || 50000, placement: unitObj.placement || 1, sortMode: 'dps', unitId: unitObj.id })).join('') + `</div>`;

    return createBaseUnitCard(unitObj, {
        additionalClasses: `calc-guide-card ${modeClass}`,
        bannerContent,
        tagsContent: `<span class="guide-trait-tag text-xs-plus">Best: ${bestBuild.traitName}</span>`,
        mainContent
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

    const unitsToProcess = (filterUnitId === 'all') ? unitDatabase : unitDatabase.filter(u => u.id === filterUnitId);
    unitsToProcess.forEach(unit => {
        if (!unitBuildsCache[unit.id]) processUnitCache(unit);
        for(let cfg = 0; cfg < 4; cfg++) {
            const bugged = processGuideTop3(getGuideBuildsFromCache(unit, 'bugged', cfg), unit, filterTraitId);
            if (bugged.length) guideGrid.appendChild(createGuideCard(unit, bugged, `mode-bugged cfg-${cfg}`));
            const fixed = processGuideTop3(getGuideBuildsFromCache(unit, 'fixed', cfg), unit, filterTraitId);
            if (fixed.length) guideGrid.appendChild(createGuideCard(unit, fixed, `mode-fixed cfg-${cfg}`));
        }
    });
    
    if (guideGrid.children.length === 0) guideGrid.innerHTML = `<div class="msg-empty">No guides found. Database may still be calculating.</div>`;
}