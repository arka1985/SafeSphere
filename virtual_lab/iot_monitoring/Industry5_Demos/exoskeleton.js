const canvas = document.getElementById('exoCanvas');
const ctx = canvas.getContext('2d');

// State
let width, height;
let mouseX = 0, mouseY = 0;
let exoActive = false;
let lifting = false;
let liftWeight = 25; // kg
let liftTechnique = 'SQUAT'; // SQUAT or STOOP
let animationTime = 0;
let liftState = 'IDLE'; // IDLE, DOWN, GRASP, UP, HOLD, RELEASE

// Metrics
let spinalCompression = 0; // Newtons
let maxCompression = 3400; // NIOSH limit approx
let fatigue = 0;

// Resize
function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    width = canvas.width;
    height = canvas.height;
}
window.addEventListener('resize', resize);

// Interaction
window.toggleExo = function () {
    exoActive = !exoActive;
    const btn = document.getElementById('exoToggle');
    const status = btn.querySelector('.switch-status');

    if (exoActive) {
        btn.classList.add('active');
        status.textContent = "ON";
    } else {
        btn.classList.remove('active');
        status.textContent = "OFF";
    }
};

window.setTechnique = function (tech) {
    if (lifting) return;
    liftTechnique = tech;
};

window.liftLoad = function (weight) {
    if (lifting) return;
    lifting = true;
    liftWeight = weight;
    liftState = 'DOWN';
    animationTime = 0;
};

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    // 1. Update Animation State
    updateAnimation();

    // 2. Calculate Biomechanics
    calculateStrain();

    // 3. Draw Scene
    drawFloor();
    drawSkeleton();
    drawBox();
    drawHUD();

    requestAnimationFrame(animate);
}

function updateAnimation() {
    // Slower speed for heavier weight
    let speed = 0.02;
    if (liftWeight === 50) speed = 0.015;

    if (lifting) {
        animationTime += speed;

        if (liftState === 'DOWN') {
            if (animationTime >= 1) {
                animationTime = 0;
                liftState = 'GRASP';
            }
        } else if (liftState === 'GRASP') {
            const graspTime = liftWeight === 50 ? 1.0 : 0.5;
            if (animationTime >= graspTime) {
                animationTime = 0;
                liftState = 'UP';
            }
        } else if (liftState === 'UP') {
            if (animationTime >= 1) {
                animationTime = 0;
                liftState = 'HOLD';
            }
        } else if (liftState === 'HOLD') {
            if (animationTime >= 1.5) {
                animationTime = 0;
                liftState = 'RELEASE';
                lifting = false;
                liftState = 'IDLE';
            }
        }
    }

    // Fatigue recovery
    if (!lifting && fatigue > 0) fatigue -= 0.1;
}

