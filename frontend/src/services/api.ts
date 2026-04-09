import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: `http://${window.location.hostname}:8001`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição: Injeta o token se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Resposta: Trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Sessão expirada. Faça login novamente.');
      // Dispara um evento para o AuthContext capturar e deslogar
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);