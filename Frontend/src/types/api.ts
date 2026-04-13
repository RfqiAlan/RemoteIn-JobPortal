export type UserRole = 'jobseeker' | 'employer';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JobResponse {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  posted_by: number;
  created_at: string;
  owner: UserResponse;
}

export interface JobCreatePayload {
  title: string;
  description: string;
  company: string;
  location?: string;
  salary_min?: number | null;
  salary_max?: number | null;
}

export interface JobUpdatePayload extends Partial<JobCreatePayload> {
  is_active?: boolean;
}

export interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  tags: string[];
  salary: string | null;
  url: string;
  source: string;
  published_at: string | null;
}

export interface AggregatedJobList {
  total: number;
  sources: string[];
  jobs: ExternalJob[];
}

export interface SyncRequestResponse {
  request_id: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  cooldown_seconds: number;
  next_available_at: string;
}

export interface SyncStatusResponse {
  request_id: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string | null;
  total_jobs_processed: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}
