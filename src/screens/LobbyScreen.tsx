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

// Ожидаемые гости
const EXPECTED_GUESTS = [
  'Папа', 'Мама', 'Брат Коля', 'Ваня', 'Евгений', 'Евгения', 'Гриша',
  'Таня', 'Тетя Таня', 'Дядя Коля', 'Алена', 'Даник', 'Ульяна',
  'Матвей', 'Маша', 'Андрей', 'Елена', 'Ксюша'
];

export function LobbyScreen({ title, playerCount, botLink }: LobbyScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Photo collage background */}
      <PhotoCollage />

      {/* Floating confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl md:text-6xl"
            style={{ left: `${Math.random() * 100}%` }}
            initial={{ y: -50, opacity: 0 }}
            animate={{ 
              y: ['0vh', '105vh'],
              opacity: [0, 1, 1, 0],
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 12,
              ease: 'linear',
            }}
          >
            {['🎉', '🎊', '✨', '🎈', '💖', '🌟', '🎁'][i % 7]}
          </motion.div>
        ))}
      </div>

      {/* Main content - TV optimized layout */}
      <motion.div 
        className="relative z-20 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left side - Title & QR */}
        <div className="flex flex-col items-center">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-center text-white mb-4"
            style={{ 
              textShadow: '0 0 60px rgba(255,107,157,0.8), 0 4px 20px rgba(0,0,0,0.8)',
              WebkitTextStroke: '2px rgba(255,255,255,0.3)'
            }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl text-center font-bold mb-8 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-xl"
          >
            🎂 Юбилей 30 лет! 🎂
          </motion.div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="bg-white rounded-3xl p-5 shadow-2xl mb-6"
          >
            <QRCode value={botLink} size={280} />
          </motion.div>

          {/* Instruction */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl md:text-3xl text-center text-white font-bold mb-4"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
          >
            📱 Сканируй QR и введи имя!
          </motion.p>

          {/* Player counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <PlayerCounter count={playerCount} />
          </motion.div>
        </div>

        {/* Right side - Guest list */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="backdrop-blur-xl bg-black/70 rounded-3xl p-8 shadow-2xl border-2 border-pink-500/50"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-6"
              style={{ textShadow: '0 0 20px rgba(255,107,157,0.5)' }}>
            🔍 Найди себя:
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl">
            {EXPECTED_GUESTS.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="px-4 py-3 bg-gradient-to-r from-pink-500/40 to-rose-500/40 rounded-xl text-center text-lg md:text-xl text-white font-bold border-2 border-white/30 shadow-lg"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
              >
                {name}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Waiting indicator - bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/50 px-8 py-4 rounded-full backdrop-blur-md"
      >
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-4xl"
        >
          ⏳
        </motion.span>
        <span className="text-2xl text-white font-semibold">Ожидаем гостей...</span>
      </motion.div>
    </div>
  );
}
