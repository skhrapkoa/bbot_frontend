import { useCallback, useRef, useState, useEffect } from 'react';

const D_ID_API_KEY = import.meta.env.VITE_DID_API_KEY;
const AVATAR_IMAGE_URL = import.meta.env.VITE_AVATAR_IMAGE_URL;
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID;

// Стандартные фразы с прекэшированными видео
// Ключ = текст (нормализованный), значение = URL видео
const CACHED_VIDEOS: Record<string, string> = {
  'время пошло! у вас 20 секунд.': '/avatar-cache/time-started.mp4',
  'правильный ответ...': '/avatar-cache/correct-answer.mp4',
  'правильно ответили:': '/avatar-cache/who-correct.mp4',
  'ошиблись:': '/avatar-cache/who-incorrect.mp4',
  'добро пожаловать в игру!': '/avatar-cache/welcome.mp4',
  'следующий вопрос...': '/avatar-cache/next-question.mp4',
  'игра окончена!': '/avatar-cache/game-over.mp4',
};

// Нормализация текста для поиска в кэше
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// Проверяем, начинается ли текст с кэшированной фразы
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
  fallbackToAudio?: boolean; // Если D-ID недоступен, использовать только ElevenLabs
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

  // Генерация видео через D-ID API
  const generateVideo = useCallback(async (text: string): Promise<string> => {
    if (!D_ID_API_KEY || !AVATAR_IMAGE_URL) {
      throw new Error('D-ID not configured');
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // 1. Создаём talk
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
        config: {
          fluent: true,
          pad_audio: 0.5,
        },
      }),
      signal: controller.signal,
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`D-ID create error: ${createResponse.status} - ${error}`);
    }

    const { id: talkId } = await createResponse.json();

    // 2. Поллинг до готовности
    let attempts = 0;
    const maxAttempts = 60; // 60 секунд максимум
    
    while (attempts < maxAttempts) {
      if (controller.signal.aborted) {
        throw new Error('Aborted');
      }

      await new Promise(r => setTimeout(r, 1000));
      
      const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        headers: {
          'Authorization': `Basic ${D_ID_API_KEY}`,
        },
        signal: controller.signal,
      });

      if (!statusResponse.ok) {
        throw new Error(`D-ID status error: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      
      if (status.status === 'done' && status.result_url) {
        return status.result_url;
      }
      
      if (status.status === 'error') {
        throw new Error(`D-ID generation failed: ${status.error?.message || 'Unknown error'}`);
      }

      attempts++;
    }

    throw new Error('D-ID timeout');
  }, []);

  // Проиграть видео (с кэшем или генерацией)
  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      setState(s => ({ ...s, isLoading: true, error: null }));

      try {
        // Проверяем кэш
        const cached = findCachedPrefix(text);
        let videoUrl: string;
        let remainingText: string | null = null;

        if (cached) {
          // Используем кэшированное видео для начала фразы
          videoUrl = cached.cachedUrl;
          remainingText = cached.remainder || null;
        } else {
          // Генерируем через D-ID
          videoUrl = await generateVideo(text);
        }

        setState(s => ({ ...s, isLoading: false, isPlaying: true, videoUrl }));

        // Ждём окончания видео
        if (videoRef.current) {
          videoRef.current.src = videoUrl;
          
          const handleEnded = async () => {
            videoRef.current?.removeEventListener('ended', handleEnded);
            
            // Если есть остаток текста, генерируем и играем его
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
              } catch (e) {
                // Fallback: просто заканчиваем
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
          // Fallback к Web Speech
          console.warn('D-ID failed, falling back to speech:', errorMessage);
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

  // Установка ref видео элемента
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
    ...state,
  };
}

// Fallback на Web Speech
function fallbackSpeak(text: string) {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Список стандартных фраз для прегенерации
export const STANDARD_PHRASES = Object.keys(CACHED_VIDEOS);
