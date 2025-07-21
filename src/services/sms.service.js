const twilio = require('twilio');

const sendSMS = (to, body) => {
  if (process.env.NODE_ENV === 'production') {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    client.messages
      .create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      })
      .then((message) => console.log('SMS sent:', message.sid))
      .catch((error) => console.error('Error sending SMS:', error));
  } else {
    console.log(`Dummy SMS to ${to}: ${body}`);
  }
};

module.exports = {
  sendSMS,
};
