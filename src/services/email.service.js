const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});



// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};





async function sendRegistrationEmail(
  userEmail,
  name
) {
  const subject =
    "Welcome to Backend Ledger 🎉";

  const text = `
Hi ${name},

Welcome to Backend Ledger.

Your account has been created successfully.

You can now log in and start managing your transactions.

Thanks,
Backend Ledger Team
`;

  const html = `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: auto;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 10px;
    ">

      <h2 style="color:#2563eb;">
        Welcome to Backend Ledger 🎉
      </h2>

      <p>Hi <strong>${name}</strong>,</p>

      <p>
        Your account has been created successfully.
      </p>

      <p>
        You can now log in and start managing your transactions.
      </p>

      <p>
        Thanks for joining us 🚀
      </p>

      <hr />

      <p style="
        font-size: 14px;
        color: gray;
      ">
        Backend Ledger Team
      </p>
    </div>
  `;

  await sendEmail(
    userEmail,
    subject,
    text,
    html
  );
}




module.exports = {
    sendRegistrationEmail
};