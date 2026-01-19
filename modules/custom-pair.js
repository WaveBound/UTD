// --- START OF FILE custom-pair.js ---

let cpUnit = 'all';
let cpT1 = 'ruler';
let cpT2 = 'none';

function openCustomPairModal() {
    cpUnit = 'all'; 
    cpT1 = 'ruler'; 
    cpT2 = 'none';
    renderCustomPairUI();
    toggleModal('customPairModal', true);
}

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

function renderCustomPairUI() {
    const unitGrid = document.getElementById('cpUnitGrid');
    const t1List = document.getElementById('cpTrait1List');
    const t2List = document.getElementById('cpTrait2List');
    
    // Units Grid
    let unitsHtml = `<div class="config-item ${cpUnit === 'all' ? 'selected' : ''}" onclick="selectCpUnit('all')"><div class="cp-avatar-placeholder">ALL</div><span>All Units</span></div>`;
    unitDatabase.forEach(u => { 
        unitsHtml += `<div class="config-item ${cpUnit === u.id ? 'selected' : ''}" onclick="selectCpUnit('${u.id}')">${getUnitImgHtml(u, '', 'small')}<span>${u.name}</span></div>`; 
    });
    unitGrid.innerHTML = unitsHtml;

    // Trait 1 List
    const standardTraits = traitsList.filter(t => t.id !== 'none');
    let t1Html = '';
    standardTraits.forEach(t => { 
        t1Html += `<div class="config-chip ${cpT1 === t.id ? 'selected' : ''}" onclick="selectCpT1('${t.id}')">${t.name}</div>`; 
    });
    t1List.innerHTML = t1Html;

    // Trait 2 List
    let t2Html = `<div class="config-chip ${cpT2 === 'none' ? 'selected' : ''}" onclick="selectCpT2('none')">None</div>`;
    standardTraits.forEach(t => { 
        t2Html += `<div class="config-chip ${cpT2 === t.id ? 'selected' : ''}" onclick="selectCpT2('${t.id}')">${t.name}</div>`; 
    });
    t2List.innerHTML = t2Html;

    // Preview Text
    const uName = cpUnit === 'all' ? 'All Units' : unitDatabase.find(u => u.id === cpUnit).name;
    const t1Name = traitsList.find(t => t.id === cpT1).name;
    const t2Name = (cpT2 === 'none') ? '(None)' : traitsList.find(t => t.id === cpT2).name;
    
    // UPDATED: Used CSS classes text-dim, text-accent-start, text-accent-end
    document.getElementById('cpPreviewText').innerHTML = `${uName} <span class="text-dim">+</span> <span class="text-accent-start">${t1Name}</span> <span class="text-dim">+</span> <span class="text-accent-end">${t2Name}</span>`;
}

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
        closeModal('customPairModal');
    }
}