const { getDb } = require('./db');

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(chatId, ownerId, settings = {}) {
  const db = getDb();
  let code;
  let attempts = 0;
  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > 20) throw new Error('Xona kodi yaratib bo\'lmadi');
  } while (db.prepare('SELECT id FROM rooms WHERE code = ?').get(code));

  const result = db.prepare(`
    INSERT INTO rooms (code, chat_id, owner_id, settings, status, current_phase)
    VALUES (?, ?, ?, ?, 'waiting', 'lobby')
  `).run(code, chatId, ownerId, JSON.stringify(settings));

  return getRoomById(result.lastInsertRowid);
}

function getRoomById(id) {
  const db = getDb();
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (room && room.settings) room.settings = JSON.parse(room.settings);
  return room;
}

function getRoomByCode(code) {
  const db = getDb();
  const room = db.prepare('SELECT * FROM rooms WHERE code = ?').get(code.toUpperCase());
  if (room && room.settings) room.settings = JSON.parse(room.settings);
  return room;
}

function getRoomByChatId(chatId) {
  const db = getDb();
  const room = db.prepare(
    "SELECT * FROM rooms WHERE chat_id = ? AND status NOT IN ('finished', 'cancelled') ORDER BY created_at DESC LIMIT 1"
  ).get(chatId);
  if (room && room.settings) room.settings = JSON.parse(room.settings);
  return room;
}

function updateRoomStatus(roomId, status, extra = {}) {
  const db = getDb();
  const sets = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const vals = [status];
  if (extra.phase) { sets.push('current_phase = ?'); vals.push(extra.phase); }
  if (extra.phaseEndsAt) { sets.push('phase_ends_at = ?'); vals.push(extra.phaseEndsAt); }
  if (extra.roundNumber !== undefined) { sets.push('round_number = ?'); vals.push(extra.roundNumber); }
  vals.push(roomId);
  db.prepare(`UPDATE rooms SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

function getRoomPlayers(roomId) {
  const db = getDb();
  return db.prepare(`
    SELECT rp.*, u.username, u.first_name, u.last_name, u.selected_mask, u.rating
    FROM room_players rp
    JOIN users u ON rp.user_id = u.telegram_id
    WHERE rp.room_id = ?
    ORDER BY rp.joined_at ASC
  `).all(roomId);
}

function getAlivePlayers(roomId) {
  return getRoomPlayers(roomId).filter(p => p.status === 'alive');
}

function addPlayerToRoom(roomId, userId) {
  const db = getDb();
  try {
    db.prepare(
      'INSERT INTO room_players (room_id, user_id) VALUES (?, ?)'
    ).run(roomId, userId);
    return { success: true };
  } catch (e) {
    if (e.message.includes('UNIQUE')) return { success: false, reason: 'already_in_room' };
    throw e;
  }
}

function removePlayerFromRoom(roomId, userId) {
  const db = getDb();
  db.prepare('DELETE FROM room_players WHERE room_id = ? AND user_id = ?').run(roomId, userId);
}

function assignRoles(roomId, roleAssignments) {
  const db = getDb();
  const stmt = db.prepare('UPDATE room_players SET role = ? WHERE room_id = ? AND user_id = ?');
  db.exec('BEGIN TRANSACTION');
  try {
    for (const { userId, role } of roleAssignments) {
      stmt.run(role, roomId, userId);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function setPlayerStatus(roomId, userId, status) {
  const db = getDb();
  db.prepare('UPDATE room_players SET status = ? WHERE room_id = ? AND user_id = ?').run(status, roomId, userId);
}

function setPlayerProtection(roomId, userId, isProtected) {
  const db = getDb();
  db.prepare('UPDATE room_players SET is_protected = ? WHERE room_id = ? AND user_id = ?').run(isProtected ? 1 : 0, roomId, userId);
}

function resetNightActions(roomId) {
  const db = getDb();
  db.prepare('UPDATE room_players SET night_action_done = 0, is_protected = 0 WHERE room_id = ?').run(roomId);
}

function markNightActionDone(roomId, userId) {
  const db = getDb();
  db.prepare('UPDATE room_players SET night_action_done = 1 WHERE room_id = ? AND user_id = ?').run(roomId, userId);
}

function saveNightAction(roomId, roundNumber, actorId, actionType, targetId) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO night_actions (room_id, round_number, actor_id, action_type, target_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(roomId, roundNumber, actorId, actionType, targetId);
}

function getNightActions(roomId, roundNumber) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM night_actions WHERE room_id = ? AND round_number = ?'
  ).all(roomId, roundNumber);
}

function saveVote(roomId, roundNumber, phase, voterId, targetId) {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO votes (room_id, round_number, phase, voter_id, target_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(roomId, roundNumber, phase, voterId, targetId);
}

function getVotes(roomId, roundNumber, phase) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM votes WHERE room_id = ? AND round_number = ? AND phase = ?'
  ).all(roomId, roundNumber, phase);
}

function saveGameResult(roomId, winnerTeam, totalRounds, playerCount) {
  const db = getDb();
  db.prepare(`
    INSERT INTO game_results (room_id, winner_team, total_rounds, player_count)
    VALUES (?, ?, ?, ?)
  `).run(roomId, winnerTeam, totalRounds, playerCount);
}

function getAllActiveRooms() {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM rooms WHERE status NOT IN ('finished', 'cancelled')"
  ).all();
}

module.exports = {
  createRoom, getRoomById, getRoomByCode, getRoomByChatId,
  updateRoomStatus, getRoomPlayers, getAlivePlayers,
  addPlayerToRoom, removePlayerFromRoom, assignRoles,
  setPlayerStatus, setPlayerProtection, resetNightActions,
  markNightActionDone, saveNightAction, getNightActions,
  saveVote, getVotes, saveGameResult, getAllActiveRooms,
};
