import axios from 'axios';
import {
  SpaceObject,
  ConjunctionAnalysisRequest,
  ConjunctionAnalysisResponse,
  ConjunctionHistoryItem,
  Alert,
  SystemStatusResponse,
  MonitoredSatellite,
  SatelliteRegisterRequest
} from '../types';

// If VITE_API_URL is explicitly set, use it. Otherwise, in browser production (non-localhost), use same-origin relative path, else default to http://localhost:8000 for local dev
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // Same-domain /api in production on Vercel
  }
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

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
  registerUser: async (email: string, password: string, fullName?: string) => {
    const res = await client.post('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },

  // Monitored Satellites
  getMonitoredSatellites: async (): Promise<MonitoredSatellite[]> => {
    const res = await client.get<MonitoredSatellite[]>('/monitored-satellites');
    return res.data;
  },
  registerMonitoredSatellite: async (data: SatelliteRegisterRequest): Promise<MonitoredSatellite> => {
    const res = await client.post<MonitoredSatellite>('/objects/register', data);
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
  createObject: async (data: SatelliteRegisterRequest): Promise<SpaceObject> => {
    const res = await client.post<SpaceObject>('/objects', data);
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
