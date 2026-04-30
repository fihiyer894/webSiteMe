# telegrambot.studio

Сайт агенції з розробки Telegram-ботів та лендінгів.

---

## Структура проєкту

```
/
├── index.html        ← весь фронтенд (один файл)
├── server.js         ← Node.js бекенд (Telegram API proxy)
├── package.json
├── .env              ← ваші секрети (не пушити в git!)
├── .env.example      ← шаблон для інших розробників
├── .gitignore
└── test-telegram.js  ← тест підключення до бота
```

---

## Локальний запуск

### 1. Встановити залежності
```bash
npm install
```

### 2. Перевірити .env
```
TELEGRAM_TOKEN=ваш_токен
TELEGRAM_USER_ID=ваш_chat_id
FRONTEND_URL=http://localhost:5500
PORT=3001
```

### 3. Запустити бекенд
```bash
npm start
# Сервер на http://localhost:3001
```

### 4. Відкрити фронтенд
Відкрийте `index.html` у браузері або через Live Server (VS Code).

### 5. Тест Telegram
```bash
node test-telegram.js
```

---

## Деплой

### Фронтенд → Netlify (безкоштовно)
1. Зайдіть на [netlify.com](https://netlify.com)
2. Перетягніть `index.html` у браузер
3. Готово — отримаєте посилання

### Бекенд → Railway (безкоштовно)
1. Зайдіть на [railway.app](https://railway.app)
2. `New Project → Deploy from GitHub`
3. У Settings → Variables додайте:
   ```
   TELEGRAM_TOKEN=...
   TELEGRAM_USER_ID=...
   FRONTEND_URL=https://ваш-домен.netlify.app
   PORT=3001
   ```
4. Скопіюйте URL бекенду (вигляд: `https://xxx.railway.app`)

### Підключити фронтенд до бекенду
В `index.html` знайдіть рядок:
```js
const res = await fetch('http://localhost:3001/api/lead', {
```
Замініть на:
```js
const res = await fetch('https://xxx.railway.app/api/lead', {
```

---

## Важливо

- `.env` ніколи не пушити в GitHub — токен Telegram треба тримати у секреті
- Перед запуском в продакшн приберіть `showSuccess()` з demo fallback у `index.html`

---

© 2025 telegrambot.studio
