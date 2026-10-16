require('dotenv').config();

const config = {
  bot: {
    token: process.env.BOT_TOKEN,
    adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean),
  },
  db: {
    path: process.env.DB_PATH || './data/mafia_uz.db',
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
  game: {
    lobbyWaitTime: parseInt(process.env.LOBBY_WAIT_TIME) || 60,
    nightDuration: parseInt(process.env.NIGHT_DURATION) || 45,
    dayDiscussionTime: parseInt(process.env.DAY_DISCUSSION_TIME) || 90,
    votingTime: parseInt(process.env.VOTING_TIME) || 45,
    resultShowTime: parseInt(process.env.RESULT_SHOW_TIME) || 15,
    minPlayers: 4,
    maxPlayers: 15,
  },
  roles: {
    distribution: [
      { min: 4, max: 5, mafia: 1, doctor: 1, detective: 0, citizens: -1 },
      { min: 6, max: 7, mafia: 1, doctor: 1, detective: 1, citizens: -1 },
      { min: 8, max: 9, mafia: 2, doctor: 1, detective: 1, citizens: -1 },
      { min: 10, max: 12, mafia: 3, doctor: 1, detective: 1, citizens: -1 },
      { min: 13, max: 15, mafia: 4, doctor: 1, detective: 1, citizens: -1 },
    ],
  },
  masks: {
    rarities: ['oddiy', 'noyob', 'epik', 'afsonaviy'],
    default: 'citizen_default',
    list: [
      { id: 'citizen_default', name: '🎭 Oddiy Niqob', rarity: 'oddiy', emoji: '🎭', forRole: 'all' },
      { id: 'mafia_red', name: '🔴 Qizil Niqob', rarity: 'oddiy', emoji: '🔴', forRole: 'mafia' },
      { id: 'mafia_black', name: '⚫ Qora Niqob', rarity: 'noyob', emoji: '⚫', forRole: 'mafia' },
      { id: 'detective_hat', name: '🕵️ Detektiv Shapkasi', rarity: 'noyob', emoji: '🕵️', forRole: 'detective' },
      { id: 'doctor_cross', name: '🏥 Tibbiy Niqob', rarity: 'noyob', emoji: '🏥', forRole: 'doctor' },
      { id: 'golden_mask', name: '🥇 Oltin Niqob', rarity: 'epik', emoji: '🥇', forRole: 'all' },
      { id: 'purple_mask', name: '💜 Binafsha Niqob', rarity: 'epik', emoji: '💜', forRole: 'all' },
      { id: 'legendary_crown', name: '👑 Afsonaviy Toj', rarity: 'afsonaviy', emoji: '👑', forRole: 'all' },
    ],
  },
};

if (!config.bot.token) {
  console.error('❌ BOT_TOKEN .env faylida topilmadi!');
  process.exit(1);
}

module.exports = config;
