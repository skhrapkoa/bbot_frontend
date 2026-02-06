import { useEffect, useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from '../components/Timer';
import { OptionCard } from '../components/OptionCard';
import { PlayerCounter } from '../components/PlayerCounter';
import { GuestPhoto } from '../components/GuestPhoto';
import { useHedraTTS } from '../hooks/useHedraTTS';
import { useEdgeTTS } from '../hooks/useEdgeTTS';
import type { Round } from '../types';

// URL фоновой музыки для таймера (Who Wants to Be a Millionaire style)
const TIMER_MUSIC_URL = '/audio/timer-music.mp3';

interface QuestionScreenProps {
  round: Round;
  deadline: string | null;
  answerCount: number;
  playerCount: number;
  onTimerStart?: () => void;
  onTimerEnd?: () => void;
}

export function QuestionScreen({ round, deadline, answerCount, playerCount, onTimerStart, onTimerEnd }: QuestionScreenProps) {
  const isMusic = round.block_type === 'music';
  const isPhotoGuess = round.block_type === 'photo_guess' || round.is_photo_guess;
  
  // Hedra TTS (голос Наташи) с fallback на EdgeTTS
  const hedraTTS = useHedraTTS();
  const edgeTTS = useEdgeTTS({ voice: 'dmitry' });
  
  // Используем Hedra если настроен, иначе Edge
  const speak = hedraTTS.isConfigured ? hedraTTS.speak : edgeTTS.speak;
  
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const spokenRoundRef = useRef<number | null>(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerDeadline, setTimerDeadline] = useState<string | null>(null);
  const [songPlaying, setSongPlaying] = useState(false);
  const showListeningAnimation = isMusic && songPlaying;
  
  // Время на ответ - хардкод 15 секунд
  const timeLimit = 15;
  
  // Тексты озвучки
  const optionsSpeechText = useMemo(() => {
    const letters = ['А', 'Б', 'В', 'Г'];
    const optionsText = round.options
      .map((opt, i) => `${letters[i] || i + 1}. ${opt}`)
      .join('. ');
    
    return `${round.question_text}... ${optionsText}... Время пошло! У вас ${timeLimit} секунд.`;
  }, [round.question_text, round.options, timeLimit]);
  
  // Для музыкальных раундов — только варианты (вопрос уже видели)
  const musicOptionsSpeechText = useMemo(() => {
    const letters = ['А', 'Б', 'В', 'Г'];
    const optionsText = round.options
      .map((opt, i) => `${letters[i] || i + 1}. ${opt}`)
      .join('. ');
    
    return `Варианты ответа: ${optionsText}... Время пошло! У вас ${timeLimit} секунд.`;
  }, [round.options, timeLimit]);
  
  const photoGuessSpeechText = useMemo(() => {
    return `${round.question_text}... Время пошло! У вас ${timeLimit} секунд.`;
  }, [round.question_text, timeLimit]);
  
  // Сброс при смене раунда
  useEffect(() => {
    if (round.id !== spokenRoundRef.current) {
      setTimerStarted(false);
      setTimerDeadline(null);
      setSongPlaying(isMusic);
    }
  }, [round.id]);

  // Озвучка и музыка при смене раунда
  useEffect(() => {
    if (round.id !== spokenRoundRef.current) {
      spokenRoundRef.current = round.id;
      let cancelled = false;
      
      // Остановить предыдущую музыку
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      
      const startTimer = () => {
        if (cancelled) return;
        const now = new Date();
        now.setSeconds(now.getSeconds() + timeLimit);
        setTimerDeadline(now.toISOString());
        setTimerStarted(true);
        onTimerStart?.();
        
        musicRef.current = new Audio(TIMER_MUSIC_URL);
        musicRef.current.volume = 0.3;
        musicRef.current.loop = true;
        musicRef.current.play().catch(() => {});
      };
      
      const stopCurrentAudio = () => {
        if (musicRef.current) {
          musicRef.current.pause();
          musicRef.current = null;
        }
      };
      
      const timer = setTimeout(async () => {
        // DEBUG: показываем что приходит
        console.log('🎵 DEBUG:', { isMusic, block_type: round.block_type, song_url: round.song_url, round_id: round.id });
        
        // Для МУЗЫКАЛЬНОГО раунда - сначала играем песню, потом озвучиваем варианты и запускаем таймер
        if (isMusic && round.song_url) {
          console.log('🎵 MUSIC ROUND! Playing song:', round.song_url);
          
          const songDuration = round.song_duration_seconds || 15;
          musicRef.current = new Audio(round.song_url);
          musicRef.current.volume = 0.8;
          
          try {
            await musicRef.current.play();
          } catch (e) {
            console.error('🎵 Play error:', e);
          }
          
          await new Promise(r => setTimeout(r, songDuration * 1000));
          if (cancelled) return;
          
          stopCurrentAudio();
          
          // Песня закончилась — показываем варианты
          setSongPlaying(false);
          
          // Озвучиваем варианты после песни
          console.log('🎵 Song done, speaking options:', musicOptionsSpeechText);
          try {
            await speak(musicOptionsSpeechText);
            console.log('🎵 TTS finished normally');
          } catch (e) {
            console.warn('🎵 TTS failed, waiting 3s fallback:', e);
            // Если TTS упал — даём хотя бы 3 секунды прочитать варианты
            await new Promise(r => setTimeout(r, 3000));
          }
          if (cancelled) return;
          startTimer();
          return;
        }
        
        // Фото-угадайка или обычный раунд - озвучить и запустить таймер
        const speechText = isPhotoGuess ? photoGuessSpeechText : optionsSpeechText;
        
        try {
          await speak(speechText);
        } catch (e) {
          console.warn('TTS failed:', e);
        }
        if (cancelled) return;
        startTimer();
      }, 300);
      
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [
    round.id,
    optionsSpeechText,
    musicOptionsSpeechText,
    photoGuessSpeechText,
    speak,
    isMusic,
    isPhotoGuess,
    round.song_url,
    round.song_duration_seconds,
    onTimerStart,
    timeLimit,
  ]);
  
  // Остановить музыку при уходе со страницы
  useEffect(() => {
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  // Photo Guess: fullscreen photo layout
  if (isPhotoGuess) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Fullscreen photo background */}
        {round.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <GuestPhoto
              basePath={round.image_url}
              alt="Кто это?"
              className="max-h-[85vh] max-w-[90vw] rounded-3xl shadow-2xl object-contain border-4 border-white/20"
            />
          </motion.div>
        )}

        {/* Overlay with question and timer */}
        <div className="relative z-10 flex flex-col min-h-screen p-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl px-6 py-3"
            >
              <span className="text-2xl">📸 Раунд {round.order || 1}</span>
            </motion.div>

            <PlayerCounter count={playerCount} answered={answerCount} showAnswered />
          </div>

          {/* Question at bottom */}
          <div className="flex-1" />
          
          <div className="flex items-end justify-between gap-8">
            {/* Question text */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg max-w-2xl"
              style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
            >
              {round.question_text}
            </motion.h2>

            {/* Timer */}
            {timerStarted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Timer deadline={timerDeadline} size="large" onEnd={onTimerEnd} />
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="glass rounded-full p-2">
              <motion.div
                className="h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(answerCount / Math.max(playerCount, 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-center mt-2 text-white/70">
              {answerCount} из {playerCount} ответили
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Regular question layout
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
                <Timer deadline={timerDeadline} size="large" onEnd={onTimerEnd} />
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

        {/* Options grid or listening animation for music */}
        {showListeningAnimation ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div className="flex items-end gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="w-3 md:w-4 rounded-full bg-gradient-to-t from-pink-500 to-rose-400"
                  style={{ height: 48, transformOrigin: 'bottom' }}
                  animate={{ scaleY: [0.4, 1, 0.6] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: 'mirror', delay: i * 0.1 }}
                />
              ))}
            </motion.div>
            <div className="text-2xl md:text-3xl text-white/70 font-semibold">
              Слушаем фрагмент...
            </div>
          </motion.div>
        ) : (
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
        )}
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
