//eslint-disable-next-line
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

module.exports = class DonateCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'donate',
      group: 'support',
      memberName: 'donate',
      description: 'Sends you a link to donate to the host.',
      details: oneLine `
      Do you like SmoreBot? Do you want to help out the host?
      This command sends a link you can use to donate to the host.
			`,
      examples: ['invite'],
      guildOnly: true,
      guarded: true
    })
  }

  //eslint-disable-next-line class-methods-use-this
  async run(message) {
    message.channel.send('Please donate to our host here: \nhttps://patreon.com/vertbot')
  }
};
