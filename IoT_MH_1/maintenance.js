// Configuration
const UPDATE_INTERVAL = 100; // ms
const MAX_DATA_POINTS = 50;

// State
let wearLevel = 0;
let simTemp = 45;
let simVib = 0.5;
let time = 0;
let health = 100;

// Chart Setup
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
        x: { display: false },
        y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        }
    },
    plugins: {
        legend: { display: false }
    }
};

// Initialize Vibration Chart
const vibCtx = document.getElementById('vibChart').getContext('2d');
const vibChart = new Chart(vibCtx, {
    type: 'line',
    data: {
        labels: Array(MAX_DATA_POINTS).fill(''),
        datasets: [{
            label: 'Vibration (mm/s)',
            data: Array(MAX_DATA_POINTS).fill(0),
            borderColor: '#00f3ff',
            backgroundColor: 'rgba(0, 243, 255, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: true
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, min: -10, max: 10 }
        }
    }
});

// Initialize Temperature Chart
const tempCtx = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
        labels: Array(MAX_DATA_POINTS).fill(''),
        datasets: [{
            label: 'Temperature (°C)',
            data: Array(MAX_DATA_POINTS).fill(40),
            borderColor: '#bc13fe',
            backgroundColor: 'rgba(188, 19, 254, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: true
        }]
    },
    options: {
        ...commonOptions,
        scales: {
            ...commonOptions.scales,
            y: { ...commonOptions.scales.y, min: 20, max: 120 }
        }
    }
});

// Simulation Logic
function generateData() {
    time += 0.1;

    // Vibration: Base value from slider + sine wave + noise
    // Wear level adds extra noise
    const baseVib = simVib;
    const noise = (Math.random() - 0.5) * (0.5 + (wearLevel / 50));
    const sine = Math.sin(time) * 0.5;

    // If vibration is high, make it more chaotic
    const chaos = baseVib > 5 ? (Math.random() - 0.5) * 2 : 0;

    let vibration = baseVib + sine + noise + chaos;

    // Temperature: Base value from slider + slow drift + noise
    // Wear level adds slight heat bias
    const baseTemp = simTemp;
    const tempNoise = (Math.random() - 0.5) * 1.5;
    const wearHeat = wearLevel / 10; // Up to +10C from wear

    let temperature = baseTemp + wearHeat + tempNoise;

    return { vibration, temperature };
}

function updateCharts(data) {
    // Update Vibration
    const vibData = vibChart.data.datasets[0].data;
    vibData.shift();
    vibData.push(data.vibration);
    vibChart.update();

    // Update Temperature
    const tempData = tempChart.data.datasets[0].data;
    tempData.shift();
    tempData.push(data.temperature);
    tempChart.update();
}

function analyzeHealth(data) {
    // Deterministic Logic based on Sliders
    // We want the AI to react PREDICTABLY to the user's inputs.

    // 1. Thresholds
    const VIB_WARN = 3.0;
    const VIB_CRIT = 6.0;
    const TEMP_WARN = 70;
    const TEMP_CRIT = 90;

    // 2. Calculate Risk Factors (0.0 to 1.0)
    let vibRisk = 0;
    if (Math.abs(data.vibration) > VIB_CRIT) vibRisk = 1.0;
    else if (Math.abs(data.vibration) > VIB_WARN) vibRisk = 0.5 + ((Math.abs(data.vibration) - VIB_WARN) / (VIB_CRIT - VIB_WARN)) * 0.5;
    else vibRisk = Math.abs(data.vibration) / VIB_WARN * 0.3;

    let tempRisk = 0;
    if (data.temperature > TEMP_CRIT) tempRisk = 1.0;
    else if (data.temperature > TEMP_WARN) tempRisk = 0.5 + ((data.temperature - TEMP_WARN) / (TEMP_CRIT - TEMP_WARN)) * 0.5;
    else tempRisk = (data.temperature - 20) / (TEMP_WARN - 20) * 0.3;

    let wearRisk = wearLevel / 100;

    // 3. Combined Failure Probability
    // Weighted average: Vibration and Temp are immediate signs, Wear is long term
    let rawProb = (vibRisk * 40) + (tempRisk * 40) + (wearRisk * 20);

    // Add slight jitter for "AI" feel, but keep it grounded
    let failureProb = Math.min(99.9, Math.max(0.1, rawProb + (Math.random() * 2 - 1)));

    // 4. Calculate RUL (Remaining Useful Life)
    // Deterministic mapping from Failure Probability
    let rul = 0;
    if (failureProb < 10) rul = 365;
    else if (failureProb < 30) rul = 180 - (failureProb - 10) * 4; // 180 -> 100
    else if (failureProb < 60) rul = 90 - (failureProb - 30) * 2; // 90 -> 30
    else if (failureProb < 90) rul = 30 - (failureProb - 60); // 30 -> 0
    else rul = 0; // Critical

    // 5. Update Health Score
    health = 100 - failureProb;

    updateUI(health, data, failureProb, rul);
}

