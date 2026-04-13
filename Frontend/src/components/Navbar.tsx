import { Link, NavLink } from 'react-router-dom';
import type { UserResponse } from '../types/api';

type NavbarProps = {
  user: UserResponse | null;
  onLogout: () => void;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-bold text-slate-800">
            RemoteIn
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/jobs" className={navLinkClass}>
              Jobs
            </NavLink>
            <NavLink to="/remote-jobs" className={navLinkClass}>
              External Jobs
            </NavLink>
            {user?.role === 'employer' && (
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-sm text-slate-600 sm:block">
                Hi, <span className="font-semibold text-slate-800">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link to="/register" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
