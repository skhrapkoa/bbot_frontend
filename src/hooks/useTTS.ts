import { useCallback, useEffect, useRef } from 'react';

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: string; // voice name substring to match
}

export function useTTS(options: TTSOptions = {}) {
  const { lang = 'ru-RU', rate = 1, pitch = 1, voice } = options;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (voice) {
      return voices.find(v => v.name.toLowerCase().includes(voice.toLowerCase())) || null;
    }
    // Prefer Russian voices
    return voices.find(v => v.lang.startsWith('ru')) || voices[0] || null;
  }, [voice]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    const selectedVoice = getVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, getVoice]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, stop, pause, resume };
}

// Auto-speak hook - speaks text when it changes
export function useAutoSpeak(text: string | null | undefined, options: TTSOptions = {}) {
  const { speak, stop } = useTTS(options);
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (text && text !== spokenRef.current) {
      spokenRef.current = text;
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        speak(text);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [text, speak]);

  useEffect(() => {
    return () => stop();
  }, [stop]);
}
