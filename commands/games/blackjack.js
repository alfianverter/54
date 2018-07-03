const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Blackjack = require('../../structures/games/Blackjack');
const Currency = require('../../structures/currency/Currency');

module.exports = class BlackjackCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'blackjack',
      group: 'games',
      memberName: 'blackjack',
      description: `Play a game of blackjack to earn ${Currency.plural}!`,
      details: `Play a game of blackjack for ${Currency.plural}.`,
      guildOnly: true,
      throttling: {
        usages: 1,
        duration: 30
      },

      args: [{
        key: 'bet',
        prompt: `How many ${Currency.textPlural} do you want to bet?\n`,
        type: 'integer',
        validate: async (bet, msg) => {
          bet = parseInt(bet);
          const balance = await Currency.getBalance(msg.author.id);
          if (balance < bet) {
            return `
								You don't have enough ${Currency.textPlural}!
								Your current account balance is ${Currency.convert(balance)}.
								Please specify a valid amount of ${Currency.textPlural}.
							`;
          }
          if (![100, 200, 300, 400, 500, 1000].includes(bet)) {
            return `
								please choose \`100, 200, 300, 400, 500, 1000\` for your bet.
							`;
          }
          return true;
        }
      }]
    });
  }

  async run(msg, {
    bet
  }) {
    if (Blackjack.gameExists(msg.author.id)) {
      return msg.reply('You can\'t start 2 games of blackjack at the same time.');
    }

    const blackjack = new Blackjack(msg);
    return msg.say(
      `New game of blackjack started with ${msg.member.displayName} with a bet of ${Currency.convert(bet)}!`
    ).then(async () => {
      const balance = await Currency.getBalance(msg.author.id);
      const playerHand = blackjack.getHand();
      let dealerHand = blackjack.getHand();
      let playerHands;

      if (Blackjack.handValue(playerHand) !== 'Blackjack') {
        playerHands = await this.getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack);
        //eslint-disable-next-line no-use-before-define
        const result = this.gameResult(Blackjack.handValue(playerHands[0]), 0);
        const noHit = playerHands.length === 1 && result === 'bust';

        while ((Blackjack.isSoft(dealerHand) ||
            Blackjack.handValue(dealerHand) < 17) &&
          !noHit) { // eslint-disable-line no-unmodified-loop-condition
          blackjack.hit(dealerHand);
        }
      } else {
        playerHands = [playerHand];
      }

      blackjack.endGame();

      const dealerValue = Blackjack.handValue(dealerHand);
      let winnings = 0;
      let hideHoleCard = true;
      const embed = {
        title: `Blackjack | ${msg.member.displayName}`,
        fields: [],
        footer: {
          text: blackjack.cardsRemaining() ? `Cards remaining: ${blackjack.cardsRemaining()}` : 'Shuffling'
        }
      };

      playerHands.forEach((hand, i) => {
        const playerValue = Blackjack.handValue(hand);
        this.playerValue = playerValue;
        const result = this.gameResult(playerValue, dealerValue);

        if (result !== 'bust') hideHoleCard = false;

        /*eslint-disable*/
        const lossOrGain = Math.floor((['loss', 'bust'].includes(result) ?
          -1 : result === 'push' ?
          0 : 1) * (hand.doubled ?
          2 : 1) * (playerValue === 'Blackjack' ?
          1.5 : 1) * bet);
        /*eslint-enable*/

        winnings += lossOrGain;
        const soft = Blackjack.isSoft(hand);
        /* eslint-disable max-len */
        embed.fields.push({
          name: playerHands.length === 1 ? '**Your hand**' : `**Hand ${i + 1}**`,
          value: stripIndents `
						${hand.join(' - ')}
						Value: ${soft ? 'Soft ' : ''}${playerValue}
						Result: ${result.replace(/(^\w|\s\w)/g, ma => ma.toUpperCase())}${result !== 'push' ? `, ${lossOrGain}` : `, ${Currency.plural} back`}
					`,
          inline: true
        });
        /* eslint-enable max-len */
      });

      embed.fields.push({
        name: '\u200B',
        value: '\u200B'
      });

      embed.fields.push({
        name: '**Dealer hand**',
        value: stripIndents `
					${hideHoleCard ? `${dealerHand[0]} - XX` : dealerHand.join(' - ')}
					Value: ${hideHoleCard ? Blackjack.handValue([dealerHand[0]]) : dealerValue}
				`
      });

      /*eslint-disable*/
      embed.color = winnings > 0 ? 0x009900 : winnings < 0 ? 0x990000 : undefined;
      embed.description = `You ${winnings === 0
				? 'broke even' : `${winnings > 0
					? 'won' : 'lost'} ${Math.abs(winnings)}`}`;
      /*eslint-enable*/

      if (winnings !== 0) Currency.changeBalance(msg.author.id, winnings);

      return msg.embed(embed);
    });
  }

  //eslint-disable-next-line class-methods-use-this
  gameResult(playerValue, dealerValue) {
    if (playerValue > 21) return 'bust';
    if (dealerValue > 21) return 'dealer bust';
    if (playerValue === dealerValue) return 'push';
    if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';

    return 'loss';
  }

  //eslint-disable-next-line class-methods-use-this
  getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack) {
    return new Promise(async resolve => {
      const hands = [playerHand];
      let currentHand = hands[0];
      let totalBet = bet;

      const nextHand = () => currentHand = hands[hands.indexOf(currentHand) + 1]; // eslint-disable-line no-return-assign, max-len
      while (currentHand) { // eslint-disable-line no-unmodified-loop-condition
        if (currentHand.length === 1) blackjack.hit(currentHand);
        if (Blackjack.handValue(currentHand) === 'Blackjack') {
          nextHand();
          //eslint-disable-next-line no-continue
          continue;
        }
        if (Blackjack.handValue(currentHand) >= 21) {
          nextHand();
          //eslint-disable-next-line no-continue
          continue;
        }
        if (currentHand.doubled) {
          blackjack.hit(currentHand);
          nextHand();
          //eslint-disable-next-line no-continue
          continue;
        }

        const canDoubleDown = balance >= totalBet + bet && currentHand.length === 2;
        const canSplit = balance >= totalBet + bet &&
          Blackjack.handValue([currentHand[0]]) === Blackjack.handValue([currentHand[1]]) &&
          currentHand.length === 2;

        /*eslint-disable*/
        await msg.embed({ // eslint-disable-line no-await-in-loop
          title: `Blackjack | ${msg.member.displayName}`,
          description: !canDoubleDown && !canSplit ?
            'Type `hit` to draw another card or `stand` to pass.' : `Type \`hit\` to draw another card, ${canDoubleDown
							? '`double down` to double down, '
							: ''}${canSplit
							? '`split` to split, ' : ''}or \`stand\` to pass.`,
          fields: [{
              name: hands.length === 1 ?
                '**Your hand**' : `**Hand ${hands.indexOf(currentHand) + 1}**`,
              value: stripIndents `
								${currentHand.join(' - ')}
								Value: ${Blackjack.isSoft(currentHand) ? 'Soft ' : ''}${Blackjack.handValue(currentHand)}
							`,
              inline: true
            },
            {
              name: '**Dealer hand**',
              value: stripIndents `
								${dealerHand[0]} - XX
						 		Value: ${Blackjack.isSoft([dealerHand[0]]) ? 'Soft ' : ''}${Blackjack.handValue([dealerHand[0]])}
							`,
              inline: true
            }
          ],
          footer: {
            text: blackjack.cardsRemaining() ? `Cards remaining: ${blackjack.cardsRemaining()}` : `Shuffling`
          }
        });
        /*eslint-enable*/

        /*eslint-disable*/
        const responses = await msg.channel.awaitMessages(msg2 =>
          msg2.author.id === msg.author.id && (
            msg2.content === 'hit' ||
            msg2.content === 'stand' ||
            (msg2.content === 'split' && canSplit) ||
            (msg2.content === 'double down' && canDoubleDown)
          ), {
            maxMatches: 1,
            time: 20e3
          });
        /*eslint-enable*/

        if (responses.size === 0) break;
        const action = responses.first().content.toLowerCase();
        if (action === 'stand' || Blackjack.handValue(currentHand) >= 21) {
          if (currentHand === hands[hands.length - 1]) break;
          nextHand();
        }
        if (action === 'hit') blackjack.hit(currentHand);
        if (action === 'split' && canSplit) {
          totalBet += bet;
          hands.push([currentHand.pop()]);
          blackjack.hit(currentHand);
        }
        if (action === 'double down' && canDoubleDown) {
          totalBet += bet;
          currentHand.doubled = true;
        }
      }

      return resolve(hands);
    });
  }
};
