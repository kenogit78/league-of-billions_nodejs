const nodemailer = require('nodemailer')
const config = require('../config')


const Transport = async ( data) => {
 

   
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


transporter.sendMail(data, 
    
    function(error, info){
    console.log(data)
    if(error){
        console.log(error)
    }
    else{
        console.log('email sent successful')
    }
})

}



module.exports = {
    Transport
}