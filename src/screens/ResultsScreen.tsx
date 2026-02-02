import { motion } from 'framer-motion';
import { OptionCard } from '../components/OptionCard';
import { Leaderboard } from '../components/Leaderboard';
import { Confetti } from '../components/Confetti';
import type { RoundResults } from '../types';

interface ResultsScreenProps {
  results: RoundResults;
  showConfetti?: boolean;
}

export function ResultsScreen({ results, showConfetti = true }: ResultsScreenProps) {
  const { question_text, options, correct_option, option_stats, total_answers, leaderboard } = results;

  return (
    <div className="min-h-screen p-8 overflow-auto">
      {showConfetti && <Confetti />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold gradient-text mb-4">Results!</h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto">{question_text}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* Options with results */}
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold mb-4 flex items-center gap-2"
          >
            <span className="text-green-500">✓</span> Answer Distribution
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 glass rounded-2xl p-6"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-pink-500">{total_answers}</div>
                <div className="text-sm text-white/50">Total Answers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {option_stats[correct_option] || 0}
                </div>
                <div className="text-sm text-white/50">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500">
                  {total_answers > 0 
                    ? Math.round(((option_stats[correct_option] || 0) / total_answers) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-white/50">Accuracy</div>
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
