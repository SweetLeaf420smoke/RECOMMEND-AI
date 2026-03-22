import puppeteer from 'puppeteer';

const url = 'https://stats.fm/6wd99uocn3j3ukn0r7ghlc0j4/tracks?range=lifetime';

console.log('🔍 Ищу Spotify ID в атрибутах...\n');

const browser = await puppeteer.launch({ 
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();

// Перехватываем network запросы
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('api') && url.includes('track')) {
    console.log('📡 API request:', url);
    try {
      const json = await response.json();
      console.log('📦 Response:', JSON.stringify(json, null, 2).substring(0, 1000));
    } catch (e) {}
  }
});

await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForTimeout(5000);

// Прокручиваем
await page.evaluate(() => window.scrollBy(0, 3000));
await page.waitForTimeout(3000);

// Проверяем data-атрибуты
const dataAttributes = await page.evaluate(() => {
  const track = document.querySelector('a[href*="/track/"]');
  if (track) {
    const attrs = {};
    for (let attr of track.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }
  return null;
});

console.log('\n🏷️  Атрибуты первого трека:', dataAttributes);

await browser.close();

