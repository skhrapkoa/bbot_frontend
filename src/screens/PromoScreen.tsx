import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PromoScreenProps {
  onComplete: () => void;
}

export function PromoScreen({ onComplete }: PromoScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try to play automatically
    video.play().catch(() => {
      // If autoplay fails, user needs to click
      console.log('Autoplay blocked, waiting for interaction');
    });
  }, []);

  const handleEnded = () => {
    onComplete();
  };

  const handleClick = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src="/video/promo.mp4"
        className="w-full h-full object-contain"
        onEnded={handleEnded}
        playsInline
        autoPlay
      />
      
      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute bottom-8 right-8 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-bold transition-colors"
      >
        Пропустить →
      </motion.button>
    </motion.div>
  );
}
