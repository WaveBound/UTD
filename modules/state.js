// ============================================================================
// STATE.JS - Global Application State
// ============================================================================

// Data & Cache
let customTraits = [];
let unitSpecificTraits = {}; 
let selectedUnitIds = new Set();
let activeAbilityIds = new Set(['phantom_captain', 'megumin']); // UPDATED: Phantom Captain starts active
let cachedResults = {}; 
let unitBuildsCache = {}; 

// Mode & Configuration
let currentGuideMode = 'current';
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