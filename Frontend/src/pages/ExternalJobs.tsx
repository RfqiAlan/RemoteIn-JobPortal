import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, Search, RefreshCw, Filter, X, ChevronDown, Briefcase, MapPin, Tag } from 'lucide-react';
import { createExternalRefreshRequest, getExternalJobs, getExternalRefreshStatus } from '../lib/api';
import type { AggregatedJobList, ExternalJob, SyncStatusResponse, UserResponse } from '../types/api';

const SOURCE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  remotive:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  arbeitnow: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  jobicy:    { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
};

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

type ExternalJobsProps = { user: UserResponse | null };
const POLLING_INTERVAL_MS = 2000;
const SOURCES = ['remotive', 'arbeitnow', 'jobicy'];

// ── Kategori broad dengan keyword matcher ────────────────────────────────
type Category = { label: string; emoji: string; keywords: string[] };
const CATEGORIES: Category[] = [
  { label: 'Engineering',    emoji: '💻', keywords: ['engineer', 'developer', 'backend', 'frontend', 'fullstack', 'full-stack', 'software', 'programming', 'web', 'react', 'node', 'python', 'java', 'golang', 'ruby', 'php', 'typescript'] },
  { label: 'Mobile',         emoji: '📱', keywords: ['mobile', 'android', 'ios', 'flutter', 'react native', 'swift', 'kotlin'] },
  { label: 'Data & AI',      emoji: '📊', keywords: ['data', 'machine learning', 'ml', 'ai', 'artificial intelligence', 'analyst', 'analytics', 'scientist', 'bi', 'business intelligence', 'sql', 'tableau', 'etl', 'llm'] },
  { label: 'DevOps & Cloud', emoji: '☁️', keywords: ['devops', 'cloud', 'aws', 'gcp', 'azure', 'infrastructure', 'kubernetes', 'docker', 'sre', 'platform', 'ci/cd', 'terraform', 'linux', 'sysadmin'] },
  { label: 'Design',         emoji: '🎨', keywords: ['design', 'ui', 'ux', 'figma', 'product design', 'graphic', 'visual', 'creative', 'branding', 'illustrat'] },
  { label: 'Marketing',      emoji: '📣', keywords: ['marketing', 'seo', 'growth', 'social media', 'content', 'copywriter', 'digital marketing', 'performance', 'ads', 'pr ', 'brand'] },
  { label: 'Sales',          emoji: '🤝', keywords: ['sales', 'account executive', 'business development', 'account manager', 'revenue', 'crm', 'bdr', 'sdr'] },
  { label: 'Customer Support',emoji: '🎧', keywords: ['customer support', 'customer success', 'customer service', 'support engineer', 'helpdesk', 'technical support', 'cx '] },
  { label: 'Product',        emoji: '🗂️', keywords: ['product manager', 'product owner', 'pm ', 'scrum', 'agile', 'roadmap'] },
  { label: 'Finance',        emoji: '💼', keywords: ['finance', 'accounting', 'bookkeep', 'controller', 'cfo', 'payroll', 'tax', 'audit', 'financial'] },
  { label: 'Cybersecurity',  emoji: '🔒', keywords: ['security', 'cybersecurity', 'pentest', 'infosec', 'soc ', 'firewall', 'compliance', 'appsec'] },
  { label: 'Writing',        emoji: '✍️', keywords: ['writer', 'editor', 'content writer', 'technical writer', 'journalist', 'blogger', 'documentation'] },
];

function jobMatchesCategory(job: ExternalJob, cat: Category): boolean {
  const haystack = [
    job.title,
    job.company,
    ...job.tags,
  ].join(' ').toLowerCase();
  return cat.keywords.some(kw => haystack.includes(kw.toLowerCase()));
}

