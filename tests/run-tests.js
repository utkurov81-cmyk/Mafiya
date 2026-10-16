/**
 * MAFIA UZ — Avtomatik testlar
 * Ishlatish: node tests/run-tests.js
 */
const path = require('path');
const fs = require('fs');

// Test uchun vaqtinchalik DB
['./data/test_mafia.db', './data/test_mafia.db-wal', './data/test_mafia.db-shm'].forEach(f => {
  try { fs.unlinkSync(f); } catch {}
});
process.env.DB_PATH = './data/test_mafia.db';
process.env.BOT_TOKEN = 'test_token_12345:test';
process.env.LOG_LEVEL = 'error';

const { getDb } = require('../src/database/db');
const roomRepo = require('../src/database/roomRepo');
const userRepo = require('../src/database/userRepo');
const helpers = require('../src/utils/helpers');

let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
    errors.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('🧪 MAFIA UZ — Testlar boshlanmoqda...\n');

// ─── DATABASE TESTLAR ───
test('Ma\'lumotlar bazasi ulanadi', () => {
  const db = getDb();
  assert(db, 'DB null qaytmadi');
});

test('Foydalanuvchi qo\'shiladi va olinadi', () => {
  const user = { id: 111111, username: 'testuser', first_name: 'Test', last_name: 'User' };
  userRepo.upsertUser(user);
  const fetched = userRepo.getUserById(111111);
  assert(fetched, 'Foydalanuvchi topilmadi');
  assert(fetched.username === 'testuser', 'Username mos kelmadi');
});

test('Foydalanuvchi statistikasi yangilanadi', () => {
  userRepo.upsertUser({ id: 222222, username: 'player2', first_name: 'Player' });
  userRepo.updateUserStats(222222, 'citizens', 'citizen');
  const p = userRepo.getUserById(222222);
  assert(p.total_games === 1, 'Jami o\'yinlar 1 bo\'lishi kerak');
  assert(p.wins === 1, 'G\'alaba 1 bo\'lishi kerak');
});

test('Xona yaratiladi va olinadi', () => {
  const room = roomRepo.createRoom(-100123456, 111111);
  assert(room, 'Xona yaratilmadi');
  assert(room.code.length === 6, 'Kod 6 ta belgi bo\'lishi kerak');
  assert(room.owner_id === 111111, 'Egasi noto\'g\'ri');
});

test('Xonaga o\'yinchi qo\'shiladi', () => {
  const room = roomRepo.createRoom(-100999888, 333333);
  userRepo.upsertUser({ id: 333333, username: 'owner', first_name: 'Owner' });
  userRepo.upsertUser({ id: 444444, username: 'joiner', first_name: 'Joiner' });
  roomRepo.addPlayerToRoom(room.id, 333333);
  const result = roomRepo.addPlayerToRoom(room.id, 444444);
  assert(result.success, 'O\'yinchi qo\'shilmadi');
});

test('Bir o\'yinchi ikki marta qo\'shilmaydi', () => {
  const room = roomRepo.createRoom(-100111222, 555555);
  userRepo.upsertUser({ id: 555555, username: 'dup', first_name: 'Dup' });
  roomRepo.addPlayerToRoom(room.id, 555555);
  const result = roomRepo.addPlayerToRoom(room.id, 555555);
  assert(!result.success, 'Takror qo\'shilish rad etilmadi');
  assert(result.reason === 'already_in_room', 'Sabab noto\'g\'ri');
});

// ─── HELPER TESTLAR ───
test('Rol taqsimlash 4 kishi', () => {
  const roles = helpers.assignRolesForCount(4);
  assert(roles.length === 4, 'Rollar soni 4 bo\'lishi kerak');
  assert(roles.filter(r => r === 'mafia').length >= 1, 'Kamida 1 mafia bo\'lishi kerak');
});

test('Rol taqsimlash 8 kishi', () => {
  const roles = helpers.assignRolesForCount(8);
  assert(roles.length === 8, 'Rollar soni 8 bo\'lishi kerak');
  assert(roles.filter(r => r === 'mafia').length === 2, '8 kishida 2 mafia bo\'lishi kerak');
});

test('G\'alaba sharti — mafia yo\'q', () => {
  const players = [
    { role: 'citizen', status: 'alive' },
    { role: 'detective', status: 'alive' },
  ];
  const result = helpers.checkWinCondition(players);
  assert(result.gameOver, 'O\'yin tugashi kerak');
  assert(result.winner === 'citizens', 'Fuqarolar g\'alaba qozonishi kerak');
});

test('G\'alaba sharti — mafia ko\'pchilik', () => {
  const players = [
    { role: 'mafia', status: 'alive' },
    { role: 'citizen', status: 'alive' },
  ];
  const result = helpers.checkWinCondition(players);
  assert(result.gameOver, 'O\'yin tugashi kerak');
  assert(result.winner === 'mafia', 'Mafia g\'alaba qozonishi kerak');
});

test('O\'yin davom etadi — muvozanat buzilmagan', () => {
  const players = [
    { role: 'mafia', status: 'alive' },
    { role: 'citizen', status: 'alive' },
    { role: 'citizen', status: 'alive' },
  ];
  const result = helpers.checkWinCondition(players);
  assert(!result.gameOver, 'O\'yin tugamasligi kerak');
});

test('Ovoz hisoblash', () => {
  const votes = [
    { target_id: 1 }, { target_id: 1 }, { target_id: 2 }
  ];
  const tally = helpers.countVotes(votes);
  assert(tally[1] === 2, '1-o\'yinchi 2 ovoz olishi kerak');
  assert(tally[2] === 1, '2-o\'yinchi 1 ovoz olishi kerak');
});

test('Ko\'pchilik ovoz tanlash', () => {
  const tally = { 1: 3, 2: 1, 3: 1 };
  const result = helpers.getMostVoted(tally);
  assert(result.targetId === 1, '1-o\'yinchi tanlanishi kerak');
  assert(!result.isTie, 'Durang emas');
});

test('Durang aniqlash', () => {
  const tally = { 1: 2, 2: 2 };
  const result = helpers.getMostVoted(tally);
  assert(result.isTie, 'Durang bo\'lishi kerak');
});

test('Massivni aralashtirish', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = helpers.shuffleArray(arr);
  assert(shuffled.length === arr.length, 'Uzunlik o\'zgarmasligi kerak');
  // Har doim bir xil tartib emasligini tekshirish (ehtimollik bilan)
  let sameCount = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === shuffled[i]) sameCount++;
  }
  // Agar 10 ta element hammasi bir xil joyda bo'lsa, bu juda kam ehtimol
  assert(sameCount < 10, 'Aralashtirish ishlashi kerak (kamida bitta o\'zgarishi kerak)');
});

// ─── TEST YAKUNLASH ───
console.log(`
━━━━━━━━━━━━━━━━━━━━━
🧪 TEST NATIJALARI:
✅ O'tdi: ${passed}
❌ Xato: ${failed}
━━━━━━━━━━━━━━━━━━━━━`);

if (errors.length > 0) {
  console.log('❌ Muvaffaqiyatsiz testlar:');
  errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
}

// Test DB ni o'chirish
try {
  fs.unlinkSync('./data/test_mafia.db');
} catch {}

process.exit(failed > 0 ? 1 : 0);
