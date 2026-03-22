import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import { findMatches } from "./utils/matchEngine.js";
import fetch from "node-fetch";
import tasteCompassRouter from "./routes/tasteCompass.js";

dotenv.config();

const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? null
    : "dev-synq-session-not-for-production");
if (!sessionSecret) {
  console.error("Missing SESSION_SECRET (required in production)");
  process.exit(1);
}

const spotifyConfigured =
  Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET &&
      process.env.SPOTIFY_CALLBACK_URL
  );

if (process.env.MONGO_URI) {
  console.log("🔌 Connecting to MongoDB...");
  mongoose
    .connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
      console.error(
        "Check: 1) IP whitelist in Atlas, 2) Connection string, 3) Network"
      );
    });
} else {
  console.log(
    "ℹ️ MONGO_URI not set — MongoDB skipped (TasteCompass demo works without DB)."
  );
}

const app = express();
if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.get("/health", (req, res) => res.status(200).type("text/plain").send("ok"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    if (!process.env.MONGO_URI) return done(null, null);
    const user = await User.findById(id);
    done(null, user);
  } catch (e) {
    console.error("deserializeUser:", e.message);
    done(null, null);
  }
});

if (spotifyConfigured) {
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: process.env.SPOTIFY_CALLBACK_URL,
      },
      async (accessToken, refreshToken, expires_in, profile, done) => {
        try {
          console.log("🔑 Spotify auth callback:", profile.displayName);
          let user = await User.findOne({ spotifyId: profile.id });
          if (!user) {
            user = await User.create({
              spotifyId: profile.id,
              name: profile.displayName,
              avatar:
                profile.photos?.[0]?.value ||
                profile.photos?.[0] ||
                "https://via.placeholder.com/150",
              accessToken,
            });
            console.log("✅ New user created:", user.name);
          } else {
            user.accessToken = accessToken;
            await user.save();
            console.log("✅ User updated:", user.name);
          }
          return done(null, user);
        } catch (error) {
          console.error("❌ Auth error:", error);
          return done(error, null);
        }
      }
    )
  );
}

app.get("/", (req, res) => res.render("index"));
app.use("/taste-compass", tasteCompassRouter);

if (spotifyConfigured) {
  app.get(
    "/auth/spotify",
    passport.authenticate("spotify", {
      scope: [
        "user-read-email",
        "user-top-read",
        "playlist-modify-public",
        "playlist-modify-private",
      ],
    })
  );

  app.get(
    "/auth/spotify/callback",
    passport.authenticate("spotify", { failureRedirect: "/" }),
    async (req, res) => {
      try {
        console.log("📥 Callback received for:", req.user.name);
        const user = await User.findById(req.user._id);

        const apiUrl =
          "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term";
        console.log("🔗 Request URL:", apiUrl);
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        const data = await response.json();
        console.log("📦 Response status:", response.status);
        console.log("🎵 Got top artists:", data.items?.length || 0);
        console.log("🎸 Artists list:", data.items?.map((a) => a.name) || []);

        user.topArtists = data.items.map((a) => a.name);
        user.artistStats = data.items.map((artist, index) => ({
          name: artist.name,
          rank: index + 1,
          spotifyId: artist.id,
        }));
        await user.save();
        console.log("✅ Saved to DB:", user.topArtists.length, "artists");
        res.redirect("/profile");
      } catch (error) {
        console.error("❌ Callback error:", error);
        res.redirect("/?error=callback_failed");
      }
    }
  );
}

app.get("/profile", async (req, res) => {
  if (!req.user) return res.redirect("/");
  const matches = await findMatches(req.user);
  res.render("profile", { user: req.user, matches });
});

