require('dotenv').config()

module.exports = {
    appName: process.env.APP_NAME || 'league-of-billions',
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoURL: process.env.MONGO_URL,
    amqp: {
      url: process.env.AMQP_URL  
    },
    redis: {
        url: process.env.REDIS_URL
    }
}