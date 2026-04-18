import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../lib/api';
import type { JobResponse } from '../types/api';

function formatSalary(job: JobResponse) {
  if (job.salary_min === null && job.salary_max === null) {
    return 'Negotiable';
  }

  if (job.salary_min !== null && job.salary_max !== null) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  }

  return `$${(job.salary_min ?? job.salary_max ?? 0).toLocaleString()}`;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const result = await getJobs();
        setJobs(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat jobs.');
      } finally {
        setLoading(false);
      }
    };

    void loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    if (!query.trim()) {
      return jobs;
    }

    const keyword = query.toLowerCase();
    return jobs.filter((job) =>
      [job.title, job.company, job.location, job.description].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [jobs, query]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-bold text-slate-900">Internal Jobs</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari posisi, perusahaan, lokasi..."
          className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Memuat jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Tidak ada job yang cocok.</div>
        ) : (
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {job.company} • {job.location}
                  </p>
                </div>
                <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{formatSalary(job)}</span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{job.description}</p>
              <p className="mt-3 text-xs text-slate-400">Posted by {job.owner.name}</p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