function updateUI(health, data, failureProb, rul) {
    // Update Ring
    const ring = document.getElementById('healthRing');
    const scoreVal = document.getElementById('healthScore');

    scoreVal.innerText = Math.round(health) + '%';

    // Color Logic
    let color = '#00ff9d'; // Green
    let status = 'NORMAL';

    if (health < 70) {
        color = '#ffa500'; // Orange
        status = 'WARNING';
    }
    if (health < 40) {
        color = '#ff4444'; // Red
        status = 'CRITICAL';
    }

    ring.style.borderColor = color;
    ring.style.boxShadow = `0 0 40px ${color}40`; // 40 is hex opacity

    // Update Badges
    const vibBadge = document.getElementById('vibStatus');
    const tempBadge = document.getElementById('tempStatus');

    // Vibration Logic
    if (Math.abs(data.vibration) > 6.0) {
        vibBadge.className = 'badge badge-crit';
        vibBadge.innerText = 'CRITICAL';
    } else if (Math.abs(data.vibration) > 3.0) {
        vibBadge.className = 'badge badge-warn';
        vibBadge.innerText = 'WARNING';
    } else {
        vibBadge.className = 'badge badge-ok';
        vibBadge.innerText = 'NORMAL';
    }

    // Temp Logic
    if (data.temperature > 90) {
        tempBadge.className = 'badge badge-crit';
        tempBadge.innerText = 'CRITICAL';
    } else if (data.temperature > 70) {
        tempBadge.className = 'badge badge-warn';
        tempBadge.innerText = 'WARNING';
    } else {
        tempBadge.className = 'badge badge-ok';
        tempBadge.innerText = 'NORMAL';
    }

    // Update AI Metrics
    const probElem = document.getElementById('probValue');
    const rulElem = document.getElementById('rulValue');
    const predText = document.getElementById('predictionText');

    if (probElem) {
        probElem.innerText = failureProb.toFixed(1) + '%';
        probElem.style.color = failureProb > 60 ? '#ff4444' : (failureProb > 30 ? '#ffa500' : '#00ff9d');
    }

    if (rulElem) {
        if (rul > 300) rulElem.innerText = "> 1 Year";
        else if (rul > 1) rulElem.innerText = Math.round(rul) + " Days";
        else rulElem.innerText = "< 24 Hours";
        rulElem.style.color = rul < 30 ? '#ff4444' : '#ffffff';
    }

    // AI Prediction Text
    if (predText) {
        if (health > 90) {
            predText.innerText = "System operating within optimal parameters. No anomalies detected.";
            predText.style.color = "#94a3b8";
        } else if (health > 60) {
            predText.innerText = "⚠️ Early wear patterns detected. AI recommends scheduling inspection within 30 days.";
            predText.style.color = "#ffa500";
        } else if (health > 30) {
            predText.innerText = "🛑 Significant degradation. Probability of failure increasing. Schedule maintenance immediately.";
            predText.style.color = "#ff4444";
        } else {
            predText.innerText = "🚨 CRITICAL FAILURE IMMINENT. Automatic shutdown sequence recommended.";
            predText.style.color = "#ff0000";
            predText.style.fontWeight = "bold";
        }
    }
}

// Interaction
document.getElementById('wearSlider').addEventListener('input', (e) => {
    wearLevel = parseInt(e.target.value);
    document.getElementById('wearValue').innerText = wearLevel + '%';
});

document.getElementById('tempSlider').addEventListener('input', (e) => {
    simTemp = parseInt(e.target.value);
    document.getElementById('tempValue').innerText = simTemp + '°C';
});

document.getElementById('vibSlider').addEventListener('input', (e) => {
    simVib = parseFloat(e.target.value);
    document.getElementById('vibValue').innerText = simVib.toFixed(1) + ' mm/s';
});

// Main Loop
setInterval(() => {
    const data = generateData();
    updateCharts(data);
    analyzeHealth(data);
}, UPDATE_INTERVAL);
