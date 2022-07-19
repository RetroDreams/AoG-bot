require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const logger = require('winston')

logger.remove(logger.transports.Console)
logger.add(new logger.transports.Console, { colorize: true })
logger.level = 'debug'

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] })
client.login(process.env.BOT_TOKEN)
client.on('ready', function (evt) {
  logger.info(`Logged in as: ${client.user.tag}`)
})

client.on('presenceUpdate', (oldMember, newMember) => {
  try {
    const playingRole = newMember.guild.roles.cache.get("998484966373605397") // our server specific role ID

    const oldGame = oldMember.activities.find(activity => activity.type === 0) // activity type 0 is 'playing a game'
    const newGame = newMember.activities.find(activity => activity.type === 0)

    // ignore these types of events
    if (newMember.user.bot||
    newMember.clientStatus === 'mobile' ||
    oldMember.status !== newMember.status) return

    if (oldGame === undefined && newGame !== undefined) { // started playing
      // ignore these games
      if (['Wallpaper Engine'].includes(newGame.name)) {
        logger.debug(`ignore list: ${newMember.user.tag} - ${newGame.name}`)
        return
      }
      newMember.member.roles.add(playingRole)
        .then(() => logger.info(`added: ${newMember.user.tag} - ${newGame.name}`))
        .catch(logger.error)
    
    } else if (oldGame !== undefined && newGame === undefined) { // stopped playing
      newMember.member.roles.remove(playingRole)
        .then(() => logger.info(`removed: ${newMember.user.tag} - ${oldGame.name}`))
        .catch(logger.error)
    }
  } catch (error) {
    logger.error(error)
    return
  }
})