import { motion } from 'framer-motion';
import { Timer } from '../components/Timer';
import { OptionCard } from '../components/OptionCard';
import { PlayerCounter } from '../components/PlayerCounter';
import type { Round } from '../types';

interface QuestionScreenProps {
  round: Round;
  deadline: string | null;
  answerCount: number;
  playerCount: number;
}

export function QuestionScreen({ round, deadline, answerCount, playerCount }: QuestionScreenProps) {
  const isMusic = round.block_type === 'music';

  return (
    <div className="min-h-screen flex flex-col p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-2xl px-6 py-3"
        >
          <span className="text-2xl">
            {isMusic ? '🎵' : '❓'} Round {round.order || 1}
          </span>
        </motion.div>

        <PlayerCounter count={playerCount} answered={answerCount} showAnswered />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Timer */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <Timer deadline={deadline} size="large" />
        </motion.div>

        {/* Question */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12 max-w-4xl leading-tight"
        >
          {round.question_text}
        </motion.h2>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          {round.options.map((option, index) => (
            <OptionCard
              key={index}
              option={option}
              index={index}
              total={round.options.length}
            />
          ))}
        </div>
      </div>

      {/* Answer progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <div className="glass rounded-full p-2">
          <motion.div
            className="h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(answerCount / Math.max(playerCount, 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-center mt-2 text-white/50">
          {answerCount} of {playerCount} answered
        </p>
      </motion.div>
    </div>
  );
}
