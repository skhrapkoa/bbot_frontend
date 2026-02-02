import { motion } from 'framer-motion';
import { QRCode } from '../components/QRCode';
import { PlayerCounter } from '../components/PlayerCounter';

interface LobbyScreenProps {
  title: string;
  sessionCode: string;
  playerCount: number;
  botLink: string;
}

export function LobbyScreen({ title, sessionCode, playerCount, botLink }: LobbyScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-500/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{ 
              y: [null, Math.random() * -200, null],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl md:text-8xl font-bold text-center mb-4 gradient-text"
      >
        {title}
      </motion.h1>

      {/* Session code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="glass rounded-2xl px-8 py-4 text-center">
          <div className="text-sm text-white/50 mb-1">Session Code</div>
          <div className="text-5xl font-bold tracking-widest text-pink-500">
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
        <QRCode value={botLink} size={280} />
      </motion.div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xl text-center text-white/70 mb-8 max-w-lg"
      >
        Scan QR code or open{' '}
        <span className="text-pink-500 font-semibold">{botLink}</span>
        {' '}to join the game!
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
        className="mt-12 flex items-center gap-2"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-3 h-3 bg-pink-500 rounded-full"
        />
        <span className="text-white/50">Waiting for host to start...</span>
      </motion.div>
    </div>
  );
}
