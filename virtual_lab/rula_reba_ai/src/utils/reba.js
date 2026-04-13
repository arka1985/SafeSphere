import { findAngle } from './geometry';

// REBA Score Tables (Simplified)
const tableA = [
    [1, 2, 3, 4, 1, 2, 3, 4, 3, 3, 5, 6],
    [2, 3, 4, 5, 3, 4, 5, 6, 4, 5, 6, 7],
    [2, 4, 5, 6, 4, 5, 6, 7, 5, 6, 7, 8],
    [3, 5, 6, 7, 5, 6, 7, 8, 6, 7, 8, 9],
    [4, 6, 7, 8, 6, 7, 8, 9, 7, 8, 9, 9]
];

const tableB = [
    [1, 2, 2, 1, 2, 3],
    [1, 2, 3, 2, 3, 4],
    [3, 4, 5, 4, 5, 5],
    [4, 5, 5, 5, 6, 7],
    [6, 7, 8, 7, 8, 8],
    [7, 8, 8, 8, 9, 9]
];

const tableC = [
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

export const calculateREBAScore = (landmarks, side = 'right') => {
    if (!landmarks || landmarks.length === 0) {
        return { score: 0, level: 'No Data', color: 'gray' };
    }

    const isRight = side === 'right';
    const shoulderIndex = isRight ? 12 : 11;
    const elbowIndex = isRight ? 14 : 13;
    const wristIndex = isRight ? 16 : 15;
    const hipIndex = isRight ? 24 : 23;
    const earIndex = isRight ? 8 : 7;
    const kneeIndex = isRight ? 26 : 25;

    const shoulder = landmarks[shoulderIndex];
    const elbow = landmarks[elbowIndex];
    const wrist = landmarks[wristIndex];
    const hip = landmarks[hipIndex];
    const ear = landmarks[earIndex];
    const knee = landmarks[kneeIndex];

    // Group A: Trunk, Neck, Legs

    // Trunk Score
    const trunkAngle = findAngle({ x: hip.x, y: hip.y - 0.5 }, hip, shoulder);
    let trunkScore = 1;
    if (trunkAngle < 5) trunkScore = 1;
    else if (trunkAngle < 20) trunkScore = 2;
    else if (trunkAngle < 60) trunkScore = 3;
    else trunkScore = 4;

    // Neck Score
    const neckAngle = findAngle({ x: shoulder.x, y: shoulder.y - 0.5 }, shoulder, ear);
    let neckScore = 1;
    if (neckAngle < 20) neckScore = 1;
    else neckScore = 2;

    // Leg Score
    const legAngle = findAngle(hip, knee, { x: knee.x, y: knee.y + 0.5 }); // Approx
    let legScore = 1;
    if (legAngle < 30) legScore = 1;
    else legScore = 2;

    // Group B: Upper Arms, Lower Arms, Wrists

    // Upper Arm Score
    const upperArmAngle = findAngle({ x: shoulder.x, y: shoulder.y + 0.5 }, shoulder, elbow);
    let upperArmScore = 1;
    if (upperArmAngle < 20) upperArmScore = 1;
    else if (upperArmAngle < 45) upperArmScore = 2;
    else if (upperArmAngle < 90) upperArmScore = 3;
    else upperArmScore = 4;

    // Lower Arm Score
    const lowerArmAngle = findAngle(shoulder, elbow, wrist);
    let lowerArmScore = 1;
    if (lowerArmAngle > 60 && lowerArmAngle < 100) lowerArmScore = 1;
    else lowerArmScore = 2;

    // Wrist Score
    const wristAngle = 15; // Placeholder
    let wristScore = 1;
    if (wristAngle < 15) wristScore = 1;
    else wristScore = 2;

    // Calculate Scores
    // Table A (Trunk, Neck, Legs) -> Score A
    // Note: Table A usually takes Trunk (row) and Neck/Legs (col)
    // Simplified mapping:
    let scoreA = tableA[trunkScore - 1][neckScore - 1] || 1; // Very simplified

    // Table B (Upper Arm, Lower Arm, Wrist) -> Score B
    let scoreB = tableB[upperArmScore - 1][lowerArmScore - 1] || 1; // Very simplified

    // Table C (Score A, Score B) -> Score C
    let finalScore = 1;
    if (scoreA <= 12 && scoreB <= 12) {
        finalScore = tableC[scoreA - 1][scoreB - 1] || 1;
    } else {
        finalScore = 11;
    }

    let level = 'Negligible Risk';
    let color = '#4ade80'; // green
    let actionLevel = 0;
    let recommendation = 'No action necessary.';

    if (finalScore >= 2 && finalScore <= 3) {
        level = 'Low Risk';
        color = '#a3e635'; // lime
        actionLevel = 1;
        recommendation = 'Change may be needed.';
    } else if (finalScore >= 4 && finalScore <= 7) {
        level = 'Medium Risk';
        color = '#facc15'; // yellow
        actionLevel = 2;
        recommendation = 'Further investigation, change soon.';
    } else if (finalScore >= 8 && finalScore <= 10) {
        level = 'High Risk';
        color = '#fb923c'; // orange
        actionLevel = 3;
        recommendation = 'Investigate and implement change.';
    } else if (finalScore >= 11) {
        level = 'Very High Risk';
        color = '#f87171'; // red
        actionLevel = 4;
        recommendation = 'Implement change.';
    }

    return {
        score: finalScore,
        level,
        color,
        actionLevel,
        recommendation
    };
};
