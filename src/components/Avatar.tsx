import { forwardRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarProps {
  isPlaying?: boolean;
  isLoading?: boolean;
  videoRef?: (el: HTMLVideoElement | null) => void;
  fallbackImageUrl?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showIdleAnimation?: boolean;
}

const AVATAR_IMAGE_URL = import.meta.env.VITE_AVATAR_IMAGE_URL || '/avatar-idle.png';

const sizeClasses = {
  small: 'w-32 h-32',
  medium: 'w-48 h-48',
  large: 'w-64 h-64',
};

export const Avatar = forwardRef<HTMLVideoElement, AvatarProps>(({
  isPlaying = false,
  isLoading = false,
  videoRef,
  fallbackImageUrl = AVATAR_IMAGE_URL,
  size = 'medium',
  className = '',
  showIdleAnimation = true,
}, ref) => {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      setShowVideo(true);
      setVideoError(false);
    }
  }, [isPlaying]);

  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    setShowVideo(false);
  };

  const combinedRef = (el: HTMLVideoElement | null) => {
    videoRef?.(el);
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      ref.current = el;
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-xl" />
      
      {/* Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
        <AnimatePresence mode="wait">
          {/* Loading state */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </motion.div>
          )}

          {/* Video playing */}
          {showVideo && !videoError && (
            <motion.video
              key="video"
              ref={combinedRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={false}
              onEnded={handleVideoEnd}
              onError={handleVideoError}
            />
          )}

          {/* Idle state - static image with optional animation */}
          {!showVideo && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <motion.img
                src={fallbackImageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                animate={showIdleAnimation ? {
                  scale: [1, 1.02, 1],
                } : undefined}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-pink-500 rounded-full"
                animate={{
                  scaleY: [1, 2, 1],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Avatar.displayName = 'Avatar';
