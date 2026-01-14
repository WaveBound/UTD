// --- START OF FILE utils.js ---

const format = (n) => 
    n >= 1e9 ? (n/1e9).toFixed(2) + 'B' : 
    n >= 1e6 ? (n/1e6).toFixed(2) + 'M' : 
    n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : 
    n.toLocaleString(undefined, {maximumFractionDigits:0});

// Resolve stat type from key/name
function getStatType(key) {
    if (!key) return 'dmg';
    let k = key.toLowerCase();
    if (k === 'dmg' || k === 'damage') return 'dmg';
    if (k === 'spa') return 'spa';
    if (k === 'cm' || k.includes('crit dmg') || k.includes('crit damage')) return 'cdmg';
    if (k === 'cf' || k.includes('crit rate') || k.includes('crit')) return 'crit';
    if (k === 'dot' || k.includes('buff')) return 'dot';
    if (k.includes('range') || k === 'rng') return 'range';
    return 'dmg';
}

// Generate HTML badge for a single stat (MAIN STAT)
function getBadgeHtml(statKeyOrName, value = null) {
    if (!statKeyOrName) return '<span class="badge-empty">-</span>';
    
    const type = getStatType(statKeyOrName);
    
    // CSS CLASSES - using border classes instead of inline styles
    const borderClass = `border-${type}`; 
    const gradClass = `grad-${type}`;     
    const label = STAT_LABELS[type] || type;
    
    const labelHtml = `<span class="${gradClass}">${label}</span>`;

    let valueHtml = '';
    if (value !== null && !isNaN(value)) {
        const fmtVal = Number.isInteger(value) ? value : value.toFixed(1);
        valueHtml = `<span class="badge-val val-main">${fmtVal}%</span>`;
    }

    // Using onclick for popup info
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

// Generate unit image HTML with element icon
function getUnitImgHtml(unit, imgClass = '', iconSizeClass = '') {
    const el = unit.stats && unit.stats.element;
    const elIcon = el ? elementIcons[el] : null;
    if (!elIcon) return `<img src="${unit.img}" class="${imgClass}">`;
    return `<div class="unit-img-wrapper"><img src="${unit.img}" class="${imgClass}"><img src="${elIcon}" class="element-icon ${iconSizeClass}"></div>`;
}