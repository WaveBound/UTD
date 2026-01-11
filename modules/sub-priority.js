function viewSubPriority(buildId) {
    const resultData = cachedResults[buildId];
    if (!resultData) { 
        console.error("Build data not found"); 
        return; 
    }

    const unit = unitDatabase.find(u => u.id === resultData.baseStats.id);
    const trait = resultData.traitObj;
    
    // Helper: Apply Perfect Sub Stats Logic
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
    
    const context = {
        dmgPoints: resultData.dmgPoints,
        spaPoints: resultData.spaPoints,
        wave: 25,
        isBoss: false,
        traitObj: trait,
        placement: resultData.placement,
        isSSS: resultData.isSSS,
        headPiece: resultData.headBuffs ? resultData.headBuffs.type : 'none',
        isVirtualRealm: resultData.baseStats.id === 'kirito' && kiritoState.realm
    };

    const unitCache = unitBuildsCache[unit.id] || [];
    const specificBuildEntry = unitCache.find(x => x.id === buildId);
    
    if(!specificBuildEntry) { 
        console.error("Could not find build config in cache"); 
        return; 
    }

    const ms = specificBuildEntry.mainStats;
    const setName = specificBuildEntry.setName;
    const setEntry = SETS.find(s => s.name === setName) || SETS[2];
    
    // Calculate Base Main Stats
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

    let effStats = { ...unit.stats };
    effStats.id = unit.id;
    if (activeAbilityIds.has(unit.id) && unit.ability) Object.assign(effStats, unit.ability);
    if (unit.tags) effStats.tags = unit.tags;
    if (unit.id === 'kirito' && kiritoState.realm && kiritoState.card) { 
        effStats.dot = 200; 
        effStats.dotDuration = 4; 
        effStats.dotStacks = 1; 
    }

    // Calculate baseline (mixed level 1 subs)
    let baselineBuild = {
        set: setEntry.id,
        dmg: baseDmg, spa: baseSpa, cm: baseCm, cf: baseCf, range: baseRange, dot: baseDot
    };
    
    const LV1_MULT = 0.5;
    const lv1Desc = [];

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

    // Calculate candidates
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

    // Render
    let html = '';
    const getLabel = (k) => SUB_NAMES[k] || k.toUpperCase();
    
    const pieceCount = context.headPiece === 'none' ? 2 : 3;
    const subHeaderText = `Comparing <b>${pieceCount} Perfect Pieces</b> (Full Build Simulation)`;
    const descEl = document.querySelector('#subPriorityModal .modal-content > div:nth-child(2)');
    if(descEl) descEl.innerHTML = subHeaderText;

    comparisonList.forEach((item, index) => {
        const percent = (item.val / maxVal) * 100;
        const diff = index === 0 ? 'BEST' : '-' + (100 - percent).toFixed(1) + '%';
        const isBest = index === 0;
        const isBaseline = item.type === 'baseline';
        
        let colorClass = isBest ? 'best' : '';
        let barStyle = '';
        let labelText = getLabel(item.type);
        
        if (isBaseline) {
            labelText = "Lv.1 Subs (Mixed)";
            barStyle = 'background: #444; opacity: 1;'; 
        }

        const fmtVal = unit.id === 'law' ? item.val.toFixed(1) : format(item.val);
        const label = unit.id === 'law' ? 'Range' : 'DPS';
        
        let warningIcon = '';
        if (item.conflicts > 0) warningIcon = ` <span style="color:#ffcc00;">⚠️</span>`;

        html += `
        <div class="prio-row" title="${item.desc}">
            <div class="prio-label" style="${isBaseline ? 'color:#999;' : ''}">${labelText}${warningIcon}</div>
            <div class="prio-bar-container">
                <div class="prio-bar ${colorClass}" style="width:${percent}%; ${barStyle}"></div>
                <div class="prio-diff">${isBaseline ? 'FLOOR' : diff}</div>
                <div class="prio-val">${fmtVal} <span style="font-size:0.6rem; opacity:0.7;">${label}</span></div>
            </div>
        </div>`;
    });

    html += `<div style="margin-top:15px; font-size:0.7rem; color:#666; text-align:center;">
        Hover over bars to see specific piece stats.<br>
        ⚠️ = Fallback used (Main Stat cannot match Sub Stat).
    </div>`;

    document.getElementById('subPriorityContent').innerHTML = html;
    toggleModal('subPriorityModal', true);
}

const closeSubPriority = () => {
    toggleModal('subPriorityModal', false);
};