export default function ExternalJobs({ user }: ExternalJobsProps) {
  // ── Remote state ──────────────────────────────────────────────
  const [data, setData] = useState<AggregatedJobList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Refresh state ─────────────────────────────────────────────
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<SyncStatusResponse | null>(null);
  const [refreshRequestId, setRefreshRequestId] = useState<number | null>(null);

  // ── Filter state (client-side) ─────────────────────────────────
  const [keyword, setKeyword] = useState('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hasSalary, setHasSalary] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // ── Load all data once ────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getExternalJobs({ limit: 1000 });
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal mengambil external jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);

  // ── Derived: all unique tags from data ────────────────────────
  const allTags = useMemo(() => {
    if (!data) return [];
    const tagSet = new Set<string>();
    data.jobs.forEach(j => j.tags.forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [data]);

  // ── Client-side filtering & sorting ──────────────────────────
  const filteredJobs = useMemo((): ExternalJob[] => {
    if (!data) return [];
    let jobs = [...data.jobs];

    // keyword
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(kw) ||
        j.company.toLowerCase().includes(kw) ||
        j.location.toLowerCase().includes(kw) ||
        j.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    // source
    if (selectedSources.size > 0) {
      jobs = jobs.filter(j => selectedSources.has(j.source));
    }

    // tags
    if (selectedTags.size > 0) {
      jobs = jobs.filter(j => [...selectedTags].every(t => j.tags.includes(t)));
    }

    // category
    if (selectedCategory) {
      const cat = CATEGORIES.find(c => c.label === selectedCategory);
      if (cat) jobs = jobs.filter(j => jobMatchesCategory(j, cat));
    }

    // salary
    if (hasSalary) {
      jobs = jobs.filter(j => !!j.salary);
    }

    // sort
    if (sortBy === 'date') {
      jobs.sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da;
      });
    } else {
      jobs.sort((a, b) => a.title.localeCompare(b.title));
    }

    return jobs;
  }, [data, keyword, selectedSources, selectedTags, selectedCategory, hasSalary, sortBy]);

  // Count per category for badge
  const categoryCount = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(
      CATEGORIES.map(cat => [cat.label, data.jobs.filter(j => jobMatchesCategory(j, cat)).length])
    );
  }, [data]);

  const activeFilterCount =
    (selectedSources.size > 0 ? 1 : 0) +
    (selectedTags.size > 0 ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (hasSalary ? 1 : 0) +
    (keyword.trim() ? 1 : 0);

  const clearFilters = () => {
    setKeyword('');
    setSelectedSources(new Set());
    setSelectedTags(new Set());
    setSelectedCategory(null);
    setHasSalary(false);
    setSortBy('date');
  };

  const toggleSource = (src: string) => {
    setSelectedSources(prev => {
      const next = new Set(prev);
      next.has(src) ? next.delete(src) : next.add(src);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  // ── Refresh ───────────────────────────────────────────────────
  const handleRefreshRequest = async () => {
    setRefreshLoading(true);
    setError(null);
    try {
      const request = await createExternalRefreshRequest();
      setRefreshRequestId(request.request_id);
      setRefreshStatus({
        request_id: request.request_id,
        status: request.status,
        message: request.message,
        total_jobs_processed: 0,
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat request refresh.');
    } finally {
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    if (refreshRequestId === null) return;
    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const pollStatus = async () => {
      try {
        const statusResult = await getExternalRefreshStatus(refreshRequestId);
        if (isCancelled) return;
        setRefreshStatus(statusResult);
        if (statusResult.status === 'pending' || statusResult.status === 'running') {
          timeoutId = setTimeout(() => { void pollStatus(); }, POLLING_INTERVAL_MS);
          return;
        }
        if (statusResult.status === 'success') void loadJobs();
      } catch (statusError) {
        if (!isCancelled) setError(statusError instanceof Error ? statusError.message : 'Gagal memeriksa status refresh.');
      }
    };

    void pollStatus();
    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadJobs, refreshRequestId]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">External Remote Jobs</h1>
          <p className="mt-1 text-slate-500 text-sm">
            Data langsung dari Remotive, Arbeitnow &amp; Jobicy — difilter secara real-time di browser.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefreshRequest()}
          disabled={refreshLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
          {refreshLoading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {/* Refresh Status */}
      {refreshStatus && (
        <div className={`rounded-xl border p-3 text-sm flex items-center gap-3 ${
          refreshStatus.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
          refreshStatus.status === 'failed'  ? 'border-red-200 bg-red-50 text-red-800' :
          'border-indigo-200 bg-indigo-50 text-indigo-800'
        }`}>
          <RefreshCw className={`h-4 w-4 shrink-0 ${refreshStatus.status === 'running' || refreshStatus.status === 'pending' ? 'animate-spin' : ''}`} />
          <span>
            <strong className="capitalize">{refreshStatus.status}</strong>
            {refreshStatus.message ? ` — ${refreshStatus.message}` : ''}
            {refreshStatus.finished_at ? ` (${refreshStatus.total_jobs_processed} jobs)` : ''}
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Top bar: search + sort + toggle */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          {/* Search */}
          <label className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              type="text"
              placeholder="Cari judul, perusahaan, lokasi, atau tag…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </label>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'title')}
              className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
            >
              <option value="date">Terbaru</option>
              <option value="title">A–Z Judul</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Salary toggle */}
          <button
            type="button"
            onClick={() => setHasSalary(v => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              hasSalary
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            }`}
          >
            💰 Ada Salary
          </button>

          {/* Advanced filter toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || (selectedSources.size > 0 || selectedTags.size > 0)
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {(selectedSources.size + selectedTags.size) > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">
                {selectedSources.size + selectedTags.size}
              </span>
            )}
          </button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">

            {/* Category chips */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Tag className="h-3.5 w-3.5" /> Kategori Pekerjaan
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const active = selectedCategory === cat.label;
                  const count = (categoryCount as Record<string, number>)[cat.label] ?? 0;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setSelectedCategory(active ? null : cat.label)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                      {count > 0 && (
                        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source chips */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Briefcase className="h-3.5 w-3.5" /> Source
              </p>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map(src => {
                  const badge = SOURCE_BADGE[src] ?? { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
                  const active = selectedSources.has(src);
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => toggleSource(src)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all ${
                        active
                          ? `${badge.bg} ${badge.text} border-current`
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? badge.dot : 'bg-slate-300'}`} />
                      {src}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag chips */}
            {allTags.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Tag className="h-3.5 w-3.5" /> Kategori / Tag
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
                        selectedTags.has(tag)
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-12 rounded-full bg-slate-200" />
                  <div className="h-5 w-14 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              Menampilkan{' '}
              <span className="font-semibold text-slate-900">{filteredJobs.length}</span>
              {data && filteredJobs.length !== data.total && (
                <> dari <span className="font-semibold text-slate-900">{data.total}</span></>
              )}{' '}
              jobs
              {activeFilterCount > 0 && (
                <span className="ml-1 text-indigo-600">({activeFilterCount} filter aktif)</span>
              )}
            </p>

            {filteredJobs.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredJobs.map(job => {
                  const badge = SOURCE_BADGE[job.source] ?? { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };
                  return (
                    <article
                      key={job.id}
                      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                    >
                      {/* Source + Date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${badge.bg} ${badge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {job.source}
                        </span>
                        {formatDate(job.published_at) && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {formatDate(job.published_at)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                        {job.title}
                      </h2>

                      {/* Company + Location */}
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs text-slate-600 font-medium truncate">{job.company}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </p>
                      </div>

                      {/* Salary */}
                      {job.salary && (
                        <p className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 w-fit">
                          💰 {job.salary}
                        </p>
                      )}

                      {/* Tags */}
                      {job.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {job.tags.slice(0, 3).map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => { toggleTag(tag); setShowFilters(true); }}
                              className="rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 text-[11px] text-slate-500 transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                          {job.tags.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
                              +{job.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto pt-4 flex items-center gap-3 border-t border-slate-100">
                        <Link
                          to={`/remote-jobs/${job.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Detail →
                        </Link>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                          Apply <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-slate-400 text-sm">Tidak ada job yang cocok dengan filter.</p>
                <button onClick={clearFilters} className="mt-3 text-sm text-indigo-600 hover:underline">
                  Reset filter
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
