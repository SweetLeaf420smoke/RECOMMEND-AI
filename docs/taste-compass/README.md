# TasteCompass — внедрение стратегии

**Видение:** [VISION-END-STATE.md](./VISION-END-STATE.md) — какие задачи решает сервис в идеале.  
**Название:** [NAMING.md](./NAMING.md) — что вычеркнуто, что в шортлисте.  
**Монетизация (черновик):** [MONETIZATION.md](./MONETIZATION.md) — кто платит, гипотезы, вернёмся позже.  
**Стиль текста (обязательно для UI):** [TEXT-AND-VOICE.md](./TEXT-AND-VOICE.md) — писать для человека, не «как код».

| Фаза | Документ |
|------|----------|
| A | [PHASE-A-RUNBOOK.md](./PHASE-A-RUNBOOK.md), [SURVEY-TEMPLATE.md](./SURVEY-TEMPLATE.md), [FEEDBACK-FORM-TEMPLATE.md](./FEEDBACK-FORM-TEMPLATE.md) |
| B | [TASTE-SCHEMA.md](./TASTE-SCHEMA.md), [CATALOG-FIELDS.md](./CATALOG-FIELDS.md), [PHASE-B-RUNBOOK.md](./PHASE-B-RUNBOOK.md) |
| C | В приложении: **http://127.0.0.1:3000/taste-compass/** (после `npm start`) |
| D | [PHASE-D-FEEDBACK-LOOP.md](./PHASE-D-FEEDBACK-LOOP.md) |
| E | [PHASE-E-EXPANSION.md](./PHASE-E-EXPANSION.md) |

Код: [../../routes/tasteCompass.js](../../routes/tasteCompass.js), [../../utils/tasteCompassEngine.js](../../utils/tasteCompassEngine.js), данные [../../data/taste-compass/places.json](../../data/taste-compass/places.json).

## Обратная связь респондентов

Файлы отзывов и расшифровок лежат **только на машине** в папке `docs/taste-compass/feedback/` (в GitHub не кладём — там только код для деплоя сайта).
