const config = require('../config');

function getPlayerName(player) {
  if (player.username) return `@${player.username}`;
  const name = [player.first_name, player.last_name].filter(Boolean).join(' ');
  return name || `Foydalanuvchi#${player.user_id || player.telegram_id}`;
}

function getRoleInfo(role) {
  const roles = {
    mafia: {
      emoji: '🔪',
      name: 'Mafia',
      team: 'mafia',
      description: 'Har kecha bir fuqaroni o\'ldirasiz. Guruh bilan hamkorlik qiling!',
      color: '🔴',
    },
    detective: {
      emoji: '🕵️',
      name: 'Komissar',
      team: 'citizens',
      description: 'Har kecha bir o\'yinchini tekshira olasiz. Mafiami yoki yo\'qligini bilasiz!',
      color: '🔵',
    },
    doctor: {
      emoji: '🩺',
      name: 'Shifokor',
      team: 'citizens',
      description: 'Har kecha bir o\'yinchini himoya qilasiz. Kechasi o\'ldirilsa — omon qoladi!',
      color: '🟢',
    },
    citizen: {
      emoji: '👨',
      name: 'Fuqaro',
      team: 'citizens',
      description: 'Mafiyani toping va ovoz bering! Siz kunduz kuchlisiz.',
      color: '⚪',
    },
  };
  return roles[role] || roles.citizen;
}

function getMaskInfo(maskId) {
  return config.masks.list.find(m => m.id === maskId) || config.masks.list[0];
}

function getRarityEmoji(rarity) {
  const map = { oddiy: '⚪', noyob: '🔵', epik: '🟣', afsonaviy: '🟡' };
  return map[rarity] || '⚪';
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds} soniya`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins} daqiqa ${secs} soniya` : `${mins} daqiqa`;
}

function countVotes(votes) {
  const tally = {};
  for (const vote of votes) {
    tally[vote.target_id] = (tally[vote.target_id] || 0) + 1;
  }
  return tally;
}

function getMostVoted(tally) {
  if (Object.keys(tally).length === 0) return { targetId: null, isTie: false };
  const max = Math.max(...Object.values(tally));
  const topCandidates = Object.entries(tally).filter(([, v]) => v === max);
  if (topCandidates.length > 1) return { targetId: null, isTie: true, count: max };
  return { targetId: parseInt(topCandidates[0][0]), isTie: false, count: max };
}

function assignRolesForCount(playerCount) {
  const dist = config.roles.distribution;
  let chosen = dist[0];
  for (const d of dist) {
    if (playerCount >= d.min && playerCount <= d.max) {
      chosen = d;
      break;
    }
  }
  const roles = [];
  for (let i = 0; i < chosen.mafia; i++) roles.push('mafia');
  if (chosen.detective > 0) roles.push('detective');
  if (chosen.doctor > 0) roles.push('doctor');
  const citizenCount = playerCount - roles.length;
  for (let i = 0; i < citizenCount; i++) roles.push('citizen');
  return shuffleArray(roles);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkWinCondition(alivePlayers) {
  const mafiaCount = alivePlayers.filter(p => p.role === 'mafia').length;
  const citizenCount = alivePlayers.filter(p => p.role !== 'mafia').length;
  if (mafiaCount === 0) return { gameOver: true, winner: 'citizens' };
  if (mafiaCount >= citizenCount) return { gameOver: true, winner: 'mafia' };
  return { gameOver: false };
}

module.exports = {
  getPlayerName, getRoleInfo, getMaskInfo, getRarityEmoji,
  formatTime, countVotes, getMostVoted, assignRolesForCount,
  shuffleArray, checkWinCondition,
};
