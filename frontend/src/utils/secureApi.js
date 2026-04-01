import axios from 'axios';
import { buildSecurePayload } from './security';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Requête POST sécurisée avec fingerprint + token rotatif
 */
export const securePost = async (endpoint, data) => {
  const securePayload = buildSecurePayload(data);
  
  try {
    const response = await axios.post(`${API}${endpoint}`, securePayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('🔒 Security validation failed');
      throw new Error('Security validation failed. Please refresh the page.');
    }
    throw error;
  }
};

/**
 * Requête GET sécurisée (avec headers de sécurité)
 */
export const secureGet = async (endpoint) => {
  const { getSecurityToken, getSecurityCookie } = await import('./security');
  const { token } = getSecurityToken();
  const cookie = getSecurityCookie();
  const fp = sessionStorage.getItem('_fp') || '';
  
  try {
    const response = await axios.get(`${API}${endpoint}`, {
      headers: {
        'X-Security-Token': token,
        'X-Fingerprint': fp,
        'X-Security-Cookie': cookie
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      console.error('🔒 Security validation failed');
      throw new Error('Security validation failed. Please refresh the page.');
    }
    throw error;
  }
};

export default {
  post: securePost,
  get: secureGet
};
