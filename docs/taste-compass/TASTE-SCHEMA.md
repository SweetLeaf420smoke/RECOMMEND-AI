# Схема профиля вкуса (фаза B)

Версия v0 — одна страница, чтобы не переписывать поля при переходе к приложению.

## Идентификаторы

| Поле | Тип | Пример |
|------|-----|--------|
| `profileVersion` | string | `"0.1"`, `"0.2"` или `"0.3"` |
| `cityId` | string | `berlin_demo`, `tokyo_demo` |

## Предпочтения (сохраняются из опроса)

| Поле | Тип | Описание |
|------|-----|----------|
| `musicTags` | string[] | Теги музыки/сцены из фиксированного списка |
| `filmTags` | string[] | Теги кино |
| `nightPreference` | string | Один из: `club`, `bar`, `concert`, `cinema`, `cinema_bar`, `quiet` (legacy) |
| `nightPreferences` | string[] | Несколько форматов вечера; то же множество значений (демо v2) |
| `displayName` | string | Опционально, как обращаться в тексте |
| `datePlan` | string | Опционально, когда планируешь выйти (свободный текст) |
| `budget` | string | `low`, `mid`, `high` |
| `company` | string | `solo`, `couple`, `friends`, `family_kids`, `open`, `any` |
| `eveningMood` | string | Одно из: `calm` (спокойно), `lively` (шумно, по-людски), `late` (ночь напролёт) |

## Согласованность с кодом

В приложении MVP поля совпадают с именами в форме `/taste-compass/survey` и с полями в [../utils/tasteCompassEngine.js](../../utils/tasteCompassEngine.js).

## Расширения позже

- `travelMode` (дом / в пути / клуб) — фаза D+.  
- Отдельные веса по жанрам — после накопления данных.
