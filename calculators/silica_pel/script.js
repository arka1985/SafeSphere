let currentContext = 'factories'; // 'factories' or 'mines'
let currentMethod = 'total'; // 'mppcm', 'total', 'respirable'

const elements = {
    toggleFactories: document.getElementById('toggle-factories'),
    toggleMines: document.getElementById('toggle-mines'),
    factoriesMethods: document.getElementById('factories-methods'),
    inputLabel: document.getElementById('input-label'),
    quartzInput: document.getElementById('quartz-percent'),
    quartzRange: document.getElementById('quartz-range'),
    pelValue: document.getElementById('pel-value'),
    pelUnit: document.getElementById('pel-unit'),
    formulaDisplay: document.getElementById('formula-display'),
    regText: document.getElementById('reg-text'),
    infoBox: document.getElementById('additional-info'),
    complianceBadge: document.getElementById('compliance-badge')
};

const methods = {
    mppcm: {
        label: "Percentage of Quartz in Dust (%)",
        unit: "mppcm",
        formula: (q) => (10600 / (q + 10)).toFixed(2),
        formulaStr: "PEL = 10,600 / (% Quartz + 10)",
        info: "Measurement in millions of particles per cubic meter (mppcm) as per the Second Schedule of The Factories Act, 1948."
    },
    total: {
        label: "Percentage of Quartz in Total Dust (%)",
        unit: "mg/m³",
        formula: (q) => (10 / (q + 3)).toFixed(2),
        formulaStr: "PEL = 10 / (% Quartz + 3)",
        info: "Calculation for Total Dust concentration in milligrams per cubic meter."
    },
    respirable: {
        label: "Percentage of Respirable Quartz (%)",
        unit: "mg/m³",
        formula: (q) => (10 / (q + 2)).toFixed(2),
        formulaStr: "PEL = 10 / (% Respirable Quartz + 2)",
        info: "Calculation for Respirable Dust concentration based on the percentage of quartz specifically in the respirable fraction."
    },
    mines: {
        label: "Percentage of Free Silica (SiO₂) (%)",
        unit: "mg/m³",
        formula: (q) => {
            if (q <= 5) return "1.00";
            return (5 / q).toFixed(2);
        },
        formulaStr: "% ≤ 5: 1.0 mg/m³ | % > 5: 5 / % Silica",
        info: "Mining regulatory guidelines. Limits are 1.0 mg/m³ for up to 5% free silica, otherwise calculated as 5 divided by the percentage."
    }
};

function setContext(context) {
    currentContext = context;
    
    // UI Updates
    elements.toggleFactories.classList.toggle('active', context === 'factories');
    elements.toggleMines.classList.toggle('active', context === 'mines');
    elements.factoriesMethods.style.display = context === 'factories' ? 'block' : 'none';
    
    if (context === 'mines') {
        elements.regText.innerText = "Based on Mines Dust Regulation Guidelines. Standardized limits for mining operations.";
        elements.complianceBadge.innerText = "Mine Safety Mode";
        elements.complianceBadge.style.color = "var(--accent-amber)";
        elements.complianceBadge.style.borderColor = "rgba(245, 158, 11, 0.2)";
        elements.complianceBadge.style.background = "rgba(245, 158, 11, 0.1)";
    } else {
        elements.regText.innerText = "Based on The Factories Act, 1948 - Second Schedule. Occupational exposure limits for crystalline silica.";
        elements.complianceBadge.innerText = "Standard Assessment Mode";
        elements.complianceBadge.style.color = "var(--accent-emerald)";
        elements.complianceBadge.style.borderColor = "rgba(16, 185, 129, 0.2)";
        elements.complianceBadge.style.background = "rgba(16, 185, 129, 0.1)";
    }

    calculate();
}

function setMethod(method) {
    currentMethod = method;
    
    // UI Updates for Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        const isThis = tab.getAttribute('onclick').includes(`'${method}'`);
        tab.classList.toggle('active', isThis);
    });

    calculate();
}

function syncRangeToInput() {
    elements.quartzInput.value = elements.quartzRange.value;
    calculate();
}

function calculate() {
    let q = parseFloat(elements.quartzInput.value);
    if (isNaN(q)) q = 0;
    if (q < 0) q = 0;
    if (q > 100) q = 100;
    
    // Ensure range slider matches
    elements.quartzRange.value = q;

    const data = currentContext === 'mines' ? methods.mines : methods[currentMethod];
    
    // Update Labels & Values
    elements.inputLabel.innerText = data.label;
    elements.pelValue.innerText = data.formula(q);
    elements.pelUnit.innerText = data.unit;
    elements.formulaDisplay.innerText = data.formulaStr;
    elements.infoBox.innerText = data.info;
}

// Initial Sync
calculate();
setContext('factories');
setMethod('total');
