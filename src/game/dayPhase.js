const { getAlivePlayers, getVotes, saveVote } = require('../database/roomRepo');
const { votingKeyboard } = require('../keyboards/gameKeyboards');
const { countVotes, getMostVoted, getPlayerName } = require('../utils/helpers');
const logger = require('../utils/logger');

async function startVoting(bot, room) {
  const alivePlayers = getAlivePlayers(room.id);

  // Har bir tirik o'yinchiga xabar
  for (const player of alivePlayers) {
    try {
      const otherPlayers = alivePlayers.filter(p => p.user_id !== player.user_id);
      await bot.telegram.sendMessage(
        player.user_id,
        `🗳️ <b>OVOZ BERISH BOSHLANDI!</b>\nKim shahardan chiqarilsin?\n\n<i>Quyidagi tugmalardan birini tanlang:</i>`,
        {
          parse_mode: 'HTML',
          ...votingKeyboard(otherPlayers, room.id),
        }
      );
    } catch (err) {
      logger.warn(`Ovoz berish xabari yuborilib bo'lmadi: ${player.user_id} - ${err.message}`);
    }
  }
}

async function handleVote(room, voterId, targetId) {
  // O'yinchi tirikmi?
  const alivePlayers = getAlivePlayers(room.id);
  const voter = alivePlayers.find(p => p.user_id === voterId);
  if (!voter) return { success: false, reason: 'not_alive' };

  if (targetId !== 'skip') {
    const target = alivePlayers.find(p => p.user_id === parseInt(targetId));
    if (!target) return { success: false, reason: 'invalid_target' };
  }

  saveVote(room.id, room.round_number, 'day', voterId, targetId === 'skip' ? 0 : parseInt(targetId));
  return { success: true };
}

function resolveVoting(room) {
  const votes = getVotes(room.id, room.round_number, 'day');
  const realVotes = votes.filter(v => v.target_id !== 0);
  const tally = countVotes(realVotes);
  const { targetId, isTie } = getMostVoted(tally);

  if (!targetId || isTie) {
    return { eliminated: null, isTie: !!isTie };
  }

  return { eliminated: targetId, isTie: false };
}

module.exports = { startVoting, handleVote, resolveVoting };
