const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Configuration
const GRID_SIZE = 40; // Size of each cell in pixels
const COLS = 20;
const ROWS = 15;
const WALL_COLOR = '#333';
const EMPTY_COLOR = 'rgba(255, 255, 255, 0.05)';
const PATH_COLOR = 'rgba(0, 255, 157, 0.2)';
const AGV_COLOR = '#00f3ff';
const TARGET_COLOR = '#ff00ff';

// State
let grid = []; // 0: Empty, 1: Wall
let agv = { x: 0, y: 0, path: [], state: 'IDLE', battery: 100 };
let target = null;
let heatmapMode = false;
let accessFrequency = []; // For heatmap

// Initialize
function init() {
    canvas.width = COLS * GRID_SIZE;
    canvas.height = ROWS * GRID_SIZE;

    // Initialize Grid
    for (let y = 0; y < ROWS; y++) {
        let row = [];
        let freqRow = [];
        for (let x = 0; x < COLS; x++) {
            // Create some random walls, but keep start clear
            const isWall = (Math.random() < 0.2 && !(x === 0 && y === 0));
            row.push(isWall ? 1 : 0);
            freqRow.push(0);
        }
        grid.push(row);
        accessFrequency.push(freqRow);
    }

    // Start Loop
    requestAnimationFrame(loop);

    // Battery drain simulation
    setInterval(() => {
        if (agv.state === 'MOVING' && agv.battery > 0) {
            agv.battery -= 1;
            updateTelemetry();
        } else if (agv.state === 'IDLE' && agv.battery < 100) {
            agv.battery = Math.min(100, agv.battery + 2); // Charging
            updateTelemetry();
        }
    }, 1000);
}

// Interaction
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);

    if (x >= 0 && x < COLS && y >= 0 && y < ROWS && grid[y][x] !== 1) {
        setTarget(x, y);
    }
});

function setTarget(x, y) {
    target = { x, y };
    agv.state = 'CALCULATING';
    updateTelemetry();

    // Run A* Pathfinding
    const path = findPath(agv.x, agv.y, target.x, target.y);

    if (path) {
        agv.path = path;
        agv.state = 'MOVING';
        // Update Heatmap data (ML Aspect)
        accessFrequency[y][x] += 1;
    } else {
        agv.state = 'NO PATH';
        target = null;
    }
    updateTelemetry();
}

// A* Pathfinding Algorithm
function findPath(startX, startY, endX, endY) {
    // Simple Node class
    class Node {
        constructor(x, y, parent = null) {
            this.x = x;
            this.y = y;
            this.parent = parent;
            this.g = 0;
            this.h = 0;
            this.f = 0;
        }
    }

    let openList = [];
    let closedList = [];
    openList.push(new Node(startX, startY));

    while (openList.length > 0) {
        // Get node with lowest f
        let currentNode = openList[0];
        let currentIndex = 0;

        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < currentNode.f) {
                currentNode = openList[i];
                currentIndex = i;
            }
        }

        openList.splice(currentIndex, 1);
        closedList.push(currentNode);

        // Found target
        if (currentNode.x === endX && currentNode.y === endY) {
            let path = [];
            let current = currentNode;
            while (current) {
                path.push({ x: current.x, y: current.y });
                current = current.parent;
            }
            return path.reverse();
        }

        // Neighbors
        let neighbors = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (let offset of neighbors) {
            let nodeX = currentNode.x + offset.x;
            let nodeY = currentNode.y + offset.y;

            // Check bounds and walls
            if (nodeX < 0 || nodeX >= COLS || nodeY < 0 || nodeY >= ROWS || grid[nodeY][nodeX] === 1) {
                continue;
            }

            // Check closed list
            if (closedList.find(n => n.x === nodeX && n.y === nodeY)) {
                continue;
            }

            let neighbor = new Node(nodeX, nodeY, currentNode);
            neighbor.g = currentNode.g + 1;
            neighbor.h = Math.abs(nodeX - endX) + Math.abs(nodeY - endY); // Manhattan distance
            neighbor.f = neighbor.g + neighbor.h;

            let openNode = openList.find(n => n.x === nodeX && n.y === nodeY);
            if (openNode && neighbor.g > openNode.g) {
                continue;
            }

            if (!openNode) {
                openList.push(neighbor);
            }
        }
    }
    return null; // No path found
}

