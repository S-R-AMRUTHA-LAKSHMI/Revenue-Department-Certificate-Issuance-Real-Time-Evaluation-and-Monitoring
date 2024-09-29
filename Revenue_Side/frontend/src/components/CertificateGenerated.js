import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const CertificateGenerated = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const { certificateId } = useParams();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`${API_URL}/certificate/${certificateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch certificate');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate. Please try again later.');
      }
    };
    fetchCertificate();
  }, [certificateId]);

  if (error) {
    return <div className="error">{error}</div>;
  }
  if (!pdfUrl) {
    return <div>Loading certificate...</div>;
  }
  return (
    <div className="certificate-container">
      <h1>Generated Certificate</h1>
      <iframe src={pdfUrl} width="100%" height="600px" title="Generated Certificate" />
    </div>
  );
};

export default CertificateGenerated;
