const rebaSteps = [
    // Step 1: Neck
    {
        id: 1,
        label: "Step 1: Neck Position",
        options: [
            { text: "0° to 20° flexion (1)", value: 1 },
            { text: ">20° flexion or extension (2)", value: 2 }
        ],
        adjustments: [
            { text: "Twisted or Side bending (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 2: Trunk
    {
        id: 2,
        label: "Step 2: Trunk Position",
        options: [
            { text: "Upright (1)", value: 1 },
            { text: "0° to 20° flexion/extension (2)", value: 2 },
            { text: "20° to 60° flexion or >20° extension (3)", value: 3 },
            { text: ">60° flexion (4)", value: 4 }
        ],
        adjustments: [
            { text: "Twisted or Side bending (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 3: Legs
    {
        id: 3,
        label: "Step 3: Legs",
        options: [
            { text: "Bilateral weight bearing, walking or sitting (1)", value: 1 },
            { text: "Unilateral weight bearing, unstable (2)", value: 2 }
        ],
        adjustments: [
            { text: "Knee(s) between 30° and 60° flexion (+1)", value: 1 },
            { text: "Knee(s) >60° flexion (+2)", value: 2 }
        ],
        group: "A"
    },
    // Step 4: Posture Score A (Calculated)
    {
        id: 4,
        label: "Step 4: Posture Score A",
        type: "display",
        value: "-",
        group: "A"
    },
    // Step 5: Force/Load
    {
        id: 5,
        label: "Step 5: Force / Load",
        options: [
            { text: "< 5kg (0)", value: 0 },
            { text: "5-10kg (1)", value: 1 },
            { text: "> 10kg (2)", value: 2 }
        ],
        adjustments: [
            { text: "Shock or rapid build up of force (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 6: Score A Total (Calculated)
    {
        id: 6,
        label: "Step 6: Score A Total",
        type: "display",
        value: "-",
        group: "A"
    },
    // Step 7: Upper Arm
    {
        id: 7,
        label: "Step 7: Upper Arm Position",
        options: [
            { text: "20° extension to 20° flexion (1)", value: 1 },
            { text: ">20° extension or 20-45° flexion (2)", value: 2 },
            { text: "45° to 90° flexion (3)", value: 3 },
            { text: ">90° flexion (4)", value: 4 }
        ],
        adjustments: [
            { text: "Shoulder raised (+1)", value: 1 },
            { text: "Abducted (+1)", value: 1 },
            { text: "Supported / Leaning (-1)", value: -1 }
        ],
        group: "B"
    },
    // Step 8: Lower Arm
    {
        id: 8,
        label: "Step 8: Lower Arm Position",
        options: [
            { text: "60° to 100° flexion (1)", value: 1 },
            { text: "<60° or >100° flexion (2)", value: 2 }
        ],
        group: "B"
    },
    // Step 9: Wrist
    {
        id: 9,
        label: "Step 9: Wrist Position",
        options: [
            { text: "0° to 15° flexion/extension (1)", value: 1 },
            { text: ">15° flexion/extension (2)", value: 2 }
        ],
        adjustments: [
            { text: "Twisted or bent (+1)", value: 1 }
        ],
        group: "B"
    },
    // Step 10: Posture Score B (Calculated)
    {
        id: 10,
        label: "Step 10: Posture Score B",
        type: "display",
        value: "-",
        group: "B"
    },
    // Step 11: Coupling
    {
        id: 11,
        label: "Step 11: Coupling",
        options: [
            { text: "Good (0)", value: 0 },
            { text: "Fair (1)", value: 1 },
            { text: "Poor (2)", value: 2 },
            { text: "Unacceptable (3)", value: 3 }
        ],
        group: "B"
    },
    // Step 12: Score B Total (Calculated)
    {
        id: 12,
        label: "Step 12: Score B Total",
        type: "display",
        value: "-",
        group: "B"
    },
    // Step 13: Activity Score
    {
        id: 13,
        label: "Step 13: Activity Score",
        options: [
            { text: "None (0)", value: 0 },
            { text: "1 or more body parts static >1min (+1)", value: 1 },
            { text: "Repeated small range actions >4x/min (+1)", value: 1 },
            { text: "Action causes rapid large range changes (+1)", value: 1 }
        ],
        group: "C"
    }
];

// ... (Keep existing tables rebaTableA, rebaTableB, rebaTableC) ...
// REBA Table A (Neck, Trunk, Legs) -> Score A
const rebaTableA = [
    [1, 2, 3, 4, 2, 3, 4, 5, 2, 4, 5, 6, 3, 5, 6, 7, 4, 6, 7, 8],
    [2, 3, 4, 5, 3, 4, 5, 6, 4, 5, 6, 7, 5, 6, 7, 8, 6, 7, 8, 9],
    [3, 4, 5, 6, 4, 5, 6, 7, 5, 6, 7, 8, 6, 7, 8, 9, 7, 8, 9, 9]
];

// REBA Table B (Upper Arm, Lower Arm, Wrist) -> Score B
const rebaTableB = [
    [1, 2, 2, 1, 2, 3],
    [1, 2, 3, 2, 3, 4],
    [3, 4, 5, 4, 5, 5],
    [4, 5, 5, 5, 6, 7],
    [6, 7, 8, 7, 8, 8],
    [7, 8, 8, 8, 9, 9]
];

// REBA Table C (Score A, Score B) -> Score C
const rebaTableC = [
    [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],
    [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],
    [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],
    [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],
    [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],
    [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],
    [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
    [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
    [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
    [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
    [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
    [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]
];

function initReba() {
    const container = document.getElementById('reba-steps');
    container.innerHTML = '';
    rebaSteps.forEach(step => {
        container.appendChild(createStepElement(step, 'reba'));
    });

    document.getElementById('calculate-reba').addEventListener('click', calculateRebaScore);
}

function calculateRebaScore() {
    const getVal = (id) => {
        const el = document.getElementById(`reba-step-${id}`);
        if (!el) return 0;
        return parseInt(el.value);
    };

    const getAdj = (id) => {
        let adj = 0;
        const checkboxes = document.querySelectorAll(`input[name="reba-step-${id}-adj"]:checked`);
        checkboxes.forEach(cb => adj += parseInt(cb.value));
        return adj;
    };

    let neck = getVal(1) + getAdj(1);
    let trunk = getVal(2) + getAdj(2);
    let legs = getVal(3) + getAdj(3);

    // Clamp
    neck = Math.max(1, Math.min(3, neck));
    trunk = Math.max(1, Math.min(5, trunk));
    legs = Math.max(1, Math.min(4, legs));

    // Step 4: Posture Score A
    const colA = (trunk - 1) * 4 + (legs - 1);
    let scoreA = rebaTableA[neck - 1][colA];
    document.getElementById('reba-step-4-display').textContent = scoreA;

    let forceA = getVal(5) + getAdj(5);

    // Step 6: Score A Total
    let scoreATotal = scoreA + forceA;
    document.getElementById('reba-step-6-display').textContent = scoreATotal;

    let upperArm = getVal(7) + getAdj(7);
    let lowerArm = getVal(8);
    let wrist = getVal(9) + getAdj(9);

    // Clamp
    upperArm = Math.max(1, Math.min(6, upperArm));
    lowerArm = Math.max(1, Math.min(2, lowerArm));
    wrist = Math.max(1, Math.min(3, wrist));

    // Step 10: Posture Score B
    const colB = (lowerArm - 1) * 3 + (wrist - 1);
    let scoreB = rebaTableB[upperArm - 1][colB];
    document.getElementById('reba-step-10-display').textContent = scoreB;

    let coupling = getVal(11);

    // Step 12: Score B Total
    let scoreBTotal = scoreB + coupling;
    document.getElementById('reba-step-12-display').textContent = scoreBTotal;

    let activity = getVal(13);

    // Final Score (Table C)
    const rowC = Math.max(1, Math.min(12, scoreATotal)) - 1;
    const colC = Math.max(1, Math.min(12, scoreBTotal)) - 1;
    let scoreC = rebaTableC[rowC][colC];

    const finalScore = scoreC + activity;

    let actionLevel = "";
    let actionDesc = "";

    if (finalScore <= 1) {
        actionLevel = "Level 0";
        actionDesc = "Negligible risk.";
    } else if (finalScore <= 3) {
        actionLevel = "Level 1";
        actionDesc = "Low risk. Change may be needed.";
    } else if (finalScore <= 7) {
        actionLevel = "Level 2";
        actionDesc = "Medium risk. Further investigation. Change soon.";
    } else if (finalScore <= 10) {
        actionLevel = "Level 3";
        actionDesc = "High risk. Investigate and implement change.";
    } else {
        actionLevel = "Level 4";
        actionDesc = "Very high risk. Implement change.";
    }

    updateResultDisplay('reba', finalScore, actionLevel, actionDesc);
    document.getElementById('download-reba').classList.remove('hidden');
}
