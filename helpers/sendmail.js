const { SMTP_URL } = process.env;
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');



module.exports = function sendEmail (emailData, smtp_url = SMTP_URL){
    const defaultEmailData = { from: 'satishsinghoct87@gmail.com' };
    const completeEmailData = Object.assign(defaultEmailData, emailData);
    transporter = nodemailer.createTransport(SMTP_URL);
    return transporter
      .sendEmail(completeEmailData)
      .then(info => console.log(`Messsage sent:${info.messsage}`))
      .catch(err => console.log(`Problem Sending Email:${err}`))
  }