import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';

const statsUrl = process.argv[2];

if (!statsUrl || !statsUrl.includes('stats.fm')) {
  console.error('❌ Использование: node extract-tracks.js <stats.fm URL>');
  console.error('   Пример: node extract-tracks.js https://stats.fm/username/tracks');
  process.exit(1);
}

console.log('🎵 Парсим stats.fm...\n');

async function extractTracks(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const tracks = [];
    
    // Пробуем разные селекторы
    console.log('🔍 Ищем треки на странице...\n');
    
    // Метод 1: Ищем все ссылки на треки
    $('a[href*="/track/"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 0 && text.length < 200) {
        tracks.push(text);
      }
    });
    
    // Метод 2: Ищем по data-атрибутам
    $('[data-testid*="track"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 0 && text.length < 200 && !tracks.includes(text)) {
        tracks.push(text);
      }
    });
    
    // Метод 3: Ищем строки таблицы
    $('tr, .track-row, .track-item').each((i, elem) => {
      const text = $(elem).text().trim();
      // Фильтруем строки с артистами
      if (text && text.includes('-') && text.length > 5 && text.length < 200) {
        const cleaned = text.replace(/\s+/g, ' ').trim();
        if (!tracks.includes(cleaned)) {
          tracks.push(cleaned);
        }
      }
    });
    
    // Убираем дубликаты и фильтруем
    const uniqueTracks = [...new Set(tracks)].filter(t => 
      t.length > 3 && 
      t.length < 150 &&
      !t.includes('stats.fm') &&
      !t.includes('Login') &&
      !t.includes('Top tracks')
    );
    
    return uniqueTracks;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return [];
  }
}

async function main() {
  const tracks = await extractTracks(statsUrl);
  
  if (tracks.length === 0) {
    console.log('❌ Треки не найдены.');
    console.log('\n💡 Попробуй вручную:');
    console.log('   1. Открой страницу в браузере');
    console.log('   2. Скопируй все треки');
    console.log('   3. Вставь их в новый плейлист Spotify');
    return;
  }
  
  console.log(`✅ Найдено ${tracks.length} треков:\n`);
  console.log('═'.repeat(60));
  
  // Выводим треки
  tracks.forEach((track, i) => {
    console.log(`${i + 1}. ${track}`);
  });
  
  console.log('═'.repeat(60));
  console.log(`\nВсего: ${tracks.length} треков\n`);
  
  // Формируем текст для копирования
  const copyText = tracks.join('\n');
  
  // Пытаемся скопировать в буфер (работает на macOS)
  try {
    exec(`echo "${copyText.replace(/"/g, '\\"')}" | pbcopy`, (error) => {
      if (!error) {
        console.log('✅ Список скопирован в буфер обмена!');
        console.log('   Теперь можешь вставить (Cmd+V) в Spotify');
      } else {
        console.log('💡 Скопируй вручную текст выше');
      }
    });
  } catch (e) {
    console.log('💡 Скопируй вручную текст выше');
  }
}

main();

