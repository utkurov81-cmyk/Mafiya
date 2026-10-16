const {
  createRoom, getRoomByChatId, addPlayerToRoom,
  getRoomPlayers, updateRoomStatus, removePlayerFromRoom
} = require('../database/roomRepo');
const { upsertUser } = require('../database/userRepo');
const { lobbyKeyboard } = require('../keyboards/gameKeyboards');
const { startGame, cancelGame } = require('../game/gameEngine');
const messages = require('../utils/messages');
const { GameStatus } = require('../utils/states');
const logger = require('../utils/logger');

module.exports = function registerGameCommands(bot) {

  // Yangi o'yin xonasi yaratish (guruhda)
  bot.command('newgame', async (ctx) => {
    if (ctx.chat.type === 'private') {
      return ctx.reply('⚠️ Bu buyruq faqat guruhda ishlaydi!');
    }

    const user = ctx.from;
    upsertUser(user);

    // Allaqachon aktiv xona bormi?
    const existingRoom = getRoomByChatId(ctx.chat.id);
    if (existingRoom) {
      const players = getRoomPlayers(existingRoom.id);
      return ctx.reply(
        `⚠️ Bu guruhda allaqachon xona mavjud: <code>${existingRoom.code}</code>\n` +
        `O'yinchilar: ${players.length}\n\n` +
        `Qo'shilish uchun: /join ${existingRoom.code}`,
        {
          parse_mode: 'HTML',
          ...lobbyKeyboard(existingRoom.code, user.id === existingRoom.owner_id, players.length),
        }
      );
    }

    try {
      const room = createRoom(ctx.chat.id, user.id);
      addPlayerToRoom(room.id, user.id);

      await ctx.reply(
        messages.roomCreated(room, user),
        {
          parse_mode: 'HTML',
          ...lobbyKeyboard(room.code, true, 1),
        }
      );

      logger.info(`🏠 Yangi xona: code=${room.code}, chat=${ctx.chat.id}, owner=${user.id}`);
    } catch (err) {
      logger.error(`Xona yaratish xatosi: ${err.message}`);
      await ctx.reply('❌ Xona yaratishda xato yuz berdi. Qaytadan urinib ko\'ring.');
    }
  });

  // Xonaga qo'shilish
  bot.command('join', async (ctx) => {
    const user = ctx.from;
    upsertUser(user);

    const args = ctx.message.text.split(' ');
    let room;

    if (ctx.chat.type !== 'private' && !args[1]) {
      // Guruhda kod berilmasa — guruhning xonasini olish
      room = getRoomByChatId(ctx.chat.id);
      if (!room) {
        return ctx.reply('❌ Bu guruhda aktiv xona yo\'q. /newgame bilan yarating.');
      }
    } else if (args[1]) {
      const { getRoomByCode } = require('../database/roomRepo');
      room = getRoomByCode(args[1]);
      if (!room) {
        return ctx.reply(`❌ <code>${args[1]}</code> kodli xona topilmadi!`, { parse_mode: 'HTML' });
      }
    } else {
      return ctx.reply('⚠️ Xona kodini kiriting: /join KOD');
    }

    if (room.status !== GameStatus.WAITING) {
      return ctx.reply('❌ Bu xonaga qo\'shilish mumkin emas. O\'yin boshlangan yoki tugagan!');
    }

    const result = addPlayerToRoom(room.id, user.id);
    if (!result.success) {
      return ctx.reply('⚠️ Siz allaqachon bu xonada turibsiz!');
    }

    const players = getRoomPlayers(room.id);
    await ctx.reply(
      `✅ <b>${user.first_name}</b> xonaga qo\'shildi!\n\n` + messages.lobbyStatus(room, players),
      {
        parse_mode: 'HTML',
        ...lobbyKeyboard(room.code, user.id === room.owner_id, players.length),
      }
    );
  });

  // O'yinchilar ro'yxati
  bot.command('players', async (ctx) => {
    const room = getRoomByChatId(ctx.chat.id);
    if (!room) return ctx.reply('❌ Bu guruhda aktiv xona yo\'q.');

    const players = getRoomPlayers(room.id);
    await ctx.reply(
      messages.lobbyStatus(room, players),
      { parse_mode: 'HTML' }
    );
  });

  // O'yinni boshlash
  bot.command('startgame', async (ctx) => {
    const user = ctx.from;
    const room = getRoomByChatId(ctx.chat.id);

    if (!room) return ctx.reply('❌ Bu guruhda aktiv xona yo\'q.');
    if (room.owner_id !== user.id) return ctx.reply('❌ Faqat xona egasi o\'yinni boshlashi mumkin!');
    if (room.status !== GameStatus.WAITING) return ctx.reply('❌ O\'yin allaqachon boshlangan!');

    const players = getRoomPlayers(room.id);
    const config = require('../config');
    if (players.length < config.game.minPlayers) {
      return ctx.reply(`❌ Kamida ${config.game.minPlayers} o'yinchi kerak! (Hozir: ${players.length})`);
    }

    updateRoomStatus(room.id, GameStatus.STARTING);
    await ctx.reply('⏳ O\'yin 5 soniyada boshlanadi...');
    setTimeout(async () => {
      await startGame(bot, room.id);
    }, 5000);
  });

  // O'yinni bekor qilish
  bot.command('endgame', async (ctx) => {
    const user = ctx.from;
    const room = getRoomByChatId(ctx.chat.id);

    if (!room) return ctx.reply('❌ Bu guruhda aktiv xona yo\'q.');

    const config = require('../config');
    const isAdmin = config.bot.adminIds.includes(user.id);
    if (room.owner_id !== user.id && !isAdmin) {
      return ctx.reply('❌ Faqat xona egasi yoki admin o\'yinni yakunlay oladi!');
    }

    await cancelGame(bot, room.id, 'Qo\'lda yakunlandi');
  });
};
