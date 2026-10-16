const { Markup } = require('telegraf');
const config = require('../config');
const { getRarityEmoji } = require('../utils/helpers');

function masksMenu(ownedMasks, selectedMask) {
  const buttons = config.masks.list.map(mask => {
    const owned = ownedMasks.includes(mask.id);
    const selected = selectedMask === mask.id;
    let label = `${getRarityEmoji(mask.rarity)} ${mask.name}`;
    if (selected) label = `✅ ${label}`;
    else if (!owned) label = `🔒 ${label}`;
    return [Markup.button.callback(label, owned ? `select_mask_${mask.id}` : `info_mask_${mask.id}`)];
  });
  buttons.push([Markup.button.callback('🔙 Orqaga', 'profile_back')]);
  return Markup.inlineKeyboard(buttons);
}

module.exports = { masksMenu };
