const twilio = require('twilio');
const mysql = require('mysql');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

function checkIncomeCertificateStatus() {
  const query = `
    SELECT u.mobile, i.applicationStatus 
    FROM income i
    JOIN users u ON i.aadhar = u.aadhar
    WHERE i.applicationStatus = 'rejected';
  `;
  connection.query(query, (error, results) => {
    if (error) throw error;
    
    results.forEach(row => {
      const mobileNumber = row.mobile;
      client.messages.create({
        body: 'Your income certificate application has been rejected.',
        to: mobileNumber, 
        from: '+17479004391' 
      })
      .then(message => console.log(`SMS sent to ${mobileNumber}: ${message.sid}`))
      .catch(error => console.error('Error sending SMS:', error));
    });
  });
}

checkIncomeCertificateStatus();