function calculateStrain() {
    // Accurate Biomechanical Model Approximation
    // Base loads in Newtons
    const upperBodyWeight = 350; // N (~35kg torso/head/arms)
    const loadForce = liftWeight * 9.81; // N

    // Lever Arms (approximate for simulation)
    // Stoop: Long lever arm (torso horizontal) -> High Torque
    // Squat: Shorter lever arm (torso more vertical) -> Lower Torque

    let leverArm = 0;

    if (liftTechnique === 'STOOP') {
        // Stoop: Torso is horizontal at bottom
        // Lever arm is full length of torso + arms
        leverArm = 0.45; // meters (effective)
    } else {
        // Squat: Torso is ~45 deg
        leverArm = 0.25; // meters
    }

    // Dynamic Posture Factor based on animation state
    let postureMultiplier = 1.0;
    if (liftState === 'DOWN' || liftState === 'UP') {
        // Strain peaks at the bottom (time=1 for DOWN, time=0 for UP)
        const t = liftState === 'DOWN' ? animationTime : (1 - animationTime);
        postureMultiplier = 1 + (t * 2.0);
    } else if (liftState === 'GRASP') {
        postureMultiplier = 3.0; // Max strain at bottom
    }

    // Moment = Force * Distance
    // Muscle Force needs to counteract this Moment with a small lever arm (~5cm)
    // Compression = Muscle Force + Upper Body + Load

    let totalMoment = (upperBodyWeight * leverArm * 0.5) + (loadForce * leverArm);
    if (liftState === 'IDLE') totalMoment = 0;

    // Erector Spinae Muscle Force (approx 5cm lever arm)
    let muscleForce = totalMoment / 0.05;

    // Total Compression
    let compression = upperBodyWeight + (liftState !== 'IDLE' ? loadForce : 0) + muscleForce;

    // Note: We removed the arbitrary 'techniqueFactor' multiplier because the 
    // leverArm difference (0.45m vs 0.25m) already accurately accounts for the 
    // mechanical disadvantage of stooping (Torque = Force * Distance).
    // Stoop: ~4300N (High Risk)
    // Squat: ~2700N (Caution)

    // Exoskeleton Effect
    let reduction = 0;
    if (exoActive) {
        if (liftTechnique === 'STOOP') {
            // Exos are VERY effective for stoop (hip torque)
            reduction = 0.5; // 50% reduction
        } else {
            // Less effective for squat but still helps
            reduction = 0.3; // 30% reduction
        }
        compression *= (1 - reduction);
    }

    spinalCompression = Math.max(500, compression); // Min 500N standing

    // Fatigue
    if (lifting) {
        let fatRate = (liftWeight / 25) * (exoActive ? 0.05 : 0.15);
        if (liftTechnique === 'STOOP') fatRate *= 1.5; // Stoop is more tiring
        fatigue = Math.min(100, fatigue + fatRate);
    }

    // Update UI
    document.getElementById('spineVal').textContent = Math.round(spinalCompression) + ' N';
    const spinePct = Math.min(100, (spinalCompression / maxCompression) * 100);
    document.getElementById('spineBar').style.width = spinePct + '%';
    document.getElementById('spineBar').style.background = getStrainColor(spinePct);

    document.getElementById('fatigueVal').textContent = Math.round(fatigue) + '%';
    document.getElementById('fatigueBar').style.width = fatigue + '%';
    document.getElementById('fatigueBar').style.background = getStrainColor(fatigue);

    const safetyCard = document.getElementById('safetyCard');
    const safetyVal = safetyCard.querySelector('.metric-value');

    // Show reduction if active
    let statusText = "";
    if (spinalCompression > 3400) { // NIOSH Limit
        statusText = "HIGH RISK";
        safetyVal.style.color = "var(--danger)";
    } else if (spinalCompression > 2000) {
        statusText = "CAUTION";
        safetyVal.style.color = "var(--neon-yellow)";
    } else {
        statusText = "OPTIMAL";
        safetyVal.style.color = "var(--neon-green)";
    }

    if (exoActive && lifting) {
        statusText += ` (-${reduction * 100}%)`;
    }
    safetyVal.textContent = statusText;
}

function getStrainColor(pct) {
    if (pct < 60) return 'var(--neon-green)'; // <~2000N
    if (pct < 90) return 'var(--neon-yellow)'; // <~3000N
    return 'var(--danger)'; // >3400N
}

