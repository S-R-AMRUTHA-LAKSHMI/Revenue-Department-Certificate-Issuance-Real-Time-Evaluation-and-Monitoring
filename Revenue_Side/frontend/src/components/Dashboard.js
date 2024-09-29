import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { fetchOverallStatus, fetchTalukStatus, fetchCertificateStatus } from '../api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const Dashboard = () => {
  const [overallStatus, setOverallStatus] = useState([]);
  const [talukStatus, setTalukStatus] = useState([]);
  const [certificateStatus, setCertificateStatus] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const overallData = await fetchOverallStatus();
        console.log('Overall Data:', overallData);
        setOverallStatus(overallData);
        const talukData = await fetchTalukStatus();
        console.log('Taluk Data:', talukData);
        setTalukStatus(talukData);
        const certificateData = await fetchCertificateStatus();
        console.log('Certificate Data:', certificateData);
        setCertificateStatus(certificateData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>Application Status Dashboard</h1>
      
      <div className="grid">
        <div className="chart-container">
          <h2>Overall Application Status</h2>
          {overallStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overallStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {overallStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No overall status data available</p>
          )}
        </div>

        <div className="chart-container">
          <h2>Taluk-wise Application Status</h2>
          {talukStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talukStatus}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accepted" fill="#0088FE" />
                <Bar dataKey="rejected" fill="#00C49F" />
                <Bar dataKey="pending" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No taluk-wise status data available</p>
          )}
        </div>

        <div className="chart-container">
          <h2>Certificate-wise Application Status</h2>
          {certificateStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={certificateStatus}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="accepted" fill="#0088FE" />
                <Bar dataKey="rejected" fill="#00C49F" />
                <Bar dataKey="pending" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No certificate-wise status data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
