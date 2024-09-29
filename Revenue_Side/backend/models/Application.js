const db = require('../config/db');

const Application = {
  getLocations: (callback) => {
    const query = 'SELECT DISTINCT taluk FROM (SELECT taluk FROM income UNION SELECT taluk FROM community) AS combined_taluks';
    db.query(query, callback);
  },

  getCertificatesByLocation: (taluk, callback) => {
    const query = `
      SELECT 
        CASE WHEN i.taluk IS NOT NULL THEN 'Income' ELSE NULL END AS income_cert,
        CASE WHEN c.taluk IS NOT NULL THEN 'Community' ELSE NULL END AS community_cert
      FROM 
        (SELECT '${taluk}' AS taluk) AS t
        LEFT JOIN income i ON t.taluk = i.taluk
        LEFT JOIN community c ON t.taluk = c.taluk
      LIMIT 1
    `;
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      const certificates = [];
      if (results[0].income_cert) certificates.push({ certificate_type: 'Income' });
      if (results[0].community_cert) certificates.push({ certificate_type: 'Community' });
      callback(null, certificates);
    });
  },

  getApplicationCounts: (taluk, certificate, callback) => {
    let table = certificate.toLowerCase();
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
        SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
        SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as Pending
      FROM ${table} 
      WHERE taluk = ?
    `;
    db.query(query, [taluk], callback);
  },

  getApplications: (taluk, certificate, callback) => {
    let table = certificate.toLowerCase();
    const query = `SELECT aadhar, applicantName as name, applicationStatus as status FROM ${table} WHERE taluk = ?`;
    db.query(query, [taluk], callback);
  },

  getApplicationDetails: (id, certificate, callback) => {
    let table = certificate.toLowerCase();
    const query = `SELECT * FROM ${table} WHERE aadhar = ?`;
    console.log('Executing query:', query, 'with id:', id);
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return callback(err, null);
      }
      console.log('Query results:', results);
      callback(null, results[0]);
    });
  },

  getPdfById: (id, documentType, certificate, callback) => {
    let table = certificate.toLowerCase();
    let column;
    if (table === 'income') {
      column = documentType === 'monthlySalaryCertificate' ? 'monthlySalaryCertificate' : 'uploadRationCard';
    } else if (table === 'community') {
      switch(documentType) {
        case 'applicantAadhar': column = 'applicantAadhar'; break;
        case 'rationCard': column = 'rationCardFile'; break;
        case 'transferCertificateApplicant': column = 'transferCertificateApplicant'; break;
        case 'transferCertificateParents': column = 'transferCertificateParents';break;
        case 'communityCertificateParents': column = 'communityCertificateParents'; break;
        default: return callback(new Error('Invalid document type'), null);
      }
    } else {
      return callback(new Error('Invalid certificate type'), null);
    }
    const query = `SELECT ${column} FROM ${table} WHERE aadhar = ?`;
    console.log(`Executing query for application ${id}:`, query);
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error(`Database error for application ${id}:`, err);
        return callback(err, null);
      }
      if (results.length === 0 || !results[0][column]) {
        console.error(`PDF not found in database for application ${id}`);
        return callback(new Error('PDF not found'), null);
      }
      console.log(`PDF found in database for application ${id}`);
      callback(null, results[0][column]);
    });
  },
  
  approveApplication: (id, certificate, callback) => {
    let table = certificate.toLowerCase();
    const query = `UPDATE ${table} SET applicationStatus = "approved" WHERE aadhar = ?`;
    db.query(query, [id], callback);
  },

  rejectApplication: (id, certificate, callback) => {
    let table = certificate.toLowerCase();
    const query = `UPDATE ${table} SET applicationStatus = "rejected" WHERE aadhar = ?`;
    db.query(query, [id], callback);
  },

  getOverallStatus: (callback) => {
    const query = `
      SELECT 
        SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as pending
      FROM (
        SELECT applicationStatus FROM income
        UNION ALL
        SELECT applicationStatus FROM community
      ) AS combined_status
    `;
    db.query(query, (err, results) => {
      if (err) return callback(err, null);
      const total = results[0].accepted + results[0].rejected + results[0].pending;
      const formattedResults = [
        { name: 'Accepted', value: results[0].accepted, percentage: (results[0].accepted / total) * 100 },
        { name: 'Rejected', value: results[0].rejected, percentage: (results[0].rejected / total) * 100 },
        { name: 'Pending', value: results[0].pending, percentage: (results[0].pending / total) * 100 },
      ];
      callback(null, formattedResults);
    });
  },

  getCertificateStatus: (callback) => {
    const query = `
      SELECT 
        'Income' as name,
        SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as pending
      FROM income
      UNION ALL
      SELECT 
        'Community' as name,
        SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as pending
      FROM community
    `;
    db.query(query, callback);
  },

  getTalukStatus: (callback) => {
    const query = `
      SELECT 
        taluk as name,
        SUM(CASE WHEN applicationStatus = 'approved' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN applicationStatus = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN applicationStatus = 'pending' THEN 1 ELSE 0 END) as pending
      FROM (
        SELECT taluk, applicationStatus FROM income
        UNION ALL
        SELECT taluk, applicationStatus FROM community
      ) AS combined_data
      GROUP BY taluk
    `;
    db.query(query, callback);
  }
};

module.exports = Application;
