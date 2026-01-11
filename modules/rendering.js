// ============================================================================
// RENDERING.JS - HTML Generation & Display Functions
// ============================================================================

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
        // UPDATED: Now passing the array of objects directly to getRichBadgeHtml
        if (s.head) subInnerHtml += `<div class="stat-line"><span class="sl-label">SUB</span> ${getRichBadgeHtml(s.head)}</div>`;
        if (s.body) subInnerHtml += `<div class="stat-line"><span class="sl-label">BODY</span> ${getRichBadgeHtml(s.body)}</div>`;
        if (s.legs) subInnerHtml += `<div class="stat-line"><span class="sl-label">LEGS</span> ${getRichBadgeHtml(s.legs)}</div>`;
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

    let filtered = allBuilds.filter(r => {
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

    if(filtered.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; color:#666;">No matches found.</div>';
        return;
    }
    
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

    listContainer.innerHTML = displaySlice.map((r, i) => generateBuildRowHTML(r, i)).join('');
}

// Render database with async chunking
function renderDatabase() {
    const container = document.getElementById('dbPage');
    
    if (renderQueueIndex === 0) {
        container.innerHTML = '';
        cachedResults = {}; 
        unitBuildsCache = {};
    }

    if (renderQueueId) {
        cancelAnimationFrame(renderQueueId);
        renderQueueId = null;
    }

    const filteredBuilds = getFilteredBuilds();
    const subCandidates = getValidSubCandidates();
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    const headsToProcess = includeHead ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'];

    let sortedUnits = [];
    unitDatabase.forEach(unit => {
        const isAbilActive = activeAbilityIds.has(unit.id);
        let currentStats = { ...unit.stats };
        if (isAbilActive && unit.ability) Object.assign(currentStats, unit.ability);
        
        if(unit.tags) currentStats.tags = unit.tags;

        if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
            currentStats.dot = 200; 
            currentStats.dotDuration = 4; 
            currentStats.dotStacks = 1; 
        }

        if (unit.id === 'bambietta') {
            const mode = BAMBIETTA_MODES[bambiettaState.element];
            if (mode) Object.assign(currentStats, mode);
        }

        const results = calculateUnitBuilds(unit, currentStats, filteredBuilds, subCandidates, headsToProcess, includeSubs);
        unitBuildsCache[unit.id] = results;

        let maxScore = 0;
        if (results.length > 0) {
            maxScore = unit.id === 'law' ? (results[0].range || 0) : results[0].dps;
        }
        sortedUnits.push({ unit: unit, maxScore: maxScore });
    });

    sortedUnits.sort((a, b) => b.maxScore - a.maxScore);

    function processNextChunk() {
        const startTime = performance.now();
        
        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;
            renderQueueIndex++;

            const isAbilActive = activeAbilityIds.has(unit.id);
            let currentStats = { ...unit.stats };
            if (isAbilActive && unit.ability) Object.assign(currentStats, unit.ability);
            
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
            card.id = 'card-' + unit.id;
            card.style.animation = "fadeIn 0.3s ease";
            
            if(selectedUnitIds.has(unit.id)) card.classList.add('is-selected');
            const abilityToggleHtml = unit.ability ? `<div class="toggle-wrapper"><span>Ability</span><label><input type="checkbox" class="ability-cb" ${isAbilActive ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)"><div class="mini-switch"></div></label></div>` : '<div></div>';
            
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

            card.innerHTML = `<div class="unit-banner"><div class="placement-badge">Max Place: ${unit.placement}</div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role} <span class="sss-tag">SSS</span></span></div>${traitButtonHtml}</div>${tagsHtml}${toolbarHtml}${kiritoControlsHtml}${bambiettaControlsHtml}${searchControls}<div class="top-builds-list" id="results-${unit.id}"></div>`;
            container.appendChild(card);
            
            updateBuildListDisplay(unit.id);

            if (performance.now() - startTime > 10) {
                renderQueueId = requestAnimationFrame(processNextChunk);
                return;
            }
        }
        renderQueueId = null;
        updateCompareBtn();
    }

    processNextChunk();
}

// Filter list helper
const filterList = (e) => { 
    const unitId = e.closest('.unit-card').id.replace('card-', '');
    updateBuildListDisplay(unitId);
};