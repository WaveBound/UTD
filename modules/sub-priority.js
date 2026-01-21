// --- START OF FILE sub-priority.js ---

function viewSubPriority(buildId) {
    const resultData = cachedResults[buildId];
    if (!resultData) return;

    let unit = unitDatabase.find(u => buildId.startsWith(u.id));
    if (!unit) return;

    // Use Context Builder to reconstruct environment
    const isAbility = buildId.includes('-ABILITY');
    const isVR = buildId.includes('-VR');
    const isCard = buildId.includes('-CARD');

    const { effectiveStats: effStats, context } = buildCalculationContext(unit, resultData.traitName, {
        isAbility,
        headPiece: resultData.headUsed || 'none',
        // Determine points based on prio
        dmgPoints: resultData.prio === 'spa' ? 0 : 99,
        spaPoints: resultData.prio === 'spa' ? 99 : 0
    });

    let ms = resultData.mainStats || { body: 'dmg', legs: 'dmg' };
    const setName = resultData.setName;
    const setEntry = SETS.find(s => s.name === setName) || SETS[2];

    const applySubLogic = (b, target, mainStat) => {
        let actual = target;
        let isFallback = false;
        
        if (actual === mainStat) {
            actual = (mainStat === 'range') ? 'dmg' : 'range';
            isFallback = true;
        }
        
        for (let k in PERFECT_SUBS) {
            if (k === mainStat) continue; 
            let mult = (k === actual) ? 6 : 1;
            b[k] = (b[k] || 0) + (PERFECT_SUBS[k] * mult);
        }
        
        return { stat: actual, fallback: isFallback };
    };

    let comparisonList = [];
    const candidates = ['spa', 'dmg', 'range', 'cm', 'cf', 'dot'];
    
    let baseDmg = 0, baseSpa = 0, baseCm = 0, baseCf = 0, baseRange = 0, baseDot = 0;
    const addMain = (type) => {
        if(type === 'dmg') baseDmg += 60;
        if(type === 'dot') baseDot += 75;
        if(type === 'cm') baseCm += 120;
        if(type === 'spa') baseSpa += 22.5;
        if(type === 'cf') baseCf += 37.5;
        if(type === 'range') baseRange += 30;
    }
    addMain(ms.body);
    addMain(ms.legs);

    let baselineBuild = {
        set: setEntry.id,
        dmg: baseDmg, spa: baseSpa, cm: baseCm, cf: baseCf, range: baseRange, dot: baseDot
    };
    
    const LV1_MULT = 0.5;

    const addLv1Stat = (statKey, pieceName, mainStatConflict) => {
        if(statKey === mainStatConflict) return;
        if (statKey === 'dot' && !statConfig.applyRelicDot) return;
        if ((statKey === 'cm' || statKey === 'cf') && !statConfig.applyRelicCrit) return;

        baselineBuild[statKey] = (baselineBuild[statKey] || 0) + (PERFECT_SUBS[statKey] * LV1_MULT);
    };

    candidates.forEach(cand => {
        if (context.headPiece !== 'none') addLv1Stat(cand, 'Head', null);
        addLv1Stat(cand, 'Body', ms.body);
        addLv1Stat(cand, 'Legs', ms.legs);
    });

    let baselineRes = calculateDPS(effStats, baselineBuild, context);
    let baselineScore = baselineRes.total;
    if (unit.id === 'law') baselineScore = baselineRes.range;
    
    comparisonList.push({ 
        type: 'baseline', 
        val: baselineScore, 
        conflicts: 0,
        desc: "Simulates random Level 1 stats on all pieces (Un-rerolled)"
    });

    candidates.forEach(cand => {
        if (cand === 'dot' && !statConfig.applyRelicDot) return;
        if ((cand === 'cm' || cand === 'cf') && !statConfig.applyRelicCrit) return;

        let testBuild = {
            set: setEntry.id,
            dmg: baseDmg, spa: baseSpa, cm: baseCm, cf: baseCf, range: baseRange, dot: baseDot
        };

        let conflictCount = 0;
        let piecesDesc = [];

        if (context.headPiece !== 'none') {
            const hRes = applySubLogic(testBuild, cand, null); 
            piecesDesc.push(`Head: ${SUB_NAMES[hRes.stat]}`);
        }

        const bRes = applySubLogic(testBuild, cand, ms.body);
        if(bRes.fallback) conflictCount++;
        piecesDesc.push(`Body: ${SUB_NAMES[bRes.stat]}${bRes.fallback ? ' (Fallback)' : ''}`);

        const lRes = applySubLogic(testBuild, cand, ms.legs);
        if(lRes.fallback) conflictCount++;
        piecesDesc.push(`Legs: ${SUB_NAMES[lRes.stat]}${lRes.fallback ? ' (Fallback)' : ''}`);

        let res = calculateDPS(effStats, testBuild, context);
        let score = res.total;
        if (unit.id === 'law') score = res.range;
        
        comparisonList.push({ 
            type: cand, 
            val: score, 
            conflicts: conflictCount,
            desc: piecesDesc.join(' | ')
        });
    });

    comparisonList.sort((a, b) => b.val - a.val);
    const maxVal = comparisonList[0].val;

    let html = '';
    const getLabel = (k) => SUB_NAMES[k] || k.toUpperCase();
    
    const pieceCount = context.headPiece === 'none' ? 2 : 3;
    const subHeaderText = `Comparing <b>${pieceCount} Perfect Pieces</b>`;

    comparisonList.forEach((item, index) => {
        const percent = (item.val / maxVal) * 100;
        const diff = index === 0 ? 'BEST' : '-' + (100 - percent).toFixed(1) + '%';
        const isBest = index === 0;
        const isBaseline = item.type === 'baseline';
        
        let colorClass = isBest ? 'best' : '';
        let barClass = isBaseline ? 'sub-prio-bar-bg' : '';

        let labelText = getLabel(item.type);
        if (isBaseline) labelText = "Lv.1 Subs";

        const fmtVal = unit.id === 'law' ? item.val.toFixed(1) : format(item.val);
        const label = unit.id === 'law' ? 'Range' : 'DPS';
        
        let warningIcon = '';
        if (item.conflicts > 0) warningIcon = ` <span class="text-gold">⚠️</span>`;

        html += `
        <div class="prio-row" title="${item.desc}">
            <div class="prio-label ${isBaseline ? 'text-dim' : ''}">${labelText}${warningIcon}</div>
            <div class="prio-bar-container">
                <div class="prio-bar ${colorClass} ${barClass}" style="--bar-width:${percent}%"></div>
                <div class="prio-diff">${isBaseline ? 'FLOOR' : diff}</div>
                <div class="prio-val">${fmtVal} <span class="text-xs-dim opacity-70">${label}</span></div>
            </div>
        </div>`;
    });

    html += `<div class="sub-prio-note">
        Hover over bars to see specific piece stats.<br>
        ⚠️ = Fallback used (Main Stat cannot match Sub Stat).
    </div>`;

    // USE THE UNIVERSAL MODAL
    showUniversalModal({
        title: 'SUB-STAT PRIORITY',
        content: `
            <div class="sub-prio-header">${subHeaderText}</div>
            <div class="sub-prio-content">${html}</div>
        `,
        size: 'modal-sm'
    });
}