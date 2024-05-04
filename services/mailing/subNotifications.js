// emailService.js
const nodemailer = require("nodemailer");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: "ibenemeikenna96@gmail.com",
    pass: "urvf bppa wbgo bmsm",
  },
});

const sendSubscriptionStatusNotification = async (user, status, duration) => {
  try {
    let emailContent = "";
    let subject = "";
    switch (status) {
      case "accepted":
        emailContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Subscription Accepted</title>
            <style>
                /* Define your email styles here */
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 150px;
                }
                .content {
                    text-align: center;
                    color: #333333;
                }
                .message {
                    margin-top: 20px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="cid:logo" alt="Company Logo">
                </div>
                <div class="content">
                    <h1>Subscription Accepted</h1>
                    <p>Hello,</p>
                    <p>We're excited to inform you that your subscription request has been accepted!</p>
                    <p>Your subscription is valid for ${duration} days starting from today.</p>
                    <p class="message">Thank you for joining us!</p>
                </div>
            </div>
        </body>
        </html> `;
        subject = "Subscription Accepted";
        break;
      case "rejected":
        emailContent = "Your subscription request has been rejected.";
        subject = "Subscription Rejected";
        break;
      case "expired":
        emailContent = "Your subscription has expired.";
        subject = "Subscription Expired";
        break;
      default:
        break;
    }

    const mailOptions = {
      from: '"Ibeneme Ikenna" <ikennaibenemee@gmail.com>',
      to: user.email,
      subject: subject,
      html: emailContent,
    //   attachments: [
    //     {
    //       filename: "logo.png",
    //       //  path: path.join(__dirname, "../../assests/image/logo.png"),
    //       cid: "logo",
    //     },
     // ],
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(
      "Error sending subscription status notification email:",
      error
    );
    throw error;
  }
};

module.exports = { sendSubscriptionStatusNotification };
