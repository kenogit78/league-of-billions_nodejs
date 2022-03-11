require('dotenv').config()

module.exports = {
    appName: process.env.APP_NAME || 'league-of-billions',
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    sendgrid: process.env.SENDGRID_KEY,
    sendgridEmail: process.env.SENDGRID_EMAIL,
    dynamicTemplateId: process.env.SENDGRID_TEMPLATE_ID,
    mongoURL: process.env.MONGO_URL,
    emailUser: process.env.USER,
    emailPass: process.env.PASS,
    baseURL: process.env.BASEURL,
    prodSite: process.env.PROD_SITE,

    amqp: {
      url: process.env.AMQP_URL  
    },
    redis: {
        url: process.env.REDIS_URL
    }
}

