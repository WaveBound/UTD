// ============================================================================
// MODALS.JS - Modal Logic, Info Popups & Math Reconstruction
// ============================================================================

const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) {
            modal.classList.add('is-visible');
        } else {
            modal.classList.remove('is-visible');
            closeInfoPopup(); 
        }
        updateBodyScroll();
    }
};

// --- INFO POPUPS (For Stat Badges) ---

function openInfoPopup(key) {
    const data = infoDefinitions[key];
    if(!data) return;
    
    const existing = document.getElementById('mathInfoPopup');
    if(existing) existing.remove();

    const parent = document.body;
    let overlay = document.createElement('div');
    overlay.id = 'mathInfoPopup';
    overlay.className = 'info-popup-overlay is-visible';
    
    overlay.onclick = function(e) {
        if (e.target === overlay) closeInfoPopup();
    };
    
    overlay.innerHTML = `
        <div class="info-popup-content">
            <button class="ip-close" onclick="closeInfoPopup()">×</button>
            <div class="ip-header">
                <span class="color-custom font-bold text-xl-popup">?</span> ${data.title}
            </div>
            <div class="ip-body">
                ${data.desc}
                <div class="ip-formula">${data.formula}</div>
            </div>
        </div>
    `;
    
    parent.appendChild(overlay);
    updateBodyScroll();
}

function closeInfoPopup() {
    const overlay = document.getElementById('mathInfoPopup');
    if(overlay) overlay.remove();
    updateBodyScroll();
}

// --- MATH DATA RECONSTRUCTION ---

