// ============================================================================
// INIT.JS - Application Initialization
// ============================================================================

window.onload = () => { 
    // 1. SYNC CSS CLASSES IMMEDIATELY
    // Check state of checkboxes and apply classes to body before rendering
    const globalHead = document.getElementById('globalHeadPiece');
    const globalSubs = document.getElementById('globalSubStats');
    const globalHypo = document.getElementById('globalHypothetical');

    if(globalHead && globalHead.checked) document.body.classList.add('show-head');
    if(globalSubs && globalSubs.checked) document.body.classList.add('show-subs');
    if(globalHypo && globalHypo.checked) document.body.classList.add('show-fixed-relics');

    // 2. Setup Guide Dropdowns
    if(typeof populateGuideDropdowns === 'function') {
        populateGuideDropdowns(); 
    }

    // Inject Miku Buff Button
    injectMikuButton();
    
    // Inject Tier List Button
    injectTierListButton();

    setGuideMode('current'); 

    // 3. Render Content
    if(typeof renderCredits === 'function') {
        renderCredits();
    }
    
    // 4. Initialize Database
    renderDatabase(); 
    
    // 5. Initialize Inventory
    if (typeof initInventory === 'function') {
        initInventory();
    }

    // Update Guide Toolbar Labels to match Unit Database
    // Runs immediately to catch elements if they exist
    const updateGuideLabel = (id, text) => {
        const input = document.getElementById(id);
        if (input && input.parentElement) {
            // Try finding a span first
            const span = input.parentElement.querySelector('span');
            if (span) span.textContent = text;
            // Fallback: If text is a direct child node
            else input.parentElement.childNodes.forEach(n => { if(n.nodeType===3 && n.textContent.trim()) n.textContent = " " + text; });
        }
    };
    updateGuideLabel('guideHeadPiece', '+ Head Relic');
    updateGuideLabel('guideSubStats', '+ Sub Stats');
};

function injectMikuButton() {
    // Inject styles for Miku button hover
    if (!document.getElementById('miku-btn-style')) {
        const style = document.createElement('style');
        style.id = 'miku-btn-style';
        style.innerHTML = `
            .miku-btn-label:hover span {
                color: #fff;
                text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    }

    const createBtn = (id) => {
        const label = document.createElement('label');
        label.className = 'nav-toggle-label miku-btn-label';
        label.setAttribute('for', id);
        label.title = "Apply Miku's +100% Damage Buff";
        
        // Removed mini-switch, using simple checkbox layout
        label.innerHTML = `<div class="toggle-wrapper" style="gap: 6px;"><input type="checkbox" id="${id}" style="cursor: pointer;"><div class="mini-switch"></div><span>Miku Buff</span></div>`;
        const input = label.querySelector('input');
        input.addEventListener('change', function() { if(typeof window.toggleMikuBuff === 'function') window.toggleMikuBuff(this); });
        
        return label;
    };

    const insertNextTo = (containerId, targetId, btn) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const target = document.getElementById(targetId);
        if (target) {
            const label = target.closest('label') || target.parentElement;
            if (label && container.contains(label)) {
                label.insertAdjacentElement('afterend', btn);
                return;
            }
        }
        container.appendChild(btn);
    };

    insertNextTo('dbInjector', 'globalHypothetical', createBtn('globalMikuBuff'));
    insertNextTo('guidesToolbar', 'guideHypoToggle', createBtn('guideMikuBuff'));
}

function injectTierListButton() {
    const dbToolbar = document.getElementById('dbInjector');
    if (dbToolbar && !document.getElementById('btnTraitTierList')) {
        const btn = document.createElement('button');
        btn.id = 'btnTraitTierList';
        btn.className = 'nav-btn';
        btn.style.cssText = 'border: 1px solid var(--accent-start); color: var(--accent-start); margin-left: 10px;';
        btn.innerHTML = 'Trait Tier List';
        btn.onclick = () => window.openTraitTierList && window.openTraitTierList();
        dbToolbar.appendChild(btn);
    }
}