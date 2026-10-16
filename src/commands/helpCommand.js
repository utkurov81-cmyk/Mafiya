module.exports = function registerHelpCommand(bot) {
  bot.command('help', async (ctx) => {
    await ctx.reply(
      `🎭 <b>MAFIA UZ — YORDAM</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Asosiy buyruqlar:</b>\n` +
      `/start — Botni ishga tushirish\n` +
      `/help — Yordam\n\n` +
      `<b>O'yin boshqaruvi (guruhda):</b>\n` +
      `/newgame — Yangi o'yin xonasi yaratish\n` +
      `/join [KOD] — Xonaga qo'shilish\n` +
      `/players — O'yinchilar ro'yxati\n` +
      `/startgame — O'yinni boshlash (faqat egasi)\n` +
      `/endgame — O'yinni yakunlash (faqat egasi)\n\n` +
      `<b>Admin buyruqlari:</b>\n` +
      `/admin — Admin paneli\n\n` +
      `<i>Yordam uchun: @MafiaUzSupport</i>`,
      { parse_mode: 'HTML' }
    );
  });
};
