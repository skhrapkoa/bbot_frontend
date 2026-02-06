import { useCallback, useRef, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

/**
 * Хук для генерации TTS через Hedra API с твоим кастомным голосом
 * 
 * Требуется:
 * - VITE_HEDRA_API_KEY - API ключ от Hedra
 * - VITE_HEDRA_VOICE_ID - ID твоего голоса (из профиля Hedra)
 * 
 * Если ключи не заданы - fallback на бэкенд прокси
 */

const HEDRA_API_KEY = import.meta.env.VITE_HEDRA_API_KEY;
const HEDRA_VOICE_ID = import.meta.env.VITE_HEDRA_VOICE_ID;
const HEDRA_API_URL = 'https://api.hedra.com/web-app/public';

interface UseHedraTTSOptions {
  speed?: number;
  stability?: number;
  language?: string;
}

interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

export function useHedraTTS(options: UseHedraTTSOptions = {}) {
  const { speed = 1, stability = 0.5, language = 'auto' } = options;
  
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Генерация через прямой Hedra API (может не работать из-за CORS)
  const generateViaHedra = useCallback(async (text: string, signal: AbortSignal): Promise<string> => {
    // 1. Запустить генерацию TTS
    const createResponse = await fetch(`${HEDRA_API_URL}/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': HEDRA_API_KEY!,
      },
      body: JSON.stringify({
        type: 'text_to_speech',
        voice_id: HEDRA_VOICE_ID,
        text,
        speed,
        stability,
        language,
      }),
      signal,
    });

    if (!createResponse.ok) {
      const err = await createResponse.json().catch(() => ({}));
      throw new Error(err.detail || `Hedra error: ${createResponse.status}`);
    }

    const generation = await createResponse.json();
    const generationId = generation.id;

    // Если уже есть asset с URL - сразу вернуть
    if (generation.status === 'complete' && generation.asset?.asset?.url) {
      return generation.asset.asset.url;
    }

    // 2. Polling статуса через list endpoint
    for (let i = 0; i < 30; i++) {
      if (signal.aborted) throw new Error('Aborted');
      await new Promise(r => setTimeout(r, 500));

      const statusResponse = await fetch(`${HEDRA_API_URL}/generations?limit=1`, {
        headers: { 'X-API-Key': HEDRA_API_KEY! },
        signal,
      });

      const list = await statusResponse.json();
      const gen = list.data?.find((g: { id: string }) => g.id === generationId);
      
      if (gen?.status === 'complete' && gen.asset?.asset?.url) {
        return gen.asset.asset.url;
      }
      
      if (gen?.status === 'error') {
        throw new Error(gen.error_message || 'Hedra TTS generation failed');
      }
    }
    
    throw new Error('Hedra timeout');
  }, [speed, stability, language]);

  // Генерация через бэкенд (обход CORS)
  const generateViaBackend = useCallback(async (text: string, signal: AbortSignal): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/hedra-tts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: HEDRA_VOICE_ID,
        speed,
        stability,
        language,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Backend Hedra TTS failed');
    }

    const data = await response.json();
    
    // Если уже готово — используем прокси URL вместо прямого Hedra CDN (CORS/ORB)
    if (data.audio_url && data.task_id) {
      return `${API_BASE_URL}/api/hedra-tts/${data.task_id}/audio/`;
    }
    if (data.audio_url) {
      // Fallback: нет task_id, но есть url — попробуем напрямую
      return data.audio_url;
    }
    
    // Polling
    const taskId = data.task_id;
    for (let i = 0; i < 60; i++) {
      if (signal.aborted) throw new Error('Aborted');
      await new Promise(r => setTimeout(r, 1000));
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/hedra-tts/${taskId}/status/`, { signal });
      const status = await statusResponse.json();
      
      if (status.status === 'completed' && status.audio_url) {
        // Возвращаем проксированный URL вместо прямого Hedra CDN
        return `${API_BASE_URL}/api/hedra-tts/${taskId}/audio/`;
      }
      if (status.status === 'failed') {
        throw new Error(status.error || 'Generation failed');
      }
    }
    
    throw new Error('Timeout');
  }, [speed, stability, language]);

  /**
   * Озвучить текст через Hedra TTS
   * @returns Promise который резолвится когда аудио закончилось
   */
  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      setState(s => ({ ...s, isLoading: true, error: null }));
      
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let audioUrl: string;
        
        // Пробуем напрямую, если есть API ключ
        if (HEDRA_API_KEY && HEDRA_VOICE_ID) {
          try {
            audioUrl = await generateViaHedra(text, controller.signal);
          } catch (e) {
            console.warn('Direct Hedra API failed (CORS?), trying backend:', e);
            audioUrl = await generateViaBackend(text, controller.signal);
          }
        } else {
          // Через бэкенд
          audioUrl = await generateViaBackend(text, controller.signal);
        }

        setState(s => ({ ...s, isLoading: false, isPlaying: false }));

        // Воспроизвести
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onplay = () => {
          setState(s => ({ ...s, isPlaying: true }));
        };
        
        audioRef.current.onended = () => {
          setState(s => ({ ...s, isPlaying: false }));
          resolve();
        };
        
        audioRef.current.onerror = () => {
          const err = new Error('Audio playback error');
          setState(s => ({ ...s, isPlaying: false, error: err.message }));
          reject(err);
        };
        
        audioRef.current.play().catch((e) => {
          const err = new Error(e?.message || 'Audio play failed');
          setState(s => ({ ...s, isPlaying: false, error: err.message }));
          reject(err);
        });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState(s => ({ ...s, isLoading: false, error: errorMessage }));
        reject(error);
      }
    });
  }, [generateViaHedra, generateViaBackend]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState({ isLoading: false, isPlaying: false, error: null });
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    speak,
    stop,
    isConfigured: !!(HEDRA_API_KEY && HEDRA_VOICE_ID),
    ...state,
  };
}
