import { useEffect, useState } from 'react';
import { User, Save, Link as LinkIcon, Edit3 } from 'lucide-react';
import { getMyProfile, createProfile, updateProfile } from '../lib/api';
import type { UserResponse, ProfileResponse } from '../types/api';

export default function Profile({ user, token }: { user: UserResponse; token: string | null }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    bio: '',
    resume_url: '',
    skills: '',
  });

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile(token);
        setProfile(data);
        setFormData({
          bio: data.bio || '',
          resume_url: data.resume_url || '',
          skills: data.skills || '',
        });
      } catch (err: any) {
        if (err.message && err.message.includes('404')) {
          // No profile yet
        } else {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        bio: formData.bio.trim() || null,
        resume_url: formData.resume_url.trim() || null,
        skills: formData.skills.trim() || null,
      };

      if (profile) {
        const updated = await updateProfile(token, payload);
        setProfile(updated);
      } else {
        const created = await createProfile(token, payload);
        setProfile(created);
      }
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8 text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-indigo-500 h-32 relative"></div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-4xl font-bold text-primary shadow-sm bg-gradient-to-br from-white to-slate-100">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {profile && (
              <p className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Last updated {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-500">{user.email}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">{error}</div>}
            {success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm">{success}</div>}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Professional Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                placeholder="Tell employers about your background and what you're looking for..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-slate-400" />
                Skills (comma separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                placeholder="e.g. React, TypeScript, Node.js"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                Resume URL
              </label>
              <input
                type="url"
                name="resume_url"
                value={formData.resume_url}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                placeholder="https://link-to-your-resume.com"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover hover:-translate-y-0.5 focus:ring-2 focus:ring-primary/50 focus:outline-none shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
