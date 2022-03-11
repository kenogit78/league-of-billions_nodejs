const email = require('./sendgrid')

const emailService = ( data ) => {
    console.log(data)

 
    email.send(data).then(send => {
        console.log(send)
        const { statusCode } = send[0]
        if (statusCode === 202) {
            console.log('account created')
        }
    }).catch(err => {
        console.log('error sending email', err)
        // sub.nack(msg)
    })
}

module.exports = {
    emailService
}