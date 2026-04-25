import os
import subprocess
import sys
import json
import itertools
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

# Force terminal to accept UTF-8 so emojis don't crash Windows console
if sys.stdout.encoding.lower() != 'utf-8':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

REQUIRED_FILES = [
    "modules/state.js",
    "data.js",
    "modules/constants.js",
    "modules/utils.js",
    "math.js",
    "modules/calculations.js"
]

GENERATOR_SCRIPT = """
const fs = require('fs');
const os = require('os');
const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

let buffConfig = {};
let outPath = 'static-database.js';

if (isMainThread) {
    buffConfig = JSON.parse(process.argv[2]);
    outPath = process.argv[3];
} else {
    buffConfig = workerData.buffConfig;
}

// --- 1. NODE.JS POLYFILLS & MOCKS ---
global.window = global;

// Map Python configs to Window States
window.mikuBuffActive = buffConfig.miku === '1';
window.enlightenedGodBuffActive = buffConfig.enlightened === '1';
window.bijuuLinkActive = buffConfig.bijuu === '1';
window.ancientMageSupportActive = buffConfig.amage === '1';
window.kingSailorMarkActive = buffConfig.ksailor === '1';
window.kingSailorBuffActive = buffConfig.ksailor === '1';
window.mageHillBuffActive = buffConfig.mage === 'hill';
window.mageGroundBuffActive = buffConfig.mage === 'ground';

global.btoa = function(str) {
    return Buffer.from(str, 'binary').toString('base64');
};

// OPTIMIZED: Only calculate Max Potential (Head + Subs)
const CONFIGS = [
    { head: true,  subs: true }
];

if (isMainThread) {
    // ==========================================
    // MAIN THREAD: Orchestration & Compression
    // ==========================================
    const tasks = [];
    unitDatabase.forEach(u => {
        tasks.push({ u, isCard: false });
        if(u.id === 'kirito') tasks.push({ u, isCard: true });
    });

    const numCores = os.cpus().length;
    const chunks = Array.from({ length: numCores }, () => []);
    tasks.forEach((task, i) => chunks[i % numCores].push(task));

    let activeWorkers = 0;
    const mergedRawDb = {};

    chunks.forEach((chunk, i) => {
        if (chunk.length === 0) return;
        activeWorkers++;
        
        const worker = new Worker(__filename, { workerData: { chunk, workerId: i + 1, buffConfig } });
        
        worker.on('message', (msg) => {
            if (msg.type === 'done') {
                Object.assign(mergedRawDb, msg.data);
            }
        });

        worker.on('error', err => console.error(`Worker ${i+1} Error:`, err));
        worker.on('exit', () => {
            activeWorkers--;
            if (activeWorkers === 0) finalizeDatabase(mergedRawDb);
        });
    });

    function finalizeDatabase(rawDb) {
        const MAP_PRIO = { 'dmg': 0, 'spa': 1, 'range': 2, 'raw_dmg': 3 };
        const MAP_BODY = { 'dmg': 0, 'dot': 1, 'cm': 2 };
        const MAP_LEGS = { 'dmg': 0, 'spa': 1, 'cf': 2, 'range': 3 };
        const MAP_HEAD = { 'none': 0, 'sun_god': 1, 'ninja': 2, 'reaper_necklace': 3, 'shadow_reaper_necklace': 4, 'junior': 5, 'biju_head': 6, 'rebellious_head': 7, 'reanimated_head': 8, 'mage_head': 9 };

        const stringPool = new Map();
        const stringArr = [""]; 
        const subPool = new Map();
        const subArr = [null]; 

        const encodeStr = (val) => {
            if (!val) return 0;
            const s = String(val);
            if (!stringPool.has(s)) { stringPool.set(s, stringArr.length); stringArr.push(s); }
            return stringPool.get(s);
        };

        const encodeSubs = (s) => {
            if (!s) return 0;
            const transform = (list) => (list||[]).map(i => [encodeStr(i.type), i.val]);
            const compact = [transform(s.head), transform(s.body), transform(s.legs), s.selectedHead ? encodeStr(s.selectedHead) : 0];
            const sig = JSON.stringify(compact);
            if (!subPool.has(sig)) { subPool.set(sig, subArr.length); subArr.push(compact); }
            return subPool.get(sig);
        };

        const ROW_SIZE = 18;
        const rowsToBuffer = (rows) => {
            const buffer = new ArrayBuffer(rows.length * ROW_SIZE);
            const view = new DataView(buffer);
            rows.forEach((r, i) => {
                const offset = i * ROW_SIZE;
                const meta = (MAP_PRIO[r.prio] || 0) | ((MAP_BODY[r.mainStats.body] || 0) << 2) | ((MAP_LEGS[r.mainStats.legs] || 0) << 4) | ((MAP_HEAD[r.headUsed || 'none'] || 0) << 6) | ((r.isCustom ? 1 : 0) << 10);

                view.setUint8(offset, encodeStr(r.traitName));
                view.setUint8(offset + 1, encodeStr(r.setName));
                view.setFloat32(offset + 2, r.dps || 0, true); 
                view.setUint16(offset + 6, Math.round((r.spa || 1) * 1000), true);
                view.setUint16(offset + 8, Math.round((r.range || 0) * 10), true);
                view.setUint16(offset + 10, meta, true);
                view.setUint16(offset + 12, encodeSubs(r.subStats || {}), true);
                view.setFloat32(offset + 14, r.dmgVal || 0, true);
            });
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            return btoa(binary);
        };

        const FINAL_DB = {};
        for (const [key, data] of Object.entries(rawDb)) {
            FINAL_DB[key] = {
                fixed: data.fixed.map(configRows => rowsToBuffer(configRows)),
                bugged: data.bugged.map(configRows => rowsToBuffer(configRows))
            };
        }

        const payload = { s: stringArr, p: subArr, d: FINAL_DB };
        const payloadStr = JSON.stringify(payload);

        const fileContent = `(function() {
    const RAW = ${payloadStr};
    const S = RAW.s;
    const P = RAW.p;
    const D = RAW.d;

    const PRIO = ['dmg', 'spa', 'range', 'raw_dmg'];
    const BODY = ['dmg', 'dot', 'cm'];
    const LEGS = ['dmg', 'spa', 'cf', 'range'];
    const HEAD = ['none', 'sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace', 'junior', 'biju_head', 'rebellious_head', 'reanimated_head', 'mage_head'];
    const DESC_BODY = ['Dmg', 'DoT', 'Crit Dmg'];
    const DESC_LEGS = ['Dmg', 'Spa', 'Crit Rate', 'Range'];
    const ROW_SIZE = 18;

    const decode = (b64) => {
        const bin = atob(b64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        return new DataView(bytes.buffer);
    };

    window.STATIC_BUILD_DB = new Proxy({}, {
        get: function(target, prop) {
            if (target[prop]) return target[prop];
            if (D[prop]) {
                const rawData = D[prop];
                let unitId = prop.replace('_abil', '').replace('kirito_card', 'kirito');
                let suffix = prop.endsWith('_abil') ? "-ABILITY" : "-BASE";
                if (prop.startsWith('kirito')) { suffix += "-VR"; if (prop.includes('card')) suffix += "-CARD"; }
                const idContext = unitId + suffix;

                const unpackList = (b64List, modeCode) => {
                    const modeTag = (modeCode === 'b') ? "-b-" : "-f-";
                    return b64List.map((b64, cfgIdx) => {
                        const view = decode(b64);
                        const count = view.byteLength / ROW_SIZE;
                        const result = [];
                        const subsSuffix = "-SUBS"; // Hardcoded since we only export max potential now

                        for(let i=0; i<count; i++) {
                            const off = i * ROW_SIZE;
                            const meta = view.getUint16(off+10, true);
                            const bIdx = (meta >> 2) & 3;
                            const lIdx = (meta >> 4) & 3;
                            const headUsed = HEAD[(meta >> 6) & 15];
                            const sName = S[view.getUint8(off+1)];
                            const buildNameRaw = sName + " (" + DESC_BODY[bIdx] + "/" + DESC_LEGS[lIdx] + ")";
                            
                            let subs = undefined;
                            const subId = view.getUint16(off+12, true);
                            if(subId !== 0) {
                                const rS = P[subId]; 
                                const mapS = (list) => list.map(x => ({ type: S[x[0]], val: x[1] }));
                                subs = { head: mapS(rS[0]), body: mapS(rS[1]), legs: mapS(rS[2]), selectedHead: rS[3] ? S[rS[3]] : undefined };
                            }

                            result.push({
                                id: idContext + "-" + S[view.getUint8(off)].toLowerCase() + "-" + buildNameRaw.replace(/[^a-zA-Z0-9]/g, '') + "-" + PRIO[meta & 3] + subsSuffix + "-" + headUsed + modeTag, 
                                traitName: S[view.getUint8(off)], setName: sName, dps: view.getFloat32(off+2, true), dv: view.getFloat32(off+14, true), 
                                spa: view.getUint16(off+6, true) / 1000, range: view.getUint16(off+8, true) / 10, prio: PRIO[meta & 3],
                                mainStats: { body: BODY[bIdx], legs: LEGS[lIdx] }, headUsed: headUsed, isCustom: !!((meta >> 10) & 1), subStats: subs
                            });
                        }
                        return result;
                    });
                };
                target[prop] = { bugged: unpackList(rawData.bugged, "b"), fixed: unpackList(rawData.fixed, "f") };
                D[prop] = null;
                return target[prop];
            }
            return undefined;
        }
    });
})();`;

        fs.writeFileSync(outPath, fileContent);
    }

} else {
    // ==========================================
    // WORKER THREAD: High Speed Math Evaluation
    // ==========================================
    const { chunk } = workerData;
    
    statConfig.applyRelicDot = true; 
    statConfig.applyRelicCrit = true; 
    
    // TEMPLATE GENERATOR: Creates all physical combinations exactly once
    const PRECALC_TEMPLATES = {};
    
    function generateTemplates(includeSubs, allowedHeads, allowDot) {
        const templates = [];
        const cands = allowDot ? ['dmg', 'spa', 'cm', 'cf', 'dot', 'range'] : ['dmg', 'spa', 'cm', 'cf', 'range'];
        const baseBuilds = globalBuilds.filter(b => allowDot || b.dot === 0);

        let strategies = [];
        if (!includeSubs) {
            strategies.push({ p: null, s: null, ratio: { p: 0, s: 0 } });
        } else {
            cands.forEach(c => strategies.push({ p: c, s: c, ratio: { p: 6, s: 0 } }));
            const pairs = [['dmg', 'cf'], ['dmg', 'spa'], ['dmg', 'range'], ['dmg', 'cm'], ['cf', 'cm'], ['spa', 'range']];
            const ratios = [{ p: 4, s: 3 }, { p: 3, s: 4 }, { p: 5, s: 2 }, { p: 2, s: 5 }];
            pairs.forEach(pair => {
                const [c1, c2] = pair;
                if (cands.includes(c1) && cands.includes(c2)) ratios.forEach(r => strategies.push({ p: c1, s: c2, ratio: r }));
            });
        }

        baseBuilds.forEach(build => {
            allowedHeads.forEach(headType => {
                if(!allowDot && headType === 'ninja') return; 

                strategies.forEach(strat => {
                    let totalStats = { ...build };
                    let currentAssignments = {};
                    
                    const applyContextualStats = (b, pieceName, mainStat, pStat, sStat, ratio) => {
                        if (!pStat) return { pStat: null, pVal: 0, sStat: null, sVal: 0 };
                        let pWeight = ratio.p; let sWeight = ratio.s; 
                        
                        if (pStat === mainStat) { sWeight = Math.min(6, sWeight + pWeight); pWeight = 0; } 
                        else if (sStat === mainStat) { pWeight = Math.min(6, pWeight + sWeight); sWeight = 0; }
                        if (pStat === mainStat && sStat === mainStat) { pWeight = 0; sWeight = 0; }

                        let pVal = 0, sVal = 0;
                        if (pWeight > 0) { pVal = PERFECT_SUBS[pStat] * pWeight; b[pStat] = (b[pStat] || 0) + pVal; }
                        if (sWeight > 0) { sVal = PERFECT_SUBS[sStat] * sWeight; b[sStat] = (b[sStat] || 0) + sVal; }

                        cands.forEach(cand => {
                            if (cand === mainStat || (cand === pStat && pWeight > 0) || (cand === sStat && sWeight > 0)) return;
                            b[cand] = (b[cand] || 0) + PERFECT_SUBS[cand];
                        });
                        return { pStat, pVal, sStat, sVal };
                    };
                    
                    const formatAssignment = (res) => {
                        let arr = [];
                        if (res.pVal > 0) arr.push({ type: res.pStat, val: res.pVal });
                        if (res.sVal > 0) arr.push({ type: res.sStat, val: res.sVal });
                        return arr;
                    };

                    if (headType !== 'none') currentAssignments.head = formatAssignment(applyContextualStats(totalStats, 'head', null, strat.p, strat.s, strat.ratio));
                    currentAssignments.body = formatAssignment(applyContextualStats(totalStats, 'body', build.bodyType, strat.p, strat.s, strat.ratio));
                    currentAssignments.legs = formatAssignment(applyContextualStats(totalStats, 'legs', build.legType, strat.p, strat.s, strat.ratio));
                    currentAssignments.selectedHead = headType;

                    templates.push({ stats: totalStats, meta: { buildName: build.name, bodyType: build.bodyType, legType: build.legType, headUsed: headType, assignments: currentAssignments } });
                });
            });
        });
        return templates;
    }

    // THE HIGH-SPEED RUNNER: Maps templates through calculateDPS instantly
    function fastCalculateUnitBuilds(unit, cfg, traitsForCalc, isAbility) {
        const { effectiveStats, isKiritoVR, suffix } = buildCalculationContext(unit, 'ruler', { isAbility });
        const hasNativeDoT = (effectiveStats.dot > 0) || (effectiveStats.burnMultiplier > 0) || isKiritoVR;

        const allowedHeads = cfg.head ? ['sun_god', 'ninja', 'reaper_necklace', 'shadow_reaper_necklace', 'junior', 'biju_head', 'rebellious_head', 'reanimated_head', 'mage_head'] : ['none'];
        let unitResults = [];

        traitsForCalc.forEach(trait => {
            if (trait.id === 'none') return;
            const { effectiveStats, context } = buildCalculationContext(unit, trait, { isAbility, mode: 'fixed' });
            const traitAddsDot = trait.dotBuff > 0 || trait.hasRadiation || trait.allowDotStack;
            const isDotPossible = hasNativeDoT || traitAddsDot;
            
            const templatesKey = `${cfg.subs}-${isDotPossible}-${cfg.head}`;
            let templates = PRECALC_TEMPLATES[templatesKey];
            if(!templates) {
                templates = generateTemplates(cfg.subs, allowedHeads, isDotPossible);
                PRECALC_TEMPLATES[templatesKey] = templates;
            }

            const maxPts = (unit.id === 'king_sailor') ? 129 : 99;
            const pointConfigs = [
                { prio: 'dmg', d: maxPts, s: 0, r: 0, opt: 'dps' },
                { prio: 'spa', d: 0, s: maxPts, r: 0, opt: 'dps' },
                { prio: 'range', d: 0, s: 0, r: 99, opt: 'range' },
                { prio: 'raw_dmg', d: maxPts, s: 0, r: 0, opt: 'raw_dmg' }
            ];

            pointConfigs.forEach(pc => {
                context.dmgPoints = pc.d; context.spaPoints = pc.s; context.rangePoints = pc.r;
                effectiveStats.context = context;
                
                const bestByBase = new Map(); 
                
                for(let i=0; i<templates.length; i++) {
                    const t = templates[i];
                    context.headPiece = t.meta.headUsed;
                    
                    const res = calculateDPS(effectiveStats, t.stats, context);
                    if(isNaN(res.total)) continue;
                    
                    const key = t.meta.buildName + "_" + t.meta.headUsed;
                    
                    let currentBest = bestByBase.get(key);
                    
                    let isBetter = false;
                    if (!currentBest) isBetter = true;
                    else if (pc.opt === 'range') isBetter = (res.range > currentBest.res.range) || (res.range === currentBest.res.range && res.total > currentBest.res.total);
                    else if (pc.opt === 'raw_dmg') isBetter = (res.dmgVal > currentBest.res.dmgVal) || (res.dmgVal === currentBest.res.dmgVal && res.total > currentBest.res.total);
                    else isBetter = (res.total > currentBest.res.total);
                    
                    if (isBetter) bestByBase.set(key, { res, meta: t.meta });
                }

                bestByBase.forEach((best, MapKey) => {
                    unitResults.push({
                        setName: best.meta.buildName.split('(')[0].trim(),
                        buildName: best.meta.buildName, 
                        traitName: trait.name, 
                        dps: best.res.total, 
                        dmgVal: best.res.dmgVal,
                        spa: best.res.spa, 
                        range: best.res.range, 
                        prio: pc.prio, 
                        mainStats: { body: best.meta.bodyType, legs: best.meta.legType },
                        subStats: best.meta.assignments, 
                        headUsed: best.meta.headUsed, 
                        isCustom: trait.isCustom
                    });
                });
            });
        });
        
        return unitResults;
    }

    const workerDb = {};

    chunk.forEach((task) => {
        const { u, isCard } = task;
        let baseKey = u.id;
        if(u.id === 'kirito' && isCard) baseKey = 'kirito_card';
        
        const types = u.ability ? ['base', 'abil'] : ['base'];
        const isSjw = u.id === 'sjw';
        const isLaw = u.id === 'law';
        
        const sortFn = isLaw 
            ? (a, b) => (b.range || 0) - (a.range || 0)
            : (a, b) => {
                let wa = 1.0, wb = 1.0;
                if (isSjw) {
                    if (a.mainStats.body === 'dmg' && a.mainStats.legs === 'dmg') wa = 1.3;
                    if (b.mainStats.body === 'dmg' && b.mainStats.legs === 'dmg') wb = 1.3;
                }
                return (b.dps * wb) - (a.dps * wa);
            };

        types.forEach(type => {
            const finalKey = (type === 'abil') ? `${baseKey}_abil` : baseKey;
            workerDb[finalKey] = { fixed: [], bugged: [] }; 

            if (u.id === 'bambietta') bambiettaState.element = "Dark"; 
            if (u.id === 'robot1718') robot1718State.mode = "Robot 17";
            if (u.id === 'kirito') { kiritoState.realm = true; kiritoState.card = isCard; }

            const traitsForCalc = [...traitsList, ...(unitSpecificTraits[u.id] || [])];
            const isAbility = (type === 'abil');

            CONFIGS.forEach(cfg => {
                const results = fastCalculateUnitBuilds(u, cfg, traitsForCalc, isAbility);

                const traitGroups = {};
                for (const res of results) {
                    if (!traitGroups[res.traitName]) traitGroups[res.traitName] = [];
                    traitGroups[res.traitName].push(res);
                }

                const guaranteedBuilds = [];
                const remainingPool = [];
                
                for (const trait in traitGroups) {
                    const list = traitGroups[trait];
                    list.sort(sortFn);
                    guaranteedBuilds.push(...list.slice(0, 8)); 
                    remainingPool.push(...list.slice(8, 100)); 
                }

                remainingPool.sort(sortFn);
                
                let finalBuilds = [...guaranteedBuilds, ...remainingPool];
                finalBuilds.sort(sortFn);
                finalBuilds = finalBuilds.slice(0, 300);

                workerDb[finalKey].fixed.push(finalBuilds);
                workerDb[finalKey].bugged.push(finalBuilds); 
            });
        });
    });

    parentPort.postMessage({ type: 'done', data: workerDb });
}
"""

