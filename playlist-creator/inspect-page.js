import puppeteer from 'puppeteer';
import fs from 'fs';

const url = 'https://stats.fm/6wd99uocn3j3ukn0r7ghlc0j4/tracks?range=lifetime';

console.log('🔍 Изучаю страницу:', url);

const browser = await puppeteer.launch({ 
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();

console.log('⏳ Загружаю страницу...');
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.waitForTimeout(5000);

console.log('📜 Прокручиваю...');
await page.evaluate(() => window.scrollBy(0, 2000));
await page.waitForTimeout(2000);

// Извлекаем HTML
const html = await page.content();
fs.writeFileSync('page.html', html);
console.log('✅ HTML сохранен в page.html');

// Ищем ссылки на треки
const trackLinks = await page.evaluate(() => {
  const links = [];
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    if (href && (href.includes('track') || href.includes('spotify'))) {
      links.push({
        href: href,
        text: text.substring(0, 100),
        classList: link.className
      });
    }
  });
  return links.slice(0, 20); // первые 20
});

console.log('\n🎵 Найдено ссылок на треки:', trackLinks.length);
trackLinks.forEach((link, i) => {
  console.log(`${i + 1}. ${link.text}`);
  console.log(`   URL: ${link.href}`);
  console.log(`   Class: ${link.classList}\n`);
});

// Проверяем структуру данных
const dataStructure = await page.evaluate(() => {
  // Ищем React данных или JSON
  const scripts = Array.from(document.querySelectorAll('script'));
  const dataScripts = scripts.filter(s => 
    s.textContent.includes('track') || 
    s.textContent.includes('spotify') ||
    s.textContent.includes('__NEXT_DATA__')
  );
  
  return dataScripts.map(s => ({
    type: s.type,
    length: s.textContent.length,
    preview: s.textContent.substring(0, 200)
  }));
});

console.log('\n📦 Найдено скриптов с данными:', dataStructure.length);
dataStructure.forEach((script, i) => {
  console.log(`\n${i + 1}. Type: ${script.type}, Length: ${script.length}`);
  console.log(`Preview: ${script.preview}`);
});

await browser.close();
console.log('\n✅ Готово!');

