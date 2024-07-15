const nodemailer = require("nodemailer");
const path = require("path");
const emailPass = process.env.emailPass;
const emailForMails = process.env.emailForMails;

const logoPath = path.join(__dirname, "../../assests/image/logo.png");

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

const sendSubscriptionRequestConfirmation = async (user) => {
  try {
    const emailContent = `<!DOCTYPE html>
    <html lang="en">
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Request Confirmation</title>
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
                <h1>Subscription Request Confirmation</h1>
                <p>Hello,</p>
                <p>We have received your request to join our subscription group. Please be patient while we confirm your payment.</p>
                <p>Once your payment is successfully processed, you will receive further instructions to access our exclusive content and features.</p>
                <p class="message">Thank you for choosing us!</p>
            </div>
        </div>
    </body>
    </html> `;

    const mailOptions = {
      from: '"OTI Signals" <ikennaibenemee@gmail.com>',
      to: user.email, // Recipient
      subject: "Subscription Request Received", // Subject line
      html: emailContent, // HTML body
  
    };

    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error("Error sending subscription request confirmation email:", error);
    throw error; // Rethrow the error for handling at a higher level
  }
};

module.exports = { sendSubscriptionRequestConfirmation };
