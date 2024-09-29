const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const applicationRoutes = require('./routes/applicationRoutes');
const db = require('./config/db');
const { exec } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use('/api', applicationRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Revenue Department API');
});

app.get('/api/overall-status', (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
      SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
      SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as Pending
    FROM (
      SELECT applicationStatus FROM income
      UNION ALL
      SELECT applicationStatus FROM community
    ) as combined
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results[0]);
    }
  });
});

app.get('/api/taluk-status', (req, res) => {
  const query = `
    SELECT 
      taluk,
      SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
      SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
      SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as Pending
    FROM (
      SELECT taluk, applicationStatus FROM income
      UNION ALL
      SELECT taluk, applicationStatus FROM community
    ) as combined
    GROUP BY taluk
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/certificate-status', (req, res) => {
  const query = `
    SELECT 
      'Income' as certificateType,
      SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
      SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
      SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as Pending
    FROM income
    UNION ALL
    SELECT 
      'Community' as certificateType,
      SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
      SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
      SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as Pending
    FROM community
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/pdf/:id', async (req, res) => {
  try {
    const pdfBuffer = await getPdfFromDatabase(req.params.id); // Assuming getPdfFromDatabase is defined elsewhere
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send('Error retrieving PDF');
  }
});

app.post('/api/generate-certificate/:aadhaarId', (req, res) => {
  const aadhaarId = req.params.aadhaarId;
  console.log(`Generating certificate for Aadhaar ID: ${aadhaarId}`);
  const scriptPath = path.join(__dirname, 'generate.py');
  const command = `python "${scriptPath}" ${aadhaarId}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return res.status(500).json({ message: `Failed to generate certificate: ${error.message}` });
    }
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    console.log(`Python script stdout: ${stdout}`);
    const match = stdout.match(/Generated certificate: (.*\.pdf)/);
    if (match) {
      const filename = match[1];
      console.log(`Certificate generated: ${filename}`);
      res.json({ filename });
    } else {
      console.error('Failed to extract filename from Python script output');
      res.status(500).json({ message: 'Failed to generate certificate: Unable to extract filename' });
    }
  });
});

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error(`Error sending file: ${err}`);
      res.status(500).json({ message: 'Failed to download certificate' });
    }
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
