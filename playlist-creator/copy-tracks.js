import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const statsUrl = process.argv[2];

if (!statsUrl || !statsUrl.includes('stats.fm')) {
  console.error('❌ Использование: node copy-tracks.js <stats.fm URL>');
  console.error('   Пример: node copy-tracks.js https://stats.fm/username/tracks');
  process.exit(1);
}

console.log('🎵 Stats.fm Track Extractor\n');
console.log('📥 Открываю страницу:', statsUrl);

async function extractTracks(url) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('⏳ Загружаю страницу...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('⏳ Жду загрузки треков...');
    await page.waitForTimeout(3000); // Даем время JS отрендерить
    
    // Прокручиваем страницу чтобы загрузить все треки
    console.log('📜 Прокручиваю страницу для загрузки всех треков...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await page.waitForTimeout(2000);
    
    console.log('🔍 Извлекаю треки...');
    
    // Извлекаем треки
    const tracks = await page.evaluate(() => {
      const trackSet = new Set();
      
      // Ищем все ссылки на треки
      document.querySelectorAll('a[href*="/track/"]').forEach(link => {
        const text = link.textContent.trim();
        if (text && text.length > 3 && text.length < 200) {
          trackSet.add(text);
        }
      });
      
      // Также ищем через другие селекторы
      document.querySelectorAll('[data-testid*="track"]').forEach(elem => {
        const text = elem.textContent.trim();
        if (text && text.length > 3 && text.length < 200) {
          trackSet.add(text);
        }
      });
      
      return Array.from(trackSet);
    });
    
    return tracks;
    
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const tracks = await extractTracks(statsUrl);
    
    if (tracks.length === 0) {
      console.log('\n❌ Треки не найдены.');
      console.log('💡 Убедись что:');
      console.log('   - URL правильный');
      console.log('   - Профиль публичный');
      console.log('   - На странице есть треки');
      process.exit(1);
    }
    
    console.log(`\n✅ Найдено ${tracks.length} треков!\n`);
    console.log('═'.repeat(70));
    
    // Показываем первые 10 для превью
    tracks.slice(0, 10).forEach((track, i) => {
      console.log(`${i + 1}. ${track}`);
    });
    
    if (tracks.length > 10) {
      console.log(`   ... и еще ${tracks.length - 10} треков`);
    }
    
    console.log('═'.repeat(70));
    
    // Копируем в буфер
    const copyText = tracks.join('\n');
    
    exec(`echo "${copyText.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" | pbcopy`, (error) => {
      if (!error) {
        console.log('\n✅ ВСЕ ТРЕКИ СКОПИРОВАНЫ В БУФЕР ОБМЕНА!');
        console.log('\n📋 Теперь:');
        console.log('   1. Открой Spotify');
        console.log('   2. Создай новый плейлист');
        console.log('   3. Нажми Cmd+V (вставить)');
        console.log('   4. Наслаждайся! 🎵\n');
      } else {
        console.log('\n⚠️  Не удалось скопировать автоматически.');
        console.log('Скопируй треки выше вручную.');
      }
    });
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();

