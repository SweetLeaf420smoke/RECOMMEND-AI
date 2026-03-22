import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLACES_PATH = path.join(__dirname, "../data/taste-compass/places.json");
const FEEDBACK_PATH = path.join(__dirname, "../data/taste-compass/feedback-log.jsonl");

export function loadPlacesData() {
  const raw = fs.readFileSync(PLACES_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {object} profile - musicTags, filmTags, nightPreferences[], budget, cityId
 * @param {object} boosts - placeId -> number (from feedback log)
 */
export function rankPlaces(profile, boosts = {}) {
  const { places } = loadPlacesData();
  const cityId = profile.cityId;
  const list = places.filter((p) => p.cityId === cityId);

  return list
    .map((place) => {
      const { score, reasons } = scorePlace(profile, place);
      const feedbackBoost = boosts[place.id] || 0;
      const total = score + feedbackBoost;
      const reasonLines = [...reasons];
      if (feedbackBoost > 0) {
        reasonLines.push("Ты раньше отметил, что такой вариант заходил, и мы чуть подняли его в списке.");
      }
      if (feedbackBoost < 0) {
        reasonLines.push("Ты скрывал похожее, поэтому опустили приоритет.");
      }
      return { place, score: total, baseScore: score, feedbackBoost, reasons: reasonLines };
    })
    .sort((a, b) => b.score - a.score);
}

export function scorePlace(profile, place) {
  const reasons = [];
  let score = 0;

  const music = new Set(profile.musicTags || []);
  const film = new Set(profile.filmTags || []);
  const nightPrefs = profile.nightPreferences?.length
    ? profile.nightPreferences
    : profile.nightPreference
      ? [profile.nightPreference]
      : [];

  for (const t of place.tags || []) {
    if (music.has(t)) {
      score += 12;
      reasons.push(`Совпадает с твоей музыкой/сценой: ${labelTag(t)}.`);
    }
    if (film.has(t)) {
      score += 10;
      reasons.push(`Пересекается с тем, что ты смотришь: ${labelTag(t)}.`);
    }
  }

  const nightScore = scoreNightMatch(place.nightType, nightPrefs);
  score += nightScore.points;
  if (nightScore.text) reasons.push(nightScore.text);

  const moodScore = scoreEveningMood(profile.eveningMood, place.nightType);
  score += moodScore.points;
  for (const line of moodScore.reasons) reasons.push(line);

  const coScore = scoreCompany(profile.company, place.nightType);
  score += coScore.points;
  for (const line of coScore.reasons) reasons.push(line);

  if (place.budget === profile.budget) {
    score += 8;
    reasons.push("Бюджет на вечер совпадает с твоим.");
  } else if (budgetDistance(place.budget, profile.budget) === 1) {
    score += 3;
    reasons.push("Бюджет близкий к выбранному.");

  }

  // Небольшой смысл сверх тавтологии: если несколько тегов совпало, это не просто одна галочка
  const tagHits = (place.tags || []).filter((t) => music.has(t) || film.has(t)).length;
  if (tagHits >= 2) {
    score += 5;
    reasons.push("Несколько твоих направлений сходятся в одном месте, это сильнее одного совпадения.");
  }

  if (!reasons.length) {
    reasons.push("Черновой вариант под город, совпадений по тегам мало, лучше уточнить опрос или каталог.");
  }

  return { score, reasons: reasons.filter(Boolean) };
}

function scoreNightMatch(placeNight, nightPrefs) {
  if (!nightPrefs.length) {
    return {
      points: 6,
      text: "Формат вечера не отмечен, поэтому оцениваем без этого фильтра.",
    };
  }
  let best = 0;
  let bestText = "";
  for (const n of nightPrefs) {
    if (placeNight === n) {
      return {
        points: 18,
        text: `Формат совпадает с тем, что ты отметил: ${labelNight(placeNight)}.`,
      };
    }
    if (neighborNight(placeNight, n) && best < 6) {
      best = 6;
      bestText = `Рядом с тем, что ты отметил по вечеру (${labelNight(placeNight)}). Подойдёт, если сегодня хочется чуть сменить формат.`;
    }
  }
  if (best) return { points: best, text: bestText };
  return { points: 0, text: "" };
}

/** Настроение вечера: спокойно / шумно-социально / до утра */
function scoreEveningMood(mood, nightType) {
  const reasons = [];
  if (!mood) return { points: 0, reasons };
  let points = 0;
  if (mood === "calm") {
    if (nightType === "quiet" || nightType === "cinema") {
      points += 14;
      reasons.push("Под твоё настроение «потише и без давления толпы».");
    } else if (nightType === "bar") {
      points += 7;
      reasons.push("Бар без обязательного танцпола до утра, ближе к спокойному вечеру.");
    } else if (nightType === "cinema_bar") {
      points += 8;
      reasons.push("Кино и потом спокойнее второй заход, без клубного шума.");
    } else if (nightType === "club") {
      points -= 14;
      reasons.push("Клуб до утра обычно громче, чем спокойный вечер, выше в списке будут спокойнее варианты.");
    } else if (nightType === "concert") {
      points += 4;
      reasons.push("Концерт может быть по-разному, но это уже событие, а не тихий бар.");
    }
  }
  if (mood === "lively") {
    if (nightType === "bar" || nightType === "concert") {
      points += 14;
      reasons.push("Под настроение «народ, разговоры, шумный зал».");
    } else if (nightType === "club") {
      points += 10;
      reasons.push("Близко к шумной ночи, даже если ты не выбрал клуб отдельной галочкой.");
    } else if (nightType === "quiet" || nightType === "cinema") {
      points -= 6;
      reasons.push("Это тише, чем шумный бар, если хочешь больше шума и людей, смотри пункты ниже.");
    }
  }
  if (mood === "late") {
    if (nightType === "club") {
      points += 16;
      reasons.push("Под настроение «до утра и танцпол».");
    } else if (nightType === "concert") {
      points += 10;
      reasons.push("Концерт часто тянется поздно, близко к ночному ритму.");
    } else if (nightType === "bar") {
      points += 6;
      reasons.push("Бар может затянуться, хотя это не обязательно клуб.");
    } else if (nightType === "quiet" || nightType === "cinema") {
      points -= 10;
      reasons.push("Формат обычно раньше заканчивается, чем «до утра»; ниже будут ночные варианты.");
    }
  }
  return { points, reasons };
}

function scoreCompany(company, nightType) {
  const reasons = [];
  if (!company || company === "any") return { points: 0, reasons };
  let points = 0;
  if (company === "family_kids") {
    if (nightType === "club") {
      points -= 22;
      reasons.push("Ночной клуб редко подходит для вечера с детьми; выше спокойнее варианты.");
    } else if (nightType === "cinema" || nightType === "quiet") {
      points += 14;
      reasons.push("Спокойный формат удобнее с детьми или всей семьёй.");
    } else if (nightType === "cinema_bar") {
      points += 8;
      reasons.push("Кино и спокойный второй заход часто проще с семьёй, чем клуб.");
    } else if (nightType === "bar") {
      points += 3;
      reasons.push("Бар зависит от площадки; в демо это мягкий вариант.");
    } else if (nightType === "concert") {
      points -= 4;
      reasons.push("Концерт может быть громко и поздно, с детьми лучше смотреть по возрасту и времени начала.");
    }
  }
  if (company === "couple") {
    if (["bar", "cinema", "quiet", "cinema_bar", "concert"].includes(nightType)) {
      points += 6;
      reasons.push("Формат нормально ложится на вечер вдвоём.");
    }
  }
  if (company === "friends") {
    if (["bar", "club", "concert"].includes(nightType)) {
      points += 7;
      reasons.push("Удобно, когда идёте компанией.");
    }
  }
  if (company === "open") {
    if (nightType === "bar" || nightType === "club") {
      points += 6;
      reasons.push("В баре и клубе проще пересечься с людьми, чем в тихом зале кино.");
    }
  }
  if (company === "solo") {
    if (["cinema", "quiet", "concert", "bar"].includes(nightType)) {
      points += 4;
      reasons.push("Зайти одному здесь обычно нормально.");
    }
  }
  return { points, reasons };
}

function neighborNight(a, b) {
  const neighbors = {
    bar: ["quiet", "cinema_bar"],
    club: ["concert"],
    concert: ["club", "bar"],
    cinema: ["cinema_bar", "quiet"],
    cinema_bar: ["cinema", "bar"],
    quiet: ["bar", "cinema"],
  };
  return neighbors[b]?.includes(a);
}

function budgetDistance(b1, b2) {
  const r = { low: 0, mid: 1, high: 2 };
  return Math.abs((r[b1] ?? 1) - (r[b2] ?? 1));
}

function labelTag(t) {
  const m = {
    electronic: "электроника / клубы",
    dub: "даб / саундсистем",
    indie: "инди",
    hip_hop: "хип-хоп",
    jazz: "джаз",
    classical: "классика",
    arthouse: "артхаус",
    blockbuster: "блокбастеры",
    documentary: "документалистика",
    asian_cinema: "азиатское кино",
    horror: "ужасы",
    cinema: "кино",
    club: "клуб",
    bar: "бар",
    concert: "концерт",
  };
  return m[t] || t;
}

function labelNight(n) {
  const m = {
    club: "клуб до утра",
    bar: "бар и разговор",
    concert: "концерт",
    cinema: "кино в зале",
    cinema_bar: "кино и потом бар",
    quiet: "спокойно, без шума",
  };
  return m[n] || n;
}

export function loadFeedbackBoosts() {
  const boosts = {};
  try {
    const txt = fs.readFileSync(FEEDBACK_PATH, "utf8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (row.action === "went") boosts[row.placeId] = (boosts[row.placeId] || 0) + 4;
      if (row.action === "hide") boosts[row.placeId] = (boosts[row.placeId] || 0) - 25;
    }
  } catch {
    // файла ещё нет
  }
  return boosts;
}

export function appendFeedback(row) {
  const line = JSON.stringify({ ...row, ts: new Date().toISOString() }) + "\n";
  fs.mkdirSync(path.dirname(FEEDBACK_PATH), { recursive: true });
  fs.appendFileSync(FEEDBACK_PATH, line, "utf8");
}
