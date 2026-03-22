import fetch from 'node-fetch';

const userId = 'jakubkonvalina';

console.log('🔍 Проверяю сколько треков у', userId, '\n');

let total = 0;
let page = 0;

while (page < 5) {
  const url = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=lifetime&offset=${page * 50}&limit=50`;
  console.log(`📡 Страница ${page + 1}:`, url);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    console.log('   ❌ Нет треков');
    break;
  }
  
  console.log(`   ✅ Получено: ${data.items.length} треков`);
  total += data.items.length;
  
  if (data.items.length < 50) {
    console.log('   ℹ️  Это последняя страница');
    break;
  }
  
  page++;
}

console.log('\n📊 ИТОГО:', total, 'треков');

