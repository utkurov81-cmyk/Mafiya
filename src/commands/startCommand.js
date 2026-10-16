const { mainMenu } = require('../keyboards/mainKeyboard');
const { upsertUser, giveDefaultMasks } = require('../database/userRepo');
const messages = require('../utils/messages');

module.exports = function registerStartCommand(bot) {
  bot.command('start', async (ctx) => {
    const user = ctx.from;
    upsertUser(user);
    giveDefaultMasks(user.id);

    await ctx.reply(
      messages.welcome(user.first_name || 'Mehmon'),
      {
        parse_mode: 'HTML',
        ...mainMenu(),
      }
    );
  });
};
