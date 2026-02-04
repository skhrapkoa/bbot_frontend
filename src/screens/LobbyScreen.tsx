import { motion, AnimatePresence } from 'framer-motion';
import { QRCode } from '../components/QRCode';
import { useMemo, useEffect, useState, useRef } from 'react';

// Lobby music playlist (files in /public/audio/lobby/)
const LOBBY_MUSIC = [
  '/audio/lobby/Sektor_Gaza_-_30_let_47992250.mp3',
  '/audio/lobby/Аллегрова Ирина - День рождения.mp3',
  '/audio/lobby/Игорь Николаев - Поздравляю.mp3',
  '/audio/lobby/Ирина Аллегрова - С днем рождения.mp3',
  '/audio/lobby/Чай вдвоем - День рождения.mp3',
  '/audio/lobby/Юрий Шатунов - С Днём Рождения.mp3',
  '/audio/lobby/igor-nikolaev-den-rozhdenija.mp3',
  '/audio/lobby/Николай Басков - День Рождения.mp3',
];

interface LobbyScreenProps {
  title: string;
  sessionCode: string;
  playerCount: number;
  botLink: string;
  registeredNames?: string[];
  removedGuests?: string[];
}

// Ожидаемые гости
const EXPECTED_GUESTS = [
  'Папа', 'Мама', 'Брат Коля', 'Ваня', 'Евгений', 'Евгения', 'Гриша',
  'Таня', 'Тетя Таня', 'Дядя Коля', 'Алена', 'Даник', 'Ульяна',
  'Матвей', 'Маша', 'Андрей', 'Елена', 'Ксюша'
];

// Import photos
const photoModules = import.meta.glob('/public/photos/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });

export function LobbyScreen({ title, playerCount, botLink, registeredNames = [], removedGuests = [] }: LobbyScreenProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [musicStarted, setMusicStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffledRef = useRef<string[]>([]);
  const currentIndexRef = useRef(-1);

  // Load photos
  useEffect(() => {
    const photoUrls = Object.values(photoModules) as string[];
    if (photoUrls.length > 0) {
      const duplicated = [...photoUrls, ...photoUrls, ...photoUrls];
      const shuffled = duplicated.sort(() => Math.random() - 0.5);
      setPhotos(shuffled);
    }
  }, []);

  // Function to play next track with fade (full song, no skip)
  const playNext = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    currentIndexRef.current++;
    if (currentIndexRef.current >= shuffledRef.current.length) {
      shuffledRef.current = [...LOBBY_MUSIC].sort(() => Math.random() - 0.5);
      currentIndexRef.current = 0;
    }
    
    audio.src = shuffledRef.current[currentIndexRef.current];
    audio.volume = 0;
    audio.play().then(() => {
      setMusicStarted(true);
      // Fade in
      const fadeIn = setInterval(() => {
        if (audio.volume < 0.38) {
          audio.volume = Math.min(0.4, audio.volume + 0.02);
        } else {
          clearInterval(fadeIn);
          audio.volume = 0.4;
        }
      }, 50);
    }).catch(() => {});
  };

  // Initialize audio and try autoplay
  useEffect(() => {
    shuffledRef.current = [...LOBBY_MUSIC].sort(() => Math.random() - 0.5);
    const audio = new Audio();
    audioRef.current = audio;

    // Handle track end
    const handleEnded = () => playNext();
    audio.addEventListener('ended', handleEnded);

    // Try autoplay immediately
    currentIndexRef.current = 0;
    audio.src = shuffledRef.current[0];
    audio.volume = 0;
    
    audio.play().then(() => {
      setMusicStarted(true);
      // Fade in
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol += 0.02;
        if (vol < 0.4) {
          audio.volume = vol;
        } else {
          clearInterval(fadeIn);
          audio.volume = 0.4;
        }
      }, 50);
    }).catch(() => {
      // Autoplay blocked - start on any interaction
      const startOnInteraction = () => {
        if (!musicStarted) {
          playNext();
        }
        document.removeEventListener('click', startOnInteraction);
        document.removeEventListener('touchstart', startOnInteraction);
        document.removeEventListener('keydown', startOnInteraction);
      };
      document.addEventListener('click', startOnInteraction);
      document.addEventListener('touchstart', startOnInteraction);
      document.addEventListener('keydown', startOnInteraction);
    });

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const remainingGuests = useMemo(() => {
    const registered = registeredNames.map(n => n.toLowerCase().trim());
    return EXPECTED_GUESTS.filter(name => {
      // Скрываем зарегистрированных
      const isRegistered = registered.some(r => r.includes(name.toLowerCase()) || name.toLowerCase().includes(r));
      // Скрываем удалённых хостом
      const isRemoved = removedGuests.includes(name);
      return !isRegistered && !isRemoved;
    });
  }, [registeredNames, removedGuests]);

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
            
            {/* Текстовая ссылка для тех кто не может сканировать */}
            <p className="text-lg text-white/70 text-center mt-2 select-all cursor-pointer"
               style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}
               onClick={() => navigator.clipboard.writeText(botLink)}>
              или открой: <span className="text-pink-400 underline">{botLink.replace('https://', '')}</span>
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

      {/* Hint to tap if music not playing */}
      {!musicStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white text-xl font-bold px-6 py-3 rounded-full"
        >
          👆 Тапни куда угодно для музыки
        </motion.div>
      )}
    </div>
  );
}
