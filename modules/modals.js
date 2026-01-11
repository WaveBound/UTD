// ============================================================================
// MODALS.JS - Modal Management & Info Popups
// ============================================================================

// Toggle modal visibility
const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        
        // Close any lingering info popups when closing a modal
        if (!show) {
            closeInfoPopup(); 
        }
        updateBodyScroll();
    }
};

// Open info popup with definition
function openInfoPopup(key) {
    const data = infoDefinitions[key];
    if(!data) return;
    
    // Remove existing if any (prevents duplicates)
    const existing = document.getElementById('mathInfoPopup');
    if(existing) existing.remove();

    // Always append to body to ensure it sits on top
    const parent = document.body;

    let overlay = document.createElement('div');
    overlay.id = 'mathInfoPopup';
    overlay.className = 'info-popup-overlay';
    
    // Allow closing by clicking the background overlay
    overlay.onclick = function(e) {
        if (e.target === overlay) closeInfoPopup();
    };
    
    overlay.innerHTML = `
        <div class="info-popup-content">
            <button class="ip-close" onclick="closeInfoPopup()">×</button>
            <div class="ip-header">
                <span style="color:var(--custom); font-size:1.4rem;">?</span> ${data.title}
            </div>
            <div class="ip-body">
                ${data.desc}
                <div class="ip-formula">${data.formula}</div>
            </div>
        </div>
    `;
    
    parent.appendChild(overlay);
    overlay.style.display = 'flex';
    updateBodyScroll();
}

// Close info popup
function closeInfoPopup() {
    const overlay = document.getElementById('mathInfoPopup');
    if(overlay) overlay.remove();
    updateBodyScroll();
}

// HELPER: Reconstruct full calculation data from cached "Lite" data
function reconstructMathData(liteData) {
    // 1. Identify Unit from ID string (e.g., "law-BASE-...")
    const unit = unitDatabase.find(u => liteData.id.startsWith(u.id));
    if (!unit) return null;

    // 2. Identify active states from ID string
    const isAbility = liteData.id.includes('-ABILITY');
    const isVR = liteData.id.includes('-VR');
    const isCard = liteData.id.includes('-CARD');

    // 3. Setup Unit Stats
    let effectiveStats = { ...unit.stats };
    effectiveStats.id = unit.id;
    if (unit.tags) effectiveStats.tags = unit.tags;
    
    if (isAbility && unit.ability) Object.assign(effectiveStats, unit.ability);
    if (unit.id === 'kirito' && isVR && isCard) {
        effectiveStats.dot = 200; effectiveStats.dotDuration = 4; effectiveStats.dotStacks = 1;
    }

    // 4. Identify Trait from Name
    let trait = traitsList.find(t => t.name === liteData.traitName) || 
                customTraits.find(t => t.name === liteData.traitName) ||
                (unitSpecificTraits[unit.id] || []).find(t => t.name === liteData.traitName);
    if (!trait) trait = traitsList.find(t => t.id === 'ruler');

    // 5. Reconstruct Relic Stats (Set + Main + Subs)
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

    // Add Sub Stats
    if (liteData.subStats) {
        ['head', 'body', 'legs'].forEach(slot => {
            if (liteData.subStats[slot]) {
                liteData.subStats[slot].forEach(sub => {
                    if (sub.type && sub.val) totalStats[sub.type] += sub.val;
                });
            }
        });
    }

    // 6. Setup Context
    const isSpaPrio = liteData.prio === 'spa';
    const isRangePrio = liteData.prio === 'range';
    
    // Determine points logic (Law uses 99/0 for Range, others use standard)
    let dmgPts = 99, spaPts = 0;
    if (isSpaPrio) { dmgPts = 0; spaPts = 99; }
    
    const context = {
        dmgPoints: dmgPts,
        spaPoints: spaPts,
        wave: 25,
        isBoss: false,
        traitObj: trait,
        placement: Math.min(unit.placement, trait.limitPlace || unit.placement),
        isSSS: true,
        headPiece: liteData.headUsed || (liteData.subStats && liteData.subStats.selectedHead) || 'none',
        isVirtualRealm: (unit.id === 'kirito' && isVR)
    };

    // 7. Run Calculation with Global Toggle Sync
    // We check the actual checkbox state because the user can only click cards valid for the current view.
    const checkbox = document.getElementById('globalHypothetical');
    const isFixedMode = checkbox ? checkbox.checked : false;

    // Save previous state to prevent side effects
    const previousDotState = statConfig.applyRelicDot;
    
    // Apply state from UI toggle
    statConfig.applyRelicDot = isFixedMode;

    // Calculate
    const result = calculateDPS(effectiveStats, totalStats, context);

    // Restore state
    statConfig.applyRelicDot = previousDotState;

    return result;
}

