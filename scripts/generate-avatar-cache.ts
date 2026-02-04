#!/usr/bin/env npx tsx
/**
 * Скрипт для генерации прекэшированных видео аватара
 * 
 * БЕСПЛАТНЫЙ вариант через Replicate + SadTalker
 * 
 * Использование:
 *   npm run generate:avatar
 * 
 * Требует в .env:
 *   - VITE_REPLICATE_API_KEY (бесплатно на replicate.com)
 *   - VITE_AVATAR_IMAGE_URL (URL твоего фото)
 *   - VITE_API_URL (URL бэкенда для TTS)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const REPLICATE_API_KEY = process.env.VITE_REPLICATE_API_KEY;
const AVATAR_IMAGE_URL = process.env.VITE_AVATAR_IMAGE_URL;
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// Стандартные фразы для прекэширования
const PHRASES: Record<string, string> = {
  'time-started': 'Время пошло! У вас 20 секунд.',
  'correct-answer': 'Правильный ответ...',
  'who-correct': 'Правильно ответили:',
  'who-incorrect': 'Ошиблись:',
  'welcome': 'Добро пожаловать в игру!',
  'next-question': 'Следующий вопрос...',
  'game-over': 'Игра окончена!',
};

const OUTPUT_DIR = path.join(__dirname, '../public/avatar-cache');

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Шаг 1: Генерируем аудио через Edge TTS (бэкенд)
async function generateAudio(text: string): Promise<string> {
  console.log(`  Generating audio for: "${text}"`);
  
  // Сохраняем аудио локально и загружаем на временный хостинг
  const ttsUrl = `${API_URL}/api/tts/?text=${encodeURIComponent(text)}&voice=dmitry`;
  
  const response = await fetch(ttsUrl);
  if (!response.ok) {
    throw new Error(`TTS error: ${response.status}`);
  }
  
  const audioBuffer = await response.arrayBuffer();
  
  // Сохраняем временно
  const tempPath = path.join(OUTPUT_DIR, '_temp_audio.mp3');
  fs.writeFileSync(tempPath, Buffer.from(audioBuffer));
  
  // Для Replicate нужен публичный URL
  // Используем tmpfiles.org для временного хостинга
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.mp3');
  
  const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload audio');
  }
  
  const uploadResult = await uploadResponse.json() as { data: { url: string } };
  // tmpfiles.org возвращает URL вида https://tmpfiles.org/123/file.mp3
  // Нужно заменить на https://tmpfiles.org/dl/123/file.mp3
  const audioUrl = uploadResult.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  
  console.log(`  Audio URL: ${audioUrl}`);
  return audioUrl;
}

// Шаг 2: Генерируем видео через SadTalker на Replicate
async function generateVideo(imageUrl: string, audioUrl: string): Promise<Buffer> {
  console.log(`  Starting SadTalker...`);
  
  // Создаём prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // SadTalker model
      version: 'cdfaa76a04d61c6dfa9b5cc32a7e0df96d0a2189e4cfeab18fc5dd8ea1da1c22',
      input: {
        source_image: imageUrl,
        driven_audio: audioUrl,
        enhancer: 'gfpgan',  // улучшение лица
        preprocess: 'crop',
        still_mode: false,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Replicate create error: ${createResponse.status} - ${error}`);
  }

  const prediction = await createResponse.json() as { 
    id: string; 
    urls: { get: string }; 
    status: string;
    output?: string;
    error?: string;
  };
  console.log(`  Prediction ID: ${prediction.id}`);

  // Поллинг до готовности
  let attempts = 0;
  const maxAttempts = 120; // 4 минуты максимум
  
  while (attempts < maxAttempts) {
    await sleep(2000);
    
    const statusResponse = await fetch(prediction.urls.get, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Replicate status error: ${statusResponse.status}`);
    }

    const status = await statusResponse.json() as { 
      status: string; 
      output?: string; 
      error?: string;
    };
    console.log(`  Status: ${status.status}`);
    
    if (status.status === 'succeeded' && status.output) {
      // Скачиваем видео
      console.log(`  Downloading video...`);
      const videoResponse = await fetch(status.output);
      const arrayBuffer = await videoResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    if (status.status === 'failed') {
      throw new Error(`SadTalker failed: ${status.error || 'Unknown error'}`);
    }

    attempts++;
  }

  throw new Error('Replicate timeout');
}

async function main() {
  console.log('🎬 Avatar Cache Generator (FREE via Replicate)\n');

  // Проверка конфига
  if (!REPLICATE_API_KEY) {
    console.error('❌ VITE_REPLICATE_API_KEY not set in .env');
    console.error('   Get your FREE API key at https://replicate.com/');
    console.error('   (You get free credits when you sign up!)\n');
    process.exit(1);
  }
  if (!AVATAR_IMAGE_URL) {
    console.error('❌ VITE_AVATAR_IMAGE_URL not set in .env');
    console.error('   Set a publicly accessible URL to your face photo');
    console.error('   (Upload to imgur.com or similar)\n');
    process.exit(1);
  }

  console.log('Config:');
  console.log(`  Avatar image: ${AVATAR_IMAGE_URL}`);
  console.log(`  Backend URL: ${API_URL}`);
  console.log(`  Provider: Replicate (SadTalker)`);
  console.log('');

  // Проверяем что бэкенд доступен
  try {
    const testResponse = await fetch(`${API_URL}/api/tts/?text=test&voice=dmitry`);
    if (!testResponse.ok) {
      throw new Error(`Backend returned ${testResponse.status}`);
    }
    console.log('✅ Backend TTS is working\n');
  } catch (e) {
    console.error('❌ Cannot reach backend TTS');
    console.error(`   Make sure backend is running at ${API_URL}`);
    console.error(`   Run: python manage.py runserver\n`);
    process.exit(1);
  }

  // Создаём директорию
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: { name: string; success: boolean; error?: string }[] = [];

  for (const [name, text] of Object.entries(PHRASES)) {
    const outputPath = path.join(OUTPUT_DIR, `${name}.mp4`);
    
    // Пропускаем если уже существует
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  ${name}.mp4 already exists, skipping`);
      results.push({ name, success: true });
      continue;
    }

    console.log(`\n🎥 Generating: ${name}.mp4`);
    console.log(`   Text: "${text}"`);
    
    try {
      // 1. Генерируем аудио
      const audioUrl = await generateAudio(text);
      
      // 2. Генерируем видео
      const videoBuffer = await generateVideo(AVATAR_IMAGE_URL, audioUrl);
      
      // 3. Сохраняем
      fs.writeFileSync(outputPath, videoBuffer);
      console.log(`✅ Saved: ${outputPath}`);
      results.push({ name, success: true });
      
      // Пауза между запросами
      await sleep(2000);
    } catch (error) {
      console.error(`❌ Failed: ${(error as Error).message}`);
      results.push({ name, success: false, error: (error as Error).message });
    }
  }

  // Очистка временных файлов
  const tempPath = path.join(OUTPUT_DIR, '_temp_audio.mp3');
  if (fs.existsSync(tempPath)) {
    fs.unlinkSync(tempPath);
  }

  // Итоги
  console.log('\n📊 Results:');
  console.log('─'.repeat(50));
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  for (const r of results) {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}${r.error ? ` - ${r.error}` : ''}`);
  }
  
  console.log('─'.repeat(50));
  console.log(`  Total: ${succeeded} succeeded, ${failed} failed`);
  
  if (succeeded > 0) {
    console.log(`\n🎉 Videos saved to: public/avatar-cache/`);
    console.log('   These will be used automatically in the app.');
  }
}

main().catch(console.error);
