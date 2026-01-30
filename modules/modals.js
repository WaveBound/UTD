// ============================================================================
// MODALS.JS - Unified Modal Manager
// ============================================================================

// --- GENERIC MODAL CONTROLLER ---

/**
 * Toggles visibility of a specific modal ID.
 * Handles scroll locking on the body and exclusive modal visibility.
 */
const toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
        // Requirement 1: Close all other open modals first
        const otherVisible = document.querySelectorAll('.modal-overlay.is-visible');
        otherVisible.forEach(m => {
            if (m.id !== modalId) m.classList.remove('is-visible');
        });

        modal.classList.add('is-visible');
        document.body.classList.add('scroll-locked');
        
        // Requirement 2: Add class to body to hide Mobile FAB via CSS
        document.body.classList.add('modal-open'); 
    } else {
        modal.classList.remove('is-visible');
        
        // Check if any other modals are still open (shouldn't be, but good practice)
        // Use timeout to allow UI to update
        setTimeout(() => {
            const anyVisible = document.querySelectorAll('.modal-overlay.is-visible').length > 0;
            if (!anyVisible) {
                document.body.classList.remove('scroll-locked');
                document.body.classList.remove('modal-open'); // Re-show FAB
            }
        }, 50);
    }
};

/**
 * Opens the single Universal Modal with dynamic content.
 * @param {Object} options
 * @param {string} options.title - Header text
 * @param {string} options.content - HTML body content
 * @param {string} options.footer - HTML footer content (buttons)
 * @param {string} options.size - 'sm', 'lg', 'xl' (optional)
 * @param {string} options.headerClass - Optional class for header styling
 */
function showUniversalModal({ title, content, footerButtons = '', size = '', headerClass = '' }) {
    const modal = document.getElementById('universalModal');
    const box = modal.querySelector('.modal-box');
    const titleEl = modal.querySelector('.modal-title');
    const bodyEl = modal.querySelector('.modal-body');
    const footerEl = modal.querySelector('.modal-footer');
    const headerEl = modal.querySelector('.modal-header');

    // Reset Classes
    box.className = 'modal-box ' + size;
    headerEl.className = 'modal-header ' + headerClass;

    // Set Content
    titleEl.innerHTML = title;
    bodyEl.innerHTML = content;

    // Default Close Button if no footer provided, or append custom buttons
    if (!footerButtons) {
        footerEl.innerHTML = `<button class="action-btn" onclick="closeModal('universalModal')">Close</button>`;
    } else {
        footerEl.innerHTML = footerButtons;
    }

    toggleModal('universalModal', true);
}

// Global closer helper
window.closeModal = (id) => toggleModal(id, false);

// --- SPECIFIC IMPLEMENTATIONS USING UNIVERSAL MODAL ---

/**
 * Shows Math Breakdown
 */
const showMath = (id) => {
    let data = cachedResults[id];
    if (!data) return;

    if (!data.lvStats || !data.critData) {
        try {
            data = reconstructMathData(data);
        } catch (e) { console.error(e); return; }
    }

    const htmlContent = renderMathContent(data);
    
    showUniversalModal({
        title: `<span class="text-white">DPS BREAKDOWN</span>`, // Clean white title
        content: htmlContent,
        size: 'modal-md' // CHANGED FROM 'modal-lg' TO 'modal-md'
    });
};
window.showMath = showMath; // Expose global

/**
 * Shows Patch Notes
 */
