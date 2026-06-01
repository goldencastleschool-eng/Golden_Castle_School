import axios from 'axios';

const API = axios.create({
  baseURL: 'https://golden-castle-school-api.onrender.com/api',
  withCredentials: true,
  
}
);

export default API;
