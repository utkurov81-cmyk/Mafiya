const logger = require('../utils/logger');

// Faol taymerlarni saqlash
const activeTimers = new Map();

function setTimer(roomId, phase, delayMs, callback) {
  // Mavjud taymerni bekor qilish
  clearTimer(roomId, phase);

  logger.info(`⏱ Taymer o'rnatildi: xona=${roomId}, bosqich=${phase}, muddat=${delayMs}ms`);

  const timeoutId = setTimeout(async () => {
    activeTimers.delete(`${roomId}_${phase}`);
    logger.info(`⏱ Taymer tugadi: xona=${roomId}, bosqich=${phase}`);
    try {
      await callback();
    } catch (err) {
      logger.error(`Taymer callback xatosi (xona=${roomId}, bosqich=${phase}): ${err.message}`);
    }
  }, delayMs);

  activeTimers.set(`${roomId}_${phase}`, timeoutId);
  return timeoutId;
}

function clearTimer(roomId, phase) {
  const key = `${roomId}_${phase}`;
  if (activeTimers.has(key)) {
    clearTimeout(activeTimers.get(key));
    activeTimers.delete(key);
    logger.info(`⏱ Taymer bekor qilindi: xona=${roomId}, bosqich=${phase}`);
  }
}

function clearAllRoomTimers(roomId) {
  for (const [key] of activeTimers) {
    if (key.startsWith(`${roomId}_`)) {
      clearTimeout(activeTimers.get(key));
      activeTimers.delete(key);
    }
  }
  logger.info(`⏱ Barcha taymerlar bekor qilindi: xona=${roomId}`);
}

function getActiveTimerCount() {
  return activeTimers.size;
}

module.exports = { setTimer, clearTimer, clearAllRoomTimers, getActiveTimerCount };
