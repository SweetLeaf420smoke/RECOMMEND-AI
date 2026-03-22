import express from "express";
import {
  loadPlacesData,
  rankPlaces,
  loadFeedbackBoosts,
  appendFeedback,
} from "../utils/tasteCompassEngine.js";

const router = express.Router();
const DEMO_VERSION = "v2.2";

router.use((req, res, next) => {
  res.locals.demoVersion = DEMO_VERSION;
  next();
});

function arr(v) {
  if (v == null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

function cityLabelFor(cityId) {
  const { cities } = loadPlacesData();
  return cities.find((c) => c.id === cityId)?.label || cityId;
}

function buildResultsViewData(profile, ranked, feedbackNote) {
  const cityLabel = cityLabelFor(profile.cityId);
  const topPick = ranked.length ? ranked[0] : null;
  const alternatives = ranked.slice(1, 5);
  const hiddenCount = Math.max(0, ranked.length - 5);
  return {
    profile,
    cityLabel,
    topPick,
    alternatives,
    hiddenCount,
    ranked,
    feedbackNote: feedbackNote || null,
    demoVersion: DEMO_VERSION,
  };
}

router.get("/", (req, res) => {
  const { cities } = loadPlacesData();
  res.render("taste-compass/index", { cities, title: "TasteCompass", demoVersion: DEMO_VERSION });
});

router.get("/survey", (req, res) => {
  const { cities } = loadPlacesData();
  const err = req.query.err;
  let errorMessage = null;
  if (err === "night") {
    errorMessage = "Отметь хотя бы один формат вечера. Так мы не будем гадать за тебя.";
  }
  if (err === "mood") {
    errorMessage = "Выбери один вариант настроения вечера, чтобы подборка не была случайной.";
  }
  res.render("taste-compass/survey", {
    cities,
    title: "Подборка вечера",
    demoVersion: DEMO_VERSION,
    errorMessage,
  });
});

const MOODS = ["calm", "lively", "late"];

router.post("/results", (req, res) => {
  const nights = arr(req.body.night);
  if (nights.length === 0) {
    return res.redirect("/taste-compass/survey?err=night");
  }
  const eveningMood = req.body.eveningMood;
  if (!eveningMood || !MOODS.includes(eveningMood)) {
    return res.redirect("/taste-compass/survey?err=mood");
  }

  const displayName = (req.body.displayName || "").trim();
  const profile = {
    profileVersion: "0.3",
    displayName,
    cityId: req.body.cityId,
    datePlan: (req.body.datePlan || "").trim(),
    musicTags: arr(req.body.music),
    filmTags: arr(req.body.film),
    nightPreferences: nights,
    budget: req.body.budget || "mid",
    company: req.body.company || "any",
    eveningMood,
  };

  req.session.tasteProfile = profile;
  const boosts = loadFeedbackBoosts();
  const ranked = rankPlaces(profile, boosts);
  res.render("taste-compass/results", {
    title: "Подборка",
    ...buildResultsViewData(profile, ranked),
  });
});

router.post("/feedback", (req, res) => {
  const { placeId, action } = req.body;
  if (!placeId || !["went", "hide"].includes(action)) {
    return res.redirect("/taste-compass/survey");
  }
  appendFeedback({ placeId, action });
  const profile = req.session.tasteProfile;
  if (!profile) {
    return res.redirect("/taste-compass/survey");
  }
  const boosts = loadFeedbackBoosts();
  const ranked = rankPlaces(profile, boosts);
  res.render("taste-compass/results", {
    title: "Подборка",
    ...buildResultsViewData(profile, ranked, "Учли твой ответ, порядок мог чуть сдвинуться."),
  });
});

export default router;
