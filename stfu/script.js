// ===== Audio Feedback Looper =====
const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const visualizer = document.getElementById('visualizer');
const errorEl = document.getElementById('error');
const delaySlider = document.getElementById('delaySlider');
const delayValue = document.getElementById('delayValue');
const decaySlider = document.getElementById('decaySlider');
const decayValue = document.getElementById('decayValue');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const echoControls = document.getElementById('echoControls');
const modeButtons = document.querySelectorAll('.mode-option');

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let delayNode = null;
let feedbackGainNode = null;
let outputGainNode = null;
let isActive = false;
let currentMode = 'delay';

// Update display values
delaySlider.addEventListener('input', () => {
    delayValue.textContent = `${parseFloat(delaySlider.value).toFixed(1)}s`;
    if (delayNode) {
        delayNode.delayTime.value = parseFloat(delaySlider.value);
    }
});

decaySlider.addEventListener('input', () => {
    decayValue.textContent = `${Math.round(parseFloat(decaySlider.value) * 100)}%`;
    if (feedbackGainNode) {
        feedbackGainNode.gain.value = parseFloat(decaySlider.value);
    }
});

volumeSlider.addEventListener('input', () => {
    volumeValue.textContent = `${Math.round(parseFloat(volumeSlider.value) * 100)}%`;
    if (outputGainNode) {
        outputGainNode.gain.value = parseFloat(volumeSlider.value);
    }
});

// Mode toggle
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        echoControls.style.display = currentMode === 'echo' ? 'flex' : 'none';

        // Rebuild audio graph if active
        if (isActive) {
            rebuildAudioGraph();
        }
    });
});

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
}

function hideError() {
    errorEl.classList.remove('visible');
}

function rebuildAudioGraph() {
    if (!audioContext || !sourceNode) return;

    // Disconnect existing nodes
    sourceNode.disconnect();
    if (delayNode) delayNode.disconnect();
    if (feedbackGainNode) feedbackGainNode.disconnect();
    if (outputGainNode) outputGainNode.disconnect();

    // Create new nodes
    delayNode = audioContext.createDelay(10);
    delayNode.delayTime.value = parseFloat(delaySlider.value);

    outputGainNode = audioContext.createGain();
    outputGainNode.gain.value = parseFloat(volumeSlider.value);

    if (currentMode === 'echo') {
        // Echo mode: feedback loop
        feedbackGainNode = audioContext.createGain();
        feedbackGainNode.gain.value = parseFloat(decaySlider.value);

        sourceNode.connect(delayNode);
        delayNode.connect(feedbackGainNode);
        feedbackGainNode.connect(delayNode); // Feedback loop
        delayNode.connect(outputGainNode);
        outputGainNode.connect(audioContext.destination);
    } else {
        // Simple delay mode
        feedbackGainNode = null;
        sourceNode.connect(delayNode);
        delayNode.connect(outputGainNode);
        outputGainNode.connect(audioContext.destination);
    }
}

async function startListening() {
    hideError();

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        rebuildAudioGraph();

        isActive = true;
        startBtn.textContent = '⏹';
        startBtn.classList.add('active');
        statusEl.textContent = 'Listening...';
        statusEl.classList.add('active');
        visualizer.classList.add('active');

    } catch (err) {
        console.error('Error accessing microphone:', err);
        if (err.name === 'NotAllowedError') {
            showError('Microphone access denied. Please allow microphone access to use this tool.');
        } else if (err.name === 'NotFoundError') {
            showError('No microphone found. Please connect a microphone.');
        } else {
            showError(`Error: ${err.message}`);
        }
    }
}

function stopListening() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    sourceNode = null;
    delayNode = null;
    feedbackGainNode = null;
    outputGainNode = null;

    isActive = false;
    startBtn.textContent = '▶';
    startBtn.classList.remove('active');
    statusEl.textContent = 'Click to start';
    statusEl.classList.remove('active');
    visualizer.classList.remove('active');
}

startBtn.addEventListener('click', () => {
    if (isActive) {
        stopListening();
    } else {
        startListening();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', stopListening);
