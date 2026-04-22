let currentEar = 'right'; // 'right' or 'left'
let chart;

const frequencies = [125, 250, 500, 1000, 2000, 4000, 8000];
const dataPoints = {
    right: { 125: 10, 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10, 8000: 10 },
    left: { 125: 10, 250: 10, 500: 10, 1000: 10, 2000: 10, 4000: 10, 8000: 10 }
};

const elements = {
    freqInputGrid: document.querySelector('.freq-input-grid'),
    ptaRight: document.getElementById('pta-val-right'),
    ptaLeft: document.getElementById('pta-val-left'),
    statusDesc: document.getElementById('status-desc'),
    bhiVal: document.getElementById('bhi-val'),
    monR: document.getElementById('mon-r'),
    monL: document.getElementById('mon-l'),
    pta4kToggle: document.getElementById('pta4k-toggle'),
    btnRight: document.getElementById('btn-right'),
    btnLeft: document.getElementById('btn-left')
};

function init() {
    setupInputs();
    setupChart();
    calculateResults();
}

function setupInputs() {
    elements.freqInputGrid.innerHTML = '';
    frequencies.forEach(f => {
        const row = document.createElement('div');
        row.className = 'freq-input-row';
        
        const label = f >= 1000 ? `${f/1000}k Hz` : `${f} Hz`;
        
        row.innerHTML = `
            <span class="freq-label">${label}</span>
            <div class="dB-input-wrapper">
                <input type="number" class="dB-input" data-freq="${f}" 
                    value="${dataPoints[currentEar][f]}" min="-10" max="120" step="5"
                    oninput="handleInputChange(this)">
            </div>
        `;
        elements.freqInputGrid.appendChild(row);
    });
}

function handleInputChange(input) {
    const freq = parseInt(input.dataset.freq);
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0;
    
    dataPoints[currentEar][freq] = val;
    updateChart();
    calculateResults();
}

function setEar(ear) {
    currentEar = ear;
    elements.btnRight.classList.toggle('active', ear === 'right');
    elements.btnLeft.classList.toggle('active', ear === 'left');
    setupInputs();
}

function setupChart() {
    const ctx = document.getElementById('audiogramChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: frequencies.map(f => f >= 1000 ? `${f/1000}k` : f),
            datasets: [
                {
                    label: 'Right Ear (O)',
                    data: frequencies.map(f => dataPoints.right[f]),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    pointStyle: 'circle',
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    tension: 0.1,
                    showLine: true
                },
                {
                    label: 'Left Ear (X)',
                    data: frequencies.map(f => dataPoints.left[f]),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    pointStyle: 'crossRot',
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    tension: 0.1,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    reverse: true,
                    min: -10,
                    max: 120,
                    title: { display: true, text: 'Hearing Level (dB HL)', color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8', stepSize: 10 }
                },
                x: {
                    title: { display: true, text: 'Frequency (Hz)', color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { display: false }
            },
            onClick: (e) => {
                const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                if (points.length) {
                    // Handled if we want to allow dragging or specialized clicking
                }
            }
        }
    });
}

function updateChart() {
    chart.data.datasets[0].data = frequencies.map(f => dataPoints.right[f]);
    chart.data.datasets[1].data = frequencies.map(f => dataPoints.left[f]);
    chart.update();
}

function calculateResults() {
    const use4k = elements.pta4kToggle.checked;
    
    const calcPTA = (earData) => {
        const freqs = use4k ? [500, 1000, 2000, 4000] : [500, 1000, 2000];
        const sum = freqs.reduce((acc, f) => acc + earData[f], 0);
        return (sum / freqs.length).toFixed(1);
    };

    const ptaR = parseFloat(calcPTA(dataPoints.right));
    const ptaL = parseFloat(calcPTA(dataPoints.left));

    elements.ptaRight.innerText = `${ptaR} dB`;
    elements.ptaLeft.innerText = `${ptaL} dB`;

    // Classification
    const maxPta = Math.max(ptaR, ptaL);
    let status = "Normal Hearing";
    if (maxPta > 90) status = "Profound Hearing Loss";
    else if (maxPta > 70) status = "Severe Hearing Loss";
    else if (maxPta > 55) status = "Moderately Severe";
    else if (maxPta > 40) status = "Moderate Hearing Loss";
    else if (maxPta > 25) status = "Mild Hearing Loss";
    
    elements.statusDesc.innerText = status;

    // Impairment Calculation
    const calcMon = (pta) => {
        const loss = (pta - 25) * 1.5;
        return Math.min(100, Math.max(0, loss));
    };

    const monR = calcMon(ptaR);
    const monL = calcMon(ptaL);

    elements.monR.innerText = `${monR.toFixed(1)}%`;
    elements.monL.innerText = `${monL.toFixed(1)}%`;

    const better = Math.min(monR, monL);
    const worse = Math.max(monR, monL);
    const bhi = ((better * 5) + worse) / 6;

    elements.bhiVal.innerText = `${bhi.toFixed(1)}%`;
}

function clearData() {
    frequencies.forEach(f => {
        dataPoints.right[f] = 10;
        dataPoints.left[f] = 10;
    });
    setupInputs();
    updateChart();
    calculateResults();
}

window.onload = init;
