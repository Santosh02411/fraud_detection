import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/api';
import { 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-6 glass-hover"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend > 0 ? 'text-safe' : 'text-fraud'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-slate-400 text-sm font-medium">{label}</p>
    <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
  </motion.div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handler = () => {
      fetchDashboardData();
    };
    window.addEventListener('transactionProcessed', handler);
    return () => window.removeEventListener('transactionProcessed', handler);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsService.getDashboard();
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  const summary = data?.summary || {};

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time fraud monitoring and risk analysis</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDashboardData} className="px-4 py-2 glass glass-hover text-sm font-semibold">Refresh Data</button>
          <button className="btn-primary">Generate Report</button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Transactions" 
          value={summary.total_transactions} 
          icon={Activity} 
          color="primary"
          trend={12}
        />
        <StatCard 
          label="Fraud Rate" 
          value={`${summary.fraud_rate.toFixed(2)}%`} 
          icon={ShieldAlert} 
          color="fraud"
          trend={-5}
        />
        <StatCard 
          label="Avg Risk Probability" 
          value={`${summary.avg_fraud_probability.toFixed(1)}%`} 
          icon={TrendingUp} 
          color="secondary"
        />
        <StatCard 
          label="Risk Score" 
          value={Math.round(summary.risk_score)} 
          icon={ShieldAlert} 
          color="accent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Transaction Volume & Fraud Trends</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 bg-primary rounded-full"></span> Total
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 bg-fraud rounded-full"></span> Fraud
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_trends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="fraud" stroke="#ef4444" fillOpacity={1} fill="url(#colorFraud)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass p-6 flex flex-col">
          <h3 className="font-bold mb-6">Recent Alerts</h3>
          <div className="space-y-4 flex-1">
            {data.recent_alerts.length > 0 ? data.recent_alerts.map((alert) => (
              <div key={alert.id} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  alert.alert_type === 'high_risk' ? 'bg-fraud/20 text-fraud' : 'bg-accent/20 text-accent'
                }`}>
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <CheckCircle2 className="w-12 h-12 text-safe/20" />
                <p className="text-sm">No active alerts found</p>
              </div>
            )}
          </div>
          <button className="w-full py-2 mt-4 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
