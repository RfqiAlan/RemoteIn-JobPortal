import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Send, Briefcase, MapPin, Building, Calendar, X } from 'lucide-react';
import { getJob, applyForJob, saveJob } from '../lib/api';
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
  const token = localStorage.getItem('remotein_access_token');

  // Modal & Actions State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    const parsedId = Number(jobId);
    if (!jobId || Number.isNaN(parsedId)) {
      setError('Invalid Job ID.');
      setLoading(false);
      return;
    }

    const loadJob = async () => {
      try {
        const result = await getJob(parsedId);
        setJob(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [jobId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !job) return;
    
    setIsApplying(true);
    setApplyError('');
    
    try {
      await applyForJob(token, {
        job_id: job.id,
        cover_letter: coverLetter.trim() || null
      });
      setApplySuccess('Successfully applied for this job!');
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess('');
        setCoverLetter('');
      }, 2000);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to apply. You might have applied already.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!token || !job) return;
    setIsSaving(true);
    setSaveSuccess('');
    try {
      await saveJob(token, { job_id: job.id });
      setSaveSuccess('Job saved!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save job. It might already be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Memuat detail job...</div>;
  }

  if (error || !job) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error ?? 'Job tidak ditemukan.'}</p>
        <Link to="/jobs" className="text-sm font-semibold text-primary hover:text-primary-hover">
          Kembali ke daftar jobs
        </Link>
      </div>
    );
  }

  return (
    <>
      <article className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-6">
            <div className="hidden md:flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-3xl font-bold text-primary shadow-sm border border-primary/10">
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                <Building className="h-4 w-4" /> {job.company}
              </p>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {job.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-slate-400" /> Full-time</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> Posted {new Date(job.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0 sm:w-auto w-full">
            {user?.role === 'jobseeker' ? (
               <>
                  <button 
                    onClick={() => setIsApplyModalOpen(true)}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-md hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg transition-all focus:ring-4 focus:ring-primary/20"
                  >
                    <Send className="h-4 w-4" /> Apply Now
                  </button>
                  <button 
                    onClick={handleSaveJob}
                    disabled={isSaving}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
                  >
                    <Bookmark className={`h-4 w-4 ${saveSuccess ? 'fill-primary text-primary' : ''}`} /> 
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Job'}
                  </button>
               </>
            ) : !user ? (
               <Link to="/login" className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-md hover:bg-primary-hover transition-all">
                 Login to Apply
               </Link>
            ) : null}
          </div>
        </header>

        <div className="flex flex-wrap gap-3 py-6 border-y border-slate-100">
          <span className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 border border-emerald-100">{formatSalary(job)}</span>
          <span className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 border border-indigo-100">Remote Available</span>
        </div>

        <section className="prose prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Job Description</h2>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{job.description}</p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">About the Employer</h2>
          <div className="mt-5 flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700 shadow-inner">
              {job.owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">{job.owner.name}</p>
              <p className="text-sm text-slate-600 mt-1">
                Contact:{' '}
                <a href={`mailto:${job.owner.email}`} className="text-primary hover:text-primary-hover font-semibold transition-colors">
                  {job.owner.email}
                </a>
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center gap-3 pt-6 mt-8">
          <Link to="/jobs" className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            ← Back to Jobs
          </Link>
          {user?.role === 'employer' && user.id === job.posted_by && (
            <Link to="/dashboard" className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm">
              Manage in Dashboard
            </Link>
          )}
        </footer>
      </article>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setIsApplyModalOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Apply for {job.title}</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {applySuccess ? (
                <div className="py-8 text-center animate-in fade-in">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                    <Send className="h-8 w-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Application Sent!</h4>
                  <p className="mt-2 text-slate-500">Good luck! You can track this in your applications page.</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-5">
                  {applyError && <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-sm">{applyError}</div>}
                  
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-sm text-slate-600 mb-1">Applying as</p>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      {user?.name} <span className="text-sm font-normal text-slate-500">({user?.email})</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Letter (Optional)</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={5}
                      placeholder="Why are you a great fit for this role?"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsApplyModalOpen(false)}
                      className="rounded-xl px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-white hover:bg-primary-hover shadow-md transition-all disabled:opacity-50"
                    >
                      {isApplying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
