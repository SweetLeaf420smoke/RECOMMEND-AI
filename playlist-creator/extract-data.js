import puppeteer from 'puppeteer';

const url = 'https://stats.fm/6wd99uocn3j3ukn0r7ghlc0j4/tracks?range=lifetime';

console.log('🔍 Извлекаю данные треков...\n');

const browser = await puppeteer.launch({ 
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForTimeout(5000);

// Прокручиваем
await page.evaluate(() => window.scrollBy(0, 3000));
await page.waitForTimeout(2000);

// Извлекаем __NEXT_DATA__
const nextData = await page.evaluate(() => {
  const script = document.getElementById('__NEXT_DATA__');
  if (script) {
    return JSON.parse(script.textContent);
  }
  return null;
});

console.log('📦 Next.js Data:', JSON.stringify(nextData, null, 2).substring(0, 2000));

// Ищем треки более тщательно
const tracks = await page.evaluate(() => {
  const results = [];
  
  // Метод 1: через ссылки
  document.querySelectorAll('a[href*="/track/"]').forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    
    // Извлекаем номер и название
    const match = text.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      results.push({
        number: match[1],
        name: match[2],
        statsfmUrl: 'https://stats.fm' + href
      });
    }
  });
  
  return results;
});

console.log('\n🎵 Найдено треков:', tracks.length);
tracks.slice(0, 10).forEach(t => {
  console.log(`${t.number}. ${t.name}`);
  console.log(`   ${t.statsfmUrl}\n`);
});

await browser.close();

console.log('\n💡 Вывод: stats.fm использует свои ID, нужно переходить на страницу трека чтобы найти Spotify ссылку');

