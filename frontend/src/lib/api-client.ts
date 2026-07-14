import axios from 'axios';
import { useToastStore } from '../store/useToastStore';

const apiClient = axios.create({
  // The base URL can be customized or rely on NEXT_PUBLIC env variables.
  // Using an interceptor rather than hardcoding baseURL will ensure compatibility
  // with however individual files are currently formulating their URLs.
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.response) {
      if (typeof error.response.data?.message === 'string') {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response.data?.message)) {
        errorMessage = error.response.data.message.join(', ');
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response.status === 401 || error.response.status === 403) {
        errorMessage = 'Authentication error. Please log in again.';
      } else {
        errorMessage = error.message;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // Trigger toast notification
    useToastStore.getState().showToast(errorMessage, 'error');
    
    return Promise.reject(error);
  }
);

export default apiClient;
