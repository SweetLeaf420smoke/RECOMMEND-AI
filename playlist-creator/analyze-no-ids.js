import fetch from 'node-fetch';

const userId = '6wd99uocn3j3ukn0r7ghlc0j4';
const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=lifetime`;

const response = await fetch(apiUrl);
const data = await response.json();

// Треки БЕЗ вообще никаких ID
const noIds = data.items.filter(item => {
  const spotify = item.track.externalIds?.spotify?.length > 0;
  const apple = item.track.externalIds?.appleMusic?.length > 0;
  return !spotify && !apple;
});

console.log(`🔍 Треки БЕЗ ВООБЩЕ НИКАКИХ ID: ${noIds.length}\n`);

let hasSpotifyPreview = 0;
let hasApplePreview = 0;
let hasAnyPreview = 0;
let noPreviewAtAll = 0;

noIds.forEach((item, i) => {
  const spotPrev = !!item.track.spotifyPreview;
  const applePrev = !!item.track.appleMusicPreview;
  
  if (spotPrev) hasSpotifyPreview++;
  if (applePrev) hasApplePreview++;
  if (spotPrev || applePrev) hasAnyPreview++;
  if (!spotPrev && !applePrev) noPreviewAtAll++;
  
  console.log(`${i + 1}. [#${item.position}] ${item.track.name} - ${item.track.artists[0]?.name}`);
  console.log(`   Альбом: ${item.track.albums[0]?.name || 'N/A'}`);
  console.log(`   Spotify Preview: ${spotPrev ? '✅ ' + item.track.spotifyPreview : '❌'}`);
  console.log(`   Apple Preview: ${applePrev ? '✅' : '❌'}`);
  console.log(`   Duration: ${Math.round(item.track.durationMs / 1000)}s`);
  console.log(`   Popularity: ${item.track.spotifyPopularity}`);
  console.log('');
});

console.log('═'.repeat(70));
console.log('\n📊 ИТОГИ:');
console.log(`   Всего без ID: ${noIds.length}`);
console.log(`   Spotify Preview есть: ${hasSpotifyPreview} → ТОЧНО в Spotify!`);
console.log(`   Apple Preview есть: ${hasApplePreview}`);
console.log(`   Хоть какой-то preview: ${hasAnyPreview}`);
console.log(`   Вообще без preview: ${noPreviewAtAll} → возможно локальные файлы или удалены`);

console.log('\n💡 ВЫВОД:');
if (hasSpotifyPreview > 0) {
  console.log(`   ${hasSpotifyPreview} треков ЕСТЬ в Spotify (preview работает), но stats.fm не записал ID`);
  console.log(`   Это баг синхронизации stats.fm!`);
}
if (noPreviewAtAll > 0) {
  console.log(`   ${noPreviewAtAll} треков вообще без preview → скорее всего локальные файлы пользователя`);
}

