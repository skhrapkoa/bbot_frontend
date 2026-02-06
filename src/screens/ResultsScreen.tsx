import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptionCard } from '../components/OptionCard';
import { Leaderboard } from '../components/Leaderboard';
import { Confetti } from '../components/Confetti';
import { GuestPhoto } from '../components/GuestPhoto';
import { useHedraTTS } from '../hooks/useHedraTTS';
import type { RoundResults, PlayerResult, Round } from '../types';

// Музыка для результатов
const RESULTS_MUSIC = [
  '/audio/lobby/Sektor_Gaza_-_30_let_47992250.mp3',
  '/audio/lobby/Аллегрова Ирина - День рождения.mp3',
  '/audio/lobby/Игорь Николаев - Поздравляю.mp3',
  '/audio/lobby/Ирина Аллегрова - С днем рождения.mp3',
  '/audio/lobby/Чай вдвоем - День рождения.mp3',
  '/audio/lobby/Юрий Шатунов - С Днём Рождения.mp3',
  '/audio/lobby/igor-nikolaev-den-rozhdenija.mp3',
  '/audio/lobby/Николай Басков - День Рождения.mp3',
];

interface ResultsScreenProps {
  results: RoundResults;
  round?: Round;
  showConfetti?: boolean;
}

// Компонент аватара игрока с fallback на инициалы
function PlayerAvatar({ 
  name, 
  photoUrl, 
  borderClass, 
  size = 'md' 
}: { 
  name: string; 
  photoUrl?: string; 
  borderClass: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);
  
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-lg' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-xl';
  
  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 ${borderClass}`}
        onError={() => setImgError(true)}
      />
    );
  }
  
  return (
    <div className={`${sizeClass} rounded-full bg-white/10 flex items-center justify-center border-2 ${borderClass}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// Компонент для отображения списка игроков с фото
function PlayersList({ 
  players, 
  title, 
  icon, 
  color 
}: { 
  players: PlayerResult[]; 
  title: string; 
  icon: string;
  color: 'green' | 'red';
}) {
  if (players.length === 0) return null;
  
  const bgClass = color === 'green' ? 'from-green-500/20 to-emerald-500/20' : 'from-red-500/20 to-rose-500/20';
  const borderClass = color === 'green' ? 'border-green-500/30' : 'border-red-500/30';
  const textClass = color === 'green' ? 'text-green-400' : 'text-red-400';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-4 bg-gradient-to-br ${bgClass} border ${borderClass}`}
    >
      <h4 className={`text-lg font-bold mb-3 flex items-center gap-2 ${textClass}`}>
        <span>{icon}</span> {title} ({players.length})
      </h4>
      <div className="flex flex-wrap gap-3">
        {players.map((player, idx) => (
          <motion.div
            key={player.name + idx}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="flex flex-col items-center gap-1"
          >
            <PlayerAvatar 
              name={player.name} 
              photoUrl={player.photo_url} 
              borderClass={borderClass} 
            />
            <span className="text-xs text-white/70 max-w-[60px] truncate">{player.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ResultsScreen({ results, round, showConfetti = true }: ResultsScreenProps) {
  const { 
    question_text, 
    options, 
    correct_option, 
    correct_answer_text,
    option_stats, 
    total_answers, 
    leaderboard,
    image_url,
    correct_players = [],
    incorrect_players = [],
    // Photo Guess fields
    is_photo_guess,
    guest_name,
    reveal_photo_url
  } = results;
  
  // TTS: только Hedra
  const hedraTTS = useHedraTTS();
  
  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      await hedraTTS.speak(text);
    } catch (e) {
      console.warn('🔊 Hedra TTS failed:', e);
    }
  }, [hedraTTS]);
  
  const spokenRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const songReplayRef = useRef<HTMLAudioElement | null>(null);
  
  const isMusic = round?.block_type === 'music';
  
  // Фазы: 'stats' (распределение) -> 'leaderboard' (таблица лидеров)
  const [phase, setPhase] = useState<'stats' | 'leaderboard'>('stats');
  // Для music раунда: показывать анимацию прослушивания пока играет обрывок
  const [songReplaying, setSongReplaying] = useState(false);

  // Запуск фоновой музыки (НЕ для music раундов — там будет реплей песни)
  useEffect(() => {
    if (isMusic) return; // Для music раунда музыку запускаем после реплея песни
    
    const randomTrack = RESULTS_MUSIC[Math.floor(Math.random() * RESULTS_MUSIC.length)];
    const audio = new Audio(randomTrack);
    audio.volume = 0.3;
    audio.loop = true;
    audioRef.current = audio;
    
    audio.play().catch(err => console.log('Audio play error:', err));
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [isMusic]);

  // Cleanup all audio on unmount
  useEffect(() => {
    return () => {
      if (songReplayRef.current) {
        songReplayRef.current.pause();
        songReplayRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Озвучка результатов
  useEffect(() => {
    if (spokenRef.current === results.round_id) return;
    spokenRef.current = results.round_id;
    
    const runSequence = async () => {
      // Озвучка правильного ответа
      try {
        if (is_photo_guess && guest_name) {
          await speak(`Это ${guest_name}!`);
        } else {
          await speak(`Время вышло! Правильный ответ: ${correct_answer_text}`);
        }
      } catch (e) {
        console.warn('Results TTS failed:', e);
      }
      
      // Для music раунда: reveal clip → fade out → пауза → песня продолжает фоном
      if (isMusic && round?.song_url) {
        setSongReplaying(true);
        const revealStart = round.reveal_start_seconds ?? round.song_start_seconds ?? 0;
        const revealEnd = round.reveal_end_seconds ?? round.song_end_seconds ?? (revealStart + (round.song_duration_seconds || 15));
        const clipDuration = revealEnd - revealStart;
        
        console.log(`🎵 REVEAL: Playing song [${revealStart}s - ${revealEnd}s]`);
        
        const songAudio = new Audio(round.song_url);
        songReplayRef.current = songAudio;
        
        try {
          songAudio.volume = 0.8;
          // Ждём загрузки метаданных, потом seek
          await new Promise<void>((resolve, reject) => {
            songAudio.addEventListener('loadedmetadata', () => {
              songAudio.currentTime = revealStart;
              resolve();
            }, { once: true });
            songAudio.addEventListener('error', () => reject(new Error('Audio load error')), { once: true });
            songAudio.load();
          });
          await songAudio.play();
          
          // Ждём пока обрывок доиграет
          await new Promise(r => setTimeout(r, clipDuration * 1000));
          
          // Fade out за 1.5 секунды
          const fadeSteps = 15;
          const fadeInterval = 1500 / fadeSteps;
          const volumeStep = songAudio.volume / fadeSteps;
          for (let i = 0; i < fadeSteps; i++) {
            await new Promise(r => setTimeout(r, fadeInterval));
            songAudio.volume = Math.max(0, songAudio.volume - volumeStep);
          }
          
          // Ставим на паузу и убираем анимацию
          songAudio.pause();
          setSongReplaying(false);
          
          // 2 секунды тишины
          await new Promise(r => setTimeout(r, 2000));
          
          // Продолжаем с reveal_end до конца песни, fade in
          songAudio.currentTime = revealEnd;
          songAudio.volume = 0;
          
          // Когда песня закончится — переключиться на плейлист
          songAudio.onended = () => {
            const randomTrack = RESULTS_MUSIC[Math.floor(Math.random() * RESULTS_MUSIC.length)];
            const bgAudio = new Audio(randomTrack);
            bgAudio.volume = 0.3;
            bgAudio.loop = true;
            audioRef.current = bgAudio;
            bgAudio.play().catch(() => {});
          };
          
          await songAudio.play();
          
          // Fade in до 0.3
          const targetVolume = 0.3;
          const fadeInSteps = 10;
          const fadeInInterval = 800 / fadeInSteps;
          const fadeInStep = targetVolume / fadeInSteps;
          for (let i = 0; i < fadeInSteps; i++) {
            await new Promise(r => setTimeout(r, fadeInInterval));
            songAudio.volume = Math.min(targetVolume, songAudio.volume + fadeInStep);
          }
          
          // Сохраняем как основное аудио (для cleanup)
          audioRef.current = songAudio;
          songReplayRef.current = null;
        } catch (e) {
          console.warn('Song replay failed:', e);
          setSongReplaying(false);
        }
      }
      
      // Показываем статистику 5 секунд, затем переходим к таблице лидеров
      await new Promise(r => setTimeout(r, 5000));
      
      setPhase('leaderboard');
      
      // Озвучиваем лидера если он один
      try {
        if (leaderboard.length > 0) {
          const leader = leaderboard[0];
          const secondPlace = leaderboard[1];
          
          if (!secondPlace || leader.score > secondPlace.score) {
            await speak(`Сейчас лидирует ${leader.name}!`);
          }
        }
      } catch (e) {
        console.warn('Leader TTS failed:', e);
      }
    };
    
    runSequence();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.round_id]);

  // Этап 1: Распределение ответов (большой экран)
  if (phase === 'stats') {
    return (
      <div className="min-h-screen p-8 flex flex-col">
        {showConfetti && correct_players.length > 0 && <Confetti />}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold gradient-text mb-4">Результаты!</h1>
          
          {/* Анимация реплея песни для music раунда */}
          {songReplaying && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mb-6"
            >
              <motion.div className="flex items-end gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="w-3 md:w-4 rounded-full bg-gradient-to-t from-green-500 to-emerald-400"
                    style={{ height: 40, transformOrigin: 'bottom' }}
                    animate={{ scaleY: [0.3, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror', delay: i * 0.08 }}
                  />
                ))}
              </motion.div>
              <p className="text-xl text-white/70 font-semibold">🎵 Слушаем правильный ответ...</p>
            </motion.div>
          )}
          
          {/* For photo_guess: show reveal photo (current photo) prominently */}
          {is_photo_guess && reveal_photo_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 mb-4"
            >
              <div className="flex gap-6 items-center">
                {image_url && (
                  <div className="text-center">
                    <GuestPhoto
                      basePath={image_url}
                      alt="Старое фото"
                      className="max-h-[20vh] rounded-2xl shadow-lg object-contain border-4 border-white/20"
                    />
                    <p className="text-sm text-white/50 mt-2">Было</p>
                  </div>
                )}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="text-4xl"
                >
                  →
                </motion.div>
                <div className="text-center">
                  <GuestPhoto
                    basePath={reveal_photo_url}
                    alt={guest_name || 'Гость'}
                    className="max-h-[25vh] rounded-2xl shadow-lg object-contain border-4 border-green-500/50"
                  />
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold text-green-400 mt-2"
                  >
                    {guest_name}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ) : image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mb-4"
            >
              <img
                src={image_url}
                alt="Question"
                className="max-h-[15vh] rounded-2xl shadow-lg object-contain"
              />
            </motion.div>
          )}
          
          <p className="text-2xl text-white/70 max-w-3xl mx-auto">{question_text}</p>
        </motion.div>

        {/* Распределение ответов - на весь экран */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full">
          {/* Левая колонка: варианты */}
          <div className="flex-1">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold mb-6 flex items-center gap-2"
            >
              <span className="text-green-500">✓</span> Распределение ответов
            </motion.h3>
            
            <div className="space-y-4">
              {options.map((option, index) => (
                <OptionCard
                  key={index}
                  option={option}
                  index={index}
                  total={options.length}
                  isCorrect={index === correct_option}
                  isRevealed
                  votes={option_stats[String(index)] || 0}
                  totalVotes={total_answers}
                />
              ))}
            </div>
          </div>

          {/* Правая колонка: игроки и статистика */}
          <div className="lg:w-[400px] space-y-6">
            {/* Правильно ответили */}
            <PlayersList
              players={correct_players}
              title="Правильно ответили"
              icon="✅"
              color="green"
            />

            {/* Ошиблись */}
            <PlayersList
              players={incorrect_players}
              title="Ошиблись"
              icon="❌"
              color="red"
            />

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-6"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-4xl font-bold text-pink-500">{total_answers}</div>
                  <div className="text-sm text-white/50">Всего ответов</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-500">
                    {option_stats[String(correct_option)] || 0}
                  </div>
                  <div className="text-sm text-white/50">Правильных</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-amber-500">
                    {total_answers > 0 
                      ? Math.round(((option_stats[String(correct_option)] || 0) / total_answers) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-white/50">Точность</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Этап 2: Таблица лидеров (на весь экран)
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      {showConfetti && correct_players.length > 0 && <Confetti />}
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <Leaderboard players={leaderboard} size="large" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
