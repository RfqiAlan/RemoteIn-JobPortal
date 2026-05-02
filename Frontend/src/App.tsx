import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { getMe } from './lib/api';
import type { UserResponse } from './types/api';
import EmployerDashboard from './pages/EmployerDashboard';
import ExternalJobs from './pages/ExternalJobs';
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import ExternalJobDetail from './pages/ExternalJobDetail';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyApplications from './pages/MyApplications';
import SavedJobs from './pages/SavedJobs';
import AdminDashboard from './pages/AdminDashboard';

const TOKEN_STORAGE_KEY = 'remotein_access_token';

type GuardProps = {
  user: UserResponse | null;
  children: ReactNode;
};

function RequireEmployer({ user, children }: GuardProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'employer') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RequireAdmin({ user, children }: GuardProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<UserResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setSessionLoading(false);
        return;
      }

      try {
        const profile = await getMe(token);
        setUser(profile);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setSessionLoading(false);
      }
    };

    void loadProfile();
  }, [token]);

  const handleLoggedIn = async (nextToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    try {
      const profile = await getMe(nextToken);
      setUser(profile);
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-24 sm:px-8">
          {sessionLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Memuat sesi...</div>
          ) : (
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:jobId" element={<JobDetail user={user} />} />
              <Route path="/remote-jobs" element={<ExternalJobs />} />
              <Route path="/remote-jobs/:jobId" element={<ExternalJobDetail />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLoggedIn={handleLoggedIn} />} />
              <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
              <Route
                path="/dashboard"
                element={
                  <RequireEmployer user={user}>
                    <EmployerDashboard user={user} token={token} />
                  </RequireEmployer>
                }
              />
              <Route path="/profile" element={user && user.role === 'jobseeker' ? <Profile user={user} token={token} /> : <Navigate to="/login" replace />} />
              <Route path="/applications" element={user && user.role === 'jobseeker' ? <MyApplications user={user} token={token} /> : <Navigate to="/login" replace />} />
              <Route path="/saved-jobs" element={user && user.role === 'jobseeker' ? <SavedJobs user={user} token={token} /> : <Navigate to="/login" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <RequireAdmin user={user}>
                    <AdminDashboard token={token} />
                  </RequireAdmin>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
