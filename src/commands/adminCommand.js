const config = require('../config');
const { getDb } = require('../database/db');
const { getAllActiveRooms, getRoomPlayers } = require('../database/roomRepo');
const { getActiveTimerCount } = require('../timers/gameTimer');
const { cancelGame } = require('../game/gameEngine');
const logger = require('../utils/logger');

function isAdmin(userId) {
  return config.bot.adminIds.includes(userId);
}

module.exports = function registerAdminCommand(bot) {
  bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx.from.id)) {
      return ctx.reply('❌ Sizda admin huquqlari yo\'q.');
    }

    const db = getDb();
    const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
    const totalGames = db.prepare('SELECT COUNT(*) as cnt FROM game_results').get().cnt;
    const activeRooms = getAllActiveRooms();
    const timerCount = getActiveTimerCount();

    let roomsInfo = '';
    for (const room of activeRooms) {
      const players = getRoomPlayers(room.id);
      roomsInfo += `\n  🏠 ${room.code} | ${room.status} | ${players.length} o'yinchi`;
    }

    await ctx.reply(
      `⚙️ <b>ADMIN PANELI</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👥 Jami foydalanuvchilar: ${totalUsers}\n` +
      `🎮 Jami o'yinlar: ${totalGames}\n` +
      `🏠 Faol xonalar: ${activeRooms.length}${roomsInfo}\n` +
      `⏱ Faol taymerlar: ${timerCount}\n\n` +
      `<b>Admin buyruqlari:</b>\n` +
      `/endroom [KOD] — Xonani yopish\n` +
      `/broadcast [MATN] — Xabar yuborish`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('endroom', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const args = ctx.message.text.split(' ');
    if (!args[1]) return ctx.reply('Foydalanish: /endroom KOD');

    const { getRoomByCode } = require('../database/roomRepo');
    const room = getRoomByCode(args[1]);
    if (!room) return ctx.reply(`❌ ${args[1]} kodli xona topilmadi!`);

    await cancelGame(bot, room.id, 'Admin tomonidan yakunlandi');
    await ctx.reply(`✅ ${args[1]} xonasi yopildi.`);
  });

  bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx.from.id)) return;
    const text = ctx.message.text.replace('/broadcast', '').trim();
    if (!text) return ctx.reply('Foydalanish: /broadcast MATN');

    const db = getDb();
    const users = db.prepare('SELECT telegram_id FROM users').all();
    let sent = 0;
    let failed = 0;
    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.telegram_id, `📢 <b>MAFIA UZ xabari:</b>\n\n${text}`, { parse_mode: 'HTML' });
        sent++;
      } catch { failed++; }
    }
    await ctx.reply(`✅ Yuborildi: ${sent}, muvaffaqiyatsiz: ${failed}`);
  });
};
