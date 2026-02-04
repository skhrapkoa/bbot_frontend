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
      const duplicated = [...photoUrls, ...photoUrls, ...photoUrls];
      const shuffled = duplicated.sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
    }
  }, []);

  const remainingGuests = useMemo(() => {
    const registered = registeredNames.map(n => n.toLowerCase().trim());
    return EXPECTED_GUESTS.filter(name => 
      !registered.some(r => r.includes(name.toLowerCase()) || name.toLowerCase().includes(r))
    );
  }, [registeredNames]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      
      {/* Top photo strip */}
      {photos.length > 0 && (
        <div className="h-32 flex-shrink-0 flex overflow-hidden">
          {photos.slice(0, 20).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="h-full aspect-[4/3] flex-shrink-0"
            >
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-8 py-6">
        
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-7xl lg:text-8xl font-black text-center text-white"
          style={{ textShadow: '0 0 60px rgba(255,107,157,0.5), 0 4px 20px rgba(0,0,0,0.5)' }}
        >
          🎉 {title} 🎉
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold mt-2 mb-6"
        >
          <span className="bg-gradient-to-r from-pink-500 to-rose-500 px-10 py-3 rounded-full inline-block shadow-xl">
            🎂 Юбилей 30 лет! 🎂
          </span>
        </motion.div>

        {/* Content row */}
        <div className="flex items-center justify-center gap-16 flex-1 w-full max-w-7xl">
          
          {/* QR Section */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white rounded-3xl p-5 shadow-2xl mb-4">
              <QRCode value={botLink} size={220} />
            </div>
            
            <p className="text-2xl md:text-3xl text-white font-bold text-center"
               style={{ textShadow: '0 2px 15px rgba(0,0,0,0.7)' }}>
              📱 Сканируй и введи имя!
            </p>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-green-500 px-8 py-3 rounded-2xl shadow-xl mt-4"
            >
              <span className="text-3xl font-black text-white">
                ✅ {playerCount} / {EXPECTED_GUESTS.length}
              </span>
            </motion.div>
          </motion.div>

          {/* Names panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/60 backdrop-blur-lg rounded-3xl p-8 border-4 border-pink-500/70 shadow-2xl"
          >
            <h2 className="text-3xl font-black text-center text-white mb-6">
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
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <AnimatePresence mode="popLayout">
                  {remainingGuests.map((name) => (
                    <motion.div
                      key={name}
                      layout
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                      className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-center shadow-lg"
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

      {/* Bottom photo strip */}
      {photos.length > 0 && (
        <div className="h-32 flex-shrink-0 flex overflow-hidden">
          {photos.slice(20, 40).map((photo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
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
