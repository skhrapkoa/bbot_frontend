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
      // Дублируем чтобы заполнить всё пространство
      const duplicated = [...photoUrls, ...photoUrls, ...photoUrls];
      const shuffled = duplicated.sort(() => Math.random() - 0.5);
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
      
      {/* Top photo strip - БОЛЬШИЕ ФОТКИ */}
      {photos.length > 0 && (
        <div className="h-36 flex-shrink-0 flex overflow-hidden">
          {photos.slice(0, 20).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="h-full aspect-[4/3] flex-shrink-0"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 min-h-0">
        
        {/* Title row */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-center text-white mb-2"
          style={{ textShadow: '0 0 60px rgba(255,107,157,0.6)' }}
        >
          🎉 {title} 🎉
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-4xl font-bold mb-4"
        >
          <span className="bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3 rounded-full inline-block">
            🎂 Юбилей 30 лет! 🎂
          </span>
        </motion.div>

        {/* QR + Names row - горизонтально и ШИРОКО */}
        <div className="flex items-start justify-center gap-12 w-full max-w-6xl">
          
          {/* QR Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl mb-3">
              <QRCode value={botLink} size={200} />
            </div>
            
            <p className="text-xl md:text-2xl text-white font-bold mb-2"
               style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              📱 Сканируй и введи имя!
            </p>
            
            {/* Counter */}
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-green-500 px-5 py-2 rounded-xl shadow-xl"
            >
              <span className="text-2xl font-black text-white">
                ✅ {playerCount} / {EXPECTED_GUESTS.length}
              </span>
            </motion.div>
          </motion.div>

          {/* Guest list - ШИРОКИЙ */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/70 backdrop-blur-md rounded-2xl p-5 border-4 border-pink-500 shadow-2xl flex-1 max-w-3xl"
          >
            <h2 className="text-xl md:text-2xl font-black text-center text-white mb-3">
              🔍 Ждём вас:
            </h2>
            
            {remainingGuests.length === 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center py-4"
              >
                <span className="text-4xl">🎊</span>
                <p className="text-xl text-green-400 font-bold mt-2">Все на месте!</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <AnimatePresence mode="popLayout">
                  {remainingGuests.map((name) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                      className="px-3 py-2 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg text-center shadow-lg"
                    >
                      <span className="text-base md:text-lg text-white font-bold whitespace-nowrap">
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

      {/* Bottom photo strip - БОЛЬШИЕ ФОТКИ */}
      {photos.length > 0 && (
        <div className="h-36 flex-shrink-0 flex overflow-hidden">
          {photos.slice(20, 40).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="h-full aspect-[4/3] flex-shrink-0"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
