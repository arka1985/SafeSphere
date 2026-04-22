let currentUnit = 'C';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initParticles();
    initUnitToggle();
});

function initUnitToggle() {
    const toggleBtns = document.querySelectorAll('.unit-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentUnit = btn.getAttribute('data-unit');
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateUnitUI();
        });
    });
}

function updateUnitUI() {
    const unitLabels = document.querySelectorAll('.temp-unit');
    unitLabels.forEach(label => {
        label.innerText = `°${currentUnit}`;
    });
    // Optional: Clear results or trigger re-calculations if needed.
    // For simplicity, we'll let the user re-click calculate.
}

function convertToC(val) {
    return currentUnit === 'F' ? (val - 32) * 5/9 : val;
}

function convertFromC(val) {
    return currentUnit === 'F' ? (val * 9/5) + 32 : val;
}

// Tab Switching
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabSections.forEach(s => s.style.display = 'none');
            
            btn.classList.add('active');
            const targetEl = document.getElementById(target);
            if(targetEl) targetEl.style.display = 'block';
        });
    });
}

// --- 1. OHCOW METHOD LOGIC ---
function calcOHCOW() {
    const method = document.getElementById('hs-method').value;
    let baseIdx = 0;
    
    if(method === 'humidex') {
        let t = parseFloat(document.getElementById('hs-t1').value) || 0;
        t = convertToC(t);
        const rh = parseFloat(document.getElementById('hs-rh1').value) || 0;
        // Humidex calculation (Source: Environment Canada)
        // e = vapor pressure in hPa
        const e = (rh / 100) * 6.112 * Math.exp(17.67 * t / (t + 243.5));
        baseIdx = t + (0.5555 * (e - 10));
    } else if (method === 'estimate') {
        let t = parseFloat(document.getElementById('hs-t2').value) || 0;
        t = convertToC(t);
        const rh = parseFloat(document.getElementById('hs-rh2').value) || 0;
        // WBGT Estimate from T/RH (Psychrometric Correlation)
        // Empirical formula used for industrial screening
        baseIdx = (0.567 * t) + (0.393 * (rh/100 * 6.112 * Math.exp(17.67 * t / (t + 243.5)))) + 3.94;
    } else {
        const tw = convertToC(parseFloat(document.getElementById('hs-tw').value) || 0);
        const tg = convertToC(parseFloat(document.getElementById('hs-tg').value) || 0);
        const ta = convertToC(parseFloat(document.getElementById('hs-ta').value) || 0);
        baseIdx = (0.7 * tw) + (0.2 * tg) + (0.1 * ta);
    }

    // Modifiers
    const workModifier = parseInt(document.getElementById('work1').value);
    const acclModifier = parseInt(document.getElementById('accl1').value);
    const clothAdj = parseInt(document.getElementById('cloth1').value);
    const radAdj = parseInt(document.getElementById('rad1').value);

    // OHCOW uses a base value + clothing + radiant then compares against a limit.
    // However, we represent 'Heat Strain' by adding modifiers to the index.
    let finalIdx = baseIdx + clothAdj + radAdj;
    
    // Risk assessment based on adjusted index mapping
    let riskLevel = 0;
    if(finalIdx < 25) riskLevel = 0;
    else if(finalIdx < 28) riskLevel = 1;
    else if(finalIdx < 31) riskLevel = 2;
    else if(finalIdx < 34) riskLevel = 3;
    else riskLevel = 4;

    // Apply workload and accl enrichment to the risk level
    riskLevel += workModifier;
    riskLevel += acclModifier;
    if(riskLevel > 4) riskLevel = 4;

    const labels = ["SAFE", "CAUTION", "HIGH", "DANGER", "EXTREME"];
    const classes = ["risk-safe", "risk-caution", "risk-high", "risk-danger", "risk-extreme"];

    const displayValue = convertFromC(finalIdx).toFixed(1) + " °" + currentUnit;
    displayResult('hs-res', displayValue, labels[riskLevel], classes[riskLevel]);
}

