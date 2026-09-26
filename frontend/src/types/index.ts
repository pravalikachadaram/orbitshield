export interface SpaceObject {
  id: string;
  name: string;
  norad_id: string;
  object_type: string;
  orbit_type?: string;
  altitude_km?: number;
  apogee_km?: number;
  perigee_km?: number;
  inclination_deg?: number;
  eccentricity?: number;
  period_min?: number;
  tle_line1?: string;
  tle_line2?: string;
  tle_epoch?: string;
  source: string;
  risk_status: string;
  last_updated?: string;
  created_at?: string;
}

export interface ConjunctionAnalysisRequest {
  primary_object_id: string;
  secondary_object_id: string;
  analysis_window_hours: number;
}

export interface ConjunctionAnalysisResponse {
  conjunction_id: string;
  primary_object: SpaceObject;
  secondary_object: SpaceObject;
  closest_approach_km: number;
  relative_velocity_km_s: number;
  time_of_closest_approach: string;
  time_to_encounter_hours: number;
  analysis_window_hours: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  deterministic_explanation: string;
  ai_explanation?: string;
  recommendation: string;
  data_source: string;
  data_mode: 'live' | 'demo';
  data_quality: string;
  calculation_metadata?: {
    breakdown?: {
      distance_score: number;
      velocity_score: number;
      urgency_score: number;
    };
    ai_provider?: string;
    ai_status?: string;
    engine_version?: string;
    [key: string]: any;
  };
  created_at: string;
  alert_created: boolean;
  alert_id?: string;
}

export interface ConjunctionHistoryItem {
  id: string;
  conjunction_id: string;
  primary_object_name: string;
  primary_object_norad: string;
  secondary_object_name: string;
  secondary_object_norad: string;
  closest_approach_km: number;
  relative_velocity_km_s: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  time_of_closest_approach: string;
  data_mode: string;
  created_at: string;
}

export interface Alert {
  id: string;
  conjunction_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  status: 'ACTIVE' | 'REVIEWED' | 'DISMISSED';
  created_at: string;
  primary_object_name?: string;
  primary_object_norad?: string;
  secondary_object_name?: string;
  secondary_object_norad?: string;
  closest_approach_km?: number;
  risk_score?: number;
}

export interface ServiceStatus {
  name: string;
  status: 'Operational' | 'Degraded' | 'Unavailable';
  latency_ms?: number;
  details?: string;
}

export interface SystemStatusResponse {
  status: 'Operational' | 'Degraded' | 'Unavailable';
  timestamp: string;
  version: string;
  environment: string;
  data_mode: 'live' | 'demo';
  services: ServiceStatus[];
  tracked_objects_count: number;
  active_satellites_count: number;
  debris_count: number;
  critical_conjunctions_count: number;
}
