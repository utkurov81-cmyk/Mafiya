require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./utils/logger');
const { getDb } = require('./database/db');
const fs = require('fs');

// Log papkasini yaratish
if (!fs.existsSync('logs')) fs.mkdirSync('logs');
if (!fs.existsSync('data')) fs.mkdirSync('data');

// Ma'lumotlar bazasini ishga tushirish
getDb();

// Bot yaratish
const bot = new Telegraf(config.bot.token);

// Komandalar ro'yxati
require('./commands/startCommand')(bot);
require('./commands/helpCommand')(bot);
require('./commands/gameCommands')(bot);
require('./commands/adminCommand')(bot);

// Handlerlar
require('./handlers/textHandler')(bot);
require('./handlers/callbackHandler')(bot);

// Xatolarni ushlash
bot.catch((err, ctx) => {
  const errMsg = err.message || '';
  if (errMsg.includes('403') || errMsg.includes('400') || errMsg.includes('kicked') || errMsg.includes('blocked')) {
    logger.warn(`Ogohlantirish (chat cheklovi): ${errMsg}`);
    return;
  }
  logger.error(`Bot xatosi: ${errMsg}`, { stack: err.stack });
});

// Bot ma'lumotlarini Telegram'ga yuborish
bot.telegram.setMyCommands([
  { command: 'start', description: 'Botni ishga tushirish' },
  { command: 'help', description: 'Yordam' },
  { command: 'newgame', description: 'Yangi o\'yin xonasi (guruhda)' },
  { command: 'join', description: 'Xonaga qo\'shilish (guruhda)' },
  { command: 'players', description: 'O\'yinchilar ro\'yxati (guruhda)' },
  { command: 'startgame', description: 'O\'yinni boshlash (guruhda, egasi)' },
  { command: 'endgame', description: 'O\'yinni yakunlash (guruhda, egasi)' },
  { command: 'admin', description: 'Admin paneli' },
]).catch(err => logger.warn('Komandalar ro\'yxati yangilanmadi: ' + err.message));

// Botni ishga tushirish
bot.telegram.getMe().then((me) => {
  logger.info(`🎭 MAFIA UZ bot muvaffaqiyatli ishga tushdi!`);
  logger.info(`🤖 Bot: @${me.username} (${me.first_name})`);
  logger.info(`📡 Polling rejimida xabarlarni qabul qilmoqda...`);

  // Railway va bulutli platformalar uchun Health Check web server
  if (process.env.PORT) {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('🎭 Mafia UZ Telegram Bot faol ishlamoqda!');
    });
    server.listen(process.env.PORT, '0.0.0.0', () => {
      logger.info(`🌐 Web server ${process.env.PORT}-portda tinglamoqda`);
    });
  }

  return bot.launch({ dropPendingUpdates: true });
}).catch((err) => {
  logger.error(`❌ Bot ishga tushmadi: ${err.message}`);
  process.exit(1);
});

// Xavfsiz to'xtatish
process.once('SIGINT', () => {
  logger.info('🛑 Bot to\'xtatilmoqda (SIGINT)...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.info('🛑 Bot to\'xtatilmoqda (SIGTERM)...');
  bot.stop('SIGTERM');
});

module.exports = bot;
