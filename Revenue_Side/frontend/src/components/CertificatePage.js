import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchApplicationCounts, fetchApplications } from '../api';
import './CertificatePage.css';

const CertificatePage = () => {
  const [counts, setCounts] = useState({});
  const [applications, setApplications] = useState([]);
  const { location, certificateType } = useParams();

  useEffect(() => {
    const getData = async () => {
      const countsData = await fetchApplicationCounts(location, certificateType);
      setCounts(countsData[0] || {});
      const applicationsData = await fetchApplications(location, certificateType);
      setApplications(applicationsData);
    };
    getData();
  }, [location, certificateType]);
  let certificate=certificateType.toLowerCase();

  return (
    <div>
      <h1>{certificateType} Applications in {location}</h1>
      <div className="count-box">
        <h2>Application Counts:</h2>
        <ul className="count-list">
          <li>Total: {counts.total || 0}</li>
          <li>Approved: {counts.Approved || 0}</li>
          <li>Rejected: {counts.Rejected || 0}</li>
          <li>Pending: {counts.Pending || 0}</li>
        </ul>
      </div>
      <h2>Applications</h2>
      <div className="application-container">
      {applications.map((app) => (
        <div key={app.aadhar} className="application-box">
          <p>Aadhar Number: {app.aadhar}</p>
          <p>Name: {app.name}</p>
          <p>Status: {app.status}</p>
          <Link to={`/application/${app.aadhar}/${certificate}`}>
            <button className='view-button'>View</button>
          </Link>
        </div>
      ))}
    </div>
    </div>
  );
};

export default CertificatePage;
