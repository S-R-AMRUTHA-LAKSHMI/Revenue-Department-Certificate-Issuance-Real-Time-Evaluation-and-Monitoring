import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './CommunityCertificate.css';

const CommunityCertificate = () => {
  const { aadharNumber } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    applicantName: '',
    fatherOrHusbandName: '',
    residentialAddress: '',
    rationCard: '',
    gender: '',
    rationCardFile: null,
    transferCertificateApplicant: null,
    communityCertificateParents: null,
    transferCertificateParents: null,
    applicantAadhar: null,
    signature: null,
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${aadharNumber}`);
        setFormData(prevState => ({
          ...prevState,
          applicantName: response.data.name,
        }));
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [aadharNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    try {
      // Append non-file data
      for (const key of Object.keys(formData)) {
        if (!(formData[key] instanceof File)) {
          formDataToSend.append(key, formData[key]);
        }
      }

      // Append file data
      const fileFields = ['rationCardFile', 'transferCertificateApplicant', 'communityCertificateParents', 'transferCertificateParents', 'applicantAadhar', 'signature'];
      for (const field of fileFields) {
        if (formData[field]) {
          formDataToSend.append(field, formData[field]);
        }
      }

      formDataToSend.append('aadhar', aadharNumber);

      const response = await axios.post('http://localhost:5000/api/community-certificate', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      console.log('Server response:', response.data);
      alert('Community Certificate application submitted successfully!');
      navigate(`/${aadharNumber}/home`);
    } catch (error) {
      console.error('Error submitting form:', error.response ? error.response.data : error.message);
      alert('Error submitting form. Please try again.');
    }
  };



  return (
    <div className="community-container">
      <h2 className="community-heading">Community Certificate Application</h2>
      <form className="community-form" onSubmit={handleSubmit}>
        <label className='community-label' htmlFor="applicantName">Applicant Name</label>
        <input
          type="text"
          className="community-input"
          name="applicantName"
          value={formData.applicantName}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />
        
        <label className='community-label' htmlFor="fatherOrHusbandName">Father/Husband Name</label>
        <input
          type="text"
          className="community-input"
          name="fatherOrHusbandName"
          value={formData.fatherOrHusbandName}
          onChange={handleChange}
          placeholder="Enter father or husband name"
          required
        />
        
        <label className='community-label' htmlFor="residentialAddress">Residential Address</label>
        <textarea
          className="community-textarea"
          name="residentialAddress"
          value={formData.residentialAddress}
          onChange={handleChange}
          placeholder="Enter your residential address"
          required
        />
        
        <label className='community-label' htmlFor="rationCard">Ration Card Number</label>
        <input
          type="text"
          className="community-input"
          name="rationCard"
          value={formData.rationCard}
          onChange={handleChange}
          placeholder="Enter your ration card number"
          required
        />
        
        <label className='community-label' htmlFor="gender">Gender</label>
        <select
          className="community-select"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <label className='community-label' htmlFor="rationCardFile">Upload Ration Card File</label>
        <input
          type="file"
          className="community-file-input"
          name="rationCardFile"
          onChange={handleFileChange}
          required
        />
        
        <label className='community-label' htmlFor="transferCertificateApplicant">Upload Transfer Certificate (Applicant)</label>
        <input
          type="file"
          className="community-file-input"
          name="transferCertificateApplicant"
          onChange={handleFileChange}
          required
        />
        
        <label className='community-label' htmlFor="communityCertificateParents">Upload Community Certificate (Parents)</label>
        <input
          type="file"
          className="community-file-input"
          name="communityCertificateParents"
          onChange={handleFileChange}
          required
        />
        
        <label className='community-label' htmlFor="transferCertificateParents">Upload Transfer Certificate (Parents)</label>
        <input
          type="file"
          className="community-file-input"
          name="transferCertificateParents"
          onChange={handleFileChange}
          required
        />
        
        <label className='community-label' htmlFor="applicantAadhar">Upload Aadhar Card</label>
        <input
          type="file"
          className="community-file-input"
          name="applicantAadhar"
          onChange={handleFileChange}
          required
        />
        
        <label className='community-label' htmlFor="signature">Upload Signature</label>
        <input
          type="file"
          className="community-file-input"
          name="signature"
          onChange={handleFileChange}
          required
        />
        
        <button type="submit" className="community-submit-button">Submit Application</button>
      </form>
    </div>
  );
};

export default CommunityCertificate;
