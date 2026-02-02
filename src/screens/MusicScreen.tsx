import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer } from '../components/Timer';
import { Music, Volume2 } from 'lucide-react';

interface MusicScreenProps {
  songUrl: string;
  stopTs: string;
}

export function MusicScreen({ songUrl, stopTs }: MusicScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && songUrl) {
      audio.src = songUrl;
      audio.play().catch(console.log);
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [songUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <audio ref={audioRef} />

      {/* Animated music visualization */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative mb-12"
      >
        {/* Pulsing rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border-4 border-pink-500/30 rounded-full"
            animate={{
              scale: [1, 2, 2.5],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
            }}
            style={{ width: 200, height: 200 }}
          />
        ))}

        {/* Main icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-2xl glow-primary"
        >
          <Music className="w-24 h-24 text-white" />
        </motion.div>
      </motion.div>

      {/* Now playing text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold gradient-text mb-4">🎵 Now Playing</h1>
        <div className="flex items-center justify-center gap-3 text-white/70">
          <Volume2 className="w-6 h-6 animate-pulse" />
          <span className="text-xl">Listen carefully...</span>
        </div>
      </motion.div>

      {/* Timer */}
      <Timer deadline={stopTs} size="medium" />

      {/* Sound bars animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-end gap-2 h-24 mt-12"
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-4 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full"
            animate={{
              height: [20, 60 + Math.random() * 40, 20],
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
