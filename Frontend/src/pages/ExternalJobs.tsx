import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Calendar, ExternalLink, Search } from 'lucide-react';
import { createExternalRefreshRequest, getExternalJobs, getExternalRefreshStatus } from '../lib/api';
import type { AggregatedJobList, SyncStatusResponse, UserResponse } from '../types/api';

const SOURCE_BADGE: Record<string, string> = {
  remotive: 'bg-blue-100 text-blue-700',
  arbeitnow: 'bg-emerald-100 text-emerald-700',
  jobicy: 'bg-purple-100 text-purple-700',
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('id-ID');
}

type ExternalJobsProps = {
  user: UserResponse | null;
  token: string | null;
};

const POLLING_INTERVAL_MS = 2000;

export default function ExternalJobs({ user, token }: ExternalJobsProps) {
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<AggregatedJobList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<SyncStatusResponse | null>(null);
  const [refreshRequestId, setRefreshRequestId] = useState<number | null>(null);

  const loadJobs = useCallback(async (nextKeyword: string, nextLimit: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getExternalJobs({
        keyword: nextKeyword,
        limit: nextLimit,
      });
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal mengambil external jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs('', 10);
  }, [loadJobs]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadJobs(keyword, limit);
  };

  const handleRefreshRequest = async () => {
    if (!token) {
      setError('Silakan login sebagai jobseeker untuk melakukan refresh.');
      return;
    }

    setRefreshLoading(true);
    setError(null);

    try {
      const request = await createExternalRefreshRequest(token);
      setRefreshRequestId(request.request_id);
      setRefreshStatus({
        request_id: request.request_id,
        status: request.status,
        message: request.message,
        total_jobs_processed: 0,
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal membuat request refresh.');
    } finally {
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    if (!token || refreshRequestId === null) {
      return;
    }

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollStatus = async () => {
      try {
        const statusResult = await getExternalRefreshStatus(token, refreshRequestId);
        if (isCancelled) {
          return;
        }

        setRefreshStatus(statusResult);

        if (statusResult.status === 'pending' || statusResult.status === 'running') {
          timeoutId = setTimeout(() => {
            void pollStatus();
          }, POLLING_INTERVAL_MS);
          return;
        }

        if (statusResult.status === 'success') {
          void loadJobs(keyword, limit);
        }
      } catch (statusError) {
        if (!isCancelled) {
          setError(statusError instanceof Error ? statusError.message : 'Gagal memeriksa status refresh.');
        }
      }
    };

    void pollStatus();

    return () => {
      isCancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [keyword, limit, loadJobs, refreshRequestId, token]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">External Remote Jobs</h1>
        <p className="mt-2 text-slate-600">Endpoint: <code>/external/aggregate</code> dengan filter keyword + limit.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Refresh data dari source eksternal</p>
            <p className="text-sm text-slate-600">
              Hanya role <span className="font-semibold">jobseeker</span> yang bisa kirim request refresh (cooldown 10 menit).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefreshRequest()}
            disabled={refreshLoading || !user || user.role !== 'jobseeker'}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshLoading ? 'Mengirim request...' : 'Refresh Data'}
          </button>
        </div>

        {!user && <p className="mt-3 text-sm text-amber-700">Login dulu untuk menggunakan tombol refresh.</p>}
        {user && user.role !== 'jobseeker' && (
          <p className="mt-3 text-sm text-amber-700">Role kamu bukan jobseeker, jadi tombol refresh dinonaktifkan.</p>
        )}

        {refreshStatus && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-900">Status: {refreshStatus.status}</p>
            {refreshStatus.message && <p className="mt-1 text-slate-600">{refreshStatus.message}</p>}
            {refreshStatus.finished_at && (
              <p className="mt-1 text-slate-500">
                Selesai: {new Date(refreshStatus.finished_at).toLocaleString('id-ID')} ({refreshStatus.total_jobs_processed} job diproses)
              </p>
            )}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              type="text"
              placeholder="Cari keyword, contoh: react"
              className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value={5}>5 per sumber</option>
            <option value={10}>10 per sumber</option>
            <option value={20}>20 per sumber</option>
            <option value={30}>30 per sumber</option>
          </select>
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Terapkan Filter
          </button>
        </div>
      </form>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        {loading ? (
          <p className="text-slate-500">Memuat external jobs...</p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{data?.total ?? 0}</span> jobs dari{' '}
              <span className="font-semibold text-slate-900">{data?.sources.length ?? 0}</span> sumber.
            </p>

            {data?.jobs.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.jobs.map((job) => (
                  <article key={job.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${SOURCE_BADGE[job.source] ?? 'bg-slate-100 text-slate-700'}`}>
                        {job.source}
                      </span>
                      {formatDate(job.published_at) && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.published_at)}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-lg font-semibold text-slate-900">{job.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {job.company} • {job.location}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{job.salary ?? 'Salary tidak disebutkan'}</p>

                    {job.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.tags.slice(0, 4).map((tag) => (
                          <span key={`${job.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Apply now <ExternalLink className="h-4 w-4" />
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Tidak ada job yang cocok dengan filter saat ini.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
