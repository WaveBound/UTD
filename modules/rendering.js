// Ensure Global Caches are initialized
window.unitBuildsCache = window.unitBuildsCache || {};
window.cachedResults = window.cachedResults || {};

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
    },
    robot1718: (unit) => {
        const currentMode = robot1718State.mode;
        if (!unit.modes) return '';
        const options = Object.keys(unit.modes).map(k =>
            `<option value="${k}" ${currentMode === k ? 'selected' : ''}>${k} (${unit.modes[k].desc})</option>`
        ).join('');
        return `<div class="unit-toolbar custom-toolbar"><div class="bambi-wrapper" style="display: flex; align-items: center; width: 100%;"><span class="bambi-label" style="margin-right: 6px;">Form:</span><select onchange="setRobot1718Mode(this.value, this)" class="bambi-select" style="flex: 1;">${options}</select></div></div>`;
    },
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
    const unitObj = unitDatabase.find(u => u.id === unitId);

    let traitLimit = null;
    if (build.traitName && build.traitName.includes('Ruler')) {
        traitLimit = 1;
    } else if (foundTrait && foundTrait.limitPlace) {
        traitLimit = foundTrait.limitPlace;
    }

    if (build.id && build.id.includes('ABILITY') && unitObj && unitObj.ability && unitObj.ability.limitPlace) {
        traitLimit = traitLimit ? Math.min(traitLimit, unitObj.ability.limitPlace) : unitObj.ability.limitPlace;
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
        'ninja': { name: 'Junior Ninja', border: 'border-ninja', text: 'text-ninja' },
        'reaper_necklace': { name: 'Reaper', border: 'border-reaper', text: 'text-reaper' },
        'shadow_reaper_necklace': { name: 'S. Reaper', border: 'border-sreaper', text: 'text-sreaper' },
        'junior': { name: 'Junior Ninja', border: 'border-ninja', text: 'text-ninja' },
        'biju_head': { name: 'Biju', border: 'border-sungod', text: 'text-sungod' },
        'rebellious_head': { name: 'Rebellious', border: 'border-ninja', text: 'text-ninja' },
        'reanimated_head': { name: 'Reanimated', border: 'border-reaper', text: 'text-reaper' },
        'mage_head': { name: 'Great Mage', border: 'border-dmg', text: 'text-dmg' }
    };
    const h = config[headUsed] || { name: 'Unknown', border: 'border-unknown', text: 'text-unknown' };
    return `<div class="stat-line"><span class="sl-label">HEAD</span><div class="badge-base ${h.border}"><span class="${h.text}">${h.name}</span></div></div>`;
}

function generateBuildRowHTML(r, i, unitConfig = {}) {
    const { totalCost = 50000, placement = 1, sortMode = 'dps', unitId = '', benchmarkDps = 0 } = unitConfig;

    let rankClass = (i < 3 ? `rank-${i + 1}` : 'rank-other') + (r.isCustom ? ' is-custom' : '');
    const effScore = calculateBuildEfficiency(r, totalCost, placement, unitId).toFixed(3);

    let optimalityHtml = '';
    if (inventoryMode && benchmarkDps > 0) {
        const optPct = (r.dps / benchmarkDps) * 100;
        let color, glow;
        if (optPct >= 95) { color = '#00ffaa'; glow = 'rgba(0, 255, 170, 0.15)'; }
        else if (optPct >= 80) { color = '#ffcc00'; glow = 'rgba(255, 204, 0, 0.15)'; }
        else { color = '#ff4d4d'; glow = 'rgba(255, 77, 77, 0.15)'; }

        optimalityHtml = `<div class="optimality-badge" style="color: ${color}; border-color: ${color}66; --glow-color: ${glow};"><span class="opt-label" style="color: ${color}">OPTIMALITY</span><span class="opt-pct">${optPct.toFixed(1)}%</span></div>`;
    }

    const prioConfig = { 'spa': { label: 'SPA STAT', cls: 'prio-spa' }, 'range': { label: 'RANGE STAT', cls: 'prio-range' }, 'default': { label: 'DMG STAT', cls: 'prio-dmg' } };

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

    const mobileToggle = `<button class="mobile-stat-toggle" onclick="toggleRelicStatDisplay(this)"><span class="m-toggle-txt">Main</span><span class="m-toggle-txt">Sub</span></button>`;

    let displayVal = format(r.dps), displayLabel = "DPS";
    if (sortMode === 'range') { displayVal = (r.range || 0).toFixed(1); displayLabel = "RNG"; }

    return `
        <div class="build-row ${rankClass} ${sortMode === 'efficiency' ? 'is-efficiency-sort' : ''}">
            <div class="br-header">
                <div class="br-header-info"><span class="br-rank">#${i + 1}</span><span class="br-set">${r.setName}</span><span class="br-sep">/</span><span class="br-trait">${r.traitName}</span></div>
                <div style="display:flex; gap:8px; align-items:center;">${mobileToggle}${optimalityHtml}${prioHtml}</div>
            </div>
            <div class="br-grid">
                <div class="br-col main"><div class="br-col-title">MAIN STAT</div>${headHtml}<div class="stat-line"><span class="sl-label">BODY</span> ${mainBodyBadge}</div><div class="stat-line"><span class="sl-label">LEGS</span> ${mainLegsBadge}</div></div>
                <div class="br-col sub">
                    <div class="br-col-header"><div class="br-col-title">SUB STAT</div></div>
                    ${headRow}${bodyRow}${legsRow}
                </div>
                <div class="br-res-col">
                    <button class="info-btn" onclick="showMath('${r.id}')">?</button>
                    <div class="eff-score-line" onclick="event.stopPropagation(); openInfoPopup('efficiency')">${effScore} <span class="eff-label">Eff</span></div>
                    <div class="dps-container"><span class="build-dps">${displayVal}</span><span class="dps-label">${displayLabel}</span></div>
                </div>
            </div>
        </div>`;
}

