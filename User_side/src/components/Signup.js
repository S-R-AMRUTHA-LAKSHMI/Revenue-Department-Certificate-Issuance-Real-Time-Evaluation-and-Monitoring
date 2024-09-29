import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';

import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    mobile: '',
    email: '',
    aadharNumber: '',
    talukName: '',
  });

  const navigate = useNavigate(); 
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userPassword = formData.password;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&])[A-Za-z\d!@#$%^&]{6,}$/;

    if (!passwordRegex.test(userPassword)) {
      alert("Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and be at least 6 characters long.");
      return;
    }

    try {
      const response = await signup(formData);
      console.log(response.data);
      navigate('/login'); 
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <div className="signup-container">
      <h2 className="signup-title">Sign Up</h2>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="signup-field">
          <label htmlFor="name" className="signup-label">Name: </label>
          <input type="text" className="signup-input" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
        </div>
        <div className="signup-field">
          <label htmlFor="username" className="signup-label">Username: </label>
          <input type="text" className="signup-input" name="username" value={formData.username} onChange={handleChange} placeholder="Enter your username" required />
        </div>
        <div className="signup-field">
          <label htmlFor="password" className="signup-label">Password: </label>
          <input type="password" className="signup-input" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
        </div>
        <div className="signup-field">
          <label htmlFor="mobile" className="signup-label">Mobile: </label>
          <input type="tel" className="signup-input" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter your mobile number" required />
        </div>
        <div className="signup-field">
          <label htmlFor="email" className="signup-label">Email (optional): </label>
          <input type="email" className="signup-input" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" />
        </div>
        <div className="signup-field">
          <label htmlFor="aadharNumber" className="signup-label">Aadhar Number: </label>
          <input type="text" className="signup-input" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} placeholder="Enter your Aadhar number" required />
        </div>
        <div className="signup-field">
          <label htmlFor="talukName" className="signup-label">Taluk Name: </label>
          <input type="text" className="signup-input" name="talukName" value={formData.talukName} onChange={handleChange} placeholder="Enter your taluk name" required />
        </div>
        <button className="signup-button" type="submit">Sign Up</button>

        <br />
        <div className="login-text">
          <p><b>Already have an account?</b> <br />
            <button className="login-button"><Link to="/login" className="login-link"><b>Login</b></Link></button>
          </p>
        </div>
      <div>
          <Link to="/" className="signup-button" align="center">Back to home👈</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
