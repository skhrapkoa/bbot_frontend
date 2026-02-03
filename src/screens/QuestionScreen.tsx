import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from '../components/Timer';
import { OptionCard } from '../components/OptionCard';
import { PlayerCounter } from '../components/PlayerCounter';
import { useEdgeTTS } from '../hooks/useEdgeTTS';
import type { Round } from '../types';

// URL фоновой музыки для таймера (Who Wants to Be a Millionaire style)
const TIMER_MUSIC_URL = '/audio/timer-music.mp3';

interface QuestionScreenProps {
  round: Round;
  deadline: string | null;
  answerCount: number;
  playerCount: number;
}

export function QuestionScreen({ round, deadline, answerCount, playerCount }: QuestionScreenProps) {
  const isMusic = round.block_type === 'music';
  const { speak } = useEdgeTTS({ voice: 'dmitry' });
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const spokenRoundRef = useRef<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerDeadline, setTimerDeadline] = useState<string | null>(null);
  
  // Формируем полный текст: вопрос + варианты + "Время пошло"
  // Добавляем паузы через многоточия для естественного звучания
  // Буквы пишем как произносятся, чтобы TTS не путал с союзами
  const fullSpeechText = useMemo(() => {
    const letterNames = ['Вариант А', 'Вариант Бээ', 'Вариант Вээ', 'Вариант Гээ'];
    const optionsText = round.options
      .map((opt, i) => `${letterNames[i] || `Вариант ${i + 1}`}, ${opt}`)
      .join('. ');
    
    return `${round.question_text}... ${optionsText}... Время пошло! У вас 20 секунд.`;
  }, [round.question_text, round.options]);
  
  // Сброс при смене раунда
  useEffect(() => {
    if (round.id !== spokenRoundRef.current) {
      setTimerStarted(false);
      setTimerDeadline(null);
    }
  }, [round.id]);

  // Озвучка при смене раунда
  useEffect(() => {
    if (round.id !== spokenRoundRef.current) {
      spokenRoundRef.current = round.id;
      
      // Остановить предыдущую музыку
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      
      // Озвучить вопрос, затем запустить музыку и таймер
      const timer = setTimeout(async () => {
        // Ждём пока озвучка закончится
        await speak(fullSpeechText);
        
        // Устанавливаем дедлайн на 20 секунд от сейчас
        const now = new Date();
        now.setSeconds(now.getSeconds() + 20);
        setTimerDeadline(now.toISOString());
        setTimerStarted(true);
        
        // Запускаем музыку сразу после окончания речи
        musicRef.current = new Audio(TIMER_MUSIC_URL);
        musicRef.current.volume = 0.3;
        musicRef.current.loop = true;
        musicRef.current.play().catch(() => {});
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [round.id, fullSpeechText, speak]);
  
  // Остановить музыку при уходе со страницы
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

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
        {/* Photo OR Timer - взаимозаменяемые */}
        <div className="mb-8 relative" style={{ minHeight: '200px' }}>
          <AnimatePresence mode="wait">
            {!timerStarted && round.image_url ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                className="flex justify-center"
              >
                <img
                  src={round.image_url}
                  alt="Question"
                  className="max-h-[40vh] max-w-full rounded-3xl shadow-2xl object-contain border-4 border-white/20"
                />
              </motion.div>
            ) : timerStarted ? (
              <motion.div
                key="timer"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Timer deadline={timerDeadline} size="large" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

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
