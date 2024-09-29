import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLocations } from '../api';
import './Home.css';

const Home = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const getLocations = async () => {
      try {
        const data = await fetchLocations();
        setLocations(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    getLocations();
  }, []);

  return (
    <div className="home-container">
      <h1 className="home-title">Select a Taluk</h1>
      <div className="location-box">
        <ul className="location-list">
          {locations.map((loc) => (
            <li key={loc.taluk}>
              <Link to={`/location/${loc.taluk}`}>
                <button className="location-button">{loc.taluk}</button>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="home-container">
        <h1 className="home-title">Application Status</h1>
        <div className="location-box">
          <Link to="/dashboard">
            <button className="dashboard-button">View Dashboard</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