function updateBuildListDisplay(unitId, forceSync = false, renderLimit = 150) {
    const card = document.getElementById('card-' + unitId);
    if (!card) return;
    const unitObj = unitDatabase.find(u => u.id === unitId);
    const unitCost = unitObj ? (unitObj.totalCost || 50000) : 50000;
    const unitPlace = unitObj ? (unitObj.placement || 1) : 1;

    const activeMode = 'fixed';
    const activeCfg = 0; // Hardcoded to 0 for Max Potential DB
    const activeType = activeAbilityIds.has(unitId) && unitObj && unitObj.ability ? 'abil' : 'base';

    let benchmarkDps = 0;
    try {
        if (inventoryMode && window.STATIC_BUILD_DB) {
            let dbKey = (unitId === 'kirito' && kiritoState.card) ? 'kirito_card' : unitId;
            if (activeType === 'abil') dbKey += '_abil';
            const dbEntry = window.STATIC_BUILD_DB[dbKey] || {};
            const modeData = dbEntry[activeMode] || dbEntry[activeMode === 'fixed' ? 'f' : 'b'];
            const perfectBuilds = modeData ? modeData[0] : null;
            if (perfectBuilds && perfectBuilds.length > 0) benchmarkDps = perfectBuilds[0].dps || 0;
        }
    } catch (e) { console.warn("Benchmark error", e); }

    const searchInput = card.querySelector('.search-container input')?.value?.toLowerCase() || '';
    const prioSelect = card.querySelector('select[data-filter="prio"]')?.value || 'all';
    const setSelect = card.querySelector('select[data-filter="set"]')?.value || 'all';
    const headSelect = card.querySelector('select[data-filter="head"]')?.value || 'all';
    const sortSelect = card.querySelector('select[data-filter="sort"]')?.value || 'dps';

    const hydrateBuildEntry = (r) => {
        if (!r) return null;
        if (r.id && r.mainStats && r.setName) return r;

        const res = {
            id: r.id || `db-${unitId}-${Math.random().toString(36).substr(2, 9)}`,
            traitName: (typeof r.t === 'number' ? (traitsList[r.t]?.name) : (r.traitName || r.t)) || 'Unknown Trait',
            setName: (typeof r.s === 'number' ? (SETS[r.s]?.name) : (r.setName || r.s)) || 'Unknown Set',
            dps: r.d || r.dps || 0,
            dmgVal: r.dv || r.dmgVal || 0,
            spa: r.sp || r.spa || 0,
            range: r.ra || r.range || 0,
            prio: r.p || r.prio || 'dmg',
            headUsed: (typeof r.h === 'number' ? (['none', 'sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace', 'junior', 'biju_head', 'rebellious_head', 'reanimated_head', 'mage_head'][r.h]) : (r.headUsed || r.h)) || 'none',
            isCustom: !!(r.c || r.isCustom),
            subStats: r.ss || r.subStats || {},
            mainStats: r.ms || r.mainStats || {
                body: (typeof r.b === 'string' ? r.b : (r.b === 1 ? 'dot' : (r.b === 2 ? 'cm' : 'dmg'))),
                legs: (typeof r.l === 'string' ? r.l : (r.l === 1 ? 'spa' : (r.l === 2 ? 'cf' : (r.l === 3 ? 'range' : 'dmg'))))
            }
        };
        return res;
    };

    const renderListInternal = (builds, limit) => {
        if (!builds || builds.length === 0) return '<div class="msg-empty">No valid builds found.</div>';

        let filtered = builds.map(hydrateBuildEntry).filter(r => {
            if (!r) return false;
            const prioMatch = (prioSelect === 'all' || r.prio === prioSelect);
            if (!prioMatch) return false;
            if (setSelect !== 'all' && r.setName !== setSelect) return false;
            if (headSelect !== 'all' && (r.headUsed || 'none') !== headSelect) return false;

            let hSearch = ({ 'sun_god': 'Sun God', 'ninja': 'Junior Ninja', 'reaper_necklace': 'Reaper', 'shadow_reaper_necklace': 'Shadow Reaper', 'junior': 'Junior', 'biju_head': 'Biju', 'rebellious_head': 'Rebellious', 'reanimated_head': 'Reanimated', 'mage_head': 'Great Mage' })[r.headUsed] || '';
            const searchText = `${r.traitName} ${r.setName} ${r.prio} ${hSearch}`.toLowerCase();
            return searchText.includes(searchInput);
        });

        if (prioSelect === 'all') {
            const uniqueMap = new Map();
            filtered.forEach(r => {
                const getW = (x) => {
                    let w = 1.0;
                    if (unitId === 'sjw' && x.headUsed === 'sun_god') w *= 1.05;
                    if (unitId.includes('sasuke') && x.headUsed === 'biju_head') w *= 1.2;
                    if (unitId === 'sjw' && sortSelect === 'damage' && x.mainStats.body === 'dmg' && x.mainStats.legs === 'dmg') w *= 1.3;
                    return w;
                };
                const weight = getW(r);
                const key = r.setName + r.traitName + (r.headUsed || 'none');

                let isBetter = false;
                if (!uniqueMap.has(key)) {
                    isBetter = true;
                } else {
                    const currentBest = uniqueMap.get(key);
                    const currentWeight = getW(currentBest);
                    if (sortSelect === 'damage') isBetter = (r.dmgVal * weight > currentBest.dmgVal * currentWeight);
                    else if (sortSelect === 'range') isBetter = (r.range > currentBest.range);
                    else isBetter = (r.dps * weight > currentBest.dps * currentWeight);
                }
                if (isBetter) uniqueMap.set(key, r);
            });
            filtered = Array.from(uniqueMap.values());
        }

        if (filtered.length === 0) return '<div class="msg-empty">No matches found.</div>';

        filtered.sort((a, b) => {
            const getWeight = (x) => {
                let w = 1.0;
                if (unitId === 'sjw' && x.headUsed === 'sun_god') w *= 1.05;
                if (unitId.includes('sasuke') && x.headUsed === 'biju_head') w *= 1.2;
                if (unitId === 'sjw' && sortSelect === 'damage' && x.mainStats.body === 'dmg' && x.mainStats.legs === 'dmg') w *= 1.3;
                return w;
            };
            if (sortSelect === 'range') return (b.range || 0) - (a.range || 0);
            if (sortSelect === 'damage') return (b.dmgVal * getWeight(b)) - (a.dmgVal * getWeight(a));
            return (b.dps * getWeight(b)) - (a.dps * getWeight(a));
        });

        const slice = filtered.slice(0, limit);
        return slice.map((r, i) => generateBuildRowHTML(r, i, { totalCost: unitCost, placement: unitPlace, sortMode: sortSelect, unitId, benchmarkDps: benchmarkDps })).join('');
    };

    // Card div structure hardcoded to cfg-0 now
    const container = document.getElementById(`results-${activeType}-${activeMode}-0-${unitId}`);
    if (!container) return;

    let buildData = window.unitBuildsCache[unitId]?.[activeType]?.[activeMode]?.[0];

    if (!buildData && !inventoryMode && unitObj) {
        const isBambiAlt = (unitId === 'bambietta' && bambiettaState.element !== 'Dark');
        const isRobotAlt = (unitId === 'robot1718' && robot1718State.mode !== 'Robot 17');
        if (!isBambiAlt && !isRobotAlt) {
            processUnitCache(unitObj, 0, activeType);
            buildData = window.unitBuildsCache[unitId]?.[activeType]?.[activeMode]?.[0];
        }
    }

    if (buildData) {
        container.innerHTML = renderListInternal(buildData, renderLimit);
    } else if (forceSync && unitObj) {
        processUnitCache(unitObj, 0, activeType);
        const finalData = window.unitBuildsCache[unitId]?.[activeType]?.[activeMode]?.[0];
        if (finalData) container.innerHTML = renderListInternal(finalData, renderLimit);
    } else {
        container.innerHTML = `<div class="msg-loading"><div class="loading-spinner"></div><span>Calculating...</span></div>`;
    }
}

