import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { createJob, deleteJob, getJobs, updateJob } from '../lib/api';
import type { JobCreatePayload, JobResponse, UserResponse } from '../types/api';

type EmployerDashboardProps = {
  user: UserResponse | null;
  token: string | null;
};

type JobFormState = {
  title: string;
  description: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
};

const EMPTY_FORM: JobFormState = {
  title: '',
  description: '',
  company: '',
  location: 'Remote',
  salaryMin: '',
  salaryMax: '',
};

function toJobPayload(form: JobFormState): JobCreatePayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    company: form.company.trim(),
    location: form.location.trim() || 'Remote',
    salary_min: form.salaryMin ? Number(form.salaryMin) : null,
    salary_max: form.salaryMax ? Number(form.salaryMax) : null,
  };
}

export default function EmployerDashboard({ user, token }: EmployerDashboardProps) {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const result = await getJobs();
      setJobs(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat jobs employer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const myJobs = useMemo(() => jobs.filter((job) => job.posted_by === user?.id), [jobs, user?.id]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingJobId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError('Token tidak ditemukan. Silakan login ulang.');
      return;
    }

    const payload = toJobPayload(form);
    const salaryMin = payload.salary_min ?? null;
    const salaryMax = payload.salary_max ?? null;
    if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
      setError('salary_min tidak boleh lebih besar dari salary_max.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingJobId) {
        await updateJob(token, editingJobId, payload);
        setSuccess('Job berhasil diupdate.');
      } else {
        await createJob(token, payload);
        setSuccess('Job berhasil dibuat.');
      }

      resetForm();
      await loadJobs();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Aksi gagal diproses.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!token) {
      setError('Token tidak ditemukan. Silakan login ulang.');
      return;
    }

    const confirmed = window.confirm('Hapus job ini?');
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deleteJob(token, jobId);
      setSuccess('Job berhasil dihapus.');
      await loadJobs();
      if (editingJobId === jobId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus job.');
    }
  };

  const startEdit = (job: JobResponse) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      salaryMin: job.salary_min?.toString() ?? '',
      salaryMax: job.salary_max?.toString() ?? '',
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employer Dashboard</h1>
            <p className="mt-2 text-slate-600">Kelola lowongan menggunakan endpoint <code>/jobs</code> (POST, PUT, DELETE).</p>
          </div>
          {user && (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 sm:text-right flex flex-col sm:items-end w-full sm:w-auto">
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
              <p className="text-sm font-medium text-primary mt-1">{user.email}</p>
              <p className="text-xs text-slate-500 mt-2">
                Member since {new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">{editingJobId ? 'Edit Job' : 'Post New Job'}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-slate-700">
                Company
              </label>
              <input
                id="company"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              required
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="salaryMin" className="mb-1 block text-sm font-medium text-slate-700">
                Salary Min
              </label>
              <input
                id="salaryMin"
                value={form.salaryMin}
                onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label htmlFor="salaryMax" className="mb-1 block text-sm font-medium text-slate-700">
                Salary Max
              </label>
              <input
                id="salaryMax"
                value={form.salaryMax}
                onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Memproses...' : editingJobId ? 'Update Job' : 'Post Job'}
            </button>
            {editingJobId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">My Active Jobs</h2>
        {loading ? (
          <p className="mt-3 text-slate-500">Memuat jobs...</p>
        ) : myJobs.length === 0 ? (
          <p className="mt-3 text-slate-500">Belum ada job aktif yang Anda posting.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {myJobs.map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                <p className="text-sm text-slate-600">
                  {job.company} • {job.location}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(job)}
                    className="rounded-md border border-indigo-300 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(job.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
