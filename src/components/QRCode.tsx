import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 250 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple QR placeholder - in production use qrcode library
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw placeholder pattern
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = 'black';
    const cellSize = size / 25;
    
    // Draw random QR-like pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Position markers
        const isPositionMarker = 
          (i < 7 && j < 7) || 
          (i < 7 && j > 17) || 
          (i > 17 && j < 7);
        
        if (isPositionMarker) {
          const isOuter = i === 0 || i === 6 || j === 0 || j === 6 ||
                         i === 18 || i === 24 || j === 18 || j === 24;
          const isInner = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
                         (i >= 2 && i <= 4 && j >= 20 && j <= 22) ||
                         (i >= 20 && i <= 22 && j >= 2 && j <= 4);
          if (isOuter || isInner) {
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        } else if (Math.random() > 0.5) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="bg-white p-6 rounded-3xl shadow-2xl"
    >
      <canvas ref={canvasRef} width={size} height={size} />
    </motion.div>
  );
}
