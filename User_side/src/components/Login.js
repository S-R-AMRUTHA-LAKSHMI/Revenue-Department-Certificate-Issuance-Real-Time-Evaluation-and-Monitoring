import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './Login.css';

import user from './images/user.jpg';
import password from './images/password.jpg';

const Login = () => {
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post('http://localhost:5000/api/login', { userName, userPassword });
      if (result.data.status === "Success") {
        const aadharNumber = result.data.aadharNumber; 
        alert(`User Login Successful!`);
        console.log(`Navigating to /${aadharNumber}/home`); 
        navigate(`/${aadharNumber}/home`);
      } else {
        alert(result.data);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('An error occurred while logging in. Please try again.');
    }
};

  const handleRecovery = () => {
    alert('Reach Us 📩 contactus@gmail.com');
  };

  return (
    <div className='container'>
      <div className='login-container'>
        <div className='form'>
          <div className='header'>
            <div className='text'><h3><b>LOGIN</b></h3></div>
            <p><b>Login to continue!!</b></p>
          </div>
          <br />
          <form onSubmit={handleLogin}>
            <div className='inputs'>
              <div className='input'>
                <input
                  type="text"
                  placeholder='UserName'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ backgroundImage: `url(${user})`, backgroundSize: '20px 20px', backgroundPosition: 'left center', backgroundRepeat: 'no-repeat', paddingLeft: '30px', height: '25px' }}
                />
              </div>
              <br />
              <div className='input'>
                <input
                  type="password"
                  placeholder='Password'
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  style={{ backgroundImage: `url(${password})`, backgroundSize: '20px 20px', backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', paddingLeft: '30px', height: '25px' }}
                />
              </div>
            </div>
            <br />
            <div className='forgotpassword'>
              <b>Forgot Password? <span onClick={handleRecovery}>Click Here!</span></b>
            </div>
            <br />
            <div className='remember-me'>
              <label htmlFor="remember"><b>Remember me</b></label>
              <input type="checkbox" id="remember" />
            </div>
            <div className='submits'>
              <div className='submit'>
                <button type="submit"><b>Login</b></button>
              </div>
            </div>
          </form>
          <br />
          <div className='signup-text'>
            <p><b>Don't have an account?</b><br /><br />
              <Link to="/signup" className="signup-button"><b>Sign Up</b></Link>
            </p>
          </div>
        </div>
        <br />
        <div>
          <Link to="/" className="signup-button" align="center">Back to home👈</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
