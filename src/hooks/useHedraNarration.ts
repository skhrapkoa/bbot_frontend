import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Хук для воспроизведения озвучки из Hedra видео
 * 
 * Файлы должны лежать в /public/narration/ с именами:
 * - round-1.mp4, round-2.mp4, ... - для каждого раунда/вопроса
 * 
 * Видео скрыто, воспроизводится только аудио-дорожка.
 */

interface UseHedraNarrationOptions {
  onEnd?: () => void;
  volume?: number;
}

export function useHedraNarration(options: UseHedraNarrationOptions = {}) {
  const { onEnd, volume = 1.0 } = options;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Создаём скрытый video элемент при монтировании
  useEffect(() => {
    const video = document.createElement('video');
    video.style.display = 'none';
    video.playsInline = true;
    document.body.appendChild(video);
    videoRef.current = video;

    return () => {
      video.pause();
      video.remove();
    };
  }, []);

  /**
   * Воспроизвести озвучку для конкретного раунда
   * @param roundOrder - номер раунда (1, 2, 3...)
   * @returns Promise который резолвится когда озвучка закончилась
   */
  const playRound = useCallback(async (roundOrder: number): Promise<void> => {
    const video = videoRef.current;
    if (!video) return;

    return new Promise((resolve) => {
      const src = `/narration/round-${roundOrder}.mp4`;
      
      setIsLoading(true);
      setError(null);
      
      video.src = src;
      video.volume = volume;
      
      const handleCanPlay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        video.play().catch((e) => {
          console.error('Failed to play narration:', e);
          setError('Не удалось воспроизвести озвучку');
          setIsPlaying(false);
          resolve();
        });
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        onEnd?.();
        resolve();
      };
      
      const handleError = () => {
        setIsLoading(false);
        setIsPlaying(false);
        // Файл не найден - резолвим сразу (fallback на другой TTS или тишину)
        console.warn(`Narration file not found: ${src}`);
        setError(`Файл озвучки не найден: ${src}`);
        resolve();
      };
      
      video.oncanplay = handleCanPlay;
      video.onended = handleEnded;
      video.onerror = handleError;
      video.load();
    });
  }, [volume, onEnd]);

  /**
   * Воспроизвести произвольный файл озвучки
   * @param filename - имя файла (напр. "intro.mp4" или "round-5.mp4")
   */
  const playFile = useCallback(async (filename: string): Promise<void> => {
    const video = videoRef.current;
    if (!video) return;

    return new Promise((resolve) => {
      const src = `/narration/${filename}`;
      
      setIsLoading(true);
      setError(null);
      
      video.src = src;
      video.volume = volume;
      
      const handleCanPlay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        video.play().catch((e) => {
          console.error('Failed to play narration:', e);
          setError('Не удалось воспроизвести озвучку');
          setIsPlaying(false);
          resolve();
        });
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        onEnd?.();
        resolve();
      };
      
      const handleError = () => {
        setIsLoading(false);
        setIsPlaying(false);
        console.warn(`Narration file not found: ${src}`);
        setError(`Файл не найден: ${src}`);
        resolve();
      };
      
      video.oncanplay = handleCanPlay;
      video.onended = handleEnded;
      video.onerror = handleError;
      video.load();
    });
  }, [volume, onEnd]);

  const stop = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return {
    playRound,
    playFile,
    stop,
    isPlaying,
    isLoading,
    error,
  };
}
