import { motion, AnimatePresence } from 'framer-motion';
import { QRCode } from '../components/QRCode';
import { useMemo } from 'react';

interface LobbyScreenProps {
  title: string;
  sessionCode: string;
  playerCount: number;
  botLink: string;
  registeredNames?: string[]; // Имена уже зарегистрированных
}

// Ожидаемые гости
const EXPECTED_GUESTS = [
  'Папа', 'Мама', 'Брат Коля', 'Ваня', 'Евгений', 'Евгения', 'Гриша',
  'Таня', 'Тетя Таня', 'Дядя Коля', 'Алена', 'Даник', 'Ульяна',
  'Матвей', 'Маша', 'Андрей', 'Елена', 'Ксюша'
];

export function LobbyScreen({ title, playerCount, botLink, registeredNames = [] }: LobbyScreenProps) {
  // Фильтруем - показываем только тех, кто ещё не зарегался
  const remainingGuests = useMemo(() => {
    const registered = registeredNames.map(n => n.toLowerCase().trim());
    return EXPECTED_GUESTS.filter(name => 
      !registered.some(r => r.includes(name.toLowerCase()) || name.toLowerCase().includes(r))
    );
  }, [registeredNames]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      
      {/* Top photo strip */}
      <div className="h-24 w-full overflow-hidden opacity-40">
        <div className="flex animate-scroll-left">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 mx-1 rounded" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8 py-6">
        <div className="w-full max-w-6xl">
          
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-center text-white mb-4"
            style={{ 
              textShadow: '0 0 80px rgba(255,107,157,0.6), 0 4px 30px rgba(0,0,0,0.8)'
            }}
          >
            🎉 {title} 🎉
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl text-center font-bold mb-10"
          >
            <span className="bg-gradient-to-r from-pink-500 to-rose-500 px-10 py-4 rounded-full inline-block shadow-2xl">
              🎂 Юбилей 30 лет! 🎂
            </span>
          </motion.div>

          {/* Main row: QR + Names */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20">
            
            {/* QR Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
                <QRCode value={botLink} size={300} />
              </div>
              
              <p className="text-3xl md:text-4xl text-center text-white font-bold mb-4"
                 style={{ textShadow: '0 2px 15px rgba(0,0,0,0.8)' }}>
                📱 Сканируй и введи имя!
              </p>
              
              {/* Player count */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-green-500 px-8 py-4 rounded-2xl shadow-xl"
              >
                <span className="text-4xl font-black text-white">
                  ✅ {playerCount} / {EXPECTED_GUESTS.length}
                </span>
              </motion.div>
            </motion.div>

            {/* Remaining guests */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/60 backdrop-blur-md rounded-3xl p-8 border-4 border-pink-500 shadow-2xl min-w-[400px]"
            >
              <h2 className="text-3xl md:text-4xl font-black text-center text-white mb-6">
                🔍 Ждём вас:
              </h2>
              
              {remainingGuests.length === 0 ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <span className="text-6xl">🎊</span>
                  <p className="text-3xl text-green-400 font-bold mt-4">Все на месте!</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {remainingGuests.map((name) => (
                      <motion.div
                        key={name}
                        layout
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                        className="px-5 py-4 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl text-center shadow-lg"
                      >
                        <span className="text-xl md:text-2xl text-white font-bold">
                          {name}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom photo strip */}
      <div className="h-24 w-full overflow-hidden opacity-40">
        <div className="flex animate-scroll-right">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 mx-1 rounded" />
          ))}
        </div>
      </div>

      {/* Waiting indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 px-8 py-4 rounded-full"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          ⏳
        </motion.span>
        <span className="text-2xl text-white font-semibold">Ожидаем гостей...</span>
      </motion.div>
    </div>
  );
}
