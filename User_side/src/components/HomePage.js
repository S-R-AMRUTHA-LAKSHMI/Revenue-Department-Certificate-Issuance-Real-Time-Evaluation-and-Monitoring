import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const HomePage = () => {
  const { aadhar } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${aadhar}`);
      setUserDetails(response.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Error fetching user details');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/applications/${aadhar}`);
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchApplications();
  }, [aadhar]);

  const handleApplyClick = (certificateType) => {
    navigate(`/${aadhar}/certificates/${certificateType}`);
  };

  const handleDownloadCertificate = async (applicationId, certificateType) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/download-certificate/${applicationId}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificateType.replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Error downloading certificate. Please try again.');
    }
  };

  return (
    <div className="home-container">
      <h2>Welcome, {userDetails?.name || 'User'}!</h2>
      <p>We're glad to have you here. Please choose a certificate option below that you want to apply for.</p>

      <h3>Certificate Options</h3>
      <div className="certificate-options">
        <button className="certificate-button" onClick={() => handleApplyClick('community')}>
          Apply for Community Certificate
        </button>
        <button className="certificate-button" onClick={() => handleApplyClick('income')}>
          Apply for Income Certificate
        </button>
      </div>

      {applications.length > 0 && (
        <>
          <h3>Your Applications</h3>
          <table className="applications-table">
            <thead>
              <tr>
                <th>Certificate Type</th>
                <th>Verification Status</th>
                <th>Application Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={index}>
                  <td>{app.certificateType}</td>
                  <td>{app.verificationStatus}</td>
                  <td>{app.applicationStatus}</td>
                  <td>
                    {app.generated_certificate ? (
                      <button 
                        onClick={() => handleDownloadCertificate(aadhar, app.certificateType)}
                        className="download-button"
                      >
                        Download Certificate
                      </button>
                    ) : (
                      'Not Available'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
       
      <h3>User Details</h3>
      <div className="user-details">
        {userDetails && Object.entries(userDetails)
          .filter(([key, value]) => key !== 'id' && key !== 'created_at' && key !== 'password' && value)
          .map(([key, value]) => (
            <p key={key}><strong>{capitalizeFirstLetter(key)}:</strong> {value}</p>
          ))}
      </div>
    </div>
  );
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default HomePage; 