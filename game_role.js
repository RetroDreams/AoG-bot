require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] });

const logger = require('winston')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, { colorize: true })
logger.level = 'debug'

client.login(process.env.BOT_TOKEN)

client.on('ready', function (evt) {
  logger.info(`Logged in as: ${client.user.tag}`)
})

client.on('presenceUpdate', (oldMember, newMember) => {
  try {
    const playingRole = newMember.guild.roles.cache.get("998484966373605397"); // our server specific role ID

    if (newMember.user.bot || newMember.clientStatus === 'mobile' || oldMember.status !== newMember.status) return; // ignore these types of events

    const oldGame = oldMember.activities.find(activity => activity.type === 0) ? true : false; // activity type 0 is 'playing a game'
    const newGame = newMember.activities.find(activity => activity.type === 0) ? true : false;

    if (!oldGame && newGame) {         // started playing
      newMember.member.roles.add(playingRole)
        .then(() => logger.info(`${playingRole.name} added to ${newMember.user.tag}`))
        .catch(logger.error);
    } else if (oldGame && !newGame) {  // stopped playing
      newMember.member.roles.remove(playingRole)
        .then(() => logger.info(`${playingRole.name} removed from ${newMember.user.tag}`))
        .catch(logger.error);
    }
  } catch (error) {
    logger.error(error);
    return;
  }
});