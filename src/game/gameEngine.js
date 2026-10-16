const {
  getRoomByChatId, getRoomById, getRoomPlayers, getAlivePlayers,
  updateRoomStatus, setPlayerStatus, resetNightActions, saveGameResult
} = require('../database/roomRepo');
const { updateUserStats } = require('../database/userRepo');
const { distributeRoles } = require('./roleManager');
const { startNight, resolveNight } = require('./nightPhase');
const { startVoting, resolveVoting } = require('./dayPhase');
const { setTimer, clearAllRoomTimers } = require('../timers/gameTimer');
const { checkWinCondition, getPlayerName } = require('../utils/helpers');
const { GameStatus, GamePhase } = require('../utils/states');
const messages = require('../utils/messages');
const { newGameKeyboard } = require('../keyboards/gameKeyboards');
const config = require('../config');
const logger = require('../utils/logger');

// ============================================================
// O'YINNI BOSHLASH
// ============================================================
async function startGame(bot, roomId) {
  const room = getRoomById(roomId);
  if (!room) return;

  const players = getRoomPlayers(roomId);
  if (players.length < config.game.minPlayers) {
    await bot.telegram.sendMessage(
      room.chat_id,
      `❌ O'yin boshlanmadi. Kamida ${config.game.minPlayers} o'yinchi kerak!`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Statusni yangilash
  updateRoomStatus(roomId, GameStatus.RUNNING, { phase: GamePhase.NIGHT, roundNumber: 1 });

  // Rollarni taqsimlash
  logger.info(`🎮 O'yin boshlandi: xona=${room.code}, o'yinchilar=${players.length}`);
  await bot.telegram.sendMessage(
    room.chat_id,
    `🎭 <b>O'YIN BOSHLANDI!</b>\n\n👥 O'yinchilar: ${players.length} kishi\n\n<i>Rollar taqsimlanmoqda...</i>`,
    { parse_mode: 'HTML' }
  );

  const { assignments, failed } = await distributeRoles(bot, room);

  if (failed.length > 0) {
    await bot.telegram.sendMessage(
      room.chat_id,
      `⚠️ ${failed.length} o'yinchi shaxsiy xabar qabul qila olmadi. Ular o'yindan chiqarildi.\n<i>Botga avval /start yuboring!</i>`,
      { parse_mode: 'HTML' }
    );
    for (const userId of failed) {
      setPlayerStatus(roomId, userId, 'dead');
    }
  }

  // Birinchi kechani boshlash
  await beginNightPhase(bot, roomId);
}

// ============================================================
// KECHA BOSQICHI
// ============================================================
async function beginNightPhase(bot, roomId) {
  let room = getRoomById(roomId);
  if (!room || room.status !== GameStatus.RUNNING) return;

  updateRoomStatus(roomId, GameStatus.RUNNING, {
    phase: GamePhase.NIGHT,
    roundNumber: room.round_number,
    phaseEndsAt: new Date(Date.now() + config.game.nightDuration * 1000).toISOString(),
  });

  room = getRoomById(roomId);

  await bot.telegram.sendMessage(
    room.chat_id,
    messages.nightStart(room.round_number),
    { parse_mode: 'HTML' }
  );

  const { startNight: startNightActions } = require('./nightPhase');
  await startNightActions(bot, room);

  // Taymer o'rnatish
  setTimer(roomId, GamePhase.NIGHT, config.game.nightDuration * 1000, async () => {
    await endNightPhase(bot, roomId);
  });
}

// ============================================================
// KECHANI YAKUNLASH
// ============================================================
async function endNightPhase(bot, roomId) {
  const room = getRoomById(roomId);
  if (!room || room.status !== GameStatus.RUNNING) return;

  // Kecha natijalarini hisoblash
  const nightResult = await resolveNight(room);

  // Kunduzni boshlash
  await beginDayPhase(bot, roomId, nightResult);
}

// ============================================================
// KUNDUZ BOSQICHI
// ============================================================
async function beginDayPhase(bot, roomId, nightResult = {}) {
  let room = getRoomById(roomId);
  if (!room) return;

  // G'alaba tekshiruvi
  const alivePlayers = getAlivePlayers(roomId);
  const winCheck = checkWinCondition(alivePlayers);
  if (winCheck.gameOver) {
    await endGame(bot, roomId, winCheck.winner);
    return;
  }

  updateRoomStatus(roomId, GameStatus.RUNNING, {
    phase: GamePhase.DAY,
    roundNumber: room.round_number,
    phaseEndsAt: new Date(Date.now() + config.game.dayDiscussionTime * 1000).toISOString(),
  });

  room = getRoomById(roomId);

  // Kunduzdagi natija xabari
  let killedName = null;
  if (nightResult.killed) {
    killedName = nightResult.killed.first_name || nightResult.killed.username || 'Noma\'lum';
  }
  const result = {
    killed: !!nightResult.killed,
    savedByDoctor: !!nightResult.savedByDoctor,
    killedName,
  };

  await bot.telegram.sendMessage(
    room.chat_id,
    messages.dayStart(room.round_number, result),
    { parse_mode: 'HTML' }
  );

  // Tirik o'yinchilar ro'yxati
  await bot.telegram.sendMessage(
    room.chat_id,
    messages.aliveList(alivePlayers),
    { parse_mode: 'HTML' }
  );

  // Muhokama taymerini o'rnatish
  setTimer(roomId, GamePhase.DAY, config.game.dayDiscussionTime * 1000, async () => {
    await beginVotingPhase(bot, roomId);
  });
}

// ============================================================
// OVOZ BERISH BOSQICHI
// ============================================================
async function beginVotingPhase(bot, roomId) {
  let room = getRoomById(roomId);
  if (!room || room.status !== GameStatus.RUNNING) return;

  updateRoomStatus(roomId, GameStatus.RUNNING, {
    phase: GamePhase.VOTING,
    phaseEndsAt: new Date(Date.now() + config.game.votingTime * 1000).toISOString(),
  });

  room = getRoomById(roomId);
  const alivePlayers = getAlivePlayers(roomId);

  await bot.telegram.sendMessage(
    room.chat_id,
    messages.votingStart(alivePlayers),
    { parse_mode: 'HTML' }
  );

  await startVoting(bot, room);

  setTimer(roomId, GamePhase.VOTING, config.game.votingTime * 1000, async () => {
    await endVotingPhase(bot, roomId);
  });
}

// ============================================================
// OVOZ BERISHNI YAKUNLASH
// ============================================================
async function endVotingPhase(bot, roomId) {
  const room = getRoomById(roomId);
  if (!room || room.status !== GameStatus.RUNNING) return;

  const { eliminated, isTie } = resolveVoting(room);
  const alivePlayers = getAlivePlayers(roomId);

  let eliminatedPlayer = null;
  if (eliminated && !isTie) {
    eliminatedPlayer = alivePlayers.find(p => p.user_id === eliminated);
    if (eliminatedPlayer) {
      setPlayerStatus(roomId, eliminated, 'dead');
    }
  }

  await bot.telegram.sendMessage(
    room.chat_id,
    messages.voteResult(eliminatedPlayer, !eliminated, isTie, []),
    { parse_mode: 'HTML' }
  );

  // G'alaba tekshiruvi
  const newAlivePlayers = getAlivePlayers(roomId);
  const winCheck = checkWinCondition(newAlivePlayers);
  if (winCheck.gameOver) {
    await endGame(bot, roomId, winCheck.winner);
    return;
  }

  // Keyingi kechaga o'tish
  updateRoomStatus(roomId, GameStatus.RUNNING, {
    phase: GamePhase.NIGHT,
    roundNumber: room.round_number + 1,
  });

  const updatedRoom = getRoomById(roomId);
  resetNightActions(roomId);

  setTimer(roomId, 'between_phases', config.game.resultShowTime * 1000, async () => {
    await beginNightPhase(bot, roomId);
  });
}

// ============================================================
// O'YINNI YAKUNLASH
// ============================================================
async function endGame(bot, roomId, winnerTeam) {
  const room = getRoomById(roomId);
  if (!room) return;

  clearAllRoomTimers(roomId);
  updateRoomStatus(roomId, GameStatus.FINISHED);

  const allPlayers = getRoomPlayers(roomId);
  saveGameResult(roomId, winnerTeam, room.round_number, allPlayers.length);

  // Statistikalarni yangilash
  for (const player of allPlayers) {
    updateUserStats(player.user_id, winnerTeam, player.role);
  }

  // G'alaba xabarini yuborish
  await bot.telegram.sendMessage(
    room.chat_id,
    messages.gameOver(winnerTeam, allPlayers),
    {
      parse_mode: 'HTML',
      ...newGameKeyboard(room.chat_id),
    }
  );

  logger.info(`🏆 O'yin tugadi: xona=${room.code}, g'olib=${winnerTeam}`);
}

// ============================================================
// O'YINNI BEKOR QILISH
// ============================================================
async function cancelGame(bot, roomId, reason = '') {
  const room = getRoomById(roomId);
  if (!room) return;

  clearAllRoomTimers(roomId);
  updateRoomStatus(roomId, GameStatus.CANCELLED);

  await bot.telegram.sendMessage(
    room.chat_id,
    `❌ <b>O'yin bekor qilindi!</b>${reason ? '\n<i>' + reason + '</i>' : ''}`,
    { parse_mode: 'HTML' }
  );

  logger.info(`❌ O'yin bekor qilindi: xona=${room.code}, sabab=${reason}`);
}

module.exports = { startGame, beginNightPhase, endNightPhase, beginDayPhase, beginVotingPhase, endVotingPhase, endGame, cancelGame };
