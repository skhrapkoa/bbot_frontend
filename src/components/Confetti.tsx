import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
}

const COLORS = ['#e94560', '#ffd700', '#00ff88', '#00d4ff', '#ff6b9d', '#a855f7'];

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 10 + 5,
        duration: Math.random() * 2 + 2,
      });
    }
    setParticles(newParticles);

    const timeout = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: `${particle.x}vw`, 
            y: -20, 
            rotate: 0,
            opacity: 1,
          }}
          animate={{ 
            y: '110vh', 
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{ 
            duration: particle.duration,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
}