// Show math breakdown for a build
const showMath = (id) => { 
    let data = cachedResults[id]; 
    
    if(!data) { 
        console.error("Math data not found for ID:", id); 
        return; 
    }

    const content = document.getElementById('mathContent'); 

    // DETECT STATIC DATA: If lvStats (deep object) is missing, reconstruct it
    if (!data.lvStats || !data.critData) {
        try {
            data = reconstructMathData(data);
            if (!data) throw new Error("Failed to reconstruct unit data");
        } catch (e) {
            console.error("Reconstruction failed:", e);
            content.innerHTML = `<div style="padding:20px; color:#f87171;">Error recalculating data: ${e.message}</div>`;
            toggleModal('mathModal', true);
            return;
        }
    }

    try {
        content.innerHTML = renderMathContent(data); 
        toggleModal('mathModal', true); 
    } catch (e) {
        console.error("Error rendering math content:", e);
        content.innerHTML = `<div style="padding:20px; color:#f87171;">Error rendering data: ${e.message}</div>`;
        toggleModal('mathModal', true);
    }
};
window.showMath = showMath;

const closeMath = () => toggleModal('mathModal', false);
const openPatchNotes = () => toggleModal('patchModal', true);
const closePatchNotes = () => toggleModal('patchModal', false);

// Render patch notes
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

