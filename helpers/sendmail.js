const { SMTP_URL } = process.env;
const passport = require('nodemailer');

const sendEmail = (emailData, smtp_url = SMTP_URL) => {
    const defaultEmailData = { from: 'codersconnect@gmail.com' };
    const completeEmailData = Object.assign(defaultEmailData, emailData);
    transporter = nodemailer.createTransport(SMTP_URL);
    return transporter
      .sendEmail(completeEmailData)
      .then(info => console.log(`Messsage sent:${info.messsage}`))
      .catch(err => console.log(`Problem Sending Email:${err}`))
  }
  module.export ={sendEmail};