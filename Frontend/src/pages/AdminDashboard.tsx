import { useState, useEffect } from 'react';
import { RefreshCcw, Activity, ShieldCheck, Clock } from 'lucide-react';
import { createExternalRefreshRequest, getExternalRefreshStatus } from '../lib/api';
import type { UserResponse, SyncStatusResponse } from '../types/api';

export default function AdminDashboard({ user, token }: { user: UserResponse; token: string | null }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentReqId, setCurrentReqId] = useState<number | null>(null);

  const handleSync = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await createExternalRefreshRequest(token);
      setCurrentReqId(res.request_id);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger sync');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentReqId || !token) return;

    const interval = setInterval(async () => {
      try {
        const status = await getExternalRefreshStatus(token, currentReqId);
        setSyncStatus(status);
        if (status.status === 'success' || status.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err: any) {
        clearInterval(interval);
        setError(err.message || 'Failed to get status');
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentReqId, token]);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-indigo-600" /> 
          Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Manage platform data and monitor external API syncs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">External API Sync</h2>
              <p className="text-sm text-slate-500 mt-1">Pull latest remote jobs from external sources (Remotive, Arbeitnow, Jobicy) to our database.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <RefreshCcw className="h-6 w-6" />
            </div>
          </div>

          {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{error}</div>}

          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sync in Progress...' : 'Trigger Full Sync Now'}
          </button>
        </div>

        {syncStatus && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-slate-400" />
              Latest Sync Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  syncStatus.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  syncStatus.status === 'failed' ? 'bg-red-100 text-red-700' :
                  syncStatus.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {syncStatus.status}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Jobs Processed</span>
                <span className="font-bold text-slate-900">{syncStatus.total_jobs_processed}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Message</span>
                <span className="text-slate-900 text-sm text-right max-w-[200px] truncate" title={syncStatus.message || ''}>
                  {syncStatus.message || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Started At</span>
                <span className="text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {syncStatus.started_at ? new Date(syncStatus.started_at).toLocaleString() : '-'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