app.get("/refresh", async (req, res) => {
  if (!req.user) return res.redirect("/");
  
  try {
    const user = await User.findById(req.user._id);
    const period = req.query.period || 'medium_term';
    console.log("🔄 Refreshing data for:", user.name, "period:", period);
    
    const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${period}`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
      const data = await response.json();
      console.log("📦 Full API response:", JSON.stringify(data, null, 2));
      console.log("🎵 Got top artists:", data.items?.length || 0);
      console.log("🎸 Artists list:", data.items?.map((a) => a.name) || []);
      
      user.topArtists = data.items.map((a) => a.name);
      user.artistStats = data.items.map((artist, index) => ({
        name: artist.name,
        rank: index + 1,
        spotifyId: artist.id
      }));
      await user.save();
    console.log("✅ Saved to DB:", user.topArtists.length, "artists");
    
    res.redirect("/profile");
  } catch (error) {
    console.error("❌ Refresh error:", error);
    res.redirect("/profile?error=refresh_failed");
  }
});

app.get("/artist/:name", async (req, res) => {
  const artistName = decodeURIComponent(req.params.name);
  
  try {
    // Находим всех юзеров у кого этот артист в топе
    const users = await User.find({
      "artistStats.name": artistName
    });
    
    // Собираем статистику
    const listeners = users.map(user => {
      const artistStat = user.artistStats.find(a => a.name === artistName);
      const weight = 51 - artistStat.rank; // 1 место = 50, 50 место = 1
      return {
        name: user.name,
        avatar: user.avatar,
        rank: artistStat.rank,
        weight: weight,
        streams: weight // имитация стримов
      };
    }).sort((a, b) => a.rank - b.rank); // сортируем по рангу (лучший ранг первым)
    
    const totalListeners = listeners.length;
    const totalStreams = listeners.reduce((sum, l) => sum + l.streams, 0);
    
    res.render("artist", { 
      artistName, 
      listeners, 
      totalListeners,
      totalStreams,
      currentUser: req.user 
    });
  } catch (error) {
    console.error("❌ Artist page error:", error);
    res.redirect("/");
  }
});

app.get("/playlist-maker", (req, res) => {
  if (!req.user) {
    return res.redirect('/');
  }
  res.render("playlist-maker-v2", { user: req.user });
});

// Streaming endpoint для прогрессивной загрузки
app.get("/extract-tracks-stream", async (req, res) => {
  const url = req.query.url;
  
  if (!url || !url.includes('stats.fm')) {
    res.json({ error: 'Неправильная ссылка' });
    return;
  }
  
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  function sendEvent(data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
  
  try {
    // Извлекаем userId из разных форматов:
    // stats.fm/username
    // stats.fm/user/username
    // stats.fm/username/tracks
    let userId = null;
    
    if (url.includes('/user/')) {
      // Формат: stats.fm/user/username
      const match = url.match(/stats\.fm\/user\/([^\/\?]+)/);
      if (match) userId = match[1];
    } else {
      // Формат: stats.fm/username
      const match = url.match(/stats\.fm\/([^\/\?]+)/);
      if (match) userId = match[1];
    }
    
    if (!userId) {
      sendEvent({ error: 'Не могу извлечь userId из URL' });
      res.end();
      return;
    }
    
    sendEvent({ log: `👤 User ID: ${userId}` });
    let range = 'lifetime';
    const rangeMatch = url.match(/range=(\w+)/);
    if (rangeMatch) range = rangeMatch[1];
    
    sendEvent({ log: '📥 Запрашиваю stats.fm API...' });
    
    // Получаем все треки с пагинацией (по 50 за раз)
    let allItems = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=${range}&offset=${page * 50}&limit=50`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        hasMore = false;
      } else {
        allItems = allItems.concat(data.items);
        page++;
        sendEvent({ log: `📥 Страница ${page}: +${data.items.length} треков (всего ${allItems.length})` });
        
        // Если получили меньше 50, значит это последняя страница
        if (data.items.length < 50) {
          hasMore = false;
        }
      }
      
      // Защита от бесконечного цикла
      if (page > 20) break; // макс 1000 треков
    }
    
    if (allItems.length === 0) {
      sendEvent({ error: 'Треки не найдены' });
      res.end();
      return;
    }
    
    sendEvent({ log: `✅ Всего получено ${allItems.length} треков` });
    
    const data = { items: allItems };
    
    // Получаем данные профиля для названия плейлиста
    let profileName = userId; // username по умолчанию
    let displayName = null;
    try {
      const profileResponse = await fetch(`https://api.stats.fm/api/v1/users/${userId}`);
      const profileData = await profileResponse.json();
      if (profileData.item?.displayName) {
        displayName = profileData.item.displayName;
      }
    } catch (err) {
      console.log('Не удалось получить displayName, используем userId');
    }
    
    // Формат для плейлиста: username - DisplayName (если разные)
    let fullName = userId;
    if (displayName && displayName !== userId) {
      fullName = userId + ' - ' + displayName;
    }
    
    sendEvent({ profileName: fullName });
    
    // Сначала отправляем треки с ID
    const tracksWithId = [];
    const tracksWithoutId = [];
    
    data.items.forEach(item => {
      const spotifyId = item.track.externalIds?.spotify?.[0];
      const track = {
        position: item.position,
        name: `${item.track.name} - ${item.track.artists?.[0]?.name || ''}`,
        trackName: item.track.name,
        artistName: item.track.artists?.[0]?.name || '',
        spotifyId: spotifyId,
        spotifyUrl: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : null,
        streams: item.streams,
        playedMinutes: Math.round(item.playedMs / 60000)
      };
      
      if (spotifyId) {
        tracksWithId.push(track);
      } else {
        tracksWithoutId.push(track);
      }
    });
    
    sendEvent({ 
      log: `✅ Треки с ID: ${tracksWithId.length}, без ID: ${tracksWithoutId.length}`,
      tracks: tracksWithId,
      total: data.items.length,
      found: tracksWithId.length
    });
    
    // Теперь ищем остальные
    if (tracksWithoutId.length > 0) {
      sendEvent({ log: `🔍 Ищу ${tracksWithoutId.length} треков через Spotify Search...` });
      
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });
      
      const tokenData = await tokenResponse.json();
      const spotifyToken = tokenData.access_token;
      
      for (let i = 0; i < tracksWithoutId.length; i++) {
        const track = tracksWithoutId[i];
        
        try {
          // Очищаем название от (feat.), (Live), версий и т.д.
          let cleanTrackName = track.trackName
            .replace(/\(feat\.[^)]*\)/gi, '')
            .replace(/\(ft\.[^)]*\)/gi, '')
            .replace(/\(Live\)/gi, '')
            .replace(/- Live/gi, '')
            .replace(/\(.*?Remix\)/gi, '')
            .replace(/\(.*?Edit\)/gi, '')
            .replace(/\(.*?Version\)/gi, '')
            .replace(/\(.*?Remaster.*?\)/gi, '')
            .replace(/- \d{4} Remaster.*$/gi, '')
            .trim();
          
          const query = `track:${cleanTrackName} artist:${track.artistName}`;
          
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
          );
          
          const searchData = await searchResponse.json();
          
          if (searchData.tracks?.items?.length > 0) {
            const foundTrack = searchData.tracks.items[0];
            track.spotifyId = foundTrack.id;
            track.spotifyUrl = foundTrack.external_urls.spotify;
            
            sendEvent({ 
              log: `✅ [${i + 1}/${tracksWithoutId.length}] Найден: ${track.name}`,
              foundTrack: track,
              progress: i + 1,
              progressTotal: tracksWithoutId.length
            });
          } else {
            sendEvent({ 
              log: `❌ [${i + 1}/${tracksWithoutId.length}] Не найден: ${track.name}`,
              progress: i + 1,
              progressTotal: tracksWithoutId.length
            });
          }
        } catch (err) {
          sendEvent({ log: `⚠️ Ошибка поиска: ${track.name}` });
        }
      }
      
      const allTracks = [...tracksWithId, ...tracksWithoutId];
      const finalFound = allTracks.filter(t => t.spotifyId).length;
      
      sendEvent({ 
        log: `🎉 Готово! Найдено ${finalFound}/${data.items.length} треков`,
        complete: true,
        allTracks: allTracks,
        totalFound: finalFound
      });
    } else {
      sendEvent({ complete: true, allTracks: tracksWithId, totalFound: tracksWithId.length });
    }
    
    res.end();
    
  } catch (error) {
    sendEvent({ error: error.message });
    res.end();
  }
});

