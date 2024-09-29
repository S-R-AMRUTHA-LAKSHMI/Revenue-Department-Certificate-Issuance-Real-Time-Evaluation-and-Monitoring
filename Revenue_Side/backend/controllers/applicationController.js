const Application = require('../models/Application');
const { exec } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

exports.sendIncomeSMS = (req, res) => {
  execFile('someCommand', ['arg1', 'arg2'], (error, stdout, stderr) => {
    if (error) {
      console.error('Error sending income SMS:', error);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    console.log('SMS sent successfully:', stdout);
    res.json({ message: 'SMS sent successfully' });
  });
};

exports.sendCommunitySMS = async (req, res) => {
  try {
    const { applicationId } = req.body;
    await checkCommunityCertificateStatus(applicationId);
    res.status(200).json({ message: 'Community SMS sent successfully' });
  } catch (error) {
    console.error('Error sending community SMS:', error);
    res.status(500).json({ error: 'Failed to send community SMS' });
  }
};

exports.getLocations = (req, res) => {
  Application.getLocations((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getCertificates = (req, res) => {
  const taluk = req.params.taluk;
  Application.getCertificatesByLocation(taluk, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getApplicationCounts = (req, res) => {
  const { location, certificate } = req.params;
  Application.getApplicationCounts(location, certificate, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getApplications = (req, res) => {
  const { location, certificate } = req.params;
  Application.getApplications(location, certificate, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getApplicationDetails = (req, res) => {
  const id = req.params.id;
  const certificate = req.params.certificate;
  console.log('Received request for application id:', id, 'certificate:', certificate);
  Application.getApplicationDetails(id, certificate, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!results) {
      console.log('No application found for id:', id);
      return res.status(404).json({ error: 'Application not found' });
    }
    console.log('Sending application details:', results);
    res.json(results);
  });
};

exports.getPdf = (req, res) => {
  const { id, documentType, certificate } = req.params;
  console.log(`Fetching ${documentType} for application ${id} of type ${certificate}`);

  Application.getPdfById(id, documentType, certificate, (err, pdfBuffer) => {
    if (err) {
      console.error(`Error fetching PDF for application ${id}:`, err.message);
      return res.status(404).json({ error: 'PDF not found', details: err.message });
    }

    console.log(`PDF buffer received for application ${id}:`, pdfBuffer ? 'Buffer present' : 'Buffer absent');

    if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
      console.error(`Invalid PDF data for application ${id}:`, pdfBuffer);
      return res.status(500).json({ error: 'Invalid PDF data' });
    }

    console.log(`Sending PDF for application ${id} to client`);
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  });
};

exports.approveApplication = async (req, res) => {
  const id = req.params.id;
  const certificate = req.params.certificate;
  console.log(`Approving application: ID ${id}, Certificate type: ${certificate}`);
  try {
    await new Promise((resolve, reject) => {
      Application.approveApplication(id, certificate, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    console.log('Application approved in database. Generating certificate...');
    const scriptPath = path.join(__dirname, '..', 'generate.py');
    const pythonCommand = 'python'; 
    const command = `"${pythonCommand}" "${scriptPath}" ${id} ${certificate}`;
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
    }
    const certificateId = stdout.trim();
    console.log(`Certificate generated with ID: ${certificateId}`);
    res.json({ message: 'Application approved and certificate generated', certificateId });
  } catch (error) {
    console.error('Error in approveApplication:', error);
    res.status(500).json({ error: 'Failed to approve application or generate certificate', details: error.message });
  }
};

exports.rejectApplication = (req, res) => {
  const id = req.params.id;
  const certificate = req.params.certificate;
  Application.rejectApplication(id, certificate, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getOverallStatus = (req, res) => {
  Application.getOverallStatus((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getCertificateStatus = (req, res) => {
  Application.getCertificateStatus((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getTalukStatus = (req, res) => {
  Application.getTalukStatus((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.sendIncomeSMS =(req, res)=> {
  const scriptPath = path.join(__dirname, 'income_sms.js');
  execFile('node', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing income_sms.js:', error);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    console.log('income_sms.js output:', stdout);
    res.json({ message: 'Income rejection SMS sent successfully' });
  });
}

exports.sendCommunitySMS = (req, res) => {
  const scriptPath = path.join(__dirname, 'community_sms.js');
  execFile('node', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing community_sms.js:', error);
      return res.status(500).json({ error: 'Failed to send SMS' });
    }
    console.log('community_sms.js output:', stdout);
    res.json({ message: 'Community rejection SMS sent successfully' });
  });
}

exports.getCertificate = async (req, res) => {
  const { certificateId } = req.params;
  try {
    const isIncome = certificateId.startsWith('INC');
    const tableName = isIncome ? 'government_salary' : 'government_community';
    const idColumn = isIncome ? 'salary_id' : 'community_id';
    const pdfColumn = isIncome ? 'salary_pdf' : 'community_pdf';
    const query = `SELECT ${pdfColumn} FROM ${tableName} WHERE ${idColumn} = ?`;
    const [result] = await executeQuery(query, [certificateId]);
    if (!result) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    const pdfBuffer = result[pdfColumn];
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
};
