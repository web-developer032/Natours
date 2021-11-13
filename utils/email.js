const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Mubasher <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    if (process.env.NODE_ENV === "PRODUCTION") {
      // USE GMAIL
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_FOR_NODEMAILER,
          pass: process.env.PASSWORD_FOR_EMAIL_NODEMAILER,
        },
      });
    }

    // USER MAILTRAP
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) RENDER HTML TEMPLATE FROM PUG
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    // 2) DEFINE EMAIL OPTIONS
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) CREATE TRANSPORT AND SEND EMAIL
    await this.createTransport().sendMail(mailOptions);
    // }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family <3");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your Password Token (Valid for only 10 minutes)."
    );
  }
};

// ---------------------------------
// ------------- FIRST WE USED THIS.
// ---------------------------------

// const sendMail = async (option) => {
//   // 1) CREATE A TRANSPORTER
//   var transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2) SPECIFY EMAIL OPTIONS
//   const mailOptions = {
//     from: "Mubasher <admin@gmail.com>",
//     to: option.email,
//     subject: option.subject,
//     text: option.message,
//   };

//   // 3) SEND EMAIL
//   await transport.sendMail(mailOptions);
// };
