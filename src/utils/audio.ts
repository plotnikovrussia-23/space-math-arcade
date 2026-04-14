import type { AudioSettings } from "../types";

type SfxName = "shoot" | "success" | "damage" | "upgrade" | "click";

class AudioDirector {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings = {
    musicOn: true,
    sfxOn: true,
    voiceOn: true
  };
  private musicHandle: number | null = null;
  private unlocked = false;

  unlock() {
    if (this.unlocked) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const context =
      this.audioContext ?? new window.AudioContext({ latencyHint: "interactive" });
    this.audioContext = context;
    this.unlocked = true;

    if (context.state === "suspended") {
      void context.resume();
    }

    this.syncMusic();
  }

  updateSettings(settings: AudioSettings) {
    this.settings = settings;
    this.syncMusic();
  }

  private syncMusic() {
    if (typeof window === "undefined") {
      return;
    }

    if (!this.settings.musicOn || !this.unlocked) {
      if (this.musicHandle) {
        window.clearInterval(this.musicHandle);
        this.musicHandle = null;
      }
      return;
    }

    if (this.musicHandle) {
      return;
    }

    this.musicHandle = window.setInterval(() => {
      this.playChord([392, 523.25, 659.25], 0.08, 0.42);
    }, 2600);
  }

  private playTone(frequency: number, duration: number, volume: number) {
    if (!this.audioContext || !this.settings.sfxOn) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private playChord(frequencies: number[], duration: number, volume: number) {
    frequencies.forEach((frequency, index) => {
      this.playTone(frequency, duration + index * 0.02, volume / frequencies.length);
    });
  }

  playSfx(name: SfxName) {
    if (!this.unlocked || !this.settings.sfxOn) {
      return;
    }

    switch (name) {
      case "shoot":
        this.playTone(880, 0.08, 0.1);
        this.playTone(1320, 0.05, 0.06);
        break;
      case "success":
        this.playChord([660, 880, 1046], 0.18, 0.12);
        break;
      case "damage":
        this.playTone(210, 0.18, 0.16);
        this.playTone(160, 0.25, 0.12);
        break;
      case "upgrade":
        this.playChord([523.25, 783.99, 1046.5], 0.22, 0.14);
        break;
      case "click":
        this.playTone(640, 0.05, 0.08);
        break;
      default:
        break;
    }
  }

  speak(text: string) {
    if (
      !this.settings.voiceOn ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith("ru"));

    if (voices.length > 0) {
      utterance.voice = voices[0];
      utterance.lang = voices[0].lang;
    } else {
      utterance.lang = "ru-RU";
    }

    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

export const audioDirector = new AudioDirector();
