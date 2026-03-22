# 🎵 Synq

Сервис для поиска людей с похожим музыкальным вкусом через Spotify.

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка Spotify API

1. Зайди на https://developer.spotify.com/dashboard
2. Создай новое приложение
3. В настройках добавь Redirect URI: `http://localhost:3000/auth/spotify/callback`
4. Скопируй Client ID и Client Secret

### 3. Настройка .env

Скопируй `.env.example` в `.env` и заполни:
```bash
cp .env.example .env
```

Вставь свои данные из Spotify Dashboard.

### 4. MongoDB

**Вариант A: MongoDB Atlas (проще, бесплатно):**
1. Зайди на https://www.mongodb.com/cloud/atlas/register
2. Создай бесплатный кластер
3. Получи connection string (типа `mongodb+srv://user:pass@cluster.mongodb.net/synq`)
4. Вставь его в `.env` как `MONGO_URI`

**Вариант B: Локально (если есть Docker):**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### 5. Запуск сервера

```bash
npm start
```

Открой http://127.0.0.1:3000

## Как работает

1. Подключаешь Spotify аккаунт
2. Synq получает твои топ-артисты
3. Алгоритм ищет пользователей с похожими артистами
4. Показывает процент совпадения с другими пользователями

## Технологии

- Node.js + Express
- Passport.js (Spotify OAuth)
- MongoDB + Mongoose
- EJS (шаблоны)

