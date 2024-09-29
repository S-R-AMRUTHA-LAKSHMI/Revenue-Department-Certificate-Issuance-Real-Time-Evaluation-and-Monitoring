import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApplicationDetails, approveApplication, rejectApplication } from '../api';
import Modal from 'react-modal';
import './ApplicationDetailPage.css';

const API_URL = 'http://localhost:5000/api';
const Alert = ({ variant, children }) => (
  <div className={`alert alert-${variant}`} role="alert">
    {children}
  </div>
);

const ApplicationDetailPage = () => {
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [currentPdfType, setCurrentPdfType] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const { id, certificate } = useParams();
  const [certificateId, setCertificateId] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getApplicationDetails = async () => {
      try {
        console.log('Fetching application details...');
        const data = await fetchApplicationDetails(id, certificate);
        console.log('Fetched application details:', data);
        setApplication(data);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Failed to fetch application details');
      }
    };
    getApplicationDetails();
  }, [id, certificate]);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    try {
      console.log(`Approving application: ID ${id}, Certificate type: ${certificate}`);
      const result = await approveApplication(id, certificate);
      console.log('Approval result:', result);
      if (result.certificateId) {
        setCertificateId(result.certificateId);
        setApplication({ ...application, applicationStatus: 'approved' });
        setSuccessMessage(`Application approved. Certificate generated with ID: ${result.certificateId}`);
      } else {
        throw new Error('No certificate ID returned from server');
      }
    } catch (err) {
      console.error('Error approving application:', err);
      setError(`Failed to approve application: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setError(null);
    try {
      console.log(`Rejecting application: ID ${id}, Certificate type: ${certificate}`);
      const result = await rejectApplication(id, certificate);
      console.log('Rejection result:', result);
      setApplication({ ...application, applicationStatus: 'rejected' });
      setSuccessMessage(`Application rejected successfully.SMS for ${certificate} is sent.`);
    } catch (err) {
      console.error('Error rejecting application:', err);
      setError(`Failed to reject application: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };
  
  const handleViewPdf = (documentType) => {
    setCurrentPdfType(documentType);
    setPdfError(null);
    setIsPdfModalOpen(true);
  };

  const handlePdfError = () => {
    console.error('Error loading PDF');
    setPdfError('Failed to load PDF. Please try again later.');
  };

  const PDFViewer = ({ id }) => {
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
      fetch(`/api/pdf/${id}`)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        })
        .catch(error => console.error('Error fetching PDF:', error));
    }, [id]);

    return (
      <div>
        {pdfUrl ? (
          <embed src={pdfUrl} type="application/pdf" width="100%" height="600px" />
        ) : (
          <p>Loading PDF...</p>
        )}
      </div>
    );
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (successMessage) return <Alert variant="success">{successMessage}</Alert>;
  if (!application) return <div>Loading...</div>;

  const renderApplicationDetails = () => {
    if (certificate.toLowerCase() === 'income') {
      return (
        <>
          <p>Aadhar: {application.aadhar}</p>
          <p>Name: {application.applicantName}</p>
          <p>Father/Husband Name: {application.fatherOrHusbandName}</p>
          <p>Address: {application.residentialAddress}</p>
          <p>Ration Card No: {application.rationCardNo}</p>
          <p>Purpose: {application.purpose}</p>
          <p>Gender: {application.gender}</p>
          <p>Monthly Salary Certificate: <button onClick={() => handleViewPdf('monthlySalaryCertificate')}>View PDF</button></p>
          <p>Ration Card: <button onClick={() => handleViewPdf('uploadRationCard')}>View PDF</button></p>
        </>
      );
    } else if (certificate.toLowerCase() === 'community') {
      return (
        <>
          <p>Aadhar: {application.aadhar}</p>
          <p>Name: {application.applicantName}</p>
          <p>Father/Husband Name: {application.fatherOrHusbandName}</p>
          <p>Address: {application.residentialAddress}</p>
          <p>Ration Card No: {application.rationCard}</p>
          <p>Gender: {application.gender}</p>
          <p>Ration Card: <button onClick={() => handleViewPdf('rationCard')}>View PDF</button></p>
          <p>Transfer Certificate (Applicant): <button onClick={() => handleViewPdf('transferCertificateApplicant')}>View PDF</button></p>
          <p>Transfer Certificate (Parents): <button onClick={() => handleViewPdf('transferCertificateParents')}>View PDF</button></p>
          <p>Community Certificate (Parents): <button onClick={() => handleViewPdf('communityCertificateParents')}>View PDF</button></p>
          <p>Applicant Aadhar: <button onClick={() => handleViewPdf('applicantAadhar')}>View PDF</button></p>
        </>
      );
    }
  };

  return (
    <div className="application-container1">
      <h1>Application Details</h1>
      <div className="application-details">
        {renderApplicationDetails()}
        <p>Verification Status: {application.verificationStatus}</p>
        <p>Application Status: {application.applicationStatus}</p>
        <p>Taluk: {application.taluk}</p>
        {certificateId && (
          <p>Generated Certificate ID: {certificateId}</p>
        )}
        {error && <p className="error">{error}</p>}
        <div className="button-container">
          <button 
            className="approve-button" 
            onClick={handleApprove} 
            disabled={isApproving || application.applicationStatus === 'approved'}
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
          <button 
            className="reject-button" 
            onClick={handleReject} 
            disabled={isRejecting || application.applicationStatus === 'approved' || application.applicationStatus === 'rejected'}
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isPdfModalOpen}
        onRequestClose={() => setIsPdfModalOpen(false)}
        contentLabel="PDF Viewer"
      >
        <h2>{currentPdfType ? currentPdfType.replace(/([A-Z])/g, ' $1').trim() : 'PDF Viewer'}</h2>
        {pdfError ? (
          <div>Error: {pdfError}</div>
        ) : (
          <iframe
            src={`${API_URL}/applications/${id}/${certificate}/pdf/${currentPdfType}`}
            width="100%"
            height="600px"
            title={currentPdfType || 'Document PDF'}
            onError={handlePdfError}
          />
        )}
        <button onClick={() => setIsPdfModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
};

export default ApplicationDetailPage;
