import fetch from 'node-fetch';

const userId = '6wd99uocn3j3ukn0r7ghlc0j4';
const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=lifetime`;

console.log('📡 Запрос полных данных...\n');

const response = await fetch(apiUrl);
const data = await response.json();

// Ищем "Make It Rain - Live"
const makeItRain = data.items.find(item => 
  item.track.name.includes('Make It Rain') && item.track.name.includes('Live')
);

if (makeItRain) {
  console.log('🔍 ПОЛНЫЕ ДАННЫЕ для "Make It Rain - Live":\n');
  console.log(JSON.stringify(makeItRain, null, 2));
  
  console.log('\n📦 Все поля track объекта:');
  Object.keys(makeItRain.track).forEach(key => {
    console.log(`   ${key}:`, makeItRain.track[key]);
  });
} else {
  console.log('❌ Трек не найден в топе');
}

// Проверяем "Time" Pink Floyd
const time = data.items.find(item => 
  item.track.name.includes('Time') && item.track.artists?.[0]?.name === 'Pink Floyd'
);

if (time) {
  console.log('\n\n🔍 ПОЛНЫЕ ДАННЫЕ для "Time - Pink Floyd":\n');
  console.log(JSON.stringify(time.track.externalIds, null, 2));
  console.log('\nВсе поля:');
  Object.keys(time.track).forEach(key => {
    console.log(`   ${key}:`, typeof time.track[key] === 'object' ? JSON.stringify(time.track[key]) : time.track[key]);
  });
}

