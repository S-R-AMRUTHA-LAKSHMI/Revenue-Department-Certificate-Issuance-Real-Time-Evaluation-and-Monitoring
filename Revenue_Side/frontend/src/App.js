import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Modal from 'react-modal';
import Home from './components/Home';
import LocationPage from './components/LocationPage';
import CertificatePage from './components/CertificatePage';
import ApplicationDetailPage from './components/ApplicationDetailPage';
import Dashboard from './components/Dashboard';
import CertificateGenerated from './components/CertificateGenerated';

Modal.setAppElement('#root');

const App = () => {
  return (
    <Router>
      <div id="root">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/location/:location" element={<LocationPage />} />
          <Route path="/location/:location/:certificateType" element={<CertificatePage />} />
          <Route path="/application/:id/:certificate" element={<ApplicationDetailPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/certificate-generated/:filename" element={<CertificateGenerated />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
