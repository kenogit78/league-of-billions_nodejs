const nodemailer = require('nodemailer')
const config = require('../config')


const Transport = async ( data) => {
 

    const mailOptions  = data
const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
})

transporter.verify((error, success) => {
    if(error){
        console.log(error)
    }else{
        console.log('Ready for message')
    }
})
console.log(Object.assign({}, mailOptions));

transporter.sendMail(mailOptions, 
    
    function(error, info){
    console.log(mailOptions)
    if(error){
        console.log(error)
    }
    else{
        console.log('verification successful')
    }
})

}



module.exports = {
    Transport
}