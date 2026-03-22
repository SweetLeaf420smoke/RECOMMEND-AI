import fetch from 'node-fetch';

const userId = '6wd99uocn3j3ukn0r7ghlc0j4';
const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=lifetime`;

console.log('📡 Запрашиваю stats.fm API...\n');

const response = await fetch(apiUrl);
const data = await response.json();

console.log(`✅ Получено ${data.items.length} треков\n`);

// Ищем те треки что в списке
const missingNames = [
  "Sirens (Extended Version)",
  "Giorgio by Moroder",
  "Me and My Friends Are Lonely",
  "Clap Your Hands",
  "Iron Sky",
  "To Let Myself Go",
  "Free",
  "Light of the Seven",
  "Lady (Hear Me Tonight)",
  "Trauma",
  "Walking On A Dream",
  "Aura"
];

console.log('🔍 Ищу проблемные треки:\n');

data.items.forEach(item => {
  const trackName = item.track.name;
  
  // Проверяем есть ли этот трек в списке проблемных
  const isProblematic = missingNames.some(name => trackName.includes(name));
  
  if (isProblematic) {
    console.log('═'.repeat(70));
    console.log(`📍 Позиция: ${item.position}`);
    console.log(`🎵 Название: ${trackName}`);
    console.log(`🎤 Артист: ${item.track.artists[0]?.name || 'N/A'}`);
    console.log(`🆔 Stats.fm ID: ${item.track.id}`);
    console.log(`📦 externalIds:`, JSON.stringify(item.track.externalIds, null, 2));
    console.log(`✅ Spotify ID: ${item.track.externalIds?.spotify?.[0] || '❌ НЕТ'}`);
    console.log('');
  }
});

console.log('\n💡 Вывод: смотрим есть ли у них Spotify ID в API');

