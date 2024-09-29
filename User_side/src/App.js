import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApplicationPage from './components/ApplicationPage';
import Login from './components/Login';
import Signup from './components/Signup';
import HomePage from './components/HomePage';
import IncomeCertificate from './components/certificates/IncomeCertificate';
import CommunityCertificate from './components/certificates/CommunityCertificate';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ApplicationPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/:aadhar/home" element={<HomePage />} />
          <Route path="/:aadharNumber/certificates/income" element={<IncomeCertificate />} />
          <Route path="/:aadharNumber/certificates/community" element={<CommunityCertificate />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
