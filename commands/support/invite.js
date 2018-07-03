//eslint-disable-next-line
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

module.exports = class InviteCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'invite',
      aliases: ['add'],
      group: 'support',
      memberName: 'invite',
      description: 'Sends an invite for the bot.',
      details: oneLine `
      Do you like SmoreBot? Do you want it on your very own server?
      This command sends an invite to the bot so you can spread the smore love!
			`,
      examples: ['invite'],
      guildOnly: true,
      guarded: true
    })
  }

  //eslint-disable-next-line class-methods-use-this
  async run(message) {
    message.channel.send('Click here to add me to your server: https://discordapp.com/oauth2/authorize?permissions=360054015&scope=bot&client_id=290228059599142913')
  }
};
