import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptionCard } from '../components/OptionCard';
import { Leaderboard } from '../components/Leaderboard';
import { Confetti } from '../components/Confetti';
import { GuestPhoto } from '../components/GuestPhoto';
import { useHedraTTS } from '../hooks/useHedraTTS';
import type { RoundResults, PlayerResult } from '../types';

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

export function ResultsScreen({ results, showConfetti = true }: ResultsScreenProps) {
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
    if (!hedraTTS.isConfigured) {
      console.error('🔊 Hedra TTS is not configured');
      return;
    }
    try {
      await hedraTTS.speak(text);
    } catch (e) {
      console.warn('🔊 Hedra TTS failed:', e);
    }
  }, [hedraTTS]);
  
  const spokenRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Фазы: 'stats' (распределение) -> 'leaderboard' (таблица лидеров)
  const [phase, setPhase] = useState<'stats' | 'leaderboard'>('stats');

  // Запуск музыки
  useEffect(() => {
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
  }, []);

  // Озвучка результатов
  useEffect(() => {
    if (spokenRef.current === results.round_id) return;
    spokenRef.current = results.round_id;
    
    const runSequence = async () => {
      // Озвучка правильного ответа
      try {
        if (is_photo_guess && guest_name) {
          await speak(`Время вышло! Это ${guest_name}!`);
        } else {
          await speak(`Время вышло! Правильный ответ: ${correct_answer_text}`);
        }
      } catch (e) {
        console.warn('Results TTS failed:', e);
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
