const canvas = document.getElementById('zoneCanvas');
const ctx = canvas.getContext('2d');

let density = 3;
const pedestrians = [];
const forklift = {
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,
    targetSpeed: 2,
};

// Zone Radii
const ZONE_WARN = 180;
const ZONE_DANGER = 100;

function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    forklift.x = canvas.width / 2;
    forklift.y = canvas.height / 2;
}
window.addEventListener('resize', resize);
resize();

class Pedestrian {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() > 0.5 ? -30 : canvas.height + 30; // Spawn outside

        // Target: Random point on opposite side
        let tx = Math.random() * canvas.width;
        let ty = canvas.height / 2 + (Math.random() - 0.5) * 200;

        this.angle = Math.atan2(ty - this.y, tx - this.x);
        this.speed = 0.5 + Math.random() * 0.8; // Realistic walking speed
        this.icon = Math.random() > 0.5 ? "👷" : "👷‍♀️";
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Reset if far out
        if (this.x < -100 || this.x > canvas.width + 100 ||
            this.y < -100 || this.y > canvas.height + 100) {
            this.reset();
        }
    }

    draw() {
        ctx.font = "24px Arial";
        ctx.textAlign = "center";

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillText(this.icon, this.x, this.y + 8);
    }
}

function updateDensity(val) {
    density = parseInt(val);
    while (pedestrians.length < density * 3) {
        pedestrians.push(new Pedestrian());
    }
    while (pedestrians.length > density * 3) {
        pedestrians.pop();
    }
}

updateDensity(3);

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function drawZones(x, y, isDanger, isWarn) {
    // Danger Zone
    ctx.beginPath();
    ctx.arc(x, y, ZONE_DANGER, 0, Math.PI * 2);
    ctx.fillStyle = isDanger ? "rgba(255, 68, 68, 0.3)" : "rgba(255, 68, 68, 0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 68, 68, 0.6)";
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    // Warn Zone
    ctx.beginPath();
    ctx.arc(x, y, ZONE_WARN, 0, Math.PI * 2);
    ctx.fillStyle = isWarn ? "rgba(255, 221, 0, 0.2)" : "rgba(255, 221, 0, 0.02)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 221, 0, 0.4)";
    ctx.setLineDash([]);
    ctx.stroke();
}

function drawForklift() {
    ctx.save();
    ctx.translate(forklift.x, forklift.y);
    ctx.rotate(forklift.angle);

    // Use Emoji for realism/simplicity mix or draw better shape
    // Drawing a better top-down forklift shape

    // Chassis
    ctx.fillStyle = "#F39C12"; // Safety Orange
    ctx.fillRect(-20, -15, 40, 30);

    // Cabin (darker)
    ctx.fillStyle = "#2C3E50";
    ctx.fillRect(-10, -12, 20, 24);

    // Forks
    ctx.fillStyle = "#95A5A6";
    ctx.fillRect(20, -10, 25, 4);
    ctx.fillRect(20, 6, 25, 4);

    // Wheels
    ctx.fillStyle = "#000";
    ctx.fillRect(-15, -18, 12, 6);
    ctx.fillRect(-15, 12, 12, 6);
    ctx.fillRect(10, -18, 12, 6);
    ctx.fillRect(10, 12, 12, 6);

    ctx.restore();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    drawGrid();

    // Move Forklift (Figure 8)
    const t = Date.now() * 0.0003;
    const nextX = canvas.width / 2 + Math.cos(t) * 200;
    const nextY = canvas.height / 2 + Math.sin(t * 2) * 100;

    // Smooth angle
    const targetAngle = Math.atan2(nextY - forklift.y, nextX - forklift.x);
    // basic interpolation for smooth turn visual
    forklift.angle = targetAngle; // simplified

    let dangerTriggered = false;
    let warnTriggered = false;

    // Update Peds
    let visiblePeds = 0;
    pedestrians.forEach(p => {
        p.update();
        if (p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height) visiblePeds++;

        const d = getDistance(forklift, p);
        if (d < ZONE_DANGER) dangerTriggered = true;
        else if (d < ZONE_WARN) warnTriggered = true;
    });

    // Zones
    drawZones(forklift.x, forklift.y, dangerTriggered, warnTriggered);

    // Forklift
    if (!dangerTriggered) {
        forklift.x = nextX;
        forklift.y = nextY;
        forklift.speed = 2; // moving
    } else {
        forklift.speed = 0; // stopped
    }
    drawForklift();

    // Peds
    pedestrians.forEach(p => p.draw());

    // UI Updates
    document.getElementById('pedCount').innerText = visiblePeds;
    document.getElementById('speedVal').innerText = (forklift.speed * 4).toFixed(1);

    const statusEl = document.getElementById('zoneStatus');
    const brakeCard = document.getElementById('brakeCard');

    if (dangerTriggered) {
        statusEl.innerHTML = '<span class="zone-indicator zone-danger"></span>CRITICAL STOP';
        statusEl.style.color = 'var(--danger)';
        brakeCard.style.display = 'block';
    } else if (warnTriggered) {
        statusEl.innerHTML = '<span class="zone-indicator zone-warn"></span>WARNING';
        statusEl.style.color = 'var(--neon-yellow)';
        brakeCard.style.display = 'none';
    } else {
        statusEl.innerHTML = '<span class="zone-indicator zone-safe"></span>SAFE';
        statusEl.style.color = 'var(--neon-green)';
        brakeCard.style.display = 'none';
    }

    requestAnimationFrame(animate);
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y < canvas.height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();
}

animate();
