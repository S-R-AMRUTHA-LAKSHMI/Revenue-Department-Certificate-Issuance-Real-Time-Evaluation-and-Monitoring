require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');


const saltRounds = 10;
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3308,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Improved multer configuration
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const aadhar = req.body.aadhar || 'temp';
    const dir = path.join(__dirname, 'uploads', aadhar);
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    const safeFileName = crypto.randomBytes(16).toString('hex') + fileExtension;
    cb(null, safeFileName);
  }
});

const fileFilter = function (req, file, cb) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});
async function getFileBuffer(file) {
  return file.buffer;
}

// Check database connection
pool.getConnection()
  .then((connection) => {
    console.log('Successfully connected to the database.');
    connection.release();
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });

// User signup
app.post('/api/signup', async (req, res) => {
  console.log('Received signup request:', req.body);

  const { name, username, password, mobile, email, aadharNumber, talukName } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const query = 'INSERT INTO users (name, username, password, mobile, email, aadhar, taluk) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [name, username, hashedPassword, mobile, email, aadharNumber, talukName];

    const [result] = await pool.execute(query, values);
    console.log('User inserted successfully:', result);
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    console.error('Error inserting user:', error);
    res.status(500).json({ error: 'Error creating user', details: error.message });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  console.log('Received login request:', req.body);

  const { userName, userPassword } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  const values = [userName];

  try {
    const [rows] = await pool.execute(query, values);
    if (rows.length > 0) {
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(userPassword, user.password);
      if (passwordMatch) {
        return res.status(200).json({ status: 'Success', aadharNumber: user.aadhar });
      } else {
        return res.status(401).json('Invalid credentials');
      }
    } else {
      return res.status(404).json('User record not found');
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json('An error occurred during login');
  }
});

// Get user details
app.get('/api/users/:aadhar', async (req, res) => {
  const { aadhar } = req.params;
  console.log('Received request for user details with Aadhar:', aadhar);

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE aadhar = ?', [aadhar]);
    console.log('User query result:', rows);
    if (rows.length > 0) {
      return res.status(200).json(rows[0]);
    } else {
      console.log('User not found for Aadhar:', aadhar);
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ error: 'An error occurred while fetching user details' });
  }
});

