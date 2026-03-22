import fetch from 'node-fetch';

const userId = '6wd99uocn3j3ukn0r7ghlc0j4';
const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=lifetime`;

console.log('📡 Проверяю ВСЕ треки без Spotify ID...\n');

const response = await fetch(apiUrl);
const data = await response.json();

const withoutSpotifyId = data.items.filter(item => 
  !item.track.externalIds?.spotify?.[0]
);

console.log(`Найдено треков БЕЗ Spotify ID: ${withoutSpotifyId.length}\n`);

let withApple = 0;
let withoutApple = 0;
let withSpotifyPreview = 0;
let withApplePreview = 0;

console.log('═'.repeat(70));

withoutSpotifyId.forEach((item, i) => {
  const hasAppleId = item.track.externalIds?.appleMusic?.length > 0;
  const hasSpotifyPreview = !!item.track.spotifyPreview;
  const hasApplePreview = !!item.track.appleMusicPreview;
  
  if (hasAppleId) withApple++;
  if (!hasAppleId) withoutApple++;
  if (hasSpotifyPreview) withSpotifyPreview++;
  if (hasApplePreview) withApplePreview++;
  
  console.log(`${i + 1}. [#${item.position}] ${item.track.name} - ${item.track.artists[0]?.name}`);
  console.log(`   Spotify ID: ❌`);
  console.log(`   Apple ID: ${hasAppleId ? '✅ ' + item.track.externalIds.appleMusic[0] : '❌'}`);
  console.log(`   Spotify Preview: ${hasSpotifyPreview ? '✅' : '❌'}`);
  console.log(`   Apple Preview: ${hasApplePreview ? '✅' : '❌'}`);
  console.log('');
});

console.log('═'.repeat(70));
console.log('\n📊 СТАТИСТИКА:');
console.log(`   Всего без Spotify ID: ${withoutSpotifyId.length}`);
console.log(`   С Apple Music ID: ${withApple} (${Math.round(withApple/withoutSpotifyId.length*100)}%)`);
console.log(`   Без Apple Music ID: ${withoutApple}`);
console.log(`   Со Spotify Preview: ${withSpotifyPreview} (есть в Spotify, но нет ID!)`);
console.log(`   С Apple Preview: ${withApplePreview}`);
console.log('\n💡 Вывод: часть треков ТОЧНО есть в Spotify (есть preview), просто stats.fm не связал ID');

