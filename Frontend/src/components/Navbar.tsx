import { Link, NavLink } from 'react-router-dom';
import type { UserResponse } from '../types/api';

type NavbarProps = {
  user: UserResponse | null;
  onLogout: () => void;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-2 py-1 text-base font-medium transition-colors ${
    isActive ? 'text-primary border-b-2 border-primary' : 'text-slate-600 hover:text-primary'
  }`;

export default function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-slate-900 tracking-tight">
            Remote<span className="text-primary">In</span>
          </Link>
          <nav className="hidden items-center gap-6 sm:flex mt-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/jobs" className={navLinkClass}>
              Find Jobs
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

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden text-sm text-slate-600 sm:block">
                Welcome, <span className="font-semibold text-slate-800">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded text-primary border border-primary px-4 py-2 font-semibold transition-colors hover:bg-primary-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 font-semibold text-primary transition-colors hover:text-primary-hover">
                Login
              </Link>
              <Link to="/register" className="rounded border border-primary bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-hover hover:border-primary-hover shadow-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
