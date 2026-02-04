import { useCallback, useRef, useState, useEffect } from 'react';

// Поддержка D-ID (платный) или Replicate/SadTalker (бесплатный)
const D_ID_API_KEY = import.meta.env.VITE_DID_API_KEY;
const REPLICATE_API_KEY = import.meta.env.VITE_REPLICATE_API_KEY;
const AVATAR_IMAGE_URL = import.meta.env.VITE_AVATAR_IMAGE_URL;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;
const API_URL = import.meta.env.VITE_API_URL || '';

// Какой провайдер использовать
// Приоритет: backend (через API) > did > replicate (напрямую не работает из браузера)
const PROVIDER: 'did' | 'replicate' | 'backend' | null = 
  API_URL ? 'backend' :  // Replicate через бэкенд - работает!
  D_ID_API_KEY ? 'did' : 
  null;

// Стандартные фразы с прекэшированными видео
const CACHED_VIDEOS: Record<string, string> = {
  'время пошло! у вас 20 секунд.': '/avatar-cache/time-started.mp4',
  'правильный ответ...': '/avatar-cache/correct-answer.mp4',
  'правильно ответили:': '/avatar-cache/who-correct.mp4',
  'ошиблись:': '/avatar-cache/who-incorrect.mp4',
  'добро пожаловать в игру!': '/avatar-cache/welcome.mp4',
  'следующий вопрос...': '/avatar-cache/next-question.mp4',
  'игра окончена!': '/avatar-cache/game-over.mp4',
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function findCachedPrefix(text: string): { cachedUrl: string; remainder: string } | null {
  const normalized = normalizeText(text);
  
  for (const [phrase, url] of Object.entries(CACHED_VIDEOS)) {
    if (normalized.startsWith(phrase)) {
      const remainder = text.slice(phrase.length).trim();
      return { cachedUrl: url, remainder };
    }
  }
  return null;
}

interface AvatarState {
  isLoading: boolean;
  isPlaying: boolean;
  videoUrl: string | null;
  error: string | null;
}

interface UseAvatarVideoOptions {
  onVideoEnd?: () => void;
  fallbackToAudio?: boolean;
}

export function useAvatarVideo(options: UseAvatarVideoOptions = {}) {
  const { onVideoEnd, fallbackToAudio = true } = options;
  
  const [state, setState] = useState<AvatarState>({
    isLoading: false,
    isPlaying: false,
    videoUrl: null,
    error: null,
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ========== D-ID Provider ==========
  const generateViaDID = useCallback(async (text: string, signal: AbortSignal): Promise<string> => {
    const createResponse = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: AVATAR_IMAGE_URL,
        script: {
          type: 'text',
          input: text,
          provider: ELEVENLABS_VOICE_ID ? {
            type: 'elevenlabs',
            voice_id: ELEVENLABS_VOICE_ID,
          } : {
            type: 'microsoft',
            voice_id: 'ru-RU-DmitryNeural',
          },
        },
        config: { fluent: true, pad_audio: 0.5 },
      }),
      signal,
    });

    if (!createResponse.ok) {
      throw new Error(`D-ID error: ${createResponse.status}`);
    }

    const { id: talkId } = await createResponse.json();

    // Polling
    for (let i = 0; i < 60; i++) {
      if (signal.aborted) throw new Error('Aborted');
      await new Promise(r => setTimeout(r, 1000));
      
      const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: { 'Authorization': `Basic ${D_ID_API_KEY}` },
        signal,
      });

      const status = await statusResponse.json();
      if (status.status === 'done' && status.result_url) return status.result_url;
      if (status.status === 'error') throw new Error('D-ID generation failed');
    }
    throw new Error('D-ID timeout');
  }, []);

  // ========== Replicate/SadTalker Provider ==========
  const generateViaReplicate = useCallback(async (text: string, signal: AbortSignal): Promise<string> => {
    // Шаг 1: Генерируем аудио через бэкенд
    const audioResponse = await fetch(`${API_URL}/api/tts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: 'ru' }),
      signal,
    });
    
    if (!audioResponse.ok) throw new Error('TTS generation failed');
    const { audio_url } = await audioResponse.json();

    // Шаг 2: Отправляем в SadTalker через Replicate
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'cjwbw/sadtalker:a519cc0cfebaaeade068b23899165a11ec76aaa1a2ca5c6dc62c60c7de34e768',
        input: {
          source_image: AVATAR_IMAGE_URL,
          driven_audio: audio_url,
          enhancer: 'gfpgan',
        },
      }),
      signal,
    });

    if (!createResponse.ok) throw new Error('Replicate error');
    const prediction = await createResponse.json();

    // Polling
    for (let i = 0; i < 120; i++) {
      if (signal.aborted) throw new Error('Aborted');
      await new Promise(r => setTimeout(r, 2000));
      
      const statusResponse = await fetch(prediction.urls.get, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` },
        signal,
      });
      
      const status = await statusResponse.json();
      if (status.status === 'succeeded' && status.output) return status.output;
      if (status.status === 'failed') throw new Error('SadTalker failed');
    }
    throw new Error('Replicate timeout');
  }, []);

  // ========== Backend Provider (async с polling) ==========
  const generateViaBackend = useCallback(async (text: string, signal: AbortSignal): Promise<string> => {
    // Шаг 1: Запускаем генерацию
    const startResponse = await fetch(`${API_URL}/api/avatar-video/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        image_url: AVATAR_IMAGE_URL,
      }),
      signal,
    });
    
    if (!startResponse.ok) {
      const err = await startResponse.json().catch(() => ({}));
      throw new Error(err.error || 'Backend avatar generation failed');
    }
    
    const startData = await startResponse.json();
    
    // Если уже есть готовое видео (из кеша)
    if (startData.video_url) {
      return startData.video_url;
    }
    
    const taskId = startData.task_id;
    if (!taskId) throw new Error('No task ID returned');
    
    // Шаг 2: Polling статуса
    for (let i = 0; i < 180; i++) { // 6 минут максимум
      if (signal.aborted) throw new Error('Aborted');
      
      await new Promise(r => setTimeout(r, 2000));
      
      const statusResponse = await fetch(`${API_URL}/api/avatar-video/${taskId}/status/`, {
        signal,
      });
      
      if (!statusResponse.ok) continue;
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed' && statusData.video_url) {
        return statusData.video_url;
      }
      
      if (statusData.status === 'failed') {
        throw new Error(statusData.error || 'Generation failed');
      }
      
      // pending или processing - продолжаем polling
    }
    
    throw new Error('Timeout waiting for video');
  }, []);

  // ========== Main generate function ==========
  const generateVideo = useCallback(async (text: string): Promise<string> => {
    const controller = new AbortController();
    abortRef.current = controller;

    // Для backend провайдера изображение настроено на сервере
    if (PROVIDER !== 'backend' && !AVATAR_IMAGE_URL) {
      throw new Error('Avatar image not configured');
    }

    switch (PROVIDER) {
      case 'did':
        return generateViaDID(text, controller.signal);
      case 'replicate':
        return generateViaReplicate(text, controller.signal);
      case 'backend':
        return generateViaBackend(text, controller.signal);
      default:
        throw new Error('No avatar provider configured');
    }
  }, [generateViaDID, generateViaReplicate, generateViaBackend]);

  // ========== Speak function ==========
  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      setState(s => ({ ...s, isLoading: true, error: null }));

      try {
        // Проверяем кэш
        const cached = findCachedPrefix(text);
        let videoUrl: string;
        let remainingText: string | null = null;

        if (cached) {
          videoUrl = cached.cachedUrl;
          remainingText = cached.remainder || null;
        } else {
          videoUrl = await generateVideo(text);
        }

        setState(s => ({ ...s, isLoading: false, isPlaying: true, videoUrl }));

        if (videoRef.current) {
          videoRef.current.src = videoUrl;
          
          const handleEnded = async () => {
            videoRef.current?.removeEventListener('ended', handleEnded);
            
            if (remainingText) {
              try {
                const nextUrl = await generateVideo(remainingText);
                videoRef.current!.src = nextUrl;
                videoRef.current!.play();
                
                videoRef.current!.addEventListener('ended', () => {
                  setState(s => ({ ...s, isPlaying: false }));
                  onVideoEnd?.();
                  resolve();
                }, { once: true });
              } catch {
                setState(s => ({ ...s, isPlaying: false }));
                onVideoEnd?.();
                resolve();
              }
            } else {
              setState(s => ({ ...s, isPlaying: false }));
              onVideoEnd?.();
              resolve();
            }
          };

          videoRef.current.addEventListener('ended', handleEnded, { once: true });
          videoRef.current.play().catch(reject);
        } else {
          resolve();
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState(s => ({ ...s, isLoading: false, error: errorMessage }));
        
        if (fallbackToAudio && errorMessage !== 'Aborted') {
          console.warn('Avatar generation failed, falling back to speech:', errorMessage);
          fallbackSpeak(text);
        }
        
        reject(error);
      }
    });
  }, [generateVideo, onVideoEnd, fallbackToAudio]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setState(s => ({ ...s, isPlaying: false, isLoading: false }));
  }, []);

  const setVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    speak,
    stop,
    setVideoElement,
    provider: PROVIDER,
    ...state,
  };
}

function fallbackSpeak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export const STANDARD_PHRASES = Object.keys(CACHED_VIDEOS);
export { PROVIDER as AVATAR_PROVIDER };
