const rulaSteps = [
    // Step 1: Upper Arm
    {
        id: 1,
        label: "Step 1: Upper Arm Position",
        options: [
            { text: "-20° to 20° (1)", value: 1 },
            { text: ">20° extension (2)", value: 2 },
            { text: "20° to 45° flexion (2)", value: 2 },
            { text: "45° to 90° flexion (3)", value: 3 },
            { text: ">90° flexion (4)", value: 4 }
        ],
        adjustments: [
            { text: "Shoulder raised (+1)", value: 1 },
            { text: "Abducted (+1)", value: 1 },
            { text: "Supported (-1)", value: -1 }
        ],
        group: "A"
    },
    // Step 2: Lower Arm
    {
        id: 2,
        label: "Step 2: Lower Arm Position",
        options: [
            { text: "60° to 100° (1)", value: 1 },
            { text: "<60° or >100° (2)", value: 2 }
        ],
        adjustments: [
            { text: "Working across midline/out to side (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 3: Wrist
    {
        id: 3,
        label: "Step 3: Wrist Position",
        options: [
            { text: "Neutral (1)", value: 1 },
            { text: "0° to 15° flexion/extension (2)", value: 2 },
            { text: ">15° flexion/extension (3)", value: 3 }
        ],
        adjustments: [
            { text: "Bent from midline (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 4: Wrist Twist
    {
        id: 4,
        label: "Step 4: Wrist Twist",
        options: [
            { text: "Mid-range (1)", value: 1 },
            { text: "At or near end of range (2)", value: 2 }
        ],
        group: "A"
    },
    // Step 5: Posture Score A (Calculated)
    {
        id: 5,
        label: "Step 5: Posture Score A",
        type: "display",
        value: "-",
        group: "A"
    },
    // Step 6: Muscle Use A
    {
        id: 6,
        label: "Step 6: Muscle Use (Arm/Wrist)",
        options: [
            { text: "None (0)", value: 0 },
            { text: "Static >1min or Repeated >4x/min (+1)", value: 1 }
        ],
        group: "A"
    },
    // Step 7: Force/Load A
    {
        id: 7,
        label: "Step 7: Force / Load (Arm/Wrist)",
        options: [
            { text: "< 2kg (0)", value: 0 },
            { text: "2-10kg intermittent (+1)", value: 1 },
            { text: "2-10kg static/repeated (+2)", value: 2 },
            { text: "> 10kg or shock (+3)", value: 3 }
        ],
        group: "A"
    },
    // Step 8: Wrist & Arm Score (Calculated)
    {
        id: 8,
        label: "Step 8: Wrist & Arm Score",
        type: "display",
        value: "-",
        group: "A"
    },
    // Step 9: Neck
    {
        id: 9,
        label: "Step 9: Neck Position",
        options: [
            { text: "0° to 10° (1)", value: 1 },
            { text: "10° to 20° (2)", value: 2 },
            { text: ">20° flexion (3)", value: 3 },
            { text: "In extension (4)", value: 4 }
        ],
        adjustments: [
            { text: "Twisted (+1)", value: 1 },
            { text: "Side bending (+1)", value: 1 }
        ],
        group: "B"
    },
    // Step 10: Trunk
    {
        id: 10,
        label: "Step 10: Trunk Position",
        options: [
            { text: "0° (1)", value: 1 },
            { text: "0° to 20° (2)", value: 2 },
            { text: "20° to 60° (3)", value: 3 },
            { text: ">60° (4)", value: 4 }
        ],
        adjustments: [
            { text: "Twisted (+1)", value: 1 },
            { text: "Side bending (+1)", value: 1 }
        ],
        group: "B"
    },
    // Step 11: Legs
    {
        id: 11,
        label: "Step 11: Legs",
        options: [
            { text: "Supported (1)", value: 1 },
            { text: "Not supported (2)", value: 2 }
        ],
        group: "B"
    },
    // Step 12: Posture Score B (Calculated)
    {
        id: 12,
        label: "Step 12: Posture Score B",
        type: "display",
        value: "-",
        group: "B"
    },
    // Step 13: Muscle Use B
    {
        id: 13,
        label: "Step 13: Muscle Use (Neck/Trunk/Legs)",
        options: [
            { text: "None (0)", value: 0 },
            { text: "Static >1min or Repeated >4x/min (+1)", value: 1 }
        ],
        group: "B"
    },
    // Step 14: Force/Load B
    {
        id: 14,
        label: "Step 14: Force / Load (Neck/Trunk/Legs)",
        options: [
            { text: "< 2kg (0)", value: 0 },
            { text: "2-10kg intermittent (+1)", value: 1 },
            { text: "2-10kg static/repeated (+2)", value: 2 },
            { text: "> 10kg or shock (+3)", value: 3 }
        ],
        group: "B"
    },
    // Step 15: Neck, Trunk, Leg Score (Calculated)
    {
        id: 15,
        label: "Step 15: Neck, Trunk, Leg Score",
        type: "display",
        value: "-",
        group: "B"
    }
];

// ... (Keep existing tables rulaTableA, rulaTableB, rulaTableC) ...
// RULA Table A (Upper Arm Score 1-6)
const rulaTableA = [
    [1, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3, 3, 3, 3, 4, 4],
    [2, 3, 2, 3, 3, 3, 3, 4, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3, 4, 4, 4, 5, 5],
    [3, 3, 4, 4, 4, 4, 5, 5, 3, 4, 4, 4, 4, 4, 5, 5, 4, 4, 4, 5, 5, 5, 6, 6],
    [4, 4, 4, 4, 4, 5, 5, 5, 4, 4, 4, 4, 4, 5, 5, 5, 4, 4, 5, 5, 5, 6, 6, 7],
    [5, 5, 5, 5, 5, 6, 6, 7, 5, 6, 6, 6, 6, 7, 7, 7, 6, 6, 7, 7, 7, 8, 8, 9],
    [7, 7, 7, 7, 7, 8, 8, 9, 6, 7, 7, 7, 7, 8, 8, 9, 7, 7, 7, 7, 7, 9, 9, 9]
];

// RULA Table B (Neck Score 1-6)
const rulaTableB = [
    [1, 3, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7],
    [2, 3, 2, 3, 4, 5, 5, 5, 6, 7, 7, 7],
    [3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7],
    [5, 5, 5, 6, 6, 7, 7, 7, 7, 7, 8, 8],
    [7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
    [8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9]
];

// RULA Table C
const rulaTableC = [
    [1, 2, 3, 3, 4, 5, 5],
    [2, 2, 3, 4, 4, 5, 5],
    [3, 3, 3, 4, 4, 5, 6],
    [3, 3, 3, 4, 5, 6, 6],
    [4, 4, 4, 5, 6, 7, 7],
    [4, 4, 5, 6, 6, 7, 7],
    [5, 5, 6, 6, 7, 7, 7],
    [5, 5, 6, 6, 7, 7, 7]
];

function initRula() {
    const container = document.getElementById('rula-steps');
    container.innerHTML = '';
    rulaSteps.forEach(step => {
        container.appendChild(createStepElement(step, 'rula'));
    });

    document.getElementById('calculate-rula').addEventListener('click', calculateRulaScore);
}

function calculateRulaScore() {
    // Helper to get value from select or checkboxes
    const getVal = (id) => {
        const el = document.getElementById(`rula-step-${id}`);
        if (!el) return 0;
        return parseInt(el.value);
    };

    const getAdj = (id) => {
        let adj = 0;
        const checkboxes = document.querySelectorAll(`input[name="rula-step-${id}-adj"]:checked`);
        checkboxes.forEach(cb => adj += parseInt(cb.value));
        return adj;
    };

    let upperArm = getVal(1) + getAdj(1);
    let lowerArm = getVal(2) + getAdj(2);
    let wrist = getVal(3) + getAdj(3);
    let wristTwist = getVal(4);

    // Clamp
    upperArm = Math.max(1, Math.min(6, upperArm));
    lowerArm = Math.max(1, Math.min(3, lowerArm));
    wrist = Math.max(1, Math.min(4, wrist));
    wristTwist = Math.max(1, Math.min(2, wristTwist));

    // Step 5: Posture Score A
    const colA = (lowerArm - 1) * 8 + (wrist - 1) * 2 + (wristTwist - 1);
    let scoreA = rulaTableA[upperArm - 1][colA];
    document.getElementById('rula-step-5-display').textContent = scoreA;

    let muscleA = getVal(6);
    let forceA = getVal(7);

    // Step 8: Wrist & Arm Score
    let wristArmScore = scoreA + muscleA + forceA;
    document.getElementById('rula-step-8-display').textContent = wristArmScore;

    let neck = getVal(9) + getAdj(9);
    let trunk = getVal(10) + getAdj(10);
    let legs = getVal(11);

    // Clamp
    neck = Math.max(1, Math.min(6, neck));
    trunk = Math.max(1, Math.min(6, trunk));
    legs = Math.max(1, Math.min(2, legs));

    // Step 12: Posture Score B
    const colB = (trunk - 1) * 2 + (legs - 1);
    let scoreB = rulaTableB[neck - 1][colB];
    document.getElementById('rula-step-12-display').textContent = scoreB;

    let muscleB = getVal(13);
    let forceB = getVal(14);

    // Step 15: Neck, Trunk, Leg Score
    let neckTrunkLegScore = scoreB + muscleB + forceB;
    document.getElementById('rula-step-15-display').textContent = neckTrunkLegScore;

    // Final Score (Table C)
    const rowC = Math.max(1, Math.min(8, wristArmScore)) - 1;
    const colC = Math.max(1, Math.min(7, neckTrunkLegScore)) - 1;

    const finalScore = rulaTableC[rowC][colC];

    let actionLevel = "";
    let actionDesc = "";

    if (finalScore <= 2) {
        actionLevel = "Level 1";
        actionDesc = "Acceptable posture.";
    } else if (finalScore <= 4) {
        actionLevel = "Level 2";
        actionDesc = "Further investigation needed; changes may be required.";
    } else if (finalScore <= 6) {
        actionLevel = "Level 3";
        actionDesc = "Investigation and changes are required soon.";
    } else {
        actionLevel = "Level 4";
        actionDesc = "Investigation and changes are required immediately.";
    }

    updateResultDisplay('rula', finalScore, actionLevel, actionDesc);
    document.getElementById('download-rula').classList.remove('hidden');
}
