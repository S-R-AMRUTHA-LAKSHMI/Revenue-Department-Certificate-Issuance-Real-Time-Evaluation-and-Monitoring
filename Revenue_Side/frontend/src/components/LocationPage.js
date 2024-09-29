import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCertificates } from '../api';
import './LocationPage.css';

const LocationPage = () => {
  const [certificates, setCertificates] = useState([]);
  const { location } = useParams();

  useEffect(() => {
    const getCertificates = async () => {
      const data = await fetchCertificates(location);
      setCertificates(data);
    };
    getCertificates();
  }, [location]);

  return (
    <div className="location-container">
      <h1 className="location-title">Certificates for {location}</h1>
      <div className="certificate-box">
        <ul className="certificate-list">
          {certificates.map((cert) => (
            <li key={cert.certificate_type}>
              <Link to={`/location/${location}/${cert.certificate_type}`}>
                <button className='certificate-button'>{cert.certificate_type}</button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocationPage;
