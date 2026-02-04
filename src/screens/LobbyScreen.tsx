import { motion } from 'framer-motion';
import { QRCode } from '../components/QRCode';
import { PlayerCounter } from '../components/PlayerCounter';
import { PhotoCollage } from '../components/PhotoCollage';

interface LobbyScreenProps {
  title: string;
  sessionCode: string;
  playerCount: number;
  botLink: string;
}

const confettiColors = ['#ff6b9d', '#ffd700', '#ff85a2', '#ffed4a', '#c44569', '#f8b500'];

export function LobbyScreen({ title, sessionCode, playerCount, botLink }: LobbyScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Photo collage background */}
      <PhotoCollage />

      {/* Animated confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              width: Math.random() > 0.5 ? '8px' : '12px',
              height: Math.random() > 0.5 ? '8px' : '6px',
            }}
            initial={{ y: -100, rotate: 0, opacity: 0 }}
            animate={{ 
              y: ['0vh', '110vh'],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ 
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Sparkle effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="sparkle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Party emoji */}
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="party-emoji mb-2"
        >
          🎉
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-center mb-6 gradient-text text-glow drop-shadow-2xl"
        >
          {title}
        </motion.h1>

        {/* Anniversary badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
          className="anniversary-badge mb-8 flex items-center gap-2"
        >
          <span>✨</span>
          <span>ЮБИЛЕЙ 30 ЛЕТ</span>
          <span>✨</span>
        </motion.div>

        {/* Session code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="glass rounded-3xl px-10 py-6 text-center glow-primary">
            <div className="text-sm text-white/60 mb-2 uppercase tracking-widest font-medium">Код сессии</div>
            <div className="text-5xl md:text-6xl font-black tracking-[0.2em] gradient-text-gold">
              {sessionCode}
            </div>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="glass rounded-3xl p-4 glow-primary">
            <QRCode value={botLink} size={260} />
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-center text-white/80 mb-8 max-w-lg font-medium"
        >
          Сканируй QR код или открой{' '}
          <span className="text-[#ff6b9d] font-bold">{botLink}</span>
          {' '}чтобы присоединиться!
        </motion.p>

        {/* Player counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <PlayerCounter count={playerCount} />
        </motion.div>

        {/* Waiting animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 flex items-center gap-3 glass px-6 py-3 rounded-full"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-3 h-3 bg-[#ffd700] rounded-full shadow-lg"
            style={{ boxShadow: '0 0 10px #ffd700' }}
          />
          <span className="text-white/70 font-medium">Ожидаем начала игры...</span>
        </motion.div>
      </div>
    </div>
  );
}
