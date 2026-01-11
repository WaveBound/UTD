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

// Show math breakdown for a build
const showMath = (id) => { 
    const data = cachedResults[id]; 
    if(!data) { 
        console.error("Math data not found for ID:", id); 
        return; 
    }
    const content = document.getElementById('mathContent'); 
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

// Open comparison modal
function openComparison() {
    if(selectedUnitIds.size === 0) return;
    toggleModal('compareModal', true);
    const content = document.getElementById('compareContent');
    const selectedUnits = unitDatabase.filter(u => selectedUnitIds.has(u.id));
    const includeSubs = document.getElementById('globalSubStats').checked;
    const includeHead = document.getElementById('globalHeadPiece').checked;
    const comparisonHeadMode = includeHead ? 'auto' : 'none';
    const subCandidates = getValidSubCandidates();
    const filteredBuilds = getFilteredBuilds();

    const findBest = (unitObj, statsObj, availableTraits) => {
        let bestResult = { total: -1 }, bestTraitName = "", bestBuildName = "", bestSpa = 0, bestPrio = "";
        statsObj.id = unitObj.id;
        
        if(unitObj.tags) statsObj.tags = unitObj.tags;

        const isKiritoVR = (unitObj.id === 'kirito' && kiritoState.realm);

        availableTraits.forEach(trait => {
            if(trait.id === 'none') return;
            let place = Math.min(unitObj.placement, trait.limitPlace || unitObj.placement);
            filteredBuilds.forEach(build => {
                [{ p: 'spa', ctx: { dmgPoints: 0, spaPoints: 99, wave: 25, isBoss: false, traitObj: trait, placement: place, isSSS: true, isVirtualRealm: isKiritoVR } },
                 { p: 'dmg', ctx: { dmgPoints: 99, spaPoints: 0, wave: 25, isBoss: false, traitObj: trait, placement: place, isSSS: true, isVirtualRealm: isKiritoVR } }
                ].forEach(({p, ctx}) => {
                    statsObj.context = ctx;
                    let cfg = getBestSubConfig(build, statsObj, includeSubs, comparisonHeadMode, subCandidates);
                    let res = cfg.res;
                    if (res.total > bestResult.total) {
                        bestResult = res; 
                        bestPrio = p === 'dmg' ? "DMG" : "SPA"; 
                        bestTraitName = trait.name; 
                        bestBuildName = build.name; 
                        bestSpa = res.spa;
                    }
                });
            });
        });
        return bestResult.total !== -1 ? { u: unitObj, bestResult, bestTraitName, bestBuildName, bestSpa, bestPrio } : null;
    };

    let comparisonData = [];
    selectedUnits.forEach(u => {
        let effectiveStats = { ...u.stats };
        if (activeAbilityIds.has(u.id) && u.ability) Object.assign(effectiveStats, u.ability);
        
        if(u.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
            effectiveStats.dot = 200; 
            effectiveStats.dotDuration = 4; 
            effectiveStats.dotStacks = 1; 
        }

        const std = findBest(u, effectiveStats, traitsList);
        if(std) comparisonData.push(std);
        const customSet = [...customTraits, ...(unitSpecificTraits[u.id] || [])];
        const cst = customSet.length > 0 ? findBest(u, effectiveStats, customSet) : null;
        if(cst) { cst.isCustom = true; comparisonData.push(cst); }
    });

    comparisonData.sort((a, b) => b.bestResult.total - a.bestResult.total);
    let html = `<table class="compare-table"><thead><tr><th style="width:25%">Unit</th><th>DPS</th><th>Best Meta Build</th></tr></thead><tbody>`;
    comparisonData.forEach(data => {
        const rowClass = data.isCustom ? 'comp-row-custom' : '';
        html += `<tr class="${rowClass}"><td><div class="comp-unit-wrap">${getUnitImgHtml(data.u, 'comp-img', 'small')}<div><div style="font-weight:bold; color:#fff;">${data.u.name}</div><span class="comp-sub">${data.isCustom ? 'Custom' : data.u.role}</span></div></div></td><td><div class="comp-highlight">${format(data.bestResult.total)}</div><span class="comp-sub">SPA: ${data.bestSpa.toFixed(3)}s</span></td><td><span class="comp-tag">${data.bestTraitName}</span><div style="font-size:0.75rem; margin-top:4px; opacity:0.8;">${data.bestBuildName} <span style="color:${data.bestPrio === 'SPA' ? 'var(--custom)' : 'var(--gold)'}; font-weight:bold; font-size:0.7rem;">[${data.bestPrio}]</span></div></td></tr>`;
    });
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
