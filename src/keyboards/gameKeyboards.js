const { Markup } = require('telegraf');

function joinRoomKeyboard(roomCode) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Qo\'shilish', `join_${roomCode}`)],
    [Markup.button.callback('👁 Kuzatish', `watch_${roomCode}`)],
  ]);
}

function lobbyKeyboard(roomCode, isOwner, playerCount) {
  const buttons = [
    [Markup.button.callback('✅ Qo\'shilish', `join_${roomCode}`)],
    [Markup.button.callback('🚪 Chiqish', `leave_${roomCode}`)],
  ];
  if (isOwner && playerCount >= 4) {
    buttons.push([Markup.button.callback('🚀 O\'yinni boshlash', `start_game_${roomCode}`)]);
  }
  if (isOwner) {
    buttons.push([Markup.button.callback('❌ Xonani yopish', `cancel_room_${roomCode}`)]);
  }
  return Markup.inlineKeyboard(buttons);
}

function nightActionKeyboard(players, actionType, roomId) {
  let prefix;
  if (actionType === 'kill') prefix = 'night_kill';
  else if (actionType === 'investigate') prefix = 'night_inv';
  else if (actionType === 'protect') prefix = 'night_heal';
  else prefix = 'night_heal';

  const buttons = players.map(p => [
    Markup.button.callback(
      `${p.first_name || p.username || 'O\'yinchi'}`,
      `${prefix}_${roomId}_${p.user_id}`
    )
  ]);
  return Markup.inlineKeyboard(buttons);
}

function votingKeyboard(players, roomId) {
  const buttons = players.map(p => [
    Markup.button.callback(
      `👤 ${p.first_name || p.username || 'O\'yinchi'}`,
      `vote_${roomId}_${p.user_id}`
    )
  ]);
  buttons.push([Markup.button.callback('⏭ O\'tkazib yuborish', `vote_${roomId}_skip`)]);
  return Markup.inlineKeyboard(buttons);
}

function newGameKeyboard(chatId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🎮 Yangi o\'yin', `new_game_${chatId}`)],
  ]);
}

module.exports = { joinRoomKeyboard, lobbyKeyboard, nightActionKeyboard, votingKeyboard, newGameKeyboard };