// --- 2. OSHA HEAT STRESS ASSESSMENT (WBGT-BASED) ---
// Methodology: ACGIH (American Conference of Governmental Industrial Hygienists) TLV Standards.
// Weight Adjustment: M_adj = M_base * (Actual Weight / 70kg)
// Threshold: WBGT_eff vs TLV Limit (Acclimatized/Unacclimatized curves)
function calcOSHA() {
    const wbgt = convertToC(parseFloat(document.getElementById('wbgt_osha').value) || 0);
    const weight = parseFloat(document.getElementById('osha-weight').value) || 70;
    const mBase = parseFloat(document.getElementById('work2').value) || 300;
    const clothingAdj = parseFloat(document.getElementById('cloth2').value) || 0;
    const isUnacclimated = parseInt(document.getElementById('accl2').value) === 1;

    // 1. Calculate Adjusted Metabolic Rate (Watts)
    // Internal heat generation correlates with body mass
    const mAdj = mBase * (weight / 70);

    // 2. Calculate Effective WBGT (Measured + Clothing Insulation)
    const wbgtEff = wbgt + clothingAdj;

    // 3. Calculate ACGIH TLV (Threshold Limit Value) for the Metabolic Load
    // Curve approximation: Limit decreases as internal heat load increases
    let tlv = 0;
    if (!isUnacclimated) {
        // Acclimatized Curve: Linear regression approximation of ACGIH TLV
        tlv = 31.0 - (0.003 * mAdj);
    } else {
        // Unacclimatized/Action Limit Curve
        tlv = 28.0 - (0.003 * mAdj);
    }

    // 4. Assessment Results
    const diff = wbgtEff - tlv;
    let riskLevel = 0; // 0: SAFE, 1: MODERATE, 2: HIGH, 3: DANGER, 4: EXTREME
    
    if (diff <= 0) riskLevel = 0;
    else if (diff < 1.0) riskLevel = 1;
    else if (diff < 2.5) riskLevel = 2;
    else if (diff < 4.5) riskLevel = 3;
    else riskLevel = 4;

    const labels = ["SAFE", "CAUTION", "HIGH", "DANGER", "EXTREME"];
    const classes = ["risk-safe", "risk-caution", "risk-high", "risk-danger", "risk-extreme"];

    const displayValue = convertFromC(wbgtEff).toFixed(1) + " °" + currentUnit;
    displayResult('hi-res', displayValue, labels[riskLevel], classes[riskLevel]);
    
    const statusText = diff <= 0 ? "BELOW Recommended Exposure Limits" : "ABOVE Recommended Exposure Limits";
    const tlvFmt = convertFromC(tlv).toFixed(1);
    document.getElementById('hi-res').querySelector('.rec-text').innerHTML = 
        `<b>Result:</b> ${statusText}.<br>` +
        `<b>Physiological Load:</b> ${mAdj.toFixed(0)} Watts (Weight-Adjusted).<br>` +
        `<b>Exposure Limit (TLV):</b> ${tlvFmt} °${currentUnit} WBGT for this metabolic load.`;
}

// --- 3. ATMOSPHERIC (KATA) LOGIC ---
// Methodology: Hill's Formula for cooling power & humidity estimation.
// Units: H calculated in mcal/cm²/s, converted to mW/cm² for display.
function calcKataAtm() {
    const factor = parseFloat(document.getElementById('kata-f').value) || 0;
    const ta = convertToC(parseFloat(document.getElementById('kata-ta').value) || 0);
    const t_dry = parseFloat(document.getElementById('kata-t1').value) || 0;
    const t_wet = parseFloat(document.getElementById('kata-t2').value) || 0;

    if (!factor || !t_dry || !t_wet) return alert("Please enter all Kata parameters");

    // 1. Calculate Cooling Power in legacy units (mcal/cm²/s)
    const H_mcal = factor / t_dry; 
    const H_wet_mcal = factor / t_wet;
    const theta = 36.5 - ta; // Temperature difference (Bulb mean vs Ambient)

    // 2. Air Velocity (v) from Dry Kata H (Hill's Formulas)
    const ratio = H_mcal / theta;
    let velocity = 0;
    if (ratio < 0.6) {
        // Low velocity regime
        velocity = Math.pow((ratio - 0.20) / 0.40, 2);
    } else {
        // High velocity regime
        velocity = Math.pow((ratio - 0.13) / 0.47, 2);
    }
    velocity = Math.max(0, velocity);

    // 3. Humidity (RH%) Prediction 
    // Evaporation depends on the bulb surface vapor pressure (at 36.5°C)
    const es_bulb = 6.112 * Math.exp(17.67 * 36.5 / (36.5 + 243.5)); // Saturation vapor pressure at 36.5°C
    const es_air = 6.112 * Math.exp(17.67 * ta / (ta + 243.5)); // Saturation vapor pressure at air temp
    
    const diffH = H_wet_mcal - H_mcal;
    const evap_factor = 0.035 + 0.16 * Math.sqrt(velocity);
    
    // Calculate partial vapor pressure (e) and then RH
    const e = Math.max(0, es_bulb - (diffH / evap_factor));
    const rh = Math.min(100, (e / es_air) * 100);

    // 4. Update UI with Modern Units (mW/cm²)
    const H_mw = H_mcal * 4.184; // 1 mcal/s ≈ 4.184 mW
    
    document.getElementById('kata-res').style.display = 'block';
    document.getElementById('val-kata-rh').innerText = Math.round(rh) + "%";
    document.getElementById('val-kata-v').innerText = velocity.toFixed(2) + " m/s";
    document.getElementById('val-kata-h').innerText = H_mw.toFixed(1) + " mW/cm²";
}

