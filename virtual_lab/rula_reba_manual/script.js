document.addEventListener('DOMContentLoaded', () => {
    // Initialize Modules
    if (typeof initRula === 'function') initRula();
    if (typeof initReba === 'function') initReba();

    // Home Button Logic
    document.getElementById('home-btn').addEventListener('click', showLandingPage);

    // Download Handlers
    document.getElementById('download-rula').addEventListener('click', () => printReport('RULA'));
    document.getElementById('download-reba').addEventListener('click', () => printReport('REBA'));
});

// Navigation Functions
function selectTool(tool) {
    // Hide Landing Page
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('landing-page').classList.add('hidden');

    // Show Assessment Container
    document.getElementById('assessment-container').classList.remove('hidden');

    // Show Home Button
    document.getElementById('home-btn').classList.remove('hidden');

    // Hide all sections first
    document.querySelectorAll('.assessment-section').forEach(sec => sec.classList.add('hidden'));

    // Show selected section
    const section = document.getElementById(tool);
    section.classList.remove('hidden');
    section.classList.add('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLandingPage() {
    // Show Landing Page
    document.getElementById('landing-page').classList.remove('hidden');
    document.getElementById('landing-page').classList.add('active');

    // Hide Assessment Container
    document.getElementById('assessment-container').classList.add('hidden');

    // Hide Home Button
    document.getElementById('home-btn').classList.add('hidden');

    // Reset Forms (Optional)
    // document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
}

// Helper function to create step elements
function createStepElement(step, prefix) {
    const card = document.createElement('div');
    card.className = 'step-card';

    const title = document.createElement('div');
    title.className = 'step-title';
    title.innerHTML = `<span class="step-number">${step.id}</span> ${step.label}`;
    card.appendChild(title);

    const controlDiv = document.createElement('div');
    controlDiv.className = 'step-control';

    if (step.type === 'display') {
        // Read-only display step
        const displaySpan = document.createElement('span');
        displaySpan.id = `${prefix}-step-${step.id}-display`;
        displaySpan.className = 'calc-display';
        displaySpan.textContent = step.value;
        controlDiv.appendChild(displaySpan);
    } else {
        // Select Input
        const select = document.createElement('select');
        select.id = `${prefix}-step-${step.id}`;
        select.name = `${prefix}-step-${step.id}`;

        step.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });
        controlDiv.appendChild(select);

        // Adjustments (Checkboxes)
        if (step.adjustments) {
            const adjDiv = document.createElement('div');
            adjDiv.className = 'adjustments-area';
            step.adjustments.forEach((adj, idx) => {
                const label = document.createElement('label');
                label.className = 'adj-label';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = `${prefix}-step-${step.id}-adj`;
                checkbox.value = adj.value;

                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${adj.text}`));
                adjDiv.appendChild(label);
            });
            controlDiv.appendChild(adjDiv);
        }
    }

    card.appendChild(controlDiv);
    return card;
}

// Helper to update result display
function updateResultDisplay(prefix, score, actionLevel, actionDesc) {
    const resultDiv = document.getElementById(`${prefix}-result`);
    const scoreValue = document.getElementById(`${prefix}-score-value`);
    const levelSpan = document.getElementById(`${prefix}-action-level`);
    const descP = document.getElementById(`${prefix}-action-desc`);

    resultDiv.classList.remove('hidden');
    scoreValue.textContent = score;
    levelSpan.textContent = actionLevel;
    descP.textContent = actionDesc;

    const circle = resultDiv.querySelector('.score-circle');
    const color = getScoreColor(score, prefix);
    circle.style.borderColor = color;
    circle.style.color = color;
    circle.style.boxShadow = `0 0 30px ${color}`;
}

function getScoreColor(score, type) {
    if (score <= (type === 'reba' ? 1 : 2)) return 'var(--accent-success)';
    if (score <= (type === 'reba' ? 3 : 4)) return 'var(--accent-warning)';
    if (score <= (type === 'reba' ? 7 : 6)) return 'orange';
    return 'var(--accent-danger)';
}

function printReport(type) {
    const name = document.getElementById('assessor-name').value || 'N/A';
    const date = document.getElementById('assessment-date').value || new Date().toLocaleDateString();

    // Simple print logic
    const originalTitle = document.title;
    document.title = `${type}_Assessment_${name}_${date}`;
    window.print();
    document.title = originalTitle;
}
