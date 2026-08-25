import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusmind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized response error interception
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and redirect if not on login/register
      const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthPage) {
        localStorage.removeItem('campusmind_token');
        localStorage.removeItem('campusmind_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const chatAPI = {
  createSession: (data = {}) => api.post('/chat/sessions', data),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  sendMessage: (sessionId, content) => api.post(`/chat/sessions/${sessionId}/messages`, { content }),
  streamMessage: async (sessionId, content, { onSources, onToken, onDone, onError }) => {
    const token = localStorage.getItem('campusmind_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api';
    
    try {
      const response = await fetch(`${baseUrl}/chat/sessions/${sessionId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.strip?.() && !block.trim()) continue;
          const eventMatch = block.match(/^event:\s*(.+)$/m);
          const dataMatch = block.match(/^data:\s*(.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1].trim();
            const rawData = dataMatch[1].trim();

            try {
              const parsed = JSON.parse(rawData);
              if (eventType === 'sources' && onSources) {
                onSources(parsed);
              } else if (eventType === 'token' && onToken) {
                onToken(parsed.delta);
              } else if (eventType === 'done' && onDone) {
                onDone(parsed);
              } else if (eventType === 'error' && onError) {
                onError(parsed.error);
              }
            } catch (err) {
              console.error('SSE parse error:', err, rawData);
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err.message);
    }
  },
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
  submitFeedback: (data) => api.post('/chat/feedback', data),
};

export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
