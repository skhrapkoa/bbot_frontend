import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../types';

interface LeaderboardProps {
  players: Player[];
  maxShow?: number;
  size?: 'large' | 'compact';
}

const MEDALS = ['🥇', '🥈', '🥉'];

// Generate avatar gradient based on name
function getAvatarGradient(name: string) {
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-pink-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[index % gradients.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Компонент аватара с фото или fallback на инициалы
function PlayerPhoto({ player, sizeClass }: { player: Player; sizeClass: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (player.photo_url && !imgError) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={`${sizeClass} rounded-full object-cover shadow-lg border-2 border-white/20`}
        onError={() => setImgError(true)}
      />
    );
  }
  
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${getAvatarGradient(player.name)} flex items-center justify-center font-bold shadow-lg`}>
      {getInitials(player.name)}
    </div>
  );
}

export function Leaderboard({ players, maxShow = 10, size = 'large' }: LeaderboardProps) {
  const displayed = players.slice(0, maxShow);
  const isLarge = size === 'large';

  return (
    <div className={`w-full ${isLarge ? 'max-w-2xl' : 'max-w-md'}`}>
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-center mb-6 ${isLarge ? 'text-4xl' : 'text-2xl'} font-bold`}
      >
        🏆 Таблица лидеров
      </motion.h2>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayed.map((player, index) => (
            <motion.div
              key={player.name}
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ 
                delay: index * 0.05,
                layout: { type: 'spring', stiffness: 200, damping: 25 }
              }}
              className={`
                glass rounded-2xl flex items-center gap-4
                ${isLarge ? 'p-4' : 'p-3'}
                ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30' : ''}
                ${index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30' : ''}
                ${index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-amber-700/20 border-orange-700/30' : ''}
              `}
            >
              {/* Rank */}
              <div className={`${isLarge ? 'text-3xl w-12' : 'text-xl w-8'} text-center`}>
                {index < 3 ? MEDALS[index] : (
                  <span className="text-white/50 font-bold">{index + 1}</span>
                )}
              </div>

              {/* Avatar/Photo */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={isLarge ? 'text-xl' : 'text-sm'}
              >
                <PlayerPhoto 
                  player={player} 
                  sizeClass={isLarge ? 'w-14 h-14' : 'w-10 h-10'} 
                />
              </motion.div>

              {/* Name */}
              <div className="flex-1 truncate">
                <span className={`font-medium ${isLarge ? 'text-xl' : 'text-base'}`}>
                  {player.name}
                </span>
              </div>

              {/* Score */}
              <motion.div
                key={player.score}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                className={`
                  ${isLarge ? 'text-2xl px-4 py-2' : 'text-lg px-3 py-1'}
                  font-bold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500
                `}
              >
                {player.score}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
