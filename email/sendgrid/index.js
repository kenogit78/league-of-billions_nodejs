const sendgrid = require('@sendgrid/mail')
const config = require('../../config')

class Sendgrid {
    constructor() {
        sendgrid.setApiKey(config.sendgrid)
    }

    send(data) {
        const { subject, to, payload } = data
        const msg = {
            to, 
            from: config.sendgridEmail,
            subject,
            templateId: config.dynamicTemplateId, 
            dynamic_template_data: {
                subject,
                payload: payload.otp
            }      
        }
        return sendgrid.send(msg)
    }
}

module.exports = new Sendgrid()
