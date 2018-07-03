//eslint-disable-next-line
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const { RichEmbed } = require('discord.js');

module.exports = class EchoCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: 'echo',
      group: 'fun',
      memberName: 'echo',
      description: 'Echoes what you say.',
      details: oneLine `
	Do you want SmoreBot to say whatever you want?
	This is the command for you.
			`,
      examples: ['echo lol'],
      args: [{
        key: 'toEcho',
        label: 'echo',
        prompt: 'What would you like me to say?',
        type: 'string',
        infinite: false
      }]
    })
  }

  //eslint-disable-next-line class-methods-use-this
  async run(message, args) {
    let avatarURL = message.author.avatar ? message.author.avatarURL : 'https://discordapp.com/assets/0e291f67c9274a1abdddeb3fd919cbaa.png'
    const embed = new RichEmbed()
      .setAuthor(`${message.author.tag}`, `${avatarURL}`)
      .setColor(0x0000FF)
      .setDescription(`${args.toEcho}`)
      .setFooter(`Message echoed from: ${message.author.username}`)
      .setTimestamp()
    message.delete(1)
    await message.channel.send({
      embed
    })
  }
};
