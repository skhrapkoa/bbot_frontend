import { motion, AnimatePresence } from 'framer-motion';
import { QRCode } from '../components/QRCode';
import { useMemo, useEffect, useState } from 'react';

interface LobbyScreenProps {
  title: string;
  sessionCode: string;
  playerCount: number;
  botLink: string;
  registeredNames?: string[];
}

// Ожидаемые гости
const EXPECTED_GUESTS = [
  'Папа', 'Мама', 'Брат Коля', 'Ваня', 'Евгений', 'Евгения', 'Гриша',
  'Таня', 'Тетя Таня', 'Дядя Коля', 'Алена', 'Даник', 'Ульяна',
  'Матвей', 'Маша', 'Андрей', 'Елена', 'Ксюша'
];

// Import photos
const photoModules = import.meta.glob('/public/photos/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });

export function LobbyScreen({ title, playerCount, botLink, registeredNames = [] }: LobbyScreenProps) {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const photoUrls = Object.values(photoModules) as string[];
    if (photoUrls.length > 0) {
      const shuffled = [...photoUrls].sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
    }
  }, []);

  // Фильтруем - показываем только тех, кто ещё не зарегался
  const remainingGuests = useMemo(() => {
    const registered = registeredNames.map(n => n.toLowerCase().trim());
    return EXPECTED_GUESTS.filter(name => 
      !registered.some(r => r.includes(name.toLowerCase()) || name.toLowerCase().includes(r))
    );
  }, [registeredNames]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      
      {/* Top photo strip */}
      {photos.length > 0 && (
        <div className="h-28 flex-shrink-0 flex overflow-hidden">
          {photos.slice(0, 12).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full aspect-square flex-shrink-0"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8 py-4 min-h-0">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-7xl">
          
          {/* Left side: Title + QR */}
          <div className="flex flex-col items-center">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-center text-white mb-2"
              style={{ textShadow: '0 0 60px rgba(255,107,157,0.6)' }}
            >
              🎉 {title}
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-4xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3 rounded-full inline-block">
                🎂 Юбилей 30 лет! 🎂
              </span>
            </motion.div>

            {/* QR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-4 shadow-2xl mb-4"
            >
              <QRCode value={botLink} size={240} />
            </motion.div>
            
            <p className="text-2xl md:text-3xl text-white font-bold mb-3"
               style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              📱 Сканируй и введи имя!
            </p>
            
            {/* Counter */}
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-green-500 px-6 py-3 rounded-xl shadow-xl"
            >
              <span className="text-3xl font-black text-white">
                ✅ {playerCount} / {EXPECTED_GUESTS.length}
              </span>
            </motion.div>
          </div>

          {/* Right side: Guest list */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/70 backdrop-blur-md rounded-2xl p-6 border-4 border-pink-500 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl font-black text-center text-white mb-4">
              🔍 Ждём вас:
            </h2>
            
            {remainingGuests.length === 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center py-6"
              >
                <span className="text-5xl">🎊</span>
                <p className="text-2xl text-green-400 font-bold mt-3">Все на месте!</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {remainingGuests.map((name) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                      className="px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg text-center shadow-lg"
                    >
                      <span className="text-lg md:text-xl text-white font-bold">
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

      {/* Bottom photo strip */}
      {photos.length > 0 && (
        <div className="h-28 flex-shrink-0 flex overflow-hidden">
          {photos.slice(12, 24).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full aspect-square flex-shrink-0"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