// Get applications
app.get('/api/applications/:aadhar', async (req, res) => {
  const { aadhar } = req.params;
  console.log('Received request for applications with Aadhar:', aadhar);

  try {
    // Fetch community certificate applications
    const [communityRows] = await pool.execute(
      'SELECT "Community Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM community WHERE aadhar = ?',
      [aadhar]
    );
    console.log('Community applications result:', communityRows);

    // Fetch income certificate applications
    const [incomeRows] = await pool.execute(
      'SELECT "Income Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM income WHERE aadhar = ?',
      [aadhar]
    );
    console.log('Income applications result:', incomeRows);

    // Combine the results
    const applications = [...communityRows, ...incomeRows];

    if (applications.length > 0) {
      res.status(200).json(applications);
    } else {
      console.log('No applications found for Aadhar:', aadhar);
      res.status(404).json({ message: 'No applications found for this Aadhar number' });
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications' });
  }
});
// Improved file handling function
async function handleFileUpload(files, requiredFields) {
  const fileData = {};

  for (const field of requiredFields) {
    if (files[field] && files[field][0]) {
      fileData[field] = {
        buffer: files[field][0].buffer,
        originalname: files[field][0].originalname,
        mimetype: files[field][0].mimetype
      };
      console.log(`${field} received: ${files[field][0].originalname}`);
    } else {
      throw new Error(`${field} is required`);
    }
  }

  return fileData;
}

// Income certificate application
app.post('/api/income-certificate', upload.fields([
  { name: 'monthlySalaryCertificate', maxCount: 1 },
  { name: 'uploadRationCard', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), async (req, res) => {
  console.log('Received income certificate application:', req.body);

  const {
    aadhar,
    applicantName,
    fatherOrHusbandName,
    residentialAddress,
    rationCardNo,
    purpose,
    gender,
  } = req.body;

  if (!aadhar) {
    return res.status(400).json({ error: 'Aadhar number is required' });
  }

  try {
    const [userRows] = await pool.execute('SELECT taluk FROM users WHERE aadhar = ?', [aadhar]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const taluk = userRows[0].taluk;

    const requiredFields = ['monthlySalaryCertificate', 'uploadRationCard', 'signature'];
    const fileData = await handleFileUpload(req.files, requiredFields);

    const query = `
      INSERT INTO income 
      (aadhar, applicantName, fatherOrHusbandName, residentialAddress, rationCardNo, purpose, gender, monthlySalaryCertificate, uploadRationCard, signature, taluk, verificationStatus, applicationStatus) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `;
    const values = [
      aadhar,
      applicantName,
      fatherOrHusbandName,
      residentialAddress,
      rationCardNo,
      purpose,
      gender,
      fileData.monthlySalaryCertificate.buffer,
      fileData.uploadRationCard.buffer,
      fileData.signature.buffer,
      taluk,
    ];

    const [result] = await pool.execute(query, values);
    console.log('Income certificate application inserted into database:', result);

    // Execute Python script for verification
    try {
      const { stdout, stderr } = await execPromise(`python verification_income.py ${aadhar}`, {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
        },
      });

      if (stderr) {
        console.error(`Python Script Error: ${stderr}`);
        return res.status(500).json({ error: 'Error during document verification', details: stderr });
      }

      console.log(`Python Script Output: ${stdout}`);
    } catch (error) {
      console.error('Error executing Python script:', error);
      return res.status(500).json({ error: 'Error during document verification', details: error.message });
    }

    res.status(201).json({ message: 'Income certificate application submitted and verification process initiated' });
  } catch (error) {
    console.error('Error submitting income certificate application:', error);
    res.status(500).json({ error: 'An error occurred while submitting the application', details: error.message });
  }
});

// Community certificate application
app.post('/api/community-certificate', upload.fields([
  { name: 'rationCardFile', maxCount: 1 },
  { name: 'transferCertificateApplicant', maxCount: 1 },
  { name: 'communityCertificateParents', maxCount: 1 },
  { name: 'transferCertificateParents', maxCount: 1 },
  { name: 'applicantAadhar', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), async (req, res) => {
  console.log('Received community certificate application');
  console.log('Form data:', req.body);

  const {
    aadhar,
    applicantName,
    fatherOrHusbandName,
    residentialAddress,
    rationCard,
    gender,
  } = req.body;

  if (!aadhar) {
    return res.status(400).json({ error: 'Aadhar number is required' });
  }

  try {
    const [userRows] = await pool.execute('SELECT taluk FROM users WHERE aadhar = ?', [aadhar]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const taluk = userRows[0].taluk;

    const requiredFields = ['rationCardFile', 'transferCertificateApplicant', 'communityCertificateParents', 'transferCertificateParents', 'applicantAadhar', 'signature'];
    const fileData = await handleFileUpload(req.files, requiredFields);

    const query = `
      INSERT INTO community 
      (aadhar, applicantName, fatherOrHusbandName, residentialAddress, rationCard, gender, rationCardFile, transferCertificateApplicant, communityCertificateParents, transferCertificateParents, applicantAadhar, signature, taluk, verificationStatus, applicationStatus) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `;
    const values = [
      aadhar,
      applicantName,
      fatherOrHusbandName,
      residentialAddress,
      rationCard,
      gender,
      fileData.rationCardFile.buffer,
      fileData.transferCertificateApplicant.buffer,
      fileData.communityCertificateParents.buffer,
      fileData.transferCertificateParents.buffer,
      fileData.applicantAadhar.buffer,
      fileData.signature.buffer,
      taluk,
    ];

    const [result] = await pool.execute(query, values);
    console.log('Community certificate application inserted into database:', result);

    // Execute Python script for verification
    try {
      const { stdout, stderr } = await execPromise(`python verification_community.py ${aadhar}`, {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
        },
      });

      if (stderr) {
        console.error(`Python Script Error: ${stderr}`);
        return res.status(500).json({ error: 'Error during document verification', details: stderr });
      }

      console.log(`Python Script Output: ${stdout}`);
    } catch (error) {
      console.error('Error executing Python script:', error);
      return res.status(500).json({ error: 'Error during document verification', details: error.message });
    }

    res.status(201).json({ message: 'Community certificate application submitted and verification process initiated' });
  } catch (error) {
    console.error('Error submitting community certificate application:', error);
    res.status(500).json({ error: 'An error occurred while submitting the application', details: error.message });
  }
});
// Community certificate application
app.post('/api/community-certificate', upload.fields([
  { name: 'rationCardFile', maxCount: 1 },
  { name: 'transferCertificateApplicant', maxCount: 1 },
  { name: 'communityCertificateParents', maxCount: 1 },
  { name: 'transferCertificateParents', maxCount: 1 },
  { name: 'applicantAadhar', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), async (req, res) => {
  console.log('Received community certificate application');
  console.log('Form data:', req.body);

  const {
    aadhar,
    applicantName,
    fatherOrHusbandName,
    residentialAddress,
    rationCard,
    gender,
  } = req.body;

  if (!aadhar) {
    return res.status(400).json({ error: 'Aadhar number is required' });
  }

  try {
    const [userRows] = await pool.execute('SELECT taluk FROM users WHERE aadhar = ?', [aadhar]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const taluk = userRows[0].taluk;

    const requiredFields = ['rationCardFile', 'transferCertificateApplicant', 'communityCertificateParents', 'transferCertificateParents', 'applicantAadhar', 'signature'];
    const fileBuffers = {};

    for (const field of requiredFields) {
      if (req.files[field] && req.files[field][0]) {
        fileBuffers[field] = await getFileBuffer(req.files[field][0]);
      } else {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const query = `
      INSERT INTO community 
      (aadhar, applicantName, fatherOrHusbandName, residentialAddress, rationCard, gender, rationCardFile, transferCertificateApplicant, communityCertificateParents, transferCertificateParents, applicantAadhar, signature, taluk, verificationStatus, applicationStatus) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `;
    const values = [
      aadhar,
      applicantName,
      fatherOrHusbandName,
      residentialAddress,
      rationCard,
      gender,
      fileBuffers.rationCardFile,
      fileBuffers.transferCertificateApplicant,
      fileBuffers.communityCertificateParents,
      fileBuffers.transferCertificateParents,
      fileBuffers.applicantAadhar,
      fileBuffers.signature,
      taluk,
    ];

    const [result] = await pool.execute(query, values);
    console.log('Community certificate application inserted into database:', result);


    try {
      const { stdout, stderr } = await execPromise(`python verification_community.py ${aadhar}`, {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
        },
      });

      if (stderr) {
        console.error(`Python Script Error: ${stderr}`);
        return res.status(500).json({ error: 'Error during document verification', details: stderr });
      }

      console.log(`Python Script Output: ${stdout}`);
    } catch (error) {
      console.error('Error executing Python script:', error);
      return res.status(500).json({ error: 'Error during document verification', details: error.message });
    }

    res.status(201).json({ message: 'Community certificate application submitted and verification process initiated' });
  } catch (error) {
    console.error('Error submitting community certificate application:', error);
    res.status(500).json({ error: 'An error occurred while submitting the application', details: error.message });
  }
});
app.get('/api/applications/:aadhar', async (req, res) => {
  const { aadhar } = req.params;

  try {
    // Fetch community certificate applications
    const [communityRows] = await pool.execute(
      'SELECT "Community Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM community WHERE aadhar = ?',
      [aadhar]
    );

    // Fetch income certificate applications
    const [incomeRows] = await pool.execute(
      'SELECT "Income Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM income WHERE aadhar = ?',
      [aadhar]
    );

    // Combine the results
    const applications = [...communityRows, ...incomeRows];

    if (applications.length > 0) {
      res.status(200).json(applications);
    } else {
      res.status(404).json({ message: 'No applications found for this Aadhar number' });
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications', details: error.message });
  }
});
app.get('/api/download-certificate/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // First, determine which table to query based on the certificate type
    const [communityResult] = await pool.execute('SELECT generated_certificate FROM community WHERE aadhar = ?', [id]);
    const [incomeResult] = await pool.execute('SELECT generated_certificate FROM income WHERE aadhar = ?', [id]);
    
    let pdfBuffer;
    if (communityResult.length > 0) {
      pdfBuffer = communityResult[0].generated_certificate;
    } else if (incomeResult.length > 0) {
      pdfBuffer = incomeResult[0].generated_certificate;
    } else {
      return res.status(404).send('Certificate not found');
    }

    // Set the appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');

    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).send('An error occurred while downloading the certificate');
  }
});


app.get('/api/download-certificate/:applicationId', async (req, res) => {
  const { applicationId } = req.params;
  console.log(`Attempting to download certificate for applicationId: ${applicationId}`);

  try {
    // 2. Log the database query results
    const [communityResult] = await pool.execute('SELECT generated_certificate FROM community WHERE aadhar = ?', [applicationId]);
    const [incomeResult] = await pool.execute('SELECT generated_certificate FROM income WHERE aadhar = ?', [applicationId]);
    
    console.log('Community result:', communityResult);
    console.log('Income result:', incomeResult);

    let certificateData;
    let certificateType;

    if (communityResult.length > 0 && communityResult[0].generated_certificate) {
      certificateData = communityResult[0].generated_certificate;
      certificateType = 'Community';
    } else if (incomeResult.length > 0 && incomeResult[0].generated_certificate) {
      certificateData = incomeResult[0].generated_certificate;
      certificateType = 'Income';
    } else {
      console.log('No certificate found for applicationId:', applicationId);
      return res.status(404).json({ error: 'Certificate not found or not generated yet' });
    }

    // 3. Log certificate data details
    console.log('Certificate type:', certificateType);
    console.log('Certificate data type:', typeof certificateData);
    console.log('Certificate data length:', certificateData ? certificateData.length : 'N/A');

    // 4. Ensure certificateData is a Buffer
    if (!(certificateData instanceof Buffer)) {
      console.log('Converting certificateData to Buffer');
      certificateData = Buffer.from(certificateData);
    }

    // 5. Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${certificateType}_Certificate.pdf`);
    
    // 6. Send the response
    res.send(certificateData);
    console.log('Certificate sent successfully');

  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ 
      error: 'An error occurred while downloading the certificate',
      details: error.message 
    });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  app.get('/api/applications/:aadhar', async (req, res) => {
  const { aadhar } = req.params;

  try {
    // Fetch community certificate applications
    const [communityRows] = await pool.execute(
      'SELECT "Community Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM community WHERE aadhar = ?',
      [aadhar]
    );

    // Fetch income certificate applications
    const [incomeRows] = await pool.execute(
      'SELECT "Income Certificate" as certificateType, verificationStatus, applicationStatus, generated_certificate FROM income WHERE aadhar = ?',
      [aadhar]
    );

    // Combine the results
    const applications = [...communityRows, ...incomeRows];

    if (applications.length > 0) {
      res.status(200).json(applications);
    } else {
      res.status(404).json({ message: 'No applications found for this Aadhar number' });
    }
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications', details: error.message });
  }
});

  
});