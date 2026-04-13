import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExternalJobs, getJobs } from '../lib/api';
import type { ExternalJob, JobResponse, UserResponse } from '../types/api';

type HomeProps = {
  user: UserResponse | null;
};

function renderSalary(job: JobResponse) {
  if (job.salary_min === null && job.salary_max === null) {
    return 'Negotiable';
  }

  if (job.salary_min !== null && job.salary_max !== null) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  }

  return `$${(job.salary_min ?? job.salary_max ?? 0).toLocaleString()}`;
}

export default function Home({ user }: HomeProps) {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [internal, external] = await Promise.all([getJobs(), getExternalJobs({ limit: 4 })]);
        setJobs(internal);
        setExternalJobs(external.jobs);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-900 px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">RemoteIn Job Portal</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Cari pekerjaan remote, atau rekrut talenta terbaik.</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          UI ini terhubung langsung ke endpoint backend: auth, jobs CRUD, dan agregasi external jobs.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/jobs" className="rounded-md bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400">
            Lihat Jobs Internal
          </Link>
          <Link to="/remote-jobs" className="rounded-md border border-slate-500 px-4 py-2 font-semibold text-slate-100 hover:bg-slate-800">
            Jelajahi External Jobs
          </Link>
          {user?.role === 'employer' && (
            <Link to="/dashboard" className="rounded-md border border-sky-400 px-4 py-2 font-semibold text-sky-300 hover:bg-slate-800">
              Buka Employer Dashboard
            </Link>
          )}
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Latest Internal Jobs</h2>
          <Link to="/jobs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Lihat semua
          </Link>
        </div>
        {loading ? (
          <p className="text-slate-500">Memuat jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-slate-500">Belum ada job aktif.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.slice(0, 6).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company} • {job.location}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{job.description}</p>
                <p className="mt-3 text-sm font-semibold text-emerald-700">{renderSalary(job)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Top External Jobs</h2>
          <Link to="/remote-jobs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Lihat halaman external
          </Link>
        </div>
        {loading ? (
          <p className="text-slate-500">Memuat jobs external...</p>
        ) : externalJobs.length === 0 ? (
          <p className="text-slate-500">Data external belum tersedia.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {externalJobs.map((job) => (
              <a
                key={job.id}
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">{job.source}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company} • {job.location}
                </p>
                <p className="mt-3 text-sm text-slate-500">{job.salary ?? 'Salary tidak disebutkan'}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
