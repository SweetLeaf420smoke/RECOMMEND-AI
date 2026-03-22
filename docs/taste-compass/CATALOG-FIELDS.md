# Поля каталога мест и событий (фаза B)

Универсальная карточка для ручного списка и для JSON в MVP.

## Обязательные поля

| Поле | Тип | Пример |
|------|-----|--------|
| `id` | string | `berlin_vinyl_01` |
| `cityId` | string | `berlin_demo` |
| `name` | string | Название на языке UI |
| `type` | string | `venue` или `event` |
| `tags` | string[] | Пересекаются с опросом (музыка/кино/сцена) |
| `nightType` | string | Один из тех же, что `nightPreference` |
| `budget` | string | `low` / `mid` / `high` |
| `url` | string | Сайт или карта |
| `why` | string | Коротко: почему это для «такого» вкуса (для объяснимости) |

## Опционально

| Поле | Тип | Описание |
|------|-----|----------|
| `neighborhood` | string | Район |
| `startsAt` | string (ISO) | Для событий |
| `notes` | string | Внутренние заметки куратора |

## Файл данных в проекте

Сид для MVP: [../../data/taste-compass/places.json](../../data/taste-compass/places.json).
