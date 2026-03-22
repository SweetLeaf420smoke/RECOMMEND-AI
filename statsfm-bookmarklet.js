javascript:(function(){
  // Собираем все треки со страницы
  const tracks = [];
  
  // Ищем ссылки на треки
  document.querySelectorAll('a[href*="/track/"]').forEach(link => {
    const text = link.textContent.trim();
    if (text && text.length > 3 && text.length < 200) {
      tracks.push(text);
    }
  });
  
  // Убираем дубликаты
  const unique = [...new Set(tracks)];
  
  if (unique.length === 0) {
    alert('Треки не найдены! Попробуй прокрутить страницу вниз.');
    return;
  }
  
  // Копируем в буфер
  const text = unique.join('\n');
  navigator.clipboard.writeText(text).then(() => {
    alert(`✅ Скопировано ${unique.length} треков в буфер!\n\nТеперь:\n1. Открой Spotify\n2. Создай новый плейлист\n3. Вставь (Cmd+V)`);
  }).catch(() => {
    // Если копирование не работает, показываем текст
    const w = window.open('', '', 'width=600,height=400');
    w.document.write('<pre>' + text + '</pre>');
  });
})();

