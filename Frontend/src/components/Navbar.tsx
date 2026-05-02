import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogOut, FileText, Bookmark, User as UserIcon, ChevronDown } from 'lucide-react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
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
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  {user.role === 'jobseeker' && (
                    <>
                      <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <UserIcon className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link to="/applications" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <FileText className="h-4 w-4" />
                        My Applications
                      </Link>
                      <Link to="/saved-jobs" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors">
                        <Bookmark className="h-4 w-4" />
                        Saved Jobs
                      </Link>
                      <div className="my-1 border-b border-slate-100"></div>
                    </>
                  )}
                  
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 font-semibold text-slate-600 transition-colors hover:text-primary">
                Log in
              </Link>
              <Link to="/register" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow focus:ring-2 focus:ring-primary/50 focus:ring-offset-2">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
