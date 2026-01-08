// CONFIG
const REDIRECT_URL = "https://soundcloud.com/rick-astley-official/never-gonna-give-you-up-4";
const BLOW_THRESHOLD = 0.22;   // sensitivity
const SAMPLE_INTERVAL = 80;    // ms

// DOM
const startButton = document.getElementById("start");
const cakeHolder  = document.getElementById("cake-holder");
const overlay     = document.getElementById("overlay");
const countdownEl = document.getElementById("countdown");

// STATE
let audioContext = null;
let analyser     = null;
let micStream    = null;
let dataArray    = null;
let monitorTimer = null;
let blown        = false;

// START BUTTON HANDLER
startButton.addEventListener("click", async () => {
  try {
    // fade in cake
    cakeHolder.style.transition = "opacity 1s ease-in";
    cakeHolder.style.opacity = "1";

    // show "Blow the candle"
    const msg = document.getElementById("blow-instruction");
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("show"), 50);

    // get mic
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.fftSize);

    source.connect(analyser);

    startButton.disabled = true;
    startButton.textContent = "Microphone active – blow";

    startMonitoring();
  } catch (e) {
    startButton.textContent = "Microphone blocked";
  }
});

// MONITOR AUDIO VOLUME
function startMonitoring() {
  monitorTimer = setInterval(() => {
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    if (rms > BLOW_THRESHOLD && !blown) {
      onBlow();
    }
  }, SAMPLE_INTERVAL);
}

// ONE BLOW → ALL FLAMES OUT
function onBlow() {
  blown = true;

  // stop monitoring
  if (monitorTimer) clearInterval(monitorTimer);
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
  }

  // add 'done' to cake-holder
  cakeHolder.classList.add("done");

  // show overlay + redirect
  showOverlayAndRedirect();
}

// OVERLAY + REDIRECT
function showOverlayAndRedirect() {
  if (!overlay || !countdownEl) return;

  overlay.classList.remove("hidden");

  let remaining = 6;
  countdownEl.textContent = remaining.toString();

  const timer = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = remaining.toString();

    if (remaining <= 0) {
      clearInterval(timer);
      window.location.href = REDIRECT_URL;
    }
  }, 1000);
}
