const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const statusDot = document.querySelector('.dot');
const statusText = document.getElementById('status-text');

// Stats Elements
const blinkRateEl = document.getElementById('blink-rate');
const eyeStateEl = document.getElementById('eye-state');
const closedTimeEl = document.getElementById('closed-time');
const alertOverlay = document.getElementById('alert-overlay');

// Logic Variables
let isMonitoring = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;
let blinkCount = 0;
let lastBlinkTime = 0;
let blinkRate = 0;
const EYE_CLOSED_THRESHOLD = 0.22; // EAR threshold
const FATIGUE_TIME_THRESHOLD = 1000; // 1 second

// Audio Context
let audioCtx;
let alarmOscillator = null;

// MediaPipe Indices
// Left Eye
const LEFT_EYE_TOP = 386;
const LEFT_EYE_BOTTOM = 374;
const LEFT_EYE_INNER = 362;
const LEFT_EYE_OUTER = 263;

// Right Eye
const RIGHT_EYE_TOP = 159;
const RIGHT_EYE_BOTTOM = 145;
const RIGHT_EYE_INNER = 33;
const RIGHT_EYE_OUTER = 133;

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getEAR(landmarks, topInfo, bottomInfo, innerInfo, outerInfo) {
    const top = landmarks[topInfo];
    const bottom = landmarks[bottomInfo];
    const inner = landmarks[innerInfo];
    const outer = landmarks[outerInfo];

    // Vertical distance
    const v_dist = distance(top, bottom);
    // Horizontal distance
    const h_dist = distance(inner, outer);

    // EAR
    return v_dist / h_dist;
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // "Keep Alive" silent loop
    // Plays a barely audible sound to ensure the audio context (and thus the tab) isn't throttled by the browser when minimized.
    const silentOsc = audioCtx.createOscillator();
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0.001;
    silentOsc.connect(silentGain);
    silentGain.connect(audioCtx.destination);
    silentOsc.start();
}

function startAlarm() {
    if (alarmOscillator) return; // Already playing

    alertOverlay.classList.remove('hidden');
    alertOverlay.classList.add('active');

    if (audioCtx) {
        // Ensure context is running
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        alarmOscillator = audioCtx.createOscillator();
        alarmOscillator.type = 'sawtooth'; // piercing sound
        alarmOscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz

        // Pulsing effect
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.1);

        alarmOscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        alarmOscillator.start();
    }
}

function stopAlarm() {
    alertOverlay.classList.remove('active');
    alertOverlay.classList.add('hidden');

    if (alarmOscillator) {
        alarmOscillator.stop();
        alarmOscillator.disconnect();
        alarmOscillator = null;
    }
}

function onResults(results) {
    // Canvas Setup
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw mesh (subtle)
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 });
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#00f3ff' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#00f3ff' });

        // Detect Fatigue
        if (isMonitoring) {
            const leftEAR = getEAR(landmarks, LEFT_EYE_TOP, LEFT_EYE_BOTTOM, LEFT_EYE_INNER, LEFT_EYE_OUTER);
            const rightEAR = getEAR(landmarks, RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM, RIGHT_EYE_INNER, RIGHT_EYE_OUTER);

            const avgEAR = (leftEAR + rightEAR) / 2;

            if (avgEAR < EYE_CLOSED_THRESHOLD) {
                // EYES CLOSED
                if (!isEyesClosed) {
                    isEyesClosed = true;
                    eyesClosedStartTime = Date.now();
                }

                const timeClosed = Date.now() - eyesClosedStartTime;
                closedTimeEl.innerText = (timeClosed / 1000).toFixed(1);

                eyeStateEl.innerText = "Closed";
                eyeStateEl.className = "value state-closed";

                if (timeClosed > FATIGUE_TIME_THRESHOLD) {
                    startAlarm();
                }

            } else {
                // EYES OPEN
                if (isEyesClosed) {
                    // Transition from Closed to Open
                    const timeClosed = Date.now() - eyesClosedStartTime;

                    // If it was a short closing, it's a blink
                    if (timeClosed < 500 && timeClosed > 50) {
                        blinkCount++;
                        updateBlinkRate();
                    }

                    stopAlarm();
                    isEyesClosed = false;
                    closedTimeEl.innerText = "0.0";
                }

                eyeStateEl.innerText = "Open";
                eyeStateEl.className = "value state-normal";
            }
        }
    }
    canvasCtx.restore();
}

function updateBlinkRate() {
    blinkRateEl.innerText = blinkCount;
}

// MediaPipe Setup
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

let camera = null;

// Controls
startBtn.addEventListener('click', async () => {
    initAudio();

    if (isMonitoring) {
        return;
    }

    startBtn.innerText = "Initializing...";
    startBtn.disabled = true;

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported.");
        }

        if (typeof Camera === 'undefined') {
            throw new Error("MediaPipe Camera class is not defined.");
        }

        camera = new Camera(videoElement, {
            onFrame: async () => {
                // Only process via Camera utils if page is visible
                // If hidden, our manual setInterval handles it (to avoid double processing)
                if (!document.hidden) {
                    await faceMesh.send({ image: videoElement });
                }
            },
            width: 640,
            height: 480
        });

        await camera.start();

        // BACKGROUND MONITORING SETUP
        // Browsers pause requestAnimationFrame when minimized. 
        // We must use setInterval to force processing.
        let backgroundInterval = null;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("App minimized. Switching to background interval.");
                if (isMonitoring && !backgroundInterval) {
                    backgroundInterval = setInterval(async () => {
                        if (videoElement.readyState === 4) { // HAVE_ENOUGH_DATA
                            await faceMesh.send({ image: videoElement });
                        }
                    }, 500); // Check every 500ms (slower but works in BG)
                }
            } else {
                console.log("App active. Stopping background interval.");
                if (backgroundInterval) {
                    clearInterval(backgroundInterval);
                    backgroundInterval = null;
                }
            }
        });

        isMonitoring = true;
        startBtn.innerText = "Monitoring Active";
        startBtn.style.opacity = "0.5";
        statusDot.classList.add('active');
        statusText.innerText = "Active";

    } catch (error) {
        console.error("Camera Start Error:", error);
        alert("Camera Error: " + error.message);
        statusText.innerText = "Camera Error";
        startBtn.innerText = "Start Monitoring";
        startBtn.disabled = false;
        isMonitoring = false;
    }
});
