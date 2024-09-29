const API_URL = 'http://localhost:5000/api';

export const fetchLocations = async () => {
  const response = await fetch(`${API_URL}/locations`);  // Corrected template literal
  return response.json();
};

export const fetchCertificates = async (taluk) => {
  const response = await fetch(`${API_URL}/certificates/${taluk}`);  // Corrected template literal
  return response.json();
};

export const fetchApplicationCounts = async (location, certificate) => {
  const response = await fetch(`${API_URL}/applications/${location}/${certificate}/counts`);  // Corrected template literal
  return response.json();
};

export const fetchApplications = async (location, certificate) => {
  const response = await fetch(`${API_URL}/applications/${location}/${certificate}`);  // Corrected template literal
  return response.json();
};

export const fetchApplicationDetails = async (id, certificate) => {
  console.log('Fetching application details for id:', id, 'certificate:', certificate);
  try {
    const url = `${API_URL}/application/${id}/${certificate}`;  // Corrected template literal
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);  // Corrected template literal for error message
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching application details:', error);
    throw error;
  }
};

export const approveApplication = async (id, certificate) => {
  try {
    const response = await fetch(`${API_URL}/applications/${id}/${certificate}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Approval response:', data);
    return data;
  } catch (error) {
    console.error('Error in approveApplication:', error);
    throw error;
  }
};

export const rejectApplication = async (id, certificate) => {
  const response = await fetch(`${API_URL}/applications/${id}/${certificate}/reject`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const sendIncomeSMS = async (applicationId) => {
  console.log(`Sending income SMS for application id: ${applicationId}`);
  try {
    const response = await fetch(`${API_URL}/send-income-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId }),
    });
    console.log('Income SMS response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    console.log('Income SMS response data:', data);
    return data;
  } catch (error) {
    console.error('Error in sendIncomeSMS:', error);
    throw error;
  }
};

export const sendCommunitySMS = async (applicationId) => {
  console.log(`Sending community SMS for application id: ${applicationId}`);
  try {
    const response = await fetch(`${API_URL}/send-community-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ applicationId }),
    });
    console.log('Community SMS response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    console.log('Community SMS response data:', data);
    return data;
  } catch (error) {
    console.error('Error in sendCommunitySMS:', error);
    throw error;
  }
};

export const fetchOverallStatus = async () => {
  const response = await fetch(`${API_URL}/overall-status`);  // Corrected template literal
  return response.json();
};

export const fetchTalukStatus = async () => {
  const response = await fetch(`${API_URL}/taluk-status`);  // Corrected template literal
  return response.json();
};

export const fetchCertificateStatus = async () => {
  const response = await fetch(`${API_URL}/certificate-status`);  // Corrected template literal
  return response.json();
};
