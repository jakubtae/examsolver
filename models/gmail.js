var nodemailer = require("nodemailer");
var xoauth2 = require('xoauth2');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
    service: "Gmail",
    auth: {
      xoauth2: xoauth2.createXOAuth2Generator({
        user: process.env.GMAIL_NAME, // Your gmail address.
        pass:process.env.GMAIL_PASSWORD,                                      // Not @developer.gserviceaccount.com
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      })
    },
  }));

  module.exports = transporter;