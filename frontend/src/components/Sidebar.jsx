import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  Zap, 
  BarChart3, 
  ShieldCheck,
  Settings,
  HelpCircle
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: History, label: 'Transactions', path: '/transactions' },
    { icon: Zap, label: 'Simulator', path: '/simulator' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  return (
    <aside className="w-64 h-full border-r border-white/10 flex flex-col bg-background/50 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">FraudGuard</h1>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Enterprise</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 mt-auto">
        <div className="glass p-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all"></div>
          <p className="text-xs font-semibold mb-1 relative">System Status</p>
          <div className="flex items-center gap-2 relative">
            <span className="w-2 h-2 bg-safe rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-400">All models online</span>
          </div>
        </div>
        
        <div className="mt-4 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Help Center</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
