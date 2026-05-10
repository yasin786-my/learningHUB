/**
 * Navbar — top navigation bar with user info and logout
 */

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLogout, HiOutlineAcademicCap } from 'react-icons/hi';

const roleColors = {
  admin:   'text-purple-400',
  teacher: 'text-sapphire-400',
  student: 'text-emerald-400',
};

const roleBadgeBg = {
  admin:   'bg-purple-500/10 border-purple-500/20 text-purple-300',
  teacher: 'bg-sapphire-500/10 border-sapphire-500/20 text-sapphire-300',
  student: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center">
          <HiOutlineAcademicCap className="text-white text-lg" />
        </div>
        <h1 className="font-display font-bold text-xl hidden sm:block">
          Learning<span className="text-sapphire-400">HUB</span>
        </h1>
      </div>

      {/* Right side */}
      {user && (
        <div className="flex items-center gap-3 md:gap-4">
          {/* Role badge */}
          <span className={`text-xs px-3 py-1 rounded-full border font-medium capitalize ${roleBadgeBg[user.role]}`}>
            {user.role}
          </span>

          {/* Username */}
          <span className="text-sm text-dark-200 hidden md:inline">
            {user.fullName || user.username}
          </span>

          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-sapphire-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white`}>
            {(user.fullName || user.username || '?')[0].toUpperCase()}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-dark-300 hover:text-red-400"
            title="Logout"
          >
            <HiOutlineLogout className="text-lg" />
          </button>
        </div>
      )}
    </nav>
  );
}
