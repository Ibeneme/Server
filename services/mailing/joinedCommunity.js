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

const sendPostJoinCommunityNotification = async (user, post) => {
  try {
    const subscriptionDate = new Date(); // Capture subscription date
    const expiryDate = new Date(subscriptionDate.getTime() + (29 * 24 * 60 * 60 * 1000)); // Calculate expiry date

    const emailContent = `<!DOCTYPE html>
    <html lang="en">
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Community Joining Confirmation</title>
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
            .thank-you {
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
                <h1>Successfully Joined Our Community!</h1>
                <p>Hello,</p>
                <p>You've successfully joined our community until ${expiryDate.toDateString()}. We're excited to have you onboard!</p>
                <p>As a member, you'll have access to exclusive content, discussions, and events.</p>
                <p class="thank-you">Thank you for being a part of our community!</p>
            </div>
        </div>
    </body>
    </html> `;

    const mailOptions = {
      from: '"OTI Signals" <ikennaibenemee@gmail.com>',
      to: user.email, // Recipient
      subject: "Community Joining Confirmation", // Subject line
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

    // Schedule reminder emails
    scheduleReminderEmails(user, expiryDate);

  } catch (error) {
    console.error("Error sending post notification email:", error);
    throw error; // Rethrow the error for handling at a higher level
  }
};

const scheduleReminderEmails = async (user, expiryDate) => {
  // Calculate reminder dates
  const threeDaysBeforeExpiry = new Date(expiryDate.getTime() - (3 * 24 * 60 * 60 * 1000));
  const twoDaysBeforeExpiry = new Date(expiryDate.getTime() - (2 * 24 * 60 * 60 * 1000));
  const oneDayBeforeExpiry = new Date(expiryDate.getTime() - (1 * 24 * 60 * 60 * 1000));
  const expiryDay = new Date(expiryDate);

scheduleEmail(user, "Your subscription to Our Community OTI Signals is expiring in 3 days. Please consider renewing your subscription to ensure uninterrupted access to our exclusive content and features.", threeDaysBeforeExpiry);
scheduleEmail(user, "Your subscription to Our Community OTI Signals is expiring in 2 days. Kindly renew your subscription to continue enjoying our community's benefits and stay updated with the latest news and signals.", twoDaysBeforeExpiry);
scheduleEmail(user, "Your subscription to Our Community OTI Signals is expiring tomorrow. Renew your subscription now to avoid any interruption in accessing our premium content and discussions.", oneDayBeforeExpiry);
scheduleEmail(user, "Your subscription to Our Community OTI Signals has expired. You'll be automatically removed from our community. To regain access and continue benefiting from our resources, please renew your subscription at your earliest convenience.", expiryDay);
};

const scheduleEmail = async (user, message, date) => {
  try {
    const emailContent = `<!DOCTYPE html>
    <html lang="en">
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Reminder</title>
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
                <h1>Subscription Reminder</h1>
                <p>Hello,</p>
                <p>${message}</p>
            </div>
        </div>
    </body>
    </html> `;

    const mailOptions = {
      from: '"OTI Signals" <ikennaibenemee@gmail.com>',
      to: user.email, // Recipient
      subject: "Subscription Reminder", // Subject line
      html: emailContent, // HTML body
      attachments: [
        {
          filename: "logo.png",
          path: logoPath,
          cid: "logo", // Content ID of the image
        },
      ],
    };

    // Schedule email
    setTimeout(async () => {
      await transporter.sendMail(mailOptions);
    }, date - Date.now());

  } catch (error) {
    console.error("Error scheduling reminder email:", error);
    throw error; // Rethrow the error for handling at a higher level
  }
};

module.exports = { sendPostJoinCommunityNotification };
