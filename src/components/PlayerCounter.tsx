import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

interface PlayerCounterProps {
  count: number;
  answered?: number;
  showAnswered?: boolean;
}

export function PlayerCounter({ count, answered = 0, showAnswered = false }: PlayerCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-full px-6 py-3 flex items-center gap-3"
    >
      <Users className="w-6 h-6 text-pink-500" />
      
      <AnimatePresence mode="popLayout">
        <motion.span
          key={showAnswered ? `${answered}/${count}` : count}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="text-2xl font-bold"
        >
          {showAnswered ? (
            <>
              <span className="text-pink-500">{answered}</span>
              <span className="text-white/50"> / </span>
              <span>{count}</span>
            </>
          ) : (
            <span>{count} players</span>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
