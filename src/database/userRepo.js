const { getDb } = require('./db');

function upsertUser(telegramUser) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, last_name, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(
    telegramUser.id,
    telegramUser.username || null,
    telegramUser.first_name || '',
    telegramUser.last_name || null
  );
  return getUserById(telegramUser.id);
}

function getUserById(telegramId) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
}

function getUserMasks(telegramId) {
  const db = getDb();
  return db.prepare('SELECT mask_id FROM user_masks WHERE user_id = ?').all(telegramId).map(r => r.mask_id);
}

function giveDefaultMasks(telegramId) {
  const db = getDb();
  const defaultMasks = ['citizen_default', 'mafia_red', 'detective_hat', 'doctor_cross'];
  const stmt = db.prepare('INSERT OR IGNORE INTO user_masks (user_id, mask_id) VALUES (?, ?)');
  for (const maskId of defaultMasks) {
    stmt.run(telegramId, maskId);
  }
}

function setUserMask(telegramId, maskId) {
  const db = getDb();
  db.prepare('UPDATE users SET selected_mask = ? WHERE telegram_id = ?').run(maskId, telegramId);
}

function updateUserStats(telegramId, winnerTeam, playerRole) {
  const db = getDb();
  const user = getUserById(telegramId);
  if (!user) return;

  const isMafia = playerRole === 'mafia';
  const wonAsTeam = (isMafia && winnerTeam === 'mafia') || (!isMafia && winnerTeam === 'citizens');

  let ratingChange = wonAsTeam ? 25 : -15;

  db.prepare(`
    UPDATE users SET
      total_games = total_games + 1,
      wins = wins + ?,
      losses = losses + ?,
      mafia_wins = mafia_wins + ?,
      citizen_wins = citizen_wins + ?,
      rating = MAX(0, rating + ?),
      updated_at = CURRENT_TIMESTAMP
    WHERE telegram_id = ?
  `).run(
    wonAsTeam ? 1 : 0,
    wonAsTeam ? 0 : 1,
    (isMafia && wonAsTeam) ? 1 : 0,
    (!isMafia && wonAsTeam) ? 1 : 0,
    ratingChange,
    telegramId
  );
}

function getTopPlayers(limit = 10) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM users ORDER BY rating DESC, wins DESC LIMIT ?'
  ).all(limit);
}

module.exports = { upsertUser, getUserById, getUserMasks, giveDefaultMasks, setUserMask, updateUserStats, getTopPlayers };
