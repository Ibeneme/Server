const nodemailer = require("nodemailer");
const path = require("path");
const emailPass = process.env.emailPass;
const emailForMails = process.env.emailForMails;

const logoPath = path.join(__dirname, "../../assests/image/logo.png");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true, // Use SSL
  auth: {
    user: 'ibenemeikenna96@gmail.com',
    pass: 'urvf bppa wbgo bmsm',
  },
});

const sendPostNotificationEmail = async (subscribedUsers, post) => {
  try {
    // Render email content
    const emailContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Post Notification</title>
        <style>
            /* Define your email styles here */
        </style>
    </head>
    <body>
        <h1>New Signal Notification</h1>
        <p>Hello,</p>
        <p>A new Signal titled "${post.title}" has been published on our OTI Signals.</p>
       
        <p>Thank you for being a subscriber!</p>
        <img src="cid:logo" alt="Company Logo">
    </body>
    </html>`;

    // Send emails to subscribed users
    const promises = subscribedUsers.map(async (user) => {
      const mailOptions = {
        from: '"Ibeneme Ikenna" <ikennaibenemee@gmail.com>',
        to: user.email, // Recipient
        subject: "New Post Notification", // Subject line
        html: emailContent, // HTML body
        attachments: [
          {
            filename: "logo.png",
            path: logoPath,
            cid: "logo", // Content ID of the image
          },
        ],
      };

      await transporter.sendMail(mailOptions);
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error sending post notification email:", error);
    throw error; // Rethrow the error for handling at a higher level
  }
};

module.exports = { sendPostNotificationEmail };
