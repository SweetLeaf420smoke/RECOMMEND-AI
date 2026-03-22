# 🚀 Быстрая настройка Synq

## Шаг 1: Spotify Developer App

1. Открой https://developer.spotify.com/dashboard
2. Нажми **"Create app"**
3. Заполни:
   - **App name**: Synq
   - **App description**: Music taste matching
   - **Redirect URI**: `http://127.0.0.1:3000/auth/spotify/callback`
4. Сохрани и скопируй:
   - **Client ID**
   - **Client Secret**

## Шаг 2: Настрой .env

Открой файл `.env` и вставь свои данные:

```
SPOTIFY_CLIENT_ID=твой_client_id_сюда
SPOTIFY_CLIENT_SECRET=твой_client_secret_сюда
SPOTIFY_CALLBACK_URL=http://127.0.0.1:3000/auth/spotify/callback
MONGO_URI=mongodb://localhost:27017/synq
SESSION_SECRET=любой_случайный_текст
```

## Шаг 3: MongoDB

### Вариант 1 (РЕКОМЕНДУЮ): MongoDB Atlas (облако, бесплатно)

1. Открой https://www.mongodb.com/cloud/atlas/register
2. Зарегистрируйся
3. Создай **FREE** кластер (выбери регион ближе к тебе)
4. Создай пользователя базы данных (запомни имя и пароль)
5. Добавь IP адрес: `0.0.0.0/0` (для доступа отовсюду)
6. Получи **connection string**:
   - Нажми "Connect" → "Connect your application"
   - Скопируй строку типа: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
7. В `.env` замени `MONGO_URI` на эту строку:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/synq?retryWrites=true&w=majority
   ```

### Вариант 2: Локально

Если у тебя установлен Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

Оставь `MONGO_URI=mongodb://localhost:27017/synq` в `.env`

## Шаг 4: Запуск

```bash
npm start
```

Открой браузер: **http://127.0.0.1:3000**

---

## ✅ Проверка

1. Должна открыться страница с кнопкой "Подключить Spotify"
2. Нажми на кнопку → авторизуйся в Spotify
3. Увидишь свой профиль с топ-артистами
4. Когда зарегистрируются другие пользователи, увидишь совпадения!