// --- 4. WBGT MONITORING LOGIC ---
// Standard weighted average formula for Wet Bulb Globe Temperature (WBGT).
// Formula (Outdoor/Sun): 0.7 * T_nwb + 0.2 * T_g + 0.1 * T_db
// Formula (Indoor/Shade): 0.7 * T_nwb + 0.3 * T_g
function calcWBGTPro() {
    const tw = convertToC(parseFloat(document.getElementById('pro-tw').value) || 0); // T_nwb: Natural Wet Bulb
    const tg = convertToC(parseFloat(document.getElementById('pro-tg').value) || 0); // T_g: Globe Temp
    const ta = convertToC(parseFloat(document.getElementById('pro-ta').value) || 0); // T_db: Dry Bulb (Ambient)

    const outdoor = (0.7 * tw) + (0.2 * tg) + (0.1 * ta);
    const indoor = (0.7 * tw) + (0.3 * tg);

    const resBox = document.getElementById('wbgt-pro-res');
    resBox.style.display = 'block';
    document.getElementById('val-outdoor').innerText = convertFromC(outdoor).toFixed(1) + " °" + currentUnit;
    document.getElementById('val-indoor').innerText = convertFromC(indoor).toFixed(1) + " °" + currentUnit;
}

// --- 4. STANDALONE HEAT INDEX LOGIC ---
function calcHIStandalone() {
    const tInput = parseFloat(document.getElementById('hi-t').value) || 0;
    const rhInput = parseFloat(document.getElementById('hi-rh').value) || 0;

    // 1. Convert input to Fahrenheit for standard NOAA formula
    const T = currentUnit === 'C' ? (tInput * 9/5) + 32 : tInput;
    const RH = rhInput;
    
    // 2. Initial simplified calculation
    let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
    
    // 3. Complete calculation for higher temperatures
    if (HI > 80) {
        HI = -42.379 + (2.04901523 * T) + (10.14333127 * RH) - (0.22475541 * T * RH) - 
             (0.00683783 * T * T) - (0.05481717 * RH * RH) + (0.00122874 * T * T * RH) + 
             (0.00085282 * T * RH * RH) - (0.00000199 * T * T * RH * RH);
             
        // Special adjustments
        if (RH < 13 && T >= 80 && T <= 112) {
            const adj = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
            HI -= adj;
        } else if (RH > 85 && T >= 80 && T <= 87) {
            const adj = ((RH - 85) / 10) * ((87 - T) / 5);
            HI += adj;
        }
    }

    // 4. Convert result back to displayed unit
    const resVal = currentUnit === 'C' ? (HI - 32) * 5/9 : HI;
    
    // 5. User-provided Classifications & Advices
    let riskText = "SAFE";
    let riskClass = "risk-safe";
    let advice = "No significant heat risk. Stay hydrated.";
    let sunColor = "#fbbf24"; // Default Yellow-Gold for Safe

    if (HI >= 125) {
        riskText = "EXTREME DANGER";
        riskClass = "risk-extreme";
        advice = "Heat stroke highly likely.";
        sunColor = "#b91c1c";
    } else if (HI >= 103) {
        riskText = "DANGER";
        riskClass = "risk-danger";
        advice = "Heat cramps or heat exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity.";
        sunColor = "#ef4444";
    } else if (HI >= 90) {
        riskText = "EXTREME CAUTION";
        riskClass = "risk-high";
        advice = "Heat stroke, heat cramps, or heat exhaustion possible with prolonged exposure and/or physical activity.";
        sunColor = "#f97316";
    } else if (HI >= 80) {
        riskText = "CAUTION";
        riskClass = "risk-caution";
        advice = "Fatigue possible with prolonged exposure and/or physical activity.";
        sunColor = "#fbbf24";
    }

    displayResult('hi-standalone-res', resVal.toFixed(1) + " °" + currentUnit, riskText, riskClass);
    const panel = document.getElementById('hi-standalone-res');
    panel.querySelector('.rec-text').innerHTML = `<b>Interpretation:</b> ${advice}<br><br><b>Guideline:</b> NOAA Heat Index standard for public safety.`;
    
    // 6. Dynamic Visual Reinforcement
    const sunIcon = document.getElementById('hi-sun-icon');
    if (sunIcon) sunIcon.style.color = sunColor;
}

