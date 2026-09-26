import axios from 'axios';
import {
  SpaceObject,
  ConjunctionAnalysisRequest,
  ConjunctionAnalysisResponse,
  ConjunctionHistoryItem,
  Alert,
  SystemStatusResponse
} from '../types';

// Use environment variable VITE_API_URL or fallback smoothly to current host port 8001
const BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8001` : 'http://localhost:8001');

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token if stored
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbitshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password });
    return res.data;
  },

  // System
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },
  getSystemStatus: async (): Promise<SystemStatusResponse> => {
    const res = await client.get<SystemStatusResponse>('/system/status');
    return res.data;
  },

  // Objects
  getObjects: async (search?: string, objectType?: string): Promise<SpaceObject[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (objectType && objectType !== 'ALL') params.object_type = objectType;
    const res = await client.get<SpaceObject[]>('/objects', { params });
    return res.data;
  },
  getObjectByNorad: async (noradId: string): Promise<SpaceObject> => {
    const res = await client.get<SpaceObject>(`/objects/${noradId}`);
    return res.data;
  },
  getObjectTrajectory: async (noradId: string, hours = 2) => {
    const res = await client.get(`/objects/${noradId}/trajectory`, { params: { hours } });
    return res.data;
  },
  syncObjects: async () => {
    const res = await client.post('/objects/sync');
    return res.data;
  },

  // Conjunction
  analyzeConjunction: async (data: ConjunctionAnalysisRequest): Promise<ConjunctionAnalysisResponse> => {
    const res = await client.post<ConjunctionAnalysisResponse>('/conjunction/analyze', data);
    return res.data;
  },
  getConjunctionDetail: async (id: string): Promise<ConjunctionAnalysisResponse> => {
    const res = await client.get<ConjunctionAnalysisResponse>(`/conjunction/${id}`);
    return res.data;
  },

  // Alerts
  getAlerts: async (status?: string, severity?: string): Promise<Alert[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    if (severity && severity !== 'ALL') params.severity = severity;
    const res = await client.get<Alert[]>('/alerts', { params });
    return res.data;
  },
  reviewAlert: async (id: string) => {
    const res = await client.patch(`/alerts/${id}/review`);
    return res.data;
  },

  // History
  getHistory: async (limit = 50): Promise<ConjunctionHistoryItem[]> => {
    const res = await client.get<ConjunctionHistoryItem[]>('/history', { params: { limit } });
    return res.data;
  },

  // AI Direct
  getAIExplanation: async (payload: any) => {
    const res = await client.post('/ai/explain', payload);
    return res.data;
  }
};
