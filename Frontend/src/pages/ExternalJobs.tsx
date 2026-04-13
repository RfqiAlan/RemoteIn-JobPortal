import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Calendar, ExternalLink, Briefcase } from 'lucide-react';

export default function ExternalJobs() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/external/aggregate')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'remotive':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Remotive</span>;
      case 'arbeitnow':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-semibold">Arbeitnow</span>;
      case 'jobicy':
        return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">Jobicy</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">{source}</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-32 pb-12 px-8 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold text-slate-800 mb-6 font-['Clash_Display_Variable']">Discover External Remote Jobs</h1>
          <p className="text-slate-600 text-lg font-['Epilogue']">Aggregated securely from top-tier remote platforms globally.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex gap-4 text-sm font-medium text-slate-500 font-['Epilogue']">
               Total found: {data?.total || 0} jobs across {data?.sources?.length || 0} platforms
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.jobs?.map((job: any) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    {getSourceBadge(job.source)}
                    {job.published_at && (
                       <span className="text-slate-400 text-xs flex items-center gap-1 font-['Epilogue']">
                        <Calendar size={12} />
                        {new Date(job.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-2 line-clamp-2 md:h-14 font-['Epilogue']" title={job.title}>
                    {job.title}
                  </h3>
                  
                  <div className="text-slate-600 font-medium mb-4 flex flex-col gap-2 font-['Epilogue']">
                    <span className="flex items-center gap-2 text-sm"><Briefcase size={16} className="text-slate-400 flex-shrink-0" /> <span className="truncate">{job.company}</span></span>
                    <span className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-slate-400 flex-shrink-0" /> <span className="truncate">{job.location}</span></span>
                    {job.salary && (
                      <span className="flex items-center gap-2 text-sm text-yellow-600"><DollarSign size={16} className="flex-shrink-0" /> <span className="truncate">{job.salary}</span></span>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                     <div className="flex flex-wrap gap-2">
                       {job.tags?.slice(0, 2).map((tag: string, i: number) => (
                         <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-['Epilogue'] truncate max-w-[80px]">{tag}</span>
                       ))}
                     </div>
                     <a href={job.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-semibold transition-colors font-['Epilogue']">
                       Apply <ExternalLink size={14} />
                     </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
