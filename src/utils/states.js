// O'yin holatlari uchun konstantalar
const GameStatus = {
  WAITING: 'waiting',
  STARTING: 'starting',
  RUNNING: 'running',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
};

const GamePhase = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  NIGHT_ACTIONS: 'night_actions',
  DAY: 'day',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  RESULTS: 'results',
};

const PlayerStatus = {
  ALIVE: 'alive',
  DEAD: 'dead',
  LEFT: 'left',
};

const PlayerRole = {
  MAFIA: 'mafia',
  DETECTIVE: 'detective',
  DOCTOR: 'doctor',
  CITIZEN: 'citizen',
};

const ActionType = {
  KILL: 'kill',
  INVESTIGATE: 'investigate',
  PROTECT: 'protect',
};

module.exports = { GameStatus, GamePhase, PlayerStatus, PlayerRole, ActionType };