app.post("/extract-tracks", express.json(), async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.includes('stats.fm')) {
    return res.json({ error: 'Неправильная ссылка stats.fm' });
  }
  
  console.log('🎵 Extracting tracks from:', url);
  
  try {
    // Извлекаем userId из URL
    // Формат: https://stats.fm/{userId}/tracks
    const userIdMatch = url.match(/stats\.fm\/([^\/]+)/);
    if (!userIdMatch) {
      return res.json({ error: 'Не могу извлечь userId из ссылки' });
    }
    
    const userId = userIdMatch[1];
    console.log('👤 User ID:', userId);
    
    // Извлекаем range (lifetime, month, week)
    let range = 'lifetime';
    const rangeMatch = url.match(/range=(\w+)/);
    if (rangeMatch) {
      range = rangeMatch[1];
    }
    console.log('📅 Range:', range);
    
    // Запрашиваем треки напрямую из stats.fm API
    const apiUrl = `https://api.stats.fm/api/v1/users/${userId}/top/tracks?range=${range}`;
    console.log('📡 Запрос к API:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return res.json({ error: 'Треки не найдены. Возможно профиль приватный.' });
    }
    
    console.log(`✅ Получено ${data.items.length} треков`);
    
    // Извлекаем треки со Spotify ID
    const tracks = data.items.map((item, index) => {
      const spotifyId = item.track.externalIds?.spotify?.[0];
      const trackName = item.track.name;
      const artistName = item.track.artists?.[0]?.name || '';
      
      return {
        position: item.position,
        name: `${trackName} - ${artistName}`,
        trackName: trackName,
        artistName: artistName,
        spotifyId: spotifyId,
        spotifyUrl: spotifyId ? `https://open.spotify.com/track/${spotifyId}` : null,
        streams: item.streams,
        playedMs: item.playedMs,
        playedMinutes: Math.round(item.playedMs / 60000)
      };
    });
    
    const withId = tracks.filter(t => t.spotifyId).length;
    const withoutId = tracks.filter(t => !t.spotifyId);
    
    console.log(`✅ Обработано треков: ${tracks.length}`);
    console.log(`   С Spotify ID: ${withId}`);
    console.log(`   Без ID: ${withoutId.length} - пробуем искать через Search API...`);
    
    // Для треков без ID - ищем через Spotify Search
    if (withoutId.length > 0) {
      // Получаем Spotify токен
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });
      
      const tokenData = await tokenResponse.json();
      const spotifyToken = tokenData.access_token;
      
      let foundCount = 0;
      
      for (const track of withoutId) {
        try {
          const query = `track:${track.trackName} artist:${track.artistName}`;
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
          );
          
          const searchData = await searchResponse.json();
          
          if (searchData.tracks?.items?.length > 0) {
            const foundTrack = searchData.tracks.items[0];
            track.spotifyId = foundTrack.id;
            track.spotifyUrl = foundTrack.external_urls.spotify;
            foundCount++;
            console.log(`   ✅ Найден: ${track.name}`);
          } else {
            console.log(`   ❌ Не найден: ${track.name}`);
          }
        } catch (err) {
          console.log(`   ⚠️  Ошибка поиска: ${track.name}`);
        }
      }
      
      console.log(`\n🔍 Дополнительно найдено через поиск: ${foundCount}`);
      console.log(`📊 Итого с Spotify ID: ${withId + foundCount}/${tracks.length}`);
    }
    
    res.json({ tracks });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.json({ error: error.message });
  }
});

