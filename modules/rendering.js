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
    const foundTrait = getTraitByName(build.traitName, unitId);

    let traitLimit = null;
    if (build.traitName && build.traitName.includes('Ruler')) {
        traitLimit = 1;
    } else if (foundTrait && foundTrait.limitPlace) {
        traitLimit = foundTrait.limitPlace;
    }

    const actualPlacement = traitLimit ? Math.min(unitMaxPlacement, traitLimit) : unitMaxPlacement;
    const costMult = (foundTrait && foundTrait.costReduction) ? Math.max(0, 1 - (foundTrait.costReduction / 100)) : 1;
    const actualTotalCost = unitCost * actualPlacement * costMult;
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
    const { totalCost = 50000, placement = 1, sortMode = 'dps', unitId = '', benchmarkDps = 0 } = unitConfig;
    
    let rankClass = (i < 3 ? `rank-${i+1}` : 'rank-other') + (r.isCustom ? ' is-custom' : '');
    const effScore = calculateBuildEfficiency(r, totalCost, placement, unitId).toFixed(3);

    // OPTIMALITY BADGE LOGIC
let optimalityHtml = '';
if (inventoryMode && benchmarkDps > 0) {
    const optPct = (r.dps / benchmarkDps) * 100;
    
    // Updated to more "premium" color palette
    // 95%+ = Emerald Glow, 80%+ = Amber Glow, <80% = Ruby Glow
    let color, glow;
    if (optPct >= 95) {
        color = '#00ffaa'; // Vibrant Emerald
        glow = 'rgba(0, 255, 170, 0.15)';
    } else if (optPct >= 80) {
        color = '#ffcc00'; // Pure Amber
        glow = 'rgba(255, 204, 0, 0.15)';
    } else {
        color = '#ff4d4d'; // Soft Ruby
        glow = 'rgba(255, 77, 77, 0.15)';
    }
    
    optimalityHtml = `
        <div class="optimality-badge" 
             style="color: ${color}; border-color: ${color}66; --glow-color: ${glow};">
            <span class="opt-label" style="color: ${color}">OPTIMALITY</span>
            <span class="opt-pct">${optPct.toFixed(1)}%</span>
        </div>
    `;
}

    // PRIORITY BADGE LOGIC
    const prioConfig = {
        'spa': { label: 'SPA STAT', cls: 'prio-spa' },
        'range': { label: 'RANGE STAT', cls: 'prio-range' },
        'default': { label: 'DMG STAT', cls: 'prio-dmg' }
    };

    let prioHtml = '';
    if (r.relicIds) {
        const hId = r.relicIds.head || 'none';
        const bId = r.relicIds.body || 'none-b';
        const lId = r.relicIds.legs || 'none-l';
        const currentPrio = r.prio || 'default';
        const secCfg = prioConfig[currentPrio] || prioConfig['default'];
        
        const invBadge = `<button class="prio-badge prio-inv clickable" onclick="viewInventoryItems('${hId}', '${bId}', '${lId}')" title="Locate in Inventory"><img src="https://img.icons8.com/fluency-systems-filled/48/ffffff/backpack.png" alt="Inv"></button>`;
        const statBadge = `<span class="prio-badge ${secCfg.cls}">${secCfg.label}</span>`;
        prioHtml = `<div class="br-badges">${invBadge}${statBadge}</div>`;
    } else {
        const pCfg = prioConfig[r.prio] || prioConfig['default'];
        prioHtml = `<span class="prio-badge ${pCfg.cls}">${pCfg.label}</span>`;
    }

    const mainBodyBadge = getBadgeHtml(r.mainStats.body, MAIN_STAT_VALS.body[r.mainStats.body]);
    const mainLegsBadge = getBadgeHtml(r.mainStats.legs, MAIN_STAT_VALS.legs[r.mainStats.legs]);
    const headHtml = getHeadBadgeHtml(r.headUsed);

    const s = r.subStats || {};
    
    const headRow = (r.headUsed && r.headUsed !== 'none') ? `<div class="stat-line"><span class="sl-label">SUB</span> ${getRichBadgeHtml(s.head || [])}</div>` : '';
    const bodyRow = `<div class="stat-line"><span class="sl-label">BODY</span> ${getRichBadgeHtml(s.body || [])}</div>`;
    const legsRow = `<div class="stat-line"><span class="sl-label">LEGS</span> ${getRichBadgeHtml(s.legs || [])}</div>`;
    const subInnerHtml = `${headRow}${bodyRow}${legsRow}`;

    let displayVal = format(r.dps), displayLabel = "DPS";
    if (sortMode === 'range') { displayVal = (r.range || 0).toFixed(1); displayLabel = "RNG"; }
    
    return `
        <div class="build-row ${rankClass} ${sortMode === 'efficiency' ? 'is-efficiency-sort' : ''}">
            <div class="br-header">
                <div class="br-header-info"><span class="br-rank">#${i+1}</span><span class="br-set">${r.setName}</span><span class="br-sep">/</span><span class="br-trait">${r.traitName}</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    ${optimalityHtml}
                    ${prioHtml}
                </div>
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

    // --- CALCULATE BENCHMARK FOR OPTIMALITY ---
    let benchmarkDps = 0;
    if (inventoryMode && window.STATIC_BUILD_DB) {
        const isAbility = activeAbilityIds.has(unitId);
        const mode = document.body.classList.contains('show-fixed-relics') ? 'fixed' : 'bugged';
        let dbKey = unitId + (unitId === 'kirito' && kiritoState.card ? 'kirito_card' : '') + (isAbility && unitObj.ability ? '_abil' : '');

        const showHead = document.body.classList.contains('show-head');
        const showSubs = document.body.classList.contains('show-subs');
        let cfgIdx = (showHead ? 2 : 0) + (showSubs ? 1 : 0);

        const perfectBuilds = window.STATIC_BUILD_DB[dbKey]?.[mode]?.[cfgIdx];
        if (perfectBuilds && perfectBuilds.length > 0) {
            benchmarkDps = perfectBuilds[0].dps;
        }
    }

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
            const prioMatch = (prioSelect === 'all' || r.prio === prioSelect);
            return searchText.includes(searchInput) && prioMatch && (setSelect === 'all' || r.setName === setSelect) && (headSelect === 'all' || (r.headUsed || 'none') === headSelect);
        });

        if (prioSelect === 'all') {
            const uniqueMap = new Map();
            filtered.forEach(r => {
                const key = `${r.setName}|${r.traitName}|${r.mainStats.body}|${r.mainStats.legs}|${r.headUsed}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, r);
                } else {
                    const existing = uniqueMap.get(key);
                    const isRangeSort = (sortSelect === 'range' || unitId === 'law');
                    const isBetter = isRangeSort ? (r.range > existing.range) : (r.dps > existing.dps);
                    if (isBetter) uniqueMap.set(key, r);
                }
            });
            filtered = Array.from(uniqueMap.values());
        }

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
        return displaySlice.map((r, i) => generateBuildRowHTML(r, i, { 
            totalCost: unitCost, 
            placement: unitPlace, 
            sortMode: sortSelect, 
            unitId,
            benchmarkDps: benchmarkDps 
        })).join('');
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

        let dbKey = unit.id + (unit.id === 'kirito' && kiritoState.card ? 'kirito_card' : '') + (useAbility && unit.ability ? '_abil' : '');
        const resultSet = [];
        const useInventory = (inventoryMode === true);

        for (let i = 0; i < 4; i++) {
            const cfg = CONFIGS[i];
            let calculatedResults = [];
            let loadedFromStatic = false;
            
            if (!useInventory) {
                const canUseStatic = (unit.id !== 'bambietta') || (bambiettaState.element === 'Dark');
                if (canUseStatic && window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
                    const dbList = window.STATIC_BUILD_DB[dbKey][mode];
                    if(dbList && dbList[i]) {
                        // Load static data (Deep copy to avoid mutating cache)
                        calculatedResults = dbList[i].map(r => ({...r}));
                        loadedFromStatic = true;
                    }
                }
            }

            // OPTIMIZATION: If Miku Buff is active, update the static results instead of full re-calc
            if (loadedFromStatic && window.mikuBuffActive && typeof reconstructMathData === 'function') {
                // Smart Filter: Keep Top 50 Global AND Top 10 per Trait
                const traitCounts = {};
                const subset = [];
                calculatedResults.forEach((res, index) => {
                    const tName = res.traitName || 'Unknown';
                    if (!traitCounts[tName]) traitCounts[tName] = 0;
                    if (index < 50 || traitCounts[tName] < 10) {
                        subset.push(res);
                        traitCounts[tName]++;
                    }
                });
                calculatedResults = subset;
                
                calculatedResults.forEach(entry => {
                    try {
                        const newRes = reconstructMathData(entry); // Recalculates with global flags (Miku) active
                        if (newRes) {
                            entry.dps = newRes.total;
                            entry.dmgVal = newRes.dmgVal * (newRes.critData ? newRes.critData.avgMult : 1);
                            entry.spa = newRes.spa;
                            entry.range = newRes.range;
                        }
                    } catch (e) { console.warn("Buff recalc error", e); }
                });
                // Re-sort after buff application
                calculatedResults.sort((a, b) => b.dps - a.dps);
            }
            
            // Cache the results (either raw static or buff-updated)
            calculatedResults.forEach(r => cachedResults[r.id] = r);

            const traitsForCalc = (calculatedResults.length > 0) ? [...(typeof customTraits !== 'undefined' ? customTraits : []), ...(unitSpecificTraits[unit.id] || [])] : null;
            
            if (traitsForCalc === null || traitsForCalc.length > 0 || useInventory) {
                const dynamicResults = calculateUnitBuilds(unit, null, getFilteredBuilds(), getValidSubCandidates(), cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace'] : ['none'], cfg.subs, traitsForCalc, useAbility, mode);
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

    // Helper to get score for sorting without full calculation
    const getQuickScore = (unit) => {
        const isAbility = activeAbilityIds.has(unit.id) && unit.ability;
        const dbKey = unit.id + (unit.id === 'kirito' && kiritoState.card ? 'kirito_card' : '') + (isAbility ? '_abil' : '');
        
        // Peek at static DB if available
        if (window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
            const list = window.STATIC_BUILD_DB[dbKey]['fixed']?.[3];
            if (list && list.length > 0) {
                return unit.id === 'law' ? (list[0].range || 0) : list[0].dps;
            }
        }
        return 0;
    };

    const sortedUnits = unitDatabase.map(unit => {
        // OPTIMIZATION: Do NOT process cache here. Use quick lookup for sort.
        return { unit, maxScore: getQuickScore(unit) };
    }).sort((a, b) => b.maxScore - a.maxScore);

    function processNextChunk() {
        const startTime = performance.now();
        const fragment = document.createDocumentFragment();
        let itemsAdded = 0;
        let staggerIndex = 0; 

        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;
            
            // Process cache HERE, one unit at a time
            processUnitCache(unit);
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
            const topControls = `<div class="unit-toolbar"><div class="flex" style="gap: 4px; align-items: center;"><button class="select-btn" style="padding: 2px 8px; font-size: 0.75rem; min-height: 26px;" onclick="toggleSelection('${unit.id}')">${selectedUnitIds.has(unit.id) ? 'Selected' : 'Select'}</button><button class="calc-btn" style="padding: 2px 8px; font-size: 0.75rem; min-height: 26px;" onclick="openCalc('${unit.id}')">🖩 Custom</button><button class="calc-btn" style="padding: 2px 8px; font-size: 0.75rem; min-height: 26px;" onclick="openTraitBestList('${unit.id}')" title="Best Build per Trait">📊 Traits</button></div>${abilityToggleHtml}</div>`;
            
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
                        <select onchange="filterList(this)" data-filter="set" class="search-select"><option value="all">All Sets</option><option value="Master Ninja">Ninja Set</option><option value="Sun God">Sun God Set</option><option value="Laughing Captain">Laughing Set</option><option value="Ex Captain">Ex Set</option><option value="Shadow Reaper">Shadow Reaper</option><option value="Reaper Set">Reaper Set</option><option value="Super Roku">Super Roku</option><option value="Bio-Android">Bio-Android</option></select>
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
    tempGuideUnitSet = new Set(guideUnitSelection);
    tempGuideTrait = document.getElementById('guideTraitSelect').value;
    renderGuideConfigUI();
    toggleModal('guideConfigModal', true);
}

const closeGuideConfig = () => toggleModal('guideConfigModal', false);

const selectGuideUnit = (id) => { 
    if (id === 'all') {
        tempGuideUnitSet.clear();
        tempGuideUnitSet.add('all');
    } else {
        if (tempGuideUnitSet.has('all')) tempGuideUnitSet.delete('all');
        if (tempGuideUnitSet.has(id)) tempGuideUnitSet.delete(id); else tempGuideUnitSet.add(id);
        if (tempGuideUnitSet.size === 0) tempGuideUnitSet.add('all');
    }
    renderGuideConfigUI(); 
};

const selectGuideTrait = (id) => { tempGuideTrait = id; renderGuideConfigUI(); };

function renderGuideConfigUI() {
    const unitGrid = document.getElementById('guideConfigUnitGrid');
    const traitList = document.getElementById('guideConfigTraitList');
    const isAll = tempGuideUnitSet.has('all');

    let unitsHtml = `<div class="config-item ${isAll ? 'selected' : ''}" onclick="selectGuideUnit('all')"><div class="cp-avatar-placeholder">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => {
        const isSelected = tempGuideUnitSet.has(u.id); 
        unitsHtml += `<div class="config-item ${isSelected ? 'selected' : ''}" onclick="selectGuideUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`;
    });
    unitGrid.innerHTML = unitsHtml;

    let availableTraits = [...traitsList, ...customTraits];
    if (!isAll && tempGuideUnitSet.size === 1) {
        const singleId = Array.from(tempGuideUnitSet)[0];
        if (unitSpecificTraits[singleId]) availableTraits = [...availableTraits, ...unitSpecificTraits[singleId]];
    }
    availableTraits = availableTraits.filter((t, index, self) => index === self.findIndex((x) => x.id === t.id) && t.id !== 'none');
    
    let traitsHtml = `<div class="config-chip ${tempGuideTrait === 'auto' ? 'selected' : ''}" onclick="selectGuideTrait('auto')">Auto (Best)</div>`;
    availableTraits.forEach(t => traitsHtml += `<div class="config-chip ${tempGuideTrait === t.id ? 'selected' : ''}" onclick="selectGuideTrait('${t.id}')">${t.name}</div>`);
    traitList.innerHTML = traitsHtml;
}

const applyGuideConfig = () => {
    guideUnitSelection = new Set(tempGuideUnitSet);
    const unitSelect = document.getElementById('guideUnitSelect');
    if (guideUnitSelection.has('all')) {
        unitSelect.innerHTML = '<option value="all">All Units</option>';
        unitSelect.value = 'all';
    } else {
        const count = guideUnitSelection.size;
        const text = count === 1 ? unitDatabase.find(u => u.id === Array.from(guideUnitSelection)[0]).name : `${count} Units Selected`;
        unitSelect.innerHTML = `<option value="multi">${text}</option>`;
        unitSelect.value = 'multi';
    }
    document.getElementById('guideTraitSelect').value = tempGuideTrait;
    renderGuides(); 
    closeGuideConfig();
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
        const tObj = getTraitById(traitFilterId, unit.id);
        const targetName = tObj ? tObj.name : "";
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
    
    const filterTraitId = document.getElementById('guideTraitSelect').value;

    let uName = 'All Units';
    if (!guideUnitSelection.has('all')) {
        if (guideUnitSelection.size === 1) {
            uName = unitDatabase.find(u => u.id === Array.from(guideUnitSelection)[0])?.name || 'Unknown';
        } else {
            uName = `${guideUnitSelection.size} Units`;
        }
    }

    let tName = 'Auto Trait';
    if(filterTraitId !== 'auto') { 
        const found = getTraitById(filterTraitId);
        if(found) tName = found.name; 
    }
    document.getElementById('dispGuideUnit').innerText = uName; 
    document.getElementById('dispGuideTrait').innerText = tName;

    const unitsToProcess = (guideUnitSelection.has('all')) ? unitDatabase : unitDatabase.filter(u => guideUnitSelection.has(u.id));
    
    const scoredUnits = unitsToProcess.map(unit => {
        if (!unitBuildsCache[unit.id]) processUnitCache(unit);
        const refBuilds = getGuideBuildsFromCache(unit, 'fixed', 3);
        const top = processGuideTop3(refBuilds, unit, filterTraitId);
        let score = 0;
        if (top && top.length > 0) score = (unit.id === 'law') ? (top[0].range || 0) : top[0].dps;
        return { unit, score };
    });

    scoredUnits.sort((a, b) => b.score - a.score);

    scoredUnits.forEach(({ unit }) => {
        for(let cfg = 0; cfg < 4; cfg++) {
            const bugged = processGuideTop3(getGuideBuildsFromCache(unit, 'bugged', cfg), unit, filterTraitId);
            if (bugged.length) guideGrid.appendChild(createGuideCard(unit, bugged, `mode-bugged cfg-${cfg}`));
            const fixed = processGuideTop3(getGuideBuildsFromCache(unit, 'fixed', cfg), unit, filterTraitId);
            if (fixed.length) guideGrid.appendChild(createGuideCard(unit, fixed, `mode-fixed cfg-${cfg}`));
        }
    });
    
    if (guideGrid.children.length === 0) guideGrid.innerHTML = `<div class="msg-empty">No guides found. Database may still be calculating.</div>`;
}

function openTraitBestList(unitId) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    const isFixed = document.body.classList.contains('show-fixed-relics');
    const mode = isFixed ? 'fixed' : 'bugged';
    const type = activeAbilityIds.has(unitId) && unit.ability ? 'abil' : 'base';
    
    const showHead = document.body.classList.contains('show-head');
    const showSubs = document.body.classList.contains('show-subs');
    let cfgIndex = 0;
    if (!showHead && !showSubs) cfgIndex = 0;
    else if (!showHead && showSubs) cfgIndex = 1;
    else if (showHead && !showSubs) cfgIndex = 2;
    else if (showHead && showSubs) cfgIndex = 3;

    const allBuilds = unitBuildsCache[unitId]?.[type]?.[mode]?.[cfgIndex] || [];
    
    if (allBuilds.length === 0) {
        showUniversalModal({
            title: 'TRAIT LEADERBOARD',
            content: '<div class="msg-empty">No builds calculated. Please wait for calculation to finish.</div>',
            size: 'modal-sm'
        });
        return;
    }

    const bestByTrait = new Map();
    allBuilds.forEach(build => {
        if (!bestByTrait.has(build.traitName)) {
            bestByTrait.set(build.traitName, build);
        } else {
            const current = bestByTrait.get(build.traitName);
            const isRange = (unitId === 'law');
            const valBuild = isRange ? (build.range || 0) : build.dps;
            const valCurrent = isRange ? (current.range || 0) : current.dps;
            
            if (valBuild > valCurrent) {
                bestByTrait.set(build.traitName, build);
            }
        }
    });

    const sortedTraits = Array.from(bestByTrait.values()).sort((a, b) => {
        const isRange = (unitId === 'law');
        const valA = isRange ? (a.range || 0) : a.dps;
        const valB = isRange ? (b.range || 0) : b.dps;
        return valB - valA;
    });

    let html = `<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="width: 48px; height: 48px; flex-shrink: 0; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #222;">
            <img src="${unit.img}" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
        <div>
            <div class="text-lg font-bold text-white leading-tight">${unit.name}</div>
            <div class="text-xs text-dim">${unit.role}</div>
        </div>
    </div>`;

    html += `<table class="compare-table"><thead><tr><th style="width: 10%">#</th><th style="width: 30%">Trait</th><th style="width: 40%">Best Setup</th><th style="width: 20%">Result</th></tr></thead><tbody>`;

    const mapStat = (s) => {
        if (s === 'cf') return 'Crit Rate';
        if (s === 'cm') return 'Crit Dmg';
        if (s === 'spa') return 'SPA';
        if (s === 'range') return 'Range';
        if (s === 'dot') return 'DoT';
        return 'Dmg';
    };

    sortedTraits.forEach((b, idx) => {
        const isRange = (unitId === 'law');
        const val = isRange ? (b.range || 0).toFixed(1) : format(b.dps);
        const label = isRange ? 'RNG' : 'DPS';
        const labelClass = isRange ? 'comp-val-rng' : 'comp-val-dps';
        let headText = (b.headUsed && b.headUsed !== 'none') ? ` + ${({'sun_god':'Sun God','ninja':'Ninja','reaper_necklace':'Reaper','shadow_reaper_necklace':'S.Reaper'})[b.headUsed] || 'Head'}` : '';
        const setupText = `${b.setName} <span class="text-dim text-xs">(${mapStat(b.mainStats.body)}/${mapStat(b.mainStats.legs)})</span>${headText}`;
        
        let rankStyle = 'opacity: 0.5; font-size: 0.9em;';
        if (idx === 0) rankStyle = 'color: #fbbf24; font-weight: bold; font-size: 1.1em; text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);';
        else if (idx === 1) rankStyle = 'color: #e2e8f0; font-weight: bold;';
        else if (idx === 2) rankStyle = 'color: #b45309; font-weight: bold;';

        html += `<tr><td style="text-align: center;"><span style="${rankStyle}">#${idx + 1}</span></td><td><span class="comp-tag">${b.traitName}</span></td><td><div class="text-sm">${setupText}</div><div class="text-xs text-dim">Prio: ${b.prio.toUpperCase()}</div></td><td><div class="comp-highlight">${val} <span class="comp-val-label ${labelClass}">${label}</span></div></td></tr>`;
    });

    html += `</tbody></table>`;
    showUniversalModal({ title: `TRAIT LEADERBOARD`, content: html, size: 'modal-lg' });
}