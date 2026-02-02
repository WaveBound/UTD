// ============================================================================
// STATE.JS - Global Application State
// ============================================================================

// Data & Cache
let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(['phantom_captain', 'megumin', 'super_roku']); 
let cachedResults = {}; 
let unitBuildsCache = {}; 

// Mode & Configuration
let currentGuideMode = 'current';
let inventoryMode = false; // Toggle state for Inventory calculation

const kiritoState = {
    realm: true,
    card: false
};

const bambiettaState = {
    element: "Dark"
};

// Caches for performance optimization
// Temporary UI State
// Requirement 3: Replaced tempGuideUnit string with Set for multi-selection
let guideUnitSelection = new Set(['all']); // Persistent selection for Guide view
let tempGuideUnitSet = new Set(['all']);   // Temporary selection inside Config Modal
let tempGuideTrait = 'auto';

let currentCalcUnitId = null;

// Async Rendering State
let renderQueueIndex = 0;
let renderQueueId = null;

// Inventory
let relicInventory = [];