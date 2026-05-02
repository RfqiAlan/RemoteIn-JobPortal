import type {
  AggregatedJobList,
  ExternalJob,
  JobCreatePayload,
  JobResponse,
  JobUpdatePayload,
  LoginPayload,
  RegisterPayload,
  SyncRequestResponse,
  SyncStatusResponse,
  TokenResponse,
  UserResponse,
  ProfileResponse,
  ProfileCreatePayload,
  ApplicationResponse,
  ApplicationCreatePayload,
  SavedJobResponse,
  SavedJobCreatePayload,
} from '../types/api';

const API_PREFIX = import.meta.env.VITE_API_URL || '/api';

function parseApiError(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = payload.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') {
            return item.msg;
          }
          return null;
        })
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) {
        return messages.join(', ');
      }
    }
  }

  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers,
  });

  const textPayload = await response.text();
  let parsedPayload: unknown = null;

  if (textPayload) {
    try {
      parsedPayload = JSON.parse(textPayload);
    } catch {
      parsedPayload = textPayload;
    }
  }

  if (!response.ok) {
    throw new Error(parseApiError(parsedPayload, `Request gagal (${response.status})`));
  }

  return parsedPayload as T;
}

export async function register(payload: RegisterPayload): Promise<UserResponse> {
  return request<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  return request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string): Promise<UserResponse> {
  return request<UserResponse>('/auth/me', {}, token);
}

export async function getJobs(): Promise<JobResponse[]> {
  return request<JobResponse[]>('/jobs');
}

export async function getJob(jobId: number): Promise<JobResponse> {
  return request<JobResponse>(`/jobs/${jobId}`);
}

export async function createJob(token: string, payload: JobCreatePayload): Promise<JobResponse> {
  return request<JobResponse>(
    '/jobs',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateJob(token: string, jobId: number, payload: JobUpdatePayload): Promise<JobResponse> {
  return request<JobResponse>(
    `/jobs/${jobId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function deleteJob(token: string, jobId: number): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/jobs/${jobId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

type GetExternalJobsParams = {
  limit?: number;
  keyword?: string;
};

export async function getExternalJobs(params: GetExternalJobsParams = {}): Promise<AggregatedJobList> {
  const search = new URLSearchParams();

  if (params.limit) {
    search.set('limit', String(params.limit));
  }

  if (params.keyword?.trim()) {
    search.set('keyword', params.keyword.trim());
  }

  const query = search.toString();
  const endpoint = query ? `/external/aggregate?${query}` : '/external/aggregate';
  return request<AggregatedJobList>(endpoint);
}

export async function getExternalJob(jobId: string): Promise<ExternalJob> {
  return request<ExternalJob>(`/external/jobs/${jobId}`);
}

export async function getExternalJobByDbId(dbId: number): Promise<ExternalJob> {
  return request<ExternalJob>(`/external/jobs/db/${dbId}`);
}

export async function createExternalRefreshRequest(): Promise<SyncRequestResponse> {
  return request<SyncRequestResponse>(
    '/external/refresh-request',
    {
      method: 'POST',
    },
  );
}

export async function getExternalRefreshStatus(requestId: number): Promise<SyncStatusResponse> {
  return request<SyncStatusResponse>(`/external/refresh-status/${requestId}`);
}

export async function getMyProfile(token: string): Promise<ProfileResponse> {
  return request<ProfileResponse>('/profiles/me', {}, token);
}

export async function createProfile(token: string, payload: ProfileCreatePayload): Promise<ProfileResponse> {
  return request<ProfileResponse>('/profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function updateProfile(token: string, payload: ProfileCreatePayload): Promise<ProfileResponse> {
  return request<ProfileResponse>('/profiles/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, token);
}

export async function applyForJob(token: string, payload: ApplicationCreatePayload): Promise<ApplicationResponse> {
  return request<ApplicationResponse>('/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getMyApplications(token: string): Promise<ApplicationResponse[]> {
  return request<ApplicationResponse[]>('/applications/me', {}, token);
}

export async function saveJob(token: string, payload: SavedJobCreatePayload): Promise<SavedJobResponse> {
  return request<SavedJobResponse>('/saved-jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getSavedJobs(token: string): Promise<SavedJobResponse[]> {
  return request<SavedJobResponse[]>('/saved-jobs', {}, token);
}

export async function unsaveJob(token: string, savedJobId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/saved-jobs/${savedJobId}`, {
    method: 'DELETE',
  }, token);
}
