# 🎭 MAFIA UZ — Professional Telegram Mafia Bot

> O'zbek tilidagi professional Mafia o'yini boti. Haqiqiy kecha-kunduz tizimi, maxfiy rollar, ovoz berish, reyting va maskalar!

---

## 📋 MUNDARIJA

1. [Talablar](#talablar)
2. [O'rnatish](#ornatish)
3. [Bot sozlash](#bot-sozlash)
4. [Ishga tushirish](#ishga-tushirish)
5. [O'yin qoidalari](#oyin-qoidalari)
6. [Fayl tuzilmasi](#fayl-tuzilmasi)
7. [Serverga joylashtirish](#serverga-joylashtirish)

---

## ⚙️ TALABLAR

- **Node.js** v18 yoki undan yuqori
- **npm** (Node.js bilan birga keladi)
- **Telegram** akkaunti
- **BotFather** orqali yaratilgan bot tokeni

---

## 🚀 O'RNATISH

### 1. Node.js o'rnatish (Windows)

1. [nodejs.org](https://nodejs.org) saytiga boring
2. **LTS** versiyasini yuklab oling
3. O'rnatuvchini ishga tushiring (barcha sozlamalarni qoldiring)
4. Terminal ochib tekshiring:
   ```
   node --version
   npm --version
   ```

### 2. BotFather orqali bot yaratish

1. Telegramda **@BotFather** ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting: `MAFIA UZ`
4. Username kiriting: `mafia_uz_bot` (yoki boshqa)
5. **Token**ni nusxalab oling (8539xxxx:AAF...)

### 3. Loyihani sozlash

```bash
# Papkaga o'tish
cd "C:\Users\User\Desktop\Mafiya"

# Kutubxonalarni o'rnatish
npm install

# .env faylini yaratish
copy .env.example .env
```

### 4. `.env` faylini tahrirlash

Notepad bilan `.env` faylini oching va quyidagilarni to'ldiring:

```env
BOT_TOKEN=8539xxxxxx:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_IDS=your_telegram_id_here
```

> 💡 O'z Telegram ID'ingizni bilish uchun @userinfobot ga yozing

---

## 🎮 ISHGA TUSHIRISH

```bash
# Oddiy ishga tushirish
npm start

# Ishlab chiqish rejimi (avtoyangilanish bilan)
npm run dev

# Testlarni ishga tushirish
npm test
```

---

## 🎭 O'YIN QOIDALARI

### Rollar

| Rol | Belgi | Vazifa |
|-----|-------|--------|
| **Mafia** | 🔪 | Har kecha bir fuqaroni o'ldiradi |
| **Komissar** | 🕵️ | Har kecha kimdir mafia ekanini tekshiradi |
| **Shifokor** | 🩺 | Har kecha kimdir himoya qiladi |
| **Fuqaro** | 👨 | Muhokama va ovoz berish orqali mafiyani topadi |

### Rollar taqsimlash

| O'yinchilar | Mafia | Komissar | Shifokor | Fuqaro |
|------------|-------|---------|---------|--------|
| 4-5 | 1 | — | 1 | 2-3 |
| 6-7 | 1 | 1 | 1 | 3-4 |
| 8-9 | 2 | 1 | 1 | 4-5 |
| 10-12 | 3 | 1 | 1 | 5-7 |
| 13-15 | 4 | 1 | 1 | 7-9 |

### G'alaba shartlari

- **Fuqarolar** — barcha mafialarni o'yindan chiqarsa g'alaba
- **Mafia** — tirik mafiya soni ≥ tirik fuqarolar bo'lsa g'alaba

### O'yin ketma-ketligi

```
Lobbi → O'yin boshlanishi → [Kecha → Kunduz → Ovoz berish] × N → G'alaba
```

---

## 📁 FAYL TUZILMASI

```
Mafiya/
├── src/
│   ├── bot.js              # Asosiy bot fayli
│   ├── config.js           # Sozlamalar
│   ├── commands/           # Bot buyruqlari
│   │   ├── startCommand.js
│   │   ├── helpCommand.js
│   │   ├── gameCommands.js
│   │   └── adminCommand.js
│   ├── handlers/           # Tugma va matn handlerlari
│   │   ├── textHandler.js
│   │   └── callbackHandler.js
│   ├── game/               # O'yin mantiqi
│   │   ├── gameEngine.js
│   │   ├── roleManager.js
│   │   ├── nightPhase.js
│   │   └── dayPhase.js
│   ├── database/           # Ma'lumotlar bazasi
│   │   ├── db.js
│   │   ├── userRepo.js
│   │   └── roomRepo.js
│   ├── timers/             # Taymer tizimi
│   │   └── gameTimer.js
│   ├── keyboards/          # Telegram tugmalari
│   │   ├── mainKeyboard.js
│   │   ├── gameKeyboards.js
│   │   └── profileKeyboards.js
│   └── utils/              # Yordamchi funksiyalar
│       ├── logger.js
│       ├── helpers.js
│       ├── messages.js
│       └── states.js
├── tests/
│   └── run-tests.js        # Avtomatik testlar
├── data/                   # SQLite bazasi (avtomatik yaratiladi)
├── logs/                   # Loglar (avtomatik yaratiladi)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ GURUHDA ISHLATISH

1. Botni Telegram guruhiga qo'shing
2. Botga **admin huquqlari** bering (xabar yuborish uchun)
3. `/newgame` — yangi o'yin xonasi yaratish
4. `/join` — xonaga qo'shilish
5. `/startgame` — o'yinni boshlash (kamida 4 kishi)

---

## 🔧 ADMIN BUYRUQLARI

```
/admin          — statistika va faol o'yinlar
/endroom KOD    — xonani majburiy yopish
/broadcast MATN — barcha foydalanuvchilarga xabar
```

---

## 🌐 SERVERGA JOYLASHTIRISH

### Railway.app (bepul)

1. [railway.app](https://railway.app) saytiga boring
2. GitHub repo yarating va loyihani yuklang
3. Railway'da "New Project" → "Deploy from GitHub"
4. Environment variables qo'shing (`.env` dagi ma'lumotlar)
5. Deploy qiling!

### VPS (Linux server)

```bash
# PM2 o'rnatish
npm install -g pm2

# Botni ishga tushirish
pm2 start src/bot.js --name "mafia-uz"

# Avtomatik ishga tushirish
pm2 startup
pm2 save
```

### Render.com (bepul)

1. GitHub repo yarating
2. Render.com'da "New Web Service"
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment variables qo'shing

---

## 🧪 TESTLAR

```bash
npm test
```

Testlar quyidagilarni tekshiradi:
- ✅ Ma'lumotlar bazasi ulanishi
- ✅ Foydalanuvchi qo'shish/olish
- ✅ Xona yaratish
- ✅ O'yinchi qo'shish
- ✅ Takror qo'shilishni rad etish
- ✅ Rol taqsimlash (4 va 8 kishi)
- ✅ G'alaba shartlari
- ✅ Ovoz hisoblash
- ✅ Durang aniqlash
- ✅ Massivni aralashtirish

---

## 📞 MUAMMO VA YORDAM

**Umumiy muammolar:**

| Muammo | Yechim |
|--------|--------|
| `BOT_TOKEN topilmadi` | `.env` faylini tekshiring |
| `Cannot find module` | `npm install` buyrug'ini qaytaring |
| Bot javob bermaydi | Token to'g'riligini tekshiring |
| Rol yuborilib bo'lmadi | Foydalanuvchi botga `/start` yuborganmi? |

---

*MAFIA UZ © 2024 — Professional Telegram Mafia O'yini*
