const { getAlivePlayers, getNightActions, saveNightAction, markNightActionDone,
        setPlayerStatus, setPlayerProtection, getRoomPlayers, resetNightActions } = require('../database/roomRepo');
const { nightActionKeyboard } = require('../keyboards/gameKeyboards');
const { getMafiaTargets, getDetectiveTargets, getDoctorTargets } = require('./roleManager');
const { setTimer } = require('../timers/gameTimer');
const { checkWinCondition, getPlayerName, getRoleInfo } = require('../utils/helpers');
const { GamePhase, ActionType } = require('../utils/states');
const logger = require('../utils/logger');
const config = require('../config');

async function startNight(bot, room) {
  resetNightActions(room.id);
  const alivePlayers = getAlivePlayers(room.id);

  // Har bir rol uchun maxsus xabar va tugmalar
  for (const player of alivePlayers) {
    try {
      if (player.role === 'mafia') {
        const targets = getMafiaTargets(room.id);
        if (targets.length > 0) {
          await bot.telegram.sendMessage(
            player.user_id,
            `🌙 <b>Kecha boshlandi!</b>\n🔪 Kim o'ldirilsin? Nishon tanlang:`,
            {
              parse_mode: 'HTML',
              ...nightActionKeyboard(targets, 'kill', room.id),
            }
          );
        }
      } else if (player.role === 'detective') {
        const targets = getDetectiveTargets(room.id);
        if (targets.length > 0) {
          await bot.telegram.sendMessage(
            player.user_id,
            `🌙 <b>Kecha boshlandi!</b>\n🔍 Kim tekshirilsin?`,
            {
              parse_mode: 'HTML',
              ...nightActionKeyboard(targets, 'investigate', room.id),
            }
          );
        }
      } else if (player.role === 'doctor') {
        const targets = getDoctorTargets(room.id);
        if (targets.length > 0) {
          await bot.telegram.sendMessage(
            player.user_id,
            `🌙 <b>Kecha boshlandi!</b>\n🩺 Kim himoya qilinsin?`,
            {
              parse_mode: 'HTML',
              ...nightActionKeyboard(targets, 'heal', room.id),
            }
          );
        }
      } else {
        await bot.telegram.sendMessage(
          player.user_id,
          `🌙 <b>Kecha boshlandi!</b>\n😴 Shahar uxlayapti...\n<i>Siz fuqarosiz, kuting.</i>`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      logger.warn(`Night action xabari yuborilib bo'lmadi: ${player.user_id} - ${err.message}`);
    }
  }
}

async function handleNightAction(bot, room, actorId, actionType, targetId) {
  saveNightAction(room.id, room.round_number, actorId, actionType, targetId);
  markNightActionDone(room.id, actorId);

  // Tekshiruv natijasini darhol komissarga yuborish
  if (actionType === ActionType.INVESTIGATE) {
    const allPlayers = getRoomPlayers(room.id);
    const target = allPlayers.find(p => p.user_id === targetId);
    if (target) {
      const isMafia = target.role === 'mafia';
      const info = getRoleInfo(target.role);
      try {
        await bot.telegram.sendMessage(
          actorId,
          `🔍 <b>Tekshiruv natijasi:</b>\n\n${getPlayerName(target)}: ${isMafia ? '🔴 <b>MAFIA!</b>' : '✅ <b>Tinch fuqaro</b>'}\n<i>Bu ma'lumot maxfiy saqlang!</i>`,
          { parse_mode: 'HTML' }
        );
      } catch (err) {
        logger.warn(`Komissar natijasi yuborilib bo'lmadi: ${err.message}`);
      }
    }
  }
}

async function resolveNight(room) {
  const actions = getNightActions(room.id, room.round_number);
  const alivePlayers = getAlivePlayers(room.id);

  const killAction = actions.find(a => a.action_type === ActionType.KILL);
  const healAction = actions.find(a => a.action_type === ActionType.PROTECT);

  let killed = null;
  let savedByDoctor = false;

  if (killAction && killAction.target_id) {
    const target = alivePlayers.find(p => p.user_id === killAction.target_id);
    if (target) {
      if (healAction && healAction.target_id === killAction.target_id) {
        // Shifokor qutqardi
        savedByDoctor = true;
        setPlayerProtection(room.id, killAction.target_id, true);
        logger.info(`🩺 Shifokor qutqardi: userId=${killAction.target_id}`);
      } else {
        // O'ldirildi
        setPlayerStatus(room.id, killAction.target_id, 'dead');
        killed = target;
        logger.info(`💀 O'ldirildi: userId=${killAction.target_id}`);
      }
    }
  }

  return { killed, savedByDoctor };
}

module.exports = { startNight, handleNightAction, resolveNight };
