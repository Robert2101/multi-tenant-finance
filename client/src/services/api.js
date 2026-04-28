import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Matches your server log showing port 5001
  withCredentials: true,
});

export default api;
