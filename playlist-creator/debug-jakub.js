import fetch from 'node-fetch';

const userId = 'jakubkonvalina';

console.log('🔍 Проверяю jakubkonvalina...\n');

// Проверяем разные периоды
const ranges = ['weeks', 'months', 'lifetime'];

for (const range of ranges) {
  console.log(`📅 Range: ${range}`);
  
  let total = 0;
  let page = 0;
  
  while (page < 3) {
    const url = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=${range}&offset=${page * 50}&limit=50`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      break;
    }
    
    total += data.items.length;
    console.log(`   Страница ${page + 1}: ${data.items.length} треков`);
    
    if (data.items.length < 50) break;
    page++;
  }
  
  console.log(`   📊 Итого: ${total} треков\n`);
}

// Проверяем профиль
const profileUrl = `https://api.stats.fm/api/v1/users/${userId}`;
const profResponse = await fetch(profileUrl);
const profData = await profResponse.json();

console.log('\n👤 Профиль:');
console.log('   Display Name:', profData.item?.displayName);
console.log('   Privacy Settings:', profData.item?.privacySettings);