function processUnitCache(unit, specificCfg = null, specificType = null) {
    if (!window.unitBuildsCache[unit.id]) {
        window.unitBuildsCache[unit.id] = {
            base: { fixed: [null] },
            abil: { fixed: [null] }
        };
    }

    // Only 1 configuration
    const CONFIGS = [{ head: true, subs: true }];

    const performCalcSet = (mode, useAbility, targetCache) => {
        let dbKey = (unit.id === 'kirito' && kiritoState.card) ? 'kirito_card' : unit.id;
        if (useAbility && unit.ability) dbKey += '_abil';

        const useInventory = (inventoryMode === true);

        // Fixed to 1 iteration
        for (let i = 0; i < 1; i++) {
            if (targetCache[i] !== null) continue;

            const cfg = CONFIGS[i];
            let calculatedResults = [];

            if (!useInventory) {
                const isBambiAlt = (unit.id === 'bambietta' && bambiettaState.element !== 'Dark');
                const isRobotAlt = (unit.id === 'robot1718' && robot1718State.mode !== 'Robot 17');
                const canUseStatic = !isBambiAlt && !isRobotAlt;

                if (canUseStatic && window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
                    const dbTable = window.STATIC_BUILD_DB[dbKey];
                    const dbList = dbTable[mode] || dbTable[mode === 'fixed' ? 'f' : 'b'];
                    if (dbList && dbList[i]) {
                        calculatedResults = dbList[i].map(r => ({ ...r }));
                    }
                }
            }

            calculatedResults.forEach(r => { if (r.id) window.cachedResults[r.id] = r; });

            const traitsForCalc = (calculatedResults.length > 0 && !unit.id.includes('sasuke')) ? [...(typeof customTraits !== 'undefined' ? customTraits : []), ...(unitSpecificTraits[unit.id] || [])] : null;
            if (traitsForCalc === null || traitsForCalc.length > 0 || useInventory) {
                const dynamicResults = calculateUnitBuilds(unit, null, getFilteredBuilds(), getValidSubCandidates(), cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace', 'junior', 'biju_head', 'rebellious_head', 'reanimated_head', 'mage_head'] : ['none'], cfg.subs, traitsForCalc, useAbility, mode);
                calculatedResults = [...calculatedResults, ...dynamicResults];
            }
            targetCache[i] = calculatedResults;
        }
    };

    if (!specificType || specificType === 'base') {
        performCalcSet('fixed', false, window.unitBuildsCache[unit.id].base.fixed);
    }

    if (unit.ability && (!specificType || specificType === 'abil')) {
        performCalcSet('fixed', true, window.unitBuildsCache[unit.id].abil.fixed);
    }
}

window.getQuickScore = (unit) => {
    const isAbility = activeAbilityIds.has(unit.id) && unit.ability;
    let baseKey = (unit.id === 'kirito' && kiritoState.card) ? 'kirito_card' : unit.id;
    const dbKey = baseKey + (isAbility ? '_abil' : '');

    if (window.STATIC_BUILD_DB && window.STATIC_BUILD_DB[dbKey]) {
        // Look at config 0 now
        const list = window.STATIC_BUILD_DB[dbKey]['fixed']?.[0];
        if (list && list.length > 0) {
            return unit.id === 'law' ? (list[0].range || 0) : list[0].dps;
        }
    }
    if (unit.id === 'law') return unit.stats.range || 0;
    return (unit.stats.dmg / unit.stats.spa) * 35;
};

function renderDatabase() {
    const container = document.getElementById('dbPage');
    if (renderQueueIndex === 0) {
        container.innerHTML = '';
        if (!window.STATIC_BUILD_DB) window.cachedResults = {};
        window.unitBuildsCache = {};
    }
    if (renderQueueId) { cancelAnimationFrame(renderQueueId); renderQueueId = null; }

    const sortedUnits = unitDatabase.map(unit => {
        return { unit, maxScore: getQuickScore(unit) };
    }).sort((a, b) => b.maxScore - a.maxScore);

    function processNextChunk() {
        const startTime = performance.now();
        const fragment = document.createDocumentFragment();
        let itemsAdded = 0;
        let staggerIndex = 0;

        while (renderQueueIndex < sortedUnits.length) {
            const unit = sortedUnits[renderQueueIndex].unit;

            renderQueueIndex++;

            let abilityLabel = (unit.ability && unit.ability.abilityName) ? unit.ability.abilityName : 'Ability';
            let toggleScript = '';

            if (unit.id === 'phantom_captain') abilityLabel = 'Planes';
            else if (unit.id === 'megumin') abilityLabel = 'Passive';
            else if (unit.id === 'vegeta') abilityLabel = 'Boss Stacks';
            else if (unit.id === 'nutaru_beast') abilityLabel = 'Beast Mode';
            else if (unit.id === 'ancient_shinob') abilityLabel = 'Reanimation';
            else if (unit.id === 'super_roku') abilityLabel = 'Same Enemy';
            else if (unit.id === 'ancient_mage') {
                const isToggled = activeAbilityIds.has(unit.id);
                abilityLabel = isToggled ? 'DPS' : 'Specialist';
                toggleScript = `; this.parentElement.previousElementSibling.innerText = this.checked ? 'DPS' : 'Specialist';`;
            }
            else if (unit.id === 'cell') {
                const isToggled = activeAbilityIds.has(unit.id);
                abilityLabel = isToggled ? 'Perfect Form' : 'True Form';
                toggleScript = `; this.parentElement.previousElementSibling.innerText = this.checked ? 'Perfect Form' : 'True Form'; this.closest('.unit-toolbar').firstElementChild.style.gap = '2px';`;
            }

            const abilityToggleHtml = (unit.ability && !unit.ability.noToggle) ? `<div class="toggle-wrapper"><span class="ut-ability-text" title="${abilityLabel}">${abilityLabel}</span><label><input type="checkbox" class="ability-cb" ${activeAbilityIds.has(unit.id) ? 'checked' : ''} onchange="toggleAbility('${unit.id}', this)${toggleScript}"><div class="mini-switch"></div></label></div>` : '<div></div>';
            const topControls = `<div class="unit-toolbar"><div class="ut-actions"><button class="calc-btn ut-btn-compact" onclick="openCalc('${unit.id}')">🖩 Custom</button><button class="calc-btn ut-btn-compact" onclick="openTraitBestList('${unit.id}')" title="Best Build per Trait">📊 Traits</button><button class="calc-btn ut-btn-compact" onclick="openUnitInfo('${unit.id}')">ⓘ Info</button></div>${abilityToggleHtml}</div>`;

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
                        <select onchange="filterList(this)" data-filter="set" class="search-select"><option value="all">All Sets</option><option value="Junior Ninja">Junior Ninja Set</option><option value="Sun God">Sun God Set</option><option value="Laughing Captain">Laughing Set</option><option value="Ex Captain">Ex Set</option><option value="Shadow Reaper">Shadow Reaper</option><option value="Reaper Set">Reaper Set</option><option value="Super Roku">Super Roku</option><option value="Bio-Android">Bio-Android</option><option value="Biju Set">Biju Set</option><option value="Rebellious Shinobi">Rebellious</option><option value="Reanimated Ninja">Reanimated Ninja</option><option value="Great Mage">Great Mage</option></select>
                        <select onchange="filterList(this)" data-filter="head" class="search-select"><option value="all">All Heads</option><option value="sun_god">Sun God</option><option value="ninja">Junior Ninja</option><option value="reaper_necklace">Reaper</option><option value="shadow_reaper_necklace">Shadow Reaper</option><option value="junior">Junior Ninja</option><option value="biju_head">Biju</option><option value="rebellious_head">Rebellious</option><option value="reanimated_head">Reanimated</option><option value="mage_head">Great Mage</option><option value="none">No Head</option></select>
                    </div>
                </div>`;

            let mainContent = '';
            // Generate only cfg-0 divs
            ['base', 'abil'].forEach(type => { const mode = 'fixed'; mainContent += `<div class="top-builds-list build-list-container mode-${type} mode-${mode} cfg-0" id="results-${type}-${mode}-0-${unit.id}"></div>`; });

            const card = createBaseUnitCard(unit, {
                id: 'card-' + unit.id,
                additionalClasses: (activeAbilityIds.has(unit.id) ? ' use-ability' : '') + ' lazy-build-load',
                bannerContent: `<div class="banner-badges">
                    <div class="placement-badge">Max Place: ${unit.placement}</div>
                    <div class="placement-badge is-${(unit.placementType || 'Ground').toLowerCase()}">${unit.placementType || 'Ground'}</div>
                    <div class="placement-badge" style="color: #4ade80; border-color: rgba(74, 222, 128, 0.3);">DPS Rank: #${renderQueueIndex}</div>
                </div>${getUnitImgHtml(unit, 'unit-avatar')}<div class="unit-title"><h2>${unit.name}</h2><span>${unit.role}</span></div>${unit.meta ? `<button class="trait-guide-btn" onclick="openTraitGuide('${unit.id}')">📋 Rec. Traits</button>` : ''}`,
                topControls, bottomControls, mainContent
            });

            card.style.setProperty('--stagger-delay', `${staggerIndex * 50}ms`);
            staggerIndex++; fragment.appendChild(card); itemsAdded++;
            if (performance.now() - startTime > 12) break;
        }

        if (itemsAdded > 0) {
            container.appendChild(fragment);

            if (!window.buildLoadObserver) {
                window.buildLoadObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const unitId = entry.target.id.replace('card-', '');
                        if (entry.isIntersecting) {
                            window.visibleUnitIds.add(unitId);
                            const unit = unitDatabase.find(u => u.id === unitId);
                            if (unit) {
                                updateBuildListDisplay(unitId, false, 50);
                            }
                            entry.target.classList.remove('lazy-build-load');
                        } else {
                            window.visibleUnitIds.delete(unitId);
                            entry.target.classList.add('lazy-build-load');
                        }
                    });
                }, { rootMargin: '200px' });
            }

            const newCards = container.querySelectorAll('.lazy-build-load');
            newCards.forEach(c => window.buildLoadObserver.observe(c));
        }

        if (renderQueueIndex < sortedUnits.length) renderQueueId = requestAnimationFrame(processNextChunk);
        else {
            renderQueueId = null;
        }
    }
    processNextChunk();
}

function setGuideMode(mode) {
    currentGuideMode = mode;
    const warning = document.getElementById('guideWarning');
    if (warning) warning.classList[mode === 'current' ? 'remove' : 'add']('hidden');
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
    if (document.getElementById('guidesPage').classList.contains('active')) {
        renderGuides();
    }
    closeGuideConfig();
};

function getGuideBuildsFromCache(unit, mode, configIndex) {
    if (!unitBuildsCache || !unitBuildsCache[unit.id]) return [];
    let source = unitBuildsCache[unit.id].base;
    if (unit.ability !== undefined && activeAbilityIds.has(unit.id) && unitBuildsCache[unit.id].abil && unitBuildsCache[unit.id].abil[mode]) source = unitBuildsCache[unit.id].abil;
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

    const getWeight = (b) => {
        if (unit.id === 'sjw' && b.headUsed === 'sun_god') return 1.05;
        if (unit.id.includes('sasuke') && b.headUsed === 'biju_head') return 1.2;
        return 1.0;
    };

    if (unit.id === 'law') {
        filtered.sort((a, b) => (b.range || 0) - (a.range || 0));
    } else if (['sjw', 'esdeath', 'sasuke_great_war'].includes(unit.id)) {
        filtered.sort((a, b) => {
            const scoreA = (a.dmgVal || 0) * (a.mainStats.body === 'dmg' && a.mainStats.legs === 'dmg' ? 1.2 : 1) * getWeight(a);
            const scoreB = (b.dmgVal || 0) * (b.mainStats.body === 'dmg' && b.mainStats.legs === 'dmg' ? 1.2 : 1) * getWeight(b);
            return scoreB - scoreA;
        });
    } else {
        filtered.sort((a, b) => (b.dps * getWeight(b)) - (a.dps * getWeight(a)));
    }
    return filtered.slice(0, 3);
}

function createGuideCard(unitObj, modeClass) {
    const bannerContent = `<div class="mp-container is-dps" id="guide-mp-${unitObj.id}"><span class="mp-label">Max Potential</span><span class="mp-val">...</span></div>
        ${getUnitImgHtml(unitObj, 'unit-avatar')}<div class="unit-title"><h2>${unitObj.name}</h2><span>${unitObj.role}</span></div>`;

    const mainContent = `<div class="top-builds-list guide-list-wrapper" id="guide-list-${unitObj.id}"><div class="msg-empty">Loading builds...</div></div>`;

    return createBaseUnitCard(unitObj, {
        id: 'card-' + unitObj.id,
        additionalClasses: `calc-guide-card lazy-guide-load ${modeClass}`,
        bannerContent,
        tagsContent: `<span class="guide-trait-tag text-xs-plus" id="guide-trait-${unitObj.id}">Best: ...</span>`,
        mainContent
    });
}

function updateGuideBuilds(unitId) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    const activeMode = 'fixed';
    const activeCfg = 0; // Forced to Max Potential
    const filterTraitId = document.getElementById('guideTraitSelect').value;

    if (!unitBuildsCache[unitId]) processUnitCache(unit);
    const builds = processGuideTop3(getGuideBuildsFromCache(unit, activeMode, activeCfg), unit, filterTraitId);

    const mpLabel = document.getElementById(`guide-mp-${unitId}`);
    const traitLabel = document.getElementById(`guide-trait-${unitId}`);
    const listContainer = document.getElementById(`guide-list-${unitId}`);

    if (!builds || builds.length === 0) {
        if (listContainer) listContainer.innerHTML = '<div class="msg-empty">No builds found.</div>';
        return;
    }

    const best = builds[0];
    const isRange = unit.id === 'law';
    if (mpLabel) {
        mpLabel.className = `mp-container ${isRange ? 'is-range' : 'is-dps'}`;
        mpLabel.querySelector('.mp-label').innerText = isRange ? 'Max Range' : 'Max Potential';
        mpLabel.querySelector('.mp-val').innerText = isRange ? (best.range || 0).toFixed(1) : format(best.dps);
    }
    if (traitLabel) traitLabel.innerText = `Best: ${best.traitName}`;
    if (listContainer) {
        listContainer.innerHTML = builds.map((b, i) => generateBuildRowHTML(b, i, { totalCost: unit.totalCost || 50000, placement: unit.placement || 1, sortMode: 'dps', unitId: unit.id })).join('');
    }
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
    if (filterTraitId !== 'auto') {
        const found = getTraitById(filterTraitId);
        if (found) tName = found.name;
    }
    document.getElementById('dispGuideUnit').innerText = uName;
    document.getElementById('dispGuideTrait').innerText = tName;

    const activeMode = 'fixed';
    const activeCfg = 0; // Forced

    const unitsToProcess = (guideUnitSelection.has('all')) ? [...unitDatabase] : unitDatabase.filter(u => guideUnitSelection.has(u.id));

    unitsToProcess.sort((a, b) => getQuickScore(b) - getQuickScore(a));

    const fragment = document.createDocumentFragment();
    unitsToProcess.forEach(unit => {
        fragment.appendChild(createGuideCard(unit, `mode-${activeMode} cfg-${activeCfg}`));
    });
    guideGrid.appendChild(fragment);

    if (!window.guideLoadObserver) {
        window.guideLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const unitId = entry.target.id.replace('card-', '');
                    updateGuideBuilds(unitId);
                    window.guideLoadObserver.unobserve(entry.target);
                    entry.target.classList.remove('lazy-guide-load');
                }
            });
        }, { rootMargin: '200px' });
    }

    const newGuides = guideGrid.querySelectorAll('.lazy-guide-load');
    newGuides.forEach(g => window.guideLoadObserver.observe(g));

    if (guideGrid.children.length === 0) guideGrid.innerHTML = `<div class="msg-empty">No guides found. Database may still be calculating.</div>`;
}

function openTraitBestList(unitId) {
    const unit = typeof getUnitById === 'function' ? getUnitById(unitId) : unitDatabase.find(u => u.id === unitId);
    if (!unit) return;

    const mode = 'fixed';
    const type = activeAbilityIds.has(unitId) && unit.ability ? 'abil' : 'base';

    const cfgIndex = 0; // Forced Max Potential

    const allBuilds = window.unitBuildsCache[unitId]?.[type]?.[mode]?.[cfgIndex] || [];

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

    let tagsHtml = '';
    if (window.mikuBuffActive) {
        tagsHtml += `<span style="background: rgba(74, 222, 128, 0.2); color: #4ade80; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(74, 222, 128, 0.3);">Miku Buff ON</span>`;
    }
    if (window.enlightenedGodBuffActive) {
        tagsHtml += `<span style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(251, 191, 36, 0.3);">Enlightened God ON</span>`;
    }
    if (window.mageHillBuffActive) {
        tagsHtml += `<span style="background: rgba(251, 146, 60, 0.2); color: #fb923c; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(251, 146, 60, 0.3);">Fern (Hill) ON</span>`;
    }
    if (window.mageGroundBuffActive) {
        tagsHtml += `<span style="background: rgba(244, 114, 182, 0.2); color: #f472b6; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(244, 114, 182, 0.3);">Fern (Ground) ON</span>`;
    }
    if (activeAbilityIds.has(unitId) && unit.ability) {
        tagsHtml += `<span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(168, 85, 247, 0.3);">Ability Active</span>`;
    }

    let html = `<div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);">
            <img src="${unit.img}" style="width: 110%; height: 110%; object-fit: cover;">
        </div>
        <div style="flex: 1;">
            <div class="text-xl font-bold text-white leading-tight" style="display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px;">
                ${unit.name}
            </div>
            <div class="text-xs text-dim font-bold" style="margin-top: 2px; text-transform: uppercase; letter-spacing: 1px;">${unit.role} ${unit.stats.element ? `• ${unit.stats.element}` : ''}</div>
            ${tagsHtml ? `<div style="margin-top: 8px; display: flex; gap: 6px;">${tagsHtml}</div>` : ''}
        </div>
    </div>`;

    html += `<table class="compare-table" style="border-collapse: separate; border-spacing: 0 4px;">
        <thead>
            <tr>
                <th style="width: 8%; text-align: center;">#</th>
                <th style="width: 30%">Trait</th>
                <th style="width: 42%">Best Setup</th>
                <th style="width: 20%; text-align: right;">Potential</th>
            </tr>
        </thead>
        <tbody>`;

    const mapStat = (s) => {
        if (s === 'cf') return 'Crit';
        if (s === 'cm') return 'CDmg';
        if (s === 'spa') return 'SPA';
        if (s === 'range') return 'Rng';
        if (s === 'dot') return 'DoT';
        return 'Dmg';
    };

    sortedTraits.forEach((b, idx) => {
        const isRange = (unitId === 'law');
        const val = isRange ? (b.range || 0).toFixed(1) : format(b.dps);
        const label = isRange ? 'RNG' : 'DPS';
        const labelClass = isRange ? 'comp-val-rng' : 'comp-val-dps';

        const tObj = getTraitByName(b.traitName, unitId);
        const traitImg = tObj ? `<div class="trait-img-rainbow" style="width: 22px; height: 22px; margin-right: 10px; flex-shrink: 0;"><img src="images/traits/${tObj.name}.png" onerror="this.parentElement.style.display='none'"></div>` : '';

        let headText = (b.headUsed && b.headUsed !== 'none') ? ` + ${({ 'sun_god': 'Sun God', 'ninja': 'Ninja', 'reaper_necklace': 'Reaper', 'shadow_reaper_necklace': 'S.Reaper' })[b.headUsed] || 'Head'}` : '';
        const setupText = `<b class="text-white">${b.setName}</b> <span class="text-dim text-xs">(${mapStat(b.mainStats.body)}/${mapStat(b.mainStats.legs)})</span>${headText}`;

        let rowStyle = '';
        let rankStyle = 'opacity: 0.6; font-size: 0.85em; font-family: monospace;';

        if (idx === 0) {
            rankStyle = 'color: #fbbf24; font-weight: 900; font-size: 1.2em; text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);';
            rowStyle = 'background: rgba(251, 191, 36, 0.04);';
        }
        else if (idx === 1) rankStyle = 'color: #e2e8f0; font-weight: 800; font-size: 1.1em;';
        else if (idx === 2) rankStyle = 'color: #b45309; font-weight: 800; font-size: 1.1em;';

        html += `<tr style="${rowStyle}">
            <td style="text-align: center; vertical-align: middle; padding: 10px 5px;"><span style="${rankStyle}">#${idx + 1}</span></td>
            <td style="vertical-align: middle; padding: 10px 5px;">
                <div style="display: flex; align-items: center;">
                    ${traitImg}
                    <span class="comp-tag" style="margin: 0; font-weight: 700; font-size: 0.85rem;">${b.traitName}</span>
                </div>
            </td>
            <td style="vertical-align: middle; padding: 10px 5px;">
                <div class="text-sm">${setupText}</div>
                <div class="text-xs" style="margin-top: 2px; color: rgba(255,255,255,0.4);">Prio: <span class="text-custom" style="font-weight: 600;">${b.prio.toUpperCase()}</span></div>
            </td>
            <td style="vertical-align: middle; text-align: right; padding: 10px 5px;">
                <div class="comp-highlight" style="font-weight: 800; font-size: 1rem;">${val} <span class="comp-val-label ${labelClass}">${label}</span></div>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    showUniversalModal({ title: `<span class="text-gold">TRAIT LEADERBOARD</span>`, content: html, size: 'modal-lg' });
}
