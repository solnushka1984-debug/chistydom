# ЧистыйДом — калькулятор уборки

Одностраничный сайт клининговой компании «ЧистыйДом»: интерактивный расчёт стоимости уборки, чек-лист того, что входит в работу, блок о компании и форма заявки.

> **Это демо.** Заявки сохраняются только в `localStorage` браузера и никуда не отправляются. Контакты (`App.tsx:5-9`) — заглушки: подставьте реальные телефон, почту и ссылки на соцсети перед публичным запуском.

## Что внутри

- **Калькулятор стоимости** — ползунок площади (20–200 м²), три вида уборки и дополнительные услуги. Цена считается как `max(площадь × тариф, минимальный заказ) + доп. услуги`, раскладка цены показывается отдельно.
- **Тарифы:** поддерживающая 90 ₽/м², генеральная 150 ₽/м², после ремонта 220 ₽/м². Допы: мытьё окон 500 ₽, химчистка мебели 1500 ₽, уборка балкона 800 ₽. Минимальный заказ — 2500 ₽. Все числа лежат в `App.tsx:11-13` — меняются в одном месте.
- **Форма заявки** с нормализацией российского телефона до формата `+7 (XXX) XXX-XX-XX` и сохранением в браузере.
- Вёрстка и анимации — на чистом CSS (`src/index.css`), без зависимости от API.

## Стек

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 19.1 + Vite 7, Tailwind CSS 4
- Бэкенд: Express 5, PostgreSQL + Drizzle ORM, Zod, Orval (codegen из OpenAPI)

## Структура

```
artifacts/
  chistydom/        # сайт: калькулятор, форма, стили
  api-server/       # REST API (пока только GET /api/healthz)
  mockup-sandbox/   # песочница компонентов Replit
lib/
  api-client-react/ # сгенерированный Orval API-клиент
  api-zod/          # сгенерированные Zod-схемы
  api-spec/         # OpenAPI-спецификация
  db/               # Drizzle-схема и пул соединений
scripts/            # служебные скрипты
```

Сайт сейчас **не обращается** к `api-server` и к базе: схема БД (`lib/db/src/schema/index.ts`) пуста, а форма пишет в `localStorage`. Бэкенд — заготовка на будущее.

## Публичная ссылка

Сайт опубликован на GitHub Pages: **https://solnushka1984-debug.github.io/chistydom/**

Деплой делает GitHub Actions (`.github/workflows/deploy.yml`) — бесплатно, без внешних сервисов. Он стартует автоматически при каждом пуше в `main`, либо вручную: вкладка Actions → «build-and-deploy» → «Run workflow».

Важные детали:

- Pages собран из статистики, сервер не нужен: заявка никуда не уходит, список живёт в браузере.
- `BASE_PATH` в workflow обязан совпадать с путём Pages (`/chistydom/`). Переименуешь репозиторий — правь и `BASE_PATH`, и абсолютные ссылки `og:image` в `artifacts/chistydom/index.html:14,21`.
- Картинка-превью для ссылок — `artifacts/chistydom/public/og.png`. Перегенерировать: `powershell -File scripts/make-og-image.ps1` (тексты — в `scripts/og-image-text.json`).
- Проверить, что превью обновилось в мессенджере, можно через переиндексацию: Telegram — `@WebAppBot`/`/refresh`, либо просто послать ссылку в сохранённые сообщения заново после смены `og:image`.

## Запуск

Требуется Node.js 24+ и pnpm.

```bash
pnpm install
```

Разработочный сервер сайта (Vite требует переменные `PORT` и `BASE_PATH`):

```bash
# Linux / macOS
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/chistydom run dev
```

```powershell
# Windows PowerShell
$env:PORT=3000; $env:BASE_PATH="/"; pnpm --filter @workspace/chistydom run dev
```

Сборка и проверка типов:

```bash
pnpm run build       # typecheck + сборка всех пакетов
pnpm run typecheck   # только проверка типов
```

Продакшен-сборка сайта попадает в `artifacts/chistydom/dist/public`.

API-сервер (сейчас только `GET /api/healthz`):

```bash
pnpm --filter @workspace/api-server run dev
```

База данных подключена, но не используется: ни один исходник не импортирует `@workspace/db`, поэтому `DATABASE_URL` для запуска не нужен. Он понадобится, когда в `lib/db/src/schema/` появятся таблицы (`pnpm --filter @workspace/db run push`).

После правки OpenAPI-спецификации — перегенерировать клиент и схемы:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Известные ограничения

- `preinstall` в корневом `package.json` написан через `sh -c`, а `dev` в `artifacts/api-server/package.json` — через `export`. На Windows без Git Bash это ломает и сам `pnpm install`; обходной вариант: `pnpm install --ignore-scripts`. В WSL, macOS и Linux `pnpm install` работает как есть. Для `vite` (сайт) это больше нигде не мешает.
- `pnpm-workspace.yaml` запрещает установку npm-пакатов младше 1 суток (`minimumReleaseAge: 1440`) — защита от supply-chain атак, отключать не стоит.
- `mockup-sandbox` и большая часть компонентов `src/components/ui/` — инфраструктура шаблона Replit, сайтом не используются.
- Файла `LICENSE` в репозитории нет; в корневом `package.json` стоит `"license": "MIT"` для приватного workspace-пакета. Если проект пойдёт в публичный доступ, реши лицензию явно.
