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

// Generate HTML badge for a single stat
// UPDATED: Added onclick to open specific stat popup, added cursor:pointer
function getBadgeHtml(statKeyOrName, value = null) {
    if (!statKeyOrName) return '<span style="font-size:0.65rem; color:#444;">-</span>';
    
    const type = getStatType(statKeyOrName);
    const info = STAT_INFO[type];
    const innerContent = info.special || info.label;

    let valueHtml = '';
    if (value !== null && !isNaN(value)) {
        const fmtVal = Number.isInteger(value) ? value : value.toFixed(1);
        valueHtml = ` <span style="font-size:0.9em; opacity:1; margin-left:3px; font-weight:800;">${fmtVal}%</span>`;
    }

    return `<span class="stat-badge" style="color:${info.color}; border-color:${info.border}; cursor:pointer;" onclick="event.stopPropagation(); openInfoPopup('stat_${type}')">${innerContent}${valueHtml}</span>`;
}

// NEW: Render badge from explicit value array [{type:'dmg', val:12}, ...]
// UPDATED: Added onclick to individual stat parts, added cursor:pointer
function getRichBadgeHtml(statsArray) {
    if (!statsArray || statsArray.length === 0) return '<span style="font-size:0.65rem; color:#555;">None</span>';
    
    // Sort logic (Priority: Dmg > Range > Spa > Others)
    const priority = { 'dmg': 1, 'damage': 1, 'range': 2, 'spa': 3 };
    statsArray.sort((a, b) => {
        const pa = priority[a.type.toLowerCase()] || 99;
        const pb = priority[b.type.toLowerCase()] || 99;
        return pa - pb;
    });

    // 1. Determine Border Color based on the Primary Stat (first item)
    const primaryType = getStatType(statsArray[0].type);
    const borderColor = STAT_INFO[primaryType].border;

    const parts = statsArray.map(stat => {
        const type = getStatType(stat.type);
        const info = STAT_INFO[type];
        const valStr = stat.val.toFixed(1) + '%';
        
        // Add onclick to individual parts
        return `<span style="color:${info.color}; font-size:0.55rem; font-weight:700; cursor:pointer;" onclick="event.stopPropagation(); openInfoPopup('stat_${type}')">${info.label} <span style="font-weight:800; color:#fff; font-size:0.9em;">${valStr}</span></span>`;
    });

    // 2. Apply dynamic border color
    return `
    <div class="stat-badge" style="border-color:${borderColor}; background:rgba(0,0,0,0.4); display:inline-flex; align-items:center; gap:2px; padding:0 3px; width:fit-content; max-width:100%; height:18px; white-space:nowrap;">
        ${parts.join('<span style="color:#666; font-size:0.7em; font-weight:bold; margin:0 1px; opacity:0.8;">|</span>')}
    </div>`;
}

// Updated to handle both Strings (Old) and Arrays (New)
function formatStatBadge(text, totalRolls = null) {
    if(!text) return '';
    
    // If text is an Array (new format), delegate to getRichBadgeHtml
    if (Array.isArray(text)) {
        return getRichBadgeHtml(text);
    }

    if (typeof text === 'string' && text.includes('<')) return text;
    
    // Fallback logic for string-based inputs (Manual Guides)
    let parts = text.split(/[\/>,]+/).map(p => p.trim()).filter(p => p);
    
    if (parts.length === 2 && totalRolls) {
        // Construct faux object so manual guides also get the colored border
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

// Global scroll lock helper with Position Preservation
// Prevents the page from jumping to top when modal opens
let savedScrollPosition = 0;

function updateBodyScroll() {
    const visibleModals = Array.from(document.querySelectorAll('.modal-overlay')).some(m => m.style.display === 'flex');
    const visiblePopups = document.getElementById('mathInfoPopup');
    const body = document.body;

    if (visibleModals || visiblePopups) {
        if (!body.classList.contains('no-scroll')) {
            // Locking: Save position and fix body
            savedScrollPosition = window.scrollY;
            body.style.top = `-${savedScrollPosition}px`;
            body.style.position = 'fixed';
            body.style.width = '100%'; // Prevent collapse
            body.classList.add('no-scroll');
        }
    } else {
        if (body.classList.contains('no-scroll')) {
            // Unlocking: Remove fixed, restore scroll
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            body.classList.remove('no-scroll');
            window.scrollTo(0, savedScrollPosition);
        }
    }
}