import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, PenTool, Code, Megaphone, Monitor, Building2, ArrowRight } from 'lucide-react';
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

const CATEGORIES = [
  { name: 'Design', icon: PenTool, count: 235 },
  { name: 'Sales', icon: Megaphone, count: 756 },
  { name: 'Marketing', icon: Megaphone, count: 140 },
  { name: 'Finance', icon: Briefcase, count: 325 },
  { name: 'Technology', icon: Monitor, count: 436 },
  { name: 'Engineering', icon: Code, count: 542 },
  { name: 'Business', icon: Building2, count: 211 },
  { name: 'Human Resource', icon: Briefcase, count: 346 },
];

export default function Home(_props: HomeProps) {
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
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="pt-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-[3.5rem] leading-[1.1] font-bold text-slate-900 mb-6 font-heading tracking-tight">
              Discover more than <br />
              <span className="text-primary">5000+ Jobs</span>
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-lg">
              Great platform for the job seeker that is passionate about startups. Find your dream job easier.
            </p>
            
            {/* Search Bar Container */}
            <div className="bg-white p-3 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 flex items-center gap-3 w-full border-b sm:border-b-0 sm:border-r border-slate-200 px-3 py-2">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Job title or keyword" 
                  className="w-full focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 w-full px-3 py-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Florence, Italy" 
                  className="w-full focus:outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                />
              </div>
              <button className="bg-primary hover:bg-primary-hover text-white font-medium px-8 py-3 rounded w-full sm:w-auto transition-colors">
                Search my job
              </button>
            </div>
            
            <p className="mt-4 text-sm text-slate-500">
              Popular: <span className="font-medium text-slate-700">UI Designer, UX Researcher, Android, Admin</span>
            </p>
          </div>
          <div className="hidden lg:block relative">
            {/* Hero Image / Illustration Placeholder */}
            <div className="bg-primary-50 rounded-full w-[450px] h-[450px] mx-auto overflow-hidden border-8 border-white shadow-xl relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-300">
                <Monitor className="w-32 h-32 mb-4 opacity-50" />
                <span className="font-bold text-xl opacity-75 text-primary-400">Illustration Area</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Banner */}
      <section className="py-10 border-y border-slate-100">
        <p className="text-slate-400 text-sm font-medium mb-6">Companies we helped grow</p>
        <div className="flex flex-wrap gap-8 justify-between opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="text-xl font-bold font-heading">Vodafone</div>
          <div className="text-xl font-bold font-heading">Intel</div>
          <div className="text-xl font-bold font-heading">Tesla</div>
          <div className="text-xl font-bold font-heading">AMD</div>
          <div className="text-xl font-bold font-heading">Talkit</div>
        </div>
      </section>

      {/* Explore By Category Section */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Explore by <span className="text-primary">category</span></h2>
          </div>
          <Link to="/jobs" className="text-primary font-medium flex items-center gap-2 hover:text-primary-hover group">
            Show all jobs 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat, i) => {
            const IconComponent = cat.icon;
            return (
              <Link key={i} to="/jobs" className="border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all group bg-white">
                <div className="bg-slate-50 w-14 h-14 rounded flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white text-primary transition-colors">
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-slate-500 mt-2 flex items-center gap-2">
                  <span>{cat.count} jobs available</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {/* Featured Jobs Section */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <h2 className="text-3xl font-bold text-slate-900 font-heading">Featured <span className="text-primary">jobs</span></h2>
          <Link to="/jobs" className="text-primary font-medium flex items-center gap-2 hover:text-primary-hover group">
            Show all jobs 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">Memuat jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-slate-500">Belum ada job aktif.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 6).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="border border-slate-200 bg-white rounded-xl p-6 transition-all hover:border-primary-200 hover:shadow-lg flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {job.company.substring(0, 1)}
                  </div>
                  <span className="border border-primary-200 text-primary bg-primary-50 px-3 py-1 rounded-full text-xs font-semibold">
                    Full-Time
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-2 flex items-center gap-1">
                  {job.company} <span className="w-1 h-1 rounded-full bg-slate-400 mx-1"></span> {job.location}
                </p>
                <p className="text-slate-900 font-medium text-sm mb-4">
                  {renderSalary(job)}
                </p>
                <p className="text-slate-600 text-sm line-clamp-2 flex-grow mb-6">{job.description}</p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">Design</span>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">Business</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Latest External Jobs Section */}
      <section className="bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 py-16 mt-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold text-slate-900 font-heading">Latest <span className="text-primary">jobs open</span></h2>
            <Link to="/remote-jobs" className="text-primary font-medium flex items-center gap-2 hover:text-primary-hover group">
              Show all jobs 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-500">Memuat jobs external...</p>
          ) : externalJobs.length === 0 ? (
            <p className="text-slate-500">Data external belum tersedia.</p>
          ) : (
            <div className="grid gap-4 bg-white/50 p-2 rounded-xl">
              {externalJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/remote-jobs/${job.id}`}
                  className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-primary-200 hover:shadow-md group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-slate-500 text-sm flex items-center gap-2">
                        <span>{job.company}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        <span>{job.location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase">{job.source}</span>
                    </div>
                    <span className="font-semibold text-slate-900 hidden sm:block">
                      {job.salary ?? 'Commensurate'}
                    </span>
                    <button className="bg-primary text-white px-6 py-2 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
