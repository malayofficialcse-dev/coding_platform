// Web Audio API Ringtone & Chime Synthesizer
// Provides realistic calling ringtone, incoming chime, and end-call beep without external mp3 assets.

let audioCtx = null;
let currentInterval = null;
let activeNodes = [];

function getAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function stopRingtone() {
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
  activeNodes.forEach((node) => {
    try {
      node.stop && node.stop();
      node.disconnect && node.disconnect();
    } catch (_) {}
  });
  activeNodes = [];
}

/**
 * Plays standard outgoing phone ring (dual 440Hz + 480Hz tone)
 * 1.5s tone on, 2.5s silence cycle
 */
export function playOutgoingRingtone() {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playPulse = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.45);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);

      activeNodes.push(osc1, osc2, gain);
    } catch (err) {
      console.warn("Unable to play outgoing ringtone:", err);
    }
  };

  playPulse();
  currentInterval = setInterval(playPulse, 4000);
}

/**
 * Plays modern pleasant incoming ringtone (melodic chime arpeggio)
 */
export function playIncomingRingtone() {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  const playMelody = () => {
    try {
      const start = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start + idx * 0.16);

        const noteTime = start + idx * 0.16;
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
        activeNodes.push(osc, gain);
      });
    } catch (err) {
      console.warn("Unable to play incoming ringtone:", err);
    }
  };

  playMelody();
  currentInterval = setInterval(playMelody, 2200);
}

/**
 * Short gentle beep when call ends
 */
export function playCallEndTone() {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (_) {}
}
