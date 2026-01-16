// ============================================================================
// STATE.JS - Global Application State
// ============================================================================

// Data & Cache
let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(['phantom_captain', 'megumin']); 
let cachedResults = {}; 
let unitBuildsCache = {}; 

// Mode & Configuration
let currentGuideMode = 'current';
let inventoryMode = false; // NEW: Toggle state for Inventory calculation

const kiritoState = {
    realm: true,
    card: false
};

const bambiettaState = {
    element: "Dark"
};

// Caches for performance optimization
// Temporary UI State
let tempGuideUnit = 'all';
let tempGuideTrait = 'auto';
let currentCalcUnitId = null;

// Async Rendering State
let renderQueueIndex = 0;
let renderQueueId = null;

// Inventory
let relicInventory = [];