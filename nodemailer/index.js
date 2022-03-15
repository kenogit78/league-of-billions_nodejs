const nodemailer = require('nodemailer')
const config = require('../config')


const Transport = async ( data) => {
  
    console.log(data)
    // const transporter = nodemailer.createTransport({
    //     host: "smtp.mailtrap.io",
    //     port: 2525,
    //     auth: {
    //       user: "e85d7fc7e3bf2e",
    //       pass: "396dd31a5fb9fc"
    //     }
    //   });
   
const transporter = nodemailer.createTransport({
    service: 'hotmail',

    auth: {
        user: config.emailUser,
        pass: config.emailPass
    },
 
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