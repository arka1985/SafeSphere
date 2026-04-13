import { findAngle } from './geometry';

// RULA Score Tables (Simplified for demonstration)
// In a real app, these would be full lookup tables
const tableA = [
    [1, 2, 2, 2, 2, 3, 3, 3],
    [2, 2, 2, 2, 3, 3, 3, 3],
    [2, 3, 3, 3, 3, 3, 4, 4],
    [2, 3, 3, 3, 3, 4, 4, 4],
    [3, 3, 3, 3, 3, 4, 4, 4],
    [3, 4, 4, 4, 4, 4, 5, 5],
    [3, 3, 4, 4, 4, 5, 5, 5],
    [3, 3, 4, 4, 4, 5, 5, 5]
];

const tableB = [
    [1, 3, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7],
    [2, 3, 2, 3, 4, 5, 5, 5, 6, 7, 7, 7],
    [3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7],
    [5, 5, 5, 2, 3, 3, 4, 5, 6, 7, 7, 7],
    [7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8],
    [8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9]
];

const tableC = [
    [1, 2, 3, 3, 4, 5, 5],
    [2, 2, 3, 4, 4, 5, 5],
    [3, 3, 3, 4, 4, 5, 6],
    [3, 3, 3, 4, 5, 6, 6],
    [4, 4, 4, 5, 6, 7, 7],
    [4, 4, 5, 6, 6, 7, 7],
    [5, 5, 6, 6, 7, 7, 7],
    [5, 5, 6, 7, 7, 7, 7]
];

export const calculateRULAScore = (landmarks, side = 'right') => {
    if (!landmarks || landmarks.length === 0) {
        return { score: 0, level: 'No Data', color: 'gray' };
    }

    // Landmark Indices
    // Right: 12(Shoulder), 14(Elbow), 16(Wrist), 24(Hip), 8(Ear)
    // Left: 11(Shoulder), 13(Elbow), 15(Wrist), 23(Hip), 7(Ear)

    const isRight = side === 'right';
    const shoulderIndex = isRight ? 12 : 11;
    const elbowIndex = isRight ? 14 : 13;
    const wristIndex = isRight ? 16 : 15;
    const hipIndex = isRight ? 24 : 23;
    const earIndex = isRight ? 8 : 7;

    const shoulder = landmarks[shoulderIndex];
    const elbow = landmarks[elbowIndex];
    const wrist = landmarks[wristIndex];
    const hip = landmarks[hipIndex];
    const ear = landmarks[earIndex];
    const trunk = landmarks[hipIndex]; // Using hip as trunk reference
    const neck = landmarks[shoulderIndex]; // Using shoulder as neck base

    // Upper Arm Score
    // Angle between trunk and upper arm
    // Vertical line is reference
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

    // Wrist Score (Simplified)
    let wristScore = 1;

    // Wrist Twist (Simplified)
    let wristTwistScore = 1;

    // Neck Score
    // Angle between trunk and neck
    const neckAngle = findAngle({ x: shoulder.x, y: shoulder.y - 0.5 }, shoulder, ear); // Approx
    let neckScore = 1;
    if (neckAngle < 10) neckScore = 1;
    else if (neckAngle < 20) neckScore = 2;
    else neckScore = 3;

    // Trunk Score
    // Angle of trunk deviation from vertical
    // We need hip and shoulder
    const trunkAngle = findAngle({ x: hip.x, y: hip.y - 0.5 }, hip, shoulder);
    let trunkScore = 1;
    if (trunkAngle < 10) trunkScore = 1; // upright
    else if (trunkAngle < 20) trunkScore = 2;
    else trunkScore = 3;

    // Leg Score
    let legScore = 1; // Supported

    // Table A Lookup (Upper Arm, Lower Arm, Wrist, Wrist Twist)
    // Indices are 0-based, scores are 1-based
    const scoreA = tableA[upperArmScore - 1][lowerArmScore - 1] || 1; // Simplified lookup

    // Table B Lookup (Neck, Trunk, Legs)
    const scoreB = tableB[neckScore - 1][trunkScore - 1] || 1; // Simplified lookup

    // Final Score Calculation
    // Add muscle use and force scores (assumed 0 for video analysis)
    const scoreC = scoreA;
    const scoreD = scoreB;

    // Table C Lookup
    let finalScore = 1;
    if (scoreC <= 8 && scoreD <= 7) {
        finalScore = tableC[scoreC - 1][scoreD - 1] || 7;
    } else {
        finalScore = 7;
    }

    let level = 'Acceptable';
    let color = '#4ade80'; // green-400
    let actionLevel = 1;
    let recommendation = 'Posture is acceptable if not maintained or repeated for long periods.';

    if (finalScore >= 3 && finalScore <= 4) {
        level = 'Investigate Further';
        color = '#facc15'; // yellow-400
        actionLevel = 2;
        recommendation = 'Further investigation is needed and changes may be required.';
    } else if (finalScore >= 5 && finalScore <= 6) {
        level = 'Investigate Soon';
        color = '#fb923c'; // orange-400
        actionLevel = 3;
        recommendation = 'Investigation and changes are required soon.';
    } else if (finalScore >= 7) {
        level = 'Investigate Immediately';
        color = '#f87171'; // red-400
        actionLevel = 4;
        recommendation = 'Investigation and changes are required immediately.';
    }

    return {
        score: finalScore,
        level,
        color,
        actionLevel,
        recommendation
    };
};
