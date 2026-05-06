import React from 'react';
import { Bell, User, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav className="h-16 px-8 flex items-center justify-between border-b border-white/10 sticky top-0 bg-background/50 backdrop-blur-xl z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 glass-hover rounded-full relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background"></span>
        </button>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-slate-400">Security Analyst</p>
          </div>
          <button className="h-10 w-10 glass-hover rounded-xl flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-fraud transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
