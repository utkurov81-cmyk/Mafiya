const { mainMenu, backButton } = require('../keyboards/mainKeyboard');
const { upsertUser, getUserById, getUserMasks, setUserMask, getTopPlayers } = require('../database/userRepo');
const { masksMenu } = require('../keyboards/profileKeyboards');
const { getRoleInfo, getMaskInfo, getRarityEmoji } = require('../utils/helpers');
const config = require('../config');

module.exports = function registerTextHandler(bot) {
  bot.hears('🎮 O\'yinga kirish', async (ctx) => {
    await ctx.reply(
      `🎮 <b>O'YINGA KIRISH</b>\n\n` +
      `O'yin guruhda o'ynaladi!\n\n` +
      `<b>Qanday boshlash kerak:</b>\n` +
      `1. Telegram guruh yarating\n` +
      `2. Botni guruhga qo'shing: @MafiaUzBot\n` +
      `3. Guruhda /newgame buyrug'ini yuboring\n` +
      `4. Do'stlaringiz /join buyrug'i bilan qo'shilsin\n` +
      `5. /startgame bilan o'yinni boshlang!\n\n` +
      `<i>Kamida 4 nafar o'yinchi kerak.</i>`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('🏠 Xona yaratish', async (ctx) => {
    await ctx.reply(
      `🏠 <b>XONA YARATISH</b>\n\n` +
      `Guruhda <code>/newgame</code> buyrug'ini yuboring!\n\n` +
      `<b>Eslatma:</b> Xona faqat guruh chatda yaratiladi.\n` +
      `Shaxsiy chatdan emas, guruhdan buyruq yuboring.`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('👥 O\'yinchilar', async (ctx) => {
    await ctx.reply(
      `👥 Guruhda <code>/players</code> buyrug'ini yuboring.`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('🎭 Rollar haqida', async (ctx) => {
    const roles = ['mafia', 'detective', 'doctor', 'citizen'];
    let text = `🎭 <b>O'YIN ROLLARI</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    for (const role of roles) {
      const info = getRoleInfo(role);
      text += `${info.color} ${info.emoji} <b>${info.name}</b>\n<i>${info.description}</i>\n\n`;
    }
    await ctx.reply(text, { parse_mode: 'HTML', ...mainMenu() });
  });

  bot.hears('📜 O\'yin qoidalari', async (ctx) => {
    await ctx.reply(
      `📜 <b>O'YIN QOIDALARI</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎮 <b>Maqsad:</b>\n` +
      `• Fuqarolar — barcha mafiyani topib o'ldirish\n` +
      `• Mafia — fuqarolardan son jihatdan ko'payib ketish\n\n` +
      `🌙 <b>Kecha:</b>\n` +
      `• Barcha "uxlaydi"\n` +
      `• Mafia bir fuqaroni o'ldiradi\n` +
      `• Shifokor kimnidir himoya qiladi\n` +
      `• Komissar kimnidir tekshiradi\n\n` +
      `☀️ <b>Kunduz:</b>\n` +
      `• Kechagi natija e'lon qilinadi\n` +
      `• Hammaga muhokama qilish vaqti beriladi\n` +
      `• Ovoz berish orqali biri o'yindan chiqariladi\n\n` +
      `🏆 <b>G'alaba:</b>\n` +
      `• Fuqarolar: barcha mafialar o'ldirilsa\n` +
      `• Mafia: tirik mafiya ≥ tirik fuqarolar`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('👤 Mening profilim', async (ctx) => {
    const user = ctx.from;
    upsertUser(user);
    const profile = getUserById(user.id);
    if (!profile) return ctx.reply('Profil topilmadi.');

    const winRate = profile.total_games > 0
      ? Math.round((profile.wins / profile.total_games) * 100)
      : 0;
    const mask = getMaskInfo(profile.selected_mask);

    await ctx.reply(
      `👤 <b>PROFIL</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}\n` +
      `🤵 <b>Username:</b> ${user.username ? '@' + user.username : 'Yo\'q'}\n` +
      `${mask.emoji} <b>Maska:</b> ${mask.name}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎮 <b>Jami o'yinlar:</b> ${profile.total_games}\n` +
      `✅ <b>G'alabalar:</b> ${profile.wins}\n` +
      `❌ <b>Mag'lubiyatlar:</b> ${profile.losses}\n` +
      `🔪 <b>Mafia sifatida g'alabalar:</b> ${profile.mafia_wins}\n` +
      `🏛️ <b>Fuqaro sifatida g'alabalar:</b> ${profile.citizen_wins}\n` +
      `📊 <b>G'alaba foizi:</b> ${winRate}%\n` +
      `⭐ <b>Reyting:</b> ${profile.rating}`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('🏆 Reyting', async (ctx) => {
    const topPlayers = getTopPlayers(10);
    const medals = ['🥇', '🥈', '🥉'];
    let text = `🏆 <b>REYTING</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    topPlayers.forEach((p, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const name = p.username ? `@${p.username}` : (p.first_name || 'Anonim');
      text += `${medal} <b>${name}</b> — ${p.rating} ball\n   O'yin: ${p.total_games} | G'alaba: ${p.wins}\n\n`;
    });
    if (topPlayers.length === 0) text += '<i>Hali o\'yinlar o\'tkazilmagan.</i>';
    await ctx.reply(text, { parse_mode: 'HTML', ...mainMenu() });
  });

  bot.hears('🎒 To\'plamim', async (ctx) => {
    const user = ctx.from;
    upsertUser(user);
    const profile = getUserById(user.id);
    const ownedMasks = getUserMasks(user.id);
    const selectedMask = profile ? profile.selected_mask : config.masks.default;

    await ctx.reply(
      `🎒 <b>MASKA TO'PLAMI</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Tanlash uchun maska ustiga bosing:</i>\n\n` +
      `⚪ Oddiy | 🔵 Noyob | 💜 Epik | 🥇 Afsonaviy`,
      {
        parse_mode: 'HTML',
        ...masksMenu(ownedMasks, selectedMask),
      }
    );
  });

  bot.hears('⚙️ Sozlamalar', async (ctx) => {
    await ctx.reply(
      `⚙️ <b>SOZLAMALAR</b>\n\n<i>Sozlamalar tez orada qo'shiladi.</i>`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('❓ Yordam', async (ctx) => {
    await ctx.reply(
      `❓ <b>YORDAM</b>\n\n/help buyrug'i yuboring.`,
      { parse_mode: 'HTML', ...mainMenu() }
    );
  });

  bot.hears('🔙 Orqaga', async (ctx) => {
    await ctx.reply('Asosiy menyu:', mainMenu());
  });
};
