// MODALS.JS - Unified Modal Manager
// ============================================================================

// --- GENERIC MODAL CONTROLLER ---

/**
 * Toggles visibility of a specific modal ID.
 * Handles scroll locking on the body and exclusive modal visibility.
 */
window.toggleModal = (modalId, show = true) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (show) {
        // Requirement 1: Close all other open modals first
        const otherVisible = document.querySelectorAll('.modal-overlay.is-visible');
        otherVisible.forEach(m => {
            if (m.id !== modalId) m.classList.remove('is-visible');
        });

        modal.classList.add('is-visible');
        if (typeof updateBodyScroll === 'function') updateBodyScroll();

        // Requirement 2: Add class to body to hide Mobile FAB via CSS
        document.body.classList.add('modal-open');
    } else {
        modal.classList.remove('is-visible');

        // Check if any other modals are still open
        setTimeout(() => {
            const anyVisible = document.querySelectorAll('.modal-overlay.is-visible').length > 0;
            if (!anyVisible) {
                if (typeof updateBodyScroll === 'function') updateBodyScroll();
                document.body.classList.remove('modal-open'); // Re-show FAB
            }
        }, 50);
    }
};

/**
 * Opens the single Universal Modal with dynamic content.
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

/**
 * Specifically handles closing the one-time announcement modal
 */
window.closeAnnouncement = () => {
    localStorage.setItem('hasSeenFinalUpdateNotice', 'true');
    closeModal('announcementModal');
};

// --- SPECIFIC IMPLEMENTATIONS USING UNIVERSAL MODAL ---

/**
 * Shows Math Breakdown
 */