const openPatchNotes = () => {
    if (typeof patchNotesData === 'undefined') return;

    const html = patchNotesData.map(patch => {
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

    showUniversalModal({
        title: 'PATCH NOTES',
        content: html,
        size: 'modal-md'
    });
};

/**
 * Shows Trait Guide
 */
function openTraitGuide(unitId) {
    const unit = unitDatabase.find(u => u.id === unitId);
    if (!unit || !unit.meta) return;

    const getTraitName = (id) => {
        if(!id) return '-';
        const t = traitsList.find(x => x.id === id || x.name === id);
        return t ? t.name : id;
    };

    const generateSection = (label, traitId, icon) => {
        const name = getTraitName(traitId);
        
        const parts = name.split('/').map(s => s.trim());
        let imagesHtml = '';
        parts.forEach(part => {
            const cleanPart = part.split('(')[0].trim();
            const t = traitsList.find(x => x.name.toLowerCase() === cleanPart.toLowerCase() || x.id === cleanPart.toLowerCase());
            if (t) {
                imagesHtml += `<div class="trait-img-rainbow"><img src="images/traits/${t.name}.png" onerror="this.parentElement.style.display='none'"></div>`;
            }
        });

        return `
            <div class="tg-section">
                <span class="tg-label">${label}</span>
                <span class="tg-trait-rainbow">${name}</span>
                <div class="tg-images-row">${imagesHtml}</div>
            </div>
        `;
    };

    const html = `
        <div class="tg-grid">
            ${generateSection('Wave 1-30', unit.meta.short, '⚡')}
            ${generateSection('Infinite Mode', unit.meta.long, '♾️')}
            ${unit.meta.virtual ? generateSection('Virtual Realm', unit.meta.virtual, '🌌') : ''}
        </div>
        <div class="tg-note">
            <strong>Strategy Note:</strong><br>
            ${unit.meta.note || "No specific strategy notes available for this unit."}
        </div>
    `;

    showUniversalModal({
        title: 'RECOMMENDED TRAITS',
        content: html,
        size: 'modal-sm'
    });
}

/**
 * Shows Trait Tier List (All Units)
 */
function openTraitTierList() {
    const shortMap = {};
    const longMap = {};
    const virtualMap = {};

    const addToMap = (map, traitStr, unit) => {
        if (!traitStr || traitStr === '-') return;
        const parts = traitStr.split('/').map(s => s.trim());
        parts.forEach(p => {
            if (!map[p]) map[p] = [];
            map[p].push(unit);
        });
    };

    unitDatabase.forEach(u => {
        if (u.meta) {
            addToMap(shortMap, u.meta.short, u);
            addToMap(longMap, u.meta.long, u);
            if (u.meta.virtual) addToMap(virtualMap, u.meta.virtual, u);
        }
    });

    // Helper to get DPS score for sorting
    const getUnitScore = (u) => {
        if (window.STATIC_BUILD_DB) {
             const isAbility = activeAbilityIds.has(u.id) && u.ability;
             const isKiritoCard = u.id === 'kirito' && kiritoState && kiritoState.card;
             const dbKey = u.id + (isKiritoCard ? 'kirito_card' : '') + (isAbility ? '_abil' : '');
             // Use fixed mode, config 3 (Head+Subs) for max potential
             const list = window.STATIC_BUILD_DB[dbKey]?.['fixed']?.[3];
             if (list && list.length > 0) {
                 return u.id === 'law' ? (list[0].range || 0) : list[0].dps;
             }
        }
        return u.stats.dmg || 0;
    };

    const traitOrder = ['Ruler', 'Eternal', 'Sacred', 'Astral', 'Fission', 'Duelist', 'Wizard'];

    const renderSection = (title, map) => {
        const traits = Object.keys(map).sort((a, b) => {
            const cleanA = a.split('(')[0].trim();
            const cleanB = b.split('(')[0].trim();
            const idxA = traitOrder.indexOf(cleanA);
            const idxB = traitOrder.indexOf(cleanB);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        let rows = '';
        
        traits.forEach(t => {
            const units = map[t];
            // Sort units by DPS descending
            units.sort((a,b) => getUnitScore(b) - getUnitScore(a));

            const unitIcons = units.map(u => `
                <div class="tier-unit" data-id="${u.id}" title="${u.name} (Score: ${parseInt(getUnitScore(u)).toLocaleString()})">
                    <img src="${u.img}" class="tier-unit-img" onerror="this.style.display='none'">
                </div>
            `).join('');

            const cleanT = t.split('(')[0].trim();
            const tObj = traitsList.find(x => x.name.toLowerCase() === cleanT.toLowerCase() || x.id === cleanT.toLowerCase());
            const traitImg = tObj ? `<div class="trait-img-rainbow tier-trait-icon"><img src="images/traits/${tObj.name}.png" onerror="this.parentElement.style.display='none'"></div>` : '';

            rows += `
                <div class="tier-row">
                    <div class="tier-head">
                        ${traitImg}
                        <div class="tier-trait-name">${t}</div>
                    </div>
                    <div class="tier-body">
                        ${unitIcons}
                    </div>
                </div>
            `;
        });

        return `<div class="tier-section"><div class="tier-section-title">${title}</div><div class="tier-grid">${rows}</div></div>`;
    };

    showUniversalModal({
        title: 'TRAIT SUGGESTIONS TIER LIST',
        content: `<div class="tier-list-container">${renderSection('Wave 1-30', shortMap)}${renderSection('Infinite Mode', longMap)}${Object.keys(virtualMap).length > 0 ? renderSection('Virtual Realm', virtualMap) : ''}</div>`,
        size: 'modal-lg',
        footerButtons: `<button class="action-btn secondary" onclick="closeModal('universalModal')">Close</button>`
    });
}
window.openTraitTierList = openTraitTierList;

/**
 * Shows Comparison
 * (Relies on rendering.js logic to build string)
 */
function openComparison() {
    if (selectedUnitIds.size === 0) return;

    // We need to generate the HTML. 
    const html = generateComparisonHTML(); 

    showUniversalModal({
        title: 'META COMPARISON',
        content: html,
        size: 'modal-lg',
        footerButtons: `<button class="action-btn secondary" onclick="closeModal('universalModal')">Close</button>`
    });
}

// --- INFO POPUPS (Overlay style) ---

function openInfoPopup(key) {
    const data = infoDefinitions[key];
    if(!data) return;
    
    // Remove existing if any
    const existing = document.getElementById('mathInfoPopup');
    if(existing) existing.remove();

    let overlay = document.createElement('div');
    overlay.id = 'mathInfoPopup';
    overlay.className = 'info-popup-overlay is-visible';
    
    // Prevent background scrolling while this top-level popup is open
    document.body.classList.add('modal-open');

    // Close on backdrop click
    overlay.onclick = function(e) {
        if (e.target === overlay) closeInfoPopup();
    };
    
    // Reusing the standard .modal-box structure
    overlay.innerHTML = `
        <div class="modal-box modal-sm info-popup-box">
            <div class="modal-header">
                <h2 class="modal-title">${data.title}</h2>
            </div>
            <div class="modal-body">
                <p style="color: #ccc; font-size: 0.95rem; line-height: 1.6; margin-bottom: 15px;">
                    ${data.desc}
                </p>
                <div class="ip-formula">${data.formula}</div>
            </div>
            <div class="modal-footer">
                <button class="action-btn secondary" onclick="closeInfoPopup()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function closeInfoPopup() {
    const overlay = document.getElementById('mathInfoPopup');
    if(overlay) overlay.remove();
    
    // Only remove modal-open if no other modals are active
    // (This ensures the underlying Math modal remains scroll-locked if it's open)
    const otherModals = document.querySelectorAll('.modal-overlay.is-visible');
    if(otherModals.length === 0) {
        document.body.classList.remove('modal-open');
    }
}


function generateComparisonHTML() {
    // Copied and adapted logic from previous openComparison
    const isFixedMode = document.body.classList.contains('show-fixed-relics');
    const subMode = isFixedMode ? 'fixed' : 'bugged';

    const showHead = document.getElementById('globalHeadPiece').checked;
    const showSubs = document.getElementById('globalSubStats').checked;

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
    return html;
}