// HELPER: Reconstruct full calculation data from cached "Lite" data
// UPDATED: Now supports unified -b-/-f- and -NOSUBS/-SUBS tags
function reconstructMathData(liteData) {
    const unit = unitDatabase.find(u => liteData.id.startsWith(u.id));
    if (!unit) return null;

    const isAbility = liteData.id.includes('ABILITY');
    const isVR = liteData.id.includes('VR');
    const isCard = liteData.id.includes('CARD');
    
    // 1. Detect Mode from ID Tags
    const isBuggedMode = liteData.id.includes('-b-');
    const isFixedMode = liteData.id.includes('-f-');
    
    // 2. Detect Sub-Stat Configuration from ID Tags
    const isNoSubsMode = liteData.id.includes('-NOSUBS');

    let effectiveStats = { ...unit.stats };
    effectiveStats.id = unit.id;
    if (unit.tags) effectiveStats.tags = unit.tags;
    
    if (isAbility && unit.ability) Object.assign(effectiveStats, unit.ability);
    
    if (unit.id === 'kirito' && isVR && isCard) {
        effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 1;
    }
    
    if (unit.id === 'bambietta') {
        Object.assign(effectiveStats, BAMBIETTA_MODES["Dark"]);
    }

    let trait = traitsList.find(t => t.name === liteData.traitName) || 
                customTraits.find(t => t.name === liteData.traitName) ||
                (unitSpecificTraits[unit.id] || []).find(t => t.name === liteData.traitName);
    if (!trait) trait = traitsList.find(t => t.id === 'ruler');

    const setEntry = SETS.find(s => s.name === liteData.setName) || SETS[2];
    
    let totalStats = {
        set: setEntry.id,
        dmg: 0, spa: 0, range: 0, cm: 0, cf: 0, dot: 0
    };

    // Add Main Stats
    if (liteData.mainStats) {
        if (MAIN_STAT_VALS.body[liteData.mainStats.body]) 
            totalStats[liteData.mainStats.body] += MAIN_STAT_VALS.body[liteData.mainStats.body];
        
        if (MAIN_STAT_VALS.legs[liteData.mainStats.legs]) 
            totalStats[liteData.mainStats.legs] += MAIN_STAT_VALS.legs[liteData.mainStats.legs];
    }

    // Determine Logic State for this reconstruction
    let applyDot = statConfig.applyRelicDot;
    let applyCrit = statConfig.applyRelicCrit;

    if (isBuggedMode) {
        applyDot = false;
        applyCrit = true; 
    } else if (isFixedMode) {
        applyDot = true;
        applyCrit = true;
    }

    // Add explicitly stored sub-stats (from the lite object)
    if (liteData.subStats) {
        ['head', 'body', 'legs'].forEach(slot => {
            if (liteData.subStats[slot]) {
                liteData.subStats[slot].forEach(sub => {
                    if (sub.type && sub.val) totalStats[sub.type] += sub.val;
                });
            }
        });
    }

    // Determine valid stats for auto-filling
    const candidates = ['dmg', 'spa', 'range', 'cm', 'cf', 'dot'];
    const validCandidates = candidates.filter(c => {
         if (!applyDot && c === 'dot') return false;
         if (!applyCrit && (c === 'cm' || c === 'cf')) return false;
         return true;
    });

    // Helper to auto-fill perfect subs if they weren't stored (Static DB optimization)
    const addBaseFills = (slot, mainStatType) => {
        const existingTypes = new Set();
        if (liteData.subStats && liteData.subStats[slot]) {
             liteData.subStats[slot].forEach(s => existingTypes.add(s.type));
        }

        validCandidates.forEach(cand => {
             if (cand === mainStatType) return;
             if (existingTypes.has(cand)) return;
             totalStats[cand] = (totalStats[cand] || 0) + PERFECT_SUBS[cand];
        });
    };

    // LOGIC: Only fill HEAD stats if a head is used AND we aren't in NoSubs mode
    // Heads always have subs in-game, but if configured off via toggle, ID has -NOSUBS
    if (!isNoSubsMode && liteData.headUsed && liteData.headUsed !== 'none') {
        addBaseFills('head', null); 
    }

    // LOGIC: Only fill BODY/LEGS stats if -NOSUBS is NOT present in the ID
    if (!isNoSubsMode && liteData.mainStats) {
        addBaseFills('body', liteData.mainStats.body);
        addBaseFills('legs', liteData.mainStats.legs);
    }

    const isSpaPrio = liteData.prio === 'spa';
    const isRangePrio = liteData.prio === 'range';
    let dmgPts = 99, spaPts = 0, rangePts = 0;
    if (isSpaPrio) { dmgPts = 0; spaPts = 99; }
    else if (isRangePrio) { dmgPts = 0; spaPts = 0; rangePts = 99; }
    
    const context = {
        dmgPoints: dmgPts,
        spaPoints: spaPts,
        rangePoints: rangePts,
        wave: 25,
        isBoss: false,
        traitObj: trait,
        placement: Math.min(unit.placement, trait.limitPlace || unit.placement),
        isSSS: true,
        headPiece: liteData.headUsed || (liteData.subStats && liteData.subStats.selectedHead) || 'none',
        isVirtualRealm: (unit.id === 'kirito' && isVR)
    };

    // Temporarily swap global config for this calculation
    const previousDotState = statConfig.applyRelicDot;
    const previousCritState = statConfig.applyRelicCrit;
    
    statConfig.applyRelicDot = applyDot;
    statConfig.applyRelicCrit = applyCrit;

    const result = calculateDPS(effectiveStats, totalStats, context);

    // Restore global config
    statConfig.applyRelicDot = previousDotState;
    statConfig.applyRelicCrit = previousCritState;

    return result;
}

const showMath = (id) => { 
    let data = cachedResults[id]; 
    if(!data) return;

    const content = document.getElementById('mathContent'); 
    // If cache object is "lite" (missing deep math), reconstruct it
    if (!data.lvStats || !data.critData) {
        try {
            data = reconstructMathData(data);
            if (!data) throw new Error("Failed to reconstruct unit data");
        } catch (e) {
            console.error(e);
            content.innerHTML = `<div class="msg-error">Error recalculating data.</div>`;
            toggleModal('mathModal', true);
            return;
        }
    }

    try {
        content.innerHTML = renderMathContent(data); 
        toggleModal('mathModal', true); 
    } catch (e) {
        console.error(e);
    }
};
window.showMath = showMath;