// Main Loop
let lastTime = 0;
const MOVE_SPEED = 200; // ms per step

function loop(timestamp) {
    if (timestamp - lastTime > MOVE_SPEED) {
        update();
        lastTime = timestamp;
    }
    draw();
    requestAnimationFrame(loop);
}

function update() {
    if (agv.state === 'MOVING' && agv.path.length > 0) {
        const nextStep = agv.path.shift(); // Get next position
        // Don't jump to start immediately if it's the current pos
        if (nextStep.x !== agv.x || nextStep.y !== agv.y) {
            agv.x = nextStep.x;
            agv.y = nextStep.y;
        }

        if (agv.path.length === 0) {
            agv.state = 'IDLE';
            target = null;
        }
        updateTelemetry();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const isWall = grid[y][x] === 1;

            // Base Cell
            ctx.fillStyle = isWall ? WALL_COLOR : EMPTY_COLOR;
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);

            // Heatmap Overlay
            if (heatmapMode && !isWall) {
                const freq = accessFrequency[y][x];
                if (freq > 0) {
                    const intensity = Math.min(freq * 0.2, 0.8);
                    ctx.fillStyle = `rgba(255, 0, 0, ${intensity})`;
                    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
                }
            }
        }
    }

    // Draw Path
    if (agv.path.length > 0) {
        ctx.fillStyle = PATH_COLOR;
        for (let p of agv.path) {
            ctx.fillRect(p.x * GRID_SIZE, p.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
        }
    }

    // Draw Target
    if (target) {
        ctx.fillStyle = TARGET_COLOR;
        ctx.beginPath();
        ctx.arc(
            target.x * GRID_SIZE + GRID_SIZE / 2,
            target.y * GRID_SIZE + GRID_SIZE / 2,
            GRID_SIZE / 3, 0, Math.PI * 2
        );
        ctx.fill();
    }

    // Draw AGV
    ctx.fillStyle = AGV_COLOR;
    ctx.shadowColor = AGV_COLOR;
    ctx.shadowBlur = 15;
    ctx.fillRect(agv.x * GRID_SIZE + 2, agv.y * GRID_SIZE + 2, GRID_SIZE - 5, GRID_SIZE - 5);
    ctx.shadowBlur = 0;
}

function updateTelemetry() {
    document.getElementById('statusValue').innerText = agv.state;
    document.getElementById('batteryValue').innerText = agv.battery + '%';
    document.getElementById('posValue').innerText = `${agv.x}, ${agv.y}`;
    document.getElementById('loadValue').innerText = agv.state === 'MOVING' ? 'Loaded' : 'Empty';

    if (target) {
        document.getElementById('taskValue').innerText = `Go to ${target.x}, ${target.y}`;
    } else {
        document.getElementById('taskValue').innerText = 'Waiting...';
    }
}

function resetSimulation() {
    grid = [];
    accessFrequency = [];
    agv = { x: 0, y: 0, path: [], state: 'IDLE', battery: 100 };
    target = null;
    init();
}

function toggleHeatmap() {
    heatmapMode = !heatmapMode;
    const btn = document.getElementById('toggleHeatmapBtn');
    if (heatmapMode) {
        btn.style.background = 'rgba(255, 0, 0, 0.2)';
        btn.style.borderColor = 'red';
        btn.innerText = 'Hide Heatmap';
    } else {
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--accent-blue)';
        btn.innerText = 'Show Heatmap (ML)';
    }
}

// Start
init();
