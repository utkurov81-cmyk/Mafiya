const {
  getRoomByCode, addPlayerToRoom, removePlayerFromRoom,
  getRoomPlayers, updateRoomStatus, getRoomById, getAlivePlayers
} = require('../database/roomRepo');
const { getUserById, setUserMask, getUserMasks, upsertUser } = require('../database/userRepo');
const { lobbyKeyboard } = require('../keyboards/gameKeyboards');
const { masksMenu } = require('../keyboards/profileKeyboards');
const { startGame, cancelGame, beginVotingPhase } = require('../game/gameEngine');
const { handleNightAction } = require('../game/nightPhase');
const { handleVote, startVoting } = require('../game/dayPhase');
const { GameStatus, GamePhase, ActionType } = require('../utils/states');
const { getMaskInfo } = require('../utils/helpers');
const messages = require('../utils/messages');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = function registerCallbackHandler(bot) {
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const user = ctx.from;
    upsertUser(user);

    try {
      // ─── XONAGA QO'SHILISH ───
      if (data.startsWith('join_')) {
        const code = data.replace('join_', '');
        const room = getRoomByCode(code);
        if (!room) return ctx.answerCbQuery('❌ Xona topilmadi!', { show_alert: true });
        if (room.status !== GameStatus.WAITING) return ctx.answerCbQuery('❌ O\'yin boshlangan!', { show_alert: true });

        const result = addPlayerToRoom(room.id, user.id);
        if (!result.success) return ctx.answerCbQuery('⚠️ Siz allaqachon bu xonada turibsiz!', { show_alert: true });

        const players = getRoomPlayers(room.id);
        await ctx.editMessageText(
          messages.roomCreated(room, { username: user.username, first_name: user.first_name, user_id: user.id }) +
          `\n✅ <b>${user.first_name}</b> qo\'shildi!`,
          {
            parse_mode: 'HTML',
            ...lobbyKeyboard(room.code, user.id === room.owner_id, players.length),
          }
        ).catch(() => {});
        return ctx.answerCbQuery('✅ Qo\'shildingiz!');
      }

      // ─── XONADAN CHIQISH ───
      if (data.startsWith('leave_')) {
        const code = data.replace('leave_', '');
        const room = getRoomByCode(code);
        if (!room || room.status !== GameStatus.WAITING) return ctx.answerCbQuery('❌ Chiqib bo\'lmaydi!', { show_alert: true });

        removePlayerFromRoom(room.id, user.id);
        const players = getRoomPlayers(room.id);
        await ctx.editMessageText(
          `❌ <b>${user.first_name}</b> xonadan chiqdi.\n` + messages.lobbyStatus(room, players),
          {
            parse_mode: 'HTML',
            ...lobbyKeyboard(room.code, room.owner_id === user.id, players.length),
          }
        ).catch(() => {});
        return ctx.answerCbQuery('🚪 Chiqtingiz.');
      }

      // ─── O'YINNI BOSHLASH ───
      if (data.startsWith('start_game_')) {
        const code = data.replace('start_game_', '');
        const room = getRoomByCode(code);
        if (!room) return ctx.answerCbQuery('❌ Xona topilmadi!');
        if (room.owner_id !== user.id) return ctx.answerCbQuery('❌ Faqat xona egasi boshlashi mumkin!', { show_alert: true });
        if (room.status !== GameStatus.WAITING) return ctx.answerCbQuery('❌ O\'yin allaqachon boshlangan!');

        const players = getRoomPlayers(room.id);
        if (players.length < config.game.minPlayers) {
          return ctx.answerCbQuery(`❌ Kamida ${config.game.minPlayers} o'yinchi kerak!`, { show_alert: true });
        }

        updateRoomStatus(room.id, GameStatus.STARTING);
        await ctx.answerCbQuery('⏳ O\'yin boshlanmoqda...');
        await ctx.reply('⏳ O\'yin 5 soniyada boshlanadi!');
        setTimeout(() => startGame(bot, room.id), 5000);
        return;
      }

      // ─── XONANI YOPISH ───
      if (data.startsWith('cancel_room_')) {
        const code = data.replace('cancel_room_', '');
        const room = getRoomByCode(code);
        if (!room) return ctx.answerCbQuery('❌ Xona topilmadi!');
        if (room.owner_id !== user.id) return ctx.answerCbQuery('❌ Faqat xona egasi yopishi mumkin!', { show_alert: true });

        await cancelGame(bot, room.id, 'Xona egasi tomonidan bekor qilindi');
        return ctx.answerCbQuery('❌ Xona yopildi.');
      }

      // ─── YANGI O'YIN ───
      if (data.startsWith('new_game_')) {
        return ctx.answerCbQuery('Yangi o\'yin uchun /newgame buyrug\'ini yuboring!', { show_alert: true });
      }

      // ─── TUNGI HARAKATLAR ───
      // Mafia nishoni
      if (data.startsWith('night_kill_')) {
        const parts = data.replace('night_kill_', '').split('_');
        const roomId = parseInt(parts[0]);
        const targetId = parseInt(parts[1]);
        const room = getRoomById(roomId);
        if (!room || room.current_phase !== GamePhase.NIGHT) return ctx.answerCbQuery('❌ Bu vaqtda amal bajarish mumkin emas!');

        const alivePlayers = getAlivePlayers(roomId);
        const actor = alivePlayers.find(p => p.user_id === user.id && p.role === 'mafia');
        if (!actor) return ctx.answerCbQuery('❌ Siz bu amalni bajara olmaysiz!', { show_alert: true });

        await handleNightAction(bot, room, user.id, ActionType.KILL, targetId);
        await ctx.editMessageText('🔪 Nishon tanlandi. Natija erta tong e\'lon qilinadi...', { parse_mode: 'HTML' }).catch(() => {});
        return ctx.answerCbQuery('✅ Qaror qabul qilindi.');
      }

      // Komissar tekshiruvi
      if (data.startsWith('night_inv_')) {
        const parts = data.replace('night_inv_', '').split('_');
        const roomId = parseInt(parts[0]);
        const targetId = parseInt(parts[1]);
        const room = getRoomById(roomId);
        if (!room || room.current_phase !== GamePhase.NIGHT) return ctx.answerCbQuery('❌ Bu vaqtda amal bajarish mumkin emas!');

        const alivePlayers = getAlivePlayers(roomId);
        const actor = alivePlayers.find(p => p.user_id === user.id && p.role === 'detective');
        if (!actor) return ctx.answerCbQuery('❌ Siz bu amalni bajara olmaysiz!', { show_alert: true });

        await handleNightAction(bot, room, user.id, ActionType.INVESTIGATE, targetId);
        await ctx.editMessageText('🔍 Tekshiruv yuborildi. Natija shaxsiy xabarda...', { parse_mode: 'HTML' }).catch(() => {});
        return ctx.answerCbQuery('✅ Tekshiruv boshlandi.');
      }

      // Shifokor himoyasi
      if (data.startsWith('night_heal_')) {
        const parts = data.replace('night_heal_', '').split('_');
        const roomId = parseInt(parts[0]);
        const targetId = parseInt(parts[1]);
        const room = getRoomById(roomId);
        if (!room || room.current_phase !== GamePhase.NIGHT) return ctx.answerCbQuery('❌ Bu vaqtda amal bajarish mumkin emas!');

        const alivePlayers = getAlivePlayers(roomId);
        const actor = alivePlayers.find(p => p.user_id === user.id && p.role === 'doctor');
        if (!actor) return ctx.answerCbQuery('❌ Siz bu amalni bajara olmaysiz!', { show_alert: true });

        await handleNightAction(bot, room, user.id, ActionType.PROTECT, targetId);
        await ctx.editMessageText('🩺 Himoya yuborildi. Bemorni qo\'riqlaymiz...', { parse_mode: 'HTML' }).catch(() => {});
        return ctx.answerCbQuery('✅ Himoya tasdiqlandi.');
      }

      // ─── OVOZ BERISH ───
      if (data.startsWith('vote_')) {
        const parts = data.replace('vote_', '').split('_');
        const roomId = parseInt(parts[0]);
        const targetStr = parts[1];
        const room = getRoomById(roomId);

        if (!room || room.current_phase !== GamePhase.VOTING) {
          return ctx.answerCbQuery('❌ Ovoz berish vaqti tugagan!', { show_alert: true });
        }

        const result = await handleVote(room, user.id, targetStr);
        if (!result.success) {
          const reasons = {
            not_alive: 'Siz o\'yindan chiqgansiz!',
            invalid_target: 'Noto\'g\'ri nishon!',
          };
          return ctx.answerCbQuery(`❌ ${reasons[result.reason] || 'Xato!'}`, { show_alert: true });
        }

        const label = targetStr === 'skip' ? 'O\'tkazib yubordingiz' : 'Ovozingiz qabul qilindi';
        await ctx.editMessageText(`✅ ${label}.`, { parse_mode: 'HTML' }).catch(() => {});
        return ctx.answerCbQuery('✅ Ovoz berildi!');
      }

      // ─── MASKA TANLASH ───
      if (data.startsWith('select_mask_')) {
        const maskId = data.replace('select_mask_', '');
        setUserMask(user.id, maskId);
        const mask = getMaskInfo(maskId);
        const profile = getUserById(user.id);
        const ownedMasks = getUserMasks(user.id);

        await ctx.editMessageText(
          `🎒 <b>MASKA TO'PLAMI</b>\n━━━━━━━━━━━━━━━━━━━━━\n` +
          `<i>Tanlash uchun maska ustiga bosing:</i>\n\n` +
          `⚪ Oddiy | 🔵 Noyob | 💜 Epik | 🥇 Afsonaviy`,
          {
            parse_mode: 'HTML',
            ...masksMenu(ownedMasks, maskId),
          }
        ).catch(() => {});
        return ctx.answerCbQuery(`✅ ${mask.name} tanlandi!`);
      }

      // ─── MASKA MA'LUMOTI ───
      if (data.startsWith('info_mask_')) {
        const maskId = data.replace('info_mask_', '');
        const mask = getMaskInfo(maskId);
        return ctx.answerCbQuery(
          `🔒 ${mask.name} hali qulfda!\nU ${mask.rarity} darajali maska.`,
          { show_alert: true }
        );
      }

      // ─── PROFIL ORQAGA ───
      if (data === 'profile_back') {
        return ctx.answerCbQuery('Asosiy menyuga qayting.');
      }

      await ctx.answerCbQuery();
    } catch (err) {
      logger.error(`Callback xatosi (${data}): ${err.message}`);
      ctx.answerCbQuery('❌ Xato yuz berdi!', { show_alert: true }).catch(() => {});
    }
  });
};
