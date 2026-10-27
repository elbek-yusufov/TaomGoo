import { create } from 'zustand';

interface SoundState {
  soundEnabled: boolean;
  toggleSound: () => void;
  playNewOrderSound: () => void;
  playSuccessSound: () => void;
  playAlertSound: () => void;
}

const STORAGE_KEY_SOUND = 'taomgo_sound_enabled';

// Procedural audio synthesizer using Web Audio API (zero external mp3/wav files)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  soundEnabled: (() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SOUND) === 'true';
    } catch {
      return false;
    }
  })(),

  toggleSound: () => {
    set((state) => {
      const next = !state.soundEnabled;
      try {
        localStorage.setItem(STORAGE_KEY_SOUND, String(next));
      } catch (e) {
        console.error(e);
      }
      return { soundEnabled: next };
    });
  },

  playNewOrderSound: () => {
    if (!get().soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      // Friendly dual-tone chime (E5 -> G5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.5, now); // E6 overtone

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback not permitted yet', e);
    }
  },

  playSuccessSound: () => {
    if (!get().soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn(e);
    }
  },

  playAlertSound: () => {
    if (!get().soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  },
}));
