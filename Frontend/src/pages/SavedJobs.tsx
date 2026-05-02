import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, Building, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { getSavedJobs, getJob, getExternalJobByDbId, unsaveJob } from '../lib/api';
import type { UserResponse, SavedJobResponse } from '../types/api';

type SavedJobWithDetails = SavedJobResponse & {
  title?: string;
  company?: string;
  location?: string;
  isExternal?: boolean;
  externalLink?: string;
  externalIdStr?: string;
};

export default function SavedJobs({ token }: { user: UserResponse; token: string | null }) {
  const [savedJobs, setSavedJobs] = useState<SavedJobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSavedJobs = async () => {
    if (!token) return;
    try {
      const data = await getSavedJobs(token);
      
      const enrichedData = await Promise.all(
        data.map(async (save) => {
          try {
            if (save.job_id) {
              const jobData = await getJob(save.job_id);
              return { 
                ...save, 
                title: jobData.title, 
                company: jobData.company, 
                location: jobData.location,
                isExternal: false
              };
            } else if (save.external_job_id) {
              const extData = await getExternalJobByDbId(save.external_job_id);
              return {
                ...save,
                title: extData.title,
                company: extData.company,
                location: extData.location,
                isExternal: true,
                externalLink: extData.url,
                externalIdStr: extData.id
              };
            }
            return save;
          } catch {
            return { ...save, title: 'Unknown Job', company: 'Unknown Company', location: 'Unknown' };
          }
        })
      );
      
      setSavedJobs(enrichedData.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [token]);

  const handleUnsave = async (id: number) => {
    if (!token) return;
    try {
      await unsaveJob(token, id);
      setSavedJobs(prev => prev.filter(job => job.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove saved job');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-slate-500">Loading saved jobs...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Saved Jobs</h1>
        <p className="text-slate-500 mt-2">Jobs you've bookmarked to apply for later.</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">{error}</div>}

      {savedJobs.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
            <Bookmark className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No saved jobs</h3>
          <p className="mt-2 text-slate-500">You haven't bookmarked any jobs yet.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/jobs" className="rounded-xl border border-primary bg-white px-6 py-2.5 font-semibold text-primary hover:bg-primary-50 transition-colors">
              Find Internal Jobs
            </Link>
            <Link to="/remote-jobs" className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm">
              Explore External Jobs
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map((job) => (
            <div key={job.id} className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-xl font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {job.company?.charAt(0).toUpperCase() || 'J'}
                  </div>
                  <button 
                    onClick={() => handleUnsave(job.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-1">
                  {job.isExternal ? (
                     <a href={job.externalLink} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
                       {job.title} <ExternalLink className="h-4 w-4 text-slate-400" />
                     </a>
                  ) : (
                    <Link to={`/jobs/${job.job_id}`} className="hover:text-primary transition-colors">
                      {job.title}
                    </Link>
                  )}
                </h3>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-4 pt-4 border-t border-slate-100">
                    <Calendar className="h-3.5 w-3.5" />
                    Saved on {new Date(job.saved_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4">
                {job.isExternal ? (
                  <Link 
                    to={`/remote-jobs/${job.externalIdStr}`} 
                    className="block w-full rounded-xl bg-slate-900 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-md"
                  >
                    View Details
                  </Link>
                ) : (
                  <Link 
                    to={`/jobs/${job.job_id}`} 
                    className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-primary-hover hover:shadow-md"
                  >
                    View & Apply
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