// --- 4. SLING PSYCHROMETER LOGIC ---
// Methodology: Sprung Formula for Vapor Pressure & Magnus-Tetens for Dew Point.
function calcPsychrometer() {
    const td = convertToC(parseFloat(document.getElementById('psy-td').value) || 0);
    const tw = convertToC(parseFloat(document.getElementById('psy-tw').value) || 0);
    const p = parseFloat(document.getElementById('psy-p').value) || 1013.25;

    if (tw > td) return alert("Wet bulb cannot be higher than dry bulb temperature.");

    // 1. Saturation Vapor Pressure at Td and Tw (Tetens Equation)
    const es_td = 6.1078 * Math.exp((17.27 * td) / (td + 237.3));
    const es_tw = 6.1078 * Math.exp((17.27 * tw) / (tw + 237.3));

    // 2. Actual Vapor Pressure (e) from Sprung Formula
    // A = 0.00066 for water-wetted bulb (standard sling)
    const A = 0.00066;
    const e = es_tw - (A * p * (td - tw));

    // 3. Relative Humidity
    const rh = Math.min(100, Math.max(0, (e / es_td) * 100));

    // 4. Dew Point calculation (Magnus Formula)
    const lambda = Math.log(rh / 100) + (17.27 * td) / (td + 237.3);
    const dp = (237.3 * lambda) / (17.27 - lambda);

    // Update UI
    document.getElementById('psy-res').style.display = 'block';
    document.getElementById('val-psy-rh').innerText = rh.toFixed(1) + "%";
    document.getElementById('val-psy-dp').innerText = convertFromC(dp).toFixed(1) + " °" + currentUnit;
    document.getElementById('val-psy-e').innerText = e.toFixed(2) + " hPa";
}

// --- 5. HYDRATION LOGIC ---
function calcHydration() {
    const workload = document.getElementById('hydroWork').value;
    const risk = parseInt(document.getElementById('heatRisk').value);
    
    let rate = 0.5; // Base L/hr
    if(workload === 'moderate') rate = 0.7;
    if(workload === 'heavy') rate = 0.9;
    
    // Add risk-based sweat loss
    rate += (risk * 0.15);

    const resBox = document.getElementById('hydro-res');
    resBox.style.display = 'block';
    resBox.querySelector('.result-value').innerText = rate.toFixed(1) + " L/hr";
    resBox.querySelector('.rec-text').innerText = `Recommendation: Intake approx. ${Math.round(rate*1000/200)} small cups (200ml) per hour.`;
}

// --- UTILS ---
function displayResult(id, value, riskText, riskClass) {
    const box = document.getElementById(id);
    if(!box) return;
    box.style.display = 'block';
    if(box.querySelector('.result-value')) box.querySelector('.result-value').innerText = value;
    if(riskText && box.querySelector('.risk-badge')) {
        const badge = box.querySelector('.risk-badge');
        badge.innerText = riskText;
        badge.className = "risk-badge " + riskClass;
    }
}

function switchHSMethod() {
    const m = document.getElementById('hs-method').value;
    document.getElementById('hs-inputs-1').style.display = (m === 'humidex') ? 'block' : 'none';
    document.getElementById('hs-inputs-2').style.display = (m === 'estimate') ? 'block' : 'none';
    document.getElementById('hs-inputs-3').style.display = (m === 'detailed') ? 'block' : 'none';
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const PARTICLE_COUNT = 30;
    const COLORS = ['rgba(249,115,22,', 'rgba(239,68,68,', 'rgba(251,191,36,'];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: Math.random() * 0.4 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005,
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.pulse += p.pulseSpeed;
            const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + a + ')';
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < -10) p.y = h + 10;
            if (p.y > h + 10) p.y = -10;
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();
}
