import axios from 'axios';
import { toast } from 'sonner';

// Em produção (Docker/deploy), a VITE_API_URL aponta para a URL correta.
// Em dev local, o backend roda na 8000; no Docker na 8001.
const API_URL = import.meta.env.VITE_API_URL
  || `http://${window.location.hostname}:${window.location.hostname === 'localhost' ? '8000' : '8001'}`;

export const api = axios.create({
  baseURL: API_URL,
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