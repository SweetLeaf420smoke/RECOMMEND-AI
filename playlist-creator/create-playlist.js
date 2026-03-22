import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Твои Spotify credentials
const CLIENT_ID = '70c315547b85400089fc972cb993f2e7';
const CLIENT_SECRET = 'b0088a270e3e427e8b4097bf37cbe3ba';
const REDIRECT_URI = 'http://127.0.0.1:3000/auth/spotify/callback';

console.log('🎵 Stats.fm → Spotify Playlist Creator\n');

// Получаем URL из аргументов
const statsUrl = process.argv[2];

if (!statsUrl || !statsUrl.includes('stats.fm')) {
  console.error('❌ Использование: node create-playlist.js <stats.fm URL>');
  console.error('   Пример: node create-playlist.js https://stats.fm/username/tracks');
  process.exit(1);
}

async function getSpotifyToken() {
  console.log('🔑 Получаем токен Spotify...');
  
  // Используем Client Credentials Flow (простой, без браузера)
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('Не удалось получить токен: ' + JSON.stringify(data));
  }
  
  console.log('✅ Токен получен\n');
  return data.access_token;
}

async function parseStatsFm(url) {
  console.log('📥 Парсим stats.fm...');
  console.log('   URL:', url);
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Парсим треки (примерная структура, может отличаться)
    const tracks = [];
    
    // Попробуем найти треки
    $('[data-testid="track-row"], .track-item, tr').each((i, elem) => {
      const text = $(elem).text();
      // Ищем паттерны "Track Name - Artist"
      if (text && text.includes('-')) {
        const parts = text.split('-').map(p => p.trim());
        if (parts.length >= 2) {
          tracks.push({
            track: parts[0],
            artist: parts[1]
          });
        }
      }
    });
    
    console.log(`   Найдено треков: ${tracks.length}`);
    
    if (tracks.length === 0) {
      console.log('\n⚠️  Треки не найдены автоматически.');
      console.log('Попробуй вручную скопировать список треков и запустить с файлом.');
    }
    
    return tracks;
  } catch (error) {
    console.error('❌ Ошибка парсинга:', error.message);
    return [];
  }
}

async function searchTrack(token, trackName, artistName) {
  const query = `track:${trackName} artist:${artistName}`;
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  if (data.tracks && data.tracks.items.length > 0) {
    return data.tracks.items[0].uri;
  }
  
  return null;
}

async function main() {
  try {
    const token = await getSpotifyToken();
    const tracks = await parseStatsFm(statsUrl);
    
    if (tracks.length === 0) {
      console.log('\n💡 Решение: Вместо парсинга, давай сделаем проще:');
      console.log('   1. Скопируй список треков вручную');
      console.log('   2. Сохрани в tracks.txt (формат: "Track - Artist" на каждой строке)');
      console.log('   3. Запусти: node create-playlist.js tracks.txt');
      return;
    }
    
    console.log('\n🔍 Ищем треки в Spotify...');
    
    const foundTracks = [];
    for (let i = 0; i < Math.min(tracks.length, 50); i++) {
      const { track, artist } = tracks[i];
      process.stdout.write(`   [${i + 1}/${tracks.length}] ${track} - ${artist}...`);
      
      const uri = await searchTrack(token, track, artist);
      if (uri) {
        foundTracks.push(uri);
        console.log(' ✅');
      } else {
        console.log(' ❌');
      }
    }
    
    console.log(`\n✅ Найдено ${foundTracks.length} из ${tracks.length} треков`);
    console.log('\n⚠️  Внимание: Client Credentials не может создавать плейлисты.');
    console.log('Нужна авторизация пользователя. Лучше сделать это через Synq!\n');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();

