import { useCallback, useRef, useEffect } from 'react';

const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
// Голоса: Adam (мужской), Rachel (женский), Antoni (мужской драматичный)
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

interface ElevenLabsOptions {
  stability?: number;
  similarityBoost?: number;
  model?: string;
}

export function useElevenLabsTTS(options: ElevenLabsOptions = {}) {
  const { 
    stability = 0.5, 
    similarityBoost = 0.75,
    model = 'eleven_multilingual_v2'
  } = options;
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!ELEVEN_LABS_API_KEY) {
      console.warn('ElevenLabs API key not configured, falling back to Web Speech');
      fallbackSpeak(text);
      return;
    }

    // Cancel previous
    stop();

    try {
      abortRef.current = new AbortController();
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
            },
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      
      // Cleanup URL after playback
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('ElevenLabs TTS error:', error);
        fallbackSpeak(text);
      }
    }
  }, [stability, similarityBoost, model]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { speak, stop };
}

// Fallback to Web Speech API
function fallbackSpeak(text: string) {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Auto-speak hook for ElevenLabs
export function useAutoSpeakElevenLabs(
  text: string | null | undefined, 
  options: ElevenLabsOptions = {}
) {
  const { speak, stop } = useElevenLabsTTS(options);
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
