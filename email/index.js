const email = require('./sendgrid')

const emailService = () => {

 
    email.send(data).then(send => {
        console.log(send)
        const { statusCode } = send[0]
        if (statusCode === 202) {
            sub.ack(msg)
        }
    }).catch(err => {
        console.log('error sending email', err)
        sub.nack(msg)
    })
}

module.exports = {
    emailService
}