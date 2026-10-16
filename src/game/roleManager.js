const { assignRolesForCount, getRoleInfo } = require('../utils/helpers');
const { assignRoles, getRoomPlayers } = require('../database/roomRepo');
const logger = require('../utils/logger');

async function distributeRoles(bot, room) {
  const players = getRoomPlayers(room.id);
  const playerIds = players.map(p => p.user_id);
  const roleList = assignRolesForCount(players.length);

  const assignments = playerIds.map((userId, idx) => ({
    userId,
    role: roleList[idx],
  }));

  assignRoles(room.id, assignments);

  const failed = [];
  for (const { userId, role } of assignments) {
    try {
      const info = getRoleInfo(role);
      let roleMsg = `
🎭 <b>SIZNING ROLINGIZ</b>
━━━━━━━━━━━━━━━━━━━━━
${info.color} ${info.emoji} <b>${info.name.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━━

📋 <b>Vazifangiz:</b>
<i>${info.description}</i>
━━━━━━━━━━━━━━━━━━━━━
🤫 <b>Bu ma'lumot faqat sizga!</b>
<i>Rolni hech kimga aytmang.</i>
      `;

      // Mafia bo'lsa, jamoani ko'rsatish
      if (role === 'mafia') {
        const mafiaTeam = assignments.filter(a => a.role === 'mafia');
        const teammates = mafiaTeam.filter(a => a.userId !== userId);
        if (teammates.length > 0) {
          const teamPlayers = players.filter(p => teammates.some(t => t.userId === p.user_id));
          const teamList = teamPlayers.map(p =>
            p.username ? `@${p.username}` : (p.first_name || 'O\'yinchi')
          ).join(', ');
          roleMsg += `\n🔪 <b>Mafia jamoangiz:</b> ${teamList}`;
        } else {
          roleMsg += `\n🔪 <b>Siz yagona mafiozsiz!</b>`;
        }
      }

      await bot.telegram.sendMessage(userId, roleMsg, { parse_mode: 'HTML' });
      logger.info(`✅ Rol yuborildi: userId=${userId}, rol=${role}`);
    } catch (err) {
      logger.warn(`⚠️ Rol yuborilib bo'lmadi: userId=${userId} - ${err.message}`);
      failed.push(userId);
    }
  }

  return { assignments, failed };
}

function getMafiaTargets(roomId) {
  const { getAlivePlayers } = require('../database/roomRepo');
  return getAlivePlayers(roomId).filter(p => p.role !== 'mafia');
}

function getDetectiveTargets(roomId) {
  const { getAlivePlayers } = require('../database/roomRepo');
  return getAlivePlayers(roomId).filter(p => p.role !== 'detective');
}

function getDoctorTargets(roomId) {
  const { getAlivePlayers } = require('../database/roomRepo');
  return getAlivePlayers(roomId);
}

module.exports = { distributeRoles, getMafiaTargets, getDetectiveTargets, getDoctorTargets };
