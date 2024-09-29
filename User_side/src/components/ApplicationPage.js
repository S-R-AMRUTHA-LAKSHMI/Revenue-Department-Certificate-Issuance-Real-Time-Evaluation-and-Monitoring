import React from 'react';
import { Link } from 'react-router-dom';
import './ApplicationPage.css';

const ApplicationPage = () => {
  return (
    <div className="application-container">
      <h1>Welcome to the Certificate Application Portal</h1>
      <p>Please choose an option to proceed:</p>
      <div className="options">
        <Link to="/signup" className="option-button">Sign Up</Link>
        <Link to="/login" className="option-button">Login</Link>
      </div>
    </div>
  );
};

export default ApplicationPage;
