// API configuration
const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd 
  ? import.meta.env.VITE_API_URL || 'https://quiz-party-api.herokuapp.com'
  : '';

export const WS_BASE_URL = isProd
  ? import.meta.env.VITE_WS_URL || 'wss://quiz-party-api.herokuapp.com'
  : `ws://${window.location.host}`;

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const getWsUrl = (path: string) => `${WS_BASE_URL}${path}`;

// Telegram Bot
export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'nata_30_quiz_party_bot';
export const getBotLink = (sessionCode: string) => `https://t.me/${BOT_USERNAME}?start=${sessionCode}`;
