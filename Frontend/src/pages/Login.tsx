import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

type LoginProps = {
  onLoggedIn: (token: string) => Promise<void>;
};

type LoginLocationState = {
  message?: string;
} | null;

export default function Login({ onLoggedIn }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await login({ email, password });
      await onLoggedIn(token.access_token);
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login gagal. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-600">Gunakan endpoint <code>/auth/login</code> untuk mendapatkan JWT.</p>

      {locationState?.message && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{locationState.message}</div>}
      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Memproses...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
