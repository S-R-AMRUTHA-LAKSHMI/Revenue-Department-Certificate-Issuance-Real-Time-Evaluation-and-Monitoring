import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getUserDetails = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/user-details`, {
      params: { userId },
      headers: {
        
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};
