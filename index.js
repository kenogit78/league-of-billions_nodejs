const app = require('./core/express')
const db = require('./core/db')
const email = require('./service/mailjet')

app.startAPI()

//connect db
db.connect()

email.SendEmail()
