import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  
}
);
console.log("API URL:", import.meta.env.VITE_API_URL);

export default API;