// Generic Close Helper
window.closeModal = (id) => toggleModal(id, false);

// --- PATCH NOTES ---

const openPatchNotes = () => toggleModal('patchModal', true);

function renderPatchNotes() {
    const container = document.getElementById('patchNotesContainer');
    if (!container || typeof patchNotesData === 'undefined') return;

    container.innerHTML = patchNotesData.map(patch => {
        const changesHtml = patch.changes.map(c => 
            `<li><span class="patch-tag">${c.type}</span> <span>${c.text}</span></li>`
        ).join('');

        return `
            <div class="patch-entry">
                <div class="patch-header">
                    <span class="patch-version">${patch.version}</span>
                    <span class="patch-date">${patch.date}</span>
                </div>
                <ul class="patch-list">${changesHtml}</ul>
            </div>
        `;
    }).join('');
}

// --- COMPARISON MODAL ---

function openComparison() {
    if (selectedUnitIds.size === 0) return;

    toggleModal('compareModal', true);
    const content = document.getElementById('compareContent');
    
    const isFixedMode = document.body.classList.contains('show-fixed-relics');
    const subMode = isFixedMode ? 'fixed' : 'bugged';

    const showHead = document.getElementById('globalHeadPiece').checked;
    const showSubs = document.getElementById('globalSubStats').checked;

    // Determine config index matches logic in rendering.js/static-db
    let configIndex = 0;
    if (!showHead && !showSubs) configIndex = 0;
    else if (!showHead && showSubs) configIndex = 1;
    else if (showHead && !showSubs) configIndex = 2;
    else if (showHead && showSubs) configIndex = 3;

    let comparisonData = [];

    selectedUnitIds.forEach(unitId => {
        const unit = unitDatabase.find(u => u.id === unitId);
        if (!unit) return;

        const useAbility = activeAbilityIds.has(unitId);
        const mode = (useAbility && unit.ability) ? 'abil' : 'base';

        const cacheEntry = unitBuildsCache[unitId];
        if (!cacheEntry || !cacheEntry[mode] || !cacheEntry[mode][subMode]) return;

        const allBuilds = cacheEntry[mode][subMode][configIndex] || [];
        if (allBuilds.length === 0) return;

        // Apply filters from the Unit Card
        const card = document.getElementById('card-' + unitId);
        let activePrio = 'all';
        let activeSet = 'all';
        let activeHead = 'all';

        if (card) {
            activePrio = card.querySelector('select[data-filter="prio"]')?.value || 'all';
            activeSet = card.querySelector('select[data-filter="set"]')?.value || 'all';
            activeHead = card.querySelector('select[data-filter="head"]')?.value || 'all';
        }

        const filteredBuilds = allBuilds.filter(r => {
            const prioMatch = activePrio === 'all' || r.prio === activePrio;
            const setMatch = activeSet === 'all' || r.setName === activeSet;
            const headMatch = activeHead === 'all' || (r.headUsed || 'none') === activeHead;
            return prioMatch && setMatch && headMatch;
        });

        if (filteredBuilds.length === 0) return; 

        // Sort based on Prio (Range vs DPS)
        if (activePrio === 'range' || (unitId === 'law' && activePrio === 'all')) {
            filteredBuilds.sort((a, b) => (b.range || 0) - (a.range || 0));
        } else {
            filteredBuilds.sort((a, b) => b.dps - a.dps);
        }

        const bestBuild = filteredBuilds[0];

        const mapStat = (s) => {
            if (s === 'cm') return 'CDmg';
            if (s === 'cf') return 'Crit';
            if (s === 'dot') return 'DoT';
            if (s === 'spa') return 'Spa';
            if (s === 'range') return 'Rng';
            return 'Dmg';
        };

        const formatData = (buildResult) => {
            const mainStr = `(${mapStat(buildResult.mainStats.body)}/${mapStat(buildResult.mainStats.legs)})`;
            const headStr = (buildResult.headUsed && buildResult.headUsed !== 'none') ? ' + Head' : '';
            const isRange = buildResult.prio === 'range';
            
            const displayVal = isRange ? (buildResult.range || 0) : buildResult.dps;

            return {
                u: unit,
                bestTraitName: buildResult.traitName,
                bestBuildName: `${buildResult.setName} ${mainStr}${headStr}`,
                bestSpa: buildResult.spa,
                bestPrio: buildResult.prio.toUpperCase(),
                isCustom: buildResult.isCustom,
                sortVal: displayVal,
                isRangePrio: isRange
            };
        };

        comparisonData.push(formatData(bestBuild));
    });

    comparisonData.sort((a, b) => b.sortVal - a.sortVal);

    let html = `<table class="compare-table"><thead><tr><th class="w-25">Unit</th><th>Primary Stat</th><th>Best Filtered Build</th></tr></thead><tbody>`;
    
    if (comparisonData.length === 0) {
        html += `<tr><td colspan="3" class="comp-empty">No builds found matching current filters.</td></tr>`;
    } else {
        comparisonData.forEach(data => {
            const rowClass = data.isCustom ? 'comp-row-custom' : '';
            
            const valStr = data.isRangePrio ? data.sortVal.toFixed(1) : format(data.sortVal);
            const labelStr = data.isRangePrio ? "RANGE" : "DPS";
            const labelClass = data.isRangePrio ? "comp-val-rng" : "comp-val-dps";
            const prioClass = data.bestPrio === 'SPA' ? 'text-custom' : (data.bestPrio === 'RANGE' ? 'text-success' : 'text-gold');

            html += `
            <tr class="${rowClass}">
                <td>
                    <div class="comp-unit-wrap">
                        ${getUnitImgHtml(data.u, 'comp-img', 'small')}
                        <div>
                            <div class="text-bold text-white">${data.u.name}</div>
                            <span class="comp-sub">${data.isCustom ? 'Custom' : data.u.role}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="comp-highlight">
                        ${valStr} <span class="comp-val-label ${labelClass}">${labelStr}</span>
                    </div>
                    <span class="comp-sub">SPA: ${data.bestSpa.toFixed(3)}s</span>
                </td>
                <td>
                    <span class="comp-tag">${data.bestTraitName}</span>
                    <div class="comp-build-name">
                        ${data.bestBuildName} 
                        <span class="comp-prio-tag ${prioClass}">[${data.bestPrio}]</span>
                    </div>
                </td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>`;
    content.innerHTML = html;
}

// --- TRAIT GUIDE MODAL ---

function openTraitGuide(unitId) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit || !unit.meta) return;

    const modalContent = document.getElementById('traitGuideContent');
    const getTraitName = (id) => {
        if(!id) return '-';
        const t = traitsList.find(x => x.id === id);
        return t ? t.name : id;
    };

    let html = `
        <div class="tg-grid">
            <div class="tg-section">
                <span class="tg-label">Wave 1-30</span>
                <span class="tg-trait tg-short">⚡ ${getTraitName(unit.meta.short)}</span>
            </div>
            <div class="tg-section">
                <span class="tg-label">Infinite Mode</span>
                <span class="tg-trait tg-long">♾️ ${getTraitName(unit.meta.long)}</span>
            </div>
        </div>
        <div class="tg-note">
            <strong>Strategy Note:</strong><br>
            ${unit.meta.note || "No specific strategy notes available for this unit."}
        </div>
    `;

    modalContent.innerHTML = html;
    toggleModal('traitGuideModal', true);
}