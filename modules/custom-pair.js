// ============================================================================
// CUSTOM-PAIR.JS - Custom Trait Pair Modal Logic
// ============================================================================

let cpUnit = 'all';
let cpT1 = 'ruler';
let cpT2 = 'none';

// Open custom pair modal
function openCustomPairModal() {
    cpUnit = 'all'; 
    cpT1 = 'ruler'; 
    cpT2 = 'none';
    renderCustomPairUI();
    toggleModal('customPairModal', true);
}

const closeCustomPairModal = () => { toggleModal('customPairModal', false); };

const selectCpUnit = (id) => { 
    cpUnit = id; 
    renderCustomPairUI(); 
};

const selectCpT1 = (id) => { 
    cpT1 = id; 
    renderCustomPairUI(); 
};

const selectCpT2 = (id) => { 
    cpT2 = id; 
    renderCustomPairUI(); 
};

// Render custom pair configuration UI
function renderCustomPairUI() {
    const unitGrid = document.getElementById('cpUnitGrid');
    const t1List = document.getElementById('cpTrait1List');
    const t2List = document.getElementById('cpTrait2List');
    
    let unitsHtml = `<div class="config-item ${cpUnit === 'all' ? 'selected' : ''}" onclick="selectCpUnit('all')"><div style="width:50px; height:50px; border-radius:50%; border:2px solid #555; background:#000; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff;">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => { 
        unitsHtml += `<div class="config-item ${cpUnit === u.id ? 'selected' : ''}" onclick="selectCpUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`; 
    });
    unitGrid.innerHTML = unitsHtml;

    const standardTraits = traitsList.filter(t => t.id !== 'none');
    let t1Html = '';
    standardTraits.forEach(t => { 
        t1Html += `<div class="config-chip ${cpT1 === t.id ? 'selected' : ''}" onclick="selectCpT1('${t.id}')">${t.name}</div>`; 
    });
    t1List.innerHTML = t1Html;

    let t2Html = `<div class="config-chip ${cpT2 === 'none' ? 'selected' : ''}" onclick="selectCpT2('none')">None</div>`;
    standardTraits.forEach(t => { 
        t2Html += `<div class="config-chip ${cpT2 === t.id ? 'selected' : ''}" onclick="selectCpT2('${t.id}')">${t.name}</div>`; 
    });
    t2List.innerHTML = t2Html;

    const uName = cpUnit === 'all' ? 'All Units' : unitDatabase.find(u => u.id === cpUnit).name;
    const t1Name = traitsList.find(t => t.id === cpT1).name;
    const t2Name = (cpT2 === 'none') ? '(None)' : traitsList.find(t => t.id === cpT2).name;
    document.getElementById('cpPreviewText').innerHTML = `${uName} <span style="color:#666">+</span> <span style="color:var(--accent-start)">${t1Name}</span> <span style="color:#666">+</span> <span style="color:var(--accent-end)">${t2Name}</span>`;
}

// Confirm and add custom pair
function confirmAddCustomPair() {
    const t1 = traitsList.find(t => t.id === cpT1);
    const t2 = traitsList.find(t => t.id === cpT2); 

    if (t1 && t2) {
        const combo = combineTraits(t1, t2);
        if (cpUnit === 'all') {
            const allTraits = [...traitsList, ...customTraits];
            const alreadyExists = allTraits.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') { 
                customTraits.push(combo); 
                alert(`Added global custom trait: ${combo.name}`); 
            } else {
                alert("Trait combination already exists!");
            }
        } else {
            if (!unitSpecificTraits[cpUnit]) unitSpecificTraits[cpUnit] = [];
            const unitList = unitSpecificTraits[cpUnit];
            const alreadyExists = unitList.some(t => t.name === combo.name);
            if (!alreadyExists && combo.id !== 'none') { 
                unitList.push(combo); 
                alert(`Added custom trait to unit.`); 
            } else {
                alert("Trait combination already exists for this unit!");
            }
        }
        resetAndRender();
        if(document.getElementById('guidesPage').classList.contains('active')) renderGuides();
        closeCustomPairModal();
    }
}
