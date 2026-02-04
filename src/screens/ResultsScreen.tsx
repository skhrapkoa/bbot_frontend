import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OptionCard } from '../components/OptionCard';
import { Leaderboard } from '../components/Leaderboard';
import { Confetti } from '../components/Confetti';
import { Avatar } from '../components/Avatar';
import { useAvatarVideo } from '../hooks/useAvatarVideo';
import { useEdgeTTS } from '../hooks/useEdgeTTS';
import type { RoundResults, PlayerResult } from '../types';

// Проверяем включен ли D-ID аватар
const AVATAR_ENABLED = !!import.meta.env.VITE_DID_API_KEY;

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
      transition={{ delay: 0.8 }}
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
            transition={{ delay: 0.9 + idx * 0.1 }}
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
    incorrect_players = []
  } = results;
  
  // TTS: используем аватар если настроен, иначе EdgeTTS
  const { speak: edgeSpeak } = useEdgeTTS({ voice: 'dmitry' });
  const avatar = useAvatarVideo({ fallbackToAudio: true });
  const speak = AVATAR_ENABLED ? avatar.speak : edgeSpeak;
  
  const spokenRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<'answer' | 'correct' | 'incorrect' | 'done'>('answer');

  // Озвучка результатов поэтапно
  useEffect(() => {
    if (spokenRef.current === results.round_id) return;
    spokenRef.current = results.round_id;
    
    const runSequence = async () => {
      // Фаза 1: Озвучить правильный ответ
      setPhase('answer');
      await speak(`Правильный ответ... ${correct_answer_text}!`);
      
      // Небольшая пауза
      await new Promise(r => setTimeout(r, 1000));
      
      // Фаза 2: Озвучить тех кто ответил правильно
      if (correct_players.length > 0) {
        setPhase('correct');
        const names = correct_players.map(p => p.name).join(', ');
        await speak(`Правильно ответили: ${names}`);
        await new Promise(r => setTimeout(r, 800));
      }
      
      // Фаза 3: Озвучить тех кто ошибся
      if (incorrect_players.length > 0) {
        setPhase('incorrect');
        const names = incorrect_players.map(p => p.name).join(', ');
        await speak(`Ошиблись: ${names}`);
      }
      
      setPhase('done');
    };
    
    runSequence();
  }, [results.round_id, correct_answer_text, correct_players, incorrect_players, speak]);

  return (
    <div className="min-h-screen p-8 overflow-auto">
      {showConfetti && correct_players.length > 0 && <Confetti />}

      {/* Header with optional image */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-5xl font-bold gradient-text mb-4">Результаты!</h1>
        
        {/* Question image if available */}
        {image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-4"
          >
            <img
              src={image_url}
              alt="Question"
              className="max-h-[20vh] rounded-2xl shadow-lg object-contain"
            />
          </motion.div>
        )}
        
        <p className="text-xl text-white/70 max-w-2xl mx-auto">{question_text}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left column: Options + Players */}
        <div className="flex-1 space-y-6">
          {/* Options with results */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold mb-4 flex items-center gap-2"
            >
              <span className="text-green-500">✓</span> Распределение ответов
            </motion.h3>
            
            <div className="space-y-3">
              {options.map((option, index) => (
                <OptionCard
                  key={index}
                  option={option}
                  index={index}
                  total={options.length}
                  isCorrect={index === correct_option}
                  isRevealed
                  votes={option_stats[index] || 0}
                  totalVotes={total_answers}
                />
              ))}
            </div>
          </div>

          {/* Correct players */}
          <AnimatePresence>
            {(phase === 'correct' || phase === 'incorrect' || phase === 'done') && (
              <PlayersList
                players={correct_players}
                title="Правильно ответили"
                icon="✅"
                color="green"
              />
            )}
          </AnimatePresence>

          {/* Incorrect players */}
          <AnimatePresence>
            {(phase === 'incorrect' || phase === 'done') && (
              <PlayersList
                players={incorrect_players}
                title="Ошиблись"
                icon="❌"
                color="red"
              />
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-pink-500">{total_answers}</div>
                <div className="text-sm text-white/50">Всего ответов</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {option_stats[correct_option] || 0}
                </div>
                <div className="text-sm text-white/50">Правильных</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500">
                  {total_answers > 0 
                    ? Math.round(((option_stats[correct_option] || 0) / total_answers) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-white/50">Точность</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:w-96"
        >
          <Leaderboard players={leaderboard} size="compact" />
        </motion.div>
      </div>
    </div>
  );
}
