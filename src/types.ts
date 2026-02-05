export interface Player {
  name: string;
  score: number;
  avatar?: string;
  photo_url?: string;
}

export type BlockType = 'facts' | 'music' | 'photo_fun' | 'guess_word' | 'photo_guess';

export interface Round {
  id: number;
  question_text: string;
  options: string[];
  time_limit_seconds: number;
  status: 'waiting' | 'active' | 'ended';
  answer_count?: number;
  block_type: BlockType;
  order: number;
  points: number;
  image_url?: string;
  image_urls?: string[];  // for "Где логика?" (multiple images)
  song_url?: string;
  song_duration_seconds?: number;
  background_music_url?: string;  // for photo_fun blocks
  background_music_duration?: number;
  // Photo Guess fields
  is_photo_guess?: boolean;
  guest_name?: string;
  photo_folder?: string;  // young or old
  reveal_photo_url?: string;
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
  removed_guests?: string[];
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
  option_stats: Record<string, number>;
  total_answers: number;
  correct_count: number;
  image_url?: string;
  correct_players: PlayerResult[];
  incorrect_players: PlayerResult[];
  leaderboard: Player[];
  // Photo Guess fields
  is_photo_guess?: boolean;
  guest_name?: string;
  reveal_photo_url?: string;
}

export type GameEvent =
  | { type: 'session_state'; data: SessionState }
  | { type: 'player_joined'; data: { player_name: string; player_count: number } }
  | { type: 'round_started'; data: { round_id: number; question_text: string; options: string[]; time_limit_seconds: number; deadline_ts: string; block_type: BlockType; points: number; image_url?: string; image_urls?: string[]; background_music_url?: string; background_music_duration?: number; song_url?: string; song_duration_seconds?: number } }
  | { type: 'answer_received'; data: { answer_count: number; player_count: number } }
  | { type: 'round_ended'; data: RoundResults }
  | { type: 'play_song'; data: { song_url: string; duration: number; song_stop_ts: string } }
  | { type: 'stop_song'; data: Record<string, never> }
  | { type: 'leaderboard_updated'; data: { leaderboard: Player[] } }
  | { type: 'session_paused'; data: Record<string, never> }
  | { type: 'session_resumed'; data: { status: string } };
