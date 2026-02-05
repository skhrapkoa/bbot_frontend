import { useState, useEffect } from 'react';

// Расширения для поиска фото
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

interface GuestPhotoProps {
  basePath: string;  // путь без расширения, например /guests/photo/Таня
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Компонент для загрузки фото гостя с автоматическим поиском расширения.
 * Пробует jpg, jpeg, png, webp по очереди.
 */
export function GuestPhoto({ basePath, alt = 'Guest', className, onLoad, onError }: GuestPhotoProps) {
  const [currentExtIndex, setCurrentExtIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reset when basePath changes
  useEffect(() => {
    setCurrentExtIndex(0);
    setLoaded(false);
    setFailed(false);
  }, [basePath]);

  const handleError = () => {
    // Try next extension
    if (currentExtIndex < EXTENSIONS.length - 1) {
      setCurrentExtIndex(prev => prev + 1);
    } else {
      // All extensions failed
      setFailed(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  if (failed) {
    // Fallback: show initials or placeholder
    const name = basePath.split('/').pop() || '?';
    return (
      <div className={`${className} bg-white/10 flex items-center justify-center text-4xl font-bold`}>
        {decodeURIComponent(name).charAt(0).toUpperCase()}
      </div>
    );
  }

  const currentUrl = `${basePath}.${EXTENSIONS[currentExtIndex]}`;

  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={{ opacity: loaded ? 1 : 0.5 }}
    />
  );
}
