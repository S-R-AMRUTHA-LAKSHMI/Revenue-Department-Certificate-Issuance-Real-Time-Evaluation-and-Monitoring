const twilio = require('twilio');
const mysql = require('mysql');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


function checkCommunityCertificateStatus(applicationId) {
  console.log(`Checking status for application ID: ${applicationId}`);
  const query = `
    SELECT u.mobile, c.applicationStatus, c.aadhar
    FROM community c
    JOIN users u ON c.aadhar = u.aadhar
    WHERE c.aadhar = ? AND c.applicationStatus = 'rejected';
  `;
  connection.query(query, [applicationId], (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return;
    }
    console.log(`Query results:`, results);
    if (results.length === 0) {
      console.log('No rejected application found for ID:', applicationId);
      return;
    }
    results.forEach(row => {
      let mobileNumber = row.mobile;
      console.log(`Raw mobile number from database: ${mobileNumber}`);
      if (!mobileNumber.startsWith('+')) {
        mobileNumber = `+91${mobileNumber}`;
      }
      console.log(`Formatted mobile number: ${mobileNumber}`);
      client.messages.create({
        body: 'Your community certificate application has been rejected.',
        to: mobileNumber,
        from: '+15203574586' 
      })
      .then(message => {
        console.log(`SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);
        console.log(`Full message details:`, message);
        updateApplicationCount(row.aadhar);
      })
      .catch(error => {
        console.error('Error sending SMS:', error);
        console.error('Error details:', error.message);
      });
    });
  });
}

if (require.main === module) {
  const applicationId = process.argv[2];
  if (!applicationId) {
    console.error('Please provide an application ID as an argument');
    process.exit(1);
  }
  checkCommunityCertificateStatus(applicationId);
} else {
  module.exports = checkCommunityCertificateStatus;
}