def get_db_name(combo):
    parts = []
    if combo[0] == '1': parts.append('miku')
    if combo[1] == '1': parts.append('enlightened')
    if combo[2] == '1': parts.append('bijuu')
    if combo[3] == '1': parts.append('amage')
    if combo[4] == '1': parts.append('ksailor')
    if combo[5] == 'hill': parts.append('magehill')
    elif combo[5] == 'ground': parts.append('mageground')

    if not parts:
        return "db_base.js"
    return "db_" + "_".join(parts) + ".js"


def run_combo(args):
    """Run a single buff combination as a subprocess. Safe to call in parallel."""
    i, combo, total_runs, temp_runner = args
    buff_config = {
        'miku': combo[0],
        'enlightened': combo[1],
        'bijuu': combo[2],
        'amage': combo[3],
        'ksailor': combo[4],
        'mage': combo[5]
    }
    out_name = get_db_name(combo)
    out_path = os.path.join("databases", out_name)
    start_t = time.time()

    process = subprocess.run(
        ["node", temp_runner, json.dumps(buff_config), out_path],
        capture_output=True, text=True, encoding="utf-8"
    )

    elapsed = time.time() - start_t
    if process.returncode != 0:
        return (False, out_name, elapsed, process.stdout, process.stderr)
    return (True, out_name, elapsed, None, None)


