import { motion } from 'framer-motion';

interface OptionCardProps {
  option: string;
  index: number;
  total: number;
  isCorrect?: boolean;
  isRevealed?: boolean;
  votes?: number;
  totalVotes?: number;
}

const LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];
const COLORS = [
  'from-rose-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-red-500 to-rose-600',
];

export function OptionCard({ 
  option, 
  index, 
  total,
  isCorrect,
  isRevealed = false,
  votes = 0,
  totalVotes = 0,
}: OptionCardProps) {
  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={!isRevealed ? { scale: 1.02, y: -5 } : {}}
      className={`
        relative overflow-hidden rounded-2xl p-6
        ${isRevealed 
          ? isCorrect 
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 glow-success' 
            : 'bg-white/5 opacity-50'
          : `bg-gradient-to-r ${COLORS[index % COLORS.length]}`
        }
        transition-all duration-300
      `}
    >
      {/* Progress bar for votes */}
      {isRevealed && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute inset-0 ${isCorrect ? 'bg-green-400/30' : 'bg-white/10'}`}
        />
      )}

      <div className="relative flex items-center gap-4">
        {/* Label badge */}
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
          className={`
            flex items-center justify-center w-14 h-14 rounded-xl
            ${isRevealed ? 'bg-white/20' : 'bg-black/20'}
            font-bold text-2xl
          `}
        >
          {LABELS[index]}
        </motion.div>

        {/* Option text */}
        <span className="flex-1 text-2xl font-medium">{option}</span>

        {/* Vote count */}
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-right"
          >
            <div className="text-3xl font-bold">{votes}</div>
            <div className="text-sm opacity-70">{percentage.toFixed(0)}%</div>
          </motion.div>
        )}

        {/* Correct indicator */}
        {isRevealed && isCorrect && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-4xl"
          >
            ✓
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
