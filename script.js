// Текущий год в подвале.
document.getElementById("year").textContent = new Date().getFullYear();

// Появление блоков при прокрутке.
const revealItems = document.querySelectorAll(
  ".section-head, .about-grid, .chips, .card, .player, .contacts-grid"
);

if ("IntersectionObserver" in window) {
  revealItems.forEach((item) => item.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealItems.forEach((item) => observer.observe(item));
}

// --- Мини-плеер на Web Audio API (без внешних аудиофайлов) ---
const playBtn = document.getElementById("playMelody");
const playIcon = document.getElementById("playIcon");
const playerStatus = document.getElementById("playerStatus");
const equalizer = document.getElementById("equalizer");
const bars = equalizer.querySelectorAll("i");
const keys = document.querySelectorAll(".key");

let audioCtx = null;
let analyser = null;
let master = null;
let isPlaying = false;
let melodyTimer = null;
let rafId = null;

// Частоты нот октавы + верхняя «до».
const melody = [
  [523.25, 1], [659.25, 1], [783.99, 2], [659.25, 1],
  [523.25, 1], [587.33, 1], [659.25, 2],
  [493.88, 1], [523.25, 1], [587.33, 1], [523.25, 3]
];
const beat = 0.34; // секунды на одну долю

function ensureAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    playerStatus.textContent = "Ваш браузер не поддерживает Web Audio";
    return false;
  }
  if (!audioCtx) {
    audioCtx = new Ctx();
    master = audioCtx.createGain();
    master.gain.value = 0.22;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    master.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return true;
}

function playTone(freq, when, duration, velocity = 1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.9 * velocity, when + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

function highlightKey(freq) {
  const key = Array.from(keys).find(
    (k) => Math.abs(parseFloat(k.dataset.freq) - freq) < 0.5
  );
  if (!key) return;
  key.classList.add("active");
  setTimeout(() => key.classList.remove("active"), 220);
}

function drawEqualizer() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  bars.forEach((bar, i) => {
    const value = data[i + 1] || 0;
    bar.style.height = Math.max(6, Math.min(46, value / 3.2)) + "px";
  });
  if (isPlaying) rafId = requestAnimationFrame(drawEqualizer);
}

function pulseEqualizer() {
  if (isPlaying) return;
  equalizer.classList.add("is-active");
  bars.forEach((bar) => { bar.style.height = (10 + Math.random() * 30) + "px"; });
  setTimeout(() => {
    if (isPlaying) return;
    equalizer.classList.remove("is-active");
    bars.forEach((bar) => { bar.style.height = "10px"; });
  }, 450);
}

function stopMelody() {
  clearTimeout(melodyTimer);
  cancelAnimationFrame(rafId);
  isPlaying = false;
  playBtn.classList.remove("is-playing");
  playIcon.textContent = "▶";
  playerStatus.textContent = "Нажмите, чтобы услышать короткую мелодию";
  equalizer.classList.remove("is-active");
  bars.forEach((bar) => { bar.style.height = "10px"; });
}

function playMelody() {
  if (!ensureAudio()) return;
  if (isPlaying) {
    stopMelody();
    return;
  }

  isPlaying = true;
  playBtn.classList.add("is-playing");
  playIcon.textContent = "■";
  playerStatus.textContent = "Играет мелодия приветствия ♪";
  equalizer.classList.add("is-active");

  const start = audioCtx.currentTime + 0.06;
  let cursor = 0;

  melody.forEach(([freq, beats]) => {
    const when = start + cursor * beat;
    playTone(freq, when, beats * beat * 0.9);
    const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
    setTimeout(() => highlightKey(freq), delay);
    cursor += beats;
  });

  drawEqualizer();
  melodyTimer = setTimeout(stopMelody, (cursor * beat + 0.4) * 1000);
}

playBtn.addEventListener("click", playMelody);

keys.forEach((key) => {
  key.addEventListener("click", () => {
    if (!ensureAudio()) return;
    const freq = parseFloat(key.dataset.freq);
    playTone(freq, audioCtx.currentTime, 0.55);
    key.classList.add("active");
    setTimeout(() => key.classList.remove("active"), 220);
    pulseEqualizer();
  });
});