def main():
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("❌ Error: Node.js is required to run this script. Please install Node.js (https://nodejs.org/).")
        sys.exit(1)

    combined_js = ""
    print("📥 Reading JavaScript dependencies...")
    for filename in REQUIRED_FILES:
        file_path = filename
        if not os.path.exists(file_path):
            file_path = os.path.basename(filename)
            if not os.path.exists(file_path):
                print(f"❌ Error: Cannot find required file '{filename}' or '{file_path}'.")
                sys.exit(1)
        with open(file_path, "r", encoding="utf-8") as f:
            combined_js += f.read() + "\n"

    combined_js += GENERATOR_SCRIPT
    temp_runner = "db_runner.js"
    with open(temp_runner, "w", encoding="utf-8") as f:
        f.write(combined_js)

    # Calculate combinations:
    # miku (2), enlightened (2), bijuu (2), amage (2), ksailor (2), mage exclusive (3: none, hill, ground)
    # Total = 2 * 2 * 2 * 2 * 2 * 3 = 96 permutations
    combinations = list(itertools.product(
        ['0', '1'], # Miku
        ['0', '1'], # Enlightened
        ['0', '1'], # Bijuu
        ['0', '1'], # Ancient Mage
        ['0', '1'], # King Sailor
        ['none', 'hill', 'ground'] # Prodigy Mage (mutually exclusive)
    ))

    total_runs = len(combinations)

    # How many Node.js processes to run at once.
    # Each Node process already uses all CPU cores via worker_threads internally,
    # so keep this modest. Tune it up or down based on your machine:
    #   - 2-4  on laptops / low core count machines
    #   - 4-8  on desktops / servers with many cores
    MAX_PARALLEL = 4

    print(f"\n🚀 Initiating build for {total_runs} combinations ({MAX_PARALLEL} parallel)...")
    os.makedirs("databases", exist_ok=True)

    overall_start = time.time()
    args_list = [(i, combo, total_runs, temp_runner) for i, combo in enumerate(combinations)]

    try:
        with ProcessPoolExecutor(max_workers=MAX_PARALLEL) as executor:
            futures = {executor.submit(run_combo, args): args for args in args_list}
            completed = 0
            for future in as_completed(futures):
                success, out_name, elapsed, stdout, stderr = future.result()
                completed += 1
                if not success:
                    print(f"\n❌ Execution failed on {out_name}.")
                    print(stdout)
                    print(stderr)
                    sys.exit(1)
                print(f"[{completed}/{total_runs}] {out_name} done! ({elapsed:.1f}s)")
    finally:
        if os.path.exists(temp_runner):
            os.remove(temp_runner)

    print(f"\n🎉 Successfully generated all {total_runs} databases in {time.time() - overall_start:.2f}s!")

if __name__ == "__main__":
    main()