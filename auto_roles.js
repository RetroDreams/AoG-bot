require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { createLogger, format, transports } = require('winston');

const myFormat = format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    transports: [
        new transports.File({
            maxsize: 5120000,
            maxFiles: 20,
            filename: `logs/logs.log`,
            timestamp: true,
            json: true,
        }),
        new transports.Console({
            level: "debug",
            timestamp: true,
            format: format.combine(
                format.timestamp(),
                format.colorize(), 
                myFormat,
            )
        })
    ]
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences] })
client.login(process.env.BOT_TOKEN)
client.on('ready', function (evt) {
  logger.info(`Logged in as: ${client.user.tag}`)
})

client.on('presenceUpdate', (oldMember, newMember) => {
  try {
    const playingRole = newMember.guild.roles.cache.get('998484966373605397')
    const streamingRole = newMember.guild.roles.cache.get('841771818737729567')

    const oldGame = oldMember.activities.find(activity => activity.type === 0) // activity type 0 is 'playing a game'
    const newGame = newMember.activities.find(activity => activity.type === 0)

    const oldLivestream = oldMember.activities.find(activity => activity.type === 1) // activity type 1 is 'streaming a game'
    const newLivestream = newMember.activities.find(activity => activity.type === 1)

    // ignore bots and mobile users
    if (newMember.user.bot || newMember.clientStatus === 'mobile') return

    // went offline
    if (newMember.status === 'offline') {
      newMember.member.roles.remove(playingRole)
        .then(() => logger.debug(`offline removed: ${newMember.user.tag}`))
        .catch(logger.error)
      newMember.member.roles.remove(streamingRole)
        .then(() => logger.debug(`offline removed: ${newMember.user.tag}`))
        .catch(logger.error)
    }

    // ignore change in status (ex. going idle)
    if (oldMember.status !== newMember.status) return

    // playing game
    if (oldGame === undefined && newGame !== undefined) { // started playing
      // ignore these games
      if (['Wallpaper Engine', 'About Me'].includes(newGame.name)) {
        logger.debug(`playing ignore list: ${newMember.user.tag} - ${newGame.name}`)
        return
      }
      newMember.member.roles.add(playingRole)
        .then(() => logger.info(`playing added: ${newMember.user.tag} - ${newGame.name}`))
        .catch(logger.error)
    } else if (oldGame !== undefined && newGame === undefined) { // stopped playing
      newMember.member.roles.remove(playingRole)
        .then(() => logger.info(`playing removed: ${newMember.user.tag} - ${oldGame.name}`))
        .catch(logger.error)
    }

    // live streaming
    if (oldLivestream === undefined && newLivestream !== undefined) { // started streaming
      newMember.member.roles.add(streamingRole)
        .then(() => logger.info(`streaming added: ${newMember.user.tag} - ${newLivestream.name}`))
        .catch(logger.error)

    } else if (oldLivestream !== undefined && newLivestream === undefined) { // stopped streaming
      newMember.member.roles.remove(streamingRole)
        .then(() => logger.info(`streaming removed: ${newMember.user.tag} - ${oldLivestream.name}`))
        .catch(logger.error)
    }
  } catch (error) {
    logger.error(error)
    return
  }
})
