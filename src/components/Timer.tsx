import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
  deadline: string | null;
  size?: 'large' | 'medium';
  onEnd?: () => void;
}

export function Timer({ deadline, size = 'large', onEnd }: TimerProps) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!deadline) {
      setSeconds(null);
      endedRef.current = false;
      return;
    }

    const update = () => {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setSeconds(diff);
      
      // Вызываем onEnd когда таймер достигает 0 (только один раз)
      if (diff === 0 && !endedRef.current) {
        endedRef.current = true;
        onEnd?.();
      }
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [deadline, onEnd]);

  if (seconds === null) return null;

  const isWarning = seconds <= 5;
  const sizeClasses = size === 'large' 
    ? 'text-[12rem] w-80 h-80' 
    : 'text-6xl w-32 h-32';

  return (
    <motion.div
      className={`relative flex items-center justify-center ${sizeClasses}`}
      animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: isWarning ? Infinity : 0 }}
    >
      {/* Background ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke={isWarning ? '#f44336' : '#e94560'}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 1 }}
          animate={{ pathLength: seconds / 30 }}
          transition={{ duration: 0.3 }}
          style={{ filter: `drop-shadow(0 0 10px ${isWarning ? '#f44336' : '#e94560'})` }}
        />
      </svg>

      {/* Number */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={seconds}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`font-bold ${isWarning ? 'text-red-500' : 'text-white'}`}
          style={{ textShadow: `0 0 50px ${isWarning ? '#f44336' : '#e94560'}` }}
        >
          {seconds}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