function drawFloor() {
    const gradient = ctx.createLinearGradient(0, height - 100, 0, height);
    gradient.addColorStop(0, '#2a2a3e');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - 100, width, 100);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i += 40) {
        ctx.moveTo(i, height - 100);
        ctx.lineTo(i - (width / 2 - i) * 0.5, height);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height - 100);
    ctx.lineTo(width, height - 100);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawSkeleton() {
    const cx = width / 2;
    const cy = height - 100;

    // Key Poses
    const poseStand = {
        hip: { x: 0, y: -130 },
        knee: { x: 10, y: -60 },
        foot: { x: 10, y: 0 },
        shoulder: { x: 0, y: -190 },
        head: { x: 5, y: -220 },
        hand: { x: 20, y: -100 }
    };

    const poseSquat = {
        hip: { x: -40, y: -80 },
        knee: { x: 30, y: -50 },
        foot: { x: 10, y: 0 },
        shoulder: { x: 40, y: -110 },
        head: { x: 50, y: -130 },
        hand: { x: 60, y: -20 }
    };

    const poseStoop = {
        hip: { x: -20, y: -130 }, // Hips stay high
        knee: { x: 0, y: -60 },   // Knees straight(er)
        foot: { x: 10, y: 0 },
        shoulder: { x: 60, y: -130 }, // Torso horizontal
        head: { x: 80, y: -130 },
        hand: { x: 60, y: -20 }
    };

    let currentPose = { ...poseStand };
    let t = 0;

    // Select Target Pose based on Technique
    const targetDownPose = liftTechnique === 'STOOP' ? poseStoop : poseSquat;

    if (liftState === 'DOWN') {
        t = animationTime;
        currentPose = interpolatePose(poseStand, targetDownPose, easeInOutQuad(t));
    } else if (liftState === 'GRASP') {
        currentPose = targetDownPose;
    } else if (liftState === 'UP') {
        t = animationTime;
        currentPose = interpolatePose(targetDownPose, poseStand, easeInOutQuad(t));
    } else if (liftState === 'HOLD') {
        currentPose = poseStand;
        currentPose.hand = { x: 40, y: -130 };
        currentPose.shoulder.x += 10;
    }

    // Draw
    const hipX = cx + currentPose.hip.x;
    const hipY = cy + currentPose.hip.y;
    const kneeX = cx + currentPose.knee.x;
    const kneeY = cy + currentPose.knee.y;
    const footX = cx + currentPose.foot.x;
    const footY = cy + currentPose.foot.y;
    const shoulderX = cx + currentPose.shoulder.x;
    const shoulderY = cy + currentPose.shoulder.y;
    const headX = cx + currentPose.head.x;
    const headY = cy + currentPose.head.y;
    const handX = cx + currentPose.hand.x;
    const handY = cy + currentPose.hand.y;

    const drawLimb = (x1, y1, x2, y2, width, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    // Left Leg
    drawLimb(hipX - 10, hipY, kneeX - 15, kneeY - 10, 18, '#444');
    drawLimb(kneeX - 15, kneeY - 10, footX - 15, footY, 16, '#444');

    // Exo Back
    if (exoActive) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        drawLimb(hipX - 15, hipY, kneeX - 20, kneeY - 10, 8, '#0088aa');
        drawLimb(kneeX - 20, kneeY - 10, footX - 20, footY, 8, '#0088aa');
        ctx.shadowBlur = 0;
    }

    // Torso
    const strainColor = getStrainColor((spinalCompression / maxCompression) * 100);
    drawLimb(hipX, hipY, shoulderX, shoulderY, 35, '#ddd');
    drawLimb(hipX, hipY, shoulderX, shoulderY, 8, strainColor); // Spine

    // Head
    ctx.fillStyle = '#eee';
    ctx.beginPath();
    ctx.arc(headX, headY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(headX + 12, headY - 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right Leg
    drawLimb(hipX, hipY, kneeX, kneeY, 20, '#ccc');
    drawLimb(kneeX, kneeY, footX, footY, 18, '#ccc');

    // Arm
    drawLimb(shoulderX, shoulderY, handX, handY, 16, '#ccc');

    // Exo Front
    if (exoActive) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        drawLimb(hipX - 20, hipY, shoulderX - 20, shoulderY - 10, 10, '#00f3ff');
        drawLimb(hipX - 5, hipY, kneeX - 5, kneeY, 10, '#00f3ff');
        drawLimb(kneeX - 5, kneeY, footX - 5, footY, 10, '#00f3ff');

        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        [{ x: hipX - 5, y: hipY }, { x: kneeX - 5, y: kneeY }, { x: shoulderX - 20, y: shoulderY - 10 }].forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        ctx.shadowBlur = 0;
    }
}

function interpolatePose(p1, p2, t) {
    const p = {};
    for (let key in p1) {
        p[key] = {
            x: p1[key].x + (p2[key].x - p1[key].x) * t,
            y: p1[key].y + (p2[key].y - p1[key].y) * t
        };
    }
    return p;
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function drawBox() {
    const cx = width / 2;
    const cy = height - 100;
    const boxSize = liftWeight === 50 ? 70 : 50;
    let boxY = cy - boxSize;
    let boxX = cx + 35;

    if (liftState === 'UP') {
        const t = easeInOutQuad(animationTime);
        boxY = (cy - boxSize) - (t * 100);
        boxX = (cx + 35) - (t * 20);
    } else if (liftState === 'HOLD') {
        boxY = cy - boxSize - 100;
        boxX = cx + 15;
    }

    ctx.fillStyle = liftWeight === 50 ? '#ff4444' : '#e6a800';
    ctx.fillRect(boxX, boxY, boxSize, boxSize);

    // 3D sides
    ctx.fillStyle = liftWeight === 50 ? '#cc0000' : '#c99200';
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxSize);
    ctx.lineTo(boxX + 10, boxY + boxSize - 10);
    ctx.lineTo(boxX + boxSize + 10, boxY + boxSize - 10);
    ctx.lineTo(boxX + boxSize, boxY + boxSize);
    ctx.fill();

    ctx.fillStyle = liftWeight === 50 ? '#ff6666' : '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(boxX + boxSize, boxY);
    ctx.lineTo(boxX + boxSize + 10, boxY - 10);
    ctx.lineTo(boxX + boxSize + 10, boxY + boxSize - 10);
    ctx.lineTo(boxX + boxSize, boxY + boxSize);
    ctx.fill();

    // Centered Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(liftWeight + 'kg', boxX + boxSize / 2, boxY + boxSize / 2);
}

function drawHUD() {
    const strainPct = (spinalCompression / maxCompression) * 100;
    if (strainPct > 90) { // Only warn on very high risk
        const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 500);
        grad.addColorStop(0, 'rgba(255, 68, 68, 0)');
        grad.addColorStop(1, 'rgba(255, 68, 68, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ HIGH SPINAL LOAD', width / 2, 50);
    }
}

// Init
resize();
animate();
