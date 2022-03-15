const mailjet = require ('node-mailjet')
.connect('a1bfcdc966d9e78cc8551684b3e5081c', 'f7e0a8dd5902495ce80222110127818c')


const SendEmail = () => {



const request = mailjet
.post("send", {'version': 'v3.1'})
.request({
  "Messages":[
    {
      "From": {
        "Email": "paulkenoofficial@hotmail.com",
        "Name": "Paul"
      },
      "To": [
        {
          "Email": "paulkenoofficial@gmail.com",
          "Name": "Paul"
        }
      ],
      "Subject": "Greetings from Mailjet.",
      "TextPart": "My first Mailjet email",
      "HTMLPart": "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
      "CustomID": "AppGettingStartedTest"
    }
  ]
})
request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err.statusCode)
  })

}

module.exports ={
    SendEmail
}