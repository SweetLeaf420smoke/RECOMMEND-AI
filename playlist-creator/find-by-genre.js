import fetch from 'node-fetch';

const artistId = '137933'; // Noiseshaper
const targetGenre = 'dub';

console.log('🔍 Ищу слушателей Noiseshaper с жанром dub...\n');

// Получаем топ слушателей артиста
const listenersUrl = `https://api.stats.fm/api/v1/artists/${artistId}/listeners`;
console.log('📡 Запрашиваю топ слушателей...');

try {
  const response = await fetch(listenersUrl);
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    console.log('❌ Слушатели не найдены или требуется авторизация');
    process.exit(1);
  }
  
  console.log(`✅ Получено ${data.items.length} слушателей\n`);
  
  const matchedUsers = [];
  
  for (let i = 0; i < Math.min(data.items.length, 50); i++) {
    const listener = data.items[i];
    const userId = listener.user?.customId || listener.user?.id;
    
    if (!userId) continue;
    
    try {
      // Получаем топ жанры пользователя
      const genresUrl = `https://api.stats.fm/api/v1/users/${userId}/top/genres?range=lifetime`;
      const genresResponse = await fetch(genresUrl);
      const genresData = await genresResponse.json();
      
      if (genresData.items) {
        const hasDub = genresData.items.some(g => g.genre?.tag === targetGenre);
        
        if (hasDub) {
          const dubGenre = genresData.items.find(g => g.genre?.tag === targetGenre);
          matchedUsers.push({
            name: listener.user?.displayName || userId,
            userId: userId,
            dubPosition: dubGenre.position,
            profileUrl: `https://stats.fm/${userId}`
          });
          
          console.log(`✅ [${i + 1}] ${listener.user?.displayName} - dub на #${dubGenre.position} месте`);
        }
      }
    } catch (err) {
      // Пропускаем приватные профили
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`   Проверено ${i + 1}/${data.items.length}...`);
    }
  }
  
  console.log('\n═'.repeat(70));
  console.log(`\n🎯 Найдено ${matchedUsers.length} пользователей с жанром "dub":\n`);
  
  matchedUsers.forEach((user, i) => {
    console.log(`${i + 1}. ${user.name}`);
    console.log(`   Dub: #${user.dubPosition} в топе`);
    console.log(`   Профиль: ${user.profileUrl}\n`);
  });
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
}

