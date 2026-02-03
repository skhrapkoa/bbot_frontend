import { useCallback, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';

type Voice = 'dmitry' | 'svetlana';

interface EdgeTTSOptions {
  voice?: Voice;  // dmitry (мужской) или svetlana (женский)
}

export function useEdgeTTS(options: EdgeTTSOptions = {}) {
  const { voice = 'dmitry' } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // speak возвращает Promise который резолвится когда аудио закончилось
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Остановить предыдущее аудио
    stop();

    return new Promise((resolve) => {
      try {
        // Формируем URL с параметрами
        const params = new URLSearchParams({
          text: text.trim(),
          voice,
        });
        
        const audioUrl = `${API_BASE_URL}/api/tts/?${params}`;
        
        audioRef.current = new Audio(audioUrl);
        
        // Резолвим когда аудио закончилось
        audioRef.current.onended = () => resolve();
        audioRef.current.onerror = () => resolve();
        
        audioRef.current.play().catch(() => {
          fallbackSpeak(text);
          // Примерное время для fallback
          setTimeout(resolve, text.length * 80);
        });
      } catch (error) {
        console.error('Edge TTS error:', error);
        fallbackSpeak(text);
        setTimeout(resolve, text.length * 80);
      }
    });
  }, [voice, stop]);

  // Cleanup
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { speak, stop };
}

// Fallback на Web Speech API
function fallbackSpeak(text: string) {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Auto-speak hook
export function useAutoSpeakEdge(
  text: string | null | undefined,
  options: EdgeTTSOptions = {}
) {
  const { speak, stop } = useEdgeTTS(options);
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (text && text !== spokenRef.current) {
      spokenRef.current = text;
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
