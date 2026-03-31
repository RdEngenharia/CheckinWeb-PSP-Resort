const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

/**
 * Cloud Function to process hotel check-in and send emails.
 * Configured to use Gmail or SendGrid via environment variables.
 */
exports.processCheckIn = functions.https.onCall(async (data, context) => {
  const { formData, logo, pdfBase64 } = data;

  // 1. Save to Firestore (optional but recommended)
  try {
    await admin.firestore().collection('checkins').add({
      ...formData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
  }

  // 2. Configure Email Transport
  // Use Firebase Secrets or environment variables for security
  // Example: firebase functions:config:set email.user="reserva@hotel.com" email.pass="your-app-password"
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Change to 'sendgrid' or other if needed
    auth: {
      user: process.env.EMAIL_USER || functions.config().email.user,
      pass: process.env.EMAIL_PASS || functions.config().email.pass,
    },
  });

  const mailOptions = {
    from: `"Sistema de Check-in" <${process.env.EMAIL_USER || functions.config().email.user}>`,
    to: 'recepcao@pspresort.com.br, rodrigues.solar@hotmail.com',
    subject: `Novo Check-in: ${formData.nomeCompleto}`,
    text: `Olá,\n\nUm novo check-in foi realizado por ${formData.nomeCompleto}.\n\nSegue em anexo a ficha de registro oficial em PDF.`,
    attachments: [
      {
        filename: `Ficha_${formData.nomeCompleto.replace(/\s+/g, '_')}.pdf`,
        content: pdfBase64.split('base64,')[1],
        encoding: 'base64',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
});
