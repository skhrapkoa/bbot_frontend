import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VideoInterludeScreenProps {
  videoNumber: number;
  onComplete: () => void;
}

export function VideoInterludeScreen({ videoNumber, onComplete }: VideoInterludeScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const completedRef = useRef(false);

  // Guard against double-calling onComplete
  const handleComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    completedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      console.log('Video autoplay blocked, waiting for interaction');
    });

    const timer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(timer);
  }, [videoNumber]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      onClick={() => {
        const video = videoRef.current;
        if (video?.paused) video.play();
      }}
    >
      <video
        ref={videoRef}
        src={`/video/interludes/${videoNumber}.mp4`}
        className="w-full h-full object-contain"
        onEnded={handleComplete}
        onError={handleComplete}
        playsInline
        autoPlay
      />
      
      {showSkip && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (video) {
              video.pause();
              video.src = '';
            }
            handleComplete();
          }}
          className="absolute bottom-8 right-8 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-bold transition-colors"
        >
          Пропустить →
        </motion.button>
      )}
    </motion.div>
  );
}
