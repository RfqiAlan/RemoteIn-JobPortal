import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJob } from '../lib/api';
import type { JobResponse, UserResponse } from '../types/api';

type JobDetailProps = {
  user: UserResponse | null;
};

function formatSalary(job: JobResponse) {
  if (job.salary_min === null && job.salary_max === null) {
    return 'Negotiable';
  }

  if (job.salary_min !== null && job.salary_max !== null) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  }

  return `$${(job.salary_min ?? job.salary_max ?? 0).toLocaleString()}`;
}

export default function JobDetail({ user }: JobDetailProps) {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parsedId = Number(jobId);
    if (!jobId || Number.isNaN(parsedId)) {
      setError('ID job tidak valid.');
      setLoading(false);
      return;
    }

    const loadJob = async () => {
      try {
        const result = await getJob(parsedId);
        setJob(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail job.');
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [jobId]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Memuat detail job...</div>;
  }

  if (error || !job) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error ?? 'Job tidak ditemukan.'}</p>
        <Link to="/jobs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Kembali ke daftar jobs
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <header>
        <p className="text-sm text-slate-500">{job.company}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{job.title}</h1>
        <p className="mt-2 text-slate-600">
          {job.location} • Posted by {job.owner.name}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{formatSalary(job)}</span>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700">
          Created {new Date(job.created_at).toLocaleDateString('id-ID')}
        </span>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Deskripsi</h2>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{job.description}</p>
      </section>

      <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <Link to="/jobs" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
          Kembali
        </Link>
        {user?.role === 'employer' && user.id === job.posted_by && (
          <Link to="/dashboard" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Kelola di Dashboard
          </Link>
        )}
      </footer>
    </article>
  );
}
