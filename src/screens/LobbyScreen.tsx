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

export function LobbyScreen({ title, playerCount, botLink }: LobbyScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Photo collage background */}
      <PhotoCollage />

      {/* Floating confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl md:text-4xl"
            style={{ left: `${Math.random() * 100}%` }}
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: ['0vh', '105vh'],
              opacity: [0, 1, 1, 0],
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'linear',
            }}
          >
            {['🎉', '🎊', '✨', '🎈', '💖', '🌟', '🎁'][i % 7]}
          </motion.div>
        ))}
      </div>

      {/* Main content card */}
      <motion.div 
        className="relative z-20 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Glass card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl border border-white/20">
          
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-center mb-2 text-white drop-shadow-lg"
            style={{ textShadow: '0 0 40px rgba(255,107,157,0.5)' }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-center text-pink-300 font-semibold mb-8"
          >
            🎂 Юбилей 30 лет! 🎂
          </motion.p>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="flex justify-center mb-6"
          >
            <div className="bg-white rounded-2xl p-3 shadow-xl">
              <QRCode value={botLink} size={220} />
            </div>
          </motion.div>

          {/* Simple instruction */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-lg md:text-xl text-center text-white/90 font-medium mb-6"
          >
            📱 Сканируй и введи своё имя!
          </motion.p>

          {/* Player counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center"
          >
            <PlayerCounter count={playerCount} />
          </motion.div>
        </div>

        {/* Waiting indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 flex items-center gap-3 text-white/70"
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl"
          >
            ⏳
          </motion.span>
          <span className="text-lg">Ожидаем гостей...</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
