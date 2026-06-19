import { Audio, AVPlaybackSource } from "expo-av";
import { Platform } from "react-native";

let soundObject: Audio.Sound | null = null;

/**
 * Play the level-up chime sound effect.
 * Gracefully degrades if the sound file isn't available or loading fails.
 *
 * To add a real audio file:
 * 1. Place a short WAV/MP3 file at assets/sounds/levelup.mp3
 * 2. Uncomment the require() line below
 * 3. Remove the Platform check
 */
export async function playLevelUpSound() {
  try {
    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Sound source — add a real audio file to assets/sounds/ and uncomment:
    // const source: AVPlaybackSource = require("../../assets/sounds/levelup.mp3");

    // Fallback: generate a simple tone sequence using tiny base64 WAV
    // This creates a short ascending chime (C5 → E5 → G5) as a WAV
    const source: AVPlaybackSource = { uri: generateLevelUpChimeDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Audio.Sound();
    await soundObject.loadAsync(source, { volume: 0.4 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional — silently fail
  }
}

/**
 * Generate a tiny WAV file as a data URI containing a level-up chime.
 * Three ascending tones (C5→E5→G5) played as short sine wave pulses.
 * This avoids needing an actual audio file in the repo.
 */
function generateLevelUpChimeDataUri(): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * 0.3); // 300ms total
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
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
      envelope = notePos / 0.05; // attack
    } else if (notePos > 0.85) {
      envelope = (1 - notePos) / 0.15; // release
    } else {
      envelope = 1.0; // sustain
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
 * Write a standard 16-bit mono WAV header to the DataView.
 */
function writeWavHeader(view: DataView, sampleRate: number, numSamples: number) {
  const byteRate = sampleRate * 2; // 16-bit mono
  const dataSize = numSamples * 2;

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Play the workout completion sound (a satisfying thud/chord).
 */
export async function playCompletionSound() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const source: AVPlaybackSource = { uri: generateCompletionChordDataUri() };

    if (soundObject) {
      await soundObject.unloadAsync();
    }

    soundObject = new Audio.Sound();
    await soundObject.loadAsync(source, { volume: 0.3 });
    await soundObject.playAsync();
  } catch {
    // Sound is optional
  }
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
    // Quick attack, then fade out
    let envelope = pos < 0.02 ? pos / 0.02 : Math.max(0, 1 - pos * 0.5);

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

/** Clean up sound resources */
export async function cleanupSound() {
  if (soundObject) {
    try {
      await soundObject.unloadAsync();
    } catch {
      // Ignore cleanup errors
    }
    soundObject = null;
  }
}
