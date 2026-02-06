import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameEvent, SessionState, RoundResults } from '../types';

interface UseGameSocketReturn {
  state: SessionState | null;
  results: RoundResults | null;
  isConnected: boolean;
  answerCount: number;
  playerCount: number;
  songData: { url: string; stopTs: string } | null;
  playerNames: string[];
  removedGuests: string[];
  send: (message: object) => void;
}

export function useGameSocket(sessionCode: string): UseGameSocketReturn {
  const [state, setState] = useState<SessionState | null>(null);
  const [results, setResults] = useState<RoundResults | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [songData, setSongData] = useState<{ url: string; stopTs: string } | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [removedGuests, setRemovedGuests] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  const connect = useCallback(() => {
    const isProd = import.meta.env.PROD;
    const wsBase = isProd 
      ? (import.meta.env.VITE_WS_URL || 'wss://quiz-party-api.herokuapp.com')
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const wsUrl = `${wsBase}/ws/session/${sessionCode}/`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected, reconnecting...');
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GameEvent;
        handleEvent(data);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  }, [sessionCode]);

  const handleEvent = (event: GameEvent) => {
    console.log('Event:', event.type, event.data);

    switch (event.type) {
      case 'session_state':
        setState(event.data);
        setPlayerCount(event.data.player_count);
        // Собираем имена из leaderboard
        if (event.data.leaderboard) {
          setPlayerNames(event.data.leaderboard.map((p: { name: string }) => p.name));
        }
        // Обновляем список удалённых гостей
        if (event.data.removed_guests) {
          setRemovedGuests(event.data.removed_guests);
        }
        if (event.data.current_round) {
          setAnswerCount(event.data.current_round.answer_count || 0);
        }
        // total_blocks хранится в state
        break;

      case 'player_joined':
        setPlayerCount(event.data.player_count);
        // Добавляем имя нового игрока
        if (event.data.player_name) {
          setPlayerNames(prev => [...prev, event.data.player_name]);
        }
        break;

      case 'round_started':
        setState(prev => prev ? {
          ...prev,
          status: 'question_active',
          deadline_ts: event.data.deadline_ts,
          current_round: {
            id: event.data.round_id,
            question_text: event.data.question_text,
            options: event.data.options,
            time_limit_seconds: event.data.time_limit_seconds,
            status: 'active',
            block_type: event.data.block_type,
            block_order: event.data.block_order,
            block_title: event.data.block_title,
            order: 0,
            points: event.data.points || 10,
            image_url: event.data.image_url,
            image_urls: event.data.image_urls,
            background_music_url: event.data.background_music_url,
            background_music_duration: event.data.background_music_duration,
            song_url: event.data.song_url,
            song_duration_seconds: event.data.song_duration_seconds,
            song_start_seconds: event.data.song_start_seconds,
            song_end_seconds: event.data.song_end_seconds,
            reveal_start_seconds: event.data.reveal_start_seconds,
            reveal_end_seconds: event.data.reveal_end_seconds,
          },
        } : null);
        setAnswerCount(0);
        setResults(null);
        break;

      case 'answer_received':
        setAnswerCount(event.data.answer_count);
        setPlayerCount(event.data.player_count);
        break;

      case 'round_ended':
        setState(prev => prev ? { ...prev, status: 'reveal' } : null);
        setResults(event.data);
        break;

      case 'play_song':
        setState(prev => prev ? { ...prev, status: 'playing_song', song_stop_ts: event.data.song_stop_ts } : null);
        setSongData({ url: event.data.song_url, stopTs: event.data.song_stop_ts });
        break;

      case 'stop_song':
        setState(prev => prev ? { ...prev, status: 'reveal' } : null);
        setSongData(null);
        break;

      case 'leaderboard_updated':
        setState(prev => prev ? { ...prev, leaderboard: event.data.leaderboard } : null);
        break;

      case 'session_paused':
        setState(prev => prev ? { ...prev, status: 'paused' } : null);
        break;

      case 'session_resumed':
        // Request fresh state
        wsRef.current?.send(JSON.stringify({ type: 'get_state' }));
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { state, results, isConnected, answerCount, playerCount, songData, playerNames, removedGuests, send };
}
