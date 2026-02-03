export interface Player {
  name: string;
  score: number;
  avatar?: string;
  photo_url?: string;
}

export interface Round {
  id: number;
  question_text: string;
  options: string[];
  time_limit_seconds: number;
  status: 'waiting' | 'active' | 'ended';
  answer_count?: number;
  block_type: 'facts' | 'music';
  order: number;
  image_url?: string;
  song_url?: string;
  song_duration_seconds?: number;
}

export interface SessionState {
  session_code: string;
  title: string;
  status: 'lobby' | 'question_active' | 'reveal' | 'playing_song' | 'paused' | 'finished';
  player_count: number;
  current_round: Round | null;
  deadline_ts: string | null;
  song_stop_ts: string | null;
  leaderboard: Player[];
}

export interface PlayerResult {
  name: string;
  photo_url?: string;
}

export interface RoundResults {
  round_id: number;
  question_text: string;
  options: string[];
  correct_option: number;
  correct_answer_text: string;
  option_stats: Record<number, number>;
  total_answers: number;
  correct_count: number;
  image_url?: string;
  correct_players: PlayerResult[];
  incorrect_players: PlayerResult[];
  leaderboard: Player[];
}

export type GameEvent =
  | { type: 'session_state'; data: SessionState }
  | { type: 'player_joined'; data: { player_name: string; player_count: number } }
  | { type: 'round_started'; data: { round_id: number; question_text: string; options: string[]; time_limit_seconds: number; deadline_ts: string; block_type: string; image_url?: string } }
  | { type: 'answer_received'; data: { answer_count: number; player_count: number } }
  | { type: 'round_ended'; data: RoundResults }
  | { type: 'play_song'; data: { song_url: string; duration: number; song_stop_ts: string } }
  | { type: 'stop_song'; data: Record<string, never> }
  | { type: 'leaderboard_updated'; data: { leaderboard: Player[] } }
  | { type: 'session_paused'; data: Record<string, never> }
  | { type: 'session_resumed'; data: { status: string } };
