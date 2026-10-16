const { Markup } = require('telegraf');

const mainMenu = () => Markup.keyboard([
  ['🎮 O\'yinga kirish', '🏠 Xona yaratish'],
  ['👥 O\'yinchilar', '🎭 Rollar haqida'],
  ['📜 O\'yin qoidalari', '👤 Mening profilim'],
  ['🏆 Reyting', '🎒 To\'plamim'],
  ['⚙️ Sozlamalar', '❓ Yordam'],
]).resize();

const backButton = () => Markup.keyboard([['🔙 Orqaga']]).resize();

const cancelButton = () => Markup.keyboard([['❌ Bekor qilish']]).resize();

module.exports = { mainMenu, backButton, cancelButton };