// Open comparison modal (Fixed: Respects Global Toggles & Local Filters)
function openComparison() {
    if (selectedUnitIds.size === 0) return;

    toggleModal('compareModal', true);
    const content = document.getElementById('compareContent');
    
    // 1. Determine Global State (Fixed vs Bugged)
    const isFixedMode = document.body.classList.contains('show-fixed-relics');
    const subMode = isFixedMode ? 'fixed' : 'bugged';

    // 2. Determine Configuration Index based on Global Toggles
    const showHead = document.getElementById('globalHeadPiece').checked;
    const showSubs = document.getElementById('globalSubStats').checked;

    // Config Index Mapping from rendering.js:
    // 0: Head=F, Subs=F
    // 1: Head=F, Subs=T
    // 2: Head=T, Subs=F
    // 3: Head=T, Subs=T
    let configIndex = 0;
    if (!showHead && !showSubs) configIndex = 0;
    else if (!showHead && showSubs) configIndex = 1;
    else if (showHead && !showSubs) configIndex = 2;
    else if (showHead && showSubs) configIndex = 3;

    let comparisonData = [];

    selectedUnitIds.forEach(unitId => {
        const unit = unitDatabase.find(u => u.id === unitId);
        if (!unit) return;

        // 3. Determine Ability State (Base vs Ability)
        const useAbility = activeAbilityIds.has(unitId);
        const mode = (useAbility && unit.ability) ? 'abil' : 'base';

        // 4. Access Cache using the SPECIFIC config index
        const cacheEntry = unitBuildsCache[unitId];
        if (!cacheEntry || !cacheEntry[mode] || !cacheEntry[mode][subMode]) return;

        const allBuilds = cacheEntry[mode][subMode][configIndex] || [];
        if (allBuilds.length === 0) return;

        // 5. Read Local Filters (Set, Prio, Head) from Unit Card
        const card = document.getElementById('card-' + unitId);
        let activePrio = 'all';
        let activeSet = 'all';
        let activeHead = 'all';

        if (card) {
            activePrio = card.querySelector('select[data-filter="prio"]')?.value || 'all';
            activeSet = card.querySelector('select[data-filter="set"]')?.value || 'all';
            activeHead = card.querySelector('select[data-filter="head"]')?.value || 'all';
        }

        // 6. Filter the build list
        // Note: If Global Head is OFF (configIndex 0 or 1), builds will have headUsed='none'.
        // If the user selects activeHead='sun_god', this filter will correctly return 0 results.
        const filteredBuilds = allBuilds.filter(r => {
            const prioMatch = activePrio === 'all' || r.prio === activePrio;
            const setMatch = activeSet === 'all' || r.setName === activeSet;
            const headMatch = activeHead === 'all' || (r.headUsed || 'none') === activeHead;
            return prioMatch && setMatch && headMatch;
        });

        if (filteredBuilds.length === 0) return; 

        // 7. Sort filtered builds to find the best representative
        // Prioritize Range if specific unit requires it or user filtered for it
        if (activePrio === 'range' || (unitId === 'law' && activePrio === 'all')) {
            filteredBuilds.sort((a, b) => (b.range || 0) - (a.range || 0));
        } else {
            filteredBuilds.sort((a, b) => b.dps - a.dps);
        }

        // 8. Extract Best Result
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

    // 9. Sort by Value (Descending)
    comparisonData.sort((a, b) => b.sortVal - a.sortVal);

    // 10. Render
    let html = `<table class="compare-table"><thead><tr><th style="width:25%">Unit</th><th>Primary Stat</th><th>Best Filtered Build</th></tr></thead><tbody>`;
    
    if (comparisonData.length === 0) {
        html += `<tr><td colspan="3" style="text-align:center; padding:20px;">No builds found matching current filters.</td></tr>`;
    } else {
        comparisonData.forEach(data => {
            const rowClass = data.isCustom ? 'comp-row-custom' : '';
            const prioColor = data.bestPrio === 'SPA' ? 'var(--custom)' : (data.bestPrio === 'RANGE' ? '#4caf50' : 'var(--gold)');
            
            // Format Value
            const valStr = data.isRangePrio ? data.sortVal.toFixed(1) : format(data.sortVal);
            // Format Label
            const labelStr = data.isRangePrio ? "RANGE" : "DPS";
            const labelColor = data.isRangePrio ? "#4caf50" : "#666"; 

            html += `
            <tr class="${rowClass}">
                <td>
                    <div class="comp-unit-wrap">
                        ${getUnitImgHtml(data.u, 'comp-img', 'small')}
                        <div>
                            <div style="font-weight:bold; color:#fff;">${data.u.name}</div>
                            <span class="comp-sub">${data.isCustom ? 'Custom' : data.u.role}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="comp-highlight">
                        ${valStr} <span style="font-size:0.6rem; vertical-align:middle; color:${labelColor}; font-weight:bold; margin-left:2px;">${labelStr}</span>
                    </div>
                    <span class="comp-sub">SPA: ${data.bestSpa.toFixed(3)}s</span>
                </td>
                <td>
                    <span class="comp-tag">${data.bestTraitName}</span>
                    <div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">
                        ${data.bestBuildName} 
                        <span style="color:${prioColor}; font-weight:bold; font-size:0.7rem;">[${data.bestPrio}]</span>
                    </div>
                </td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>`;
    content.innerHTML = html;
}

const closeCompare = () => { toggleModal('compareModal', false); };

// Open trait guide modal
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
                <span class="tg-trait" style="color:var(--gold);">⚡ ${getTraitName(unit.meta.short)}</span>
            </div>
            <div class="tg-section">
                <span class="tg-label">Infinite Mode</span>
                <span class="tg-trait" style="color:var(--custom);">♾️ ${getTraitName(unit.meta.long)}</span>
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

const closeTraitGuide = () => { toggleModal('traitGuideModal', false); };