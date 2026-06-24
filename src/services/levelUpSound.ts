/**
 * Level-Up Sound Effects — FitQuest
 *
 * Plays sound effects for level-ups, skill unlocks, and workout completion.
 * Gracefully degrades when the expo-av native module is unavailable (e.g., Expo Go).
 * When unavailable, all functions become silent no-ops.
 */

// ─── Conditional native module import ──────────────────────────
// expo-av's Audio module throws "Cannot find native module 'ExponentAV'"
// in Expo Go because it requires native build linking.
// We catch that here so the app doesn't crash on import.

let AV: any = null;

try {
  // Dynamic require avoids static import failure
  AV = require("expo-av");
} catch {
  // expo-av native module is not available — sound functions become no-ops
  console.warn("[levelUpSound] expo-av not available, sounds disabled");
}

// ─── Sound state ────────────────────────────────────────────────

let soundObject: any = null;

// ─── Core helpers ───────────────────────────────────────────────

/**
 * Check if sound is available (native module loaded successfully).
 */
function isSoundAvailable(): boolean {
  return AV !== null;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Play the level-up chime sound effect.
 * Gracefully degrades if expo-av native module is unavailable.
 */
export async function playLevelUpSound(): Promise<void> {
  if (!isSoundAvailable()) return;

  try {
    const Audio = AV.Audio;
    const Sound = Audio.Sound;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const source = { uri: generateLevelUpChimeDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Sound();
    await soundObject.loadAsync(source, { volume: 0.4 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional — silently fail
  }
}

/**
 * Play the workout completion sound (a satisfying thud/chord).
 */
export async function playCompletionSound(): Promise<void> {
  if (!isSoundAvailable()) return;

  try {
    const Audio = AV.Audio;
    const Sound = Audio.Sound;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const source = { uri: generateCompletionChordDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Sound();
    await soundObject.loadAsync(source, { volume: 0.3 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional
  }
}

/**
 * Play the skill unlock sound (a clean rising "pop" / click).
 * Short frequency sweep from 600Hz → 900Hz, 200ms, with a percussive attack.
 */
export async function playSkillUnlockSound(): Promise<void> {
  if (!isSoundAvailable()) return;

  try {
    const Audio = AV.Audio;
    const Sound = Audio.Sound;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const source = { uri: generateSkillUnlockDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Sound();
    await soundObject.loadAsync(source, { volume: 0.35 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional
  }
}

/**
 * Play the skill mastery sound (a triumphant shimmer / arpeggio).
 * C major arpeggio: C5→E5→G5→C6 over 450ms with a slight sustain.
 */
export async function playSkillMasterySound(): Promise<void> {
  if (!isSoundAvailable()) return;

  try {
    const Audio = AV.Audio;
    const Sound = Audio.Sound;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const source = { uri: generateSkillMasteryDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Sound();
    await soundObject.loadAsync(source, { volume: 0.4 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional
  }
}

/**
 * Play a skill tree sound with priority-based debouncing.
 * If multiple calls happen within 150ms, only the highest-priority sound plays.
 * Priorities: mastery (3) > unlock (2) > none.
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPriority = 0;

const SOUND_PRIORITY: Record<string, number> = {
  mastery: 3,
  unlock: 2,
};

export function playSkillSound(type: "unlock" | "mastery"): void {
  const priority = SOUND_PRIORITY[type] ?? 0;

  if (debounceTimer) {
    // Accumulate highest priority
    if (priority > pendingPriority) {
      pendingPriority = priority;
    }
    return;
  }

  pendingPriority = priority;

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const activeType = pendingPriority >= 3 ? "mastery" : "unlock";
    pendingPriority = 0;

    if (activeType === "mastery") {
      playSkillMasterySound();
    } else {
      playSkillUnlockSound();
    }
  }, 100);
}

/** Clean up sound resources */
export async function cleanupSound(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    pendingPriority = 0;
  }
  if (soundObject) {
    try {
      await soundObject.unloadAsync();
    } catch {
      // Ignore cleanup errors
    }
    soundObject = null;
  }
}

// ─── WAV generation (pure JS — no native deps) ──────────────────

/**
 * Generate a tiny WAV file as a data URI containing a level-up chime.
 * Three ascending tones (C5→E5→G5) played as short sine wave pulses.
 */
function generateLevelUpChimeDataUri(): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * 0.3); // 300ms total
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeWavHeader(view, sampleRate, numSamples);

  // Three ascending tones: C5 (523Hz), E5 (659Hz), G5 (784Hz)
  const frequencies = [523, 659, 784];
  const samplesPerNote = Math.floor(numSamples / 3);

  for (let i = 0; i < numSamples; i++) {
    const noteIndex = Math.min(Math.floor(i / samplesPerNote), 2);
    const freq = frequencies[noteIndex];
    const noteStart = noteIndex * samplesPerNote;
    const notePos = (i - noteStart) / samplesPerNote;

    // Apply ADSR envelope: quick attack, sustain, quick release
    let envelope: number;
    if (notePos < 0.05) {
      envelope = notePos / 0.05;
    } else if (notePos > 0.85) {
      envelope = (1 - notePos) / 0.15;
    } else {
      envelope = 1.0;
    }

    // Sine wave with slight harmonics for richness
    const sample =
      (Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.4 +
        Math.sin((2 * Math.PI * freq * 2 * i) / sampleRate) * 0.15) *
      envelope;

    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convert to base64 data URI
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Generate a short rising sweep tone for skill unlocks.
 * Frequency sweep from 600Hz → 900Hz over 200ms with percussive attack.
 */
function generateSkillUnlockDataUri(): string {
  const sampleRate = 22050;
  const duration = 0.2; // 200ms
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeWavHeader(view, sampleRate, numSamples);

  const startFreq = 600;
  const endFreq = 900;

  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const freq = startFreq + (endFreq - startFreq) * t;

    // Percussive envelope: fast attack (5ms), quick decay
    let envelope: number;
    if (t < 0.025) {
      envelope = t / 0.025;
    } else {
      envelope = Math.max(0, 1 - (t - 0.025) / 0.175);
    }

    // Sine + slight harmonics for clarity
    const sample =
      (Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.45 +
        Math.sin((2 * Math.PI * freq * 2 * i) / sampleRate) * 0.1) *
      envelope;

    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Generate a triumphant arpeggio for skill mastery.
 * C major: C5(523Hz)→E5(659Hz)→G5(784Hz)→C6(1047Hz) over 450ms.
 * Each note overlaps slightly for a shimmering effect.
 */
function generateSkillMasteryDataUri(): string {
  const sampleRate = 22050;
  const duration = 0.45; // 450ms
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeWavHeader(view, sampleRate, numSamples);

  // Arpeggio: C5, E5, G5, C6 with overlap
  const notes = [
    { freq: 523, start: 0.0, end: 0.35 },
    { freq: 659, start: 0.08, end: 0.4 },
    { freq: 784, start: 0.16, end: 0.45 },
    { freq: 1047, start: 0.24, end: 0.45 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.start && t < note.end) {
        const noteT = (t - note.start) / (note.end - note.start);
        // Each note fades in and out
        let envelope: number;
        if (noteT < 0.1) {
          envelope = noteT / 0.1;
        } else if (noteT > 0.7) {
          envelope = Math.max(0, (1 - noteT) / 0.3);
        } else {
          envelope = 1.0;
        }

        sample += Math.sin((2 * Math.PI * note.freq * i) / sampleRate) * 0.3 * envelope;
      }
    }

    // Master the volume (max sum of 4 overlapping notes ≈ 1.2)
    sample *= 0.8;

    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Generate a rich major chord (C major: C4+E4+G4) as a sustained WAV tone.
 */
function generateCompletionChordDataUri(): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * 0.5); // 500ms
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeWavHeader(view, sampleRate, numSamples);

  // C major chord: C4 (262Hz), E4 (330Hz), G4 (392Hz)
  const frequencies = [262, 330, 392];

  for (let i = 0; i < numSamples; i++) {
    const pos = i / numSamples;
    const envelope = pos < 0.02 ? pos / 0.02 : Math.max(0, 1 - pos * 0.5);

    let sample = 0;
    for (const freq of frequencies) {
      sample += Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.25;
    }
    sample *= envelope;

    const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// ─── WAV header utilities ───────────────────────────────────────

/**
 * Write a standard 16-bit mono WAV header to the DataView.
 */
function writeWavHeader(view: DataView, sampleRate: number, numSamples: number) {
  const byteRate = sampleRate * 2;
  const dataSize = numSamples * 2;

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