const showMath = (id) => {
    let data = window.cachedResults[id];

    // FALLBACK: If cache was cleared (due to global toggle), attempt to re-generate
    if (!data) {
        const unitId = id.split('-')[0];
        const unit = typeof unitDatabase !== 'undefined' ? unitDatabase.find(u => u.id === unitId) : null;
        if (unit && typeof processUnitCache === 'function') {
            processUnitCache(unit);
            data = window.cachedResults[id];
        }
    }

    if (!data) return;

    if (!data.lvStats || !data.critData) {
        try {
            data = reconstructMathData(data);
        } catch (e) { console.error(e); return; }
    }

    const htmlContent = renderMathContent(data);

    showUniversalModal({
        title: `<span class="text-white">DPS BREAKDOWN</span>`,
        content: htmlContent,
        size: 'modal-md'
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
        if (!id) return '-';
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

// Pre-calculated map for O(1) lookups
let unitMap = null;
const refreshUnitMap = () => {
    unitMap = new Map();
    unitDatabase.forEach(u => unitMap.set(u.id, u));
};

const getUnitById = (id) => {
    if (!unitMap) refreshUnitMap();
    return unitMap.get(id);
};

window.refreshUnitMap = refreshUnitMap;

function openUnitInfo(unitId) {
    const unit = getUnitById(unitId);
    if (!unit) return;

    let passivesHtml = '';
    if (unit.passives && Array.isArray(unit.passives)) {
        passivesHtml = unit.passives.map(p => `<li class="info-passive-item"><strong class="text-white">${p.name}:</strong> <span class="info-passive-desc">${p.desc}</span></li>`).join('');
    } else {
        const s = unit.stats;
        if (s.passiveDmg) passivesHtml += `<li><span>Damage:</span> <span>+${s.passiveDmg}%</span></li>`;
        if (s.passiveSpa) passivesHtml += `<li><span>SPA:</span> <span>-${s.passiveSpa}%</span></li>`;
        if (s.passiveRange) passivesHtml += `<li><span>Range:</span> <span>+${s.passiveRange}%</span></li>`;
        if (s.hyper) passivesHtml += `<li><span>Hyper Dmg:</span> <span>+${s.hyper}%</span></li>`;
    }

    if (!passivesHtml) passivesHtml = '<li>None</li>';

    let modesHtml = '';
    if (unit.modes && Object.keys(unit.modes).length > 0) {
        modesHtml = Object.entries(unit.modes).map(([name, data]) =>
            `<li class="info-passive-item"><strong class="text-custom">${name}:</strong> <span class="info-passive-desc">${data.desc}</span></li>`
        ).join('');
    }

    let etherealHtml = '';
    if (unit.etherealization) {
        if (Array.isArray(unit.etherealization)) {
            etherealHtml = unit.etherealization.map((text, idx) => `
                <li class="info-ethereal-item">
                    <span class="info-ethereal-text">${text}</span>
                    <span class="e-badge">E${idx + 1}</span>
                </li>
            `).join('');
        } else {
            const e = unit.etherealization;
            if (e.dmg) etherealHtml += `<li><span>Damage:</span> <span>+${e.dmg}%</span></li>`;
            if (e.spa) etherealHtml += `<li><span>SPA:</span> <span>-${e.spa}%</span></li>`;
            if (e.range) etherealHtml += `<li><span>Range:</span> <span>+${e.range}%</span></li>`;
            if (e.desc) etherealHtml += `<li class="text-xs text-dim" style="margin-top: 5px; display: block; text-align: center;">${e.desc}</li>`;
        }
    } else {
        etherealHtml = '<li>None</li>';
    }

    const html = `
        <div class="unit-info-modal">
            <div class="info-section section-discovery">
                <div class="info-sec-title">Unit Discovery</div>
                <ul class="info-list">
                    <li><span>Role:</span> <span>${unit.role}</span></li>
                    <li><span>Placement Type:</span> <span class="${unit.placementType === 'Hill' ? 'text-gold' : (unit.placementType === 'Hybrid' ? 'text-white' : 'text-custom')}">${unit.placementType || 'Ground'}</span></li>
                    <li><span>Element:</span> <span class="text-custom">${unit.stats.element}</span></li>
                    <li><span>Cost:</span> <span class="text-gold">${unit.totalCost.toLocaleString()}</span></li>
                    <li><span>Max Placements:</span> <span>${unit.placement}</span></li>
                </ul>
            </div>
            ${unit.tags && unit.tags.length > 0 ? `
            <div class="info-section section-tags">
                <div class="info-sec-title">Unit Tags</div>
                <div class="info-tags-container">
                    ${unit.tags.map(t => `<span class="info-tag-chip">${t}</span>`).join('')}
                </div>
            </div>` : ''}
            <div class="info-section section-stats">
                <div class="info-sec-title">Base Statistics (Lv 1)</div>
                <ul class="info-list">
                    <li><span>Damage:</span> <span class="text-white">${unit.stats.dmg.toLocaleString()}</span></li>
                    <li><span>SPA:</span> <span class="text-white">${unit.stats.spa}s</span></li>
                    <li><span>Range:</span> <span class="text-white">${unit.stats.range}</span></li>
                    <li><span>SPA Cap:</span> <span class="text-white">${unit.stats.spaCap}s</span></li>
                </ul>
            </div>
            <div class="info-section section-passives">
                <div class="info-sec-title">Passives / Innates</div>
                <ul class="info-list">${passivesHtml}</ul>
            </div>
            <div class="info-section section-ethereal">
                <div class="info-sec-title">Etherealization Buffs</div>
                <ul class="info-list">${etherealHtml}</ul>
            </div>
            ${unit.ability ? `
            <div class="info-section section-ability">
                <div class="info-sec-title">Active Ability: ${unit.ability.abilityName}</div>
                <ul class="info-list">
                    ${unit.ability.cooldown ? `<li><span>Cooldown:</span> <span class="text-gold">${unit.ability.cooldown}s</span></li>` : ''}
                    <li class="info-ability-desc-item"><span class="info-ability-desc">${unit.ability.desc || 'No description available.'}</span></li>
                </ul>
            </div>` : ''}
            ${modesHtml ? `<div class="info-section section-modes">
                <div class="info-sec-title">Class Details (Battle Adaptation)</div>
                <ul class="info-list">${modesHtml}</ul>
            </div>` : ''}
        </div>
    `;

    const existing = document.getElementById('unitInfoPopup');
    if (existing) existing.remove();

    let overlay = document.createElement('div');
    overlay.id = 'unitInfoPopup';
    overlay.className = 'info-popup-overlay is-visible';

    document.body.classList.add('modal-open');

    // Close on backdrop click
    overlay.onclick = function (e) {
        if (e.target === overlay) {
            overlay.remove();
            const otherModals = document.querySelectorAll('.modal-overlay.is-visible');
            if (otherModals.length === 0) document.body.classList.remove('modal-open');
        }
    };

    // Structure similar to openInfoPopup but for unit info
    overlay.innerHTML = `
        <div class="modal-box modal-sm info-popup-box">
            <div class="modal-header">
                <h2 class="modal-title">UNIT INFO: ${unit.name.toUpperCase()}</h2>
            </div>
            <div class="modal-body" style="padding-top: 5px;">
                ${html}
            </div>
            <div class="modal-footer">
                <button class="action-btn secondary" onclick="document.getElementById('unitInfoPopup').remove(); if(document.querySelectorAll('.modal-overlay.is-visible').length === 0) document.body.classList.remove('modal-open');">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}
window.openUnitInfo = openUnitInfo;

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
            const isAbility = (u.id !== 'genos' && activeAbilityIds.has(u.id)) && u.ability;
            const isKiritoCard = u.id === 'kirito' && kiritoState && kiritoState.card;
            const dbKey = u.id + (isKiritoCard ? 'kirito_card' : '') + (isAbility ? '_abil' : '');
            // Use fixed mode, config 0 (Max Potential)
            const list = window.STATIC_BUILD_DB[dbKey]?.['fixed']?.[0];
            if (list && list.length > 0) {
                return u.id === 'law' ? (list[0].range || 0) : list[0].dps;
            }
        }
        return u.stats.dmg || 0;
    };

    const traitOrder = ['Ruler', 'Eternal', 'Sacred', 'Fission', 'Astral', 'Duelist', 'Wizard'];

    if (!shortMap['Fission']) shortMap['Fission'] = [];
    if (!longMap['Fission']) longMap['Fission'] = [];

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
            units.sort((a, b) => getUnitScore(b) - getUnitScore(a));

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
        content: `<div class="tier-list-container">${renderSection('Wave 1-30', shortMap)}${renderSection('Infinite Mode', longMap)}</div>`,
        size: 'modal-lg',
        footerButtons: `<button class="action-btn secondary" onclick="closeModal('universalModal')">Close</button>`
    });
}
window.openTraitTierList = openTraitTierList;

/**
 * Shows a guide of all standard traits and their stats.
 */
function openAllTraitsGuide() {
    if (typeof traitsList === 'undefined') return;

    const traitsToShow = traitsList.filter(t => t.id !== 'none');

    const formatStat = (key, trait) => {
        const value = trait[key];
        if (value === undefined || value === 0 || value === false) return '';

        let label = key.toUpperCase();
        let valText = '';
        let sign = '+';
        let suffix = '%';

        switch (key) {
            case 'dmg': label = 'Damage'; valText = `${sign}${value}${suffix}`; break;
            case 'spa': label = 'SPA'; valText = `-${value}${suffix}`; break;
            case 'range': label = 'Range'; valText = `${sign}${value}${suffix}`; break;
            case 'bossDmg': label = 'Boss Dmg'; valText = `${sign}${value}${suffix}`; break;
            case 'critRate': label = 'Crit Rate'; valText = `${sign}${value}${suffix}`; break;
            case 'dotBuff':
                label = 'DoT Buff';
                valText = `${sign}${value}${suffix}`;
                if (trait.isDotBugged) valText += ` <span style="color: #f87171; font-size: 0.8em;">(Bugged)</span>`;
                break;
            case 'costReduction': label = 'Cost'; valText = `-${value}${suffix}`; break;
            case 'limitPlace': label = 'Placement'; valText = `Limit ${value}`; break;
            case 'afflictionDuration':
                label = 'Affliction Dur.';
                valText = `${sign}${value}${suffix}`;
                if (trait.isAfflictionBugged) valText += ` <span style="color: #f87171; font-size: 0.8em;">(Bugged)</span>`;
                break;
            case 'relicBuff': label = 'Relic Stats'; valText = `${sign}${((value - 1) * 100).toFixed(0)}${suffix}`; break;
            case 'isEternal': return `<li><span class="atg-label">Passive</span><span class="atg-value" style="font-size: 0.75rem; text-align: right; line-height: 1.2;">+5% Dmg & +2.5% Rng / Wave<br>Max: +60% & +30% (12 Waves)</span></li>`;
            case 'hasRadiation': return `<li><span class="atg-label">Radiation</span><span class="atg-value" title="Deals ${trait.radiationPct}% of Unit Damage over 10 seconds">${trait.radiationPct}% Dmg / 10s</span></li>`;
            case 'dmgDebuff':
                label = 'Debuff';
                valText = `${sign}${value}${suffix}`;
                if (trait.isDebuffBugged) valText += ` <span style="color: #f87171; font-size: 0.8em;">(Bugged)</span>`;
                break;
            case 'allowDotStack': return `<li><span class="atg-label">Passive</span><span class="atg-value">DoT Stacks</span></li>`;
            default: return '';
        }
        return `<li><span class="atg-label">${label}</span><span class="atg-value">${valText}</span></li>`;
    };

    const html = traitsToShow.map(trait => {
        const statOrder = ['dmg', 'spa', 'range', 'critRate', 'bossDmg', 'dotBuff', 'afflictionDuration', 'relicBuff', 'costReduction', 'limitPlace', 'isEternal', 'hasRadiation', 'dmgDebuff', 'allowDotStack'];
        const statsHtml = statOrder.map(key => formatStat(key, trait)).join('');

        return `
            <div class="all-traits-card">
                <div class="atg-header">
                    <div class="trait-img-rainbow"><img src="images/traits/${trait.name}.png" onerror="this.parentElement.style.display='none'"></div>
                    <span class="atg-name">${trait.name}</span>
                </div>
                <div class="atg-desc">${trait.desc}</div>
                <ul class="atg-stats">
                    ${statsHtml}
                </ul>
            </div>
        `;
    }).join('');

    showUniversalModal({
        title: 'TRAIT STATS',
        content: `<div class="all-traits-grid">${html}</div>`,
        size: 'modal-lg'
    });
}
window.openAllTraitsGuide = openAllTraitsGuide;

// --- INFO POPUPS (Overlay style) ---

function openInfoPopup(key) {
    const data = infoDefinitions[key];
    if (!data) return;

    // Remove existing if any
    const existing = document.getElementById('mathInfoPopup');
    if (existing) existing.remove();

    let overlay = document.createElement('div');
    overlay.id = 'mathInfoPopup';
    overlay.className = 'info-popup-overlay is-visible';

    // Prevent background scrolling while this top-level popup is open
    document.body.classList.add('modal-open');

    // Close on backdrop click
    overlay.onclick = function (e) {
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
    if (overlay) overlay.remove();

    // Only remove modal-open if no other modals are active
    const otherModals = document.querySelectorAll('.modal-overlay.is-visible');
    if (otherModals.length === 0) {
        document.body.classList.remove('modal-open');
    }
}