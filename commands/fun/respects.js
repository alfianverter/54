//eslint-disable-next-line
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

module.exports = class RespectsCommand extends commando.Command {
  constructor(bot) {
    super(bot, {
      name: 'respects',
      aliases: ['f'],
      group: 'fun',
      memberName: 'respects',
      description: 'Press F to pay respects.',
      details: oneLine `
      Are you too lazy to add reactions to a message yourself?
      This command automatically creates a respects message so people can pay respects.
			`,
      examples: ['respects']
    });
  }

  //eslint-disable-next-line class-methods-use-this
  async run(message) {
    message.channel.send('Press F to pay respects').then((m) => {
      m.react('🇫');
      message.delete();
    })
  }
};
