import { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameSocket } from './hooks/useGameSocket';
import { LobbyScreen } from './screens/LobbyScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { MusicScreen } from './screens/MusicScreen';
import { VideoInterludeScreen } from './screens/VideoInterludeScreen';
import { Wifi, WifiOff } from 'lucide-react';
import { getBotLink, getApiUrl } from './config';

// Get session code from URL path: /tv/NATA or query: ?session=NATA
function getSessionCode(): string {
  const pathMatch = window.location.pathname.match(/\/tv\/(\w+)/);
  if (pathMatch) return pathMatch[1].toUpperCase();
  
  const params = new URLSearchParams(window.location.search);
  return params.get('session')?.toUpperCase() || 'NATA';
}

function App() {
  const sessionCode = getSessionCode();
  const { state, results, isConnected, answerCount, playerCount, songData, playerNames, removedGuests, send } = useGameSocket(sessionCode);
  
  // ===== Video interlude system =====
  // Numbered videos in /video/interludes/: 
  //   odd (1,3,5...) = intro before block, even (2,4...) = break after block (except last)
  //   Block K (0-indexed): intro = K*2+1, break = K*2+2
  //   Finale = total_blocks*2 (replaces last block's break)
  const [videoInterlude, setVideoInterlude] = useState<number | null>(null);
  const prevBlockOrderRef = useRef<number>(-1);
  const finalePlayedRef = useRef(false);
  const initializedRef = useRef(false);
  const breakVideoTimerRef = useRef<number | undefined>(undefined);

  // Initialize on first state — if page refreshed mid-game, don't replay intro
  useEffect(() => {
    if (!state || initializedRef.current) return;
    initializedRef.current = true;
    if (state.status !== 'lobby' && state.current_round?.block_order !== undefined) {
      prevBlockOrderRef.current = state.current_round.block_order;
    }
    if (state.status === 'finished') {
      finalePlayedRef.current = true;
    }
  }, [state]);

  // Detect block transitions → intro videos
  useEffect(() => {
    if (!state || !initializedRef.current) return;
    
    if (state.status === 'question_active' && state.current_round?.block_order !== undefined) {
      const blockOrder = state.current_round.block_order;
      if (blockOrder !== prevBlockOrderRef.current) {
        prevBlockOrderRef.current = blockOrder;
        // Cancel any pending break video
        if (breakVideoTimerRef.current) {
          clearTimeout(breakVideoTimerRef.current);
          breakVideoTimerRef.current = undefined;
        }
        setVideoInterlude(blockOrder * 2 + 1);
      }
    }
    
    // Detect game finished → finale video
    if (state.status === 'finished' && !finalePlayedRef.current) {
      finalePlayedRef.current = true;
      if (breakVideoTimerRef.current) {
        clearTimeout(breakVideoTimerRef.current);
        breakVideoTimerRef.current = undefined;
      }
      const totalBlocks = state.total_blocks || 3;
      setVideoInterlude(totalBlocks * 2);
    }
    
    // Reset on lobby
    if (state.status === 'lobby') {
      prevBlockOrderRef.current = -1;
      finalePlayedRef.current = false;
      initializedRef.current = false;
    }
  }, [state]);

  // Detect block completion → schedule break video after results display (skip last block)
  useEffect(() => {
    if (!results?.block_completed || results.completed_block_order === undefined) return;
    
    // Skip break video for the last block — finale plays on 'finished' instead
    const totalBlocks = state?.total_blocks || 3;
    if (results.completed_block_order >= totalBlocks - 1) return;
    
    const breakVideoNum = results.completed_block_order * 2 + 2;
    // Wait 20 seconds for results sequence (stats + TTS + leaderboard)
    breakVideoTimerRef.current = window.setTimeout(() => {
      setVideoInterlude(breakVideoNum);
      breakVideoTimerRef.current = undefined;
    }, 20000);
    
    return () => {
      if (breakVideoTimerRef.current) {
        clearTimeout(breakVideoTimerRef.current);
        breakVideoTimerRef.current = undefined;
      }
    };
  }, [results?.round_id, results?.block_completed, results?.completed_block_order]);

  // Автоматическое завершение раунда когда таймер истекает
  const handleTimerEnd = useCallback(async () => {
    // Даём 2 секунды на то, чтобы последние ответы дошли до сервера
    await new Promise(r => setTimeout(r, 2000));
    
    try {
      await fetch(getApiUrl(`/api/host/${sessionCode}/end_round/`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Round ended by timer');
    } catch (e) {
      console.error('Failed to end round:', e);
    }
  }, [sessionCode]);

  // Auto-unlock audio on first click anywhere
  useEffect(() => {
    const unlockAudio = () => {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==';
      audio.play().catch(() => {});
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  // Loading state
  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-white/50">Connecting to {sessionCode}...</p>
      </div>
    );
  }

  // Render current screen based on status
  const renderScreen = () => {
    switch (state.status) {
      case 'lobby':
        return (
          <LobbyScreen
            title={state.title}
            sessionCode={sessionCode}
            playerCount={playerCount}
            botLink={getBotLink(sessionCode)}
            registeredNames={playerNames}
            removedGuests={removedGuests}
          />
        );

      case 'question_active':
        if (!state.current_round) return null;
        return (
          <QuestionScreen
            round={state.current_round}
            deadline={state.deadline_ts}
            answerCount={answerCount}
            playerCount={playerCount}
            onTimerStart={() => send({ type: 'timer_started', round_id: state.current_round?.id })}
            onTimerEnd={handleTimerEnd}
          />
        );

      case 'reveal':
        if (!results) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-6xl"
              >
                ⏳
              </motion.div>
            </div>
          );
        }
        return <ResultsScreen results={results} round={state.current_round || undefined} />;

      case 'playing_song':
        if (!songData) return null;
        return <MusicScreen songUrl={songData.url} stopTs={songData.stopTs} />;

      case 'paused':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-9xl mb-8"
            >
              ⏸️
            </motion.div>
            <h1 className="text-4xl font-bold">Game Paused</h1>
          </div>
        );

      case 'finished':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="text-9xl mb-8"
            >
              🎉
            </motion.div>
            <h1 className="text-5xl font-bold gradient-text">Game Over!</h1>
            {state.leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <p className="text-2xl text-white/70 mb-4">Winner:</p>
                <p className="text-4xl font-bold text-pink-500">
                  🏆 {state.leaderboard[0].name} - {state.leaderboard[0].score} pts
                </p>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Video interlude overlay
  if (videoInterlude !== null) {
    return (
      <VideoInterludeScreen
        videoNumber={videoInterlude}
        onComplete={() => setVideoInterlude(null)}
      />
    );
  }

  return (
    <>
      {/* Connection indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full ${
          isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="text-sm font-medium">
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </motion.div>

      {/* Screen transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default App;
