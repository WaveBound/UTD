const format = (n) => 
    n >= 1e9 ? (n/1e9).toFixed(2) + 'B' : 
    n >= 1e6 ? (n/1e6).toFixed(2) + 'M' : 
    n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : 
    n.toLocaleString(undefined, {maximumFractionDigits:0});

// Resolve stat type from key/name
function getStatType(key) {
    if (!key) return 'dmg';
    let k = key.toLowerCase();
    
    // Check exact matches first
    if (k === 'potency' || k.includes('potency')) return 'potency';
    if (k === 'elemental' || k.includes('elem')) return 'elemental';
    
    // Standard stats
    if (k === 'dmg' || k === 'damage') return 'dmg';
    if (k === 'spa') return 'spa';
    if (k === 'cm' || k.includes('crit dmg') || k.includes('crit damage')) return 'cdmg';
    if (k === 'cf' || k.includes('crit rate') || k.includes('crit')) return 'crit';
    if (k === 'dot') return 'dot';
    if (k.includes('range') || k === 'rng') return 'range';
    
    return 'dmg';
}

// Generate HTML badge for a single stat (MAIN STAT)
function getBadgeHtml(statKeyOrName, value = null) {
    // FIX: Explicitly check for 'none' string to prevent it falling back to DMG
    if (!statKeyOrName || statKeyOrName === 'none') return '<span class="badge-empty">-</span>';
    
    const type = getStatType(statKeyOrName);
    
    // CSS CLASSES
    const borderClass = `border-${type}`; 
    const gradClass = `grad-${type}`;     
    const label = STAT_LABELS[type] || type;
    
    const labelHtml = `<span class="${gradClass}">${label}</span>`;

    let valueHtml = '';
    if (value !== null && !isNaN(value)) {
        const fmtVal = Number.isInteger(value) ? value : value.toFixed(1);
        valueHtml = `<span class="badge-val val-main">${fmtVal}%</span>`;
    }

    return `<div class="badge-base ${borderClass}" onclick="event.stopPropagation(); openInfoPopup('stat_${type}')">${labelHtml}${valueHtml}</div>`;
}

// Generate HTML for multi-stat sub-stats (SUB STAT / RICH BADGE)
function getRichBadgeHtml(statsArray) {
    if (!statsArray || statsArray.length === 0) return '<span class="badge-empty">None</span>';
    
    // Sort logic (Priority: Dmg > Range > Spa > Others)
    const priority = { 'dmg': 1, 'damage': 1, 'range': 2, 'spa': 3 };
    statsArray.sort((a, b) => {
        const pa = priority[a.type.toLowerCase()] || 99;
        const pb = priority[b.type.toLowerCase()] || 99;
        return pa - pb;
    });

    const primaryType = getStatType(statsArray[0].type);
    const containerBorder = `border-${primaryType}`;

    const parts = statsArray.map(stat => {
        const type = getStatType(stat.type);
        const valStr = stat.val.toFixed(1) + '%';
        const label = STAT_LABELS[type] || type;
        
        const textClass = `text-${type}`; 
        const gradClass = `grad-${type}`; 
        
        return `<span class="${textClass} rb-inner" onclick="event.stopPropagation(); openInfoPopup('stat_${type}')"><span class="${gradClass}">${label}</span><span class="badge-val val-sub">${valStr}</span></span>`;
    });

    return `
    <div class="badge-base ${containerBorder}">
        ${parts.join('<span class="badge-sep">|</span>')}
    </div>`;
}

// Updated to handle both Strings (Old) and Arrays (New)
function formatStatBadge(text, totalRolls = null) {
    if(!text) return '';
    
    if (Array.isArray(text)) {
        return getRichBadgeHtml(text);
    }

    if (typeof text === 'string' && text.includes('<')) return text;
    
    let parts = text.split(/[\/>,]+/).map(p => p.trim()).filter(p => p);
    
    if (parts.length === 2 && totalRolls) {
        return getRichBadgeHtml([
            { type: parts[0], val: PERFECT_SUBS[NAME_TO_CODE[parts[0]] || 'dmg'] * (totalRolls/2) },
            { type: parts[1], val: PERFECT_SUBS[NAME_TO_CODE[parts[1]] || 'dmg'] * (totalRolls/2) }
        ]);
    }

    return parts.map(p => getBadgeHtml(p)).join('');
}

function getUnitImgHtml(unit, imgClass = '', iconSizeClass = '') {
    const el = unit.stats && unit.stats.element;
    const elIcon = el ? elementIcons[el] : null;
    if (!elIcon) return `<img src="${unit.img}" class="${imgClass}">`;
    return `<div class="unit-img-wrapper"><img src="${unit.img}" class="${imgClass}"><img src="${elIcon}" class="element-icon ${iconSizeClass}"></div>`;
}

// ============================================================================
// SHARED RELIC SCALING LOGIC (Fixes floating point drift)
// ============================================================================

/**
 * Call this on 'input' events (and initial load). 
 * Stores the unscaled (1-star) value in a data attribute to prevent rounding drift.
 */
function trackBaseStatValue(input, currentStarMult) {
    const val = parseFloat(input.value);
    if (isNaN(val)) {
        input.removeAttribute('data-base-val');
        return;
    }
    // Calculate what the value would be at 1 Star and store it (high precision)
    // val / mult = base
    // Use 6 decimal places to maintain precision during round-trips
    const baseVal = val / (currentStarMult || 1);
    input.dataset.baseVal = baseVal.toFixed(6); 
}

/**
 * Call this on Star Dropdown 'change' events.
 * Updates the displayed value based on the stored base value * new multiplier.
 */
function applyStarScalingToInput(input, newStarMult) {
    // If no base value exists, assume current value is the base (handled gracefully)
    if (!input.dataset.baseVal && input.value !== '') {
        // Initialize base assuming previous mult was 1 (safe fallback)
        trackBaseStatValue(input, 1); 
    }

    const base = parseFloat(input.dataset.baseVal);
    if (isNaN(base)) return;

    // Calculate new display value
    const newVal = parseFloat((base * newStarMult).toFixed(3));
    input.value = newVal;
}