app.post("/create-playlist", express.json(), async (req, res) => {
  if (!req.user) {
    return res.json({ error: 'Нужна авторизация' });
  }
  
  const { trackUris, playlistName, range } = req.body;
  
  if (!trackUris || trackUris.length === 0) {
    return res.json({ error: 'Нет треков для добавления' });
  }
  
  try {
    console.log(`🎵 Creating playlist for ${req.user.name}: ${trackUris.length} tracks`);
    
    // Получаем Spotify User ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${req.user.accessToken}` }
    });
    const userData = await userResponse.json();
    
    // Создаём плейлист
    const createResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${req.user.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: playlistName,
        description: `📁 stats.fm | Created by Synq | ${range || 'lifetime'}`,
        public: false
      })
    });
    
    const playlist = await createResponse.json();
    
    if (playlist.error) {
      throw new Error(playlist.error.message);
    }
    
    console.log(`✅ Playlist created: ${playlist.name} (${playlist.id})`);
    
    // Добавляем треки (по 100 за раз - лимит Spotify)
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.user.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: batch })
      });
      
      console.log(`  Added ${i + batch.length}/${trackUris.length} tracks`);
    }
    
    console.log(`🎉 Playlist ready: ${playlist.external_urls.spotify}`);
    
    res.json({ 
      success: true,
      playlist: {
        name: playlist.name,
        url: playlist.external_urls.spotify,
        trackCount: trackUris.length
      }
    });
    
  } catch (error) {
    console.error('❌ Playlist creation error:', error);
    res.json({ error: error.message });
  }
});

app.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

const port = Number(process.env.PORT) || 3000;
const host =
  process.env.BIND_HOST ||
  (process.env.PORT != null && process.env.PORT !== "" ? "0.0.0.0" : "127.0.0.1");
app.listen(port, host, () =>
  console.log(`✅ Synq running on http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`)
);

