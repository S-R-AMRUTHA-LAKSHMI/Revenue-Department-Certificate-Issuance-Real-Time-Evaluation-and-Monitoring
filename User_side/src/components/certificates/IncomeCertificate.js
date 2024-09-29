import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './IncomeCertificate.css';

const IncomeCertificate = () => {
  const { aadharNumber } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    applicantName: '',
    fatherOrHusbandName: '',
    residentialAddress: '',
    rationCardNo: '',
    purpose: '',
    gender: '',
    monthlySalaryCertificate: null,
    uploadRationCard: null,
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

    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });
    formDataToSend.append('aadhar', aadharNumber);

    try {
      await axios.post('http://localhost:5000/api/income-certificate', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Income Certificate application submitted successfully!');
      navigate(`/${aadharNumber}/home`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  return (
    <div className="income-container">
  <h2 className="income-title">Income Certificate Application</h2>
  <form className="income-form" onSubmit={handleSubmit}>
    <label className="income-label" htmlFor="applicantName">Applicant Name</label>
    <input
      type="text"
      className="income-input"
      name="applicantName"
      value={formData.applicantName}
      onChange={handleChange}
      placeholder="Enter your name"
      required
    />
    
    <label className="income-label" htmlFor="fatherOrHusbandName">Father/Husband Name</label>
    <input
      type="text"
      className="income-input"
      name="fatherOrHusbandName"
      value={formData.fatherOrHusbandName}
      onChange={handleChange}
      placeholder="Enter father or husband name"
      required
    />
    
    <label className="income-label" htmlFor="residentialAddress">Residential Address</label>
    <textarea
      className="income-textarea"
      name="residentialAddress"
      value={formData.residentialAddress}
      onChange={handleChange}
      placeholder="Enter your residential address"
      required
    />
    
    <label className="income-label" htmlFor="rationCardNo">Ration Card Number</label>
    <input
      type="text"
      className="income-input"
      name="rationCardNo"
      value={formData.rationCardNo}
      onChange={handleChange}
      placeholder="Enter your ration card number"
      required
    />
    
    <label className="income-label" htmlFor="purpose">Purpose</label>
    <input
      type="text"
      className="income-input"
      name="purpose"
      value={formData.purpose}
      onChange={handleChange}
      placeholder="Enter purpose"
      required
    />
    
    <label className="income-label" htmlFor="gender">Gender</label>
    <select
      className="income-select"
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
    
    <label className="income-label" htmlFor="monthlySalaryCertificate">Upload Monthly Salary Certificate</label>
    <input
      type="file"
      className="income-file-input"
      name="monthlySalaryCertificate"
      onChange={handleFileChange}
      required
    />
    
    <label className="income-label" htmlFor="uploadRationCard">Upload Ration Card</label>
    <input
      type="file"
      className="income-file-input"
      name="uploadRationCard"
      onChange={handleFileChange}
      required
    />
    
    <label className="income-label" htmlFor="signature">Upload Signature</label>
    <input
      type="file"
      className="income-file-input"
      name="signature"
      onChange={handleFileChange}
      required
    />
    
    <button type="submit" className="income-submit-button">Submit Application</button>
  </form>
</div>

  );
};

export default IncomeCertificate;
