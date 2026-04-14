import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getExternalJob } from '../lib/api';
import type { ExternalJob, UserResponse } from '../types/api';
import { ArrowLeft, ExternalLink, Briefcase, MapPin, Tag } from 'lucide-react';

type ExternalJobDetailProps = {
  user: UserResponse | null;
};

export default function ExternalJobDetail({ user }: ExternalJobDetailProps) {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<ExternalJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('ID external job tidak valid.');
      setLoading(false);
      return;
    }

    const loadJob = async () => {
      try {
        const result = await getExternalJob(jobId);
        setJob(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail job eksternal.');
      } finally {
        setLoading(false);
      }
    };

    void loadJob();
  }, [jobId]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Memuat detail job eksternal...</div>;
  }

  if (error || !job) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error ?? 'External Job tidak ditemukan.'}</p>
        <Link to="/remote-jobs" className="text-sm font-semibold text-primary hover:text-primary-hover">
          Kembali ke daftar external jobs
        </Link>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <Link to="/remote-jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Remote Jobs
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400 shrink-0">
               <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{job.company}</p>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">{job.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 font-medium">
                    {job.salary}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-primary-50 text-primary border border-primary-100 rounded-full px-3 py-1 text-xs uppercase font-bold tracking-wide">
                  Source: {job.source}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
            >
              Apply for this Job
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </header>

        <hr className="my-8 border-slate-100" />

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 font-heading">About this External Job</h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              This job was automatically synced from <strong>{job.source}</strong>. Because it is an aggregated remote job listing, the full lengthy description is not stored in our local database. Please click the <strong>"Apply for this Job"</strong> button above to view the complete job requirements, benefits, and submit your application at the original platform.
            </p>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" /> Categories / Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-md text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.published_at && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 inline-block">
              <p className="text-sm text-slate-500">
                Data recorded / published at: <span className="font-semibold text-slate-700">{new Date(job.published_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
