import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { getMyApplications, getJob } from '../lib/api';
import type { UserResponse, ApplicationResponse } from '../types/api';

type ApplicationWithJob = ApplicationResponse & {
  jobTitle?: string;
  company?: string;
};

export default function MyApplications({ token }: { user: UserResponse; token: string | null }) {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchApps = async () => {
      try {
        const apps = await getMyApplications(token);
        
        // Fetch job details for each application to show title and company
        const appsWithJobs = await Promise.all(
          apps.map(async (app) => {
            try {
              const jobData = await getJob(app.job_id);
              return { ...app, jobTitle: jobData.title, company: jobData.company };
            } catch {
              return { ...app, jobTitle: 'Unknown Job', company: 'Unknown Company' };
            }
          })
        );
        
        // Sort by newest first
        setApplications(appsWithJobs.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()));
      } catch (err: any) {
        setError(err.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center p-8 text-slate-500">Loading applications...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'reviewed':
        return <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200"><FileText className="w-3.5 h-3.5" /> Reviewed</span>;
      case 'accepted':
        return <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 mt-2">Track the status of jobs you've applied for.</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6">{error}</div>}

      {applications.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
            <Briefcase className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No applications yet</h3>
          <p className="mt-2 text-slate-500">You haven't applied to any jobs. Start exploring opportunities!</p>
          <Link to="/jobs" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm">
            Find Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    <Link to={`/jobs/${app.job_id}`}>{app.jobTitle}</Link>
                  </h3>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-slate-600 font-medium">{app.company}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </div>
                  {app.cover_letter && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <FileText className="h-4 w-4" />
                      Cover letter included
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 sm:mt-0 sm:shrink-0">
                <Link to={`/jobs/${app.job_id}`} className="inline-flex w-full justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-primary transition-colors">
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
