require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] });

const logger = require('winston')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, { colorize: true })
logger.level = 'debug'

const BOT_TOKEN = process.env.BOT_TOKEN

client.login(BOT_TOKEN)

client.on('ready', function (evt) {
  logger.info(`Logged in as: ${client.user.tag}`)
})

const PLAYING_ROLE_ID = "998484966373605397" // our server specific role ID

client.on('presenceUpdate', (oldMember, newMember) => {
  const guild = newMember.guild;
  const playingRole = guild.roles.cache.get(PLAYING_ROLE_ID);

  if (newMember.user.bot || newMember.clientStatus === 'mobile' || oldMember.status !== newMember.status) return;

  const oldGame = oldMember.activities.find(activity => activity.type === 1) ? true : false; // activity type 1 is 'playing a game'
  const newGame = newMember.activities.find(activity => activity.type === 1) ? true : false;

  if (!oldGame && newGame) {         // started playing
    newMember.member.roles.add(playingRole)
      .then(() => console.log(`${playingRole.name} added to ${newMember.user.tag}`))
      .catch(console.error);
  } else if (oldGame && !newGame) {  // stopped playing
    newMember.member.roles.remove(playingRole)
      .then(() => console.log(`${playingRole.name} removed from ${newMember.user.tag}`))
      .catch(console.error);
  }
});