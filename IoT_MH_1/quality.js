const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');

let model = null;
let isDetecting = false;

// Sorting Categories
const CATEGORY_A = ['cell phone', 'remote', 'keyboard', 'mouse', 'laptop']; // Electronics
const CATEGORY_B = ['cup', 'bottle', 'bowl', 'wine glass', 'fork', 'spoon']; // Kitchenware

let counts = { A: 0, B: 0, C: 0 };
let lastSortedTime = 0;
const SORT_COOLDOWN = 2000; // ms between sorts to prevent double counting

async function init() {
    try {
        // Load Model
        console.log('Loading model...');
        model = await cocoSsd.load();
        console.log('Model loaded.');

        // Setup Camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            loader.style.display = 'none';
            isDetecting = true;
            detectFrame();
        };
    } catch (err) {
        console.error(err);
        loader.innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
    }
}

async function detectFrame() {
    if (!isDetecting) return;

    // Detect objects
    const predictions = await model.detect(video);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(prediction => {
        // Filter low confidence
        if (prediction.score < 0.6) return;

        const [x, y, width, height] = prediction.bbox;
        const label = prediction.class;

        // Draw Bounding Box
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Draw Label Background
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(x, y - 25, width, 25);

        // Draw Text
        ctx.fillStyle = '#000';
        ctx.font = '18px Inter';
        ctx.fillText(`${label.toUpperCase()} (${Math.round(prediction.score * 100)}%)`, x + 5, y - 7);

        // Update UI
        document.getElementById('lastDetected').innerText = label.toUpperCase();
        document.getElementById('confidenceVal').innerText = Math.round(prediction.score * 100) + '%';

        // Sorting Logic
        processSorting(label);
    });

    requestAnimationFrame(detectFrame);
}

function processSorting(label) {
    const now = Date.now();
    if (now - lastSortedTime < SORT_COOLDOWN) return;

    let category = 'C';
    if (CATEGORY_A.includes(label)) category = 'A';
    else if (CATEGORY_B.includes(label)) category = 'B';

    // Trigger Sort
    counts[category]++;
    updateCounts();
    highlightBin(category);

    lastSortedTime = now;
}

function updateCounts() {
    document.getElementById('countA').innerText = counts.A;
    document.getElementById('countB').innerText = counts.B;
    document.getElementById('countC').innerText = counts.C;
}

function highlightBin(id) {
    const bin = document.getElementById(`bin${id}`);
    bin.classList.add('active');
    setTimeout(() => bin.classList.remove('active'), 500);
}

function resetCounts() {
    counts = { A: 0, B: 0, C: 0 };
    updateCounts();
}

// Start
init();
